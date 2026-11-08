import type { Env, PuzzleRecord, RoundRecord } from '../types.ts';
import {
  getPendingPuzzleForDate,
  getPublishedPuzzleForDate,
  publishPuzzle,
  savePuzzleWithRounds,
  getHistoryOrganismsAndTriplets,
  getPuzzleRounds,
} from '../db.ts';
import { getBacklogPuzzleForDate } from '../backlog/puzzles.ts';
import {
  validateTopologyGap,
  validateConfidenceIntervals,
  isTaxaUncontested,
  validateFactNumbers,
  isTripletAllowedByHistory,
  validateDailyFiveRounds,
  calculateCounterintuitiveScore,
} from '../selection.ts';

export async function handleScheduledEvent(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  console.log(`[Kin Cron] Trigger '${cron}' running for ${dateStr}...`);

  if (cron === '0 5 * * *') {
    await run0500Selection(env, dateStr);
  } else if (cron === '0 6 * * *') {
    await run0600PublishAndFallback(env, dateStr);
    await compileYesterdayStats(env, now);
  } else {
    await run0500Selection(env, dateStr);
    await run0600PublishAndFallback(env, dateStr);
  }
}

export async function run0500Selection(env: Env, dateStr: string): Promise<void> {
  const published = await getPublishedPuzzleForDate(env.DB, dateStr);
  if (published) {
    console.log(`[Kin Cron] Puzzle for ${dateStr} is already published.`);
    return;
  }

  const pending = await getPendingPuzzleForDate(env.DB, dateStr);
  if (pending) {
    console.log(`[Kin Cron] Pending puzzle for ${dateStr} already created.`);
    return;
  }

  const { usedOrganismsLast30Days, usedTripletsLast365Days } = await getHistoryOrganismsAndTriplets(env.DB);
  console.log(`[Kin Cron] Loaded history: ${usedOrganismsLast30Days.size} organisms (30d), ${usedTripletsLast365Days.size} triplets (365d).`);

  // Fallback to verified backlog template if live generation is not configured
  const backlog = getBacklogPuzzleForDate(dateStr);
  await savePuzzleWithRounds(env.DB, { ...backlog.puzzle, status: 'pending' }, backlog.rounds);
  console.log(`[Kin Cron] Saved pending puzzle for ${dateStr} (awaiting 06:00 UTC review gate).`);

  if (env.PREVIEW_WEBHOOK_URL) {
    await sendPreviewWebhook(env.PREVIEW_WEBHOOK_URL, backlog.puzzle, backlog.rounds);
  }
}

export async function run0600PublishAndFallback(env: Env, dateStr: string): Promise<void> {
  const published = await getPublishedPuzzleForDate(env.DB, dateStr);
  if (published) {
    console.log(`[Kin Cron] Puzzle for ${dateStr} is already published.`);
    return;
  }

  const pending = await getPendingPuzzleForDate(env.DB, dateStr);
  if (pending && pending.status === 'pending') {
    console.log(`[Kin Cron] Auto-publishing approved pending puzzle '${pending.id}'...`);
    await publishPuzzle(env.DB, pending.id);
    return;
  }

  console.log(`[Kin Cron] Deploying pre-approved backlog puzzle for ${dateStr}...`);
  const backlog = getBacklogPuzzleForDate(dateStr);
  await savePuzzleWithRounds(env.DB, backlog.puzzle, backlog.rounds);
  await publishPuzzle(env.DB, backlog.puzzle.id);
}

export async function compileYesterdayStats(env: Env, nowDate: Date = new Date()): Promise<void> {
  const yesterday = new Date(nowDate.getTime() - 86400 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const puzzle = await getPublishedPuzzleForDate(env.DB, yesterdayStr);
  if (!puzzle || !puzzle.rounds) return;

  const solveRatePerRound: number[] = [];
  let totalUniquePlayers = 0;

  for (let r = 1; r <= 5; r++) {
    const targetRound = puzzle.rounds.find((rnd) => rnd.round_number === r);
    if (!targetRound) {
      solveRatePerRound.push(0);
      continue;
    }

    const { results } = await env.DB
      .prepare('SELECT correct FROM answers WHERE round_id = ?')
      .bind(targetRound.id)
      .all<{ correct: number }>();

    const total = (results || []).length;
    if (r === 1) totalUniquePlayers = total;
    const correctCount = (results || []).filter((a) => a.correct === 1).length;
    const rate = total > 0 ? Math.round((correctCount / total) * 1000) / 1000 : 0;
    solveRatePerRound.push(rate);
  }

  const { results: wrongAnswers } = await env.DB
    .prepare('SELECT round_number, chosen_pair_json FROM answers WHERE puzzle_id = ? AND correct = 0')
    .bind(puzzle.id)
    .all<{ round_number: number; chosen_pair_json: string }>();

  let mostCommonWrongPairing: any = null;
  const pairCounts = new Map<string, { count: number; round: number; pair: [string, string] }>();

  for (const row of wrongAnswers || []) {
    try {
      const pair = (JSON.parse(row.chosen_pair_json) as string[]).sort();
      const key = `${row.round_number}:${pair.join(':')}`;
      const entry = pairCounts.get(key) || { count: 0, round: row.round_number, pair: [pair[0], pair[1]] };
      entry.count++;
      pairCounts.set(key, entry);
    } catch {}
  }

  let maxCount = 0;
  for (const item of pairCounts.values()) {
    if (item.count > maxCount) {
      maxCount = item.count;
      mostCommonWrongPairing = { roundIndex: item.round, pairNames: item.pair, count: item.count };
    }
  }

  await env.DB
    .prepare(
      `INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, solve_rate_rounds_json, most_common_wrong_pair_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      yesterdayStr,
      puzzle.id,
      totalUniquePlayers,
      JSON.stringify(solveRatePerRound),
      mostCommonWrongPairing ? JSON.stringify(mostCommonWrongPairing) : null,
      Date.now()
    )
    .run();
}

export async function sendPreviewWebhook(
  webhookUrl: string,
  puzzle: PuzzleRecord,
  rounds: RoundRecord[]
): Promise<void> {
  const roundLines = rounds
    .map(
      (r) =>
        `Round ${r.round_number}: **${r.org_a}** & **${r.org_b}** (t1=${r.t1} Mya) vs **${r.org_c}** (t2=${r.t2} Mya)\n` +
        `> _Fact:_ ${r.fact}`
    )
    .join('\n\n');

  const payload = {
    content:
      `🧬 **Kin Daily Puzzle Pending Review [${puzzle.date}]**\n` +
      `**Plate:** ${puzzle.plate}\n\n` +
      `${roundLines}\n\n` +
      `_Auto-publishes at 06:00 UTC unless vetoed._`,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[Kin] Failed to send preview webhook:', err);
  }
}
