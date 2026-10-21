import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-05 Experiment, the teaching view — the owner-approved V3 design (design/v3-refined-b/roles/
 * FA-v1 `Main.dc.html` FA-05) on the test-hook build, at 1440, 1024, 768 and 375. Each drawn state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). Worlds: after Flow D (the assessment Ready, Rahul's submission
 * marked), after Flow C (no assessment yet; a draft saved through `actAs`; a Ready one and a
 * submission → "Mark …" opens the oldest submission, FA-19), after Flow B (nothing opened yet). Under
 * 860 px of page the navy Assessment panel comes first. No internal reference on any state.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const ADDRESS = `/faculty/experiments/${SHELL}`;
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

async function open(page: Page, fixture: string, path = ADDRESS): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
}

const main = (page: Page) => page.locator('main');
const section = (page: Page, name: string) => page.getByRole('region', { name });
const aside = (page: Page) => page.getByRole('complementary', { name: 'Assessment' });
const panel = (page: Page) => aside(page).locator('.rk-panel-body');
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

/** The per-format rows (the separators between the three counts are drawn by CSS). */
async function progressRows(page: Page): Promise<string[]> {
  return section(page, 'Student activity, by format')
    .locator('ul.fa-prog > li')
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll('.xr-fmt, .fa-prog-t > span')]
          .map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim())
          .join(' | '),
      ),
    );
}

/** Under 860 px of page the panel comes first (`fa-asidefirst`); from 860 it sits beside the sheet. */
async function expectPanelPlace(page: Page): Promise<void> {
  const sheet = await main(page).locator('.rk-mainsheet').boundingBox();
  const box = await aside(page).boundingBox();
  if (!sheet || !box) throw new Error('not laid out');
  if (width(page) >= 1440) expect(box.x).toBeGreaterThan(sheet.x + sheet.width - 1);
  else expect(box.y + box.height).toBeLessThanOrEqual(sheet.y + 1);
}

