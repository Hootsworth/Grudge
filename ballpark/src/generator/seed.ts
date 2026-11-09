// Seed mode script for Ballpark
// Generates 14 days of vetted backlog fixtures and simulates >= 35 fake players per question
// so crowd medians and percentiles can be verified locally and in CI.

import * as fs from 'fs';
import * as path from 'path';
import { BACKLOG_SETS } from './backlog.ts';
import { calculateErrorOrders, calculatePoints } from '../scoring.ts';
import { calculateMedian } from '../crowd.ts';

// Deterministic pseudo-random Gaussian generator (Box-Muller)
function randomGaussian(mean: number, stdDev: number, seed: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.abs(Math.sin(seed * 12.9898 + 78.233) % 1);
  while (v === 0) v = Math.abs(Math.cos(seed * 43.1234 + 19.821) % 1);
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

export function generateSeedData(numFakePlayers = 35) {
  const allDays = [];

  for (const day of BACKLOG_SETS) {
    const dayQuestions = day.questions.map((q, idx) => ({
      id: `q_${day.date.replace(/-/g, '')}_${idx + 1}`,
      puzzle_date: day.date,
      question_index: idx + 1,
      question: q.question,
      unit: q.unit,
      value: q.value,
      value_log10: q.valueLog10,
      explanation: q.explanation,
      sources: q.sources,
      category: q.category,
      difficulty: q.difficulty,
      fermi_derivation: q.fermiDerivation,
    }));

    // Generate fake players and guesses
    const fakePlayers = [];
    const questionGuessesMap: Record<string, number[]> = {};

    for (const q of dayQuestions) {
      questionGuessesMap[q.id] = [];
    }

    for (let p = 1; p <= numFakePlayers; p++) {
      const sessionId = `fake_player_${day.date}_${p}`;
      const playerGuesses = [];
      let totalPts = 0;
      let totalErr = 0;

      for (let idx = 0; idx < dayQuestions.length; idx++) {
        const q = dayQuestions[idx];
        const seed = p * 100 + idx * 7;
        // Crowd estimates are centered near true log10 with standard deviation 0.8 orders
        let guessExponent = randomGaussian(q.value_log10, 0.85, seed);
        guessExponent = Math.max(0, Math.min(24, Math.round(guessExponent * 100) / 100));

        const err = calculateErrorOrders(guessExponent, q.value_log10);
        const pts = calculatePoints(err);

        totalPts += pts;
        totalErr += err;

        questionGuessesMap[q.id].push(guessExponent);
        playerGuesses.push({
          questionId: q.id,
          guessExponent,
          errorOrders: Math.round(err * 100) / 100,
          points: pts,
        });
      }

      fakePlayers.push({
        sessionId,
        totalPoints: totalPts,
        totalErrorOrders: Math.round(totalErr * 100) / 100,
        guesses: playerGuesses,
      });
    }

    // Compute crowd medians
    const crowdMedians: Record<string, number | null> = {};
    for (const q of dayQuestions) {
      crowdMedians[q.id] = calculateMedian(questionGuessesMap[q.id], 30);
    }

    allDays.push({
      date: day.date,
      plate: day.plate,
      questions: dayQuestions,
      fakePlayersCount: fakePlayers.length,
      fakePlayers,
      crowdMedians,
    });
  }

  return allDays;
}

export function runSeed() {
  console.log('[Ballpark Seed] Generating 14 days of vetted questions and crowd simulation...');
  const seedData = generateSeedData(36);

  const backlogDir = path.resolve(process.cwd(), 'backlog');
  if (!fs.existsSync(backlogDir)) {
    fs.mkdirSync(backlogDir, { recursive: true });
  }

  const fixturesPath = path.join(backlogDir, 'fixtures.json');
  fs.writeFileSync(fixturesPath, JSON.stringify(seedData, null, 2), 'utf-8');
  console.log(`[Ballpark Seed] Saved 14 days of fixtures to: ${fixturesPath}`);

  // Test crowd median on day 1 question 1
  const day1 = seedData[0];
  const q1 = day1.questions[0];
  const q1Median = day1.crowdMedians[q1.id];
  console.log(`[Ballpark Seed] Day 1 Question 1 ("${q1.unit}") Truth 10^${q1.value_log10} -> Crowd Median (36 players): 10^${q1Median}`);

  return seedData;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}
