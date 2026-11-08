import fs from 'node:fs';
import path from 'node:path';

const puzzles = [
  {
    id: 'backlog_01',
    username: 'night_owl',
    clue: 'Silent, shuffled, means to hear',
    answer: 'listen',
    explanation: 'SILENT, shuffled (anagram), gives LISTEN. Definition is “to hear”.',
    type: 'Anagram',
    difficulty: 1
  },
  {
    id: 'backlog_02',
    username: 'root_admin',
    clue: 'Opener of locks, then the error for a missing page',
    answer: 'key404',
    explanation: 'A KEY opens locks + HTTP error 404 (not found) = KEY404.',
    type: 'Charade',
    difficulty: 2
  },
  {
    id: 'backlog_03',
    username: 'winston_s',
    clue: 'Orwell’s dystopian year, read in the mirror',
    answer: '4891',
    explanation: 'Nineteen Eighty-Four (1984) reversed in the mirror is 4891.',
    type: 'Reversal',
    difficulty: 2
  },
  {
    id: 'backlog_04',
    username: 'guest_001',
    clue: 'Cut roughly, then the Queen: one who breaks into systems',
    answer: 'hacker',
    explanation: 'HACK (cut roughly) + ER (Elizabeth Regina, the Queen) = HACKER.',
    type: 'Charade',
    difficulty: 2
  },
  {
    id: 'backlog_05',
    username: 'q_branch',
    clue: 'Snoop, then Bond’s digits',
    answer: 'spy007',
    explanation: 'A SPY is a snoop + James Bond code 007 = SPY007.',
    type: 'Charade',
    difficulty: 3
  },
  {
    id: 'backlog_06',
    username: 'cipher_clerk',
    clue: 'Coded, but not finished, is a secret system',
    answer: 'code',
    explanation: 'CODED cut short (last letter removed) is CODE.',
    type: 'Cut short',
    difficulty: 1
  },
  {
    id: 'backlog_07',
    username: 'crypt_keeper',
    clue: 'Concealed in dark safe: a sharp device',
    answer: 'knife',
    explanation: 'Hidden inside “darK saFE” is KNIFE.',
    type: 'Hidden word',
    difficulty: 3
  },
  {
    id: 'backlog_08',
    username: 'heist_lead',
    clue: 'Container for stolen goods held by street',
    answer: 'stash',
    explanation: 'ST (street) + ASH = STASH (hidden reserve of loot).',
    type: 'Two-part clue',
    difficulty: 3
  },
  {
    id: 'backlog_09',
    username: 'zero_cool',
    clue: 'Audio sounding like a secret cache',
    answer: 'sound',
    explanation: 'Double definition: SOUND (audio) and SOUND (secure, intact).',
    type: 'Double definition',
    difficulty: 4
  },
  {
    id: 'backlog_10',
    username: 'locksmith_99',
    clue: 'Key number for absolute freezing point',
    answer: '0k',
    explanation: '0K (Zero Kelvin) is absolute zero.',
    type: 'Charade',
    difficulty: 3
  },
  {
    id: 'backlog_11',
    username: 'shadow_broker',
    clue: 'Secret agent inside capital city',
    answer: 'paris',
    explanation: 'PAR (standard) + IS = PARIS (container/charade for covert station).',
    type: 'Container',
    difficulty: 4
  },
  {
    id: 'backlog_12',
    username: 'dr_no',
    clue: 'Sounds like a vault vista, but means observed',
    answer: 'seen',
    explanation: 'Homophone: SEEN sounds like SCENE.',
    type: 'Homophone',
    difficulty: 4
  },
  {
    id: 'backlog_13',
    username: 'terminal_7',
    clue: 'Reversed binary digit, then emergency call',
    answer: '0sos',
    explanation: '0 (zero) + SOS (distress signal) = 0SOS.',
    type: 'Charade',
    difficulty: 5
  },
  {
    id: 'backlog_14',
    username: 'mastermind',
    clue: 'A receiver of stolen goods or perimeter barrier',
    answer: 'fence',
    explanation: 'FENCE: a receiver of stolen goods or perimeter barrier.',
    type: 'Double definition',
    difficulty: 5
  }
];

const backlogDir = path.resolve('passphew/backlog');
if (!fs.existsSync(backlogDir)) {
  fs.mkdirSync(backlogDir, { recursive: true });
}

puzzles.forEach((p, i) => {
  const num = String(i + 1).padStart(2, '0');
  const filePath = path.join(backlogDir, 'puzzle_' + num + '.json');
  fs.writeFileSync(filePath, JSON.stringify(p, null, 2));
});

console.log('Successfully written 14 backlog puzzles.');
