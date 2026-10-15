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
  /** This tab's one world, named when the bridge attached: unchanged for the life of the page. */
  readonly instance: string;
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

/** What a same-tab session switch reports. */
export interface SessionSwitch {
  readonly marker: string;
  readonly instance: string;
  readonly previousSessionKey: string | null;
  readonly sessionKey: string | null;
  readonly personId: string | null;
  readonly worldVersion: number;
}

/**
 * Changes who is signed in to THIS tab, keeping its world (WP-0.14 §7; CI/Playwright builds only).
 * The bridge signs the tab's own session in as `person` through `SessionService.signIn` (their
 * sample e-mail; the sign-in policy applies) and the tab's session store adopts the answer: the
 * query cache is cleared, a new session key is published and the shell re-renders from the
 * person's own stored role. No reload, no second world, no UI: there is no account selector,
 * workspace chooser or role switch anywhere in the product. Product builds do not contain the
 * bridge, so this fails there.
 */
export async function switchIdentity(page: Page, person: SamplePerson): Promise<SessionSwitch> {
  assertSamplePerson(person);
  if (!(await bridgeOf(page))) throw unavailable('switchIdentity');
  return page.evaluate(
    async ({ key, personId }) => {
      const hooks = (window as unknown as Record<string, unknown>)[key] as {
        switchSession: (personId: string) => Promise<unknown>;
      };
      return hooks.switchSession(personId);
    },
    { key: TEST_HOOKS_GLOBAL, personId: person.personId },
  ) as Promise<SessionSwitch>;
}

async function callHook<Result>(
  page: Page,
  helper: string,
  hook: 'startReview' | 'planPayment' | 'reportPayment' | 'reportRuntime',
  args: readonly unknown[],
): Promise<Result> {
  if (!(await bridgeOf(page))) throw unavailable(helper);
  return page.evaluate(
    async ({ key, name, forwarded }) => {
      const hooks = (window as unknown as Record<string, unknown>)[key] as Record<
        string,
        (...values: unknown[]) => Promise<unknown>
      >;
      return hooks[name]!(...forwarded);
    },
    { key: TEST_HOOKS_GLOBAL, name: hook, forwarded: [...args] },
  ) as Promise<Result>;
}

/**
 * AD-14 / P1-04 (Package 1C; CI/Playwright builds only): records "BITS started reviewing" on the
 * request through the test-only review-start seam of the page's world — what a Super Admin's
 * review would record once its trigger is decided. Opening SA-03 never does it, and no product
 * control can. The page's request reads are refreshed.
 */
export async function startReview(page: Page, reference: string): Promise<void> {
  await callHook(page, 'startReview', 'startReview', [reference]);
}

/**
 * TE-4 (Package 1C; CI/Playwright builds only): what the sample payment provider reports for the
 * next payment the page starts — `pending` ("Payment not confirmed", B1-08 f6) or `failed`
 * ("Payment failed", f7). Without a plan a local prototype build's stand-in confirms on start.
 */
export async function planPayment(
  page: Page,
  outcome: 'pending' | 'failed' | 'confirmed',
): Promise<void> {
  await callHook(page, 'planPayment', 'planPayment', [outcome]);
}

/**
 * TE-4 (Package 1C; CI/Playwright builds only): the sample payment provider's later report on a
 * started payment (a pending one confirmed or failed), written by `system:payment-provider` with
 * sample provenance. Resolves with the provider port's answer (a refusal stays a value).
 */
export async function reportPayment(
  page: Page,
  reference: string,
  outcome: 'confirmed' | 'failed',
): Promise<{ readonly ok: boolean }> {
  return callHook(page, 'reportPayment', 'reportPayment', [reference, outcome]);
}

/** What the sample runtime reports for a Student's format (Phase 3; CI/Playwright builds only). */
export interface RuntimeReport {
  readonly person: SamplePerson;
  readonly experimentId: string;
  readonly format: 'web' | 'ar' | 'vr' | 'mr';
  /** Activity (`opened`, `saved`, `session`) or the completion (`completed`). */
  readonly kind: 'opened' | 'saved' | 'session' | 'completed';
  /** Where a completion is reported from (default: the simulation for WEB, the headset else). */
  readonly from?: 'simulation' | 'headset';
}

/**
 * T-12 / P3-01 open, ADR-0006 (Phase 3; CI/Playwright builds only): the sample runtime's own
 * report, written by `system:runtime-report` with sample provenance at the world's sample "now" —
 * the ONLY way a browser test reaches "In progress" or "Completed". No product control, launch,
 * resource, page or time writes either, and product builds do not contain this seam. The page's
 * learning reads are refreshed.
 */
export async function reportRuntime(page: Page, report: RuntimeReport): Promise<void> {
  assertSamplePerson(report.person);
  await callHook(page, 'reportRuntime', 'reportRuntime', [
    {
      personId: report.person.personId,
      experimentId: report.experimentId,
      format: report.format,
      kind: report.kind,
      ...(report.from ? { from: report.from } : {}),
    },
  ]);
}
