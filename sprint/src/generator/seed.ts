// Seed script for Sprint
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VETTED_SPRINT_SETS } from './daily.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runSeed() {
  console.log('[Sprint Seed] Generating 14 days of vetted anagram puzzles...');
  const fixturesPath = path.resolve(__dirname, '../../backlog/fixtures.json');
  fs.mkdirSync(path.dirname(fixturesPath), { recursive: true });
  fs.writeFileSync(fixturesPath, JSON.stringify(VETTED_SPRINT_SETS, null, 2), 'utf-8');
  console.log(`[Sprint Seed] Saved 14 days of fixtures to ${fixturesPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}
