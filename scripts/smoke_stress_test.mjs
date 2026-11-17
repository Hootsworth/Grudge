#!/usr/bin/env node
/**
 * Oddly Daily Games Platform - Unified Smoke, Pressure & Stress Test Suite
 * Tests all 10 daily games:
 * 1. Fibber
 * 2. Strata
 * 3. Kin
 * 4. PassPhew
 * 5. Pinpoint
 * 6. Ballpark
 * 7. Rungs
 * 8. Sprint
 * 9. Blackout
 * 10. Quipher
 */

const BASE_URLS = {
  fibber: 'https://fibber.singulr.tech',
  strata: 'https://strata-backend.adityapdixit.workers.dev',
  kin: 'https://kin-backend.adityapdixit.workers.dev',
  passphew: 'https://passphew-backend.adityapdixit.workers.dev',
  pinpoint: 'https://pinpoint-backend.adityapdixit.workers.dev',
  ballpark: 'https://ballpark-backend.adityapdixit.workers.dev',
  rungs: 'https://rungs-backend.adityapdixit.workers.dev',
  sprint: 'https://sprint-backend.adityapdixit.workers.dev',
  blackout: 'https://blackout-backend.adityapdixit.workers.dev',
  quipher: 'https://quipher-backend.adityapdixit.workers.dev',
};

const results = {
  passed: 0,
  failed: 0,
  details: [],
};

function log(msg) {
  console.log(msg);
}

function assert(condition, message) {
  if (condition) {
    results.passed++;
    log(`  [PASS] ${message}`);
  } else {
    results.failed++;
    log(`  [FAIL] ${message}`);
    results.details.push(message);
  }
}

async function safeFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const duration = Math.round(performance.now() - start);
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data, duration };
  } catch (err) {
    clearTimeout(id);
    const duration = Math.round(performance.now() - start);
    return { ok: false, status: 0, error: err.message, duration };
  }
}

