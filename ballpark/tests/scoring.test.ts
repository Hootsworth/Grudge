// Tests for Ballpark scoring formula and rank classification
import { test } from 'node:test';
import assert from 'node:assert';
import { calculateErrorOrders, calculatePoints, getRankTitle } from '../src/scoring.ts';

test('Scoring formula: exact guess awards full 1000 points', () => {
  const truthLog10 = 9.468;
  const guess = 9.468;
  const err = calculateErrorOrders(guess, truthLog10);
  assert.strictEqual(err, 0);
  const pts = calculatePoints(err);
  assert.strictEqual(pts, 1000);
});

test('Scoring formula: 1 order of magnitude error awards 600 points', () => {
  const truthLog10 = 9.0;
  const guess = 10.0;
  const err = calculateErrorOrders(guess, truthLog10);
  assert.strictEqual(err, 1.0);
  // points = round(1000 * (1 - 1.0 / 2.5)) = round(1000 * 0.6) = 600
  const pts = calculatePoints(err);
  assert.strictEqual(pts, 600);
});

test('Scoring formula: 2 orders of magnitude error awards 200 points', () => {
  const truthLog10 = 5.0;
  const guess = 3.0;
  const err = calculateErrorOrders(guess, truthLog10);
  assert.strictEqual(err, 2.0);
  // points = round(1000 * (1 - 2.0 / 2.5)) = round(1000 * 0.2) = 200
  const pts = calculatePoints(err);
  assert.strictEqual(pts, 200);
});

test('Scoring formula: 2.5 orders of magnitude error awards 0 points', () => {
  const truthLog10 = 8.0;
  const guess = 10.5;
  const err = calculateErrorOrders(guess, truthLog10);
  assert.strictEqual(err, 2.5);
  // points = round(1000 * (1 - 2.5 / 2.5)) = 0
  const pts = calculatePoints(err);
  assert.strictEqual(pts, 0);
});

test('Scoring formula: error exceeding 2.5 orders is clamped to 0 points', () => {
  const truthLog10 = 5.0;
  const guess = 12.0; // 7 orders off
  const err = calculateErrorOrders(guess, truthLog10);
  assert.strictEqual(err, 7.0);
  const pts = calculatePoints(err);
  assert.strictEqual(pts, 0);
});

test('Rank classification thresholds based on total error in orders', () => {
  // under 0.5: Human calculator
  assert.strictEqual(getRankTitle(0.0), 'Human calculator');
  assert.strictEqual(getRankTitle(0.49), 'Human calculator');

  // under 1.5: Fermi's apprentice
  assert.strictEqual(getRankTitle(0.50), "Fermi's apprentice");
  assert.strictEqual(getRankTitle(1.49), "Fermi's apprentice");

  // under 3.0: Napkin mathematician
  assert.strictEqual(getRankTitle(1.50), 'Napkin mathematician');
  assert.strictEqual(getRankTitle(2.99), 'Napkin mathematician');

  // under 6.0: Vibes-based estimator
  assert.strictEqual(getRankTitle(3.00), 'Vibes-based estimator');
  assert.strictEqual(getRankTitle(5.99), 'Vibes-based estimator');

  // otherwise: Order of magnitude? Never heard of her.
  assert.strictEqual(getRankTitle(6.00), 'Order of magnitude? Never heard of her.');
  assert.strictEqual(getRankTitle(14.5), 'Order of magnitude? Never heard of her.');
});
