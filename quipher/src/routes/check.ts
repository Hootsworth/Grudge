// quipher/src/routes/check.ts

import type { Env, CheckRequest, CheckResponse } from '../types.ts';
import { ensureQuoteForDate, createOrGetSession, recordCheck } from '../db.ts';
import { invertKey } from '../cipher.ts';
import { hashIp, checkIpRateLimit, checkCheckInterval } from '../anti_abuse.ts';

export async function handleCheckRoute(
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

  let body: CheckRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, mapping, date } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!mapping || typeof mapping !== 'object') {
    return new Response(JSON.stringify({ error: 'Missing or invalid mapping object' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const session = await createOrGetSession(env.DB, sessionId, targetDate, ipHash, now);

  // Rate limit: at most 1 check per 3 seconds
  const intervalCheck = checkCheckInterval(session.last_check_at, now);
  if (!intervalCheck.allowed) {
    const retrySec = Math.max(1, Math.ceil((intervalCheck.waitMs || 1000) / 1000));
    return new Response(
      JSON.stringify({
        error: 'Rate limit: at most 1 check per 3 seconds',
        retryAfterMs: intervalCheck.waitMs,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retrySec),
        },
      }
    );
  }

  const quote = await ensureQuoteForDate(env.DB, targetDate);
  const cipherKey = JSON.parse(quote.cipher_key);
  const truth = invertKey(cipherKey);

  // Extract all unique letters present in the ciphertext
  const presentLetters = Array.from(
    new Set(quote.ciphertext.toUpperCase().replace(/[^A-Z]/g, '').split(''))
  );

  const wrong: string[] = [];
  for (const [cipherLetter, plainLetter] of Object.entries(mapping)) {
    const cUpper = cipherLetter.toUpperCase();
    if (presentLetters.includes(cUpper)) {
      const pUpper = (plainLetter || '').toUpperCase();
      if (pUpper && pUpper !== truth[cUpper]) {
        wrong.push(cUpper);
      }
    }
  }

  const allMappedAndCorrect =
    presentLetters.length > 0 &&
    presentLetters.every((c) => {
      const p = (mapping[c] || mapping[c.toLowerCase()] || '').toUpperCase();
      return p === truth[c];
    });

  const checksCount = await recordCheck(env.DB, sessionId, targetDate, now, mapping);

  const response: CheckResponse = {
    wrong,
    solved: wrong.length === 0 && allMappedAndCorrect,
    checks: checksCount,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
