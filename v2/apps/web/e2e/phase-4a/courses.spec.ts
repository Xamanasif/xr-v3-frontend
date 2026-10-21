import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-02 My courses (the course ledger), FA-04 its Experiments tab (the refined table) and FA-03
 * Course (the identity band and the experiment panels) — the owner-approved V3 design
 * (design/v3-refined-b/roles/FA-v1 `Main.dc.html` FA-02 · FA-04, FA-03) on the test-hook build, at
 * 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll). Worlds: after Flow C
 * (Dr S. Ranganathan teaches ME ZG523 → Shell-and-Tube, Rahul completed WEB and VR, no assessment
 * yet), after Flow D (the assessment Ready); Dr Anita Desai has no course mapped. The one world
 * moves the pages: an assessment created through the port and Meera's Faculty courses (IA-15), each
 * run through the CI-only `actAs` seam. Loading, couldn't load and access ended need a fault plan or
 * a later sample clock: they are proven by the unit suite. No internal reference on any state.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const DESAI = { personId: 'per-0015' };
const MEERA = { personId: 'per-0001' };
const THERMO = 'thermodynamics-heat-transfer';
const THERMO_NAME = 'Thermodynamics & Heat Transfer';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const NO_COURSES = 'Your Institute Admin hasn’t assigned you courses yet';
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

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
const card = (page: Page) => page.getByRole('region', { name: THERMO_NAME });
const experiments = (page: Page) => page.getByRole('region', { name: 'Experiments you teach' });
const table = (page: Page) => page.getByRole('table', { name: 'Experiments you teach' });
const count = (page: Page) => experiments(page).locator('.rk-statusline [role="status"]');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

/** No internal reference in the page's words or names (the owner's identifier rule). */
async function expectNoReferences(page: Page): Promise<void> {
  expect(await main(page).innerText()).not.toMatch(REFERENCE);
  const names = await main(page)
    .locator('[aria-label], [title], [placeholder]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        ['aria-label', 'title', 'placeholder']
          .map((name) => element.getAttribute(name) ?? '')
          .join(' '),
      ),
    );
  for (const name of names) expect(name).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

/** A course card's figures as "value term" (the value is drawn first, by CSS order). */
async function figures(page: Page, scope = card(page)): Promise<string[]> {
  return scope
    .locator('dl.fa-figs > div.fa-fig')
    .evaluateAll((items) =>
      items.map(
        (item) =>
          `${(item.querySelector('dd')?.textContent ?? '').trim()} ${(item.querySelector('dt')?.textContent ?? '').trim()}`,
      ),
    );
}

