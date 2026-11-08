import type { Env } from '../types.ts';
import {
  getPendingPuzzleForDate,
  getPublishedPuzzleForDate,
  publishPuzzle,
  savePuzzleWithEvents,
  getPuzzleEvents,
} from '../db.ts';
import { generateDailyPuzzle, sendPreviewWebhook } from '../puzzle/generator.ts';
import { getBacklogPuzzleForDate } from '../puzzle/backlog.ts';
import { findHardestPair, calculateAvgAttempts } from '../scoring/stats.ts';

export async function handleScheduledEvent(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;
  const now = new Date(event.scheduledTime || Date.now());
  const dateStr = now.toISOString().split('T')[0];
  const hour = now.getUTCHours();

  console.log(`[Strata Cron] Running cron trigger '${cron}' (hour: ${hour}) for date ${dateStr}...`);

  if (cron === '0 5 * * *' || hour === 5) {
    // 05:00 UTC: Generate pending puzzle & send review preview
    await run0500Generation(env, dateStr);
  } else if (cron === '0 6 * * *' || hour === 6) {
    // 06:00 UTC: Auto-publish gate or fallback, and compile yesterday stats
    await run0600PublishAndFallback(env, dateStr);
    await compileYesterdayStats(env, now);
  } else {
    // Fallback: run both checks if cron expression differs
    await run0500Generation(env, dateStr);
    await run0600PublishAndFallback(env, dateStr);
  }
}

export async function run0500Generation(env: Env, dateStr: string): Promise<void> {
  // Check if a puzzle already exists for today
  const existingPublished = await getPublishedPuzzleForDate(env.DB, dateStr);
  if (existingPublished) {
    console.log(`[Strata Cron] Puzzle for ${dateStr} is already published.`);
    return;
  }

  const existingPending = await getPendingPuzzleForDate(env.DB, dateStr);
  if (existingPending) {
    console.log(`[Strata Cron] Pending puzzle for ${dateStr} already generated.`);
    return;
  }

  const { puzzle, events } = await generateDailyPuzzle(env, dateStr);
  await savePuzzleWithEvents(env.DB, puzzle, events);

  if (env.PREVIEW_WEBHOOK_URL) {
    await sendPreviewWebhook(env.PREVIEW_WEBHOOK_URL, puzzle, events);
  }
}

export async function run0600PublishAndFallback(env: Env, dateStr: string): Promise<void> {
  const published = await getPublishedPuzzleForDate(env.DB, dateStr);
  if (published) {
    console.log(`[Strata Cron] Today's puzzle is already published.`);
    return;
  }

  const pending = await getPendingPuzzleForDate(env.DB, dateStr);
  if (pending && pending.status === 'pending') {
    // Not vetoed -> auto-publish!
    console.log(`[Strata Cron] Auto-publishing approved pending puzzle '${pending.id}'...`);
    await publishPuzzle(env.DB, pending.id);
    return;
  }

  // If vetoed or generation failed: fallback to backlog
  console.log(`[Strata Cron] Deploying pre-approved backlog puzzle for ${dateStr}...`);
  const backlog = getBacklogPuzzleForDate(dateStr);
  await savePuzzleWithEvents(env.DB, backlog.puzzle, backlog.events);
  await publishPuzzle(env.DB, backlog.puzzle.id);
}

export async function compileYesterdayStats(env: Env, nowDate: Date = new Date()): Promise<void> {
  const yesterday = new Date(nowDate.getTime() - 86400 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const puzzle = await getPublishedPuzzleForDate(env.DB, yesterdayStr);
  if (!puzzle) return;

  const events = await getPuzzleEvents(env.DB, puzzle.id);
  const sortedEvents = [...events].sort((a, b) => b.year - a.year);

  // Fetch all finished sessions for yesterday
  const { results: sessions } = await env.DB
    .prepare('SELECT attempts_used, solved FROM sessions WHERE puzzle_id = ? AND finished = 1')
    .bind(puzzle.id)
    .all<{ attempts_used: number; solved: number }>();

  if (!sessions || sessions.length === 0) {
    return;
  }

  const totalPlayers = sessions.length;
  const totalSolves = sessions.filter((s) => s.solved === 1).length;
  const solveRate = Math.round((totalSolves / totalPlayers) * 1000) / 1000;

  const finishedScores: Array<number | null> = sessions.map((s) =>
    s.solved === 1 ? s.attempts_used : null
  );
  const avgAttempts = calculateAvgAttempts(finishedScores);

  // Fetch all guesses for yesterday to compute hardest pair
  const { results: guessRows } = await env.DB
    .prepare('SELECT order_json FROM guesses WHERE puzzle_id = ?')
    .bind(puzzle.id)
    .all<{ order_json: string }>();

  const guessOrders = (guessRows || []).map((r) => {
    try {
      return JSON.parse(r.order_json) as string[];
    } catch {
      return [];
    }
  }).filter((ord) => ord.length === 6);

  const hardestPair = findHardestPair(guessOrders, sortedEvents);

  await env.DB
    .prepare(
      `INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, total_solves, avg_attempts, solve_rate, hardest_pair_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      yesterdayStr,
      puzzle.id,
      totalPlayers,
      totalSolves,
      avgAttempts,
      solveRate,
      hardestPair ? JSON.stringify(hardestPair) : null,
      Date.now()
    )
    .run();

  console.log(`[Strata Cron] Compiled stats for ${yesterdayStr}: ${totalPlayers} players, solveRate=${solveRate}`);
}
