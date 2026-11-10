// quipher/src/cipher.ts

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Checks if any letter in the substitution key maps to itself (a fixed point).
 * A valid cryptogram key must be a derangement (hasFixedPoint === false).
 */
export function hasFixedPoint(key: Record<string, string>): boolean {
  for (const char of ALPHABET) {
    if (key[char] === char) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a cryptographically secure derangement substitution cipher key.
 * In a derangement, no letter maps to itself: key[A] != A for all letters.
 */
export function generateDerangementKey(rng?: () => number): Record<string, string> {
  const letters = ALPHABET.split('');
  const n = letters.length;

  const getRandomInt = (max: number): number => {
    if (rng) {
      return Math.floor(rng() * max);
    }
    // Web Crypto API cryptographically secure random bytes
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  let shuffled: string[];
  let attempts = 0;
  const maxAttempts = 500;

  do {
    shuffled = [...letters];
    // Fisher-Yates shuffle
    for (let i = n - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    attempts++;
  } while (shuffled.some((char, i) => char === letters[i]) && attempts < maxAttempts);

  // If max attempts reached (statistically impossible, prob ~ 0.36^500), force derangement
  if (shuffled.some((char, i) => char === letters[i])) {
    // Cyclic shift by 1 guarantees derangement
    shuffled = letters.map((_, i) => letters[(i + 1) % n]);
  }

  const key: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    key[letters[i]] = shuffled[i];
  }

  return key;
}

/**
 * Inverts key: from { [plainChar]: cipherChar } to { [cipherChar]: plainChar }.
 */
export function invertKey(key: Record<string, string>): Record<string, string> {
  const inverted: Record<string, string> = {};
  for (const [plainChar, cipherChar] of Object.entries(key)) {
    inverted[cipherChar] = plainChar;
  }
  return inverted;
}

/**
 * Encrypts a plaintext quote into uppercase ciphertext using the substitution key.
 * Non-alphabetic characters (spaces, punctuation, apostrophes, dashes) are preserved intact.
 */
export function encryptQuote(plaintext: string, key: Record<string, string>): string {
  return plaintext
    .split('')
    .map((ch) => {
      const upper = ch.toUpperCase();
      if (key[upper]) {
        return key[upper];
      }
      return ch;
    })
    .join('');
}

/**
 * Decrypts a ciphertext using a mapping { [cipherChar]: plainChar }.
 */
export function decryptCiphertext(ciphertext: string, truth: Record<string, string>): string {
  return ciphertext
    .split('')
    .map((ch) => {
      const upper = ch.toUpperCase();
      if (truth[upper]) {
        return truth[upper];
      }
      return ch;
    })
    .join('');
}

/**
 * Counts the frequency of each cipher letter in the ciphertext.
 */
export function getCipherFrequencies(ciphertext: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of ciphertext.toUpperCase()) {
    if (ALPHABET.includes(ch)) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Returns the count of distinct letters in the text.
 */
export function getDistinctLetterCount(text: string): number {
  const unique = new Set<string>();
  for (const ch of text.toUpperCase()) {
    if (ALPHABET.includes(ch)) {
      unique.add(ch);
    }
  }
  return unique.size;
}

/**
 * Computes Shannon entropy of the letter frequency distribution:
 * H = -sum(p_i * log2(p_i))
 * A flatter, more uniform distribution yields higher entropy,
 * making frequency analysis harder for the player.
 */
export function calculateLetterEntropy(text: string): number {
  const counts = getCipherFrequencies(text);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of Object.values(counts)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return Math.round(entropy * 1000) / 1000;
}

/**
 * Computes difficulty from 1 to 5 based on entropy and length.
 * Flatter letter distributions (high entropy) and balanced length receive higher difficulty.
 */
export function getDifficultyRating(entropy: number, length: number): number {
  // Typical English text entropy is ~3.8 to 4.2 bits per character
  // Low entropy (<3.9) with standard common letters = easy
  // High entropy (>4.1) with uniform spread = hard
  let score = 1;

  if (entropy >= 4.15) {
    score += 2;
  } else if (entropy >= 4.0) {
    score += 1;
  }

  if (length >= 85) {
    score += 2;
  } else if (length >= 60) {
    score += 1;
  }

  return Math.min(5, Math.max(1, score));
}
