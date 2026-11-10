// quipher/src/routes/solve.ts

import type { Env, SolveRequest, SolveResponse } from '../types.ts';
import {
  ensureQuoteForDate,
  createOrGetSession,
  recordSolve,
  getSolvedScoresForDate,
  getRecentCheckEvents,
} from '../db.ts';
import { invertKey } from '../cipher.ts';
import { calculateScore, getRankTitle, calculatePercentile } from '../scoring.ts';
import { hashIp, checkIpRateLimit, detectScriptedSolving } from '../anti_abuse.ts';

export async function handleSolveRoute(
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

  let body: SolveRequest;
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
  const quote = await ensureQuoteForDate(env.DB, targetDate);

  const cipherKey = JSON.parse(quote.cipher_key);
  const truth = invertKey(cipherKey);

  const presentLetters = Array.from(
    new Set(quote.ciphertext.toUpperCase().replace(/[^A-Z]/g, '').split(''))
  );

  // Check that every cipher letter maps to the true plaintext letter
  const isFullySolved =
    presentLetters.length > 0 &&
    presentLetters.every((c) => {
      const userGuess = (mapping[c] || mapping[c.toLowerCase()] || '').toUpperCase();
      return userGuess === truth[c];
    });

  if (!isFullySolved) {
    // CRITICAL SECURITY RULE: never leak plaintext or key before solve
    return new Response(
      JSON.stringify({
        solved: false,
        message: 'Decryption incomplete or incorrect.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Calculate authoritative server solve time
  const solveSeconds = Math.max(1, Math.round((now - session.started_at) / 1000));

  // Anti-abuse: detect scripted solving (<15s or single-letter brute force)
  const recentChecks = await getRecentCheckEvents(env.DB, sessionId);
  const scriptCheck = detectScriptedSolving(solveSeconds, recentChecks);

  const score = calculateScore(solveSeconds, session.checks_count, session.hints_count);
  const rank = getRankTitle(score);

  if (scriptCheck.isScripted) {
    // Flagged sessions are recorded as flagged and excluded from leaderboards/percentiles
    await recordSolve(
      env.DB,
      sessionId,
      solveSeconds,
      score,
      rank,
      'flagged',
      scriptCheck.reason || 'scripted_solve',
      now
    );

    const flaggedResponse: SolveResponse = {
      solved: true,
      plaintext: quote.plaintext,
      author: quote.author,
      source: quote.source,
      year: quote.year,
      solveSeconds,
      checks: session.checks_count,
      hints: session.hints_count,
      score,
      percentile: undefined,
      rank,
      message: `Flagged: ${scriptCheck.reason}`,
    };

    return new Response(JSON.stringify(flaggedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Record valid human solve
  await recordSolve(env.DB, sessionId, solveSeconds, score, rank, 'solved', null, now);

  const allScores = await getSolvedScoresForDate(env.DB, targetDate);
  const percentile = calculatePercentile(score, allScores);

  const response: SolveResponse = {
    solved: true,
    plaintext: quote.plaintext,
    author: quote.author,
    source: quote.source,
    year: quote.year,
    solveSeconds,
    checks: session.checks_count,
    hints: session.hints_count,
    score,
    percentile,
    rank,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
