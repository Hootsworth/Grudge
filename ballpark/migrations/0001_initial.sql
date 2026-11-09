-- Migration: 0001_initial.sql
-- Ballpark: Daily log slider estimation game (Cloudflare D1)

-- 1. Daily questions table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  puzzle_date TEXT NOT NULL,
  question_index INTEGER NOT NULL, -- 1 to 5
  question TEXT NOT NULL,
  unit TEXT NOT NULL,
  value REAL NOT NULL,
  value_log10 REAL NOT NULL,
  explanation TEXT NOT NULL,
  sources TEXT NOT NULL, -- JSON array of at least 2 URLs
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 3,
  fermi_derivation TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_date ON questions(puzzle_date);

-- 2. Anonymous player sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  puzzle_date TEXT NOT NULL,
  current_question_index INTEGER NOT NULL DEFAULT 1,
  question_served_at INTEGER NOT NULL, -- Timestamp when current question was served for anti-cheat
  ip_hash TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_error_orders REAL NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON sessions(ip_hash);

-- 3. Individual question guesses
CREATE TABLE IF NOT EXISTS guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  puzzle_date TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  guess_exponent REAL NOT NULL, -- player slider exponent 0 to 24
  error_orders REAL NOT NULL,
  points INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_guesses_question ON guesses(question_id);
CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_date ON guesses(puzzle_date);

-- 4. Daily aggregated statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  puzzle_date TEXT PRIMARY KEY,
  total_players INTEGER NOT NULL DEFAULT 0,
  median_score REAL,
  median_error_orders REAL,
  question_stats TEXT, -- JSON array of per-question median error, closest guess, most common guess
  updated_at INTEGER NOT NULL
);

-- 5. IP Rate limiting table
CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);
