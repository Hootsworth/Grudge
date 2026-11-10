// Resilient Cloudflare Workers deployment runner with automatic retry
import { execSync } from 'node:child_process';
import path from 'node:path';

const WORKERS = [
  { name: 'strata-backend', dir: '.' },
  { name: 'kin-backend', dir: 'kin' },
  { name: 'passphew-backend', dir: 'passphew' },
  { name: 'pinpoint-backend', dir: 'pinpoint' },
  { name: 'ballpark-backend', dir: 'ballpark' },
  { name: 'rungs-backend', dir: 'rungs' },
  { name: 'sprint-backend', dir: 'sprint' },
  { name: 'blackout-backend', dir: 'blackout' },
  { name: 'quipher-backend', dir: 'quipher' },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployWorker(worker) {
  const maxAttempts = 3;
  let delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n============================================================`);
      console.log(`[DEPLOY] Deploying ${worker.name} (attempt ${attempt}/${maxAttempts})...`);
      console.log(`============================================================`);

      execSync('npx wrangler deploy', {
        cwd: path.resolve(process.cwd(), worker.dir),
        stdio: 'inherit',
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
          CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        },
      });

      console.log(`[DEPLOY] ✓ ${worker.name} deployed successfully.`);
      return;
    } catch (err) {
      console.warn(`[DEPLOY] Warning: Attempt ${attempt} failed for ${worker.name}.`);
      if (attempt < maxAttempts) {
        console.log(`[DEPLOY] Retrying in ${delayMs / 1000}s (handling transient Cloudflare 502/504 errors)...`);
        await sleep(delayMs);
        delayMs *= 2;
      } else {
        throw new Error(`Deployment failed for ${worker.name} after ${maxAttempts} attempts: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('[DEPLOY] Starting automated deployment for all 8 Cloudflare Workers...');
  for (const worker of WORKERS) {
    await deployWorker(worker);
  }
  console.log('\n[DEPLOY] ✓ All 8 Cloudflare Workers successfully deployed and verified!');
}

main().catch((err) => {
  console.error('\n[DEPLOY ERROR]', err.message);
  process.exit(1);
});
