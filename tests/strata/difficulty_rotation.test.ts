import test from 'node:test';
import assert from 'node:assert';
import {
  THEMES,
  SPREADS,
  getDifficultyAndThemeForDate,
  validateEventSpread,
} from '../../src/puzzle/difficulty.ts';

test('Difficulty & Theme Rotation: cycles through all 7 themes deterministically', () => {
  const seenThemes = new Set<string>();

  // Sample consecutive 7 days
  const baseDate = new Date('2026-11-01T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const cur = new Date(baseDate.getTime() + i * 86400 * 1000);
    const dateStr = cur.toISOString().split('T')[0];
    const { theme } = getDifficultyAndThemeForDate(dateStr);
    seenThemes.add(theme);
  }

  // All 7 themes must be covered in a 7-day period
  assert.strictEqual(seenThemes.size, 7);
  for (const t of THEMES) {
    assert.ok(seenThemes.has(t), `Theme ${t} should be rotated`);
  }
});

test('Difficulty & Theme Rotation: cycles through all 3 spreads (century, era, millennia)', () => {
  const seenSpreads = new Set<string>();

  const baseDate = new Date('2026-11-01T00:00:00Z');
  for (let i = 0; i < 3; i++) {
    const cur = new Date(baseDate.getTime() + i * 86400 * 1000);
    const dateStr = cur.toISOString().split('T')[0];
    const { spread } = getDifficultyAndThemeForDate(dateStr);
    seenSpreads.add(spread);
  }

  assert.strictEqual(seenSpreads.size, 3);
  for (const s of SPREADS) {
    assert.ok(seenSpreads.has(s), `Spread ${s} should be rotated`);
  }
});

test('Spread Validation: verifies century spread (span <= 100 years)', () => {
  const centuryYears = [1903, 1928, 1945, 1969, 1989, 1999]; // Span = 96 years
  const validCheck = validateEventSpread(centuryYears, 'century');
  assert.strictEqual(validCheck.valid, true);

  const tooWideYears = [1850, 1900, 1950, 2000, 2010, 2020]; // Span = 170 years > 120
  const invalidCheck = validateEventSpread(tooWideYears, 'century');
  assert.strictEqual(invalidCheck.valid, false);
  assert.ok(invalidCheck.reason?.includes('Century spread expected'));
});

test('Spread Validation: verifies millennia spread (span >= 1000 years)', () => {
  const millenniaYears = [-2560, -776, -44, 1000, 1492, 1969]; // Span > 4000 years
  const validCheck = validateEventSpread(millenniaYears, 'millennia');
  assert.strictEqual(validCheck.valid, true);

  const tooNarrowYears = [1500, 1600, 1700, 1800, 1850, 1900]; // Span = 400 < 900
  const invalidCheck = validateEventSpread(tooNarrowYears, 'millennia');
  assert.strictEqual(invalidCheck.valid, false);
});
