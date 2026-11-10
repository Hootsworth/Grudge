import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import type { Env } from '../src/types.ts';

// In-memory mock SQLite/D1 for unit testing routes
class MockD1 {
  puzzles = new Map<string, any>();
  sessions = new Map<string, any>();
  progress = new Map<string, any>();
  rateLimits = new Map<string, any>();

  prepare(query: string) {
    const self = this;
    return {
      bind(...args: any[]) {
        return {
          async first<T = any>(): Promise<T | null> {
            if (query.includes('FROM puzzles WHERE date = ?')) {
              return (self.puzzles.get(args[0]) as T) || null;
            }
            if (query.includes('FROM sessions WHERE id = ?')) {
              return (self.sessions.get(args[0]) as T) || null;
            }
            if (query.includes('FROM round_progress WHERE session_id = ? AND round_number = ?')) {
              return (self.progress.get(`${args[0]}_${args[1]}`) as T) || null;
            }
            if (query.includes('FROM ip_rate_limits')) {
              return (self.rateLimits.get(`${args[0]}_${args[1]}`) as T) || null;
            }
            return null;
          },
          async all<T = any>(): Promise<{ results: T[] }> {
            if (query.includes('FROM round_progress WHERE session_id = ?')) {
              const res: any[] = [];
              for (const [k, v] of self.progress.entries()) {
                if (k.startsWith(args[0] + '_')) res.push(v);
              }
              return { results: res as T[] };
            }
            return { results: [] };
          },
          async run(): Promise<any> {
            if (query.includes('INSERT OR IGNORE INTO puzzles')) {
              if (!self.puzzles.has(args[0])) {
                self.puzzles.set(args[0], { date: args[0], plate: args[1], ladders_json: args[2] });
              }
            } else if (query.includes('INSERT INTO sessions')) {
              self.sessions.set(args[0], {
                id: args[0],
                puzzle_date: args[1],
                current_round: args[2],
                total_strokes: args[3],
                total_par: args[4],
                status: args[5],
                started_at: args[6],
                finished_at: args[7],
              });
            } else if (query.includes('INSERT INTO round_progress')) {
              self.progress.set(`${args[0]}_${args[1]}`, {
                session_id: args[0],
                round_number: args[1],
                start_word: args[2],
                target_word: args[3],
                par: args[4],
                strokes: 0,
                path_json: args[5],
                solved: 0,
              });
            } else if (query.includes('UPDATE round_progress')) {
              const key = `${args[4]}_${args[5]}`;
              const p = self.progress.get(key) || {};
              p.strokes = args[0];
              p.path_json = args[1];
              p.solved = args[2];
              self.progress.set(key, p);
            } else if (query.includes('UPDATE sessions SET current_round = ?')) {
              const s = self.sessions.get(args[3]);
              if (s) {
                s.current_round = args[0];
                s.total_strokes += args[1];
                s.total_par += args[2];
              }
            } else if (query.includes('UPDATE sessions SET status = "finished"')) {
              const s = self.sessions.get(args[1]);
              if (s) {
                s.status = 'finished';
                s.finished_at = args[0];
              }
            }
            return { success: true };
          },
        };
      },
    };
  }
}

test('Route GET /api/today: returns 5 daily ladders without leaking optimal paths', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };

  const req = new Request('https://rungs.local/api/today?date=2026-11-09', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);

  const json: any = await res.json();
  assert.equal(json.plate, 313);
  assert.equal(json.ladders.length, 5);
  for (const l of json.ladders) {
    assert.ok(l.start);
    assert.ok(l.target);
    assert.ok(l.par);
    assert.equal(l.optimalPath, undefined); // Anti-spoiler: Never leaked
  }
});

test('Route POST /api/step: validates against dictionary, checks 1-letter diff, tracks path and solves', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };
  const session = 'test-session-001';
  const date = '2026-11-09';

  // 1. Invalid word not in word database
  const req1 = new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'zzzz', date }),
  });
  const res1 = await worker.fetch(req1, env);
  assert.equal(res1.status, 200);
  const json1: any = await res1.json();
  assert.equal(json1.valid, false);
  assert.equal(json1.message, 'Not in word database');

  // 2. Valid word but difference > 1
  const req2 = new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'warm', date }),
  });
  const res2 = await worker.fetch(req2, env);
  const json2: any = await res2.json();
  assert.equal(json2.valid, false);
  assert.equal(json2.message, 'Change exactly one letter');

  // 3. Valid 1-letter step: cold -> cord
  const req3 = new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'cord', date }),
  });
  const res3 = await worker.fetch(req3, env);
  const json3: any = await res3.json();
  assert.equal(json3.valid, true);
  assert.equal(json3.strokes, 1);
  assert.equal(json3.solved, false);
  assert.deepEqual(json3.path, ['cold', 'cord']);

  // 4. Duplicate word rejection
  const req4 = new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'cold', date }),
  });
  const res4 = await worker.fetch(req4, env);
  const json4: any = await res4.json();
  assert.equal(json4.valid, false);
  assert.equal(json4.message, 'Already on the ladder');

  // 5. Complete ladder 1: cord -> card -> ward -> warm
  await worker.fetch(new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'card', date }),
  }), env);
  await worker.fetch(new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'ward', date }),
  }), env);
  const resWin = await worker.fetch(new Request('https://rungs.local/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, word: 'warm', date }),
  }), env);
  const jsonWin: any = await resWin.json();
  assert.equal(jsonWin.valid, true);
  assert.equal(jsonWin.solved, true);
  assert.equal(jsonWin.strokes, 4);
});

test('Route POST /api/hint: provides optimal BFS hint and applies penalty stroke', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };
  const session = 'test-session-002';

  const req = new Request('https://rungs.local/api/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, round: 1, currentWord: 'cold', date: '2026-11-09' }),
  });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);

  const json: any = await res.json();
  assert.ok(json.hint);
  assert.equal(json.strokesPenalty, 1);
  assert.equal(json.strokes, 1);
});
