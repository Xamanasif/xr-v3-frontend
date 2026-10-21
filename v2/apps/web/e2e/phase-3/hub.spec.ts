import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * The experiment hub on the test-hook build at 1440, 1024, 768 and 375, as the V3 Student export
 * draws it (ST-v1 `StudentFinal.dc.html`): ST-05's head, section tabs and Overview (the one next
 * step tagged), ST-06 Resources, ST-07 Simulation — choose a format, ST-10 Progress for this
 * experiment. Each state passes `checkState`
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
const tabs = (page: Page) => page.getByRole('navigation', { name: `${SHELL} sections` });
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

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

/** Student words never carry an internal record reference (lead decision 3). */
async function expectNoReferences(page: Page): Promise<void> {
  await expect(main(page)).not.toContainText(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

const resourceRows = (page: Page) =>
  main(page).getByRole('region', { name: 'Resources' }).locator('li.sv-li');
const cards = (page: Page) =>
  main(page).getByRole('list', { name: 'Your formats' }).locator(':scope > li');
const progressRows = (page: Page) =>
  page
    .getByRole('table', { name: `Your formats for ${SHELL}: progress and actions` })
    .locator('tbody > tr');

test.describe('Student · the experiment hub', () => {
  test('ST-05 Overview: the head, the tabs, the next step on Learning resources → ST-06', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, HUB);
    await expect(page.getByRole('heading', { level: 1, name: SHELL })).toBeVisible();
    await expectTabs(page, 'Overview');
    const resources = main(page).getByRole('region', { name: 'Learning resources' });
    await expect(resources).toContainText('Next step');
    await expect(
      main(page).getByRole('list', { name: 'Your formats' }).locator(':scope > li'),
    ).toHaveCount(2);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, SHELL);
    await expectNoReferences(page);
    await reachAndClick(page, resources.getByRole('link', { name: 'Open resources' }));
    await page.waitForURL(`**${HUB}/resources`);
    await expectTabs(page, 'Resources');
    await expect(main(page).getByRole('region', { name: 'Resources' })).toContainText(
      '3 resources · each opens in a new tab',
    );
  });

  test('ST-06 Resources: Open → “Opened in a new tab just now”; nothing becomes progress (T-13)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/resources`);
    const section = main(page).getByRole('region', { name: 'Resources' });
    await expect(resourceRows(page)).toHaveCount(3);
    await expect(resourceRows(page).first()).toContainText('Not opened yet');
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
    await expect(progressRows(page).nth(0)).toContainText('Not started');
    await expect(progressRows(page).nth(1)).toContainText('Not started');
  });

  test('ST-06 after Flow C: the lab brief’s first opening is kept', async ({ page }) => {
    await open(page, 'after-flow-c', RAHUL, `${HUB}/resources`);
    await expect(resourceRows(page).nth(0)).toContainText('Opened 12 Oct 2026, 09:40');
    await expect(resourceRows(page).nth(1)).toContainText('Not opened yet');
    await expect(
      main(page).getByRole('complementary', { name: 'How resources fit in' }),
    ).toContainText('1 of 3 opened');
    await checkState(page, SHELL);
  });

  test('ST-07 first visit, then WEB in progress and completed as the runtime reports them', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/simulation`);
    const web = cards(page).nth(0);
    const vr = cards(page).nth(1);
    await expect(web).toContainText('Not opened yet');
    await expect(web).toContainText('Not started');
    await expect(web.getByRole('link', { name: 'Open WEB' })).toHaveClass(/rb-btn--primary/);
    await expect(vr).toContainText('No headset session reported yet');
    await expect(main(page).locator('li.sv-xrow').nth(0)).toContainText(
      'Published for this experiment, not included in your institution’s access',
    );
    await expect(main(page).locator('li.sv-xrow').nth(1)).toContainText(
      'Not published for this experiment',
    );
    await expectTabs(page, 'Simulation');
    await checkState(page, SHELL);
    await expect(main(page)).not.toContainText(/stage/i);

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
    await expect(web).toContainText(/Last saved \d+\s\w{3}\s\d{4},\s\d\d:\d\d/);
    await expect(web).toContainText('Next step');
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
    await expect(web).toContainText(/Completed \d+\s\w{3}\s\d{4}/);
    await expect(vr.getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
    await checkState(page, SHELL);
  });

  test('ST-07 waiting for a licence: said once, without the plan; nothing opens', async ({
    page,
  }) => {
    await open(page, 'later-sample', ARUN, `${HUB}/simulation`);
    const chooser = main(page).getByRole('region', { name: 'Choose a format' });
    await expect(cards(page).nth(0)).toContainText('Waiting for a licence');
    await expect(chooser).toContainText('No licence is available for you right now.');
    await expect(chooser.getByRole('link')).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, SHELL);
  });

  test('ST-10 after Flow C: both completed, feedback sent, no verdict', async ({ page }) => {
    await open(page, 'after-flow-c', RAHUL, `${HUB}/progress`);
    await expect(progressRows(page).nth(0)).toContainText('Completed 14 Oct 2026');
    await expect(progressRows(page).nth(0)).toContainText('Feedback sent 14 Oct 2026');
    await expect(progressRows(page).nth(1)).toContainText('Completed 20 Oct 2026');
    await expect(progressRows(page).nth(1)).toContainText('Feedback sent 20 Oct 2026');
    await expect(main(page).locator('.sv-pas')).toContainText('Not set by your faculty yet');
    await expect(main(page)).not.toContainText('%');
    await expectTabs(page, 'Progress');
    await checkState(page, SHELL);
  });

  test('ST-10 WEB completed → Give feedback on WEB; VR → Open VR', async ({ page }) => {
    await open(page, 'after-flow-b', RAHUL, `${HUB}/progress`);
    await expect(progressRows(page).nth(0)).toContainText('Not started');
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL_ID,
      format: 'web',
      kind: 'completed',
    });
    await expect(
      progressRows(page).nth(0).getByRole('link', { name: 'Give feedback on WEB' }),
    ).toBeVisible();
    await expect(progressRows(page).nth(1).getByRole('link', { name: 'Open VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    await checkState(page, SHELL);
  });
});
