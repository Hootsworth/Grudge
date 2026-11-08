import test from 'node:test';
import assert from 'node:assert';
import { validateConfidenceIntervals } from '../src/selection.ts';

test('Confidence Interval Overlap Rejection: passes when CIs are non-overlapping', () => {
  // CI1: [58, 72], CI2: [94, 108] -> 72 < 94 -> Non-overlapping!
  const validCheck = validateConfidenceIntervals([58, 72], [94, 108]);
  assert.strictEqual(validCheck.valid, true);

  // Deep time non-overlapping: CI1: [1250, 1420], CI2: [1480, 1630] -> 1420 < 1480 -> Non-overlapping!
  const deepCheck = validateConfidenceIntervals([1250, 1420], [1480, 1630]);
  assert.strictEqual(deepCheck.valid, true);
});

test('Confidence Interval Overlap Rejection: rejects when upper bound of CI1 touches or exceeds lower bound of CI2', () => {
  // CI1: [50, 75], CI2: [70, 95] -> 75 >= 70 -> Overlapping!
  const overlapCheck = validateConfidenceIntervals([50, 75], [70, 95]);
  assert.strictEqual(overlapCheck.valid, false);
  assert.ok(overlapCheck.reason?.includes('intervals overlap'));

  // Exact boundary touch: CI1: [50, 70], CI2: [70, 95] -> High1 (70) >= Low2 (70) -> Overlapping!
  const boundaryCheck = validateConfidenceIntervals([50, 70], [70, 95]);
  assert.strictEqual(boundaryCheck.valid, false);
  assert.ok(boundaryCheck.reason?.includes('High1 (70) >= Low2 (70)'));
});
