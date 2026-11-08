import type { Env, AnswerRequest, AnswerResponse } from '../types.ts';
import {
  getPublishedPuzzleForDate,
  getOrCreateSession,
  getSessionAnswerForRound,
  recordAnswerAndUpdateSession,
} from '../db.ts';
import { formatApproximateMya } from '../scoring.ts';
import { checkIpRateLimit, validateAnswerSpeed, hashIp } from '../antiAbuse.ts';

export async function handleAnswerRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Rate limiting
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const ipHash = await hashIp(clientIp);
  if (!checkIpRateLimit(ipHash)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse body
  let body: AnswerRequest;
  try {
    body = (await request.json()) as AnswerRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, roundId, pair } = body;
  if (!sessionId || !roundId || !Array.isArray(pair) || pair.length !== 2) {
    return new Response(
      JSON.stringify({ error: 'Required fields: session (string), roundId (string), pair (array of 2 organism IDs).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (pair[0] === pair[1]) {
    return new Response(JSON.stringify({ error: 'Pair must contain two distinct organisms.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Today's puzzle & session
  const todayStr = new Date().toISOString().split('T')[0];
  const puzzle = await getPublishedPuzzleForDate(env.DB, todayStr);
  if (!puzzle || !puzzle.rounds) {
    return new Response(JSON.stringify({ error: 'No active puzzle found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetRound = puzzle.rounds.find((r) => r.id === roundId);
  if (!targetRound) {
    return new Response(JSON.stringify({ error: `Round '${roundId}' not found in today's puzzle.` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await getOrCreateSession(env.DB, sessionId, puzzle.id);

  // 4. Idempotency Check
  const existingAnswer = await getSessionAnswerForRound(env.DB, sessionId, roundId);
  if (existingAnswer) {
    const isCorrect = existingAnswer.correct === 1;
    const responsePayload: AnswerResponse = {
      correct: isCorrect,
      pair: [targetRound.org_a, targetRound.org_b],
      outgroup: targetRound.org_c,
      t1: targetRound.t1,
      t2: targetRound.t2,
      t1Display: formatApproximateMya(targetRound.t1),
      t2Display: formatApproximateMya(targetRound.t2),
      ci1: [targetRound.ci1_low, targetRound.ci1_high],
      ci2: [targetRound.ci2_low, targetRound.ci2_high],
      fact: targetRound.fact,
      source: 'https://timetree.org',
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Sequence Enforcement
  if (session.current_round !== targetRound.round_number) {
    return new Response(
      JSON.stringify({
        error: `Rounds must be answered in order. Currently on Round ${session.current_round}, but received Round ${targetRound.round_number}.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 6. Anti-abuse speed check
  const speedCheck = validateAnswerSpeed(session.last_answer_at);
  if (!speedCheck.valid) {
    return new Response(JSON.stringify({ error: speedCheck.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 7. Evaluate correctness
  const validOrgs = new Set([targetRound.org_a, targetRound.org_b, targetRound.org_c]);
  if (!validOrgs.has(pair[0]) || !validOrgs.has(pair[1])) {
    return new Response(JSON.stringify({ error: 'Pair contains organism IDs not in this round.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isCorrect =
    (pair[0] === targetRound.org_a && pair[1] === targetRound.org_b) ||
    (pair[0] === targetRound.org_b && pair[1] === targetRound.org_a);

  // 8. Record in DB
  await recordAnswerAndUpdateSession(
    env.DB,
    sessionId,
    puzzle.id,
    targetRound.id,
    targetRound.round_number,
    pair,
    isCorrect,
    targetRound.t2
  );

  const responsePayload: AnswerResponse = {
    correct: isCorrect,
    pair: [targetRound.org_a, targetRound.org_b],
    outgroup: targetRound.org_c,
    t1: targetRound.t1,
    t2: targetRound.t2,
    t1Display: formatApproximateMya(targetRound.t1),
    t2Display: formatApproximateMya(targetRound.t2),
    ci1: [targetRound.ci1_low, targetRound.ci1_high],
    ci2: [targetRound.ci2_low, targetRound.ci2_high],
    fact: targetRound.fact,
    source: 'https://timetree.org',
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
