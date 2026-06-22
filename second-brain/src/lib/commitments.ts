/**
 * commitments.ts — the Commitment Ledger's data layer (BUILD_PLAN Phase 5).
 *
 * Commitments are extracted in Phase 3; this module exposes their lifecycle
 * (open → fulfilled / dropped) and the joined data the Commitments view needs
 * (the person promised, and the original capture for follow-up context).
 * Auto-fulfillment lives in the processor — these are the manual overrides.
 */
import { getDb } from "./db";

export type CommitmentStatus = "open" | "fulfilled" | "dropped";

export interface Commitment {
  id: string;
  description: string;
  implied_deadline: string | null;
  status: CommitmentStatus;
  detected_phrase: string | null;
  fulfilled_at: string | null;
  created_at: string;
  person_name: string | null;
  raw_content: string | null;
}

/** All commitments with their person + originating capture, oldest first. */
export async function listCommitments(): Promise<Commitment[]> {
  const db = await getDb();
  return db.select<Commitment[]>(
    `SELECT c.id, c.description, c.implied_deadline, c.status, c.detected_phrase,
            c.fulfilled_at, c.created_at,
            p.name AS person_name, cap.raw_content
     FROM commitments c
     LEFT JOIN people   p   ON p.id   = c.person_id
     LEFT JOIN captures cap ON cap.id = c.capture_id
     ORDER BY c.created_at ASC`,
  );
}

/** Set (or clear, with null) the implied deadline on a commitment. */
export async function setCommitmentDeadline(
  id: string,
  deadline: string | null,
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE commitments SET implied_deadline = ? WHERE id = ?", [
    deadline && deadline.trim() ? deadline : null,
    id,
  ]);
}

/** Move a commitment through its lifecycle. fulfilled stamps fulfilled_at. */
export async function setCommitmentStatus(
  id: string,
  status: CommitmentStatus,
): Promise<void> {
  const db = await getDb();
  if (status === "fulfilled") {
    await db.execute(
      "UPDATE commitments SET status = 'fulfilled', fulfilled_at = datetime('now') WHERE id = ?",
      [id],
    );
  } else {
    // dropped or re-opened: clear the fulfillment timestamp.
    await db.execute(
      "UPDATE commitments SET status = ?, fulfilled_at = NULL WHERE id = ?",
      [status, id],
    );
  }
}
