// quipher/tests/routes.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import type { Env } from '../src/types.ts';
import { BACKLOG_QUOTES } from '../src/backlog/backlog.ts';
import { invertKey } from '../src/cipher.ts';

// In-memory mock SQLite/D1 for route testing
class MockD1 {
  quotes = new Map<string, any>();
  sessions = new Map<string, any>();
  events: any[] = [];
  ipRateLimits = new Map<string, any>();

  prepare(query: string) {
    const self = this;
    return {
      bind(...args: any[]) {
        return {
          async first<T = any>(): Promise<T | null> {
            if (query.includes('FROM quotes WHERE puzzle_date = ?')) {
              return (self.quotes.get(args[0]) as T) || null;
            }
            if (query.includes('FROM sessions WHERE session_id = ?')) {
              return (self.sessions.get(args[0]) as T) || null;
            }
            if (query.includes('SELECT checks_count FROM sessions')) {
              const s = self.sessions.get(args[0]);
              return s ? ({ checks_count: s.checks_count } as T) : null;
            }
            if (query.includes('SELECT hints_count FROM sessions')) {
              const s = self.sessions.get(args[0]);
              return s ? ({ hints_count: s.hints_count } as T) : null;
            }
            if (query.includes('FROM ip_rate_limits')) {
              return (self.ipRateLimits.get(`${args[0]}_${args[1]}`) as T) || null;
            }
            if (query.includes('FROM daily_stats')) {
              return null;
            }
            return null;
          },
          async all<T = any>(): Promise<{ results?: T[] }> {
            if (query.includes('FROM sessions WHERE puzzle_date = ? AND status = \'solved\'')) {
              const res = Array.from(self.sessions.values())
                .filter((s) => s.puzzle_date === args[0] && s.status === 'solved' && s.score != null)
                .map((s) => ({ score: s.score }));
              return { results: res as T[] };
            }
            if (query.includes('FROM sessions WHERE puzzle_date = ?')) {
              const res = Array.from(self.sessions.values()).filter((s) => s.puzzle_date === args[0]);
              return { results: res as T[] };
            }
            if (query.includes('FROM events WHERE session_id = ?')) {
              const res = self.events.filter((e) => e.session_id === args[0] && e.event_type === 'check');
              return { results: res as T[] };
            }
            if (query.includes('FROM events WHERE puzzle_date = ? AND event_type = \'hint\'')) {
              const res = self.events.filter((e) => e.puzzle_date === args[0] && e.event_type === 'hint');
              return { results: res as T[] };
            }
            return { results: [] };
          },
          async run(): Promise<any> {
            if (query.includes('INSERT OR REPLACE INTO quotes') || query.includes('INSERT INTO quotes')) {
              self.quotes.set(args[1], {
                id: args[0],
                puzzle_date: args[1],
                plate: args[2],
                plaintext: args[3],
                author: args[4],
                source: args[5],
                year: args[6],
                ciphertext: args[7],
                cipher_key: args[8],
                difficulty: args[9],
                entropy: args[10],
                created_at: args[11],
              });
            } else if (query.includes('INSERT INTO sessions')) {
              self.sessions.set(args[0], {
                session_id: args[0],
                puzzle_date: args[1],
                ip_hash: args[2],
                started_at: args[3],
                solved_at: null,
                solve_seconds: null,
                checks_count: 0,
                hints_count: 0,
                last_check_at: 0,
                score: null,
                rank_title: null,
                status: 'in_progress',
                flagged_reason: null,
                created_at: args[4],
              });
            } else if (query.includes('UPDATE sessions SET checks_count = checks_count + 1')) {
              const s = self.sessions.get(args[1]);
              if (s) {
                s.checks_count = (s.checks_count || 0) + 1;
                s.last_check_at = args[0];
              }
            } else if (query.includes('UPDATE sessions SET hints_count = hints_count + 1')) {
              const s = self.sessions.get(args[0]);
              if (s) {
                s.hints_count = (s.hints_count || 0) + 1;
              }
            } else if (query.includes('UPDATE sessions SET') && query.includes('solved_at = ?')) {
              const s = self.sessions.get(args[6]);
              if (s) {
                s.solved_at = args[0];
                s.solve_seconds = args[1];
                s.score = args[2];
                s.rank_title = args[3];
                s.status = args[4];
                s.flagged_reason = args[5];
              }
            } else if (query.includes('INSERT INTO events')) {
              self.events.push({
                id: args[0],
                session_id: args[1],
                puzzle_date: args[2],
                event_type: args[3],
                payload_json: args[4],
                created_at: args[5],
              });
            } else if (query.includes('INSERT INTO ip_rate_limits')) {
              self.ipRateLimits.set(`${args[0]}_${args[1]}`, { request_count: 1 });
            } else if (query.includes('UPDATE ip_rate_limits')) {
              const k = `${args[0]}_${args[1]}`;
              const cur = self.ipRateLimits.get(k);
              if (cur) cur.request_count++;
            }
            return { success: true };
          },
        };
      },
    };
  }
}

test('Route GET /api/today: returns ciphertext and letter count without leaking plaintext or key', async () => {
  const db = new MockD1();
  const env: Env = { DB: db as unknown as D1Database };

  const testDate = '2026-11-10';
  const req = new Request(`https://quipher.test/api/today?date=${testDate}&session=sess_test_1`);
  const res = await worker.fetch(req, env);

  assert.strictEqual(res.status, 200);
  const data = await res.json() as any;

  assert.ok(data.plate >= 1);
  assert.ok(typeof data.ciphertext === 'string' && data.ciphertext.length > 0);
  assert.ok(typeof data.letterCount === 'number' && data.letterCount > 0);

  // CRITICAL SECURITY ASSERTION: No plaintext, key, author, or source is leaked
  assert.strictEqual(data.plaintext, undefined);
  assert.strictEqual(data.cipher_key, undefined);
  assert.strictEqual(data.key, undefined);
  assert.strictEqual(data.author, undefined);
  assert.strictEqual(data.source, undefined);
});

