// Route: GET /api/today
import type { Env, ClientPuzzle } from '../types.ts';
import { getLivePuzzleForDate } from '../db.ts';

// Pre-packaged fallback puzzle in case DB is not yet populated
export const DEFAULT_FALLBACK_PUZZLE = {
  plate: 1,
  date: new Date().toISOString().split('T')[0],
  username: 'root_admin',
  clue: 'Opener of locks, then the error for a missing page',
};

export async function handleTodayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const puzzle = await getLivePuzzleForDate(env.DB, targetDate);

    if (puzzle) {
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
    }

    // Fallback if today's puzzle is not yet seeded
    return new Response(JSON.stringify(DEFAULT_FALLBACK_PUZZLE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // If DB fails, return fallback rather than failing
    return new Response(JSON.stringify(DEFAULT_FALLBACK_PUZZLE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
