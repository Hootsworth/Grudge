// Route: POST /api/guess (Word Guess & Redaction Reveal)
import type { Env, WordGuessRequest, WordGuessResponse } from '../types.ts';
import { ensurePuzzle, createOrGetSession, recordWordGuess } from '../db.ts';
import { tokenizeExcerpt, isTitleMatch } from '../dossiers.ts';
import { hashIp, checkIpRateLimit } from '../rate_limit.ts';

export async function handleGuessRoute(request: Request, env: Env): Promise<Response> {
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

  let body: WordGuessRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId, word: rawWord } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), { status: 400 });
  }

  const word = (rawWord || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!word) {
    return new Response(
      JSON.stringify({
        valid: false,
        word: '',
        matchesCount: 0,
        matchedIndices: [],
        totalGuesses: 0,
        isSolved: false,
        message: 'Enter a valid alphanumeric word',
      } satisfies WordGuessResponse),
      { status: 400 }
    );
  }

  const dossier = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr, now);

  const tokens = tokenizeExcerpt(dossier.excerpt);
  const matchedIndices: number[] = [];

  for (const t of tokens) {
    if (t.word === word) {
      matchedIndices.push(t.index);
    }
  }

  const matchesCount = matchedIndices.length;
  await recordWordGuess(env.DB, sessionId, word, matchedIndices);

  const updatedSession = await createOrGetSession(env.DB, sessionId, todayStr, now);
  const isDirectTitleMatch = isTitleMatch(word, dossier);

  return new Response(
    JSON.stringify({
      valid: true,
      word,
      matchesCount,
      matchedIndices,
      revealedWord: matchesCount > 0 ? tokens[matchedIndices[0]].raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '') : undefined,
      totalGuesses: updatedSession.total_guesses,
      isSolved: isDirectTitleMatch || updatedSession.is_solved === 1,
      message: matchesCount > 0 ? `Unredacted ${matchesCount} occurrence${matchesCount === 1 ? '' : 's'}` : 'Zero occurrences in document',
    } satisfies WordGuessResponse),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
