import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  expectNoDeveloperSurfaces,
  inspectWorld,
  TEST_HOOKS_URL,
} from '../support';

/**
 * The CI-only test-hook bridge in a real browser, on the dedicated test-hook build (WP-0.12;
 * ADR-0003 §3; ADR-0004 option A; ADR-0007 §2–3; Appendix F §7.2). Written before WP-0.13 built
 * the workspace routes; the pages here mount the application providers, so the tab's platform
 * boots exactly as under any screen. The route-to-route proofs on real screens are in
 * `e2e/foundation/` (WP-0.13).
 * No test chooses an identity through UI: `bootWorld` and `actAs` speak to the bridge only.
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.skip(
  ({ viewport }) => viewport?.width !== 1440,
  'The bridge renders nothing: one width proves it (the product suites run at all four).',
);

const ARJUN = { personId: 'sa-arjun-mehta' };
const ANIL = { personId: 'per-anil-shetty' };

interface Institution {
  readonly id: string;
  readonly rev: number;
  readonly pause: unknown;
}

async function deccan(page: Page): Promise<Institution> {
  const answer = await actAs<{ ok: boolean; value: { institution: Institution } }>(page, ARJUN, {
    port: 'institutions',
    method: 'getInstitution',
    input: 'deccan',
  });
  expect(answer.ok).toBe(true);
  return answer.value.institution;
}

async function pauseDeccan(page: Page): Promise<void> {
  const institution = await deccan(page);
  expect(
    await actAs(page, ARJUN, {
      port: 'institutions',
      method: 'pauseInstitution',
      input: {
        institutionId: institution.id,
        reason: 'The institution asked us to pause access while it checks its student list.',
        expectedRev: institution.rev,
      },
    }),
  ).toMatchObject({ ok: true });
}

test('bootWorld starts the page on the named fixture world, signed in, without any sign-in UI', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'after-flow-a', session: ARJUN });
  const response = await page.goto('/admin/help');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();

  expect(await inspectWorld(page)).toMatchObject({
    fixture: 'after-flow-a',
    seedId: 'after-flow-a',
    attached: 1,
    persistence: 'memory-per-tab',
    session: { status: 'signed-in', personId: 'sa-arjun-mehta' },
  });
  // Flow A created REQ-0042: it is in this world.
  expect(
    await actAs(page, ARJUN, {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: 'REQ-0042',
    }),
  ).toMatchObject({ ok: true });
  // Nothing identity-shaped is on the page: no form control, no developer surface.
  await expect(page.locator('input, select, textarea, [role="combobox"]')).toHaveCount(0);
  await expectNoDeveloperSurfaces(page);
});

test('a signed-out boot on the seed: a visitor partition, and no Flow-A record yet', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto('/student');
  // The session gate replaces a signed-out workspace address with the sign-in card (XS-01,
  // Package 1A): inspect the tab once it has settled there.
  await page.waitForURL(/\/sign-in\?returnTo=/);
  const world = await inspectWorld(page);
  expect(world.seedId).toBe('spine-start');
  expect(world.session).toEqual({
    status: 'signed-out',
    sessionKey: expect.stringMatching(/^public:bs-[0-9a-f]{16}$/),
  });
  expect(
    await actAs(page, ARJUN, {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: 'REQ-0042',
    }),
  ).toMatchObject({ ok: false, error: { kind: 'not-found' } });
});

test('actAs writes to the world the page holds; in-document navigation keeps it; a reload resets it', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'spine-start', session: ANIL });
  await page.goto('/student');
  const start = await inspectWorld(page);
  expect(start.session).toMatchObject({ status: 'signed-in', personId: 'per-anil-shetty' });

  await pauseDeccan(page);
  const changed = await inspectWorld(page);
  expect(changed.worldVersion).toBe(start.worldVersion + 1);
  // actAs runs in a session of its own: the page's signed-in person is unchanged.
  expect(changed.session).toEqual(start.session);

  // Client-side navigation without a document load: Next's router keeps history entries in step
  // with `history.pushState` (usePathname follows), and Back restores through its own popstate.
  // Phase 0 has no built screen to move between (WP-0.13), so the entries are addresses only.
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
    history.pushState(null, '', '/faculty');
  });
  await page.waitForURL('**/faculty');
  await page.goBack();
  await page.waitForURL('**/student');
  expect(
    await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument),
  ).toBe(true);
  expect(await inspectWorld(page)).toMatchObject({
    worldVersion: changed.worldVersion,
    attached: 1,
    session: start.session,
  });
  expect((await deccan(page)).pause).not.toBeNull();

  // A reload is a new page: the world starts again from the fixture (AD-07 option A).
  await page.reload();
  const reloaded = await inspectWorld(page);
  expect(reloaded.worldVersion).toBe(start.worldVersion);
  expect(reloaded.attached).toBe(1);
  expect((await deccan(page)).pause).toBeNull();
  // Nothing of the world or the session was kept in browser storage.
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookie: '' });
});

test('a router navigation to an address that answers 404 is a full page load, so the world restarts (option A)', async ({
  page,
}) => {
  // Next.js turns a client-side navigation whose server answer is not OK into a document load.
  // Since WP-0.13 the workspace addresses all answer 200 (unknown ones render the in-shell
  // not-found in the browser, spike S1b); an address outside the workspaces still answers the
  // public not-found with 404, so a link to one restarts the tab's sample world (ADR-0004
  // option A) — product links target built screens only (ADR-0005 link-target ledger). Since
  // Package 1C built the Selection (PU-07), the probe uses an address that names no page.
  await bootWorld(page, { fixture: 'spine-start', session: ANIL });
  await page.goto('/vendor/help');
  await pauseDeccan(page);
  const changed = await inspectWorld(page);
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/zz-not-a-page',
    );
  });
  await page.waitForURL('**/zz-not-a-page');
  await page.waitForLoadState('load');
  expect(
    await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument),
  ).toBeUndefined();
  expect((await inspectWorld(page)).worldVersion).toBe(changed.worldVersion - 1);
});

test('every page is its own world: a command on one never reaches another', async ({ context }) => {
  const one = await context.newPage();
  const two = await context.newPage();
  for (const page of [one, two]) {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    // A public address: signed out, a workspace address would leave for the sign-in (WP-0.13).
    await page.goto('/nope');
  }
  const before = await inspectWorld(two);

  await pauseDeccan(one);

  expect((await inspectWorld(one)).worldVersion).toBe(before.worldVersion + 1);
  expect(await inspectWorld(two)).toMatchObject({ worldVersion: before.worldVersion, attached: 1 });
  expect((await deccan(two)).pause).toBeNull();
});

test('a boot that fails is reported as a failed boot, not as a build without the bridge', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'spine-start', session: { personId: 'per-nobody' } });
  await page.goto('/student');
  await expect(inspectWorld(page)).rejects.toThrow(
    'The test-hook boot failed: No sample person with id per-nobody in this world.',
  );
  await expect(actAs(page, ARJUN, { port: 'session', method: 'getSession' })).rejects.toThrow(
    /The test-hook boot failed/,
  );
});
