// Rate limiting and anti-abuse verification for Ballpark Worker

export async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(ip + ':ballpark-salt-2026');
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds?: number;
  lockoutMessage?: string;
}

/**
 * Checks rolling window rate limits per IP hash.
 * 1-minute window: 60 requests max.
 */
export async function checkIpRateLimit(
  db: D1Database,
  ipHash: string,
  now: number
): Promise<RateLimitCheck> {
  const windowSizeMs = 60 * 1000;
  const currentWindow = Math.floor(now / windowSizeMs) * windowSizeMs;

  try {
    const row = await db
      .prepare('SELECT request_count FROM ip_rate_limits WHERE ip_hash = ? AND window_start = ?')
      .bind(ipHash, currentWindow)
      .first<{ request_count: number }>();

    const count = (row?.request_count || 0) + 1;
    if (count > 60) {
      const retryAfter = Math.ceil((currentWindow + windowSizeMs - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfter),
        lockoutMessage: 'Rate limit exceeded. Please wait a moment before trying again.',
      };
    }

    await db
      .prepare(
        'INSERT INTO ip_rate_limits (ip_hash, window_start, request_count) VALUES (?, ?, ?) ' +
          'ON CONFLICT(ip_hash, window_start) DO UPDATE SET request_count = request_count + 1'
      )
      .bind(ipHash, currentWindow, 1)
      .run();

    return { allowed: true };
  } catch (err) {
    // If rate limiting table has issues, don't block legitimate users
    return { allowed: true };
  }
}

/**
 * Enforces anti-cheat timing requirement:
 * "Reject guesses faster than 2 seconds after the question was served"
 */
export function validateGuessTiming(questionServedAt: number, guessSubmittedAt: number): boolean {
  if (!questionServedAt || questionServedAt <= 0) return true;
  return (guessSubmittedAt - questionServedAt) >= 2000;
}
