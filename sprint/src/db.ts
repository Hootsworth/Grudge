// D1 Database helper for Sprint
import type { DailySprintPuzzle, SessionRecord } from './types.ts';
import { getDailySprintPuzzle } from './generator/daily.ts';

/**
 * Ensures daily puzzle row exists in puzzles table.
 */
export async function ensurePuzzle(db: D1Database, dateStr: string): Promise<DailySprintPuzzle> {
  const existing = await db
    .prepare('SELECT date, plate, key_letters, total_words, max_score FROM puzzles WHERE date = ? LIMIT 1')
    .bind(dateStr)
    .first<{ date: string; plate: number; key_letters: string; total_words: number; max_score: number }>();

  if (existing) {
    return {
      date: existing.date,
      plate: existing.plate,
      keyLetters: existing.key_letters,
      totalWords: existing.total_words,
      maxScore: existing.max_score,
    };
  }

  const generated = getDailySprintPuzzle(dateStr);
  await db
    .prepare('INSERT OR IGNORE INTO puzzles (date, plate, key_letters, total_words, max_score, status, created_at) VALUES (?, ?, ?, ?, ?, "live", ?)')
    .bind(generated.date, generated.plate, generated.keyLetters, generated.totalWords, generated.maxScore, Date.now())
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
    score: 0,
    best_combo: 1,
    words_found_json: '[]',
    last_word_at: null,
    status: 'active',
    started_at: nowMs,
    finished_at: null,
  };

  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_date, score, best_combo, words_found_json, last_word_at, status, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newSession.id,
      newSession.puzzle_date,
      newSession.score,
      newSession.best_combo,
      newSession.words_found_json,
      newSession.last_word_at,
      newSession.status,
      newSession.started_at,
      newSession.finished_at
    )
    .run();

  return newSession;
}

/**
 * Updates session after a valid word submission.
 */
export async function recordValidWord(
  db: D1Database,
  sessionId: string,
  points: number,
  currentCombo: number,
  wordsFound: string[],
  nowMs: number = Date.now()
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions 
       SET score = score + ?, best_combo = MAX(best_combo, ?), words_found_json = ?, last_word_at = ?
       WHERE id = ?`
    )
    .bind(points, currentCombo, JSON.stringify(wordsFound), nowMs, sessionId)
    .run();
}

/**
 * Breaks combo if invalid word submitted or time gap exceeds 5 seconds.
 */
export async function breakCombo(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare('UPDATE sessions SET last_word_at = NULL WHERE id = ?')
    .bind(sessionId)
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
