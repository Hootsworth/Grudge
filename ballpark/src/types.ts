// Types for Ballpark Worker and Generator

export interface Env {
  DB: D1Database;
  APPROVAL_SECRET?: string;
  ENVIRONMENT?: string;
}

export interface QuestionRecord {
  id: string;
  puzzle_date: string;
  question_index: number; // 1 to 5
  question: string;
  unit: string;
  value: number;
  value_log10: number;
  explanation: string;
  sources: string[]; // parsed from JSON
  category: string;
  difficulty: number;
  fermi_derivation?: string;
  created_at: number;
}

export interface ClientQuestion {
  id: string;
  question: string;
  unit: string;
}

export interface TodayResponse {
  plate: number;
  date: string;
  questions: ClientQuestion[];
}

export interface GuessRequest {
  session: string;
  questionId: string;
  exponent: number; // 0 to 24
}

export interface GuessResponse {
  truth: number;
  truthLog10: number;
  errorOrders: number;
  points: number;
  explanation: string;
  sources: string[];
  medianGuess: number | null; // null if fewer than 30 guesses
  percentile: number;
}

export interface FinishRequest {
  session: string;
}

export interface FinishResponse {
  total: number; // 0 to 5000
  totalErrorOrders: number;
  rank: string;
  percentile: number;
  perQuestion: {
    questionId: string;
    unit: string;
    truth: number;
    guessExponent: number;
    errorOrders: number;
    points: number;
  }[];
}

export interface QuestionStat {
  questionId: string;
  unit: string;
  medianError: number;
  closestGuess: number;
  mostCommonGuess: number;
}

export interface YesterdayStatsResponse {
  date: string;
  totalPlayers: number;
  medianScore: number;
  medianErrorOrders: number;
  questionStats: QuestionStat[];
}

export interface CandidateQuestion {
  question: string;
  unit: string;
  value: number;
  valueLog10: number;
  explanation: string;
  sources: [string, string]; // at least two independent sources
  sourceAValue?: number;
  sourceBValue?: number;
  extractedValue?: number;
  fermiEstimate?: number;
  fermiDerivation?: string;
  category: 'biology' | 'astronomy' | 'history' | 'technology' | 'everyday life' | 'food' | 'geography';
  difficulty: number;
}

export interface VerificationResult {
  valid: boolean;
  sourceDiscrepancyFactor: number;
  extractionDiscrepancyFactor: number;
  fermiFactor?: number;
  errors: string[];
}
