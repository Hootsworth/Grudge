import type { OrganismRecord, RoundRecord } from './types.ts';
import { roundMyaSensibly } from './scoring.ts';

export const CONTESTED_TAXA = [
  'chiroptera',   // Bats phylogenetic position disputes
  'ctenophora',   // Ctenophores vs sponges basal animal controversies
  'porifera',
  'palaeognathae', // Basal bird unresolved polytomies
];

export interface TripletCandidate {
  orgA: OrganismRecord;
  orgB: OrganismRecord;
  orgC: OrganismRecord;
  t1: number;
  t2: number;
  ci1: [number, number];
  ci2: [number, number];
  counterintuitiveScore: number;
  fact?: string;
}

/**
 * 1. Topology Gap Rule:
 * Requires a gap of at least 8% of the older divergence time:
 * (t2 - t1) >= 0.08 * t2
 */
export function validateTopologyGap(t1: number, t2: number): { valid: boolean; gapRatio: number; reason?: string } {
  if (t1 >= t2) {
    return { valid: false, gapRatio: 0, reason: `t1 (${t1}) must be strictly less than t2 (${t2}).` };
  }
  const diff = t2 - t1;
  const gapRatio = diff / t2;
  const minRequired = 0.08;

  if (gapRatio < minRequired) {
    return {
      valid: false,
      gapRatio,
      reason: `Gap ${(gapRatio * 100).toFixed(1)}% is less than required 8.0% of older time (${diff.toFixed(1)} Mya / ${t2} Mya).`,
    };
  }

  return { valid: true, gapRatio };
}

/**
 * 2. Confidence Interval Overlap Rule:
 * Requires non-overlapping confidence intervals:
 * ci1[1] (upper bound of t1) < ci2[0] (lower bound of t2)
 */
export function validateConfidenceIntervals(
  ci1: [number, number],
  ci2: [number, number]
): { valid: boolean; reason?: string } {
  const [ci1Low, ci1High] = ci1;
  const [ci2Low, ci2High] = ci2;

  if (ci1High >= ci2Low) {
    return {
      valid: false,
      reason: `Confidence intervals overlap: CI1 [${ci1Low}, ${ci1High}] overlaps with CI2 [${ci2Low}, ${ci2High}]. High1 (${ci1High}) >= Low2 (${ci2Low}).`,
    };
  }

  return { valid: true };
}

/**
 * 3. Contested Clade Filter:
 * Rejects taxa known for unresolved or actively disputed phylogenies.
 */
export function isTaxaUncontested(organisms: OrganismRecord[]): boolean {
  for (const org of organisms) {
    const lat = org.scientific_name.toLowerCase();
    const cat = org.category.toLowerCase();
    for (const contested of CONTESTED_TAXA) {
      if (lat.includes(contested) || cat.includes(contested)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 4. Counterintuitive Similarity Score (1.0 to 5.0):
 * C looks more similar to A or B than A and B look to each other.
 */
export function calculateCounterintuitiveScore(
  orgA: OrganismRecord,
  orgB: OrganismRecord,
  orgC: OrganismRecord
): number {
  let score = 2.0;

  // Case 1: Body plan similarity
  const abSameBody = orgA.body_plan === orgB.body_plan;
  const acSameBody = orgA.body_plan === orgC.body_plan;
  const bcSameBody = orgB.body_plan === orgC.body_plan;

  if (!abSameBody && (acSameBody || bcSameBody)) {
    score += 1.8; // High counterintuitive score: outgroup looks like one of the pair!
  } else if (abSameBody && !acSameBody && !bcSameBody) {
    score -= 0.5; // Intuitive: the close relatives look alike
  }

  // Case 2: General category similarity (e.g. both "Mammal" or both "Fish" or both aquatic)
  const abSameCat = orgA.category === orgB.category;
  const acSameCat = orgA.category === orgC.category;
  const bcSameCat = orgB.category === orgC.category;

  if (!abSameCat && (acSameCat || bcSameCat)) {
    score += 1.2;
  }

  return Math.min(5.0, Math.max(1.0, Math.round(score * 10) / 10));
}

/**
 * 5. Fact Number Validation:
 * Validates that the explanatory fact contains NO numbers that are not in the provided data.
 */
export function validateFactNumbers(
  factText: string,
  t1: number,
  t2: number,
  ci1: [number, number],
  ci2: [number, number]
): { valid: boolean; unauthorizedNumbers: string[] } {
  // Extract all numbers from text (e.g. 65, 100, 1,350)
  const numberRegex = /\b\d+(?:,\d+)*(?:\.\d+)?\b/g;
  const matches = factText.match(numberRegex) || [];

  const allowedNumbers = new Set<number>([
    Math.round(t1),
    Math.round(t2),
    roundMyaSensibly(t1),
    roundMyaSensibly(t2),
    Math.round(ci1[0]),
    Math.round(ci1[1]),
    Math.round(ci2[0]),
    Math.round(ci2[1]),
    // Common grammatical counting numbers 1, 2, 3 permitted for counts of organisms/rounds
    1, 2, 3,
  ]);

  const unauthorized: string[] = [];

  for (const raw of matches) {
    const val = parseFloat(raw.replace(/,/g, ''));
    if (!allowedNumbers.has(Math.round(val))) {
      unauthorized.push(raw);
    }
  }

  return {
    valid: unauthorized.length === 0,
    unauthorizedNumbers: unauthorized,
  };
}

/**
 * 6. Reuse Windows:
 * - Organism cannot be reused within 30 days.
 * - Triplet cannot be reused within 365 days.
 */
export function isTripletAllowedByHistory(
  candidateOrgIds: [string, string, string],
  usedOrganismsLast30Days: Set<string>,
  usedTripletsLast365Days: Set<string>
): boolean {
  // Check organism 30-day window
  for (const id of candidateOrgIds) {
    if (usedOrganismsLast30Days.has(id)) {
      return false;
    }
  }

  // Check triplet 365-day window
  const tripletKey = [...candidateOrgIds].sort().join(':');
  if (usedTripletsLast365Days.has(tripletKey)) {
    return false;
  }

  return true;
}

/**
 * 7. Validate 5 Daily Rounds Composition:
 * - Exactly 5 rounds
 * - Rounds 1-2: Easy (gap > 25%)
 * - Rounds 3-4: Medium
 * - Round 5: Hard (deep-time > 500 Mya)
 * - Depth spread: At least one round under 100 Mya and at least one over 500 Mya
 */
export function validateDailyFiveRounds(rounds: TripletCandidate[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (rounds.length !== 5) {
    errors.push(`Expected exactly 5 rounds, got ${rounds.length}.`);
    return { valid: false, errors };
  }

  const depths = rounds.map((r) => r.t2);
  const hasUnder100 = depths.some((d) => d < 100);
  const hasOver500 = depths.some((d) => d > 500);

  if (!hasUnder100) {
    errors.push('Must include at least one round under 100 Mya.');
  }
  if (!hasOver500) {
    errors.push('Must include at least one round over 500 Mya.');
  }

  return { valid: errors.length === 0, errors };
}
