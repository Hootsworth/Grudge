// Route: GET /api/today
import type { Env, TodayResponse } from '../types.ts';
import { ensurePuzzle } from '../db.ts';

export async function handleTodayRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const puzzle = await ensurePuzzle(env.DB, targetDate);

    // Sanitize response: Never leak optimal intermediate rungs
    const payload: TodayResponse = {
      date: puzzle.date,
      plate: puzzle.plate,
      ladders: puzzle.ladders.map((l) => ({
        round: l.round,
        start: l.start,
        target: l.target,
        par: l.par,
      })),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve today puzzle', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
