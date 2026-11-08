import type { Env, YesterdayStatsResponse } from '../types.ts';
import { getPublishedPuzzleForDate, getPuzzleEvents } from '../db.ts';
import { findHardestPair, calculateAvgAttempts } from '../scoring/stats.ts';

export async function handleStatsYesterdayRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const yesterday = new Date(Date.now() - 86400 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 1. Check daily_stats cache table
  const cached = await env.DB
    .prepare('SELECT * FROM daily_stats WHERE date = ?')
    .bind(yesterdayStr)
    .first<any>();

  if (cached) {
    const payload: YesterdayStatsResponse = {
      date: cached.date,
      solveRate: cached.solve_rate,
      avgAttempts: cached.avg_attempts,
      hardestPair: cached.hardest_pair_json ? JSON.parse(cached.hardest_pair_json) : null,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // 2. Compute on the fly if not cached yet
  const puzzle = await getPublishedPuzzleForDate(env.DB, yesterdayStr);
  if (!puzzle) {
    const emptyPayload: YesterdayStatsResponse = {
      date: yesterdayStr,
      solveRate: 0,
      avgAttempts: 0,
      hardestPair: null,
    };
    return new Response(JSON.stringify(emptyPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const events = await getPuzzleEvents(env.DB, puzzle.id);
  const sortedEvents = [...events].sort((a, b) => b.year - a.year);

  const { results: sessions } = await env.DB
    .prepare('SELECT attempts_used, solved FROM sessions WHERE puzzle_id = ? AND finished = 1')
    .bind(puzzle.id)
    .all<{ attempts_used: number; solved: number }>();

  const totalPlayers = (sessions || []).length;
  const totalSolves = (sessions || []).filter((s) => s.solved === 1).length;
  const solveRate = totalPlayers > 0 ? Math.round((totalSolves / totalPlayers) * 1000) / 1000 : 0;

  const finishedScores: Array<number | null> = (sessions || []).map((s) =>
    s.solved === 1 ? s.attempts_used : null
  );
  const avgAttempts = calculateAvgAttempts(finishedScores);

  const { results: guessRows } = await env.DB
    .prepare('SELECT order_json FROM guesses WHERE puzzle_id = ?')
    .bind(puzzle.id)
    .all<{ order_json: string }>();

  const guessOrders = (guessRows || []).map((r) => {
    try {
      return JSON.parse(r.order_json) as string[];
    } catch {
      return [];
    }
  }).filter((ord) => ord.length === 6);

  const hardestPair = findHardestPair(guessOrders, sortedEvents);

  const responsePayload: YesterdayStatsResponse = {
    date: yesterdayStr,
    solveRate,
    avgAttempts,
    hardestPair,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
