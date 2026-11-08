import fs from 'node:fs';
import path from 'node:path';
import { KIN_BACKLOG_PUZZLES } from '../src/backlog/puzzles.ts';
import { getRankTitle, calculatePercentile } from '../src/scoring.ts';

interface SeedOptions {
  sessionsCount: number;
  dateStr: string;
  outputSqlPath: string;
}

export function generateKinSeedSql(options: SeedOptions): string {
  const { sessionsCount, dateStr, outputSqlPath } = options;
  const template = KIN_BACKLOG_PUZZLES[0];
  const puzzleId = `kin-puzzle-${dateStr}`;

  const sqlStatements: string[] = [
    '-- Kin Seed Data',
    'BEGIN TRANSACTION;',
    `INSERT OR REPLACE INTO puzzles (id, date, plate, status, created_at, published_at)
     VALUES ('${puzzleId}', '${dateStr}', '${template.plate}', 'published', ${Date.now()}, ${Date.now()});`,
  ];

  const roundIds: string[] = [];

  template.rounds.forEach((r, idx) => {
    const roundId = `${puzzleId}-r${idx + 1}`;
    roundIds.push(roundId);
    sqlStatements.push(
      `INSERT OR REPLACE INTO rounds (id, puzzle_id, round_number, org_a, org_b, org_c, t1, t2, ci1_low, ci1_high, ci2_low, ci2_high, counterintuitive_score, fact)
       VALUES ('${roundId}', '${puzzleId}', ${idx + 1}, '${r.org_a}', '${r.org_b}', '${r.org_c}', ${r.t1}, ${r.t2}, ${r.ci1_low}, ${r.ci1_high}, ${r.ci2_low}, ${r.ci2_high}, ${r.counterintuitive_score}, '${r.fact.replace(/'/g, "''")}');`
    );
  });

  const now = Date.now();
  const allFinalScores: number[] = [];
  const roundCorrectCounts = [0, 0, 0, 0, 0];
  const wrongPairCounts = new Map<string, { round: number; pair: [string, string]; count: number }>();

  console.log(`[Kin Seed] Generating ${sessionsCount} simulated player sessions for puzzle ${puzzleId}...`);

  for (let s = 1; s <= sessionsCount; s++) {
    const sessionId = `seed-session-${s.toString().padStart(3, '0')}-${crypto.randomUUID().slice(0, 8)}`;
    let currentScore = 0;
    let deepest = 0;
    let solvedCount = 0;

    for (let rIdx = 0; rIdx < 5; rIdx++) {
      const round = template.rounds[rIdx];
      const roundId = roundIds[rIdx];
      // Solve probabilities: R1=85%, R2=80%, R3=65%, R4=60%, R5=45%
      const winProb = [0.85, 0.80, 0.65, 0.60, 0.45][rIdx];
      const isCorrect = Math.random() < winProb;

      let chosenPair: [string, string];
      if (isCorrect) {
        chosenPair = [round.org_a, round.org_b];
        currentScore += round.t2;
        deepest = Math.max(deepest, round.t2);
        solvedCount++;
        roundCorrectCounts[rIdx]++;
      } else {
        // Pick one of the false pairings: {A, C} or {B, C}
        chosenPair = Math.random() < 0.5 ? [round.org_a, round.org_c] : [round.org_b, round.org_c];
        const key = `${rIdx + 1}:${[...chosenPair].sort().join(':')}`;
        const entry = wrongPairCounts.get(key) || { round: rIdx + 1, pair: chosenPair, count: 0 };
        entry.count++;
        wrongPairCounts.set(key, entry);
      }

      sqlStatements.push(
        `INSERT INTO answers (id, session_id, puzzle_id, round_id, round_number, chosen_pair_json, correct, created_at)
         VALUES ('seed-ans-${s}-${rIdx + 1}', '${sessionId}', '${puzzleId}', '${roundId}', ${rIdx + 1}, '${JSON.stringify(chosenPair)}', ${isCorrect ? 1 : 0}, ${now + rIdx * 5000});`
      );
    }

    allFinalScores.push(currentScore);

    sqlStatements.push(
      `INSERT INTO sessions (id, puzzle_id, created_at, last_answer_at, current_round, score_total_mya, deepest_mya, finished)
       VALUES ('${sessionId}', '${puzzleId}', ${now - 60000}, ${now}, 6, ${currentScore}, ${deepest}, 1);`
    );
  }

  // Calculate solve rate per round
  const solveRates = roundCorrectCounts.map((c) => Math.round((c / sessionsCount) * 1000) / 1000);

  // Find most common wrong pair
  let mostCommonWrong: any = null;
  let maxWrong = 0;
  for (const item of wrongPairCounts.values()) {
    if (item.count > maxWrong) {
      maxWrong = item.count;
      mostCommonWrong = { roundIndex: item.round, pairNames: item.pair, count: item.count };
    }
  }

  sqlStatements.push(
    `INSERT OR REPLACE INTO daily_stats (date, puzzle_id, total_players, solve_rate_rounds_json, most_common_wrong_pair_json, updated_at)
     VALUES ('${dateStr}', '${puzzleId}', ${sessionsCount}, '${JSON.stringify(solveRates)}', '${mostCommonWrong ? JSON.stringify(mostCommonWrong).replace(/'/g, "''") : null}', ${now});`
  );

  sqlStatements.push('COMMIT;');

  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync(outputSqlPath, sqlContent, 'utf-8');

  console.log(`[Kin Seed] Successfully generated ${sqlStatements.length} statements to: ${outputSqlPath}`);
  console.log(`[Kin Seed] Solve Rates: ${JSON.stringify(solveRates)}`);
  if (mostCommonWrong) {
    console.log(`[Kin Seed] Most Common Wrong Pairing: Round ${mostCommonWrong.roundIndex} (${mostCommonWrong.pairNames.join(' & ')}) with ${mostCommonWrong.count} picks.`);
  }

  return sqlContent;
}

const args = process.argv.slice(2);
const sessionsArg = args.find((a) => a.startsWith('--sessions='));
const count = sessionsArg ? parseInt(sessionsArg.split('=')[1], 10) : 50;
const dateArg = args.find((a) => a.startsWith('--date='));
const date = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

const outputSql = path.resolve(process.cwd(), 'seed.sql');
generateKinSeedSql({
  sessionsCount: count,
  dateStr: date,
  outputSqlPath: outputSql,
});
