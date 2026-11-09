import type { Env, TodayResponse, ClientRound } from '../types.ts';
import { getPublishedPuzzleForDate, savePuzzleWithRounds, publishPuzzle } from '../db.ts';
import { getBacklogPuzzleForDate } from '../backlog/puzzles.ts';

function seededShuffle<T>(items: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const copy = [...items];
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function handleTodayRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const todayStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  let puzzle = await getPublishedPuzzleForDate(env.DB, todayStr);
  if (!puzzle) {
    console.warn(`[Kin] No published puzzle for ${todayStr}. Deploying backlog fallback.`);
    const backlog = getBacklogPuzzleForDate(todayStr);
    await savePuzzleWithRounds(env.DB, backlog.puzzle, backlog.rounds);
    await publishPuzzle(env.DB, backlog.puzzle.id);
    puzzle = await getPublishedPuzzleForDate(env.DB, todayStr);
  }

  if (!puzzle || !puzzle.rounds || puzzle.rounds.length !== 5) {
    return new Response(JSON.stringify({ error: 'Puzzle not available for today.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientRounds: ClientRound[] = puzzle.rounds.map((r, rIdx) => {
    const rawOrgs = [
      { id: r.org_a, name: r.orgAData?.common_name || r.org_a, latin: r.orgAData?.scientific_name || '' },
      { id: r.org_b, name: r.orgBData?.common_name || r.org_b, latin: r.orgBData?.scientific_name || '' },
      { id: r.org_c, name: r.orgCData?.common_name || r.org_c, latin: r.orgCData?.scientific_name || '' },
    ];

    // Seeded shuffle so all players on today see the same initial card order per round
    const shuffledOrgs = seededShuffle(rawOrgs, `${todayStr}-r${rIdx + 1}`);

    return {
      id: r.id,
      roundNumber: r.round_number,
      organisms: shuffledOrgs,
    };
  });

  const responsePayload: TodayResponse = {
    date: puzzle.date,
    plate: puzzle.plate,
    rounds: clientRounds,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
