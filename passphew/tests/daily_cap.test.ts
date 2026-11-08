import test from 'node:test';
import assert from 'node:assert/strict';
import { checkThrottle, MAX_DAILY_IP_GUESSES } from '../src/security/throttling.ts';
import type { SessionRecord, IpLimitRecord } from '../src/types.ts';

test('Daily guess cap: constant is set to 300 guesses per IP', () => {
  assert.equal(MAX_DAILY_IP_GUESSES, 300);
});

test('Daily guess cap: allows guesses when IP count is under 300', () => {
  const session: SessionRecord = {
    id: 'session-cap-1',
    date: '2026-11-09',
    puzzle_id: 'p1',
    ip_hash: 'ip-hash-abc',
    started_at: Date.now() - 5000,
    solved_at: null,
    failed_count: 5,
    solve_seconds: null,
    is_bot: 0,
    status: 'active',
  };

  const ipLimit: IpLimitRecord = {
    ip_hash: 'ip-hash-abc',
    date: '2026-11-09',
    guess_count: 299,
    last_guess_at: Date.now() - 60000,
    cooldown_until: Date.now() - 30000,
  };

  const result = checkThrottle(session, ipLimit);
  assert.equal(result.allowed, true);
  assert.equal(result.dailyCapReached, false);
});

test('Daily guess cap: blocks immediately with 429 when IP reaches 300 guesses', () => {
  const session: SessionRecord = {
    id: 'session-cap-2',
    date: '2026-11-09',
    puzzle_id: 'p1',
    ip_hash: 'ip-hash-abc',
    started_at: Date.now() - 5000,
    solved_at: null,
    failed_count: 5,
    solve_seconds: null,
    is_bot: 0,
    status: 'active',
  };

  const ipLimit: IpLimitRecord = {
    ip_hash: 'ip-hash-abc',
    date: '2026-11-09',
    guess_count: 300, // Hard daily cap hit
    last_guess_at: Date.now() - 1000,
    cooldown_until: 0,
  };

  const result = checkThrottle(session, ipLimit);
  assert.equal(result.allowed, false);
  assert.equal(result.dailyCapReached, true);
  assert.ok(result.retryAfterSeconds && result.retryAfterSeconds > 0);
  assert.ok(result.lockoutMessage?.includes('Daily IP security threshold reached (300/300)'));
});
