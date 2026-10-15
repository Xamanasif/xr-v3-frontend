import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-06 Assessments and FA-07 Create assessment (board B4-04 f0 … f11) on the test-hook build, at
 * 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll). The guided flow is
 * driven for real — clicks and typing, the deadline typed as "14 Nov 2026, 23:59" — on the one
 * world of the tab: after Flow C (Q-0101 … Q-0106 in the bank, no assessment) and after Flow D
 * (ASMT-0009 Ready). Other people's steps (Rahul submitting, a draft saved elsewhere) go through
 * the CI-only `actAs`, never a product shortcut.
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.describe.configure({ timeout: 180_000 });

const RANGANATHAN = { personId: 'per-0014' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const LIST = '/faculty/assessments';
const NEW = '/faculty/assessments/new';

const RULES = {
  passMarkPercent: '50',
  attemptsAllowed: '2',
  deadline: '2026-11-14T23:59:00+05:30',
  releaseOption: 'after-deadline',
  releaseDate: null,
};

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const rows = (page: Page) => main(page).locator('tbody tr');
const summaryLinks = (page: Page) => page.locator('#Cc-err li a');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

/** "This assessment": beside the steps from 860 px of content, a collapsible block below (f11). */
async function thisAssessment(page: Page) {
  const aside = page.getByRole('complementary', { name: 'This assessment' });
  const bar = main(page).locator('details.xw-sumbar');
  if (width(page) >= 1024) {
    await expect(aside).toBeVisible();
    await expect(bar).toBeHidden();
    return aside.locator('dd');
  }
  await expect(aside).toBeHidden();
  await expect(bar).toBeVisible();
  if ((await bar.getAttribute('open')) === null) await bar.locator('summary').click();
  return bar.locator('dd');
}

async function continueTo(page: Page, title: string) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(h1(page)).toHaveText(title);
}

async function chooseShell(page: Page) {
  await page.getByRole('radio', { name: new RegExp(SHELL_NAME) }).check();
  await continueTo(page, 'Set the rules');
}

async function typeRules(page: Page) {
  await page.getByLabel('Assessment name', { exact: true }).fill('Heat Exchanger — post-lab');
  await page.getByLabel('Pass mark (%)', { exact: true }).fill('50');
  await page.getByLabel('Attempts allowed', { exact: true }).fill('2');
  await page.getByLabel('Deadline', { exact: true }).pressSequentially('14 Nov 2026, 23:59');
  await page.getByRole('radio', { name: /After the deadline/ }).check();
}