test.describe('FA-02 My courses', () => {
  test('the course ledger: the head, the tabs, the count, the card and its experiment row', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses');
    await expect(card(page)).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Courses your Institute Admin assigned you in Faculty courses',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expect(tabs(page).getByRole('link')).toHaveText(['Courses', 'Experiments']);
    await expect(tabs(page).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(main(page).locator('p.fa-listcount')).toHaveText('1 course · 1 experiment');
    await expect(card(page).locator('.fa-course-id .rb-code')).toHaveText('ME ZG523');
    expect(await figures(page)).toEqual([
      '1 Experiments',
      '1 Students with access',
      '0 Assessments',
    ]);
    await expect(
      card(page).getByRole('link', { name: `Open course ME ZG523 ${THERMO_NAME}` }),
    ).toHaveAttribute('href', `/faculty/courses/${THERMO}`);
    const row = card(page).getByRole('list', { name: 'Experiments in ME ZG523' }).locator('li');
    await expect(row.getByRole('link', { name: SHELL_NAME })).toHaveAttribute(
      'href',
      `/faculty/experiments/${SHELL}`,
    );
    await expect(row.locator('.fa-xasm')).toContainText('No assessment yet');
    // Below 700 px of card (`facourse`) the column heads go and each cell names itself.
    const heads = card(page).locator('.fa-xhead');
    const cardWidth = (await card(page).boundingBox())!.width;
    if (cardWidth >= 700) await expect(heads).toBeVisible();
    else await expect(heads).toBeHidden();
    await expectNoReferences(page);
    await checkState(page, 'My courses');
  });

  test('no course: the tabs stay, each tab says so in its card (the address stays)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', DESAI, '/faculty/courses');
    const courses = page.getByRole('region', { name: NO_COURSES });
    await expect(courses).toBeVisible({ timeout: 60_000 });
    await expect(courses).toContainText(
      'Courses appear here when they assign you one in Faculty courses.',
    );
    await expect(tabs(page).getByRole('link')).toHaveCount(2);
    await checkState(page, 'My courses');
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Experiments' }));
    await expect(page).toHaveURL(/\/faculty\/courses\?tab=experiments$/);
    const none = page.getByRole('region', { name: 'No experiments yet' });
    await expect(none).toContainText(
      'Experiments appear here when your Institute Admin assigns you a course that your institution holds.',
    );
    await checkState(page, 'My courses');
  });

  test('Meera removes and assigns Faculty courses: My courses follows in the same tab (IA-15)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses');
    await expect(card(page)).toBeVisible({ timeout: 60_000 });
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
    await expect(page.getByRole('heading', { level: 2, name: NO_COURSES })).toBeVisible();
    const assigned = await actAs<{ ok: boolean }>(page, MEERA, {
      port: 'facultyCourses',
      method: 'assign',
      input: { facultyId: RANGANATHAN.personId, courseId: THERMO },
    });
    expect(assigned.ok).toBe(true);
    await expect(card(page).locator('h3.fa-course-t')).toHaveText(THERMO_NAME);
  });
});

