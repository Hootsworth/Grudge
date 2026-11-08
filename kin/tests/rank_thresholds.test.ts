import test from 'node:test';
import assert from 'node:assert';
import { getRankTitle, roundMyaSensibly, formatApproximateMya } from '../src/scoring.ts';

test('Rank Thresholds: assigns correct title based on deepest resolved split', () => {
  // 0 correct
  assert.strictEqual(getRankTitle(0, 0), 'Still in the soup');

  // under 100 Mya -> Cenozoic tourist
  assert.strictEqual(getRankTitle(1, 55), 'Cenozoic tourist');
  assert.strictEqual(getRankTitle(2, 99.9), 'Cenozoic tourist');

  // 100 to under 252 Mya -> Mesozoic tracker
  assert.strictEqual(getRankTitle(1, 100), 'Mesozoic tracker');
  assert.strictEqual(getRankTitle(3, 240), 'Mesozoic tracker');
  assert.strictEqual(getRankTitle(2, 251.9), 'Mesozoic tracker');

  // 252 to under 541 Mya -> Paleozoic sleuth
  assert.strictEqual(getRankTitle(1, 252), 'Paleozoic sleuth');
  assert.strictEqual(getRankTitle(4, 435), 'Paleozoic sleuth');
  assert.strictEqual(getRankTitle(3, 540.9), 'Paleozoic sleuth');

  // 541 to under 1000 Mya -> Ediacaran detective
  assert.strictEqual(getRankTitle(1, 541), 'Ediacaran detective');
  assert.strictEqual(getRankTitle(5, 700), 'Ediacaran detective');
  assert.strictEqual(getRankTitle(4, 999.9), 'Ediacaran detective');

  // 1000 Mya and above -> Precambrian prophet
  assert.strictEqual(getRankTitle(1, 1000), 'Precambrian prophet');
  assert.strictEqual(getRankTitle(5, 1550), 'Precambrian prophet');
});

test('Time Rounding & Display Rules: rounds sensibly and formats as approximate', () => {
  // under 500: nearest 5 Mya
  assert.strictEqual(roundMyaSensibly(63), 65);
  assert.strictEqual(roundMyaSensibly(82), 80);
  assert.strictEqual(roundMyaSensibly(242), 240);
  assert.strictEqual(roundMyaSensibly(6.5), 5);

  // 500 and above: nearest 50 Mya
  assert.strictEqual(roundMyaSensibly(650), 650);
  assert.strictEqual(roundMyaSensibly(680), 700);
  assert.strictEqual(roundMyaSensibly(1350), 1350);
  assert.strictEqual(roundMyaSensibly(1542), 1550);

  // Approximate display string
  assert.strictEqual(formatApproximateMya(63), 'about 65 million years ago');
  assert.strictEqual(formatApproximateMya(1550), 'about 1,550 million years ago');
});
