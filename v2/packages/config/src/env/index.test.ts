import { describe, expect, it } from 'vitest';

import { webBuildFlagsSchema, webResponseHeaders } from './build.js';
import {
  APP_ENVIRONMENTS,
  DATA_SOURCES,
  EnvironmentValidationError,
  apiEnvSchema,
  parseEnv,
  runsSampleStandIns,
  webPublicEnvSchema,
} from './index.js';

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

  it('keeps its existing validation of the API base url and the environment concept', () => {
    expect(() => parseEnv(webPublicEnvSchema, { NEXT_PUBLIC_API_BASE_URL: 'not a url' })).toThrow(
      EnvironmentValidationError,
    );
    expect(() => parseEnv(webPublicEnvSchema, { NEXT_PUBLIC_APP_ENV: 'qa' })).toThrow(
      EnvironmentValidationError,
    );
  });

  // TE-7 (ADR-0007 §2): the data source is data supplied at boot.
  it.each([
    [undefined, 'sample'],
    ['', 'sample'],
    ['  ', 'sample'],
    ['sample', 'sample'],
    ['api', 'api'],
  ])('reads NEXT_PUBLIC_XR_DATA_SOURCE=%j as %s', (value, expected) => {
    expect(
      parseEnv(webPublicEnvSchema, { NEXT_PUBLIC_XR_DATA_SOURCE: value })
        .NEXT_PUBLIC_XR_DATA_SOURCE,
    ).toBe(expected);
  });

  it.each(['mock', 'SAMPLE', 'Api', 'http', 'sample,api', '1'])(
    'refuses NEXT_PUBLIC_XR_DATA_SOURCE=%j and names the variable',
    (value) => {
      try {
        parseEnv(webPublicEnvSchema, { NEXT_PUBLIC_XR_DATA_SOURCE: value });
        expect.unreachable(`${value} was accepted`);
      } catch (error) {
        expect(error).toBeInstanceOf(EnvironmentValidationError);
        expect((error as EnvironmentValidationError).issues[0]).toMatch(
          /^NEXT_PUBLIC_XR_DATA_SOURCE:/,
        );
      }
    },
  );

  it('never carries the build-time test-hook flag (it would ship to the browser)', () => {
    expect(Object.keys(webPublicEnvSchema.shape)).toEqual([
      'NEXT_PUBLIC_API_BASE_URL',
      'NEXT_PUBLIC_APP_ENV',
      'NEXT_PUBLIC_XR_DATA_SOURCE',
    ]);
    expect(DATA_SOURCES).toEqual(['sample', 'api']);
  });
});

describe('webBuildFlagsSchema (read by apps/web/next.config.ts only)', () => {
  it.each([
    [{}, false],
    [{ NEXT_PUBLIC_XR_TEST_HOOKS: '' }, false],
    [{ NEXT_PUBLIC_XR_TEST_HOOKS: '1' }, true],
    [{ NEXT_PUBLIC_XR_TEST_HOOKS: '1', NEXT_PUBLIC_XR_DATA_SOURCE: 'sample' }, true],
  ])('reads %j as test hooks = %s', (source, expected) => {
    const flags = parseEnv(webBuildFlagsSchema, source);
    expect(flags.NEXT_PUBLIC_XR_TEST_HOOKS).toBe(expected);
    expect(flags.NEXT_PUBLIC_XR_DATA_SOURCE).toBe('sample');
  });

  it.each(['0', 'true', 'TRUE', 'yes', 'on', '2', ' 1x'])(
    'refuses NEXT_PUBLIC_XR_TEST_HOOKS=%j instead of reading it as "off"',
    (value) => {
      try {
        parseEnv(webBuildFlagsSchema, { NEXT_PUBLIC_XR_TEST_HOOKS: value });
        expect.unreachable(`${value} was accepted`);
      } catch (error) {
        expect(error).toBeInstanceOf(EnvironmentValidationError);
        expect((error as EnvironmentValidationError).issues).toEqual([
          'NEXT_PUBLIC_XR_TEST_HOOKS: must be 1 (CI/Playwright builds only) or unset',
        ]);
      }
    },
  );

  it('refuses the test hooks with the api data source (they drive the sample world)', () => {
    expect(() =>
      parseEnv(webBuildFlagsSchema, {
        NEXT_PUBLIC_XR_TEST_HOOKS: '1',
        NEXT_PUBLIC_XR_DATA_SOURCE: 'api',
      }),
    ).toThrow(/NEXT_PUBLIC_XR_TEST_HOOKS: the test hooks drive the sample world/);
    expect(
      parseEnv(webBuildFlagsSchema, { NEXT_PUBLIC_XR_DATA_SOURCE: 'api' })
        .NEXT_PUBLIC_XR_TEST_HOOKS,
    ).toBe(false);
  });

  it('validates the data source with the same rule as the runtime schema', () => {
    expect(() => parseEnv(webBuildFlagsSchema, { NEXT_PUBLIC_XR_DATA_SOURCE: 'mock' })).toThrow(
      /^Invalid environment configuration:\n {2}- NEXT_PUBLIC_XR_DATA_SOURCE:/,
    );
  });
});

