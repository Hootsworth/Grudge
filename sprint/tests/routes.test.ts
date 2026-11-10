import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import type { Env } from '../src/types.ts';

// In-memory mock SQLite/D1 for unit testing routes
class MockD1 {
  puzzles = new Map<string, any>();
  sessions = new Map<string, any>();
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
            if (query.includes('FROM ip_rate_limits')) {
              return (self.rateLimits.get(`${args[0]}_${args[1]}`) as T) || null;
            }
            return null;
          },
          async run(): Promise<any> {
            if (query.includes('INSERT OR IGNORE INTO puzzles')) {
              if (!self.puzzles.has(args[0])) {
                self.puzzles.set(args[0], {
                  date: args[0],
                  plate: args[1],
                  key_letters: args[2],
                  total_words: args[3],
                  max_score: args[4],
                });
              }
            } else if (query.includes('INSERT INTO sessions')) {
              self.sessions.set(args[0], {
                id: args[0],
                puzzle_date: args[1],
                score: args[2],
                best_combo: args[3],
                words_found_json: args[4],
                last_word_at: args[5],
                status: args[6],
                started_at: args[7],
                finished_at: args[8],
              });
            } else if (query.includes('UPDATE sessions') && query.includes('score = score + ?')) {
              const s = self.sessions.get(args[4]);
              if (s) {
                s.score += args[0];
                s.best_combo = Math.max(s.best_combo, args[1]);
                s.words_found_json = args[2];
                s.last_word_at = args[3];
              }
            } else if (query.includes('UPDATE sessions SET last_word_at = NULL')) {
              const s = self.sessions.get(args[0]);
              if (s) s.last_word_at = null;
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

test('Route GET /api/today: returns daily 6 letters and total words count without revealing word list', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };

  const req = new Request('https://sprint.local/api/today?date=2026-11-09', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);

  const json: any = await res.json();
  assert.equal(json.plate, 313);
  assert.equal(json.letters, 'STREAM');
  assert.equal(json.timeLimitSeconds, 60);
  assert.ok(json.totalWordsCount >= 50);
  assert.ok(json.maxScore >= 100);
  assert.equal(json.words, undefined); // Anti-spoiler: Never leaked
});

test('Route POST /api/submit-word: validates word, enforces dictionary lookup, tracks combos and fever', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };
  const session = 'sprint-session-001';
  const date = '2026-11-09';

  // 1. Invalid word: not in dictionary
  const req1 = new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'xyz', date }),
  });
  const res1 = await worker.fetch(req1, env);
  assert.equal(res1.status, 200);
  const json1: any = await res1.json();
  assert.equal(json1.valid, false);

  // 2. Invalid word: contains letter not in STREAM
  const req2 = new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'cat', date }), // 'c' is not in STREAM
  });
  const res2 = await worker.fetch(req2, env);
  const json2: any = await res2.json();
  assert.equal(json2.valid, false);
  assert.equal(json2.message, 'Cannot be made from given letters');

  // 3. Valid word: "mat" (length 3, 1 pt, multiplier 1)
  const req3 = new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'mat', date }),
  });
  const res3 = await worker.fetch(req3, env);
  const json3: any = await res3.json();
  assert.equal(json3.valid, true);
  assert.equal(json3.basePoints, 1);
  assert.equal(json3.multiplier, 1);
  assert.equal(json3.pointsEarned, 1);
  assert.equal(json3.totalScore, 1);

  // 4. Duplicate submission
  const req4 = new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'mat', date }),
  });
  const res4 = await worker.fetch(req4, env);
  const json4: any = await res4.json();
  assert.equal(json4.valid, false);
  assert.equal(json4.message, 'Word already found');

  // 5. Valid 6-letter word: "stream" (length 6, 8 pts, isFullBurn: true)
  const req5 = new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'stream', date }),
  });
  const res5 = await worker.fetch(req5, env);
  const json5: any = await res5.json();
  assert.equal(json5.valid, true);
  assert.equal(json5.basePoints, 8);
  assert.equal(json5.isFullBurn, true);
});

test('Route POST /api/finish: finishes game and reveals complete accounted-for missed words', async () => {
  const mockDb = new MockD1();
  const env: Env = { DB: mockDb as any };
  const session = 'sprint-session-002';
  const date = '2026-11-09';

  // Submit one word first
  await worker.fetch(new Request('https://sprint.local/api/submit-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, word: 'star', date }),
  }), env);

  const req = new Request('https://sprint.local/api/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, date }),
  });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);

  const json: any = await res.json();
  assert.equal(json.wordsFoundCount, 1);
  assert.ok(json.totalWordsCount >= 50);
  assert.ok(json.missedWords.length >= 49);
  assert.ok(!json.missedWords.includes('star')); // Star was found
  assert.ok(json.missedWords.includes('stream')); // Missed word accounted for
  assert.ok(json.title);
  assert.ok(json.shareCard.includes('Sprint #313'));
});
