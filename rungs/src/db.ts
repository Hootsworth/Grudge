// D1 Database helper for Rungs
import type { DailyPuzzle, SessionRecord, RoundProgressRecord } from './types.ts';
import { getDailyLadderPuzzle } from './generator/daily.ts';

/**
 * Ensures daily puzzle row exists in puzzles table.
 */
export async function ensurePuzzle(db: D1Database, dateStr: string): Promise<DailyPuzzle> {
  const existing = await db
    .prepare('SELECT date, plate, ladders_json FROM puzzles WHERE date = ? LIMIT 1')
    .bind(dateStr)
    .first<{ date: string; plate: number; ladders_json: string }>();

  if (existing) {
    return {
      date: existing.date,
      plate: existing.plate,
      ladders: JSON.parse(existing.ladders_json),
    };
  }

  const generated = getDailyLadderPuzzle(dateStr);
  await db
    .prepare('INSERT OR IGNORE INTO puzzles (date, plate, ladders_json, status, created_at) VALUES (?, ?, ?, "live", ?)')
    .bind(generated.date, generated.plate, JSON.stringify(generated.ladders), Date.now())
    .run();

  return generated;
}

/**
 * Creates or fetches an anonymous player session.
 */
export async function createOrGetSession(
  db: D1Database,
  sessionId: string,
  dateStr: string,
  nowMs: number = Date.now()
): Promise<SessionRecord> {
  await ensurePuzzle(db, dateStr);

  const existing = await db
    .prepare('SELECT * FROM sessions WHERE id = ? LIMIT 1')
    .bind(sessionId)
    .first<SessionRecord>();

  if (existing) return existing;

  const newSession: SessionRecord = {
    id: sessionId,
    puzzle_date: dateStr,
    current_round: 1,
    total_strokes: 0,
    total_par: 0,
    status: 'active',
    started_at: nowMs,
    finished_at: null,
  };

  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_date, current_round, total_strokes, total_par, status, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newSession.id,
      newSession.puzzle_date,
      newSession.current_round,
      newSession.total_strokes,
      newSession.total_par,
      newSession.status,
      newSession.started_at,
      newSession.finished_at
    )
    .run();

  return newSession;
}

/**
 * Gets or initializes round progress for a session.
 */
export async function getOrCreateRoundProgress(
  db: D1Database,
  sessionId: string,
  roundNum: number,
  startWord: string,
  targetWord: string,
  par: number
): Promise<RoundProgressRecord> {
  const existing = await db
    .prepare('SELECT * FROM round_progress WHERE session_id = ? AND round_number = ? LIMIT 1')
    .bind(sessionId, roundNum)
    .first<RoundProgressRecord>();

  if (existing) return existing;

  const initialPath = JSON.stringify([startWord]);
  await db
    .prepare(
      `INSERT INTO round_progress (session_id, round_number, start_word, target_word, par, strokes, path_json, solved, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?)`
    )
    .bind(sessionId, roundNum, startWord, targetWord, par, initialPath, Date.now())
    .run();

  return {
    id: 0,
    session_id: sessionId,
    round_number: roundNum,
    start_word: startWord,
    target_word: targetWord,
    par,
    strokes: 0,
    path_json: initialPath,
    solved: 0,
    updated_at: Date.now(),
  };
}

/**
 * Updates round progress after a valid step or hint.
 */
export async function updateRoundProgress(
  db: D1Database,
  sessionId: string,
  roundNum: number,
  strokes: number,
  path: string[],
  solved: boolean
): Promise<void> {
  await db
    .prepare(
      `UPDATE round_progress 
       SET strokes = ?, path_json = ?, solved = ?, updated_at = ?
       WHERE session_id = ? AND round_number = ?`
    )
    .bind(strokes, JSON.stringify(path), solved ? 1 : 0, Date.now(), sessionId, roundNum)
    .run();
}

/**
 * Updates session upon completing a ladder round.
 */
export async function advanceSessionRound(
  db: D1Database,
  sessionId: string,
  completedRound: number,
  roundStrokes: number,
  roundPar: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions 
       SET current_round = ?, total_strokes = total_strokes + ?, total_par = total_par + ?
       WHERE id = ?`
    )
    .bind(completedRound + 1, roundStrokes, roundPar, sessionId)
    .run();
}

/**
 * Marks session as finished.
 */
export async function finishSession(
  db: D1Database,
  sessionId: string,
  nowMs: number = Date.now()
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET status = "finished", finished_at = ? WHERE id = ?')
    .bind(nowMs, sessionId)
    .run();
}
