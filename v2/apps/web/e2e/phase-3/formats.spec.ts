import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3, the Student's format pages on the test-hook build, at 1440, 1024, 768 and 375: ST-08
 * WEB simulation (B3-03) and ST-09 AR / VR / MR format (B3-04). Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). TE-3 is unsigned: "Launch WEB" opens the published `.example` WEB
 * link in a new tab (fulfilled here, never fetched) and stores nothing (AD-16) — "In progress" and
 * "Completed" come only from the sample runtime's own report (`reportRuntime`, T-12).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = { personId: 'per-0002' };
const ARUN = { personId: 'per-0004' };
const ARJUN = { personId: 'sa-arjun-mehta' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SIMULATION = `/student/experiments/${SHELL}/simulation`;
const WEB = `${SIMULATION}/web`;
const VR = `${SIMULATION}/vr`;
const WEB_LINK = 'https://labs.example/shell-and-tube-heat-exchanger';

async function open(
  page: Page,
  fixture: string,
  person: { readonly personId: string },
  path: string,
): Promise<void> {
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const status = (page: Page) => main(page).locator('.xl-fmtpanel .xr-status');

/** The sample WEB links end in `.example`: the new tab gets a stand-in page, never the network. */
async function fulfilExampleLinks(page: Page): Promise<void> {
  await page.context().route(/\.example\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Stand-in</title><p>Stand-in</p></html>',
    }),
  );
}

/** The Super Admin pauses Godavari through the ports (B7-04); the page's reads refresh. */
async function pauseGodavari(page: Page): Promise<void> {
  const found = await actAs<{
    ok: boolean;
    value: { institution: { id: string; rev: number } };
  }>(page, ARJUN, { port: 'institutions', method: 'getInstitution', input: 'godavari' });
  expect(found.ok).toBe(true);
  const paused = await actAs<{ ok: boolean }>(page, ARJUN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: found.value.institution.id,
      reason: 'The institution asked us to pause access while it checks its student list.',
      expectedRev: found.value.institution.rev,
    },
  });
  expect(paused.ok).toBe(true);
}