test.describe('FA-06 Assessments', () => {
  test('no assessments yet (f9), then the list as the service answers it with the wait pill (f0)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 2, name: 'No assessments yet' })).toBeVisible();
    await expect(main(page).locator('.xr-empty')).toContainText(
      'Create an assessment for an experiment you teach. You can save a draft while you add questions.',
    );
    await expect(main(page).getByRole('link', { name: 'Create assessment' })).toHaveCount(2);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await checkState(page, 'Assessments');

    // Dr Ranganathan creates one elsewhere; Rahul answers the written question and submits.
    await actAs(page, RANGANATHAN, {
      port: 'assessments',
      method: 'createAssessment',
      input: {
        mode: 'create',
        experimentId: SHELL,
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: RULES,
        questions: ['Q-0101', 'Q-0106'],
      },
    });
    const attempt = await actAs<{ ok: boolean; value: { id: string; rev: number } }>(page, RAHUL, {
      port: 'assessments',
      method: 'startAttempt',
      input: 'ASMT-0009',
    });
    const saved = await actAs<{ ok: boolean; value: { id: string; rev: number } }>(page, RAHUL, {
      port: 'assessments',
      method: 'saveAnswer',
      input: {
        attemptId: attempt.value.id,
        questionId: 'Q-0106',
        answer: { type: 'written', text: 'Fouling adds a resistance, so U falls.' },
        expectedRev: attempt.value.rev,
      },
    });
    await actAs(page, RAHUL, {
      port: 'assessments',
      method: 'submitAttempt',
      input: { attemptId: saved.value.id, expectedRev: saved.value.rev },
    });

    await expect(rows(page)).toHaveCount(1);
    const section = page.getByRole('region', { name: 'All assessments' });
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText('1 assessment');
    const row = rows(page).first();
    await expect(row.locator('td').nth(0)).toHaveText('Heat Exchanger — post-labASMT-0009');
    await expect(row.locator('td').nth(1)).toHaveText(`${SHELL_NAME}ME ZG523`);
    await expect(row.locator('.xr-status--ok')).toHaveText('Ready');
    await expect(row.locator('td').nth(3)).toHaveText(
      'Due 14 Nov 2026, 23:59 · 1 of 1 submitted · 1 waiting for marking',
    );
    await expect(row.locator('.xr-status--wait')).toHaveText('1 waiting for marking');
    await expect(row.getByRole('link', { name: 'Open Heat Exchanger — post-lab' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    // The State filter leaves the bar below 600 px of content, as the v46 sheet draws it.
    const state = page.getByLabel('State', { exact: true });
    if (width(page) < 768) await expect(state).toBeHidden();
    else {
      await state.selectOption({ label: 'Waiting for marking' });
      await expect(rows(page)).toHaveCount(1);
      await state.selectOption({ label: 'Draft' });
      await expect(rows(page)).toHaveCount(0);
      await expect(
        page.getByRole('heading', { level: 2, name: 'No assessments match these filters' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Clear filters' }).click();
      await expect(rows(page)).toHaveCount(1);
    }
    // Below 760 px of content the rows are blocks (f10's narrow layout).
    if (width(page) < 1024) {
      await expect
        .poll(() => section.locator('thead').evaluate((el) => getComputedStyle(el).position))
        .toBe('absolute');
    }
    await checkState(page, 'Assessments');
  });

  test('a draft (f10): Draft — not ready, what it lacks, “Continue setting up”', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 2, name: 'No assessments yet' })).toBeVisible();
    await actAs(page, RANGANATHAN, {
      port: 'assessments',
      method: 'createAssessment',
      input: {
        mode: 'save-as-draft',
        experimentId: SHELL,
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: RULES,
        questions: [],
      },
    });
    await expect(rows(page)).toHaveCount(1);
    const row = rows(page).first();
    await expect(row.locator('.xr-status--wait')).toHaveText('Draft — not ready');
    await expect(row.locator('td').nth(3)).toHaveText(
      'Rules set · no questions yet · students can’t see it',
    );
    await expect(
      row.getByRole('link', { name: 'Continue setting up Heat Exchanger — post-lab' }),
    ).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    await checkState(page, 'Assessments');
  });
});

test.describe('FA-07 Create assessment', () => {
  test('the guided flow for real: experiment, rules (checked), questions, preview, Create — then FA-06', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 2, name: 'No assessments yet' })).toBeVisible();
    await page
      .locator('.xr-phead-actions')
      .getByRole('link', { name: 'Create assessment' })
      .click();
    await expect(page).toHaveURL(/\/faculty\/assessments\/new$/);

    // f1: step 1.
    await expect(h1(page)).toHaveText('Choose the experiment');
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveText('Step 1 of 4');
    const radio = page.getByRole('radio', { name: new RegExp(SHELL_NAME) });
    await expect(radio.locator('xpath=ancestor::label')).toContainText(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    await expect(radio).not.toBeChecked();
    await expect(await thisAssessment(page)).toHaveText([
      'Not chosen yet',
      'Not named yet',
      'Not set yet',
      'No questions yet',
    ]);
    await checkState(page, 'Choose the experiment');
    await chooseShell(page);
    await expect(page).toHaveURL(/\?step=rules$/);

    // f2 / f11: every rule empty, no release option chosen.
    for (const label of ['Assessment name', 'Pass mark (%)', 'Attempts allowed', 'Deadline'])
      await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
    for (const option of await page.getByRole('radio').all())
      await expect(option).not.toBeChecked();
    await checkState(page, 'Set the rules');

    // f3: the step's check with the drawn words.
    await page.getByLabel('Assessment name', { exact: true }).fill('Heat Exchanger — post-lab');
    await page.getByLabel('Pass mark (%)', { exact: true }).pressSequentially('50.5');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('#Cc-err')).toBeFocused();
    await expect(summaryLinks(page)).toHaveText([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
      'Enter the deadline',
      'Choose when students see their result',
    ]);
    await expect(await thisAssessment(page)).toHaveText([
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'Heat Exchanger — post-lab',
      'Pass mark 50.5%',
      'No questions yet',
    ]);
    await checkState(page, 'Set the rules');
    await summaryLinks(page).first().click();
    await expect(page.getByLabel('Pass mark (%)', { exact: true })).toBeFocused();

    await page.getByLabel('Pass mark (%)', { exact: true }).fill('50');
    await page.getByLabel('Attempts allowed', { exact: true }).pressSequentially('2');
    await page.getByLabel('Deadline', { exact: true }).pressSequentially('14 Nov 2026, 23:59');
    await page.getByRole('radio', { name: /After the deadline/ }).check();
    await continueTo(page, 'Add questions');
    await expect(page).toHaveURL(/\?step=questions$/);

    // f4: the bank's questions; one is needed.
    const list = page.getByRole('list', { name: 'Questions' });
    await expect(list.getByRole('checkbox')).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'New question' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Draft with assistance' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Import' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(summaryLinks(page)).toHaveText(['Add at least one question, or save as a draft']);
    for (const id of ['Q-0101', 'Q-0104', 'Q-0106'])
      await list.getByRole('checkbox', { name: new RegExp(id) }).check();
    await expect(main(page).locator('.xr-section [role="status"]').first()).toHaveText(
      '3 questions · 14 marks',
    );
    await checkState(page, 'Add questions');
    await continueTo(page, 'Preview and create');
    await expect(page).toHaveURL(/\?step=preview$/);

    // f5: what students will see; nothing is created yet.
    await expect(main(page).locator('dl.xl-kv dd')).toHaveText([
      'Heat Exchanger — post-lab',
      '3 questions · 14 marks',
      '50%',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
    ]);
    await expect(main(page).locator('.xa-q-n')).toHaveText([
      'Question 1 · Multiple choice · 2 marks',
      'Question 2 · True or false · 2 marks',
      'Question 3 · Written answer · 10 marks',
    ]);
    await checkState(page, 'Preview and create');

    // Back and forward through the address keep everything.
    await page.goBack();
    await expect(h1(page)).toHaveText('Add questions');
    await expect(list.getByRole('checkbox', { name: /Q-0104/ })).toBeChecked();
    await page.goForward();
    await expect(h1(page)).toHaveText('Preview and create');

    // f6: Create.
    await page.getByRole('button', { name: 'Create assessment' }).click();
    await expect(h1(page)).toHaveText('Assessment created');
    await expect(h1(page)).toBeFocused();
    await expect(main(page).locator('.xr-notice--ok')).toContainText('ASMT-0009 · Ready');
    await expect(main(page).locator('.xr-notice--ok')).toContainText(
      'Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it.',
    );
    await expect(page.getByRole('list', { name: 'Ready checklist' }).locator('.is-ok')).toHaveCount(
      2,
    );
    await expect(page.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    await checkState(page, 'Assessment created');

    // The one world: FA-06 lists it Ready.
    await main(page).locator('a.xr-back').click();
    await expect(page).toHaveURL(/\/faculty\/assessments$/);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().locator('.xr-status--ok')).toHaveText('Ready');
  });

  test('Save as draft (f7): a name is all it needs; FA-06 shows the draft', async ({ page }) => {
    await open(page, 'after-flow-c', NEW);
    await expect(h1(page)).toHaveText('Choose the experiment');
    await chooseShell(page);
    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(summaryLinks(page)).toHaveText(['Enter a name to save a draft']);
    await typeRules(page);
    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(h1(page)).toHaveText('Saved as draft');
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'ASMT-0009 · Draft — not ready',
    );
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'Students can’t see a draft. Finish what’s missing below.',
    );
    const checklist = page.getByRole('list', { name: 'Ready checklist' });
    await expect(checklist.locator('li').nth(0).locator('.is-ok')).toHaveCount(1);
    await expect(checklist.locator('li').nth(1).locator('.is-no')).toHaveCount(1);
    await checkState(page, 'Saved as draft');

    await main(page).locator('a.xr-back').click();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().locator('.xr-status--wait')).toHaveText('Draft — not ready');
  });

  test('the experiment already has an assessment (f8)', async ({ page }) => {
    await open(page, 'after-flow-d', NEW);
    const radio = page.getByRole('radio', { name: new RegExp(SHELL_NAME) });
    await expect(radio.locator('xpath=ancestor::label')).toContainText(
      'Already has an assessment: Heat Exchanger — post-lab',
    );
    await radio.check();
    const notice = main(page).locator('.xr-notice--warn');
    await expect(notice).toContainText('This experiment already has an assessment');
    await expect(notice).toContainText(
      'Open Heat Exchanger — post-lab to change its questions or rules. One assessment per experiment is how this works for now (open decision).',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(summaryLinks(page)).toHaveText(['This experiment already has an assessment']);
    await expect(page.locator('#Cc-exp-e')).toHaveText('This experiment already has an assessment');
    await expect(h1(page)).toHaveText('Choose the experiment');
    await checkState(page, 'Choose the experiment');
    await notice.getByRole('link', { name: 'Heat Exchanger — post-lab' }).click();
    await expect(page).toHaveURL(/\/faculty\/assessments\/ASMT-0009$/);
  });

  test('“New question” (FA-15) and back: step 3 with the new question chosen and everything kept', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', NEW);
    await expect(h1(page)).toHaveText('Choose the experiment');
    await chooseShell(page);
    await typeRules(page);
    await continueTo(page, 'Add questions');
    const list = page.getByRole('list', { name: 'Questions' });
    await list.getByRole('checkbox', { name: /Q-0101/ }).check();
    await page.getByRole('link', { name: 'New question' }).click();
    await expect(h1(page)).toHaveText('Add a question');
    await page.getByRole('radio', { name: /Written answer/ }).check();
    await page
      .getByLabel('Question', { exact: true })
      .fill('Sketch the temperature profiles of both streams in counter flow.');
    await page.getByLabel('Marks', { exact: true }).fill('5');
    await page.getByRole('button', { name: 'Save question' }).click();
    await expect(h1(page)).toHaveText('Add questions');
    await expect(page).toHaveURL(/\?step=questions&experimentId=shell-and-tube-heat-exchanger$/);
    await expect(list.getByRole('checkbox')).toHaveCount(7);
    await expect(
      list.getByRole('checkbox', { name: /Sketch the temperature profiles/ }),
    ).toBeChecked();
    await expect(list.getByRole('checkbox', { name: /Q-0101/ })).toBeChecked();
    await expect(await thisAssessment(page)).toHaveText([
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'Heat Exchanger — post-lab',
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline',
      '2 questions · 7 marks',
    ]);
    await checkState(page, 'Add questions');
  });

  test('a step’s address before the earlier steps are done moves back to the first one to do', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${NEW}?step=preview`);
    await expect(h1(page)).toHaveText('Choose the experiment');
    await expect(page).toHaveURL(/\/faculty\/assessments\/new$/);
  });
});
