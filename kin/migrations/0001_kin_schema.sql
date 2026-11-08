-- 0001_kin_schema.sql
-- Cloudflare D1 Migration for Kin evolutionary kinship daily game

CREATE TABLE IF NOT EXISTS organisms (
    id TEXT PRIMARY KEY,
    common_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    ncbi_taxid INTEGER,
    familiarity INTEGER DEFAULT 5,              -- 1 to 5 familiarity score
    category TEXT NOT NULL,                     -- Mammal, Bird, Reptile, Fish, Invertebrate, Plant, Fungi
    body_plan TEXT NOT NULL                     -- Body plan / morphological tag for similarity scoring
);

CREATE TABLE IF NOT EXISTS divergences (
    org_a TEXT NOT NULL REFERENCES organisms(id),
    org_b TEXT NOT NULL REFERENCES organisms(id),
    median_mya REAL NOT NULL,                   -- Median divergence time in Million Years Ago (Mya)
    ci_low REAL NOT NULL,                       -- Confidence interval lower bound
    ci_high REAL NOT NULL,                      -- Confidence interval upper bound
    source TEXT NOT NULL,                       -- TimeTree / OpenTree source
    PRIMARY KEY (org_a, org_b)
);

CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,                  -- YYYY-MM-DD
    plate TEXT NOT NULL,                        -- e.g. "Plate 042"
    status TEXT NOT NULL DEFAULT 'pending',     -- pending, published, vetoed
    created_at INTEGER NOT NULL,                -- Timestamp in ms
    published_at INTEGER                        -- Timestamp in ms
);

CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,              -- 1 to 5
    org_a TEXT NOT NULL REFERENCES organisms(id), -- Pair member A
    org_b TEXT NOT NULL REFERENCES organisms(id), -- Pair member B (A & B are closest relatives)
    org_c TEXT NOT NULL REFERENCES organisms(id), -- Outgroup C
    t1 REAL NOT NULL,                           -- Divergence time A-B in Mya
    t2 REAL NOT NULL,                           -- Divergence time (A,B)-C in Mya
    ci1_low REAL NOT NULL,
    ci1_high REAL NOT NULL,
    ci2_low REAL NOT NULL,
    ci2_high REAL NOT NULL,
    counterintuitive_score REAL NOT NULL,
    fact TEXT NOT NULL                          -- Grounded educational one-liner
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                        -- Anonymous UUID from client
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    created_at INTEGER NOT NULL,
    last_answer_at INTEGER,
    current_round INTEGER NOT NULL DEFAULT 1,   -- Next round expected to be answered (1 to 5, 6=done)
    score_total_mya REAL NOT NULL DEFAULT 0,    -- Sum of t2 for correct rounds
    deepest_mya REAL NOT NULL DEFAULT 0,        -- Max t2 among correct rounds
    finished INTEGER NOT NULL DEFAULT 0         -- 1 if finished all rounds
);

CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    round_id TEXT NOT NULL REFERENCES rounds(id),
    round_number INTEGER NOT NULL,
    chosen_pair_json TEXT NOT NULL,             -- JSON array of 2 chosen organism IDs
    correct INTEGER NOT NULL,                   -- 1 if player chose {org_a, org_b}, else 0
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,                      -- YYYY-MM-DD
    puzzle_id TEXT NOT NULL REFERENCES puzzles(id),
    total_players INTEGER NOT NULL DEFAULT 0,
    solve_rate_rounds_json TEXT NOT NULL,       -- JSON array of 5 floats [r1, r2, r3, r4, r5]
    most_common_wrong_pair_json TEXT,           -- JSON object { roundIndex, pairNames, count }
    updated_at INTEGER NOT NULL
);

-- Indices for rapid querying & constraints
CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(date);
CREATE INDEX IF NOT EXISTS idx_rounds_puzzle ON rounds(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle ON sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_round ON answers(round_id);
