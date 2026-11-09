// Route: POST /api/finish
import type { Env, FinishResponse } from '../types.ts';
import {
  createOrGetSession,
  getGuessesForSession,
  getRoundsForDate,
  calculatePercentile,
} from '../db.ts';
import { getRankTitle } from '../scoring.ts';
import { hashIp } from '../rate_limit.ts';

export async function handleFinishRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  let body: { session?: string };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);
  const guesses = await getGuessesForSession(env.DB, sessionId);

  if (guesses.length < 5) {
    return new Response(
      JSON.stringify({
        error: `Session has completed ${guesses.length} of 5 rounds. Finish all rounds before requesting results.`,
        completedRounds: guesses.length,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const rounds = await getRoundsForDate(env.DB, session.puzzle_date);
  const roundMap = new Map(rounds.map((r) => [r.round_number, r.name]));

  let totalScore = 0;
  const perRound = guesses.map((g) => {
    totalScore += g.points;
    return {
      round: g.round_number,
      name: roundMap.get(g.round_number) || `Mystery Spot #${g.round_number}`,
      points: g.points,
      distanceKm: g.distance_km,
      hintsUsed: g.hints_used,
    };
  });

  const rank = getRankTitle(totalScore);
  const percentile = await calculatePercentile(env.DB, session.puzzle_date, totalScore);

  const payload: FinishResponse = {
    total: totalScore,
    perRound,
    rank,
    percentile,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
