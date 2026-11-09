-- Migration 0001: Initial schema for Pinpoint (Daily Geography Mystery Spot Game)

-- 1. Puzzles Table (One row per day)
CREATE TABLE IF NOT EXISTS puzzles (
    date TEXT PRIMARY KEY,                 -- ISO YYYY-MM-DD
    plate INTEGER NOT NULL,                -- Day plate index (e.g. #001)
    status TEXT NOT NULL DEFAULT 'live',   -- 'pending', 'approved', 'live', 'vetoed'
    created_at INTEGER NOT NULL            -- Unix timestamp ms
);

CREATE INDEX IF NOT EXISTS idx_pinpoint_puzzles_status ON puzzles(status);

-- 2. Rounds Table (5 spots per day)
CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,                   -- {date}_{round_number}
    puzzle_date TEXT NOT NULL,
    round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 5),
    name TEXT NOT NULL,                    -- Location name (e.g. "Strait of Gibraltar")
    fact TEXT NOT NULL,                    -- 1-sentence verified fact
    source_url TEXT NOT NULL,              -- Citation source URL
    lat REAL NOT NULL,                     -- True target latitude (-85 to 85)
    lon REAL NOT NULL,                     -- True target longitude (-180 to 180)
    continent TEXT NOT NULL,               -- Continent name for diversity guarantee
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    created_at INTEGER NOT NULL,
    FOREIGN KEY (puzzle_date) REFERENCES puzzles(date) ON DELETE CASCADE,
    UNIQUE (puzzle_date, round_number)
);

CREATE INDEX IF NOT EXISTS idx_pinpoint_rounds_date ON rounds(puzzle_date);

-- 3. Anonymous Player Sessions (UUID, no accounts)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                   -- Client-generated UUID
    puzzle_date TEXT NOT NULL,
    current_round INTEGER NOT NULL DEFAULT 1,
    round_started_at INTEGER,              -- Unix timestamp ms when current round started
    hints_used INTEGER NOT NULL DEFAULT 0, -- Zoom-outs used in current round (0, 1, or 2)
    total_score INTEGER NOT NULL DEFAULT 0,
    ip_hash TEXT NOT NULL,                 -- SHA-256 hash of IP for abuse prevention
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'finished'
    started_at INTEGER NOT NULL,           -- Unix timestamp ms
    finished_at INTEGER,
    FOREIGN KEY (puzzle_date) REFERENCES puzzles(date)
);

CREATE INDEX IF NOT EXISTS idx_pinpoint_sessions_date ON sessions(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_pinpoint_sessions_ip ON sessions(ip_hash, puzzle_date);

-- 4. Guesses Table (1 guess per round per session)
CREATE TABLE IF NOT EXISTS guesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    puzzle_date TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    guess_lat REAL NOT NULL,
    guess_lon REAL NOT NULL,
    distance_km REAL NOT NULL,
    points INTEGER NOT NULL,
    hints_used INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_pinpoint_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_pinpoint_guesses_date_round ON guesses(puzzle_date, round_number);

-- 5. Daily Aggregated Stats
CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    total_players INTEGER NOT NULL DEFAULT 0,
    median_score_r1 REAL,
    median_score_r2 REAL,
    median_score_r3 REAL,
    median_score_r4 REAL,
    median_score_r5 REAL,
    hardest_round INTEGER,
    avg_distance_km REAL,
    updated_at INTEGER NOT NULL
);

-- 6. IP Rate Limits
CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip_hash TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    last_request_at INTEGER NOT NULL,
    cooldown_until INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip_hash, date)
);
