// Route: GET /api/today
import type { Env, TodayResponse } from '../types.ts';
import { ensurePuzzle } from '../db.ts';

export async function handleTodayRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const puzzle = await ensurePuzzle(env.DB, targetDate);

    const payload: TodayResponse = {
      date: puzzle.date,
      plate: puzzle.plate,
      letters: puzzle.keyLetters,
      timeLimitSeconds: 60,
      totalWordsCount: puzzle.totalWords,
      maxScore: puzzle.maxScore,
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
      JSON.stringify({ error: 'Failed to retrieve today sprint puzzle', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
