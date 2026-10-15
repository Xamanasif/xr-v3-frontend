import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-02 My courses, FA-04 its Experiments tab and FA-03 Course (board B4-02 f0 … f8) on the
 * test-hook build, at 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG
 * A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 * Worlds: after Flow C (Dr S. Ranganathan teaches ME ZG523 → Shell-and-Tube, Rahul completed WEB
 * and VR, no assessment yet), after Flow D (ASMT-0009 Ready); Dr Anita Desai has no course mapped
 * (f6). The one world moves the pages: an assessment created through the port and Meera's Faculty
 * courses (IA-15), each run through the CI-only `actAs` seam. Loading (f4), failed (f5) and access
 * ended (f7) need a fault plan or a later sample clock: they are proven by the unit suite.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const DESAI = { personId: 'per-0015' };
const MEERA = { personId: 'per-0001' };
const THERMO = 'thermodynamics-heat-transfer';
const THERMO_NAME = 'Thermodynamics & Heat Transfer';
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
const tabs = (page: Page) => page.getByRole('navigation', { name: 'My courses' });
const experiments = (page: Page) => page.getByRole('region', { name: 'Experiments you teach' });
const table = (page: Page) => page.getByRole('table', { name: 'Experiments you teach' });
const count = (page: Page) => experiments(page).locator('.xr-toolbar-status [role="status"]');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

/** The table's body rows as their cells' text. */
async function cells(page: Page): Promise<string[][]> {
  return table(page)
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll('td')].map((cell) =>
          (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
        ),
      ),
    );
}

test.describe('FA-02 My courses', () => {
  test('the Courses tab: the header, the tabs and the course row (f0)', async ({ page }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses');
    const section = page.getByRole('region', { name: 'Courses' });
    await expect(section.locator('li.xr-row')).toHaveCount(1);
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveText('Courses you teach');
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'From Faculty courses, set by your Institute Admin',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expect(tabs(page).getByRole('link')).toHaveText(['Courses', 'Experiments']);
    await expect(tabs(page).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText('1 course');
    await expect(section.locator('.xr-row-title')).toHaveText(THERMO_NAME);
    await expect(section.locator('.xr-row-sub')).toHaveText(
      'ME ZG523 · 1 experiment · 1 student with access · 0 assessments',
    );
    await expect(section.getByRole('link', { name: `Open course ${THERMO_NAME}` })).toHaveAttribute(
      'href',
      `/faculty/courses/${THERMO}`,
    );
    await checkState(page, 'My courses');
  });

  test('none assigned: the drawn empty state, no tabs (f6)', async ({ page }) => {
    await open(page, 'after-flow-c', DESAI, '/faculty/courses');
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Your Institute Admin hasn’t assigned you courses yet',
      }),
    ).toBeVisible();
    await expect(main(page).locator('.xr-empty')).toContainText(
      'Courses appear here when they assign you one in Faculty courses.',
    );
    await expect(tabs(page)).toHaveCount(0);
    await checkState(page, 'My courses');
    // The Experiments tab does not exist then: its address becomes the bare one.
    await page.goto('/faculty/courses?tab=experiments');
    await expect(page).toHaveURL(/\/faculty\/courses$/);
  });

  test('Meera removes and assigns Faculty courses: My courses follows in the same tab (IA-15)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses');
    await expect(page.getByRole('region', { name: 'Courses' }).locator('li.xr-row')).toHaveCount(1);
    const listed = await actAs<{
      ok: boolean;
      value: { id: string; rev: number; facultyId: string; removedAt: string | null }[];
    }>(page, MEERA, { port: 'facultyCourses', method: 'list' });
    const mapping = listed.value.find(
      (entry) => entry.facultyId === RANGANATHAN.personId && entry.removedAt === null,
    )!;
    const removed = await actAs<{ ok: boolean }>(page, MEERA, {
      port: 'facultyCourses',
      method: 'remove',
      input: { mappingId: mapping.id, expectedRev: mapping.rev },
    });
    expect(removed.ok).toBe(true);
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Your Institute Admin hasn’t assigned you courses yet',
      }),
    ).toBeVisible();
    await expect(tabs(page)).toHaveCount(0);
    const assigned = await actAs<{ ok: boolean }>(page, MEERA, {
      port: 'facultyCourses',
      method: 'assign',
      input: { facultyId: RANGANATHAN.personId, courseId: THERMO },
    });
    expect(assigned.ok).toBe(true);
    await expect(page.getByRole('region', { name: 'Courses' }).locator('.xr-row-title')).toHaveText(
      THERMO_NAME,
    );
  });
});

