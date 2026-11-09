import type {
  PuzzleRecord,
  RoundRecord,
  SessionRecord,
  OrganismRecord,
  DivergenceRecord,
} from './types.ts';
import { ORGANISMS_LIST } from './backlog/organismsData.ts';

export async function getPublishedPuzzleForDate(db: D1Database, dateStr: string): Promise<PuzzleRecord | null> {
  const puzzle = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? AND status = "published" LIMIT 1')
    .bind(dateStr)
    .first<PuzzleRecord>();

  if (!puzzle) return null;

  const rounds = await getPuzzleRounds(db, puzzle.id);
  return {
    ...puzzle,
    rounds,
  };
}

export async function getPendingPuzzleForDate(db: D1Database, dateStr: string): Promise<PuzzleRecord | null> {
  const puzzle = await db
    .prepare('SELECT * FROM puzzles WHERE date = ? AND status = "pending" LIMIT 1')
    .bind(dateStr)
    .first<PuzzleRecord>();

  if (!puzzle) return null;

  const rounds = await getPuzzleRounds(db, puzzle.id);
  return {
    ...puzzle,
    rounds,
  };
}

export async function getPuzzleRounds(db: D1Database, puzzleId: string): Promise<RoundRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT r.*,
              oa.common_name as a_name, oa.scientific_name as a_latin,
              ob.common_name as b_name, ob.scientific_name as b_latin,
              oc.common_name as c_name, oc.scientific_name as c_latin
       FROM rounds r
       JOIN organisms oa ON r.org_a = oa.id
       JOIN organisms ob ON r.org_b = ob.id
       JOIN organisms oc ON r.org_c = oc.id
       WHERE r.puzzle_id = ?
       ORDER BY r.round_number ASC`
    )
    .bind(puzzleId)
    .all<any>();

  return (results || []).map((r) => ({
    id: r.id,
    puzzle_id: r.puzzle_id,
    round_number: r.round_number,
    org_a: r.org_a,
    org_b: r.org_b,
    org_c: r.org_c,
    t1: r.t1,
    t2: r.t2,
    ci1_low: r.ci1_low,
    ci1_high: r.ci1_high,
    ci2_low: r.ci2_low,
    ci2_high: r.ci2_high,
    counterintuitive_score: r.counterintuitive_score,
    fact: r.fact,
    orgAData: { id: r.org_a, common_name: r.a_name, scientific_name: r.a_latin, familiarity: 5, category: '', body_plan: '' },
    orgBData: { id: r.org_b, common_name: r.b_name, scientific_name: r.b_latin, familiarity: 5, category: '', body_plan: '' },
    orgCData: { id: r.org_c, common_name: r.c_name, scientific_name: r.c_latin, familiarity: 5, category: '', body_plan: '' },
  }));
}

export async function savePuzzleWithRounds(
  db: D1Database,
  puzzle: PuzzleRecord,
  rounds: RoundRecord[]
): Promise<void> {
  const orgStatements: D1PreparedStatement[] = [];
  const orgMap = new Map(ORGANISMS_LIST.map((o) => [o.id, o]));

  const neededOrgIds = new Set<string>();
  for (const r of rounds) {
    neededOrgIds.add(r.org_a);
    neededOrgIds.add(r.org_b);
    neededOrgIds.add(r.org_c);
  }

  for (const orgId of neededOrgIds) {
    const o = orgMap.get(orgId) || {
      id: orgId,
      name: orgId.replace('org_', '').replace('_', ' '),
      latin: orgId,
      taxid: 0,
      fam: 5,
      cat: 'Organism',
      body: 'Standard',
    };
    orgStatements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO organisms (id, common_name, scientific_name, ncbi_taxid, familiarity, category, body_plan)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(o.id, o.name, o.latin, o.taxid || null, o.fam || 5, o.cat || 'Organism', o.body || 'Standard')
    );
  }

  if (orgStatements.length > 0) {
    await db.batch(orgStatements);
  }

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT OR REPLACE INTO puzzles (id, date, plate, status, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        puzzle.id,
        puzzle.date,
        puzzle.plate,
        puzzle.status,
        puzzle.created_at,
        puzzle.published_at || null
      ),
  ];

  for (const r of rounds) {
    statements.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          r.id,
          puzzle.id,
          r.round_number,
          r.org_a,
          r.org_b,
          r.org_c,
          r.t1,
          r.t2,
          r.ci1_low,
          r.ci1_high,
          r.ci2_low,
          r.ci2_high,
          r.counterintuitive_score,
          r.fact
        )
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
    .first<SessionRecord>();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES (?, ?, ?, NULL, 1, 0, 0, 0)`
    )
    .bind(sessionId, puzzleId, now)
    .run();

  return {
    id: sessionId,
    puzzle_id: puzzleId,
    created_at: now,
    last_answer_at: null,
    current_round: 1,
    score_total_mya: 0,
    deepest_mya: 0,
    finished: 0,
  };
}

