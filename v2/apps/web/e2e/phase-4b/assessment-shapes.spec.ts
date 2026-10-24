import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';

/**
 * Every Ready assessment shape, end to end, on the test-hook build (the assessment P0 fix, audit
 * CB-2; owner decisions of 24 Oct 2026): choice questions only — the Faculty member confirms the
 * automatic marks —, one written question, choice questions and one written question, and two
 * written questions — a mark saved for each, confirmed once. In ONE tab and one world after Flow C:
 *
 *  1. Dr S. Ranganathan creates the assessment through FA-06 → FA-07's guided steps (the bank's
 *     questions; the second written question of the two-written shape is set up in his bank
 *     through the CI seam), with its own release setting;
 *  2. Rahul Verma (the same tab: the seam switches who is signed in, nothing else) opens it,
 *     starts, answers and submits through ST-12 and ST-13, and reads the waiting words on ST-13's
 *     "Answers submitted" and ST-14;
 *  3. Dr Ranganathan marks it from FA-18 → FA-19 and confirms it through DL-1;
 *  4. Rahul reads the result as the release setting says: released (immediately after marking,
 *     or a deadline already passed), or not released yet (a deadline still ahead).
 *
 * At 1440; FA-19's two new panels (choice only, two written questions) also at 375. Each drawn
 * state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no
 * developer surface, no sideways scroll) and shows no internal reference.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 300_000 });

const RANGANATHAN = { personId: 'per-0014' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const QUEUE = '/faculty/marking';

/** The bank after Flow C (the walk's questions), by their words. */
const Q0101 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q0102 = 'How is the number of transfer units (NTU) defined?';
const Q0104 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q0106 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';
const SECOND = 'Which reading in the simulation showed the fouling most clearly, and why?';

const WRITTEN_ANSWER =
  'Fouling adds a thermal resistance, so U falls and less heat passes at the same flow rates.';
const SECOND_ANSWER = 'The cold-side outlet temperature, because it moved the most.';

const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB|SACC)-\d+/;

/** Where the screenshots for review go (the session scratchpad, or `XR_PRODUCT_SHOTS`). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/cb2/shots';

const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Marks' });
const markFields = (page: Page) => page.getByRole('textbox', { name: /^Your mark/ });
const count = (page: Page) => main(page).locator('.fa-mqcount [role="status"]');
const queueRows = (page: Page) => main(page).locator('table.fa-table tbody tr');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/**
 * A press inside the marks panel. From 860 px the panel is sticky and scrolls within itself when it
 * is taller than the viewport (rb-kit `rk-aside`: two written answers make it so): the wheel turns
 * over the panel, as a person's pointer would, until the control is in view — `reachAndClick` turns
 * it at the viewport's centre, over the reading sheet, which never scrolls the panel. Then the
 * real-pointer reach test presses it. On one column the page scrolls and `reachAndClick` reaches it.
 */
async function pressInPanel(page: Page, target: Locator): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  for (let step = 0; step < 40; step += 1) {
    const box = await target.boundingBox();
    if (box && box.y >= 0 && box.y + box.height <= viewport.height) break;
    const aside = await panel(page).boundingBox();
    if (!aside) break;
    const top = Math.max(aside.y, 0);
    const bottom = Math.min(aside.y + aside.height, viewport.height);
    if (bottom <= top) break;
    await page.mouse.move(aside.x + aside.width / 2, (top + bottom) / 2);
    await page.mouse.wheel(0, box && box.y < 0 ? -120 : 120);
  }
  await reachAndClick(page, target);
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** No internal reference in the page's words, names, placeholders or tab title. */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].map(
      (element) =>
        `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('placeholder') ?? ''}`,
    );
    return [document.body.innerText, document.title, ...named]
      .map((text) => pattern.exec(text)?.[0])
      .filter(Boolean);
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

interface Shape {
  readonly name: string;
  readonly questions: readonly string[];
  /** The bank's second written question is needed (set up through the seam). */
  readonly second: boolean;
  readonly release: 'Immediately after marking' | 'After the deadline';
  readonly deadline: string;
}

/** After Flow C, as Dr Ranganathan on FA-06 (the second written question in his bank, if asked). */
async function startAsFaculty(page: Page, shape: Shape): Promise<void> {
  await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
  await page.goto('/faculty/assessments');
  await expect(h1(page)).toHaveText('Assessments', { timeout: 120_000 });
  if (shape.second) {
    // Set-up only (FA-15 is its own suite): a second written question, out of 5.
    const added = await actAs<{ readonly ok: boolean }>(page, RANGANATHAN, {
      port: 'questionBank',
      method: 'addQuestion',
      input: {
        experimentId: SHELL,
        type: 'written',
        text: SECOND,
        options: {},
        correct: null,
        marks: '5',
        explanation: null,
        markingGuidance: null,
      },
    });
    expect(added.ok).toBe(true);
  }
}