test.describe('FA-04 Experiments', () => {
  test('the tab: toolbar, count and the table per format; labelled rows at 375 (f2, f8)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expect(tabs(page).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(count(page)).toHaveText('1 experiment');
    await expect(table(page).locator('th')).toHaveText([
      'Experiment',
      'Formats your institution has',
      'Completed (WEB)',
      'Completed (VR)',
      'Assessment',
      'Action',
    ]);
    expect(await cells(page)).toEqual([
      [`${SHELL_NAME}ME ZG523`, 'WEBVR', '1', '1', 'No assessment yet', 'Open'],
    ]);
    // The Activity filter is `xr-filter-2`: hidden below 600 px of content (f8).
    const activity = experiments(page).getByRole('combobox', { name: 'Activity' });
    if (width(page) < 600) await expect(activity).toBeHidden();
    else await expect(activity).toBeVisible();
    const header = table(page).locator('thead');
    if (width(page) < 768) {
      await expect
        .poll(() => header.evaluate((element) => getComputedStyle(element).position))
        .toBe('absolute');
      const label = await table(page)
        .locator('tbody tr:first-child td[data-label="Completed (WEB)"]')
        .evaluate((cell) => getComputedStyle(cell, '::before').content);
      expect(label).toBe('"Completed (WEB)"');
    } else {
      await expect(header).toBeVisible();
    }
    await checkState(page, 'My courses');
  });

  test('search, Format and Activity filters, chips and no match (f3)', async ({ page }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible();
    const search = experiments(page).getByRole('searchbox', { name: 'Search experiments' });
    await search.fill('fin-tube');
    await expect(count(page)).toHaveText('0 experiments');
    await expect(table(page)).toHaveCount(0);
    const line = experiments(page).locator('.xr-section-body > p.xr-body');
    await expect(line).toHaveText('No experiment matches. Clear filters');
    await checkState(page, 'My courses');
    await reachAndClick(page, line.getByRole('button', { name: 'Clear filters' }));
    await expect(count(page)).toHaveText('1 experiment');
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();

    await experiments(page).getByRole('combobox', { name: 'Format' }).selectOption('vr');
    await expect(experiments(page).locator('.xr-fchip')).toHaveText(['Format: VR']);
    await expect(count(page)).toHaveText('1 experiment');
    if (width(page) >= 600) {
      await experiments(page).getByRole('combobox', { name: 'Activity' }).selectOption('none');
      await expect(count(page)).toHaveText('0 experiments');
      await expect(experiments(page).locator('.xr-fchip')).toHaveText([
        'Format: VR',
        'No activity yet',
      ]);
      await reachAndClick(
        page,
        experiments(page).getByRole('button', { name: 'Remove No activity yet' }),
      );
      await expect(count(page)).toHaveText('1 experiment');
    }
    await reachAndClick(
      page,
      experiments(page)
        .locator('.xr-toolbar-status')
        .getByRole('button', { name: 'Clear filters' }),
    );
    await expect(experiments(page).locator('.xr-fchip')).toHaveCount(0);
    await expect(table(page)).toBeVisible();
  });

  test('an assessment created through the port shows in the Assessment column and the course row', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible();
    const created = await actAs<{ ok: boolean }>(page, RANGANATHAN, {
      port: 'assessments',
      method: 'createAssessment',
      input: {
        mode: 'create',
        experimentId: SHELL,
        name: 'Heat Exchanger — post-lab',
        introduction: '',
        rules: {
          passMarkPercent: '50',
          attemptsAllowed: '2',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: 'after-deadline',
          releaseDate: null,
        },
        questions: ['Q-0101'],
      },
    });
    expect(created.ok).toBe(true);
    await expect(table(page).locator('tbody .xr-status')).toHaveText('Ready');
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Courses' }));
    await expect(page.getByRole('region', { name: 'Courses' }).locator('.xr-row-sub')).toHaveText(
      'ME ZG523 · 1 experiment · 1 student with access · 1 assessment',
    );
  });
});

test.describe('FA-02 → FA-04 → FA-03 → FA-05', () => {
  test('tab switching keeps one document; Open course, then Open experiment', async ({ page }) => {
    await open(page, 'after-flow-d', RANGANATHAN, '/faculty/courses');
    await expect(page.getByRole('region', { name: 'Courses' }).locator('li.xr-row')).toHaveCount(1);
    const mark = await markDocument(page);
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Experiments' }));
    await expect(page).toHaveURL(/\/faculty\/courses\?tab=experiments$/);
    await expect(table(page).locator('tbody .xr-status')).toHaveText('Ready');
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Courses' }));
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await expectSameDocument(page, mark);

    await reachAndClick(page, page.getByRole('link', { name: `Open course ${THERMO_NAME}` }));
    await expect(page).toHaveURL(new RegExp(`/faculty/courses/${THERMO}$`));
    const card = main(page).locator('li.xl-exp');
    await expect(card).toHaveCount(1);
    await expect(main(page).locator('.xr-phead-meta')).toContainText('ME ZG523');
    await expect(main(page).locator('.xr-phead-meta .xl-meta')).toHaveText(
      '1 experiment in your institution’s access · 1 student with access',
    );
    await expect(card.locator('.xl-exp-head .xr-status')).toHaveText('Assessment ready');
    await expect(card.locator('dl.xl-kv dd').nth(1)).toHaveText(
      'Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · 1 of 1 submitted',
    );
    await expect(
      card.getByRole('list', { name: 'Student activity by format' }).locator(':scope > li'),
    ).toHaveCount(2);
    await expect(card.getByRole('link', { name: 'Students on this experiment' })).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await checkState(page, THERMO_NAME);

    await reachAndClick(page, card.getByRole('link', { name: 'Open experiment' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/experiments/${SHELL}$`));
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    await expectSameDocument(page, mark);
  });

  test('a course not mapped to the Faculty member is the in-shell not-found', async ({ page }) => {
    await open(page, 'after-flow-c', DESAI, `/faculty/courses/${THERMO}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});
