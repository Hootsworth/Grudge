import test from 'node:test';
import assert from 'node:assert/strict';
import { constantTimeEqual } from '../src/security/normalization.ts';

test('Constant-time comparison: returns true for identical strings', async () => {
  assert.equal(await constantTimeEqual('key404', 'key404'), true);
  assert.equal(await constantTimeEqual('listen', 'listen'), true);
  assert.equal(await constantTimeEqual('01mole', '01mole'), true);
  assert.equal(await constantTimeEqual('', ''), true);
});

test('Constant-time comparison: returns false for mismatched strings', async () => {
  assert.equal(await constantTimeEqual('key404', 'key405'), false);
  assert.equal(await constantTimeEqual('listen', 'silent'), false);
  assert.equal(await constantTimeEqual('01mole', '02mole'), false);
});

test('Constant-time comparison: handles different string lengths safely', async () => {
  assert.equal(await constantTimeEqual('key', 'key404'), false);
  assert.equal(await constantTimeEqual('superlongpasscode', 'short'), false);
  assert.equal(await constantTimeEqual('', 'nonempty'), false);
});

test('Constant-time comparison: uses fixed 32-byte SHA-256 digest buffers', async () => {
  // Confirm that a 3-character string and a 12-character string both evaluate accurately
  const guess = 'abc';
  const target = 'abcdefghijkl';
  assert.equal(await constantTimeEqual(guess, target), false);
  assert.equal(await constantTimeEqual(target, target), true);
});
