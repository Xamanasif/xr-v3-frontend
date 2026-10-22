import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The V1 landing's frozen source (prompt 13), preserved byte-identical in the repository:
 * `design/v1-landing/21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html`
 * (checked by its SHA256SUMS.txt; never edited). `XR_V1_LANDING_SOURCE` may point elsewhere. The
 * tests that read it fail — never skip — when it is missing.
 */
export const V1_LANDING_SOURCE =
  process.env.XR_V1_LANDING_SOURCE ??
  join(
    import.meta.dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'design',
    'v1-landing',
    '21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html',
  );

export const V1_LANDING_SHA256 = '3dbe9412df26e8479379e10f5f76cc1d87923f773a7be3e226f6c30b75a4d07c';

/** The frozen source's bytes; throws when the file is missing. */
export function readV1Landing(): Buffer {
  if (!existsSync(V1_LANDING_SOURCE)) {
    throw new Error(`The V1 landing's frozen source is missing: ${V1_LANDING_SOURCE}`);
  }
  return readFileSync(V1_LANDING_SOURCE);
}
