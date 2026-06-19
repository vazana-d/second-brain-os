/**
 * db.ts — SQLite singleton helper (BUILD_PLAN.md §3a)
 *
 * Opens the same database that Rust created via the tauri-plugin-sql migration.
 * All other modules call getDb() — connection is reused across the session.
 */
import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:second-brain.db");
  }
  return _db;
}
