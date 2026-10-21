import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * FA-08 Assessment · Summary and FA-09 Assessment · Questions in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-08 Summary", "FA-09 Questions"; earlier board B4-05 f0 … f8) on the
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
const rows = (page: Page) => questionsSection(page).locator('ol.fa-qlist > li.fa-q');
const bankPanel = (page: Page) =>
  page.getByRole('complementary', { name: 'From your question bank' });
const tabs = (page: Page) => page.getByRole('navigation', { name: `${NAME} sections` });
const tabCount = (page: Page) => tabs(page).getByRole('link', { name: /^Questions/ });
const message = (page: Page) => page.locator('#questions-msg');
const submissionsPanel = (page: Page) => page.getByRole('complementary', { name: 'Submissions' });

const Q0101 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q0102 = 'How is the number of transfer units (NTU) defined?';
const Q0103 = 'In a counter-flow exchanger, what can happen that cannot happen in parallel flow?';
const Q0104 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q0105 =
  'For the same inlet conditions and UA, parallel flow transfers more heat than counter flow.';
const Q0106 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';
/** A row's words without "Question <n>: " (read by screen readers before them). */
const rowWords = (page: Page) => rows(page).locator('.fa-qt');
const words = (texts: readonly string[]) =>
  texts.map((text, index) => `Question ${index + 1}: ${text}`);

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

