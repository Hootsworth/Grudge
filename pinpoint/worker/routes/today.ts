// Route: GET /api/today
import type { Env, TodayResponse } from '../types.ts';
import { getPuzzleForDate } from '../db.ts';

export async function handleTodayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    let puzzle = await getPuzzleForDate(env.DB, targetDate);

    // Compute plate number if not found (days since Jan 1, 2026)
    const baseDate = Date.UTC(2026, 0, 1);
    const [y, m, d] = targetDate.split('-').map(Number);
    const curDate = Date.UTC(y, m - 1, d);
    const fallbackPlate = Math.max(1, Math.floor((curDate - baseDate) / 864e5) + 1);

    if (!puzzle && env.DB) {
      try {
        await env.DB
          .prepare('INSERT OR IGNORE INTO puzzles (date, plate, status, created_at) VALUES (?, ?, "live", ?)')
          .bind(targetDate, fallbackPlate, Date.now())
          .run();
      } catch (e) {}
    }

    const payload: TodayResponse = {
      plate: puzzle?.plate || fallbackPlate,
      rounds: 5,
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
      JSON.stringify({
        plate: 1,
        rounds: 5,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