/** FA-06 → FA-07: the guided steps, for real. Answers the new assessment's address. */
async function createThroughTheSteps(page: Page, shape: Shape): Promise<string> {
  await reachAndClick(
    page,
    main(page).locator('.rk-state').getByRole('link', { name: 'Create assessment' }),
  );
  await expect(h1(page)).toHaveText('Choose the experiment', { timeout: 60_000 });
  await page.getByRole('radio', { name: new RegExp(SHELL_NAME) }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(h1(page)).toHaveText('Set the rules');
  await page.getByLabel('Assessment name', { exact: true }).fill(shape.name);
  await page.getByLabel('Pass mark (%)', { exact: true }).fill('50');
  await page.getByLabel('Attempts allowed', { exact: true }).fill('2');
  await page.getByLabel('Deadline', { exact: true }).pressSequentially(shape.deadline);
  await page.getByRole('radio', { name: new RegExp(shape.release) }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(h1(page)).toHaveText('Add questions');
  const list = page.getByRole('group', { name: 'Questions for this assessment' });
  for (const words of shape.questions) await list.getByRole('checkbox', { name: words }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(h1(page)).toHaveText('Preview and create');
  // Every shape is accepted as Ready with no warning (it can now be marked).
  await page.getByRole('button', { name: 'Create assessment' }).click();
  await expect(h1(page)).toHaveText('Assessment created');
  await expect(main(page).locator('.fa-result .xr-st--ok')).toHaveText('Ready');
  const href = await page.getByRole('link', { name: 'Open assessment' }).getAttribute('href');
  const id = /\/faculty\/assessments\/([^/?]+)$/.exec(href ?? '')?.[1];
  expect(id, href ?? '').toBeTruthy();
  return id!;
}

/** Rahul (the same tab): ST-12 → Start → ST-13 answers → Submit → “Answers submitted”. */
async function submitAsRahul(
  page: Page,
  assessmentId: string,
  answer: (page: Page) => Promise<void>,
  questions: number,
  submittedWords: RegExp,
): Promise<void> {
  await switchIdentity(page, RAHUL);
  await softNavigate(page, `/student/assessments/${assessmentId}`);
  await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
  await expect(page).toHaveURL(new RegExp(`/student/assessments/${assessmentId}/attempt$`), {
    timeout: 60_000,
  });
  await answer(page);
  const saving = page.locator('header.st-focusbar .st-save');
  await expect(saving).toHaveText('All answers saved', { timeout: 15_000 });
  await reachAndClick(page, page.getByRole('button', { name: 'Submit', exact: true }));
  const dialog = page.getByRole('dialog', { name: 'Submit your answers?' });
  await expect(dialog.locator('.rk-dlg-body')).toHaveText(
    `All ${questions} questions are answered.`,
  );
  await dialog.getByRole('button', { name: 'Submit answers' }).click();
  const done = page.locator('#Ta-done');
  await expect(done.getByRole('heading', { level: 2 })).toHaveText('Answers submitted');
  await expect(done.locator('.xr-st')).toHaveText('Waiting for marking');
  await expect(done.locator('p.sv-act-d')).toHaveText(submittedWords);
  await expectNoReferences(page);
  // ST-14: waiting for marking — no figure.
  await reachAndClick(page, page.getByRole('link', { name: 'See your result page' }));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Submitted — waiting for marking' }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(main(page)).not.toContainText(/of \d+ marks|You passed|Not passed/);
}

/** Dr Ranganathan (the same tab): Marking (FA-18) → Mark next (FA-19). */
async function openFromTheQueue(page: Page, countWords: string, rowLine: string): Promise<void> {
  await switchIdentity(page, RANGANATHAN);
  await softNavigate(page, QUEUE);
  await expect(page.getByRole('heading', { level: 1, name: 'Marking' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(count(page)).toHaveText(countWords);
  await expect(queueRows(page)).toHaveCount(1);
  await expect(queueRows(page).first().locator('td').nth(1)).toContainText(rowLine);
  await checkState(page, 'Marking');
  await expectNoReferences(page);
  if (width(page) === 1440)
    await shot(page, `fa18-${rowLine.startsWith('Marked') ? 'choice' : 'written'}`);
  await reachAndClick(page, page.getByRole('link', { name: 'Mark next' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Rahul Verma' })).toBeVisible({
    timeout: 60_000,
  });
}

/** Confirm marks in DL-1 (its lines as given), then the read-only panel takes focus. */
async function confirmInTheDialog(page: Page, lines: readonly string[]) {
  const dialog = page.getByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.rk-dlg-group li')).toHaveText([...lines]);
  await expectNoReferences(page);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Confirm marks' }));
  await expect(dialog).toBeHidden();
  const done = page.locator('#ms-mdone');
  await expect(done).toBeFocused();
  await expect(done.locator('.rk-notice--ok .rk-notice-t')).toHaveText('Marks confirmed');
  await expect(done.locator('.rk-notice--ok')).toContainText('· Dr S. Ranganathan');
  await expect(markFields(page)).toHaveCount(0);
  return done;
}

/** Rahul (the same tab) reads his result as the release setting says. */
async function rahulReads(
  page: Page,
  assessmentId: string,
  expected: { readonly released: true; readonly score: string } | { readonly released: false },
  // `score`: the score card's figure as it reads (“4of 6 marks”).
): Promise<void> {
  await switchIdentity(page, RAHUL);
  await softNavigate(
    page,
    `/student/assessments${expected.released ? '?tab=results' : '?tab=submitted'}`,
  );
  const card = page.getByRole('region', { name: expected.released ? 'Results' : 'Submitted' });
  const row = card.locator('ul.sv-list > li.sv-li.sv-ali');
  await expect(row).toHaveCount(1, { timeout: 60_000 });
  if (!expected.released) {
    await expect(row.locator('.sv-li-m .xr-st')).toHaveText('Result not released yet');
    await softNavigate(page, `/student/assessments/${assessmentId}/result`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Result not released yet' }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page)).not.toContainText(/of \d+ marks|You passed|Not passed/);
    await checkState(page, 'Result not released yet');
    await expectNoReferences(page);
    return;
  }
  await expect(row.locator('.sv-li-m .xr-st')).toHaveText('Result ready');
  await reachAndClick(page, row.getByRole('link', { name: /^See result/ }));
  await expect(page.getByRole('heading', { level: 1, name: 'You passed' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(main(page).locator('.sv-score')).toContainText(expected.score);
  await checkState(page, 'You passed');
  await expectNoReferences(page);
}

test.describe('every Ready shape, end to end (owner decisions of 24 Oct 2026)', () => {
  test.beforeEach(({ page }) => {
    test.skip(width(page) !== 1440, 'The four shapes run at 1440; FA-19 at 375 below.');
  });

  test('choice questions only: queued to confirm, Faculty confirms the automatic marks, released at once', async ({
    page,
  }) => {
    const shape: Shape = {
      name: 'Fin-Tube — quick check (choice only)',
      questions: [Q0101, Q0102, Q0104],
      second: false,
      release: 'Immediately after marking',
      deadline: '14 Nov 2026, 23:59',
    };
    await startAsFaculty(page, shape);
    const id = await createThroughTheSteps(page, shape);
    await submitAsRahul(
      page,
      id,
      async (attempt) => {
        await attempt
          .getByText('The actual heat transfer with the largest heat transfer possible')
          .click();
        await attempt.getByText('C_min ÷ C_max', { exact: true }).click();
        await attempt.getByText('True', { exact: true }).click();
      },
      3,
      /^Submitted 27\sOct\s2026,\s\d\d:\d\d\. Your faculty confirms the automatic marks\. Your result appears once your answers are marked\.$/,
    );
    await expect(main(page)).toContainText('Your faculty confirms the automatic marks.');
    await expect(main(page)).not.toContainText('written answers');
    await checkState(page, 'Submitted — waiting for marking');
    // The Submitted tab says who does what, truthfully.
    await softNavigate(page, '/student/assessments?tab=submitted');
    const submitted = page
      .getByRole('region', { name: 'Submitted' })
      .locator('ul.sv-list > li.sv-li.sv-ali');
    await expect(submitted.locator('.sv-li-m > span:last-child')).toHaveText(
      /^Submitted 27\sOct\s2026,\s\d\d:\d\d · your faculty confirms the automatic marks$/,
      { timeout: 60_000 },
    );

    await openFromTheQueue(
      page,
      '1 submission to confirm',
      'Marked automatically · confirm the marks',
    );
    const automatic = page.getByRole('region', { name: 'Marked automatically' });
    await expect(automatic.locator('.fa-autos-h b')).toHaveText('4 of 6 marks');
    await expect(automatic.locator('.fa-res')).toHaveText(['2 of 2', '0 of 2', '2 of 2']);
    await expect(markFields(page)).toHaveCount(0);
    await expect(panel(page).locator('.rk-notice')).toContainText(
      'There’s no written answer to mark',
    );
    await expect(panel(page).locator('.fa-total')).toContainText(
      '4 of 64 marked automatically · pass mark 3',
    );
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    await shot(page, 'fa19-choice-only');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Rahul’s total becomes 4 of 6 marks — passed (pass mark 3).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    await expect(done.locator('.fa-done-total')).toHaveText('4 of 6 marksPassed · pass mark 3');
    await expect(done.locator('dl dt')).toHaveText(['Marked automatically']);
    await expect(done.locator('dl dd')).toHaveText(['4 of 6 marks']);
    await expect(done.locator('p.fa-savednote')).toHaveText(
      /^Result released to Rahul when the marks were confirmed, 27\sOct\s2026,\s\d\d:\d\d\.$/,
    );
    await checkState(page, 'Rahul Verma');
    await shot(page, 'fa19-choice-only-confirmed');
    // Nothing waits any more: the rail and the queue agree.
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Marking' }),
    );
    await expect(count(page)).toHaveText('Nothing waiting');

    await rahulReads(page, id, { released: true, score: '4of 6 marks' });
  });

  test('one written question: marked and confirmed; after the deadline, so not released yet', async ({
    page,
  }) => {
    const shape: Shape = {
      name: 'Shell-and-Tube — written reflection (one written)',
      questions: [Q0106],
      second: false,
      release: 'After the deadline',
      deadline: '14 Nov 2026, 23:59',
    };
    await startAsFaculty(page, shape);
    const id = await createThroughTheSteps(page, shape);
    await submitAsRahul(
      page,
      id,
      async (attempt) => {
        await attempt
          .getByLabel('Explain how fouling changes', { exact: false })
          .fill(WRITTEN_ANSWER);
      },
      1,
      /^Submitted 27\sOct\s2026,\s\d\d:\d\d\. Your faculty marks written answers\. Your result appears after the deadline: 14\sNov\s2026,\s23:59\.$/,
    );
    await openFromTheQueue(page, '1 written answer waiting', 'Question 1 · written answer');
    await expect(main(page).locator('.fa-answer')).toHaveText(WRITTEN_ANSWER);
    await markFields(page).first().pressSequentially('4');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Question 1 is marked 4 of 10.',
      'Rahul’s total becomes 4 of 10 marks — not passed (pass mark 5).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    ]);
    await expect(done.locator('.fa-done-total')).toHaveText(
      '4 of 10 marksNot passed · pass mark 5',
    );
    await expect(done.locator('p.rk-locked')).toHaveText(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await rahulReads(page, id, { released: false });
  });

  test('choice questions and one written: marked and confirmed; the deadline has passed, so released', async ({
    page,
  }) => {
    const shape: Shape = {
      name: 'Beam — post-lab (mixed)',
      questions: [Q0101, Q0104, Q0106],
      second: false,
      release: 'After the deadline',
      // The sample "now" is 27 Oct 2026: this deadline has passed (it is advisory, OD-B4-02).
      deadline: '20 Oct 2026, 23:59',
    };
    await startAsFaculty(page, shape);
    const id = await createThroughTheSteps(page, shape);
    await submitAsRahul(
      page,
      id,
      async (attempt) => {
        await attempt
          .getByText('The actual heat transfer with the largest heat transfer possible')
          .click();
        await attempt.getByText('True', { exact: true }).click();
        await attempt
          .getByLabel('Explain how fouling changes', { exact: false })
          .fill(WRITTEN_ANSWER);
      },
      3,
      /^Submitted 27\sOct\s2026,\s\d\d:\d\d\. Your faculty marks written answers\. Your result appears after the deadline: 20\sOct\s2026,\s23:59\.$/,
    );
    await openFromTheQueue(page, '1 written answer waiting', 'Question 3 · written answer');
    await expect(
      page.getByRole('region', { name: 'Marked automatically' }).locator('.fa-autos-h b'),
    ).toHaveText('4 of 4 marks');
    await markFields(page).first().pressSequentially('8');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Question 3 is marked 8 of 10.',
      'Rahul’s total becomes 12 of 14 marks — passed (pass mark 7).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm — the deadline has passed.',
    ]);
    await expect(done.locator('.fa-done-total')).toHaveText('12 of 14 marksPassed · pass mark 7');
    await rahulReads(page, id, { released: true, score: '12of 14 marks' });
  });

  test('two written questions: one block each, Confirm refused until both are saved, then confirmed once and released', async ({
    page,
  }) => {
    const shape: Shape = {
      name: 'Composite Wall — report (two written)',
      questions: [Q0106, SECOND],
      second: true,
      release: 'Immediately after marking',
      deadline: '14 Nov 2026, 23:59',
    };
    await startAsFaculty(page, shape);
    const id = await createThroughTheSteps(page, shape);
    await submitAsRahul(
      page,
      id,
      async (attempt) => {
        await attempt
          .getByLabel('Explain how fouling changes', { exact: false })
          .fill(WRITTEN_ANSWER);
        await attempt
          .getByLabel('Which reading in the simulation', { exact: false })
          .fill(SECOND_ANSWER);
      },
      2,
      /^Submitted 27\sOct\s2026,\s\d\d:\d\d\. Your faculty marks written answers\. Your result appears once your answers are marked\.$/,
    );
    await openFromTheQueue(
      page,
      '2 written answers waiting',
      'Questions 1 and 2 · written answers',
    );
    await expect(markFields(page)).toHaveCount(2);
    await expect(markFields(page).nth(0)).toHaveAccessibleName(
      'Your mark Question 1 · written answer, out of 10',
    );
    await expect(markFields(page).nth(1)).toHaveAccessibleName(
      'Your mark Question 2 · written answer, out of 5',
    );
    await expect(panel(page).locator('.fa-total')).toContainText(
      '— of 150 marked automatically + the written marks',
    );
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    await shot(page, 'fa19-two-written');

    // Save the first block (with feedback) only.
    await markFields(page).nth(0).pressSequentially('8');
    await page
      .getByRole('textbox', { name: 'Feedback for Rahul on question 1 (optional)' })
      .fill('Clear profile with your own readings.');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Save mark for question 1' }));
    await expect(page.locator('#ms-saved-q1')).toHaveText('Mark saved — not confirmed yet');
    await expect(page.locator('#ms-saved-q1')).toBeFocused();

    // Confirm with the second empty: refused under its score, which takes focus; no dialog.
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    await expect(panel(page).locator('.rk-ferr')).toHaveText('Enter a mark for question 2');
    await expect(markFields(page).nth(1)).toBeFocused();
    await expect(markFields(page).nth(1)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, 'Rahul Verma');
    await shot(page, 'fa19-two-written-refused');

    // The second typed: Confirm saves it first, then one confirmation for the attempt.
    await markFields(page).nth(1).pressSequentially('4');
    await expect(panel(page).locator('.fa-total')).toContainText(
      '12 of 150 marked automatically + 12 written · pass mark 7.5',
    );
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Question 1 is marked 8 of 10.',
      'Question 2 is marked 4 of 5.',
      'Rahul’s total becomes 12 of 15 marks — passed (pass mark 7.5).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    await expect(done.locator('.fa-done-total')).toHaveText('12 of 15 marksPassed · pass mark 7.5');
    await expect(done.locator('dl dt')).toHaveText([
      'Question 1',
      'Question 2',
      'Feedback on question 1',
      'Feedback on question 2',
    ]);
    await expect(done.locator('dl dd')).toHaveText([
      '8 of 10',
      '4 of 5',
      'Clear profile with your own readings.',
      'No feedback',
    ]);
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    await shot(page, 'fa19-two-written-confirmed');

    await rahulReads(page, id, { released: true, score: '12of 15 marks' });
    await expect(main(page)).toContainText('Clear profile with your own readings.');
  });
});

test.describe('FA-19 at 375: the choice-only and two-written panels', () => {
  test.beforeEach(({ page }) => {
    test.skip(width(page) !== 375, 'Phone width only.');
  });

  /** Set up through the seam (the steps are the 1440 tests'): created, answered, submitted. */
  async function submitted(
    page: Page,
    questions: readonly string[],
    answers: readonly (readonly [string, unknown])[],
  ): Promise<string> {
    await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
    await page.goto(QUEUE);
    await expect(page.getByRole('heading', { level: 1, name: 'Marking' })).toBeVisible({
      timeout: 120_000,
    });
    type Answered<T> = { readonly ok: boolean; readonly value: T };
    const run = async <T>(
      person: { readonly personId: string },
      port: string,
      method: string,
      input: unknown,
    ) => {
      const answer = await actAs<Answered<T>>(page, person, { port, method, input });
      expect(answer.ok, `${port}.${method} ${JSON.stringify(answer)}`).toBe(true);
      return answer.value;
    };
    const ids = [...questions];
    if (ids.includes('second')) {
      const added = await run<{ readonly id: string }>(RANGANATHAN, 'questionBank', 'addQuestion', {
        experimentId: SHELL,
        type: 'written',
        text: SECOND,
        options: {},
        correct: null,
        marks: '5',
        explanation: null,
        markingGuidance: null,
      });
      ids[ids.indexOf('second')] = added.id;
    }
    const created = await run<{ readonly id: string }>(
      RANGANATHAN,
      'assessments',
      'createAssessment',
      {
        mode: 'create',
        experimentId: SHELL,
        name: 'Shell-and-Tube — quick check',
        introduction: null,
        rules: {
          passMarkPercent: '50',
          attemptsAllowed: '2',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: 'immediately-after-marking',
          releaseDate: null,
        },
        questions: ids,
      },
    );
    let attempt = await run<{ readonly id: string; readonly rev: number }>(
      RAHUL,
      'assessments',
      'startAttempt',
      created.id,
    );
    for (const [questionId, answer] of answers) {
      attempt = await run(RAHUL, 'assessments', 'saveAnswer', {
        attemptId: attempt.id,
        questionId: questionId === 'second' ? ids[ids.length - 1] : questionId,
        answer,
        expectedRev: attempt.rev,
      });
    }
    await run(RAHUL, 'assessments', 'submitAttempt', {
      attemptId: attempt.id,
      expectedRev: attempt.rev,
    });
    await reachAndClick(page, page.getByRole('link', { name: 'Mark next' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Rahul Verma' })).toBeVisible({
      timeout: 60_000,
    });
    return attempt.id;
  }

  /** Below 860 px the marks panel is under the reading sheet, reached by “Go to the marks”. */
  async function expectPhoneLayout(page: Page): Promise<void> {
    const sheet = await main(page).locator('.rk-detail > .fa-sheet').boundingBox();
    const aside = await panel(page).boundingBox();
    expect(aside!.y).toBeGreaterThan(sheet!.y + sheet!.height - 1);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Go to the marks' }));
    await expect(page.locator('#ms-panel')).toBeFocused();
  }

  test('choice only: the automatic marks, the total and Confirm marks, then read-only', async ({
    page,
  }) => {
    await submitted(
      page,
      ['Q-0101', 'Q-0102', 'Q-0104'],
      [
        ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
        ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
        ['Q-0104', { type: 'true-false', value: true }],
      ],
    );
    await expect(markFields(page)).toHaveCount(0);
    await expectPhoneLayout(page);
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    await shot(page, 'fa19-choice-only');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Rahul’s total becomes 4 of 6 marks — passed (pass mark 3).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    await expect(done.locator('dl dd')).toHaveText(['4 of 6 marks']);
    await checkState(page, 'Rahul Verma');
    await shot(page, 'fa19-choice-only-confirmed');
  });

  test('two written questions: a block each, refused until both are saved, then confirmed once', async ({
    page,
  }) => {
    await submitted(
      page,
      ['Q-0106', 'second'],
      [
        ['Q-0106', { type: 'written', text: WRITTEN_ANSWER }],
        ['second', { type: 'written', text: SECOND_ANSWER }],
      ],
    );
    await expect(markFields(page)).toHaveCount(2);
    await expectPhoneLayout(page);
    await checkState(page, 'Rahul Verma');
    await shot(page, 'fa19-two-written');
    await markFields(page).nth(0).pressSequentially('8');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    await expect(panel(page).locator('.rk-ferr')).toHaveText('Enter a mark for question 2');
    await expect(markFields(page).nth(1)).toBeFocused();
    await checkState(page, 'Rahul Verma');
    await markFields(page).nth(1).pressSequentially('4');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const done = await confirmInTheDialog(page, [
      'Question 1 is marked 8 of 10.',
      'Question 2 is marked 4 of 5.',
      'Rahul’s total becomes 12 of 15 marks — passed (pass mark 7.5).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    await expect(done.locator('dl dd')).toHaveText([
      '8 of 10',
      '4 of 5',
      'No feedback',
      'No feedback',
    ]);
    await checkState(page, 'Rahul Verma');
    await shot(page, 'fa19-two-written-confirmed');
  });
});
