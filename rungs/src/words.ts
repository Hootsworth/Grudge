// Authoritative word database & BFS graph solver for Rungs
import rawWordlist from './wordlist.json' with { type: 'json' };

export const WORD_LIST: string[] = rawWordlist as string[];
export const WORD_SET: Set<string> = new Set(WORD_LIST);

// Bucketed wildcard map for fast O(V) graph construction:
// "c*ld" -> ["cold", "cord", "cald", ...]
const wildcardMap = new Map<string, string[]>();

for (const word of WORD_LIST) {
  for (let i = 0; i < 4; i++) {
    const pattern = word.slice(0, i) + '*' + word.slice(i + 1);
    const bucket = wildcardMap.get(pattern);
    if (!bucket) {
      wildcardMap.set(pattern, [word]);
    } else {
      bucket.push(word);
    }
  }
}

/**
 * Checks whether a word exists in the authoritative 4-letter database.
 */
export function isValidWord(word: string): boolean {
  if (!word || typeof word !== 'string' || word.length !== 4) return false;
  return WORD_SET.has(word.toLowerCase().trim());
}

/**
 * Returns character discrepancy between two 4-letter words.
 */
export function letterDiff(a: string, b: string): number {
  if (a.length !== 4 || b.length !== 4) return 99;
  let d = 0;
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

/**
 * Checks if two words differ by exactly 1 character.
 */
export function isOneLetterDiff(a: string, b: string): boolean {
  return letterDiff(a.toLowerCase(), b.toLowerCase()) === 1;
}

/**
 * Retrieves all one-letter neighbors for a word in the dictionary.
 */
export function getNeighbors(word: string): string[] {
  const neighbors = new Set<string>();
  const normalized = word.toLowerCase().trim();

  for (let i = 0; i < 4; i++) {
    const pattern = normalized.slice(0, i) + '*' + normalized.slice(i + 1);
    const bucket = wildcardMap.get(pattern);
    if (bucket) {
      for (const candidate of bucket) {
        if (candidate !== normalized) {
          neighbors.add(candidate);
        }
      }
    }
  }
  return Array.from(neighbors);
}

/**
 * Breadth-First-Search finding the shortest ladder between start and target.
 * Returns the array of words [start, step1, ..., target], or null if unreachable.
 */
export function findShortestPath(start: string, target: string): string[] | null {
  const s = start.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!isValidWord(s) || !isValidWord(t)) return null;
  if (s === t) return [s];

  const queue: string[][] = [[s]];
  const visited = new Set<string>([s]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    for (const neighbor of getNeighbors(current)) {
      if (neighbor === t) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Calculates the next optimal step toward the target using reverse BFS.
 */
export function getNextOptimalStep(current: string, target: string): string | null {
  const path = findShortestPath(current, target);
  if (!path || path.length < 2) return null;
  return path[1];
}
