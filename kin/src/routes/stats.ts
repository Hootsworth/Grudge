import type { Env, YesterdayStatsResponse } from '../types.ts';
import { getPublishedPuzzleForDate } from '../db.ts';

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
      solveRatePerRound: JSON.parse(cached.solve_rate_rounds_json),
      mostCommonWrongPairing: cached.most_common_wrong_pair_json
        ? JSON.parse(cached.most_common_wrong_pair_json)
        : null,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // 2. Compute on the fly if not yet cached
  const puzzle = await getPublishedPuzzleForDate(env.DB, yesterdayStr);
  if (!puzzle || !puzzle.rounds) {
    const emptyPayload: YesterdayStatsResponse = {
      date: yesterdayStr,
      solveRatePerRound: [0, 0, 0, 0, 0],
      mostCommonWrongPairing: null,
    };
    return new Response(JSON.stringify(emptyPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate solve rate per round
  const solveRatePerRound: number[] = [];
  for (let r = 1; r <= 5; r++) {
    const targetRound = puzzle.rounds.find((rnd) => rnd.round_number === r);
    if (!targetRound) {
      solveRatePerRound.push(0);
      continue;
    }

    const { results } = await env.DB
      .prepare('SELECT correct FROM answers WHERE round_id = ?')
      .bind(targetRound.id)
      .all<{ correct: number }>();

    const total = (results || []).length;
    const correctCount = (results || []).filter((a) => a.correct === 1).length;
    const rate = total > 0 ? Math.round((correctCount / total) * 1000) / 1000 : 0;
    solveRatePerRound.push(rate);
  }

  // Find most common wrong pairing across yesterday's incorrect answers
  const { results: wrongAnswers } = await env.DB
    .prepare('SELECT round_number, chosen_pair_json FROM answers WHERE puzzle_id = ? AND correct = 0')
    .bind(puzzle.id)
    .all<{ round_number: number; chosen_pair_json: string }>();

  let mostCommonWrongPairing: { roundIndex: number; pairNames: [string, string]; count: number } | null = null;
  const pairCounts = new Map<string, { count: number; round: number; pair: [string, string] }>();

  for (const row of wrongAnswers || []) {
    try {
      const pair = (JSON.parse(row.chosen_pair_json) as string[]).sort();
      const key = `${row.round_number}:${pair.join(':')}`;
      const entry = pairCounts.get(key) || { count: 0, round: row.round_number, pair: [pair[0], pair[1]] };
      entry.count++;
      pairCounts.set(key, entry);
    } catch {}
  }

  let maxWrongCount = 0;
  for (const item of pairCounts.values()) {
    if (item.count > maxWrongCount) {
      maxWrongCount = item.count;
      mostCommonWrongPairing = {
        roundIndex: item.round,
        pairNames: item.pair,
        count: item.count,
      };
    }
  }

  const responsePayload: YesterdayStatsResponse = {
    date: yesterdayStr,
    solveRatePerRound,
    mostCommonWrongPairing,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  });
}
