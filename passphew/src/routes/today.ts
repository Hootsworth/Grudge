// Route: GET /api/today
import type { Env, ClientPuzzle } from '../types.ts';
import { ensureTodayPuzzle } from '../db.ts';

export async function handleTodayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const puzzle = await ensureTodayPuzzle(env.DB, targetDate);

    // STRICT DATA SANITIZATION:
    // Never return answer, length, type, or explanation!
    const clientPayload: ClientPuzzle = {
      plate: puzzle.plate,
      date: puzzle.date,
      username: puzzle.username,
      clue: puzzle.clue,
    };

    return new Response(JSON.stringify(clientPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      plate: 1,
      date: targetDate,
      username: 'root_admin',
      clue: 'Opener of locks, then the error for a missing page',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
