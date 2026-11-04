/**
 * `@xr/database/testing` — database-backed tests on a throw-away PostgreSQL schema.
 *
 * `createMigratedSchema` makes a fresh schema in the configured database and applies every
 * committed migration to it, in order, exactly as written (hand-written CHECK constraints
 * included), so a test never touches the developer's data in `public` and always runs against the
 * migrations that ship. `drop()` removes the schema and everything in it.
 */
import { readdirSync, readFileSync } from 'node:fs';

import pg from 'pg';

import type { CatalogueSeed } from '../catalogue-seed.js';

const MIGRATIONS = new URL('../../prisma/migrations/', import.meta.url);
const CATALOGUE_SEED = new URL('../../prisma/seed/catalogue.json', import.meta.url);

/** The committed development catalogue seed (the sample world's catalogue; ADR-0013). */
export function developmentCatalogueSeed(): CatalogueSeed {
  return JSON.parse(readFileSync(CATALOGUE_SEED, 'utf8')) as CatalogueSeed;
}

export interface MigratedSchema {
  /** The schema name, for `createPrismaClient({ connectionString, schema })`. */
  readonly schema: string;
  readonly migrations: readonly string[];
  drop(): Promise<void>;
}

/** The committed migration folders, oldest first. */
export function committedMigrations(): readonly string[] {
  return readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function createMigratedSchema(
  connectionString: string,
  prefix = 'xr_test',
): Promise<MigratedSchema> {
  const schema = `${prefix}_${process.pid}_${Date.now().toString(36)}`;
  const migrations = committedMigrations();
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5_000 });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    for (const name of migrations) {
      const sql = readFileSync(new URL(`${name}/migration.sql`, MIGRATIONS), 'utf8');
      // One simple-protocol query per migration: the statements run in the new schema only.
      await client.query(`SET search_path TO "${schema}";\n${sql}`);
    }
  } catch (error) {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
  return {
    schema,
    migrations,
    drop: async () => {
      const dropper = new pg.Client({ connectionString, connectionTimeoutMillis: 5_000 });
      await dropper.connect();
      try {
        await dropper.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await dropper.end();
      }
    },
  };
}
