import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3, the experiment hub's tabs, on the test-hook build at 1440, 1024, 768 and 375: ST-05's
 * tab strip, Next step and card actions (B2-12), ST-06 Resources and ST-10 Progress for this
 * experiment (B3-01), ST-07 Simulation — choose a format (B3-02). Each state passes `checkState`
 * (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways
 * scroll). In progress and Completed are reached only through the CI-only runtime-report seam —
 * never by a page, a launch or a resource (T-12, T-13). Worlds: after Flow B (Rahul given
 * Shell-and-Tube, nothing opened), after Flow C (lab brief opened, WEB and VR completed with
 * feedback) and the later sample (Arun Kumar waiting for a licence).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = { personId: 'per-0002' };
const ARUN = { personId: 'per-0004' };
const SHELL = 'Shell-and-Tube Heat Exchanger';
const SHELL_ID = 'shell-and-tube-heat-exchanger';
const HUB = `/student/experiments/${SHELL_ID}`;
const BRIEF = 'Lab brief — Shell-and-Tube Heat Exchanger';

const main = (page: Page) => page.locator('main');
const tabs = (page: Page) => page.getByRole('navigation', { name: SHELL });

async function open(
  page: Page,
  fixture: string,
  person: { readonly personId: string },
  path: string,
): Promise<void> {
  // A resource opens in a new tab: blank in the click (`window.open('', '_blank')`), then pointed
  // at the resource's link — both recorded here, on a stand-in tab, instead of leaving the test.
  await page.addInitScript(() => {
    const calls: unknown[][] = [];
    (window as unknown as { __opened: unknown[][] }).__opened = calls;
    window.open = (...args: unknown[]) => {
      calls.push(args);
      return {
        opener: window,
        location: { replace: (href: string) => calls.push(['replace', href]) },
        close: () => calls.push(['close']),
      } as unknown as Window;
    };
  });
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

async function expectTabs(page: Page, current: string): Promise<void> {
  // The Assessment tab since Phase 4B (B4-11 f7; e2e/phase-4b/student-assessments.spec.ts).
  await expect(tabs(page).getByRole('link')).toHaveText([
    'Overview',
    'Resources',
    'Simulation',
    'Assessment',
    'Progress',
  ]);
  await expect(tabs(page).locator('[aria-current="page"]')).toHaveText(current);
}

test.describe('Student · the experiment hub', () => {
  test('ST-05 Overview: the tabs, “Next step: open the resources” → ST-06 (B2-12 f0, f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, HUB);
    await expect(page.getByRole('heading', { level: 1, name: SHELL })).toBeVisible();
    await expectTabs(page, 'Overview');
    await expect(main(page).locator('.xw-hubrow')).toContainText('Next step: open the resources');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, SHELL);
    await reachAndClick(
      page,
      main(page).locator('.xw-hubrow').getByRole('link', { name: 'Open resources' }),
    );
    await page.waitForURL(`**${HUB}/resources`);
    await expectTabs(page, 'Resources');
    await expect(main(page).getByRole('region', { name: 'Resources' })).toContainText(
      '3 resources',
    );
  });

  test('ST-06 Resources: Open → “Opened in a new tab just now”; nothing becomes progress (B3-01 f0, f2, f7)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/resources`);
    const section = main(page).getByRole('region', { name: 'Resources' });
    await expect(section.locator('li.xr-row')).toHaveCount(3);
    await expect(section.locator('li.xr-row').first()).toContainText('Not opened yet');
    await checkState(page, SHELL);
    await reachAndClick(page, section.getByRole('button', { name: `Open ${BRIEF} in a new tab` }));
    await expect(page.locator(':focus')).toHaveText('Opened in a new tab just now');
    const calls = await page.evaluate(
      () => (window as unknown as { __opened: unknown[][] }).__opened,
    );
    expect(calls).toEqual([
      ['', '_blank'],
      ['replace', 'https://docs.example/shell-and-tube/lab-brief.pdf'],
    ]);
    await checkState(page, SHELL);
    // Opening is not progress (T-13): the Progress tab still reads Not started.
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Progress' }));
    await page.waitForURL(`**${HUB}/progress`);
    const rows = page.getByRole('list', { name: 'Progress by format' }).locator(':scope > li');
    await expect(rows.nth(0)).toContainText('Not started');
    await expect(rows.nth(1)).toContainText('Not started');
  });

  test('ST-06 after Flow C: the lab brief’s first opening is kept (B3-01 f0)', async ({ page }) => {
    await open(page, 'after-flow-c', RAHUL, `${HUB}/resources`);
    const rows = main(page).getByRole('region', { name: 'Resources' }).locator('li.xr-row');
    await expect(rows.nth(0)).toContainText('Opened 12 Oct 2026, 09:40');
    await expect(rows.nth(1)).toContainText('Not opened yet');
    await checkState(page, SHELL);
  });

  test('ST-07 first visit, then WEB in progress and completed as the runtime reports them (B3-02 f1, f0, f2)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/simulation`);
    const chooser = main(page).getByRole('region', { name: 'Choose a format' });
    const web = chooser.locator('li.xl-frow').nth(0);
    const vr = chooser.locator('li.xl-frow').nth(1);
    await expect(web).toContainText('Opens in your browser');
    await expect(web).toContainText('Not started');
    await expect(web.getByRole('link', { name: 'Open WEB' })).toHaveClass(/xr-btn--primary/);
    await expect(vr).toContainText('Needs a VR headset');
    await expect(chooser.locator('li.xl-frow').nth(2)).toContainText(
      'Not included for your institution',
    );
    await expect(chooser.locator('li.xl-frow').nth(3)).toContainText(
      'Not available for this experiment',
    );
    await expectTabs(page, 'Simulation');
    await checkState(page, SHELL);

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL_ID,
      format: 'web',
      kind: 'opened',
    });
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL_ID,
      format: 'web',
      kind: 'saved',
    });
    await expect(web).toContainText('In progress');
    await expect(web).toContainText(/Last saved \d+ \w{3} \d{4}, \d\d:\d\d/);
    await expect(web.getByRole('link', { name: 'Continue WEB' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    await checkState(page, SHELL);

    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL_ID,
      format: 'web',
      kind: 'completed',
    });
    await expect(web.getByRole('link', { name: 'Give feedback on WEB' })).toHaveAttribute(
      'href',
      `${HUB}/feedback/web`,
    );
    await expect(web).toContainText(/Completed \d+ \w{3} \d{4}/);
    await expect(vr.getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
    await checkState(page, SHELL);
  });

  test('ST-07 waiting for a licence: the reason in words, nothing opens (B3-02 f4)', async ({
    page,
  }) => {
    await open(page, 'later-sample', ARUN, `${HUB}/simulation`);
    const chooser = main(page).getByRole('region', { name: 'Choose a format' });
    await expect(chooser.locator('li.xl-frow').nth(0)).toContainText('Waiting for a licence');
    await expect(chooser.locator('li.xl-frow').nth(0)).toContainText(
      'No licence is available for you on ACC-0107 right now.',
    );
    await expect(chooser.getByRole('link')).toHaveCount(0);
    await checkState(page, SHELL);
  });

  test('ST-10 after Flow C: both completed, feedback sent, no verdict (B3-01 f10, f12)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RAHUL, `${HUB}/progress`);
    const rows = page.getByRole('list', { name: 'Progress by format' }).locator(':scope > li');
    await expect(rows.nth(0)).toContainText('Completed 14 Oct 2026');
    await expect(rows.nth(0)).toContainText('Feedback sent 14 Oct 2026');
    await expect(rows.nth(1)).toContainText('Completed 20 Oct 2026');
    await expect(rows.nth(1)).toContainText('Feedback sent 20 Oct 2026');
    await expect(main(page).getByRole('region', { name: 'Assessment' })).toContainText(
      'Your faculty hasn’t set an assessment for this experiment yet.',
    );
    await expect(main(page)).not.toContainText('%');
    await expectTabs(page, 'Progress');
    await checkState(page, SHELL);
  });

  test('ST-10 WEB completed → Give feedback on WEB; VR → Open VR (B3-01 f8)', async ({ page }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/progress`);
    const rows = page.getByRole('list', { name: 'Progress by format' }).locator(':scope > li');
    await expect(rows.nth(0)).toContainText('Not started');
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL_ID,
      format: 'web',
      kind: 'completed',
    });
    await expect(rows.nth(0).getByRole('link', { name: 'Give feedback on WEB' })).toBeVisible();
    await expect(rows.nth(1).getByRole('link', { name: 'Open VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    await checkState(page, SHELL);
  });
});
