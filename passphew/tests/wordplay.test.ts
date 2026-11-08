import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyWordplay } from '../src/cron/wordplay_check.ts';

test('Wordplay verification: Anagram verifies exact letter frequency', () => {
  // "silent" anagrams to "listen" -> exact match
  const valid = verifyWordplay('Anagram', 'Silent, shuffled, means to hear', 'listen', {
    type: 'Anagram',
    fodder: 'silent',
  });
  assert.equal(valid.valid, true);

  // Mismatched letter frequency
  const invalid = verifyWordplay('Anagram', 'Silence, shuffled, means to hear', 'listen', {
    type: 'Anagram',
    fodder: 'silence',
  });
  assert.equal(valid.valid, true);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors[0].includes('Anagram letters do not match fodder'));
});

test('Wordplay verification: Reversal verifies exact backwards read', () => {
  const valid = verifyWordplay('Reversal', 'Orwell year read in mirror', '4891', {
    type: 'Reversal',
    reversalSource: '1984',
  });
  assert.equal(valid.valid, true);

  const invalid = verifyWordplay('Reversal', 'Year in mirror', '4892', {
    type: 'Reversal',
    reversalSource: '1984',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors[0].includes('Reversal mismatch'));
});

test('Wordplay verification: Hidden word verifies substring in clue', () => {
  const valid = verifyWordplay('Hidden word', 'Concealed in worst ashcan: hidden loot', 'stash');
  assert.equal(valid.valid, true);

  const invalid = verifyWordplay('Hidden word', 'Open daylight in the park', 'stash');
  assert.equal(invalid.valid, false);
});

test('Wordplay verification: Cut short removes trailing character', () => {
  const valid = verifyWordplay('Cut short', 'Coded, but not finished, is a secret system', 'code', {
    type: 'Cut short',
    cutShortBase: 'coded',
  });
  assert.equal(valid.valid, true);

  const invalid = verifyWordplay('Cut short', 'Coded clue', 'cod', {
    type: 'Cut short',
    cutShortBase: 'coded',
  });
  assert.equal(invalid.valid, false);
});

test('Wordplay verification: Charade concatenates parts accurately', () => {
  const valid = verifyWordplay('Charade', 'Cut roughly, then the Queen', 'hacker', {
    type: 'Charade',
    charadeParts: ['hack', 'er'],
  });
  assert.equal(valid.valid, true);

  const invalid = verifyWordplay('Charade', 'Clue', 'hacker', {
    type: 'Charade',
    charadeParts: ['hack', 'ing'],
  });
  assert.equal(invalid.valid, false);
});
