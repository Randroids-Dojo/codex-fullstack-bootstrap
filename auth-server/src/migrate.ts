/**
 * Simple Kysely migration runner so we can execute migrations from a script
 * or at server start-up.
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { FileMigrationProvider, Migrator } from 'kysely';

import { createDb } from './kysely.js';
import { env } from './env.js';

async function run() {
  const db = createDb(env.DATABASE_URL);

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(path.dirname(new URL(import.meta.url).pathname), 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((r) => {
    if (r.status === 'Success') {
      console.log(`✅ Migration ${r.migrationName} executed`);
    } else if (r.status === 'Error') {
      console.error(`❌ Migration ${r.migrationName} failed`);
    } else {
      console.log(`↷ Migration ${r.migrationName} skipped`);
    }
  });

  if (error) {
    console.error('Failed to migrate', error);
    process.exit(1);
  }

  await db.destroy();
}

// When run via `node dist/migrate.js` execute immediately.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
