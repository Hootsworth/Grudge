export function roundMyaSensibly(mya: number): number {
  if (mya < 500) {
    // Nearest 5 Mya under 500 (minimum 5 for non-zero)
    const rounded = Math.round(mya / 5) * 5;
    return Math.max(rounded, mya > 0 ? 5 : 0);
  }
  // Nearest 50 above 500
  return Math.round(mya / 50) * 50;
}

export function formatApproximateMya(mya: number): string {
  const rounded = roundMyaSensibly(mya);
  return `about ${rounded.toLocaleString('en-US')} million years ago`;
}

export function getRankTitle(solvedCount: number, deepestMya: number): string {
  if (solvedCount === 0 || deepestMya <= 0) {
    return 'Still in the soup';
  }
  if (deepestMya < 100) {
    return 'Cenozoic tourist';
  }
  if (deepestMya < 252) {
    return 'Mesozoic tracker';
  }
  if (deepestMya < 541) {
    return 'Paleozoic sleuth';
  }
  if (deepestMya < 1000) {
    return 'Ediacaran detective';
  }
  return 'Precambrian prophet';
}

export function calculatePercentile(
  userScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 100;
  // Percentile = share of players with worse or equal result
  const countWorseOrEqual = allScores.filter((s) => s <= userScore).length;
  const pct = (countWorseOrEqual / allScores.length) * 100;
  return Math.round(pct * 10) / 10;
}
