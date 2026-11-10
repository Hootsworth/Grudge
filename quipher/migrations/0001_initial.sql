-- D1 Database Schema for Quipher Daily Cryptogram Game

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  puzzle_date TEXT UNIQUE NOT NULL,
  plate INTEGER NOT NULL,
  plaintext TEXT NOT NULL,
  author TEXT NOT NULL,
  source TEXT NOT NULL,
  year INTEGER NOT NULL,
  ciphertext TEXT NOT NULL,
  cipher_key TEXT NOT NULL, -- JSON mapping string: { [plainChar]: cipherChar }
  difficulty INTEGER NOT NULL, -- 1 (easy) to 5 (hard)
  entropy REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  puzzle_date TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  solved_at INTEGER,
  solve_seconds INTEGER,
  checks_count INTEGER NOT NULL DEFAULT 0,
  hints_count INTEGER NOT NULL DEFAULT 0,
  last_check_at INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  rank_title TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'solved', 'flagged'
  flagged_reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  puzzle_date TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'check', 'hint', 'solve_attempt'
  payload_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_stats (
  puzzle_date TEXT PRIMARY KEY,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_solves INTEGER NOT NULL DEFAULT 0,
  solve_rate REAL NOT NULL DEFAULT 0,
  median_solve_time INTEGER,
  most_used_hint_letter TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip_hash TEXT NOT NULL,
  window_minute INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_minute)
);

CREATE INDEX IF NOT EXISTS idx_quotes_puzzle_date ON quotes(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle_date ON sessions(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_hash ON sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_puzzle_date ON events(puzzle_date);
