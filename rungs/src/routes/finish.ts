// Route: POST /api/finish
import type { Env, FinishRequest, FinishResponse, RoundProgressRecord } from '../types.ts';
import { finishSession, createOrGetSession, ensurePuzzle } from '../db.ts';

export async function handleFinishRoute(request: Request, env: Env): Promise<Response> {
  let body: FinishRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { session: sessionId } = body;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session UUID' }), { status: 400 });
  }

  const todayStr = (body as any).date || new Date().toISOString().split('T')[0];
  const puzzle = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr);

  // Retrieve all progress records for this session
  const { results: progresses } = await env.DB
    .prepare('SELECT * FROM round_progress WHERE session_id = ? ORDER BY round_number ASC')
    .bind(sessionId)
    .all<RoundProgressRecord>();

  const list = progresses || [];
  const solvedCount = list.filter((p) => p.solved === 1).length;

  if (solvedCount < 5) {
    return new Response(
      JSON.stringify({
        error: `All 5 ladders must be solved before finishing. Completed ${solvedCount} of 5.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await finishSession(env.DB, sessionId);

  const totalStrokes = list.reduce((sum, p) => sum + p.strokes, 0);
  const totalPar = puzzle.ladders.reduce((sum, l) => sum + l.par, 0);
  const diff = totalStrokes - totalPar;

  let title = 'Scenic route';
  if (diff <= 0) {
    title = 'Perfect climb';
  } else if (diff <= 2) {
    title = 'Sure-footed';
  } else if (diff <= 5) {
    title = 'Wobbly rungs';
  }

  const summary = puzzle.ladders.map((l) => {
    const p = list.find((pr) => pr.round_number === l.round);
    return {
      round: l.round,
      start: l.start,
      target: l.target,
      strokes: p ? p.strokes : l.par,
      par: l.par,
      optimalPath: l.optimalPath || [l.start, l.target],
    };
  });

  const shareRows = summary
    .map((s) => '▲'.repeat(s.par) + '△'.repeat(Math.max(0, s.strokes - s.par)))
    .join('\n');
  const shareCard = `Rungs #${puzzle.plate}  ${totalStrokes}/${totalPar} strokes\n${shareRows}`;

  const payload: FinishResponse = {
    totalStrokes,
    totalPar,
    difference: diff,
    title,
    summary,
    shareCard,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
