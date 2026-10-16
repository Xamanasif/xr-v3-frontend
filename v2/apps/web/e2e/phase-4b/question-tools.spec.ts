import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-16 Draft questions with assistance and FA-17 Import questions (board B4-08 f0 … f9), and
 * FA-14's Draft with assistance / Import actions and Drafts to review tab (B4-07 f0, f1, f7), on
 * the test-hook build at 1440, 1024, 768 and 375, as Dr S. Ranganathan after Flow C (Q-0101 …
 * Q-0106 for Shell-and-Tube). The drafts come from the sample stand-in, and the page says so;
 * the page's own interactions — the choices, "Draft questions", "Review and edit", "Add to bank",
 * "Discard", the tabs, the file chooser (in-memory CSV files), "Check file", "Continue",
 * "Import 8 questions" — are real; `actAs` (the CI seam) only sets states up and reads the world
 * back. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24
 * targets, no developer surface, no sideways scroll). Drafting failing for now (f3) needs a fault
 * plan the browser seam does not offer: the unit suite proves it.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 150_000 });

const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const BANK = `/faculty/question-bank?experimentId=${SHELL}`;
const DRAFT = `/faculty/question-bank/draft?experimentId=${SHELL}`;
const IMPORT = `/faculty/question-bank/import?experimentId=${SHELL}`;
const DRAFTS_TAB = `/faculty/question-bank?tab=drafts&experimentId=${SHELL}`;
const STAND_IN = /^Sample drafts: no drafting service is connected yet/;

const F1_DRAFTS = [
  'What is the log mean temperature difference (LMTD) used for?',
  'Counter flow always needs a larger area than parallel flow for the same duty.',
  'Compare countercurrent and cocurrent arrangements at matched duty, using your readings.',
];

const HEADER =
  'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance';

/** B4-08 f6's file: 8 rows — row 3 "correct is E", row 6 "multi-select", row 7 no explanation. */
const WITH_ERRORS = [
  HEADER,
  'multiple choice,What does the effectiveness compare?,Actual to maximum heat transfer,Two flow rates,Two areas,Two temperatures,A,2,It compares q to q_max.,',
  'multiple choice,What does C_min stand for?,The smaller heat-capacity rate,The larger heat-capacity rate,The cold inlet temperature,The minimum area,E,2,C_min is the smaller of C_h and C_c.,',
  'true or false,Counter flow can bring the cold outlet above the hot outlet.,,,,,TRUE,2,Only counter flow allows a temperature cross.,',
  'true or false,Parallel flow always needs less area.,,,,,FALSE,2,Counter flow needs less area for the same duty.,',
  'multi-select,Which statements about fouling are true? (choose two),It lowers U,It raises U,It adds a resistance,It has no effect,"A,C",2,Fouling adds a resistance.,',
  'written answer,State the units of the overall heat transfer coefficient.,,,,,,2,,Look for W/m²K.',
  'written answer,Explain how NTU relates to effectiveness.,,,,,,10,More NTU gives more effectiveness.,Look for the trend.',
  'multiple choice,Which rate sets q_max?,C_min,C_max,Both,Neither,A,2,q_max = C_min times the largest temperature difference.,',
].join('\r\n');

/** The corrected file: the two errors fixed, the warning kept (f7). */
const CORRECTED = WITH_ERRORS.replace(',E,2,', ',A,2,').replace(
  'multi-select,Which statements about fouling are true? (choose two),It lowers U,It raises U,It adds a resistance,It has no effect,"A,C"',
  'multiple choice,Which statement about fouling is true?,It lowers U,It raises U,It removes a resistance,It has no effect,A',
);

const csv = (name: string, text: string) => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(text, 'utf8'),
});

