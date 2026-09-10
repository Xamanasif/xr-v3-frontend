/**
 * Environment configuration schemas for the V2 platform.
 *
 * Three environment concepts exist — development, staging, production — and every
 * process reads its configuration ONCE at boot through one of these schemas. A
 * malformed environment fails fast with a named list of problems; nothing in V2
 * reads `process.env` ad hoc, and there are no prototype flags.
 */
import { z } from 'zod';

export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export const appEnvironmentSchema = z.enum(APP_ENVIRONMENTS);

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
