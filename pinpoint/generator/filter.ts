// Candidate Sampling, 40x30 Mask Rasterization, and Distinctiveness Filter
import { type WorldData, isPointOnLand } from './data.ts';
import { haversineDistanceKm } from '../worker/scoring.ts';

export interface SpotCandidate {
  id: string;
  name: string;
  lat: number;
  lon: number;
  continent: string;
  difficulty: number; // 1 (easy) to 5 (hard)
  mask40x30?: number[];
  descriptor?: number[];
  fact?: string;
  sourceUrl?: string;
}

const MASK_COLS = 40;
const MASK_ROWS = 30;

/**
 * Rasterizes a 9-degree window (4:3 aspect) around (lat, lon) into a 40x30 binary land/sea mask.
 * 1 = land, 0 = sea.
 */
export function rasterize9degMask(
  lat: number,
  lon: number,
  world: WorldData
): number[] {
  const degWidth = 9.0;
  const degHeight = 6.75; // 4:3 aspect ratio

  const minLon = lon - degWidth / 2;
  const maxLon = lon + degWidth / 2;
  const minLat = lat - degHeight / 2;
  const maxLat = lat + degHeight / 2;

  const mask: number[] = new Array(MASK_COLS * MASK_ROWS);

  for (let r = 0; r < MASK_ROWS; r++) {
    // Top to bottom
    const sampleLat = maxLat - (r / (MASK_ROWS - 1)) * degHeight;
    for (let c = 0; c < MASK_COLS; c++) {
      // Left to right
      const sampleLon = minLon + (c / (MASK_COLS - 1)) * degWidth;
      const onLand = isPointOnLand(sampleLon, sampleLat, world);
      mask[r * MASK_COLS + c] = onLand ? 1 : 0;
    }
  }

  return mask;
}

/**
 * Computes land fraction in a binary mask (between 0.0 and 1.0).
 */
export function getLandFraction(mask: number[]): number {
  if (mask.length === 0) return 0;
  const landCount = mask.reduce((acc, val) => acc + val, 0);
  return landCount / mask.length;
}

/**
 * Computes coastline complexity by counting transitions between adjacent land and ocean cells.
 */
export function getCoastlineTransitionCount(mask: number[]): number {
  let transitions = 0;
  for (let r = 0; r < MASK_ROWS; r++) {
    for (let c = 0; c < MASK_COLS; c++) {
      const idx = r * MASK_COLS + c;
      const val = mask[idx];

      // Check horizontal neighbor
      if (c + 1 < MASK_COLS) {
        if (val !== mask[idx + 1]) transitions++;
      }
      // Check vertical neighbor
      if (r + 1 < MASK_ROWS) {
        if (val !== mask[idx + MASK_COLS]) transitions++;
      }
    }
  }
  return transitions;
}

/**
 * Extracts a compact shape descriptor (downsampled 8x6 regional density blocks)
 * for fast global similarity comparison.
 */
export function computeShapeDescriptor(mask: number[]): number[] {
  const BLOCK_COLS = 8;
  const BLOCK_ROWS = 6;
  const descriptor: number[] = [];

  const cellPerCol = MASK_COLS / BLOCK_COLS; // 5
  const cellPerRow = MASK_ROWS / BLOCK_ROWS; // 5

  for (let br = 0; br < BLOCK_ROWS; br++) {
    for (let bc = 0; bc < BLOCK_COLS; bc++) {
      let blockSum = 0;
      for (let r = br * cellPerRow; r < (br + 1) * cellPerRow; r++) {
        for (let c = bc * cellPerCol; c < (bc + 1) * cellPerCol; c++) {
          blockSum += mask[r * MASK_COLS + c];
        }
      }
      descriptor.push(blockSum / (cellPerCol * cellPerRow));
    }
  }

  return descriptor;
}

/**
 * Computes normalized L1 distance between two shape descriptors.
 */
export function descriptorDistance(descA: number[], descB: number[]): number {
  let diff = 0;
  for (let i = 0; i < descA.length; i++) {
    diff += Math.abs(descA[i] - descB[i]);
  }
  return diff / descA.length;
}

/**
 * Distinctiveness check:
 * 1. Land fraction between 25% and 75%.
 * 2. Coastline transition count >= 35 (rejects open oceans and solid landmasses).
 * 3. Compares against reference grid samples worldwide: rejects if any sample >700 km away
 *    has descriptor distance < 0.08 (prevents ambiguous repeated fjord coasts).
 */
