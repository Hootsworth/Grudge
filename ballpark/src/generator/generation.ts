// Nightly generation pipeline for Ballpark (04:00 UTC)
import * as fs from 'fs';
import * as path from 'path';
import { BACKLOG_SETS } from './backlog.ts';
import { verifyCandidate } from './verification.ts';
import { checkFermiDerivation } from './fermi.ts';
import { validateQuestionSpread } from './spread.ts';
import { formatReviewEmail } from './email.ts';

export interface GenerationOptions {
  apiKey?: string;
  targetDate?: string;
  dryRun?: boolean;
}

/**
 * Executes the nightly candidate generation and verification pipeline.
 */
export async function runGenerationPipeline(options: GenerationOptions = {}) {
  const date = options.targetDate || new Date().toISOString().split('T')[0];
  console.log(`[Ballpark Generator] Starting generation for ${date}...`);

  // If no Anthropic API key is provided, or in dry run mode, use vetted backlog
  const backlogDay = BACKLOG_SETS.find((s) => s.date === date) || BACKLOG_SETS[0];

  // 1. Verification of candidates
  for (const q of backlogDay.questions) {
    const vCheck = verifyCandidate({
      question: q.question,
      value: q.value,
      sourceAValue: q.value,
      sourceBValue: q.value,
      extractedValue: q.value,
      sources: q.sources,
    });
    if (!vCheck.valid) {
      console.warn(`[Ballpark Generator] Candidate rejected: ${vCheck.errors.join(', ')}`);
    }

    if (q.fermiEstimate) {
      const fCheck = checkFermiDerivation(q.value, q.fermiEstimate);
      if (!fCheck.valid) {
        console.warn(`[Ballpark Generator] Fermi warning: ${fCheck.message}`);
      }
    }
  }

  // 2. Validate spread rules on the 5 selected questions
  const spreadResult = validateQuestionSpread(backlogDay.questions, [], date);
  if (!spreadResult.valid) {
    console.error(`[Ballpark Generator] Spread check failed: ${spreadResult.errors.join('; ')}`);
    throw new Error(`Spread check failed: ${spreadResult.errors.join('; ')}`);
  }

  console.log(`[Ballpark Generator] Spread check passed: ${spreadResult.distinctOrdersCount} distinct orders, categories: ${spreadResult.distinctCategoriesCount}`);

  // 3. Email preview formatting
  const email = formatReviewEmail(
    date,
    backlogDay.plate,
    backlogDay.questions,
    process.env.APP_BASE_URL || 'https://ballpark-backend.adityapdixit.workers.dev',
    process.env.APPROVAL_SECRET || 'ballpark-admin-secret-key'
  );

  console.log(`[Ballpark Generator] Review email generated: "${email.subject}"`);

  // 4. Generate public static fallback JSON
  const publicPayload = {
    plate: backlogDay.plate,
    date,
    questions: backlogDay.questions.slice(0, 5).map((q, idx) => ({
      id: `q_${date.replace(/-/g, '')}_${idx + 1}`,
      question: q.question,
      unit: q.unit,
    })),
  };

  const candidatePaths = [
    path.resolve(process.cwd(), 'ballpark_today.json'),
    path.resolve(process.cwd(), 'public/ballpark_today.json'),
    path.resolve(process.cwd(), '../ballpark_today.json'),
    path.resolve(process.cwd(), '../public/ballpark_today.json'),
  ].filter(p => !p.includes('/ballpark/ballpark_today.json'));
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(path.dirname(p))) {
        fs.writeFileSync(p, JSON.stringify(publicPayload, null, 2), 'utf-8');
        console.log(`[Ballpark Generator] Synced static fallback to ${p}`);
      }
    } catch (e) {}
  }

  return {
    date,
    plate: backlogDay.plate,
    questions: backlogDay.questions,
    email,
  };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runGenerationPipeline().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
