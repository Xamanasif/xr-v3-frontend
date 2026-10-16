import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';

/**
 * FA-01 Overview (board B4-01 f0 … f4) on the test-hook build, at 1440, 1024, 768 and 375. Each
 * drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets,
 * no developer surface, no sideways scroll). Worlds: after Flow C (27 Oct 2026) as Dr S.
 * Ranganathan — the scope line, nothing needs him (f1), and Coming up once he saves a Ready
 * assessment through the assessments port (f0's row) — and as Dr Anita Desai, before and after
 * Meera Iyer assigns her a Faculty course (f2 → the scope line, in the same tab). At 375 the rows
 * stack their action under the text (f4). With nothing to mark and no inactive Student, none of the
 * Phase-4B actions shows; they are proved in `e2e/phase-4b/marking.spec.ts` (DEV-21 lifted).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const DESAI = { personId: 'per-0015' };
const MEERA = { personId: 'per-0001' };
const SHELL = 'shell-and-tube-heat-exchanger';
const INSTITUTION = 'Godavari Institute of Technology';
const NO_COURSES = 'Your Institute Admin hasn’t assigned you courses yet';

async function open(page: Page, person: { readonly personId: string }): Promise<void> {
  await bootWorld(page, { fixture: 'after-flow-c', session: person });
  await page.goto('/faculty');
}

const main = (page: Page) => page.locator('main');
const scopeLine = (page: Page) => main(page).locator('.xr-phead-meta');
const attention = (page: Page) => page.getByRole('region', { name: 'Needs your attention' });
const comingUp = (page: Page) => page.getByRole('region', { name: 'Coming up' });

interface Answer<T> {
  readonly ok: boolean;
  readonly value: T;
}

/** He saves a Ready assessment through the assessments port (FA-07 "Create"), as he would. */
async function createReady(page: Page): Promise<string> {
  const bank = await actAs<Answer<readonly { readonly question: { readonly id: string } }[]>>(
    page,
    RANGANATHAN,
    { port: 'questionBank', method: 'listQuestions', input: { experimentId: SHELL } },
  );
  expect(bank.ok).toBe(true);
  const created = await actAs<Answer<{ readonly id: string }>>(page, RANGANATHAN, {
    port: 'assessments',
    method: 'createAssessment',
    input: {
      mode: 'create',
      experimentId: SHELL,
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        // 18 days after the world's 27 Oct 2026: within the next 30 days.
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: [bank.value[0]!.question.id],
    },
  });
  expect(created.ok).toBe(true);
  return created.value.id;
}

/** Nothing to mark, no inactive Student: none of the Phase-4B actions B4-01 draws is on the page. */
async function expectNoPhase4BActions(page: Page): Promise<void> {
  for (const name of [/^Mark \d+ written answer/, 'Mark now', 'Review drafts', 'View students']) {
    await expect(main(page).getByRole('link', { name })).toHaveCount(0);
  }
  await expect(main(page).locator('.xr-phead-actions')).toHaveCount(0);
}

