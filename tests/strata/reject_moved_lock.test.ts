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

test('Reject Moved Locked Events: rejects when locked event is moved to a different slot', () => {
  // Suppose ev-1 was previously locked at position 0, and ev-6 was locked at position 5
  const previouslyLocked = ['ev-1', 'ev-6'];

  // Player attempts to submit order where ev-1 is moved to position 1!
  const illegalOrder = ['ev-2', 'ev-1', 'ev-3', 'ev-4', 'ev-5', 'ev-6'];

  const res = evaluateGuess(illegalOrder, MOCK_EVENTS, previouslyLocked);

  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.error?.includes('Locked event'));
  assert.ok(res.error?.includes('cannot be moved'));
});

test('Reject Moved Locked Events: rejects when another event takes a locked slot', () => {
  // ev-4 was locked at slot 3
  const previouslyLocked = ['ev-4'];

  // Player puts ev-3 in slot 3 and moves ev-4 to slot 4
  const illegalOrder = ['ev-1', 'ev-2', 'ev-5', 'ev-3', 'ev-4', 'ev-6'];

  const res = evaluateGuess(illegalOrder, MOCK_EVENTS, previouslyLocked);

  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.error?.includes('Locked event \'ev-4\' at position 4 was moved'));
});

test('Reject Malformed Orders: rejects array length != 6', () => {
  const shortOrder = ['ev-1', 'ev-2', 'ev-3'];
  const res = evaluateGuess(shortOrder, MOCK_EVENTS, []);
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.error?.includes('exactly 6'));
});

test('Reject Malformed Orders: rejects duplicate IDs', () => {
  const duplicateOrder = ['ev-1', 'ev-1', 'ev-3', 'ev-4', 'ev-5', 'ev-6'];
  const res = evaluateGuess(duplicateOrder, MOCK_EVENTS, []);
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.error?.includes('duplicate'));
});

test('Reject Malformed Orders: rejects unknown event IDs', () => {
  const unknownOrder = ['ev-1', 'ev-2', 'ev-3', 'ev-4', 'ev-5', 'ev-999'];
  const res = evaluateGuess(unknownOrder, MOCK_EVENTS, []);
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.error?.includes('Unknown event ID'));
});
