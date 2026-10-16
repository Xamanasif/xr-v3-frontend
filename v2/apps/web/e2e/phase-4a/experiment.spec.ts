import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-05 Experiment, the teaching view (board B4-03 f0 … f4) on the test-hook build, at 1440, 1024,
 * 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets,
 * 24 × 24 targets, no developer surface, no sideways scroll). Worlds: after Flow D (ASMT-0009
 * Ready, f0 / f4), after Flow C (no assessment yet, f1; a draft saved through `actAs`, f2), after
 * Flow B (nothing opened yet, f3). Since Phase 4B "Mark <n> written answer" opens FA-18 while answers
 * wait (none wait after Flow D: ATT-0450's marks are confirmed) and "See students on this
 * experiment" opens FA-20.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const ADDRESS = `/faculty/experiments/${SHELL}`;

async function open(page: Page, fixture: string, path = ADDRESS): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
}

const main = (page: Page) => page.locator('main');
const section = (page: Page, name: string) => page.getByRole('region', { name });
const squash = (value: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

/** The per-format rows: the format, then each count. */
async function countRows(page: Page): Promise<string[]> {
  return section(page, 'Student activity')
    .locator('ul.xa-counts > li')
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.children]
          .map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim())
          .join(' | '),
      ),
    );
}

test.describe('FA-05 Experiment (teaching view)', () => {
  test('f0 / f4: the Ready assessment, activity per format and the experiment; Open assessment reaches FA-08', async ({
    page,
  }) => {
    await open(page, 'after-flow-d');
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/courses');
    await expect(main(page).locator('a.xr-back')).toHaveAttribute('href', '/faculty/courses');
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveText(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    // Drawn in capitals (CSS), as the board shows it.
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveCSS(
      'text-transform',
      'uppercase',
    );
    await expect(main(page).locator('.xr-phead-meta .xl-inline > .xl-meta')).toHaveText([
      'Formats your institution has',
      'Formats used by your students',
    ]);
    await expect(main(page).locator('.xr-phead-meta .xr-fmt')).toHaveText([
      'WEB',
      'VR',
      'WEB',
      'VR',
    ]);

    const assessment = section(page, 'Assessment');
    const row = assessment.locator('li.xr-row');
    await expect(row.locator('.xr-row-title')).toHaveText('Heat Exchanger — post-lab');
    expect(squash(await row.locator('.xr-row-sub').textContent())).toBe(
      'Ready Due 14 Nov 2026, 23:59 · 1 of 1 submitted',
    );
    const openAssessment = row.getByRole('link', { name: 'Open assessment' });
    await expect(openAssessment).toHaveClass(/xr-btn--primary/);
    // Nothing waits for marking after Flow D, so "Mark <n> written answer" is not shown.
    await expect(assessment.getByRole('link')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Mark .* written answer/ })).toHaveCount(0);

    const activity = section(page, 'Student activity');
    await expect(activity.locator('.xr-section-body > p.xr-body')).toHaveText(
      '1 student has this experiment from your institution.',
    );
    expect(await countRows(page)).toEqual([
      'WEBWEB | 1 completed | 0 in progress | 0 not started',
      'VRVR | 1 completed | 0 in progress | 0 not started',
    ]);
    // Phase 4B: "See students on this experiment" opens FA-20 for it (the 4B suite follows it).
    await expect(
      activity.getByRole('link', { name: 'See students on this experiment' }),
    ).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);

    const about = section(page, 'About this experiment');
    await expect(about.locator('ul > li')).toHaveText([
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ]);
    await expect(about.locator('p.xl-open')).toHaveText(
      'One set of outcomes for the experiment, written by the Academic Reviewer. Read-only here.',
    );

    // f4: at 375 the row's action stacks under its text, and the page does not scroll sideways.
    const width = page.viewportSize()?.width ?? 1440;
    const text = await row.locator('.xr-row-text').boundingBox();
    const action = await openAssessment.boundingBox();
    if (width < 768) {
      expect(action!.y).toBeGreaterThanOrEqual(text!.y + text!.height - 1);
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    } else {
      expect(action!.x).toBeGreaterThan(text!.x + text!.width - 1);
    }
    await checkState(page, SHELL_NAME);

    await reachAndClick(page, openAssessment);
    await expect(page).toHaveURL(/\/faculty\/assessments\/ASMT-0009$/);
  });

  test('f1: no assessment yet — “Create assessment” carries the experiment to FA-07', async ({
    page,
  }) => {
    await open(page, 'after-flow-c');
    const assessment = section(page, 'Assessment');
    await expect(assessment.locator('.xr-empty h3')).toHaveText(
      'No assessment for this experiment yet',
    );
    await expect(assessment.locator('.xr-empty p.xr-body')).toHaveText(
      'Create one: choose the rules, add questions from your bank, preview it as a student.',
    );
    expect(await countRows(page)).toEqual([
      'WEBWEB | 1 completed | 0 in progress | 0 not started',
      'VRVR | 1 completed | 0 in progress | 0 not started',
    ]);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, assessment.getByRole('link', { name: 'Create assessment' }));
    await expect(page).toHaveURL(
      /\/faculty\/assessments\/new\?experimentId=shell-and-tube-heat-exchanger$/,
    );
  });

  test('f2: a draft saved elsewhere — the draft row and “Continue setting up” to FA-08', async ({
    page,
  }) => {
    await open(page, 'after-flow-c');
    await expect(section(page, 'Assessment').locator('.xr-empty')).toBeVisible();
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
    const row = section(page, 'Assessment').locator('li.xr-row');
    await expect(row.locator('.xr-row-sub')).toHaveText(
      'Draft — not ready Rules set · no questions yet. Students can’t see it.',
    );
    await expect(row.locator('.xr-row-icon')).toHaveClass(/xr-row-icon--wait/);
    const resume = row.getByRole('link', { name: 'Continue setting up' });
    await expect(resume).toHaveAttribute('href', `/faculty/assessments/${draft.value.id}`);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, resume);
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${draft.value.id}$`));
  });

  test('f3: no activity yet — “None yet” and the one line', async ({ page }) => {
    await open(page, 'after-flow-b');
    await expect(main(page).locator('.xr-phead-meta .xl-inline').nth(1)).toHaveText(
      'Formats used by your studentsNone yet',
    );
    const activity = section(page, 'Student activity');
    await expect(activity.locator('p.xr-body')).toHaveText(
      '1 student has this experiment. They haven’t opened it yet.',
    );
    await expect(activity.locator('ul.xa-counts')).toHaveCount(0);
    await expect(
      section(page, 'Assessment').getByRole('link', { name: 'Create assessment' }),
    ).toBeVisible();
    await checkState(page, SHELL_NAME);
  });

  test('an experiment outside the teaching scope is the in-shell not-found', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/experiments/fin-tube-bundle');
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});
