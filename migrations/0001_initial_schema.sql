-- 0001_initial_schema.sql
-- D1 Migration for Strata daily timeline game

CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,                  -- YYYY-MM-DD
    plate TEXT NOT NULL,                        -- e.g. "Cenozoic Crust", "Bronze to Byte"
    theme TEXT NOT NULL,                        -- science, exploration, culture, technology, sport, politics, ancient world
    spread_type TEXT NOT NULL,                  -- century (hard), era (medium), millennia (easy)
    status TEXT NOT NULL DEFAULT 'pending',     -- pending, published, vetoed
    created_at INTEGER NOT NULL,                -- UNIX timestamp in ms
    published_at INTEGER                        -- UNIX timestamp in ms
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,                         -- Max 70 chars, neutral, no date leaks
    year INTEGER NOT NULL,                      -- Negative for BCE (e.g. -2560)
    precision TEXT NOT NULL DEFAULT 'exact',    -- 'exact' or 'approximate'
    source TEXT NOT NULL,                       -- URL of source
    true_order INTEGER NOT NULL                 -- 0 (newest / surface) to 5 (oldest / bedrock)
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                        -- Anonymous UUID from client
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    created_at INTEGER NOT NULL,                -- UNIX timestamp in ms
    last_guess_at INTEGER,                      -- UNIX timestamp in ms for rate-limiting
    attempts_used INTEGER NOT NULL DEFAULT 0,   -- Max 4 attempts
    locked_json TEXT NOT NULL DEFAULT '[]',     -- JSON array of event IDs locked in place
    solved INTEGER NOT NULL DEFAULT 0,          -- 1 if player placed all 6 correctly
    finished INTEGER NOT NULL DEFAULT 0         -- 1 if player finished game (win or loss)
);

CREATE TABLE IF NOT EXISTS guesses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    attempt_number INTEGER NOT NULL,            -- 1 to 4
    order_json TEXT NOT NULL,                   -- JSON array of event IDs [top to bottom]
    correct_json TEXT NOT NULL,                 -- JSON array of booleans [x6]
    created_at INTEGER NOT NULL                 -- UNIX timestamp in ms
);

CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,                      -- YYYY-MM-DD
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    total_players INTEGER NOT NULL DEFAULT 0,
    total_solves INTEGER NOT NULL DEFAULT 0,
    avg_attempts REAL NOT NULL DEFAULT 0,
    solve_rate REAL NOT NULL DEFAULT 0,
    hardest_pair_json TEXT,                     -- JSON object { eventA, eventB, swaps }
    updated_at INTEGER NOT NULL                 -- UNIX timestamp in ms
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(date);
CREATE INDEX IF NOT EXISTS idx_puzzles_status ON puzzles(status);
CREATE INDEX IF NOT EXISTS idx_events_puzzle ON events(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_events_text ON events(text);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle ON sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle ON guesses(puzzle_id);
