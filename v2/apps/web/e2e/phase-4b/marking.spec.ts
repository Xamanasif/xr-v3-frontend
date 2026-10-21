import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-18 Marking queue and FA-19 Mark a submission as the owner-approved Faculty export draws them
 * (V3 Refined B, FA-v1 `Main.dc.html` FA-18, FA-19 and the Confirm marks dialog), and the FA-01
 * Overview actions they make possible (the teaching group's describe), on the test-hook build at
 * 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll) and shows no internal
 * reference (the owner's identifier rule). Worlds: after Flow C as Dr S. Ranganathan — he creates
 * “Heat Exchanger — post-lab” (the walk’s D1), Meera Iyer gives Priya Natarajan the experiment and
 * Rahul and Priya submit (the CI seam only SETS UP the world; the stand-in marks their choice
 * questions on submit). Everything the screens do — the filters, “Mark next”, typing a mark, Save
 * mark, Confirm marks through the dialog, “Next submission”, the breadcrumb — is done by real
 * clicks and typing. After Flow D, the confirmed and released attempt.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const RANGANATHAN = { personId: 'per-0014' };
const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const PRIYA = { personId: 'per-0003' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const POST_LAB = 'Heat Exchanger — post-lab';
const QUEUE = '/faculty/marking';

const RAHUL_WRITTEN =
  'In the WEB run I turned the fouling up and kept both flow rates the same. The hot fluid left hotter than before and the cold fluid left cooler, so less heat was passed across. Fouling is an extra layer of resistance, so U goes down and the effectiveness goes down with it. That is why exchangers are cleaned, or designed with extra area.';
const PRIYA_WRITTEN =
  'Fouling builds up on the tubes and acts like insulation. The overall coefficient U drops, so for the same flows the exchanger transfers less heat and both outlet temperatures change less.';
const FEEDBACK =
  'Good use of your own readings and the right cause. For full marks, link the fall in U to the NTU and effectiveness relationship you derived in the lab.';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/e6f2f9f4-aaaa-49f8-bcc7-f8cf4cd1eb0d/scratchpad/shots-product/marking';

/** An internal reference: the Faculty’s ids (ASMT-, ATT-, Q-, D-) and every other role’s. */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam (set-up only), which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/** D1: he creates “Heat Exchanger — post-lab” of Q-0101, Q-0102, Q-0104 and Q-0106 (written). */
async function createPostLab(page: Page): Promise<string> {
  const created = await port<{ readonly id: string }>(
    page,
    RANGANATHAN,
    'assessments',
    'createAssessment',
    {
      mode: 'create',
      experimentId: SHELL,
      name: POST_LAB,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    },
  );
  return created.id;
}

/** Meera gives Priya Shell-and-Tube (IA-05). */
async function givePriyaAccess(page: Page): Promise<void> {
  const options = await port<{ readonly plan: { readonly rev: number } }>(
    page,
    MEERA,
    'studentAccess',
    'getGiveAccessOptions',
    {},
  );
  await port(page, MEERA, 'studentAccess', 'giveAccess', {
    experimentIds: [SHELL],
    target: { kind: 'student', studentId: PRIYA.personId },
    expectedPlanRev: options.plan.rev,
  });
}

/** A Student starts, answers (Q1 A, Q2 B, Q3 true: 4 of 6 by the key) and submits. */
async function submit(
  page: Page,
  student: { readonly personId: string },
  assessmentId: string,
  written: string,
): Promise<string> {
  let attempt = await port<{ readonly id: string; readonly rev: number }>(
    page,
    student,
    'assessments',
    'startAttempt',
    assessmentId,
  );
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: written }],
  ] as const) {
    attempt = await port(page, student, 'assessments', 'saveAnswer', {
      attemptId: attempt.id,
      questionId,
      answer,
      expectedRev: attempt.rev,
    });
  }
  await port(page, student, 'assessments', 'submitAttempt', {
    attemptId: attempt.id,
    expectedRev: attempt.rev,
  });
  return attempt.id;
}

