// TypeScript definitions for Sprint backend

export interface Env {
  DB: D1Database;
  APPROVAL_SECRET?: string;
}

export interface DailySprintPuzzle {
  date: string;
  plate: number;
  keyLetters: string;       // 6 letters e.g. "PLANET"
  totalWords: number;       // Total valid words in dictionary
  maxScore: number;         // Total theoretical points
}

export interface TodayResponse {
  date: string;
  plate: number;
  letters: string;          // 6 letters
  timeLimitSeconds: number; // 60
  totalWordsCount: number;
  maxScore: number;
}

export interface SubmitWordRequest {
  session: string;
  word: string;
}

export interface SubmitWordResponse {
  valid: boolean;
  word: string;
  length: number;
  basePoints: number;
  multiplier: number;       // 1 to 4
  pointsEarned: number;
  totalScore: number;
  isFever: boolean;         // true when multiplier is 4
  isFullBurn: boolean;      // true when 6-letter word
  message?: string;
}

export interface FinishRequest {
  session: string;
}

export interface FinishResponse {
  score: number;
  wordsFoundCount: number;
  totalWordsCount: number;
  bestCombo: number;
  title: string;
  missedWords: string[];    // Complete accounted-for missed words revealed at game over
  shareCard: string;
}

export interface SessionRecord {
  id: string;
  puzzle_date: string;
  score: number;
  best_combo: number;
  words_found_json: string;
  last_word_at: number | null;
  status: 'active' | 'finished';
  started_at: number;
  finished_at: number | null;
}
