// Commitments.tsx — the Commitment Ledger / loop-closer (BUILD_PLAN Phase 5).
// Open promises surfaced oldest-first with gentle age/deadline tone, manual
// open→fulfilled/dropped actions, and a "Draft follow-up" button that uses the
// Tier-2 clipboard bridge (§9). Auto-fulfillment happens silently in the
// processor; this view is where you see and steer the loops.
import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { formatDistanceToNow } from "date-fns";
import { CAPTURES_CHANGED } from "../lib/processor";
import {
  listCommitments,
  setCommitmentStatus,
  type Commitment,
} from "../lib/commitments";
import {
  packageFollowUp,
  copyToClipboard,
  parseAppSyncFollowUp,
} from "../lib/clipboard";

// SQLite stores UTC without a zone marker; tell the Date parser it's UTC.
function asDate(ts: string): Date {
  return new Date(ts.replace(" ", "T") + "Z");
}
function timeAgo(ts: string): string {
  const d = asDate(ts);
  if (isNaN(d.getTime())) return ts;
  return formatDistanceToNow(d, { addSuffix: true });
}

type Tone = "clear" | "soon" | "overdue" | "none";

// Color tone for an open loop: by stated deadline if it parses, else by how
// long it's been open. Framed as information, not a red scoreboard (§11).
function openTone(c: Commitment): { tone: Tone; note: string } {
  if (c.implied_deadline) {
    const d = new Date(c.implied_deadline);
    if (!isNaN(d.getTime())) {
      const days = (d.getTime() - Date.now()) / 86_400_000;
      if (days < 0) return { tone: "overdue", note: `due ${timeAgo(c.implied_deadline)}` };
      if (days <= 2) return { tone: "soon", note: `due ${timeAgo(c.implied_deadline)}` };
      return { tone: "clear", note: `due ${timeAgo(c.implied_deadline)}` };
    }
  }
  const ageDays = (Date.now() - asDate(c.created_at).getTime()) / 86_400_000;
  if (ageDays >= 8) return { tone: "overdue", note: `open ${timeAgo(c.created_at)}` };
  if (ageDays >= 4) return { tone: "soon", note: `open ${timeAgo(c.created_at)}` };
  return { tone: "clear", note: `open ${timeAgo(c.created_at)}` };
}