export function checkDistinctiveness(
  candidate: { lat: number; lon: number },
  mask: number[],
  referenceDescriptors: Array<{ lat: number; lon: number; descriptor: number[] }>
): { passed: boolean; reason?: string } {
  const landFrac = getLandFraction(mask);
  if (landFrac < 0.25 || landFrac > 0.75) {
    return {
      passed: false,
      reason: `Land fraction ${(landFrac * 100).toFixed(1)}% outside 25%-75% requirement`,
    };
  }

  const transitions = getCoastlineTransitionCount(mask);
  if (transitions < 35) {
    return {
      passed: false,
      reason: `Coastline transition count ${transitions} below minimum 35`,
    };
  }

  const candidateDesc = computeShapeDescriptor(mask);

  // Check similarity against distant reference spots
  for (const ref of referenceDescriptors) {
    const distKm = haversineDistanceKm(candidate.lat, candidate.lon, ref.lat, ref.lon);
    if (distKm > 700) {
      const sim = descriptorDistance(candidateDesc, ref.descriptor);
      if (sim < 0.08) {
        return {
          passed: false,
          reason: `Too similar to distant location at (${ref.lat}, ${ref.lon}) [dist ${distKm.toFixed(0)}km, diff ${sim.toFixed(3)}]`,
        };
      }
    }
  }

  return { passed: true };
}

/**
 * Zoom-out check: 22-degree and 55-degree windows must also contain recognizable land.
 */
export function checkZoomOutWindows(
  lat: number,
  lon: number,
  world: WorldData
): boolean {
  // Check 22-deg window
  const deg22W = 22.0;
  const deg22H = 16.5;
  let land22 = 0;
  const sampleSteps = 10;
  for (let r = 0; r < sampleSteps; r++) {
    const sLat = lat - deg22H / 2 + (r / (sampleSteps - 1)) * deg22H;
    for (let c = 0; c < sampleSteps; c++) {
      const sLon = lon - deg22W / 2 + (c / (sampleSteps - 1)) * deg22W;
      if (isPointOnLand(sLon, sLat, world)) land22++;
    }
  }
  const frac22 = land22 / (sampleSteps * sampleSteps);
  if (frac22 < 0.1 || frac22 > 0.9) return false;

  // Check 55-deg window
  const deg55W = 55.0;
  const deg55H = 41.25;
  let land55 = 0;
  for (let r = 0; r < sampleSteps; r++) {
    const sLat = lat - deg55H / 2 + (r / (sampleSteps - 1)) * deg55H;
    for (let c = 0; c < sampleSteps; c++) {
      const sLon = lon - deg55W / 2 + (c / (sampleSteps - 1)) * deg55W;
      if (isPointOnLand(sLon, sLat, world)) land55++;
    }
  }
  const frac55 = land55 / (sampleSteps * sampleSteps);
  if (frac55 < 0.1 || frac55 > 0.9) return false;

  return true;
}

/**
 * Validates a set of 5 spots for continent diversity, difficulty distribution, and no-reuse window.
 */
export function validateSpotDiversity(
  spots: SpotCandidate[],
  recentSpots90Days: Array<{ lat: number; lon: number }> = [],
  isWeekend: boolean = false
): { valid: boolean; reason?: string } {
  if (spots.length !== 5) {
    return { valid: false, reason: `Must have exactly 5 spots, got ${spots.length}` };
  }

  // 1. Continent diversity: At least 4 different continents
  const continents = new Set(spots.map((s) => s.continent));
  if (continents.size < 4) {
    return {
      valid: false,
      reason: `Spots only cover ${continents.size} continents; requires at least 4`,
    };
  }

  // 2. 90-day no-reuse window: No spot within 150 km of recent spots
  for (const s of spots) {
    for (const r of recentSpots90Days) {
      const d = haversineDistanceKm(s.lat, s.lon, r.lat, r.lon);
      if (d < 150) {
        return {
          valid: false,
          reason: `Spot "${s.name}" is within ${d.toFixed(0)} km of recently used spot`,
        };
      }
    }
  }

  // 3. Difficulty rotation: Average difficulty higher on weekends
  const avgDiff = spots.reduce((acc, s) => acc + s.difficulty, 0) / spots.length;
  if (isWeekend && avgDiff < 2.8) {
    return {
      valid: false,
      reason: `Weekend difficulty average ${avgDiff.toFixed(1)} below weekend threshold 2.8`,
    };
  }

  return { valid: true };
}
