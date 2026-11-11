// Route: GET /api/today
import type { Env, TodayResponse } from '../types.ts';
import { getQuestionsForDate, createOrGetSession, updateSessionServedTime } from '../db.ts';
import { hashIp } from '../rate_limit.ts';
import { BACKLOG_SETS } from '../generator/backlog.ts';

export async function handleTodayRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const now = Date.now();
  const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const sessionId = url.searchParams.get('session');

  // Compute fallback plate number (days since Jan 1, 2026)
  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = targetDate.split('-').map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const fallbackPlate = Math.max(1, Math.floor((curDate - baseDate) / 864e5) + 1);

  let questions = await getQuestionsForDate(env.DB, targetDate);

  // Fallback to backlog if DB questions not yet seeded for today
  if (!questions || questions.length === 0) {
    const dayIdx = Math.abs(Math.floor((curDate - baseDate) / 864e5)) % BACKLOG_SETS.length;
    const backlogDay = BACKLOG_SETS.find((s) => s.date === targetDate) || BACKLOG_SETS[dayIdx];
    questions = backlogDay.questions.map((q, idx) => ({
      id: `q_${targetDate.replace(/-/g, '')}_${idx + 1}`,
      puzzle_date: targetDate,
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

  // If a session ID is provided, record or update the serve time for anti-cheat
  if (sessionId) {
    const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const ipHash = await hashIp(rawIp);
    const session = await createOrGetSession(env.DB, sessionId, targetDate, ipHash, now);
    if (session.current_question_index === 1) {
      await updateSessionServedTime(env.DB, sessionId, now);
    }
  }

  // Sanitize: NEVER leak value, value_log10, explanation, or sources
  const clientQuestions = questions.slice(0, 5).map((q) => ({
    id: q.id,
    question: q.question,
    unit: q.unit,
  }));

  const payload: TodayResponse = {
    plate: fallbackPlate,
    date: targetDate,
    questions: clientQuestions,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
