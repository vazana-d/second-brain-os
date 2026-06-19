# Cowork Build Brief — Second Brain OS
### Read this together with COMPLETE_IDEA.md. This file tells you HOW to build it with me.

---

## 0. START HERE — what you (Cowork) should do first

1. Read `COMPLETE_IDEA.md` fully — that's the complete spec (vision, schema, all 14 phases).
2. Read this file — it's the working agreement, environment setup, and phase prompts.
3. Confirm my environment is ready (Section 2) before writing any code.
4. Build **one phase at a time.** Never skip ahead. Get each phase running before the next.
5. After each phase: tell me exactly what to test, and wait for me to confirm it works.

---

## 1. WHO I AM (the builder)

- I am a **solo developer** building this for **myself only**.
- I have **some** coding knowledge but I'm **not** an expert — explain decisions in plain language.
- I'm on **Windows**.
- I do **not** want to spend money — everything must use **free tiers only**.
- I want a **real installable .exe app**, not a web app.
- When something is ambiguous, **ask me** rather than guessing.
- Show me what you're about to do before doing anything destructive (deleting, overwriting).

---

## 2. MY ENVIRONMENT — verify this is installed before coding

Run these checks first. If anything is missing, give me the exact command to install it.

```powershell
node --version        # need v18+ (v20 ideal)
npm --version
rustc --version       # need Rust installed
cargo --version
```

If Rust is missing:
```powershell
winget install Rustlang.Rustup
```

If Node is missing:
```powershell
winget install OpenJS.NodeJS
```

**Also required (Tauri needs this on Windows):**
- Visual Studio C++ Build Tools → "Desktop development with C++" workload
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- WebView2 (usually already on Windows 10/11)

Confirm all of the above before Phase 1.

---

## 3. API KEYS I NEED TO GET (free) — checklist

Tell me when each one is needed. Don't ask for all of them up front — I only need each when its phase arrives.

| # | Service | Get it from | Needed at | What it's for |
|---|---------|-------------|-----------|---------------|
| 1 | **Google AI Studio** | aistudio.google.com → "Get API key" | Phase 3 | Gemini (processing + intelligence + embeddings) |
| 2 | **Pinecone** | app.pinecone.io → API Keys | Phase 5 | Vector memory. Create index: 768 dims, cosine, name `second-brain` |
| 3 | **Groq** | console.groq.com → API Keys | Phase 13 | Free fallback LLM |
| 4 | **Google Cloud OAuth** | console.cloud.google.com | Optional / late | Google Calendar (desktop OAuth) — only if I want calendar |
| 5 | **GitHub repo + signing key** | github.com | Phase 14 | Auto-update releases |

When I give you a key, tell me exactly which file to put it in (e.g. `.env`) and remind me to add that file to `.gitignore`.

---

## 4. HOW WE WORK TOGETHER (the working agreement)

### Build rules
- **One phase at a time.** Finish, test, confirm — then move on.
- **Phase 1 and 2 are sacred.** The Quick Capture Bar must feel instant and effortless before anything else. If capture isn't frictionless, the whole app fails. Spend extra care here.
- **Always make it run.** After each phase, the app should launch and work. No half-built states.
- **Explain as you go.** When you make an architecture choice, tell me why in one or two plain sentences.
- **Keep secrets out of git.** API keys live in `.env`, which is gitignored. Never hardcode them.

### When you finish a phase, always tell me:
1. What you built
2. The exact command to run it (e.g. `npm run tauri dev`)
3. Exactly what I should see / be able to do
4. What to type or click to test it
5. What we'll build next

### If something breaks
- Show me the actual error.
- Explain what it means in plain language.
- Give me the fix as a copy-paste command or edit.
- Don't pile on five changes at once — fix one thing, re-test.

---

## 5. THE BUILD ORDER (from COMPLETE_IDEA.md)

Follow this exact order. Each row is one focused work session.

| Session | Phase(s) | Goal | "Done" looks like |
|---------|----------|------|-------------------|
| 1 | 1 | Tauri scaffold + SQLite + PIN | App opens, asks for a PIN, unlocks |
| 2 | 2 | Quick Capture Bar | Ctrl+Shift+Space → type → saved instantly |
| 3 | 3 | Auto-Processor | A capture gets split into tasks/commitments/ideas |
| 4 | 5 | Memory layer (RAG) | Captures embedded into Pinecone, recall works |
| 5 | 6 | Commitment engine | Promises detected + commitments view |
| 6 | 4 | Voice capture (Whisper) | Hold mic → ramble → transcribed → processed |
| 7 | 7 | UI shell + views | Today / Inbox / Commitments / Ideas / Projects |
| 8 | 8, 9 | Overnight job + Daily Brief | Morning brief generates from my data |
| 9 | 10, 11, 12 | Resurfacer + Weekly Report + Patterns | All three intelligence features |
| 10 | 13, 14 | Model router + tray + auto-update | Polished, ships as .exe |

> Note: voice (Phase 4) is moved to Session 6 — it's the trickiest (Rust audio + Whisper). Get the core text loop rock-solid first.

---

## 6. READY-TO-PASTE PROMPTS FOR EACH SESSION