test.describe('ST-08 WEB simulation', () => {
  test('Launch WEB opens the WEB link in a new tab and stores nothing; the runtime’s reports move it on (B3-03 f1 → f0 → f3)', async ({
    page,
  }) => {
    await fulfilExampleLinks(page);
    await open(page, 'after-flow-b', RAHUL, WEB);
    await checkState(page, 'Start the WEB simulation');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await expect(status(page)).toHaveText('Not started');

    const popup = page.waitForEvent('popup');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Launch WEB' }));
    const tab = await popup;
    await tab.waitForURL(WEB_LINK);
    await tab.close();
    await expect(
      main(page).getByText(
        'The simulation opened in a new tab. Come back here any time to continue.',
      ),
    ).toBeVisible();
    // AD-16: the launch wrote nothing — the status is still the service's "Not started".
    await expect(status(page)).toHaveText('Not started');
    await expect(main(page).getByRole('button', { name: 'Launch WEB' })).toBeVisible();
    await checkState(page, 'Start the WEB simulation');

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'opened',
    });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Continue where you left off');
    await expect(status(page)).toHaveText('In progress');
    await expect(main(page).getByRole('button', { name: 'Continue WEB' })).toBeVisible();
    await checkState(page, 'Continue where you left off');

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'completed',
    });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('You’ve completed WEB');
    await expect(main(page).getByRole('link', { name: 'Give feedback on WEB' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/web`,
    );
    await expect(main(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'You’ve completed WEB');
  });

  test('the simulation didn’t open: nothing lost, Try again opens it (B3-03 f2)', async ({
    page,
  }) => {
    await fulfilExampleLinks(page);
    await open(page, 'after-flow-b', RAHUL, WEB);
    await expect(main(page).getByRole('button', { name: 'Launch WEB' })).toBeVisible();
    // The browser refuses the new tab once.
    await page.evaluate(() => {
      const original = window.open.bind(window);
      window.open = () => {
        window.open = original;
        throw new Error('The new tab was refused.');
      };
    });
    await reachAndClick(page, main(page).getByRole('button', { name: 'Launch WEB' }));
    const alert = main(page).getByRole('alert');
    await expect(alert).toContainText('The simulation didn’t open');
    await expect(alert).toContainText(
      'Nothing was lost. Try again, or report a problem if it keeps happening.',
    );
    await checkState(page, 'Start the WEB simulation');
    const popup = page.waitForEvent('popup');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Try again' }));
    const tab = await popup;
    await tab.waitForURL(WEB_LINK);
    await tab.close();
    await expect(main(page).getByRole('alert')).toHaveCount(0);
    await expect(
      main(page).getByRole('status').filter({ hasText: 'opened in a new tab' }),
    ).toBeVisible();
  });

  test('completed with feedback sent: See your feedback (B3-03 f4, after Flow C)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RAHUL, WEB);
    await checkState(page, 'You’ve completed WEB');
    await expect(status(page)).toHaveText('Completed 14 Oct 2026');
    await expect(main(page)).toContainText('Feedback sent 14 Oct 2026, 15:42');
    await expect(main(page).getByRole('link', { name: 'See your feedback' })).toBeVisible();
    await expect(main(page).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
  });

  test('paused (B3-03 f5)', async ({ page }) => {
    await open(page, 'after-flow-b', RAHUL, WEB);
    await expect(main(page).getByRole('button', { name: 'Launch WEB' })).toBeVisible();
    await pauseGodavari(page);
    await checkState(page, 'You can’t open the simulation right now');
    await expect(status(page)).toHaveText('Paused');
    await expect(main(page).getByRole('button')).toHaveCount(0);
  });

  test('a supplied licence wait: Arun Kumar, later sample (B3-03 f6)', async ({ page }) => {
    await open(page, 'later-sample', ARUN, WEB);
    await checkState(page, 'Not available to you yet');
    await expect(status(page)).toHaveText('Waiting for a licence');
    await expect(main(page)).toContainText(
      'No licence is available for you on ACC-0107 right now. Your institution can tell you more.',
    );
  });
});

test.describe('ST-09 AR / VR / MR format', () => {
  test('VR: Set up VR → Continue on your headset → Give feedback on VR, from reported sessions (B3-04 f1, f0, f2)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, VR);
    await checkState(page, 'Set up VR');
    await expect(status(page)).toHaveText('Not started');
    await expect(main(page)).toContainText('ME lab VR headset, asset tag GIT-VR-03');
    await expect(main(page).getByRole('link', { name: 'My device' })).toHaveAttribute(
      'href',
      '/student/device',
    );
    // Information only: no launch button for VR (T-14).
    await expect(main(page).getByRole('button')).toHaveCount(0);
    const steps = main(page).locator('.xl-steps > li');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(1)).toContainText(
      'Open the Shell-and-Tube Heat Exchanger app on the headset.',
    );
    await reachAndClick(page, main(page).getByText('View setup steps'));
    await expect(steps.first()).toBeHidden();

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'vr',
      kind: 'session',
    });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Continue on your headset');
    await expect(status(page)).toHaveText('In progress');
    await expect(main(page)).toContainText('Last session reported');
    await checkState(page, 'Continue on your headset');

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'vr',
      kind: 'completed',
    });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('You’ve completed VR');
    await expect(main(page)).toContainText('Reported from the headset at');
    await expect(main(page).getByRole('link', { name: 'Give feedback on VR' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/vr`,
    );
    await checkState(page, 'You’ve completed VR');
  });

  test('VR completed 20 Oct with feedback sent (after Flow C; B3-12 f3, f4)', async ({ page }) => {
    await open(page, 'after-flow-c', RAHUL, VR);
    await checkState(page, 'You’ve completed VR');
    await expect(status(page)).toHaveText('Completed 20 Oct 2026');
    await expect(main(page)).toContainText('Thank you — your feedback on VR is recorded.');
    await expect(main(page).getByRole('link', { name: 'See your feedback' })).toBeVisible();
  });

  test('VR paused (B3-04 f5)', async ({ page }) => {
    await open(page, 'after-flow-b', RAHUL, VR);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Set up VR');
    await pauseGodavari(page);
    await checkState(page, 'You can’t use VR right now');
    await expect(main(page).locator('.xl-dev')).toHaveCount(0);
  });

  test('AR not included (B3-04 f3), MR not available (f4), an unknown format not found', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, `${SIMULATION}/ar`);
    await checkState(page, 'AR isn’t included for your institution');
    await expect(main(page)).toContainText(
      'AR is published for this experiment, but your institution’s access includes WEB and VR only.',
    );
    await expect(main(page).locator('.xr-msg').getByRole('link')).toHaveAttribute(
      'href',
      SIMULATION,
    );

    await page.goto(`${SIMULATION}/mr`);
    await checkState(page, 'This experiment isn’t available in MR');
    await expect(main(page)).toContainText(
      'Shell-and-Tube Heat Exchanger is made for WEB, AR and VR.',
    );

    await page.goto(`${SIMULATION}/xr`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('We can’t find that page');
  });
});
