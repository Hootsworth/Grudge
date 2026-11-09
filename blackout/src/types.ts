// TypeScript interfaces for Blackout

export interface Env {
  DB: D1Database;
  APPROVAL_SECRET?: string;
}

export interface DocumentToken {
  index: number;
  word: string;       // Normalized word
  raw: string;        // Preserving punctuation
  isPunctuationOnly: boolean;
  isCommonArticle: boolean;
}

export interface DossierRecord {
  id: string;
  date: string;
  plate: number;
  classification: string;
  category: string;
  title: string;
  aliases: string[];
  year?: number;
  excerpt: string;
  citation: string;
}

export interface TodayResponse {
  date: string;
  plate: number;
  classification: string;
  category: string;
  year?: number;
  totalTokens: number;
  totalWords: number;
  tokens: Array<{
    index: number;
    length: number;
    punctuationBefore: string;
    punctuationAfter: string;
    preRevealedWord?: string; // only for articles like "the", "a", "of"
  }>;
}

export interface WordGuessRequest {
  session: string;
  word: string;
}

export interface WordGuessResponse {
  valid: boolean;
  word: string;
  matchesCount: number;
  matchedIndices: number[];
  revealedWord?: string;
  totalGuesses: number;
  isSolved: boolean;
  message?: string;
}

export interface SolveRequest {
  session: string;
  titleGuess: string;
}

export interface SolveResponse {
  correct: boolean;
  titleGuess: string;
  totalGuesses: number;
  title?: string;
  year?: number;
  category?: string;
  fullExcerpt?: string;
  citation?: string;
  rankTitle?: string;
  shareCard?: string;
  message?: string;
}

export interface FinishResponse {
  isSolved: boolean;
  title: string;
  year?: number;
  category: string;
  fullExcerpt: string;
  citation: string;
  totalGuesses: number;
  rankTitle: string;
  shareCard: string;
}

export interface SessionRecord {
  id: string;
  puzzle_date: string;
  total_guesses: number;
  words_guessed_json: string;
  tokens_revealed_json: string;
  is_solved: number;
  solved_at: number | null;
  started_at: number;
  finished_at: number | null;
}
