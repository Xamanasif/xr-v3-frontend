import type { Page } from '@playwright/test';

import {
  assertSamplePerson,
  BOOT_DESCRIPTOR_GLOBAL,
  HarnessUnavailableError,
  type SamplePerson,
  TEST_HOOKS_GLOBAL,
} from './test-seam';

/** A port command, named by port key and method (ADR-0008; `@xr/contracts/draft` PORT_KEYS). */
export interface PortCommand {
  readonly port: string;
  readonly method: string;
  readonly input?: unknown;
}

/** How long a booted page may take to compose its world (a fixture runs its walk first). */
const BRIDGE_WAIT_MS = 15_000;

/**
 * Waits for the page's test-hook bridge when the page was booted with `bootWorld` — the bridge
 * installs its handle as the tab's boot starts. A page without a boot descriptor is not waited
 * for: the caller learns at once that it has no bridge. If the boot itself fails (an unknown
 * fixture or person), every hook call rejects with "The test-hook boot failed: …".
 */
async function bridgeOf(page: Page): Promise<boolean> {
  const booted = await page.evaluate((key) => key in window, BOOT_DESCRIPTOR_GLOBAL);
  if (booted) {
    await page
      .waitForFunction(
        (key) =>
          typeof (window as unknown as Record<string, { actAs?: unknown } | undefined>)[key]
            ?.actAs === 'function',
        TEST_HOOKS_GLOBAL,
        { timeout: BRIDGE_WAIT_MS },
      )
      .catch(() => undefined);
  }
  return page.evaluate(
    (key) =>
      typeof (window as unknown as Record<string, { actAs?: unknown } | undefined>)[key]?.actAs ===
      'function',
    TEST_HOOKS_GLOBAL,
  );
}

function unavailable(helper: string): HarnessUnavailableError {
  return new HarnessUnavailableError(
    helper,
    'this page has no test-hook bridge. The bridge exists only in builds made with NEXT_PUBLIC_XR_TEST_HOOKS=1 (the dedicated Playwright build, `pnpm build:test-hooks`, served on TEST_HOOKS_URL; ADR-0007).',
  );
}

/**
 * Runs one port command as another sample person, without any UI (Appendix F §7.2: cross-role
 * proofs). The actor is the person id only; the world resolves role and scope (ADR-0003 §1).
 * It runs against the SAME world the page shows, in a session of its own (the page's signed-in
 * person is unchanged), and its receipt refreshes the page's dependent queries.
 *
 * It calls the test-hook bridge in the page, which exists only in test-hook builds. Without the
 * bridge it fails; it never falls back to driving screens.
 */
export async function actAs<Result = unknown>(
  page: Page,
  person: SamplePerson,
  command: PortCommand,
): Promise<Result> {
  assertSamplePerson(person);
  if (!(await bridgeOf(page))) throw unavailable('actAs');
  return page.evaluate(
    async ({ key, personId, command: forwarded }) => {
      const hooks = (window as unknown as Record<string, unknown>)[key] as {
        actAs: (personId: string, command: unknown) => Promise<unknown>;
      };
      return hooks.actAs(personId, forwarded);
    },
    { key: TEST_HOOKS_GLOBAL, personId: person.personId, command },
  ) as Promise<Result>;
}

/** What the bridge reports about the page's world and session (assertions only). */
export interface WorldInspection {
  readonly marker: string;
  /** The boot descriptor's fixture, or `null` for the spine-start seed. */
  readonly fixture: string | null;
  readonly seedId: string;
  readonly worldVersion: number;
  /** How many worlds this page composed — one, always (one world per tab). */
  readonly attached: number;
  readonly persistence: string;
  readonly session:
    | { readonly status: 'signed-in'; readonly sessionKey: string; readonly personId: string }
    | { readonly status: 'signed-out'; readonly sessionKey: string }
    | { readonly status: 'unknown' };
  readonly cachedQueries: number;
  /** The session keys of the cached answers, each once (WP-0.13: none of a signed-out person's). */
  readonly cachedSessionKeys: readonly string[];
}

export async function inspectWorld(page: Page): Promise<WorldInspection> {
  if (!(await bridgeOf(page))) throw unavailable('inspectWorld');
  return page.evaluate(
    (key) =>
      (
        (window as unknown as Record<string, unknown>)[key] as {
          inspect: () => Promise<WorldInspection>;
        }
      ).inspect(),
    TEST_HOOKS_GLOBAL,
  );
}
