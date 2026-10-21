import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-14 Question bank and FA-15 Add / edit question as the V3 export draws them (FA-v1
 * `Main.dc.html` "FA-14", "FA-15"), on the test-hook build at 1440, 1024, 768 and 375. Each drawn
 * state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no
 * developer surface, no sideways scroll). Worlds: after Flow B (no question yet), after Flow C (six
 * questions), after Flow D (four of them used by "Heat Exchanger — post-lab"). Questions are
 * added, edited and deleted for real through the pages; the same tab's world answers the follow-up
 * reads (`actAs`, the CI seam). The owner's identifier rule: no question or assessment is named by
 * its internal reference anywhere on the pages; the references stay in the addresses (and the
 * search still finds a question by its key).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 120_000 });

const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const BANK = '/faculty/question-bank';
const NEW = `/faculty/question-bank/new?experimentId=${SHELL}`;
const POST_LAB = 'Heat Exchanger — post-lab';

/** An internal reference no Faculty page shows (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
/** A record tab's name: its label and its count (Chromium reads "Questions , 6"). */
const tabName = (label: string, count: number) => new RegExp(`^${label}\\s?, ${count}$`);
const table = (page: Page) => main(page).locator('table.fa-table');
const count = (page: Page) => main(page).locator('.rk-statusline .rk-count');

type BankRow = { readonly question: { readonly id: string; readonly text: string } };

async function bankOf(page: Page): Promise<readonly BankRow[]> {
  const answer = await actAs<{ ok: boolean; value: readonly BankRow[] }>(page, RANGANATHAN, {
    port: 'questionBank',
    method: 'listQuestions',
    input: { experimentId: SHELL, includeDeleted: true },
  });
  expect(answer.ok).toBe(true);
  return answer.value;
}

/** The keys of the questions the table shows, read back from their words (never shown). */
async function ids(page: Page): Promise<string[]> {
  const words = await table(page)
    .locator('tbody tr .fa-qt')
    .evaluateAll((cells) => cells.map((cell) => (cell.textContent ?? '').trim()));
  const all = await bankOf(page);
  return words.map((text) => all.find((row) => row.question.text === text)?.question.id ?? '?');
}

async function textOf(page: Page, questionId: string): Promise<string> {
  const all = await bankOf(page);
  return all.find((row) => row.question.id === questionId)!.question.text;
}

async function expectNoReference(page: Page): Promise<void> {
  await expect(main(page)).not.toContainText(REFERENCE);
  const named = await page
    .locator('[aria-label], [title], [placeholder]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        ['aria-label', 'title', 'placeholder']
          .map((name) => element.getAttribute(name) ?? '')
          .join(' '),
      ),
    );
  for (const value of named) expect(value).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

