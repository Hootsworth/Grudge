// quipher/src/index.ts

import type { Env } from './types.ts';
import { handleTodayRoute } from './routes/today.ts';
import { handleCheckRoute } from './routes/check.ts';
import { handleHintRoute } from './routes/hint.ts';
import { handleSolveRoute } from './routes/solve.ts';
import { handleStatsRoute } from './routes/stats.ts';
import { handleAdminApproveRoute } from './routes/admin.ts';
import { runQuoteGenerationPipeline } from './generator/generation.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function addCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    try {
      let response: Response;

      if (url.pathname === '/api/today' && request.method === 'GET') {
        response = await handleTodayRoute(request, env);
      } else if (url.pathname === '/api/check' && request.method === 'POST') {
        response = await handleCheckRoute(request, env);
      } else if (url.pathname === '/api/hint' && request.method === 'POST') {
        response = await handleHintRoute(request, env);
      } else if (url.pathname === '/api/solve' && request.method === 'POST') {
        response = await handleSolveRoute(request, env);
      } else if (url.pathname === '/api/stats/yesterday' && request.method === 'GET') {
        response = await handleStatsRoute(request, env);
      } else if (url.pathname === '/api/admin/approve' && request.method === 'POST') {
        response = await handleAdminApproveRoute(request, env);
      } else {
        response = new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return addCors(response);
    } catch (err: any) {
      return addCors(
        new Response(
          JSON.stringify({ error: 'Internal Server Error', details: err?.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    await runQuoteGenerationPipeline(todayStr, env);
  },
};
