// quipher/src/routes/today.ts

import type { Env, TodayResponse } from '../types.ts';
import { ensureQuoteForDate, createOrGetSession } from '../db.ts';
import { hashIp } from '../anti_abuse.ts';

export async function handleTodayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const now = Date.now();
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const sessionId = url.searchParams.get('session');

  try {
    const quote = await ensureQuoteForDate(env.DB, targetDate);

    // If session ID is provided, record initial serve / start time
    if (sessionId) {
      const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
      const ipHash = await hashIp(rawIp);
      await createOrGetSession(env.DB, sessionId, targetDate, ipHash, now);
    }

    // Total alphabetic letters to decode
    const letterCount = quote.ciphertext.replace(/[^a-zA-Z]/g, '').length;

    // CRITICAL SECURITY RULE: Client must NEVER receive plaintext or cipher key
    const payload: TodayResponse = {
      plate: quote.plate,
      ciphertext: quote.ciphertext,
      letterCount,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve today puzzle', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
