export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  SEARCH_API_KEY?: string;
  SEARCH_PROVIDER?: string;
  PREVIEW_WEBHOOK_URL?: string;
  VETO_SECRET?: string;
  ENVIRONMENT?: string;
}

export type PrecisionType = 'exact' | 'approximate';
export type SpreadType = 'century' | 'era' | 'millennia';
export type ThemeType = 'science' | 'exploration' | 'culture' | 'technology' | 'sport' | 'politics' | 'ancient world';

export interface PuzzleEvent {
  id: string;
  puzzle_id?: string;
  text: string;
  year: number;
  precision: PrecisionType;
  source: string;
  true_order?: number; // 0 = newest / surface, 5 = oldest / bedrock
}

export interface Puzzle {
  id: string;
  date: string; // YYYY-MM-DD
  plate: string;
  theme: ThemeType;
  spread_type: SpreadType;
  status: 'pending' | 'published' | 'vetoed';
  created_at: number;
  published_at?: number | null;
  events?: PuzzleEvent[];
}

export interface SessionRecord {
  id: string;
  puzzle_id: string;
  created_at: number;
  last_guess_at: number | null;
  attempts_used: number;
  locked_json: string; // JSON array of string IDs
  solved: number;
  finished: number;
}

export interface GuessRecord {
  id: string;
  session_id: string;
  puzzle_id: string;
  attempt_number: number;
  order_json: string;
  correct_json: string;
  created_at: number;
}

export interface TodayClientEvent {
  id: string;
  text: string;
}

export interface TodayResponse {
  date: string;
  plate: string;
  events: TodayClientEvent[];
}

export interface EventReveal {
  id: string;
  year: number;
  display: string;
  source: string;
}

export interface GuessRequest {
  session: string;
  order: string[];
}

export interface GuessResponse {
  correct: boolean[];
  solved: boolean;
  attemptsUsed: number;
  locked: string[];
  reveal?: EventReveal[];
}

export interface FinishRequest {
  session: string;
}

export interface FinishResponse {
  attempts: number | null;
  percentile: number;
  avgAttempts: number;
}

export interface HardestPair {
  eventA: string;
  eventB: string;
  swaps: number;
}

export interface YesterdayStatsResponse {
  date: string;
  solveRate: number;
  avgAttempts: number;
  hardestPair: HardestPair | null;
}
