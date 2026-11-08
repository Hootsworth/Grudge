// Admin Review & Approval Routes for PassPhew
import type { Env, Puzzle } from '../types.ts';
import {
  getPuzzleById,
  updatePuzzleStatus,
  getPuzzlesForDate,
  getNextPlateNumber,
  insertPuzzle,
} from '../db.ts';
import { BACKLOG_PUZZLES } from '../backlog/index.ts';

function checkAuth(request: Request, env: Env): boolean {
  const secret = env.APPROVAL_SECRET || 'passphew-admin-default-secret';
  const url = new URL(request.url);

  // 1. Check token in query param (for one-click email links)
  const queryToken = url.searchParams.get('token');
  if (queryToken && queryToken === secret) return true;

  // 2. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && (authHeader === `Bearer ${secret}` || authHeader === secret)) {
    return true;
  }

  // 3. Check X-Admin-Key header
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

  // Verify authorization
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Route: /api/admin/approve
  if (path === 'approve' || path.startsWith('approve')) {
    return handleApprove(request, env, url);
  }

  // Route: /api/admin/veto
  if (path === 'veto' || path.startsWith('veto')) {
    return handleVeto(request, env, url);
  }

  // Route: /api/admin/candidates
  if (path === 'candidates' || path.startsWith('candidates')) {
    return handleListCandidates(request, env, url);
  }

  // Route: /api/admin/deploy-fallback
  if (path === 'deploy-fallback' || path.startsWith('deploy-fallback')) {
    return handleDeployFallback(request, env, url);
  }

  return new Response(JSON.stringify({ error: 'Admin route not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Approves a candidate puzzle and makes it live for the day.
 * Supports both GET (for email link clicks) and POST.
 */
async function handleApprove(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  let puzzleId = url.searchParams.get('id');
  let targetDate = url.searchParams.get('date');

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { id?: string; date?: string };
      if (body.id) puzzleId = body.id;
      if (body.date) targetDate = body.date;
    } catch (e) {}
  }

  if (!puzzleId) {
    return new Response(JSON.stringify({ error: 'Missing puzzle ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const puzzle = await getPuzzleById(env.DB, puzzleId);
  if (!puzzle) {
    return new Response(JSON.stringify({ error: `Puzzle with ID ${puzzleId} not found` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const effectiveDate = targetDate || puzzle.date.split('_')[0] || new Date().toISOString().split('T')[0];
  const plate = await getNextPlateNumber(env.DB);

  // Set selected puzzle to live
  await env.DB.prepare(
    `INSERT INTO puzzles (id, date, plate, username, clue, answer, explanation, type, difficulty, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'live')
     ON CONFLICT(id) DO UPDATE SET status = 'live', date = ?`
  )
    .bind(
      puzzle.id,
      effectiveDate,
      plate,
      puzzle.username,
      puzzle.clue,
      puzzle.answer,
      puzzle.explanation,
      puzzle.type,
      puzzle.difficulty,
      effectiveDate
    )
    .run();

  // Mark other candidate puzzles for this date as vetoed
  await env.DB.prepare(
    `UPDATE puzzles SET status = 'vetoed' WHERE (date LIKE ? OR date = ?) AND id != ? AND status = 'pending'`
  )
    .bind(`${effectiveDate}%`, effectiveDate, puzzle.id)
    .run();

  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family: monospace; background: #0a0a0c; color: #10b981; padding: 2rem;">
        <h2>[PASSPHEW] PUZZLE APPROVED</h2>
        <p>Candidate <b>${puzzle.id}</b> is now LIVE for date <b>${effectiveDate}</b>.</p>
        <p>Username: <b>${puzzle.username}</b></p>
        <p>Clue: <i>${puzzle.clue}</i></p>
        <p>Answer: <span style="letter-spacing: 2px;">${puzzle.answer}</span></p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Puzzle ${puzzle.id} approved and made live for ${effectiveDate}`,
      puzzle: {
        id: puzzle.id,
        date: effectiveDate,
        username: puzzle.username,
        clue: puzzle.clue,
        answer: puzzle.answer,
        status: 'live',
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Vetoes a candidate puzzle.
 */
async function handleVeto(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  let puzzleId = url.searchParams.get('id');
  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { id?: string };
      if (body.id) puzzleId = body.id;
    } catch (e) {}
  }

  if (!puzzleId) {
    return new Response(JSON.stringify({ error: 'Missing puzzle ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await updatePuzzleStatus(env.DB, puzzleId, 'vetoed');

  return new Response(
    JSON.stringify({
      success: true,
      message: `Puzzle ${puzzleId} has been vetoed`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Lists candidates for a given date.
 */
async function handleListCandidates(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const puzzles = await getPuzzlesForDate(env.DB, targetDate);

  return new Response(JSON.stringify({ date: targetDate, count: puzzles.length, puzzles }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Deploys the next available puzzle from /backlog into today's slot.
 */
async function handleDeployFallback(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  let targetDate = url.searchParams.get('date');
  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { date?: string };
      if (body?.date) targetDate = body.date;
    } catch (e) {}
  }
  if (!targetDate) {
    targetDate = new Date().toISOString().split('T')[0];
  }

  // Find used answers or used backlog IDs
  const usedPuzzles = (
    await env.DB.prepare('SELECT id, answer FROM puzzles')
      .all<{ id: string; answer: string }>()
  ).results || [];

  const usedIds = new Set(usedPuzzles.map((p) => p.id));
  const usedAnswers = new Set(usedPuzzles.map((p) => p.answer.toLowerCase()));

  const candidate = BACKLOG_PUZZLES.find(
    (bp) => !usedIds.has(bp.id) && !usedAnswers.has(bp.answer.toLowerCase())
  ) || BACKLOG_PUZZLES[0];

  const plate = await getNextPlateNumber(env.DB);
  const livePuzzle: Puzzle = {
    id: candidate.id,
    date: targetDate,
    plate,
    username: candidate.username,
    clue: candidate.clue,
    answer: candidate.answer,
    explanation: candidate.explanation,
    type: candidate.type,
    difficulty: candidate.difficulty,
    status: 'live',
  };

  await insertPuzzle(env.DB, livePuzzle);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Fallback puzzle ${candidate.id} deployed for ${targetDate}`,
      puzzle: livePuzzle,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
