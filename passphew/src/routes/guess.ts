// Route: POST /api/guess
import type { Env, GuessResponse } from '../types.ts';
import {
  normalizeGuess,
  constantTimeEqual,
  hashIp,
} from '../security/normalization.ts';
import {
  checkThrottle,
  getCooldownSeconds,
  verifyTurnstile,
  TURNSTILE_THRESHOLD,
} from '../security/throttling.ts';
import { detectBruteForcePattern } from '../security/pattern_detector.ts';
import {
  getLivePuzzleForDate,
  ensureTodayPuzzle,
  createOrGetSession,
  getGuessesForSession,
  isDuplicateWrongGuess,
  recordGuessAttempt,
  markSessionSolved,
  flagSessionAsBot,
  getIpLimit,
  updateIpLimit,
  calculatePercentile,
} from '../db.ts';

interface GuessRequestBody {
  session?: string;
  guess?: string;
  turnstileToken?: string;
}

export async function handleGuessRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);

  // 1. Parse and validate JSON request body
  let body: GuessRequestBody;
  try {
    body = (await request.json()) as GuessRequestBody;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, guess: rawGuess, turnstileToken } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof rawGuess !== 'string' || !rawGuess.trim()) {
    return new Response(JSON.stringify({ error: 'Missing guess' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const todayStr = (body as any).date || new Date().toISOString().split('T')[0];

  // 2. Fetch or ensure today's live puzzle in DB
  const puzzle = await ensureTodayPuzzle(env.DB, todayStr);

  // 3. Create or retrieve session record
  const session = await createOrGetSession(env.DB, sessionId, todayStr, puzzle.id, ipHash, now);

  // If already solved in this session, return victory payload
  if (session.status === 'solved') {
    const solveSecs = session.solve_seconds || 1;
    const percentile = await calculatePercentile(env.DB, todayStr, session.failed_count, solveSecs);
    return new Response(
      JSON.stringify({
        correct: true,
        answer: puzzle.answer,
        explanation: puzzle.explanation,
        failedBeforeCrack: session.failed_count,
        solveSeconds: solveSecs,
        percentile,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Check Anti-Brute-Force & Throttling
  const ipLimit = await getIpLimit(env.DB, ipHash, todayStr);
  const throttleCheck = checkThrottle(session, ipLimit, now);

  // Hard Daily Cap (300 guesses)
  if (throttleCheck.dailyCapReached) {
    return new Response(
      JSON.stringify({
        error: 'Daily limit exceeded',
        dailyCapReached: true,
        lockoutMessage: throttleCheck.lockoutMessage,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Active Cooldown Delay (1s, 2s, 4s, capped at 30s)
  if (throttleCheck.retryAfterSeconds) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit active',
        retryAfter: throttleCheck.retryAfterSeconds,
        lockoutMessage: throttleCheck.lockoutMessage,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(throttleCheck.retryAfterSeconds),
        },
      }
    );
  }

  // Turnstile Verification (Required after 25 failed attempts)
  if (throttleCheck.requireTurnstile) {
    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      rawIp
    );

    if (!turnstileValid) {
      return new Response(
        JSON.stringify({
          error: 'Turnstile verification required',
          requireTurnstile: true,
          lockoutMessage: 'Vault locked. Complete Turnstile verification to continue.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 5. Normalize submitted guess
  const normGuess = normalizeGuess(rawGuess);

  // 6. Check Caching for Repeating previously tried wrong guesses
  // "Repeating a previously tried wrong guess counts as a failure but costs the server nothing (cache it)"
  const isCachedWrong = await isDuplicateWrongGuess(env.DB, session.id, normGuess);
  if (isCachedWrong) {
    const newFailedCount = session.failed_count + 1;
    await env.DB.prepare('UPDATE sessions SET failed_count = ? WHERE id = ?')
      .bind(newFailedCount, session.id)
      .run();

    const cooldownSecs = getCooldownSeconds(newFailedCount);
    await updateIpLimit(env.DB, ipHash, todayStr, now, now + cooldownSecs * 1000);

    const failResponse: GuessResponse = {
      correct: false,
      failed: newFailedCount,
      cached: true,
    };
    return new Response(JSON.stringify(failResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 7. Bot Pattern Detection
  const previousGuesses = await getGuessesForSession(env.DB, session.id);
  const guessHistory = previousGuesses.map((g) => g.normalized_guess).concat([normGuess]);
  const timeHistory = previousGuesses.map((g) => g.created_at).concat([now]);

  const patternCheck = detectBruteForcePattern(guessHistory, timeHistory);
  if (patternCheck.isBot) {
    await flagSessionAsBot(env.DB, session.id);
  }

  // 8. Constant-Time Comparison against true answer
  // "Constant-time comparison of the guess against the answer"
  const isCorrect = await constantTimeEqual(normGuess, puzzle.answer);

  // 9. Update state & prepare response
  if (isCorrect) {
    const solveSeconds = Math.max(1, Math.round((now - session.started_at) / 1000));
    await recordGuessAttempt(env.DB, session, rawGuess, normGuess, true, ipHash, now);
    await markSessionSolved(env.DB, session.id, solveSeconds, now);

    const percentile = await calculatePercentile(
      env.DB,
      todayStr,
      session.failed_count,
      solveSeconds
    );

    const successResponse: GuessResponse = {
      correct: true,
      answer: puzzle.answer,
      explanation: puzzle.explanation,
      failedBeforeCrack: session.failed_count,
      solveSeconds,
      percentile,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // Incorrect guess
    const newFailed = await recordGuessAttempt(
      env.DB,
      session,
      rawGuess,
      normGuess,
      false,
      ipHash,
      now
    );

    // Apply progressive cooldown to IP
    const cooldownSecs = getCooldownSeconds(newFailed);
    await updateIpLimit(env.DB, ipHash, todayStr, now, now + cooldownSecs * 1000);

    const failResponse: GuessResponse = {
      correct: false,
      failed: newFailed,
    };

    return new Response(JSON.stringify(failResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
