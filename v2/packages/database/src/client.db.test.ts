/**
 * Database-backed check. Runs only through `pnpm test:db` (never cached by Turbo) and
 * requires a reachable PostgreSQL in DATABASE_URL — see docs/PHASE0_VERIFICATION.md.
 */
import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, probeDatabase } from './index.js';

const databaseUrl = process.env['DATABASE_URL'];
const clients: ReturnType<typeof createPrismaClient>[] = [];

afterAll(async () => {
  await Promise.all(clients.map((client) => client.$disconnect().catch(() => undefined)));
});

describe.skipIf(!databaseUrl)('probeDatabase against the configured database', () => {
  it('reports ok with a latency', async () => {
    const client = createPrismaClient({ connectionString: databaseUrl as string });
    clients.push(client);
    const result = await probeDatabase(client);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

if (!databaseUrl) {
  it('is skipped: DATABASE_URL is not set', () => {
    expect(databaseUrl).toBeUndefined();
  });
}
