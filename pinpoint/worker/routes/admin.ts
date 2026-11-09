// Admin and Ingestion Routes for Pinpoint
import type { Env, Puzzle, Round, WindowRendering } from '../types.ts';
import { insertPuzzleAndRounds, getPuzzleForDate, getRoundsForDate } from '../db.ts';

function checkAuth(request: Request, env: Env): boolean {
  const secret = env.APPROVAL_SECRET || 'pinpoint-admin-secret-key';
  const url = new URL(request.url);

  // 1. Query parameter token (for one-click approval links in emails)
  const queryToken = url.searchParams.get('token');
  if (queryToken && queryToken === secret) return true;

  // 2. Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && (authHeader === `Bearer ${secret}` || authHeader === secret)) {
    return true;
  }

  // 3. X-Admin-Key header
  const xAdminKey = request.headers.get('x-admin-key');
  if (xAdminKey && xAdminKey === secret) return true;

  return false;
}

export async function handleAdminRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, '');

  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin secret key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/admin/publish: Ingest puzzle, rounds, and KV windows from nightly generation script
  if (path === 'publish') {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    let payload: {
      puzzle: Puzzle;
      rounds: Round[];
      windows?: Record<string, WindowRendering>; // kvKey -> window
    };

    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
    }

    const { puzzle, rounds, windows } = payload;
    if (!puzzle || !Array.isArray(rounds) || rounds.length !== 5) {
      return new Response(JSON.stringify({ error: 'Invalid payload: must include puzzle and 5 rounds' }), {
        status: 400,
      });
    }

    // Insert into D1
    await insertPuzzleAndRounds(env.DB, puzzle, rounds);

    // Write windows into KV if provided
    let kvCount = 0;
    if (windows && env.KV) {
      for (const [key, win] of Object.entries(windows)) {
        await env.KV.put(key, JSON.stringify(win));
        kvCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully ingested puzzle for ${puzzle.date} with 5 rounds and ${kvCount} KV windows.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // GET or POST /api/admin/approve: Approve pending puzzle
  if (path === 'approve') {
    const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    await env.DB.prepare('UPDATE puzzles SET status = "live" WHERE date = ?').bind(targetDate).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Puzzle for date ${targetDate} approved and marked live.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // GET /api/admin/candidates
  if (path === 'candidates') {
    const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const puzzle = await getPuzzleForDate(env.DB, targetDate);
    const rounds = await getRoundsForDate(env.DB, targetDate);

    return new Response(JSON.stringify({ puzzle, rounds }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown admin route' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
