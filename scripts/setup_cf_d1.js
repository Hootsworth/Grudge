// Script to ensure Cloudflare D1 databases exist and update wrangler.toml with real UUIDs in CI
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DATABASES = [
  {
    name: 'strata-db',
    configFile: 'wrangler.toml',
    envVar: process.env.STRATA_DATABASE_ID,
    migrationDir: 'migrations',
  },
  {
    name: 'kin-db',
    configFile: 'kin/wrangler.toml',
    envVar: process.env.KIN_DATABASE_ID,
    migrationDir: 'kin/migrations',
  },
  {
    name: 'passphew-db',
    configFile: 'passphew/wrangler.toml',
    envVar: process.env.PASSPHEW_DATABASE_ID,
    migrationDir: 'passphew/migrations',
  },
  {
    name: 'pinpoint-db',
    configFile: 'pinpoint/wrangler.toml',
    envVar: process.env.PINPOINT_DATABASE_ID,
    migrationDir: 'pinpoint/migrations',
  },
  {
    name: 'ballpark-db',
    configFile: 'ballpark/wrangler.toml',
    envVar: process.env.BALLPARK_DATABASE_ID,
    migrationDir: 'ballpark/migrations',
  },
  {
    name: 'rungs-db',
    configFile: 'rungs/wrangler.toml',
    envVar: process.env.RUNGS_DATABASE_ID,
    migrationDir: 'rungs/migrations',
  },
  {
    name: 'sprint-db',
    configFile: 'sprint/wrangler.toml',
    envVar: process.env.SPRINT_DATABASE_ID,
    migrationDir: 'sprint/migrations',
  },
];

async function main() {
  console.log('[CF D1 SETUP] Checking Cloudflare D1 database bindings...');

  let existingDbs = [];
  try {
    const listOutput = execSync('npx wrangler d1 list --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    existingDbs = JSON.parse(listOutput);
    console.log(`[CF D1 SETUP] Found ${existingDbs.length} existing D1 databases in account.`);
  } catch (err) {
    console.warn('[CF D1 SETUP] Could not list D1 databases via wrangler API. Will rely on environment variables if present.');
  }

  for (const db of DATABASES) {
    const configPath = path.resolve(process.cwd(), db.configFile);
    if (!fs.existsSync(configPath)) {
      console.warn(`[CF D1 SETUP] Config file ${db.configFile} not found, skipping.`);
      continue;
    }

    let uuid = db.envVar;

    // If not provided in environment, look up in existing databases
    if (!uuid && existingDbs.length > 0) {
      const match = existingDbs.find((d) => d.name === db.name);
      if (match && match.uuid) {
        uuid = match.uuid;
        console.log(`[CF D1 SETUP] Found existing database "${db.name}" with ID: ${uuid}`);
      }
    }

    // If still not found, attempt to create it via wrangler
    if (!uuid) {
      console.log(`[CF D1 SETUP] Database "${db.name}" not found. Creating it via wrangler...`);
      try {
        const createOutput = execSync(`npx wrangler d1 create ${db.name} --json`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        const created = JSON.parse(createOutput);
        uuid = created.uuid || created.database_id;
        console.log(`[CF D1 SETUP] Successfully created "${db.name}" with ID: ${uuid}`);
      } catch (createErr) {
        // Fallback: try non-json output regex
        try {
          const rawOutput = execSync(`npx wrangler d1 create ${db.name}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          const match = rawOutput.match(/database_id\s*=\s*["']([^"']+)["']/);
          if (match && match[1]) {
            uuid = match[1];
            console.log(`[CF D1 SETUP] Successfully created "${db.name}" with ID: ${uuid}`);
          }
        } catch (e) {
          console.error(`[CF D1 SETUP] Warning: Failed to auto-create "${db.name}". Error: ${e.message}`);
        }
      }
    }

    // If we have a valid UUID, replace the dummy database_id in the wrangler.toml
    if (uuid && uuid !== 'local-strata-db-id' && uuid !== 'local-kin-db-id' && uuid !== 'local-passphew-db-id' && uuid !== 'local-pinpoint-db-id' && uuid !== 'local-ballpark-db-id' && uuid !== 'local-rungs-db-id' && uuid !== 'local-sprint-db-id') {
      let content = fs.readFileSync(configPath, 'utf-8');
      content = content.replace(/database_id\s*=\s*["'][^"']+["']/, `database_id = "${uuid}"`);
      fs.writeFileSync(configPath, content, 'utf-8');
      console.log(`[CF D1 SETUP] Updated ${db.configFile} with database_id = "${uuid}"`);

      // Apply migrations
      try {
        console.log(`[CF D1 SETUP] Applying remote migrations for ${db.name}...`);
        const workingDir = path.dirname(configPath);
        execSync(`npx wrangler d1 migrations apply ${db.name} --remote`, {
          cwd: workingDir,
          encoding: 'utf-8',
          stdio: 'inherit',
        });
      } catch (migErr) {
        console.warn(`[CF D1 SETUP] Migration apply note for ${db.name}: ${migErr.message}`);
      }
    } else {
      console.warn(`[CF D1 SETUP] Warning: No real database ID could be resolved for "${db.name}".`);
      console.warn(`[CF D1 SETUP] Deployment may fail if database_id is still a placeholder like "local-${db.name}-id".`);
      console.warn(`[CF D1 SETUP] To fix: Run "npx wrangler d1 create ${db.name}" and paste the database_id into ${db.configFile}.`);
    }
  }

  // Resolve KV Namespace for Pinpoint
  const pinpointConfig = path.resolve(process.cwd(), 'pinpoint/wrangler.toml');
  if (fs.existsSync(pinpointConfig)) {
    let kvId = process.env.PINPOINT_KV_ID;
    if (!kvId) {
      try {
        const kvList = execSync('npx wrangler kv namespace list', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        const namespaces = JSON.parse(kvList);
        const match = namespaces.find((n) => n.title && n.title.includes('pinpoint-kv'));
        if (match) kvId = match.id;
      } catch (e) {}
    }
    if (!kvId) {
      try {
        const createOut = execSync('npx wrangler kv namespace create pinpoint-kv', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        const m = createOut.match(/id\s*=\s*["']([^"']+)["']/);
        if (m) kvId = m[1];
      } catch (e) {}
    }
    if (kvId && kvId !== 'local-pinpoint-kv-id') {
      let content = fs.readFileSync(pinpointConfig, 'utf-8');
      content = content.replace(/id\s*=\s*"local-pinpoint-kv-id"/, `id = "${kvId}"`);
      fs.writeFileSync(pinpointConfig, content, 'utf-8');
      console.log(`[CF SETUP] Updated pinpoint/wrangler.toml with kv id = "${kvId}"`);
    }
  }
}

main().catch((err) => {
  console.error('[CF D1 SETUP ERROR]', err);
  process.exit(1);
});
