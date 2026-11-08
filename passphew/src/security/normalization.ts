// Normalization and Constant-Time Comparison for PassPhew

/**
 * Normalizes an answer or guess string.
 * Strips all non-alphanumeric characters, converts to lowercase.
 * E.g. "Key 404" -> "key404"
 */
export function normalizeGuess(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Validates whether a normalized string meets the PassPhew answer criteria:
 * - Lowercase [a-z0-9] only
 * - Length between 3 and 12 characters inclusive
 */
export function isValidAnswerShape(normalized: string): boolean {
  if (!normalized || typeof normalized !== 'string') return false;
  if (normalized.length < 3 || normalized.length > 12) return false;
  return /^[a-z0-9]{3,12}$/.test(normalized);
}

export const isValidGuessLength = isValidAnswerShape;


/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses SHA-256 hashing to ensure both inputs are compared as equal-length
 * 32-byte buffers, eliminating length-leakage timing channels.
 */
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const enc = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);

  const bufA = new Uint8Array(hashA);
  const bufB = new Uint8Array(hashB);

  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }

  // Also verify raw string lengths in constant time
  const lenMismatch = a.length ^ b.length;

  return mismatch === 0 && lenMismatch === 0;
}

/**
 * Synchronous constant-time comparison helper for testing or environments
 * where async crypto is not immediately available.
 */
export function constantTimeEqualSync(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const lenA = a.length;
  const lenB = b.length;
  let mismatch = lenA ^ lenB;
  const maxLen = Math.max(lenA, lenB, 1);

  for (let i = 0; i < maxLen; i++) {
    const charA = i < lenA ? a.charCodeAt(i) : 0;
    const charB = i < lenB ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }

  return mismatch === 0;
}

/**
 * SHA-256 hashes an IP address to preserve user anonymity while
 * enabling per-IP rate limiting and daily cap enforcement.
 */
export async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(ip || '127.0.0.1'));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
