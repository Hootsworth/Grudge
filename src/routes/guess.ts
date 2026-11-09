import type { Env, GuessRequest, GuessResponse } from '../types.ts';
import {
  getPublishedPuzzleForDate,
  getOrCreateSession,
  recordGuessAndUpdateSession,
} from '../db.ts';
import { evaluateGuess, buildEventReveal } from '../scoring/lockLogic.ts';
import { checkIpRateLimit, validateHumanSpeed, hashIp } from '../anti-abuse/rateLimit.ts';

export async function handleGuessRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. IP Rate Limiting
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const ipHash = await hashIp(clientIp);
  if (!checkIpRateLimit(ipHash)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse Body
  let body: GuessRequest;
  try {
    body = (await request.json()) as GuessRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, order } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Field "session" is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Fetch Today's Puzzle
  const todayStr = (body as any).date || new Date().toISOString().split('T')[0];
  const puzzle = await getPublishedPuzzleForDate(env.DB, todayStr);
  if (!puzzle || !puzzle.events || puzzle.events.length !== 6) {
    return new Response(JSON.stringify({ error: 'Puzzle not available for today.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Events sorted newest (index 0) to oldest (index 5)
  const sortedEvents = [...puzzle.events].sort((a, b) => b.year - a.year);

  // 4. Session Validation
  const session = await getOrCreateSession(env.DB, sessionId, puzzle.id);

  if (session.solved === 1) {
    return new Response(JSON.stringify({ error: 'Puzzle has already been solved for this session.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (session.attempts_used >= 4) {
    return new Response(JSON.stringify({ error: 'Maximum attempts (4) reached for this session.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Anti-Abuse: Speed Check
  const speedCheck = validateHumanSpeed(session.last_guess_at);
  if (!speedCheck.valid) {
    return new Response(JSON.stringify({ error: speedCheck.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 6. Evaluate Guess & Lock Constraints
  let previouslyLocked: string[] = [];
  try {
    previouslyLocked = JSON.parse(session.locked_json);
  } catch {
    previouslyLocked = [];
  }

  const evalResult = evaluateGuess(order, sortedEvents, previouslyLocked);

  if (!evalResult.isValid) {
    return new Response(JSON.stringify({ error: evalResult.error }), {
      status: evalResult.statusCode || 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 7. Update Session State in DB
  const attemptNumber = session.attempts_used + 1;
  const isFinished = evalResult.isSolved || attemptNumber >= 4;

  await recordGuessAndUpdateSession(
    env.DB,
    sessionId,
    puzzle.id,
    attemptNumber,
    order,
    evalResult.correctBools,
    evalResult.newLockedIds,
    evalResult.isSolved,
    isFinished
  );

  // 8. Assemble Response
  const responsePayload: GuessResponse = {
    correct: evalResult.correctBools,
    solved: evalResult.isSolved,
    attemptsUsed: attemptNumber,
    locked: evalResult.newLockedIds,
  };

  // On the final attempt (4) or on solving, reveal full historical details in true order
  if (isFinished) {
    responsePayload.reveal = buildEventReveal(sortedEvents);
  }

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
