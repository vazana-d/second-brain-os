# Second Brain OS — The Build Plan (Lean, Audience of One)
### Claude Code–ready. Read together with COMPLETE_IDEA.md. Last updated June 18, 2026.

This is the **execution plan**. The vision lives in `COMPLETE_IDEA.md` (now annotated with the council verdict). This file tells you *what to build, in what order, with which tools, and exactly what to paste into the AI.* It is the lean, build-for-myself version — every decision the council made is already baked in.

Guiding rule for the whole build: **the only thing that matters in v1 is the capture → process → daily-surface loop.** Everything else is deferred until you've lived on that loop.

---

## 0. DECISION — you're building it

You've chosen to build, skipping the optional capture pilot. This section is just a one-line reminder of the assumption you're now taking on faith: *that you'll actually capture daily and can let imperfect extraction slide.* You don't gate on it — you protect against it, which is exactly what the trust-preserving design (Section 11) does. Cheapest in-build check: build Phases 1–2 first and use the capture bar for real for a few days before building the rest.

Start at Section 1.

---

## 1. TOOLING & ROLES — who does what

| Tool | Role | Use it for |
|------|------|-----------|
| **Claude Code** | The builder | Scaffolding, writing Rust/React, running `cargo`/`npm`/`tauri`, fixing compile errors, iterating phase by phase. This is where the app gets made. |
| **Cowork** (here) | The planner | This plan, the pilot, research, refining prompts, reviewing decisions, your thinking partner between build sessions. |
| **Clipboard bridge → Claude** | The app's premium brain | The *heavy, occasional* reasoning the app offloads (Section 9). Not part of the build tooling — it's a runtime feature. |

**How to drive Claude Code (the working agreement):**
- One phase at a time. Finish, run it, test it, **commit to git** — then move on.
- Always leave the app in a runnable state. No half-built phases.
- Make it explain each architecture choice in one plain sentence (you're not an expert — that's fine).
- When something breaks, paste the **real error**. Fix one thing, re-test. Don't stack five changes.
- Point it at `COMPLETE_IDEA.md` + this file as the source of truth at the start of every session.

> **Git from the start.** `git init` in Phase 1, commit after every working phase. That's your undo button — and your portfolio history. Publish to GitHub right after Phase 1 (see Phase 1.5).

---

## 2. THE LEAN STACK — decisions locked

| Layer | Choice | What was cut, and why |
|-------|--------|----------------------|
| Shell | Tauri v2 (Rust) + React + TS + Vite | — |
| Storage | Local **SQLite** (`tauri-plugin-sql`) | — |
| Vector memory | **`sqlite-vec`** (local, offline) | ❌ Pinecone — cloud dependency + free-tier limits, breaks "local" |
| Tier-1 AI (silent) | **Gemini Flash** (one model, hardcoded) | ❌ model router — premature; add when you hit a rate limit |
| Tier-2 AI (heavy) | **Claude via clipboard bridge** | the quality jump matters only for the few hard jobs |
| Overnight job | **Windows Task Scheduler** | ❌ in-app `tokio` 5am loop — silently fails when the laptop sleeps |
| Auth | **None** | ❌ bcrypt PIN — it's your machine, your threat model is nil |
| Distribution | **Run it locally** (`tauri dev`, or a local build) | ❌ signed installer, auto-update, GitHub release pipeline — that's for shipping to strangers |
| Voice | **Text only in v1** | ❌ Whisper/`cpal` — the #1 place the project dies; add later |

The throughline: nothing in v1 exists to serve other people. Hardcode everything to your own habits.

---

## 3. PREREQUISITES — install & verify (Windows)

```powershell
winget install OpenJS.NodeJS         # Node v20+
winget install Rustlang.Rustup       # Rust + cargo
winget install Microsoft.VisualStudioCode   # friendlier than bare terminal
winget install Git.Git
```
Also install **Visual Studio C++ Build Tools** → "Desktop development with C++" workload (Tauri needs it on Windows). WebView2 is already on Win10/11.

**Verify before Phase 1:**
```powershell
node --version    # v20+
cargo --version   # any recent
git --version
```

**API keys you need for v1:** just **one** — Google AI Studio (Gemini), grabbed at Phase 3. That's it. (Groq optional, much later, only if Gemini rate-limits bite.)

