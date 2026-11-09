import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../worker/index.ts';
import type {
  Env,
  Puzzle,
  Round,
  SessionRecord,
  GuessRecord,
  WindowRendering,
} from '../worker/types.ts';

// In-memory mock D1 and KV for testing Worker routes
function createMockEnv(): Env {
  const puzzles = new Map<string, Puzzle>();
  const rounds = new Map<string, Round>();
  const sessions = new Map<string, SessionRecord>();
  const guesses: GuessRecord[] = [];
  const ipLimits = new Map<string, any>();
  const kvStore = new Map<string, string>();

  // Seed sample day
  const testDate = '2026-11-09';
  puzzles.set(testDate, {
    date: testDate,
    plate: 42,
    status: 'live',
    created_at: Date.now(),
  });

  const testSpots = [
    { num: 1, name: 'Strait of Gibraltar', lat: 35.96, lon: -5.6, continent: 'Europe' },
    { num: 2, name: 'Sinai Peninsula', lat: 29.5, lon: 33.8, continent: 'Asia' },
    { num: 3, name: 'Baja California', lat: 28.0, lon: -113.5, continent: 'North America' },
    { num: 4, name: 'Bosphorus Strait', lat: 41.1, lon: 29.05, continent: 'Europe' },
    { num: 5, name: 'Cape of Good Hope', lat: -34.35, lon: 18.49, continent: 'Africa' },
  ];

  for (const s of testSpots) {
    const key = `${testDate}_${s.num}`;
    rounds.set(key, {
      id: key,
      puzzle_date: testDate,
      round_number: s.num,
      name: s.name,
      fact: `${s.name} is a key maritime landmark.`,
      source_url: 'https://en.wikipedia.org',
      lat: s.lat,
      lon: s.lon,
      continent: s.continent,
      difficulty: 2,
      created_at: Date.now(),
    });

    // Seed mock window for level 0, 1, 2
    for (let l = 0; l <= 2; l++) {
      kvStore.set(
        `puzzle/${testDate}/${s.num}/${l}/4:3`,
        JSON.stringify({
          viewBox: `0 0 ${l === 0 ? 90 : l === 1 ? 220 : 550} 67.5`,
          kmPerUnit: 11.1,
          shapes: [{ d: 'M0,0 L90,67.5 Z', cls: 'c0' }],
        })
      );
    }
  }

  const mockDb = {
    prepare(query: string) {
      let boundArgs: any[] = [];
      const stmt = {
        bind(...args: any[]) {
          boundArgs = args;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          if (query.includes('FROM puzzles WHERE date = ?')) {
            return (puzzles.get(boundArgs[0]) as unknown as T) || null;
          }
          if (query.includes('FROM rounds WHERE puzzle_date = ? AND round_number = ?')) {
            return (rounds.get(`${boundArgs[0]}_${boundArgs[1]}`) as unknown as T) || null;
          }
          if (query.includes('FROM sessions WHERE id = ?')) {
            return (sessions.get(boundArgs[0]) as unknown as T) || null;
          }
          if (query.includes('FROM ip_rate_limits WHERE ip_hash = ?')) {
            return (ipLimits.get(`${boundArgs[0]}_${boundArgs[1]}`) as unknown as T) || null;
          }
          if (query.includes('SELECT hints_used FROM sessions')) {
            const s = sessions.get(boundArgs[0]);
            return (s ? { hints_used: s.hints_used } : null) as unknown as T;
          }
          return null;
        },
        async all<T = any>(): Promise<{ results?: T[] }> {
          if (query.includes('FROM rounds WHERE puzzle_date = ?')) {
            const list = Array.from(rounds.values()).filter((r) => r.puzzle_date === boundArgs[0]);
            return { results: list as unknown as T[] };
          }
          if (query.includes('FROM guesses WHERE session_id = ?')) {
            const list = guesses.filter((g) => g.session_id === boundArgs[0]);
            return { results: list as unknown as T[] };
          }
          if (query.includes('FROM sessions WHERE puzzle_date = ? AND status = "finished"')) {
            const list = Array.from(sessions.values()).filter((s) => s.puzzle_date === boundArgs[0] && s.status === 'finished');
            return { results: list as unknown as T[] };
          }
          if (query.includes('FROM guesses WHERE puzzle_date = ?')) {
            const list = guesses.filter((g) => g.puzzle_date === boundArgs[0]);
            return { results: list as unknown as T[] };
          }
          return { results: [] };
        },
        async run(): Promise<{ success: boolean }> {
          if (query.includes('INSERT INTO sessions')) {
            const [id, puzzle_date, current_round, round_started_at, hints_used, total_score, ip_hash, status, started_at, finished_at] = boundArgs;
            sessions.set(id, { id, puzzle_date, current_round, round_started_at, hints_used, total_score, ip_hash, status, started_at, finished_at });
          } else if (query.includes('UPDATE sessions SET current_round = ?, round_started_at = ?, hints_used = 0')) {
            const [cr, rsa, id] = boundArgs;
            const s = sessions.get(id);
            if (s) {
              s.current_round = cr;
              s.round_started_at = rsa;
              s.hints_used = 0;
            }
          } else if (query.includes('UPDATE sessions SET hints_used = ?')) {
            const [hu, id] = boundArgs;
            const s = sessions.get(id);
            if (s) s.hints_used = hu;
          } else if (query.includes('INSERT INTO guesses')) {
            const [session_id, puzzle_date, round_number, guess_lat, guess_lon, distance_km, points, hints_used, duration_ms, created_at] = boundArgs;
            guesses.push({ session_id, puzzle_date, round_number, guess_lat, guess_lon, distance_km, points, hints_used, duration_ms, created_at });
          } else if (query.includes('UPDATE sessions') && query.includes('total_score = total_score + ?')) {
            const [nextRound, pts, status, finished_at, id] = boundArgs;
            const s = sessions.get(id);
            if (s) {
              s.current_round = nextRound;
              s.total_score += pts;
              s.status = status;
              s.finished_at = finished_at;
            }
          } else if (query.includes('INSERT INTO ip_rate_limits')) {
            const [ip_hash, date, nowMs] = boundArgs;
            ipLimits.set(`${ip_hash}_${date}`, { request_count: 1, last_request_at: nowMs, cooldown_until: 0 });
          }
          return { success: true };
        },
      };
      return stmt;
    },
  } as unknown as D1Database;

  const mockKv = {
    async get<T = any>(key: string, type?: string): Promise<T | null> {
      const val = kvStore.get(key);
      if (!val) return null;
      return (type === 'json' ? JSON.parse(val) : val) as T;
    },
    async put(key: string, value: string): Promise<void> {
      kvStore.set(key, value);
    },
  } as unknown as KVNamespace;

  return {
    DB: mockDb,
    KV: mockKv,
    APPROVAL_SECRET: 'test-secret',
  };
}

