import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, PAUSED_INSTITUTE_ADMIN } from '../support/workspace';

/**
 * IA-20 Usage (board B3-10 f0 … f4) on the test-hook build, at 1440, 1024, 768 and 375. Each
 * drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets,
 * no developer surface, no sideways scroll). Worlds: after Flow B (Rahul given Shell-and-Tube,
 * nothing opened: "No activity yet", f2), after Flow C (WEB and VR completed), after the device
 * flow; the runtime's own reports (the CI seam) move the figures in the same tab.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';

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
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'View' });

/** A table's body rows as their cells' text. */
async function cells(page: Page, name: string): Promise<string[][]> {
  return page
    .getByRole('table', { name })
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? '')),
    );
}

test.describe('IA-20 Usage', () => {
  test('by experiment and format: the figures per format and what they mean (f0, f3, f4)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/usage');
    const section = page.getByRole('region', { name: SHELL_NAME });
    await expect(section).toBeVisible();
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'How your content is being used · figures up to 27 Oct 2026',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/usage');
    await expect(
      viewSwitch(page).getByRole('button', { name: 'By experiment and format' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('.xr-section-head')).toContainText(
      'ME ZG523 · access plan ACC-0107',
    );
    await expect(section.locator('.xr-section-head')).toContainText('1 student with access');
    expect(await cells(page, `Usage by format for ${SHELL_NAME}`)).toEqual([
      ['WEBWEB', '1', '1', '1'],
      ['VRVR', '1', '1', '1'],
    ]);
    await expect(
      page.getByRole('region', { name: 'What the figures mean' }).locator('dt'),
    ).toHaveText(['Students with access', 'Started', 'Completed', 'Sessions']);
    // f4: below 760 px of content the table becomes labelled rows (the header row is hidden).
    const width = page.viewportSize()?.width ?? 1440;
    const header = section.locator('thead');
    if (width < 768) {
      await expect
        .poll(() => header.evaluate((element) => getComputedStyle(element).position))
        .toBe('absolute');
      const label = await section
        .locator('tbody tr:first-child td[data-label="Started"]')
        .evaluate((cell) => getComputedStyle(cell, '::before').content);
      expect(label).toBe('"Started"');
    } else {
      await expect(header).toBeVisible();
    }
    await checkState(page, 'Usage');
  });

  test('by course: the view switch mirrors into the address; started and completed stay per format (f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-device', MEERA, '/institute/usage');
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'By course' }));
    await expect(page).toHaveURL(/\/institute\/usage\?view=course$/);
    await expect(viewSwitch(page).getByRole('button', { name: 'By course' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const table = page.getByRole('table', { name: 'Usage by course' });
    await expect(table.locator('th')).toHaveText([
      'Course',
      'Experiments given',
      'Students with access',
      'Sessions (WEB · VR)',
    ]);
    expect(await cells(page, 'Usage by course')).toEqual([
      ['Thermodynamics & Heat TransferME ZG523', '1', '1', '1 · 1'],
    ]);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toHaveCount(0);
    await checkState(page, 'Usage');

    await reachAndClick(
      page,
      viewSwitch(page).getByRole('button', { name: 'By experiment and format' }),
    );
    await expect(page).toHaveURL(/\/institute\/usage$/);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
  });

  test('the course view by its address; an unknown view becomes the bare address', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/usage?view=course');
    await expect(page.getByRole('table', { name: 'Usage by course' })).toBeVisible();
    await page.goto('/institute/usage?view=charts');
    await expect(page).toHaveURL(/\/institute\/usage$/);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
  });

  test('no activity yet: one line and “Open Student access” (f2)', async ({ page }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/usage');
    await expect(page.getByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    await expect(main(page).locator('.xr-empty')).toContainText(
      'Figures appear when students open the experiments you’ve given them.',
    );
    await expect(viewSwitch(page)).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'What the figures mean' })).toHaveCount(0);
    await checkState(page, 'Usage');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open Student access' }));
    await expect(page).toHaveURL(/\/institute\/student-access$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Student access' })).toBeVisible();
  });

  test('the runtime’s own reports move the figures in the same tab — per format, never summed', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/usage');
    await expect(page.getByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'opened',
    });
    const caption = `Usage by format for ${SHELL_NAME}`;
    await expect(page.getByRole('table', { name: caption })).toBeVisible();
    await expect
      .poll(() => cells(page, caption))
      .toEqual([
        ['WEBWEB', '1', '0', '1'],
        ['VRVR', '0', '0', '0'],
      ]);
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'completed',
    });
    await expect
      .poll(() => cells(page, caption))
      .toEqual([
        ['WEBWEB', '1', '1', '1'],
        ['VRVR', '0', '0', '0'],
      ]);
    await checkState(page, 'Usage');
  });

  test('a paused institution’s Institute Admin reads the page as drawn', async ({ page }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute/usage');
    await expect(page.getByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/usage');
    await checkState(page, 'Usage');
  });
});
