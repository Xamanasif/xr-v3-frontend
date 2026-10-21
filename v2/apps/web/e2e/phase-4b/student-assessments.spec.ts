import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * ST-11 Assessments (board B4-11 f0 … f6), the experiment hub's Assessment tab (f7 … f9) and Home's
 * "Up next" assessment row (f10), on the test-hook build at 1440, 1024, 768 and 375, as Rahul
 * Verma. After Flow C (27 Oct) there is no assessment (f5, f8); Dr S. Ranganathan then creates
 * ASMT-0009 through his own port (the walk's D1) — To do (f0, f6, f7, f10); Rahul's attempt is
 * started, answered and submitted through his own port (D2: in progress f1, waiting f2, f9); the
 * Faculty member marks and confirms (D3: not released yet, f3); after Flow D the result is
 * released (f4). Those set-ups go through `actAs` (the CI seam); the screens' own interactions —
 * the state tabs, the row actions, the hub's tab strip, Home's "Open assessment" — are real
 * clicks. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24
 * targets, no developer surface, no sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The shared dev server compiles a route on its first visit.
test.describe.configure({ timeout: 240_000 });

const RAHUL = { personId: 'per-0002' };
const RANGANATHAN = { personId: 'per-0014' };
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const LIST = '/student/assessments';
const HUB = `/student/experiments/${SHELL}`;
const TAB = `${HUB}/assessment`;
/** The course code Rahul sees on these worlds (the platform's; B4-11 draws the institution's). */
const CODE = 'MEC-523';
const FIRST_LOAD = { timeout: 120_000 };

const main = (page: Page) => page.locator('main');
/** ST-11's state tabs (`nav.rk-tabs.sv-tabs` "Assessments") and the card named by the tab. */
const stateTabs = (page: Page) =>
  page.getByRole('navigation', { name: 'Assessments', exact: true }).getByRole('link');
/** The tabs' counts, read as ", N" after each tab's words. */
async function expectTabs(page: Page, counts: readonly [number, number, number]): Promise<void> {
  const words = ['To do', 'Submitted', 'Results'];
  for (const [index, count] of counts.entries())
    // The engine may read a space before the hidden ", N" (the export's own markup).
    await expect(stateTabs(page).nth(index)).toHaveAccessibleName(
      new RegExp(`^${words[index]} ?, ${count}$`),
    );
}
const card = (page: Page, tab: string) => page.getByRole('region', { name: tab, exact: true });
const rows = (page: Page, tab = 'To do') => card(page, tab).locator('ul.sv-list > li.sv-ali');
/** The hub's section tabs (the hub's own nav, whatever it is named): the one with "Overview". */
const hubTabs = (page: Page) =>
  main(page)
    .getByRole('navigation')
    .filter({ has: page.getByRole('link', { name: 'Overview', exact: true }) });
/** The hub tab's assessment card (`section.sv-card.sv-atab`), named by the assessment. */
const assessmentCard = (page: Page) => page.getByRole('region', { name: NAME, exact: true });
/** No assessment, attempt or record id in any word, name or the tab title (decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;

async function expectNoReference(page: Page): Promise<void> {
  expect(await page.locator('body').innerText()).not.toMatch(REFERENCE);
  const names = await page
    .locator('[aria-label]')
    .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RAHUL });
  await page.goto(path);
}

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

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

/** D1: Dr S. Ranganathan creates ASMT-0009 (after the deadline, four questions). */
async function created(page: Page): Promise<void> {
  const assessment = await port<{ readonly id: string }>(
    page,
    RANGANATHAN,
    'assessments',
    'createAssessment',
    {
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
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    },
  );
  expect(assessment.id).toBe(ASMT);
}

interface AttemptRecord {
  readonly id: string;
  readonly rev: number;
}

/** D2: Rahul starts the attempt through his own port. */
async function started(page: Page): Promise<AttemptRecord> {
  return port<AttemptRecord>(page, RAHUL, 'assessments', 'startAttempt', ASMT);
}

/** D2: Rahul answers the four questions and submits. */
async function submitted(page: Page): Promise<string> {
  let attempt = await started(page);
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: 'Fouling adds a resistance, so U falls.' }],
  ] as const) {
    attempt = await port<AttemptRecord>(page, RAHUL, 'assessments', 'saveAnswer', {
      attemptId: attempt.id,
      questionId,
      answer,
      expectedRev: attempt.rev,
    });
  }
  await port(page, RAHUL, 'assessments', 'submitAttempt', {
    attemptId: attempt.id,
    expectedRev: attempt.rev,
  });
  return attempt.id;
}