export default function Commitments() {
  const [rows, setRows] = useState<Commitment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drafting, setDrafting] = useState<Commitment | null>(null);

  const load = useCallback(async () => {
    setRows(await listCommitments());
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    // Auto-fulfillment (and new extractions) emit CAPTURES_CHANGED.
    const unlisten = listen(CAPTURES_CHANGED, () => void load());
    return () => void unlisten.then((f) => f());
  }, [load]);

  async function act(id: string, status: Commitment["status"]) {
    await setCommitmentStatus(id, status);
    await load();
  }

  const open = rows.filter((c) => c.status === "open"); // already oldest-first
  const closed = rows
    .filter((c) => c.status !== "open")
    .sort((a, b) => (b.fulfilled_at ?? b.created_at).localeCompare(a.fulfilled_at ?? a.created_at));

  if (loaded && rows.length === 0) {
    return (
      <div className="view-placeholder">
        <span className="view-icon">✓</span>
        <h2>Commitments</h2>
        <p>No tracked promises yet. When you capture something like "I'll send Dana the deck", it shows up here as an open loop.</p>
      </div>
    );
  }

  return (
    <div className="ledger">
      <header className="ledger-header">
        <h1>Commitments</h1>
        <span className="ledger-sub">
          {open.length} open {open.length === 1 ? "loop" : "loops"} · sorted by age
        </span>
      </header>

      {open.length === 0 ? (
        <p className="ledger-allclear">No open loops right now. ✨</p>
      ) : (
        <ul className="ledger-list">
          {open.map((c) => {
            const { tone, note } = openTone(c);
            return (
              <li key={c.id} className="loop-card">
                <div className="loop-top">
                  <span className={`loop-dot loop-dot--${tone}`} aria-hidden="true" />
                  <span className="loop-person">{c.person_name ?? "—"}</span>
                  <span className={`loop-note loop-note--${tone}`}>{note}</span>
                </div>
                <p className="loop-desc">{c.description}</p>
                {c.detected_phrase && (
                  <p className="loop-phrase">“{c.detected_phrase}”</p>
                )}
                <div className="loop-actions">
                  <button className="btn btn--primary" onClick={() => setDrafting(c)}>
                    Draft follow-up
                  </button>
                  <button className="btn" onClick={() => void act(c.id, "fulfilled")}>
                    Mark fulfilled
                  </button>
                  <button className="btn btn--ghost" onClick={() => void act(c.id, "dropped")}>
                    Drop
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 && (
        <section className="ledger-closed">
          <h2 className="ledger-closed-title">Closed ({closed.length})</h2>
          <ul className="ledger-list">
            {closed.map((c) => (
              <li key={c.id} className="loop-card loop-card--closed">
                <div className="loop-top">
                  <span className={`loop-badge loop-badge--${c.status}`}>{c.status}</span>
                  <span className="loop-person">{c.person_name ?? "—"}</span>
                  <span className="loop-note">
                    {c.status === "fulfilled" && c.fulfilled_at
                      ? `closed ${timeAgo(c.fulfilled_at)}`
                      : `opened ${timeAgo(c.created_at)}`}
                  </span>
                </div>
                <p className="loop-desc">{c.description}</p>
                <div className="loop-actions">
                  <button className="btn btn--ghost" onClick={() => void act(c.id, "open")}>
                    Reopen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {drafting && (
        <FollowUpModal
          commitment={drafting}
          onClose={() => setDrafting(null)}
          onFulfilled={async () => {
            await act(drafting.id, "fulfilled");
            setDrafting(null);
          }}
        />
      )}
    </div>
  );
}

// ── Draft-follow-up modal: the §9 Tier-2 bridge, manual paste-back ──────────
function FollowUpModal({
  commitment,
  onClose,
  onFulfilled,
}: {
  commitment: Commitment;
  onClose: () => void;
  onFulfilled: () => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = packageFollowUp({
    person: commitment.person_name,
    description: commitment.description,
    detectedPhrase: commitment.detected_phrase,
    impliedDeadline: commitment.implied_deadline,
    ageLabel: timeAgo(commitment.created_at),
    rawContext: commitment.raw_content ?? commitment.description,
  });

  // Copy the prompt to the clipboard as soon as the modal opens.
  useEffect(() => {
    copyToClipboard(payload)
      .then(() => setCopied(true))
      .catch(() => setError("Couldn't write to the clipboard."));
    // payload is derived from the (stable) commitment; copy once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ingest() {
    setError(null);
    try {
      setDraft(parseAppSyncFollowUp(reply).draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Draft a follow-up</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <ol className="bridge-steps">
          <li>
            <span className={"bridge-badge" + (copied ? " bridge-badge--done" : "")}>1</span>
            <div>
              {copied ? "Prompt copied to your clipboard." : "Copying prompt…"}{" "}
              <button
                className="btn btn--tiny"
                onClick={() => void copyToClipboard(payload).then(() => setCopied(true))}
              >
                Copy again
              </button>
            </div>
          </li>
          <li>
            <span className="bridge-badge">2</span>
            <div>Paste it into Claude, then copy Claude's reply.</div>
          </li>
          <li>
            <span className="bridge-badge">3</span>
            <div>Paste the reply below and ingest it.</div>
          </li>
        </ol>

        <textarea
          className="bridge-textarea"
          placeholder="Paste Claude's reply here (it should contain an <AppSync> block)…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
        />
        {error && <div className="bridge-error">{error}</div>}

        {draft ? (
          <div className="bridge-result">
            <span className="bridge-result-label">Your follow-up draft</span>
            <p className="bridge-draft">{draft}</p>
            <div className="loop-actions">
              <button
                className="btn btn--primary"
                onClick={() => void copyToClipboard(draft)}
              >
                Copy draft
              </button>
              <button className="btn" onClick={() => void onFulfilled()}>
                Sent it — mark fulfilled
              </button>
            </div>
          </div>
        ) : (
          <div className="loop-actions">
            <button className="btn btn--primary" onClick={ingest} disabled={!reply.trim()}>
              Ingest reply
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
