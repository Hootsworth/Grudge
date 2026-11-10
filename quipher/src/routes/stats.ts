// quipher/src/routes/stats.ts

import type { Env, YesterdayStatsResponse } from '../types.ts';
import { getYesterdayStats } from '../db.ts';

export async function handleStatsRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  // Optional date override for yesterday stats testing
  const queryDate = url.searchParams.get('date');
  const yesterdayDate =
    queryDate ||
    new Date(Date.now() - 86400000).toISOString().split('T')[0];

  try {
    const stats: YesterdayStatsResponse = await getYesterdayStats(env.DB, yesterdayDate);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve stats', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
