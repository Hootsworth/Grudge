import test from 'node:test';
import assert from 'node:assert';
import { validateFactNumbers } from '../src/selection.ts';

test('Fact-Number Validation: passes when fact contains no numbers', () => {
  const fact = 'Elephants and manatees are both Afrotherians, while rhinos belong to Perissodactyla.';
  const check = validateFactNumbers(fact, 65, 100, [58, 72], [94, 108]);
  assert.strictEqual(check.valid, true);
  assert.deepStrictEqual(check.unauthorizedNumbers, []);
});

test('Fact-Number Validation: passes when numbers strictly match divergence times or CIs in data', () => {
  // Fact mentions 65 Mya (t1) and 100 Mya (t2)
  const fact = 'Elephants and manatees split about 65 million years ago, while rhinos branched off 100 million years ago.';
  const check = validateFactNumbers(fact, 65, 100, [58, 72], [94, 108]);
  assert.strictEqual(check.valid, true);
  assert.deepStrictEqual(check.unauthorizedNumbers, []);
});

test('Fact-Number Validation: rejects fact containing hallucinated dates or unauthorized numbers', () => {
  // Fact hallucinates an unauthorized number "42" and year "1980"
  const fact = 'These two species shared an ancestor 42 million years ago according to a 1980 study.';
  const check = validateFactNumbers(fact, 65, 100, [58, 72], [94, 108]);
  assert.strictEqual(check.valid, false);
  assert.ok(check.unauthorizedNumbers.includes('42'));
  assert.ok(check.unauthorizedNumbers.includes('1980'));
});
