import type { HardestPair, PuzzleEvent } from '../types.ts';

/**
 * Calculate the percentile: share of today's finished players with a worse or equal result.
 * Result ranges from 0 to 100.
 *
 * Scoring order (from best to worst):
 * 1 attempt > 2 attempts > 3 attempts > 4 attempts > null (loss)
 */
export function calculatePercentile(
  userAttempts: number | null,
  allFinishedAttempts: Array<number | null>
): number {
  if (allFinishedAttempts.length === 0) {
    return 100;
  }

  let countEqualOrWorse = 0;

  for (const score of allFinishedAttempts) {
    if (userAttempts === null) {
      // User lost. Equal or worse is only other losses.
      if (score === null) {
        countEqualOrWorse++;
      }
    } else {
      // User won in userAttempts.
      // Equal or worse is: anyone who took >= userAttempts, OR lost (score === null).
      if (score === null || score >= userAttempts) {
        countEqualOrWorse++;
      }
    }
  }

  const pct = (countEqualOrWorse / allFinishedAttempts.length) * 100;
  return Math.round(pct * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate the average attempts among solved players (or all finished attempts).
 */
export function calculateAvgAttempts(allFinishedAttempts: Array<number | null>): number {
  const solved = allFinishedAttempts.filter((a): a is number => a !== null && a > 0);
  if (solved.length === 0) return 0;
  const sum = solved.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / solved.length) * 100) / 100;
}

/**
 * Calculate the hardest pair of events:
 * In a timeline where event A is newer than event B (true_order A < true_order B),
 * an inversion occurs whenever a player placed B above A.
 * We count inversions across all submitted guesses to find the pair most often swapped.
 */
export function findHardestPair(
  guessOrders: string[][],
  puzzleEventsSorted: PuzzleEvent[]
): HardestPair | null {
  if (guessOrders.length === 0 || puzzleEventsSorted.length !== 6) {
    return null;
  }

  const eventMap = new Map<string, PuzzleEvent>();
  puzzleEventsSorted.forEach((e) => eventMap.set(e.id, e));

  // Key: "idA:idB" where idA is newer (smaller true_order index) than idB
  const swapCounts = new Map<string, number>();

  for (const order of guessOrders) {
    const posMap = new Map<string, number>();
    order.forEach((id, pos) => posMap.set(id, pos));

    for (let i = 0; i < puzzleEventsSorted.length; i++) {
      for (let j = i + 1; j < puzzleEventsSorted.length; j++) {
        const idA = puzzleEventsSorted[i].id; // newer
        const idB = puzzleEventsSorted[j].id; // older

        const posA = posMap.get(idA);
        const posB = posMap.get(idB);

        // If B appeared above A in player's guess (posB < posA), it was inverted/swapped
        if (posA !== undefined && posB !== undefined && posB < posA) {
          const key = `${idA}:${idB}`;
          swapCounts.set(key, (swapCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  let maxSwaps = 0;
  let hardestKey: string | null = null;

  for (const [key, count] of swapCounts.entries()) {
    if (count > maxSwaps) {
      maxSwaps = count;
      hardestKey = key;
    }
  }

  if (!hardestKey || maxSwaps === 0) {
    return null;
  }

  const [idA, idB] = hardestKey.split(':');
  const eventA = eventMap.get(idA)?.text || idA;
  const eventB = eventMap.get(idB)?.text || idB;

  return {
    eventA,
    eventB,
    swaps: maxSwaps,
  };
}
