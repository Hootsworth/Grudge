import test from 'node:test';
import assert from 'node:assert';
import { validateTopologyGap } from '../src/selection.ts';

test('Topology Gap Filtering: requires gap of at least 8% of the older divergence time', () => {
  // Case 1: Valid 35% gap (t1=65, t2=100) -> (100 - 65) / 100 = 0.35 >= 0.08
  const validCheck = validateTopologyGap(65, 100);
  assert.strictEqual(validCheck.valid, true);
  assert.strictEqual(validCheck.gapRatio, 0.35);

  // Case 2: Exactly 8% gap boundary (t1=92, t2=100) -> (100 - 92) / 100 = 0.08
  const boundaryCheck = validateTopologyGap(92, 100);
  assert.strictEqual(boundaryCheck.valid, true);
  assert.ok(Math.abs(boundaryCheck.gapRatio - 0.08) < 1e-6);

  // Case 3: Too narrow (5% gap: t1=95, t2=100) -> rejected!
  const narrowCheck = validateTopologyGap(95, 100);
  assert.strictEqual(narrowCheck.valid, false);
  assert.ok(narrowCheck.reason?.includes('less than required 8.0%'));

  // Case 4: Deep time split (t1=1350, t2=1400) -> diff 50 / 1400 = 3.5% -> rejected!
  const deepNarrow = validateTopologyGap(1350, 1400);
  assert.strictEqual(deepNarrow.valid, false);

  // Case 5: Deep time valid split (t1=1350, t2=1550) -> diff 200 / 1550 = 12.9% -> valid!
  const deepValid = validateTopologyGap(1350, 1550);
  assert.strictEqual(deepValid.valid, true);
});

test('Topology Gap Filtering: rejects inverted or identical times (t1 >= t2)', () => {
  const inverted = validateTopologyGap(120, 100);
  assert.strictEqual(inverted.valid, false);
  assert.ok(inverted.reason?.includes('strictly less than'));

  const identical = validateTopologyGap(100, 100);
  assert.strictEqual(identical.valid, false);
});
