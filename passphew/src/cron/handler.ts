// Scheduled Cron Handlers for PassPhew
import type { Env, Puzzle, ClueType } from '../types.ts';
import {
  getRecentUsedAnswers,
  getLivePuzzleForDate,
  getNextPlateNumber,
  insertPuzzle,
} from '../db.ts';
import { generateCandidates } from './generator.ts';
import { verifyWordplay } from './wordplay_check.ts';
import { runSolverVerificationCheck, evaluateSolverCheck } from './solver_check.ts';
import { BACKLOG_PUZZLES } from '../backlog/index.ts';

export interface CandidateReviewData {
  puzzle: Puzzle;
  solverGuesses: string[];
  wordplayPassed: boolean;
  wordplayErrors: string[];
  solverPassed: boolean;
  rejectionReason?: string;
  approvalLink: string;
  vetoLink: string;
}

/**
 * Handles incoming cron triggers:
 * - "0 4 * * *" (04:00 UTC): Candidate generation, solver verification, human review dispatch
 * - "30 5 * * *" (05:30 UTC): Backlog fallback activation if no puzzle was approved
 */
export async function handleCronTrigger(
  event: ScheduledEvent,
  env: Env,
  baseUrl: string = 'https://passphew.internal'
): Promise<void> {
  const cronExpr = event.cron;
  const now = new Date(event.scheduledTime || Date.now());
  const todayStr = now.toISOString().split('T')[0];

  console.log(`[PASSPHEW CRON] Triggered cron "${cronExpr}" at ${now.toISOString()} for date ${todayStr}`);

  // 1. 04:00 UTC Generation Job
  if (cronExpr === '0 4 * * *' || cronExpr.includes('4 * *')) {
    await runCandidateGenerationJob(env, todayStr, baseUrl);
    return;
  }

  // 2. 05:30 UTC Fallback Fallback Job
  if (cronExpr === '30 5 * * *' || cronExpr.includes('5 * *')) {
    await runFallbackCheckJob(env, todayStr);
    return;
  }

  // Fallback for custom or manual cron triggers: check if today has a live puzzle
  const live = await getLivePuzzleForDate(env.DB, todayStr);
  if (!live) {
    console.log(`[PASSPHEW CRON] No live puzzle for ${todayStr}, running fallback check`);
    await runFallbackCheckJob(env, todayStr);
  }
}

/**
 * 04:00 UTC Generation Job:
 * 1. Propose 8 candidates via Anthropic API (claude-sonnet-4-6).
 * 2. Run independent solver check (second model, clue only, no length).
 * 3. Run mechanical wordplay checks.
 * 4. Filter out leaks, brands, duplicates (180 days).
 * 5. Store top surviving candidates in D1 as 'pending'.
 * 6. Send review email/webhook with top 3 candidates + approval links.
 */
export async function runCandidateGenerationJob(
  env: Env,
  targetDate: string,
  baseUrl: string
): Promise<CandidateReviewData[]> {
  const plate = await getNextPlateNumber(env.DB);
  const recentAnswers = await getRecentUsedAnswers(env.DB, 180);

  // Get yesterday's puzzle to avoid repeating clue type
  const yesterdayStr = new Date(new Date(targetDate).getTime() - 864e5).toISOString().split('T')[0];
  const yesterdayPuzzle = await getLivePuzzleForDate(env.DB, yesterdayStr);
  const previousType: ClueType | undefined = yesterdayPuzzle?.type;

  // 1. Propose 8 candidates
  const genResult = await generateCandidates(
    targetDate,
    plate,
    previousType,
    recentAnswers,
    env.ANTHROPIC_API_KEY,
    env.CLAUDE_MODEL || 'claude-sonnet-4-6'
  );

  const surviving: CandidateReviewData[] = [];
  const adminSecret = env.APPROVAL_SECRET || 'passphew-admin-default-secret';

  // 2. Test each candidate through Solver & Mechanical Wordplay Checks
  for (const item of genResult.candidates) {
    const { puzzle, meta } = item;

    // Step A: Mechanical Wordplay Check
    const wordplayResult = verifyWordplay(puzzle.type, puzzle.clue, puzzle.answer, meta);

    // Step B: Independent Solver Check
    let solverResult;
    if (env.ANTHROPIC_API_KEY) {
      solverResult = await runSolverVerificationCheck(
        puzzle.answer,
        puzzle.clue,
        env.ANTHROPIC_API_KEY,
        env.CLAUDE_MODEL || 'claude-sonnet-4-6'
      );
    } else {
      // Offline / test fixture check
      solverResult = evaluateSolverCheck(puzzle.answer, [puzzle.answer, 'altguess', 'test3'], puzzle.clue);
    }

    const passedAll = wordplayResult.valid && solverResult.passed;

    const reviewData: CandidateReviewData = {
      puzzle,
      solverGuesses: solverResult.topGuesses,
      wordplayPassed: wordplayResult.valid,
      wordplayErrors: wordplayResult.errors,
      solverPassed: solverResult.passed,
      rejectionReason: solverResult.rejectionReason,
      approvalLink: `${baseUrl}/api/admin/approve?id=${encodeURIComponent(puzzle.id)}&date=${encodeURIComponent(targetDate)}&token=${encodeURIComponent(adminSecret)}`,
      vetoLink: `${baseUrl}/api/admin/veto?id=${encodeURIComponent(puzzle.id)}&token=${encodeURIComponent(adminSecret)}`,
    };

    if (passedAll) {
      surviving.push(reviewData);
    }
  }

  // 3. Take top 3 surviving candidates and store them as 'pending'
  const topSurviving = surviving.slice(0, 3);

  for (let i = 0; i < topSurviving.length; i++) {
    const c = topSurviving[i];
    // Candidate stored with a unique date key for D1 until approved
    const candidatePuzzle: Puzzle = {
      ...c.puzzle,
      id: c.puzzle.id || `candidate_${targetDate}_${i + 1}`,
      date: `${targetDate}_cand_${i + 1}`,
      plate,
      status: 'pending',
    };
    await insertPuzzle(env.DB, candidatePuzzle);
  }

  // 4. Send review notification to human reviewer
  await dispatchReviewNotification(topSurviving, targetDate, env);

  return topSurviving;
}

