// quipher/src/attribution.ts

import { getDistinctLetterCount, calculateLetterEntropy, getDifficultyRating } from './cipher.ts';

export interface QuoteCandidate {
  plaintext: string;
  author: string;
  source: string;
  year: number;
}

export interface AttributionVerificationResult {
  valid: boolean;
  reason?: string;
  normalizedText?: string;
  distinctLetters?: number;
  entropy?: number;
  difficulty?: number;
}

/**
 * Famous misattributions and apocryphal one-liners that must be strictly rejected.
 * Many of these are modern inventions or quotes misattributed to Twain, Einstein, Wilde, Churchill, etc.
 */
export const FAMOUS_MISATTRIBUTIONS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /be yourself[;,]? everyone else is already taken/i,
    reason: 'Apocryphal quote; never written or spoken by Oscar Wilde.',
  },
  {
    pattern: /definition of insanity (is|is doing)/i,
    reason: 'Apocryphal quote; never said by Albert Einstein, Mark Twain, or Benjamin Franklin (first documented in 1981).',
  },
  {
    pattern: /well-behaved women seldom make history/i,
    reason: 'Coined by Laurel Thatcher Ulrich in 1976; not in public domain (pre-1930).',
  },
  {
    pattern: /never,? never,? never give up/i,
    reason: 'Inaccurate condensation of Winston Churchill’s Harrow School speech (Oct 1941) and post-1929.',
  },
  {
    pattern: /i cannot tell a lie/i,
    reason: 'Fictional invention by biographer Mason Locke Weems in 1806 cherry tree story, not authentic speech.',
  },
  {
    pattern: /go to heaven for the climate,? hell for the company/i,
    reason: 'Often misattributed to Mark Twain; first attested to James M. Barrie or Scottish proverb.',
  },
  {
    pattern: /two things are infinite.*universe and human stupidity/i,
    reason: 'Apocryphal; first attributed to Einstein by Frederick S. Perls in 1940s, not in Einstein papers.',
  },
  {
    pattern: /everybody is a genius.*judge a fish by its ability to climb a tree/i,
    reason: 'Apocryphal; no record of Albert Einstein ever saying or writing this.',
  },
  {
    pattern: /the only thing necessary for the triumph of evil/i,
    reason: 'Apocryphal; not found anywhere in the authentic writings of Edmund Burke.',
  },
  {
    pattern: /treat his inferiors/i,
    reason: 'Written by J.K. Rowling in 2000; not public domain.',
  },
];

const SENSITIVE_PROFANITY_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'nigger', 'faggot', 'bastard', 'whore'
];

/**
 * Normalizes text for exact primary source matching.
 * Converts curly quotes and typographic dashes to standard ASCII, trims excess spaces.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifies a quote candidate against all rules:
 * 1. Rejects known misattributions
 * 2. Enforces public-domain cutoff (year <= 1929)
 * 3. Enforces length between 35 and 110 characters
 * 4. Enforces at least 14 distinct letters
 * 5. Rejects profanity or sensitive words
 * 6. Validates against Gutenberg primary source text if supplied
 * 7. Checks against used quote history (within 365 days)
 */
export function verifyQuoteAttribution(
  candidate: QuoteCandidate,
  primarySourceText?: string,
  recentlyUsedQuotes?: string[]
): AttributionVerificationResult {
  const norm = normalizeText(candidate.plaintext);

  // 1. Length constraint: 35 to 110 characters
  if (norm.length < 35 || norm.length > 110) {
    return {
      valid: false,
      reason: `Length ${norm.length} out of bounds (must be between 35 and 110 characters)`,
    };
  }

  // 2. Reject known misattributions
  for (const mis of FAMOUS_MISATTRIBUTIONS) {
    if (mis.pattern.test(norm)) {
      return {
        valid: false,
        reason: `Rejected famous misattribution: ${mis.reason}`,
      };
    }
  }

  // 3. Public domain check: US public domain pre-1930 (year <= 1929)
  if (!candidate.year || candidate.year > 1929) {
    return {
      valid: false,
      reason: `Year ${candidate.year} is not public domain (must be published before 1930)`,
    };
  }

  // 4. Require at least 14 distinct letters so frequency analysis is viable
  const distinctLetters = getDistinctLetterCount(norm);
  if (distinctLetters < 14) {
    return {
      valid: false,
      reason: `Distinct letters count ${distinctLetters} is too low (minimum 14 required)`,
    };
  }

  // 5. Profanity / sensitive content check
  const lower = norm.toLowerCase();
  for (const bad of SENSITIVE_PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${bad}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        valid: false,
        reason: `Contains sensitive or prohibited term: ${bad}`,
      };
    }
  }

  // 6. Recency check: not used in last 365 days
  if (recentlyUsedQuotes && recentlyUsedQuotes.length > 0) {
    const isReused = recentlyUsedQuotes.some((used) => {
      return normalizeText(used).toLowerCase() === lower;
    });
    if (isReused) {
      return {
        valid: false,
        reason: 'Quote was used within the last 365 days',
      };
    }
  }

  // 7. Primary source text check (if Gutenberg full text provided)
  if (primarySourceText) {
    const normSource = normalizeText(primarySourceText);
    if (!normSource.includes(norm)) {
      return {
        valid: false,
        reason: 'Exact quote wording could not be verified in the primary Gutenberg source text',
      };
    }
  }

  const entropy = calculateLetterEntropy(norm);
  const difficulty = getDifficultyRating(entropy, norm.length);

  return {
    valid: true,
    normalizedText: norm,
    distinctLetters,
    entropy,
    difficulty,
  };
}
