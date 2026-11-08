import test from 'node:test';
import assert from 'node:assert/strict';
import { detectBruteForcePattern } from '../src/security/pattern_detector.ts';
import type { GuessRecord } from '../src/types.ts';

function makeGuesses(words: string[], intervalMs: number = 2000): GuessRecord[] {
  let time = 1000000;
  return words.map((w, i) => ({
    session_id: 'session-bot',
    date: '2026-11-09',
    guess: w,
    normalized_guess: w.toLowerCase().replace(/[^a-z0-9]/g, ''),
    is_correct: 0,
    attempt_number: i + 1,
    created_at: (time += intervalMs),
    ip_hash: 'test-ip',
  }));
}

test('Pattern detector: flags sequential numeric brute-force (0000, 0001, 0002...)', () => {
  const history = makeGuesses(['0000', '0001', '0002']);
  const result = detectBruteForcePattern('0003', history);
  assert.equal(result.isBot, true);
  assert.equal(result.patternType, 'sequential_numeric');
});

test('Pattern detector: flags alphabetical sequences (aaaa, aaab, aaac...)', () => {
  const history = makeGuesses(['aaaa', 'aaab', 'aaac']);
  const result = detectBruteForcePattern('aaad', history);
  assert.equal(result.isBot, true);
  assert.equal(result.patternType, 'sequential_alpha');
});

test('Pattern detector: flags repeating character flooding (aaaa, bbbb, cccc...)', () => {
  const history = makeGuesses(['aaaa', 'bbbb', 'cccc']);
  const result = detectBruteForcePattern('dddd', history);
  assert.equal(result.isBot, true);
  assert.equal(result.patternType, 'repeated_chars');
});

test('Pattern detector: flags rapid machine flooding (<150ms between requests)', () => {
  const history = makeGuesses(['guess1', 'guess2', 'guess3', 'guess4'], 50); // 50ms intervals
  const result = detectBruteForcePattern('guess5', history, 1000250);
  assert.equal(result.isBot, true);
  assert.equal(result.patternType, 'rapid_flooding');
});

test('Pattern detector: does NOT flag genuine human guesses', () => {
  const history = makeGuesses(['listen', 'password', 'keycard', 'secret'], 3000);
  const result = detectBruteForcePattern('vault404', history, 1015000);
  assert.equal(result.isBot, false);
});
