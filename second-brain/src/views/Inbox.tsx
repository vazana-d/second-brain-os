// Inbox.tsx — read-only glance at captures + what was extracted (Phase 3).
// Deliberately NOT an edit/approve queue: extractions are disposable, and an
// audit surface would re-introduce the compulsive-correction trap (§11).
import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { formatDistanceToNow } from "date-fns";
import { getDb } from "../lib/db";
import { CAPTURES_CHANGED } from "../lib/processor";
import { hasApiKey } from "../lib/ai";

interface Capture {
  id: string;
  raw_content: string;
  source: string | null;
  processed: number;
  created_at: string;
}

interface Derived {
  tasks: string[];
  commitments: string[];
  ideas: string[];
  people: string[];
}

interface Row extends Capture {
  derived: Derived;
}

// SQLite stores UTC without a zone marker; tell the Date parser it's UTC.
function timeAgo(ts: string): string {
  const d = new Date(ts.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

export default function Inbox() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const db = await getDb();
    const captures = await db.select<Capture[]>(
      "SELECT id, raw_content, source, processed, created_at FROM captures ORDER BY created_at DESC LIMIT 200",
    );

    // Pull all derived rows once and group in JS (personal DB stays small).
    const [tasks, commitments, ideas] = await Promise.all([
      db.select<{ capture_id: string; title: string }[]>("SELECT capture_id, title FROM tasks"),
      db.select<{ capture_id: string; description: string }[]>(
        "SELECT capture_id, description FROM commitments",
      ),
      db.select<{ capture_id: string; content: string }[]>("SELECT capture_id, content FROM ideas"),
    ]);

    const group = (list: { capture_id: string }[], pick: (r: any) => string) => {
      const m = new Map<string, string[]>();
      for (const r of list) {
        const arr = m.get(r.capture_id) ?? [];
        arr.push(pick(r));
        m.set(r.capture_id, arr);
      }
      return m;
    };
    const tByCap = group(tasks, (r) => r.title);
    const cByCap = group(commitments, (r) => r.description);
    const iByCap = group(ideas, (r) => r.content);

    setRows(
      captures.map((c) => ({
        ...c,
        derived: {
          tasks: tByCap.get(c.id) ?? [],
          commitments: cByCap.get(c.id) ?? [],
          ideas: iByCap.get(c.id) ?? [],
          people: [],
        },
      })),
    );
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    // Refresh when a capture is saved (show it immediately) or processed.
    const unsubs = [
      listen("capture:saved", () => void load()),
      listen(CAPTURES_CHANGED, () => void load()),
    ];
    return () => {
      unsubs.forEach((u) => void u.then((f) => f()));
    };
  }, [load]);

  if (loaded && rows.length === 0) {
    return (
      <div className="view-placeholder">
        <span className="view-icon">📥</span>
        <h2>Inbox</h2>
        <p>Nothing captured yet. Hit Ctrl+Shift+Space and dump a thought.</p>
      </div>
    );
  }

  return (
    <div className="inbox">
      <header className="inbox-header">
        <h1>Inbox</h1>
        <span className="inbox-sub">{rows.length} captures · a glance, nothing to maintain</span>
      </header>

      {!hasApiKey() && (
        <div className="inbox-banner">
          No Gemini key yet — captures are saved but not processed. Add{" "}
          <code>VITE_GEMINI_API_KEY</code> to <code>second-brain/.env</code> and restart the dev
          server.
        </div>
      )}

      <ul className="capture-list">
        {rows.map((r) => {
          const total =
            r.derived.tasks.length + r.derived.commitments.length + r.derived.ideas.length;
          return (
            <li key={r.id} className="capture-card">
              <div className="capture-card-top">
                <span className="capture-time">{timeAgo(r.created_at)}</span>
                <span className="capture-source">{r.source ?? "unknown"}</span>
              </div>
              <p className="capture-raw">{r.raw_content}</p>

              {r.processed === 0 ? (
                <div className="capture-status">{hasApiKey() ? "processing…" : "awaiting key"}</div>
              ) : total === 0 ? (
                <div className="capture-status capture-status--muted">nothing to extract</div>
              ) : (
                <div className="extracted">
                  <Group label="tasks" items={r.derived.tasks} kind="task" />
                  <Group label="commitments" items={r.derived.commitments} kind="commitment" />
                  <Group label="ideas" items={r.derived.ideas} kind="idea" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Group({ label, items, kind }: { label: string; items: string[]; kind: string }) {
  if (items.length === 0) return null;
  return (
    <div className="extracted-group">
      <span className={`extracted-label extracted-label--${kind}`}>
        {items.length} {items.length === 1 ? label.replace(/s$/, "") : label}
      </span>
      <ul className="extracted-items">
        {items.map((t, i) => (
          <li key={i} className={`extracted-item extracted-item--${kind}`}>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
