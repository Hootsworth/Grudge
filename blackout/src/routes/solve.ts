// Route: POST /api/solve (Title Guess & Declassification)
import type { Env, SolveRequest, SolveResponse } from '../types.ts';
import { ensurePuzzle, createOrGetSession, recordSolve, recordFailedSolve } from '../db.ts';
import { isTitleMatch } from '../dossiers.ts';
import { hashIp, checkIpRateLimit } from '../rate_limit.ts';
import { getBlackoutRank, generateShareCard } from '../ranking.ts';

export async function handleSolveRoute(request: Request, env: Env): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, todayStr, now);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SolveRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId, titleGuess: rawTitleGuess } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), { status: 400 });
  }

  const titleGuess = (rawTitleGuess || '').trim();
  if (!titleGuess) {
    return new Response(
      JSON.stringify({
        correct: false,
        titleGuess: '',
        totalGuesses: 0,
        message: 'Provide a non-empty title guess',
      } satisfies SolveResponse),
      { status: 400 }
    );
  }

  const dossier = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr, now);

  if (session.is_solved === 1) {
    const rankTitle = getBlackoutRank(session.total_guesses, true);
    const shareCard = generateShareCard(dossier.plate, true, session.total_guesses, rankTitle);
    return new Response(
      JSON.stringify({
        correct: true,
        titleGuess,
        totalGuesses: session.total_guesses,
        title: dossier.title,
        year: dossier.year,
        category: dossier.category,
        fullExcerpt: dossier.excerpt,
        citation: dossier.citation,
        rankTitle,
        shareCard,
        message: 'Dossier already declassified',
      } satisfies SolveResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const matches = isTitleMatch(titleGuess, dossier);

  if (matches) {
    await recordSolve(env.DB, sessionId, now);
    const updated = await createOrGetSession(env.DB, sessionId, todayStr, now);
    const rankTitle = getBlackoutRank(updated.total_guesses, true);
    const shareCard = generateShareCard(dossier.plate, true, updated.total_guesses, rankTitle);

    return new Response(
      JSON.stringify({
        correct: true,
        titleGuess,
        totalGuesses: updated.total_guesses,
        title: dossier.title,
        year: dossier.year,
        category: dossier.category,
        fullExcerpt: dossier.excerpt,
        citation: dossier.citation,
        rankTitle,
        shareCard,
        message: 'TOP SECRET DOSSIER DECLASSIFIED!',
      } satisfies SolveResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } else {
    await recordFailedSolve(env.DB, sessionId);
    const updated = await createOrGetSession(env.DB, sessionId, todayStr, now);

    return new Response(
      JSON.stringify({
        correct: false,
        titleGuess,
        totalGuesses: updated.total_guesses,
        message: 'Incorrect dossier title',
      } satisfies SolveResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
