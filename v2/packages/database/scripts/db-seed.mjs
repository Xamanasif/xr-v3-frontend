#!/usr/bin/env node
// `pnpm --filter @xr/database db:seed` — load the development catalogue seed
// (prisma/seed/catalogue.json, exported from the sample world) into DATABASE_URL (ADR-0013).
//
// Development fixtures only, never production records (STK31-23): refuses to run unless APP_ENV
// is `development` (the default when unset). Replaces every catalogue row in one transaction.
import { readFileSync } from 'node:fs';

import { createPrismaClient, seedCatalogue } from '../dist/index.js';

try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // no root .env — environment variables already set
}

const appEnv = process.env.APP_ENV || 'development';
if (appEnv !== 'development') {
  console.error(`db:seed refused: APP_ENV is "${appEnv}"; the seed is development data only.`);
  process.exit(1);
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('db:seed refused: DATABASE_URL is not set (v2/.env or the shell).');
  process.exit(1);
}

const seed = JSON.parse(readFileSync(new URL('../prisma/seed/catalogue.json', import.meta.url)));
const client = createPrismaClient({ connectionString });
try {
  const result = await seedCatalogue(client, seed);
  console.log(
    `catalogue seeded: ${result.areas} areas, ${result.courses} courses, ` +
      `${result.experiments} experiments (${result.versions} versions), ${result.featured} featured`,
  );
} finally {
  await client.$disconnect();
}
