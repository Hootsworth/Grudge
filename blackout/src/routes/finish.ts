// Route: POST /api/finish (Session Summary / Surrender / End)
import type { Env, FinishResponse } from '../types.ts';
import { ensurePuzzle, createOrGetSession } from '../db.ts';
import { getBlackoutRank, generateShareCard } from '../ranking.ts';

export async function handleFinishRoute(request: Request, env: Env): Promise<Response> {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  let body: { session?: string };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing session UUID' }), { status: 400 });
  }

  const dossier = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr, now);

  // Mark finished_at if not set
  if (!session.finished_at) {
    await env.DB.prepare('UPDATE sessions SET finished_at = ? WHERE id = ?')
      .bind(now, sessionId)
      .run();
  }

  const isSolved = session.is_solved === 1;
  const rankTitle = getBlackoutRank(session.total_guesses, isSolved);
  const shareCard = generateShareCard(dossier.plate, isSolved, session.total_guesses, rankTitle);

  const payload: FinishResponse = {
    isSolved,
    title: dossier.title,
    year: dossier.year,
    category: dossier.category,
    fullExcerpt: dossier.excerpt,
    citation: dossier.citation,
    totalGuesses: session.total_guesses,
    rankTitle,
    shareCard,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
