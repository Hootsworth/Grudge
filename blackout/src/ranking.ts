// Ranking and share card generator for Blackout
export function getBlackoutRank(totalGuesses: number, isSolved: boolean): string {
  if (!isSolved) return 'Redacted in Action';
  if (totalGuesses <= 5) return 'Master Cryptanalyst';
  if (totalGuesses <= 12) return 'Intelligence Officer';
  if (totalGuesses <= 20) return 'Field Operative';
  if (totalGuesses <= 35) return 'Archival Analyst';
  return 'Clerical Researcher';
}

export function generateShareCard(
  plate: number,
  isSolved: boolean,
  totalGuesses: number,
  rankTitle: string
): string {
  const status = isSolved ? `DECLASSIFIED in ${totalGuesses} ${totalGuesses === 1 ? 'guess' : 'guesses'}` : 'REDACTED (Unsolved)';
  return [
    `BLACKOUT #${plate}`,
    `🗂️ Status: ${status}`,
    `🎖️ Rank: ${rankTitle}`,
    `https://grudge.games/blackout`,
  ].join('\n');
}
