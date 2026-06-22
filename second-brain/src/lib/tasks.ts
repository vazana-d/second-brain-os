/**
 * tasks.ts — data layer for the Schedule view (custom add-on to the plan).
 *
 * Tasks are extracted in Phase 3, often with no due date (or only an inferred
 * one). The Schedule view lets you assign real dates by hand and tick tasks
 * off. Setting a date by hand clears the `inferred_due` flag — it's now an
 * explicit, user-chosen date, not a guess.
 */
import { getDb } from "./db";

export interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  inferred_due: number;
  status: string;
  created_at: string;
  project_name: string | null;
}

/** All not-yet-done tasks, newest first; the view splits dated vs undated. */
export async function listOpenTasks(): Promise<TaskRow[]> {
  const db = await getDb();
  return db.select<TaskRow[]>(
    `SELECT t.id, t.title, t.due_date, t.inferred_due, t.status, t.created_at,
            p.name AS project_name
     FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.status = 'todo'
     ORDER BY t.created_at DESC`,
  );
}

/** Set (or clear, with null) a task's due date. A manual date is explicit. */
export async function setTaskDueDate(id: string, due: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE tasks SET due_date = ?, inferred_due = 0 WHERE id = ?", [
    due && due.trim() ? due : null,
    id,
  ]);
}

/** Tick a task off (or reopen it). */
export async function setTaskStatus(id: string, status: "todo" | "done"): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
}
