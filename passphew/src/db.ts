// Database Access Layer for PassPhew (Cloudflare D1)
import type {
  Puzzle,
  SessionRecord,
  GuessRecord,
  IpLimitRecord,
  YesterdayStatsResponse,
  DailyStatsRecord,
} from './types.ts';
import { normalizeGuess } from './security/normalization.ts';

/**
 * Retrieves the active live puzzle for a given ISO date.
 */
export async function getLivePuzzleForDate(
  db: D1Database,
  dateStr: string
): Promise<Puzzle | null> {
  const result = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? AND status IN ("live", "approved") LIMIT 1')
    .bind(dateStr)
    .first<Puzzle>();

  return result || null;
}

/**
 * Retrieves or registers an anonymous session by UUID.
 */
export async function createOrGetSession(
  db: D1Database,
  sessionId: string,
  dateStr: string,
  puzzleId: string,
  ipHash: string,
  nowMs: number = Date.now()
): Promise<SessionRecord> {
  const existing = await db
    .prepare('SELECT * FROM sessions WHERE id = ? LIMIT 1')
    .bind(sessionId)
    .first<SessionRecord>();

  if (existing) {
    return existing;
  }

  const newSession: SessionRecord = {
    id: sessionId,
    date: dateStr,
    puzzle_id: puzzleId,
    ip_hash: ipHash,
    started_at: nowMs,
    solved_at: null,
    failed_count: 0,
    solve_seconds: null,
    is_bot: 0,
    status: 'active',
  };

  await db
    .prepare(
      `INSERT INTO sessions (id, date, puzzle_id, ip_hash, started_at, solved_at, failed_count, solve_seconds, is_bot, status)
       VALUES (?, ?, ?, ?, ?, NULL, 0, NULL, 0, 'active')`
    )
    .bind(sessionId, dateStr, puzzleId, ipHash, nowMs)
    .run();

  return newSession;
}

/**
 * Retrieves all previous guesses submitted in a session.
 */
export async function getGuessesForSession(
  db: D1Database,
  sessionId: string
): Promise<GuessRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM guesses WHERE session_id = ? ORDER BY id ASC')
    .bind(sessionId)
    .all<GuessRecord>();

  return results || [];
}

/**
 * Checks if a normalized guess was already tried and failed in this session (caching check).
 */
export async function isDuplicateWrongGuess(
  db: D1Database,
  sessionId: string,
  normGuess: string
): Promise<boolean> {
  const found = await db
    .prepare(
      'SELECT id FROM guesses WHERE session_id = ? AND normalized_guess = ? AND is_correct = 0 LIMIT 1'
    )
    .bind(sessionId, normGuess)
    .first();

  return !!found;
}

/**
 * Records a new guess attempt and increments session failed counter if wrong.
 */
export async function recordGuessAttempt(
  db: D1Database,
  session: SessionRecord,
  rawGuess: string,
  normGuess: string,
  isCorrect: boolean,
  ipHash: string,
  nowMs: number = Date.now()
): Promise<number> {
  const nextAttemptNum = session.failed_count + 1;

  // Insert guess row
  await db
    .prepare(
      `INSERT INTO guesses (session_id, date, guess, normalized_guess, is_correct, attempt_number, created_at, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.date,
      rawGuess,
      normGuess,
      isCorrect ? 1 : 0,
      nextAttemptNum,
      nowMs,
      ipHash
    )
    .run();

  // If wrong, increment session failed count
  if (!isCorrect) {
    const updatedFailed = session.failed_count + 1;
    await db
      .prepare('UPDATE sessions SET failed_count = ? WHERE id = ?')
      .bind(updatedFailed, session.id)
      .run();
    return updatedFailed;
  }

  return session.failed_count;
}

/**
 * Marks a session as cracked/solved.
 */
export async function markSessionSolved(
  db: D1Database,
  sessionId: string,
  solveSeconds: number,
  nowMs: number = Date.now()
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions 
       SET status = 'solved', solved_at = ?, solve_seconds = ? 
       WHERE id = ?`
    )
    .bind(nowMs, solveSeconds, sessionId)
    .run();
}

/**
 * Flags a session as a bot when sequential/dictionary brute-force is detected.
 */
