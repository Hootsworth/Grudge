// Nightly Generation & Seed Script for Pinpoint (Node.js)
import fs from 'node:fs';
import path from 'node:path';
import { loadWorldData } from './data.ts';
import { assignProperMapColors } from './coloring.ts';
import { renderMysteryWindow } from './render.ts';
import { generateSpotFact } from './facts.ts';
import { generateReviewEmailHtml } from './email.ts';
import { BACKLOG_PUZZLES } from './backlog.ts';
import type { WindowRendering } from '../worker/types.ts';

const ASPECTS: Array<'4:3' | '16:9' | '3:4'> = ['4:3', '16:9', '3:4'];
const LEVELS = [9, 22, 55]; // Level 0: 9°, Level 1: 22°, Level 2: 55°

async function runSeedMode() {
  console.log('[PINPOINT SEED] Starting --seed mode: Pre-rendering 14 days of fixtures...');
  const world = loadWorldData();
  console.log(`[PINPOINT SEED] Loaded ${world.countries.length} country polygons from world-atlas (excluding Antarctica).`);

  const colorMap = assignProperMapColors(world.countries);
  console.log(`[PINPOINT SEED] Computed greedy proper 6-coloring across countries.`);

  const outputDir = path.resolve(process.cwd(), 'backlog/rendered');
  fs.mkdirSync(outputDir, { recursive: true });

  const allFixtures: any[] = [];
  const baseDate = new Date('2026-11-09');

  for (let dIdx = 0; dIdx < BACKLOG_PUZZLES.length; dIdx++) {
    const day = BACKLOG_PUZZLES[dIdx];
    const targetDateObj = new Date(baseDate);
    targetDateObj.setDate(baseDate.getDate() + dIdx);
    const dateStr = targetDateObj.toISOString().split('T')[0];

    console.log(`\n[PINPOINT SEED] Rendering Day #${day.plate} (${dateStr}) with 5 spots...`);

    const dayWindows: Record<string, WindowRendering> = {};
    const rounds: any[] = [];

    for (let sIdx = 0; sIdx < day.spots.length; sIdx++) {
      const spot = day.spots[sIdx];
      const roundNum = sIdx + 1;

      console.log(`  - Spot #${roundNum}: ${spot.name} (${spot.lat}°, ${spot.lon}°) [${spot.continent}]`);

      // Pre-render windows for all levels and aspects
      for (let lIdx = 0; lIdx < LEVELS.length; lIdx++) {
        const deg = LEVELS[lIdx];
        for (const aspect of ASPECTS) {
          const win = renderMysteryWindow(spot.lat, spot.lon, deg, aspect, world, colorMap);
          const kvKey = `puzzle/${dateStr}/${roundNum}/${lIdx}/${aspect}`;
          dayWindows[kvKey] = win;
        }
      }

      rounds.push({
        id: `${dateStr}_${roundNum}`,
        puzzle_date: dateStr,
        round_number: roundNum,
        name: spot.name,
        fact: spot.fact,
        source_url: spot.sourceUrl,
        lat: spot.lat,
        lon: spot.lon,
        continent: spot.continent,
        difficulty: spot.difficulty,
        created_at: Date.now(),
      });
    }

    const puzzle = {
      date: dateStr,
      plate: day.plate,
      status: 'live',
      created_at: Date.now(),
    };

    allFixtures.push({ puzzle, rounds, windows: dayWindows });

    // Save individual day payload
    const dayFile = path.join(outputDir, `${dateStr}.json`);
    fs.writeFileSync(dayFile, JSON.stringify({ puzzle, rounds, windows: dayWindows }, null, 2));
    console.log(`  ✓ Saved ${dateStr}.json (${Object.keys(dayWindows).length} KV window keys)`);
  }

  // Save composite backlog index
  const indexFile = path.resolve(process.cwd(), 'backlog/fixtures.json');
  fs.writeFileSync(indexFile, JSON.stringify(allFixtures, null, 2));
  console.log(`\n[PINPOINT SEED SUCCESS] Successfully rendered all 14 days of fixtures to: ${indexFile}`);

  // If worker URL and secret are present in env, optionally push day 1
  const workerUrl = process.env.PINPOINT_WORKER_URL;
  const adminSecret = process.env.APPROVAL_SECRET;
  if (workerUrl && adminSecret && allFixtures.length > 0) {
    try {
      console.log(`[PINPOINT SEED] Pushing Day 1 to live worker at ${workerUrl}...`);
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/admin/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminSecret,
        },
        body: JSON.stringify(allFixtures[0]),
      });
      console.log(`[PINPOINT SEED] Publish response status: ${res.status}`);
    } catch (pushErr) {
      console.warn('[PINPOINT SEED NOTE] Could not connect to live worker during seed, local file generated.');
    }
  }
}

