import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-06 Assessments and FA-07 Create assessment in the V3 Refined B design (FA-v1 `Main.dc.html`
 * "FA-06 Assessments", "FA-07 Create assessment"; earlier board B4-04 f0 … f11) on the test-hook build, at
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
const rows = (page: Page) => main(page).locator('table.fa-atable tbody tr');
const summaryLinks = (page: Page) => page.locator('#Cc-err li a');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;

/** No reference in the page's words, its accessible names and placeholders, or the tab title. */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].map(
      (element) =>
        `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('placeholder') ?? ''}`,
    );
    return [document.body.innerText, document.title, ...named].filter((text) => pattern.test(text));
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

/** "This assessment" beside the steps (below the form on narrow widths): each part's value. */
async function thisAssessment(page: Page) {
  const aside = page.getByRole('complementary', { name: 'This assessment' });
  await expect(aside).toBeVisible();
  return aside.locator('.fa-sum-v');
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

const Q0101 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q0104 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q0106 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';

test.describe('FA-06 Assessments', () => {
  test('no assessments yet, then the list as the service answers it with the waiting line', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(main(page).locator('.rk-state.rk-state--roomy')).toContainText(
      'Create an assessment for an experiment you teach. You can save a draft while you add questions.',
    );
    await expect(main(page).locator('.rk-state-t')).toHaveText('No assessments yet');
    await expect(main(page).getByRole('link', { name: 'Create assessment' })).toHaveCount(1);
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
    await expect(section.locator('.rk-statusline [role="status"]')).toHaveText('1 assessment');
    await expect(
      main(page).locator('.rk-head-act').getByRole('link', { name: 'Create assessment' }),
    ).toBeVisible();
    const row = rows(page).first();
    const link = row.getByRole('link', { name: 'Open Heat Exchanger — post-lab, Ready' });
    await expect(link).toHaveText('Heat Exchanger — post-lab');
    await expect(link).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    await expect(row.locator('td').nth(1).locator('.fa-cellname')).toHaveText(SHELL_NAME);
    await expect(row.locator('td').nth(1).locator('.fa-cellsub')).toHaveText(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    await expect(row.locator('td').nth(2).locator('.fa-cellname')).toHaveText('14 Nov 2026, 23:59');
    await expect(row.locator('.fa-left')).toHaveText('18 days left');
    await expect(row.locator('.fa-cellmeter .fa-cellline')).toHaveText('1 of 1 students submitted');
    await expect(row.locator('.fa-xwait')).toHaveText('1 waiting for marking');
    await expect(row.locator('.xr-st--ok')).toHaveText('Ready');
    // The State filter narrows the rows; no match offers Clear filters.
    const state = page.getByLabel('State', { exact: true });
    await state.selectOption({ label: 'Waiting for marking' });
    await expect(rows(page)).toHaveCount(1);
    await state.selectOption({ label: 'Draft — not ready' });
    await expect(rows(page)).toHaveCount(0);
    await expect(main(page).locator('.rk-state-t')).toHaveText(
      'No assessment matches these filters',
    );
    await checkState(page, 'Assessments');
    await main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByLabel('Search', { exact: true })).toBeFocused();
    // Below 760 px of table width (`fatable` container) the head goes and the rows are blocks (the
    // export's phone rows); at 1440 the table is a table.
    const headDisplay = () =>
      section.locator('thead').evaluate((element) => getComputedStyle(element).display);
    if (width(page) <= 768) await expect.poll(headDisplay).toBe('none');
    if (width(page) === 1440) await expect.poll(headDisplay).toBe('table-header-group');
    await expectNoReferences(page);
    await checkState(page, 'Assessments');
    // The whole row opens the record.
    await row.locator('td').nth(2).click();
    await expect(page).toHaveURL(/\/faculty\/assessments\/ASMT-0009$/);
  });

  test('a draft: Draft — not ready and what it lacks', async ({ page }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(main(page).locator('.rk-state-t')).toHaveText('No assessments yet');
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
    await expect(row.locator('td.fa-c-st .xr-st')).toHaveText('Draft — not ready');
    await expect(row.locator('.fa-cellsub0')).toHaveText(
      'No questions yet · students can’t see it',
    );
    await expect(
      row.getByRole('link', { name: 'Open Heat Exchanger — post-lab, Draft — not ready' }),
    ).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    await expectNoReferences(page);
    await checkState(page, 'Assessments');
  });

  test('no course assigned: the message card', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: { personId: 'per-0015' } });
    await page.goto(LIST);
    const card = page.getByRole('region', { name: 'No assessments yet' });
    await expect(card).toContainText(
      'Assessments appear here when your Institute Admin assigns you a course.',
    );
    await expect(page.getByRole('link', { name: 'Create assessment' })).toHaveCount(0);
    await checkState(page, 'Assessments');
  });
});

