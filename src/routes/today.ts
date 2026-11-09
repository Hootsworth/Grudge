import type { Env, TodayResponse } from '../types.ts';
import { getPublishedPuzzleForDate, savePuzzleWithEvents, publishPuzzle } from '../db.ts';
import { getBacklogPuzzleForDate } from '../puzzle/backlog.ts';

/**
 * Deterministic pseudo-random shuffle seeded by puzzle date.
 * Ensures all players receive the same shuffled layout, but never in true chronological order.
 */
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
    // If not published yet, automatically deploy today's backlog puzzle
    console.warn(`[Strata] No published puzzle found for ${todayStr}. Deploying backlog fallback.`);
    const backlog = getBacklogPuzzleForDate(todayStr);
    await savePuzzleWithEvents(env.DB, backlog.puzzle, backlog.events);
    await publishPuzzle(env.DB, backlog.puzzle.id);
    puzzle = backlog.puzzle;
  }

  const rawEvents = puzzle.events || [];
  if (rawEvents.length !== 6) {
    return new Response(JSON.stringify({ error: 'Corrupt puzzle payload' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Map to client-safe representation: ID and text ONLY (no years or sources)
  const clientEvents = rawEvents.map((e) => ({
    id: e.id,
    text: e.text,
  }));

  // Deterministically shuffle with date seed
  let shuffled = seededShuffle(clientEvents, todayStr);

  // Guard: if shuffled matches true order exactly, swap two elements
  const trueIds = rawEvents.map((e) => e.id);
  if (shuffled.every((e, idx) => e.id === trueIds[idx])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  const responsePayload: TodayResponse = {
    date: puzzle.date,
    plate: puzzle.plate,
    events: shuffled,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
