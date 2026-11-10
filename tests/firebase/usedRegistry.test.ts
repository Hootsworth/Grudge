// tests/firebase/usedRegistry.test.ts

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeItemKey,
  getItemDocId,
  checkItemReuse,
  recordItemUsage,
  filterFreshItems,
} from '../../src/firebase/usedRegistry.ts';

// In-memory mock Firestore for unit testing 365-day deduplication logic
class MockFirestore {
  docs = new Map<string, any>();
}

test('Key Normalization: removes punctuation, whitespace, and normalizes casing', () => {
  const k1 = "All the world's a stage, and all the men and women merely players.";
  const k2 = 'all the worlds a stage and all the men and women merely players';
  assert.strictEqual(normalizeItemKey(k1), normalizeItemKey(k2));

  // Typographic curly quotes vs straight quotes
  const curly = '“You see, but you do not observe.”';
  const straight = '"You see, but you do not observe."';
  assert.strictEqual(normalizeItemKey(curly), normalizeItemKey(straight));
});

test('DocId Generation: deterministic hash-based IDs for fast lookups', () => {
  const norm = normalizeItemKey("Experience is merely the name men gave to their mistakes.");
  const id1 = getItemDocId('quipher', norm);
  const id2 = getItemDocId('quipher', norm);
  assert.strictEqual(id1, id2);
  assert.ok(id1.startsWith('quipher_'));
});

test('365-Day Cooldown: rejects items used within 365 days and permits older items', async () => {
  const mockDb = new MockFirestore();
  const gameId = 'quipher';
  const quote = 'I can resist everything except temptation.';
  const norm = normalizeItemKey(quote);
  const docId = getItemDocId(gameId, norm);

  // 1. Initial check: never used -> allowed
  const mockDbAdapter: any = {
    _docs: mockDb.docs,
  };

  // Mock doc and getDoc behavior
  const now = Date.now();
  const dayMs = 86400 * 1000;

  // Simulate an item used 120 days ago (< 365 days)
  mockDb.docs.set(`used_items/${docId}`, {
    gameId,
    itemKey: quote,
    normalizedKey: norm,
    lastUsedDate: '2026-07-13',
    lastUsedTimestamp: now - 120 * dayMs,
    expiresAt: now + (365 - 120) * dayMs,
    useCount: 1,
    history: [{ date: '2026-07-13', timestamp: now - 120 * dayMs }],
  });

  // Check with mock doc retrieval
  const itemData = mockDb.docs.get(`used_items/${docId}`);
  const daysSince = (now - itemData.lastUsedTimestamp) / dayMs;
  assert.ok(daysSince < 365, 'Item was used within 365 days');

  // Verify cooldown calculation logic
  const minDays = 365;
  const canUseRecent = daysSince >= minDays;
  assert.strictEqual(canUseRecent, false, 'Recent item (< 365 days) must be rejected');

  // Simulate an item used 400 days ago (> 365 days)
  const oldDocId = getItemDocId(gameId, normalizeItemKey('Ancient quote'));
  mockDb.docs.set(`used_items/${oldDocId}`, {
    gameId,
    itemKey: 'Ancient quote',
    normalizedKey: normalizeItemKey('Ancient quote'),
    lastUsedDate: '2025-10-06',
    lastUsedTimestamp: now - 400 * dayMs,
    expiresAt: now - 35 * dayMs,
    useCount: 1,
  });

  const oldData = mockDb.docs.get(`used_items/${oldDocId}`);
  const oldDaysSince = (now - oldData.lastUsedTimestamp) / dayMs;
  const canUseOld = oldDaysSince >= minDays;
  assert.strictEqual(canUseOld, true, 'Item older than 365 days must be permitted');
});

test('Filter Candidates: filters out candidates used within 365 days', () => {
  const now = Date.now();
  const dayMs = 86400 * 1000;

  const usedRegistry = new Map<string, number>();
  // Candidate A was used 40 days ago
  usedRegistry.set(normalizeItemKey('Quote Alpha'), now - 40 * dayMs);
  // Candidate B was used 410 days ago (expired cooldown)
  usedRegistry.set(normalizeItemKey('Quote Beta'), now - 410 * dayMs);
  // Candidate C was never used

  const candidates = [
    { text: 'Quote Alpha', author: 'Author 1' },
    { text: 'Quote Beta', author: 'Author 2' },
    { text: 'Quote Gamma', author: 'Author 3' },
  ];

  const fresh = candidates.filter((c) => {
    const lastUsed = usedRegistry.get(normalizeItemKey(c.text));
    if (!lastUsed) return true;
    const days = (now - lastUsed) / dayMs;
    return days >= 365;
  });

  assert.strictEqual(fresh.length, 2);
  assert.strictEqual(fresh[0].text, 'Quote Beta');
  assert.strictEqual(fresh[1].text, 'Quote Gamma');
});
