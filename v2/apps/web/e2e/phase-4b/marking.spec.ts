import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-18 Marking queue and FA-19 Mark a submission (board B4-09 f0 … f5, f7, f8), and the FA-01
 * Overview actions they make possible (B4-01 f0, f4), on the test-hook build at 1440, 1024, 768
 * and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets,
 * 24 × 24 targets, no developer surface, no sideways scroll). Worlds: after Flow C as Dr S.
 * Ranganathan — he creates “Heat Exchanger — post-lab” (the walk’s D1), Meera Iyer gives Priya
 * Natarajan the experiment and Rahul and Priya submit (the CI seam only SETS UP the world; the
 * stand-in marks their choice questions on submit). Everything the screens do — the filters,
 * “Mark next”, typing a mark, Save mark, Confirm marks through DL-1, “Next submission”, the
 * Overview’s “Mark now” and “View students” — is done by real clicks and typing. After Flow D,
 * the confirmed and released attempt; after Flow B, the inactive-students row.
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

/** After Flow C, on the queue: the assessment, Priya’s access and both answers submitted (f0). */
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
const count = (page: Page) => main(page).locator('.xr-phead-meta [role="status"]');
const table = (page: Page) => main(page).locator('table.xr-table');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your mark' });
const markField = (page: Page) => page.getByRole('textbox', { name: 'Mark for question 4' });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** Below 760 px of content the table’s rows stack and its header row is hidden (f4). */
async function expectTableLayout(page: Page): Promise<void> {
  const header = table(page).locator('thead');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (contentWidth < 760) {
    await expect
      .poll(() => header.evaluate((element) => getComputedStyle(element).position))
      .toBe('absolute');
  } else {
    await expect(header).toBeVisible();
  }
}

/** ~72 / 28 from 860 px of content; below, the marks panel moves under the answer (f7, f8). */
async function expectDecisionLayout(page: Page, beside: Locator): Promise<void> {
  const stack = await main(page).locator('.xr-decide > .xw-stack').boundingBox();
  const aside = await beside.boundingBox();
  if (!stack || !aside) throw new Error('not laid out');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (contentWidth >= 860) {
    expect(aside.x).toBeGreaterThan(stack.x + stack.width - 1);
    expect(aside.width / (stack.width + aside.width)).toBeLessThan(0.34);
  } else {
    expect(aside.y).toBeGreaterThan(stack.y + stack.height - 1);
  }
}

