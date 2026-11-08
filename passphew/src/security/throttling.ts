// Progressive Throttling, Turnstile Verification, and IP Daily Cap for PassPhew
import type { ThrottleCheckResult, IpLimitRecord, SessionRecord } from '../types.ts';

export const INSTANT_GUESS_LIMIT = 10;
export const TURNSTILE_THRESHOLD = 25;
export const DAILY_IP_CAP = 300;
export const MAX_DAILY_IP_GUESSES = DAILY_IP_CAP;
export const MAX_COOLDOWN_SECONDS = 30;

/**
 * Calculates progressive cooldown delay in seconds based on failed attempts:
 * - Attempts 0 to 10: 0 seconds (instant)
 * - Attempt 11: 1s
 * - Attempt 12: 2s
 * - Attempt 13: 4s
 * - Attempt 14: 8s
 * - Attempt 15: 16s
 * - Attempt 16+: 30s (capped)
 */
export function getCooldownSeconds(failedAttempts: number): number {
  if (failedAttempts <= INSTANT_GUESS_LIMIT) {
    return 0;
  }
  const over = failedAttempts - INSTANT_GUESS_LIMIT; // 1 for 11th, 2 for 12th, etc.
  const exponentialSeconds = Math.pow(2, over - 1);
  return Math.min(MAX_COOLDOWN_SECONDS, exponentialSeconds);
}

/**
 * Checks all anti-brute-force constraints before allowing a guess:
 * 1. Hard daily cap (300 guesses per IP)
 * 2. Active cooldown timers (session-level and IP-level)
 * 3. Turnstile token requirement (after 25 failed guesses in session)
 */
export function checkThrottle(
  session: SessionRecord | null,
  ipLimit: IpLimitRecord | null,
  nowMs: number = Date.now()
): ThrottleCheckResult {
  // 1. Check Hard Daily IP Cap
  if (ipLimit && ipLimit.guess_count >= DAILY_IP_CAP) {
    return {
      allowed: false,
      dailyCapReached: true,
      retryAfterSeconds: 3600,
      lockoutMessage: `Daily IP security threshold reached (${DAILY_IP_CAP}/${DAILY_IP_CAP}). New attempts open tomorrow at 00:00 UTC.`,
    };
  }

  // 2. Check IP-level cooldown timer
  if (ipLimit && ipLimit.cooldown_until > nowMs) {
    const remainingSecs = Math.ceil((ipLimit.cooldown_until - nowMs) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: remainingSecs,
      dailyCapReached: false,
      requireTurnstile: false,
      lockoutMessage: `Vault lockout active. Access locks reset in ${remainingSecs}s.`,
    };
  }

  // 3. Check Session-level progressive throttling
  if (session && session.failed_count > INSTANT_GUESS_LIMIT) {
    // If cooldown is still active from last attempt
    if (ipLimit && ipLimit.last_guess_at) {
      const requiredCooldown = getCooldownSeconds(session.failed_count);
      const elapsedSecs = (nowMs - ipLimit.last_guess_at) / 1000;
      if (elapsedSecs < requiredCooldown) {
        const remainingSecs = Math.ceil(requiredCooldown - elapsedSecs);
        return {
          allowed: false,
          retryAfterSeconds: remainingSecs,
          dailyCapReached: false,
          requireTurnstile: false,
          lockoutMessage: `Vault lockout active. Access locks reset in ${remainingSecs}s.`,
        };
      }
    }
  }

  // 4. Check Turnstile Token Requirement (at 25+ failed guesses)
  if (session && session.failed_count >= TURNSTILE_THRESHOLD) {
    return {
      allowed: false,
      requireTurnstile: true,
      dailyCapReached: false,
      lockoutMessage: 'Security verification required after 25 failed attempts. Please complete Turnstile challenge.',
    };
  }

  return { allowed: true, dailyCapReached: false, requireTurnstile: false };
}

/**
 * Verifies Cloudflare Turnstile token against Cloudflare's siteverify API.
 */
export async function verifyTurnstile(
  token: string | undefined,
  secretKey: string | undefined,
  remoteIp?: string
): Promise<boolean> {
  // In development/test mode without secret key, allow bypass with test token
  if (!secretKey) {
    return token === 'test-turnstile-token' || process.env.NODE_ENV === 'test';
  }

  if (!token) return false;

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch (e) {
    return false;
  }
}
