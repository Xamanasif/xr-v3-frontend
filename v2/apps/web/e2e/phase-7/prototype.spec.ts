import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { expectNoAxeViolations, expectNoInvisibleFocusTargets, reachAndClick } from '../support';
import { checkState, smallTargets } from '../support/screen-checks';
import {
  ACCOUNT,
  catalogue,
  EMAIL,
  h1,
  main,
  requestShellAndTube,
  sidebar,
  signIn,
  toSignIn,
} from '../flows/product';

/**
 * Phase 7 — the local prototype build's authorised capabilities on the PRODUCT build (owner
 * authorisation, 17 Oct 2026), at 1440, 1024, 768 and 375 where the width matters:
 *
 * - TE-6, browser persistence: a reload keeps the world and signs the tab out; a request's ticket
 *   is not kept (the status page opens nothing after a reload); the tabs of one browser share the
 *   world, each with its own session; a damaged save is rejected for a clean start; "Reset demo
 *   data" asks once, then starts every tab of the browser from the beginning, signed out.
 * - TE-3, the sample WEB activity: opened without the experiment page that launched it, it is not
 *   connected and records nothing; its page meets the screen checks at every width.
 *
 * The flows that use them end to end are in `e2e/flows/walkthrough.spec.ts` (and P3-03's device
 * chain there too).
 */

const SNAPSHOT_KEY = 'xr.sample-world';

/** Sign-in from a page that shows the signed-out card; resolves on the person's home. */
async function as(page: Page, email: string, home: string): Promise<void> {
  await signIn(page, email);
  await page.waitForURL((url) => url.pathname === home);
}