test.describe('FA-18 Marking queue', () => {
  test('nothing waiting (f5), then two answers (f0): filters, oldest first, Mark next', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
    await page.goto(QUEUE);
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 90_000 });
    // f5: no assessment, no answer yet.
    const empty = main(page).getByRole('heading', { level: 3, name: 'Nothing is waiting for you' });
    await expect(empty).toBeVisible();
    await expect(count(page)).toHaveText('0 written answers waiting');
    await expect(main(page)).toContainText(
      'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
    );
    await expect(main(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', QUEUE);
    await checkState(page, 'Marking');

    // The world moves: the assessment, Priya’s access, two submissions (f0).
    const assessmentId = await createPostLab(page);
    await givePriyaAccess(page);
    const rahul = await submit(page, RAHUL, assessmentId, RAHUL_WRITTEN);
    const priya = await submit(page, PRIYA, assessmentId, PRIYA_WRITTEN);
    await expect(count(page)).toHaveText('2 written answers waiting');
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    const first = table(page).locator('tbody tr').first();
    await expect(first.locator('td').first()).toHaveText(`Rahul Verma${rahul}`);
    await expect(first.locator('td').nth(1)).toHaveText(`${POST_LAB}Question 4 · written answer`);
    await expect(first.locator('.xr-status--wait')).toHaveText('Waiting for marking');
    await expect(table(page).locator('tbody tr').nth(1).locator('td').first()).toHaveText(
      `Priya Natarajan${priya}`,
    );
    const assessment = page.getByRole('combobox', { name: 'Assessment' });
    await expect(assessment.locator('option')).toHaveText([
      'All assessments',
      `${POST_LAB} · ${SHELL_NAME}`,
    ]);
    await expectTableLayout(page);
    await checkState(page, 'Marking');
    if (width(page) === 1440) await shot(page, 'f0-queue');

    // The filters, by real clicks; the address mirrors them.
    await reachAndClick(page, page.getByRole('button', { name: 'Marked' }));
    await expect(main(page).getByText('Nothing matches these filters.')).toBeVisible();
    await expect(page).toHaveURL(/\/faculty\/marking\?state=marked$/);
    await reachAndClick(page, page.getByRole('button', { name: 'All' }));
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    await assessment.selectOption(assessmentId);
    await expect(page).toHaveURL(new RegExp(`assessmentId=${assessmentId}&state=all$`));
    await reachAndClick(page, page.getByRole('button', { name: 'Waiting' }));
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
  test('as drawn (f1, f7, f8), the drawn validation (f3), Confirm marks → read-only (f2), Next submission, the queue after (f4)', async ({
    page,
  }) => {
    const { rahul, priya } = await twoWaiting(page);
    const mark = await markDocument(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Mark Rahul Verma' }));
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
    await expectSameDocument(page, mark);

    // f1: the header, the question, the answer, the guidance, the automatic marks, the panel.
    await expect(main(page).locator('a.xr-back')).toHaveText('Marking');
    await expect(main(page).locator('.xr-overline')).toHaveText(`${POST_LAB} · ${SHELL_NAME}`);
    await expect(main(page).locator('.xr-phead-meta .xr-id')).toHaveText(rahul);
    await expect(main(page).locator('.xr-phead-meta .xl-meta')).toHaveText(
      /^Submitted \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · attempt 1 of 2$/,
    );
    await expect(page.getByRole('region', { name: 'Question 4 · Written answer' })).toContainText(
      '10 marks',
    );
    await expect(main(page).locator('blockquote.xa-answer')).toHaveText(RAHUL_WRITTEN);
    await expect(main(page).locator('details.xa-guide')).toHaveAttribute('open', '');
    const automatic = page.getByRole('region', { name: 'Marked automatically' });
    await expect(automatic.locator('.xr-section-head .xr-meta')).toHaveText('4 of 6 marks');
    await expect(automatic.locator('.xa-mk')).toHaveText(['2 of 2', '0 of 2', '2 of 2']);
    await expect(panel(page).locator('.xr-dpanel-title')).toHaveText('Your mark');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', QUEUE);
    if (width(page) < 1024) {
      await expect(page.locator('.xr-top-title')).toHaveText('Mark a submission');
    } else {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Marking\s*\/\s*Rahul Verma/,
      );
    }
    await expectDecisionLayout(page, panel(page));
    await checkState(page, 'Rahul Verma');
    if (width(page) === 1440) await shot(page, 'f1-mark');
    if (width(page) === 768) await shot(page, 'f7-mark');
    if (width(page) === 375) await shot(page, 'f8-mark');

    // The guidance collapses in place.
    await reachAndClick(page, main(page).locator('details.xa-guide > summary'));
    await expect(main(page).locator('details.xa-guide')).not.toHaveAttribute('open', '');
    await reachAndClick(page, main(page).locator('details.xa-guide > summary'));
    await expect(main(page).locator('details.xa-guide')).toHaveAttribute('open', '');

    // f3: 12 is out of range — the service’s words under the field, which takes focus.
    await markField(page).fill('12');
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Save mark' }));
    await expect(panel(page).locator('.xr-error')).toHaveText('Enter a whole number from 0 to 10');
    await expect(markField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(markField(page)).toBeFocused();
    await checkState(page, 'Rahul Verma');
    if (width(page) === 768) {
      await page.setViewportSize({ width: 720, height: 1024 });
      await shot(page, 'f3-validation');
      await page.setViewportSize({ width: 768, height: 1024 });
    }

    // Save mark: “Mark saved — not confirmed yet”.
    await markField(page).fill('');
    await markField(page).pressSequentially('7');
    await expect(panel(page).locator('.xr-error')).toHaveCount(0);
    await page.getByRole('textbox', { name: /^Feedback for Rahul/ }).fill(FEEDBACK);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Save mark' }));
    await expect(panel(page).locator('p.xa-save.is-ok')).toHaveText(
      'Mark saved — not confirmed yet',
    );

    // Confirm marks → DL-1 → read-only (f2).
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    const dialog = page.getByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body p')).toHaveText([
      'Question 4: 7 of 10.',
      'Confirmed marks can’t be changed. Rahul sees the result when it’s released — after the deadline, 14 Nov 2026, 23:59.',
    ]);
    await expect(dialog.getByRole('button', { name: 'Confirm marks' })).toBeFocused();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Confirm marks' }));
    await expect(dialog).toBeHidden();
    const done = page.locator('#ms-mdone');
    await expect(done).toBeFocused();
    await expect(done.locator('.xr-status--ok')).toHaveText('Marks confirmed');
    await expect(done).toContainText('· Dr S. Ranganathan');
    await expect(done.locator('dl dd')).toHaveText(['7 of 10', FEEDBACK]);
    await expect(done).toContainText(
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await expect(markField(page)).toHaveCount(0);
    await checkState(page, 'Rahul Verma');
    if (width(page) === 768) {
      await page.setViewportSize({ width: 720, height: 1024 });
      await shot(page, 'f2-confirmed');
      await page.setViewportSize({ width: 768, height: 1024 });
    }

    // Next submission → Priya, in the same tab.
    const next = done.getByRole('link', { name: 'Next submission' });
    await expect(next).toHaveAttribute('href', `/faculty/marking/${priya}`);
    await reachAndClick(page, next);
    await expect(heading(page, 'Priya Natarajan')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('blockquote.xa-answer')).toHaveText(PRIYA_WRITTEN);
    await expectSameDocument(page, mark);

    // f4: the queue after marking Rahul (the back link).
    await reachAndClick(page, main(page).locator('a.xr-back'));
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 60_000 });
    await expect(count(page)).toHaveText('1 written answer waiting');
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expect(table(page).locator('tbody tr td').first()).toHaveText(`Priya Natarajan${priya}`);
    await expectTableLayout(page);
    await checkState(page, 'Marking');
    if (width(page) === 768) {
      await page.setViewportSize({ width: 720, height: 1024 });
      await shot(page, 'f4-queue-after');
      await page.setViewportSize({ width: 768, height: 1024 });
    }
    // Under All, Rahul is Marked with View.
    await reachAndClick(page, page.getByRole('button', { name: 'All' }));
    await expect(table(page).locator('tbody tr')).toHaveCount(2);
    await expect(table(page).getByRole('link', { name: 'View marks for Rahul Verma' })).toHaveText(
      'View',
    );
    await expectSameDocument(page, mark);
  });

  test('blank, Confirm marks: “Enter a mark for question 4” and no dialog', async ({ page }) => {
    const { rahul } = await twoWaiting(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Mark Rahul Verma' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Confirm marks' }));
    await expect(panel(page).locator('.xr-error')).toHaveText('Enter a mark for question 4');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(markField(page)).toBeFocused();
  });

  test('after Flow D: confirmed and released, read-only; nothing waiting', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto('/faculty/marking/ATT-0450');
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 90_000 });
    const done = page.locator('#ms-mdone');
    await expect(done.locator('.xr-status--ok')).toHaveText('Marks confirmed');
    await expect(done).toContainText('7 Nov 2026, 10:15 · Dr S. Ranganathan');
    await expect(done).toContainText(
      'Released to Rahul on 14 Nov 2026, 23:59 — when the deadline passed.',
    );
    await expect(done.getByRole('link', { name: 'Next submission' })).toHaveAttribute(
      'href',
      QUEUE,
    );
    await expect(markField(page)).toHaveCount(0);
    await expectDecisionLayout(page, panel(page));
    await checkState(page, 'Rahul Verma');

    await reachAndClick(page, done.getByRole('link', { name: 'Next submission' }));
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 60_000 });
    await expect(count(page)).toHaveText('0 written answers waiting');
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Nothing is waiting for you' }),
    ).toBeVisible();
    await checkState(page, 'Marking');
    if (width(page) === 768) {
      await page.setViewportSize({ width: 720, height: 1024 });
      await shot(page, 'f5-nothing-waiting');
      await page.setViewportSize({ width: 768, height: 1024 });
    }
    await reachAndClick(page, page.getByRole('button', { name: 'Marked' }));
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expect(table(page).locator('.xr-status--ok')).toHaveText('Marked');
  });
});

