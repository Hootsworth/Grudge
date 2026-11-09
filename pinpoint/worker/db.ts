// Database Access Layer for Pinpoint (Cloudflare D1)
import type {
  Puzzle,
  Round,
  SessionRecord,
  GuessRecord,
  DailyStats,
  YesterdayStatsResponse,
} from './types.ts';

/**
 * Retrieves the puzzle for a given date.
 */
export async function getPuzzleForDate(
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
 * Retrieves all 5 rounds for a given date.
 */
export async function getRoundsForDate(
  db: D1Database,
  dateStr: string
): Promise<Round[]> {
  const { results } = await db
    .prepare('SELECT * FROM rounds WHERE puzzle_date = ? ORDER BY round_number ASC')
    .bind(dateStr)
    .all<Round>();
  return results || [];
}

/**
 * Retrieves a single round for a given date.
 */
export async function getRound(
  db: D1Database,
  dateStr: string,
  roundNumber: number
): Promise<Round | null> {
  const result = await db
    .prepare('SELECT * FROM rounds WHERE puzzle_date = ? AND round_number = ? LIMIT 1')
    .bind(dateStr, roundNumber)
    .first<Round>();
  return result || null;
}

/**
 * Creates or retrieves an anonymous session record.
 */
export async function createOrGetSession(
  db: D1Database,
  sessionId: string,
  dateStr: string,
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

  // Auto-heal: Ensure parent puzzle row exists in puzzles table to satisfy foreign key constraint
  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateStr.split('-').map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const fallbackPlate = Math.max(1, Math.floor((curDate - baseDate) / 864e5) + 1);

  await db
    .prepare('INSERT OR IGNORE INTO puzzles (date, plate, status, created_at) VALUES (?, ?, "live", ?)')
    .bind(dateStr, fallbackPlate, nowMs)
    .run();

  // Also ensure 5 rounds exist for dateStr
  const existingRounds = await db
    .prepare('SELECT COUNT(*) as count FROM rounds WHERE puzzle_date = ?')
    .bind(dateStr)
    .first<{ count: number }>();

  if (!existingRounds || existingRounds.count === 0) {
    const fallbackSpots = [
      { name: 'Strait of Gibraltar', lat: 35.96, lon: -5.6, continent: 'Europe', difficulty: 2, fact: 'The Strait of Gibraltar connects the Atlantic Ocean to the Mediterranean Sea.', source_url: 'https://en.wikipedia.org/wiki/Strait_of_Gibraltar' },
      { name: 'Sinai Peninsula', lat: 29.5, lon: 33.8, continent: 'Asia', difficulty: 2, fact: 'The Sinai Peninsula serves as a land bridge connecting Asia and Africa.', source_url: 'https://en.wikipedia.org/wiki/Sinai_Peninsula' },
      { name: 'Baja California', lat: 28.0, lon: -113.5, continent: 'North America', difficulty: 3, fact: 'Baja California separates the Pacific Ocean from the Gulf of California.', source_url: 'https://en.wikipedia.org/wiki/Baja_California_Peninsula' },
      { name: 'Bosphorus Strait', lat: 41.1, lon: 29.05, continent: 'Europe', difficulty: 3, fact: 'The Bosphorus Strait forms part of the continental boundary between Europe and Asia.', source_url: 'https://en.wikipedia.org/wiki/Bosphorus' },
      { name: 'Cape of Good Hope', lat: -34.35, lon: 18.49, continent: 'Africa', difficulty: 4, fact: 'The Cape of Good Hope marks the point where ships begin to travel more eastward than southward.', source_url: 'https://en.wikipedia.org/wiki/Cape_of_Good_Hope' },
    ];
    for (let r = 1; r <= 5; r++) {
      const s = fallbackSpots[r - 1];
      await db
        .prepare(
          `INSERT OR IGNORE INTO rounds (id, puzzle_date, round_number, name, fact, source_url, lat, lon, continent, difficulty, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(`${dateStr}_${r}`, dateStr, r, s.name, s.fact, s.source_url, s.lat, s.lon, s.continent, s.difficulty, nowMs)
        .run();
    }
  }

  const newSession: SessionRecord = {
    id: sessionId,
    puzzle_date: dateStr,
    current_round: 1,
    round_started_at: null,
    hints_used: 0,
    total_score: 0,
    ip_hash: ipHash,
    status: 'active',
    started_at: nowMs,
    finished_at: null,
  };

  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_date, current_round, round_started_at, hints_used, total_score, ip_hash, status, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newSession.id,
      newSession.puzzle_date,
      newSession.current_round,
      newSession.round_started_at,
      newSession.hints_used,
      newSession.total_score,
      newSession.ip_hash,
      newSession.status,
      newSession.started_at,
      newSession.finished_at
    )
    .run();

  return newSession;
}

/**
 * Marks round start time for the current round in a session.
 */
export async function updateSessionStartRound(
  db: D1Database,
  sessionId: string,
  roundNumber: number,
  nowMs: number = Date.now()
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET current_round = ?, round_started_at = ?, hints_used = 0 WHERE id = ?')
    .bind(roundNumber, nowMs, sessionId)
    .run();
}

/**
 * Increments hintsUsed count (max 2) for current round.
 */
export async function incrementHintsUsed(
  db: D1Database,
  sessionId: string
): Promise<number> {
  const session = await db
    .prepare('SELECT hints_used FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ hints_used: number }>();

  const currentHints = session?.hints_used ?? 0;
  if (currentHints >= 2) return 2;

  const nextHints = currentHints + 1;
  await db
    .prepare('UPDATE sessions SET hints_used = ? WHERE id = ?')
    .bind(nextHints, sessionId)
    .run();

  return nextHints;
}

/**
 * Records a guess attempt in the database.
 */
export async function recordGuess(
  db: D1Database,
  guess: GuessRecord
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO guesses (session_id, puzzle_date, round_number, guess_lat, guess_lon, distance_km, points, hints_used, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      guess.session_id,
      guess.puzzle_date,
      guess.round_number,
      guess.guess_lat,
      guess.guess_lon,
      guess.distance_km,
      guess.points,
      guess.hints_used,
      guess.duration_ms,
      guess.created_at
    )
    .run();

  // Advance session round and add score
  const nextRound = guess.round_number + 1;
  const isFinished = guess.round_number >= 5;

  await db
    .prepare(
      `UPDATE sessions 
       SET current_round = ?, 
           total_score = total_score + ?,
           status = ?,
           finished_at = ?
       WHERE id = ?`
    )
    .bind(
      nextRound,
      guess.points,
      isFinished ? 'finished' : 'active',
      isFinished ? guess.created_at : null,
      guess.session_id
    )
    .run();
}

/**
 * Retrieves all guesses made in a session.
 */
export async function getGuessesForSession(
  db: D1Database,
  sessionId: string
): Promise<GuessRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM guesses WHERE session_id = ? ORDER BY round_number ASC')
    .bind(sessionId)
    .all<GuessRecord>();
  return results || [];
}

/**
 * Calculates player percentile for a given date based on total score.
 */
export async function calculatePercentile(
  db: D1Database,
  dateStr: string,
  totalScore: number
): Promise<number> {
  const scores = (
    await db
      .prepare('SELECT total_score FROM sessions WHERE puzzle_date = ? AND status = "finished"')
      .bind(dateStr)
      .all<{ total_score: number }>()
  ).results || [];

  if (scores.length <= 1) return 100;

  let strictlyLower = 0;
  for (const s of scores) {
    if (s.total_score < totalScore) strictlyLower++;
  }

  return Math.round((strictlyLower / (scores.length - 1)) * 100);
}

/**
 * Retrieves yesterday's summary statistics.
 */
export async function getYesterdayStats(
  db: D1Database,
  yesterdayStr: string
): Promise<YesterdayStatsResponse> {
  // 1. Check cached stats
  const cached = await db
    .prepare('SELECT * FROM daily_stats WHERE date = ?')
    .bind(yesterdayStr)
    .first<DailyStats>();

  if (cached && cached.median_score_r1 !== null) {
    const rounds = await getRoundsForDate(db, yesterdayStr);
    const hardestRoundNum = cached.hardest_round || 1;
    const hardestRound = rounds.find((r) => r.round_number === hardestRoundNum);

    return {
      date: yesterdayStr,
      medianScorePerSpot: [
        cached.median_score_r1 ?? 0,
        cached.median_score_r2 ?? 0,
        cached.median_score_r3 ?? 0,
        cached.median_score_r4 ?? 0,
        cached.median_score_r5 ?? 0,
      ],
      hardestSpot: hardestRound
        ? {
            round: hardestRoundNum,
            name: hardestRound.name,
            avgScore: cached.median_score_r1 ?? 0,
          }
        : null,
      averageDistanceKm: cached.avg_distance_km ?? 0,
    };
  }

  // 2. Compute on the fly if not yet aggregated
  const guesses = (
    await db
      .prepare('SELECT round_number, points, distance_km FROM guesses WHERE puzzle_date = ?')
      .bind(yesterdayStr)
      .all<{ round_number: number; points: number; distance_km: number }>()
  ).results || [];

  const rounds = await getRoundsForDate(db, yesterdayStr);

  const scoresByRound: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  let totalDist = 0;

  for (const g of guesses) {
    if (scoresByRound[g.round_number]) {
      scoresByRound[g.round_number].push(g.points);
    }
    totalDist += g.distance_km;
  }

  const medians: number[] = [];
  let lowestMedian = Infinity;
  let hardestRoundNum = 1;

  for (let r = 1; r <= 5; r++) {
    const arr = scoresByRound[r].sort((a, b) => a - b);
    let med = 0;
    if (arr.length > 0) {
      const mid = Math.floor(arr.length / 2);
      med = arr.length % 2 === 0 ? Math.round((arr[mid - 1] + arr[mid]) / 2) : arr[mid];
    }
    medians.push(med);
    if (med < lowestMedian) {
      lowestMedian = med;
      hardestRoundNum = r;
    }
  }

  const avgDist = guesses.length > 0 ? Math.round(totalDist / guesses.length) : 0;
  const hardest = rounds.find((r) => r.round_number === hardestRoundNum);

  return {
    date: yesterdayStr,
    medianScorePerSpot: medians,
    hardestSpot: hardest
      ? {
          round: hardestRoundNum,
          name: hardest.name,
          avgScore: lowestMedian === Infinity ? 0 : lowestMedian,
        }
      : null,
    averageDistanceKm: avgDist,
  };
}

/**
 * Inserts or updates a puzzle and its 5 rounds.
 */
export async function insertPuzzleAndRounds(
  db: D1Database,
  puzzle: Puzzle,
  rounds: Round[]
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO puzzles (date, plate, status, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         plate = excluded.plate,
         status = excluded.status`
    )
    .bind(puzzle.date, puzzle.plate, puzzle.status, puzzle.created_at)
    .run();

  for (const r of rounds) {
    await db
      .prepare(
        `INSERT INTO rounds (id, puzzle_date, round_number, name, fact, source_url, lat, lon, continent, difficulty, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           fact = excluded.fact,
           source_url = excluded.source_url,
           lat = excluded.lat,
           lon = excluded.lon,
           continent = excluded.continent,
           difficulty = excluded.difficulty`
      )
      .bind(
        r.id,
        r.puzzle_date,
        r.round_number,
        r.name,
        r.fact,
        r.source_url,
        r.lat,
        r.lon,
        r.continent,
        r.difficulty,
        r.created_at
      )
      .run();
  }
}
