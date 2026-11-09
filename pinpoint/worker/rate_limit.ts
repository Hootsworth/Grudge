// Anti-Abuse and Rate Limiting for Pinpoint

export async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`pinpoint_salt_${ip}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface RateLimitCheck {
  allowed: boolean;
  lockoutMessage?: string;
  retryAfterSeconds?: number;
}

export async function checkIpRateLimit(
  db: D1Database,
  ipHash: string,
  dateStr: string,
  nowMs: number = Date.now()
): Promise<RateLimitCheck> {
  const record = await db
    .prepare('SELECT request_count, last_request_at, cooldown_until FROM ip_rate_limits WHERE ip_hash = ? AND date = ?')
    .bind(ipHash, dateStr)
    .first<{ request_count: number; last_request_at: number; cooldown_until: number }>();

  if (!record) {
    await db
      .prepare('INSERT INTO ip_rate_limits (ip_hash, date, request_count, last_request_at, cooldown_until) VALUES (?, ?, 1, ?, 0)')
      .bind(ipHash, dateStr, nowMs)
      .run();
    return { allowed: true };
  }

  // Active cooldown
  if (record.cooldown_until > nowMs) {
    const retrySecs = Math.ceil((record.cooldown_until - nowMs) / 1000);
    return {
      allowed: false,
      lockoutMessage: `Rate limit active. Please wait ${retrySecs}s.`,
      retryAfterSeconds: retrySecs,
    };
  }

  // Hard daily limit of 500 requests per IP
  if (record.request_count >= 500) {
    return {
      allowed: false,
      lockoutMessage: 'Daily request limit exceeded for this network.',
      retryAfterSeconds: 3600,
    };
  }

  // Check bursting: more than 30 requests in 10 seconds triggers a 10s cooldown
  let cooldown = 0;
  if (nowMs - record.last_request_at < 10000 && record.request_count % 30 === 0) {
    cooldown = nowMs + 10000;
  }

  await db
    .prepare('UPDATE ip_rate_limits SET request_count = request_count + 1, last_request_at = ?, cooldown_until = ? WHERE ip_hash = ? AND date = ?')
    .bind(nowMs, cooldown, ipHash, dateStr)
    .run();

  if (cooldown > nowMs) {
    return {
      allowed: false,
      lockoutMessage: 'Burst rate limit active. Please pause for 10s.',
      retryAfterSeconds: 10,
    };
  }

  return { allowed: true };
}

/**
 * Validates whether a guess was made too quickly after round start (bot / script detection).
 * Guesses under 1.5 seconds (1500 ms) are rejected.
 */
export function validateGuessTiming(roundStartedAt: number | null, nowMs: number = Date.now()): boolean {
  if (!roundStartedAt) return false;
  return nowMs - roundStartedAt >= 1500;
}
