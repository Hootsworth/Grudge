-- Migration 0001: Initial schema for Sprint (Daily Anagram Sprint Game)

-- 1. Daily Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
    date TEXT PRIMARY KEY,                 -- ISO YYYY-MM-DD
    plate INTEGER NOT NULL,                -- Daily puzzle plate number
    key_letters TEXT NOT NULL,             -- 6 uppercase letters (e.g. "PLANET")
    total_words INTEGER NOT NULL,          -- Total possible sub-anagram words in dictionary
    max_score INTEGER NOT NULL,            -- Maximum theoretical raw score
    status TEXT NOT NULL DEFAULT 'live',   -- 'live', 'archived'
    created_at INTEGER NOT NULL
);

-- 2. Anonymous Player Sessions (UUID, no accounts)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                   -- Client UUID
    puzzle_date TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    best_combo INTEGER NOT NULL DEFAULT 1,
    words_found_json TEXT NOT NULL DEFAULT '[]',
    last_word_at INTEGER,                  -- Timestamp ms of previous valid word for combo chaining
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'finished'
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
);

CREATE INDEX IF NOT EXISTS idx_sprint_sessions_date ON sessions(puzzle_date);

-- 3. IP Rate Limits
CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip_hash TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    last_request_at INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, date)
);
