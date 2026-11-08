export const MIN_ANSWER_INTERVAL_MS = 1000;

const ipHistory = new Map<string, number[]>();

export function checkIpRateLimit(ipHash: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = ipHistory.get(ipHash) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  ipHistory.set(ipHash, recent);
  return true;
}

export function validateAnswerSpeed(lastAnswerAt: number | null, now: number = Date.now()): { valid: boolean; reason?: string } {
  if (lastAnswerAt !== null) {
    const elapsed = now - lastAnswerAt;
    if (elapsed < MIN_ANSWER_INTERVAL_MS) {
      return {
        valid: false,
        reason: `Answer submitted in ${elapsed}ms. That is faster than a human could evaluate.`,
      };
    }
  }
  return { valid: true };
}

export async function hashIp(ip: string, salt: string = 'kin-salt'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}-${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