/** D3: Dr Ranganathan marks the written answer and confirms the marks. */
async function confirmed(page: Page, attemptId: string): Promise<void> {
  const view = await port<{ readonly attempt: AttemptRecord }>(
    page,
    RANGANATHAN,
    'marking',
    'getAttemptForMarking',
    attemptId,
  );
  const saved = await port<AttemptRecord>(page, RANGANATHAN, 'marking', 'saveMark', {
    attemptId,
    questionId: 'Q-0106',
    mark: '7',
    feedback: 'Clear explanation of fouling.',
    expectedRev: view.attempt.rev,
  });
  await port(page, RANGANATHAN, 'marking', 'confirmMarks', {
    attemptId,
    expectedRev: saved.rev,
  });
}

/** A row's parts, as the V3 export lays them out (`li.sv-li.sv-ali`). */
async function expectRow(
  row: Locator,
  parts: {
    readonly kicker: string;
    readonly when: string | RegExp;
    readonly line: string | RegExp;
    readonly status: string;
    readonly tone: RegExp;
    readonly action: string;
    readonly href: string;
    readonly primary: boolean;
  },
): Promise<void> {
  await expect(row.locator('.sv-ali-when .sv-eyebrow')).toHaveText(parts.kicker);
  await expect(row.locator('.sv-when')).toHaveText(parts.when);
  await expect(row.locator('.sv-li-k')).toHaveText(`${SHELL_NAME} · ${CODE}`);
  await expect(row.locator('h3.sv-li-t')).toHaveText(NAME);
  await expect(row.locator('.sv-li-m .xr-st')).toHaveText(parts.status);
  await expect(row.locator('.sv-li-m .xr-st')).toHaveClass(parts.tone);
  await expect(row.locator('.sv-li-m > span').last()).toHaveText(parts.line);
  const link = row.getByRole('link', { name: `${parts.action}, ${NAME}` });
  await expect(link).toHaveText(parts.action);
  await expect(link).toHaveAttribute('href', parts.href);
  await expect(link).toHaveClass(parts.primary ? /rb-btn--primary/ : /^rb-btn$/);
}

