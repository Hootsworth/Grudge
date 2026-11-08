export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  PREVIEW_WEBHOOK_URL?: string;
  VETO_SECRET?: string;
  ENVIRONMENT?: string;
}

export interface OrganismRecord {
  id: string;
  common_name: string;
  scientific_name: string;
  ncbi_taxid?: number;
  familiarity: number;
  category: string;
  body_plan: string;
}

export interface DivergenceRecord {
  org_a: string;
  org_b: string;
  median_mya: number;
  ci_low: number;
  ci_high: number;
  source: string;
}

export interface RoundRecord {
  id: string;
  puzzle_id?: string;
  round_number: number;
  org_a: string; // Closest relative A
  org_b: string; // Closest relative B
  org_c: string; // Outgroup C
  t1: number;    // Divergence(A, B) in Mya
  t2: number;    // Divergence((A,B), C) in Mya
  ci1_low: number;
  ci1_high: number;
  ci2_low: number;
  ci2_high: number;
  counterintuitive_score: number;
  fact: string;
  // Organism details if joined
  orgAData?: OrganismRecord;
  orgBData?: OrganismRecord;
  orgCData?: OrganismRecord;
}

export interface PuzzleRecord {
  id: string;
  date: string;
  plate: string;
  status: 'pending' | 'published' | 'vetoed';
  created_at: number;
  published_at?: number | null;
  rounds?: RoundRecord[];
}

export interface SessionRecord {
  id: string;
  puzzle_id: string;
  created_at: number;
  last_answer_at: number | null;
  current_round: number; // 1 to 5, 6 when done
  score_total_mya: number;
  deepest_mya: number;
  finished: number;
}

export interface AnswerRecord {
  id: string;
  session_id: string;
  puzzle_id: string;
  round_id: string;
  round_number: number;
  chosen_pair_json: string;
  correct: number;
  created_at: number;
}

export interface ClientOrganism {
  id: string;
  name: string;
  latin: string;
}

export interface ClientRound {
  id: string;
  roundNumber: number;
  organisms: ClientOrganism[]; // Exactly 3, shuffled
}

export interface TodayResponse {
  date: string;
  plate: string;
  rounds: ClientRound[];
}

export interface AnswerRequest {
  session: string;
  roundId: string;
  pair: [string, string];
}

export interface AnswerResponse {
  correct: boolean;
  pair: [string, string];
  outgroup: string;
  t1: number;
  t2: number;
  t1Display: string;
  t2Display: string;
  ci1: [number, number];
  ci2: [number, number];
  fact: string;
  source: string;
}

export interface FinishRequest {
  session: string;
}

export interface FinishResponse {
  totalMya: number;
  deepestMya: number;
  rank: string;
  percentile: number;
}

export interface YesterdayStatsResponse {
  date: string;
  solveRatePerRound: number[];
  mostCommonWrongPairing: {
    roundIndex: number;
    pairNames: [string, string];
    count: number;
  } | null;
}
