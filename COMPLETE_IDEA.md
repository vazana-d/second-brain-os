# Second Brain OS — The Complete Idea
### Everything: the vision, the decisions, the design, and the full build plan

> *It's the only app where being disorganized is the intended use.*
> *You think out loud. It builds your life behind the scenes.*
> *Every morning it hands you a day that's already been thought through.*

A native Windows desktop app. Fully local. Free to run. Built around frictionless
capture and an AI that reasons over your complete cognitive history while you sleep.

---

> ## 🏛️ COUNCIL VERDICT & REVISIONS — June 18, 2026
> A five-member critique council (Skeptic · Product Strategist · Indie Developer · User Advocate · First-Principles Thinker) stress-tested this document. Their strongest cuts and additions are folded in below and **marked inline so nothing original is lost**:
> - **🏛️ COUNCIL — CUT / DEFER** — redundant with the Claude app, or dies in real use. Original kept, just flagged.
> - **🏛️ COUNCIL — CHANGE** — a leaner technical substitution.
> - **🏛️ COUNCIL — CONTESTED** — a claim the council disputes.
> - **🏛️ COUNCIL — ADD** — a new capability (collected in the new **PART XI**).
>
> **One-line verdict:** *As specified (14 phases, full stack) — don't build.* *A sharply descoped version — capture bar + commitment ledger + one daily surface, built lean — is worth it, conditionally.* **Before writing any code, run the 2-week capture experiment in PART XI / PART IX.** If the habit doesn't form, stop — the whole thesis rests on it.

---

# PART I — THE VISION

## The Problem Every Productivity Tool Has

Every productivity tool dies the same death: **the moment maintaining it becomes work, you abandon it.**

- **Notion** makes you architect everything.
- **Linear** makes you ticket everything.
- **Claude** forgets everything between conversations.
- **Google Calendar** only knows what you manually enter.

You have a graveyard of abandoned setups because the input tax was too high. The tool demanded structure from you before it gave value back.

## The Breakthrough

The insight isn't "build a smarter assistant." It's: **eliminate the input tax entirely, and capture everything anyway.**

You never create a task. You never make a project. You never organize anything. **You just talk, or dump, or paste.** The app builds your entire life structure for you, automatically, in the background.

Then — because capture is frictionless and *everything* flows in — the AI has something no other tool has ever had: your **complete, unfiltered cognitive exhaust.** Every thought, commitment, worry, and idea. That's the fuel that makes the intelligence genuinely powerful.

## Why This Is Defensible

The moat is **accumulated data**. After 6 months of dumping everything into it, switching away becomes unthinkable — it knows things about you that you've forgotten about yourself.

> 🏛️ **COUNCIL — CONTESTED.** "Accumulated data" is not a moat for an app-of-one: the data is yours, portable, and the *intelligence lives in the model API, not your SQLite file*. The defensible edge the council actually agreed on is narrower and sturdier: **(a)** an always-on, sub-2-second capture layer that ingests thoughts which never reach any AI chat, **(b)** a stateful commitment ledger re-checked daily, and **(c)** the daily habit itself. Reframe the moat as *interface + habit + a longitudinal record of inputs Claude never sees* — not "data." Load-bearing risk: this only holds **if you actually capture compulsively and tolerate imperfect extraction without compulsively correcting it.**

Claude can't do this: it's conversational and its memory is fuzzy summaries. Notion/Linear can't: they have zero intelligence about implicit commitments and never resurface forgotten ideas. This app wins on the one axis none of them touch:

**Zero-input capture + permanent perfect memory + overnight proactive reasoning over your complete history.**

---

# PART II — THE FIVE PILLARS

| Pillar | What it does | Why nothing else has it |
|--------|-------------|------------------------|
| **1. Frictionless Capture** | One keystroke to dump anything: text, voice, paste, file | Other tools require structuring on input |
| **2. The Auto-Processor** | AI extracts tasks, deadlines, ideas, commitments, people — and files them | Other tools make YOU do this |
| **3. Perfect Memory** | Everything timestamped in SQLite, embedded in Pinecone, queryable forever | Claude's memory is fuzzy summaries |
| **4. The Loop-Closer** | Detects implicit promises ("I'll send you...") and tracks them to completion | No tool catches commitments you never recorded |
| **5. Overnight Intelligence** | Reasons over your whole brain while you sleep, delivers a thought-through day at 9am | Other tools are purely reactive |