test.describe('FA-07 Create assessment', () => {
  test('the guided flow for real: experiment, rules (checked), questions, preview, Create — then FA-06', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(main(page).locator('.rk-state-t')).toHaveText('No assessments yet');
    await main(page).locator('.rk-state').getByRole('link', { name: 'Create assessment' }).click();
    await expect(page).toHaveURL(/\/faculty\/assessments\/new$/);

    // Step 1.
    await expect(h1(page)).toHaveText('Choose the experiment');
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Step 1 of 4');
    const steps = page.getByRole('list', { name: 'Steps to create an assessment' });
    await expect(steps.locator('[aria-current="step"]')).toContainText('Experiment');
    const radio = page.getByRole('radio', { name: new RegExp(SHELL_NAME) });
    await expect(radio.locator('xpath=ancestor::label')).toContainText(
      'ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet',
    );
    await expect(radio.locator('xpath=ancestor::label')).toContainText('1 student with access');
    await expect(radio).not.toBeChecked();
    await expect(await thisAssessment(page)).toHaveText([
      'Not chosen yet',
      'Not named yet',
      'Not set yet',
      'None yet',
    ]);
    await expectNoReferences(page);
    await checkState(page, 'Choose the experiment');
    await chooseShell(page);
    await expect(page).toHaveURL(/\?step=rules$/);

    // Every rule empty, no release option chosen.
    for (const label of ['Assessment name', 'Pass mark (%)', 'Attempts allowed', 'Deadline'])
      await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
    for (const option of await page.getByRole('radio').all())
      await expect(option).not.toBeChecked();
    await checkState(page, 'Set the rules');

    // The step's check with the service's words.
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
      SHELL_NAME,
      'Heat Exchanger — post-lab',
      'Pass mark 50.5%',
      'None yet',
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

    // The bank's questions, named by their words; one is needed.
    const list = page.getByRole('group', { name: 'Questions for this assessment' });
    await expect(list.getByRole('checkbox')).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'New question' })).toBeVisible();
    // Phase 4B: the drafting and import tools for this experiment.
    await expect(page.getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      /\/faculty\/question-bank\/draft\?experimentId=/,
    );
    await expect(page.getByRole('link', { name: 'Import' })).toHaveAttribute(
      'href',
      /\/faculty\/question-bank\/import\?experimentId=/,
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(summaryLinks(page)).toHaveText(['Add at least one question, or save as a draft']);
    await checkState(page, 'Add questions');
    for (const words of [Q0101, Q0104, Q0106])
      await list.getByRole('checkbox', { name: words }).check();
    await expect(main(page).locator('.fa-pickcount')).toHaveText('3 questions · 14 marks');
    await expectNoReferences(page);
    await checkState(page, 'Add questions');
    await continueTo(page, 'Preview and create');
    await expect(page).toHaveURL(/\?step=preview$/);

    // What students will see; nothing is created yet.
    await expect(main(page).locator('dl.fa-rules dd')).toHaveText([
      'Heat Exchanger — post-lab',
      '3 questions · 14 marks',
      '50% · 7 of 14 marks',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
      'None',
    ]);
    await expect(main(page).locator('ol.fa-qlist li.fa-q .fa-qt')).toHaveText([
      Q0101,
      Q0104,
      Q0106,
    ]);
    await expect(page.getByRole('complementary', { name: 'When you create it' })).toBeVisible();
    await checkState(page, 'Preview and create');

    // Back and forward through the address keep everything.
    await page.goBack();
    await expect(h1(page)).toHaveText('Add questions');
    await expect(list.getByRole('checkbox', { name: Q0104 })).toBeChecked();
    await page.goForward();
    await expect(h1(page)).toHaveText('Preview and create');

    // Create.
    await page.getByRole('button', { name: 'Create assessment' }).click();
    await expect(h1(page)).toHaveText('Assessment created');
    await expect(h1(page)).toBeFocused();
    const result = main(page).locator('.fa-result');
    await expect(result.locator('.xr-st--ok')).toHaveText('Ready');
    await expect(result.locator('.fa-result-t')).toHaveText(
      'Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it.',
    );
    await expect(
      page.getByRole('list', { name: 'Ready checklist' }).locator('li.is-ok'),
    ).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    await expectNoReferences(page);
    await checkState(page, 'Assessment created');

    // The one world: FA-06 lists it Ready.
    await page.getByRole('link', { name: 'Back to Assessments' }).click();
    await expect(page).toHaveURL(/\/faculty\/assessments$/);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().locator('.xr-st--ok')).toHaveText('Ready');
  });

  test('Save as draft: a name is all it needs; FA-06 shows the draft', async ({ page }) => {
    await open(page, 'after-flow-c', NEW);
    await expect(h1(page)).toHaveText('Choose the experiment');
    await chooseShell(page);
    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(summaryLinks(page)).toHaveText(['Enter a name to save a draft']);
    await typeRules(page);
    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(h1(page)).toHaveText('Saved as draft');
    const result = main(page).locator('.fa-result');
    await expect(result.locator('.xr-st')).toHaveText('Draft — not ready');
    await expect(result.locator('.fa-result-t')).toHaveText(
      'Students can’t see a draft. Finish what’s missing on the assessment.',
    );
    const checklist = page.getByRole('list', { name: 'Ready checklist' });
    await expect(checklist.locator('li.is-ok')).toHaveCount(2);
    await expect(checklist.locator('li.is-no')).toHaveText(['At least one question — none yet']);
    await expectNoReferences(page);
    await checkState(page, 'Saved as draft');

    await page.getByRole('link', { name: 'Back to Assessments' }).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().locator('td.fa-c-st .xr-st')).toHaveText('Draft — not ready');
  });

  test('the experiment already has an assessment', async ({ page }) => {
    await open(page, 'after-flow-d', NEW);
    const radio = page.getByRole('radio', { name: new RegExp(SHELL_NAME) });
    await expect(radio.locator('xpath=ancestor::label')).toContainText(
      'Already has an assessment: Heat Exchanger — post-lab',
    );
    await radio.check();
    const notice = main(page).locator('.rk-notice--info');
    await expect(notice).toContainText('This experiment already has an assessment');
    await expect(notice).toContainText(
      'Open Heat Exchanger — post-lab to change its questions or rules. One assessment per experiment is how this works for now.',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(summaryLinks(page)).toHaveText(['This experiment already has an assessment']);
    await expect(page.locator('#Cc-exp-e')).toHaveText('This experiment already has an assessment');
    await expect(h1(page)).toHaveText('Choose the experiment');
    await expectNoReferences(page);
    await checkState(page, 'Choose the experiment');
    await notice.getByRole('link', { name: 'Open Heat Exchanger — post-lab' }).click();
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
    const list = page.getByRole('group', { name: 'Questions for this assessment' });
    await list.getByRole('checkbox', { name: Q0101 }).check();
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
    await expect(list.getByRole('checkbox', { name: Q0101 })).toBeChecked();
    await expect(main(page).locator('.rk-notice--ok')).toContainText(
      'Saved to your question bank.It’s ticked below. You can untick it.',
    );
    await expect(await thisAssessment(page)).toHaveText([
      SHELL_NAME,
      'Heat Exchanger — post-lab',
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results after the deadline',
      '2 questions · 7 marks',
    ]);
    await expectNoReferences(page);
    await checkState(page, 'Add questions');
  });

  test('a step’s address before the earlier steps are done moves back to the first one to do', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${NEW}?step=preview`);
    await expect(h1(page)).toHaveText('Choose the experiment');
    await expect(page).toHaveURL(/\/faculty\/assessments\/new$/);
  });

  test('no course assigned: nothing to set an assessment on', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: { personId: 'per-0015' } });
    await page.goto(NEW);
    const card = page.getByRole('region', { name: 'Nothing to set an assessment on yet' });
    await expect(card).toContainText(
      'Assessments are set per experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
    );
    await expect(card.getByRole('link', { name: 'Back to Assessments' })).toHaveAttribute(
      'href',
      LIST,
    );
    await checkState(page, 'Choose the experiment');
  });
});
