// TypeScript Type Definitions for Pinpoint

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  APPROVAL_SECRET?: string;
}

export interface WindowShape {
  d: string;
  cls: string; // 'c0'..'c5'
}

export interface WindowRendering {
  viewBox: string; // "0 0 W H"
  kmPerUnit: number;
  shapes: WindowShape[];
}

export interface Puzzle {
  date: string; // ISO YYYY-MM-DD
  plate: number;
  status: 'pending' | 'approved' | 'live' | 'vetoed';
  created_at: number;
}

export interface Round {
  id: string; // {date}_{round_number}
  puzzle_date: string;
  round_number: number;
  name: string;
  fact: string;
  source_url: string;
  lat: number;
  lon: number;
  continent: string;
  difficulty: number;
  created_at: number;
}

export interface SessionRecord {
  id: string;
  puzzle_date: string;
  current_round: number;
  round_started_at: number | null;
  hints_used: number;
  total_score: number;
  ip_hash: string;
  status: 'active' | 'finished';
  started_at: number;
  finished_at: number | null;
}

export interface GuessRecord {
  id?: number;
  session_id: string;
  puzzle_date: string;
  round_number: number;
  guess_lat: number;
  guess_lon: number;
  distance_km: number;
  points: number;
  hints_used: number;
  duration_ms: number;
  created_at: number;
}

export interface DailyStats {
  date: string;
  total_players: number;
  median_score_r1: number | null;
  median_score_r2: number | null;
  median_score_r3: number | null;
  median_score_r4: number | null;
  median_score_r5: number | null;
  hardest_round: number | null;
  avg_distance_km: number | null;
  updated_at: number;
}

export interface TodayResponse {
  plate: number;
  rounds: 5;
}

export interface StartResponse {
  window: WindowRendering;
}

export interface ZoomoutResponse {
  window: WindowRendering;
  hintsUsed: number;
}

export interface GuessResponse {
  distanceKm: number;
  points: number;
  hintsUsed: number;
  trueLat: number;
  trueLon: number;
  name: string;
  fact: string;
  sourceUrl: string;
}

export interface FinishResponse {
  total: number;
  perRound: Array<{
    round: number;
    name: string;
    points: number;
    distanceKm: number;
    hintsUsed: number;
  }>;
  rank: 'Lost at sea' | 'Deckhand' | 'First mate' | 'Navigator' | 'Master cartographer';
  percentile: number;
}

export interface YesterdayStatsResponse {
  date: string;
  medianScorePerSpot: number[];
  hardestSpot: {
    round: number;
    name: string;
    avgScore: number;
  } | null;
  averageDistanceKm: number;
}
