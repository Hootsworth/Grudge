import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuess, isValidGuessLength } from '../src/security/normalization.ts';

test('Normalization: strips non-alphanumeric characters and lowercases', () => {
  assert.equal(normalizeGuess('Key 404'), 'key404');
  assert.equal(normalizeGuess('SPY-007!'), 'spy007');
  assert.equal(normalizeGuess('  listen  '), 'listen');
  assert.equal(normalizeGuess('H4CK3R_vault#1'), 'h4ck3rvault1');
  assert.equal(normalizeGuess('LOCK & KEY'), 'lockkey');
});

test('Normalization: handles numbers and mixed alphanumeric strings', () => {
  assert.equal(normalizeGuess('1984'), '1984');
  assert.equal(normalizeGuess('01mole'), '01mole');
  assert.equal(normalizeGuess('K-N-I-F-E'), 'knife');
});

test('Normalization: validates length boundaries (3 to 12 chars)', () => {
  // 3 to 12 characters are valid
  assert.equal(isValidGuessLength('key'), true);
  assert.equal(isValidGuessLength('key404'), true);
  assert.equal(isValidGuessLength('twelvechars1'), true); // 12 chars

  // Too short (< 3)
  assert.equal(isValidGuessLength(''), false);
  assert.equal(isValidGuessLength('a'), false);
  assert.equal(isValidGuessLength('ab'), false);

  // Too long (> 12)
  assert.equal(isValidGuessLength('thirteenchars'), false); // 13 chars
  assert.equal(isValidGuessLength('supercalifragilistic'), false);
});
