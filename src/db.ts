import type { Puzzle, PuzzleEvent, SessionRecord, GuessRecord } from './types.ts';

export function formatEventYear(year: number, precision: 'exact' | 'approximate'): string {
  const prefix = precision === 'approximate' ? 'c. ' : '';
  if (year < 0) {
    return `${prefix}${Math.abs(year)} BCE`;
  }
  return `${prefix}${year}`;
}

export async function getPublishedPuzzleForDate(db: D1Database, dateStr: string): Promise<Puzzle | null> {
  const row = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? AND status = "published" LIMIT 1')
    .bind(dateStr)
    .first<any>();

  if (!row) return null;

  const events = await getPuzzleEvents(db, row.id);
  return {
    id: row.id,
    date: row.date,
    plate: row.plate,
    theme: row.theme,
    spread_type: row.spread_type,
    status: row.status,
    created_at: row.created_at,
    published_at: row.published_at,
    events,
  };
}

export async function getPendingPuzzleForDate(db: D1Database, dateStr: string): Promise<Puzzle | null> {
  const row = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? AND status = "pending" LIMIT 1')
    .bind(dateStr)
    .first<any>();

  if (!row) return null;

  const events = await getPuzzleEvents(db, row.id);
  return {
    id: row.id,
    date: row.date,
    plate: row.plate,
    theme: row.theme,
    spread_type: row.spread_type,
    status: row.status,
    created_at: row.created_at,
    published_at: row.published_at,
    events,
  };
}

export async function getPuzzleEvents(db: D1Database, puzzleId: string): Promise<PuzzleEvent[]> {
  const { results } = await db
    .prepare('SELECT * FROM events WHERE puzzle_id = ? ORDER BY true_order ASC')
    .bind(puzzleId)
    .all<any>();

  return (results || []).map((r) => ({
    id: r.id,
    puzzle_id: r.puzzle_id,
    text: r.text,
    year: r.year,
    precision: r.precision,
    source: r.source,
    true_order: r.true_order,
  }));
}

export async function savePuzzleWithEvents(db: D1Database, puzzle: Puzzle, events: PuzzleEvent[]): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT OR REPLACE INTO puzzles (id, date, plate, theme, spread_type, status, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        puzzle.id,
        puzzle.date,
        puzzle.plate,
        puzzle.theme,
        puzzle.spread_type,
        puzzle.status,
        puzzle.created_at,
        puzzle.published_at || null
      ),
  ];

  for (const ev of events) {
    statements.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(ev.id, puzzle.id, ev.text, ev.year, ev.precision, ev.source, ev.true_order ?? 0)
    );
  }

  await db.batch(statements);
}

export async function publishPuzzle(db: D1Database, puzzleId: string): Promise<void> {
  await db
    .prepare('UPDATE puzzles SET status = "published", published_at = ? WHERE id = ?')
    .bind(Date.now(), puzzleId)
    .run();
}

export async function vetoPuzzle(db: D1Database, puzzleId: string): Promise<void> {
  await db
    .prepare('UPDATE puzzles SET status = "vetoed" WHERE id = ?')
    .bind(puzzleId)
    .run();
}

export async function getOrCreateSession(
  db: D1Database,
  sessionId: string,
  puzzleId: string
): Promise<SessionRecord> {
  const existing = await db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<any>();

  if (existing) {
    return {
      id: existing.id,
      puzzle_id: existing.puzzle_id,
      created_at: existing.created_at,
      last_guess_at: existing.last_guess_at,
      attempts_used: existing.attempts_used,
      locked_json: existing.locked_json,
      solved: existing.solved,
      finished: existing.finished,
    };
  }

  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES (?, ?, ?, NULL, 0, '[]', 0, 0)`
    )
    .bind(sessionId, puzzleId, now)
    .run();

  return {
    id: sessionId,
    puzzle_id: puzzleId,
    created_at: now,
    last_guess_at: null,
    attempts_used: 0,
    locked_json: '[]',
    solved: 0,
    finished: 0,
  };
}

export async function recordGuessAndUpdateSession(
  db: D1Database,
  sessionId: string,
  puzzleId: string,
  attemptNumber: number,
  orderIds: string[],
  correctBools: boolean[],
  lockedIds: string[],
  isSolved: boolean,
  isFinished: boolean
): Promise<void> {
  const guessId = crypto.randomUUID();
  const now = Date.now();

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        guessId,
        sessionId,
        puzzleId,
        attemptNumber,
        JSON.stringify(orderIds),
        JSON.stringify(correctBools),
        now
      ),
    db
      .prepare(
        `UPDATE sessions
         SET attempts_used = ?,
             locked_json = ?,
             last_guess_at = ?,
             solved = ?,
             finished = ?
         WHERE id = ?`
      )
      .bind(
        attemptNumber,
        JSON.stringify(lockedIds),
        now,
        isSolved ? 1 : 0,
        isFinished ? 1 : 0,
        sessionId
      ),
  ];

  await db.batch(statements);
}

export async function markSessionFinished(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare('UPDATE sessions SET finished = 1 WHERE id = ?')
    .bind(sessionId)
    .run();
}

export async function getRecentEventTexts(db: D1Database, days: number = 120): Promise<string[]> {
  const cutoffTime = Date.now() - days * 86400 * 1000;
  const { results } = await db
    .prepare(
      `SELECT e.text FROM events e
       JOIN puzzles p ON e.puzzle_id = p.id
       WHERE p.created_at >= ?`
    )
    .bind(cutoffTime)
    .all<{ text: string }>();

  return (results || []).map((r) => r.text);
}
