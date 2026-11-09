import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidWord, isOneLetterDiff, letterDiff, findShortestPath, getNextOptimalStep, WORD_LIST, WORD_SET } from '../src/words.ts';
import { VETTED_LADDER_SETS, getDailyLadderPuzzle } from '../src/generator/daily.ts';

test('Word Database: contains thousands of authoritative 4-letter English words', () => {
  assert.ok(WORD_LIST.length >= 5000, `Expected at least 5000 words, got ${WORD_LIST.length}`);
  assert.equal(WORD_SET.size, WORD_LIST.length);
  assert.equal(isValidWord('cold'), true);
  assert.equal(isValidWord('warm'), true);
  assert.equal(isValidWord('word'), true);
  assert.equal(isValidWord('lead'), true);
  assert.equal(isValidWord('gold'), true);
  assert.equal(isValidWord('xyzq'), false);
  assert.equal(isValidWord('toolong'), false);
  assert.equal(isValidWord('cat'), false);
});

test('Letter Discrepancy: calculates difference and enforces one-letter change', () => {
  assert.equal(letterDiff('cold', 'cord'), 1);
  assert.equal(letterDiff('cold', 'card'), 2);
  assert.equal(letterDiff('cold', 'cold'), 0);
  assert.equal(isOneLetterDiff('cold', 'cord'), true);
  assert.equal(isOneLetterDiff('cold', 'card'), false);
  assert.equal(isOneLetterDiff('cold', 'cold'), false);
});

test('BFS Path-Finding: finds optimal ladder path and par strokes', () => {
  const path = findShortestPath('cold', 'warm');
  assert.ok(path !== null);
  assert.equal(path[0], 'cold');
  assert.equal(path[path.length - 1], 'warm');
  // Check that every step in the path is a 1-letter change and a valid word
  for (let i = 0; i < path.length - 1; i++) {
    assert.ok(isValidWord(path[i]));
    assert.equal(isOneLetterDiff(path[i], path[i + 1]), true);
  }
  assert.equal(path.length - 1, 4); // Par 4
});

test('Optimal Hint: returns immediate next step along shortest path', () => {
  const next = getNextOptimalStep('cold', 'warm');
  assert.ok(next !== null);
  assert.equal(isOneLetterDiff('cold', next), true);
  assert.ok(isValidWord(next));
});

test('Daily Rotation: all 14 backlog sets have 5 valid ladders with verified par', () => {
  assert.ok(VETTED_LADDER_SETS.length >= 7);
  for (const set of VETTED_LADDER_SETS) {
    assert.equal(set.ladders.length, 5);
    for (const l of set.ladders) {
      assert.ok(isValidWord(l.start), `Invalid start word: ${l.start}`);
      assert.ok(isValidWord(l.target), `Invalid target word: ${l.target}`);
      assert.ok(l.par >= 1 && l.par <= 6, `Par out of bounds: ${l.par}`);
      const solved = findShortestPath(l.start, l.target);
      assert.ok(solved !== null, `No path found for ${l.start} -> ${l.target}`);
      assert.equal(solved.length - 1, l.par);
    }
  }

  const p1 = getDailyLadderPuzzle('2026-11-09');
  const p2 = getDailyLadderPuzzle('2026-11-10');
  assert.notEqual(p1.plate, p2.plate);
  assert.notEqual(p1.ladders[0].start, p2.ladders[0].start);
});