test.describe('ST-11 Assessments', () => {
  test('none yet (after Flow C): “No assessments yet” with Rahul’s experiments, Assessments current', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    const empty = page.getByRole('region', { name: 'No assessments yet' });
    await expect(empty).toBeVisible(FIRST_LOAD);
    await expect(empty).toContainText(
      'When your faculty sets an assessment for an experiment you have, it appears here.',
    );
    await expect(
      empty.getByRole('list', { name: 'Your experiments' }).locator('li').filter({
        hasText: SHELL_NAME,
      }),
    ).toContainText('No assessment set yet');
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Assessments for the experiments you have',
    );
    await expect(page.getByRole('navigation', { name: 'Assessments', exact: true })).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await checkState(page, 'Assessments');
    await expectNoReference(page);
  });

  test('to do (D1): the row, the state tabs in the address, "Open" → Before you start', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('region', { name: 'No assessments yet' })).toBeVisible(FIRST_LOAD);
    await created(page);
    await expect(rows(page)).toHaveCount(1);
    await expectTabs(page, [1, 0, 0]);
    await expect(stateTabs(page).first()).toHaveAttribute('aria-current', 'page');
    await expectRow(rows(page).first(), {
      kicker: 'Due',
      when: '14 Nov23:59 · in 18 days',
      line: '4 questions · 16 marks · no time limit',
      status: 'To do',
      tone: /xr-st--info/,
      action: 'Open',
      href: `${LIST}/${ASMT}`,
      primary: true,
    });
    await checkState(page, 'Assessments');
    await expectNoReference(page);

    // The state tabs switch the list in place; the address keeps the tab (replaced).
    await reachAndClick(page, stateTabs(page).nth(1));
    await page.waitForURL(`**${LIST}?tab=submitted`);
    await expect(stateTabs(page).nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(rows(page, 'Submitted')).toHaveCount(0);
    await expect(card(page, 'Submitted').locator('.sv-pstate')).toContainText(
      'Nothing submitted and waiting.',
    );
    await expect(card(page, 'Submitted').locator('.sv-pstate')).toContainText(
      'Your assessment is under To do.',
    );
    await checkState(page, 'Assessments');
    await reachAndClick(page, stateTabs(page).nth(2));
    await page.waitForURL(`**${LIST}?tab=results`);
    await expect(card(page, 'Results').locator('.sv-pstate')).toContainText(
      'No results released yet.',
    );
    await reachAndClick(page, stateTabs(page).nth(0));
    await page.waitForURL((url) => url.pathname === LIST && url.search === '');
    await expect(rows(page)).toHaveCount(1);

    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `Open, ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });

  test('attempt in progress (D2): "Your answers are saved", "Continue attempt" → the attempt', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    await started(page);
    await expect(rows(page).first().locator('.sv-li-m .xr-st')).toHaveText('Attempt in progress');
    await expectTabs(page, [1, 0, 0]);
    await expectRow(rows(page).first(), {
      kicker: 'Due',
      when: '14 Nov23:59 · in 18 days',
      line: 'Your answers are saved · no time limit',
      status: 'Attempt in progress',
      tone: /xr-st--warn/,
      action: 'Continue attempt',
      href: `${LIST}/${ASMT}/attempt`,
      primary: true,
    });
    await checkState(page, 'Assessments');
    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `Continue attempt, ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/attempt`, FIRST_LOAD);
  });

  test('waiting for marking, then not released yet (D2, D3): the Submitted tab, "View"', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${LIST}?tab=submitted`);
    await expect(page.getByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    const attemptId = await submitted(page);
    await expect(rows(page, 'Submitted')).toHaveCount(1);
    await expectTabs(page, [0, 1, 0]);
    await expect(stateTabs(page).nth(1)).toHaveAttribute('aria-current', 'page');
    await expectRow(rows(page, 'Submitted').first(), {
      kicker: 'Result after',
      when: '14 Nov23:59 · in 18 days',
      // The sample clock runs from the world's 27 Oct 10:00 while the page is open.
      line: /^Submitted 27\sOct\s2026,\s10:0\d · your faculty marks written answers$/,
      status: 'Waiting for marking',
      tone: /xr-st--warn/,
      action: 'View',
      href: `${LIST}/${ASMT}/result`,
      primary: false,
    });
    await checkState(page, 'Assessments');

    await confirmed(page, attemptId);
    await expect(rows(page, 'Submitted').first().locator('.sv-li-m .xr-st')).toHaveText(
      'Result not released yet',
    );
    await expectRow(rows(page, 'Submitted').first(), {
      kicker: 'Result after',
      when: '14 Nov23:59 · in 18 days',
      line: 'Marked · released after the deadline',
      status: 'Result not released yet',
      tone: /^xr-st$/,
      action: 'View',
      href: `${LIST}/${ASMT}/result`,
      primary: false,
    });
    // Confirmed marks, still no figure before the release.
    await expect(main(page)).not.toContainText(/of 16|Passed/);
    await checkState(page, 'Assessments');
    await reachAndClick(
      page,
      rows(page, 'Submitted')
        .first()
        .getByRole('link', { name: `View, ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });

  test('result ready (after Flow D): the Results tab, "Released", "See result" → the result', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', `${LIST}?tab=results`);
    await expect(rows(page, 'Results')).toHaveCount(1, FIRST_LOAD);
    await expectTabs(page, [0, 0, 1]);
    await expectRow(rows(page, 'Results').first(), {
      kicker: 'Released',
      when: /^14 Nov23:59 · /,
      line: 'Your result and answers are ready',
      status: 'Result ready',
      tone: /xr-st--ok/,
      action: 'See result',
      href: `${LIST}/${ASMT}/result`,
      primary: false,
    });
    await checkState(page, 'Assessments');
    await expectNoReference(page);
    await reachAndClick(
      page,
      rows(page, 'Results')
        .first()
        .getByRole('link', { name: `See result, ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });
});