---

## 3a. LEAN DEPENDENCIES & PROJECT LAYOUT

Only what v1 needs — far less than the full spec in COMPLETE_IDEA.md (no Pinecone, no googleapis, no OCR, no Whisper).

**Frontend (npm):**
```powershell
npm install react-router-dom date-fns lucide-react clsx
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @dnd-kit/core @dnd-kit/sortable        # only if you want drag-reorder later
npm install @google/generative-ai                  # Gemini (Tier-1)
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

**Rust (`src-tauri/Cargo.toml`):**
```toml
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-clipboard-manager = "2"   # Tier-2 clipboard bridge
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

**sqlite-vec:** load the `vec0` extension into the SQLite connection on startup (bundle the extension binary, or use the `sqlite-vec` crate). Have Claude Code wire this in Phase 4.

**Deliberately NOT in v1 (add later):** `tauri-plugin-autostart`, `tauri-plugin-updater`, `tauri-plugin-process`, `whisper-rs`, `cpal`, `googleapis`, Pinecone, Groq, bcrypt.

**Project layout:**
```
second-brain/
├── src/                  # React frontend — views: Today, Inbox, Commitments, Search
│   ├── lib/db.ts         # SQLite helpers
│   ├── lib/ai.ts         # Gemini calls + extraction prompt
│   └── lib/clipboard.ts  # Tier-2 AppSync packager + parser
├── src-tauri/
│   ├── src/              # Rust commands: capture window, shortcut, scheduler, clipboard listener
│   ├── migrations/       # the Section 4 schema
│   └── Cargo.toml
├── .env                  # GEMINI_API_KEY  (gitignored)
└── BUILD_PLAN.md  COMPLETE_IDEA.md

---

## 4. THE MINIMAL DATA MODEL (v1)

Lean schema. `captures` is canonical and permanent; everything derived is **disposable and regenerable** (this is what defuses the compulsive-correction trap — see Section 11).

```sql
-- RAW INPUT — canonical, permanent
captures(id, raw_content, source, processed, created_at)

-- DERIVED — disposable, never require user approval
tasks(id, capture_id, project_id, title, due_date, inferred_due, status, created_at)
commitments(id, capture_id, person_id, description, implied_deadline,
            status, detected_phrase, fulfilled_at, created_at)
ideas(id, capture_id, project_id, content, topic, created_at)
people(id, name, context, last_mentioned, created_at)
projects(id, name, color, status, auto_created, created_at)

-- INTELLIGENCE output (daily brief, etc.)
insights(id, type, content, related_ids, created_at)

-- LOCAL VECTOR MEMORY (sqlite-vec virtual table)
vec_captures(capture_id, embedding)

-- OPTIONAL graph-lite (only if you ever want traversal)
edges(source_id, target_id, type)