/** The checks of `checkState` a prototype support page can meet (see the reset page's note). */
async function checkPrototypePage(page: Page, heading: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expectNoAxeViolations(page);
  expect((await expectNoInvisibleFocusTargets(page)).length).toBeGreaterThan(0);
  expect(await smallTargets(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

async function sentRequest(page: Page): Promise<string> {
  await page.goto('/');
  const address = await requestShellAndTube(page);
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  return address;
}

async function keptValue(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), SNAPSHOT_KEY);
}

test.describe('TE-6 — the sample world kept in this browser', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

  test('a reload keeps the world and signs the tab out; the request ticket is not kept', async ({
    page,
  }) => {
    const address = await sentRequest(page);
    await expect(main(page)).toContainText('REQ-0042');
    const kept = await keptValue(page);
    expect(kept).toMatch(/^xr-sample-world\|1\|/);
    expect(kept).toContain('REQ-0042');

    // The status page after a reload: the ticket belonged to that page load only (ADR-0009).
    await page.reload();
    await expect(h1(page)).toHaveText('We can’t find that page');
    // The world is the same: the Super Admin finds REQ-0042 waiting.
    await page.goto('/sign-in');
    await as(page, EMAIL.arjun, '/admin');
    await expect(main(page)).toContainText('REQ-0042');
    await page.reload();
    await page.waitForURL('**/sign-in?**');
    await expect(page.getByRole('button', { name: ACCOUNT.arjun })).toHaveCount(0);
    expect(address).toMatch(/^\/requests\/rq-\d{4}$/);
  });

  test('the tabs of one browser share the world, each with its own session', async ({
    context,
    page,
  }) => {
    await sentRequest(page);
    const other = await context.newPage();
    await other.goto('/admin');
    // Nobody is signed in in a new tab: the session never travels between tabs.
    await other.waitForURL('**/sign-in?**');
    await as(other, EMAIL.arjun, '/admin');
    await expect(main(other)).toContainText('REQ-0042');
    // A third tab: the Content Manager, while the second tab stays the Super Admin's.
    const third = await context.newPage();
    await third.goto('/sign-in');
    await as(third, EMAIL.kavya, '/content-manager');
    await other.bringToFront();
    await expect(other.getByRole('button', { name: ACCOUNT.arjun, exact: true })).toBeVisible();
    await third.bringToFront();
    await expect(third.getByRole('button', { name: ACCOUNT.kavya, exact: true })).toBeVisible();
    // The first tab is still the signed-out visitor.
    await page.bringToFront();
    await expect(page.locator('header a.xp-signin')).toBeVisible();
  });

  test('a damaged save is rejected for a clean start', async ({ page }) => {
    await sentRequest(page);
    await page.evaluate((key) => {
      const kept = window.localStorage.getItem(key)!;
      window.localStorage.setItem(key, kept.replace('REQ-0042', 'REQ-0043'));
    }, SNAPSHOT_KEY);
    await page.goto('/sign-in');
    await as(page, EMAIL.arjun, '/admin');
    await sidebar(page, '/admin/requests');
    await expect(main(page)).not.toContainText('REQ-0042');
    await expect(main(page)).not.toContainText('REQ-0043');
    // The clean world was saved in its place.
    const kept = await keptValue(page);
    expect(kept).toMatch(/^xr-sample-world\|1\|/);
    expect(kept).not.toContain('REQ-0043');
  });

  test('“Reset demo data” asks once, then starts every tab again from the beginning', async ({
    context,
    page,
  }) => {
    await sentRequest(page);
    const other = await context.newPage();
    await other.goto('/sign-in');
    await as(other, EMAIL.arjun, '/admin');
    await expect(main(other)).toContainText('REQ-0042');

    const head = (value: string | null) => value?.split('|').slice(3, 5) ?? [];
    const [lineageBefore, versionBefore] = head(await keptValue(other));
    expect(Number(versionBefore)).toBeGreaterThan(0);

    const reset = await context.newPage();
    await reset.goto('/prototype/reset');
    // The owner's own words for the action (TE-6): the one page that shows "demo" (recorded
    // exception), so the developer-surface scan of `checkState` does not apply to it.
    await checkPrototypePage(reset, 'Reset demo data');
    await reachAndClick(reset, reset.getByRole('button', { name: 'Reset demo data' }));
    const dialog = reset.getByRole('dialog', { name: 'Reset demo data?' });
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await reachAndClick(reset, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    expect(head(await keptValue(reset))).toEqual([lineageBefore, versionBefore]);

    await reachAndClick(reset, reset.getByRole('button', { name: 'Reset demo data' }));
    await reachAndClick(reset, dialog.getByRole('button', { name: 'Reset demo data' }));
    await reset.waitForURL('**/prototype/reset?done=1');
    await expect(reset.getByText('Back to the starting state')).toBeVisible();
    // A new lineage, at the starting world version.
    const [lineageAfter, versionAfter] = head(await keptValue(reset));
    expect(lineageAfter).not.toBe(lineageBefore);
    expect(versionAfter).toBe('0');

    // The other tabs start again: signed out, on the clean world.
    await other.bringToFront();
    await other.waitForURL('**/sign-in?**');
    await as(other, EMAIL.arjun, '/admin');
    await sidebar(other, '/admin/requests');
    await expect(main(other)).not.toContainText('REQ-0042');
    await page.bringToFront();
    await page.waitForLoadState();
    await toSignIn(page);
    await expect(h1(page)).toHaveText('Sign in');
  });

  test('the public pages read the kept world after a reload', async ({ page }) => {
    await page.goto('/');
    await catalogue(page);
    await page.reload();
    await expect(h1(page)).toHaveText('Experiments');
    await checkState(page, 'Experiments');
  });
});

/** A stand-in for the launching tab on another page of the browser: answers one launch. */
async function launcherFor(context: BrowserContext, launch: string): Promise<Page> {
  const launcher = await context.newPage();
  await launcher.goto('/');
  await launcher.evaluate((held) => {
    const channel = new BroadcastChannel('xr.sample-web-activity');
    channel.onmessage = (event: MessageEvent) => {
      const message = event.data as { type: string; id: string; launch: string };
      if (message.launch !== held) return;
      channel.postMessage(
        message.type === 'hello'
          ? { type: 'launch', id: message.id, experimentName: 'Shell-and-Tube Heat Exchanger' }
          : { type: 'ack', id: message.id, outcome: 'recorded' },
      );
    };
    (window as unknown as { held: BroadcastChannel }).held = channel;
  }, launch);
  return launcher;
}

test.describe('TE-3 — the sample WEB activity page', () => {
  test('opened without its experiment page, it is not connected and records nothing', async ({
    page,
  }) => {
    await page.goto('/prototype/web-activity?launch=lch-000001.world-unknown');
    await expect(page.getByText('Connecting to your experiment page…')).toBeVisible();
    await expect(
      page.getByText('This activity isn’t connected to your experiment page'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Run trial' })).toHaveCount(0);
    await checkState(page, 'Sample WEB activity');
  });

  test('its steps meet the screen checks at every width (a stand-in answers for the launching tab)', async ({
    context,
    page,
  }) => {
    // UI checks only: the real launch, reports and completion are walked in flows/walkthrough.
    await launcherFor(context, 'lch-ui-check');
    await page.bringToFront();
    await page.goto('/prototype/web-activity?launch=lch-ui-check');
    await expect(page.getByText('Shell-and-Tube Heat Exchanger', { exact: true })).toBeVisible();
    await checkState(page, 'Sample WEB activity');
    for (const level of ['2', '4', '1']) {
      await page.getByLabel(/^Rig level/).selectOption(level);
      await reachAndClick(page, page.getByRole('button', { name: 'Run trial' }));
    }
    const question = page.getByRole('group', { name: /Which level gave the highest/ });
    await reachAndClick(page, page.getByRole('button', { name: 'Check answer' }));
    await expect(page.getByText('Choose a level.')).toBeVisible();
    await reachAndClick(page, question.getByText('Level 2'));
    await reachAndClick(page, page.getByRole('button', { name: 'Check answer' }));
    await expect(page.getByText(/Not quite\./)).toBeVisible();
    await checkState(page, 'Sample WEB activity');
    await reachAndClick(page, question.getByText('Level 4'));
    await reachAndClick(page, page.getByRole('button', { name: 'Check answer' }));
    await reachAndClick(page, page.getByRole('button', { name: 'Finish activity' }));
    await expect(page.getByText('Activity completed')).toBeVisible();
    await checkState(page, 'Sample WEB activity');
  });
});
