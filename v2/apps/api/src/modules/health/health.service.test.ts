import { describe, expect, it } from 'vitest';

import type { ApiConfigService } from '../../config/config.service.js';
import type { PrismaService } from '../database/prisma.service.js';
import { HealthService } from './health.service.js';

const config = { appEnv: 'development' } as ApiConfigService;

function service(prisma: Partial<PrismaService>): HealthService {
  return new HealthService(config, prisma as PrismaService);
}

describe('HealthService', () => {
  it('reports the database as skipped when none is configured', async () => {
    const report = await service({ isConfigured: false }).check({ database: 'probe' });
    expect(report.status).toBe('ok');
    expect(report.checks.database).toEqual({
      status: 'skipped',
      detail: 'DATABASE_URL is not set',
    });
  });

  it('skips the probe on request, even when a database is configured', async () => {
    let probed = false;
    const report = await service({
      isConfigured: true,
      probe: async () => {
        probed = true;
        return { ok: true, latencyMs: 1 };
      },
    }).check({ database: 'skip' });
    expect(probed).toBe(false);
    expect(report.checks.database).toEqual({ status: 'skipped', detail: 'skipped by request' });
  });

  it('reports ok with latency when the probe succeeds', async () => {
    const report = await service({
      isConfigured: true,
      probe: async () => ({ ok: true, latencyMs: 7 }),
    }).check({ database: 'probe' });
    expect(report.checks.database).toEqual({ status: 'ok', latencyMs: 7 });
  });

  it('never publishes the underlying failure reason', async () => {
    const report = await service({
      isConfigured: true,
      probe: async () => ({ ok: false, detail: "Can't reach database server at db.internal:5432" }),
    }).check({ database: 'probe' });
    expect(report.status).toBe('degraded');
    expect(report.checks.database.status).toBe('unavailable');
    expect(JSON.stringify(report)).not.toContain('db.internal');
  });
});