-- config
settings(key, value)
```

Deferred to later: `behavior_events` (log quietly if you want, but no dashboard), `calendar_events` (Google Calendar is a "later" feature).

Memory model, settled: **foreign keys = explicit links, vector similarity = semantic links.** No knowledge-graph database. The optional `edges` table is your escape hatch if you ever crave multi-hop traversal — you probably won't.

---

## 5. THE BUILD PHASES

Each phase: **Goal → Build → Done looks like → paste-ready Claude Code prompt → Test → Commit.** Don't advance until "Done" is true.

### Phase 1 — Scaffold + SQLite (no auth)
- **Goal:** the app opens; the DB exists with all tables.
- **Done:** empty window launches via `npm run tauri dev`; the SQLite file is created with the Section-4 schema.

> **Paste into Claude Code:**
> "Read COMPLETE_IDEA.md and BUILD_PLAN.md. Build **Phase 1 only**: scaffold a Tauri v2 app (React + TypeScript + Vite) on Windows. Initialize a git repo. Install the lean dependencies and use the project layout in BUILD_PLAN.md Section 3a. Set up local SQLite via `tauri-plugin-sql` with the exact lean schema in BUILD_PLAN.md Section 4 — **no PIN, no auth**. Get the app to open to an empty window and confirm the DB file is created with all tables. Explain each choice in one plain sentence, tell me how to run it and what I should see, then stop. Do not start Phase 2."

- **Test:** app opens; confirm the `.db` file exists and has the tables.
- **Commit:** `git commit -m "Phase 1: scaffold + sqlite"`

### Phase 1.5 — Publish to GitHub (one-time, portfolio)
- **Goal:** the project lives on GitHub as a public portfolio repo — with your API key and personal data safely excluded.
- **Done:** the repo is on github.com; `.env` and `*.db` are NOT in it.

**You do:**
1. Create a GitHub account (github.com) if you don't have one; confirm `git --version` works.
2. Confirm `.gitignore` lists `.env` and `*.db` (it already does — it ships with this project, alongside `README.md` and `LICENSE`).
3. Easiest: open the IDE's **Source Control** panel → write a commit message → **Publish to GitHub** → choose **Public**. It signs you in via the browser and pushes everything except gitignored files.
   - CLI fallback: `winget install GitHub.cli` → `gh auth login` → `gh repo create second-brain-os --public --source=. --push`.
4. On github.com, confirm there is **no `.env` and no `.db`** in the repo.

**Then:** keep committing after every phase. Clean, per-phase commit messages are what make the history look professional to anyone browsing your portfolio.

> Note: a plain `git push` with a GitHub password won't work (password auth was removed) — use the IDE's **Publish** button or `gh auth login`, which handle sign-in for you. And never commit `.env`.

### Phase 2 — The Quick Capture Bar (THE SACRED CORE)
- **Goal:** one keystroke from anywhere → type → saved instantly → window vanishes in under a second.
- **Done:** `Ctrl+Shift+Space` opens a small frameless always-on-top window; Enter writes raw text to `captures` and hides; it *feels* instant.

> **Paste into Claude Code:**
> "Build **Phase 2 only**: the Quick Capture Bar. Register a global shortcut `Ctrl+Shift+Space` that opens a small frameless, transparent, always-on-top capture window. Typing and hitting Enter saves the raw text to the `captures` table **instantly** (don't process it yet) and hides the window in under a second. Prioritize speed and focus — this must feel effortless. Handle the Windows focus-steal and always-on-top quirks. Tell me how to test it, then stop."

- **Test:** trigger it from inside other apps; capture 10 things; confirm rows in `captures`. If it lags, iterate here before anything else.
- **Commit:** `git commit -m "Phase 2: capture bar"`

> ⚠️ If this phase doesn't feel instant, **stop and fix it.** Nothing downstream matters if capture has friction.

### Phase 3 — Auto-Processor (Tier-1, trust-preserving) + Inbox
- **Goal:** every capture is silently turned into tasks/commitments/ideas/people in the background.
- **Done:** seconds after a capture, derived rows appear; an Inbox shows what was extracted; capture itself stays instant.

> **Paste into Claude Code:**
> "Build **Phase 3 only**: the Auto-Processor. After a capture is saved, run it in the **background** (never block capture) through Gemini Flash using the extraction prompt in BUILD_PLAN.md Section 7. Write the extracted tasks/commitments/ideas/people to SQLite. **Trust-preserving rule: raw captures are canonical; extractions are disposable and must NEVER require my approval or correction.** I'll give you my Google AI Studio key — tell me which file to put it in and add it to `.gitignore`. Build a plain **Inbox** view that shows each capture and what was extracted from it (read-only glance, not an edit queue). Then stop."

- **Test:** dump a messy multi-part thought; confirm it splits correctly; confirm capture never lagged.
- **Commit:** `git commit -m "Phase 3: auto-processor + inbox"`

### Phase 4 — Local memory + instant retrieval
- **Goal:** everything is semantically searchable, locally.
- **Done:** each capture is embedded into `sqlite-vec`; a search box answers "where did I put…" instantly.

> **Paste into Claude Code:**
> "Build **Phase 4 only**: local memory. Embed every capture with Gemini `embedding-001` and store vectors in a **`sqlite-vec`** virtual table (not Pinecone). Implement `retrieveRelevantContext(query)` and wire it into the auto-processor for grounding. Then expose a **first-class instant search box** in the UI — I type a phrase, it returns the most relevant past captures. Prove it: capture something, then find it by meaning, not keyword. Then stop."

- **Test:** search by concept, not exact words; confirm relevant old captures surface.
- **Commit:** `git commit -m "Phase 4: sqlite-vec memory + search"`

### Phase 5 — The Commitment Ledger (Loop-Closer) + draft follow-up
- **Goal:** every promise tracked to resolution; one click to draft the follow-up.
- **Done:** a Commitments view sorted by age with open/fulfilled/dropped states; auto-fulfillment when a later capture closes a loop; a "Draft follow-up" button that uses the Tier-2 clipboard bridge.

> **Paste into Claude Code:**
> "Build **Phase 5 only**: the Commitment Ledger. Commitments are already extracted in Phase 3 — now build the lifecycle (open → fulfilled/dropped), auto-fulfillment detection when a new capture satisfies an open commitment, and the Commitments view sorted by age with colored deadline states and action buttons. Add a **'Draft follow-up'** button that packages the commitment + its original capture context to the clipboard using the Tier-2 contract in BUILD_PLAN.md Section 9. Then stop."

- **Test:** make a promise in a capture; see it tracked; close it with a later capture; draft a follow-up.
- **Commit:** `git commit -m "Phase 5: loop-closer"`

### Phase 6 — The Daily Surface + overnight job
- **Goal:** one screen each morning — the one thing + open loops — generated unattended.
- **Done:** a Windows Task Scheduler task runs a nightly brief that writes an `insights` row; the Today view renders it; a "Run now" button lets you test without waiting for 5am.

> **Paste into Claude Code:**
> "Build **Phase 6 only**: the Daily Surface. Create a job that gathers open commitments, overdue/relevant tasks, and recent captures, then generates a brief with a single **'one thing'** + the open loops. Schedule it via **Windows Task Scheduler** (register the task on first run; the app/sidecar runs with a `--run-brief` flag) — do **not** use an in-app 5am sleep loop. Render the latest brief as the **Today** view (default landing). Add a 'Run now' button. Frame everything diagnostically, never as a bare stat or a guilt list. Then stop."

- **Test:** click "Run now"; confirm a useful brief; confirm the scheduled task fires after a real sleep/wake cycle.
- **Commit:** `git commit -m "Phase 6: daily surface + scheduler"`

### Phase 7 — Live on it. Add nothing.
- **Goal:** use the loop daily for 2–3 weeks before touching the deferred list.
- **Done:** you reach for `Ctrl+Shift+Space` by reflex and read the morning surface without forcing it.

No prompt here. Just use it. Fix only what annoys *you*. Resist adding features.

---

## 6. THE TWO-TIER AI DESIGN

The app has two kinds of intelligence. Keep them separate — it's the core architectural decision.

- **Tier 1 — silent, high-volume, unattended.** Per-capture extraction, embeddings, the nightly brief. Must run automatically with no human present → **Gemini Flash via API key.** The clipboard bridge *cannot* do this (no human at 5am).
- **Tier 2 — heavy, occasional, you're-at-the-keyboard.** "Draft this follow-up," a deep weekly reflection, a hard "ask my past self" synthesis. Quality matters and you're present anyway → **Claude via the clipboard bridge** (Section 9).

Rule of thumb: if it has to happen without you, it's Tier 1. If you'd happily click a button and tab to Claude, it's Tier 2.

---

## 7. THE EXTRACTION PROMPT (Tier-1 core)

Used on every capture. Conservative by design — only extract what's genuinely there.

```
You are the processing engine of a personal "second brain". The user dumps raw,
unstructured thoughts; you extract structured meaning. Be precise and conservative
— only extract what's actually there. Never invent.

