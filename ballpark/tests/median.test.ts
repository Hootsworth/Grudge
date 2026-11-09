// Tests for Ballpark crowd median calculation, threshold, and rounding
import { test } from 'node:test';
import assert from 'node:assert';
import { calculateMedian, calculateClosestGuess, calculateMostCommonGuess } from '../src/crowd.ts';

test('Crowd median: returns null when fewer than 30 players have guessed', () => {
  const fewGuesses = [9.1, 9.2, 9.5, 9.6, 9.0]; // only 5 guesses
  const median = calculateMedian(fewGuesses, 30);
  assert.strictEqual(median, null);

  const twentyNineGuesses = Array.from({ length: 29 }, (_, i) => 9.0 + (i * 0.05));
  assert.strictEqual(calculateMedian(twentyNineGuesses, 30), null);
});

test('Crowd median: calculates correct median for odd count (>= 30 players)', () => {
  // 31 guesses: 10.0 to 13.0 in steps of 0.1
  const oddGuesses = Array.from({ length: 31 }, (_, i) => 10.0 + (i * 0.1));
  const median = calculateMedian(oddGuesses, 30);
  // Middle index is 15 -> 10.0 + 1.5 = 11.5
  assert.strictEqual(median, 11.5);
});

test('Crowd median: calculates correct median for even count (>= 30 players)', () => {
  // 30 guesses: 8.0 to 10.9 in steps of 0.1
  const evenGuesses = Array.from({ length: 30 }, (_, i) => 8.0 + (i * 0.1));
  const median = calculateMedian(evenGuesses, 30);
  // Indices 14 (9.4) and 15 (9.5) -> avg = 9.45 -> rounded to 0.1 is 9.5
  assert.strictEqual(median, 9.5);
});

test('Crowd median: rounds crowd median to 0.1 so individual guesses cannot be reverse-engineered', () => {
  // Array of 30 values yielding an unrounded median with many decimal places
  const guesses = [
    8.123, 8.245, 8.367, 8.411, 8.522,
    8.633, 8.744, 8.855, 8.911, 9.022,
    9.133, 9.244, 9.355, 9.412, 9.489,
    9.521, 9.598, 9.674, 9.712, 9.801,
    9.891, 9.943, 10.012, 10.123, 10.234,
    10.345, 10.456, 10.567, 10.678, 10.789,
  ];
  assert.strictEqual(guesses.length, 30);
  const median = calculateMedian(guesses, 30);
  assert.notStrictEqual(median, null);
  // Check that the returned number has at most 1 decimal place
  const decimalPart = String(median).split('.')[1] || '';
  assert.ok(decimalPart.length <= 1, `Expected at most 1 decimal place, got: ${median}`);
});

test('Crowd closest and most common guesses calculations', () => {
  const truthLog10 = 9.47;
  const guesses = [8.5, 9.0, 9.5, 9.5, 9.5, 10.0, 10.5];

  const closest = calculateClosestGuess(truthLog10, guesses);
  assert.strictEqual(closest, 9.5);

  const mostCommon = calculateMostCommonGuess(guesses);
  assert.strictEqual(mostCommon, 9.5);
});