test.describe('the hub’s Assessment tab', () => {
  test('none set yet, then to do: the compact message, the card and "Open assessment"', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${HUB}/progress`);
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible(FIRST_LOAD);
    // The hub's tabs list the Assessment tab; it opens the tab.
    await expect(hubTabs(page).getByRole('link')).toHaveText([
      'Overview',
      'Resources',
      'Simulation',
      'Assessment',
      'Progress',
    ]);
    const tab = hubTabs(page).getByRole('link', { name: 'Assessment', exact: true });
    await tab.scrollIntoViewIfNeeded();
    await reachAndClick(page, tab);
    await page.waitForURL(`**${TAB}`, FIRST_LOAD);
    await expect(hubTabs(page).locator('[aria-current="page"]')).toHaveText('Assessment');
    const empty = page.getByRole('region', {
      name: 'Your faculty hasn’t set an assessment for this experiment yet',
    });
    await expect(empty).toBeVisible(FIRST_LOAD);
    await expect(empty).toContainText('When they do, it appears here and in Assessments.');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, SHELL_NAME);

    await created(page);
    const section = assessmentCard(page);
    await expect(section).toHaveCount(1);
    await expect(section.locator('.sv-atab-when .sv-eyebrow')).toHaveText('Due');
    await expect(section.locator('.sv-when')).toHaveText('14 Nov23:59 · in 18 days');
    await expect(section.locator('.sv-atab-f')).toHaveText(
      '4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit',
    );
    await expect(section.locator('.sv-li-m .xr-st')).toHaveText('To do');
    const openAssessment = section.getByRole('link', { name: `Open assessment, ${NAME}` });
    await expect(openAssessment).toHaveClass(/rb-btn--primary/);
    await checkState(page, SHELL_NAME);
    await expectNoReference(page);
    await reachAndClick(page, openAssessment);
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });

  test('waiting for marking: "Submitted … · your faculty marks written answers", "View" → the result', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', TAB);
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible(FIRST_LOAD);
    await created(page);
    await submitted(page);
    const section = assessmentCard(page);
    await expect(section.locator('.sv-li-m .xr-st')).toHaveText('Waiting for marking');
    await expect(section.locator('.sv-atab-when .sv-eyebrow')).toHaveText('Deadline');
    await expect(section.locator('.sv-li-m > span').last()).toHaveText(
      /^Submitted 27\sOct\s2026,\s10:0\d · your faculty marks written answers$/,
    );
    const view = section.getByRole('link', { name: `View, ${NAME}` });
    await expect(view).toHaveClass(/^rb-btn$/);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, view);
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });
});

test.describe('Home · Up next', () => {
  test('the assessment to do, named; "Open assessment" → Before you start (f10)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', '/student');
    await expect(page.getByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    // V3 (ST-v1 `nextStep` "asmt-todo"): the cover's one next step names it and its deadline.
    const step = page
      .getByRole('region', { name: 'Continue learning' })
      .locator('.sv-step.is-next');
    await expect(step.locator('.sv-step-t')).toHaveText('Start the assessment');
    await expect(step.locator('.sv-step-d')).toHaveText(
      'Heat Exchanger — post-lab is due 14 Nov 2026, 23:59.',
    );
    await checkState(page, 'Hello, Rahul');
    await reachAndClick(page, step.getByRole('link', { name: `Open assessment, ${SHELL_NAME}` }));
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });
});
