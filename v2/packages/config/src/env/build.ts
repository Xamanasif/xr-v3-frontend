/**
 * Build-time flags of the web application (TE-7; ADR-0007 §2; Appendix F §3.8). Read once, by
 * `apps/web/next.config.ts` and nothing else: the test-hook flag chooses, through a build-time
 * alias, whether the CI-only test-hook bridge or an empty stub is compiled in. It is kept out of
 * `./index.ts` because the web app's runtime env module imports that one into the browser, and
 * the flag's name must never reach a product bundle (`pnpm verify` bundle sentinels).
 */
import { z } from 'zod';

import { appEnvironmentSchema, dataSourceSchema } from './index.js';

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/**
 * `1` only in dedicated CI/Playwright builds; unset (or empty) in every other build, hosted owner
 * and reviewer builds included. Any other spelling (`true`, `0`, `yes`) is refused rather than
 * read as "off", so a mistyped CI build fails instead of silently testing a build without hooks.
 */
export const testHooksFlagSchema = z
  .preprocess(
    emptyToUndefined,
    z.literal('1', { error: 'must be 1 (CI/Playwright builds only) or unset' }).optional(),
  )
  .transform((value) => value === '1');

/**
 * `1` only when the operator confirms that the deployment sits behind access protection (DP-17 is
 * the owner's decision on how; until then no hosted build is authorised). Any other spelling is
 * refused rather than read as "off".
 */
export const accessProtectedFlagSchema = z
  .preprocess(
    emptyToUndefined,
    z
      .literal('1', { error: 'must be 1 (the deployment is behind access protection) or unset' })
      .optional(),
  )
  .transform((value) => value === '1');

export const webBuildFlagsSchema = z
  .object({
    NEXT_PUBLIC_APP_ENV: z.preprocess(
      emptyToUndefined,
      appEnvironmentSchema.default('development'),
    ),
    NEXT_PUBLIC_XR_DATA_SOURCE: dataSourceSchema,
    NEXT_PUBLIC_XR_TEST_HOOKS: testHooksFlagSchema,
    XR_SAMPLE_ACCESS_PROTECTED: accessProtectedFlagSchema,
  })
  .superRefine((flags, context) => {
    if (flags.NEXT_PUBLIC_XR_TEST_HOOKS && flags.NEXT_PUBLIC_XR_DATA_SOURCE !== 'sample') {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_XR_TEST_HOOKS'],
        message:
          'the test hooks drive the sample world; they need NEXT_PUBLIC_XR_DATA_SOURCE=sample',
      });
    }
    // ADR-0007 §2: the test-hook bridge is never in a hosted build — CI/Playwright builds are local
    // development builds, never prototype, staging or production.
    if (flags.NEXT_PUBLIC_XR_TEST_HOOKS && flags.NEXT_PUBLIC_APP_ENV !== 'development') {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_XR_TEST_HOOKS'],
        message: `the test hooks are for local CI/Playwright builds only; NEXT_PUBLIC_APP_ENV=${flags.NEXT_PUBLIC_APP_ENV} never carries them`,
      });
    }
    // TE-8: the permissive sample sign-in (any password opens a sample account) is never deployed
    // publicly. Every sample build that is not a local development build — prototype, staging,
    // production — fails to build or start unless the operator confirms access protection.
    if (
      flags.NEXT_PUBLIC_XR_DATA_SOURCE === 'sample' &&
      flags.NEXT_PUBLIC_APP_ENV !== 'development' &&
      !flags.XR_SAMPLE_ACCESS_PROTECTED
    ) {
      context.addIssue({
        code: 'custom',
        path: ['XR_SAMPLE_ACCESS_PROTECTED'],
        message: `a ${flags.NEXT_PUBLIC_APP_ENV} build of the sample world accepts any password for its sample accounts (TE-8); it is built and served only behind access protection: set XR_SAMPLE_ACCESS_PROTECTED=1 once the deployment is protected (DP-17)`,
      });
    }
  });

export type WebBuildFlags = z.output<typeof webBuildFlagsSchema>;

/**
 * The response headers of a build: every build that is not a local development build asks search
 * engines not to index or follow it (a prototype or sample deployment is never public content).
 */
export function webResponseHeaders(
  flags: Pick<WebBuildFlags, 'NEXT_PUBLIC_APP_ENV'>,
): readonly { readonly key: string; readonly value: string }[] {
  return flags.NEXT_PUBLIC_APP_ENV === 'development'
    ? []
    : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }];
}
