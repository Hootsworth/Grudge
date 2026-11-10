// quipher/src/backlog/backlog.ts

import { generateDerangementKey, encryptQuote, calculateLetterEntropy, getDifficultyRating } from '../cipher.ts';

export interface BacklogQuote {
  date: string;
  plate: number;
  plaintext: string;
  author: string;
  source: string;
  year: number;
  ciphertext: string;
  cipher_key: Record<string, string>;
  difficulty: number;
  entropy: number;
}

// Deterministic seedable RNG for reproducible derangement keys in the backlog
function createSeededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const RAW_BACKLOG = [
  // Day 1 (2026-11-09) - Monday (Easy)
  {
    date: '2026-11-09',
    plate: 1,
    plaintext: "All the world's a stage, and all the men and women merely players.",
    author: 'William Shakespeare',
    source: 'As You Like It, Act II, Scene 7',
    year: 1623,
    seed: 1001,
  },
  // Day 2 (2026-11-10) - Tuesday (Easy)
  {
    date: '2026-11-10',
    plate: 2,
    plaintext: 'You see, but you do not observe. The distinction is clear.',
    author: 'Arthur Conan Doyle',
    source: 'A Scandal in Bohemia',
    year: 1891,
    seed: 1002,
  },
  // Day 3 (2026-11-11) - Wednesday (Easy)
  {
    date: '2026-11-11',
    plate: 3,
    plaintext: 'I can resist everything except temptation.',
    author: 'Oscar Wilde',
    source: "Lady Windermere's Fan, Act I",
    year: 1892,
    seed: 1003,
  },
  // Day 4 (2026-11-12) - Thursday (Medium)
  {
    date: '2026-11-12',
    plate: 4,
    plaintext: 'We are all in the gutter, but some of us are looking at the stars.',
    author: 'Oscar Wilde',
    source: "Lady Windermere's Fan, Act III",
    year: 1892,
    seed: 1004,
  },
  // Day 5 (2026-11-13) - Friday (Medium)
  {
    date: '2026-11-13',
    plate: 5,
    plaintext: 'The report of my death was an exaggeration.',
    author: 'Mark Twain',
    source: 'New York Journal cable',
    year: 1897,
    seed: 1005,
  },
  // Day 6 (2026-11-14) - Saturday (Hard)
  {
    date: '2026-11-14',
    plate: 6,
    plaintext: 'When you have eliminated the impossible, whatever remains must be the truth.',
    author: 'Arthur Conan Doyle',
    source: 'The Sign of the Four',
    year: 1890,
    seed: 1006,
  },
  // Day 7 (2026-11-15) - Sunday (Hardest)
  {
    date: '2026-11-15',
    plate: 7,
    plaintext: "Why, sometimes I've believed as many as six impossible things before breakfast.",
    author: 'Lewis Carroll',
    source: 'Through the Looking-Glass',
    year: 1871,
    seed: 1007,
  },
  // Day 8 (2026-11-16) - Monday (Easy)
  {
    date: '2026-11-16',
    plate: 8,
    plaintext: 'Experience is merely the name men gave to their mistakes.',
    author: 'Oscar Wilde',
    source: 'The Picture of Dorian Gray',
    year: 1890,
    seed: 1008,
  },
  // Day 9 (2026-11-17) - Tuesday (Easy)
  {
    date: '2026-11-17',
    plate: 9,
    plaintext: 'I declare after all there is no enjoyment like reading!',
    author: 'Jane Austen',
    source: 'Pride and Prejudice',
    year: 1813,
    seed: 1009,
  },
  // Day 10 (2026-11-18) - Wednesday (Medium)
  {
    date: '2026-11-18',
    plate: 10,
    plaintext: 'The mass of men lead lives of quiet desperation.',
    author: 'Henry David Thoreau',
    source: 'Walden, Economy',
    year: 1854,
    seed: 1010,
  },
  // Day 11 (2026-11-19) - Thursday (Medium)
  {
    date: '2026-11-19',
    plate: 11,
    plaintext: 'The only way to get rid of a temptation is to yield to it.',
    author: 'Oscar Wilde',
    source: 'The Picture of Dorian Gray',
    year: 1890,
    seed: 1011,
  },
  // Day 12 (2026-11-20) - Friday (Medium)
  {
    date: '2026-11-20',
    plate: 12,
    plaintext: 'There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy.',
    author: 'William Shakespeare',
    source: 'Hamlet, Act I, Scene 5',
    year: 1603,
    seed: 1012,
  },
  // Day 13 (2026-11-21) - Saturday (Hard)
  {
    date: '2026-11-21',
    plate: 13,
    plaintext: 'It is a capital mistake to theorize before one has data.',
    author: 'Arthur Conan Doyle',
    source: 'A Study in Scarlet',
    year: 1887,
    seed: 1013,
  },
  // Day 14 (2026-11-22) - Sunday (Hardest)
  {
    date: '2026-11-22',
    plate: 14,
    plaintext: 'Beware; for I am fearless, and therefore powerful.',
    author: 'Mary Shelley',
    source: 'Frankenstein',
    year: 1818,
    seed: 1014,
  },
];

export const BACKLOG_QUOTES: BacklogQuote[] = RAW_BACKLOG.map((q) => {
  const rng = createSeededRng(q.seed);
  const cipherKey = generateDerangementKey(rng);
  const ciphertext = encryptQuote(q.plaintext, cipherKey);
  const entropy = calculateLetterEntropy(q.plaintext);
  const difficulty = getDifficultyRating(entropy, q.plaintext.length);

  return {
    date: q.date,
    plate: q.plate,
    plaintext: q.plaintext,
    author: q.author,
    source: q.source,
    year: q.year,
    ciphertext,
    cipher_key: cipherKey,
    difficulty,
    entropy,
  };
});