async function open(page: Page, path: string): Promise<void> {
  await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const draftRows = (page: Page) => main(page).locator('ul.xr-rows > li.xr-row');

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

async function port<T>(page: Page, portKey: string, method: string, input?: unknown): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, RANGANATHAN, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

async function bankQuestions(page: Page) {
  return port<readonly { readonly question: { readonly id: string; readonly origin: string } }[]>(
    page,
    'questionBank',
    'listQuestions',
    { experimentId: SHELL },
  );
}

/** f1's request through the page: the lab brief, every type, 3 drafts. */
async function requestThree(page: Page): Promise<void> {
  await page.getByRole('radio', { name: /The experiment’s lab brief/ }).check();
  for (const type of ['Multiple choice', 'True or false', 'Written answer']) {
    await page.getByRole('checkbox', { name: type }).check();
  }
  await page.getByRole('combobox', { name: 'How many drafts' }).selectOption('3');
  await reachAndClick(page, page.getByRole('button', { name: 'Draft questions' }));
  await expect(page.getByRole('heading', { level: 2, name: 'Drafts to review' })).toBeFocused();
}

test.describe('FA-16 Draft questions with assistance', () => {
  test('the form, its validation and the filled choices (f0, f2, f3, f4)', async ({ page }) => {
    await open(page, DRAFT);
    const form = page.getByRole('form', { name: 'Draft questions with assistance' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(SHELL_NAME);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/question-bank');
    await expect(form.getByRole('note')).toHaveText(STAND_IN);
    await expect(form.locator('.xr-choice-sub').first()).toHaveText(
      'Lab brief — Shell-and-Tube Heat Exchanger',
    );
    await expect(form.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `/faculty/question-bank?experimentId=${SHELL}`,
    );
    await checkState(page, 'Draft questions with assistance');

    // f2: nothing chosen — the service's words, the summary focused.
    await reachAndClick(page, form.getByRole('button', { name: 'Draft questions' }));
    const summary = form.locator('.xw-errsum');
    await expect(summary).toBeFocused();
    await expect(summary.locator('strong')).toHaveText('Check these choices');
    await expect(summary.getByRole('link')).toHaveText([
      'Choose the material to draft from',
      'Choose at least one question type',
      'Choose how many drafts you want',
    ]);
    await checkState(page, 'Draft questions with assistance');
    await summary.getByRole('link', { name: 'Choose how many drafts you want' }).press('Enter');
    await expect(form.getByRole('combobox', { name: 'How many drafts' })).toBeFocused();

    // f3 / f4: the choices made; each clears its error.
    await form.getByRole('radio', { name: /The experiment’s lab brief/ }).check();
    await form.getByRole('checkbox', { name: 'Multiple choice' }).check();
    await form.getByRole('combobox', { name: 'How many drafts' }).selectOption('3');
    await expect(form.locator('.xr-error')).toHaveCount(0);
    await expect(form.locator('label.xr-choice.is-checked')).toHaveCount(1);
    await checkState(page, 'Draft questions with assistance');

    // "Text I paste" shows its text box.
    await form.getByRole('radio', { name: /Text I paste/ }).check();
    await expect(form.getByRole('textbox', { name: 'Text to draft from' })).toBeVisible();
    await checkState(page, 'Draft questions with assistance');
  });

  test('drafts to review: add with marks, review and edit, discard, draft more (f1)', async ({
    page,
  }) => {
    await open(page, DRAFT);
    await expect(page.getByRole('button', { name: 'Draft questions' })).toBeVisible({
      timeout: 60_000,
    });
    await requestThree(page);
    const section = page.getByRole('region', { name: 'Drafts to review' });
    await expect(section.locator('.xr-section-head [role="status"]')).toHaveText(
      '3 left to review',
    );
    await expect(section.getByRole('note')).toHaveText(STAND_IN);
    await expect(draftRows(page).locator('.xr-row-title')).toHaveText(F1_DRAFTS);
    await expect(draftRows(page).first().locator('.xa-tag')).toHaveText([
      'Draft — needs your review',
      'Drafted with assistance',
    ]);
    await expect(section).not.toContainText('marks');
    await checkState(page, 'Draft questions with assistance');
    expect(await bankQuestions(page)).toHaveLength(6);

    // "Add to bank" without marks: the draft's fields open with the marks error.
    await reachAndClick(
      page,
      page.getByRole('button', { name: `Add draft “${F1_DRAFTS[0]}” to your question bank` }),
    );
    const editor = page.getByRole('form', { name: F1_DRAFTS[0] });
    await expect(editor.locator('.xw-errsum')).toBeFocused();
    await expect(editor.locator('.xw-errsum').getByRole('link')).toHaveText([
      'Enter the marks, as a whole number of 1 or more',
    ]);
    await expect(editor.getByRole('textbox', { name: 'Question' })).toHaveValue(F1_DRAFTS[0]!);
    await checkState(page, 'Draft questions with assistance');
    await editor.getByRole('textbox', { name: 'Marks' }).fill('2');
    await reachAndClick(page, editor.getByRole('button', { name: 'Add to bank' }));
    const message = page.locator('#dq-msg');
    await expect(message).toHaveText(/^Added to your question bank as Q-\d{4}\.$/);
    await expect(message).toBeFocused();
    await expect(draftRows(page).first().locator('.xa-tag')).toHaveText(
      'In your bank · reviewed by you',
    );
    await expect(section.locator('.xr-section-head [role="status"]')).toHaveText(
      '2 left to review',
    );
    await checkState(page, 'Draft questions with assistance');
    const added = /Q-\d{4}/.exec((await message.textContent()) ?? '')![0];
    const record = await port<{ question: { origin: string; marks: number } }>(
      page,
      'questionBank',
      'getQuestion',
      added,
    );
    expect(record.question).toMatchObject({ origin: 'reviewed-draft', marks: 2 });

    // Review and edit: the FA-15 fields in place; Cancel returns focus.
    const second = draftRows(page).nth(1);
    await reachAndClick(page, second.getByRole('button', { name: 'Review and edit' }));
    const fields = page.getByRole('form', { name: F1_DRAFTS[1] });
    await expect(fields.getByRole('textbox', { name: 'Question' })).toBeFocused();
    await expect(fields.getByRole('radio', { name: 'False', exact: true })).toBeChecked();
    await checkState(page, 'Draft questions with assistance');
    await reachAndClick(page, fields.getByRole('button', { name: 'Cancel' }));
    await expect(second.getByRole('button', { name: 'Review and edit' })).toBeFocused();

    // Discard leaves no trace in the bank.
    await reachAndClick(
      page,
      page.getByRole('button', { name: `Discard draft “${F1_DRAFTS[2]}”` }),
    );
    await expect(message).toHaveText('Draft discarded. Nothing was added.');
    await expect(draftRows(page)).toHaveCount(2);
    expect(await bankQuestions(page)).toHaveLength(7);

    // Draft more: the form again, the choices kept.
    await reachAndClick(page, page.getByRole('button', { name: 'Draft more' }));
    const form = page.getByRole('form', { name: 'Draft questions with assistance' });
    await expect(form.getByRole('combobox', { name: 'How many drafts' })).toHaveValue('3');
    await expect(form.getByRole('checkbox', { name: 'Written answer' })).toBeChecked();
  });
});

test.describe('FA-14 Question bank — drafting, importing and Drafts to review', () => {
  test('the header links reach FA-16 and FA-17; the Drafts tab reviews and adds (B4-07 f0, f1)', async ({
    page,
  }) => {
    await open(page, BANK);
    await expect(main(page).locator('table.xr-table')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-phead-actions a')).toHaveText([
      'Add a question',
      'Draft with assistance',
      'Import',
    ]);
    const tabs = main(page).getByRole('navigation', { name: 'Question bank' });
    await expect(tabs.locator('a')).toHaveText(['Questions', 'Drafts to review 0']);

    // "Draft with assistance" → FA-16 for this experiment, and back.
    await reachAndClick(page, main(page).getByRole('link', { name: 'Draft with assistance' }));
    await expect(page).toHaveURL(
      new RegExp(`/faculty/question-bank/draft\\?experimentId=${SHELL}$`),
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Draft questions with assistance',
      { timeout: 60_000 },
    );
    await requestThree(page);
    await page.locator('main a.xr-back').press('Enter');
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank\\?experimentId=${SHELL}$`));
    await expect(tabs.locator('a')).toHaveText(['Questions', 'Drafts to review 3']);

    // The Drafts to review tab (f1).
    const draftsTab = tabs.getByRole('link', { name: /^Drafts to review/ });
    await draftsTab.scrollIntoViewIfNeeded();
    await draftsTab.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${DRAFTS_TAB.replace(/[?]/g, '\\?')}$`));
    const section = page.getByRole('region', { name: 'Drafts to review' });
    await expect(section).toContainText(
      'Drafts never go into your bank on their own. Review each one, then add it or discard it.',
    );
    await expect(draftRows(page).locator('.xr-row-title')).toHaveText(F1_DRAFTS);
    await expect(draftsTab).toHaveAttribute('aria-current', 'page');
    await checkState(page, 'Question bank');

    await reachAndClick(
      page,
      draftRows(page).nth(2).getByRole('button', { name: 'Review and edit' }),
    );
    const fields = page.getByRole('form', { name: F1_DRAFTS[2] });
    await expect(
      fields.getByRole('textbox', { name: 'Marking guidance (optional)' }),
    ).not.toHaveValue('');
    await fields.getByRole('textbox', { name: 'Marks' }).fill('10');
    await checkState(page, 'Question bank');
    await reachAndClick(page, fields.getByRole('button', { name: 'Add to bank' }));
    await expect(page.locator('#qb-dmsg')).toHaveText(/^Added to your question bank as Q-\d{4}\.$/);
    await expect(draftRows(page)).toHaveCount(2);
    await expect(tabs.locator('a')).toHaveText(['Questions', 'Drafts to review 2']);
    await reachAndClick(
      page,
      page.getByRole('button', { name: `Discard draft “${F1_DRAFTS[0]}”` }),
    );
    await expect(page.locator('#qb-dmsg')).toHaveText(
      'Draft discarded. Nothing was added to your bank.',
    );
    await checkState(page, 'Question bank');

    // Questions: the added draft says where it came from.
    const questionsTab = tabs.getByRole('link', { name: 'Questions' });
    await questionsTab.scrollIntoViewIfNeeded();
    await questionsTab.press('Enter');
    await expect(main(page).locator('table.xr-table')).toBeVisible();
    await expect(main(page).locator('.xr-section-head [role="status"]')).toHaveText('7 questions');
    await expect(main(page).getByText('From a draft you reviewed')).toHaveCount(1);
    await checkState(page, 'Question bank');

    // "Import" → FA-17 for this experiment.
    await reachAndClick(
      page,
      main(page).locator('.xr-phead-actions').getByRole('link', { name: 'Import' }),
    );
    await expect(page).toHaveURL(
      new RegExp(`/faculty/question-bank/import\\?experimentId=${SHELL}$`),
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a file', {
      timeout: 60_000,
    });
  });

  test('no drafts: the empty Drafts tab offers Draft with assistance', async ({ page }) => {
    await open(page, DRAFTS_TAB);
    const empty = main(page).locator('.xr-empty');
    await expect(empty.getByRole('heading', { name: 'No drafts to review' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(empty.getByRole('link')).toHaveText(['Draft with assistance']);
    await checkState(page, 'Question bank');
  });
});

test.describe('FA-17 Import questions', () => {
  test('choose, check (errors block), the corrected file, confirm, imported (f5 … f9)', async ({
    page,
  }) => {
    await open(page, IMPORT);
    await expect(page.getByRole('heading', { level: 1, name: 'Choose a file' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(main(page).locator('.xr-overline')).toHaveText(/Step 1 of 3/i);
    await expect(
      main(page).getByRole('list', { name: 'Template columns' }).locator('li'),
    ).toHaveCount(10);
    await expect(
      main(page).getByRole('link', { name: 'Download the template (CSV)' }),
    ).toHaveAttribute('download', 'questions-template.csv');
    await expect(main(page)).toContainText(
      `Questions go into your bank for ${SHELL_NAME}. They aren’t added to any assessment.`,
    );
    await checkState(page, 'Choose a file');

    // No file: refused, the chooser focused.
    await reachAndClick(page, page.getByRole('button', { name: 'Check file' }));
    await expect(main(page).locator('.xw-ferr')).toHaveText('Choose a CSV file first');
    await expect(page.getByRole('button', { name: 'Choose a CSV file' })).toBeFocused();
    await checkState(page, 'Choose a file');

    // f6: the file with two errors and a warning.
    await main(page)
      .locator('input[type="file"]')
      .setInputFiles(csv('post-lab-questions.csv', WITH_ERRORS));
    await expect(main(page).locator('.xw-file .xw-file-name')).toHaveText('post-lab-questions.csv');
    await reachAndClick(page, page.getByRole('button', { name: 'Check file' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Check rows' })).toBeFocused();
    await expect(main(page).locator('.xw-counts .xw-tag')).toHaveText([
      '8 rows',
      '6 ready',
      '2 with errors',
      '1 with a warning',
    ]);
    await expect(main(page)).toContainText('Nothing is imported while the file has errors');
    const rows = main(page).locator('table.xr-table tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText(
      'correct is “E”, but the question has options A–D only.',
    );
    await expect(rows.nth(1)).toContainText('type “multi-select” isn’t available.');
    await expect(rows.nth(2)).toContainText(
      'explanation is empty. The question imports without one.',
    );
    await expect(rows.locator('.xr-status')).toHaveText([
      'Error — blocks import',
      'Error — blocks import',
      'Warning',
    ]);
    await checkState(page, 'Check rows');

    // "Choose the corrected file": step 1 again, no file.
    await reachAndClick(page, page.getByRole('button', { name: 'Choose the corrected file' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Choose a file' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose a CSV file' })).toBeFocused();
    await main(page)
      .locator('input[type="file"]')
      .setInputFiles(csv('post-lab-questions-corrected.csv', CORRECTED));
    await reachAndClick(page, page.getByRole('button', { name: 'Check file' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Check rows' })).toBeFocused();
    await expect(main(page).locator('.xw-counts .xw-tag')).toHaveText([
      '8 rows',
      '8 ready',
      '1 with a warning',
    ]);
    await checkState(page, 'Check rows');

    // f7: confirm.
    await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Confirm import' })).toBeFocused();
    await expect(main(page).locator('p.xr-lead')).toHaveText(
      '8 questions will be added to your bank from post-lab-questions-corrected.csv.',
    );
    await expect(main(page).locator('.xr-section li')).toHaveText([
      'They aren’t added to any assessment.',
      'One has no explanation — students would see none for it.',
    ]);
    await checkState(page, 'Confirm import');
    expect(await bankQuestions(page)).toHaveLength(6);

    // f8: imported, into the bank only.
    await reachAndClick(page, page.getByRole('button', { name: 'Import 8 questions' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Questions imported' })).toBeFocused();
    const bank = await bankQuestions(page);
    const imported = bank.filter((entry) => entry.question.origin === 'import');
    expect(imported).toHaveLength(8);
    const ids = imported.map((entry) => entry.question.id).sort();
    await expect(main(page).locator('.xr-notice--ok')).toContainText(
      `8 questions were added to your bank as ${ids[0]} to ${ids.at(-1)}. None is in an assessment yet.`,
    );
    await checkState(page, 'Questions imported');
    await reachAndClick(page, page.getByRole('link', { name: 'Open question bank' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank\\?experimentId=${SHELL}$`));
    await expect(main(page).locator('.xr-section-head [role="status"]')).toHaveText(
      '14 questions',
      {
        timeout: 60_000,
      },
    );
  });
});
