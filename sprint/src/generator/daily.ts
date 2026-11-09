// Daily puzzle generator & 14-day vetted backlog for Sprint
import type { DailySprintPuzzle } from '../types.ts';
import { getAllAccountedSubAnagrams, calculateMaxScore } from '../words.ts';

// 14 rich 6-letter base keys ensuring great variety of sub-anagrams
const BACKLOG_KEYS = [
  'stream', // Day 1
  'planet', // Day 2
  'castle', // Day 3
  'master', // Day 4
  'orange', // Day 5
  'finger', // Day 6
  'wonder', // Day 7
  'danger', // Day 8
  'garden', // Day 9
  'poster', // Day 10
  'travel', // Day 11
  'reigns', // Day 12
  'pastel', // Day 13
  'silent', // Day 14
];

export const VETTED_SPRINT_SETS: DailySprintPuzzle[] = BACKLOG_KEYS.map((key, idx) => {
  const baseDate = new Date(Date.UTC(2026, 10, 9 + idx));
  const dateStr = baseDate.toISOString().split('T')[0];
  const words = getAllAccountedSubAnagrams(key);
  const maxScore = calculateMaxScore(words);
  return {
    date: dateStr,
    plate: 313 + idx,
    keyLetters: key.toUpperCase(),
    totalWords: words.length,
    maxScore,
  };
});

/**
 * Returns the daily sprint puzzle for a given date.
 */
export function getDailySprintPuzzle(dateStr: string): DailySprintPuzzle {
  const matched = VETTED_SPRINT_SETS.find((s) => s.date === dateStr);
  if (matched) return matched;

  // Deterministic fallback based on day index
  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateStr.split('-').map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const dayIdx = Math.max(0, Math.floor((curDate - baseDate) / 864e5));
  const plate = dayIdx + 1;

  const keyIndex = dayIdx % BACKLOG_KEYS.length;
  const key = BACKLOG_KEYS[keyIndex];
  const words = getAllAccountedSubAnagrams(key);
  const maxScore = calculateMaxScore(words);

  return {
    date: dateStr,
    plate,
    keyLetters: key.toUpperCase(),
    totalWords: words.length,
    maxScore,
  };
}
