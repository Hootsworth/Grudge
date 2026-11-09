// Rate limiting and IP hashing for Blackout

export async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(ip + ':blackout_salt_2026');
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkIpRateLimit(
  db: D1Database,
  ipHash: string,
  dateStr: string,
  nowMs: number = Date.now()
): Promise<{ allowed: boolean; retryAfterSeconds?: number; lockoutMessage?: string }> {
  try {
    const record = await db
      .prepare('SELECT request_count, last_request_at FROM ip_rate_limits WHERE ip_hash = ? AND date = ?')
      .bind(ipHash, dateStr)
      .first<{ request_count: number; last_request_at: number }>();

    if (!record) {
      await db
        .prepare('INSERT INTO ip_rate_limits (ip_hash, date, request_count, last_request_at) VALUES (?, ?, 1, ?)')
        .bind(ipHash, dateStr, nowMs)
        .run();
      return { allowed: true };
    }

    // Limit to 500 word/title guesses per IP per day
    if (record.request_count >= 500) {
      return {
        allowed: false,
        retryAfterSeconds: 3600,
        lockoutMessage: 'Daily clearance attempt cap reached for this terminal.',
      };
    }

    await db
      .prepare('UPDATE ip_rate_limits SET request_count = request_count + 1, last_request_at = ? WHERE ip_hash = ? AND date = ?')
      .bind(nowMs, ipHash, dateStr)
      .run();

    return { allowed: true };
  } catch (e) {
    return { allowed: true };
  }
}
