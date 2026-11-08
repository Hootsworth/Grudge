// Types for PassPhew (Vault Login Cryptic Password Game)

export type ClueType =
  | 'Anagram'
  | 'Hidden word'
  | 'Reversal'
  | 'Charade'
  | 'Cut short'
  | 'Container'
  | 'Homophone'
  | 'Two-part clue'
  | 'Double definition';

export interface Puzzle {
  id: string;
  date: string; // ISO YYYY-MM-DD
  plate: number; // Daily serial number
  username: string; // Flavored handle (e.g. root_admin, winston_s)
  clue: string; // Cryptic clue with definition at one end
  answer: string; // Lowercase [a-z0-9] only, 3 to 12 chars
  explanation: string; // Walkthrough of wordplay
  type: ClueType; // Internal only, never sent to client
  difficulty: number; // 1 to 5
  status: 'pending' | 'approved' | 'live' | 'vetoed';
  created_at?: string;
}

/** Sanitized public puzzle sent on GET /api/today */
export interface ClientPuzzle {
  plate: number;
  date: string;
  username: string;
  clue: string;
}

export interface SessionRecord {
  id: string; // UUID
  date: string;
  puzzle_id: string;
  ip_hash: string;
  started_at: number;
  solved_at: number | null;
  failed_count: number;
  solve_seconds: number | null;
  is_bot: number;
  status: 'active' | 'solved';
}

export interface GuessRecord {
  id?: number;
  session_id: string;
  date: string;
  guess: string;
  normalized_guess: string;
  is_correct: number;
  attempt_number: number;
  created_at: number;
  ip_hash: string;
}

export interface IpLimitRecord {
  ip_hash: string;
  date: string;
  guess_count: number;
  last_guess_at: number;
  cooldown_until: number;
}

export interface DailyStatsRecord {
  date: string;
  total_players: number;
  total_solvers: number;
  solve_rate: number;
  median_failed: number;
  fastest_crack_seconds: number | null;
  common_wrong_guesses: string; // JSON array
}

export interface GuessResponseSuccess {
  correct: true;
  answer: string;
  explanation: string;
  failedBeforeCrack: number;
  solveSeconds: number;
  percentile: number;
}

export interface GuessResponseFailure {
  correct: false;
  failed: number;
  cached?: boolean;
}

export type GuessResponse = GuessResponseSuccess | GuessResponseFailure;

export interface FinishResponse {
  failedBeforeCrack: number;
  percentile: number;
  solveRate: number;
}

export interface YesterdayStatsResponse {
  solveRate: number;
  medianFailedAttempts: number;
  fastestCrackTime: number | null;
  mostCommonWrongGuesses: string[];
}

export interface ThrottleCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  lockoutMessage?: string;
  requireTurnstile?: boolean;
  dailyCapReached?: boolean;
}

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  ANTHROPIC_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  APPROVAL_SECRET?: string;
  NOTIFICATION_WEBHOOK_URL?: string;
  CLAUDE_MODEL?: string;
}
