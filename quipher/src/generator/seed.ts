// quipher/src/generator/seed.ts

import { BACKLOG_QUOTES } from '../backlog/backlog.ts';
import { calculateScore, getRankTitle } from '../scoring.ts';

export interface SeededSession {
  sessionId: string;
  puzzleDate: string;
  startedAt: number;
  solvedAt: number | null;
  solveSeconds: number | null;
  checks: number;
  hints: number;
  score: number | null;
  rankTitle: string | null;
  status: 'solved' | 'in_progress' | 'flagged';
  flaggedReason: string | null;
}

export function generateSeedData(targetDate: string, count: number = 40): {
  quote: (typeof BACKLOG_QUOTES)[0];
  sessions: SeededSession[];
} {
  const quote =
    BACKLOG_QUOTES.find((q) => q.date === targetDate) || BACKLOG_QUOTES[0];
  const sessions: SeededSession[] = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const sessionId = `fake_sess_${targetDate.replace(/-/g, '')}_${String(i).padStart(3, '0')}`;
    const startedAt = now - 3600000 - Math.floor(Math.random() * 7200000);

    // 1 scripted / flagged session
    if (i === 1) {
      const solveSec = 9;
      const score = calculateScore(solveSec, 0, 0);
      sessions.push({
        sessionId,
        puzzleDate: targetDate,
        startedAt,
        solvedAt: startedAt + solveSec * 1000,
        solveSeconds: solveSec,
        checks: 0,
        hints: 0,
        score,
        rankTitle: getRankTitle(score),
        status: 'flagged',
        flaggedReason: 'Solve time 9s is under 15-second human threshold',
      });
      continue;
    }

    // 3 in_progress sessions (unsolved)
    if (i <= 4) {
      sessions.push({
        sessionId,
        puzzleDate: targetDate,
        startedAt,
        solvedAt: null,
        solveSeconds: null,
        checks: Math.floor(Math.random() * 3),
        hints: Math.floor(Math.random() * 2),
        score: null,
        rankTitle: null,
        status: 'in_progress',
        flaggedReason: null,
      });
      continue;
    }

    // Normal solved players
    // Realistic solve times: 45s to 350s
    const solveSeconds = 45 + Math.floor(Math.random() * 300);
    const checks = Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
    const hints = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;
    const score = calculateScore(solveSeconds, checks, hints);
    const rankTitle = getRankTitle(score);

    sessions.push({
      sessionId,
      puzzleDate: targetDate,
      startedAt,
      solvedAt: startedAt + solveSeconds * 1000,
      solveSeconds,
      checks,
      hints,
      score,
      rankTitle,
      status: 'solved',
      flaggedReason: null,
    });
  }

  return { quote, sessions };
}

// Standalone execution script
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed.ts')) {
  const args = process.argv.slice(2);
  const dateArg = args.find((a) => a.startsWith('--date='))?.split('=')[1] || '2026-11-10';
  const { quote, sessions } = generateSeedData(dateArg, 45);

  const solved = sessions.filter((s) => s.status === 'solved');
  const scores = solved.map((s) => s.score as number).sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  const medianScore = scores.length % 2 !== 0 ? scores[mid] : Math.round((scores[mid - 1] + scores[mid]) / 2);

  console.log(`[SEED] Generated ${sessions.length} sessions for Quipher quote on ${dateArg}`);
  console.log(`[SEED] Quote: "${quote.plaintext}" by ${quote.author}`);
  console.log(`[SEED] Total solved: ${solved.length}/${sessions.length}`);
  console.log(`[SEED] Median score (penalty seconds): ${medianScore}s`);
  console.log(`[SEED] Ranks:`);
  console.log(`  - Codebreaker (<120): ${solved.filter((s) => s.rankTitle === 'Codebreaker').length}`);
  console.log(`  - Cryptanalyst (<240): ${solved.filter((s) => s.rankTitle === 'Cryptanalyst').length}`);
  console.log(`  - Bletchley intern (<420): ${solved.filter((s) => s.rankTitle === 'Bletchley intern').length}`);
  console.log(`  - Rot13 enjoyer (>=420): ${solved.filter((s) => s.rankTitle === 'Rot13 enjoyer').length}`);
}
