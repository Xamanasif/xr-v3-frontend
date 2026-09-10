import { z } from 'zod';

import { wireSchema } from './openapi.js';

export const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

/** Query of `GET /api/v1/health`. `skip` turns the call into a cheap liveness poll. */
export const HEALTH_DATABASE_MODES = ['probe', 'skip'] as const;

export const healthQuerySchema = wireSchema(
  z.object({
    database: z
      .enum(HEALTH_DATABASE_MODES)
      .default('probe')
      .describe(
        "Whether to probe the database ('probe', the default) or report it as skipped ('skip').",
      ),
  }),
  'input',
);
export type HealthQueryInput = z.input<typeof healthQuerySchema>;
export type HealthQuery = z.output<typeof healthQuerySchema>;

/** One dependency check. `skipped` means "not checked" — never faked as `ok`. */
export const healthCheckSchema = z.object({
  status: z.enum(['ok', 'skipped', 'unavailable']),
  detail: z.string().optional(),
  latencyMs: z.number().int().nonnegative().optional(),
});
export type HealthCheck = z.infer<typeof healthCheckSchema>;

export const healthResponseSchema = wireSchema(
  z.object({
    status: z.enum(['ok', 'degraded']),
    service: z.literal('xr-platform-api'),
    version: z.string(),
    apiVersion: z.literal('v1'),
    environment: z.enum(ENVIRONMENTS),
    timestamp: z.iso.datetime().describe('Server time of the report, RFC 3339 UTC'),
    uptimeSeconds: z.number().int().nonnegative(),
    checks: z.object({
      database: healthCheckSchema,
    }),
  }),
  'output',
);
export type HealthResponse = z.infer<typeof healthResponseSchema>;
