import { Inject, Injectable } from '@nestjs/common';
import type { ApiEnv, AppEnvironment, LogLevel } from '@xr/config/env';

import { API_CONFIG } from './config.tokens.js';

/** Browser origins allowed by default in development when none are configured. */
const DEVELOPMENT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

@Injectable()
export class ApiConfigService {
  constructor(@Inject(API_CONFIG) private readonly env: ApiEnv) {}

  get appEnv(): AppEnvironment {
    return this.env.APP_ENV;
  }

  get isProduction(): boolean {
    return this.env.APP_ENV === 'production';
  }

  get logLevel(): LogLevel {
    return this.env.LOG_LEVEL;
  }

  get host(): string {
    return this.env.API_HOST;
  }

  get port(): number {
    return this.env.API_PORT;
  }

  get publicUrl(): string | undefined {
    return this.env.API_PUBLIC_URL;
  }

  /** `undefined` means "no database configured" — the API still boots. */
  get databaseUrl(): string | undefined {
    return this.env.DATABASE_URL;
  }

  get corsAllowedOrigins(): readonly string[] {
    if (this.env.CORS_ALLOWED_ORIGINS.length > 0) {
      return this.env.CORS_ALLOWED_ORIGINS;
    }
    return this.env.APP_ENV === 'development' ? DEVELOPMENT_ORIGINS : [];
  }

  /** OIDC settings are placeholders until an identity provider is chosen (OPEN_DECISIONS A-01). */
  get oidc(): { readonly issuerUrl?: string; readonly audience?: string } {
    return { issuerUrl: this.env.OIDC_ISSUER_URL, audience: this.env.OIDC_AUDIENCE };
  }
}
