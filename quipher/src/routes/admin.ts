// quipher/src/routes/admin.ts

import type { Env, QuoteRecord } from '../types.ts';
import { saveQuote } from '../db.ts';
import { generateDerangementKey, encryptQuote, calculateLetterEntropy, getDifficultyRating } from '../cipher.ts';

export async function handleAdminApproveRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const secret = env.APPROVAL_SECRET || 'quipher-admin-secret-key';
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.replace(/^Bearer\s+/i, '');

  let body: any = {};
  try {
    body = await request.json();
    if (!token && body.token) {
      token = body.token;
    }
  } catch {}

  if (token !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid admin token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { date, plaintext, author, source, year } = body;
  if (!date || !plaintext || !author || !source || !year) {
    return new Response(
      JSON.stringify({ error: 'Missing required quote fields (date, plaintext, author, source, year)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const cipherKey = generateDerangementKey();
  const ciphertext = encryptQuote(plaintext, cipherKey);
  const entropy = calculateLetterEntropy(plaintext);
  const difficulty = getDifficultyRating(entropy, plaintext.length);

  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = date.split('-').map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const plate = Math.max(1, Math.floor((curDate - baseDate) / 864e5) + 1);

  const quote: QuoteRecord = {
    id: `quote_${date.replace(/-/g, '')}`,
    puzzle_date: date,
    plate,
    plaintext,
    author,
    source,
    year,
    ciphertext,
    cipher_key: JSON.stringify(cipherKey),
    difficulty,
    entropy,
    created_at: Date.now(),
  };

  await saveQuote(env.DB, quote);

  return new Response(
    JSON.stringify({ success: true, message: `Approved quote for ${date}`, plate }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