/** After Flow C, on the queue: the assessment, Priya’s access and both answers submitted. */
async function twoWaiting(page: Page) {
  await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
  await page.goto(QUEUE);
  await expect(heading(page, 'Marking')).toBeVisible({ timeout: 90_000 });
  const assessmentId = await createPostLab(page);
  await givePriyaAccess(page);
  const rahul = await submit(page, RAHUL, assessmentId, RAHUL_WRITTEN);
  const priya = await submit(page, PRIYA, assessmentId, PRIYA_WRITTEN);
  await expect(count(page)).toHaveText('2 written answers waiting');
  return { assessmentId, rahul, priya };
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const count = (page: Page) => main(page).locator('.fa-mqcount [role="status"]');
const table = (page: Page) => main(page).locator('table.fa-table');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Marks' });
const markField = (page: Page) => page.getByRole('textbox', { name: /^Your mark/ });
/** A Waiting / Marked / All button (its name adds the count: “Marked , 1” in Chromium). */
const segment = (page: Page, label: string) =>
  page
    .getByRole('group', { name: 'Show' })
    .getByRole('button', { name: new RegExp(`^${label}\\b`) });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** No internal reference in the page’s words, names or title (the owner’s identifier rule). */
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

/** Below 760 px of table width the rows are compact blocks and the head row is not shown. */
async function expectTableLayout(page: Page): Promise<void> {
  const header = table(page).locator('thead');
  const tableWidth = await main(page)
    .locator('.fa-tablewrap')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (tableWidth < 760) await expect(header).toBeHidden();
  else await expect(header).toBeVisible();
}

/** Beside from 860 px of detail width; below, the marks panel moves under the reading sheet. */
async function expectDecisionLayout(page: Page, beside: Locator): Promise<void> {
  const sheet = await main(page).locator('.rk-detail > .fa-sheet').boundingBox();
  const aside = await beside.boundingBox();
  if (!sheet || !aside) throw new Error('not laid out');
  const detailWidth = await main(page)
    .locator('.rk-detailwrap')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (detailWidth >= 860) {
    expect(aside.x).toBeGreaterThan(sheet.x + sheet.width - 1);
    await expect(main(page).locator('p.fa-gomark')).toBeHidden();
  } else {
    expect(aside.y).toBeGreaterThan(sheet.y + sheet.height - 1);
    await expect(main(page).locator('p.fa-gomark')).toBeVisible();
  }
}

test.describe('FA-18 Marking queue', () => {
  test('nothing waiting, then two answers: filters, oldest first, Mark next', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
    await page.goto(QUEUE);
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 90_000 });
    // No assessment, no answer yet: “Nothing is waiting for you”, no filters.
    await expect(main(page).getByText('Nothing is waiting for you')).toBeVisible();
    await expect(count(page)).toHaveText('Nothing waiting');
    await expect(main(page)).toContainText(
      'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
    );
    await expect(main(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Assessment' })).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', QUEUE);
    await checkState(page, 'Marking');

    // The world moves: the assessment, Priya’s access, two submissions.
    const assessmentId = await createPostLab(page);
    await givePriyaAccess(page);
    const rahul = await submit(page, RAHUL, assessmentId, RAHUL_WRITTEN);
    await submit(page, PRIYA, assessmentId, PRIYA_WRITTEN);
    await expect(count(page)).toHaveText('2 written answers waiting');
    await expect(main(page).locator('.fa-oldest')).toHaveText('Oldest submitted today');
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    const first = table(page).locator('tbody tr').first();
    await expect(first.locator('td.fa-c-main')).toHaveText('Rahul VermaAttempt 1 of 2');
    await expect(first.locator('td').nth(1).locator('.fa-cellline')).toHaveText(POST_LAB);
    await expect(first.locator('td').nth(1).locator('.fa-cellsub')).toHaveText(
      'Question 4 · written answer',
    );
    await expect(first.locator('.xr-st--warn')).toHaveText('Waiting for marking');
    await expect(table(page).locator('tbody tr').nth(1).locator('td.fa-c-main')).toHaveText(
      'Priya NatarajanAttempt 1 of 2',
    );
    const assessment = page.getByRole('combobox', { name: 'Assessment' });
    await expect(assessment.locator('option')).toHaveText([
      'All assessments',
      `${POST_LAB} · ${SHELL_NAME}`,
    ]);
    await expect(page.getByRole('group', { name: 'Show' }).getByRole('button')).toHaveText([
      'Waiting2, 2',
      'Marked0, 0',
      'All2, 2',
    ]);
    await expectTableLayout(page);
    await checkState(page, 'Marking');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa18-queue');
    if (width(page) === 375) await shot(page, 'fa18-phone');

    // The filters, by real clicks; the address mirrors them.
    await reachAndClick(page, segment(page, 'Marked'));
    await expect(main(page).getByText('No confirmed marks here yet')).toBeVisible();
    await expect(page).toHaveURL(/\/faculty\/marking\?state=marked$/);
    await checkState(page, 'Marking');
    await reachAndClick(page, page.getByRole('button', { name: 'Show all written answers' }));
    await expect(page).toHaveURL(/\/faculty\/marking\?state=all$/);
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    await expect(page.getByRole('heading', { level: 2, name: 'Written answers' })).toBeFocused();
    await assessment.selectOption(assessmentId);
    await expect(page).toHaveURL(new RegExp(`assessmentId=${assessmentId}&state=all$`));
    await reachAndClick(page, segment(page, 'Waiting'));
    await expect(table(page).locator('tbody tr')).toHaveCount(2);

    // Mark next opens the oldest waiting answer, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Mark next' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('FA-19 Mark a submission', () => {
  test('as drawn, the validation, Save mark, Confirm marks → read-only, Next submission, the queue after', async ({
    page,
  }) => {
    const { rahul, priya } = await twoWaiting(page);
    const mark = await markDocument(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Mark Rahul Verma' }));
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
    await expectSameDocument(page, mark);

    // The head, the reading sheet, the guidance, the automatic marks, the panel.
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Marking' })).toHaveAttribute('href', QUEUE);
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText(
      `${POST_LAB} · ${SHELL_NAME}`,
    );
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      /^Waiting for marking\s*Submitted \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · attempt 1 of 2$/,
    );
    await expect(main(page).locator('.fa-qpos')).toHaveText('1 of 2 waiting · oldest first');
    await expect(
      page
        .getByRole('region', { name: 'Question 4 of 4 · Written answer' })
        .locator('.fa-sheetq-m'),
    ).toHaveText('10 marks');
    await expect(main(page).locator('.fa-answer')).toHaveText(RAHUL_WRITTEN);
    await expect(main(page).locator('.fa-guide-k')).toHaveText(
      'Marking guidance · only you see this',
    );
    const automatic = page.getByRole('region', { name: 'Marked automatically' });
    await expect(automatic.locator('.fa-autos-h b')).toHaveText('4 of 6 marks');
    await expect(automatic.locator('.fa-res')).toHaveText(['2 of 2', '0 of 2', '2 of 2']);
    await expect(panel(page).locator('.rk-panel-head h2')).toHaveText('Marks');
    await expect(panel(page).locator('.fa-ph-note')).toHaveText('16 marks in total');
    await expect(panel(page).locator('.fa-total b')).toHaveText('— of 16');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', QUEUE);
    await expectDecisionLayout(page, panel(page));
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa19-mark');
    if (width(page) === 375) await shot(page, 'fa19-phone');

    // Below 860 px “Go to the marks” moves focus to the panel.
    if (await main(page).locator('p.fa-gomark').isVisible()) {
      await reachAndClick(page, main(page).getByRole('link', { name: 'Go to the marks' }));
      await expect(page.locator('#ms-panel')).toBeFocused();
    }

    // 12 is out of range — the service’s words under the score, which takes focus.
    await markField(page).fill('12');
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Save mark' }));
    await expect(panel(page).locator('.rk-ferr')).toHaveText('Enter a whole number from 0 to 10');
    await expect(markField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(markField(page)).toBeFocused();
    await checkState(page, 'Rahul Verma');
    if (width(page) === 1440) await shot(page, 'fa19-invalid');

    // Save mark: “Mark saved — not confirmed yet” takes focus; the live total adds up.
    await markField(page).fill('');
    await markField(page).pressSequentially('7');
    await expect(panel(page).locator('.rk-ferr')).toHaveCount(0);
    await expect(panel(page).locator('.fa-total')).toContainText(
      '4 marked automatically + 7 written · pass mark 8',
    );
    await page.getByRole('textbox', { name: /^Feedback for Rahul/ }).fill(FEEDBACK);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Save mark' }));
    const saved = panel(page).locator('p.fa-savednote');
    await expect(saved).toHaveText('Mark saved — not confirmed yet');
    await expect(saved).toBeFocused();
    await checkState(page, 'Rahul Verma');
    if (width(page) === 1440) await shot(page, 'fa19-saved');

    // Confirm marks → the dialog → read-only.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const dialog = page.getByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-head p')).toHaveText(POST_LAB);
    await expect(dialog.locator('.rk-dlg-now li')).toHaveText([
      'Question 4 is marked 7 of 10.',
      'Rahul’s total becomes 11 of 16 marks — passed (pass mark 8).',
      'The marks become read-only. They can’t be changed after you confirm.',
    ]);
    await expect(dialog.locator('.rk-dlg-later h3')).toHaveText('When Rahul sees the result');
    await expect(dialog.locator('.rk-dlg-later li')).toHaveText(
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa19-confirm');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Confirm marks' }));
    await expect(dialog).toBeHidden();
    const done = page.locator('#ms-mdone');
    await expect(done).toBeFocused();
    await expect(done.locator('.rk-notice--ok .rk-notice-t')).toHaveText('Marks confirmed');
    await expect(done.locator('.rk-notice--ok')).toContainText('· Dr S. Ranganathan');
    await expect(done.locator('.fa-done-total')).toHaveText('11 of 16 marksPassed · pass mark 8');
    await expect(done.locator('dl dd')).toHaveText(['7 of 10', FEEDBACK]);
    await expect(done.locator('p.rk-locked')).toHaveText(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await expect(markField(page)).toHaveCount(0);
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa19-confirmed');

    // Next submission → Priya, in the same tab.
    const next = done.getByRole('link', { name: 'Next submission' });
    await expect(next).toHaveAttribute('href', `/faculty/marking/${priya}`);
    await expect(done.getByRole('link', { name: 'See submissions' })).toHaveAttribute(
      'href',
      /^\/faculty\/assessments\/ASMT-\d{4}\/submissions$/,
    );
    await reachAndClick(page, next);
    await expect(heading(page, 'Priya Natarajan')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.fa-answer')).toHaveText(PRIYA_WRITTEN);
    await expectSameDocument(page, mark);

    // The queue after marking Rahul (the breadcrumb).
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Marking' }),
    );
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 60_000 });
    await expect(count(page)).toHaveText('1 written answer waiting');
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expect(table(page).locator('tbody tr td.fa-c-main')).toHaveText(
      'Priya NatarajanAttempt 1 of 2',
    );
    await expectTableLayout(page);
    await checkState(page, 'Marking');
    // Under All, Rahul is Marked with View marks.
    await reachAndClick(page, segment(page, 'All'));
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    await expect(table(page).getByRole('link', { name: 'View marks for Rahul Verma' })).toHaveText(
      'View marks',
    );
    await expect(
      table(page).locator('tbody tr').first().locator('td.fa-c-st .fa-cellsub'),
    ).toHaveText(/^Confirmed \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
    await checkState(page, 'Marking');
    if (width(page) === 1440) await shot(page, 'fa18-all');
    await expectSameDocument(page, mark);
  });

  test('blank, Confirm marks: “Enter a mark for question 4” and no dialog', async ({ page }) => {
    const { rahul } = await twoWaiting(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Mark Rahul Verma' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    await expect(panel(page).locator('.rk-ferr')).toHaveText('Enter a mark for question 4');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(markField(page)).toBeFocused();
  });

  test('after Flow D: confirmed and released, read-only; nothing else waits', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto('/faculty/marking/ATT-0450');
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 90_000 });
    const done = page.locator('#ms-mdone');
    await expect(done.locator('.rk-notice--ok .rk-notice-t')).toHaveText('Marks confirmed');
    await expect(done).toContainText('7 Nov 2026, 10:15 · Dr S. Ranganathan');
    await expect(done.locator('p.fa-savednote')).toHaveText(
      'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
    );
    await expect(done.locator('.fa-done-acts p.fa-quiet')).toHaveText(
      'Nothing else is waiting for marking.',
    );
    await expect(done.getByRole('link', { name: 'Next submission' })).toHaveCount(0);
    await expect(markField(page)).toHaveCount(0);
    await expectDecisionLayout(page, panel(page));
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa19-released');

    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Marking' }),
    );
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 60_000 });
    await expect(count(page)).toHaveText('Nothing waiting');
    await expect(main(page).getByText('Nothing is waiting for you')).toBeVisible();
    await checkState(page, 'Marking');
    await reachAndClick(page, segment(page, 'Marked'));
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expect(table(page).locator('.xr-st--ok')).toHaveText('Marked');
  });
});