describe('the isolated prototype profile (DP-16; B2B milestone I2)', () => {
  it('is a fourth environment concept, accepted by the API and web schemas', () => {
    expect(APP_ENVIRONMENTS).toEqual(['development', 'prototype', 'staging', 'production']);
    expect(parseEnv(apiEnvSchema, { APP_ENV: 'prototype' }).APP_ENV).toBe('prototype');
    expect(
      parseEnv(webPublicEnvSchema, { NEXT_PUBLIC_APP_ENV: 'prototype' }).NEXT_PUBLIC_APP_ENV,
    ).toBe('prototype');
  });

  it('runs the sample stand-ins in development and prototype only — never staging or production', () => {
    expect(runsSampleStandIns(undefined)).toBe(true);
    expect(runsSampleStandIns('development')).toBe(true);
    expect(runsSampleStandIns('prototype')).toBe(true);
    expect(runsSampleStandIns('staging')).toBe(false);
    expect(runsSampleStandIns('production')).toBe(false);
  });

  it.each(['prototype', 'staging', 'production'])(
    'a %s sample build fails unless the operator confirms access protection (TE-8)',
    (environment) => {
      expect(() => parseEnv(webBuildFlagsSchema, { NEXT_PUBLIC_APP_ENV: environment })).toThrow(
        /XR_SAMPLE_ACCESS_PROTECTED: a \w+ build of the sample world accepts any password/,
      );
      const flags = parseEnv(webBuildFlagsSchema, {
        NEXT_PUBLIC_APP_ENV: environment,
        XR_SAMPLE_ACCESS_PROTECTED: '1',
      });
      expect(flags.NEXT_PUBLIC_APP_ENV).toBe(environment);
      expect(flags.XR_SAMPLE_ACCESS_PROTECTED).toBe(true);
    },
  );

  it('a local development build needs no confirmation', () => {
    expect(parseEnv(webBuildFlagsSchema, {}).XR_SAMPLE_ACCESS_PROTECTED).toBe(false);
  });

  it.each(['0', 'true', 'yes'])(
    'refuses XR_SAMPLE_ACCESS_PROTECTED=%j instead of reading it as "off"',
    (value) => {
      expect(() =>
        parseEnv(webBuildFlagsSchema, {
          NEXT_PUBLIC_APP_ENV: 'prototype',
          XR_SAMPLE_ACCESS_PROTECTED: value,
        }),
      ).toThrow(/XR_SAMPLE_ACCESS_PROTECTED: must be 1/);
    },
  );

  it.each(['prototype', 'staging', 'production'])(
    'never carries the test hooks in a %s build (ADR-0007 §2)',
    (environment) => {
      expect(() =>
        parseEnv(webBuildFlagsSchema, {
          NEXT_PUBLIC_APP_ENV: environment,
          NEXT_PUBLIC_XR_TEST_HOOKS: '1',
          XR_SAMPLE_ACCESS_PROTECTED: '1',
        }),
      ).toThrow(
        /NEXT_PUBLIC_XR_TEST_HOOKS: the test hooks are for local CI\/Playwright builds only/,
      );
    },
  );

  it('asks search engines not to index anything but a local development build', () => {
    expect(webResponseHeaders({ NEXT_PUBLIC_APP_ENV: 'development' })).toEqual([]);
    for (const environment of ['prototype', 'staging', 'production'] as const) {
      expect(webResponseHeaders({ NEXT_PUBLIC_APP_ENV: environment })).toEqual([
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      ]);
    }
  });
});