test.describe('FA-04 Experiments', () => {
  test('the tab: the toolbar, the count and the table; labelled rows below 760 px of table', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expect(tabs(page).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(count(page)).toHaveText('1 experiment');
    await expect(experiments(page).getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Experiment or course',
    );
    await expect(experiments(page).getByRole('combobox', { name: 'Format' })).toBeVisible();
    await expect(
      experiments(page).getByRole('combobox', { name: 'Student activity' }),
    ).toBeVisible();
    const row = table(page).locator('tbody tr');
    await expect(row.getByRole('link', { name: `Open ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      `/faculty/experiments/${SHELL}`,
    );
    await expect(
      row.getByRole('list', {
        name: `Student activity by format for ${SHELL_NAME}, as of 27 Oct 2026`,
      }),
    ).toBeVisible();
    await expect(row.locator('.fa-cellfoot')).toHaveText(
      '1 student with access · as of 27 Oct 2026',
    );
    await expect(row.locator('td').nth(2)).toContainText('No assessment yet');
    const header = table(page).locator('thead');
    const label = row.locator('td').nth(1).locator('.fa-lbl');
    if (width(page) >= 1440) {
      await expect(header).toBeVisible();
      await expect(label).toBeHidden();
    } else {
      await expect(header).toBeHidden();
      await expect(label).toHaveText('Student activity, by format');
    }
    await expectNoReferences(page);
    await checkState(page, 'My courses');
  });

  test('search, Format and Student activity filters, chips and no match', async ({ page }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const search = experiments(page).getByRole('searchbox', { name: 'Search' });
    await search.fill('fin-tube');
    await expect(count(page)).toHaveText('0 of 1 experiment');
    await expect(table(page)).toHaveCount(0);
    await expect(experiments(page).locator('.rk-chip')).toHaveText(['Search: “fin-tube”']);
    const state = experiments(page).locator('.rk-state');
    await expect(state.locator('.rk-state-t')).toHaveText('No experiment matches these filters');
    await checkState(page, 'My courses');
    await reachAndClick(page, state.getByRole('button', { name: 'Clear filters' }));
    await expect(count(page)).toHaveText('1 experiment');
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();

    await experiments(page).getByRole('combobox', { name: 'Format' }).selectOption('vr');
    await expect(experiments(page).locator('.rk-chip')).toHaveText(['Format: VR']);
    await expect(count(page)).toHaveText('1 of 1 experiment');
    const activity = experiments(page).getByRole('combobox', { name: 'Student activity' });
    await activity.selectOption('none');
    await expect(count(page)).toHaveText('0 of 1 experiment');
    await expect(experiments(page).locator('.rk-chip')).toHaveText([
      'Format: VR',
      'No activity yet',
    ]);
    await reachAndClick(
      page,
      experiments(page).getByRole('button', { name: 'Remove filter No activity yet' }),
    );
    await expect(count(page)).toHaveText('1 of 1 experiment');
    await expect(activity).toBeFocused();
    await reachAndClick(
      page,
      experiments(page).locator('.rk-statusline').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(experiments(page).locator('.rk-chip')).toHaveCount(0);
    await expect(table(page)).toBeVisible();
  });

  test('an assessment created through the port shows in the table and in the course card', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', RANGANATHAN, '/faculty/courses?tab=experiments');
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
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
    await expect(table(page).locator('tbody .xr-st')).toHaveText('Ready');
    await expect(table(page).locator('tbody .fa-cellname')).toHaveText('Heat Exchanger — post-lab');
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Courses' }));
    await expect(card(page)).toBeVisible();
    expect(await figures(page)).toEqual([
      '1 Experiments',
      '1 Students with access',
      '1 Assessments',
    ]);
  });
});

test.describe('FA-02 → FA-04 → FA-03 → FA-05', () => {
  test('tab switching keeps one document; Open course, then Open experiment', async ({ page }) => {
    await open(page, 'after-flow-d', RANGANATHAN, '/faculty/courses');
    await expect(card(page)).toBeVisible({ timeout: 60_000 });
    const mark = await markDocument(page);
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Experiments' }));
    await expect(page).toHaveURL(/\/faculty\/courses\?tab=experiments$/);
    await expect(table(page).locator('tbody .xr-st')).toHaveText('Ready');
    await reachAndClick(page, tabs(page).getByRole('link', { name: 'Courses' }));
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await expectSameDocument(page, mark);

    await reachAndClick(
      page,
      page.getByRole('link', { name: `Open course ME ZG523 ${THERMO_NAME}` }),
    );
    await expect(page).toHaveURL(new RegExp(`/faculty/courses/${THERMO}$`));
    await expect(page.getByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('ME ZG523');
    expect(await figures(page, main(page).locator('header.fa-cid'))).toEqual([
      '1 Experiment your institution holds',
      '1 Students with access',
      '1 Assessment ready',
    ]);
    const panel = page.getByRole('article', { name: SHELL_NAME });
    await expect(panel).toHaveCount(1);
    await expect(
      panel
        .getByRole('list', { name: `Student activity by format for ${SHELL_NAME}` })
        .locator(':scope > li'),
    ).toHaveCount(2);
    const assessment = panel.getByRole('region', { name: 'Assessment' });
    await expect(assessment.locator('.fa-xp-colh .xr-st')).toHaveText('Ready');
    await expect(assessment.locator('.fa-asm-subs p')).toHaveText('1 of 1 student submitted');
    await expect(panel.getByRole('link', { name: 'Students on this experiment' })).toHaveAttribute(
      'href',
      `/faculty/students?experimentId=${SHELL}`,
    );
    // Stacked below 760 px of panel: Assessment under Student activity.
    const activityBox = await panel
      .getByRole('region', { name: 'Student activity, by format' })
      .boundingBox();
    const assessmentBox = await assessment.boundingBox();
    if (width(page) >= 1440) expect(assessmentBox!.x).toBeGreaterThan(activityBox!.x);
    else expect(assessmentBox!.y).toBeGreaterThan(activityBox!.y);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expectNoReferences(page);
    await checkState(page, THERMO_NAME);

    await reachAndClick(page, panel.getByRole('link', { name: `Open experiment ${SHELL_NAME}` }));
    await expect(page).toHaveURL(new RegExp(`/faculty/experiments/${SHELL}$`));
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    await expectSameDocument(page, mark);
  });

  test('a course not mapped to the Faculty member is the in-shell not-found', async ({ page }) => {
    await open(page, 'after-flow-c', DESAI, `/faculty/courses/${THERMO}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
