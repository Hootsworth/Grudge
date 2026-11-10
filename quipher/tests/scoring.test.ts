// quipher/tests/scoring.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore, getRankTitle, calculatePercentile } from '../src/scoring.ts';

test('Scoring Formula: score = solveSeconds + 20 * checks + 45 * hints', () => {
  // Pure solve: 85 seconds, 0 checks, 0 hints
  assert.strictEqual(calculateScore(85, 0, 0), 85);

  // Solve with 2 checks and 1 hint
  // 60 + 20*2 + 45*1 = 60 + 40 + 45 = 145
  assert.strictEqual(calculateScore(60, 2, 1), 145);

  // Solve with 5 checks and 3 hints
  // 120 + 20*5 + 45*3 = 120 + 100 + 135 = 355
  assert.strictEqual(calculateScore(120, 5, 3), 355);
});

test('Rank Tiers: assigns correct rank based on score thresholds', () => {
  // Under 120 -> Codebreaker
  assert.strictEqual(getRankTitle(50), 'Codebreaker');
  assert.strictEqual(getRankTitle(119), 'Codebreaker');

  // Under 240 -> Cryptanalyst
  assert.strictEqual(getRankTitle(120), 'Cryptanalyst');
  assert.strictEqual(getRankTitle(239), 'Cryptanalyst');

  // Under 420 -> Bletchley intern
  assert.strictEqual(getRankTitle(240), 'Bletchley intern');
  assert.strictEqual(getRankTitle(419), 'Bletchley intern');

  // 420 and above -> Rot13 enjoyer
  assert.strictEqual(getRankTitle(420), 'Rot13 enjoyer');
  assert.strictEqual(getRankTitle(600), 'Rot13 enjoyer');
});

test('Percentiles: calculates relative player standing among crowd scores', () => {
  const scores = [80, 110, 140, 200, 300]; // 5 players

  // Score 80 is better than or equal to all 5 -> 100th percentile
  assert.strictEqual(calculatePercentile(80, scores), 100);

  // Score 140 is better than 140, 200, 300 (3 of 5) -> 60th percentile
  assert.strictEqual(calculatePercentile(140, scores), 60);

  // Score 300 is only better than itself (1 of 5) -> 20th percentile
  assert.strictEqual(calculatePercentile(300, scores), 20);

  // Score 500 (worse than all) -> 1st percentile minimum
  assert.strictEqual(calculatePercentile(500, scores), 1);
});
