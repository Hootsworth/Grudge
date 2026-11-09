// Route: POST /api/step
import type { Env, StepRequest, StepResponse } from '../types.ts';
import { createOrGetSession, ensurePuzzle, getOrCreateRoundProgress, updateRoundProgress, advanceSessionRound } from '../db.ts';
import { isValidWord, isOneLetterDiff, letterDiff } from '../words.ts';
import { hashIp, checkIpRateLimit } from '../rate_limit.ts';

export async function handleStepRoute(request: Request, env: Env): Promise<Response> {
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const fallbackDate = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, fallbackDate);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: StepRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, round: requestedRound, word: rawWord } = body;
  const todayStr = (body as any).date || fallbackDate;

  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roundNum = Number(requestedRound);
  if (!roundNum || roundNum < 1 || roundNum > 5) {
    return new Response(JSON.stringify({ error: 'Round number must be between 1 and 5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const word = (rawWord || '').toLowerCase().trim();
  if (!word || word.length !== 4) {
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        diffCount: 0,
        strokes: 0,
        par: 0,
        solved: false,
        path: [],
        message: 'Word must be exactly 4 letters',
      } satisfies StepResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 1. Authoritative word database verification
  if (!isValidWord(word)) {
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        diffCount: 0,
        strokes: 0,
        par: 0,
        solved: false,
        path: [],
        message: 'Not in word database',
      } satisfies StepResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const puzzle = await ensurePuzzle(env.DB, todayStr);
  const ladderTarget = puzzle.ladders.find((l) => l.round === roundNum);
  if (!ladderTarget) {
    return new Response(JSON.stringify({ error: 'Invalid ladder round' }), { status: 400 });
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr);
  if (roundNum !== session.current_round) {
    return new Response(
      JSON.stringify({ error: `Must play ladders in order. Currently on ladder ${session.current_round}.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const progress = await getOrCreateRoundProgress(
    env.DB,
    sessionId,
    roundNum,
    ladderTarget.start,
    ladderTarget.target,
    ladderTarget.par
  );

  if (progress.solved) {
    return new Response(
      JSON.stringify({ error: `Ladder ${roundNum} is already solved.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const path: string[] = JSON.parse(progress.path_json);
  const currentWord = path[path.length - 1];

  // 2. Already used check
  if (path.includes(word)) {
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        diffCount: 0,
        strokes: progress.strokes,
        par: ladderTarget.par,
        solved: false,
        path,
        message: 'Already on the ladder',
      } satisfies StepResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Exactly one letter diff check
  const diff = letterDiff(currentWord, word);
  if (diff !== 1) {
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        diffCount: diff,
        strokes: progress.strokes,
        par: ladderTarget.par,
        solved: false,
        path,
        message: 'Change exactly one letter',
      } satisfies StepResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Valid rung step!
  const newPath = [...path, word];
  const newStrokes = progress.strokes + 1;
  const isSolved = word === ladderTarget.target;

  await updateRoundProgress(env.DB, sessionId, roundNum, newStrokes, newPath, isSolved);

  if (isSolved) {
    await advanceSessionRound(env.DB, sessionId, roundNum, newStrokes, ladderTarget.par);
  }

  return new Response(
    JSON.stringify({
      valid: true,
      word,
      diffCount: 1,
      strokes: newStrokes,
      par: ladderTarget.par,
      solved: isSolved,
      path: newPath,
      message: isSolved ? 'Ladder completed!' : undefined,
    } satisfies StepResponse),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
