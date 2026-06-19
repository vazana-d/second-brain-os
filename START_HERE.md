# START HERE — Second Brain OS (hand this to a new chat)

**How to use this file:** open a new **Claude Code** chat *inside this project folder*, paste this whole file as the first message, then say **"Start Step 1."** It's the full condensed context plus a step-by-step where each step says exactly what the **AI** does and what **you (Dan)** do.

Two companion files are in this folder for depth: `COMPLETE_IDEA.md` (vision + the critique-council record) and `BUILD_PLAN.md` (the detailed build — schema, dependencies, full prompts). This file is enough to run the build; the AI should open those when it needs exact details.

---

## 1. What we're building (in 4 sentences)

A native **Windows desktop app**, **for me only**, fully local and free to run. I dump any thought via a global hotkey; the app auto-processes it into tasks, commitments, and ideas in the background — I never organize anything. It tracks promises I make ("I'll send you…") to completion, and each morning shows me one screen: the single thing that matters + my open loops. The pitch: *the only app where being disorganized is the intended use.*

---

## 2. Decisions already made (the condensed verdict)

A five-lens critique already ran. Conclusions that are now **locked**:

- **Build the lean version, not the original 14-phase spec.** It's for an audience of one, so there's **no need for a moat, auth, installers, or polish for strangers** — all cut.
- **The irreplaceable core (why this beats just using Claude):** an always-on **capture layer** that catches thoughts which never reach a chat, a **commitment ledger** re-checked daily, and a **local longitudinal memory**. Claude is a place you go; this is ambient.
- **Cut from v1:** Pinecone, voice/Whisper, PIN/auth, signed installer + auto-update, model router, the Patterns dashboard, the scheduled Weekly Report, Google Calendar.
- **The #1 rule that makes it work — trust-preserving extraction:** raw captures are permanent and canonical; the AI's extractions are **disposable, regenerable, and never require my approval.** This prevents the "fix every mistake" trap that would re-introduce the work the app exists to remove.
- **Decision on the pilot:** I'm skipping the optional 2-week test and building directly.

---

## 3. The locked stack

| Layer | Choice |
|------|--------|
| Shell | Tauri v2 (Rust) + React + TypeScript + Vite |
| Storage | Local SQLite (`tauri-plugin-sql`) |
| Vector memory | `sqlite-vec` (local, offline) — **not** Pinecone |
| Tier-1 AI (silent) | Gemini Flash, one hardcoded model |
| Tier-2 AI (heavy) | Claude, via the clipboard bridge (below) |
| Overnight job | **Windows Task Scheduler** — not an in-app timer |
| Auth / installer | **None** — it's my machine, I run it locally |
| Voice | Text only in v1 |

**Two-tier AI:** *Tier 1* = silent, high-volume, unattended (per-capture extraction, embeddings, the nightly brief) → Gemini. *Tier 2* = heavy, occasional, I'm-at-the-keyboard (draft a follow-up, deep reflection) → Claude via clipboard. The bridge: the app copies a structured payload to the clipboard, I paste into Claude, Claude wraps its answer in `<AppSync>…</AppSync>` JSON, and a Rust clipboard listener ingests it. Tier-2 only; never for unattended work.

---

## 4. THE BUILD — step by step (AI does / You do)

Golden rules for the AI, every step: **build one step only, leave the app runnable, explain choices in one plain sentence, then stop and tell me how to test.** Don't jump ahead.

