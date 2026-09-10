import { type DynamicModule, Module, type Type } from '@nestjs/common';

import { ConfigModule, type ConfigModuleOptions } from './config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';

export interface AppModuleOptions extends ConfigModuleOptions {
  /** Extra modules composed into the application (integration tests use this). */
  additionalModules?: Array<Type<unknown> | DynamicModule>;
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
        AuthModule,
        TenancyModule,
        ...(options.additionalModules ?? []),
      ],
    };
  }
}
