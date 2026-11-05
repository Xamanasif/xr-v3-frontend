/**
 * Environment configuration schemas for the V2 platform.
 *
 * Four environment concepts exist — development, prototype, staging, production — and every
 * process reads its configuration ONCE at boot through one of these schemas. A
 * malformed environment fails fast with a named list of problems; nothing in V2
 * reads `process.env` ad hoc.
 *
 * `prototype` (owner decision DP-16, 5 Nov 2026; B2B milestone I2) is the isolated prototype
 * profile: the sample stand-ins a local `development` build runs (TE-3, TE-4 by the payer's choice,
 * TE-6, P3-03, P4-01, P5-01) in a build that is never staging or production. `staging` and
 * `production` never run them (`runsSampleStandIns`). A prototype build is served only behind
 * access protection the operator confirms (`./build.ts`); it is never deployed by default.
 *
 * Recorded exception TE-7 (ADR-0007 §2; OPEN_DECISIONS Part E): two public build flags. The
 * data source (`NEXT_PUBLIC_XR_DATA_SOURCE`) is data supplied at boot and lives in the web
 * schema below. The test-hook flag is a build-time switch only: it lives in `./build.ts`
 * (`@xr/config/env/build`), which `apps/web/next.config.ts` alone reads, so its name never
 * reaches a module that ships to the browser.
 */
import { z } from 'zod';

export const APP_ENVIRONMENTS = ['development', 'prototype', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export const appEnvironmentSchema = z.enum(APP_ENVIRONMENTS);

/**
 * The environments whose sample builds run the sample stand-ins (support pages, browser-kept world,
 * Reset, the simulated payment provider): a local developer build and the isolated prototype
 * profile. Never staging or production.
 */
export const SAMPLE_STANDIN_ENVIRONMENTS = ['development', 'prototype'] as const;

/** Whether a sample build of this environment runs the sample stand-ins (DP-16). */
export function runsSampleStandIns(environment: AppEnvironment | undefined): boolean {
  return (SAMPLE_STANDIN_ENVIRONMENTS as readonly string[]).includes(environment ?? 'development');
}

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Shell environments carry `VAR=` for "unset"; treat an empty string as absent. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const optionalPostgresUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^postgres(ql)?:\/\/.+/, 'must be a postgresql:// connection string')
    .optional(),
);

const commaSeparatedList = z
  .preprocess(emptyToUndefined, z.string().optional())
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );

/** Configuration of the platform API process (`apps/api`). */
export const apiEnvSchema = z.object({
  APP_ENV: z.preprocess(emptyToUndefined, appEnvironmentSchema.default('development')),
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum(LOG_LEVELS).default('info')),
  API_HOST: z.preprocess(emptyToUndefined, z.string().default('0.0.0.0')),
  API_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).default(4000)),
  API_PUBLIC_URL: optionalUrl,
  CORS_ALLOWED_ORIGINS: commaSeparatedList,
  DATABASE_URL: optionalPostgresUrl,
  OIDC_ISSUER_URL: optionalUrl,
  OIDC_AUDIENCE: optionalString,
  OBJECT_STORAGE_ENDPOINT: optionalUrl,
  OBJECT_STORAGE_BUCKET: optionalString,
  OBJECT_STORAGE_ACCESS_KEY_ID: optionalString,
  OBJECT_STORAGE_SECRET_ACCESS_KEY: optionalString,
});
export type ApiEnv = z.output<typeof apiEnvSchema>;

/**
 * Where the web application's service ports come from (TE-7; ADR-0002, ADR-0007 §2):
 * `sample` — the in-browser sample world of `@xr/sample-platform` (ADR-0004 option A);
 * `api` — the future HTTP adapter over `apps/api` (Appendix F §3.2 `platform/http/`, not built).
 * Unset means `sample`, the only adapter that exists. Any other value is refused, and `api` is
 * never replaced by `sample` when it cannot run: the composition root refuses it instead.
 */
export const DATA_SOURCES = ['sample', 'api'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];
export const dataSourceSchema = z.preprocess(
  emptyToUndefined,
  z.enum(DATA_SOURCES).default('sample'),
);

/**
 * Browser-visible configuration of the web application (`apps/web`).
 * Next.js inlines `NEXT_PUBLIC_*` at build time, so the caller must pass each
 * variable as a literal `process.env.NEXT_PUBLIC_…` expression.
 */
export const webPublicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.url().default('http://localhost:4000'),
  ),
  NEXT_PUBLIC_APP_ENV: z.preprocess(emptyToUndefined, appEnvironmentSchema.default('development')),
  NEXT_PUBLIC_XR_DATA_SOURCE: dataSourceSchema,
});
export type WebPublicEnv = z.output<typeof webPublicEnvSchema>;

export class EnvironmentValidationError extends Error {
  override readonly name = 'EnvironmentValidationError';
  constructor(readonly issues: readonly string[]) {
    super(`Invalid environment configuration:\n  - ${issues.join('\n  - ')}`);
  }
}

/** Parse an environment source with a schema, or throw a readable error. */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  source: Record<string, string | undefined>,
): z.output<TSchema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvironmentValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  return result.data as z.output<TSchema>;
}
