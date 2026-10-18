/**
 * The test-only seam between Playwright and the web app (ADR-0003 §3; ADR-0007 §2–3;
 * Appendix F §7.2, X-15). Two page globals, set by tests and read by nothing in a hosted
 * build:
 *
 *  - BOOT_DESCRIPTOR_GLOBAL — `{ fixture, session }`, installed by `bootWorld` before any
 *    page script runs. The test-hook bridge (`src/platform/test-hook-bridge.ts`, WP-0.12)
 *    reads it only in CI/Playwright builds (`NEXT_PUBLIC_XR_TEST_HOOKS=1`); other builds do
 *    not contain the bridge (build-time alias), so the global is inert there.
 *  - TEST_HOOKS_GLOBAL — the bridge's own handle (`actAs`, …), present only in those builds.
 *
 * Neither is product UI, and no test chooses an identity through any UI, URL or query
 * parameter (owner constraint, 9 Oct 2026). The product-bundle scan of `pnpm verify` fails if
 * either name reaches a hosted bundle.
 */
import { e2ePorts, localOrigin } from '@xr/testing/playwright';

export const BOOT_DESCRIPTOR_GLOBAL = '__XR_TEST_BOOT__';
export const TEST_HOOKS_GLOBAL = '__XR_TEST_HOOKS__';

/**
 * The dedicated test-hook build (`pnpm build:test-hooks`, `.next-test-hooks`), served by the
 * Playwright web server on its own port (3200, or `XR_E2E_TEST_HOOKS_PORT`); the product build is
 * served at the config's baseURL, `PRODUCT_URL` (3000, or `XR_E2E_WEB_PORT`).
 */
export const TEST_HOOKS_URL = localOrigin(e2ePorts().testHooks);

/** The product build's origin, for a test that must name it in an absolute address. */
export const PRODUCT_URL = localOrigin(e2ePorts().web);

/**
 * A sample-world person. A session stores only the person's id; role, institution and
 * scope are resolved from the world's records, never supplied by a test (ADR-0003 §1).
 */
export interface SamplePerson {
  readonly personId: string;
}

/** Thrown by a helper whose product counterpart is not built yet. */
export class HarnessUnavailableError extends Error {
  override readonly name = 'HarnessUnavailableError';

  constructor(helper: string, reason: string) {
    super(`${helper} is not available yet: ${reason}`);
  }
}

export function assertSamplePerson(person: SamplePerson): void {
  if (!/^\S+$/.test(person.personId)) {
    throw new TypeError(
      `A sample person needs a non-empty id without spaces (got "${person.personId}").`,
    );
  }
}
