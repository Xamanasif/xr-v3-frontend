import { describe, expect, it } from 'vitest';

import { EnvironmentValidationError, apiEnvSchema, parseEnv, webPublicEnvSchema } from './index.js';

describe('apiEnvSchema', () => {
  it('applies development defaults to an empty environment', () => {
    const env = parseEnv(apiEnvSchema, {});
    expect(env.APP_ENV).toBe('development');
    expect(env.API_PORT).toBe(4000);
    expect(env.API_HOST).toBe('0.0.0.0');
    expect(env.CORS_ALLOWED_ORIGINS).toEqual([]);
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it('treats empty strings as unset and splits origin lists', () => {
    const env = parseEnv(apiEnvSchema, {
      DATABASE_URL: '',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000, https://staging.example',
      API_PORT: '4100',
    });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['http://localhost:3000', 'https://staging.example']);
    expect(env.API_PORT).toBe(4100);
  });

  it('refuses an unknown environment concept and names the variable', () => {
    expect(() => parseEnv(apiEnvSchema, { APP_ENV: 'qa' })).toThrowError(
      EnvironmentValidationError,
    );
    try {
      parseEnv(apiEnvSchema, { APP_ENV: 'qa', API_PORT: '99999' });
    } catch (error) {
      const failure = error as EnvironmentValidationError;
      expect(failure.issues.some((issue) => issue.startsWith('APP_ENV:'))).toBe(true);
      expect(failure.issues.some((issue) => issue.startsWith('API_PORT:'))).toBe(true);
    }
  });

  it('refuses a non-postgres database url', () => {
    expect(() => parseEnv(apiEnvSchema, { DATABASE_URL: 'mysql://x' })).toThrowError(
      EnvironmentValidationError,
    );
  });
});

describe('webPublicEnvSchema', () => {
  it('defaults the API base url', () => {
    expect(parseEnv(webPublicEnvSchema, {}).NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:4000');
  });
});