test.describe('FA-01 Overview — the Phase-4B actions (B4-01 f0, f4)', () => {
  test('a written answer to mark: “Mark 1 written answer” and “Mark now” open Marking', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
    await page.goto('/faculty');
    const attention = page.getByRole('region', { name: 'Needs your attention' });
    await expect(attention).toContainText('Nothing needs you right now.', { timeout: 90_000 });
    await expect(main(page).locator('.xr-phead-actions')).toHaveCount(0);
    const assessmentId = await createPostLab(page);
    await submit(page, RAHUL, assessmentId, RAHUL_WRITTEN);
    const row = attention.locator('li.xr-row');
    await expect(row).toHaveCount(1);
    await expect(row.locator('.xr-row-title')).toHaveText('1 written answer to mark');
    await expect(row.locator('.xr-row-sub')).toHaveText(
      /^Heat Exchanger — post-lab · from Rahul Verma, \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    const primary = main(page).locator('.xr-phead-actions a.xr-btn--primary');
    await expect(primary).toHaveText('Mark 1 written answer');
    await expect(primary).toHaveAttribute('href', QUEUE);
    const markNow = row.getByRole('link', { name: 'Mark now' });
    await expect(markNow).toHaveAttribute('href', `${QUEUE}?assessmentId=${assessmentId}`);
    await expect(main(page).getByRole('link', { name: 'Review drafts' })).toHaveCount(0);
    await checkState(page, 'Overview');
    if (width(page) === 1440) await shot(page, 'b4-01-f0-overview');
    if (width(page) === 375) await shot(page, 'b4-01-f4-overview');

    const mark = await markDocument(page);
    await reachAndClick(page, markNow);
    await expect(page).toHaveURL(new RegExp(`/faculty/marking\\?assessmentId=${assessmentId}$`));
    await expect(heading(page, 'Marking')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('combobox', { name: 'Assessment' })).toHaveValue(assessmentId);
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expectSameDocument(page, mark);
  });

  // "Students inactive for 14 days" → "View students" (B4-01 f0) needs a Student inactive for 14
  // days: with no activity the days count from when the experiment was given (B4-10 f0; Phase 4B),
  // and no fixture world reaches 14 days while the browser seam cannot move the sample clock. The
  // row and its link are proven by `src/features/faculty/overview.test.tsx` (the clock moved).
});
