import { type DynamicModule, Global, Module } from '@nestjs/common';
import { apiEnvSchema, parseEnv } from '@xr/config/env';

import { ApiConfigService } from './config.service.js';
import { API_CONFIG } from './config.tokens.js';

export interface ConfigModuleOptions {
  /** Environment source; defaults to `process.env`. Tests pass an explicit object. */
  env?: Record<string, string | undefined>;
}

/**
 * Configuration foundation: the environment is parsed ONCE, here, through the Zod
 * schema shared with the rest of the workspace. A malformed environment throws before
 * any module initialises, listing every problem by variable name.
 */
@Global()
@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    const env = parseEnv(apiEnvSchema, options.env ?? process.env);
    return {
      module: ConfigModule,
      providers: [{ provide: API_CONFIG, useValue: env }, ApiConfigService],
      exports: [API_CONFIG, ApiConfigService],
    };
  }
}