test.describe('FA-08 Assessment · Summary', () => {
  test('Ready with a submission: the band, readiness, rules, reach and the Submissions panel', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SUMMARY);
    const ready = page.getByRole('region', { name: 'Ready to use' });
    await expect(ready).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    await expect(tabs(page).getByRole('link')).toHaveText([
      'Summary',
      'Questions4, 4',
      'Settings',
      'Preview',
      'Submissions1, 1',
    ]);
    const band = main(page).locator('header.fa-cid.fa-rec');
    await expect(band.locator('.fa-cid-eyebrow')).toHaveText(`ME ZG523${SHELL_NAME}`);
    await expect(band.locator('.fa-rec-meta .xr-st--ok')).toHaveText('Ready');
    await expect(band.locator('.fa-fig dd')).toHaveText(['Deadline passed', '1 of 1', '4']);
    await expect(ready).toContainText(`Students who have ${SHELL_NAME} can see and start it.`);
    await expect(ready.locator('ul.fa-check > li')).toHaveText([
      'Name and introduction',
      'Rules set for this assessment',
      '4 questions · 16 marks',
    ]);
    const submissions = submissionsPanel(page);
    await expect(submissions.locator('.fa-panel-lead')).toHaveText(
      'Nothing is waiting for marking.',
    );
    await expect(submissions).toContainText(
      'Students have submitted. If you change the questions or rules now, that makes a new version — earlier submissions keep theirs.',
    );
    // Phase 4B: nothing waits, so no "Mark next"; "See submissions" opens FA-12.
    await expect(main(page).getByText('Mark next')).toHaveCount(0);
    await expect(submissions.getByRole('link', { name: 'See submissions' })).toHaveAttribute(
      'href',
      `${SUMMARY}/submissions`,
    );
    await expect(page.getByRole('region', { name: 'Who it reaches' })).toContainText(
      `1 student who has ${SHELL_NAME} from Godavari Institute of Technology.`,
    );
    const rules = page.getByRole('region', { name: 'Rules as set for this assessment' });
    await expect(rules.locator('dl.fa-rules dt')).toHaveText([
      'Pass mark',
      'Attempts allowed',
      'Deadline',
      'Result and answers',
      'Time limit',
    ]);
    await expect(rules.locator('dl.fa-rules dd')).toHaveText([
      '50% · 8 of 16 marks',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
      'None',
    ]);
    await expect(rules.locator('.fa-introbox')).toContainText('Introduction students read first');
    // The rules stack on phones; wider, two side by side.
    const width = page.viewportSize()?.width ?? 1440;
    const columns = await rules
      .locator('dl.fa-rules')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 768 ? 1 : 2);
    // Under 860 px of content (`rkd` container) the Submissions panel comes first (`fa-asidefirst`);
    // wider, it sits beside the sheet.
    const beside = await main(page)
      .locator('.rk-detail')
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length === 2);
    if (width === 1440) expect(beside).toBe(true);
    if (width === 375) expect(beside).toBe(false);
    const panelBox = (await submissions.boundingBox())!;
    const readyBox = (await ready.boundingBox())!;
    if (!beside) expect(panelBox.y).toBeLessThan(readyBox.y);
    else expect(panelBox.x).toBeGreaterThan(readyBox.x + readyBox.width - 1);
    await expectNoReferences(page);
    await checkState(page, NAME);

    await reachAndClick(page, rules.getByRole('link', { name: 'Change settings' }));
    await expect(page).toHaveURL(new RegExp(`${SUMMARY}/settings$`));
  });

  test('a written answer submitted in the same world waits for marking', async ({ page }) => {
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
    const submissions = submissionsPanel(page);
    await expect(submissions.locator('p.rk-pending')).toHaveText(
      '1 written answer waiting for marking',
    );
    await expect(
      submissions.getByRole('list', { name: 'Waiting for marking, oldest first' }).locator('li b'),
    ).toHaveText(['Rahul Verma']);
    await expect(submissions.locator('.fa-ph-note')).toHaveText('Oldest first');
    await expect(main(page).locator('.fa-rec-meta .fa-rec-wait')).toHaveText(
      '1 waiting for marking',
    );
    // Phase 4B: "Mark next" opens FA-19 for the waiting submission.
    await expect(submissions.getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${saved.value.id}`,
    );
    await expectNoReferences(page);
    await checkState(page, NAME);
  });

  test('a draft without questions: the waiting item and "Add questions"', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/assessments');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const id = await saveDraft(page);
    await softNavigate(page, `/faculty/assessments/${id}`);
    const draft = page.getByRole('region', { name: 'Draft — not ready' });
    await expect(draft).toBeVisible();
    await expect(main(page).locator('.fa-rec-meta .xr-st')).toHaveText('Draft — not ready');
    await expect(draft).toContainText(
      'Students can’t see a draft. It needs at least one question.',
    );
    await expect(draft.locator('ul.fa-check > li.is-no')).toHaveCount(1);
    await expect(draft.locator('ul.fa-check > li').last()).toHaveText(
      'At least one question — none yet',
    );
    await expect(submissionsPanel(page)).toContainText(
      'Students can’t see a draft, so no one can submit yet.',
    );
    await expect(main(page).locator('.rb-btn--primary')).toHaveText(['Add questions']);
    await expectNoReferences(page);
    await checkState(page, NAME);

    // "Add questions" opens the Questions tab: "No questions yet".
    await reachAndClick(page, draft.getByRole('link', { name: 'Add questions' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/questions$`));
    const empty = questionsSection(page).locator('.rk-state');
    await expect(empty.locator('.rk-state-t')).toHaveText('No questions yet');
    await expect(questionsSection(page).locator('.fa-qhead [role="status"]')).toHaveText(
      '0 questions · 0 marks',
    );
    await expect(empty).toContainText(
      'Add questions from your bank, write a new one, draft some with assistance, or import a file. Students can’t see the assessment until it has a question.',
    );
    await expect(
      questionsSection(page).getByRole('link', { name: 'Draft with assistance' }),
    ).toHaveAttribute('href', `/faculty/question-bank/draft?experimentId=${SHELL}`);
    await expect(questionsSection(page).getByRole('link', { name: 'Import' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/import?experimentId=${SHELL}`,
    );
    await checkState(page, NAME);

    // Adding the first question from the bank panel makes it Ready.
    await reachAndClick(
      page,
      questionsSection(page).getByRole('button', { name: 'Add from question bank' }),
    );
    await expect(bankPanel(page).locator('ul.fa-avail li')).toHaveCount(6);
    await reachAndClick(
      page,
      bankPanel(page).getByRole('button', { name: `Add to this assessment: ${Q0101}` }),
    );
    await expect(message(page)).toContainText('Added as question 1.');
    await expect(tabCount(page)).toHaveText('Questions1, 1');
    await expect(main(page).locator('.fa-rec-meta .xr-st')).toHaveText('Ready');
  });
});

test.describe('FA-09 Assessment · Questions', () => {
  test('Remove, then Add back from the bank panel: a new version after the submission', async ({
    page,
  }) => {
    // A long walk: at 375 every press is reached by scrolling.
    test.setTimeout(90_000);
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    await expect(rowWords(page)).toHaveText(words([Q0101, Q0102, Q0104, Q0106]));
    await expect(questionsSection(page).locator('.fa-qhead [role="status"]')).toHaveText(
      '4 questions · 16 marks',
    );
    await expect(
      questionsSection(page).getByRole('link', { name: 'Draft with assistance' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Move question 1 up' })).toBeDisabled();
    await expect(questionsSection(page).locator('p.rk-pending')).toHaveText(
      'Rahul Verma has submitted. If you change the questions now, that makes a new version — their submissions keep theirs.',
    );
    await expectNoReferences(page);
    await checkState(page, NAME);

    await reachAndClick(
      page,
      page.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    await expect(message(page).locator('.rk-notice-t')).toHaveText(
      'Question removed from this assessment. It is still in your question bank.',
    );
    await expect(message(page)).toBeFocused();
    await expect(rows(page)).toHaveCount(3);
    await expect(tabCount(page)).toHaveText('Questions3, 3');
    await expect(message(page).locator('.rk-notice-d')).toHaveText(
      'This made version 2. Rahul Verma’s submission keeps version 1; new attempts use version 2.',
    );

    // The bank panel; its title takes focus.
    await reachAndClick(page, page.getByRole('button', { name: 'Add from question bank' }));
    await expect(bankPanel(page)).toBeVisible();
    await expect(
      bankPanel(page).getByRole('heading', { name: 'From your question bank' }),
    ).toBeFocused();
    await expect(bankPanel(page)).toContainText(`${SHELL_NAME} · not in this assessment`);
    await expect(bankPanel(page).locator('.fa-avail-t')).toHaveText([Q0102, Q0103, Q0105]);
    await expect(bankPanel(page).locator('.fa-qm')).toHaveText([
      'Multiple choice · 2 marks',
      'Multiple choice · 2 marks',
      'True or false · 2 marks',
    ]);
    // Beside the list from 860 px of page (`rkd` container query), below it under that.
    const width = page.viewportSize()?.width ?? 1440;
    const beside = await main(page)
      .locator('.rk-detail')
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length === 2);
    if (width === 1440) expect(beside).toBe(true);
    if (width === 375) expect(beside).toBe(false);
    const listBox = (await questionsSection(page).boundingBox())!;
    const panelBox = (await bankPanel(page).boundingBox())!;
    if (beside) expect(panelBox.x).toBeGreaterThan(listBox.x + listBox.width - 1);
    else expect(panelBox.y).toBeGreaterThan(listBox.y + listBox.height - 1);
    await expectNoReferences(page);
    await checkState(page, NAME);

    await reachAndClick(
      page,
      bankPanel(page).getByRole('button', { name: `Add to this assessment: ${Q0102}` }),
    );
    await expect(message(page).locator('.rk-notice-t')).toHaveText('Added as question 4.');
    await expect(tabCount(page)).toHaveText('Questions4, 4');
    await expect(rowWords(page).last()).toHaveText(`Question 4: ${Q0102}`);
    await expect(bankPanel(page).locator('ul.fa-avail li')).toHaveCount(2);

    await reachAndClick(page, bankPanel(page).getByRole('button', { name: 'Close question bank' }));
    await expect(bankPanel(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add from question bank' })).toBeFocused();

    // The Summary shows the version the change made.
    // The tab strip scrolls sideways at 375: the tab is brought into view as a swipe would.
    await tabs(page).getByRole('link', { name: 'Summary' }).click();
    const versions = page.getByRole('region', { name: 'Versions' });
    await expect(versions.locator('.rk-notice-t')).toHaveText(
      /^Version 2 since \d+ \w+ 2026, \d{2}:\d{2}$/,
    );
    await expect(versions.locator('.rk-notice-d')).toHaveText(
      'You changed the questions after students submitted. Rahul Verma’s submission keeps version 1; new attempts use version 2.',
    );
    await checkState(page, NAME);
  });

  test('a bank edit: "A newer version …" and Use updated version', async ({ page }) => {
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
    await expect(row.locator('.fa-qnote')).toContainText(
      'A newer version is in your question bank.',
    );
    // The assessment keeps the version it pins until the Faculty member says otherwise.
    await expect(row.locator('.fa-qt')).toHaveText(`Question 2: ${Q0102}`);
    await expectNoReferences(page);
    await checkState(page, NAME);

    await reachAndClick(
      page,
      row.getByRole('button', { name: 'Use the updated version of question 2' }),
    );
    await expect(message(page).locator('.rk-notice-t')).toHaveText(
      'Question 2 now uses the version in your bank.',
    );
    await expect(row.locator('.fa-qt')).toHaveText(`Question 2: ${edited}`);
    await expect(row).not.toContainText('A newer version');
  });

  test('a question deleted from the bank keeps its copy; a move reorders', async ({ page }) => {
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
    await expect(row.locator('.fa-qt')).toHaveText(`Question 3: ${Q0104}`);
    await checkState(page, NAME);

    await reachAndClick(page, page.getByRole('button', { name: 'Move question 3 up' }));
    await expect(message(page).locator('.rk-notice-t')).toHaveText(
      'Moved question 3 to position 2.',
    );
    await expect(row).toBeFocused();
    await expect(rowWords(page)).toHaveText(words([Q0101, Q0104, Q0102, Q0106]));
  });

  test('back from New question with ?added=: the page offers it, nothing attached', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const text = 'A larger LMTD means a smaller exchanger for the same duty.';
    const added = await port<{ readonly id: string }>(page, 'questionBank', 'addQuestion', {
      experimentId: SHELL,
      type: 'true-false',
      text,
      options: {},
      correct: 'true',
      marks: '2',
      explanation: null,
      markingGuidance: null,
    });
    await softNavigate(page, `${SUMMARY}`);
    await expect(page.getByRole('region', { name: 'Ready to use' })).toBeVisible();
    await softNavigate(page, `${QUESTIONS}?added=${added.id}`);
    await expect(message(page)).toContainText('Saved to your question bank.');
    await expect(page).toHaveURL(new RegExp(`${QUESTIONS}$`));
    await expect(message(page)).toBeFocused();
    await expect(message(page)).toContainText(
      'It isn’t in this assessment yet. Add it only if you want it here.',
    );
    await expect(bankPanel(page)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(4);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await reachAndClick(
      page,
      message(page).getByRole('button', { name: 'Add this question to the assessment' }),
    );
    await expect(message(page).locator('.rk-notice-t')).toHaveText('Added as question 5.');
    await expect(tabCount(page)).toHaveText('Questions5, 5');
    await expect(rowWords(page).last()).toHaveText(`Question 5: ${text}`);
  });

  test('at 375 each row puts its actions under the text', async ({ page }) => {
    await open(page, 'after-flow-d', QUESTIONS);
    await expect(rows(page)).toHaveCount(4);
    const width = page.viewportSize()?.width ?? 1440;
    const first = rows(page).first();
    const title = (await first.locator('.fa-qt').boundingBox())!;
    const remove = (await first.getByRole('button', { name: /^Remove question 1/ }).boundingBox())!;
    if (width < 768) expect(remove.y).toBeGreaterThan(title.y + title.height - 1);
    else expect(remove.x).toBeGreaterThan(title.x + title.width - 1);
    await checkState(page, NAME);
  });
});
