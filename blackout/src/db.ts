// D1 Database helper for Blackout
import type { DossierRecord, SessionRecord } from './types.ts';
import { getDailyDossier } from './dossiers.ts';

/**
 * Ensures daily dossier exists in puzzles table.
 */
export async function ensurePuzzle(db: D1Database, dateStr: string): Promise<DossierRecord> {
  const existing = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? LIMIT 1')
    .bind(dateStr)
    .first<{
      date: string;
      plate: number;
      classification: string;
      category: string;
      title: string;
      aliases_json: string;
      year: number;
      excerpt: string;
      citation: string;
    }>();

  if (existing) {
    return {
      id: dateStr,
      date: existing.date,
      plate: existing.plate,
      classification: existing.classification,
      category: existing.category,
      title: existing.title,
      aliases: JSON.parse(existing.aliases_json),
      year: existing.year,
      excerpt: existing.excerpt,
      citation: existing.citation,
    };
  }

  const generated = getDailyDossier(dateStr);
  await db
    .prepare(
      `INSERT OR IGNORE INTO puzzles (date, plate, classification, category, title, aliases_json, year, excerpt, citation, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "live", ?)`
    )
    .bind(
      generated.date,
      generated.plate,
      generated.classification,
      generated.category,
      generated.title,
      JSON.stringify(generated.aliases),
      generated.year || null,
      generated.excerpt,
      generated.citation,
      Date.now()
    )
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
    total_guesses: 0,
    words_guessed_json: '[]',
    tokens_revealed_json: '[]',
    is_solved: 0,
    solved_at: null,
    started_at: nowMs,
    finished_at: null,
  };

  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_date, total_guesses, words_guessed_json, tokens_revealed_json, is_solved, solved_at, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newSession.id,
      newSession.puzzle_date,
      newSession.total_guesses,
      newSession.words_guessed_json,
      newSession.tokens_revealed_json,
      newSession.is_solved,
      newSession.solved_at,
      newSession.started_at,
      newSession.finished_at
    )
    .run();

  return newSession;
}

/**
 * Records a word guess and newly un-redacted token indices.
 */
export async function recordWordGuess(
  db: D1Database,
  sessionId: string,
  word: string,
  newlyRevealedIndices: number[]
): Promise<void> {
  const session = await db
    .prepare('SELECT words_guessed_json, tokens_revealed_json FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ words_guessed_json: string; tokens_revealed_json: string }>();

  if (!session) return;

  const guessedWords: string[] = JSON.parse(session.words_guessed_json || '[]');
  const revealedIndices: number[] = JSON.parse(session.tokens_revealed_json || '[]');

  if (!guessedWords.includes(word)) {
    guessedWords.push(word);
  }

  for (const idx of newlyRevealedIndices) {
    if (!revealedIndices.includes(idx)) {
      revealedIndices.push(idx);
    }
  }

  await db
    .prepare(
      `UPDATE sessions 
       SET total_guesses = total_guesses + 1, words_guessed_json = ?, tokens_revealed_json = ?
       WHERE id = ?`
    )
    .bind(JSON.stringify(guessedWords), JSON.stringify(revealedIndices), sessionId)
    .run();
}

/**
 * Marks session as solved.
 */
export async function recordSolve(
  db: D1Database,
  sessionId: string,
  nowMs: number = Date.now()
): Promise<void> {
  await db
    .prepare(
      `UPDATE sessions 
       SET is_solved = 1, solved_at = ?, finished_at = ?, total_guesses = total_guesses + 1
       WHERE id = ?`
    )
    .bind(nowMs, nowMs, sessionId)
    .run();
}

/**
 * Increments guess count on failed solve attempt.
 */
export async function recordFailedSolve(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare('UPDATE sessions SET total_guesses = total_guesses + 1 WHERE id = ?')
    .bind(sessionId)
    .run();
}
