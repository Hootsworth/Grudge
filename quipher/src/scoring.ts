// quipher/src/scoring.ts

/**
 * Calculates the player's Quipher score in penalty-adjusted seconds.
 * Score (seconds) = solveSeconds + 20 * checks + 45 * hints
 */
export function calculateScore(solveSeconds: number, checks: number, hints: number): number {
  return solveSeconds + 20 * checks + 45 * hints;
}

/**
 * Ranks by total score:
 * - under 120: "Codebreaker"
 * - under 240: "Cryptanalyst"
 * - under 420: "Bletchley intern"
 * - else: "Rot13 enjoyer"
 */
export function getRankTitle(score: number): string {
  if (score < 120) {
    return 'Codebreaker';
  }
  if (score < 240) {
    return 'Cryptanalyst';
  }
  if (score < 420) {
    return 'Bletchley intern';
  }
  return 'Rot13 enjoyer';
}

/**
 * Computes percentile rank (0 to 100).
 * Higher percentile means better score (lower penalty seconds).
 * Percentile = (players with score >= currentScore) / totalPlayers * 100
 */
export function calculatePercentile(currentScore: number, allScores: number[]): number {
  if (!allScores || allScores.length === 0) {
    return 100;
  }
  const slowerCount = allScores.filter((s) => s >= currentScore).length;
  const pct = Math.round((slowerCount / allScores.length) * 100);
  return Math.min(100, Math.max(1, pct));
}
