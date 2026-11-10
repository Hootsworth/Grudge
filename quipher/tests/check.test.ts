// quipher/tests/check.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCheckInterval } from '../src/anti_abuse.ts';

test('Check Rate Limiting: rejects check requests faster than 3 seconds', () => {
  const t0 = 1000000;

  // First check (lastCheckAt = 0) is allowed
  const first = checkCheckInterval(0, t0);
  assert.strictEqual(first.allowed, true);

  // Submitting 1.5 seconds later (1500ms < 3000ms) is blocked
  const tooFast = checkCheckInterval(t0, t0 + 1500);
  assert.strictEqual(tooFast.allowed, false);
  assert.strictEqual(tooFast.waitMs, 1500);

  // Submitting 2.999 seconds later is blocked
  const borderlineFail = checkCheckInterval(t0, t0 + 2999);
  assert.strictEqual(borderlineFail.allowed, false);
  assert.strictEqual(borderlineFail.waitMs, 1);

  // Submitting 3.001 seconds later is allowed
  const allowed = checkCheckInterval(t0, t0 + 3001);
  assert.strictEqual(allowed.allowed, true);
});

test('Wrong Letters Tracking: identifies only incorrect mapping entries', () => {
  const truth: Record<string, string> = {
    X: 'A',
    Y: 'B',
    Z: 'C',
    W: 'D',
  };

  const clientMapping = {
    X: 'A', // correct
    Y: 'Z', // wrong!
    Z: 'C', // correct
    W: 'K', // wrong!
  };

  const wrong: string[] = [];
  for (const [c, p] of Object.entries(clientMapping)) {
    if (p && p.toUpperCase() !== truth[c]) {
      wrong.push(c);
    }
  }

  assert.deepStrictEqual(wrong.sort(), ['W', 'Y']);
});
