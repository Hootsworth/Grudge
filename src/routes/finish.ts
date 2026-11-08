import type { Env, FinishRequest, FinishResponse } from '../types.ts';
import { getPublishedPuzzleForDate, markSessionFinished } from '../db.ts';
import { calculatePercentile, calculateAvgAttempts } from '../scoring/stats.ts';

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

  // Mark session as finished in DB
  await markSessionFinished(env.DB, sessionId);

  // Score = attempts used (1-4) on solve, or null on loss/unsolved
  const userScore: number | null = session.solved === 1 ? session.attempts_used : null;

  // Retrieve all finished scores for today's puzzle
  const { results: allFinished } = await env.DB
    .prepare('SELECT attempts_used, solved FROM sessions WHERE puzzle_id = ? AND finished = 1')
    .bind(puzzle.id)
    .all<{ attempts_used: number; solved: number }>();

  const scores: Array<number | null> = (allFinished || []).map((s) =>
    s.solved === 1 ? s.attempts_used : null
  );

  // Ensure current user's score is included in calculation
  if (!scores.includes(userScore)) {
    scores.push(userScore);
  }

  const percentile = calculatePercentile(userScore, scores);
  const avgAttempts = calculateAvgAttempts(scores);

  const responsePayload: FinishResponse = {
    attempts: userScore,
    percentile,
    avgAttempts,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
