// Tests for Ballpark verification rejection logic and Fermi checks
import { test } from 'node:test';
import assert from 'node:assert';
import { verifySourceConsistency, verifyExtractedAccuracy, verifyCandidate } from '../src/generator/verification.ts';
import { checkFermiDerivation } from '../src/generator/fermi.ts';

test('Two-source verification: passes when two sources are within 25% (ratio <= 1.25)', () => {
  // 1.0e9 vs 1.15e9 -> ratio 1.15 <= 1.25
  const res = verifySourceConsistency(1.0e9, 1.15e9);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.ratio, 1.15);

  // Exact match
  const resExact = verifySourceConsistency(440, 440);
  assert.strictEqual(resExact.valid, true);
  assert.strictEqual(resExact.ratio, 1.0);
});

test('Two-source verification: rejects when two sources differ by more than 25% (ratio > 1.25)', () => {
  // 1.0e9 vs 1.30e9 -> ratio 1.30 > 1.25
  const res = verifySourceConsistency(1.0e9, 1.30e9);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.ratio, 1.3);

  // Inverted order: 2.0e5 vs 1.4e5 -> ratio 1.428 > 1.25
  const resInv = verifySourceConsistency(2.0e5, 1.4e5);
  assert.strictEqual(resInv.valid, false);
  assert.ok(resInv.ratio > 1.25);
});

test('Extracted value verification: passes when extracted value matches within 10% (ratio <= 1.10)', () => {
  // Proposed: 1.0e11, Extracted: 1.08e11 -> ratio 1.08 <= 1.10
  const res = verifyExtractedAccuracy(1.0e11, 1.08e11);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.ratio, 1.08);
});

test('Extracted value verification: rejects when extracted value differs by more than 10% (ratio > 1.10)', () => {
  // Proposed: 1.0e11, Extracted: 1.15e11 -> ratio 1.15 > 1.10
  const res = verifyExtractedAccuracy(1.0e11, 1.15e11);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.ratio, 1.15);
});

test('Fermi derivation check: passes when sourced value is within factor of 3 of derivation', () => {
  // Human heartbeats: 2.94e9 sourced vs 2.80e9 derivation -> factor 1.05 <= 3.0
  const res = checkFermiDerivation(2.94e9, 2.80e9);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.factor, 1.05);

  // Commercial flights: 1.05e5 sourced vs 1.0e5 derivation -> factor 1.05 <= 3.0
  const resFlights = checkFermiDerivation(1.05e5, 1.0e5);
  assert.strictEqual(resFlights.valid, true);
  assert.strictEqual(resFlights.factor, 1.05);
});

test('Fermi derivation check: flags and rejects when sourced value differs by more than factor of 3', () => {
  // Sourced: 1.0e9, Derivation: 3.5e9 -> factor 3.5 > 3.0
  const res = checkFermiDerivation(1.0e9, 3.5e9);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.factor, 3.5);
  assert.ok(res.message?.includes('disagrees with sourced value'));
});

test('Full candidate verification with fixtures: valid candidate passes all checks', () => {
  const candidate = {
    question: 'How many times does an average human heart beat in an 80-year lifespan?',
    value: 2.94e9,
    sourceAValue: 2.9e9,
    sourceBValue: 3.0e9,
    extractedValue: 2.94e9,
    sources: [
      'https://www.bhf.org.uk/informationsupport/heart-matters-magazine/medical/heart-rate-and-pulses',
      'https://www.health.harvard.edu/heart-health/want-to-check-your-heart-rate-heres-how',
    ],
  };

  const res = verifyCandidate(candidate);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.errors.length, 0);
});

test('Full candidate verification with fixtures: candidate with conflicting sources is rejected', () => {
  const conflictedCandidate = {
    question: 'Ambiguous question with conflicting sources',
    value: 1.0e6,
    sourceAValue: 1.0e6,
    sourceBValue: 1.5e6, // 50% discrepancy
    extractedValue: 1.0e6,
    sources: ['https://sourceA.org', 'https://sourceB.org'],
  };

  const res = verifyCandidate(conflictedCandidate);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Sources differ by')));
});
