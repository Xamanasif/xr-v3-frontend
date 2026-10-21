import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * ST-15 Progress and ST-16 Format feedback with its ST-17 Feedback sent state, in the owner-approved
 * V3 Student design (ST-v1 `progress`, `feedback`), with the ST-01 Up next "Give feedback" (B2-10
 * f5, home's describe), on the test-hook build at 1440, 1024, 768 and 375. Each state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets,
 * 24 × 24 targets, no developer surface, no sideways scroll). "In progress" and "Completed" are
 * reached only through the CI-only runtime-report seam (`reportRuntime`), never by a page or a
 * click (T-12). Worlds: after the setup (8 Oct, nothing given), after Flow B (SACC-0310, nothing
 * opened) and after Flow C (WEB completed 14 Oct and VR 20 Oct, feedback sent on both).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = { personId: 'per-0002' };
const SHELL_ID = 'shell-and-tube-heat-exchanger';
const SHELL = 'Shell-and-Tube Heat Exchanger';
const HUB = `/student/experiments/${SHELL_ID}`;

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RAHUL });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;
/** A format's table row, by its code (read in the row head: "Browser (WEB) Available to you"). */
const formatRow = (page: Page, code: string) =>
  main(page)
    .locator('table.sv-ptable tbody tr')
    .filter({ has: page.locator(`th .xr-sr:text-is(" (${code})")`) });
const count = (page: Page) => main(page).locator('.sv-ptools-s [role="status"]');

/** Nothing the Student reads names a record by its internal reference (lead decision 3). */
async function expectNoReference(page: Page): Promise<void> {
  await expect(main(page)).not.toContainText(REFERENCE);
  const labels = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const label of labels) expect(label).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

/** The runtime's own report through the CI-only seam (no product control writes it). */
async function runtime(
  page: Page,
  format: 'web' | 'vr',
  kind: 'opened' | 'saved' | 'session' | 'completed',
): Promise<void> {
  await reportRuntime(page, { person: RAHUL, experimentId: SHELL_ID, format, kind });
}

test.describe('ST-15 Progress', () => {
  test('before access: “Nothing to show yet” with Help & support; Progress is current', async ({
    page,
  }) => {
    await open(page, 'after-setup', '/student/progress');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Nothing to show yet' }),
    ).toBeVisible();
    await expect(
      main(page).locator('.sv-msg').getByRole('link', { name: 'Help & support' }),
    ).toHaveAttribute('href', '/student/help');
    await expect(main(page).locator('.sv-ptools')).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/progress');
    await checkState(page, 'Progress');
  });

  test('both completed, feedback sent: per-format pills and dated facts, no verdict; filters to no match', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', '/student/progress');
    await expect(formatRow(page, 'WEB').locator('.xr-st')).toHaveText('Completed 14 Oct 2026');
    await expect(formatRow(page, 'WEB').locator('.sv-pc-fact')).toHaveText([
      'First opened 12 Oct 2026, 10:05',
      'Reported by the simulation at 15:30',
      'Feedback sent 14 Oct 2026',
    ]);
    await expect(formatRow(page, 'VR').locator('.xr-st')).toHaveText('Completed 20 Oct 2026');
    await expect(formatRow(page, 'VR').locator('.sv-pc-fact')).toHaveText([
      'First session reported 16 Oct 2026, 14:10',
      'Reported from the headset at 11:15',
      'Feedback sent 20 Oct 2026',
    ]);
    const group = main(page).getByRole('group', { name: 'Thermodynamics & Heat Transfer' });
    await expect(group.locator('.sv-pexp-g')).toHaveText('Given by your institution');
    await expect(main(page).locator('.sv-pas')).toContainText('Not set by your faculty yet');
    await expect(main(page)).not.toContainText('%');
    await expectNoReference(page);
    await checkState(page, 'Progress');
    // Filters apply at once.
    await main(page).getByRole('combobox', { name: 'Status' }).selectOption('not-started');
    await expect(main(page).locator('.sv-pstate')).toContainText(
      'No experiments match these filters',
    );
    await expect(count(page)).toHaveText('0 of 1 experiment');
    await expect(
      page.getByRole('button', { name: 'Remove filter Status: Not started' }),
    ).toBeVisible();
    await checkState(page, 'Progress');
    await reachAndClick(
      page,
      main(page).locator('.sv-pstate').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(count(page)).toHaveText('1 experiment in 1 course');
    await expect(main(page).getByRole('combobox', { name: 'Status' })).toBeFocused();
  });

  test('WEB in progress only from the runtime’s report: “Last saved …”, “Continue WEB” the one gold action', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/student/progress');
    await expect(formatRow(page, 'WEB').locator('.xr-st')).toHaveText('Not started');
    await runtime(page, 'web', 'opened');
    await runtime(page, 'web', 'saved');
    await expect(formatRow(page, 'WEB').locator('.xr-st')).toHaveText('In progress');
    await expect(formatRow(page, 'WEB').locator('.sv-pc-fact').nth(1)).toHaveText(
      /^Last saved \d{1,2}\s[A-Z][a-z]{2}\s2026,\s\d\d:\d\d$/,
    );
    const go = formatRow(page, 'WEB').getByRole('link', { name: `Continue WEB, ${SHELL}` });
    await expect(go).toHaveAttribute('href', `${HUB}/simulation/web`);
    await expect(go).toHaveClass(/rb-btn--primary/);
    await expect(
      formatRow(page, 'VR').getByRole('link', { name: `Open VR, ${SHELL}` }),
    ).toHaveAttribute('href', `${HUB}/simulation/vr`);
    await expect(main(page).locator('.rb-btn--primary')).toHaveCount(1);
    await checkState(page, 'Progress');
  });
});