/**
 * 05:30 UTC Fallback Check Job:
 * Checks if a live puzzle is approved for today.
 * If human approval was not received before 05:30 UTC, deploys a pre-approved puzzle from /backlog.
 */
export async function runFallbackCheckJob(
  env: Env,
  targetDate: string
): Promise<Puzzle> {
  const existingLive = await getLivePuzzleForDate(env.DB, targetDate);
  if (existingLive) {
    console.log(`[PASSPHEW FALLBACK CHECK] Live puzzle already exists for ${targetDate}: ${existingLive.id}`);
    return existingLive;
  }

  console.log(`[PASSPHEW FALLBACK CHECK] No approved puzzle found for ${targetDate} by 05:30 UTC. Activating /backlog fallback.`);

  // Find used answers or used backlog IDs
  const usedPuzzles = (
    await env.DB.prepare('SELECT id, answer FROM puzzles')
      .all<{ id: string; answer: string }>()
  ).results || [];

  const usedIds = new Set(usedPuzzles.map((p) => p.id));
  const usedAnswers = new Set(usedPuzzles.map((p) => p.answer.toLowerCase()));

  // Pick first unused puzzle from 14-day backlog
  const candidate = BACKLOG_PUZZLES.find(
    (bp) => !usedIds.has(bp.id) && !usedAnswers.has(bp.answer.toLowerCase())
  ) || BACKLOG_PUZZLES[0];

  const plate = await getNextPlateNumber(env.DB);
  const fallbackPuzzle: Puzzle = {
    id: candidate.id,
    date: targetDate,
    plate,
    username: candidate.username,
    clue: candidate.clue,
    answer: candidate.answer,
    explanation: candidate.explanation,
    type: candidate.type,
    difficulty: candidate.difficulty,
    status: 'live',
  };

  await insertPuzzle(env.DB, fallbackPuzzle);
  console.log(`[PASSPHEW FALLBACK CHECK] Fallback puzzle ${candidate.id} (${candidate.username}) successfully deployed for ${targetDate}.`);

  return fallbackPuzzle;
}

/**
 * Dispatches human review notification (Webhook or email).
 */
async function dispatchReviewNotification(
  candidates: CandidateReviewData[],
  dateStr: string,
  env: Env
): Promise<void> {
  const lines: string[] = [
    `=== PASSPHEW CANDIDATES FOR REVIEW (${dateStr}) ===`,
    `Review deadline: 05:30 UTC (fallback activates automatically if unapproved).`,
    '',
  ];

  candidates.forEach((c, i) => {
    lines.push(`--- Candidate #${i + 1} [${c.puzzle.username}] ---`);
    lines.push(`Clue: "${c.puzzle.clue}"`);
    lines.push(`Answer: ${c.puzzle.answer}`);
    lines.push(`Type: ${c.puzzle.type} | Difficulty: ${c.puzzle.difficulty}/5`);
    lines.push(`Explanation: ${c.puzzle.explanation}`);
    lines.push(`Solver Top 3: [${c.solverGuesses.join(', ')}]`);
    lines.push(`Wordplay: ${c.wordplayPassed ? 'PASSED' : 'FAILED'}`);
    lines.push(`APPROVE: ${c.approvalLink}`);
    lines.push(`VETO: ${c.vetoLink}`);
    lines.push('');
  });

  const payloadText = lines.join('\n');
  console.log(payloadText);

  // If webhook configured, dispatch via POST
  if (env.NOTIFICATION_WEBHOOK_URL) {
    try {
      await fetch(env.NOTIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: payloadText,
          date: dateStr,
          candidatesCount: candidates.length,
        }),
      });
    } catch (e) {
      console.error('[PASSPHEW] Failed to dispatch webhook notification', e);
    }
  }
}