/** f4: below 600 px the row's action wraps under its text, at the text's left edge. */
async function expectStackedAt375(page: Page, row: ReturnType<Page['locator']>): Promise<void> {
  const text = await row.locator('.xr-row-text').boundingBox();
  const action = await row.locator('a.xr-btn').boundingBox();
  if (!text || !action) throw new Error('row not laid out');
  if ((page.viewportSize()?.width ?? 1440) < 600) {
    expect(action.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
    expect(action.x).toBeLessThan(text.x);
  } else {
    // From 768 the action sits at the row's end, beside the text.
    expect(action.x).toBeGreaterThan(text.x + text.width - 1);
  }
}

test.describe('FA-01 Overview', () => {
  test('the scope line, nothing needs him and nothing coming up; the Faculty sidebar (f1)', async ({
    page,
  }) => {
    await open(page, RANGANATHAN);
    await expect(attention(page)).toBeVisible();
    await expect(main(page).locator('.xr-overline')).toHaveText(INSTITUTION);
    await expect(scopeLine(page)).toHaveText('You teach 1 course · 1 experiment · My courses');
    await expect(attention(page).locator('.xr-empty h3')).toHaveText(
      'Nothing needs you right now.',
    );
    await expect(attention(page)).toContainText(
      'Written answers to mark, drafts to review and inactive students appear here.',
    );
    await expect(attention(page).locator('.xr-section-head .xr-meta')).toHaveCount(0);
    await expect(comingUp(page).locator('.xr-section-head .xr-meta')).toHaveText('at most 3');
    await expect(comingUp(page)).toContainText('No deadlines in the next 30 days.');
    await expectNoPhase4BActions(page);
    await checkState(page, 'Overview');

    await revealSidebar(page);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty');
    await expect(
      page.getByRole('navigation', { name: 'Faculty navigation' }).locator('.xr-nav-text'),
    ).toHaveText(['Overview', 'My courses', 'Assessments', 'Question bank', 'Marking', 'Students']);
  });

  test('“My courses” in the scope line opens My courses in the same tab', async ({ page }) => {
    await open(page, RANGANATHAN);
    await expect(scopeLine(page)).toBeVisible();
    const mark = await markDocument(page);
    await reachAndClick(page, scopeLine(page).getByRole('link', { name: 'My courses' }));
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await expectSameDocument(page, mark);
  });

  test('Coming up: a Ready assessment due within 30 days; Open opens its Summary (f0, f4)', async ({
    page,
  }) => {
    await open(page, RANGANATHAN);
    await expect(comingUp(page)).toContainText('No deadlines in the next 30 days.');
    const id = await createReady(page);
    const row = comingUp(page).locator('li.xr-row');
    await expect(row).toHaveCount(1);
    await expect(row.locator('.xr-row-title')).toHaveText('Heat Exchanger — post-lab');
    // Rahul is the one Godavari Student the experiment reaches in this world.
    await expect(row.locator('.xr-row-sub')).toHaveText(
      'Due 14 Nov 2026, 23:59 · 0 of 1 student submitted',
    );
    const openLink = row.getByRole('link', { name: 'Open' });
    await expect(openLink).toHaveAttribute('href', `/faculty/assessments/${id}`);
    await expect(attention(page)).toContainText('Nothing needs you right now.');
    await expectNoPhase4BActions(page);
    await expectStackedAt375(page, row);
    await checkState(page, 'Overview');

    const mark = await markDocument(page);
    await reachAndClick(page, openLink);
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}$`));
    await expectSameDocument(page, mark);
  });

  test('no courses yet: the message and Help only; Meera’s assignment brings the scope line (f2)', async ({
    page,
  }) => {
    await open(page, DESAI);
    const message = page.getByRole('heading', { level: 2, name: NO_COURSES });
    await expect(message).toBeVisible();
    await expect(main(page).locator('.xr-overline')).toHaveText(INSTITUTION);
    await expect(main(page)).toContainText(
      'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
    );
    await expect(scopeLine(page)).toHaveCount(0);
    await expect(attention(page)).toHaveCount(0);
    await expect(comingUp(page)).toHaveCount(0);
    const help = main(page).getByRole('link', { name: 'Help' });
    await expect(help).toHaveAttribute('href', '/faculty/help');
    await checkState(page, 'Overview');
    await revealSidebar(page);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty');
    await page.keyboard.press('Escape');

    // The Institute Admin assigns ME ZG523 to her in Faculty courses (IA-15), on the same world.
    await actAs(page, MEERA, {
      port: 'facultyCourses',
      method: 'assign',
      input: { facultyId: DESAI.personId, courseId: 'thermodynamics-heat-transfer' },
    });
    await expect(scopeLine(page)).toHaveText('You teach 1 course · 1 experiment · My courses');
    await expect(message).toHaveCount(0);
    await expect(attention(page)).toContainText('Nothing needs you right now.');
    await expect(comingUp(page)).toContainText('No deadlines in the next 30 days.');
    await checkState(page, 'Overview');
  });

  test('Help in the no-courses message opens the Faculty Help in the same tab (f2)', async ({
    page,
  }) => {
    await open(page, DESAI);
    await expect(page.getByRole('heading', { level: 2, name: NO_COURSES })).toBeVisible();
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Help' }));
    await expect(page).toHaveURL(/\/faculty\/help$/);
    await expectSameDocument(page, mark);
  });
});
