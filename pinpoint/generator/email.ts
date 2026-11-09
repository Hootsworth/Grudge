// Review Email Generator for Pinpoint Daily Puzzle Candidates
import type { SpotCandidate } from './filter.ts';

export interface EmailPreviewOptions {
  date: string;
  plate: number;
  spots: SpotCandidate[];
  workerBaseUrl: string;
  adminSecret: string;
  approvalDeadlineUtc: string; // e.g. "05:30 UTC"
}

export function generateReviewEmailHtml(options: EmailPreviewOptions): string {
  const { date, plate, spots, workerBaseUrl, adminSecret, approvalDeadlineUtc } = options;
  const approveUrl = `${workerBaseUrl.replace(/\/$/, '')}/api/admin/approve?date=${date}&token=${encodeURIComponent(adminSecret)}`;

  const spotRows = spots
    .map(
      (s, idx) => `
    <div style="border: 1px solid #e0dfd5; border-radius: 12px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="margin: 0; font-family: sans-serif; color: #14131a;">Spot #${idx + 1}: ${s.name}</h3>
        <span style="background: #ffc933; color: #14131a; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px;">Difficulty ${s.difficulty}/5</span>
      </div>
      <p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>Location:</strong> ${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}° (${s.continent})</p>
      <p style="margin: 6px 0; color: #222; font-style: italic; font-size: 15px;">"${s.fact || ''}"</p>
      <p style="margin: 4px 0; font-size: 12px;"><a href="${s.sourceUrl || '#'}" style="color: #2ec4a0;">Source Citation</a></p>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f3ec; margin: 0; padding: 24px; color: #14131a;">
  <div style="max-width: 620px; margin: 0 auto; background: #faf8f5; border: 2px solid #14131a; border-radius: 20px; padding: 24px;">
    <h1 style="margin: 0 0 10px; font-size: 26px;">Pinpoint #${plate} — Review Required</h1>
    <p style="color: #666; font-size: 15px; margin-bottom: 20px;">
      Candidate puzzle for <strong>${date}</strong> is ready. Please review the 5 mystery spots below before <strong>${approvalDeadlineUtc}</strong>.
    </p>

    ${spotRows}

    <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 2px dashed #d9d4c7;">
      <a href="${approveUrl}" style="display: inline-block; background-color: #14131a; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 999px;">
        ✓ Approve Puzzle for ${date}
      </a>
      <p style="font-size: 12px; color: #888; margin-top: 12px;">
        If not approved by ${approvalDeadlineUtc}, Pinpoint will automatically fall back to the next pre-approved puzzle from /backlog.
      </p>
    </div>
  </div>
</body>
</html>
`;
}
