// End-to-end route tests for Ballpark Worker
import { test } from 'node:test';
import assert from 'node:assert';
import worker from '../src/index.ts';

// In-memory mock D1 database
function createMockD1() {
  const tables: Record<string, any[]> = {
    questions: [],
    sessions: [],
    guesses: [],
    daily_stats: [],
    ip_rate_limits: [],
  };

  return {
    prepare(query: string) {
      let boundParams: any[] = [];
      return {
        bind(...params: any[]) {
          boundParams = params;
          return this;
        },
        async first<T = any>(): Promise<T | null> {
          const res = await this.all<T>();
          return res.results && res.results.length > 0 ? res.results[0] : null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const q = query.trim().toUpperCase();

          if (q.includes('FROM QUESTIONS WHERE ID = ?')) {
            const id = boundParams[0];
            const found = tables.questions.find((x) => x.id === id);
            return { results: found ? [found as T] : [] };
          }

          if (q.includes('FROM QUESTIONS WHERE PUZZLE_DATE = ?')) {
            const date = boundParams[0];
            const found = tables.questions.filter((x) => x.puzzle_date === date);
            return { results: found as T[] };
          }

          if (q.includes('FROM SESSIONS WHERE SESSION_ID = ?')) {
            const id = boundParams[0];
            const found = tables.sessions.find((x) => x.session_id === id);
            return { results: found ? [found as T] : [] };
          }

          if (q.includes('FROM SESSIONS WHERE PUZZLE_DATE = ? AND COMPLETED_AT IS NOT NULL')) {
            const date = boundParams[0];
            const found = tables.sessions.filter((x) => x.puzzle_date === date && x.completed_at != null);
            return { results: found.map((s) => ({ total_points: s.total_points })) as T[] };
          }

          if (q.includes('FROM GUESSES WHERE SESSION_ID = ?')) {
            const id = boundParams[0];
            const found = tables.guesses.filter((x) => x.session_id === id);
            return { results: found as T[] };
          }

          if (q.includes('FROM GUESSES WHERE QUESTION_ID = ?')) {
            const qid = boundParams[0];
            const excludeSession = boundParams[1];
            let found = tables.guesses.filter((x) => x.question_id === qid);
            if (excludeSession) {
              found = found.filter((x) => x.session_id !== excludeSession);
            }
            return { results: found.map((g) => ({ guess_exponent: g.guess_exponent })) as T[] };
          }

          if (q.includes('FROM DAILY_STATS WHERE PUZZLE_DATE = ?')) {
            const date = boundParams[0];
            const found = tables.daily_stats.find((x) => x.puzzle_date === date);
            return { results: found ? [found as T] : [] };
          }

          if (q.includes('FROM IP_RATE_LIMITS WHERE IP_HASH = ?')) {
            const [hash, win] = boundParams;
            const found = tables.ip_rate_limits.find((x) => x.ip_hash === hash && x.window_start === win);
            return { results: found ? [{ request_count: found.request_count }] as T[] : [] };
          }

          return { results: [] };
        },
        async run(): Promise<{ success: boolean }> {
          const q = query.trim().toUpperCase();

          if (q.startsWith('INSERT INTO SESSIONS')) {
            const [id, date, qServed, ipHash, created] = boundParams;
            tables.sessions.push({
              session_id: id,
              puzzle_date: date,
              current_question_index: 1,
              question_served_at: qServed,
              ip_hash: ipHash,
              total_points: 0,
              total_error_orders: 0,
              completed_at: null,
              created_at: created,
            });
            return { success: true };
          }

          if (q.startsWith('UPDATE SESSIONS SET QUESTION_SERVED_AT = ?')) {
            const [servedAt, id] = boundParams;
            const s = tables.sessions.find((x) => x.session_id === id);
            if (s) s.question_served_at = servedAt;
            return { success: true };
          }

          if (q.startsWith('UPDATE SESSIONS SET CURRENT_QUESTION_INDEX = ?')) {
            const [nextIdx, servedAt, pts, err, id] = boundParams;
            const s = tables.sessions.find((x) => x.session_id === id);
            if (s) {
              s.current_question_index = nextIdx;
              s.question_served_at = servedAt;
              s.total_points += pts;
              s.total_error_orders += err;
            }
            return { success: true };
          }

          if (q.startsWith('UPDATE SESSIONS SET COMPLETED_AT = ?')) {
            const [compAt, id] = boundParams;
            const s = tables.sessions.find((x) => x.session_id === id);
            if (s) s.completed_at = compAt;
            return { success: true };
          }

          if (q.startsWith('INSERT INTO GUESSES')) {
            const [sId, qId, pDate, qIdx, gExp, err, pts, dur, created] = boundParams;
            tables.guesses.push({
              session_id: sId,
              question_id: qId,
              puzzle_date: pDate,
              question_index: qIdx,
              guess_exponent: gExp,
              error_orders: err,
              points: pts,
              duration_ms: dur,
              created_at: created,
            });
            return { success: true };
          }

          if (q.startsWith('INSERT INTO IP_RATE_LIMITS')) {
            const [hash, win, count] = boundParams;
            const existing = tables.ip_rate_limits.find((x) => x.ip_hash === hash && x.window_start === win);
            if (existing) {
              existing.request_count += count;
            } else {
              tables.ip_rate_limits.push({ ip_hash: hash, window_start: win, request_count: count });
            }
            return { success: true };
          }

          return { success: true };
        },
      };
    },
    tables,
  } as unknown as D1Database & { tables: Record<string, any[]> };
}

