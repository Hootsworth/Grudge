// quipher/src/db.ts

import type { QuoteRecord, SessionRecord, YesterdayStatsResponse } from './types.ts';
import { BACKLOG_QUOTES } from './backlog/backlog.ts';

export async function getQuoteForDate(
  db: D1Database,
  dateStr: string
): Promise<QuoteRecord | null> {
  const row = await db
    .prepare('SELECT * FROM quotes WHERE puzzle_date = ?')
    .bind(dateStr)
    .first<any>();

  if (!row) return null;

  return {
    id: row.id,
    puzzle_date: row.puzzle_date,
    plate: row.plate,
    plaintext: row.plaintext,
    author: row.author,
    source: row.source,
    year: row.year,
    ciphertext: row.ciphertext,
    cipher_key: row.cipher_key,
    difficulty: row.difficulty,
    entropy: row.entropy,
    created_at: row.created_at,
  };
}

export async function saveQuote(db: D1Database, quote: QuoteRecord): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO quotes (
        id, puzzle_date, plate, plaintext, author, source, year,
        ciphertext, cipher_key, difficulty, entropy, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      quote.id,
      quote.puzzle_date,
      quote.plate,
      quote.plaintext,
      quote.author,
      quote.source,
      quote.year,
      quote.ciphertext,
      quote.cipher_key,
      quote.difficulty,
      quote.entropy,
      quote.created_at
    )
    .run();
}

export async function ensureQuoteForDate(
  db: D1Database,
  dateStr: string
): Promise<QuoteRecord> {
  let quote = await getQuoteForDate(db, dateStr);
  if (quote) return quote;

  // Fallback to pre-approved backlog
  const backlogMatch =
    BACKLOG_QUOTES.find((q) => q.date === dateStr) ||
    BACKLOG_QUOTES[Math.abs(hashString(dateStr)) % BACKLOG_QUOTES.length];

  const now = Date.now();
  quote = {
    id: `quote_${dateStr.replace(/-/g, '')}`,
    puzzle_date: dateStr,
    plate: backlogMatch.plate,
    plaintext: backlogMatch.plaintext,
    author: backlogMatch.author,
    source: backlogMatch.source,
    year: backlogMatch.year,
    ciphertext: backlogMatch.ciphertext,
    cipher_key: JSON.stringify(backlogMatch.cipher_key),
    difficulty: backlogMatch.difficulty,
    entropy: backlogMatch.entropy,
    created_at: now,
  };

  try {
    await saveQuote(db, quote);
  } catch (e) {
    // If concurrent insert occurred, fetch existing
    const existing = await getQuoteForDate(db, dateStr);
    if (existing) return existing;
  }

  return quote;
}