ACTIVE PROJECTS: {id + name list}
RELEVANT PAST CONTEXT: {top sqlite-vec matches}
RAW INPUT: """{raw_content}"""

Return ONLY valid JSON (omit anything not present):
{
  "tasks":       [{ "title","due_date","inferred_due","project_hint" }],
  "commitments": [{ "description","person","implied_deadline","detected_phrase" }],
  "ideas":       [{ "content","topic" }],
  "people":      [{ "name","context" }],
  "suggested_new_project": { "name" } | null
}

COMMITMENT DETECTION — catch implicit promises:
"I'll send / share / get back to / follow up / circle back", "let me check and tell you",
"I should reach out to…", "I need to get X to Y by Z". These are dropped threads. Catch every one.
```

> Tune this to **your** brain over time — that's the whole advantage of building it for yourself.

---

## 8. (reserved — calendar, later)

Google Calendar merge is a "later" feature, not v1. When you want it: desktop OAuth loopback flow, a `calendar_events` table, week view merged with tasks. Skip for now.

---

## 9. THE CLIPBOARD BRIDGE (Tier-2 spec)

Your idea, scoped correctly: a **"Send to Claude" power button** for heavy jobs — *not* the processing backbone. It keeps a human in the loop (which is exactly what keeps it within normal product use — you're a person pasting into your own Claude; the app only reads your own clipboard).

**Flow — two manual actions (paste, copy):**
1. **Packager (app → clipboard).** App formats the relevant context (the commitment + original capture, or the week's data) into one structured Markdown payload and copies it to the clipboard. You tab to Claude and `Ctrl+V`.
2. **Strict output contract.** The payload tells Claude to wrap its answer in a fenced block:
   `Output the final result inside <AppSync>…</AppSync> tags as JSON. Put nothing else inside those tags.`
3. **Auto-ingestor (Claude → app).** A Rust clipboard listener (`tauri-plugin-clipboard-manager` or `arboard`) watches for a string containing `<AppSync>`, parses the JSON, and updates state natively. You just click "Copy" on Claude's reply.

**Guardrails (don't skip):**
- **Tier-2 only.** Never use this for per-capture or overnight work — those must be unattended.
- **Defensive parsing.** Claude may add stray text or break format; match the tags, validate JSON, fail gracefully.
- **Clipboard is shared global state.** Ignore anything without the tags; debounce; don't clobber what you copy next; be aware Windows clipboard history and password-manager pastes pass through the listener.
- It's unsupported by design — a Claude UI change can break it. Keep it non-load-bearing.

---

## 10. DEFERRED — post-traction only

Do **not** build these until you've lived on the core loop for weeks:
- **Voice capture** (Whisper/`cpal`) — biggest build risk; add after the text loop is rock-solid.
- **Weekly "You" Report** — make it **on-demand**, not a scheduled weekly artifact (it becomes homework).
- **Patterns** — log `behavior_events` quietly as *input* to the daily surface; **no standalone dashboard.**
- **Model router / Groq fallback** — only when Gemini rate-limits actually bite.
- **Mobile/Telegram capture arm** — the highest-value *add* (closes the biggest gap), but it pulls in a relay/sync; do it as a Telegram bot, never a full mobile app. Consider it the first thing you add after v1.
- **Google Calendar.**

---

## 11. RISKS & GUARDRAILS

Two risks survive "building it for myself," because they're about you as the user, not the market:

1. **Will you capture daily?** You skipped the pilot, so this rides on faith. Mitigation: build Phases 1–2 first and actually live on the capture bar for a few days before building the rest — the cheapest possible in-build check.
2. **Will the build's weight burn you out?** → handled by the lean stack (no Whisper, no Pinecone, no installer, no auth) and one-phase-at-a-time with git commits.

And the trap to design around:
- **The compulsive-correction loop.** If a wrong extraction makes you feel you must fix it, the "zero input tax" promise collapses. Defense: raw captures are canonical and permanent; **extractions are disposable, regenerable, and never demand approval.** The Inbox is a glance, not an edit queue. If you catch yourself auditing, that's the signal — not a reason to add an approval UI.
- **The shame-engine.** Overdue loops and completion stats can make you avoid the app. Defense: surface insight as interpretation + a question ("Fridays show zero follow-through — is that slot overcommitted?"), never as a red scoreboard.

---

## 12. DEFINITION OF DONE (v1)

You're done when, every day, without forcing it:
- You hit `Ctrl+Shift+Space` and dump thoughts that vanish in under a second.
- Those dumps become tasks/commitments/ideas in the background, and you let the AI be wrong.
- You can find anything you ever captured by meaning.
- Open promises surface by age, and one click drafts the follow-up.
- A single morning screen tells you the one thing + your open loops.

That's the whole magic. Everything else is a bonus you earn after you've lived on this.

---

### One-line summary
**Build the capture → process → daily-surface loop in ~8 weeks (Claude Code), one phase at a time, leanest possible stack, nothing for strangers — and let Claude be the app's heavy brain through the clipboard bridge.**