export async function flagSessionAsBot(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET is_bot = 1 WHERE id = ?')
    .bind(sessionId)
    .run();
}

/**
 * Retrieves IP rate limit state for current day.
 */
export async function getIpLimit(
  db: D1Database,
  ipHash: string,
  dateStr: string
): Promise<IpLimitRecord> {
  const record = await db
    .prepare('SELECT * FROM ip_rate_limits WHERE ip_hash = ? AND date = ? LIMIT 1')
    .bind(ipHash, dateStr)
    .first<IpLimitRecord>();

  if (record) {
    return record;
  }

  return {
    ip_hash: ipHash,
    date: dateStr,
    guess_count: 0,
    last_guess_at: 0,
    cooldown_until: 0,
  };
}

/**
 * Increments IP attempt count and updates cooldown timer.
 */
export async function updateIpLimit(
  db: D1Database,
  ipHash: string,
  dateStr: string,
  nowMs: number,
  cooldownUntilMs: number
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ip_rate_limits (ip_hash, date, guess_count, last_guess_at, cooldown_until)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT(ip_hash, date) DO UPDATE SET
         guess_count = guess_count + 1,
         last_guess_at = ?,
         cooldown_until = MAX(cooldown_until, ?)`
    )
    .bind(ipHash, dateStr, nowMs, cooldownUntilMs, nowMs, cooldownUntilMs)
    .run();
}

/**
 * Computes rank and percentile among players who cracked the vault today.
 * "Rank players by failed attempts first, solve time second.
 *  Percentile is computed among players who cracked it. A player who never cracks it has no result."
 */
export async function calculatePercentile(
  db: D1Database,
  dateStr: string,
  failedBeforeCrack: number,
  solveSeconds: number
): Promise<number> {
  const { results } = await db
    .prepare(
      `SELECT failed_count, solve_seconds 
       FROM sessions 
       WHERE date = ? AND status = 'solved' AND is_bot = 0`
    )
    .bind(dateStr)
    .all<{ failed_count: number; solve_seconds: number }>();

  if (!results || results.length <= 1) {
    return 100;
  }

  const total = results.length;
  // Count how many solvers performed worse than current player
  // Worse = more failed attempts OR same failed attempts and longer solve time
  let worseCount = 0;
  for (const s of results) {
    if (s.failed_count > failedBeforeCrack) {
      worseCount++;
    } else if (s.failed_count === failedBeforeCrack && (s.solve_seconds || 0) > solveSeconds) {
      worseCount++;
    }
  }

  const percentile = Math.round((worseCount / (total - 1)) * 100);
  return Math.max(1, Math.min(100, percentile));
}

/**
 * Retrieves yesterday's performance statistics.
 */
export async function getYesterdayStats(
  db: D1Database,
  yesterdayDate: string
): Promise<YesterdayStatsResponse> {
  // Check pre-aggregated daily_stats table first
  const preAgg = await db
    .prepare('SELECT * FROM daily_stats WHERE date = ? LIMIT 1')
    .bind(yesterdayDate)
    .first<DailyStatsRecord>();

  if (preAgg) {
    let wrong: string[] = [];
    try {
      wrong = JSON.parse(preAgg.common_wrong_guesses || '[]');
    } catch (e) {}
    return {
      solveRate: preAgg.solve_rate,
      medianFailedAttempts: preAgg.median_failed,
      fastestCrackTime: preAgg.fastest_crack_seconds,
      mostCommonWrongGuesses: wrong,
    };
  }

  // Otherwise compute dynamically from sessions and guesses
  const sessions = (
    await db
      .prepare('SELECT status, failed_count, solve_seconds FROM sessions WHERE date = ? AND is_bot = 0')
      .bind(yesterdayDate)
      .all<{ status: string; failed_count: number; solve_seconds: number | null }>()
  ).results || [];

  const totalPlayers = sessions.length;
  const solvers = sessions.filter((s) => s.status === 'solved');
  const solveRate = totalPlayers > 0 ? solvers.length / totalPlayers : 0.0;

  let medianFailed = 0;
  let fastestCrack: number | null = null;

  if (solvers.length > 0) {
    const sortedFailed = solvers.map((s) => s.failed_count).sort((a, b) => a - b);
    const mid = Math.floor(sortedFailed.length / 2);
    medianFailed =
      sortedFailed.length % 2 !== 0
        ? sortedFailed[mid]
        : (sortedFailed[mid - 1] + sortedFailed[mid]) / 2;

    const crackTimes = solvers
      .map((s) => s.solve_seconds)
      .filter((t): t is number => typeof t === 'number' && t > 0);
    if (crackTimes.length > 0) {
      fastestCrack = Math.min(...crackTimes);
    }
  }

  // Top 5 most common wrong guesses
  const topWrong = (
    await db
      .prepare(
        `SELECT normalized_guess, COUNT(*) as cnt 
         FROM guesses 
         WHERE date = ? AND is_correct = 0 
         GROUP BY normalized_guess 
         ORDER BY cnt DESC 
         LIMIT 5`
      )
      .bind(yesterdayDate)
      .all<{ normalized_guess: string; cnt: number }>()
  ).results || [];

  const mostCommonWrongGuesses = topWrong.map((r) => r.normalized_guess);

  return {
    solveRate: Math.round(solveRate * 100) / 100,
    medianFailedAttempts: medianFailed,
    fastestCrackTime: fastestCrack,
    mostCommonWrongGuesses,
  };
}

/**
 * Retrieves answers used within the past N days to prevent answer repetition.
 */
export async function getRecentUsedAnswers(
  db: D1Database,
  days: number = 180
): Promise<string[]> {
  const cutoffDate = new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
  const { results } = await db
    .prepare('SELECT answer FROM puzzles WHERE date >= ?')
    .bind(cutoffDate)
    .all<{ answer: string }>();

  return (results || []).map((r) => r.answer);
}

/**
 * Inserts or updates a puzzle record in D1.
 */
export async function insertPuzzle(
  db: D1Database,
  puzzle: Puzzle
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO puzzles (id, date, plate, username, clue, answer, explanation, type, difficulty, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         date = excluded.date,
         plate = excluded.plate,
         username = excluded.username,
         clue = excluded.clue,
         answer = excluded.answer,
         explanation = excluded.explanation,
         type = excluded.type,
         difficulty = excluded.difficulty,
         status = excluded.status`
    )
    .bind(
      puzzle.id,
      puzzle.date,
      puzzle.plate,
      puzzle.username,
      puzzle.clue,
      normalizeGuess(puzzle.answer),
      puzzle.explanation,
      puzzle.type,
      puzzle.difficulty,
      puzzle.status
    )
    .run();
}

