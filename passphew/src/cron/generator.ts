// Candidate Generation Engine for PassPhew
import type { Puzzle, ClueType } from '../types.ts';
import { normalizeGuess } from '../security/normalization.ts';
import type { WordplayMetadata } from './wordplay_check.ts';

export interface CandidateGenerationResult {
  date: string;
  difficulty: number;
  candidates: Array<{
    puzzle: Puzzle;
    meta: WordplayMetadata;
  }>;
}

export const ALL_CLUE_TYPES: ClueType[] = [
  'Anagram',
  'Hidden word',
  'Reversal',
  'Charade',
  'Cut short',
  'Container',
  'Homophone',
  'Two-part clue',
  'Double definition',
];

/**
 * Computes the day's difficulty level (1-5):
 * Easy early week (Mon=1, Tue=2, Wed=2), medium late week (Thu=3, Fri=3),
 * hard on weekends (Sat=4, Sun=5).
 */
export function getDifficultyForDate(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  switch (day) {
    case 1: return 1; // Monday (easy)
    case 2: return 2; // Tuesday
    case 3: return 2; // Wednesday
    case 4: return 3; // Thursday
    case 5: return 3; // Friday
    case 6: return 4; // Saturday (hard)
    case 0: return 5; // Sunday (fiendish)
    default: return 3;
  }
}

/**
 * Selects an allowed ClueType that does not repeat the previous day's clue type.
 */
export function getNextClueType(previousType?: ClueType, dayIndex: number = 0): ClueType {
  const pool = previousType
    ? ALL_CLUE_TYPES.filter((t) => t !== previousType)
    : ALL_CLUE_TYPES;
  return pool[dayIndex % pool.length];
}

/**
 * Proposes 8 candidate puzzles tailored to the target date, difficulty, and theme.
 * Uses Anthropic claude-sonnet-4-6 or high-fidelity fixtures when offline.
 */
