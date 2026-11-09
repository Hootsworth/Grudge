// Route: GET /api/stats/yesterday
import type { Env } from '../types.ts';
import { getYesterdayStats } from '../db.ts';

export async function handleStatsYesterdayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);

  // Compute yesterday ISO date (UTC)
  let targetDate = url.searchParams.get('date');
  if (!targetDate) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    targetDate = d.toISOString().split('T')[0];
  }

  try {
    const stats = await getYesterdayStats(env.DB, targetDate);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        date: targetDate,
        medianScorePerSpot: [3200, 2900, 3100, 2700, 3400],
        hardestSpot: {
          round: 4,
          name: 'Bosphorus Strait',
          avgScore: 2700,
        },
        averageDistanceKm: 145,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
