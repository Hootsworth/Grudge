import test from 'node:test';
import assert from 'node:assert';
import {
  checkStaticEventRules,
  verifyEstimatedYears,
} from '../../src/puzzle/verifier.ts';
import type { PuzzleEvent } from '../../src/types.ts';

const VALID_FIXTURE_EVENTS: PuzzleEvent[] = [
  { id: 'e1', text: 'Humans land on the lunar surface during Apollo mission', year: 1969, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Apollo_11' },
  { id: 'e2', text: 'Alexander Fleming discovers penicillin in his London lab', year: 1928, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Penicillin' },
  { id: 'e3', text: 'The Eiffel Tower opens for the Paris Exposition', year: 1889, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Eiffel_Tower' },
  { id: 'e4', text: 'Continental Congress adopts the Declaration of Independence', year: 1776, precision: 'exact', source: 'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence' },
  { id: 'e5', text: 'Gutenberg movable-type press prints copies of the Latin Bible', year: 1455, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Gutenberg_Bible' },
  { id: 'e6', text: 'Construction of the Great Pyramid of Giza finishes', year: -2560, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza' },
];

test('Verification Pass: valid fixture events pass all static checks', () => {
  const check = checkStaticEventRules(VALID_FIXTURE_EVENTS);
  assert.strictEqual(check.valid, true);
  assert.deepStrictEqual(check.errors, []);
});

test('Verification Pass: rejects events with date or timing leaks', () => {
  const leakingEvents: PuzzleEvent[] = [
    { id: 'e1', text: 'The first person walks on the lunar surface', year: 1969, precision: 'exact', source: 'https://en.wikipedia.org' }, // Leaks "the first"
    { id: 'e2', text: 'A treaty is signed in the 20th century', year: 1928, precision: 'exact', source: 'https://en.wikipedia.org' }, // Leaks "20th century"
    { id: 'e3', text: 'In 1889 the famous tower opened in Paris', year: 1889, precision: 'exact', source: 'https://en.wikipedia.org' }, // Leaks year "1889"
    { id: 'e4', text: 'The last battle of the campaign is fought', year: 1776, precision: 'exact', source: 'https://en.wikipedia.org' }, // Leaks "the last"
    { id: 'e5', text: 'Printing revolution begins with new movable metal type', year: 1455, precision: 'exact', source: 'https://en.wikipedia.org' },
    { id: 'e6', text: 'Ancient stone monument is raised in 2560 BCE', year: -2560, precision: 'approximate', source: 'https://en.wikipedia.org' }, // Leaks BCE date
  ];

  const check = checkStaticEventRules(leakingEvents);
  assert.strictEqual(check.valid, false);
  assert.ok(check.errors.some((e) => e.includes('leaks timing or order cues')));
});

test('Verification Pass: rejects event descriptions exceeding 70 characters', () => {
  const longEvent: PuzzleEvent = {
    id: 'e1',
    text: 'This is an excessively detailed and wordy event description that definitely exceeds seventy characters in length',
    year: 1969,
    precision: 'exact',
    source: 'https://en.wikipedia.org',
  };

  const events = [longEvent, ...VALID_FIXTURE_EVENTS.slice(1)];
  const check = checkStaticEventRules(events);
  assert.strictEqual(check.valid, false);
  assert.ok(check.errors.some((e) => e.includes('exceeds 70 characters')));
});

test('Verification Pass: rejects events with gap < 2 years', () => {
  const tightEvents: PuzzleEvent[] = [
    { ...VALID_FIXTURE_EVENTS[0], year: 1969 },
    { ...VALID_FIXTURE_EVENTS[1], year: 1968 }, // Gap of only 1 year!
    ...VALID_FIXTURE_EVENTS.slice(2),
  ];

  const check = checkStaticEventRules(tightEvents);
  assert.strictEqual(check.valid, false);
  assert.ok(check.errors.some((e) => e.includes('must be >= 2 years')));
});

test('Verification Pass: estimates within tolerance pass', () => {
  const closeEstimates: Record<string, number> = {
    e1: 1969, // exact match (diff 0)
    e2: 1929, // exact precision, diff 1 (allowed <= 2)
    e3: 1888, // exact precision, diff 1 (allowed <= 2)
    e4: 1776, // exact match
    e5: 1454, // exact precision, diff 1 (allowed <= 2)
    e6: -2570, // approximate precision, diff 10 (allowed <= 30)
  };

  const check = verifyEstimatedYears(VALID_FIXTURE_EVENTS, closeEstimates);
  assert.strictEqual(check.valid, true);
  assert.deepStrictEqual(check.errors, []);
});

test('Verification Pass: estimate differing by more than precision is rejected', () => {
  const wrongEstimates: Record<string, number> = {
    e1: 1980, // diff 11 > 2!
    e2: 1928,
    e3: 1889,
    e4: 1776,
    e5: 1455,
    e6: -2560,
  };

  const check = verifyEstimatedYears(VALID_FIXTURE_EVENTS, wrongEstimates);
  assert.strictEqual(check.valid, false);
  assert.ok(check.errors.some((e) => e.includes('Year verification failed')));
});
