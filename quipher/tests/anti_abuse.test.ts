// quipher/tests/anti_abuse.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectScriptedSolving, type ScriptCheckEvent } from '../src/anti_abuse.ts';

test('Anti-Abuse: flags solves under 15 seconds as scripted', () => {
  const result = detectScriptedSolving(12, []);
  assert.strictEqual(result.isScripted, true);
  assert.ok(result.reason?.includes('under the 15-second human cognition threshold'));

  const fastHuman = detectScriptedSolving(16, []);
  assert.strictEqual(fastHuman.isScripted, false);
});

test('Anti-Abuse: flags automated single-letter brute-force check patterns', () => {
  // Simulating an automated bot rapidly cycling letter guesses:
  // Check 1: X -> A
  // Check 2: X -> B (500ms later)
  // Check 3: X -> C (500ms later)
  // Check 4: X -> D (500ms later)
  const botEvents: ScriptCheckEvent[] = [
    { mapping: { X: 'A', Y: 'M' }, timestamp: 1000 },
    { mapping: { X: 'B', Y: 'M' }, timestamp: 1500 },
    { mapping: { X: 'C', Y: 'M' }, timestamp: 2000 },
    { mapping: { X: 'D', Y: 'M' }, timestamp: 2500 },
  ];

  const botCheck = detectScriptedSolving(45, botEvents);
  assert.strictEqual(botCheck.isScripted, true);
  assert.ok(botCheck.reason?.includes('brute-force pattern'));

  // Legitimate human checks: multiple letters placed over realistic human thinking intervals
  const humanEvents: ScriptCheckEvent[] = [
    { mapping: { X: 'T', Y: 'H', Z: 'E' }, timestamp: 10000 },
    { mapping: { X: 'T', Y: 'H', Z: 'E', W: 'A', V: 'N', U: 'D' }, timestamp: 25000 },
    { mapping: { X: 'T', Y: 'H', Z: 'E', W: 'A', V: 'N', U: 'D', Q: 'S' }, timestamp: 42000 },
  ];

  const humanCheck = detectScriptedSolving(65, humanEvents);
  assert.strictEqual(humanCheck.isScripted, false);
});
