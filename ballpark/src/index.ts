// Main Cloudflare Worker entry point for Ballpark
import type { Env } from './types.ts';
import { handleTodayRoute } from './routes/today.ts';
import { handleGuessRoute } from './routes/guess.ts';
import { handleFinishRoute } from './routes/finish.ts';
import { handleStatsRoute } from './routes/stats.ts';
import { handleAdminPublish, handleAdminApprove } from './routes/admin.ts';
import { BACKLOG_SETS } from './generator/backlog.ts';
import { insertQuestion, getQuestionsForDate } from './db.ts';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    let response: Response;
    try {
      if (request.method === 'GET' && url.pathname === '/api/today') {
        response = await handleTodayRoute(request, env);
      } else if (request.method === 'POST' && url.pathname === '/api/guess') {
        response = await handleGuessRoute(request, env);
      } else if (request.method === 'POST' && url.pathname === '/api/finish') {
        response = await handleFinishRoute(request, env);
      } else if (request.method === 'GET' && url.pathname === '/api/stats/yesterday') {
        response = await handleStatsRoute(request, env);
      } else if (request.method === 'POST' && url.pathname === '/api/admin/publish') {
        response = await handleAdminPublish(request, env);
      } else if (request.method === 'GET' && url.pathname === '/api/admin/approve') {
        response = await handleAdminApprove(request, env);
      } else if (url.pathname === '/health' || url.pathname === '/') {
        response = new Response(JSON.stringify({ status: 'healthy', game: 'ballpark' }), {
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
      response = new Response(
        JSON.stringify({ error: err.message || 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Apply CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },

  /**
   * Cron Trigger Handler (04:00 UTC and fallback check before 05:30 UTC)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = await getQuestionsForDate(env.DB, todayStr);

    if (!existing || existing.length < 5) {
      console.log(`[Ballpark Cron] No approved questions found for ${todayStr}. Deploying backlog fallback.`);
      const backlogDay = BACKLOG_SETS.find((s) => s.date === todayStr) || BACKLOG_SETS[0];
      const now = Date.now();
      for (let idx = 0; idx < backlogDay.questions.length; idx++) {
        const q = backlogDay.questions[idx];
        await insertQuestion(env.DB, {
          id: `q_${todayStr.replace(/-/g, '')}_${idx + 1}`,
          puzzle_date: todayStr,
          question_index: idx + 1,
          question: q.question,
          unit: q.unit,
          value: q.value,
          value_log10: q.valueLog10,
          explanation: q.explanation,
          sources: q.sources,
          category: q.category,
          difficulty: q.difficulty,
          fermi_derivation: q.fermiDerivation,
          created_at: now,
        });
      }
      console.log(`[Ballpark Cron] Deployed 5 backlog questions for ${todayStr}.`);
    }
  },
};
