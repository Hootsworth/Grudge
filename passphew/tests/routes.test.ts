import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.ts';
import type { Env, Puzzle, SessionRecord, GuessRecord, IpLimitRecord } from '../src/types.ts';
import { normalizeGuess } from '../src/security/normalization.ts';

// In-memory mock D1 database implementation for Worker route integration testing
function createMockD1() {
  const puzzles: Map<string, Puzzle> = new Map();
  const sessions: Map<string, SessionRecord> = new Map();
  const guesses: GuessRecord[] = [];
  const ipLimits: Map<string, IpLimitRecord> = new Map();

  // Seed sample puzzle
  const todayStr = new Date().toISOString().split('T')[0];
  const samplePuzzle: Puzzle = {
    id: 'test_puzzle_01',
    date: todayStr,
    plate: 42,
    username: 'root_admin',
    clue: 'Opener of locks, then the error for a missing page',
    answer: 'key404',
    explanation: 'KEY + 404 = KEY404',
    type: 'Charade',
    difficulty: 2,
    status: 'live',
  };
  puzzles.set(samplePuzzle.date, samplePuzzle);
  puzzles.set(samplePuzzle.id, samplePuzzle);

  return {
    _puzzles: puzzles,
    _sessions: sessions,
    _guesses: guesses,
    _ipLimits: ipLimits,

    prepare(query: string) {
      let boundArgs: any[] = [];
      const stmt = {
        bind(...args: any[]) {
          boundArgs = args;
          return stmt;
        },

        async first<T = any>(): Promise<T | null> {
          if (query.includes('FROM puzzles WHERE date = ?')) {
            const dateStr = boundArgs[0];
            return (puzzles.get(dateStr) as unknown as T) || null;
          }
          if (query.includes('FROM puzzles WHERE id = ?')) {
            const id = boundArgs[0];
            return (puzzles.get(id) as unknown as T) || null;
          }
          if (query.includes('FROM sessions WHERE id = ?')) {
            const sid = boundArgs[0];
            return (sessions.get(sid) as unknown as T) || null;
          }
          if (query.includes('FROM ip_rate_limits WHERE ip_hash = ?')) {
            const key = `${boundArgs[0]}_${boundArgs[1]}`;
            return (ipLimits.get(key) as unknown as T) || null;
          }
          if (query.includes('SELECT MAX(plate)')) {
            return { max_plate: 42 } as unknown as T;
          }
          if (query.includes('SELECT id FROM guesses WHERE session_id = ? AND normalized_guess = ?')) {
            const [sid, norm] = boundArgs;
            const found = guesses.find((g) => g.session_id === sid && g.normalized_guess === norm && g.is_correct === 0);
            return (found ? { id: 1 } : null) as unknown as T;
          }
          return null;
        },

        async all<T = any>(): Promise<{ results?: T[] }> {
          if (query.includes('FROM guesses WHERE session_id = ?')) {
            const sid = boundArgs[0];
            const filtered = guesses.filter((g) => g.session_id === sid);
            return { results: filtered as unknown as T[] };
          }
          if (query.includes('FROM sessions WHERE date = ?')) {
            const dateStr = boundArgs[0];
            const filtered = Array.from(sessions.values()).filter((s) => s.date === dateStr);
            return { results: filtered as unknown as T[] };
          }
          if (query.includes('FROM puzzles WHERE date >= ?')) {
            return { results: Array.from(puzzles.values()).map((p) => ({ answer: p.answer })) as unknown as T[] };
          }
          if (query.includes('SELECT id, answer FROM puzzles')) {
            return { results: Array.from(puzzles.values()).map((p) => ({ id: p.id, answer: p.answer })) as unknown as T[] };
          }
          if (query.includes('SELECT normalized_guess, COUNT(*) as cnt FROM guesses')) {
            return { results: [] };
          }
          return { results: [] };
        },

        async run(): Promise<{ success: boolean }> {
          if (query.includes('INSERT INTO sessions')) {
            const [id, date, puzzle_id, ip_hash, started_at] = boundArgs;
            sessions.set(id, {
              id,
              date,
              puzzle_id,
              ip_hash,
              started_at,
              solved_at: null,
              failed_count: 0,
              solve_seconds: null,
              is_bot: 0,
              status: 'active',
            });
          } else if (query.includes('INSERT INTO guesses')) {
            const [session_id, date, guess, normalized_guess, is_correct, attempt_number, created_at, ip_hash] = boundArgs;
            guesses.push({
              session_id,
              date,
              guess,
              normalized_guess,
              is_correct,
              attempt_number,
              created_at,
              ip_hash,
            });
          } else if (query.includes('UPDATE sessions SET failed_count = ? WHERE id = ?')) {
            const [failed, id] = boundArgs;
            const s = sessions.get(id);
            if (s) s.failed_count = failed;
          } else if (query.includes('UPDATE sessions SET status = \'solved\'')) {
            const [solved_at, solve_seconds, id] = boundArgs;
            const s = sessions.get(id);
            if (s) {
              s.status = 'solved';
              s.solved_at = solved_at;
              s.solve_seconds = solve_seconds;
            }
          } else if (query.includes('INSERT INTO ip_rate_limits')) {
            const [ip_hash, date, nowMs, cooldown] = boundArgs;
            const key = `${ip_hash}_${date}`;
            const existing = ipLimits.get(key);
            if (existing) {
              existing.guess_count += 1;
              existing.last_guess_at = nowMs;
              existing.cooldown_until = Math.max(existing.cooldown_until, cooldown);
            } else {
              ipLimits.set(key, {
                ip_hash,
                date,
                guess_count: 1,
                last_guess_at: nowMs,
                cooldown_until: cooldown,
              });
            }
          } else if (query.includes('INSERT INTO puzzles')) {
            const [id, date, plate, username, clue, answer, explanation, type, difficulty, status] = boundArgs;
            const p: Puzzle = { id, date, plate, username, clue, answer, explanation, type, difficulty, status };
            puzzles.set(date, p);
            puzzles.set(id, p);
          }
          return { success: true };
        },
      };
      return stmt;
    },
  } as unknown as D1Database;
}

