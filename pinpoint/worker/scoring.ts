// Haversine Distance, Points Scoring, and Rank Computation for Pinpoint
import type { WindowShape } from './types.ts';

const EARTH_RADIUS_KM = 6371.0;

/**
 * Computes great-circle distance between two coordinates in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes round score based on haversine distance and hints used.
 * points = round(5000 * exp(-max(0, d - 30)/800) * (1 - 0.15*hintsUsed))
 */
export function calculatePoints(distanceKm: number, hintsUsed: number): number {
  const safeHints = Math.max(0, Math.min(2, hintsUsed));
  const effectiveDistance = Math.max(0, distanceKm - 30);
  const penaltyFactor = 1 - 0.15 * safeHints;
  const rawPoints = 5000 * Math.exp(-effectiveDistance / 800) * penaltyFactor;

  return Math.max(0, Math.min(5000, Math.round(rawPoints)));
}

/**
 * Assigns rank title based on total score across 5 rounds.
 * - under 5000: Lost at sea
 * - under 10000: Deckhand
 * - under 15000: First mate
 * - under 20000: Navigator
 * - otherwise: Master cartographer
 */
export function getRankTitle(
  totalScore: number
): 'Lost at sea' | 'Deckhand' | 'First mate' | 'Navigator' | 'Master cartographer' {
  if (totalScore < 5000) return 'Lost at sea';
  if (totalScore < 10000) return 'Deckhand';
  if (totalScore < 15000) return 'First mate';
  if (totalScore < 20000) return 'Navigator';
  return 'Master cartographer';
}

/**
 * Randomizes SVG path ordering per session so two players' payloads
 * are not byte-identical, without affecting map rendering.
 */
export function shuffleShapes(shapes: WindowShape[], seedStr: string = ''): WindowShape[] {
  const copy = [...shapes];
  // Simple seeded or pseudo-random shuffle
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