test('Route GET /api/today: returns 5 questions without leaking answers, values, or explanations', async () => {
  const db = createMockD1();
  const env = { DB: db as unknown as D1Database };

  const req = new Request('https://ballpark.example.com/api/today');
  const res = await worker.fetch(req, env, {} as ExecutionContext);

  assert.strictEqual(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(data.plate >= 1);
  assert.strictEqual(data.questions.length, 5);

  for (const q of data.questions) {
    assert.ok(q.id);
    assert.ok(q.question);
    assert.ok(q.unit);
    // CRITICAL SECURITY: Never leak truth, value, valueLog10, or explanation
    assert.strictEqual(q.value, undefined);
    assert.strictEqual(q.value_log10, undefined);
    assert.strictEqual(q.valueLog10, undefined);
    assert.strictEqual(q.explanation, undefined);
    assert.strictEqual(q.sources, undefined);
  }
});

test('Route POST /api/guess: enforces in-order answering and rejects out-of-order questions', async () => {
  const db = createMockD1();
  const env = { DB: db as unknown as D1Database };

  const sessionId = 'test_session_order';

  // Request today to initialize session
  await worker.fetch(
    new Request(`https://ballpark.example.com/api/today?session=${sessionId}`),
    env,
    {} as ExecutionContext
  );

  // Attempt to answer question 3 when currently on question 1
  const todayStr = new Date().toISOString().split('T')[0];
  const q3Id = `q_${todayStr.replace(/-/g, '')}_3`;

  const req = new Request('https://ballpark.example.com/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, questionId: q3Id, exponent: 12.0 }),
  });
  const res = await worker.fetch(req, env, {} as ExecutionContext);

  assert.strictEqual(res.status, 400);
  const data = (await res.json()) as any;
  assert.ok(data.error.includes('Out-of-order guess rejected'));
});

test('Route POST /api/guess: rejects guesses submitted under 2 seconds (anti-cheat)', async () => {
  const db = createMockD1();
  const env = { DB: db as unknown as D1Database };

  const sessionId = 'test_session_fast';
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize session with current timestamp
  await worker.fetch(
    new Request(`https://ballpark.example.com/api/today?session=${sessionId}`),
    env,
    {} as ExecutionContext
  );

  // Submit immediately (< 2.0s)
  const q1Id = `q_${todayStr.replace(/-/g, '')}_1`;
  const req = new Request('https://ballpark.example.com/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, questionId: q1Id, exponent: 2.6 }),
  });
  const res = await worker.fetch(req, env, {} as ExecutionContext);

  assert.strictEqual(res.status, 400);
  const data = (await res.json()) as any;
  assert.ok(data.error.includes('too fast'));
});

test('Route POST /api/guess: allows valid guess after 2s, enforces one guess per question', async () => {
  const db = createMockD1();
  const env = { DB: db as unknown as D1Database };

  const sessionId = 'test_session_valid';
  const todayStr = new Date().toISOString().split('T')[0];

  await worker.fetch(
    new Request(`https://ballpark.example.com/api/today?session=${sessionId}`),
    env,
    {} as ExecutionContext
  );

  // Set served_at to 3 seconds ago to satisfy anti-cheat
  const sessionRow = (db as any).tables.sessions.find((s: any) => s.session_id === sessionId);
  sessionRow.question_served_at = Date.now() - 3000;

  const q1Id = `q_${todayStr.replace(/-/g, '')}_1`;
  const req = new Request('https://ballpark.example.com/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, questionId: q1Id, exponent: 2.64 }),
  });
  const res = await worker.fetch(req, env, {} as ExecutionContext);

  assert.strictEqual(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(data.truth > 0);
  assert.ok(data.points >= 0);
  assert.ok(data.explanation);
  assert.strictEqual(data.medianGuess, null); // < 30 players

  // Attempting to answer Q1 again in the same session must be rejected
  const reqDup = new Request('https://ballpark.example.com/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, questionId: q1Id, exponent: 3.0 }),
  });
  const resDup = await worker.fetch(reqDup, env, {} as ExecutionContext);
  assert.strictEqual(resDup.status, 400);
});

test('Full round progression and finish route', async () => {
  const db = createMockD1();
  const env = { DB: db as unknown as D1Database };

  const sessionId = 'test_session_finish';
  const todayStr = new Date().toISOString().split('T')[0];

  await worker.fetch(
    new Request(`https://ballpark.example.com/api/today?session=${sessionId}`),
    env,
    {} as ExecutionContext
  );

  // Answering all 5 questions sequentially
  for (let i = 1; i <= 5; i++) {
    const sessionRow = (db as any).tables.sessions.find((s: any) => s.session_id === sessionId);
    sessionRow.question_served_at = Date.now() - 2500;

    const qId = `q_${todayStr.replace(/-/g, '')}_${i}`;
    const req = new Request('https://ballpark.example.com/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, questionId: qId, exponent: 5.0 + i }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    assert.strictEqual(res.status, 200);
  }

  // Call /api/finish
  const finishReq = new Request('https://ballpark.example.com/api/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId }),
  });
  const finishRes = await worker.fetch(finishReq, env, {} as ExecutionContext);

  assert.strictEqual(finishRes.status, 200);
  const finishData = (await finishRes.json()) as any;
  assert.ok(typeof finishData.total === 'number');
  assert.ok(typeof finishData.totalErrorOrders === 'number');
  assert.ok(finishData.rank);
  assert.strictEqual(finishData.perQuestion.length, 5);
});
