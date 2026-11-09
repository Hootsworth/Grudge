// Route: GET /api/stats/yesterday
import type { Env, YesterdayStatsResponse, QuestionStat } from '../types.ts';
import { getDailyStats, getQuestionsForDate, getOtherGuessesForQuestion, getAllScoresForDate } from '../db.ts';
import { calculateMedian, calculateMostCommonGuess, calculateClosestGuess } from '../crowd.ts';

export async function handleStatsRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const now = Date.now();

  // Compute yesterday's ISO date string
  const d = new Date(now - 864e5);
  const yesterdayStr = url.searchParams.get('date') || d.toISOString().split('T')[0];

  // Try cached aggregated stats first
  const cached = await getDailyStats(env.DB, yesterdayStr);
  if (cached) {
    const payload: YesterdayStatsResponse = {
      date: yesterdayStr,
      totalPlayers: cached.total_players,
      medianScore: cached.median_score || 0,
      medianErrorOrders: cached.median_error_orders || 0,
      questionStats: typeof cached.question_stats === 'string' ? JSON.parse(cached.question_stats) : cached.question_stats || [],
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=900',
      },
    });
  }

  // Dynamic aggregation from DB
  const questions = await getQuestionsForDate(env.DB, yesterdayStr);
  const scores = await getAllScoresForDate(env.DB, yesterdayStr);
  const totalPlayers = scores.length;

  const medianScore = scores.length > 0 ? (calculateMedian(scores, 1) || 0) : 0;

  const questionStats: QuestionStat[] = [];
  for (const q of questions) {
    const guesses = await getOtherGuessesForQuestion(env.DB, q.id);
    if (guesses.length === 0) {
      questionStats.push({
        questionId: q.id,
        unit: q.unit,
        medianError: 0,
        closestGuess: q.value_log10,
        mostCommonGuess: q.value_log10,
      });
      continue;
    }

    const errors = guesses.map((g) => Math.abs(g - q.value_log10));
    const medianErr = calculateMedian(errors, 1) || 0;
    const closest = calculateClosestGuess(q.value_log10, guesses);
    const mostCommon = calculateMostCommonGuess(guesses);

    questionStats.push({
      questionId: q.id,
      unit: q.unit,
      medianError: medianErr,
      closestGuess: closest,
      mostCommonGuess: mostCommon,
    });
  }

  const payload: YesterdayStatsResponse = {
    date: yesterdayStr,
    totalPlayers,
    medianScore,
    medianErrorOrders: questionStats.length > 0 ? (calculateMedian(questionStats.map((s) => s.medianError), 1) || 0) : 0,
    questionStats,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=900',
    },
  });
}
