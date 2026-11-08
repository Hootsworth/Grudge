// Main Cloudflare Worker Entry Point for PassPhew
import type { Env } from './types.ts';
import { handleTodayRoute } from './routes/today.ts';
import { handleGuessRoute } from './routes/guess.ts';
import { handleFinishRoute } from './routes/finish.ts';
import { handleStatsYesterdayRoute } from './routes/stats.ts';
import { handleAdminRoute } from './routes/admin.ts';
import { handleCronTrigger } from './cron/handler.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
};

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, val);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    try {
      // 2. Route matching
      if (path === '/api/today' && request.method === 'GET') {
        response = await handleTodayRoute(request, env);
      } else if (path === '/api/guess' && request.method === 'POST') {
        response = await handleGuessRoute(request, env);
      } else if (path === '/api/finish' && request.method === 'POST') {
        response = await handleFinishRoute(request, env);
      } else if (path === '/api/stats/yesterday' && request.method === 'GET') {
        response = await handleStatsYesterdayRoute(request, env);
      } else if (path.startsWith('/api/admin')) {
        response = await handleAdminRoute(request, env);
      } else if (path === '/api/health' || path === '/health') {
        response = new Response(JSON.stringify({ status: 'ok', service: 'passphew' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        response = new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      console.error('[PASSPHEW ERROR]', err);
      response = new Response(
        JSON.stringify({ error: 'Internal Server Error', message: err?.message || 'Unknown' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return addCorsHeaders(response);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const baseUrl = 'https://passphew.app';
    ctx.waitUntil(handleCronTrigger(event, env, baseUrl));
  },
};
