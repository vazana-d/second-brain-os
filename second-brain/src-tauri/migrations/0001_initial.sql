-- ============================================================
-- Second Brain OS — initial schema (BUILD_PLAN.md §4)
-- raw captures = canonical, permanent
-- everything else = disposable, regenerable, never requires approval
-- ============================================================

-- RAW INPUT — canonical, permanent
CREATE TABLE IF NOT EXISTS captures (
    id          TEXT PRIMARY KEY,
    raw_content TEXT NOT NULL,
    source      TEXT,              -- 'quick_bar' | 'voice' | 'paste' | 'file' | 'folder'
    processed   INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- DERIVED — tasks extracted from captures
CREATE TABLE IF NOT EXISTS tasks (
    id             TEXT PRIMARY KEY,
    capture_id     TEXT REFERENCES captures(id),
    project_id     TEXT REFERENCES projects(id),
    title          TEXT NOT NULL,
    due_date       TEXT,
    inferred_due   INTEGER DEFAULT 0,
    status         TEXT DEFAULT 'todo',
    created_at     TEXT DEFAULT (datetime('now'))
);

-- DERIVED — commitments (the loop-closer killer feature)
CREATE TABLE IF NOT EXISTS commitments (
    id               TEXT PRIMARY KEY,
    capture_id       TEXT REFERENCES captures(id),
    person_id        TEXT REFERENCES people(id),
    description      TEXT NOT NULL,
    implied_deadline TEXT,
    status           TEXT DEFAULT 'open',   -- 'open' | 'fulfilled' | 'dropped'
    detected_phrase  TEXT,
    fulfilled_at     TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
);

-- DERIVED — ideas / thoughts worth keeping
CREATE TABLE IF NOT EXISTS ideas (
    id         TEXT PRIMARY KEY,
    capture_id TEXT REFERENCES captures(id),
    project_id TEXT REFERENCES projects(id),
    content    TEXT NOT NULL,
    topic      TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- DERIVED — people mentioned across captures
CREATE TABLE IF NOT EXISTS people (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    context        TEXT,
    last_mentioned TEXT,
    created_at     TEXT DEFAULT (datetime('now'))
);

-- Projects (auto-created by processor, or manual)
CREATE TABLE IF NOT EXISTS projects (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    color        TEXT DEFAULT '#7c6cf6',
    status       TEXT DEFAULT 'active',
    auto_created INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now'))
);

-- INTELLIGENCE output — daily brief, loop alerts, etc.
CREATE TABLE IF NOT EXISTS insights (
    id          TEXT PRIMARY KEY,
    type        TEXT,              -- 'daily_brief' | 'loop_alert' | 'idea_resurface'
    content     TEXT NOT NULL,
    related_ids TEXT,              -- JSON array
    created_at  TEXT DEFAULT (datetime('now'))
);

-- LOCAL VECTOR MEMORY — placeholder; wired up in Phase 4 with sqlite-vec
CREATE TABLE IF NOT EXISTS vec_captures (
    capture_id TEXT PRIMARY KEY REFERENCES captures(id),
    embedding  BLOB
);

-- OPTIONAL graph-lite escape hatch (multi-hop traversal, if ever needed)
CREATE TABLE IF NOT EXISTS edges (
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    type      TEXT,
    PRIMARY KEY (source_id, target_id, type)
);

-- Config / secrets (GEMINI_API_KEY stored here in Phase 3)
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_captures_unprocessed ON captures(processed) WHERE processed = 0;
CREATE INDEX IF NOT EXISTS idx_commitments_open     ON commitments(status)  WHERE status   = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
