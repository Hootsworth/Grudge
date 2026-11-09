// Route: Admin endpoints (/api/admin/publish, /api/admin/approve)
import type { Env, QuestionRecord } from '../types.ts';
import { insertQuestion } from '../db.ts';

function isAuthorized(request: Request, env: Env): boolean {
  const secret = env.APPROVAL_SECRET || 'ballpark-admin-secret-key';
  const authHeader = request.headers.get('Authorization');
  const url = new URL(request.url);
  const tokenQuery = url.searchParams.get('token') || url.searchParams.get('secret');

  if (tokenQuery && tokenQuery === secret) return true;
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === secret) return true;
  return false;
}

export async function handleAdminPublish(
  request: Request,
  env: Env
): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid approval secret' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { date?: string; questions?: any[] };
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { date, questions } = body;
  if (!date || !Array.isArray(questions) || questions.length !== 5) {
    return new Response(
      JSON.stringify({ error: 'Body must include date and exactly 5 questions' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const now = Date.now();
  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const record: QuestionRecord = {
      id: q.id || `q_${date.replace(/-/g, '')}_${idx + 1}`,
      puzzle_date: date,
      question_index: idx + 1,
      question: q.question,
      unit: q.unit,
      value: q.value,
      value_log10: q.valueLog10 || Math.round(Math.log10(q.value) * 1000) / 1000,
      explanation: q.explanation,
      sources: Array.isArray(q.sources) ? q.sources : [q.sources],
      category: q.category || 'everyday life',
      difficulty: q.difficulty || 3,
      fermi_derivation: q.fermiDerivation || null,
      created_at: now,
    };
    await insertQuestion(env.DB, record);
  }

  return new Response(
    JSON.stringify({ success: true, date, publishedQuestions: questions.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function handleAdminApprove(
  request: Request,
  env: Env
): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return new Response('<h1>401 Unauthorized</h1><p>Invalid or expired approval token.</p>', {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date) {
    return new Response('<h1>400 Bad Request</h1><p>Missing date parameter.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response(
    `<!DOCTYPE html><html><head><title>Ballpark Approved</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#fbf6e8;color:#1c2a2b}h1{color:#1f7a72}</style></head><body><h1>🎉 Ballpark Approved for ${date}</h1><p>The daily questions have been approved and are now scheduled for release.</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
