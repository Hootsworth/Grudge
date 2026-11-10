// quipher/tests/hint.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import { getCipherFrequencies, invertKey, encryptQuote } from '../src/cipher.ts';

test('Hint Selection: selects the most frequent cipher letter not yet correct in mapping', () => {
  const plaintext = 'AAAA BBB CC D';
  const mockKey: Record<string, string> = {
    A: 'X', // freq 4
    B: 'Y', // freq 3
    C: 'Z', // freq 2
    D: 'W', // freq 1
  };
  const ciphertext = encryptQuote(plaintext, mockKey);
  const truth = invertKey(mockKey);
  const freqs = getCipherFrequencies(ciphertext);

  // 1. Initial state: no mappings. Most frequent letter is 'X' (count 4, maps to 'A')
  const mapping1: Record<string, string> = {};
  const remaining1 = Object.keys(freqs).filter((c) => mapping1[c] !== truth[c]);
  remaining1.sort((a, b) => freqs[b] - freqs[a] || a.localeCompare(b));
  assert.strictEqual(remaining1[0], 'X');
  assert.strictEqual(truth[remaining1[0]], 'A');

  // 2. Client already placed X -> A correctly. Next hint should pick 'Y' (count 3, maps to 'B')
  const mapping2: Record<string, string> = { X: 'A' };
  const remaining2 = Object.keys(freqs).filter((c) => mapping2[c] !== truth[c]);
  remaining2.sort((a, b) => freqs[b] - freqs[a] || a.localeCompare(b));
  assert.strictEqual(remaining2[0], 'Y');
  assert.strictEqual(truth[remaining2[0]], 'B');

  // 3. Client guessed X incorrectly as 'B'. Hint should pick 'X' again since it is still wrong!
  const mapping3: Record<string, string> = { X: 'B' };
  const remaining3 = Object.keys(freqs).filter((c) => mapping3[c] !== truth[c]);
  remaining3.sort((a, b) => freqs[b] - freqs[a] || a.localeCompare(b));
  assert.strictEqual(remaining3[0], 'X');
});