> 🏛️ **COUNCIL — defensibility ranking & cuts.** Ranked by how well each survives a Claude that ships better Memory in 6 months: **Pillar 1 (Capture) = highest** (an interface moat Claude structurally lacks); **Pillar 4 (Loop-Closer) = high** (catches a failure class no tool catches — even the Skeptic conceded this); **Pillar 5 (Overnight) = useful but NOT a moat** (Cowork's scheduled tasks + memory already approximate it — don't oversell it); **Pillar 3 (Perfect Memory) = low defensibility** (Claude Projects/Memory close fast) — keep it as *plumbing for retrieval*, not the headline; **Pillar 2 (Auto-Processor) = keep, but redesign it to be trust-preserving** (see PART XI).

---

# PART III — HOW THE IDEA EVOLVED

This is the journey we took to arrive at the final concept — kept so the reasoning isn't lost.

### v1 — "An AI interface powered by API"
The original request: an app with an AI interface, a RAG system to minimize token usage, a projects + calendar home screen, and the ability to open projects.

### v2 — "A central hub"
Refined into a personal command center: projects as goals with tasks/deadlines/milestones, a week calendar merged with Google Calendar, per-project + global AI chat with cross-project awareness, proactive AI, dark Notion/Linear aesthetic.

### v3 — "Make it free"
Dropped paid Claude API (Pro doesn't include API access — they're separate products). Moved to a fully free AI stack: Gemini + Groq + local Whisper, Pinecone free tier, all $0/month.

### v4 — "Make it a real desktop app"
Moved from web/VPS to a native Windows app via Tauri (lighter than Electron). Fully local SQLite, local PIN auth, system tray, auto-launch, Windows notifications, global shortcut, auto-update via GitHub Releases.

### v5 — "How is this different from Claude?"
Honest reckoning: the core AI chat is something Claude already does better. A generic "AI + tasks + calendar" app isn't worth building — that territory is covered.

### v6 — THE BREAKTHROUGH
The differentiator isn't a smarter assistant — it's **eliminating the input tax** and reasoning over your *complete* captured history. The app where being disorganized is the intended use. Frictionless capture → auto-processing → commitment detection → overnight intelligence → your past self helping your present self.

**That is the version worth building. This document specifies it in full.**

---

# PART IV — ALL DECISIONS MADE

Every choice locked in during the interview, in one place.

### Purpose & Scope
- **Core purpose:** Central hub — productivity, AI assistance, project management, planning
- **Users:** Solo (just you), no collaboration, no multi-user
- **Primary device:** Windows desktop

### Platform & Framework
- **App type:** Native Windows desktop app (not web)
- **Framework:** Tauri v2 (Rust backend + WebView2) — chosen over Electron for size/speed
- **Frontend:** React + TypeScript + Vite
- **Distribution:** Installable .exe (NSIS installer)
- **Updates:** Auto-update via GitHub Releases

### Data & Storage
- **Database:** SQLite, fully local (no cloud, works offline)
- **Files:** Local filesystem via native Tauri APIs, not uploaded
- **Auth:** Local PIN/password (bcrypt-hashed)

### AI Stack (all free)
- **Processing / light tasks:** Gemini 2.0 Flash, rotating with Groq (Llama 3.3, Mixtral)
- **Heavy tasks (briefs, reports):** Gemini 2.0 Pro / 1.5 Pro
- **Embeddings:** Gemini embedding-001
- **Voice:** Local Whisper (whisper.cpp), bundled, offline
- **Routing:** Automatic by task type, with rate-limit fallback chains
- **Cost:** $0/month

### RAG / Memory
- **Vector DB:** Pinecone (free tier, 1 index, 768 dims, cosine)
- **What's indexed:** Everything — every capture, embedded on processing
- **Retrieval:** Top 5-10 relevant chunks per query

### Behavior & Intelligence
- **Proactive:** Yes — surfaces insights automatically without being asked
- **Overnight job:** Runs ~5am, delivers Daily Brief by morning
- **Notifications:** Both Windows native toasts + in-app
- **Model badge:** Subtle indicator of which model responded

### Calendar
- **Google Calendar:** Optional integration (desktop OAuth loopback flow)
- **View:** Week view, merged with app tasks/deadlines

### App Behavior on PC
- **Lives as:** System tray icon + taskbar
- **Launch:** Automatically on Windows startup
- **Global shortcut:** Ctrl+Shift+Space → Quick Capture Bar
- **Aesthetic:** Dark mode only, Notion/Linear style
- **Navigation:** Left sidebar

> 🏛️ **COUNCIL — CHANGE (lean engineering).** Several choices are over-engineered for a single-user local app. Substitutions that cut services and risk without losing the magic: **Pinecone → local `sqlite-vec`** (offline, one fewer cloud dependency); **bcrypt PIN → a simple local hash** (the threat model is just "someone opens my laptop"); **model router → one hardcoded model** until you actually hit a rate limit; **in-app 5am loop → Windows Task Scheduler** (the `tokio` sleep silently fails when the laptop is asleep — see Phase 8). Also keep the **"$0 / fully local"** claim honest: Gemini is mandatory and online for every capture.

