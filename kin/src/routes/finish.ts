import type { Env, FinishRequest, FinishResponse } from '../types.ts';
import { getPublishedPuzzleForDate } from '../db.ts';
import { getRankTitle, calculatePercentile } from '../scoring.ts';

export async function handleFinishRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: FinishRequest;
  try {
    body = (await request.json()) as FinishRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId } = body;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Field "session" is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const puzzle = await getPublishedPuzzleForDate(env.DB, todayStr);
  if (!puzzle) {
    return new Response(JSON.stringify({ error: 'No active puzzle found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await env.DB
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<any>();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Count correct answers for this session
  const { results: answers } = await env.DB
    .prepare('SELECT correct FROM answers WHERE session_id = ?')
    .bind(sessionId)
    .all<{ correct: number }>();

  const solvedCount = (answers || []).filter((a) => a.correct === 1).length;
  const totalMya = session.score_total_mya || 0;
  const deepestMya = session.deepest_mya || 0;
  const rank = getRankTitle(solvedCount, deepestMya);

  // Mark session finished in DB
  await env.DB
    .prepare('UPDATE sessions SET finished = 1 WHERE id = ?')
    .bind(sessionId)
    .run();

  // Query all finished session scores for today to compute percentile
  const { results: finishedSessions } = await env.DB
    .prepare('SELECT score_total_mya FROM sessions WHERE puzzle_id = ? AND finished = 1')
    .bind(puzzle.id)
    .all<{ score_total_mya: number }>();

  const allScores = (finishedSessions || []).map((s) => s.score_total_mya);
  if (!allScores.includes(totalMya)) {
    allScores.push(totalMya);
  }

  const percentile = calculatePercentile(totalMya, allScores);

  const responsePayload: FinishResponse = {
    totalMya,
    deepestMya,
    rank,
    percentile,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
