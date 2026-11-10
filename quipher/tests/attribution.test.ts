// quipher/tests/attribution.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyQuoteAttribution, type QuoteCandidate } from '../src/attribution.ts';

test('Attribution Check: verifies genuine public-domain Gutenberg quotes', () => {
  const gutenbergExcerpt = `
    First published 1891.
    A Scandal in Bohemia by Arthur Conan Doyle.
    "You see, but you do not observe. The distinction is clear. For example, you have frequently seen the steps which lead up from the hall to this room."
  `;

  const validCandidate: QuoteCandidate = {
    plaintext: 'You see, but you do not observe. The distinction is clear.',
    author: 'Arthur Conan Doyle',
    source: 'A Scandal in Bohemia',
    year: 1891,
  };

  const result = verifyQuoteAttribution(validCandidate, gutenbergExcerpt);
  assert.strictEqual(result.valid, true, `Expected valid quote, got error: ${result.reason}`);
  assert.ok(result.distinctLetters && result.distinctLetters >= 14);
  assert.ok(result.difficulty && result.difficulty >= 1);
});

test('Attribution Rejection: rejects famous apocryphal misattributions', () => {
  const fakeQuotes: QuoteCandidate[] = [
    {
      plaintext: 'Be yourself; everyone else is already taken.',
      author: 'Oscar Wilde',
      source: 'Popular internet quote',
      year: 1890,
    },
    {
      plaintext: 'The definition of insanity is doing the same thing over and over again and expecting different results.',
      author: 'Albert Einstein',
      source: 'Attributed quote',
      year: 1920,
    },
    {
      plaintext: 'Never, never, never give up.',
      author: 'Winston Churchill',
      source: 'Speech',
      year: 1941,
    },
    {
      plaintext: 'Two things are infinite: the universe and human stupidity, and I am not sure about the universe.',
      author: 'Albert Einstein',
      source: 'Attributed quote',
      year: 1925,
    },
  ];

  for (const cand of fakeQuotes) {
    const res = verifyQuoteAttribution(cand);
    assert.strictEqual(
      res.valid,
      false,
      `Expected "${cand.plaintext}" to be rejected as a misattribution!`
    );
    assert.ok(res.reason?.includes('misattribution') || res.reason?.includes('public domain') || res.reason?.includes('bounds'));
  }
});

test('Attribution Rejection: enforces public domain cutoff (pre-1930 / year <= 1929)', () => {
  const modernCandidate: QuoteCandidate = {
    plaintext: 'Well-behaved women seldom make history.',
    author: 'Laurel Thatcher Ulrich',
    source: 'American Quarterly',
    year: 1976,
  };

  const res = verifyQuoteAttribution(modernCandidate);
  assert.strictEqual(res.valid, false);
  assert.ok(res.reason?.includes('not public domain') || res.reason?.includes('pre-1930'));
});

test('Attribution Rejection: rejects quotes with < 35 or > 110 characters', () => {
  const tooShort: QuoteCandidate = {
    plaintext: 'I came, I saw, I conquered.',
    author: 'Julius Caesar',
    source: 'Plutarch',
    year: -47,
  };
  const resShort = verifyQuoteAttribution(tooShort);
  assert.strictEqual(resShort.valid, false);
  assert.ok(resShort.reason?.includes('out of bounds'));

  const tooLong: QuoteCandidate = {
    plaintext: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood.',
    author: 'Jane Austen',
    source: 'Pride and Prejudice',
    year: 1813,
  };
  const resLong = verifyQuoteAttribution(tooLong);
  assert.strictEqual(resLong.valid, false);
  assert.ok(resLong.reason?.includes('out of bounds'));
});

test('Attribution Rejection: rejects quotes with fewer than 14 distinct letters', () => {
  const fewLetters: QuoteCandidate = {
    plaintext: 'To be, or not to be: that is the question.',
    author: 'William Shakespeare',
    source: 'Hamlet',
    year: 1603,
  };
  const res = verifyQuoteAttribution(fewLetters);
  assert.strictEqual(res.valid, false);
  assert.ok(res.reason?.toLowerCase().includes('distinct letters'));
});

test('Attribution Rejection: rejects quote if not present in primary Gutenberg source text', () => {
  const gutenbergExcerpt = `Pride and Prejudice by Jane Austen. "It is a truth universally acknowledged..."`;

  const mismatchedCandidate: QuoteCandidate = {
    plaintext: 'I can resist everything except temptation.',
    author: 'Oscar Wilde',
    source: 'Lady Windermere',
    year: 1892,
  };

  const res = verifyQuoteAttribution(mismatchedCandidate, gutenbergExcerpt);
  assert.strictEqual(res.valid, false);
  assert.ok(res.reason?.includes('primary Gutenberg source text'));
});
