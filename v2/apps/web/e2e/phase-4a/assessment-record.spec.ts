import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-08 Assessment · Summary and FA-09 Assessment · Questions (board B4-05 f0 … f8) on the
 * test-hook build, at 1440, 1024, 768 and 375, as Dr S. Ranganathan. After Flow D, ASMT-0009
 * "Heat Exchanger — post-lab" is Ready with four questions and Rahul's submission (f0, f6); every
 * change to its questions then makes version 2, which the Summary shows (f4). Remove, Add from the
 * bank panel (f7), "Use updated version" after a bank edit (f8) and a deleted question's copy (f2)
 * are driven for real; bank edits and drafts come through `actAs` (the CI seam), never a product
 * shortcut. After Flow C a draft shows the draft Summary (f3) and "No questions yet" (f1). At 375
 * the rows put their actions under the text and the panel sits below the list (f5). Each drawn
 * state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways
 * scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RANGANATHAN = { personId: 'per-0014' };
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const SUMMARY = `/faculty/assessments/${ASMT}`;
const QUESTIONS = `${SUMMARY}/questions`;

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

async function port<T>(page: Page, portKey: string, method: string, input?: unknown): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, RANGANATHAN, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/** A draft of Shell-and-Tube with every rule and no question (FA-07 "Save as draft"). */
async function saveDraft(page: Page): Promise<string> {
  const created = await port<{ readonly id: string }>(page, 'assessments', 'createAssessment', {
    mode: 'save-as-draft',
    experimentId: SHELL,
    name: NAME,
    introduction: null,
    rules: {
      passMarkPercent: '50',
      attemptsAllowed: '2',
      deadline: '2026-11-14T23:59:00+05:30',
      releaseOption: 'after-deadline',
      releaseDate: null,
    },
    questions: [],
  });
  return created.id;
}

const main = (page: Page) => page.locator('main');
const questionsSection = (page: Page) => page.getByRole('region', { name: 'Questions in order' });
const rows = (page: Page) => questionsSection(page).locator('ul.xr-rows > li');
const bankPanel = (page: Page) =>
  page.getByRole('complementary', { name: 'From your question bank' });
const tabCount = (page: Page) =>
  page.getByRole('navigation', { name: NAME }).getByRole('link', { name: /^Questions/ });

