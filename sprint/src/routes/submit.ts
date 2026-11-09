// Route: POST /api/submit-word
import type { Env, SubmitWordRequest, SubmitWordResponse } from '../types.ts';
import { createOrGetSession, ensurePuzzle, recordValidWord, breakCombo } from '../db.ts';
import { isValidWord, canMakeFromKey, POINT_VALUES } from '../words.ts';
import { hashIp, checkIpRateLimit } from '../rate_limit.ts';

export async function handleSubmitWordRoute(request: Request, env: Env): Promise<Response> {
  const now = Date.now();
  const rawIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipHash = await hashIp(rawIp);
  const fallbackDate = new Date().toISOString().split('T')[0];

  const rateCheck = await checkIpRateLimit(env.DB, ipHash, fallbackDate, now);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: rateCheck.lockoutMessage || 'Rate limit active' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SubmitWordRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { session: sessionId, word: rawWord } = body;
  const todayStr = (body as any).date || fallbackDate;
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid session UUID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const puzzle = await ensurePuzzle(env.DB, todayStr);
  const session = await createOrGetSession(env.DB, sessionId, todayStr, now);

  if (session.status === 'finished') {
    return new Response(JSON.stringify({ error: 'Session has already finished' }), { status: 400 });
  }

  const word = (rawWord || '').toLowerCase().trim();
  const foundWords: string[] = JSON.parse(session.words_found_json);

  // 1. Length bounds (3 to 6)
  if (word.length < 3 || word.length > 6) {
    await breakCombo(env.DB, sessionId);
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        length: word.length,
        basePoints: 0,
        multiplier: 1,
        pointsEarned: 0,
        totalScore: session.score,
        isFever: false,
        isFullBurn: false,
        message: 'Words must be between 3 and 6 letters',
      } satisfies SubmitWordResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Can word be made from the 6 key letters?
  if (!canMakeFromKey(word, puzzle.keyLetters)) {
    await breakCombo(env.DB, sessionId);
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        length: word.length,
        basePoints: 0,
        multiplier: 1,
        pointsEarned: 0,
        totalScore: session.score,
        isFever: false,
        isFullBurn: false,
        message: 'Cannot be made from given letters',
      } satisfies SubmitWordResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Authoritative dictionary validation
  if (!isValidWord(word)) {
    await breakCombo(env.DB, sessionId);
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        length: word.length,
        basePoints: 0,
        multiplier: 1,
        pointsEarned: 0,
        totalScore: session.score,
        isFever: false,
        isFullBurn: false,
        message: 'Not in word database',
      } satisfies SubmitWordResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Duplicate submission check
  if (foundWords.includes(word)) {
    return new Response(
      JSON.stringify({
        valid: false,
        word,
        length: word.length,
        basePoints: 0,
        multiplier: 1,
        pointsEarned: 0,
        totalScore: session.score,
        isFever: false,
        isFullBurn: false,
        message: 'Word already found',
      } satisfies SubmitWordResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Calculate Combo Multiplier: Chained within 5,000 ms (5s)
  let currentCombo = 1;
  if (session.last_word_at && now - session.last_word_at <= 5000) {
    currentCombo = Math.min(4, session.best_combo + 1);
  }

  const basePoints = POINT_VALUES[word.length] || 1;
  const pointsEarned = basePoints * currentCombo;
  const newTotalScore = session.score + pointsEarned;
  const newFoundWords = [...foundWords, word];
  const isFever = currentCombo === 4;
  const isFullBurn = word.length === 6;

  await recordValidWord(env.DB, sessionId, pointsEarned, currentCombo, newFoundWords, now);

  return new Response(
    JSON.stringify({
      valid: true,
      word,
      length: word.length,
      basePoints,
      multiplier: currentCombo,
      pointsEarned,
      totalScore: newTotalScore,
      isFever,
      isFullBurn,
    } satisfies SubmitWordResponse),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
