/**
 * processor.ts — the Auto-Processor (Tier-1, BUILD_PLAN Phase 3).
 *
 * Turns a raw capture into tasks/commitments/ideas/people in the background.
 * Two hard rules from the plan:
 *   1. Never block capture — this only ever runs *after* the row is saved.
 *   2. Trust-preserving — the raw capture is canonical; the derived rows are
 *      disposable. Reprocessing a capture wipes and regenerates its derived
 *      rows, so nothing requires the user's approval and retries are safe.
 */
import { emit } from "@tauri-apps/api/event";
import { getDb } from "./db";
import { extractEntities, hasApiKey } from "./ai";
import { embedText, retrieveByVector, storeEmbedding } from "./embeddings";

/** Broadcast so any open view (e.g. Inbox) refreshes after the DB changes. */
export const CAPTURES_CHANGED = "captures:changed";

interface CaptureRow {
  id: string;
  raw_content: string;
}

// De-dupe concurrent work on the same capture (startup backlog + live event).
const inFlight = new Set<string>();

const uuid = () => crypto.randomUUID();

/** Insert the person if new, else refresh last_mentioned; returns the id. */
async function upsertPerson(
  db: Awaited<ReturnType<typeof getDb>>,
  name: string,
  context?: string | null,
): Promise<string> {
  const found = await db.select<{ id: string }[]>(
    "SELECT id FROM people WHERE lower(name) = lower(?) LIMIT 1",
    [name],
  );
  if (found.length) {
    await db.execute(
      "UPDATE people SET last_mentioned = datetime('now'), context = COALESCE(?, context) WHERE id = ?",
      [context ?? null, found[0].id],
    );
    return found[0].id;
  }
  const id = uuid();
  await db.execute(
    "INSERT INTO people (id, name, context, last_mentioned) VALUES (?, ?, ?, datetime('now'))",
    [id, name, context ?? null],
  );
  return id;
}

/** Find an active project by (case-insensitive) name; null if no match. */
async function resolveProjectId(
  projects: { id: string; name: string }[],
  hint?: string | null,
): Promise<string | null> {
  if (!hint) return null;
  const h = hint.trim().toLowerCase();
  return projects.find((p) => p.name.trim().toLowerCase() === h)?.id ?? null;
}

/** Create an auto-project by name if one doesn't already exist. */
async function ensureProject(
  db: Awaited<ReturnType<typeof getDb>>,
  name: string,
): Promise<void> {
  const found = await db.select<{ id: string }[]>(
    "SELECT id FROM projects WHERE lower(name) = lower(?) LIMIT 1",
    [name],
  );
  if (found.length) return;
  await db.execute(
    "INSERT INTO projects (id, name, auto_created) VALUES (?, ?, 1)",
    [uuid(), name],
  );
}

