import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistanceKm,
  calculatePoints,
  getRankTitle,
  shuffleShapes,
} from '../worker/scoring.ts';
import type { WindowShape } from '../worker/types.ts';

test('Haversine distance calculation', async (t) => {
  await t.test('calculates zero distance for identical points', () => {
    const dist = haversineDistanceKm(48.8566, 2.3522, 48.8566, 2.3522);
    assert.equal(dist, 0);
  });

  await t.test('calculates accurate distance between London and Paris (~343 km)', () => {
    // London: 51.5074, -0.1278 | Paris: 48.8566, 2.3522
    const dist = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    assert.ok(dist >= 340 && dist <= 346, `Expected ~343 km, got ${dist}`);
  });

  await t.test('calculates accurate distance between New York and London (~5570 km)', () => {
    // NYC: 40.7128, -74.0060 | London: 51.5074, -0.1278
    const dist = haversineDistanceKm(40.7128, -74.006, 51.5074, -0.1278);
    assert.ok(dist >= 5560 && dist <= 5590, `Expected ~5570 km, got ${dist}`);
  });
});

test('Scoring formula points calculation', async (t) => {
  await t.test('awards maximum 5000 points within 30 km radius with 0 hints', () => {
    assert.equal(calculatePoints(0, 0), 5000);
    assert.equal(calculatePoints(15, 0), 5000);
    assert.equal(calculatePoints(30, 0), 5000);
  });

  await t.test('applies 15% penalty per zoom-out hint at close distance', () => {
    // 0 hints -> 5000
    assert.equal(calculatePoints(10, 0), 5000);
    // 1 hint -> 5000 * 0.85 = 4250
    assert.equal(calculatePoints(10, 1), 4250);
    // 2 hints -> 5000 * 0.70 = 3500
    assert.equal(calculatePoints(10, 2), 3500);
  });

  await t.test('applies exponential dropoff: d = 830 km (800 km past 30 km buffer)', () => {
    // 5000 * exp(-800/800) = 5000 * e^-1 ~= 1839.4
    const pts0 = calculatePoints(830, 0);
    assert.equal(pts0, 1839);

    const pts1 = calculatePoints(830, 1);
    assert.equal(pts1, Math.round(1839.4 * 0.85)); // 1563

    const pts2 = calculatePoints(830, 2);
    assert.equal(pts2, Math.round(1839.4 * 0.7)); // 1288
  });

  await t.test('points drop toward zero at antipodal distances (~20,000 km)', () => {
    const pts = calculatePoints(18000, 0);
    assert.equal(pts, 0);
  });
});

test('Rank classification thresholds', async (t) => {
  await t.test('assigns Lost at sea for total < 5000', () => {
    assert.equal(getRankTitle(0), 'Lost at sea');
    assert.equal(getRankTitle(4999), 'Lost at sea');
  });

  await t.test('assigns Deckhand for 5000 <= total < 10000', () => {
    assert.equal(getRankTitle(5000), 'Deckhand');
    assert.equal(getRankTitle(9999), 'Deckhand');
  });

  await t.test('assigns First mate for 10000 <= total < 15000', () => {
    assert.equal(getRankTitle(10000), 'First mate');
    assert.equal(getRankTitle(14999), 'First mate');
  });

  await t.test('assigns Navigator for 15000 <= total < 20000', () => {
    assert.equal(getRankTitle(15000), 'Navigator');
    assert.equal(getRankTitle(19999), 'Navigator');
  });

  await t.test('assigns Master cartographer for total >= 20000', () => {
    assert.equal(getRankTitle(20000), 'Master cartographer');
    assert.equal(getRankTitle(25000), 'Master cartographer');
  });
});

test('Randomize SVG path ordering per session', async (t) => {
  await t.test('reorders paths differently for different sessions while preserving elements', () => {
    const shapes: WindowShape[] = [
      { d: 'M0,0 L10,10 Z', cls: 'c0' },
      { d: 'M20,20 L30,30 Z', cls: 'c1' },
      { d: 'M40,40 L50,50 Z', cls: 'c2' },
      { d: 'M60,60 L70,70 Z', cls: 'c3' },
      { d: 'M80,80 L90,90 Z', cls: 'c4' },
    ];

    const s1 = shuffleShapes(shapes, 'session-alpha-1');
    const s2 = shuffleShapes(shapes, 'session-beta-2');

    // Both retain all shapes
    assert.equal(s1.length, shapes.length);
    assert.equal(s2.length, shapes.length);

    // Order is randomized and deterministic per seed
    assert.deepEqual(s1, shuffleShapes(shapes, 'session-alpha-1'));
  });
});
