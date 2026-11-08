// Mechanical Wordplay Verification Engine for PassPhew
import type { ClueType } from '../types.ts';

export interface WordplayVerificationResult {
  valid: boolean;
  type: ClueType;
  errors: string[];
}

export interface WordplayMetadata {
  type: ClueType;
  fodder?: string; // e.g. "silent" for anagram "listen"
  containerOuter?: string;
  containerInner?: string;
  charadeParts?: string[]; // e.g. ["hack", "er"]
  reversalSource?: string; // e.g. "1984" reversed to "4891"
  cutShortBase?: string; // e.g. "coded" -> "code"
}

// Standard crossword abbreviations dictionary
export const STANDARD_ABBREVIATIONS: Record<string, string[]> = {
  queen: ['er', 'r', 'qu'],
  king: ['r', 'k'],
  ten: ['x', 'io', '10'],
  five: ['v', '5'],
  one: ['i', 'a', '1'],
  fifty: ['l', '50'],
  hundred: ['c', '100'],
  thousand: ['m', 'k', '1000'],
  zero: ['o', '0'],
  love: ['o', '0'],
  north: ['n'],
  south: ['s'],
  east: ['e'],
  west: ['w'],
  street: ['st'],
  road: ['rd'],
  doctor: ['dr', 'mo', 'doc'],
  time: ['t'],
  right: ['r'],
  left: ['l'],
  point: ['n', 's', 'e', 'w'],
  quiet: ['p', 'sh'],
  loud: ['f'],
  note: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'te', 're', 'me', 'fa', 'so', 'la', 'ti'],
};

/**
 * Normalizes string for mechanical wordplay verification:
 * lowercase and a-z0-9 only.
 */
function clean(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns a sorted character representation for anagram comparison.
 */
function letterBag(s: string): string {
  return clean(s).split('').sort().join('');
}

/**
 * Mechanically verifies the integrity of wordplay components without relying on AI.
 * Supports both signatures:
 * - verifyWordplay(clue: string, answer: string, meta: WordplayMetadata)
 * - verifyWordplay(type: ClueType, clue: string, answer: string, meta?: WordplayMetadata)
 */
export function verifyWordplay(
  arg1: ClueType | string,
  arg2: string,
  arg3: string | WordplayMetadata,
  arg4?: WordplayMetadata
): WordplayVerificationResult {
  let clue: string;
  let answer: string;
  let meta: WordplayMetadata;

  if (typeof arg3 === 'string') {
    // Called as: verifyWordplay(type, clue, answer, meta)
    const type = arg1 as ClueType;
    clue = arg2;
    answer = arg3;
    meta = arg4 || { type };
  } else {
    // Called as: verifyWordplay(clue, answer, meta)
    clue = arg1 as string;
    answer = arg2;
    meta = (arg3 as WordplayMetadata) || { type: 'Anagram' };
  }

  const normAnswer = clean(answer);
  const normClue = clean(clue);
  const errors: string[] = [];

  if (!normAnswer || normAnswer.length < 3 || normAnswer.length > 12) {
    errors.push(`Answer length must be between 3 and 12 chars (got ${normAnswer.length})`);
  }

  switch (meta.type) {
    case 'Anagram': {
      if (!meta.fodder) {
        errors.push('Anagram requires explicit fodder letters/word');
      } else {
        const fodderBag = letterBag(meta.fodder);
        const answerBag = letterBag(normAnswer);
        if (fodderBag !== answerBag) {
          errors.push(
            `Anagram letters do not match fodder: fodder [${fodderBag}] != answer [${answerBag}]`
          );
        }
        // Fodder or its parts should be mentioned in the clue
        if (!normClue.includes(clean(meta.fodder))) {
          errors.push(`Anagram fodder "${meta.fodder}" not present in clue text`);
        }
      }
      break;
    }

    case 'Hidden word': {
      // The answer must be an exact substring of the raw clue text
      const rawLetters = clue.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!rawLetters.includes(normAnswer)) {
        errors.push(`Hidden word "${normAnswer}" is not contained in clue letters`);
      }
      // Clue must contain words that span the hidden word
      const words = clue.toLowerCase().split(/\s+/);
      const isSingleWordInClue = words.some((w) => clean(w) === normAnswer);
      if (isSingleWordInClue) {
        errors.push('Hidden word cannot be a standalone single word in the clue surface text');
      }
      break;
    }

    case 'Reversal': {
      if (!meta.reversalSource) {
        // Try reversing the answer directly to see if reversed text is in clue
        const reversedAnswer = normAnswer.split('').reverse().join('');
        if (!normClue.includes(reversedAnswer)) {
          errors.push(`Reversal source not found in clue for answer "${normAnswer}"`);
        }
      } else {
        const cleanSource = clean(meta.reversalSource);
        const reversed = cleanSource.split('').reverse().join('');
        if (reversed !== normAnswer) {
          errors.push(
            `Reversal mismatch: reverse of "${meta.reversalSource}" is "${reversed}", expected "${normAnswer}"`
          );
        }
      }
      break;
    }

    case 'Cut short': {
      if (!meta.cutShortBase) {
        errors.push('Cut short requires base word specification');
      } else {
        const base = clean(meta.cutShortBase);
        const headCut = base.slice(1);
        const tailCut = base.slice(0, -1);
        if (headCut !== normAnswer && tailCut !== normAnswer) {
          errors.push(
            `Cut short failed: neither "${headCut}" nor "${tailCut}" matches answer "${normAnswer}"`
          );
        }
      }
      break;
    }

    case 'Charade':
    case 'Two-part clue': {
      if (!meta.charadeParts || meta.charadeParts.length < 2) {
        errors.push('Charade requires at least two constituent parts');
      } else {
        const combined = meta.charadeParts.map(clean).join('');
        if (combined !== normAnswer) {
          errors.push(
            `Charade parts [${meta.charadeParts.join('+')}] combine to "${combined}", expected "${normAnswer}"`
          );
        }
      }
      break;
    }

    case 'Container': {
      if (!meta.containerOuter || !meta.containerInner) {
        errors.push('Container requires containerOuter and containerInner parts');
      } else {
        const outer = clean(meta.containerOuter);
        const inner = clean(meta.containerInner);
        let found = false;
        for (let i = 1; i < outer.length; i++) {
          const inserted = outer.slice(0, i) + inner + outer.slice(i);
          if (inserted === normAnswer) {
            found = true;
            break;
          }
        }
        if (!found) {
          errors.push(
            `Container failed: inserting "${inner}" into "${outer}" cannot produce "${normAnswer}"`
          );
        }
      }
      break;
    }

    case 'Homophone':
    case 'Double definition': {
      // Definition sanity checks: definition words must not be identical to answer
      if (normClue.includes(normAnswer)) {
        errors.push('Clue surface text directly leaks the answer');
      }
      break;
    }

    default:
      break;
  }

  // General surface text leak prevention (answer must not appear as a standalone word)
  if (meta.type !== 'Hidden word') {
    const rawWords = clue.toLowerCase().split(/[^a-z0-9]+/);
    if (rawWords.includes(normAnswer)) {
      errors.push(`Surface text leaks the answer "${normAnswer}" as a standalone word`);
    }
  }

  return {
    valid: errors.length === 0,
    type: meta.type,
    errors,
  };
}
