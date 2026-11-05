import { runsSampleStandIns, type WebPublicEnv } from '@xr/config/env';

import { publicEnv } from '@/lib/env';

/**
 * Whether a build serves the prototype support pages (owner authorisation of Phase 7, 17 Oct
 * 2026): "Reset demo data", the sample WEB activity, and the simulated payment provider with its
 * tools (B2B milestone I3) — a sample build of a local `development` build or of the isolated
 * `prototype` profile (DP-16). Staging and production builds never do: their route files read this
 * at build time and answer every `/prototype` address with the not-found page.
 */
export function servesPrototypePages(
  env: Pick<WebPublicEnv, 'NEXT_PUBLIC_APP_ENV' | 'NEXT_PUBLIC_XR_DATA_SOURCE'>,
): boolean {
  return env.NEXT_PUBLIC_XR_DATA_SOURCE === 'sample' && runsSampleStandIns(env.NEXT_PUBLIC_APP_ENV);
}

/** This build's answer (`servesPrototypePages`), read by the `/prototype` route files. */
export const LOCAL_PROTOTYPE_BUILD = servesPrototypePages(publicEnv);
