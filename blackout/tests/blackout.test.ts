import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeExcerpt,
  normalizeTitle,
  isTitleMatch,
  getDailyDossier,
  VETTED_DOSSIERS,
  COMMON_ARTICLES,
} from '../src/dossiers.ts';
import { getBlackoutRank, generateShareCard } from '../src/ranking.ts';

test('tokenization extracts words, preserves punctuation, and identifies articles', () => {
  const text = 'The Manhattan Project was a research undertaking, led by J. Robert Oppenheimer.';
  const tokens = tokenizeExcerpt(text);

  assert.ok(tokens.length > 5);

  const theToken = tokens[0];
  assert.equal(theToken.word, 'the');
  assert.equal(theToken.raw, 'The');
  assert.equal(theToken.isCommonArticle, true);

  const manhattanToken = tokens[1];
  assert.equal(manhattanToken.word, 'manhattan');
  assert.equal(manhattanToken.raw, 'Manhattan');
  assert.equal(manhattanToken.isCommonArticle, false);

  const undertakingToken = tokens.find((t) => t.word === 'undertaking');
  assert.ok(undertakingToken);
  assert.equal(undertakingToken.raw, 'undertaking,');
});

test('normalizeTitle strips leading the, punctuation, and whitespace', () => {
  assert.equal(normalizeTitle('The Manhattan Project'), 'manhattanproject');
  assert.equal(normalizeTitle('manhattan project!'), 'manhattanproject');
  assert.equal(normalizeTitle('Apollo 11'), 'apollo11');
  assert.equal(normalizeTitle('The Rosetta Stone...'), 'rosettastone');
});

test('isTitleMatch matches title and aliases leniently and rejects mismatches', () => {
  const apollo = VETTED_DOSSIERS.find((d) => d.id === 'apollo-11')!;
  assert.ok(apollo);

  assert.equal(isTitleMatch('Apollo 11', apollo), true);
  assert.equal(isTitleMatch('apollo 11', apollo), true);
  assert.equal(isTitleMatch('Apollo XI', apollo), true);
  assert.equal(isTitleMatch('project apollo 11', apollo), true);
  assert.equal(isTitleMatch('The Apollo 11', apollo), true);

  assert.equal(isTitleMatch('Sputnik 1', apollo), false);
  assert.equal(isTitleMatch('Voyager', apollo), false);
});

test('all vetted dossiers have valid properties and safe citations', () => {
  assert.ok(VETTED_DOSSIERS.length >= 14);

  for (const dossier of VETTED_DOSSIERS) {
    assert.ok(dossier.id && dossier.id.length > 0);
    assert.ok(dossier.title && dossier.title.length > 0);
    assert.ok(dossier.excerpt && dossier.excerpt.length > 50);
    assert.ok(dossier.citation.startsWith('https://'));
    assert.ok(Array.isArray(dossier.aliases) && dossier.aliases.length > 0);
    assert.ok(dossier.category && dossier.category.length > 0);
  }
});

test('getDailyDossier deterministically resolves upcoming dates', () => {
  const d1 = getDailyDossier('2026-11-09');
  const d2 = getDailyDossier('2026-11-10');
  const d3 = getDailyDossier('2026-11-09');

  assert.equal(d1.id, 'manhattan-project');
  assert.equal(d2.id, 'rosetta-stone');
  assert.equal(d1.title, d3.title);
  assert.equal(d1.plate, d3.plate);
});

test('rank tiers evaluate correctly according to guess counts', () => {
  assert.equal(getBlackoutRank(3, true), 'Master Cryptanalyst');
  assert.equal(getBlackoutRank(5, true), 'Master Cryptanalyst');
  assert.equal(getBlackoutRank(8, true), 'Intelligence Officer');
  assert.equal(getBlackoutRank(12, true), 'Intelligence Officer');
  assert.equal(getBlackoutRank(17, true), 'Field Operative');
  assert.equal(getBlackoutRank(28, true), 'Archival Analyst');
  assert.equal(getBlackoutRank(50, true), 'Clerical Researcher');
  assert.equal(getBlackoutRank(10, false), 'Redacted in Action');
});

test('generateShareCard formats clean espionage results', () => {
  const card = generateShareCard(313, true, 7, 'Intelligence Officer');
  assert.ok(card.includes('BLACKOUT #313'));
  assert.ok(card.includes('DECLASSIFIED in 7 guesses'));
  assert.ok(card.includes('Intelligence Officer'));
  assert.ok(card.includes('grudge.games/blackout'));
});

test('sanitization rules prevent unredacted substantive words from leaking', () => {
  const dossier = VETTED_DOSSIERS[0];
  const tokens = tokenizeExcerpt(dossier.excerpt);

  const leakedSubstantiveWords = tokens
    .filter((t) => !t.isPunctuationOnly && !t.isCommonArticle)
    .filter((t) => COMMON_ARTICLES.has(t.word));

  assert.equal(leakedSubstantiveWords.length, 0);
});
