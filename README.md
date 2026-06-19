# Second Brain OS

> *The only app where being disorganized is the intended use — you think out loud, it builds your life behind the scenes, and every morning it hands you a day that's already been thought through.*

A local-first personal "second brain" for Windows. Capture any thought in under two seconds; it auto-organizes the chaos into tasks, commitments, and ideas, remembers everything, tracks the promises you'd otherwise forget, and proactively surfaces one thought-through plan each morning.

**Status:** 🚧 In active development — built in phases.

---

## Why

Every productivity tool dies the moment maintaining it becomes work. This one removes the input tax entirely: you never create a task or organize a project — you just dump, and the AI does the filing. Because capture is frictionless, the app accumulates your complete cognitive history, and that history is the fuel for genuinely useful, proactive intelligence.

## Core features (v1)

- **Frictionless capture** — one global hotkey, dump anything, saved instantly.
- **Auto-processor** — pulls tasks, commitments, ideas, and people out of raw dumps, in the background.
- **Local memory + semantic search** — find anything you ever captured, by meaning rather than keyword.
- **Loop-Closer** — detects implicit promises ("I'll send you…") and tracks them to done.
- **Daily surface** — one morning screen: the single thing that matters + your open loops.

## Tech stack

- **Desktop shell:** Tauri v2 (Rust) + React + TypeScript + Vite
- **Storage:** local SQLite + `sqlite-vec` for vector search
- **AI:** Gemini for silent per-capture processing, Claude for heavy on-demand reasoning
- **Platform:** Windows · local-first · no cloud database

## Design process

Before a line of code, the concept was pressure-tested by a five-lens critique "council" — skeptic, product strategist, indie developer, user advocate, and first-principles thinker — to cut what was redundant and find the irreplaceable core. The vision, the verdict, and the build plan live alongside the code:

- [`COMPLETE_IDEA.md`](./COMPLETE_IDEA.md) — full vision and data model, annotated with the council verdict
- [`BUILD_PLAN.md`](./BUILD_PLAN.md) — the lean, phase-by-phase build
- [`START_HERE.md`](./START_HERE.md) — condensed handoff

## Roadmap

1. Scaffold + local database
2. Quick Capture Bar
3. Auto-processor + Inbox
4. Local memory + search
5. Commitment ledger (Loop-Closer)
6. Daily surface + overnight brief
7. Daily use — then earned extras (voice, mobile capture, weekly reflection)

## License

[MIT](./LICENSE) © Dan Vazana

---

*A personal project, built for an audience of one.*
