// Route: POST /api/guess
import type { Env, GuessRequest, GuessResponse, QuestionRecord } from '../types.ts';
import {
  createOrGetSession,
  getQuestionById,
  getQuestionsForDate,
  recordGuess,
  getGuessesForSession,
  getOtherGuessesForQuestion,
  advanceSessionQuestion,
} from '../db.ts';
import { calculateErrorOrders, calculatePoints } from '../scoring.ts';
import { calculateMedian, calculatePercentile } from '../crowd.ts';
import { hashIp, checkIpRateLimit, validateGuessTiming } from '../rate_limit.ts';
import { BACKLOG_SETS } from '../generator/backlog.ts';

export async function handleGuessRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, now);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfterSeconds || 10),
        },
      }
    );
  }

  let body: GuessRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, questionId, exponent } = body;
  const todayStr = (body as any).date || new Date().toISOString().split('T')[0];

  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof exponent !== 'number' || isNaN(exponent)) {
    return new Response(JSON.stringify({ error: 'Exponent must be a valid number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (exponent < 0 || exponent > 24) {
    return new Response(
      JSON.stringify({ error: 'Exponent must be between 0 and 24 (10^0 to 10^24)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await createOrGetSession(env.DB, sessionId, todayStr, ipHash, now);

  // Look up question from DB or fallback
  let question: QuestionRecord | null = await getQuestionById(env.DB, questionId);
  if (!question) {
    const backlogDay = BACKLOG_SETS.find((s) => s.date === todayStr) || BACKLOG_SETS[0];
    const match = backlogDay.questions.find(
      (q, idx) => `q_${todayStr.replace(/-/g, '')}_${idx + 1}` === questionId || String(idx + 1) === questionId
    );
    if (match) {
      const idx = backlogDay.questions.indexOf(match) + 1;
      question = {
        id: questionId,
        puzzle_date: todayStr,
        question_index: idx,
        question: match.question,
        unit: match.unit,
        value: match.value,
        value_log10: match.valueLog10,
        explanation: match.explanation,
        sources: match.sources,
        category: match.category,
        difficulty: match.difficulty,
        fermi_derivation: match.fermiDerivation,
        created_at: now,
      };
    }
  }

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Enforce question sequence order (Questions are answered in order)
  if (question.question_index !== session.current_question_index) {
    return new Response(
      JSON.stringify({
        error: `Out-of-order guess rejected. Currently on question ${session.current_question_index}.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Anti-cheat: reject guesses faster than 2 seconds after question was served
  if (!validateGuessTiming(session.question_served_at, now)) {
    return new Response(
      JSON.stringify({
        error: 'Guess submitted too fast. Please take at least 2 seconds to consider your estimate.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Enforce one guess per question per session
  const previousGuesses = await getGuessesForSession(env.DB, sessionId);
  if (previousGuesses.some((g) => g.question_id === questionId)) {
    return new Response(
      JSON.stringify({ error: `Question ${questionId} has already been answered in this session.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const durationMs = now - session.question_served_at;
  const errorOrders = calculateErrorOrders(exponent, question.value_log10);
  const points = calculatePoints(errorOrders);

  // Record guess
  await recordGuess(env.DB, {
    sessionId,
    questionId: question.id,
    puzzleDate: todayStr,
    questionIndex: question.question_index,
    guessExponent: Math.round(exponent * 100) / 100,
    errorOrders: Math.round(errorOrders * 1000) / 1000,
    points,
    durationMs,
    now,
  });

  // Advance session to next question (or finish if 5th)
  const nextIndex = session.current_question_index + 1;
  await advanceSessionQuestion(env.DB, sessionId, nextIndex, points, errorOrders, now);

  // Compute crowd statistics:
  // "medianGuess is the median exponent of all other players' guesses for this question (only returned after the player has guessed). Return null until at least 30 players have guessed."
  const otherGuesses = await getOtherGuessesForQuestion(env.DB, question.id, sessionId);
  const medianGuess = calculateMedian(otherGuesses, 30);

  // Compute percentile based on error orders (lower error is better)
  const allOtherErrors = otherGuesses.map((g) => Math.abs(g - question!.value_log10));
  let percentile = 50;
  if (allOtherErrors.length > 0) {
    const worseCount = allOtherErrors.filter((e) => e > errorOrders).length;
    percentile = Math.max(1, Math.min(100, Math.round((worseCount / allOtherErrors.length) * 100)));
  }

  const responsePayload: GuessResponse = {
    truth: question.value,
    truthLog10: question.value_log10,
    errorOrders: Math.round(errorOrders * 100) / 100,
    points,
    explanation: question.explanation,
    sources: question.sources,
    medianGuess,
    percentile,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