export async function getSessionAnswerForRound(
  db: D1Database,
  sessionId: string,
  roundId: string
): Promise<any | null> {
  return await db
    .prepare('SELECT * FROM answers WHERE session_id = ? AND round_id = ?')
    .bind(sessionId, roundId)
    .first<any>();
}

export async function recordAnswerAndUpdateSession(
  db: D1Database,
  sessionId: string,
  puzzleId: string,
  roundId: string,
  roundNumber: number,
  chosenPair: [string, string],
  isCorrect: boolean,
  roundT2: number
): Promise<void> {
  const answerId = crypto.randomUUID();
  const now = Date.now();

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        answerId,
        sessionId,
        puzzleId,
        roundId,
        roundNumber,
        JSON.stringify(chosenPair),
        isCorrect ? 1 : 0,
        now
      ),
    db
      .prepare(
        `UPDATE sessions
         SET current_round = current_round + 1,
             last_answer_at = ?,
             score_total_mya = score_total_mya + ?,
             deepest_mya = MAX(deepest_mya, ?),
             finished = CASE WHEN current_round >= 5 THEN 1 ELSE 0 END
         WHERE id = ?`
      )
      .bind(
        now,
        isCorrect ? roundT2 : 0,
        isCorrect ? roundT2 : 0,
        sessionId
      ),
  ];

  await db.batch(statements);
}

export async function getHistoryOrganismsAndTriplets(
  db: D1Database
): Promise<{ usedOrganismsLast30Days: Set<string>; usedTripletsLast365Days: Set<string> }> {
  const now = Date.now();
  const cutoff30Days = now - 30 * 86400 * 1000;
  const cutoff365Days = now - 365 * 86400 * 1000;

  const { results: recent30 } = await db
    .prepare(
      `SELECT r.org_a, r.org_b, r.org_c FROM rounds r
       JOIN puzzles p ON r.puzzle_id = p.id
       WHERE p.created_at >= ?`
    )
    .bind(cutoff30Days)
    .all<{ org_a: string; org_b: string; org_c: string }>();

  const usedOrganisms = new Set<string>();
  for (const r of recent30 || []) {
    usedOrganisms.add(r.org_a);
    usedOrganisms.add(r.org_b);
    usedOrganisms.add(r.org_c);
  }

  const { results: recent365 } = await db
    .prepare(
      `SELECT r.org_a, r.org_b, r.org_c FROM rounds r
       JOIN puzzles p ON r.puzzle_id = p.id
       WHERE p.created_at >= ?`
    )
    .bind(cutoff365Days)
    .all<{ org_a: string; org_b: string; org_c: string }>();

  const usedTriplets = new Set<string>();
  for (const r of recent365 || []) {
    const key = [r.org_a, r.org_b, r.org_c].sort().join(':');
    usedTriplets.add(key);
  }

  return { usedOrganismsLast30Days: usedOrganisms, usedTripletsLast365Days: usedTriplets };
}