function mockCtx(): ExecutionContext {
  return {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as ExecutionContext;
}

test('Route GET /api/today', async (t) => {
  await t.test('returns plate and rounds count without leaking coordinates or names', async () => {
    const env = createMockEnv();
    const req = new Request('https://pinpoint.app/api/today?date=2026-11-09');
    const res = await app.fetch(req, env, mockCtx());

    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.plate, 42);
    assert.equal(data.rounds, 5);

    // CRITICAL: verify no target coordinates or spot names leaked
    assert.equal(data.spots, undefined);
    assert.equal(data.lat, undefined);
    assert.equal(data.lon, undefined);
  });
});

test('Round ordering and hint tracking', async (t) => {
  await t.test('enforces sequential round progression', async () => {
    const env = createMockEnv();
    const sessionId = 'session-order-test';

    // Trying to start round 2 first should be rejected
    const reqBad = new Request('https://pinpoint.app/api/round/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, round: 2 }),
    });
    const resBad = await app.fetch(reqBad, env, mockCtx());
    assert.equal(resBad.status, 400);

    // Starting round 1 succeeds
    const reqGood = new Request('https://pinpoint.app/api/round/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, round: 1 }),
    });
    const resGood = await app.fetch(reqGood, env, mockCtx());
    assert.equal(resGood.status, 200);
    const data = await resGood.json() as any;
    assert.ok(data.window);
    assert.equal(data.window.kmPerUnit, 11.1);
  });

  await t.test('tracks zoom-out hints on server and enforces maximum of 2', async () => {
    const env = createMockEnv();
    const sessionId = 'session-hints-test';

    // Start round 1
    await app.fetch(
      new Request('https://pinpoint.app/api/round/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: 1 }),
      }),
      env,
      mockCtx()
    );

    // Zoom-out 1
    const resZ1 = await app.fetch(
      new Request('https://pinpoint.app/api/round/zoomout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: 1 }),
      }),
      env,
      mockCtx()
    );
    assert.equal(resZ1.status, 200);
    const z1Data = await resZ1.json() as any;
    assert.equal(z1Data.hintsUsed, 1);

    // Zoom-out 2
    const resZ2 = await app.fetch(
      new Request('https://pinpoint.app/api/round/zoomout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: 1 }),
      }),
      env,
      mockCtx()
    );
    assert.equal(resZ2.status, 200);
    const z2Data = await resZ2.json() as any;
    assert.equal(z2Data.hintsUsed, 2);

    // Zoom-out 3 must be rejected
    const resZ3 = await app.fetch(
      new Request('https://pinpoint.app/api/round/zoomout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: 1 }),
      }),
      env,
      mockCtx()
    );
    assert.equal(resZ3.status, 400);
  });
});

