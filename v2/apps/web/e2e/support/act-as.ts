import type { Page } from '@playwright/test';

import {
  assertSamplePerson,
  HarnessUnavailableError,
  type SamplePerson,
  TEST_HOOKS_GLOBAL,
} from './test-seam';

/**
 * A port command, named by port and method (ADR-0008). The ports and their DTOs arrive in
 * WP-0.10, which types this strictly.
 */
export interface PortCommand {
  readonly port: string;
  readonly method: string;
  readonly input?: unknown;
}

/**
 * Runs one port command as another sample person, without any UI (Appendix F §7.2: cross-role
 * proofs). The actor is the person id only; the world resolves role and scope (ADR-0003 §1).
 *
 * It calls the test-hook bridge in the page, which exists only in CI/Playwright builds and
 * arrives with the composition root (WP-0.12). Without the bridge it fails; it never falls
 * back to driving screens.
 */
export async function actAs<Result = unknown>(
  page: Page,
  person: SamplePerson,
  command: PortCommand,
): Promise<Result> {
  assertSamplePerson(person);
  const outcome = await page.evaluate(
    async ({ key, personId, command: forwarded }) => {
      const hooks = (window as unknown as Record<string, unknown>)[key] as
        { actAs?: (personId: string, command: unknown) => Promise<unknown> } | undefined;
      if (typeof hooks?.actAs !== 'function') return { available: false as const };
      return { available: true as const, result: await hooks.actAs(personId, forwarded) };
    },
    { key: TEST_HOOKS_GLOBAL, personId: person.personId, command },
  );
  if (!outcome.available) {
    throw new HarnessUnavailableError(
      'actAs',
      'this page has no test-hook bridge. The bridge is built with the composition root (WP-0.12) and exists only in builds made with NEXT_PUBLIC_XR_TEST_HOOKS=1 (ADR-0007).',
    );
  }
  return outcome.result as Result;
}