async function runNightlyGeneration() {
  console.log('[PINPOINT NIGHTLY] Starting nightly generation pipeline (03:00 UTC)...');
  const world = loadWorldData();
  const colorMap = assignProperMapColors(world.countries);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = tomorrow.toISOString().split('T')[0];

  const baseDate = new Date('2026-01-01');
  const plate = Math.max(1, Math.floor((tomorrow.getTime() - baseDate.getTime()) / 864e5) + 1);

  console.log(`[PINPOINT NIGHTLY] Generating candidate puzzle for Date: ${targetDate} (Plate #${plate})...`);

  // Pick candidate set from backlog rotation
  const backlogIdx = (plate - 1) % BACKLOG_PUZZLES.length;
  const candidateDay = BACKLOG_PUZZLES[backlogIdx];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const spots: any[] = [];
  const dayWindows: Record<string, WindowRendering> = {};

  for (let i = 0; i < candidateDay.spots.length; i++) {
    const rawSpot = candidateDay.spots[i];
    const roundNum = i + 1;

    // Fact generation with Anthropic API + verification
    let factObj = { fact: rawSpot.fact, sourceUrl: rawSpot.sourceUrl };
    if (apiKey) {
      try {
        factObj = await generateSpotFact(rawSpot.name, rawSpot.continent, apiKey);
      } catch (e) {}
    }

    const spotWithFact = {
      ...rawSpot,
      fact: factObj.fact,
      sourceUrl: factObj.sourceUrl,
    };
    spots.push(spotWithFact);

    // Pre-render windows for 3 levels and 3 aspects
    for (let lIdx = 0; lIdx < LEVELS.length; lIdx++) {
      const deg = LEVELS[lIdx];
      for (const aspect of ASPECTS) {
        const win = renderMysteryWindow(rawSpot.lat, rawSpot.lon, deg, aspect, world, colorMap);
        const kvKey = `puzzle/${targetDate}/${roundNum}/${lIdx}/${aspect}`;
        dayWindows[kvKey] = win;
      }
    }
  }

  const rounds = spots.map((s, idx) => ({
    id: `${targetDate}_${idx + 1}`,
    puzzle_date: targetDate,
    round_number: idx + 1,
    name: s.name,
    fact: s.fact,
    source_url: s.sourceUrl,
    lat: s.lat,
    lon: s.lon,
    continent: s.continent,
    difficulty: s.difficulty,
    created_at: Date.now(),
  }));

  const puzzle = {
    date: targetDate,
    plate,
    status: 'pending', // Requires approval before 05:30 UTC
    created_at: Date.now(),
  };

  const payload = { puzzle, rounds, windows: dayWindows };

  // Write candidate file
  const outPath = path.resolve(process.cwd(), `backlog/pending_${targetDate}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`[PINPOINT NIGHTLY] Saved pending puzzle candidate to: ${outPath}`);

  // Generate Review Email HTML
  const workerUrl = process.env.PINPOINT_WORKER_URL || 'https://pinpoint-backend.adityapdixit.workers.dev';
  const adminSecret = process.env.APPROVAL_SECRET || 'pinpoint-admin-secret-key';
  const emailHtml = generateReviewEmailHtml({
    date: targetDate,
    plate,
    spots,
    workerBaseUrl: workerUrl,
    adminSecret,
    approvalDeadlineUtc: '05:30 UTC',
  });

  const emailPath = path.resolve(process.cwd(), `backlog/preview_email_${targetDate}.html`);
  fs.writeFileSync(emailPath, emailHtml);
  console.log(`[PINPOINT NIGHTLY] Generated review email HTML preview: ${emailPath}`);

  // Ingest into Worker as pending
  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/admin/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminSecret,
      },
      body: JSON.stringify(payload),
    });
    console.log(`[PINPOINT NIGHTLY] Ingested candidate into worker API (HTTP ${res.status}).`);
  } catch (e) {
    console.log('[PINPOINT NIGHTLY] Note: Worker publish skipped (offline or not reachable).');
  }

  console.log('[PINPOINT NIGHTLY SUCCESS] Nightly run completed.');
}

async function main() {
  const isSeed = process.argv.includes('--seed');
  if (isSeed) {
    await runSeedMode();
  } else {
    await runNightlyGeneration();
  }
}

main().catch((err) => {
  console.error('[PINPOINT GENERATOR FATAL ERROR]', err);
  process.exit(1);
});