---

# PART V — SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│  INPUT LAYER (frictionless — you do almost nothing)          │
│                                                              │
│  Ctrl+Shift+Space → Quick Capture Bar                       │
│  ├── Type a thought                                         │
│  ├── Paste anything (email, message, screenshot, link)     │
│  ├── Hold to record a voice note                           │
│  └── Drag a file in                                        │
│                                                              │
│  Watched folder → drop emails/files for auto-ingestion     │
└────────────────────────┬─────────────────────────────────────┘
                         │ raw capture saved instantly
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  THE AUTO-PROCESSOR (the magic — runs on every capture)     │
│                                                              │
│  Gemini analyzes raw input and extracts:                    │
│  ├── Tasks (with inferred deadlines)                        │
│  ├── Commitments ("I'll send...", "let me get back to...")  │
│  ├── Ideas / thoughts worth keeping                         │
│  ├── People mentioned                                       │
│  ├── Questions you need answered                            │
│  └── Which project this belongs to (or: new project?)       │
└────────────────────────┬─────────────────────────────────────┘
                         │ structured entities
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  THE MEMORY (SQLite + Pinecone — perfect & permanent)        │
│                                                              │
│  SQLite: structured records, timestamps, relationships      │
│  Pinecone: every capture embedded for semantic recall       │
│  The Graph: how everything connects to everything           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  THE INTELLIGENCE (proactive — runs while you sleep)         │
│                                                              │
│  ├── 9am Daily Brief: your day, pre-thought                 │
│  ├── Loop-Closer: forgotten commitments surfaced            │
│  ├── Idea Resurfacer: past self helps present self          │
│  ├── Reality Check: what you promise vs. what you do        │
│  ├── Conflict Detector: overcommitment, deadline clashes    │
│  └── Weekly "You" Report: yourself from the outside         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
        OUTPUT — you just review and execute
