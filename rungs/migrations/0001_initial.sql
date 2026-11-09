-- Migration 0001: Initial schema for Rungs (Daily Word Ladder Game)

-- 1. Daily Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
    date TEXT PRIMARY KEY,                 -- ISO YYYY-MM-DD
    plate INTEGER NOT NULL,                -- Daily puzzle plate number
    ladders_json TEXT NOT NULL,            -- Array of 5 ladders: [{ round: 1..5, start, target, par, optimal_path }]
    status TEXT NOT NULL DEFAULT 'live',   -- 'live', 'archived'
    created_at INTEGER NOT NULL
);

-- 2. Anonymous Player Sessions (UUID, no accounts)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                   -- Client UUID
    puzzle_date TEXT NOT NULL,
    current_round INTEGER NOT NULL DEFAULT 1,
    total_strokes INTEGER NOT NULL DEFAULT 0,
    total_par INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'finished'
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
);

CREATE INDEX IF NOT EXISTS idx_rungs_sessions_date ON sessions(puzzle_date);

-- 3. Per-Ladder Round Progress
CREATE TABLE IF NOT EXISTS round_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 5),
    start_word TEXT NOT NULL,
    target_word TEXT NOT NULL,
    par INTEGER NOT NULL,
    strokes INTEGER NOT NULL DEFAULT 0,
    path_json TEXT NOT NULL DEFAULT '[]',
    solved INTEGER NOT NULL DEFAULT 0,     -- 0 = in progress, 1 = solved
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rungs_progress_session ON round_progress(session_id);

-- 4. IP Rate Limits
CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip_hash TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    last_request_at INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, date)
);
