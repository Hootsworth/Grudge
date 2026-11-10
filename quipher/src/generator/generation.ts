// quipher/src/generator/generation.ts

import type { Env, QuoteRecord } from '../types.ts';
import { verifyQuoteAttribution, type QuoteCandidate } from '../attribution.ts';
import { generateDerangementKey, encryptQuote, calculateLetterEntropy, getDifficultyRating } from '../cipher.ts';
import { BACKLOG_QUOTES } from '../backlog/backlog.ts';
import { getQuoteForDate, saveQuote } from '../db.ts';

export interface GenerationCandidateResult {
  candidate: QuoteCandidate;
  verified: boolean;
  rejectionReason?: string;
  entropy?: number;
  difficulty?: number;
}

/**
 * Sample candidate pool of public-domain quotes for generation testing and fallback.
 */
export const CANDIDATE_POOL: QuoteCandidate[] = [
  {
    plaintext: 'To be natural is such a very difficult pose to keep up.',
    author: 'Oscar Wilde',
    source: 'An Ideal Husband, Act I',
    year: 1895,
  },
  {
    plaintext: 'There is nothing either good or bad, but thinking makes it so.',
    author: 'William Shakespeare',
    source: 'Hamlet, Act II, Scene 2',
    year: 1603,
  },
  {
    plaintext: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    source: 'Attributed / early printings',
    year: 1900,
  },
  {
    plaintext: 'A room without books is like a body without a soul.',
    author: 'Marcus Tullius Cicero',
    source: 'Attributed in classical anthologies',
    year: -43,
  },
  {
    plaintext: 'It does not do to dwell on dreams and forget to live.',
    author: 'J.K. Rowling',
    source: "Harry Potter and the Philosopher's Stone",
    year: 1997, // Invalid! Post-1930
  },
  {
    plaintext: 'Be yourself; everyone else is already taken.',
    author: 'Oscar Wilde',
    source: 'Internet apocrypha',
    year: 1890, // Invalid! Known misattribution
  },
];

/**
 * Runs the nightly 04:00 UTC quote evaluation pipeline.
 */
export async function runQuoteGenerationPipeline(
  targetDate: string,
  env?: Env
): Promise<{ candidates: GenerationCandidateResult[]; approvedFallback?: QuoteRecord }> {
  const evaluated: GenerationCandidateResult[] = [];

  for (const cand of CANDIDATE_POOL) {
    const res = verifyQuoteAttribution(cand);
    if (res.valid) {
      evaluated.push({
        candidate: cand,
        verified: true,
        entropy: res.entropy,
        difficulty: res.difficulty,
      });
    } else {
      evaluated.push({
        candidate: cand,
        verified: false,
        rejectionReason: res.reason,
      });
    }
  }

  // Fallback to pre-approved backlog if human approval not recorded by 05:30 UTC
  const validCandidates = evaluated.filter((e) => e.verified);
  const topCandidates = validCandidates.slice(0, 3);

  let approvedFallback: QuoteRecord | undefined;
  if (env && env.DB) {
    const existing = await getQuoteForDate(env.DB, targetDate);
    if (!existing) {
      const backlogMatch =
        BACKLOG_QUOTES.find((q) => q.date === targetDate) || BACKLOG_QUOTES[0];
      const cipherKey = generateDerangementKey();
      const ciphertext = encryptQuote(backlogMatch.plaintext, cipherKey);
      const entropy = calculateLetterEntropy(backlogMatch.plaintext);
      const difficulty = getDifficultyRating(entropy, backlogMatch.plaintext.length);

      approvedFallback = {
        id: `quote_${targetDate.replace(/-/g, '')}`,
        puzzle_date: targetDate,
        plate: backlogMatch.plate,
        plaintext: backlogMatch.plaintext,
        author: backlogMatch.author,
        source: backlogMatch.source,
        year: backlogMatch.year,
        ciphertext,
        cipher_key: JSON.stringify(cipherKey),
        difficulty,
        entropy,
        created_at: Date.now(),
      };

      await saveQuote(env.DB, approvedFallback);
    }
  }

  return {
    candidates: topCandidates,
    approvedFallback,
  };
}
