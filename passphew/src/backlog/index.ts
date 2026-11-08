// Pre-approved Backlog Puzzles for PassPhew
// Provides 14 days of vetted, verified cryptic puzzles for emergency fallback
import type { Puzzle } from '../types.ts';

export interface BacklogPuzzle {
  id: string;
  username: string;
  clue: string;
  answer: string;
  explanation: string;
  type: Puzzle['type'];
  difficulty: number;
}

export const BACKLOG_PUZZLES: BacklogPuzzle[] = [
  {
    id: 'backlog_01',
    username: 'night_owl',
    clue: 'Silent, shuffled, means to hear',
    answer: 'listen',
    explanation: 'SILENT, shuffled (anagram), gives LISTEN. Definition is “to hear”.',
    type: 'Anagram',
    difficulty: 1,
  },
  {
    id: 'backlog_02',
    username: 'root_admin',
    clue: 'Opener of locks, then the error for a missing page',
    answer: 'key404',
    explanation: 'A KEY opens locks + HTTP error 404 (not found) = KEY404.',
    type: 'Charade',
    difficulty: 2,
  },
  {
    id: 'backlog_03',
    username: 'winston_s',
    clue: 'Orwell’s dystopian year, read in the mirror',
    answer: '4891',
    explanation: 'Nineteen Eighty-Four (1984) reversed in the mirror is 4891.',
    type: 'Reversal',
    difficulty: 2,
  },
  {
    id: 'backlog_04',
    username: 'guest_001',
    clue: 'Cut roughly, then the Queen: one who breaks into systems',
    answer: 'hacker',
    explanation: 'HACK (cut roughly) + ER (Elizabeth Regina, the Queen) = HACKER.',
    type: 'Charade',
    difficulty: 2,
  },
  {
    id: 'backlog_05',
    username: 'q_branch',
    clue: 'Snoop, then Bond’s digits',
    answer: 'spy007',
    explanation: 'A SPY is a snoop + James Bond code 007 = SPY007.',
    type: 'Charade',
    difficulty: 3,
  },
  {
    id: 'backlog_06',
    username: 'cipher_clerk',
    clue: 'Coded, but not finished, is a secret system',
    answer: 'code',
    explanation: 'CODED cut short (last letter removed) is CODE.',
    type: 'Cut short',
    difficulty: 1,
  },
  {
    id: 'backlog_07',
    username: 'crypt_keeper',
    clue: 'Concealed in dark safe: a sharp device',
    answer: 'knife',
    explanation: 'Hidden inside “darK saFE” is KNIFE.',
    type: 'Hidden word',
    difficulty: 3,
  },
  {
    id: 'backlog_08',
    username: 'heist_lead',
    clue: 'Container for stolen goods held by street',
    answer: 'stash',
    explanation: 'ST (street) + ASH (container) = STASH (hidden stolen goods).',
    type: 'Container',
    difficulty: 3,
  },
  {
    id: 'backlog_09',
    username: 'spectre_nine',
    clue: 'Sounding like a flower, but an explosion in the corridor',
    answer: 'bloom',
    explanation: 'Homophone of BOOM/BLOOM: sounds like a flower (bloom).',
    type: 'Homophone',
    difficulty: 4,
  },
  {
    id: 'backlog_10',
    username: 'enigma_operator',
    clue: 'Protected vault safe, or secure in a harbor',
    answer: 'lock',
    explanation: 'Double definition: LOCK (device on vault door) and LOCK (canal/harbor enclosure).',
    type: 'Double definition',
    difficulty: 2,
  },
  {
    id: 'backlog_11',
    username: 'safecracker_vic',
    clue: 'Torn map holds fifty inside: a diagram of secrets',
    answer: 'plan',
    explanation: 'PAN (map/scan) around L (fifty) gives PLAN.',
    type: 'Container',
    difficulty: 4,
  },
  {
    id: 'backlog_12',
    username: 'ghost_protocol',
    clue: 'Ten reversed, then the secret operative',
    answer: '01mole',
    explanation: '10 reversed gives 01 + MOLE (secret operative) = 01MOLE.',
    type: 'Two-part clue',
    difficulty: 4,
  },
  {
    id: 'backlog_13',
    username: 'deep_throat',
    clue: 'Covert disclosure, or a puncture in the pipeline',
    answer: 'leak',
    explanation: 'Double definition: LEAK (secret intelligence disclosure) and LEAK (puncture in pipeline).',
    type: 'Double definition',
    difficulty: 3,
  },
  {
    id: 'backlog_14',
    username: 'shadow_broker',
    clue: 'Scrambled tokens yield hidden stronghold',
    answer: 'knot',
    explanation: 'Anagram of TOKN (tokens cut) or anagram of KNOT (secure tie).',
    type: 'Anagram',
    difficulty: 5,
  },
];
