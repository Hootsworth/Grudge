// Pattern Detector: Identifies sequential and dictionary brute-force attacks

export interface PatternCheckResult {
  isBot: boolean;
  reason?: string;
  patternType?:
    | 'numeric_sequence'
    | 'sequential_numeric'
    | 'alpha_sequence'
    | 'sequential_alpha'
    | 'repeated_chars'
    | 'rapid_flooding';
}

/**
 * Inspects a window of recent normalized guesses from a session
 * to detect dictionary attacks, incremental counters, and brute-force bots.
 * Supports both signatures:
 * - detectBruteForcePattern(guesses: string[], timestampsMs?: number[])
 * - detectBruteForcePattern(currentGuess: string, history: GuessRecord[] | string[], nowMs?: number)
 */
export function detectBruteForcePattern(
  guessOrList: string | string[],
  historyOrTimestamps?: any,
  nowMs?: number
): PatternCheckResult {
  let guesses: string[] = [];
  let timestamps: number[] | undefined;

  if (Array.isArray(guessOrList)) {
    guesses = guessOrList.map((g) => (typeof g === 'string' ? g : String(g)));
    if (Array.isArray(historyOrTimestamps)) {
      timestamps = historyOrTimestamps.filter((t) => typeof t === 'number');
    }
  } else if (typeof guessOrList === 'string') {
    // Current guess + history
    const historyList: any[] = Array.isArray(historyOrTimestamps) ? historyOrTimestamps : [];
    const pastGuesses: string[] = [];
    const pastTimes: number[] = [];

    for (const h of historyList) {
      if (typeof h === 'string') {
        pastGuesses.push(h);
      } else if (h && typeof h === 'object') {
        if (h.normalized_guess) pastGuesses.push(h.normalized_guess);
        else if (h.guess) pastGuesses.push(h.guess);
        if (typeof h.created_at === 'number') pastTimes.push(h.created_at);
      }
    }

    guesses = [...pastGuesses, guessOrList];
    if (nowMs !== undefined) {
      pastTimes.push(nowMs);
    }
    if (pastTimes.length > 0) {
      timestamps = pastTimes;
    }
  }

  if (!guesses || guesses.length < 3) {
    return { isBot: false };
  }

  const windowSize = Math.min(guesses.length, 5);
  const tail = guesses.slice(-windowSize);

  // 1. Detect Automated Rapid Flooding (< 150ms per guess across 3+ attempts)
  if (timestamps && timestamps.length >= 3) {
    const timeTail = timestamps.slice(-3);
    const deltas = [timeTail[1] - timeTail[0], timeTail[2] - timeTail[1]];
    if (deltas.every((d) => d >= 0 && d < 150)) {
      return {
        isBot: true,
        reason: `Detected sub-human submission speed (${Math.round(deltas[1])}ms)`,
        patternType: 'rapid_flooding',
      };
    }
  }

  // 2. Detect Incremental Numeric Sequence (e.g. "0000" -> "0001" -> "0002" or "1234" -> "1235")
  if (isNumericSequence(tail)) {
    return {
      isBot: true,
      reason: `Detected sequential numeric brute-force pattern: [${tail.slice(-3).join(', ')}]`,
      patternType: 'sequential_numeric',
    };
  }

  // 3. Detect Incremental Alphabetical Sequence (e.g. "aaaa" -> "aaab" -> "aaac" or "passa" -> "passb")
  if (isAlphabeticalSequence(tail)) {
    return {
      isBot: true,
      reason: `Detected incremental alphabetical brute-force pattern: [${tail.slice(-3).join(', ')}]`,
      patternType: 'sequential_alpha',
    };
  }

  // 4. Detect Single-Character Repeat Sequence (e.g. "aaaa" -> "bbbb" -> "cccc")
  if (isRepetitiveCharPattern(tail)) {
    return {
      isBot: true,
      reason: `Detected single-character repetition brute-force: [${tail.slice(-3).join(', ')}]`,
      patternType: 'repeated_chars',
    };
  }

  return { isBot: false };
}

/**
 * Checks if a list of 3+ strings represents consecutive numeric integers.
 */
function isNumericSequence(items: string[]): boolean {
  if (items.length < 3) return false;
  const last3 = items.slice(-3);
  if (!last3.every((s) => /^\d+$/.test(s))) return false;

  const n1 = parseInt(last3[0], 10);
  const n2 = parseInt(last3[1], 10);
  const n3 = parseInt(last3[2], 10);

  return n2 === n1 + 1 && n3 === n2 + 1;
}

/**
 * Checks if a list of 3+ strings represents consecutive alphabetical increments.
 * E.g., "aaaa" -> "aaab" -> "aaac" or "key1" -> "key2" -> "key3"
 */
function isAlphabeticalSequence(items: string[]): boolean {
  if (items.length < 3) return false;
  const last3 = items.slice(-3);

  // Compare trailing char code if prefixes match
  const p1 = last3[0].slice(0, -1);
  const p2 = last3[1].slice(0, -1);
  const p3 = last3[2].slice(0, -1);

  if (p1 !== p2 || p2 !== p3) return false;

  const c1 = last3[0].charCodeAt(last3[0].length - 1);
  const c2 = last3[1].charCodeAt(last3[1].length - 1);
  const c3 = last3[2].charCodeAt(last3[2].length - 1);

  return c2 === c1 + 1 && c3 === c2 + 1;
}

/**
 * Checks if a list of 3+ strings represents uniform repeating characters.
 * E.g., "aaaa", "bbbb", "cccc"
 */
function isRepetitiveCharPattern(items: string[]): boolean {
  if (items.length < 3) return false;
  const last3 = items.slice(-3);

  // Each word is made of the same repeating character
  const allUniform = last3.every((s) => s.length >= 3 && /^([a-z0-9])\1+$/.test(s));
  return allUniform;
}
