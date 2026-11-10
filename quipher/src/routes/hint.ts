// quipher/src/routes/hint.ts

import type { Env, HintRequest, HintResponse } from '../types.ts';
import { ensureQuoteForDate, createOrGetSession, recordHint } from '../db.ts';
import { invertKey, getCipherFrequencies } from '../cipher.ts';
import { hashIp, checkIpRateLimit } from '../anti_abuse.ts';

export async function handleHintRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);

  const ipRate = await checkIpRateLimit(env.DB, ipHash, now);
  if (!ipRate.allowed) {
    return new Response(
      JSON.stringify({ error: ipRate.lockoutMessage || 'Rate limit active' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(ipRate.retryAfterSeconds || 5),
        },
      }
    );
  }

  let body: HintRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, mapping = {}, date } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  await createOrGetSession(env.DB, sessionId, targetDate, ipHash, now);

  const quote = await ensureQuoteForDate(env.DB, targetDate);
  const cipherKey = JSON.parse(quote.cipher_key);
  const truth = invertKey(cipherKey);

  const freqs = getCipherFrequencies(quote.ciphertext);
  const presentLetters = Object.keys(freqs);

  // Identify cipher letters that are not yet correct in the client's mapping
  const remainingLetters = presentLetters.filter((c) => {
    const userGuess = (mapping[c] || mapping[c.toLowerCase()] || '').toUpperCase();
    return userGuess !== truth[c];
  });

  if (remainingLetters.length === 0) {
    return new Response(
      JSON.stringify({
        cipherLetter: '',
        plainLetter: '',
        hints: 0,
        message: 'All letters are already correctly assigned.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Sort by frequency descending, tie-breaking alphabetically
  remainingLetters.sort((a, b) => {
    const diff = freqs[b] - freqs[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const chosenCipherLetter = remainingLetters[0];
  const plainLetter = truth[chosenCipherLetter];

  const hintsCount = await recordHint(
    env.DB,
    sessionId,
    targetDate,
    chosenCipherLetter,
    plainLetter,
    now
  );

  const response: HintResponse = {
    cipherLetter: chosenCipherLetter,
    plainLetter,
    hints: hintsCount,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
