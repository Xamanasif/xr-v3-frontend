import { describe, expect, it, vi } from 'vitest';

vi.mock('@xr/database', () => {
  const client = { $disconnect: vi.fn(async () => undefined) };
  return {
    createPrismaClient: vi.fn(() => client),
    probeDatabase: vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, latencyMs: 3 }), 50)),
    ),
  };
});

import { createPrismaClient, probeDatabase } from '@xr/database';

import type { ApiConfigService } from '../../config/config.service.js';
import { DatabaseNotConfiguredError, PrismaService } from './prisma.service.js';

function service(databaseUrl: string | undefined): PrismaService {
  return new PrismaService({ databaseUrl } as ApiConfigService);
}

describe('PrismaService', () => {
  it('rejects a probe when no database is configured, without creating a client', async () => {
    await expect(service(undefined).probe()).rejects.toBeInstanceOf(DatabaseNotConfiguredError);
    expect(createPrismaClient).not.toHaveBeenCalled();
  });

  it('creates the client lazily, once', () => {
    const prisma = service('postgresql://u:p@127.0.0.1:1/db');
    expect(prisma.getClient()).toBe(prisma.getClient());
    expect(createPrismaClient).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent probes into one database round-trip', async () => {
    const prisma = service('postgresql://u:p@127.0.0.1:1/db');
    const calls = (probeDatabase as ReturnType<typeof vi.fn>).mock.calls.length;
    const results = await Promise.all([prisma.probe(), prisma.probe(), prisma.probe()]);
    expect(results).toEqual([
      { ok: true, latencyMs: 3 },
      { ok: true, latencyMs: 3 },
      { ok: true, latencyMs: 3 },
    ]);
    expect((probeDatabase as ReturnType<typeof vi.fn>).mock.calls.length).toBe(calls + 1);
    // A later probe, after the first settled, is a new round-trip.
    await prisma.probe();
    expect((probeDatabase as ReturnType<typeof vi.fn>).mock.calls.length).toBe(calls + 2);
  });
});