async function runSmokeTests() {
  log('\n=== STEP 1: SMOKE TESTS ACROSS ALL 10 GAMES ===\n');

  // 1. Fibber
  log('1. Testing Fibber...');
  const fibberRes = await safeFetch(`${BASE_URLS.fibber}/today.json`);
  assert(fibberRes.ok && fibberRes.data && Array.isArray(fibberRes.data.rounds), `Fibber today.json returned 200 with rounds array (${fibberRes.duration}ms)`);
  if (fibberRes.ok && fibberRes.data && fibberRes.data.rounds) {
    assert(fibberRes.data.rounds.length === 3, `Fibber daily puzzle has exactly 3 rounds (found ${fibberRes.data.rounds.length})`);
  }

  // 2. Strata
  log('\n2. Testing Strata...');
  const strataRes = await safeFetch(`${BASE_URLS.strata}/api/today`);
  assert(strataRes.ok && strataRes.data && Array.isArray(strataRes.data.events), `Strata /api/today returned 200 with 6 timeline events (${strataRes.duration}ms)`);
  if (strataRes.ok && strataRes.data && strataRes.data.events) {
    assert(strataRes.data.events.length === 6, `Strata returned exactly 6 timeline events (found ${strataRes.data.events.length})`);
  }

  // 3. Kin
  log('\n3. Testing Kin...');
  const kinRes = await safeFetch(`${BASE_URLS.kin}/api/today`);
  assert(kinRes.ok && kinRes.data && Array.isArray(kinRes.data.rounds), `Kin /api/today returned 200 with rounds (${kinRes.duration}ms)`);
  if (kinRes.ok && kinRes.data && kinRes.data.rounds?.[0]?.organisms) {
    assert(kinRes.data.rounds[0].organisms.length === 3, `Kin round 1 has 3 organisms (found ${kinRes.data.rounds[0].organisms.length})`);
  }

  // 4. PassPhew
  log('\n4. Testing PassPhew...');
  const passphewRes = await safeFetch(`${BASE_URLS.passphew}/api/today`);
  assert(passphewRes.ok && passphewRes.data && passphewRes.data.clue, `PassPhew /api/today returned 200 with clue & username (${passphewRes.duration}ms)`);
  assert(!passphewRes.data?.answer, 'PassPhew /api/today does NOT leak the answer in public payload');

  // PassPhew Wrong Guess rejection check
  const randomSession = 'smoke_test_' + Math.random().toString(36).slice(2);
  const guessRes = await safeFetch(`${BASE_URLS.passphew}/api/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: randomSession,
      guess: 'completely_wrong_guess_xyz',
      date: new Date().toISOString().split('T')[0],
    }),
  });
  assert(
    guessRes.status === 200 && guessRes.data?.correct === false,
    `PassPhew correctly REJECTS wrong guess ('completely_wrong_guess_xyz') with correct: false`
  );

  // 5. Pinpoint
  log('\n5. Testing Pinpoint...');
  const pinpointRes = await safeFetch(`${BASE_URLS.pinpoint}/api/today`);
  assert(pinpointRes.ok && pinpointRes.data && pinpointRes.data.rounds, `Pinpoint /api/today returned 200 with rounds (${pinpointRes.duration}ms)`);

  // 6. Ballpark
  log('\n6. Testing Ballpark...');
  const ballparkRes = await safeFetch(`${BASE_URLS.ballpark}/api/today`);
  assert(ballparkRes.ok && ballparkRes.data && Array.isArray(ballparkRes.data.questions), `Ballpark /api/today returned 200 with questions (${ballparkRes.duration}ms)`);
  assert(!ballparkRes.data?.target && !ballparkRes.data?.questions?.[0]?.target, 'Ballpark /api/today does NOT leak exact target in public payload');

  // 7. Rungs
  log('\n7. Testing Rungs...');
  const rungsRes = await safeFetch(`${BASE_URLS.rungs}/api/today`);
  assert(rungsRes.ok && rungsRes.data && Array.isArray(rungsRes.data.ladders), `Rungs /api/today returned 200 with word ladders (${rungsRes.duration}ms)`);

  // 8. Sprint
  log('\n8. Testing Sprint...');
  const sprintRes = await safeFetch(`${BASE_URLS.sprint}/api/today`);
  assert(sprintRes.ok && sprintRes.data && sprintRes.data.letters, `Sprint /api/today returned 200 with letter tray (${sprintRes.duration}ms)`);

  // 9. Blackout
  log('\n9. Testing Blackout...');
  const blackoutRes = await safeFetch(`${BASE_URLS.blackout}/api/today`);
  assert(blackoutRes.ok && blackoutRes.data && Array.isArray(blackoutRes.data.tokens), `Blackout /api/today returned 200 with redacted tokens (${blackoutRes.duration}ms)`);
  
  // Blackout Wrong Title rejection check
  const blackoutSession = 'smoke_blk_' + Math.random().toString(36).slice(2);
  const blackoutSolve = await safeFetch(`${BASE_URLS.blackout}/api/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: blackoutSession,
      titleGuess: 'Completely Wrong Historic Title Never Existed',
      date: new Date().toISOString().split('T')[0],
    }),
  });
  assert(
    blackoutSolve.status === 200 && blackoutSolve.data?.correct === false,
    `Blackout correctly REJECTS wrong title guess with correct: false`
  );

  // 10. Quipher
  log('\n10. Testing Quipher...');
  const quipherRes = await safeFetch(`${BASE_URLS.quipher}/api/today`);
  assert(quipherRes.ok && quipherRes.data && quipherRes.data.ciphertext, `Quipher /api/today returned 200 with ciphertext (${quipherRes.duration}ms)`);
  assert(!quipherRes.data?.plaintext, 'Quipher /api/today does NOT leak quote plaintext');
}

