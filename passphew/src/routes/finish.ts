// Route: POST /api/finish
import type { Env, FinishResponse, SessionRecord } from '../types.ts';
import { calculatePercentile } from '../db.ts';

export async function handleFinishRoute(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await request.json()) as { session?: string };
    const sessionId = body?.session;

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid session ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? LIMIT 1')
      .bind(sessionId)
      .first<SessionRecord>();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate solve rate for today
    const { results } = await env.DB.prepare(
      'SELECT status FROM sessions WHERE date = ? AND is_bot = 0'
    )
      .bind(session.date)
      .all<{ status: string }>();

    const total = results?.length || 1;
    const solvers = results?.filter((r) => r.status === 'solved').length || (session.status === 'solved' ? 1 : 0);
    const solveRate = Math.round((solvers / total) * 100) / 100;

    let percentile = 0;
    if (session.status === 'solved') {
      percentile = await calculatePercentile(
        env.DB,
        session.date,
        session.failed_count,
        session.solve_seconds || 1
      );
    }

    const finishPayload: FinishResponse = {
      failedBeforeCrack: session.failed_count,
      percentile,
      solveRate,
    };

    return new Response(JSON.stringify(finishPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process finish route' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