function mockCtx(): ExecutionContext {
  return {
    waitUntil: (_p: Promise<any>) => {},
    passThroughOnException: () => {},
  } as ExecutionContext;
}

test('Route GET /api/today: returns sanitized plate, username, clue without revealing answer or type', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1 };

  const req = new Request('https://passphew.app/api/today', { method: 'GET' });
  const res = await app.fetch(req, env, mockCtx());

  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  // STRICT LEAK PREVENTION:
  assert.equal(data.plate, 42);
  assert.equal(data.username, 'root_admin');
  assert.equal(data.clue, 'Opener of locks, then the error for a missing page');

  // Verify secret fields are NEVER exposed
  assert.equal(data.answer, undefined);
  assert.equal(data.type, undefined);
  assert.equal(data.explanation, undefined);
  assert.equal(data.length, undefined);
});

test('Route POST /api/guess: wrong guess returns correct: false and increments failed count', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1 };
  const sessionId = 'uuid-test-session-1';

  const req = new Request('https://passphew.app/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, guess: 'wrongpass' }),
  });

  const res = await app.fetch(req, env, mockCtx());
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  assert.equal(data.correct, false);
  assert.equal(data.failed, 1);
  assert.equal(data.answer, undefined);
  assert.equal(data.explanation, undefined);
});

test('Route POST /api/guess: correct guess returns correct: true and victory payload', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1 };
  const sessionId = 'uuid-test-session-2';

  // Submit correct normalized answer: "Key 404" -> "key404"
  const req = new Request('https://passphew.app/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId, guess: 'Key 404' }),
  });

  const res = await app.fetch(req, env, mockCtx());
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  assert.equal(data.correct, true);
  assert.equal(data.answer, 'key404');
  assert.ok(data.explanation);
  assert.equal(typeof data.failedBeforeCrack, 'number');
  assert.equal(typeof data.solveSeconds, 'number');
  assert.equal(typeof data.percentile, 'number');
});

test('Route POST /api/finish: returns failedBeforeCrack, percentile, solveRate', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1 };
  const sessionId = 'uuid-test-finish';

  // Crack puzzle first
  await app.fetch(
    new Request('https://passphew.app/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, guess: 'key404' }),
    }),
    env,
    mockCtx()
  );

  // Call /api/finish
  const req = new Request('https://passphew.app/api/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionId }),
  });

  const res = await app.fetch(req, env, mockCtx());
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  assert.equal(typeof data.failedBeforeCrack, 'number');
  assert.equal(typeof data.percentile, 'number');
  assert.equal(typeof data.solveRate, 'number');
});

test('Route GET /api/stats/yesterday: returns yesterday statistics summary', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1 };

  const req = new Request('https://passphew.app/api/stats/yesterday?date=2026-11-08', {
    method: 'GET',
  });

  const res = await app.fetch(req, env, mockCtx());
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  assert.equal(typeof data.solveRate, 'number');
  assert.equal(typeof data.medianFailedAttempts, 'number');
  assert.ok(Array.isArray(data.mostCommonWrongGuesses));
});

test('Route Admin: deploys fallback puzzle from backlog', async () => {
  const mockD1 = createMockD1();
  const env: Env = { DB: mockD1, APPROVAL_SECRET: 'test-admin-secret' };

  const req = new Request('https://passphew.app/api/admin/deploy-fallback', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-admin-secret',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date: '2026-11-10' }),
  });

  const res = await app.fetch(req, env, mockCtx());
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;

  assert.equal(data.success, true);
  assert.ok(data.puzzle);
  assert.equal(data.puzzle.date, '2026-11-10');
  assert.equal(data.puzzle.status, 'live');
});
