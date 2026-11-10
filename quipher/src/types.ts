// quipher/src/types.ts

export interface Env {
  DB: D1Database;
  APPROVAL_SECRET?: string;
  ANTHROPIC_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

export interface QuoteRecord {
  id: string;
  puzzle_date: string;
  plate: number;
  plaintext: string;
  author: string;
  source: string;
  year: number;
  ciphertext: string;
  cipher_key: string; // JSON: { [plainChar: string]: cipherChar }
  difficulty: number; // 1-5
  entropy: number;
  created_at: number;
}

export interface SessionRecord {
  session_id: string;
  puzzle_date: string;
  ip_hash: string;
  started_at: number;
  solved_at: number | null;
  solve_seconds: number | null;
  checks_count: number;
  hints_count: number;
  last_check_at: number;
  score: number | null;
  rank_title: string | null;
  status: 'in_progress' | 'solved' | 'flagged';
  flagged_reason: string | null;
  created_at: number;
}

export interface EventRecord {
  id: string;
  session_id: string;
  puzzle_date: string;
  event_type: 'check' | 'hint' | 'solve_attempt';
  payload_json: string;
  created_at: number;
}

export interface DailyStatsRecord {
  puzzle_date: string;
  total_sessions: number;
  total_solves: number;
  solve_rate: number;
  median_solve_time: number | null;
  most_used_hint_letter: string | null;
  updated_at: number;
}

export interface TodayResponse {
  plate: number;
  ciphertext: string;
  letterCount: number;
}

export interface CheckRequest {
  session: string;
  mapping: Record<string, string>; // cipherLetter -> plainLetter
  date?: string;
}

export interface CheckResponse {
  wrong: string[]; // cipher letters that are incorrect
  solved: boolean;
  checks: number;
}

export interface HintRequest {
  session: string;
  mapping: Record<string, string>; // cipherLetter -> plainLetter
  date?: string;
}

export interface HintResponse {
  cipherLetter: string;
  plainLetter: string;
  hints: number;
}

export interface SolveRequest {
  session: string;
  mapping: Record<string, string>; // cipherLetter -> plainLetter
  date?: string;
}

export interface SolveResponse {
  solved: boolean;
  plaintext?: string;
  author?: string;
  source?: string;
  year?: number;
  solveSeconds?: number;
  checks?: number;
  hints?: number;
  score?: number;
  percentile?: number;
  rank?: string;
  message?: string;
}

export interface YesterdayStatsResponse {
  date: string;
  medianSolveTime: number | null;
  solveRate: number;
  mostUsedHintLetter: string | null;
  totalSolves: number;
}
