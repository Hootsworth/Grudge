// Route: GET /api/stats/yesterday
import type { Env, YesterdayStatsResponse } from '../types.ts';
import { getYesterdayStats } from '../db.ts';

export async function handleStatsYesterdayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const customDate = url.searchParams.get('date');

    let yesterdayDate: string;
    if (customDate) {
      yesterdayDate = customDate;
    } else {
      const yesterday = new Date(Date.now() - 864e5);
      yesterdayDate = yesterday.toISOString().split('T')[0];
    }

    const stats: YesterdayStatsResponse = await getYesterdayStats(env.DB, yesterdayDate);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    // Return empty graceful fallback on error
    const fallback: YesterdayStatsResponse = {
      solveRate: 0.0,
      medianFailedAttempts: 0,
      fastestCrackTime: null,
      mostCommonWrongGuesses: [],
    };
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