test.describe('FA-01 Overview — the priority band’s written answers (FA-v1 FA-01)', () => {
  test('two written answers to mark: one item, the students behind it, and “Mark now” opens the oldest submission (FA-19)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
    await page.goto('/faculty');
    await expect(main(page).locator('.rb-calm[role="status"]')).toContainText(
      'Nothing needs you right now',
      { timeout: 90_000 },
    );
    const band = page.getByRole('region', { name: 'Needs your attention' });
    await expect(band).toHaveCount(0);
    const assessmentId = await createPostLab(page);
    await givePriyaAccess(page);
    const oldest = await submit(page, RAHUL, assessmentId, RAHUL_WRITTEN);
    await submit(page, PRIYA, assessmentId, PRIYA_WRITTEN);
    const item = band.locator('li.rb-pi');
    await expect(item).toHaveCount(1);
    await expect(item.locator('.rb-pi-big')).toHaveText('2');
    await expect(item.locator('.rb-pi-rel')).toHaveText('Submitted today');
    await expect(item.locator('.rb-pi-kind')).toHaveText('Written answers to mark');
    await expect(item.locator('h3.rb-pi-title')).toHaveText('Heat Exchanger — post-lab');
    await expect(
      item.getByRole('list', { name: 'Waiting for marking, oldest first' }).locator('li b'),
    ).toHaveText(['Rahul Verma', 'Priya Natarajan']);
    const markNow = item.getByRole('link', {
      name: 'Mark now: Rahul Verma, Heat Exchanger — post-lab',
    });
    await expect(markNow).toHaveAttribute('href', `${QUEUE}/${oldest}`);
    await expect(markNow).toHaveClass(/rb-btn--primary/);
    await expect(main(page).getByRole('link', { name: /^Review drafts/ })).toHaveCount(0);
    expect(await main(page).innerText()).not.toMatch(/\b(?:ASMT|ATT|Q|D)-\d+/);
    await checkState(page, 'Overview');

    const mark = await markDocument(page);
    await reachAndClick(page, markNow);
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${oldest}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  // "Students inactive for 14 days" → "View students" (B4-01 f0) needs a Student inactive for 14
  // days: with no activity the days count from when the experiment was given (B4-10 f0; Phase 4B),
  // and no fixture world reaches 14 days while the browser seam cannot move the sample clock. The
  // row and its link are proven by `src/features/faculty/overview.test.tsx` (the clock moved).
});
