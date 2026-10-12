import type { Page } from '@playwright/test';

import { assertSamplePerson, HarnessUnavailableError, type SamplePerson } from './test-seam';

/**
 * Signs a sample person in through the designed sign-in form, as a person would
 * (Appendix F §7.2: "drives it for real at least once per role").
 *
 * The form is XS-01 (board B1-09), which the owner kept in Phase 1 (G-8, 12 Oct 2026;
 * ADR-0003 §3–4). In Phase 0 this helper therefore refuses, loudly and without touching the
 * page: there is no fallback through a URL, a query parameter, a cookie or any identity UI.
 * Phase-0 tests reach a signed-in state only through `bootWorld`.
 */
export async function signInAs(_page: Page, person: SamplePerson): Promise<never> {
  assertSamplePerson(person);
  throw new HarnessUnavailableError(
    'signInAs',
    'it drives the designed XS-01 sign-in (B1-09), which is built in Phase 1 (owner decision G-8; ADR-0003). Phase-0 tests use bootWorld, the CI-only boot descriptor.',
  );
}