```

---

# PART VI — THE DATA MODEL (SQLite)

The `captures` table is the raw, unprocessed input. Everything else derives from it.

> 🏛️ **COUNCIL — ADD (the most important design rule).** Make **raw captures canonical and permanent; treat every derived row (tasks/commitments/ideas) as disposable and regenerable.** Never force the user to approve or fix an extraction. This defuses the council's #1 existential risk — the *compulsive-correction loop*, where one wrong extraction makes you audit them all and the "zero input tax" promise collapses. Related: the fixed five-bucket ontology (tasks/projects/commitments/people) quietly *re-imposes* the structure you were fleeing — consider letting structure **emerge** (theme-cluster after ~30 days) instead of auto-creating projects. See PART XI.

```sql
-- THE RAW INPUT — every single thing you dump, unprocessed
CREATE TABLE captures (
    id TEXT PRIMARY KEY,
    raw_content TEXT NOT NULL,
    source TEXT,                       -- 'quick_bar' | 'voice' | 'paste' | 'file' | 'folder'
    processed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- DERIVED: tasks extracted from captures
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    capture_id TEXT REFERENCES captures(id),
    project_id TEXT REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    inferred_due INTEGER DEFAULT 0,
    energy_required TEXT,              -- 'low' | 'medium' | 'high'
    kanban_order INTEGER DEFAULT 0,
    parent_task_id TEXT REFERENCES tasks(id),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- DERIVED: commitments — the killer feature
CREATE TABLE commitments (
    id TEXT PRIMARY KEY,
    capture_id TEXT REFERENCES captures(id),
    description TEXT NOT NULL,
    person TEXT,
    implied_deadline TEXT,
    status TEXT DEFAULT 'open',        -- 'open' | 'fulfilled' | 'dropped'
    detected_phrase TEXT,
    fulfilled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- DERIVED: ideas / thoughts worth keeping
CREATE TABLE ideas (
    id TEXT PRIMARY KEY,
    capture_id TEXT REFERENCES captures(id),
    content TEXT NOT NULL,
    topic TEXT,
    project_id TEXT REFERENCES projects(id),
    resurfaced_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- DERIVED: people mentioned across captures
CREATE TABLE people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    context TEXT,
    last_mentioned TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Projects (auto-created by processor, or manual)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    status TEXT DEFAULT 'active',
    pinned INTEGER DEFAULT 0,
    auto_created INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- THE BEHAVIOR MODEL — how you actually operate
CREATE TABLE behavior_events (
    id TEXT PRIMARY KEY,
    event_type TEXT,                   -- 'task_created'|'task_completed'|'task_skipped'|'capture'
    entity_id TEXT,
    hour_of_day INTEGER,
    day_of_week INTEGER,
    metadata TEXT,                     -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);

-- AI-generated insights (briefs, reports, alerts)
CREATE TABLE insights (
    id TEXT PRIMARY KEY,
    type TEXT,                         -- 'daily_brief'|'weekly_report'|'loop_alert'|
                                       -- 'idea_resurface'|'conflict'|'pattern'
    content TEXT NOT NULL,
    related_ids TEXT,                  -- JSON array
    dismissed INTEGER DEFAULT 0,
    acted_on INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Calendar events (synced from Google)
CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    google_id TEXT,
    summary TEXT,
    start_time TEXT,
    end_time TEXT,
    description TEXT,
    synced_at TEXT DEFAULT (datetime('now'))
);

-- Settings + secrets
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX idx_captures_unprocessed ON captures(processed) WHERE processed = 0;
CREATE INDEX idx_commitments_open ON commitments(status) WHERE status = 'open';
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_behavior_hour ON behavior_events(hour_of_day);
```

---

# PART VII — THE BUILD PLAN (14 Phases)

## Phase 1 — Tauri Scaffold + SQLite + PIN
App opens, PIN locks it, SQLite ready.

**Prerequisites:**
```powershell
winget install Rustlang.Rustup
winget install OpenJS.NodeJS
# + Visual Studio C++ Build Tools ("Desktop development with C++")
npm install -g @tauri-apps/cli
```

**Scaffold:**
```powershell
npm create tauri-app@latest second-brain   # React + TypeScript + Vite
cd second-brain && npm install
```

**Frontend deps:**
```powershell
npm install react-router-dom date-fns lucide-react clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @google/generative-ai groq-sdk @pinecone-database/pinecone
npm install tesseract.js pdfjs-dist mammoth googleapis
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

**Rust deps (Cargo.toml):**
```toml
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-autostart = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-updater = "2"
tauri-plugin-shell = "2"
tauri-plugin-process = "2"
bcrypt = "0.15"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

PIN: bcrypt-hashed in `settings`, verified via Rust command. Schema from Part VI goes in the migration.

---

## Phase 2 — The Quick Capture Bar
**The single most important feature.** One keystroke from anywhere → dump anything → saved instantly, processed in background.

**Global shortcut → dedicated capture window:**
```rust
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

let capture_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
app.global_shortcut().on_shortcut(capture_shortcut, |app, _, _| {
    if let Some(win) = app.get_webview_window("capture") {
        win.show().unwrap();
        win.set_focus().unwrap();
    }
})?;
```

**Capture window (tauri.conf.json — second window):**
```json
{
  "label": "capture", "url": "/capture",
  "width": 640, "height": 120,
  "decorations": false, "transparent": true,
  "alwaysOnTop": true, "center": true,
  "visible": false, "skipTaskbar": true
}
```

**Save logic (instant, no waiting):**
```typescript
async function saveCapture(content: string, source: string) {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
        'INSERT INTO captures (id, raw_content, source, processed) VALUES (?, ?, ?, 0)',
        [id, content, source]
    )
    await logBehavior('capture', id)
    await getCurrentWindow().hide()   // user is done in <2s
    processCapture(id)                // background, not awaited
}
```

UI:
```
┌────────────────────────────────────────────────────────┐
│  ▌ Dump anything...                            🎤  ⏎   │
└────────────────────────────────────────────────────────┘
```

---

## Phase 3 — The Auto-Processor Engine
Turn raw chaos into structured entities. This is the brain that does your filing.

**Pipeline:**
```typescript
export async function processCapture(captureId: string) {
    const db = await getDb()
    const [capture] = await db.select('SELECT * FROM captures WHERE id = ?', [captureId])

    const projects = await db.select('SELECT id, name, description FROM projects WHERE status="active"')
    const recentContext = await retrieveRelevantContext(capture.raw_content)

    const extraction = await extractEntities(capture.raw_content, projects, recentContext)

    for (const task of extraction.tasks)
        await createTask({ ...task, capture_id: captureId, project_id: resolveProject(task) })
    for (const c of extraction.commitments)
        await createCommitment({ ...c, capture_id: captureId })
    for (const idea of extraction.ideas)
        await createIdea({ ...idea, capture_id: captureId })
    for (const p of extraction.people)
        await upsertPerson(p)
    if (extraction.suggested_new_project)
        await createProject({ ...extraction.suggested_new_project, auto_created: 1 })

    await embedAndStore(captureId, capture.raw_content)
    await db.execute('UPDATE captures SET processed = 1 WHERE id = ?', [captureId])
}
```

**The extraction prompt (the core intelligence):**
```
You are the processing engine of a personal "second brain" system. The user dumps
raw, unstructured thoughts and you extract structured meaning. Be precise and
conservative — only extract what's genuinely there.

THE USER'S ACTIVE PROJECTS:
{project list with ids}

RELEVANT PAST CONTEXT:
{semantic recall}

RAW INPUT:
"""{rawContent}"""

Extract as JSON (omit anything not present — don't invent):
{
  "tasks": [{ "title","description","due_date","inferred_due","energy_required","project_hint" }],
  "commitments": [{ "description","person","implied_deadline","detected_phrase" }],
  "ideas": [{ "content","topic" }],
  "people": [{ "name","context" }],
  "suggested_new_project": { "name","description" } | null
}

CRITICAL — commitment detection. Watch for implicit promises:
- "I'll send / share / get back to / follow up / circle back"
- "let me check and tell you"
- "I should reach out to..."
- "I need to get X to Y by Z"
These are the user's dropped threads. Catch every one.

Return ONLY valid JSON.
```

---

## Phase 4 — Voice Capture (Local Whisper)
Hold mic, ramble, release. Transcribed locally for free, then processed like any capture.

> 🏛️ **COUNCIL — CUT FROM v1.** The Indie Developer's "most likely place the project dies": `whisper-rs` + `cpal` + a 140 MB bundled model is stacked C/Rust/Windows build pain that tends to hit around Week 3, at peak momentum, for a non-expert. Ship text-only first; add voice once the core loop is proven. (Phase kept below for when you return to it.)

- **Why local:** free, private, offline, fast (whisper.cpp)
- **Deps:** `whisper-rs`, `cpal` (mic capture)
- **Model:** `ggml-base.en.bin` (~140MB), bundled in installer
- **Flow:** `start_recording` → `stop_and_transcribe` (Rust commands) → text flows into `saveCapture(text, 'voice')`

---

## Phase 5 — The Memory Layer (RAG)
Everything you've ever captured is semantically searchable.

> 🏛️ **COUNCIL — CHANGE.** Replace **Pinecone with local `sqlite-vec`**: keeps retrieval offline and on-disk, removes a cloud dependency and its free-tier limits, and makes the "local app" claim true (embeddings still call Gemini online). Bonus the council rated highly: expose *instant retrieval* — "where did I put that pricing idea?" — as a first-class search surface, not buried in chat. It's one of the highest-value, most-underrated features (see PART XI).

- Every capture embedded the moment it's processed (immediate recall matters)
- Gemini `embedding-001` → Pinecone upsert
- `retrieveRelevantContext(query)` powers the processor, resurfacer, chat, and overnight intelligence
- Keep matches scoring > 0.72

---

## Phase 6 — The Commitment Detection Engine
The killer feature. Track every promise to completion.

**Lifecycle:**
```
DETECTED (by processor) → WATCHED (daily) → SURFACED (if open + deadline near/past)
→ RESOLVED (fulfilled or dropped)
```

**Auto-fulfillment:** when a new capture arrives, check if it fulfills any open commitment.

**Commitments view:**
```
OPEN COMMITMENTS                              [sorted by deadline]
├── 🔴 Send proposal to Sarah        promised 9 days ago · OVERDUE
├── 🟡 Get back to Mike re: pricing  promised "this week"
└── 🟢 Share the doc with the team   no deadline
    [Mark done] [Draft it] [Dismiss] [See original capture]
```

---

## Phase 7 — UI Shell & Views
Most interaction happens via the capture bar, so the main window is for *review*, not *entry*.

**Design tokens (dark):**
```css
:root {
    --bg-primary:#0d0d0f; --bg-secondary:#161618; --bg-elevated:#1f1f23;
    --bg-hover:#27272b; --border:#2a2a30;
    --text-primary:#ededf0; --text-secondary:#9090a0; --text-muted:#56565f;
    --accent:#7c6cf6; --accent-glow:#7c6cf625;
    --color-overdue:#f43f5e; --color-soon:#f59e0b; --color-clear:#22c55e;
    --font-sans:'Inter',system-ui,sans-serif; --font-mono:'JetBrains Mono',monospace;
}
```

**Sidebar:**
```
Second Brain
├── ☀️  Today          (the daily brief — default landing)
├── 📥  Inbox          (raw captures awaiting your glance)
├── ✓  Commitments    (open loops — with count badge)
├── 💡  Ideas          (your idea garden)
├── 🗂️  Projects       (auto + manual)
├── 💬  Ask            (global chat over your whole brain)
├── 📊  Patterns       (the behavior dashboard)
└── ⚙️  Settings
```

**Inbox shows what was extracted:**
```
┌──────────────────────────────────────────────────────┐
│ 2 min ago · voice                                    │
│ "need to call the dentist and Tom wants the slides   │
│  by Thursday and I had an idea about onboarding..."  │
│ ✓ Extracted: 2 tasks · 1 commitment · 1 idea  [✏️ fix]│
└──────────────────────────────────────────────────────┘
```

---

## Phase 8 — The Overnight Intelligence Job
While you sleep, the app reasons over your entire brain and prepares tomorrow.

> 🏛️ **COUNCIL — CHANGE (correctness, not preference).** The specified `tokio::time::sleep`-to-5am loop **only runs if the app is awake at 5am** — a sleeping Windows laptop skips it most nights, silently breaking the core "morning delivery" promise. Use **Windows Task Scheduler** to launch the brief job (or a light sidecar) with a `--run-brief` flag. Keep the feature, but treat it as the *daily surface*, not a moat — Cowork scheduled tasks approximate it.

- Runs ~5am via Tauri background task (`tokio::time::sleep` to target hour, emits event)
- Pipeline gathers: open commitments, overdue tasks, today's calendar, last week's captures, behavior model, active projects
- Generates: Daily Brief (heavy model) + loop alerts + resurfaced ideas + conflicts
- Fires one morning notification

---

## Phase 9 — The Daily Brief (the "Today" view)
The first thing you see. Your day, already thought through.

```
🎯 YOUR ONE THING
   Finish the API design doc for Mercury. You've referenced it in 4 captures over
   11 days but never started it. Calendar's clear until 2pm — this is the window.
   It's high-energy work and 10am–12 is your strongest block.   [Start now] [Not today]

⚠️ OPEN LOOPS
   You told Sarah you'd send the proposal "by Friday." That was 4 days ago. Still open.
   [Draft it] [Mark done] [Drop it]

📉 HONEST FLAG
   You created 14 tasks this week and completed 4. You're not behind — you're
   over-promising. Mercury and Atlas both want big pushes this week and they conflict.
   [Help me choose]

💡 FROM YOUR PAST SELF
   May 3 you had an idea: "what if onboarding was a single screen?" You're working on
   onboarding this week. Worth revisiting?   [Open idea]
```

---

## Phase 10 — The Idea Resurfacer
Your past self helps your present self. The feature that feels like magic.

Overnight, for each active project, semantically search your *entire* capture history for old ideas (>3 weeks) that relate but were never acted on. Surface max 1 per project per day.

Only possible because frictionless capture means you actually have a complete history to search.

---

## Phase 11 — The Weekly "You" Report
Every Sunday, see yourself from the outside. Coach + chief of staff + therapist.

> 🏛️ **COUNCIL — DEFER / MAKE ON-DEMAND.** A weekly 600-word self-report becomes "homework that competes with Sunday" and goes unread by week four. Even the Strategist — who first called this the moat — conceded it's *downstream evidence, not the lock-in*. Don't ship it as a scheduled weekly artifact for v1; make it **on-demand**, and fold its best instinct into the daily surface — framed diagnostically, not as a shame scoreboard (PART XI).

Generated Sunday evening from the week's data. Sections:
1. Where your week actually went (vs. intended)
2. Kept vs. dropped commitments (reliability, stated plainly)
3. What your mind kept returning to (recurring themes)
4. One pattern about how you operated
5. One earned piece of advice for next week

Saved forever — over months, a record of your life you can scroll back through.

---

## Phase 12 — Behavior Model & Pattern Engine
Learn how you actually work, so the intelligence sharpens over time.

> 🏛️ **COUNCIL — CUT THE DASHBOARD, KEEP THE SIGNAL.** Every member expected the Patterns *view* to go dark after week 2 — a scoreboard you stop visiting (and a "31% completion rate" mirror can drive emotional withdrawal). Keep logging `behavior_events` as quiet *input* to the daily surface; **delete the standalone dashboard.** Surface insight as interpretation + a question ("your Friday afternoons show zero follow-through — is that slot overcommitted?"), never as a bare stat.

Logs `behavior_events` silently (task created/completed/skipped, captures — with hour/day). Derives:
- Peak completion window, peak capture window
- Completion rate, overcommit ratio
- Most productive day, average task lifespan

**Patterns view example:**
```
⚡ Peak completion: 10am–12pm    🌙 Peak capture: 11pm–1am (night-thinker)
✓ Completion rate: 31%           📊 Overcommit ratio: 3.2x
📅 Most productive: Tuesday      ⏱️ Avg task lifespan: 6.4 days

💬 "You're a night-thinker and a morning-doer. The system schedules your hard
    tasks for 10am when you actually execute. Your real problem isn't laziness —
    it's that you commit to 3x what's humanly possible."
```

Feeds back into every Daily Brief.

---

## Phase 13 — Model Router & AI Infrastructure
Right model for each job, all free, with fallback.

> 🏛️ **COUNCIL — DEFER.** Elegant but premature. Start with **one hardcoded model (Gemini Flash) for everything**; add routing the day you actually hit a rate limit. Watch model-name deprecation — pin explicit version aliases, since hardcoded `gemini-2.0-*` names are a silent-404 risk.

```typescript
const ROUTING = {
    'extract':       ['gemini-2.0-flash', 'groq-llama-3.3-70b'],
    'fulfillment':   ['gemini-2.0-flash', 'groq-llama-3.3-70b'],
    'embed':         ['gemini-embedding-001'],
    'daily_brief':   ['gemini-2.0-pro', 'gemini-1.5-pro'],
    'weekly_report': ['gemini-2.0-pro', 'gemini-1.5-pro'],
    'resurface':     ['gemini-1.5-pro', 'gemini-2.0-flash'],
    'conflict':      ['gemini-1.5-pro'],
    'chat':          ['gemini-1.5-pro', 'groq-llama-3.3-70b'],
}
// Try each model in the chain; on rate-limit, fall to next.
```

**Cost reality:** processor ~1-2k tokens/capture, overnight ~15-20k tokens/day, embeddings free, Whisper local. **Total: $0/month**, inside free limits.

---

## Phase 14 — System Tray, Notifications, Auto-Update
- **Tray:** click to open/hide; right-click menu (Open, Capture, Quit)
- **Auto-launch:** on first run via `tauri-plugin-autostart`
- **Global shortcut:** Ctrl+Shift+Space → capture bar (most important binding)
- **Toasts:** brief ready, overdue commitment, conflict detected
- **Auto-update:** GitHub Releases + `tauri-plugin-updater`, signed builds via GitHub Actions on `git tag`

---

# PART VIII — THE MAGIC MOMENTS

The moments that make someone say "I can't live without this."

**1 — The midnight brain-dump.** 11:47pm into your phone: *"need to renew the domain before it expires, promised Alex I'd review his PR, what if pricing was just three tiers."* By morning: domain renewal is a task with an inferred deadline, the PR review is a tracked commitment, the pricing idea is filed under your product project. You did nothing but talk.

**2 — The caught promise.** Three weeks ago: "I'll get the numbers to finance by Q3 close." You forgot. The morning before Q3 close: *"You committed to getting numbers to finance by Q3 close — tomorrow. You haven't touched it. Here's what you'll need."*

**3 — Your past self.** You're building a feature. The app surfaces a half-formed idea you dumped two months ago that's suddenly exactly relevant. It feels like a gift from yourself.

**4 — The honest mirror.** Sunday night: *"You committed to 11 things this week and kept 4. The 7 you dropped were all for other people. You keep your own commitments at 80% and others' at 30%. You're not unreliable — you're a people-pleaser who over-commits in the moment. Next week: pause before saying yes."*

---

# PART IX — BUILD ROADMAP

| Week | Phases | Deliverable |
|------|--------|-------------|
| **1** | 1, 2 | App opens, PIN works, **Quick Capture Bar fully working** |
| **2** | 3, 5 | Auto-processor extracts entities; everything embedded |
| **3** | 4, 6 | Voice capture (local Whisper); commitment engine + view |
| **4** | 7 | Full UI shell — Today, Inbox, Commitments, Ideas, Projects |
| **5** | 8, 9 | Overnight intelligence job + Daily Brief |
| **6** | 10, 11, 12 | Idea resurfacer, Weekly Report, behavior/pattern engine |
| **7** | 13, 14 | Model router, tray, notifications, auto-update, ship v1 |

**Build philosophy:** Nail the Quick Capture Bar in Week 1 before anything else. If dumping a thought isn't effortless, nothing downstream matters.

> 🏛️ **COUNCIL — ADD (a test before the build + a lean re-sequence).** Before *any* Tauri code, run a **2-week capture experiment** with something throwaway (a Telegram bot, or even one text file + a nightly script) to prove you'll capture daily and won't compulsively correct. **If the habit forms,** build the lean ~8-week version: **Wk 1-2** capture bar → `sqlite` → instant; **Wk 3-4** auto-processor (trust-preserving) + `sqlite-vec` retrieval + Loop-Closer; **Wk 5-6** Task-Scheduler daily brief with the single "one thing" + open loops; **Wk 7-8** Telegram capture arm, polish, ship. Everything else (voice, weekly report, patterns dashboard, model router) is a *post-traction* decision. **If the habit doesn't form,** stop — the Skeptic was right and no architecture saves it. Honest timeline for the *full* 14-phase plan is 12-14 weeks, not 7.

---

# PART X — API KEYS & COST

| Service | Where | Cost | Purpose |
|---------|-------|------|---------|
| Google AI Studio | aistudio.google.com | Free | Gemini (processing, intelligence, embeddings) |
| Groq | console.groq.com | Free | Fallback LLM |
| Pinecone | app.pinecone.io | Free (1 index) | Semantic memory |
| Google Cloud | console.cloud.google.com | Free | Calendar OAuth (optional) |
| Whisper model | bundled in app | Free | Local voice transcription |
| GitHub | github.com | Free | Repo + auto-update |

**Total: $0/month.** Only real cost: ~140MB Whisper model bundled in the installer.

---

# PART XI — COUNCIL ADDITIONS (folded in June 18, 2026)

*New material from the critique council. Nothing above was deleted — cuts are flagged inline; this part collects the additions and the sharpened plan.*

## The 2–3 irreplaceable things Claude structurally can't be

1. **Ambient, sub-2-second OS-level capture of inputs that never reach an AI chat.** Claude is a *destination you go to*; it only knows what you paste in. A global hotkey + watched folder (+ later voice/Telegram) ingests the 11pm thought you'd never open a chat for. An *interface* moat — which is why it survives model upgrades.
2. **A stateful commitment ledger, watched and re-surfaced daily (the Loop-Closer).** Claude has no persistent, queryable store of *your* open promises that it re-checks every morning unprompted. Detecting implicit promises and tracking them to resolution is the one feature even the Skeptic conceded Claude doesn't serve.
3. **A longitudinal, locally-owned model of you** built from complete cognitive exhaust — *medium* defensibility, real only if #1 actually happens daily.

## The 10x version of each

- **Capture → an omnipresent capture pipe.** Not desktop-only (the #1 gap every member flagged): a Telegram/SMS bot, a browser/email "capture this" share target, eventually zero-UI voice. One private brain, fed from everywhere.
- **Loop-Closer → it actually closes the loop.** Don't just remind you that you owe Sarah the proposal — *draft the follow-up* from the original capture + your files, so resolving it is one click. Pivots onto the AI's real strength: generation.
- **Memory → a queryable life-log / instrument of self-knowledge.** Reframe from "organize my tasks" to "interrogate my own mind over time": *what have I circled on for 3 months? what do I keep promising and dropping? what did past-me think about X?* Structure discovered, not imposed.

## 3–5 new capabilities that fit the thesis (with build difficulty)

1. **Trust-preserving extraction (do this first).** *Difficulty: Low.* Raw captures canonical; extractions disposable and never requiring approval. Kills the compulsive-correction loop — the single biggest risk to the whole thesis.
2. **Telegram bot as the mobile capture arm.** *Difficulty: Low–Medium.* Closes the biggest user gap without becoming a distributed system (a full mobile app drags in a server + auth + push — a different project). The 80/20.
3. **"Ask your past self" instant retrieval surface.** *Difficulty: Low–Medium.* You already have embeddings; it's mostly UX. Beats the 6-month time-to-value problem and builds trust fast.
4. **Emergent ontology / theme clustering.** *Difficulty: Medium.* Cluster captures by theme after ~30 days; reflect back "what your mind keeps returning to." Resolves the imposed-structure contradiction.
5. **Diagnostic mirror, not a shame scoreboard.** *Difficulty: Low.* Surface interpretation + a question, never "completion rate: 31%." Resolves the live council split over whether a promise-ledger becomes a wound people abandon.

## The verdict, in one place

- **As specified (14 phases, full stack): No.** Too much overlaps with Claude or dies in use; the Tauri/Rust/Whisper/5-API/auto-update maintenance surface is mismatched to a non-expert solo dev. Honest timeline: 12–14 weeks, not 7.
- **The lean version (≈8 weeks): conditional Yes.** Capture layer + commitment ledger + one daily surface + emergent self-model, built with `sqlite-vec` / Task Scheduler / one model / no voice / trust-preserving extraction. First useful loop in ~2 weeks.
- **Build it if:** you capture daily unprompted, you let the AI be wrong, and ≥2 of {capture bar, Loop-Closer, instant retrieval} feel indispensable by week six.
- **Don't build it if:** the cheap pilot shows sporadic capture, you compulsively correct, or you'd mostly just type things to Claude anyway.
- **Dissent on record (the Skeptic):** use Claude + a manual weekly promise review now; only build if a throwaway pilot proves the habit is durable.

---

# THE ONE-SENTENCE PITCH

> **It's the only app where being disorganized is the intended use** — you think out
> loud, it builds your life behind the scenes, and every morning it hands you a day
> that's already been thought through.
