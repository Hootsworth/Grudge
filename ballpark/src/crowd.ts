// Crowd statistics: median calculation, rounding to 0.1, percentiles, yesterday's stats

/**
 * Calculates the median of a list of numeric guesses.
 * Returns null if fewer than minThreshold (default 30) values are provided.
 * The result is rounded to 0.1 decimal so individual guesses cannot be reverse-engineered.
 */
export function calculateMedian(values: number[], minThreshold = 30): number | null {
  if (!values || values.length < minThreshold) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let rawMedian: number;

  if (n % 2 === 1) {
    rawMedian = sorted[Math.floor(n / 2)];
  } else {
    rawMedian = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  }

  return Math.round(rawMedian * 10) / 10;
}

/**
 * Calculates percentile of a player's score among all players (1 - 100).
 */
export function calculatePercentile(userScore: number, allScores: number[]): number {
  if (!allScores || allScores.length === 0) return 100;
  let lowerCount = 0;
  for (const s of allScores) {
    if (s < userScore) lowerCount++;
  }
  return Math.max(1, Math.min(100, Math.round((lowerCount / allScores.length) * 100)));
}

/**
 * Calculates the most common guess (mode by grouping into bins of 0.25 orders of magnitude).
 */
export function calculateMostCommonGuess(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const v of values) {
    const bucket = Math.round(v * 4) / 4; // 0.25 bin
    counts.set(bucket, (counts.get(bucket) || 0) + 1);
  }

  let bestBucket = values[0];
  let maxCount = -1;
  for (const [bucket, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestBucket = bucket;
    }
  }

  return Math.round(bestBucket * 10) / 10;
}

/**
 * Finds the guess closest to the true value log10.
 */
export function calculateClosestGuess(truthLog10: number, values: number[]): number {
  if (!values || values.length === 0) return 0;
  let closest = values[0];
  let minDiff = Math.abs(values[0] - truthLog10);

  for (const v of values) {
    const diff = Math.abs(v - truthLog10);
    if (diff < minDiff) {
      minDiff = diff;
      closest = v;
    }
  }

  return Math.round(closest * 10) / 10;
}