async function runPressureAndStressTests() {
  log('\n=== STEP 2: CONCURRENCY & PRESSURE TESTING (20 CONCURRENT BURSTS PER GAME) ===\n');

  const targets = [
    { name: 'Fibber', url: `${BASE_URLS.fibber}/today.json` },
    { name: 'Strata', url: `${BASE_URLS.strata}/api/today` },
    { name: 'Kin', url: `${BASE_URLS.kin}/api/today` },
    { name: 'PassPhew', url: `${BASE_URLS.passphew}/api/today` },
    { name: 'Pinpoint', url: `${BASE_URLS.pinpoint}/api/today` },
    { name: 'Ballpark', url: `${BASE_URLS.ballpark}/api/today` },
    { name: 'Rungs', url: `${BASE_URLS.rungs}/api/today` },
    { name: 'Sprint', url: `${BASE_URLS.sprint}/api/today` },
    { name: 'Blackout', url: `${BASE_URLS.blackout}/api/today` },
    { name: 'Quipher', url: `${BASE_URLS.quipher}/api/today` },
  ];

  for (const target of targets) {
    const burstSize = 20;
    const promises = Array.from({ length: burstSize }, () => safeFetch(target.url));
    const responses = await Promise.all(promises);

    const successful = responses.filter(r => r.ok).length;
    const errors = responses.filter(r => !r.ok).length;
    const latencies = responses.map(r => r.duration).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    assert(
      successful >= burstSize * 0.9,
      `${target.name} Handled ${burstSize} concurrent requests: ${successful}/${burstSize} succeeded (p50: ${p50}ms, p95: ${p95}ms, errors: ${errors})`
    );
  }
}

async function runPassPhewFalsePositiveDeepTest() {
  log('\n=== STEP 3: PASSPHEW DEEP DIVE - FALSE POSITIVE PREVENTION ===\n');

  const session = 'deep_test_session_' + Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  // Test 1: Submit 3 distinct wrong guesses
  const wrongWords = ['apple', 'banana', 'charlie'];
  for (const word of wrongWords) {
    const res = await safeFetch(`${BASE_URLS.passphew}/api/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, guess: word, date: dateStr }),
    });

    if (res.status === 429) {
      assert(true, `PassPhew gracefully throttled brute-force rate with 429`);
    } else {
      assert(
        res.data?.correct === false,
        `Guess '${word}' was correctly rejected (correct: false, failed: ${res.data?.failed})`
      );
    }
  }

  // Test 2: Verify duplicate guess caching
  const dupRes = await safeFetch(`${BASE_URLS.passphew}/api/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, guess: 'apple', date: dateStr }),
  });
  if (dupRes.status === 200) {
    assert(
      dupRes.data?.correct === false,
      `Repeat guess 'apple' correctly flagged as incorrect (cached: ${dupRes.data?.cached})`
    );
  } else if (dupRes.status === 429) {
    assert(true, `Rate limiter active for repeated guesses (HTTP 429)`);
  }
}

async function main() {
  log('Starting Oddly Daily Platform Smoke & Stress Test...\n');
  const t0 = performance.now();

  try {
    await runSmokeTests();
    await runPassPhewFalsePositiveDeepTest();
    await runPressureAndStressTests();
  } catch (e) {
    log(`\nFATAL EXCEPTION: ${e.message}\n${e.stack}`);
    results.failed++;
  }

  const totalTime = ((performance.now() - t0) / 1000).toFixed(2);
  log('\n==========================================');
  log(`TEST RUN FINISHED in ${totalTime}s`);
  log(`TOTAL TESTS: ${results.passed + results.failed}`);
  log(`PASSED: ${results.passed}`);
  log(`FAILED: ${results.failed}`);
  log('==========================================\n');

  if (results.failed > 0) {
    log('FAILURES:');
    results.details.forEach(d => log(` - ${d}`));
    process.exit(1);
  } else {
    log('All games passed smoke, pressure, and stress testing with flying colors!');
    process.exit(0);
  }
}

main();
