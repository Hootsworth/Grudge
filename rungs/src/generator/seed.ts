// Seed script for Rungs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VETTED_LADDER_SETS } from './daily.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runSeed() {
  console.log('[Rungs Seed] Generating 14 days of vetted ladders...');
  const fixturesPath = path.resolve(__dirname, '../../backlog/fixtures.json');
  fs.mkdirSync(path.dirname(fixturesPath), { recursive: true });
  fs.writeFileSync(fixturesPath, JSON.stringify(VETTED_LADDER_SETS, null, 2), 'utf-8');
  console.log(`[Rungs Seed] Saved 14 days of fixtures to ${fixturesPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}
