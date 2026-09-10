import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import {
  type DatabaseProbeResult,
  type PrismaClient,
  createPrismaClient,
  probeDatabase,
} from '@xr/database';

import { ApiConfigService } from '../../config/config.service.js';

export class DatabaseNotConfiguredError extends Error {
  override readonly name = 'DatabaseNotConfiguredError';
  constructor() {
    super('DATABASE_URL is not set; the database is not configured for this process.');
  }
}

/**
 * Lazy Prisma access. The API boots without a database; the client is created on
 * first use and connects on first query, within the pool's bounded timeouts
 * (`@xr/database` `DATABASE_DEFAULTS`).
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private client: PrismaClient | null = null;
  private inflightProbe: Promise<DatabaseProbeResult> | null = null;

  constructor(private readonly config: ApiConfigService) {}

  get isConfigured(): boolean {
    return this.config.databaseUrl !== undefined;
  }

  getClient(): PrismaClient {
    const connectionString = this.config.databaseUrl;
    if (connectionString === undefined) {
      throw new DatabaseNotConfiguredError();
    }
    this.client ??= createPrismaClient({ connectionString });
    return this.client;
  }

  /**
   * Readiness probe, single-flight: concurrent callers share ONE bounded round-trip,
   * so repeated health polling can never accumulate pending database work.
   */
  probe(): Promise<DatabaseProbeResult> {
    if (!this.isConfigured) {
      return Promise.reject(new DatabaseNotConfiguredError());
    }
    this.inflightProbe ??= probeDatabase(this.getClient()).finally(() => {
      this.inflightProbe = null;
    });
    return this.inflightProbe;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}