Copy the matching prompt when you're ready to start that session.

### Session 1 — Scaffold + SQLite + PIN
```
Read COMPLETE_IDEA.md and COWORK_BRIEF.md. First verify my environment
(Section 2 of the brief). Then build Phase 1 only: scaffold the Tauri v2 app
(React + TypeScript + Vite), set up the local SQLite database with the full
schema from Part VI, and build the PIN lock screen (bcrypt-hashed PIN stored
in settings, verified via a Rust command). When done, tell me how to run it
and exactly what to test. Do not start Phase 2 yet.
```

### Session 2 — The Quick Capture Bar
```
Build Phase 2 only: the Quick Capture Bar. Register the global shortcut
Ctrl+Shift+Space to open a small frameless always-on-top capture window.
Typing and hitting Enter saves the raw text to the captures table INSTANTLY
and hides the window in under 2 seconds. Don't process the capture yet — just
save it raw. This feature must feel effortless; prioritize speed and focus.
Tell me how to test it.
```

### Session 3 — The Auto-Processor
```
Build Phase 3 only: the Auto-Processor. When a capture is saved, run it through
Gemini using the extraction prompt from Part VII. Extract tasks, commitments,
ideas, and people, and write them to the SQLite tables. I'll give you my Google
AI Studio key — tell me where to put it. Run processing in the background so
capture stays instant. Show me an Inbox view that displays what was extracted
from each capture.
```

### Session 4 — Memory Layer (RAG)
```
Build Phase 5 (Memory/RAG). Embed every capture with Gemini embedding-001 and
store in Pinecone (I'll give you the key; index is 768 dims, cosine, named
second-brain). Implement retrieveRelevantContext() and wire it into the
auto-processor for grounding. Show me it works by capturing something, then
proving semantic recall finds it.
```

### Session 5 — Commitment Engine
```
Build Phase 6: the Commitment Detection Engine. Commitments already get
extracted in Phase 3 — now build the full lifecycle (open → fulfilled/dropped),
auto-fulfillment detection when a new capture arrives, and the Commitments view
from Part VII with the colored deadline states and action buttons.
```

### Session 6 — Voice Capture
```
Build Phase 4: local voice capture. Add hold-to-record on the capture bar using
cpal for mic capture and whisper-rs for local transcription (bundle
ggml-base.en.bin). On release, transcribe and feed the text into the normal
saveCapture('voice') flow. This is the hardest phase — go slow and test the
audio pipeline before wiring in Whisper.
```

### Session 7 — UI Shell + Views
```
Build Phase 7: the full UI shell. Left sidebar (Today, Inbox, Commitments,
Ideas, Projects, Ask, Patterns, Settings), dark theme using the design tokens
in Part VII, and build out each view. Today is the default landing view.
```

### Session 8 — Overnight Intelligence + Daily Brief
```
Build Phases 8 and 9: the overnight intelligence job (Tauri background task,
runs ~5am, emits an event) and the Daily Brief generator. Gather open
commitments, overdue tasks, calendar, recent captures, and behavior, then
generate the brief shown in Part VII. Render it as the Today view. Add a
"run now" button so I can test without waiting until 5am.
```

### Session 9 — Resurfacer + Weekly Report + Patterns
```
Build Phases 10, 11, 12: the Idea Resurfacer (semantic search of old captures
relevant to active projects), the Weekly "You" Report (Sunday reflection), and
the Behavior/Pattern engine (log behavior_events, derive the patterns in
Part VII, show the Patterns view). Add test buttons to trigger each on demand.
```

### Session 10 — Router + Tray + Auto-Update + Ship
```
Build Phases 13 and 14: the model router with the ROUTING map and rate-limit
fallback (add my Groq key), the system tray, Windows toast notifications, the
global shortcut polish, autostart on Windows boot, and auto-update via GitHub
Releases. Then build the production .exe installer and tell me how to install it.
```

---

## 7. THINGS TO REMIND ME ABOUT

- After Phase 1: remind me to **back up the SQLite file location** so I never lose data.
- Before Phase 3: remind me to get the **Google AI Studio key**.
- Before Phase 5: remind me to **create the Pinecone index** (768 dims, cosine).
- Before Phase 14: remind me to **create the GitHub repo** and generate the **Tauri signing key**.
- Throughout: if I haven't tested the previous phase, **don't let me move on.**

---

## 8. WHAT "GOOD" LOOKS LIKE (so you keep me honest)

- The capture bar opens in well under a second and never makes me wait.
- I can be totally messy and chaotic in what I dump — the app imposes order, not me.
- Nothing requires me to manually create a task or project.
- The Daily Brief feels like a sharp chief of staff, not a notification.
- The whole thing runs at **$0/month**.
- It's a real Windows app in my tray that launches on startup.

---

## 9. IF I GET STUCK OR DISCOURAGED

Remind me of the build philosophy: **nail the Quick Capture Bar first.** If dumping a
thought is effortless and everything gets captured, the magic compounds over time.
The first week of real data is when it starts feeling alive. Keep me focused on
shipping one working phase at a time rather than perfecting everything at once.
