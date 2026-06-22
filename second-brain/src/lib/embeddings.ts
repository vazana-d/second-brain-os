/**
 * embeddings.ts — local semantic memory (BUILD_PLAN Phase 4).
 *
 * Every capture is embedded with Gemini and the vector is stored in the
 * `vec_captures` table. Similarity search is brute-force cosine in TS rather
 * than the sqlite-vec (`vec0`) extension: tauri-plugin-sql runs on sqlx, which
 * has no hook for loading native SQLite extensions, and a personal DB is small
 * enough that scoring a few thousand 768-d vectors in JS is sub-millisecond.
 * This keeps Phase 4 fully local with zero native dependencies — same spirit as
 * the "group in JS" pattern the Inbox already uses.
 *
 * Embeddings are derived data: the raw capture stays canonical, and the vector
 * is regenerable at any time by re-embedding the text.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey, hasApiKey, withRateLimitRetry } from "./ai";
import { getDb } from "./db";

/**
 * Pinned embedding model — change in one place if Google deprecates it.
 * gemini-embedding-001 (3072 dimensions) is the model this API key actually
 * serves: both text-embedding-004 and the plan's embedding-001 return 404 for
 * embedContent on v1beta. Cosine similarity below is dimension-agnostic, so
 * swapping models only requires re-embedding (delete vec_captures rows).
 */
export const EMBED_MODEL = "gemini-embedding-001";

export interface ContextHit {
  capture_id: string;
  raw_content: string;
  created_at: string;
  /** Cosine similarity in [-1, 1]; ~1 means near-identical meaning. */
  score: number;
}

/** Embed a single string into a dense vector. Throws if the key is missing. */
export async function embedText(text: string): Promise<number[]> {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      "VITE_GEMINI_API_KEY not set — add it to second-brain/.env and restart the dev server.",
    );
  }
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: EMBED_MODEL });
  const res = await withRateLimitRetry(() => model.embedContent(text), "embedding");
  return res.embedding.values;
}

/** Persist a precomputed vector for a capture (upsert). Used to avoid embedding
 * the same text twice when the caller already has the vector in hand. */
export async function storeEmbedding(captureId: string, vector: number[]): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO vec_captures (capture_id, embedding) VALUES (?, ?) " +
      "ON CONFLICT(capture_id) DO UPDATE SET embedding = excluded.embedding",
    [captureId, JSON.stringify(vector)],
  );
}

/** Cosine similarity of two equal-length vectors; 0 if either is degenerate. */
function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Embed `text` and store the vector for `captureId`. No-op if a vector already
 * exists (captures are immutable, so the embedding never goes stale) unless
 * `force` is set. Silently does nothing without an API key.
 */
export async function ensureEmbedding(
  captureId: string,
  text: string,
  force = false,
): Promise<void> {
  if (!hasApiKey()) return;
  const db = await getDb();
  if (!force) {
    const existing = await db.select<{ c: number }[]>(
      "SELECT COUNT(*) AS c FROM vec_captures WHERE capture_id = ?",
      [captureId],
    );
    if ((existing[0]?.c ?? 0) > 0) return;
  }
  // Store as JSON text in the BLOB-affinity column — SQLite keeps it as text,
  // so it round-trips back to a string we can JSON.parse (a real BLOB would
  // come back as a byte array and corrupt the numbers).
  await storeEmbedding(captureId, await embedText(text));
}

/**
 * Return the captures most semantically similar to `query`, best first.
 * Used two ways: to ground the auto-processor (relevant past context) and to
 * power the Search view. Returns [] when there's no key or nothing embedded.
 */
export async function retrieveRelevantContext(
  query: string,
  k = 5,
  excludeId?: string,
): Promise<ContextHit[]> {
  if (!query.trim() || !hasApiKey()) return [];
  return retrieveByVector(await embedText(query), k, excludeId);
}

/**
 * Same as retrieveRelevantContext but for a vector you've already computed —
 * lets the auto-processor reuse the capture's own embedding for grounding
 * instead of paying for a second identical embed call.
 */
export async function retrieveByVector(
  q: number[],
  k = 5,
  excludeId?: string,
): Promise<ContextHit[]> {
  const db = await getDb();
  const rows = await db.select<
    { capture_id: string; embedding: string; raw_content: string; created_at: string }[]
  >(
    "SELECT v.capture_id, v.embedding, c.raw_content, c.created_at " +
      "FROM vec_captures v JOIN captures c ON c.id = v.capture_id",
  );
  if (!rows.length) return [];

  const scored: ContextHit[] = [];
  for (const r of rows) {
    if (r.capture_id === excludeId) continue;
    let emb: number[];
    try {
      emb = JSON.parse(r.embedding);
    } catch {
      continue; // skip a corrupt vector rather than fail the whole search
    }
    scored.push({
      capture_id: r.capture_id,
      raw_content: r.raw_content,
      created_at: r.created_at,
      score: cosine(q, emb),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Embed any captures that don't yet have a vector (oldest first). Covers
 * captures created before Phase 4 existed. Run once on startup; new captures
 * get embedded inline by the auto-processor.
 */
export async function backfillEmbeddings(): Promise<void> {
  if (!hasApiKey()) return;
  const db = await getDb();
  const rows = await db.select<{ id: string; raw_content: string }[]>(
    "SELECT id, raw_content FROM captures " +
      "WHERE id NOT IN (SELECT capture_id FROM vec_captures) ORDER BY created_at ASC",
  );
  for (const r of rows) {
    try {
      await ensureEmbedding(r.id, r.raw_content);
    } catch (err) {
      // One bad embed shouldn't stall the rest; it'll retry next launch.
      console.error("embed backfill failed for", r.id, err);
    }
  }
}