test('Guess submission, timing check, and finish route', async (t) => {
  await t.test('rejects guesses submitted under 1.5 seconds (bot protection)', async () => {
    const env = createMockEnv();
    const sessionId = 'session-timing-test';

    // Start round 1
    await app.fetch(
      new Request('https://pinpoint.app/api/round/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: 1 }),
      }),
      env,
      mockCtx()
    );

    // Guess immediately (under 1500 ms)
    const reqFast = new Request('https://pinpoint.app/api/round/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, round: 1, lat: 35.96, lon: -5.6 }),
    });
    const resFast = await app.fetch(reqFast, env, mockCtx());
    assert.equal(resFast.status, 400);
    const fastData = await resFast.json() as any;
    assert.match(fastData.error, /Guess submitted too fast/);
  });

  await t.test('scores valid guess, advances round, and computes finish summary', async () => {
    const env = createMockEnv();
    const sessionId = 'session-full-game-test';

    // Play all 5 rounds with guesses close to true coordinates
    const trueSpots = [
      { lat: 35.96, lon: -5.6 }, // Gibraltar
      { lat: 29.5, lon: 33.8 }, // Sinai
      { lat: 28.0, lon: -113.5 }, // Baja
      { lat: 41.1, lon: 29.05 }, // Bosphorus
      { lat: -34.35, lon: 18.49 }, // Good Hope
    ];

    for (let r = 1; r <= 5; r++) {
      // Start round
      await app.fetch(
        new Request('https://pinpoint.app/api/round/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: sessionId, round: r }),
        }),
        env,
        mockCtx()
      );

      // Artificially advance round_started_at in mock session
      const sess = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first<any>();
      sess.round_started_at = Date.now() - 3000;

      // Submit guess within 20 km of true spot
      const target = trueSpots[r - 1];
      const reqGuess = new Request('https://pinpoint.app/api/round/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, round: r, lat: target.lat + 0.05, lon: target.lon + 0.05 }),
      });
      const resGuess = await app.fetch(reqGuess, env, mockCtx());
      assert.equal(resGuess.status, 200);
      const guessData = await resGuess.json() as any;
      assert.ok(guessData.points > 4000);
      assert.ok(guessData.name);
      assert.ok(guessData.fact);
    }

    // Call /api/finish
    const resFinish = await app.fetch(
      new Request('https://pinpoint.app/api/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId }),
      }),
      env,
      mockCtx()
    );

    assert.equal(resFinish.status, 200);
    const finishData = await resFinish.json() as any;
    assert.ok(finishData.total > 20000);
    assert.equal(finishData.perRound.length, 5);
    assert.equal(finishData.rank, 'Master cartographer');
    assert.equal(finishData.percentile, 100);
  });
});
