// quipher/tests/cipher.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALPHABET,
  generateDerangementKey,
  hasFixedPoint,
  encryptQuote,
  decryptCiphertext,
  invertKey,
  calculateLetterEntropy,
  getDistinctLetterCount,
  getDifficultyRating,
} from '../src/cipher.ts';

test('Cipher Derangement: key has no fixed points across 100 trials', () => {
  for (let trial = 0; trial < 100; trial++) {
    const key = generateDerangementKey();
    assert.strictEqual(
      hasFixedPoint(key),
      false,
      `Trial ${trial} generated a key with a fixed point!`
    );

    for (const char of ALPHABET) {
      assert.notStrictEqual(
        key[char],
        char,
        `Letter ${char} mapped to itself in trial ${trial}`
      );
      assert.ok(
        ALPHABET.includes(key[char]),
        `Key mapping for ${char} is not a valid alphabet letter: ${key[char]}`
      );
    }

    const mappedValues = new Set(Object.values(key));
    assert.strictEqual(
      mappedValues.size,
      26,
      `Key is not a bijective permutation (size = ${mappedValues.size})`
    );
  }
});

test('Cipher Round-Trip: decrypt(encrypt(plaintext)) reconstructs original text', () => {
  const sampleQuotes = [
    "All the world's a stage, and all the men and women merely players.",
    'You see, but you do not observe. The distinction is clear.',
    'I can resist everything except temptation!',
    'Why, sometimes I have believed as many as six impossible things before breakfast.',
  ];

  for (const quote of sampleQuotes) {
    const key = generateDerangementKey();
    const truth = invertKey(key);

    const ciphertext = encryptQuote(quote, key);
    // Ciphertext must be different from plaintext for letters
    assert.notStrictEqual(ciphertext, quote.toUpperCase());

    const decrypted = decryptCiphertext(ciphertext, truth);
    assert.strictEqual(
      decrypted,
      quote.toUpperCase(),
      `Decryption failed to reconstruct plaintext for quote: ${quote}`
    );

    // Verify non-alphabetic punctuation and whitespace are perfectly preserved
    const origNonLetters = quote.replace(/[a-zA-Z]/g, '');
    const cipherNonLetters = ciphertext.replace(/[a-zA-Z]/g, '');
    assert.strictEqual(origNonLetters, cipherNonLetters);
  }
});

test('Entropy & Solvability: calculates Shannon entropy and requires >= 14 distinct letters', () => {
  const quote = 'You see, but you do not observe. The distinction is clear.';
  const distinct = getDistinctLetterCount(quote);
  assert.ok(distinct >= 14, `Expected >= 14 distinct letters, got ${distinct}`);

  const entropy = calculateLetterEntropy(quote);
  assert.ok(
    entropy > 3.5 && entropy < 4.5,
    `Expected entropy between 3.5 and 4.5, got ${entropy}`
  );

  const diff = getDifficultyRating(entropy, quote.length);
  assert.ok(diff >= 1 && diff <= 5);
});