test.describe('ST-16 Format feedback and ST-17 Feedback sent', () => {
  test('WEB completed: Progress offers feedback on WEB only; validation first, then sent read-only', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/student/progress');
    await expect(formatRow(page, 'WEB').locator('.xr-st')).toHaveText('Not started');
    await runtime(page, 'web', 'opened');
    await runtime(page, 'web', 'completed');
    const give = formatRow(page, 'WEB').getByRole('link', {
      name: `Give feedback on WEB, ${SHELL}`,
    });
    await expect(give).toBeVisible();
    // VR is not completed: no feedback entry for it, not even a disabled one (BC5).
    await expect(formatRow(page, 'VR').getByRole('link', { name: /feedback/i })).toHaveCount(0);
    await expect(formatRow(page, 'VR').getByRole('button')).toHaveCount(0);
    await reachAndClick(page, give);
    await page.waitForURL(`**${HUB}/feedback/web`);
    await expect(page.getByRole('heading', { level: 1, name: 'Feedback on WEB' })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: SHELL }),
    ).toHaveAttribute('href', HUB);
    await expectNoReference(page);
    await checkState(page, 'Feedback on WEB');

    // Missing ratings: the service's summary takes focus and links each statement.
    await page.locator('label[for="feedback-q1-4"]').click();
    await page.locator('label[for="feedback-q3-5"]').click();
    await reachAndClick(page, page.getByRole('button', { name: 'Submit feedback' }));
    const summary = page.getByRole('alert').filter({ hasText: 'ratings are missing' });
    await expect(summary).toBeFocused();
    await expect(summary.locator('.rk-errsum-t')).toHaveText('3 ratings are missing');
    await expect(summary.getByRole('link')).toHaveText([
      'Choose a rating for statement 2',
      'Choose a rating for statement 4',
      'Choose a rating for statement 5',
    ]);
    await expect(page.locator('#feedback-q2')).toHaveClass(/is-invalid/);
    await checkState(page, 'Feedback on WEB');
    await summary.getByRole('link', { name: 'Choose a rating for statement 4' }).click();
    await expect(page.locator('#feedback-q4-1')).toBeFocused();

    for (const [statement, rating] of [
      [2, 4],
      [4, 3],
      [5, 4],
    ] as const) {
      await page.locator(`label[for="feedback-q${statement}-${rating}"]`).click();
    }
    await page
      .getByRole('textbox', { name: 'Additional comments (optional)' })
      .fill('The counter-flow run was easy to follow.');
    await reachAndClick(page, page.getByRole('button', { name: 'Submit feedback' }));
    const sent = page.getByRole('heading', { level: 1, name: 'Feedback on WEB sent' });
    await expect(sent).toBeVisible();
    await expect(sent).toBeFocused();
    await expect(main(page).locator('dl.sv-fbsent-dl')).toContainText(
      'The counter-flow run was easy to follow.',
    );
    await expect(page.getByRole('button', { name: 'Submit feedback' })).toHaveCount(0);
    await checkState(page, 'Feedback on WEB sent');

    // "See your progress": the sent fact on WEB, VR still without an entry.
    await reachAndClick(page, page.getByRole('link', { name: 'See your progress' }));
    await page.waitForURL('**/student/progress');
    await expect(formatRow(page, 'WEB')).toContainText('Feedback sent');
    await expect(formatRow(page, 'VR').getByRole('link', { name: /feedback/i })).toHaveCount(0);
  });

  test('VR sent on 20 Oct: read-only answers on the same scale, “Back to experiment”', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${HUB}/feedback/vr`);
    await expect(main(page).locator('.sv-fbsent-top')).toContainText(
      'Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Your answers · VR' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      HUB,
    );
    await expect(main(page).getByRole('radio')).toHaveCount(0);
    await expectNoReference(page);
    await checkState(page, 'Feedback on VR sent');
  });

  test('not open yet — VR given, not completed: the refusal card, no form', async ({ page }) => {
    await open(page, 'after-flow-b', `${HUB}/feedback/vr`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Feedback on VR isn’t open yet' }),
    ).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Back to VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    await expect(page.getByRole('button', { name: 'Submit feedback' })).toHaveCount(0);
    await checkState(page, 'Feedback on VR isn’t open yet');
  });
});

test.describe('ST-01 Up next', () => {
  test('a completed format without feedback: “Give feedback” opens that format’s form (B2-10 f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/student');
    await expect(page.getByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible();
    await runtime(page, 'web', 'opened');
    await runtime(page, 'web', 'completed');
    // V3 (ST-v1 `nextStep` "fb-WEB"): the cover's one next step.
    const step = main(page)
      .getByRole('region', { name: 'Continue learning' })
      .locator('.sv-step.is-next');
    await expect(step.locator('.sv-step-t')).toHaveText('Feedback on WEB is open');
    await expect(step.locator('.sv-step-d')).toHaveText('You completed WEB.');
    await checkState(page, 'Hello, Rahul');
    await reachAndClick(page, step.getByRole('link', { name: `Give feedback on WEB, ${SHELL}` }));
    await page.waitForURL(`**${HUB}/feedback/web`);
    // Arrival on ST-16 (the progress group's V3 head).
    await expect(page.getByRole('heading', { level: 1, name: 'Feedback on WEB' })).toBeVisible();
  });
});
