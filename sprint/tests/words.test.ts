import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidWord,
  canMakeFromKey,
  getAllAccountedSubAnagrams,
  calculateMaxScore,
  POINT_VALUES,
  WORD_LIST,
  WORD_SET,
} from '../src/words.ts';
import { VETTED_SPRINT_SETS, getDailySprintPuzzle } from '../src/generator/daily.ts';

test('Word Database: contains thousands of authoritative English words (lengths 3 to 6)', () => {
  assert.ok(WORD_LIST.length >= 30000, `Expected >= 30000 words, got ${WORD_LIST.length}`);
  assert.equal(WORD_SET.size, WORD_LIST.length);
  assert.equal(isValidWord('cat'), true);
  assert.equal(isValidWord('star'), true);
  assert.equal(isValidWord('steam'), true);
  assert.equal(isValidWord('stream'), true);
  assert.equal(isValidWord('planet'), true);
  assert.equal(isValidWord('zzqq'), false);
});

test('Letter Bounds & Construction Check: verifies word can be formed from key', () => {
  assert.equal(canMakeFromKey('stream', 'STREAM'), true);
  assert.equal(canMakeFromKey('team', 'STREAM'), true);
  assert.equal(canMakeFromKey('meat', 'STREAM'), true);
  assert.equal(canMakeFromKey('mat', 'STREAM'), true);
  // 'streams' has two 's' characters, but 'STREAM' only has one 's'
  assert.equal(canMakeFromKey('streams', 'STREAM'), false);
  // 'planet' has 'p' which is not in 'STREAM'
  assert.equal(canMakeFromKey('planet', 'STREAM'), false);
});

test('Sub-Anagram Generation: accounts for every valid word and sorts by length', () => {
  const words = getAllAccountedSubAnagrams('STREAM');
  assert.ok(words.length >= 50, `Expected >= 50 words for STREAM, got ${words.length}`);
  assert.ok(words.includes('stream'));
  assert.ok(words.includes('master'));
  assert.ok(words.includes('tamer'));
  assert.ok(words.includes('team'));
  assert.ok(words.includes('star'));
  assert.ok(words.includes('mat'));

  // Every single word accounted for must be valid in the dictionary
  for (const w of words) {
    assert.ok(isValidWord(w), `Word ${w} was not in dictionary`);
    assert.ok(w.length >= 3 && w.length <= 6);
  }

  // Check descending length order
  for (let i = 0; i < words.length - 1; i++) {
    assert.ok(words[i].length >= words[i + 1].length);
  }

  const maxScore = calculateMaxScore(words);
  assert.ok(maxScore >= 100);
});

test('Daily Rotation: all 14 backlog sets have valid 6-letter keys and accounted words', () => {
  assert.equal(VETTED_SPRINT_SETS.length, 14);
  for (const set of VETTED_SPRINT_SETS) {
    assert.equal(set.keyLetters.length, 6);
    assert.ok(set.totalWords >= 40, `Set for ${set.date} has too few words: ${set.totalWords}`);
    assert.ok(set.maxScore >= 80);
  }

  const d1 = getDailySprintPuzzle('2026-11-09');
  const d2 = getDailySprintPuzzle('2026-11-10');
  assert.notEqual(d1.plate, d2.plate);
  assert.notEqual(d1.keyLetters, d2.keyLetters);
});