test('Route POST /api/check: tracks incorrect letters and enforces 3-second interval', async () => {
  const db = new MockD1();
  const env: Env = { DB: db as unknown as D1Database };

  const testDate = '2026-11-10';
  const sessionId = 'sess_check_1';

  // Start session
  await worker.fetch(new Request(`https://quipher.test/api/today?date=${testDate}&session=${sessionId}`), env);

  // Find quote truth
  const quote = BACKLOG_QUOTES.find((q) => q.date === testDate)!;
  const truth = invertKey(quote.cipher_key);
  const cipherLetters = Object.keys(truth);

  // Submit check with 1 correct letter and 1 wrong letter
  const checkBody = {
    session: sessionId,
    date: testDate,
    mapping: {
      [cipherLetters[0]]: truth[cipherLetters[0]], // correct
      [cipherLetters[1]]: 'Z' === truth[cipherLetters[1]] ? 'A' : 'Z', // wrong
    },
  };

  const res1 = await worker.fetch(
    new Request('https://quipher.test/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody),
    }),
    env
  );

  assert.strictEqual(res1.status, 200);
  const data1 = await res1.json() as any;
  assert.strictEqual(data1.checks, 1);
  assert.deepStrictEqual(data1.wrong, [cipherLetters[1]]);
  assert.strictEqual(data1.solved, false);

  // Immediate second check within 3s must be rejected with 429
  const res2 = await worker.fetch(
    new Request('https://quipher.test/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody),
    }),
    env
  );

  assert.strictEqual(res2.status, 429);
  const data2 = await res2.json() as any;
  assert.ok(data2.error?.includes('3 seconds'));
});

test('Route POST /api/hint: reveals most frequent unassigned cipher letter', async () => {
  const db = new MockD1();
  const env: Env = { DB: db as unknown as D1Database };

  const testDate = '2026-11-10';
  const sessionId = 'sess_hint_1';

  await worker.fetch(new Request(`https://quipher.test/api/today?date=${testDate}&session=${sessionId}`), env);

  const res = await worker.fetch(
    new Request('https://quipher.test/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, date: testDate, mapping: {} }),
    }),
    env
  );

  assert.strictEqual(res.status, 200);
  const data = await res.json() as any;
  assert.ok(data.cipherLetter);
  assert.ok(data.plainLetter);
  assert.strictEqual(data.hints, 1);
});

test('Route POST /api/solve: reveals quote only on full solve and computes score/rank', async () => {
  const db = new MockD1();
  const env: Env = { DB: db as unknown as D1Database };

  const testDate = '2026-11-10';
  const sessionId = 'sess_solve_1';

  await worker.fetch(new Request(`https://quipher.test/api/today?date=${testDate}&session=${sessionId}`), env);

  // Incomplete solve attempt
  const badRes = await worker.fetch(
    new Request('https://quipher.test/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, date: testDate, mapping: { A: 'B' } }),
    }),
    env
  );
  assert.strictEqual(badRes.status, 200);
  const badData = await badRes.json() as any;
  assert.strictEqual(badData.solved, false);
  assert.strictEqual(badData.plaintext, undefined);

  // Construct complete correct mapping
  const quote = BACKLOG_QUOTES.find((q) => q.date === testDate)!;
  const truth = invertKey(quote.cipher_key);

  // Mock started_at to simulate a 90-second solve
  const session = db.sessions.get(sessionId);
  session.started_at = Date.now() - 90000;

  const goodRes = await worker.fetch(
    new Request('https://quipher.test/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, date: testDate, mapping: truth }),
    }),
    env
  );

  assert.strictEqual(goodRes.status, 200);
  const goodData = await goodRes.json() as any;
  assert.strictEqual(goodData.solved, true);
  assert.strictEqual(goodData.plaintext, quote.plaintext);
  assert.strictEqual(goodData.author, quote.author);
  assert.strictEqual(goodData.year, quote.year);
  assert.ok(goodData.solveSeconds >= 85);
  assert.ok(goodData.score >= 85);
  assert.strictEqual(goodData.rank, 'Codebreaker');
  assert.strictEqual(goodData.percentile, 100);
});

test('Route GET /api/stats/yesterday: returns yesterday solve metrics', async () => {
  const db = new MockD1();
  const env: Env = { DB: db as unknown as D1Database };

  const yesterdayDate = '2026-11-09';
  // Seed two solved sessions for yesterday
  db.sessions.set('s1', {
    session_id: 's1',
    puzzle_date: yesterdayDate,
    solve_seconds: 100,
    status: 'solved',
    score: 100,
  });
  db.sessions.set('s2', {
    session_id: 's2',
    puzzle_date: yesterdayDate,
    solve_seconds: 140,
    status: 'solved',
    score: 140,
  });

  const req = new Request(`https://quipher.test/api/stats/yesterday?date=${yesterdayDate}`);
  const res = await worker.fetch(req, env);

  assert.strictEqual(res.status, 200);
  const data = await res.json() as any;
  assert.strictEqual(data.date, yesterdayDate);
  assert.strictEqual(data.totalSolves, 2);
  assert.strictEqual(data.medianSolveTime, 120);
  assert.strictEqual(data.solveRate, 100);
});
