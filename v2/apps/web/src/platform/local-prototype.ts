import { publicEnv } from '@/lib/env';

/**
 * Whether this is a local prototype build — sample data, the `development` environment (the
 * default of a local build): the only build that serves the Phase-7 support pages (owner
 * authorisation, 17 Oct 2026), "Reset demo data" and the sample WEB activity. Their route files read
 * it at build time, so any other build answers both addresses with the not-found page.
 */
export const LOCAL_PROTOTYPE_BUILD =
  publicEnv.NEXT_PUBLIC_XR_DATA_SOURCE === 'sample' &&
  publicEnv.NEXT_PUBLIC_APP_ENV === 'development';
