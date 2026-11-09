// Route: POST /api/finish
import type { Env, FinishRequest, FinishResponse } from '../types.ts';
import {
  createOrGetSession,
  getGuessesForSession,
  getQuestionsForDate,
  getAllScoresForDate,
  completeSession,
} from '../db.ts';
import { getRankTitle } from '../scoring.ts';
import { calculatePercentile } from '../crowd.ts';
import { hashIp } from '../rate_limit.ts';
import { BACKLOG_SETS } from '../generator/backlog.ts';

export async function handleFinishRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const todayStr = new Date().toISOString().split('T')[0];

  let body: FinishRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId } = body;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);
  const guesses = await getGuessesForSession(env.DB, sessionId);

  if (guesses.length < 5) {
    return new Response(
      JSON.stringify({
        error: `Session has completed ${guesses.length} of 5 questions. Finish all questions before requesting results.`,
        completedQuestions: guesses.length,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Load questions for breakdown
  let questions = await getQuestionsForDate(env.DB, todayStr);
  if (!questions || questions.length === 0) {
    const backlogDay = BACKLOG_SETS.find((s) => s.date === todayStr) || BACKLOG_SETS[0];
    questions = backlogDay.questions.map((q, idx) => ({
      id: `q_${todayStr.replace(/-/g, '')}_${idx + 1}`,
      puzzle_date: todayStr,
      question_index: idx + 1,
      question: q.question,
      unit: q.unit,
      value: q.value,
      value_log10: q.valueLog10,
      explanation: q.explanation,
      sources: q.sources,
      category: q.category,
      difficulty: q.difficulty,
      fermi_derivation: q.fermiDerivation,
      created_at: now,
    }));
  }

  const totalPoints = guesses.reduce((acc, g) => acc + g.points, 0);
  const totalErrorOrders = Math.round(guesses.reduce((acc, g) => acc + g.error_orders, 0) * 100) / 100;
  const rank = getRankTitle(totalErrorOrders);

  // Mark session completed
  await completeSession(env.DB, sessionId, now);

  // Compute percentile against today's completed scores
  const allScores = await getAllScoresForDate(env.DB, todayStr);
  const percentile = calculatePercentile(totalPoints, allScores);

  const perQuestion = guesses.map((g) => {
    const q = questions.find((item) => item.id === g.question_id || item.question_index === g.question_index);
    return {
      questionId: g.question_id,
      unit: q?.unit || 'units',
      truth: q?.value || 0,
      guessExponent: g.guess_exponent,
      errorOrders: g.error_orders,
      points: g.points,
    };
  });

  const responsePayload: FinishResponse = {
    total: totalPoints,
    totalErrorOrders,
    rank,
    percentile,
    perQuestion,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
