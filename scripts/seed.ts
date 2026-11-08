import fs from 'node:fs';
import path from 'node:path';
import { BACKLOG_PUZZLES } from '../src/puzzle/backlog.ts';
import { calculatePercentile, calculateAvgAttempts, findHardestPair } from '../src/scoring/stats.ts';
import { evaluateGuess } from '../src/scoring/lockLogic.ts';
import type { PuzzleEvent } from '../src/types.ts';

interface SeedConfig {
  sessionsCount: number;
  dateStr: string;
  outputSqlPath: string;
}

export function generateSeedData(config: SeedConfig): string {
  const { sessionsCount, dateStr, outputSqlPath } = config;
  const template = BACKLOG_PUZZLES[0]; // Quantum Century
  const puzzleId = `puzzle-${dateStr}`;

  // Sort events newest (index 0) to oldest (index 5)
  const sortedEvents = [...template.events].sort((a, b) => b.year - a.year);
  const events: PuzzleEvent[] = sortedEvents.map((e, idx) => ({
    id: `${puzzleId}-e${idx + 1}`,
    text: e.text,
    year: e.year,
    precision: e.precision,
    source: e.source,
    true_order: idx,
  }));

  const sqlStatements: string[] = [
    '-- Strata Seed Data',
    `INSERT OR REPLACE INTO puzzles (id, date, plate, theme, spread_type, status, created_at, published_at)
     VALUES ('${puzzleId}', '${dateStr}', '${template.plate}', '${template.theme}', '${template.spread_type}', 'published', ${Date.now()}, ${Date.now()});`,
  ];

  for (const ev of events) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO events (id, puzzle_id, text, year, precision, source, true_order)
       VALUES ('${ev.id}', '${puzzleId}', '${ev.text.replace(/'/g, "''")}', ${ev.year}, '${ev.precision}', '${ev.source}', ${ev.true_order});`
    );
  }

  const finishedScores: Array<number | null> = [];
  const allGuessOrders: string[][] = [];

  const now = Date.now();
  const trueIds = events.map((e) => e.id);

  console.log(`[Seed] Generating ${sessionsCount} simulated player sessions for puzzle ${puzzleId}...`);

  for (let s = 1; s <= sessionsCount; s++) {
    const sessionId = `seed-session-${s.toString().padStart(3, '0')}-${crypto.randomUUID().slice(0, 8)}`;
    // Distribution: 70% win, 30% lose
    const willWin = Math.random() < 0.72;
    const targetAttempts = willWin ? Math.floor(Math.random() * 4) + 1 : 4;

    let currentOrder = [...trueIds];
    // Introduce random swaps
    for (let i = 0; i < 3; i++) {
      const idxA = Math.floor(Math.random() * 5);
      const idxB = idxA + 1;
      [currentOrder[idxA], currentOrder[idxB]] = [currentOrder[idxB], currentOrder[idxA]];
    }

    let locked: string[] = [];
    let isSolved = false;
    let actualAttempts = 0;

    for (let att = 1; att <= targetAttempts; att++) {
      actualAttempts = att;
      // If this is the winning attempt, snap to true order
      if (willWin && att === targetAttempts) {
        currentOrder = [...trueIds];
      }

      const evalRes = evaluateGuess(currentOrder, events, locked);
      locked = evalRes.newLockedIds;
      isSolved = evalRes.isSolved;
      allGuessOrders.push([...currentOrder]);

      const guessId = `seed-guess-${s}-${att}`;
      sqlStatements.push(
        `INSERT INTO guesses (id, session_id, puzzle_id, attempt_number, order_json, correct_json, created_at)
         VALUES ('${guessId}', '${sessionId}', '${puzzleId}', ${att}, '${JSON.stringify(currentOrder)}', '${JSON.stringify(evalRes.correctBools)}', ${now + att * 2000});`
      );

      if (isSolved) break;

      // For next attempt, fix one more unlocked event
      for (let i = 0; i < 6; i++) {
        if (!locked.includes(trueIds[i]) && Math.random() < 0.5) {
          const currentPos = currentOrder.indexOf(trueIds[i]);
          [currentOrder[i], currentOrder[currentPos]] = [currentOrder[currentPos], currentOrder[i]];
          break;
        }
      }
    }

    const finalSolved = isSolved ? 1 : 0;
    const finalScore = isSolved ? actualAttempts : null;
    finishedScores.push(finalScore);

    sqlStatements.push(
      `INSERT INTO sessions (id, puzzle_id, created_at, last_guess_at, attempts_used, locked_json, solved, finished)
       VALUES ('${sessionId}', '${puzzleId}', ${now - 30000}, ${now}, ${actualAttempts}, '${JSON.stringify(locked)}', ${finalSolved}, 1);`
    );
  }

  // Pre-calculate daily stats
  const totalPlayers = finishedScores.length;
  const totalSolves = finishedScores.filter((x) => x !== null).length;
  const solveRate = Math.round((totalSolves / totalPlayers) * 1000) / 1000;
  const avgAttempts = calculateAvgAttempts(finishedScores);
  const hardestPair = findHardestPair(allGuessOrders, events);

  sqlStatements.push(
    `INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, total_solves, avg_attempts, solve_rate, hardest_pair_json, updated_at)
     VALUES ('${dateStr}', '${puzzleId}', ${totalPlayers}, ${totalSolves}, ${avgAttempts}, ${solveRate}, '${hardestPair ? JSON.stringify(hardestPair).replace(/'/g, "''") : null}', ${now});`
  );

  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync(outputSqlPath, sqlContent, 'utf-8');

  console.log(`[Seed] Successfully generated ${sqlStatements.length} SQL statements to: ${outputSqlPath}`);
  console.log(`[Seed] Summary: ${totalPlayers} players | Solves: ${totalSolves} (${(solveRate * 100).toFixed(1)}%) | Avg Attempts: ${avgAttempts}`);
  if (hardestPair) {
    console.log(`[Seed] Hardest Pair: "${hardestPair.eventA}" & "${hardestPair.eventB}" with ${hardestPair.swaps} swaps`);
  }

  return sqlContent;
}

// If executed directly from CLI
const args = process.argv.slice(2);
const sessionsArg = args.find((a) => a.startsWith('--sessions='));
const count = sessionsArg ? parseInt(sessionsArg.split('=')[1], 10) : 50;
const dateArg = args.find((a) => a.startsWith('--date='));
const date = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

const outputSql = path.resolve(process.cwd(), 'seed.sql');
generateSeedData({
  sessionsCount: count,
  dateStr: date,
  outputSqlPath: outputSql,
});
