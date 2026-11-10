// quipher/src/anti_abuse.ts

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '_quipher_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  lockoutMessage?: string;
}

/**
 * Checks general IP rate limiting: max 120 requests per minute per IP.
 */
export async function checkIpRateLimit(
  db: D1Database,
  ipHash: string,
  now: number
): Promise<RateLimitResult> {
  const currentMinute = Math.floor(now / 60000);
  const maxRequests = 120;

  try {
    const existing = await db
      .prepare('SELECT request_count FROM ip_rate_limits WHERE ip_hash = ? AND window_minute = ?')
      .bind(ipHash, currentMinute)
      .first<{ request_count: number }>();

    if (existing && existing.request_count >= maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: 60 - Math.floor((now % 60000) / 1000),
        lockoutMessage: 'Rate limit exceeded: too many requests. Please wait a moment.',
      };
    }

    if (!existing) {
      await db
        .prepare('INSERT INTO ip_rate_limits (ip_hash, window_minute, request_count) VALUES (?, ?, 1)')
        .bind(ipHash, currentMinute)
        .run();
    } else {
      await db
        .prepare('UPDATE ip_rate_limits SET request_count = request_count + 1 WHERE ip_hash = ? AND window_minute = ?')
        .bind(ipHash, currentMinute)
        .run();
    }

    // Clean up older minute windows
    await db
      .prepare('DELETE FROM ip_rate_limits WHERE window_minute < ?')
      .bind(currentMinute - 5)
      .run();
  } catch (e) {
    // Fail open for db errors so legitimate players aren't blocked
  }

  return { allowed: true };
}

/**
 * Enforces: at most 1 check per 3 seconds.
 */
export function checkCheckInterval(lastCheckAt: number, now: number): { allowed: boolean; waitMs?: number } {
  const minIntervalMs = 3000;
  const elapsed = now - lastCheckAt;
  if (lastCheckAt > 0 && elapsed < minIntervalMs) {
    return {
      allowed: false,
      waitMs: minIntervalMs - elapsed,
    };
  }
  return { allowed: true };
}

/**
 * Anti-Abuse script detection:
 * 1. Solve under 15 seconds is flagged as automated/scripted.
 * 2. Rapid brute-forcing: checks that systematically test single letter variations
 *    in rapid succession.
 */
export interface ScriptCheckEvent {
  mapping: Record<string, string>;
  timestamp: number;
}

export function detectScriptedSolving(
  solveSeconds: number,
  checkEvents: ScriptCheckEvent[]
): { isScripted: boolean; reason?: string } {
  // 1. Solve under 15 seconds
  if (solveSeconds < 15) {
    return {
      isScripted: true,
      reason: `Solve time ${solveSeconds}s is under the 15-second human cognition threshold.`,
    };
  }

  // 2. Sequential single-letter brute-force detector
  // If user made >= 4 check events where each subsequent check only changes 1 letter by cycling
  if (checkEvents.length >= 4) {
    let singleDiffCount = 0;
    for (let i = 1; i < checkEvents.length; i++) {
      const prev = checkEvents[i - 1].mapping;
      const curr = checkEvents[i].mapping;

      const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
      let diffs = 0;
      for (const k of keys) {
        if (prev[k] !== curr[k]) diffs++;
      }

      // If only 1 letter changed between checks and interval < 1000ms
      const timeDiff = checkEvents[i].timestamp - checkEvents[i - 1].timestamp;
      if (diffs === 1 && timeDiff < 1500) {
        singleDiffCount++;
      }
    }

    if (singleDiffCount >= 3) {
      return {
        isScripted: true,
        reason: 'Automated brute-force pattern detected across single letter checks.',
      };
    }
  }

  return { isScripted: false };
}
