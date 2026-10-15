import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3, ST-15 Progress (B3-05) and ST-16 Format feedback with its ST-17 Feedback sent state
 * (B3-06), with the ST-01 Up next "Give feedback" (B2-10 f5), on the test-hook build at 1440,
 * 1024, 768 and 375. Each state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets,
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
const formatLine = (page: Page, code: string) =>
  main(page)
    .locator('ul.xl-fl > li')
    .filter({ has: page.locator(`.xl-fl-fmt strong:text-is("${code}")`) });

/** The runtime's own report through the CI-only seam (no product control writes it). */
async function runtime(
  page: Page,
  format: 'web' | 'vr',
  kind: 'opened' | 'saved' | 'session' | 'completed',
): Promise<void> {
  await reportRuntime(page, { person: RAHUL, experimentId: SHELL_ID, format, kind });
}

test.describe('ST-15 Progress', () => {
  test('before access: “Nothing to show yet” with Help; Progress is current (B3-05 f4)', async ({
    page,
  }) => {
    await open(page, 'after-setup', '/student/progress');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Nothing to show yet' }),
    ).toBeVisible();
    await expect(main(page).locator('.xr-toolbar')).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/progress');
    await checkState(page, 'Progress');
  });

  test('both completed, feedback sent: per-format words and details, no verdict; filters to no match (B3-05 f2, f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', '/student/progress');
    await expect(formatLine(page, 'WEB')).toContainText('Completed 14 Oct 2026');
    await expect(formatLine(page, 'WEB')).toContainText('Feedback sent 14 Oct 2026');
    await expect(formatLine(page, 'VR')).toContainText('Completed 20 Oct 2026');
    await expect(formatLine(page, 'VR')).toContainText('Feedback sent 20 Oct 2026');
    await expect(
      main(page).getByRole('region', { name: 'Thermodynamics & Heat Transfer' }),
    ).toContainText('Given by your institution · SACC-0310');
    await expect(main(page)).not.toContainText('%');
    await checkState(page, 'Progress');
    await reachAndClick(page, main(page).locator('details.xl-more summary'));
    await expect(main(page).locator('details.xl-more dl')).toContainText(
      'First session reported 16 Oct 2026, 14:10 · completed 20 Oct 2026, 11:15',
    );
    await expect(main(page).locator('details.xl-more dl')).toContainText('None set yet');
    await checkState(page, 'Progress');
    // Filters apply at once (f3).
    await main(page).getByRole('combobox', { name: 'Status' }).selectOption('not-started');
    await expect(
      page.getByRole('heading', { level: 2, name: 'No experiments match these filters' }),
    ).toBeVisible();
    await expect(main(page).locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '0 experiments',
    );
    await expect(page.getByRole('button', { name: 'Remove Status: Not started' })).toBeVisible();
    await checkState(page, 'Progress');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(main(page).locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '1 experiment',
    );
    await expect(main(page).getByRole('combobox', { name: 'Status' })).toBeFocused();
  });

  test('WEB in progress only from the runtime’s report: “Last saved …”, “Continue WEB” (B3-05 f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/student/progress');
    await expect(formatLine(page, 'WEB')).toContainText('Not started');
    await expect(formatLine(page, 'WEB').locator('.xl-fl-state')).not.toContainText('In progress');
    await runtime(page, 'web', 'opened');
    await runtime(page, 'web', 'saved');
    await expect(formatLine(page, 'WEB')).toContainText(/In progress\s*Last saved \d/);
    await expect(
      formatLine(page, 'WEB').getByRole('link', { name: 'Continue WEB' }),
    ).toHaveAttribute('href', `${HUB}/simulation/web`);
    await expect(formatLine(page, 'VR').getByRole('link', { name: 'Open VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    await checkState(page, 'Progress');
  });
});

test.describe('ST-16 Format feedback and ST-17 Feedback sent', () => {
  test('WEB completed: Progress offers feedback on WEB only; validation first, then sent read-only (B3-06 f0, f1, f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/student/progress');
    await expect(formatLine(page, 'WEB')).toContainText('Not started');
    await runtime(page, 'web', 'opened');
    await runtime(page, 'web', 'completed');
    const give = formatLine(page, 'WEB').getByRole('link', { name: 'Give feedback on WEB' });
    await expect(give).toBeVisible();
    // VR is not completed: no feedback entry for it, not even a disabled one (BC5; f5).
    await expect(formatLine(page, 'VR').getByRole('link', { name: /feedback/i })).toHaveCount(0);
    await expect(formatLine(page, 'VR').getByRole('button')).toHaveCount(0);
    await reachAndClick(page, give);
    await page.waitForURL(`**${HUB}/feedback/web`);
    await expect(page.getByRole('heading', { level: 1, name: `${SHELL} WEB` })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, `${SHELL} WEB`);

    // Missing ratings (f1): the service's summary takes focus and links each statement.
    await page.locator('label[for="feedback-q1-4"]').click();
    await page.locator('label[for="feedback-q3-5"]').click();
    await reachAndClick(page, page.getByRole('button', { name: 'Submit feedback' }));
    const summary = page.getByRole('alert').filter({ hasText: 'ratings are missing' });
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('3 ratings are missing');
    await expect(summary.getByRole('link')).toHaveText([
      'Choose a rating for statement 2',
      'Choose a rating for statement 4',
      'Choose a rating for statement 5',
    ]);
    await checkState(page, `${SHELL} WEB`);
    await summary.getByRole('link', { name: 'Choose a rating for statement 4' }).click();
    await expect(page.locator('#feedback-q4 input[type="radio"]').first()).toBeFocused();

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
    await expect(main(page).locator('.xr-msg')).toBeFocused();
    await expect(page.getByRole('list', { name: 'Your answers' })).toContainText(
      'The counter-flow run was easy to follow.',
    );
    await expect(page.getByRole('button', { name: 'Submit feedback' })).toHaveCount(0);
    await checkState(page, 'Feedback on WEB sent');

    // "See your progress": the sent fact on WEB, VR still without an entry.
    await reachAndClick(page, page.getByRole('link', { name: 'See your progress' }));
    await page.waitForURL('**/student/progress');
    await expect(formatLine(page, 'WEB')).toContainText('Feedback sent');
    await expect(formatLine(page, 'VR').getByRole('link', { name: /feedback/i })).toHaveCount(0);
  });

  test('VR sent on 20 Oct: read-only answers, “Back to experiment” (B3-06 f4)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${HUB}/feedback/vr`);
    await expect(main(page).locator('.xr-msg')).toContainText(
      'Thank you. Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Your answers · VR' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      HUB,
    );
    await expect(main(page).getByRole('radio')).toHaveCount(0);
    await checkState(page, 'Feedback on VR sent');
  });

  test('not eligible — VR not completed — has no entry: the not-found pattern (B3-06 f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', `${HUB}/feedback/vr`);
    await expect(page.getByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit feedback' })).toHaveCount(0);
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
    const item = main(page).locator('.xr-row').filter({ hasText: 'Give feedback on WEB' });
    await expect(item).toContainText(`${SHELL} · you completed WEB`);
    await checkState(page, 'Hello, Rahul');
    await reachAndClick(page, item.getByRole('link', { name: 'Give feedback' }));
    await page.waitForURL(`**${HUB}/feedback/web`);
    await expect(page.getByRole('heading', { level: 1, name: `${SHELL} WEB` })).toBeVisible();
  });
});