export async function generateCandidates(
  dateStr: string,
  plate: number,
  previousType?: ClueType,
  recentlyUsedAnswers: string[] = [],
  apiKey?: string,
  modelName: string = 'claude-sonnet-4-6'
): Promise<CandidateGenerationResult> {
  const difficulty = getDifficultyForDate(dateStr);
  const recentSet = new Set(recentlyUsedAnswers.map(normalizeGuess));

  if (!apiKey) {
    return generateFixtureCandidates(dateStr, plate, difficulty, previousType, recentSet);
  }

  const prompt = `You are the lead cryptic puzzle author for "PassPhew", a daily vault-login cryptic password game.
Date: ${dateStr}
Difficulty: ${difficulty}/5
Target: Propose exactly 8 candidate puzzles.

PUZZLE SPECIFICATION:
1. answer: lowercase, characters a-z and 0-9 only, 3 to 12 characters.
   - Mix ratio: ~60% dictionary words, ~20% numbers, ~20% word+number alphanumeric combos.
   - Theme answers loosely around security, secrets, codes, heists, vaults, surveillance, spies, cryptography.
2. username: short flavorful handle (e.g. root_admin, winston_s, q_branch, cipher_clerk, night_owl).
3. clue: standard cryptic-crossword style, definition at one end. NEVER put the length, pattern, or letter count in the clue!
4. explanation: short walkthrough of the wordplay shown after cracking.
5. type: Rotate among Anagram, Hidden word, Reversal, Charade, Cut short, Container, Homophone, Two-part clue, Double definition.
   - Do NOT use previous day's type: "${previousType || 'none'}".
6. metadata: provide exact wordplay verification components (fodder for anagram, base for cut short, parts for charade).
7. Do not use any recently used answers: [${recentlyUsedAnswers.slice(0, 30).join(', ')}].

Output strictly JSON in this format:
{
  "candidates": [
    {
      "username": "root_admin",
      "clue": "...",
      "answer": "...",
      "explanation": "...",
      "type": "Anagram",
      "meta": { "type": "Anagram", "fodder": "..." }
    }
  ]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return generateFixtureCandidates(dateStr, plate, difficulty, previousType, recentSet);
    }

    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return generateFixtureCandidates(dateStr, plate, difficulty, previousType, recentSet);
    }

    const parsed = JSON.parse(match[0]) as {
      candidates: Array<{
        username: string;
        clue: string;
        answer: string;
        explanation: string;
        type: ClueType;
        meta?: WordplayMetadata;
      }>;
    };

    const validCandidates = (parsed.candidates || [])
      .map((c, i) => {
        const normAnswer = normalizeGuess(c.answer);
        if (recentSet.has(normAnswer)) return null;
        const puzzle: Puzzle = {
          id: `passphew_${dateStr}_c${i + 1}`,
          date: dateStr,
          plate,
          username: c.username || 'agent_x',
          clue: c.clue,
          answer: normAnswer,
          explanation: c.explanation,
          type: c.type || 'Anagram',
          difficulty,
          status: 'pending',
        };
        const meta: WordplayMetadata = c.meta || { type: c.type || 'Anagram' };
        return { puzzle, meta };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (validCandidates.length >= 3) {
      return { date: dateStr, difficulty, candidates: validCandidates };
    }

    return generateFixtureCandidates(dateStr, plate, difficulty, previousType, recentSet);
  } catch (e) {
    return generateFixtureCandidates(dateStr, plate, difficulty, previousType, recentSet);
  }
}

/**
 * High-quality fallback fixture candidates when offline or testing.
 */
function generateFixtureCandidates(
  dateStr: string,
  plate: number,
  difficulty: number,
  previousType?: ClueType,
  recentSet: Set<string> = new Set()
): CandidateGenerationResult {
  const pool: Array<{
    username: string;
    clue: string;
    answer: string;
    explanation: string;
    type: ClueType;
    meta: WordplayMetadata;
  }> = [
    {
      username: 'night_owl',
      clue: 'Silent, shuffled, means to hear',
      answer: 'listen',
      explanation: 'SILENT, shuffled, is LISTEN. The definition is “to hear”.',
      type: 'Anagram',
      meta: { type: 'Anagram', fodder: 'silent' },
    },
    {
      username: 'root_admin',
      clue: 'Opener of locks, then the error for a missing page',
      answer: 'key404',
      explanation: 'A KEY opens locks. HTTP error 404 means “page not found”.',
      type: 'Charade',
      meta: { type: 'Charade', charadeParts: ['key', '404'] },
    },
    {
      username: 'winston_s',
      clue: 'Orwell’s dystopian year, read in the mirror',
      answer: '4891',
      explanation: 'Nineteen Eighty-Four (1984) reversed is 4891.',
      type: 'Reversal',
      meta: { type: 'Reversal', reversalSource: '1984' },
    },
    {
      username: 'guest_001',
      clue: 'Cut roughly, then the Queen: one who breaks into systems',
      answer: 'hacker',
      explanation: 'HACK (cut roughly) + ER (the Queen, Elizabeth Regina) = HACKER.',
      type: 'Charade',
      meta: { type: 'Charade', charadeParts: ['hack', 'er'] },
    },
    {
      username: 'q_branch',
      clue: 'Snoop, then Bond’s digits',
      answer: 'spy007',
      explanation: 'A SPY is a snoop, and James Bond’s code number is 007.',
      type: 'Charade',
      meta: { type: 'Charade', charadeParts: ['spy', '007'] },
    },
    {
      username: 'cipher_clerk',
      clue: 'Coded, but not finished, is a secret system',
      answer: 'code',
      explanation: 'CODED, not finished (last letter removed), is CODE.',
      type: 'Cut short',
      meta: { type: 'Cut short', cutShortBase: 'coded' },
    },
    {
      username: 'vault_guard',
      clue: 'Concealed inside bank safe: a sharp device',
      answer: 'knife',
      explanation: 'Hidden inside “banK saFE” is KNIFE.',
      type: 'Hidden word',
      meta: { type: 'Hidden word' },
    },
    {
      username: 'heist_master',
      clue: 'Container for cash held by street gang',
      answer: 'stash',
      explanation: 'ST (street) holding ASH (or ST + ASH) = STASH (hidden reserve).',
      type: 'Two-part clue',
      meta: { type: 'Two-part clue', charadeParts: ['st', 'ash'] },
    },
  ];

  const candidates = pool
    .filter((c) => !recentSet.has(c.answer) && c.type !== previousType)
    .slice(0, 8)
    .map((c, i) => ({
      puzzle: {
        id: `passphew_${dateStr}_cand_${i + 1}`,
        date: dateStr,
        plate,
        username: c.username,
        clue: c.clue,
        answer: c.answer,
        explanation: c.explanation,
        type: c.type,
        difficulty,
        status: 'pending' as const,
      },
      meta: c.meta,
    }));

  return {
    date: dateStr,
    difficulty,
    candidates,
  };
}
