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
 * FA-01 Overview — the owner-approved V3 design (design/v3-refined-b/roles/FA-v1 `Main.dc.html`
 * FA-01) on the test-hook build, at 1440, 1024, 768 and 375. Each drawn state passes `checkState`
 * (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways
 * scroll). Worlds: after Flow C (27 Oct 2026) as Dr S. Ranganathan — the scope line, nothing needs
 * him (the calm state), Coming up once he saves a Ready assessment through the assessments port,
 * Your teaching — and as Dr Anita Desai, before and after Meera Iyer assigns her a Faculty course
 * (the no-course card → the scope line, in the same tab). Below 1020 px of page "Coming up" and
 * "Your teaching" stack. The priority band's "Mark now" (the oldest submission) is proved in
 * `e2e/phase-4b/marking.spec.ts`; the inactive Students need a sample clock the browser seam cannot
 * move (proved by the unit suite). No internal reference on any state.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const DESAI = { personId: 'per-0015' };
const MEERA = { personId: 'per-0001' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'thermodynamics-heat-transfer';
const NO_COURSES = 'Your Institute Admin hasn’t assigned you courses yet';
const LEAD = 'You teach 1 course with 1 experiment, as assigned by your Institute Admin.';
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

async function open(page: Page, person: { readonly personId: string }): Promise<void> {
  await bootWorld(page, { fixture: 'after-flow-c', session: person });
  await page.goto('/faculty');
}

const main = (page: Page) => page.locator('main');
const lead = (page: Page) => main(page).locator('.rk-head .rk-sub');
const band = (page: Page) => page.getByRole('region', { name: 'Needs your attention' });
const calm = (page: Page) => main(page).locator('.rb-calm[role="status"]');
const comingUp = (page: Page) => page.getByRole('region', { name: 'Coming up' });
const teaching = (page: Page) => page.getByRole('region', { name: 'Your teaching' });

interface Answer<T> {
  readonly ok: boolean;
  readonly value: T;
}

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

/** From 1020 px of page the panes sit side by side; below, Your teaching stacks under Coming up. */
async function expectPanes(page: Page): Promise<void> {
  const up = await comingUp(page).boundingBox();
  const teach = await teaching(page).boundingBox();
  if (!up || !teach) throw new Error('panes not laid out');
  if ((page.viewportSize()?.width ?? 1440) >= 1440) {
    expect(teach.x).toBeGreaterThan(up.x + up.width - 1);
  } else {
    expect(teach.y).toBeGreaterThanOrEqual(up.y + up.height - 1);
  }
}

test.describe('FA-01 Overview', () => {
  test('the scope line, the calm state, Coming up before an assessment, Your teaching; the Faculty rail', async ({
    page,
  }) => {
    await open(page, RANGANATHAN);
    await expect(teaching(page)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await expect(lead(page)).toHaveText(LEAD);
    await expect(calm(page).locator('.rb-calm-t')).toHaveText('Nothing needs you right now');
    await expect(calm(page)).toContainText(
      'Written answers to mark, drafts to review and inactive students appear here.',
    );
    await expect(band(page)).toHaveCount(0);
    await expect(comingUp(page).locator('p.fa-upi-none')).toHaveText(
      'No deadlines yet. They appear here once you create an assessment.',
    );
    await expect(teaching(page).locator('.fa-tc-h .rb-code')).toHaveText('ME ZG523');
    await expect(
      teaching(page).getByRole('list', {
        name: `Student activity by format for ${SHELL_NAME}, as of 27 Oct 2026`,
      }),
    ).toBeVisible();
    for (const name of [/^Mark now/, /^Review drafts/, /^View students/]) {
      await expect(main(page).getByRole('link', { name })).toHaveCount(0);
    }
    await expectPanes(page);
    await expectNoReferences(page);
    await checkState(page, 'Overview');

    await revealSidebar(page);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty');
    await expect(
      page.getByRole('navigation', { name: 'Faculty navigation' }).last().getByRole('link'),
    ).toHaveText(['Overview', 'My courses', 'Assessments', 'Question bank', 'Marking', 'Students']);
  });

  test('“Open course” in Your teaching opens the course, the experiment’s name the experiment, in the same tab', async ({
    page,
  }) => {
    await open(page, RANGANATHAN);
    await expect(teaching(page)).toBeVisible({ timeout: 60_000 });
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      teaching(page).getByRole('link', {
        name: 'Open course ME ZG523 Thermodynamics & Heat Transfer',
      }),
    );
    await expect(page).toHaveURL(new RegExp(`/faculty/courses/${THERMO}$`));
    await expectSameDocument(page, mark);
    await page.goBack();
    await reachAndClick(page, teaching(page).getByRole('link', { name: SHELL_NAME }));
    await expect(page).toHaveURL(new RegExp(`/faculty/experiments/${SHELL}$`));
    await expectSameDocument(page, mark);
  });

  test('Coming up: a Ready assessment due within 30 days — date tile, days left, meter, release; it opens its Summary', async ({
    page,
  }) => {
    await open(page, RANGANATHAN);
    await expect(teaching(page)).toBeVisible({ timeout: 60_000 });
    const id = await createReady(page);
    const item = comingUp(page).locator('li.fa-upi');
    await expect(item).toHaveCount(1);
    await expect(item.locator('.fa-date')).toHaveText('14Nov');
    await expect(item.locator('p.fa-upi-d').first()).toHaveText(
      'Due 14 Nov 2026, 23:59 · 18 days left',
    );
    // Rahul is the one Godavari Student the experiment reaches in this world.
    await expect(item.locator('.fa-upi-meter p')).toHaveText('0 of 1 student submitted');
    await expect(item.locator('p.fa-upi-rel')).toHaveText(
      'Students see results after the deadline',
    );
    const openLink = item.getByRole('link', {
      name: 'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
    });
    await expect(openLink).toHaveAttribute('href', `/faculty/assessments/${id}`);
    await expect(teaching(page).locator('.fa-te-asm')).toContainText('Assessment ready');
    await expect(calm(page)).toBeVisible();
    await expectNoReferences(page);
    await checkState(page, 'Overview');

    const mark = await markDocument(page);
    await reachAndClick(page, openLink);
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}$`));
    await expectSameDocument(page, mark);
  });

  test('no courses yet: the message card and Help & support only; Meera’s assignment brings the scope line', async ({
    page,
  }) => {
    await open(page, DESAI);
    const message = page.getByRole('heading', { level: 2, name: NO_COURSES });
    await expect(message).toBeVisible({ timeout: 60_000 });
    const card = page.getByRole('region', { name: NO_COURSES });
    await expect(card).toHaveClass(/fa-msgcard/);
    await expect(card).toContainText(
      'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
    );
    await expect(lead(page)).toHaveCount(0);
    await expect(band(page)).toHaveCount(0);
    await expect(comingUp(page)).toHaveCount(0);
    await expect(teaching(page)).toHaveCount(0);
    await expect(card.getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/faculty/help',
    );
    await expectNoReferences(page);
    await checkState(page, 'Overview');
    await revealSidebar(page);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty');
    await page.keyboard.press('Escape');

    // The Institute Admin assigns ME ZG523 to her in Faculty courses (IA-15), on the same world.
    await actAs(page, MEERA, {
      port: 'facultyCourses',
      method: 'assign',
      input: { facultyId: DESAI.personId, courseId: THERMO },
    });
    await expect(lead(page)).toHaveText(LEAD);
    await expect(message).toHaveCount(0);
    await expect(calm(page)).toBeVisible();
    await expect(teaching(page)).toBeVisible();
    await checkState(page, 'Overview');
  });

  test('Help & support in the no-course card opens the Faculty Help in the same tab', async ({
    page,
  }) => {
    await open(page, DESAI);
    await expect(page.getByRole('heading', { level: 2, name: NO_COURSES })).toBeVisible({
      timeout: 60_000,
    });
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      page.getByRole('region', { name: NO_COURSES }).getByRole('link', { name: 'Help & support' }),
    );
    await expect(page).toHaveURL(/\/faculty\/help$/);
    await expectSameDocument(page, mark);
  });
});