test.describe('FA-05 Experiment (teaching view)', () => {
  test('Ready: the band and figures, activity per format, About and the navy panel; Open assessment reaches FA-08', async ({
    page,
  }) => {
    await open(page, 'after-flow-d');
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/faculty/courses',
    );
    await expect(crumbs.getByRole('link', { name: 'ME ZG523' })).toHaveAttribute(
      'href',
      '/faculty/courses/thermodynamics-heat-transfer',
    );
    await expect(main(page).locator('header.fa-cid .fa-cid-eyebrow')).toHaveText(
      'ME ZG523Experiment you teach · Thermodynamics & Heat Transfer',
    );
    await expect(
      main(page).getByRole('img', { name: 'Formats your institution has: WEB, VR' }),
    ).toBeVisible();
    await expect(
      main(page).getByRole('img', { name: 'Formats used by your students: WEB, VR' }),
    ).toBeVisible();

    const activity = section(page, 'Student activity, by format');
    await expect(activity.locator('.rk-sec-h .rk-hint')).toHaveText('As of 15 Nov 2026');
    expect(await progressRows(page)).toEqual([
      'WEB | 1 completed | 0 in progress | 0 not started',
      'VR | 1 completed | 0 in progress | 0 not started',
    ]);
    await expect(activity.locator('p.fa-xp-foot > span')).toHaveText(
      '1 student has this experiment from your institution.',
    );
    await expect(
      activity.getByRole('link', { name: 'Students on this experiment' }),
    ).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);
    const about = section(page, 'About this experiment');
    await expect(about.getByRole('list', { name: 'Learning outcomes' }).locator('li')).toHaveText([
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ]);
    await expect(about.locator('.fa-aboutgrid .rk-hint')).toHaveText(
      'One set of outcomes for the experiment, written by the Academic Reviewer. Read-only here.',
    );

    await expect(panel(page).locator('.fa-apanel-id .xr-st')).toHaveText('Ready');
    await expect(panel(page).locator('p.fa-asm-d')).toHaveText(
      'Deadline passed: 14 Nov 2026, 23:59',
    );
    await expect(panel(page).locator('.fa-asm-subs p')).toHaveText('1 of 1 student submitted');
    const openAssessment = panel(page).getByRole('link', { name: 'Open assessment' });
    await expect(openAssessment).not.toHaveClass(/rb-btn--primary/);
    // Nothing waits for marking after Flow D, so no "Mark …".
    await expect(page.getByRole('link', { name: /^Mark \d+ written answer/ })).toHaveCount(0);
    await expectPanelPlace(page);
    await expectNoReferences(page);
    await checkState(page, SHELL_NAME);

    await reachAndClick(page, openAssessment);
    await expect(page).toHaveURL(/\/faculty\/assessments\/ASMT-0009$/);
  });

  test('no assessment yet: “Create assessment” carries the experiment to FA-07', async ({
    page,
  }) => {
    await open(page, 'after-flow-c');
    await expect(panel(page).locator('.fa-apanel-id .fa-asm-n')).toHaveText(
      'No assessment for this experiment yet',
    );
    await expect(panel(page).locator('.fa-apanel-id .fa-asm-note')).toHaveText(
      'Create one: choose the rules, add questions from your bank, and preview it as a student. Assessments are set per experiment, not per format.',
    );
    expect(await progressRows(page)).toEqual([
      'WEB | 1 completed | 0 in progress | 0 not started',
      'VR | 1 completed | 0 in progress | 0 not started',
    ]);
    await expectNoReferences(page);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, panel(page).getByRole('link', { name: 'Create assessment' }));
    await expect(page).toHaveURL(
      /\/faculty\/assessments\/new\?experimentId=shell-and-tube-heat-exchanger$/,
    );
  });

  test('a draft saved elsewhere: “Draft — not ready”, why, and “Continue setting up” to FA-08', async ({
    page,
  }) => {
    await open(page, 'after-flow-c');
    await expect(panel(page).getByRole('link', { name: 'Create assessment' })).toBeVisible();
    const draft = await actAs<{ ok: boolean; value: { id: string } }>(page, RANGANATHAN, {
      port: 'assessments',
      method: 'createAssessment',
      input: {
        mode: 'save-as-draft',
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
        questions: [],
      },
    });
    expect(draft.ok).toBe(true);
    await expect(panel(page).locator('.fa-apanel-id .xr-st')).toHaveText('Draft — not ready');
    await expect(panel(page).locator('p.fa-asm-note')).toHaveText(
      'No questions yet · students can’t see it yet.',
    );
    const resume = panel(page).getByRole('link', { name: 'Continue setting up' });
    await expect(resume).toHaveAttribute('href', `/faculty/assessments/${draft.value.id}`);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, resume);
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${draft.value.id}$`));
  });

  test('a Ready assessment and Rahul’s submission: days left, the meter, “Mark 1 written answer” opens the oldest submission (FA-19)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c');
    await expect(panel(page).getByRole('link', { name: 'Create assessment' })).toBeVisible();
    const created = await actAs<{ ok: boolean; value: { id: string } }>(page, RANGANATHAN, {
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
        questions: ['Q-0101', 'Q-0106'],
      },
    });
    expect(created.ok).toBe(true);
    await expect(panel(page).locator('p.fa-asm-d')).toHaveText(
      'Due 14 Nov 2026, 23:59 · 18 days left',
    );
    const started = await actAs<{ ok: boolean; value: { id: string; rev: number } }>(page, RAHUL, {
      port: 'assessments',
      method: 'startAttempt',
      input: created.value.id,
    });
    expect(started.ok).toBe(true);
    const submitted = await actAs<{ ok: boolean }>(page, RAHUL, {
      port: 'assessments',
      method: 'submitAttempt',
      input: { attemptId: started.value.id, expectedRev: started.value.rev },
    });
    expect(submitted.ok).toBe(true);
    await expect(panel(page).locator('p.fa-asm-wait')).toHaveText(
      '1 written answer waiting for marking',
    );
    const mark = panel(page).getByRole('link', {
      name: 'Mark 1 written answer for Heat Exchanger — post-lab',
    });
    await expect(mark).toHaveAttribute('href', `/faculty/marking/${started.value.id}`);
    await expect(mark).toHaveClass(/rb-btn--primary/);
    await expectNoReferences(page);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, mark);
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${started.value.id}$`));
  });

  test('no activity yet: “None yet” used, every Student not started', async ({ page }) => {
    await open(page, 'after-flow-b');
    await expect(main(page).locator('header.fa-cid .fa-fig').nth(1)).toHaveText(
      'Formats your students have usedNone yet',
    );
    await expect(main(page).locator('header.fa-cid .fa-fig dd').nth(1)).toHaveClass(/is-quiet/);
    expect(await progressRows(page)).toEqual([
      'WEB | 0 completed | 0 in progress | 1 not started',
      'VR | 0 completed | 0 in progress | 1 not started',
    ]);
    await expect(panel(page).getByRole('link', { name: 'Create assessment' })).toBeVisible();
    await checkState(page, SHELL_NAME);
  });

  test('an experiment outside the teaching scope is the in-shell not-found', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/experiments/fin-tube-bundle');
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});
