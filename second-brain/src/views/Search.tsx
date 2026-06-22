// Search.tsx — first-class semantic search over captures (BUILD_PLAN Phase 4).
// Type a phrase, get the captures closest in *meaning* (cosine over Gemini
// embeddings), not keyword. Each query costs one embedding call, so search runs
// on submit rather than on every keystroke.
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { retrieveRelevantContext, type ContextHit } from "../lib/embeddings";
import { hasApiKey } from "../lib/ai";

// SQLite stores UTC without a zone marker; tell the Date parser it's UTC.
function timeAgo(ts: string): string {
  const d = new Date(ts.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContextHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    try {
      const hits = await retrieveRelevantContext(q, 20);
      setResults(hits);
      setLastQuery(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="search">
      <header className="search-header">
        <h1>Search</h1>
        <span className="search-sub">Find anything you've captured — by meaning, not keyword</span>
      </header>

      {!hasApiKey() && (
        <div className="inbox-banner">
          No Gemini key yet — search needs it to embed your query. Add{" "}
          <code>VITE_GEMINI_API_KEY</code> to <code>second-brain/.env</code> and restart the dev
          server.
        </div>
      )}

      <form className="search-bar" onSubmit={run}>
        <span className="search-bar-icon" aria-hidden="true">🔍</span>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          autoFocus
          disabled={!hasApiKey()}
        />
        <button className="search-btn" type="submit" disabled={busy || !hasApiKey()}>
          {busy ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      {results !== null && !busy && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="search-empty">
              Nothing found for "{lastQuery}". Capture some thoughts first, then search by meaning.
            </p>
          ) : (
            <>
              <p className="search-count">
                {results.length} {results.length === 1 ? "match" : "matches"} for "{lastQuery}"
              </p>
              <ul className="search-list">
                {results.map((r) => (
                  <li key={r.capture_id} className="search-card">
                    <div className="search-card-top">
                      <span className="search-score" title="semantic similarity">
                        {Math.round(r.score * 100)}%
                      </span>
                      <span className="capture-time">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="capture-raw">{r.raw_content}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