/** Process one capture by id. Safe to call repeatedly (regenerates derived rows). */
export async function processCapture(id: string): Promise<void> {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  try {
    const db = await getDb();
    const rows = await db.select<CaptureRow[]>(
      "SELECT id, raw_content FROM captures WHERE id = ?",
      [id],
    );
    const cap = rows[0];
    if (!cap) return;
    // No key yet → leave it unprocessed so it runs once the key is added.
    if (!hasApiKey()) return;

    const projects = await db.select<{ id: string; name: string }[]>(
      "SELECT id, name FROM projects WHERE status = 'active'",
    );

    // Pre-existing open commitments (not this capture's own) — the model checks
    // whether this capture closes any of them (Phase 5 auto-fulfillment).
    const openCommitments = await db.select<{ id: string; description: string }[]>(
      "SELECT id, description FROM commitments WHERE status = 'open' AND capture_id != ?",
      [id],
    );
    const openCommitmentIds = new Set(openCommitments.map((c) => c.id));

    // Embed the capture once, up front: the same vector both grounds extraction
    // (Phase 4) and gets stored for future search — no second identical embed.
    // Best effort: if embedding fails, extract without context rather than block.
    let selfVec: number[] | null = null;
    let context: string[] = [];
    try {
      selfVec = await embedText(cap.raw_content);
      const hits = await retrieveByVector(selfVec, 5, id);
      context = hits.filter((h) => h.score > 0.5).map((h) => `- ${h.raw_content}`);
    } catch (err) {
      console.error("embedding/retrieval failed for", id, err);
    }

    const ex = await extractEntities(cap.raw_content, projects, context, openCommitments);

    // Disposable derived rows: clear this capture's, then regenerate.
    await db.execute("DELETE FROM tasks WHERE capture_id = ?", [id]);
    await db.execute("DELETE FROM commitments WHERE capture_id = ?", [id]);
    await db.execute("DELETE FROM ideas WHERE capture_id = ?", [id]);

    // A suggested project must exist before we try to link tasks to it.
    if (ex.suggested_new_project) await ensureProject(db, ex.suggested_new_project.name);
    const activeProjects = await db.select<{ id: string; name: string }[]>(
      "SELECT id, name FROM projects WHERE status = 'active'",
    );

    for (const t of ex.tasks) {
      if (!t.title?.trim()) continue;
      const projectId =
        (await resolveProjectId(activeProjects, t.project_hint)) ??
        (ex.suggested_new_project
          ? await resolveProjectId(activeProjects, ex.suggested_new_project.name)
          : null);
      await db.execute(
        "INSERT INTO tasks (id, capture_id, project_id, title, due_date, inferred_due, status) VALUES (?, ?, ?, ?, ?, ?, 'todo')",
        [uuid(), id, projectId, t.title.trim(), t.due_date ?? null, t.inferred_due ? 1 : 0],
      );
    }

    for (const c of ex.commitments) {
      if (!c.description?.trim()) continue;
      const personId = c.person?.trim() ? await upsertPerson(db, c.person.trim()) : null;
      await db.execute(
        "INSERT INTO commitments (id, capture_id, person_id, description, implied_deadline, status, detected_phrase) VALUES (?, ?, ?, ?, ?, 'open', ?)",
        [uuid(), id, personId, c.description.trim(), c.implied_deadline ?? null, c.detected_phrase ?? null],
      );
    }

    for (const i of ex.ideas) {
      if (!i.content?.trim()) continue;
      await db.execute(
        "INSERT INTO ideas (id, capture_id, content, topic) VALUES (?, ?, ?, ?)",
        [uuid(), id, i.content.trim(), i.topic ?? null],
      );
    }

    for (const p of ex.people) {
      if (p.name?.trim()) await upsertPerson(db, p.name.trim(), p.context ?? null);
    }

    // Auto-fulfillment: close any pre-existing open commitment this capture
    // satisfied. Validate ids against the set we actually sent so a hallucinated
    // id can't touch the wrong row; the status guard keeps it idempotent.
    for (const cid of ex.fulfilled_commitment_ids) {
      if (!openCommitmentIds.has(cid)) continue;
      await db.execute(
        "UPDATE commitments SET status = 'fulfilled', fulfilled_at = datetime('now') WHERE id = ? AND status = 'open'",
        [cid],
      );
    }

    // Persist the vector computed above so future captures (and Search) can
    // find this one by meaning. A failure here is logged, not fatal.
    if (selfVec) {
      try {
        await storeEmbedding(id, selfVec);
      } catch (err) {
        console.error("storing embedding failed for", id, err);
      }
    }

    await db.execute("UPDATE captures SET processed = 1 WHERE id = ?", [id]);
  } catch (err) {
    // Leave processed = 0 so it retries on next launch. The raw capture is
    // untouched and canonical — nothing is lost.
    console.error("processCapture failed for", id, err);
  } finally {
    inFlight.delete(id);
    await emit(CAPTURES_CHANGED);
  }
}

/** Process every still-unprocessed capture (oldest first). Run on startup. */
export async function processBacklog(): Promise<void> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(
    "SELECT id FROM captures WHERE processed = 0 ORDER BY created_at ASC",
  );
  for (const r of rows) await processCapture(r.id);
}
