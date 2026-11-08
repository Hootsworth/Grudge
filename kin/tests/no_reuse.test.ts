import test from 'node:test';
import assert from 'node:assert';
import { isTripletAllowedByHistory } from '../src/selection.ts';

test('No-Reuse Windows: rejects organism reused within 30 days', () => {
  const used30Days = new Set(['org_elephant', 'org_dog', 'org_human']);
  const used365Days = new Set<string>();

  // Candidate triplet includes 'org_elephant' which was used within 30 days
  const candidate: [string, string, string] = ['org_elephant', 'org_manatee', 'org_rhino'];
  const allowed = isTripletAllowedByHistory(candidate, used30Days, used365Days);

  assert.strictEqual(allowed, false);
});

test('No-Reuse Windows: allows organisms not used within 30 days', () => {
  const used30Days = new Set(['org_frog', 'org_salmon', 'org_starfish']);
  const used365Days = new Set<string>();

  const candidate: [string, string, string] = ['org_elephant', 'org_manatee', 'org_rhino'];
  const allowed = isTripletAllowedByHistory(candidate, used30Days, used365Days);

  assert.strictEqual(allowed, true);
});

test('No-Reuse Windows: rejects exact triplet reused within 365 days regardless of order', () => {
  const used30Days = new Set<string>();
  // Previous triplet recorded in sorted order: 'org_a:org_b:org_c'
  const used365Days = new Set(['org_blue_whale:org_cow:org_hippo']);

  // Same 3 organisms submitted in different permutation
  const candidatePermuted: [string, string, string] = ['org_hippo', 'org_blue_whale', 'org_cow'];
  const allowed = isTripletAllowedByHistory(candidatePermuted, used30Days, used365Days);

  assert.strictEqual(allowed, false);
});

test('No-Reuse Windows: allows fresh triplet older than 365 days', () => {
  const used30Days = new Set<string>();
  const used365Days = new Set(['org_mouse:org_rabbit:org_hedgehog']);

  const candidate: [string, string, string] = ['org_chicken:org_crocodile:org_lizard'];
  const allowed = isTripletAllowedByHistory(candidate, used30Days, used365Days);

  assert.strictEqual(allowed, true);
});
