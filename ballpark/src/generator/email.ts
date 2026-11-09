// Email notification and review preview for Ballpark daily puzzle
import type { VettedQuestion } from './backlog.ts';

export function formatReviewEmail(
  date: string,
  plate: number,
  questions: VettedQuestion[],
  appBaseUrl: string,
  approvalSecret: string
): { subject: string; html: string; text: string } {
  const approveUrl = `${appBaseUrl}/api/admin/approve?date=${date}&token=${approvalSecret}`;

  const subject = `[Ballpark Review] Daily Puzzle #${plate} for ${date}`;

  const itemsHtml = questions
    .map(
      (q, i) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #fbf6e8; border: 2px solid #1c2a2b; border-radius: 12px;">
      <h3 style="margin: 0 0 8px 0; color: #1c2a2b;">#${i + 1}. ${q.question}</h3>
      <p style="margin: 4px 0;"><b>Answer:</b> ${q.value.toLocaleString('en-US')} ${q.unit} (10^${q.valueLog10})</p>
      <p style="margin: 4px 0; color: #555;"><b>Category:</b> ${q.category} | <b>Difficulty:</b> ${q.difficulty}/5</p>
      <p style="margin: 6px 0; line-height: 1.4;"><b>Explanation:</b> ${q.explanation}</p>
      ${q.fermiDerivation ? `<p style="margin: 4px 0; color: #1f7a72;"><b>Fermi Derivation:</b> <code>${q.fermiDerivation}</code></p>` : ''}
      <p style="margin: 6px 0 0 0; font-size: 13px;"><b>Sources:</b><br/>
        1. <a href="${q.sources[0]}" target="_blank">${q.sources[0]}</a><br/>
        2. <a href="${q.sources[1]}" target="_blank">${q.sources[1]}</a>
      </p>
    </div>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ballpark Review</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #efe8d8; padding: 24px; color: #1c2a2b;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 16px; border: 3px solid #1c2a2b;">
    <h1 style="margin-top: 0; color: #1c2a2b;">⚾ Ballpark Daily #${plate}</h1>
    <p style="color: #666; font-size: 15px;">Review the proposed 5 questions for <b>${date}</b>. Please approve before <b>05:30 UTC</b>, or the backlog fallback will deploy automatically.</p>
    
    <div style="margin: 20px 0; text-align: center;">
      <a href="${approveUrl}" style="display: inline-block; background: #2f9e6e; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 999px; font-size: 16px;">Approve Puzzle for ${date}</a>
    </div>

    <hr style="border: 0; border-top: 1px solid #d9cfb6; margin: 24px 0;"/>

    ${itemsHtml}

    <div style="margin-top: 24px; text-align: center;">
      <a href="${approveUrl}" style="display: inline-block; background: #2f9e6e; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 999px;">Approve Puzzle for ${date}</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Ballpark Daily #${plate} for ${date}\n\nApprove by 05:30 UTC:\n${approveUrl}\n\n` +
    questions.map((q, i) => `${i + 1}. ${q.question}\nAnswer: ${q.value} ${q.unit} (10^${q.valueLog10})\nSources: ${q.sources.join(', ')}\n`).join('\n');

  return { subject, html, text };
}