test.describe('FA-14 Question bank', () => {
  test('the bank as drawn, and its compact rows below 760 px of table width', async ({ page }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      `Your questions for ${SHELL_NAME} · ME ZG523. Drafts stay apart until you review them.`,
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', BANK);
    await expect(main(page).getByRole('link', { name: 'Add a question' })).toHaveAttribute(
      'href',
      NEW,
    );
    await expect(main(page).locator('.rk-head-act a')).toHaveText([
      'Add a question',
      'Draft with assistance',
      'Import',
    ]);
    await expect(main(page).getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/draft?experimentId=${SHELL}`,
    );
    const tabs = main(page).getByRole('navigation', { name: 'Question bank' });
    await expect(tabs.getByRole('link', { name: tabName('Questions', 6) })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(tabs.getByRole('link', { name: tabName('Drafts to review', 0) })).toBeVisible();
    await expect(count(page)).toHaveText('6 questions');
    expect(await ids(page)).toEqual(['Q-0101', 'Q-0102', 'Q-0103', 'Q-0104', 'Q-0105', 'Q-0106']);
    const used = table(page).locator('tbody tr td:nth-child(3)');
    await expect(used.nth(0).locator('.fa-cellname')).toHaveText(POST_LAB);
    await expect(used.nth(2).locator('.fa-quiet')).toHaveText('Not yet');
    // Wide tables show their head; below 760 px of table width each row is a compact block.
    const header = table(page).locator('thead');
    const display = await header.evaluate((element) => getComputedStyle(element).display);
    if (display === 'none') {
      const row = table(page).locator('tbody tr').first();
      await expect
        .poll(() => row.evaluate((element) => getComputedStyle(element).display))
        .toMatch(/^(?:grid|flex)$/);
      await expect(row.locator('.fa-mob.fa-qmeta-m')).toBeVisible();
    } else {
      await expect(header).toBeVisible();
    }
    if ((page.viewportSize()?.width ?? 1440) <= 375) expect(display).toBe('none');
    // The Type filter shows at every width.
    await expect(page.getByRole('combobox', { name: 'Type' })).toBeVisible();
    await expectNoReference(page);
    await checkState(page, 'Question bank');
  });

  test('search and filters apply at once; no match clears', async ({ page }) => {
    await open(page, 'after-flow-c', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const search = page.getByRole('searchbox', { name: 'Search' });
    await expect(search).toHaveAttribute('placeholder', 'Words in the question');
    await search.fill('ntu');
    await expect.poll(() => ids(page)).toEqual(['Q-0102']);
    await expect(count(page)).toHaveText('1 of 6 questions');
    // The search still finds a question by its key, which is never shown.
    await search.fill('Q-0106');
    await expect.poll(() => ids(page)).toEqual(['Q-0106']);
    await search.fill('');
    await page.getByRole('combobox', { name: 'Type' }).selectOption('true-false');
    await expect.poll(() => ids(page)).toEqual(['Q-0104', 'Q-0105']);
    await expect(main(page).locator('.rk-chip')).toHaveText(['Type: True or false']);
    await search.fill('no such words');
    await expect(main(page).getByText('No question matches these filters')).toBeVisible();
    await expect(table(page)).toHaveCount(0);
    await checkState(page, 'Question bank');
    await reachAndClick(
      page,
      main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect.poll(() => ids(page)).toHaveLength(6);
    await expect(search).toHaveValue('');
  });

  test('delete by keyboard: “Delete this question?” opens on Cancel, Esc cancels, Delete question removes it', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const q101 = await textOf(page, 'Q-0101');
    const trigger = page.getByRole('button', { name: `Delete question: ${q101}` });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Delete this question?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-head p')).toHaveText(q101);
    await expect(dialog.locator('.rk-dlg-list li')).toHaveText([
      'It leaves your question bank and won’t be offered for new assessments.',
      'Its history is kept.',
      `It is used in ${POST_LAB}. That assessment keeps its copy, so nothing changes for students.`,
    ]);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await expectNoReference(page);
    await checkState(page, 'Question bank');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await ids(page)).toHaveLength(6);

    // An unused question: no "used in" point; Tab from Cancel reaches "Delete question".
    const q103 = await textOf(page, 'Q-0103');
    const unused = page.getByRole('button', { name: `Delete question: ${q103}` });
    await unused.focus();
    await page.keyboard.press('Enter');
    const second = page.getByRole('dialog', { name: 'Delete this question?' });
    await expect(second).toBeVisible();
    await expect(second.locator('.rk-dlg-list li')).toHaveCount(2);
    await expect(second.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(second.getByRole('button', { name: 'Delete question' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(second).toBeHidden();
    const message = page.locator('#qb-msg');
    await expect(message.locator('.rk-notice-t')).toHaveText(
      'Question deleted from your question bank.',
    );
    await expect(message.locator('.rk-notice-d')).toHaveText('Its history is kept.');
    await expect(message).toBeFocused();
    await expect.poll(() => ids(page)).toEqual(['Q-0101', 'Q-0102', 'Q-0104', 'Q-0105', 'Q-0106']);
    await expect(main(page).getByRole('heading', { level: 3, name: 'Deleted' })).toBeVisible();
    await expectNoReference(page);
    await checkState(page, 'Question bank');
  });

  test('the empty bank', async ({ page }) => {
    await open(page, 'after-flow-b', BANK);
    await expect(main(page).getByText('Your question bank is empty')).toBeVisible({
      timeout: 60_000,
    });
    await expect(main(page).locator('.rk-state')).toContainText(
      'Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.',
    );
    await expect(main(page).locator('.rk-state').getByRole('link')).toHaveCount(0);
    await expect(main(page).locator('.rk-head-act a')).toHaveText([
      'Add a question',
      'Draft with assistance',
      'Import',
    ]);
    await checkState(page, 'Question bank');
  });
});

test.describe('FA-15 Add / edit question', () => {
  test('adds a multiple-choice question for real; the bank lists it and says so', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, main(page).getByRole('link', { name: 'Add a question' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank/new\\?experimentId=${SHELL}$`));
    const form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText(`${SHELL_NAME} · ME ZG523`);
    await expect(
      main(page).getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link'),
    ).toHaveText(['Question bank']);
    for (const radio of await form
      .getByRole('group', { name: /^Question type/ })
      .getByRole('radio')
      .all())
      await expect(radio).not.toBeChecked();
    await expect(
      page.getByRole('complementary', { name: 'This question' }).locator('dd'),
    ).toHaveText(['Not in an assessment yet']);
    await checkState(page, 'Add a question');

    const text = 'Which arrangement can bring the cold outlet above the hot outlet?';
    await form.getByRole('radio', { name: 'Multiple choice' }).check();
    await form.getByRole('textbox', { name: 'Question' }).fill(text);
    await form.getByRole('textbox', { name: 'Option A' }).fill('Counter flow');
    await form.getByRole('textbox', { name: 'Option B' }).fill('Parallel flow');
    await form.getByRole('radio', { name: 'Option A is the correct answer' }).check();
    await form.getByRole('textbox', { name: 'Marks' }).fill('2');
    await checkState(page, 'Add a question');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));

    // Back on the bank: the message takes focus; the address drops `added`.
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank\\?experimentId=${SHELL}$`));
    const message = page.locator('#qb-msg');
    await expect(message.locator('.rk-notice-t')).toHaveText('Saved to your question bank.');
    await expect(message.locator('.rk-notice-d')).toHaveText('It isn’t in any assessment yet.');
    await expect(message).toBeFocused();
    const added = (await bankOf(page)).find((row) => row.question.text === text)!.question.id;
    await expect.poll(() => ids(page)).toContain(added);
    await expect(count(page)).toHaveText('7 questions');
    await expectNoReference(page);
    await checkState(page, 'Question bank');
  });

  test('adds true or false and written answer questions', async ({ page }) => {
    await open(page, 'after-flow-c', NEW);
    let form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.getByRole('radio', { name: 'True or false' }).check();
    await expect(form.getByRole('group', { name: 'The statement is' })).toBeVisible();
    const tfText = 'Counter flow always needs a larger area than parallel flow for the same duty.';
    await form.getByRole('textbox', { name: 'Question' }).fill(tfText);
    await form.getByRole('radio', { name: 'False', exact: true }).check();
    await form.getByRole('textbox', { name: 'Marks' }).fill('2');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    await expect(page.locator('#qb-msg .rk-notice-t')).toHaveText('Saved to your question bank.');

    await reachAndClick(page, main(page).getByRole('link', { name: 'Add a question' }));
    form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.getByRole('radio', { name: 'Written answer' }).check();
    const writtenText = 'Explain how fouling changes the exchanger’s performance.';
    await form.getByRole('textbox', { name: 'Question' }).fill(writtenText);
    await form
      .getByRole('textbox', { name: 'Marking guidance (optional)' })
      .fill('Look for: U falls; the heat duty falls.');
    await form.getByRole('textbox', { name: 'Marks' }).fill('10');
    await checkState(page, 'Add a question');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    await expect(page.locator('#qb-msg .rk-notice-t')).toHaveText('Saved to your question bank.');
    const all = await bankOf(page);
    const tf = all.find((row) => row.question.text === tfText)!.question.id;
    const written = all.find((row) => row.question.text === writtenText)!.question.id;
    await expect.poll(() => ids(page)).toEqual(expect.arrayContaining([tf, written]));

    const record = await actAs<{
      ok: boolean;
      value: { question: { body: { type: string; markingGuidance?: string } } };
    }>(page, RANGANATHAN, { port: 'questionBank', method: 'getQuestion', input: written });
    expect(record.value.question.body).toEqual({
      type: 'written',
      markingGuidance: 'Look for: U falls; the heat duty falls.',
    });
  });

  test('validation: the summary takes focus and links to each field', async ({ page }) => {
    await open(page, 'after-flow-c', NEW);
    const form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.getByRole('radio', { name: 'Multiple choice' }).check();
    await form
      .getByRole('textbox', { name: 'Question' })
      .fill('Which arrangement can bring the cold outlet above the hot outlet?');
    await form.getByRole('textbox', { name: 'Option A' }).fill('Counter flow');
    await form.getByRole('textbox', { name: 'Marks' }).fill('two');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    const summary = page.locator('#qe-err');
    await expect(summary).toBeFocused();
    await expect(summary.locator('.rk-errsum-t')).toHaveText('Check this question');
    await expect(summary.getByRole('link')).toHaveText([
      'Add at least two answer options',
      'Choose the correct answer',
      'Enter the marks, as a whole number of 1 or more',
    ]);
    await expect(form.getByRole('textbox', { name: 'Marks' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await checkState(page, 'Add a question');
    // From the focused summary, by keyboard.
    await summary.getByRole('link', { name: /Enter the marks/ }).press('Enter');
    await expect(form.getByRole('textbox', { name: 'Marks' })).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/new\\?experimentId=${SHELL}$`));
  });

  test('edits a used question: the notice; a new version; the assessment keeps its own', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const q102 = await textOf(page, 'Q-0102');
    await reachAndClick(page, page.getByRole('link', { name: `Edit question: ${q102}` }));
    await expect(page).toHaveURL(/\/faculty\/question-bank\/Q-0102$/);
    const form = page.getByRole('form', { name: 'Edit question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    const notice = main(page).locator('.rk-notice--info');
    await expect(notice.locator('.rk-notice-t')).toHaveText(`Used in 1 assessment: ${POST_LAB}`);
    await expect(notice).toContainText(
      'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
    );
    await expect(form.getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    await expect(
      page.getByRole('complementary', { name: 'This question' }).locator('dd'),
    ).toHaveText(['Version 1', POST_LAB, /^\d{1,2} [A-Z][a-z]{2} 2026$/]);
    await expectNoReference(page);
    await checkState(page, 'Edit question');
    await form.getByRole('textbox', { name: 'Marks' }).fill('3');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    const saved = page.locator('#qe-saved');
    await expect(saved.locator('.rk-notice-t')).toHaveText('Saved as version 2.');
    await expect(saved.locator('.rk-notice-d')).toHaveText(
      `${POST_LAB} keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.`,
    );
    await expect(saved).toBeFocused();
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText('Version 2');
    await checkState(page, 'Edit question');

    const view = await actAs<{
      ok: boolean;
      value: {
        questions: readonly {
          ref: { questionId: string; questionVersion: number };
          newerVersion: number | null;
        }[];
      };
    }>(page, RANGANATHAN, { port: 'assessments', method: 'getAssessment', input: 'ASMT-0009' });
    expect(view.value.questions.find((entry) => entry.ref.questionId === 'Q-0102')).toMatchObject({
      ref: { questionVersion: 1 },
      newerVersion: 2,
    });
  });
});
