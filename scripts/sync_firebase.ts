// scripts/sync_firebase.ts
// Populates and syncs 365-day non-reuse history across all 9 daily games into Cloud Firestore

import { recordItemUsage, storeDailyPuzzle } from '../src/firebase/usedRegistry.ts';
import { BACKLOG_QUOTES } from '../quipher/src/backlog/backlog.ts';
import { VETTED_LADDER_SETS } from '../rungs/src/generator/daily.ts';
import { VETTED_SPRINT_SETS } from '../sprint/src/generator/daily.ts';
import { BACKLOG_SETS as BALLPARK_SETS } from '../ballpark/src/generator/backlog.ts';
import { BACKLOG_PUZZLES as PASSPHEW_SETS } from '../passphew/src/generator/backlog.ts';

async function syncAllBacklogs() {
  console.log('[Firebase Sync] Starting 365-day cooldown registry synchronization...');

  // 1. Quipher quotes
  console.log(`[Firebase Sync] Indexing ${BACKLOG_QUOTES.length} Quipher quotes...`);
  for (const q of BACKLOG_QUOTES) {
    await recordItemUsage('quipher', q.plaintext, q.date, {
      author: q.author,
      source: q.source,
      year: q.year,
      difficulty: q.difficulty,
    });
    await storeDailyPuzzle('quipher', q.date, q.plate, {
      ciphertext: q.ciphertext,
      letterCount: q.plaintext.replace(/[^a-zA-Z]/g, '').length,
    });
  }

  // 2. Rungs word ladders
  console.log(`[Firebase Sync] Indexing ${VETTED_LADDER_SETS.length} Rungs ladder sets...`);
  for (const set of VETTED_LADDER_SETS) {
    for (const ladder of set.ladders) {
      const ladderKey = `${ladder.start}_to_${ladder.target}`;
      await recordItemUsage('rungs', ladderKey, set.date, {
        start: ladder.start,
        target: ladder.target,
        par: ladder.par,
      });
    }
    await storeDailyPuzzle('rungs', set.date, set.plate, {
      ladders: set.ladders.map((l) => ({ round: l.round, start: l.start, target: l.target, par: l.par })),
    });
  }

  // 3. Sprint anagram keys
  console.log(`[Firebase Sync] Indexing ${VETTED_SPRINT_SETS.length} Sprint anagram keys...`);
  for (const set of VETTED_SPRINT_SETS) {
    await recordItemUsage('sprint', set.keyLetters, set.date, {
      totalWords: set.totalWords,
      maxScore: set.maxScore,
    });
    await storeDailyPuzzle('sprint', set.date, set.plate, {
      keyLetters: set.keyLetters,
      totalWords: set.totalWords,
      maxScore: set.maxScore,
    });
  }

  // 4. Ballpark quantities
  console.log(`[Firebase Sync] Indexing ${BALLPARK_SETS.length} Ballpark daily sets...`);
  for (const set of BALLPARK_SETS) {
    for (const q of set.questions) {
      await recordItemUsage('ballpark', q.question, set.date, {
        unit: q.unit,
        category: q.category,
        difficulty: q.difficulty,
      });
    }
  }

  // 5. PassPhew passwords
  console.log(`[Firebase Sync] Indexing ${PASSPHEW_SETS.length} PassPhew passwords...`);
  for (const p of PASSPHEW_SETS) {
    await recordItemUsage('passphew', p.answer, p.date, {
      username: p.username,
      clue: p.clue,
      type: p.type,
    });
  }

  console.log('[Firebase Sync] All game backlogs synchronized into Firestore with 365-day cooldown records.');
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('sync_firebase.ts')) {
  syncAllBacklogs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Firebase Sync Error]', err);
      process.exit(1);
    });
}
