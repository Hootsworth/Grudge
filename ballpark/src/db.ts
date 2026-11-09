// Database operations for Ballpark Worker (Cloudflare D1)
import type { QuestionRecord } from './types.ts';

export interface SessionRow {
  session_id: string;
  puzzle_date: string;
  current_question_index: number;
  question_served_at: number;
  ip_hash: string;
  total_points: number;
  total_error_orders: number;
  completed_at: number | null;
  created_at: number;
}

export interface GuessRow {
  id: number;
  session_id: string;
  question_id: string;
  puzzle_date: string;
  question_index: number;
  guess_exponent: number;
  error_orders: number;
  points: number;
  duration_ms: number;
  created_at: number;
}

export async function getQuestionsForDate(
  db: D1Database,
  date: string
): Promise<QuestionRecord[]> {
  const result = await db
    .prepare('SELECT * FROM questions WHERE puzzle_date = ? ORDER BY question_index ASC')
    .bind(date)
    .all<any>();

  if (!result.results || result.results.length === 0) {
    return [];
  }

  return result.results.map((r: any) => ({
    id: r.id,
    puzzle_date: r.puzzle_date,
    question_index: r.question_index,
    question: r.question,
    unit: r.unit,
    value: r.value,
    value_log10: r.value_log10,
    explanation: r.explanation,
    sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : r.sources,
    category: r.category,
    difficulty: r.difficulty,
    fermi_derivation: r.fermi_derivation,
    created_at: r.created_at,
  }));
}

export async function getQuestionById(
  db: D1Database,
  id: string
): Promise<QuestionRecord | null> {
  const r = await db
    .prepare('SELECT * FROM questions WHERE id = ?')
    .bind(id)
    .first<any>();

  if (!r) return null;

  return {
    id: r.id,
    puzzle_date: r.puzzle_date,
    question_index: r.question_index,
    question: r.question,
    unit: r.unit,
    value: r.value,
    value_log10: r.value_log10,
    explanation: r.explanation,
    sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : r.sources,
    category: r.category,
    difficulty: r.difficulty,
    fermi_derivation: r.fermi_derivation,
    created_at: r.created_at,
  };
}

export async function createOrGetSession(
  db: D1Database,
  sessionId: string,
  date: string,
  ipHash: string,
  now: number
): Promise<SessionRow> {
  const existing = await db
    .prepare('SELECT * FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .first<SessionRow>();

  if (existing) {
    return existing;
  }

  await db
    .prepare(
      'INSERT INTO sessions (session_id, puzzle_date, current_question_index, question_served_at, ip_hash, total_points, total_error_orders, created_at) ' +
        'VALUES (?, ?, 1, ?, ?, 0, 0, ?)'
    )
    .bind(sessionId, date, now, ipHash, now)
    .run();

  return {
    session_id: sessionId,
    puzzle_date: date,
    current_question_index: 1,
    question_served_at: now,
    ip_hash: ipHash,
    total_points: 0,
    total_error_orders: 0,
    completed_at: null,
    created_at: now,
  };
}

export async function updateSessionServedTime(
  db: D1Database,
  sessionId: string,
  now: number
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET question_served_at = ? WHERE session_id = ?')
    .bind(now, sessionId)
    .run();
}

export async function advanceSessionQuestion(
  db: D1Database,
  sessionId: string,
  nextIndex: number,
  addedPoints: number,
  addedErrorOrders: number,
  now: number
): Promise<void> {
  await db
    .prepare(
      'UPDATE sessions SET current_question_index = ?, question_served_at = ?, total_points = total_points + ?, total_error_orders = total_error_orders + ? WHERE session_id = ?'
    )
    .bind(nextIndex, now, addedPoints, addedErrorOrders, sessionId)
    .run();
}

export async function completeSession(
  db: D1Database,
  sessionId: string,
  now: number
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET completed_at = ? WHERE session_id = ?')
    .bind(now, sessionId)
    .run();
}

export async function recordGuess(
  db: D1Database,
  guess: {
    sessionId: string;
    questionId: string;
    puzzleDate: string;
    questionIndex: number;
    guessExponent: number;
    errorOrders: number;
    points: number;
    durationMs: number;
    now: number;
  }
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO guesses (session_id, question_id, puzzle_date, question_index, guess_exponent, error_orders, points, duration_ms, created_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      guess.sessionId,
      guess.questionId,
      guess.puzzleDate,
      guess.questionIndex,
      guess.guessExponent,
      guess.errorOrders,
      guess.points,
      guess.durationMs,
      guess.now
    )
    .run();
}

export async function getGuessesForSession(
  db: D1Database,
  sessionId: string
): Promise<GuessRow[]> {
  const result = await db
    .prepare('SELECT * FROM guesses WHERE session_id = ? ORDER BY question_index ASC')
    .bind(sessionId)
    .all<GuessRow>();

  return result.results || [];
}

export async function getOtherGuessesForQuestion(
  db: D1Database,
  questionId: string,
  excludeSessionId?: string
): Promise<number[]> {
  let query = 'SELECT guess_exponent FROM guesses WHERE question_id = ?';
  const params: any[] = [questionId];

  if (excludeSessionId) {
    query += ' AND session_id != ?';
    params.push(excludeSessionId);
  }

  const result = await db.prepare(query).bind(...params).all<{ guess_exponent: number }>();
  return (result.results || []).map((r) => r.guess_exponent);
}

export async function getAllScoresForDate(
  db: D1Database,
  date: string
): Promise<number[]> {
  const result = await db
    .prepare('SELECT total_points FROM sessions WHERE puzzle_date = ? AND completed_at IS NOT NULL')
    .bind(date)
    .all<{ total_points: number }>();

  return (result.results || []).map((r) => r.total_points);
}

export async function insertQuestion(
  db: D1Database,
  q: QuestionRecord
): Promise<void> {
  await db
    .prepare(
      'INSERT OR REPLACE INTO questions (id, puzzle_date, question_index, question, unit, value, value_log10, explanation, sources, category, difficulty, fermi_derivation, created_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      q.id,
      q.puzzle_date,
      q.question_index,
      q.question,
      q.unit,
      q.value,
      q.value_log10,
      q.explanation,
      JSON.stringify(q.sources),
      q.category,
      q.difficulty,
      q.fermi_derivation || null,
      q.created_at
    )
    .run();
}

export async function getDailyStats(
  db: D1Database,
  date: string
): Promise<any | null> {
  return await db
    .prepare('SELECT * FROM daily_stats WHERE puzzle_date = ?')
    .bind(date)
    .first<any>();
}

export async function saveDailyStats(
  db: D1Database,
  stats: {
    puzzleDate: string;
    totalPlayers: number;
    medianScore: number;
    medianErrorOrders: number;
    questionStats: any;
    now: number;
  }
): Promise<void> {
  await db
    .prepare(
      'INSERT OR REPLACE INTO daily_stats (puzzle_date, total_players, median_score, median_error_orders, question_stats, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(
      stats.puzzleDate,
      stats.totalPlayers,
      stats.medianScore,
      stats.medianErrorOrders,
      JSON.stringify(stats.questionStats),
      stats.now
    )
    .run();
}
