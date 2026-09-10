import { parseEnv, webPublicEnvSchema } from '@xr/config/env';

/**
 * Browser-visible configuration. Each variable is referenced as a literal
 * `process.env.NEXT_PUBLIC_…` so Next.js can inline it at build time.
 */
export const publicEnv = parseEnv(webPublicEnvSchema, {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
