// Main Cloudflare Worker entry point for Blackout
import type { Env } from './types.ts';
import { handleTodayRoute } from './routes/today.ts';
import { handleGuessRoute } from './routes/guess.ts';
import { handleSolveRoute } from './routes/solve.ts';
import { handleFinishRoute } from './routes/finish.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
};

function addCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;
    try {
      if (path === '/api/today' && request.method === 'GET') {
        response = await handleTodayRoute(request, env);
      } else if (path === '/api/guess' && request.method === 'POST') {
        response = await handleGuessRoute(request, env);
      } else if (path === '/api/solve' && request.method === 'POST') {
        response = await handleSolveRoute(request, env);
      } else if (path === '/api/finish' && request.method === 'POST') {
        response = await handleFinishRoute(request, env);
      } else if (path === '/health' || path === '/api/health') {
        response = new Response(JSON.stringify({ status: 'ok', service: 'blackout' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      response = new Response(
        JSON.stringify({ error: 'Internal server error', details: err?.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return addCors(response);
  },
};
