// Today.tsx — the Daily Surface, default landing view (BUILD_PLAN Phase 6).
// One screen each morning: the single "one thing" + the open loops, generated
// by the overnight job (or "Run now"). Diagnostic and gentle, never a guilt
// list (§11). Auto-generates once a day if the scheduled run hasn't already.
import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { formatDistanceToNow } from "date-fns";
import {
  generateBrief,
  getLatestBrief,
  hasBriefToday,
  BRIEF_CHANGED,
  type DailyBrief,
} from "../lib/brief";
import { hasApiKey } from "../lib/ai";

function timeAgo(ts: string): string {
  const d = new Date(ts.includes("T") ? ts : ts.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

export default function Today() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBrief(await getLatestBrief());
    setLoaded(true);
  }, []);

  const run = useCallback(async () => {
    if (!hasApiKey()) return;
    setBusy(true);
    setError(null);
    try {
      await generateBrief();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [load]);

  useEffect(() => {
    void (async () => {
      await load();
      // If nothing was generated today (e.g. the scheduled run didn't fire
      // because the laptop was off), make one now — once.
      if (hasApiKey() && !(await hasBriefToday())) {
        void run();
      }
    })();
    const unlisten = listen(BRIEF_CHANGED, () => void load());
    return () => void unlisten.then((f) => f());
    // run/load are stable; intentionally run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loaded && !brief && !busy) {
    return (
      <div className="view-placeholder">
        <span className="view-icon">☀️</span>
        <h2>Today</h2>
        {hasApiKey() ? (
          <>
            <p>No brief yet. Generate your first one whenever you're ready.</p>
            <button className="btn btn--primary" onClick={() => void run()}>
              Run now
            </button>
          </>
        ) : (
          <p>
            Add <code>VITE_GEMINI_API_KEY</code> to <code>second-brain/.env</code> and restart to
            generate a morning brief.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="today">
      <header className="today-header">
        <div>
          <h1>Today</h1>
          {brief && <span className="today-sub">brief generated {timeAgo(brief.generated_at)}</span>}
        </div>
        <button className="btn" onClick={() => void run()} disabled={busy || !hasApiKey()}>
          {busy ? "Generating…" : "Run now"}
        </button>
      </header>

      {error && <div className="search-error">{error}</div>}

      {busy && !brief && <p className="today-generating">Reading your loops and captures…</p>}

      {brief && (
        <>
          <section className="onething">
            <span className="onething-label">The one thing</span>
            <p className="onething-text">{brief.one_thing || "—"}</p>
            {brief.reasoning && <p className="onething-why">{brief.reasoning}</p>}
          </section>

          {brief.open_loops.length > 0 && (
            <section className="today-loops">
              <h2 className="today-section-title">Open loops</h2>
              <ul className="today-loop-list">
                {brief.open_loops.map((l, i) => (
                  <li key={i} className="today-loop">{l}</li>
                ))}
              </ul>
            </section>
          )}

          {brief.note && <p className="today-note">{brief.note}</p>}

          <p className="today-schedule">Runs automatically each morning at 5:00 AM.</p>
        </>
      )}
    </div>
  );
}
