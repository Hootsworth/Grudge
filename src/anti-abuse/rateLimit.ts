export const MIN_DRAG_INTERVAL_MS = 1000; // Human cannot drag and deliberate faster than 1s

// In-memory token bucket / sliding window for IP rate-limiting in Cloudflare Workers
const ipRequestHistory = new Map<string, number[]>();

export function checkIpRateLimit(ipHash: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ipHash) || [];

  // Filter out timestamps outside window
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    return false; // Rate limit exceeded
  }

  recent.push(now);
  ipRequestHistory.set(ipHash, recent);
  return true;
}

export function validateHumanSpeed(lastGuessAt: number | null, now: number = Date.now()): { valid: boolean; reason?: string } {
  if (lastGuessAt !== null) {
    const elapsed = now - lastGuessAt;
    if (elapsed < MIN_DRAG_INTERVAL_MS) {
      return {
        valid: false,
        reason: `Guess arrived in ${elapsed}ms. That is faster than a human could drag.`,
      };
    }
  }
  return { valid: true };
}

export async function hashIp(ip: string, salt: string = 'strata-salt'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}-${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
