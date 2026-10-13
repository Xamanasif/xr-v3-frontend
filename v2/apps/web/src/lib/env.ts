import { parseEnv, webPublicEnvSchema } from '@xr/config/env';

/**
 * Browser-visible configuration. Each variable is referenced as a literal
 * `process.env.NEXT_PUBLIC_…` so Next.js can inline it at build time.
 *
 * The test-hook build flag is deliberately absent: it is a build-time switch read only by
 * next.config.ts (TE-7; Appendix F §3.8), so this runtime object never includes or excludes
 * test code and the flag's name never reaches a browser bundle.
 */
export const publicEnv = parseEnv(webPublicEnvSchema, {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_XR_DATA_SOURCE: process.env.NEXT_PUBLIC_XR_DATA_SOURCE,
});