test.describe('FA-08 Assessment · Summary', () => {
  test('Ready with a submission: readiness, submissions, reach and the rules as set (f0, f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SUMMARY);
    const ready = page.getByRole('region', { name: 'Ready to use' });
    await expect(ready).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    await expect(page.getByRole('navigation', { name: NAME }).getByRole('link')).toHaveText([
      'Summary',
      'Questions 4',
      'Settings',
      'Preview',
    ]);
    await expect(ready.locator('.xr-status')).toHaveText('Ready');
    await expect(ready).toContainText(`Students who have ${SHELL_NAME} can see and start it.`);
    await expect(ready.locator('ul.xa-check > li')).toHaveText([
      'Name and introduction',
      'Rules: pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
      '4 questions · 16 marks',
    ]);
    const submissions = page.getByRole('region', { name: 'Submissions' });
    await expect(submissions.locator('p.xr-body')).toHaveText('1 of 1 submitted');
    await expect(submissions.locator('.xr-notice--quiet')).toHaveText(
      '1 student has submitted. If you change questions or rules now, that makes a new version — earlier submissions keep theirs.',
    );
    // FA-18 and FA-12 are Phase 4B: not rendered.
    await expect(main(page).getByText('Mark next')).toHaveCount(0);
    await expect(main(page).getByText('See submissions')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Who it reaches' })).toContainText(
      `1 student who has ${SHELL_NAME} from Godavari Institute of Technology.`,
    );
    const rules = page.getByRole('region', { name: 'Rules as set for this assessment' });
    await expect(rules.locator('dt')).toHaveText([
      'Introduction',
      'Pass mark',
      'Attempts allowed',
      'Deadline',
      'Result and answers',
      'Time limit',
    ]);
    await expect(rules.locator('dd')).toHaveText([
      'None',
      '50% · 8 of 16 marks',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
      'None',
    ]);
    // f5 (375): the key–value list stacks; wider, keys and values side by side.
    const width = page.viewportSize()?.width ?? 1440;
    const columns = await rules
      .locator('dl')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 768 ? 1 : 2);
    await checkState(page, NAME);

    await reachAndClick(page, rules.getByRole('link', { name: 'Change settings' }));
    await expect(page).toHaveURL(new RegExp(`${SUMMARY}/settings$`));
  });

  test('a written answer submitted in the same world waits for marking (f0)', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/assessments');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const created = await port<{ readonly id: string }>(page, 'assessments', 'createAssessment', {
      mode: 'create',
      experimentId: SHELL,
      name: NAME,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0106'],
    });
    // Rahul Verma answers and submits through his own ports (the CI seam), in this tab's world.
    const rahul = { personId: 'per-0002' };
    type Attempt = {
      readonly ok: true;
      readonly value: { readonly id: string; readonly rev: number };
    };
    const started = await actAs<Attempt>(page, rahul, {
      port: 'assessments',
      method: 'startAttempt',
      input: created.id,
    });
    const saved = await actAs<Attempt>(page, rahul, {
      port: 'assessments',
      method: 'saveAnswer',
      input: {
        attemptId: started.value.id,
        questionId: 'Q-0106',
        answer: { type: 'written', text: 'Fouling adds a thermal resistance, so U falls.' },
        expectedRev: started.value.rev,
      },
    });
    await actAs(page, rahul, {
      port: 'assessments',
      method: 'submitAttempt',
      input: { attemptId: saved.value.id, expectedRev: saved.value.rev },
    });
    await softNavigate(page, `/faculty/assessments/${created.id}`);
    const submissions = page.getByRole('region', { name: 'Submissions' });
    await expect(submissions.locator('p.xr-body')).toHaveText(
      '1 of 1 submitted · 1 waiting for marking',
    );
    await expect(submissions.locator('p.xr-body .xr-status--wait')).toHaveText(
      '1 waiting for marking',
    );
    await expect(main(page).getByText('Mark next')).toHaveCount(0);
    await checkState(page, NAME);
  });

  test('a draft without questions: the waiting item and "Add questions" (f3)', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/assessments');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const id = await saveDraft(page);
    await softNavigate(page, `/faculty/assessments/${id}`);
    const ready = page.getByRole('region', { name: 'Ready to use' });
    await expect(ready).toBeVisible();
    await expect(ready.locator('.xr-status--wait')).toHaveText('Draft — not ready');
    await expect(ready).toContainText('Students can’t see it until it has a question.');
    await expect(ready.locator('ul.xa-check > li .is-no')).toHaveCount(1);
    await expect(ready.locator('ul.xa-check > li').last()).toHaveText(
      'At least one question — none yet',
    );
    await expect(page.getByRole('region', { name: 'Submissions' })).toHaveCount(0);
    await expect(main(page).locator('.xr-btn--primary')).toHaveText(['Add questions']);
    await checkState(page, NAME);

    // f1: "Add questions" opens the Questions tab: "No questions yet".
    await reachAndClick(page, ready.getByRole('link', { name: 'Add questions' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/questions$`));
    const empty = questionsSection(page).locator('.xr-empty');
    await expect(empty.getByRole('heading', { level: 3, name: 'No questions yet' })).toBeVisible();
    await expect(questionsSection(page).locator('.xr-section-head .xr-meta')).toHaveText(
      '0 questions · 0 marks',
    );
    await expect(main(page).getByText('Draft with assistance')).toHaveCount(0);
    await expect(main(page).getByText('Import', { exact: true })).toHaveCount(0);
    await checkState(page, NAME);

    // Adding the first question from the empty state's own button makes it Ready.
    await reachAndClick(page, empty.getByRole('button', { name: 'Add from question bank' }));
    await expect(bankPanel(page).locator('li')).toHaveCount(6);
    await reachAndClick(
      page,
      bankPanel(page).getByRole('button', { name: 'Add Q-0101 to this assessment' }),
    );
    await expect(questionsSection(page)).toContainText('Q-0101 added as question 1.');
    await expect(tabCount(page)).toHaveText('Questions 1');
    await expect(page.locator('.xl-hubhead .xr-status')).toHaveText('Ready');
  });
});

test.describe('FA-09 Assessment · Questions', () => {
  test('Remove, then Add back from the bank panel: a new version after the submission (f6, f7, f4)', async ({
    page,
  }) => {
    // A long walk: at 375 every press is reached by scrolling.
    test.setTimeout(90_000);
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    await expect(rows(page).locator('.xr-row-title')).toHaveText([
      'What does the effectiveness (ε) of a heat exchanger compare?',
      'How is the number of transfer units (NTU) defined?',
      'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
      'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.',
    ]);
    await expect(questionsSection(page).locator('.xr-section-head .xr-meta')).toHaveText(
      '4 questions · 16 marks',
    );
    await expect(main(page).getByText('Draft with assistance')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Move question 1 up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await checkState(page, NAME);

    await reachAndClick(
      page,
      page.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    await expect(questionsSection(page).locator('.xa-save.is-ok')).toHaveText(
      'Q-0102 removed from this assessment. It is still in your question bank.',
    );
    await expect(page.locator('#questions-msg')).toBeFocused();
    await expect(rows(page)).toHaveCount(3);
    await expect(tabCount(page)).toHaveText('Questions 3');
    await expect(questionsSection(page).locator('.xr-notice--warn .xr-notice-title')).toHaveText(
      'This makes a new version',
    );

    // f7: the bank panel; its title takes focus.
    await reachAndClick(page, page.getByRole('button', { name: 'Add from question bank' }));
    await expect(bankPanel(page)).toBeVisible();
    await expect(
      bankPanel(page).getByRole('heading', { name: 'From your question bank' }),
    ).toBeFocused();
    await expect(bankPanel(page)).toContainText(`${SHELL_NAME} · not in this assessment`);
    await expect(bankPanel(page).locator('li .xr-meta')).toHaveText([
      'Q-0102 · Multiple choice · 2 marks',
      'Q-0103 · Multiple choice · 2 marks',
      'Q-0105 · True or false · 2 marks',
    ]);
    // Beside the list from 860 px of content (`.xr-decide` container query), below it under that.
    const width = page.viewportSize()?.width ?? 1440;
    const beside = await main(page)
      .locator('.xr-decide')
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length === 2);
    if (width === 1440) expect(beside).toBe(true);
    if (width === 375) expect(beside).toBe(false);
    const listBox = (await questionsSection(page).boundingBox())!;
    const panelBox = (await bankPanel(page).boundingBox())!;
    if (beside) expect(panelBox.x).toBeGreaterThan(listBox.x + listBox.width - 1);
    else expect(panelBox.y).toBeGreaterThan(listBox.y + listBox.height - 1);
    await checkState(page, NAME);

    await reachAndClick(
      page,
      bankPanel(page).getByRole('button', { name: 'Add Q-0102 to this assessment' }),
    );
    await expect(questionsSection(page).locator('.xa-save.is-ok')).toHaveText(
      'Q-0102 added as question 4.',
    );
    await expect(tabCount(page)).toHaveText('Questions 4');
    await expect(rows(page).last()).toContainText('Q-0102');
    await expect(bankPanel(page).locator('li')).toHaveCount(2);

    await reachAndClick(page, bankPanel(page).getByRole('button', { name: 'Close question bank' }));
    await expect(bankPanel(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add from question bank' })).toBeFocused();

    // f4: the Summary shows the version the change made.
    // The tab strip scrolls sideways at 375: the tab is brought into view as a swipe would.
    await page
      .getByRole('navigation', { name: NAME })
      .getByRole('link', { name: 'Summary' })
      .click();
    const submissions = page.getByRole('region', { name: 'Submissions' });
    await expect(submissions.locator('.xr-notice-title')).toHaveText(
      /^Version 2 since \d+ \w+ 2026$/,
    );
    await expect(submissions.locator('.xr-notice')).toContainText(
      'You changed the questions after students submitted. Earlier submissions keep the version they answered; new attempts use version 2.',
    );
    await checkState(page, NAME);
  });

  test('a bank edit: "A newer version …" and Use updated version (f8)', async ({ page }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const current = await port<{ readonly question: { readonly rev: number } }>(
      page,
      'questionBank',
      'getQuestion',
      'Q-0102',
    );
    const edited = 'How is the number of transfer units (NTU) defined, and what does it measure?';
    await port(page, 'questionBank', 'editQuestion', {
      id: 'Q-0102',
      experimentId: SHELL,
      type: 'multiple-choice',
      text: edited,
      options: {
        A: 'UA over the smaller heat capacity rate',
        B: 'Q over Q max',
        C: 'U times LMTD',
      },
      correct: 'A',
      marks: '2',
      explanation: null,
      markingGuidance: null,
      expectedRev: current.question.rev,
    });
    const row = page.locator('#questions-row-Q-0102');
    await expect(row).toContainText('A newer version is in your question bank.');
    // The assessment keeps the version it pins until the Faculty member says otherwise.
    await expect(row.locator('.xr-row-title')).toHaveText(
      'How is the number of transfer units (NTU) defined?',
    );
    await checkState(page, NAME);

    await reachAndClick(page, row.getByRole('button', { name: 'Use updated version' }));
    await expect(questionsSection(page).locator('.xa-save.is-ok')).toHaveText(
      'Q-0102 now uses the version in your bank.',
    );
    await expect(row.locator('.xr-row-title')).toHaveText(edited);
    await expect(row).not.toContainText('A newer version');
  });

  test('a question deleted from the bank keeps its copy (f2); a move reorders (f6)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const current = await port<{ readonly question: { readonly rev: number } }>(
      page,
      'questionBank',
      'getQuestion',
      'Q-0104',
    );
    await port(page, 'questionBank', 'deleteQuestion', {
      id: 'Q-0104',
      expectedRev: current.question.rev,
    });
    const row = page.locator('#questions-row-Q-0104');
    await expect(row).toContainText(
      /Deleted from your question bank on \d+ \w+ 2026 — this assessment keeps its copy\./,
    );
    await expect(row.locator('.xr-row-title')).toHaveText(
      'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
    );
    await checkState(page, NAME);

    await reachAndClick(page, page.getByRole('button', { name: 'Move question 3 up' }));
    await expect(questionsSection(page).locator('.xa-save.is-ok')).toHaveText(
      'Moved Q-0104 to position 2',
    );
    await expect(row).toBeFocused();
    await expect(rows(page).locator('.xr-id')).toHaveText(['Q-0101', 'Q-0104', 'Q-0102', 'Q-0106']);
  });

  test('back from New question with ?added=: the panel offers it first, nothing attached', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const added = await port<{ readonly id: string }>(page, 'questionBank', 'addQuestion', {
      experimentId: SHELL,
      type: 'true-false',
      text: 'A larger LMTD means a smaller exchanger for the same duty.',
      options: {},
      correct: 'true',
      marks: '2',
      explanation: null,
      markingGuidance: null,
    });
    await softNavigate(page, `${SUMMARY}`);
    await expect(page.getByRole('region', { name: 'Ready to use' })).toBeVisible();
    await softNavigate(page, `${QUESTIONS}?added=${added.id}`);
    await expect(bankPanel(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${QUESTIONS}$`));
    await expect(
      bankPanel(page).getByRole('heading', { name: 'From your question bank' }),
    ).toBeFocused();
    const first = bankPanel(page).locator('li').first();
    await expect(first).toContainText(added.id);
    await expect(first).toContainText('Just added to your question bank');
    await expect(rows(page)).toHaveCount(4);
    await checkState(page, NAME);
    await reachAndClick(
      page,
      first.getByRole('button', { name: `Add ${added.id} to this assessment` }),
    );
    await expect(questionsSection(page).locator('.xa-save.is-ok')).toHaveText(
      `${added.id} added as question 5.`,
    );
    await expect(tabCount(page)).toHaveText('Questions 5');
  });

  test('at 375 each row puts its actions under the text (f5)', async ({ page }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const width = page.viewportSize()?.width ?? 1440;
    const first = rows(page).first();
    const title = (await first.locator('.xr-row-title').boundingBox())!;
    const remove = (await first.getByRole('button', { name: /^Remove question 1/ }).boundingBox())!;
    if (width < 768) expect(remove.y).toBeGreaterThan(title.y + title.height - 1);
    else expect(remove.x).toBeGreaterThan(title.x + title.width - 1);
    await checkState(page, NAME);
  });
});
