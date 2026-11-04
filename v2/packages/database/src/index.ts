import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';

import { PrismaClient } from './generated/prisma/client.js';

export { PrismaClient } from './generated/prisma/client.js';
export type { Prisma, Technology } from './generated/prisma/client.js';
export {
  type CatalogueSeed,
  type CatalogueSeedResult,
  type SeedDelivery,
  type SeedVersion,
  seedCatalogue,
} from './catalogue-seed.js';

/** Bounds every database operation the foundation performs. All values in milliseconds. */
export const DATABASE_DEFAULTS = {
  /** Abandon a connection attempt that has not completed a handshake. */
  connectTimeoutMs: 5_000,
  /** Abort a query on the client side (`query_timeout`) and ask the server to cancel it (`statement_timeout`). */
  queryTimeoutMs: 10_000,
  /** Release pooled connections that sit idle. */
  idleTimeoutMs: 30_000,
  /** Upper bound on pooled connections per process. */
  maxConnections: 10,
} as const;

export interface DatabaseClientOptions {
  readonly connectionString: string;
  /** PostgreSQL schema; defaults to `public`. */
  readonly schema?: string;
  readonly connectTimeoutMs?: number;
  readonly queryTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
  readonly maxConnections?: number;
}

/**
 * node-postgres pool configuration with every bound applied, so a slow or silent
 * database can never leave a connection attempt or a query pending indefinitely.
 * Pure, so the bounds are unit-tested without a database.
 */
export function buildPoolConfig(options: DatabaseClientOptions): PoolConfig {
  const connectTimeoutMs = options.connectTimeoutMs ?? DATABASE_DEFAULTS.connectTimeoutMs;
  const queryTimeoutMs = options.queryTimeoutMs ?? DATABASE_DEFAULTS.queryTimeoutMs;
  return {
    connectionString: options.connectionString,
    connectionTimeoutMillis: connectTimeoutMs,
    query_timeout: queryTimeoutMs,
    statement_timeout: queryTimeoutMs,
    idleTimeoutMillis: options.idleTimeoutMs ?? DATABASE_DEFAULTS.idleTimeoutMs,
    max: options.maxConnections ?? DATABASE_DEFAULTS.maxConnections,
    allowExitOnIdle: true,
  };
}

/**
 * Create a Prisma client over the node-postgres driver adapter (Prisma 7 requires a
 * driver adapter). The client connects lazily on first use, within the bounds above.
 */
export function createPrismaClient(options: DatabaseClientOptions): PrismaClient {
  const adapter = new PrismaPg(
    buildPoolConfig(options),
    options.schema ? { schema: options.schema } : undefined,
  );
  return new PrismaClient({ adapter });
}

export type DatabaseProbeResult =
  | { readonly ok: true; readonly latencyMs: number }
  | { readonly ok: false; readonly detail: string };

/**
 * Round-trip `SELECT 1`. Bounded by the pool's connection and query timeouts — the
 * driver abandons the underlying work, rather than a timer merely ceasing to wait.
 * Never throws.
 */
export async function probeDatabase(client: PrismaClient): Promise<DatabaseProbeResult> {
  const started = performance.now();
  try {
    await client.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
