-- Migration 0001: Initial schema for Blackout (Daily Redacted Dossier Game)

-- 1. Daily Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
    date TEXT PRIMARY KEY,                 -- ISO YYYY-MM-DD
    plate INTEGER NOT NULL,                -- Daily plate number
    classification TEXT NOT NULL,          -- e.g. "TOP SECRET // EYES ONLY"
    category TEXT NOT NULL,                -- e.g. "Cold War Espionage"
    title TEXT NOT NULL,                   -- Secret target subject (e.g. "Manhattan Project")
    aliases_json TEXT NOT NULL,            -- Accepted answer variations JSON
    year INTEGER,                          -- Historical year
    excerpt TEXT NOT NULL,                 -- Full classified excerpt text
    citation TEXT NOT NULL,                -- Verified source citation
    status TEXT NOT NULL DEFAULT 'live',   -- 'live', 'archived'
    created_at INTEGER NOT NULL
);

-- 2. Anonymous Player Sessions (UUID, no accounts)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                   -- Client UUID
    puzzle_date TEXT NOT NULL,
    total_guesses INTEGER NOT NULL DEFAULT 0,
    words_guessed_json TEXT NOT NULL DEFAULT '[]',
    tokens_revealed_json TEXT NOT NULL DEFAULT '[]',
    is_solved INTEGER NOT NULL DEFAULT 0,  -- 0 = active, 1 = cracked
    solved_at INTEGER,                     -- Timestamp ms
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
);

CREATE INDEX IF NOT EXISTS idx_blackout_sessions_date ON sessions(puzzle_date);

-- 3. IP Rate Limits
CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip_hash TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    last_request_at INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, date)
);
