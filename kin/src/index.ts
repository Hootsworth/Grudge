import type { Env } from './types.ts';
import { handleTodayRoute } from './routes/today.ts';
import { handleAnswerRoute } from './routes/answer.ts';
import { handleFinishRoute } from './routes/finish.ts';
import { handleStatsYesterdayRoute } from './routes/stats.ts';
import { handleScheduledEvent } from './cron/handler.ts';
import { vetoPuzzle, getPendingPuzzleForDate } from './db.ts';

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    let response: Response;

    try {
      if (url.pathname === '/api/today') {
        response = await handleTodayRoute(request, env);
      } else if (url.pathname === '/api/answer') {
        response = await handleAnswerRoute(request, env);
      } else if (url.pathname === '/api/finish') {
        response = await handleFinishRoute(request, env);
      } else if (url.pathname === '/api/stats/yesterday') {
        response = await handleStatsYesterdayRoute(request, env);
      } else if (url.pathname === '/api/admin/veto' && request.method === 'POST') {
        const auth = request.headers.get('Authorization') || '';
        const secret = env.VETO_SECRET || 'kin-veto-secret';
        if (auth !== `Bearer ${secret}`) {
          response = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const pending = await getPendingPuzzleForDate(env.DB, todayStr);
          if (pending) {
            await vetoPuzzle(env.DB, pending.id);
            response = new Response(JSON.stringify({ success: true, message: `Vetoed puzzle ${pending.id}` }), { status: 200 });
          } else {
            response = new Response(JSON.stringify({ error: 'No pending puzzle found for today' }), { status: 404 });
          }
        }
      } else {
        response = new Response(JSON.stringify({ error: 'Route not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      console.error('[Kin Uncaught Error]:', err);
      response = new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return addCorsHeaders(response);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduledEvent(event, env));
  },
};
