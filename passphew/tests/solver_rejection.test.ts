import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSolverCheck, BANNED_ANSWERS } from '../src/cron/solver_check.ts';

test('Solver rejection: candidate passes when real answer is top result #1', () => {
  const result = evaluateSolverCheck('listen', ['listen', 'silent', 'tinsel'], 'Silent, shuffled, means to hear');
  assert.equal(result.passed, true);
  assert.equal(result.topGuesses[0], 'listen');
});

test('Solver rejection: rejects candidate when real answer is #2 or #3 (not top result)', () => {
  // Real answer is #2
  const res2 = evaluateSolverCheck('listen', ['silent', 'listen', 'tinsel'], 'Quiet, jumbled word');
  assert.equal(res2.passed, false);
  assert.ok(res2.rejectionReason?.includes('guess #2, not top result #1'));

  // Real answer is #3
  const res3 = evaluateSolverCheck('key404', ['lock404', 'door500', 'key404'], 'Missing opener');
  assert.equal(res3.passed, false);
  assert.ok(res3.rejectionReason?.includes('guess #3, not top result #1'));
});

test('Solver rejection: rejects candidate when solver completely fails to find answer', () => {
  const result = evaluateSolverCheck('key404', ['open200', 'gateway', 'passcode'], 'Opener of locks');
  assert.equal(result.passed, false);
  assert.ok(result.rejectionReason?.includes('Solver failed to crack clue'));
});

test('Solver rejection: rejects empty solver responses', () => {
  const result = evaluateSolverCheck('key404', [], 'Clue text');
  assert.equal(result.passed, false);
  assert.ok(result.rejectionReason?.includes('no answers'));
});

test('Solver rejection: rejects brand names and commercial trademarks', () => {
  assert.ok(BANNED_ANSWERS.has('apple'));
  assert.ok(BANNED_ANSWERS.has('nike'));
  assert.ok(BANNED_ANSWERS.has('tesla'));

  const result = evaluateSolverCheck('nike', ['nike', 'shoe', 'goddess'], 'Winged goddess of victory');
  assert.equal(result.passed, false);
  assert.ok(result.rejectionReason?.includes('brand name or blacklisted term'));
});

test('Solver rejection: rejects clue if surface text gives the answer away', () => {
  // Clue contains the exact answer word
  const result = evaluateSolverCheck('listen', ['listen', 'hear', 'sound'], 'You should listen to hear the alarm');
  assert.equal(result.passed, false);
  assert.ok(result.rejectionReason?.includes('Surface text leaks the answer'));
});
