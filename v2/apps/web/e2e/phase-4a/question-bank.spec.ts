import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-14 Question bank and FA-15 Add / edit question (board B4-07 f0 … f9) on the test-hook build,
 * at 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll). Worlds: after Flow B
 * (no question yet, f7), after Flow C (Q-0101 … Q-0106), after Flow D (four of them used by
 * ASMT-0009). Since Phase 4B the header also links to FA-16 and FA-17 and draws the tabs
 * (`e2e/phase-4b/question-tools.spec.ts`). Questions are added, edited and deleted for real
 * through the pages; the same tab's world answers the follow-up reads (`actAs`, the CI seam).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 120_000 });

const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const BANK = '/faculty/question-bank';
const NEW = `/faculty/question-bank/new?experimentId=${SHELL}`;

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const table = (page: Page) => main(page).locator('table.xr-table');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

async function ids(page: Page): Promise<string[]> {
  return table(page)
    .locator('tbody tr .xr-id')
    .evaluateAll((cells) => cells.map((cell) => cell.textContent ?? ''));
}

test.describe('FA-14 Question bank', () => {
  test('the bank as drawn, and labelled rows below 760 px of content (f0, f9)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      `Questions for ${SHELL_NAME} · ME ZG523`,
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', BANK);
    await expect(main(page).getByRole('link', { name: 'Add a question' })).toHaveAttribute(
      'href',
      NEW,
    );
    // Phase 4B: drafting (FA-16) and importing (FA-17), and the tabs (B4-07 f0).
    await expect(main(page).locator('.xr-phead-actions a')).toHaveText([
      'Add a question',
      'Draft with assistance',
      'Import',
    ]);
    await expect(main(page).getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/draft?experimentId=${SHELL}`,
    );
    const tabs = main(page).getByRole('navigation', { name: 'Question bank' });
    await expect(tabs.locator('a')).toHaveText(['Questions', 'Drafts to review 0']);
    await expect(main(page).locator('.xr-section-head [role="status"]')).toHaveText('6 questions');
    expect(await ids(page)).toEqual(['Q-0101', 'Q-0102', 'Q-0103', 'Q-0104', 'Q-0105', 'Q-0106']);
    await expect(table(page).locator('tbody tr').first().locator('td').nth(3)).toHaveText(
      'Used in 1 assessment',
    );
    await expect(table(page).locator('tbody tr').nth(2).locator('td').nth(3)).toHaveText(
      'Not used yet',
    );
    const header = table(page).locator('thead');
    const type = page.getByRole('combobox', { name: 'Type' });
    if (width(page) < 768) {
      // f9: the rows stack; the header row is hidden.
      await expect
        .poll(() => header.evaluate((element) => getComputedStyle(element).position))
        .toBe('absolute');
      const row = table(page).locator('tbody tr').first();
      await expect
        .poll(() => row.evaluate((element) => getComputedStyle(element).display))
        .toBe('block');
    } else {
      await expect(header).toBeVisible();
    }
    // Below 600 px of content the Type filter is not shown (f9).
    if (width(page) < 600) await expect(type).toBeHidden();
    else await expect(type).toBeVisible();
    await checkState(page, 'Question bank');
  });

  test('search and filters apply at once; no match clears', async ({ page }) => {
    await open(page, 'after-flow-c', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const search = page.getByRole('searchbox', { name: 'Search questions' });
    await search.fill('ntu');
    await expect.poll(() => ids(page)).toEqual(['Q-0102']);
    await expect(main(page).locator('.xr-section-head [role="status"]')).toHaveText('1 question');
    await search.fill('Q-0106');
    await expect.poll(() => ids(page)).toEqual(['Q-0106']);
    await search.fill('');
    if (width(page) >= 600) {
      await page.getByRole('combobox', { name: 'Type' }).selectOption('true-false');
      await expect.poll(() => ids(page)).toEqual(['Q-0104', 'Q-0105']);
    }
    await search.fill('no such words');
    await expect(main(page).getByText('No question matches.')).toBeVisible();
    await expect(table(page)).toHaveCount(0);
    await checkState(page, 'Question bank');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Clear filters' }));
    await expect.poll(() => ids(page)).toHaveLength(6);
    await expect(search).toHaveValue('');
  });

  test('delete by keyboard: DL-1 opens on Cancel, Esc cancels, Delete question removes it (f2)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    const trigger = page.getByRole('button', { name: 'Delete Q-0101' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Delete Q-0101?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'It leaves your question bank and won’t be offered for new assessments. Its history is kept.',
    );
    await expect(dialog.locator('strong')).toHaveText('It is used in Heat Exchanger — post-lab.');
    await expect(dialog).toContainText(
      'That assessment keeps its copy, so nothing changes for students.',
    );
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await checkState(page, 'Question bank');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await ids(page)).toHaveLength(6);

    // Q-0103 is not used: no "used in" line; Tab from Cancel reaches "Delete question".
    const unused = page.getByRole('button', { name: 'Delete Q-0103' });
    await unused.focus();
    await page.keyboard.press('Enter');
    const second = page.getByRole('dialog', { name: 'Delete Q-0103?' });
    await expect(second).toBeVisible();
    await expect(second.locator('strong')).toHaveCount(0);
    await expect(second.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(second.getByRole('button', { name: 'Delete question' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(second).toBeHidden();
    const message = page.locator('#qb-msg');
    await expect(message).toHaveText(
      'Q-0103 deleted from your question bank. Its history is kept.',
    );
    await expect(message).toBeFocused();
    await expect.poll(() => ids(page)).toEqual(['Q-0101', 'Q-0102', 'Q-0104', 'Q-0105', 'Q-0106']);
    await expect(main(page).getByRole('heading', { level: 3, name: 'Deleted' })).toBeVisible();
    await checkState(page, 'Question bank');
  });

  test('the empty bank (f7)', async ({ page }) => {
    await open(page, 'after-flow-b', BANK);
    await expect(
      main(page).getByRole('heading', { name: 'Your question bank is empty' }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-empty')).toContainText(
      'Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.',
    );
    await expect(main(page).locator('.xr-empty').getByRole('link')).toHaveText([
      'Add a question',
      'Import',
    ]);
    await checkState(page, 'Question bank');
  });
});

test.describe('FA-15 Add / edit question', () => {
  test('adds a multiple-choice question for real; the bank lists it and says so (f3, f8)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, main(page).getByRole('link', { name: 'Add a question' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank/new\\?experimentId=${SHELL}$`));
    const form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(SHELL_NAME);
    for (const radio of await form
      .getByRole('group', { name: 'Question type' })
      .getByRole('radio')
      .all())
      await expect(radio).not.toBeChecked();
    await checkState(page, 'Add a question');

    await form.getByRole('radio', { name: 'Multiple choice' }).check();
    await form
      .getByRole('textbox', { name: 'Question' })
      .fill('Which arrangement can bring the cold outlet above the hot outlet?');
    await form.getByRole('textbox', { name: 'Option A' }).fill('Counter flow');
    await form.getByRole('textbox', { name: 'Option B' }).fill('Parallel flow');
    await form.getByRole('radio', { name: 'Option A is the correct answer' }).check();
    await form.getByRole('textbox', { name: 'Marks' }).fill('2');
    await checkState(page, 'Add a question');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));

    // Back on the bank: the message takes focus; the address drops `added`.
    await expect(page).toHaveURL(new RegExp(`/faculty/question-bank\\?experimentId=${SHELL}$`));
    const message = page.locator('#qb-msg');
    await expect(message).toHaveText(/^Saved to your question bank as Q-\d{4}\.$/);
    await expect(message).toBeFocused();
    const added = /Q-\d{4}/.exec((await message.textContent()) ?? '')![0];
    await expect.poll(() => ids(page)).toContain(added);
    await expect(main(page).locator('.xr-section-head [role="status"]')).toHaveText('7 questions');
    await checkState(page, 'Question bank');
  });

  test('adds true or false and written answer questions (f5)', async ({ page }) => {
    await open(page, 'after-flow-c', NEW);
    let form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.getByRole('radio', { name: 'True or false' }).check();
    await expect(form.getByRole('group', { name: 'The statement is' })).toBeVisible();
    await form
      .getByRole('textbox', { name: 'Question' })
      .fill('Counter flow always needs a larger area than parallel flow for the same duty.');
    await form.getByRole('radio', { name: 'False', exact: true }).check();
    await form.getByRole('textbox', { name: 'Marks' }).fill('2');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    await expect(page.locator('#qb-msg')).toHaveText(/^Saved to your question bank as Q-\d{4}\.$/);
    const tf = /Q-\d{4}/.exec((await page.locator('#qb-msg').textContent()) ?? '')![0];

    await reachAndClick(page, main(page).getByRole('link', { name: 'Add a question' }));
    form = page.getByRole('form', { name: 'Add a question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.getByRole('radio', { name: 'Written answer' }).check();
    await form
      .getByRole('textbox', { name: 'Question' })
      .fill('Explain how fouling changes the exchanger’s performance.');
    await form
      .getByRole('textbox', { name: 'Marking guidance (optional)' })
      .fill('Look for: U falls; the heat duty falls.');
    await form.getByRole('textbox', { name: 'Marks' }).fill('10');
    await checkState(page, 'Add a question');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    await expect(page.locator('#qb-msg')).toHaveText(/^Saved to your question bank as Q-\d{4}\.$/);
    const written = /Q-\d{4}/.exec((await page.locator('#qb-msg').textContent()) ?? '')![0];
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

  test('validation: the drawn summary takes focus and links to each field (f6)', async ({
    page,
  }) => {
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
    await expect(summary.locator('strong')).toHaveText('Check this question');
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
    // From the focused summary, by keyboard (at 375 the link wraps onto two lines, so the centre of
    // its box falls between them).
    await summary.getByRole('link', { name: /Enter the marks/ }).press('Enter');
    await expect(form.getByRole('textbox', { name: 'Marks' })).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/new\\?experimentId=${SHELL}$`));
  });

  test('edits a used question: the notice; a new version; the assessment keeps its own (f4)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', BANK);
    await expect(table(page)).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, page.getByRole('link', { name: 'Edit Q-0102' }));
    await expect(page).toHaveURL(/\/faculty\/question-bank\/Q-0102$/);
    const form = page.getByRole('form', { name: 'Edit question' });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-phead-meta .xr-id')).toHaveText('Q-0102');
    const notice = main(page).locator('.xr-notice--warn');
    await expect(notice.locator('.xr-notice-title')).toHaveText(
      'Used in 1 assessment: Heat Exchanger — post-lab',
    );
    await expect(notice).toContainText(
      'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
    );
    await expect(form.getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    await checkState(page, 'Edit question');
    await form.getByRole('textbox', { name: 'Marks' }).fill('3');
    await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
    const saved = page.locator('#qe-saved');
    await expect(saved).toHaveText(
      'Saved as a new version. Heat Exchanger — post-lab keeps the version it has until you choose “Use updated version” there.',
    );
    await expect(saved).toBeFocused();
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
