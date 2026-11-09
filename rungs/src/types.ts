// TypeScript definitions for Rungs backend

export interface Env {
  DB: D1Database;
  APPROVAL_SECRET?: string;
}

export interface LadderTarget {
  round: number;          // 1 to 5
  start: string;          // 4-letter word (e.g. "cold")
  target: string;         // 4-letter word (e.g. "warm")
  par: number;            // Shortest ladder distance (e.g. 4)
  optimalPath?: string[]; // Server-only, hidden from client during game
}

export interface DailyPuzzle {
  date: string;
  plate: number;
  ladders: LadderTarget[];
}

export interface TodayResponse {
  date: string;
  plate: number;
  ladders: Array<{
    round: number;
    start: string;
    target: string;
    par: number;
  }>;
}

export interface StepRequest {
  session: string;
  round: number;
  word: string;
}

export interface StepResponse {
  valid: boolean;
  word: string;
  diffCount: number;
  strokes: number;
  par: number;
  solved: boolean;
  path: string[];
  message?: string;
}

export interface HintRequest {
  session: string;
  round: number;
  currentWord: string;
}

export interface HintResponse {
  hint: string;
  message: string;
  strokesPenalty: number;
  strokes: number;
  par: number;
}

export interface FinishRequest {
  session: string;
}

export interface FinishResponse {
  totalStrokes: number;
  totalPar: number;
  difference: number;
  title: string;
  summary: Array<{
    round: number;
    start: string;
    target: string;
    strokes: number;
    par: number;
    optimalPath: string[];
  }>;
  shareCard: string;
}

export interface SessionRecord {
  id: string;
  puzzle_date: string;
  current_round: number;
  total_strokes: number;
  total_par: number;
  status: 'active' | 'finished';
  started_at: number;
  finished_at: number | null;
}

export interface RoundProgressRecord {
  id: number;
  session_id: string;
  round_number: number;
  start_word: string;
  target_word: string;
  par: number;
  strokes: number;
  path_json: string;
  solved: number;
  updated_at: number;
}
