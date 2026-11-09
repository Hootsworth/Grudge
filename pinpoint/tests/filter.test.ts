import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLandFraction,
  getCoastlineTransitionCount,
  computeShapeDescriptor,
  descriptorDistance,
  checkDistinctiveness,
  validateSpotDiversity,
  type SpotCandidate,
} from '../generator/filter.ts';

test('Distinctiveness filter with fixtures', async (t) => {
  await t.test('rejects candidate with land fraction < 25% (empty ocean)', () => {
    // 40x30 mask with 10% land
    const oceanMask = new Array(1200).fill(0);
    for (let i = 0; i < 120; i++) oceanMask[i] = 1;

    const res = checkDistinctiveness({ lat: 10, lon: 10 }, oceanMask, []);
    assert.equal(res.passed, false);
    assert.match(res.reason || '', /Land fraction 10.0% outside/);
  });

  await t.test('rejects candidate with land fraction > 75% (solid interior land)', () => {
    // 40x30 mask with 85% land
    const landMask = new Array(1200).fill(1);
    for (let i = 0; i < 180; i++) landMask[i] = 0;

    const res = checkDistinctiveness({ lat: 10, lon: 10 }, landMask, []);
    assert.equal(res.passed, false);
    assert.match(res.reason || '', /Land fraction 85.0% outside/);
  });

  await t.test('rejects candidate with featureless straight coastline (low transitions)', () => {
    // 40x30 mask: fill a 40x12 block (only 40 transitions along the single horizontal edge)
    // To get under 35 transitions, fill a 10x10 block in the corner (10 horiz + 10 vert = 20 transitions)
    const lowTransitionMask = new Array(1200).fill(0);
    // Fill 360 cells in a solid shape (30% land, but low boundary: e.g. solid 12x30 block)
    // 12 columns by 30 rows has only 30 vertical transitions!
    for (let r = 0; r < 30; r++) {
      for (let c = 0; c < 12; c++) {
        lowTransitionMask[r * 40 + c] = 1;
      }
    }

    const transitions = getCoastlineTransitionCount(lowTransitionMask);
    assert.ok(transitions < 35, `Transitions should be < 35, got ${transitions}`);
    const res = checkDistinctiveness({ lat: 10, lon: 10 }, lowTransitionMask, []);
    assert.equal(res.passed, false);
    assert.match(res.reason || '', /Coastline transition count/);
  });

  await t.test('passes distinct coastline with balanced land fraction (50%) and high edge complexity', () => {
    // Checkerboard or peninsula style mask
    const peninsulaMask = new Array(1200).fill(0);
    for (let r = 0; r < 30; r++) {
      for (let c = 0; c < 40; c++) {
        // Peninsula shape down the middle
        if (c >= 12 && c <= 28 && r >= 5) {
          peninsulaMask[r * 40 + c] = 1;
        }
      }
    }

    const frac = getLandFraction(peninsulaMask);
    assert.ok(frac >= 0.25 && frac <= 0.75, `Expected 25-75% land, got ${frac}`);

    const res = checkDistinctiveness({ lat: 36, lon: -5 }, peninsulaMask, []);
    assert.equal(res.passed, true);
  });

  await t.test('rejects candidate too similar to distant reference spot (>700 km)', () => {
    const maskA = new Array(1200).fill(0);
    for (let i = 0; i < 600; i++) maskA[i] = (i % 2 === 0) ? 1 : 0;

    const descA = computeShapeDescriptor(maskA);

    // Reference spot 2000 km away with near-identical descriptor
    const referenceGrid = [
      {
        lat: 60.0,
        lon: 10.0,
        descriptor: descA.slice(), // identical descriptor
      },
    ];

    const res = checkDistinctiveness({ lat: 40.0, lon: -10.0 }, maskA, referenceGrid);
    assert.equal(res.passed, false);
    assert.match(res.reason || '', /Too similar to distant location/);
  });
});

test('Spot diversity and no-reuse validation', async (t) => {
  const sampleSpots: SpotCandidate[] = [
    { id: '1', name: 'Spot 1', lat: 35.96, lon: -5.6, continent: 'Europe', difficulty: 1 },
    { id: '2', name: 'Spot 2', lat: 29.5, lon: 33.8, continent: 'Asia', difficulty: 2 },
    { id: '3', name: 'Spot 3', lat: 28.0, lon: -113.5, continent: 'North America', difficulty: 2 },
    { id: '4', name: 'Spot 4', lat: -34.35, lon: 18.49, continent: 'Africa', difficulty: 3 },
    { id: '5', name: 'Spot 5', lat: -41.25, lon: 174.5, continent: 'Oceania', difficulty: 3 },
  ];

  await t.test('passes when 5 spots span 5 continents with no reuse', () => {
    const res = validateSpotDiversity(sampleSpots, []);
    assert.equal(res.valid, true);
  });

  await t.test('rejects when spots come from fewer than 4 continents', () => {
    const badContinentSpots = sampleSpots.map((s) => ({ ...s, continent: 'Europe' }));
    const res = validateSpotDiversity(badContinentSpots, []);
    assert.equal(res.valid, false);
    assert.match(res.reason || '', /requires at least 4/);
  });

  await t.test('rejects when a spot is within 150 km of a spot used in the last 90 days', () => {
    // Recent spot 40 km from Spot 1 (Strait of Gibraltar)
    const recent = [{ lat: 36.1, lon: -5.35 }]; // Gibraltar rock
    const res = validateSpotDiversity(sampleSpots, recent);
    assert.equal(res.valid, false);
    assert.match(res.reason || '', /within .* km of recently used spot/);
  });
});