### Step 0 — Setup (You, ~30 min, one time)
**You do:**
- Install (PowerShell): `winget install OpenJS.NodeJS` · `winget install Rustlang.Rustup` · `winget install Microsoft.VisualStudioCode` · `winget install Git.Git`
- Install **Visual Studio C++ Build Tools** → "Desktop development with C++" workload.
- Verify: `node --version` (v20+), `cargo --version`, `git --version`.
- Get a free **Gemini API key** at aistudio.google.com → "Get API key" (you'll paste it at Step 3).
- Open this folder in VS Code, start Claude Code here, paste this file, say "Start Step 1."

**AI does:** nothing yet — wait for setup to be confirmed.

### Step 1 — Scaffold + database
**AI does (paste / act on):** "Build Step 1 only: scaffold Tauri v2 (React + TS + Vite) on Windows, run `git init`, install the lean dependencies and use the project layout in `BUILD_PLAN.md` Section 3a, and set up local SQLite via `tauri-plugin-sql` with the exact schema in `BUILD_PLAN.md` Section 4 — **no PIN, no auth**. App opens to an empty window; DB file is created with all tables. Explain each choice in one sentence, tell me how to run and test, then stop."
**You do:** run `npm run tauri dev` → confirm a window opens and the `.db` file has the tables → `git commit -m "Step 1: scaffold + sqlite"`.
**Done when:** empty app launches and the tables exist.

### Step 2 — The Quick Capture Bar (the sacred core)
**AI does:** "Build Step 2 only: register global shortcut `Ctrl+Shift+Space` to open a small frameless, transparent, always-on-top window. Enter saves the raw text to `captures` **instantly** (no processing yet) and hides the window in under a second. Handle Windows focus/always-on-top quirks. Make it feel effortless. Tell me how to test, then stop."
**You do:** trigger it from inside other apps, dump ~10 thoughts, confirm rows in `captures`. **If it lags at all, tell the AI to fix it before moving on.** Then `git commit -m "Step 2: capture bar"`.
**Done when:** capture feels instant.

### Step 3 — Auto-Processor + Inbox (Tier-1)
**You do first:** when the AI asks, paste your Gemini key into the `.env` file it names, and confirm `.env` is in `.gitignore`.
**AI does:** "Build Step 3 only: after a capture is saved, process it in the **background** (never block capture) with Gemini Flash using the extraction prompt in `BUILD_PLAN.md` Section 7. Write tasks/commitments/ideas/people to SQLite. **Trust-preserving: raw captures canonical; extractions disposable and never requiring my approval.** Build a read-only **Inbox** showing what each capture produced. Tell me where to put my API key, then stop."
**You do:** dump a messy multi-part thought, confirm it splits into the right tasks/commitments/ideas, confirm capture never lagged. `git commit -m "Step 3: auto-processor + inbox"`.
**Done when:** a chaotic dump becomes structured items on its own.

### Step 4 — Local memory + instant search
**AI does:** "Build Step 4 only: embed every capture with Gemini `embedding-001` into a **`sqlite-vec`** table, implement `retrieveRelevantContext(query)`, wire it into the processor for grounding, and add a **first-class search box** that finds past captures by meaning. Prove it works, then stop."
**You do:** search by concept (not exact words), confirm relevant old captures surface. `git commit -m "Step 4: memory + search"`.
**Done when:** "where did I put that thing about X" works by meaning.

### Step 5 — Commitment Ledger (the Loop-Closer)
**AI does:** "Build Step 5 only: the commitment lifecycle (open → fulfilled/dropped), auto-fulfillment when a later capture satisfies a promise, and a Commitments view sorted by age with colored deadline states. Add a **'Draft follow-up'** button that packages the commitment + original capture to the clipboard using the Tier-2 `<AppSync>` contract in `BUILD_PLAN.md` Section 9. Then stop."
**You do:** make a promise inside a capture, watch it get tracked, close it with a later capture, try Draft follow-up. `git commit -m "Step 5: loop-closer"`.
**Done when:** promises surface by age and one click drafts the reply.

### Step 6 — The Daily Surface + overnight job
**AI does:** "Build Step 6 only: a job that gathers open commitments, overdue/relevant tasks, and recent captures, then generates a brief with a single **'one thing'** + the open loops. Schedule it with **Windows Task Scheduler** (register on first run; run with a `--run-brief` flag) — not an in-app timer. Render the latest brief as the **Today** view (default landing). Add a **'Run now'** button. Frame it diagnostically, never as a guilt list. Then stop."
**You do:** click **Run now**, confirm the brief is useful, then confirm the scheduled task actually fires after a real sleep/wake cycle. `git commit -m "Step 6: daily surface"`.
**Done when:** one morning screen tells you the one thing + your open loops, unattended.

### Step 7 — Live on it. Add nothing.
**You do:** use the loop daily for 2–3 weeks. Fix only what annoys *you*. Do **not** build anything from the Deferred list yet.
**AI does:** help with small fixes only; resist scope creep.

---

## 5. What NOT to build yet (Deferred — earn it first)
Voice/Whisper · Weekly "You" Report (make it on-demand, not scheduled) · Patterns dashboard (log data quietly, no view) · model router/Groq · Google Calendar · **Telegram mobile-capture arm** (the best *first add* after v1 — a bot, not a full mobile app).

## 6. Risks to keep in view
- **Compulsive correction:** if I start auditing every extraction, the promise breaks — keep extractions disposable, the Inbox a glance not an edit queue.
- **Burnout:** the lean stack + one-step-at-a-time + git commits are the defense. If a step fights you for more than a session, stop and simplify it.

## 7. Definition of done (v1)
Every day, without forcing it: I hit `Ctrl+Shift+Space` and dump → it becomes structured items in the background → I can find anything by meaning → open promises surface by age with one-click drafts → a single morning screen shows the one thing + open loops. That's the whole magic.

---
**One line:** Build the capture → process → daily-surface loop in ~8 weeks, one step at a time, leanest stack, nothing for strangers — and let Claude be the heavy brain through the clipboard bridge.