/**
 * Retrieves a puzzle by its unique ID.
 */
export async function getPuzzleById(
  db: D1Database,
  id: string
): Promise<Puzzle | null> {
  const result = await db
    .prepare('SELECT * FROM puzzles WHERE id = ? LIMIT 1')
    .bind(id)
    .first<Puzzle>();
  return result || null;
}

/**
 * Updates a puzzle's status (e.g. pending -> live, approved, or vetoed).
 */
export async function updatePuzzleStatus(
  db: D1Database,
  id: string,
  status: 'pending' | 'approved' | 'live' | 'vetoed',
  dateStr?: string
): Promise<void> {
  if (dateStr) {
    await db
      .prepare('UPDATE puzzles SET status = ?, date = ? WHERE id = ?')
      .bind(status, dateStr, id)
      .run();
  } else {
    await db
      .prepare('UPDATE puzzles SET status = ? WHERE id = ?')
      .bind(status, id)
      .run();
  }
}

/**
 * Gets the next plate number for puzzles.
 */
export async function getNextPlateNumber(db: D1Database): Promise<number> {
  const result = await db
    .prepare('SELECT MAX(plate) as max_plate FROM puzzles WHERE status IN ("live", "approved")')
    .first<{ max_plate: number | null }>();
  return (result?.max_plate || 0) + 1;
}

/**
 * Retrieves all puzzles stored for a specific date (including candidates).
 */
export async function getPuzzlesForDate(
  db: D1Database,
  dateStr: string
): Promise<Puzzle[]> {
  const { results } = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? OR date LIKE ? ORDER BY plate ASC')
    .bind(dateStr, `${dateStr}_%`)
    .all<Puzzle>();
  return results || [];
}

