import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCooldownSeconds,
  checkThrottle,
  TURNSTILE_THRESHOLD,
  MAX_DAILY_IP_GUESSES,
} from '../src/security/throttling.ts';
import type { SessionRecord, IpLimitRecord } from '../src/types.ts';

test('Throttling schedule: first 10 guesses are instant (0s cooldown)', () => {
  for (let failed = 0; failed <= 10; failed++) {
    assert.equal(getCooldownSeconds(failed), 0, `Expected 0s cooldown for attempt ${failed}`);
  }
});

test('Throttling schedule: progressive exponential delays for guesses 11 to 16+', () => {
  assert.equal(getCooldownSeconds(11), 1);   // 1s
  assert.equal(getCooldownSeconds(12), 2);   // 2s
  assert.equal(getCooldownSeconds(13), 4);   // 4s
  assert.equal(getCooldownSeconds(14), 8);   // 8s
  assert.equal(getCooldownSeconds(15), 16);  // 16s
  assert.equal(getCooldownSeconds(16), 30);  // capped at 30s
  assert.equal(getCooldownSeconds(20), 30);  // capped at 30s
  assert.equal(getCooldownSeconds(100), 30); // capped at 30s
});

test('Throttling check: enforces lockout message when cooldown is active', () => {
  const session: SessionRecord = {
    id: 'test-session-1',
    date: '2026-11-09',
    puzzle_id: 'p1',
    ip_hash: 'hash-1',
    started_at: Date.now() - 10000,
    solved_at: null,
    failed_count: 12, // cooldown = 2s
    solve_seconds: null,
    is_bot: 0,
    status: 'active',
  };

  const now = 100000;
  const ipLimit: IpLimitRecord = {
    ip_hash: 'hash-1',
    date: '2026-11-09',
    guess_count: 12,
    last_guess_at: now - 500, // 0.5s ago
    cooldown_until: now + 1500, // still 1.5s remaining
  };

  const result = checkThrottle(session, ipLimit, now);
  assert.equal(result.allowed, false);
  assert.ok(result.retryAfterSeconds && result.retryAfterSeconds > 0);
  assert.ok(result.lockoutMessage && result.lockoutMessage.includes('Vault lockout active'));
});

test('Throttling check: requires Turnstile verification after 25 failed guesses', () => {
  assert.equal(TURNSTILE_THRESHOLD, 25);

  const sessionUnderThreshold: SessionRecord = {
    id: 'test-session-2',
    date: '2026-11-09',
    puzzle_id: 'p1',
    ip_hash: 'hash-2',
    started_at: Date.now() - 60000,
    solved_at: null,
    failed_count: 24,
    solve_seconds: null,
    is_bot: 0,
    status: 'active',
  };

  const ipLimit: IpLimitRecord = {
    ip_hash: 'hash-2',
    date: '2026-11-09',
    guess_count: 24,
    last_guess_at: Date.now() - 40000,
    cooldown_until: Date.now() - 10000, // cooldown expired
  };

  const underResult = checkThrottle(sessionUnderThreshold, ipLimit);
  assert.equal(underResult.allowed, true);
  assert.equal(underResult.requireTurnstile, false);

  const sessionAtThreshold: SessionRecord = {
    ...sessionUnderThreshold,
    failed_count: 25,
  };

  const atResult = checkThrottle(sessionAtThreshold, ipLimit);
  assert.equal(atResult.allowed, false);
  assert.equal(atResult.requireTurnstile, true);
  assert.ok(atResult.lockoutMessage?.includes('Security verification required'));
});
