// Tests for Ballpark question spread rules and diversity
import { test } from 'node:test';
import assert from 'node:assert';
import { validateQuestionSpread } from '../src/generator/spread.ts';
import { BACKLOG_SETS } from '../src/generator/backlog.ts';

test('Spread rules: all 14 backlog sets pass full spread validation', () => {
  for (const day of BACKLOG_SETS) {
    const res = validateQuestionSpread(day.questions, [], day.date);
    assert.strictEqual(
      res.valid,
      true,
      `Day ${day.date} failed spread checks: ${res.errors.join('; ')}`
    );
    assert.ok(res.distinctOrdersCount >= 4, `Day ${day.date} should have >= 4 distinct orders`);
    assert.strictEqual(res.hasUnder10k, true, `Day ${day.date} must have an answer under 10^4`);
    assert.strictEqual(res.hasAbove1e15, true, `Day ${day.date} must have an answer above 10^15`);
    assert.ok(res.distinctCategoriesCount >= 4, `Day ${day.date} should have >= 4 categories`);
  }
});

test('Spread rules: rejects set with fewer than 4 distinct orders of magnitude', () => {
  const narrowQuestions = [
    { question: 'Q1', value: 1e5, valueLog10: 5.0, category: 'biology' },
    { question: 'Q2', value: 2e5, valueLog10: 5.3, category: 'history' },
    { question: 'Q3', value: 5e5, valueLog10: 5.7, category: 'technology' },
    { question: 'Q4', value: 1e2, valueLog10: 2.0, category: 'food' }, // under 10k
    { question: 'Q5', value: 1e16, valueLog10: 16.0, category: 'geography' }, // above 1e15
  ];
  // Orders present: 5, 2, 16 -> only 3 distinct orders
  const res = validateQuestionSpread(narrowQuestions);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('cover at least 4 distinct orders')));
});

test('Spread rules: rejects set missing answer under 10^4', () => {
  const noUnder10k = [
    { question: 'Q1', value: 1e5, valueLog10: 5.0, category: 'biology' },
    { question: 'Q2', value: 1e7, valueLog10: 7.0, category: 'history' },
    { question: 'Q3', value: 1e10, valueLog10: 10.0, category: 'technology' },
    { question: 'Q4', value: 1e12, valueLog10: 12.0, category: 'food' },
    { question: 'Q5', value: 1e16, valueLog10: 16.0, category: 'geography' },
  ];
  const res = validateQuestionSpread(noUnder10k);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('under 10^4')));
});

test('Spread rules: rejects set missing answer above 10^15', () => {
  const noAbove1e15 = [
    { question: 'Q1', value: 100, valueLog10: 2.0, category: 'biology' },
    { question: 'Q2', value: 1e5, valueLog10: 5.0, category: 'history' },
    { question: 'Q3', value: 1e8, valueLog10: 8.0, category: 'technology' },
    { question: 'Q4', value: 1e11, valueLog10: 11.0, category: 'food' },
    { question: 'Q5', value: 1e14, valueLog10: 14.0, category: 'geography' },
  ];
  const res = validateQuestionSpread(noAbove1e15);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('above 10^15')));
});

test('Spread rules: rejects set with fewer than 4 distinct categories', () => {
  const homogeneous = [
    { question: 'Q1', value: 100, valueLog10: 2.0, category: 'biology' },
    { question: 'Q2', value: 1e5, valueLog10: 5.0, category: 'biology' },
    { question: 'Q3', value: 1e8, valueLog10: 8.0, category: 'biology' },
    { question: 'Q4', value: 1e11, valueLog10: 11.0, category: 'technology' },
    { question: 'Q5', value: 1e16, valueLog10: 16.0, category: 'technology' },
  ];
  const res = validateQuestionSpread(homogeneous);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('distinct categories')));
});

test('Spread rules: rejects quantity reused within 120 days', () => {
  const currentSet = [
    { question: 'How many living humans currently occupy the planet Earth as of 2024?', value: 8.1e9, valueLog10: 9.9, category: 'history' },
    { question: 'Q2', value: 100, valueLog10: 2.0, category: 'biology' },
    { question: 'Q3', value: 1e7, valueLog10: 7.0, category: 'technology' },
    { question: 'Q4', value: 1e11, valueLog10: 11.0, category: 'food' },
    { question: 'Q5', value: 1e16, valueLog10: 16.0, category: 'geography' },
  ];
  const history = [
    { question: 'How many living humans currently occupy the planet Earth as of 2024?', date: '2026-10-01' }, // 40 days ago
  ];
  const res = validateQuestionSpread(currentSet, history, '2026-11-10');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('120 days minimum no-reuse window')));
});
