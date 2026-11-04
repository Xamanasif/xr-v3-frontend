import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { ConfigModule, type ConfigModuleOptions } from './config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import type { CatalogueRepository } from './modules/catalogue/catalogue.repository.js';
import { CatalogueModule } from './modules/catalogue/catalogue.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';

export interface AppModuleOptions extends ConfigModuleOptions {
  /** Extra modules composed into the application (integration tests use this). */
  additionalModules?: Array<Type<unknown> | DynamicModule>;
  /** The catalogue store; the D1 tables through Prisma unless given (integration tests use this). */
  catalogueRepository?: CatalogueRepository;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({ env: options.env }),
        DatabaseModule,
        HealthModule,
        CatalogueModule.register({ repository: options.catalogueRepository }),
        AuthModule,
        TenancyModule,
        ...(options.additionalModules ?? []),
      ],
    };
  }
}
