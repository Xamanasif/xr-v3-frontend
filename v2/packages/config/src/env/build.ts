/**
 * Build-time flags of the web application (TE-7; ADR-0007 §2; Appendix F §3.8). Read once, by
 * `apps/web/next.config.ts` and nothing else: the test-hook flag chooses, through a build-time
 * alias, whether the CI-only test-hook bridge or an empty stub is compiled in. It is kept out of
 * `./index.ts` because the web app's runtime env module imports that one into the browser, and
 * the flag's name must never reach a product bundle (`pnpm verify` bundle sentinels).
 */
import { z } from 'zod';

import { dataSourceSchema } from './index.js';

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

export const webBuildFlagsSchema = z
  .object({
    NEXT_PUBLIC_XR_DATA_SOURCE: dataSourceSchema,
    NEXT_PUBLIC_XR_TEST_HOOKS: testHooksFlagSchema,
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
  });

export type WebBuildFlags = z.output<typeof webBuildFlagsSchema>;
