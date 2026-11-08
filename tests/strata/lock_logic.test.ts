import test from 'node:test';
import assert from 'node:assert';
import { evaluateGuess } from '../../src/scoring/lockLogic.ts';
import type { PuzzleEvent } from '../../src/types.ts';

const MOCK_EVENTS: PuzzleEvent[] = [
  { id: 'ev-1', text: 'Moon Landing', year: 1969, precision: 'exact', source: 'http://example.com' },
  { id: 'ev-2', text: 'Wright Brothers Flight', year: 1903, precision: 'exact', source: 'http://example.com' },
  { id: 'ev-3', text: 'French Revolution', year: 1789, precision: 'exact', source: 'http://example.com' },
  { id: 'ev-4', text: 'Columbus Voyage', year: 1492, precision: 'exact', source: 'http://example.com' },
  { id: 'ev-5', text: 'Gutenberg Printing', year: 1440, precision: 'approximate', source: 'http://example.com' },
  { id: 'ev-6', text: 'Pyramid of Giza', year: -2560, precision: 'approximate', source: 'http://example.com' },
];

test('Lock Logic: identifies correct items and locks them in slot', () => {
  // True order is [ev-1, ev-2, ev-3, ev-4, ev-5, ev-6]
  // Player submits ev-1 in slot 0 (correct), but swaps ev-3 and ev-2
  const submitted = ['ev-1', 'ev-3', 'ev-2', 'ev-4', 'ev-5', 'ev-6'];
  const previouslyLocked: string[] = [];

  const res = evaluateGuess(submitted, MOCK_EVENTS, previouslyLocked);

  assert.strictEqual(res.isValid, true);
  // Slots 0, 3, 4, 5 are correct; slots 1 and 2 are swapped
  assert.deepStrictEqual(res.correctBools, [true, false, false, true, true, true]);
  assert.strictEqual(res.isSolved, false);

  // New locked IDs should be ev-1, ev-4, ev-5, ev-6
  assert.strictEqual(res.newLockedIds.length, 4);
  assert.ok(res.newLockedIds.includes('ev-1'));
  assert.ok(res.newLockedIds.includes('ev-4'));
  assert.ok(res.newLockedIds.includes('ev-5'));
  assert.ok(res.newLockedIds.includes('ev-6'));
});

test('Lock Logic: all 6 correct results in isSolved = true', () => {
  const perfectOrder = ['ev-1', 'ev-2', 'ev-3', 'ev-4', 'ev-5', 'ev-6'];
  const res = evaluateGuess(perfectOrder, MOCK_EVENTS, []);

  assert.strictEqual(res.isValid, true);
  assert.deepStrictEqual(res.correctBools, [true, true, true, true, true, true]);
  assert.strictEqual(res.isSolved, true);
  assert.strictEqual(res.newLockedIds.length, 6);
});

test('Lock Logic: cumulative locking across multiple attempts', () => {
  // Attempt 1: player gets ev-1 and ev-6 correct
  const att1 = ['ev-1', 'ev-5', 'ev-4', 'ev-3', 'ev-2', 'ev-6'];
  const res1 = evaluateGuess(att1, MOCK_EVENTS, []);
  assert.deepStrictEqual(res1.newLockedIds.sort(), ['ev-1', 'ev-6'].sort());

  // Attempt 2: player keeps ev-1 and ev-6 in their positions, and now gets ev-2 and ev-3 correct
  const att2 = ['ev-1', 'ev-2', 'ev-3', 'ev-5', 'ev-4', 'ev-6'];
  const res2 = evaluateGuess(att2, MOCK_EVENTS, res1.newLockedIds);

  assert.strictEqual(res2.isValid, true);
  assert.deepStrictEqual(res2.correctBools, [true, true, true, false, false, true]);
  assert.deepStrictEqual(res2.newLockedIds.sort(), ['ev-1', 'ev-2', 'ev-3', 'ev-6'].sort());
});
