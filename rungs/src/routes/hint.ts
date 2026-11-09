// Route: POST /api/hint
import type { Env, HintRequest, HintResponse } from '../types.ts';
import { ensurePuzzle, getOrCreateRoundProgress, updateRoundProgress } from '../db.ts';
import { getNextOptimalStep } from '../words.ts';

export async function handleHintRoute(request: Request, env: Env): Promise<Response> {
  let body: HintRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId, round: requestedRound, currentWord: rawWord } = body;
  const roundNum = Number(requestedRound);

  if (!sessionId || !roundNum || roundNum < 1 || roundNum > 5) {
    return new Response(JSON.stringify({ error: 'Invalid session or round' }), { status: 400 });
  }

  const todayStr = (body as any).date || new Date().toISOString().split('T')[0];
  const puzzle = await ensurePuzzle(env.DB, todayStr);
  const ladderTarget = puzzle.ladders.find((l) => l.round === roundNum);

  if (!ladderTarget) {
    return new Response(JSON.stringify({ error: 'Ladder round not found' }), { status: 400 });
  }

  const progress = await getOrCreateRoundProgress(
    env.DB,
    sessionId,
    roundNum,
    ladderTarget.start,
    ladderTarget.target,
    ladderTarget.par
  );

  const path: string[] = JSON.parse(progress.path_json);
  const current = (rawWord || path[path.length - 1] || ladderTarget.start).toLowerCase().trim();

  // Compute next optimal step towards target via BFS on authoritative word graph
  const nextWord = getNextOptimalStep(current, ladderTarget.target);

  if (!nextWord) {
    return new Response(
      JSON.stringify({ error: 'No path found from current word to target' }),
      { status: 400 }
    );
  }

  // A hint counts as 1 penalty stroke
  const newStrokes = progress.strokes + 1;
  await updateRoundProgress(env.DB, sessionId, roundNum, newStrokes, path, false);

  const payload: HintResponse = {
    hint: nextWord.toUpperCase(),
    message: `Try: ${nextWord.toUpperCase()}`,
    strokesPenalty: 1,
    strokes: newStrokes,
    par: ladderTarget.par,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
