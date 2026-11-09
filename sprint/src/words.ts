// Authoritative word database & sub-anagram generator for Sprint
import rawWordlist from './wordlist.json' with { type: 'json' };

export const WORD_LIST: string[] = rawWordlist as string[];
export const WORD_SET: Set<string> = new Set(WORD_LIST);

export const POINT_VALUES: Record<number, number> = {
  3: 1,
  4: 2,
  5: 4,
  6: 8,
};

function letterCounts(str: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of str.toLowerCase()) {
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

/**
 * Checks whether a word can be constructed from the given 6-letter key.
 */
export function canMakeFromKey(word: string, keyLetters: string): boolean {
  if (!word || word.length < 3 || word.length > 6) return false;
  const wordCounts = letterCounts(word);
  const keyCounts = letterCounts(keyLetters);

  for (const ch of Object.keys(wordCounts)) {
    if ((wordCounts[ch] || 0) > (keyCounts[ch] || 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether a word is in the authoritative dictionary.
 */
export function isValidWord(word: string): boolean {
  if (!word || typeof word !== 'string') return false;
  return WORD_SET.has(word.toLowerCase().trim());
}

// In-memory cache for key sub-anagrams
const anagramCache = new Map<string, string[]>();

/**
 * Computes all valid sub-anagram words accounted for by the dictionary.
 * Returned words are sorted by descending length, then alphabetically.
 */
export function getAllAccountedSubAnagrams(keyLetters: string): string[] {
  const sortedKey = keyLetters.toLowerCase().split('').sort().join('');
  if (anagramCache.has(sortedKey)) {
    return anagramCache.get(sortedKey)!;
  }

  const results: string[] = [];
  for (const word of WORD_LIST) {
    if (canMakeFromKey(word, sortedKey)) {
      results.push(word);
    }
  }

  results.sort((a, b) => b.length - a.length || a.localeCompare(b));
  anagramCache.set(sortedKey, results);
  return results;
}

/**
 * Calculates theoretical maximum score for a list of valid words.
 */
export function calculateMaxScore(words: string[]): number {
  return words.reduce((sum, w) => sum + (POINT_VALUES[w.length] || 0), 0);
}