export async function createOrGetSession(
  db: D1Database,
  sessionId: string,
  dateStr: string,
  ipHash: string,
  now: number
): Promise<SessionRecord> {
  const existing = await db
    .prepare('SELECT * FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .first<any>();

  if (existing) {
    if (existing.puzzle_date === dateStr) {
      return {
        session_id: existing.session_id,
        puzzle_date: existing.puzzle_date,
        ip_hash: existing.ip_hash,
        started_at: existing.started_at,
        solved_at: existing.solved_at,
        solve_seconds: existing.solve_seconds,
        checks_count: existing.checks_count,
        hints_count: existing.hints_count,
        last_check_at: existing.last_check_at || 0,
        score: existing.score,
        rank_title: existing.rank_title,
        status: existing.status,
        flagged_reason: existing.flagged_reason,
        created_at: existing.created_at,
      };
    }

    // Reset session for today's date
    await db
      .prepare(
        `UPDATE sessions SET
          puzzle_date = ?, ip_hash = ?, started_at = ?, solved_at = NULL,
          solve_seconds = NULL, checks_count = 0, hints_count = 0,
          last_check_at = 0, score = NULL, rank_title = NULL, status = 'in_progress',
          flagged_reason = NULL
        WHERE session_id = ?`
      )
      .bind(dateStr, ipHash, now, sessionId)
      .run();

    return {
      session_id: existing.session_id,
      puzzle_date: dateStr,
      ip_hash: ipHash,
      started_at: now,
      solved_at: null,
      solve_seconds: null,
      checks_count: 0,
      hints_count: 0,
      last_check_at: 0,
      score: null,
      rank_title: null,
      status: 'in_progress',
      flagged_reason: null,
      created_at: existing.created_at,
    };
  }

  await db
    .prepare(
      `INSERT INTO sessions (
        session_id, puzzle_date, ip_hash, started_at, checks_count,
        hints_count, last_check_at, status, created_at
      ) VALUES (?, ?, ?, ?, 0, 0, 0, 'in_progress', ?)`
    )
    .bind(sessionId, dateStr, ipHash, now, now)
    .run();

  return {
    session_id: sessionId,
    puzzle_date: dateStr,
    ip_hash: ipHash,
    started_at: now,
    solved_at: null,
    solve_seconds: null,
    checks_count: 0,
    hints_count: 0,
    last_check_at: 0,
    score: null,
    rank_title: null,
    status: 'in_progress',
    flagged_reason: null,
    created_at: now,
  };
}

export async function recordCheck(
  db: D1Database,
  sessionId: string,
  puzzleDate: string,
  now: number,
  mapping: Record<string, string>
): Promise<number> {
  await db
    .prepare(
      'UPDATE sessions SET checks_count = checks_count + 1, last_check_at = ? WHERE session_id = ?'
    )
    .bind(now, sessionId)
    .run();

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      'INSERT INTO events (id, session_id, puzzle_date, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(eventId, sessionId, puzzleDate, 'check', JSON.stringify({ mapping }), now)
    .run();

  const session = await db
    .prepare('SELECT checks_count FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .first<{ checks_count: number }>();

  return session?.checks_count ?? 1;
}

export async function recordHint(
  db: D1Database,
  sessionId: string,
  puzzleDate: string,
  cipherLetter: string,
  plainLetter: string,
  now: number
): Promise<number> {
  await db
    .prepare('UPDATE sessions SET hints_count = hints_count + 1 WHERE session_id = ?')
    .bind(sessionId)
    .run();

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      'INSERT INTO events (id, session_id, puzzle_date, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(
      eventId,
      sessionId,
      puzzleDate,
      'hint',
      JSON.stringify({ cipherLetter, plainLetter }),
      now
    )
    .run();

  const session = await db
    .prepare('SELECT hints_count FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .first<{ hints_count: number }>();

  return session?.hints_count ?? 1;
}

export async function recordSolve(
  db: D1Database,
  sessionId: string,
  solveSeconds: number,
  score: number,
  rankTitle: string,
  status: 'solved' | 'flagged',
  flaggedReason: string | null,
  now: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions SET
        solved_at = ?,
        solve_seconds = ?,
        score = ?,
        rank_title = ?,
        status = ?,
        flagged_reason = ?
      WHERE session_id = ?`
    )
    .bind(now, solveSeconds, score, rankTitle, status, flaggedReason, sessionId)
    .run();
}

export async function getSolvedScoresForDate(
  db: D1Database,
  dateStr: string
): Promise<number[]> {
  const { results } = await db
    .prepare(
      "SELECT score FROM sessions WHERE puzzle_date = ? AND status = 'solved' AND score IS NOT NULL"
    )
    .bind(dateStr)
    .all<{ score: number }>();

  return (results || []).map((r) => r.score);
}

export async function getRecentCheckEvents(
  db: D1Database,
  sessionId: string
): Promise<{ mapping: Record<string, string>; timestamp: number }[]> {
  const { results } = await db
    .prepare(
      "SELECT payload_json, created_at FROM events WHERE session_id = ? AND event_type = 'check' ORDER BY created_at ASC"
    )
    .bind(sessionId)
    .all<{ payload_json: string; created_at: number }>();

  if (!results) return [];

  return results.map((r) => {
    try {
      const data = JSON.parse(r.payload_json);
      return { mapping: data.mapping || {}, timestamp: r.created_at };
    } catch {
      return { mapping: {}, timestamp: r.created_at };
    }
  });
}

export async function getYesterdayStats(
  db: D1Database,
  yesterdayDate: string
): Promise<YesterdayStatsResponse> {
  // Check if daily_stats cached
  const cached = await db
    .prepare('SELECT * FROM daily_stats WHERE puzzle_date = ?')
    .bind(yesterdayDate)
    .first<any>();

  if (cached && cached.total_sessions > 0) {
    return {
      date: yesterdayDate,
      medianSolveTime: cached.median_solve_time,
      solveRate: cached.solve_rate,
      mostUsedHintLetter: cached.most_used_hint_letter,
      totalSolves: cached.total_solves,
    };
  }

  // Calculate live from sessions and events
  const { results: sessions } = await db
    .prepare('SELECT status, solve_seconds FROM sessions WHERE puzzle_date = ?')
    .bind(yesterdayDate)
    .all<{ status: string; solve_seconds: number | null }>();

  const allSessions = sessions || [];
  const solved = allSessions.filter(
    (s) => s.status === 'solved' && typeof s.solve_seconds === 'number'
  );
  const totalSessions = allSessions.length;
  const totalSolves = solved.length;
  const solveRate =
    totalSessions > 0 ? Math.round((totalSolves / totalSessions) * 1000) / 10 : 0;

  let medianSolveTime: number | null = null;
  if (solved.length > 0) {
    const sorted = solved
      .map((s) => s.solve_seconds as number)
      .sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianSolveTime =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  // Most used hint letter
  const { results: hintEvents } = await db
    .prepare(
      "SELECT payload_json FROM events WHERE puzzle_date = ? AND event_type = 'hint'"
    )
    .bind(yesterdayDate)
    .all<{ payload_json: string }>();

  let mostUsedHintLetter: string | null = null;
  if (hintEvents && hintEvents.length > 0) {
    const counts: Record<string, number> = {};
    for (const h of hintEvents) {
      try {
        const payload = JSON.parse(h.payload_json);
        if (payload.cipherLetter) {
          counts[payload.cipherLetter] = (counts[payload.cipherLetter] || 0) + 1;
        }
      } catch {}
    }
    let max = 0;
    for (const [letter, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        mostUsedHintLetter = letter;
      }
    }
  }

  return {
    date: yesterdayDate,
    medianSolveTime,
    solveRate,
    mostUsedHintLetter,
    totalSolves,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
