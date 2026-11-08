-- Migration 0001: Initial schema for PassPhew (Vault Login Cryptic Password Game)

-- 1. Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,              -- ISO YYYY-MM-DD
    plate INTEGER NOT NULL,                 -- Day index (e.g. #001)
    username TEXT NOT NULL,                 -- Short flavorful handle (e.g. winston_s, root_admin)
    clue TEXT NOT NULL,                     -- Cryptic clue with definition at one end
    answer TEXT NOT NULL,                   -- Stored normalized: lowercase [a-z0-9] only, 3-12 chars
    explanation TEXT NOT NULL,              -- Walkthrough of wordplay, shown only after cracked
    type TEXT NOT NULL,                     -- Anagram, Hidden word, Reversal, Charade, Cut short, Container, Homophone, Two-part clue, Double definition
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'live',    -- 'pending', 'approved', 'live', 'vetoed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(date);
CREATE INDEX IF NOT EXISTS idx_puzzles_status ON puzzles(status);

-- 2. Sessions Table (Anonymous UUIDs, no accounts)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                    -- Client UUID
    date TEXT NOT NULL,                     -- ISO YYYY-MM-DD
    puzzle_id TEXT NOT NULL,
    ip_hash TEXT NOT NULL,                  -- SHA-256 hashed IP for rate-limiting & abuse prevention
    started_at INTEGER NOT NULL,            -- Unix timestamp ms of first guess
    solved_at INTEGER,                      -- Unix timestamp ms of correct crack
    failed_count INTEGER NOT NULL DEFAULT 0,
    solve_seconds INTEGER,                  -- Computed elapsed seconds between first guess and solve
    is_bot INTEGER NOT NULL DEFAULT 0,      -- 1 if flagged by pattern detector
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'solved'
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle ON sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON sessions(ip_hash, date);

-- 3. Guesses Table (Stores attempts for caching repeats, statistics, and bot detection)
CREATE TABLE IF NOT EXISTS guesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    date TEXT NOT NULL,
    guess TEXT NOT NULL,                    -- Raw submitted input
    normalized_guess TEXT NOT NULL,         -- Lowercase [a-z0-9] normalized
    is_correct INTEGER NOT NULL DEFAULT 0,
    attempt_number INTEGER NOT NULL,
    created_at INTEGER NOT NULL,            -- Unix timestamp ms
    ip_hash TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_norm ON guesses(session_id, normalized_guess);
CREATE INDEX IF NOT EXISTS idx_guesses_date ON guesses(date);

-- 4. IP Rate Limits & Anti-Brute-Force Table
CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip_hash TEXT NOT NULL,
    date TEXT NOT NULL,
    guess_count INTEGER NOT NULL DEFAULT 0, -- Hard daily cap of 300
    last_guess_at INTEGER NOT NULL,         -- Unix timestamp ms
    cooldown_until INTEGER NOT NULL DEFAULT 0, -- Unix timestamp ms
    PRIMARY KEY (ip_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_ip_limits_lookup ON ip_rate_limits(ip_hash, date);

-- 5. Daily Aggregated Stats Table
CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    total_players INTEGER NOT NULL DEFAULT 0,
    total_solvers INTEGER NOT NULL DEFAULT 0,
    solve_rate REAL NOT NULL DEFAULT 0.0,
    median_failed REAL NOT NULL DEFAULT 0.0,
    fastest_crack_seconds INTEGER,
    common_wrong_guesses TEXT               -- JSON array of top wrong guesses
);
