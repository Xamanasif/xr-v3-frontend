import { Injectable, Logger } from '@nestjs/common';
import type { HealthCheck, HealthQuery, HealthResponse } from '@xr/contracts';

import { ApiConfigService } from '../../config/config.service.js';
import { readPackageVersion } from '../../version.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startedAt = Date.now();

  constructor(
    private readonly config: ApiConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async check(query: HealthQuery): Promise<HealthResponse> {
    const database = await this.databaseCheck(query.database);
    return {
      status: database.status === 'unavailable' ? 'degraded' : 'ok',
      service: 'xr-platform-api',
      version: readPackageVersion(),
      apiVersion: 'v1',
      environment: this.config.appEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      checks: { database },
    };
  }

  /**
   * Skipped when the caller asks for it or when no database is configured — reported
   * honestly, never faked as ok. A failure's underlying reason may name hosts or
   * credentials: it is logged, never published.
   */
  private async databaseCheck(mode: HealthQuery['database']): Promise<HealthCheck> {
    if (mode === 'skip') {
      return { status: 'skipped', detail: 'skipped by request' };
    }
    if (!this.prisma.isConfigured) {
      return { status: 'skipped', detail: 'DATABASE_URL is not set' };
    }
    const result = await this.prisma.probe();
    if (result.ok) {
      return { status: 'ok', latencyMs: result.latencyMs };
    }
    this.logger.warn(`Database probe failed: ${result.detail.replace(/\s+/g, ' ').trim()}`);
    return { status: 'unavailable', detail: 'Database connection failed' };
  }
}
