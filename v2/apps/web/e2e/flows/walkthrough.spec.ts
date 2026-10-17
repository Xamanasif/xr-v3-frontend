import { expect, type Locator, type Page, test } from '@playwright/test';

import { addShellAndTube, fillDetails, panelOf, shown, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  ACCOUNT,
  addRahulWithShell,
  allContent,
  approveRequestExternal,
  assignMeera,
  button,
  catalogue,
  choose,
  COMPOSITE,
  decision,
  EMAIL,
  h1,
  main,
  myDevice,
  openPublished,
  openUpdateDecision,
  region,
  retype,
  sendForReview,
  SHELL,
  SHELL_ID,
  sidebar,
  signIn,
  signOut,
  stubExampleLinks,
  THERMO,
  type,
} from './product';
import { stepTitle } from './registry';

/**
 * Phase 7 — Flows A–F and the device chain on ONE shared sample world, through the screens of the
 * PRODUCT build (no test hook, boot descriptor or fixture), in the order the walk-through tells it:
 * A → B → C → Device → D → E → F. Every flows.json step is one `test.step`, named from the register
 * (`registry.ts`), and asserts the role-relative words the frozen boards draw for it
 * (`src/copy/flow-words.fixture.ts`) wherever the product build reaches them.
 *
 * Three tabs of one browser share the world (TE-6, owner authorisation of Phase 7: the world is kept
 * in this browser), each with its own session — nothing signs a person in another tab:
 *  - `visitor` — the institution contact, never signed in: the catalogue, the request, its status
 *    page (the request ticket stays with this tab), the payment step, later the public pages;
 *  - `admin` — Arjun Mehta, Super Admin, signed in from A3 to the end;
 *  - `desk` — the people of the institution and of production, signing in and out in turn.
 * A change made in one tab reaches the others when the tab reads again (a storage event adopts the
 * newer world; the next read shows it).
 *
 * The local prototype build's authorised stand-ins are used as the product uses them: the sample
 * payment confirmation (TE-4), the answer-key marking of choice questions (P4-01), the drawn-default
 * routing of a resubmission (M-3), the sample WEB activity whose own completion is the system-recorded
 * WEB completion (TE-3 / T-12) and the pre-authorised sample VR headset (P3-03). Not reachable on
 * the product build, and asserted on the test-hook build instead (their specs are named in the
 * Phase-7 record): "Under review" (AD-14, a test-only review start), "Result not released yet"
 * (needs the sample clock), and VR completion and feedback (no headset runtime).
 *
 * Every address is reached by a link or a button, except the marked TEST NAVIGATION: a public
 * experiment address typed into the visitor's tab before it exists (E5).
 */
test.skip(
  ({ viewport }) => viewport?.width !== 1440,
  'One long walk-through: the screens are proved at every width by their own phase suites.',
);
// Each move fails within seconds when its page does not come (the walk's own timeout is long).
test.use({ navigationTimeout: 20_000, actionTimeout: 20_000 });

const RAHUL_ANSWER =
  'Fouling adds a thermal resistance on the tube surfaces, so U falls and the outlet temperatures move closer to the inlets.';
const FEEDBACK = 'Good use of your own readings and the right cause.';
const ASSESSMENT = 'Heat Exchanger — post-lab';
const Q1 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q1_RIGHT = 'The actual heat transfer with the largest heat transfer possible';
const Q1_WRONG = 'The hot-side flow rate with the cold-side flow rate';
const Q3 = 'Explain how fouling changes the overall heat transfer coefficient.';
const RELEASED_NAME = 'Shell-and-Tube Heat Exchanger Performance';
const RELEASED_SUMMARY =
  'Run counter-flow and parallel-flow tests and find the overall heat-transfer coefficient from your own readings.';
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';
const RETURN_REASON = 'Please name the VR headsets it runs on.';
const REVISED_DEVICE = 'Meta Quest 3 standalone headset — no PC needed.';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

/** The hub's tab strip (B3-01 `nav.xw-hubtabs`). */
async function hubTab(page: Page, name: string): Promise<void> {
  const tab = page
    .getByRole('navigation', { name: SHELL })
    .getByRole('link', { name, exact: true });
  await tab.scrollIntoViewIfNeeded();
  await reachAndClick(page, tab);
}

/** The assessment record's tab strip. */
async function recordTab(page: Page, name: RegExp): Promise<void> {
  const tab = page.getByRole('navigation', { name: ASSESSMENT }).getByRole('link', { name });
  await tab.scrollIntoViewIfNeeded();
  await reachAndClick(page, tab);
}

/** Signs a person in on a tab that shows the signed-out card. */
async function as(page: Page, email: string, home: string): Promise<void> {
  await signIn(page, email);
  await page.waitForURL((url) => url.pathname === home);
}

/** The Super Admin's tab reads again at a sidebar destination (its answers follow the shared world). */
async function adminAt(admin: Page, href: string): Promise<void> {
  await admin.bringToFront();
  await sidebar(admin, href);
}

/** A row of a table or list in `main` holding `text`. */
const rowWith = (page: Page, text: string | RegExp): Locator =>
  main(page).locator('tbody tr, li.xr-row').filter({ hasText: text });

test('Flows A–F and the device chain on one shared sample world, through the product build’s screens', async ({
  context,
  page: visitor,
}) => {
  test.setTimeout(1_800_000);
  await stubExampleLinks(visitor);
  await visitor.goto('/');
  let address = '';

  await test.step(stepTitle('A1'), async () => {
    await catalogue(visitor);
    await reachAndClick(visitor, main(visitor).getByRole('link', { name: SHELL, exact: true }));
    await visitor.waitForURL(`**/experiments/${SHELL_ID}`);
    await expect(h1(visitor)).toHaveText(SHELL);
    await addShellAndTube(visitor);
    await reachAndClick(visitor, panelOf(visitor).getByRole('link', { name: 'Go to selection' }));
    await visitor.waitForURL('**/selection');
    await checkState(visitor, 'Your selection');
  });

  await test.step(stepTitle('A2'), async () => {
    await reachAndClick(visitor, shown(visitor.getByRole('link', { name: 'Continue to request' })));
    await visitor.waitForURL('**/request-access');
    await fillDetails(visitor);
    await reachAndClick(visitor, visitor.getByRole('button', { name: 'Review request' }));
    await visitor.waitForURL('**/request-access?step=review');
    await reachAndClick(visitor, visitor.getByRole('button', { name: 'Submit request' }));
    await visitor.waitForURL('**/request-access/sent');
    await checkState(visitor, 'Request sent');
    await expect(main(visitor)).toContainText('Your reference is REQ-0042.');
    address = (await visitor
      .getByRole('link', { name: 'Check request status' })
      .getAttribute('href'))!;
    await reachAndClick(visitor, visitor.getByRole('link', { name: 'Check request status' }));
    await visitor.waitForURL(`**${address}`);
    await expect(statusHead(visitor)).toContainText('Submitted');
  });

  // The Super Admin's own tab: a new page of the same browser starts from the kept world (TE-6).
  const admin = await context.newPage();
  await test.step(stepTitle('A3'), async () => {
    await admin.goto('/sign-in');
    await as(admin, EMAIL.arjun, '/admin');
    await expect(main(admin)).toContainText('REQ-0042');
    await approveRequestExternal(admin);
    await checkState(admin, 'Godavari Institute of Technology');
    // The requester's open status page follows the decision made in the other tab.
    await visitor.bringToFront();
    await expect(statusHead(visitor)).toContainText('Approved — payment required');
    await expect(
      statusHead(visitor).getByRole('link', { name: 'Continue to payment' }),
    ).toBeVisible();
  });

  await test.step(stepTitle('A4'), async () => {
    await reachAndClick(
      visitor,
      statusHead(visitor).getByRole('link', { name: 'Continue to payment' }),
    );
    await visitor.waitForURL(`**${address}/payment`);
    await checkState(visitor, 'Pay for access');
    await reachAndClick(visitor, visitor.getByRole('button', { name: 'Continue to payment' }));
    await visitor.waitForURL(`**${address}`);
    await expect(statusHead(visitor)).toContainText('Access active');
    await expect(statusHead(visitor)).toContainText('Access plan ACC-0107');
    await expect(main(visitor).getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
    await adminAt(admin, '/admin/institutions');
    await reachAndClick(
      admin,
      admin.getByRole('link', { name: 'Open Godavari Institute of Technology' }),
    );
    await admin.waitForURL('**/admin/institutions/godavari');
    await expect(main(admin)).toContainText('Access active');
  });

  const desk = await context.newPage();
  await test.step(stepTitle('B1'), async () => {
    await assignMeera(admin);
    await desk.goto('/sign-in');
    await as(desk, EMAIL.meera, '/institute');
    await expect(main(desk).locator('.xw-statusline')).toContainText('Access active');
    await checkState(desk, 'Overview');
  });

  await test.step(stepTitle('B2'), async () => {
    await sidebar(desk, '/institute/content-access');
    await expect(main(desk)).toContainText('Access plan ACC-0107');
    await expect(main(desk)).toContainText('Active');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'View access plan ACC-0107' }));
    await desk.waitForURL('**/institute/content-access/plans/ACC-0107');
    await expect(main(desk)).toContainText('Active');
    await checkState(desk, 'Access plan ACC-0107');
  });

  await test.step(stepTitle('B3'), async () => {
    await addRahulWithShell(desk);
    await expect(desk.getByRole('list', { name: 'Access given' })).toContainText(SHELL);
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'View Student access' }));
    await desk.waitForURL((url) => url.pathname === '/institute/student-access');
    await expect(rowWith(desk, 'Rahul Verma')).toContainText('Active');
    await signOut(desk, ACCOUNT.meera);
  });

  await test.step(stepTitle('B4'), async () => {
    await as(desk, EMAIL.rahul, '/student');
    await checkState(desk, 'Hello, Rahul');
    await sidebar(desk, '/student/courses');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: /^Open course/ })
        .first(),
    );
    await desk.waitForURL('**/student/courses/**');
    await reachAndClick(desk, main(desk).getByRole('link', { name: `Open ${SHELL}` }));
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}`);
    await hubTab(desk, 'Simulation');
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}/simulation`);
    const chooser = main(desk).getByRole('region', { name: 'Choose a format' });
    await expect(chooser).toContainText('Not included for your institution');
    await expect(chooser).toContainText('Not available for this experiment');
    await expect(chooser).toContainText('Not started');
  });

  // TE-6: a reload keeps the world and signs the tab out; signing in returns to the same page.
  await desk.reload();
  await desk.waitForURL('**/sign-in?**');
  await as(desk, EMAIL.rahul, `/student/experiments/${SHELL_ID}/simulation`);
  await expect(main(desk).getByRole('region', { name: 'Choose a format' })).toContainText(
    'Not started',
  );

  await test.step(stepTitle('C1'), async () => {
    await hubTab(desk, 'Resources');
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}/resources`);
    const brief = main(desk)
      .getByRole('region', { name: 'Resources' })
      .locator('li.xr-row')
      .first();
    await expect(brief).toContainText('Not opened yet');
    const popup = desk.waitForEvent('popup');
    await reachAndClick(desk, brief.getByRole('button', { name: /in a new tab$/ }));
    await (await popup).close();
    await expect(brief).toContainText('Opened');
    await hubTab(desk, 'Simulation');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('region', { name: 'Choose a format' })
        .getByRole('link', { name: 'Open WEB' }),
    );
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}/simulation/web`);
  });

  const status = main(desk).locator('.xl-fmtpanel .xr-status');
  await test.step(stepTitle('C2'), async () => {
    await expect(status).toHaveText('Not started');
    await expect(button(desk, 'Launch WEB')).toBeVisible();
    // TE-3: the sample WEB activity opens in a new tab; opening it is activity, never completion.
    const popup = desk.waitForEvent('popup');
    await reachAndClick(desk, button(desk, 'Launch WEB'));
    const activity = await popup;
    await activity.waitForURL('**/prototype/web-activity?launch=*');
    await expect(activity.getByText('Simulated for this prototype')).toBeVisible();
    await expect(activity.getByText(SHELL, { exact: true })).toBeVisible();
    await checkState(activity, 'Sample WEB activity');
    await desk.bringToFront();
    await expect(status).toHaveText('In progress');
    await expect(button(desk, 'Continue WEB')).toBeVisible();
    await expect(main(desk).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);

    // The activity's own conditions: three trials at different levels and the right answer.
    await activity.bringToFront();
    for (const level of ['1', '3', '5']) {
      await activity.getByLabel(/^Rig level/).selectOption(level);
      await reachAndClick(activity, activity.getByRole('button', { name: 'Run trial' }));
    }
    await expect(activity.getByText('Three trials done.')).toBeVisible();
    const question = activity.getByRole('group', { name: /Which level gave the highest/ });
    await reachAndClick(activity, question.getByText('Level 1'));
    await reachAndClick(activity, activity.getByRole('button', { name: 'Check answer' }));
    await expect(activity.getByText(/Not quite\./)).toBeVisible();
    await desk.bringToFront();
    await expect(status).toHaveText('In progress');
    await activity.bringToFront();
    await reachAndClick(activity, question.getByText('Level 5'));
    await reachAndClick(activity, activity.getByRole('button', { name: 'Check answer' }));
    await reachAndClick(activity, activity.getByRole('button', { name: 'Finish activity' }));
    await expect(activity.getByText('Activity completed')).toBeVisible();
    await activity.close();

    await desk.bringToFront();
    await expect(status).toContainText('Completed');
    await expect(main(desk)).toContainText('You’ve completed WEB');
    await expect(main(desk)).toContainText('Reported by the simulation at');
  });

  await test.step(stepTitle('C3'), async () => {
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Give feedback on WEB' }));
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}/feedback/web`);
    await reachAndClick(desk, desk.getByRole('button', { name: 'Submit feedback' }));
    await expect(desk.getByRole('alert').filter({ hasText: 'ratings are missing' })).toContainText(
      '5 ratings are missing',
    );
    for (const statement of [1, 2, 3, 4, 5]) {
      await desk.locator(`label[for="feedback-q${statement}-4"]`).click();
    }
    await reachAndClick(desk, desk.getByRole('button', { name: 'Submit feedback' }));
    await checkState(desk, 'Feedback on WEB sent');
    await sidebar(desk, '/student/progress');
    await expect(main(desk)).toContainText('Feedback sent');
  });

  let transfer = '';
  await test.step(stepTitle('Device 1'), async () => {
    await myDevice(desk);
    // P3-03: the pre-authorised sample VR headset of the local prototype build.
    await expect(main(desk)).toContainText('ME lab VR headset, asset tag GIT-VR-03');
    await reachAndClick(desk, button(desk, 'Request a device transfer'));
    await desk.getByRole('textbox', { name: 'New device' }).fill(GIT_VR_07);
    await reachAndClick(desk, button(desk, 'Send request'));
    await expect(main(desk)).toContainText('With your Institute Admin');
    transfer = /DTR-\d{4}/.exec((await main(desk).textContent()) ?? '')![0];
    await signOut(desk, ACCOUNT.rahul);
    await adminAt(admin, '/admin/operations/device-transfers');
    await reachAndClick(
      admin,
      admin
        .getByRole('group', { name: 'Show' })
        .getByRole('link', { name: 'Still with an institution' }),
    );
    await expect(rowWith(admin, transfer)).toContainText('Still with the institution');
    await desk.bringToFront();
    await as(desk, EMAIL.meera, '/institute');
    await reachAndClick(desk, main(desk).getByRole('link', { name: /Open requests/ }));
    await desk.waitForURL('**/institute/requests?tab=devices');
    await expect(rowWith(desk, 'Rahul Verma')).toContainText('Waiting on you');
    await reachAndClick(desk, desk.getByRole('link', { name: 'Review Rahul Verma’s request' }));
    await desk.waitForURL(`**/institute/requests/devices/${transfer}`);
    await expect(button(desk, 'Forward to BITS')).toBeVisible();
  });

  await test.step(stepTitle('Device 2'), async () => {
    await reachAndClick(desk, button(desk, 'Forward to BITS'));
    const forward = desk.getByRole('dialog', { name: `Forward ${transfer} to BITS?` });
    await reachAndClick(desk, forward.getByRole('button', { name: 'Forward to BITS' }));
    await expect(forward).toBeHidden();
    await expect(desk.locator('#device-request-status')).toContainText('Forwarded to BITS');
    await signOut(desk, ACCOUNT.meera);
    await as(desk, EMAIL.rahul, '/student');
    await myDevice(desk);
    await expect(main(desk)).toContainText('Forwarded to BITS');
    await signOut(desk, ACCOUNT.rahul);
    await adminAt(admin, '/admin/operations/device-transfers');
    await expect(rowWith(admin, transfer)).toContainText('Forwarded');
    await reachAndClick(admin, main(admin).getByRole('link', { name: `Review ${transfer}` }));
    await admin.waitForURL(`**/admin/operations/device-transfers/${transfer}`);
    await expect(main(admin).getByRole('button', { name: 'Approve transfer' })).toBeVisible();
  });

  await test.step(stepTitle('Device 3'), async () => {
    await reachAndClick(admin, main(admin).getByRole('button', { name: 'Approve transfer' }));
    const approve = admin.getByRole('dialog', { name: `Approve ${transfer}?` });
    await reachAndClick(admin, approve.getByRole('button', { name: 'Approve transfer' }));
    await expect(approve).toBeHidden();
    await expect(admin.locator('#transfer-status')).toContainText('Approved');
    await desk.bringToFront();
    await as(desk, EMAIL.rahul, '/student');
    await myDevice(desk);
    await expect(main(desk)).toContainText('Approved');
    await expect(main(desk)).toContainText(GIT_VR_07);
    await signOut(desk, ACCOUNT.rahul);
    await as(desk, EMAIL.meera, '/institute');
    await sidebar(desk, '/institute/requests');
    await reachAndClick(
      desk,
      desk
        .getByRole('navigation', { name: 'Requests' })
        .getByRole('link', { name: 'Device requests' }),
    );
    await expect(rowWith(desk, 'Rahul Verma')).toContainText('Decided · approved by BITS');
  });

  let record = '';
  let assessmentId = '';
  await test.step(stepTitle('D1'), async () => {
    // Meera adds the Faculty member and assigns the course (IA-10, IA-15).
    await sidebar(desk, '/institute/people');
    await reachAndClick(
      desk,
      desk
        .getByRole('navigation', { name: 'People' })
        .getByRole('link', { name: 'Faculty', exact: true }),
    );
    await reachAndClick(
      desk,
      main(desk).locator('.xr-phead').getByRole('link', { name: 'Add faculty member' }),
    );
    await desk.waitForURL('**/institute/people/add?type=faculty');
    await desk.getByLabel('Full name', { exact: true }).fill('Dr S. Ranganathan');
    await desk.getByLabel(/^Institution e-mail/).fill(EMAIL.ranganathan);
    await reachAndClick(desk, button(desk, 'Add faculty member'));
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Assign a course' }));
    await desk.waitForURL('**/institute/people?tab=faculty-courses&faculty=**');
    const assignCourse = desk.getByRole('complementary', { name: 'Assign a course' });
    await assignCourse
      .getByRole('combobox', { name: /^Course/ })
      .selectOption({ label: `ME ZG523 — ${THERMO}` });
    await reachAndClick(desk, assignCourse.getByRole('button', { name: 'Assign course' }));
    await expect(main(desk)).toContainText('Dr S. Ranganathan now teaches ME ZG523.');
    await signOut(desk, ACCOUNT.meera);

    // Dr S. Ranganathan creates the assessment: FA-05 → FA-07 → FA-08 … FA-11.
    await as(desk, EMAIL.ranganathan, '/faculty');
    await sidebar(desk, '/faculty/courses');
    await reachAndClick(desk, desk.getByRole('link', { name: `Open course ${THERMO}` }));
    await desk.waitForURL('**/faculty/courses/thermodynamics-heat-transfer');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Open experiment' }));
    await desk.waitForURL(`**/faculty/experiments/${SHELL_ID}`);
    await reachAndClick(
      desk,
      region(desk, 'Assessment').getByRole('link', { name: 'Create assessment' }),
    );
    await desk.waitForURL(`**/faculty/assessments/new?experimentId=${SHELL_ID}`);
    await reachAndClick(desk, desk.getByRole('button', { name: 'Continue' }));
    await desk.waitForURL('**/faculty/assessments/new?step=rules**');
    await desk.getByLabel('Assessment name', { exact: true }).fill(ASSESSMENT);
    await desk.getByLabel('Pass mark (%)', { exact: true }).fill('50');
    await desk.getByLabel('Attempts allowed', { exact: true }).fill('2');
    await desk.getByLabel('Deadline', { exact: true }).fill('14 Nov 2026, 23:59');
    await choose(desk.getByRole('radio', { name: /Immediately after marking/ }));
    await reachAndClick(desk, desk.getByRole('button', { name: 'Continue' }));
    await desk.waitForURL('**/faculty/assessments/new?step=questions**');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'New question' }));
    await desk.waitForURL('**/faculty/question-bank/new?**');
    const first = desk.getByRole('form', { name: 'Add a question' });
    await choose(first.getByRole('radio', { name: 'Multiple choice' }));
    await first.getByRole('textbox', { name: 'Question' }).fill(Q1);
    await first.getByRole('textbox', { name: 'Option A' }).fill(Q1_RIGHT);
    await first.getByRole('textbox', { name: 'Option B' }).fill(Q1_WRONG);
    await choose(first.getByRole('radio', { name: 'Option A is the correct answer' }));
    await first.getByRole('textbox', { name: 'Marks' }).fill('2');
    await reachAndClick(desk, first.getByRole('button', { name: 'Save question' }));
    await desk.waitForURL('**/faculty/assessments/new?step=questions**');
    await reachAndClick(desk, desk.getByRole('button', { name: 'Continue' }));
    await desk.waitForURL('**/faculty/assessments/new?step=preview**');
    await reachAndClick(desk, desk.getByRole('button', { name: 'Create assessment' }));
    await checkState(desk, 'Assessment created');
    await reachAndClick(desk, desk.getByRole('link', { name: 'Open assessment' }));
    await desk.waitForURL(/\/faculty\/assessments\/ASMT-\d{4}$/);
    record = new URL(desk.url()).pathname;
    assessmentId = record.split('/').at(-1)!;
    // A written answer, so marking has something for the Faculty member to do.
    await recordTab(desk, /^Questions/);
    await desk.waitForURL(`**${record}/questions`);
    const inOrder = region(desk, 'Questions in order');
    await reachAndClick(desk, inOrder.getByRole('link', { name: 'New question' }));
    await desk.waitForURL('**/faculty/question-bank/new?**');
    const written = desk.getByRole('form', { name: 'Add a question' });
    await choose(written.getByRole('radio', { name: 'Written answer' }));
    await written.getByRole('textbox', { name: 'Question' }).fill(Q3);
    await written.getByRole('textbox', { name: 'Marks' }).fill('10');
    await reachAndClick(desk, written.getByRole('button', { name: 'Save question' }));
    await desk.waitForURL(`**${record}/questions`);
    await reachAndClick(
      desk,
      desk
        .getByRole('complementary', { name: 'From your question bank' })
        .locator('li')
        .first()
        .getByRole('button', { name: /^Add Q-\d{4} to this assessment$/ }),
    );
    await expect(inOrder).toContainText('2 questions · 12 marks');
    await recordTab(desk, /^Settings/);
    await expect(main(desk)).toContainText('Ready');
    await signOut(desk, ACCOUNT.ranganathan);
    await as(desk, EMAIL.rahul, '/student');
    await sidebar(desk, '/student/assessments');
    await expect(
      desk.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'To do (1)' }),
    ).toBeVisible();
    await expect(rowWith(desk, ASSESSMENT)).toContainText('To do');
  });

  await test.step(stepTitle('D2'), async () => {
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(ASSESSMENT) })
        .first(),
    );
    await desk.waitForURL(`**/student/assessments/${assessmentId}`);
    await reachAndClick(desk, desk.getByRole('button', { name: 'Start assessment' }));
    await desk.waitForURL(`**/student/assessments/${assessmentId}/attempt`);
    await choose(desk.getByRole('radio', { name: Q1_RIGHT }));
    await desk.getByRole('textbox', { name: Q3 }).fill(RAHUL_ANSWER);
    await desk.getByRole('textbox', { name: Q3 }).blur();
    await expect(desk.locator('header.xa-bar [role="status"]')).toHaveText('All answers saved');
    await reachAndClick(desk, main(desk).getByRole('button', { name: 'Submit', exact: true }));
    const submit = desk.getByRole('dialog', { name: 'Submit your answers?' });
    await reachAndClick(desk, submit.getByRole('button', { name: 'Submit answers' }));
    await checkState(desk, 'Answers submitted');
    await reachAndClick(desk, desk.getByRole('link', { name: 'See your result page' }));
    await desk.waitForURL(`**/student/assessments/${assessmentId}/result`);
    await expect(h1(desk)).toHaveText('Submitted — waiting for marking');
    await sidebar(desk, '/student/assessments');
    await reachAndClick(
      desk,
      desk.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Submitted (1)' }),
    );
    await expect(rowWith(desk, ASSESSMENT)).toContainText('Waiting for marking');
    await signOut(desk, ACCOUNT.rahul);
  });

  await test.step(stepTitle('D3'), async () => {
    await as(desk, EMAIL.ranganathan, '/faculty');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Mark 1 written answer' }));
    await desk.waitForURL((url) => url.pathname === '/faculty/marking');
    await expect(rowWith(desk, 'Rahul Verma')).toContainText('Waiting for marking');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Mark Rahul Verma' }));
    await desk.waitForURL(/\/faculty\/marking\/ATT-\d{4}$/);
    await expect(main(desk)).toContainText('Marked automatically');
    await desk.getByRole('textbox', { name: 'Mark for question 2' }).fill('7');
    await desk.getByRole('textbox', { name: /^Feedback for Rahul/ }).fill(FEEDBACK);
    await reachAndClick(desk, button(desk, 'Confirm marks'));
    const confirm = desk.getByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    await reachAndClick(desk, confirm.getByRole('button', { name: 'Confirm marks' }));
    await expect(desk.locator('#ms-mdone .xr-status--ok')).toHaveText('Marks confirmed');
    await sidebar(desk, '/faculty/assessments');
    const link = main(desk)
      .getByRole('link', { name: new RegExp(ASSESSMENT) })
      .first();
    await link.focus();
    await desk.keyboard.press('Enter');
    await desk.waitForURL(`**${record}`);
    await recordTab(desk, /^Submissions/);
    await expect(rowWith(desk, 'Rahul Verma')).toContainText('Marked');
    // The Faculty member's view of the Student: the assessment marked, WEB completed (C2, FA-21).
    await sidebar(desk, '/faculty/students');
    await reachAndClick(desk, desk.getByRole('link', { name: 'Open Rahul Verma' }));
    await desk.waitForURL(
      /\/faculty\/students\/[^/?]+\?experimentId=shell-and-tube-heat-exchanger$/,
    );
    await expect(region(desk, 'Assessment')).toContainText('Marked');
    await expect(main(desk)).toContainText('Completed');
    await signOut(desk, ACCOUNT.ranganathan);
  });

  await test.step(stepTitle('D4'), async () => {
    await as(desk, EMAIL.rahul, '/student');
    await sidebar(desk, '/student/assessments');
    await reachAndClick(
      desk,
      desk.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Results (1)' }),
    );
    await expect(rowWith(desk, ASSESSMENT)).toContainText('Result ready');
    await reachAndClick(desk, main(desk).getByRole('link', { name: `See result ${ASSESSMENT}` }));
    await desk.waitForURL(`**/student/assessments/${assessmentId}/result`);
    await checkState(desk, 'You passed');
    await expect(main(desk)).toContainText('Passed');
    await expect(main(desk)).toContainText(FEEDBACK);
    await signOut(desk, ACCOUNT.rahul);
  });

  // E5 before: the experiment does not exist publicly yet. TEST NAVIGATION (a typed address).
  await visitor.bringToFront();
  await visitor.goto('/experiments/conduction-through-a-composite-wall');
  await expect(h1(visitor)).toHaveText('We can’t find that experiment');

  await test.step(stepTitle('E1'), async () => {
    await desk.bringToFront();
    await as(desk, EMAIL.anil, '/vendor');
    await reachAndClick(desk, main(desk).getByRole('link', { name: 'Create experiment' }).first());
    await desk.waitForURL('**/vendor/experiments/new');
    await desk
      .getByRole('combobox', { name: 'Course' })
      .selectOption({ label: 'ME ZG523 · Thermodynamics & Heat Transfer' });
    await type(desk.getByLabel('Experiment name'), COMPOSITE);
    await type(desk.getByLabel('Summary'), 'Heat flow through a wall of several layers.');
    await type(
      desk.getByLabel('Description'),
      'Build a wall of three layers and compare the temperature profile with the series-resistance model.',
    );
    await type(desk.getByLabel('Version'), '1.0');
    await reachAndClick(desk, button(desk, 'Save draft'));
    await desk.waitForURL('**/vendor/experiments/SUB-0077/edit');
    await reachAndClick(desk, button(desk, 'Continue'));
    await reachAndClick(desk, desk.getByRole('checkbox', { name: /Browser \(WEB\)/ }));
    await reachAndClick(desk, desk.getByRole('checkbox', { name: /Virtual reality \(VR\)/ }));
    const web = region(desk, 'Browser (WEB) · Web link');
    await type(web.getByLabel('Web link'), 'https://labs.northline.example/composite-wall');
    await type(
      web.getByLabel('Browser and computer needed'),
      'A current browser on a laptop or desktop.',
    );
    const vr = region(desk, 'Virtual reality (VR) · App package');
    await type(vr.getByLabel('Package label'), 'Composite Wall VR');
    await type(vr.getByLabel('Package reference'), 'NSS-CW-VR-1.0');
    await type(vr.getByLabel('Device needed'), 'A supported VR headset.');
    await type(vr.getByLabel('Install notes'), 'Install it from the lab’s device manager.');
    await reachAndClick(desk, button(desk, 'Continue'));
    await reachAndClick(desk, button(desk, 'Continue'));
    await expect(h1(desk)).toHaveText('Check and submit');
    await reachAndClick(desk, button(desk, 'Submit for academic review'));
    const submit = desk.getByRole('dialog', { name: 'Submit for academic review?' });
    await reachAndClick(
      desk,
      submit.getByRole('button', { name: 'Submit for academic review', exact: true }),
    );
    await checkState(desk, 'Submitted for academic review');
    await sidebar(desk, '/vendor/experiments');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(COMPOSITE) })
        .first(),
    );
    await desk.waitForURL('**/vendor/experiments/SUB-0077');
    await expect(main(desk)).toContainText('With Academic Reviewer');
    await signOut(desk, ACCOUNT.anil);
    await admin.bringToFront();
    await allContent(admin);
    await reachAndClick(admin, main(admin).getByRole('link', { name: `Open ${COMPOSITE}` }));
    await admin.waitForURL('**/admin/content/records/SUB-0077');
    await expect(main(admin)).toContainText('With Academic Reviewer');
    await desk.bringToFront();
    await as(desk, EMAIL.menon, '/reviewer');
    await sidebar(desk, '/reviewer/queue');
    await reachAndClick(desk, main(desk).getByRole('link', { name: `Review ${COMPOSITE}` }));
    await desk.waitForURL('**/reviewer/submissions/SUB-0077');
    await expect(main(desk).locator('.xr-phead-meta .xr-status')).toHaveText(
      'Waiting · revision 1',
    );
  });

  await test.step(stepTitle('E2'), async () => {
    await reachAndClick(desk, decision(desk).getByRole('radio', { name: /^Return to vendor/ }));
    await reachAndClick(desk, decision(desk).getByRole('button', { name: 'Return to vendor' }));
    const returning = desk.getByRole('dialog', { name: 'Return to vendor?' });
    await returning
      .getByRole('textbox', { name: 'Reason the vendor will see' })
      .fill(RETURN_REASON);
    await returning
      .getByRole('checkbox', { name: 'Formats & delivery · VR · Device need' })
      .check();
    await returning.getByRole('button', { name: 'Return to vendor' }).click();
    await expect(returning).toBeHidden();
    // B6-02 f1: while it is still returned, the reviewer's line reads "Returned to vendor".
    await sidebar(desk, '/reviewer/reviewed');
    await expect(rowWith(desk, COMPOSITE)).toContainText('Returned to vendor');
    await signOut(desk, ACCOUNT.menon);
    await as(desk, EMAIL.anil, '/vendor');
    await sidebar(desk, '/vendor/experiments');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(COMPOSITE) })
        .first(),
    );
    await desk.waitForURL('**/vendor/experiments/SUB-0077');
    await expect(main(desk)).toContainText('Returned');
    await expect(main(desk)).toContainText('Returned by the Academic Reviewer');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: /^Revise/ })
        .first(),
    );
    await desk.waitForURL('**/vendor/experiments/SUB-0077/revise');
    const returned = region(desk, 'Returned by the Academic Reviewer');
    await expect(returned.locator('blockquote')).toHaveText(RETURN_REASON);
    await reachAndClick(
      desk,
      returned.getByRole('button', { name: 'Go to Formats & delivery · VR · Device need' }),
    );
    const device = region(desk, 'Virtual reality (VR) · App package').getByLabel('Device needed');
    await expect(device).toBeFocused();
    await device.fill('');
    await device.pressSequentially(REVISED_DEVICE);
    await reachAndClick(desk, button(desk, 'Save changes'));
    await reachAndClick(desk, button(desk, 'Continue'));
    await reachAndClick(desk, button(desk, 'Continue'));
    await reachAndClick(desk, button(desk, 'Resubmit'));
    const resubmit = desk.getByRole('dialog', { name: 'Resubmit your changes?' });
    await reachAndClick(desk, resubmit.getByRole('button', { name: 'Resubmit', exact: true }));
    await expect(h1(desk)).toHaveText('Submitted');
    await sidebar(desk, '/vendor/experiments');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(COMPOSITE) })
        .first(),
    );
    await expect(main(desk)).toContainText('Submitted');
    await signOut(desk, ACCOUNT.anil);
    await as(desk, EMAIL.menon, '/reviewer');
    // Once it has moved on, the decision names the revision it returned (B6-02 f1).
    await sidebar(desk, '/reviewer/reviewed');
    await expect(rowWith(desk, COMPOSITE)).toContainText('Returned to vendor · revision 1');
    await sidebar(desk, '/reviewer/queue');
    await reachAndClick(desk, main(desk).getByRole('link', { name: `Review ${COMPOSITE}` }));
    await desk.waitForURL('**/reviewer/submissions/SUB-0077');
    await expect(main(desk).locator('.xr-phead-meta .xr-status')).toHaveText(
      'Resubmitted · revision 2',
    );
    await expect(main(desk)).toContainText(REVISED_DEVICE);
  });

  await test.step(stepTitle('E3'), async () => {
    const add = desk.getByRole('textbox', { name: /^Add a learning outcome/ });
    for (const outcome of OUTCOMES) {
      await add.fill(outcome);
      await reachAndClick(desk, desk.getByRole('button', { name: 'Add outcome' }));
      await expect(add).toHaveValue('');
    }
    await reachAndClick(desk, decision(desk).getByRole('button', { name: 'Approve' }));
    const approve = desk.getByRole('dialog', { name: `Approve “${COMPOSITE}”?` });
    await approve.getByRole('button', { name: 'Approve' }).click();
    await expect(approve).toBeHidden();
    await expect(desk.locator('#rv-dec .xr-status--ok')).toHaveText(
      'Approved — with the Content Manager',
    );
    await signOut(desk, ACCOUNT.menon);
    await as(desk, EMAIL.anil, '/vendor');
    await sidebar(desk, '/vendor/experiments');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(COMPOSITE) })
        .first(),
    );
    await expect(main(desk)).toContainText('With Content Manager');
    await signOut(desk, ACCOUNT.anil);
    await as(desk, EMAIL.kavya, '/content-manager');
    await sidebar(desk, '/content-manager/ready');
    await reachAndClick(
      desk,
      main(desk).getByRole('link', { name: `Open decision for ${COMPOSITE}` }),
    );
    await desk.waitForURL('**/content-manager/decisions/SUB-0077');
    await expect(main(desk)).toContainText('Ready to publish');
  });

  await test.step(stepTitle('E4'), async () => {
    await reachAndClick(desk, decision(desk).getByRole('button', { name: 'Publish' }));
    const publish = desk.getByRole('dialog', { name: `Publish “${COMPOSITE}”?` });
    await expect(publish).toContainText('Publishing gives no one access');
    await reachAndClick(desk, publish.getByRole('button', { name: 'Publish' }));
    await expect(publish).toBeHidden({ timeout: 30_000 });
    await expect(desk.locator('#cm-cdec .xr-status--ok')).toHaveText('Published');
    await expect(desk.locator('#cm-cdec')).toContainText('Publishing gave no one access.');
    await signOut(desk, ACCOUNT.kavya);
    await as(desk, EMAIL.anil, '/vendor');
    await sidebar(desk, '/vendor/experiments');
    await reachAndClick(
      desk,
      main(desk)
        .getByRole('link', { name: new RegExp(COMPOSITE) })
        .first(),
    );
    await expect(main(desk)).toContainText('Published');
    await signOut(desk, ACCOUNT.anil);
    await as(desk, EMAIL.menon, '/reviewer');
    await sidebar(desk, '/reviewer/reviewed');
    await expect(rowWith(desk, COMPOSITE).first()).toContainText('Approved — published');
    await signOut(desk, ACCOUNT.menon);
    await admin.bringToFront();
    await allContent(admin);
    await reachAndClick(
      admin,
      main(admin)
        .getByRole('link', { name: `Open ${COMPOSITE}` })
        .first(),
    );
    await admin.waitForURL('**/admin/content/records/**');
    await expect(main(admin)).toContainText('Published');
  });

  await test.step(stepTitle('E5'), async () => {
    await visitor.bringToFront();
    await catalogue(visitor);
    await reachAndClick(visitor, main(visitor).getByRole('link', { name: COMPOSITE, exact: true }));
    await visitor.waitForURL('**/experiments/conduction-through-a-composite-wall');
    await expect(h1(visitor)).toHaveText(COMPOSITE);
    for (const outcome of OUTCOMES) await expect(main(visitor)).toContainText(outcome);
    // Publication gave no one access: the institution's Content access does not list it.
    await desk.bringToFront();
    await as(desk, EMAIL.meera, '/institute');
    await sidebar(desk, '/institute/content-access');
    await expect(main(desk)).toContainText(SHELL);
    await expect(main(desk)).not.toContainText(COMPOSITE);
    await signOut(desk, ACCOUNT.meera);
  });

  await test.step(stepTitle('F1'), async () => {
    await as(desk, EMAIL.kavya, '/content-manager');
    await openPublished(desk, SHELL);
    await reachAndClick(desk, button(desk, 'Edit catalogue details'));
    await desk.waitForURL(/\/content-manager\/updates\/UPD-\d{4}\?focus=summary$/);
    const field = (label: string) => main(desk).getByRole('textbox', { name: label, exact: true });
    await retype(field('Name'), RELEASED_NAME);
    await retype(field('Summary'), RELEASED_SUMMARY);
    await field('What changes and why').fill(
      'The name and summary now say what the Student measures: the overall heat-transfer coefficient.',
    );
    await field('Version label').fill('1.1');
    await reachAndClick(desk, button(desk, 'Save draft'));
    await sendForReview(desk);
    await openPublished(desk, SHELL);
    await expect(main(desk)).toContainText('Open update');
    await signOut(desk, ACCOUNT.kavya);
    await as(desk, EMAIL.menon, '/reviewer');
    await sidebar(desk, '/reviewer/queue');
    await reachAndClick(desk, main(desk).getByRole('link', { name: `Review ${SHELL}` }));
    await desk.waitForURL(/\/reviewer\/updates\/UPD-\d{4}$/);
    await expect(main(desk)).toContainText('Waiting for your decision');
  });

  await test.step(stepTitle('F2'), async () => {
    await reachAndClick(desk, decision(desk).getByRole('button', { name: 'Approve update' }));
    const approve = desk.getByRole('dialog', { name: /^Approve UPD-\d{4}\?$/ });
    await reachAndClick(desk, approve.getByRole('button', { name: 'Approve update' }));
    await expect(approve).toBeHidden();
    await expect(main(desk)).toContainText('Approved — with the Super Admin');
    await signOut(desk, ACCOUNT.menon);
    await as(desk, EMAIL.kavya, '/content-manager');
    await sidebar(desk, '/content-manager/updates');
    await expect(rowWith(desk, SHELL)).toContainText('Awaiting release decision');
    await adminAt(admin, '/admin/content/updates');
    await expect(rowWith(admin, /1\.0 → 1\.1/)).toContainText('Waiting for your decision');
    // Approval releases nothing: the public page still shows the live version.
    await visitor.bringToFront();
    await catalogue(visitor);
    await reachAndClick(visitor, main(visitor).getByRole('link', { name: SHELL, exact: true }));
    await expect(main(visitor)).not.toContainText(RELEASED_SUMMARY);
  });

  await test.step(stepTitle('F3'), async () => {
    await admin.bringToFront();
    await openUpdateDecision(admin, /1\.0 → 1\.1/);
    await expect(main(admin)).toContainText('Nothing here changes any institution’s access');
    await reachAndClick(admin, decision(admin).getByRole('button', { name: 'Release update' }));
    const release = admin.getByRole('dialog', { name: /^Release UPD-\d{4}\?$/ });
    await reachAndClick(admin, release.getByRole('button', { name: 'Release update' }));
    await expect(release).toBeHidden();
    await expect(admin.locator('#update-decided .xr-status--ok')).toHaveText('Released');
    await desk.bringToFront();
    await sidebar(desk, '/content-manager/updates');
    await expect(rowWith(desk, SHELL)).toContainText('Released');
    await signOut(desk, ACCOUNT.kavya);
    await as(desk, EMAIL.menon, '/reviewer');
    await sidebar(desk, '/reviewer/reviewed');
    await expect(rowWith(desk, SHELL).first()).toContainText('Update approved — released');
    await signOut(desk, ACCOUNT.menon);
  });

  await test.step(stepTitle('F4'), async () => {
    // The public pages and the entitled Student see the released version; access is unchanged.
    await visitor.bringToFront();
    await catalogue(visitor);
    await reachAndClick(
      visitor,
      main(visitor).getByRole('link', { name: RELEASED_NAME, exact: true }),
    );
    await visitor.waitForURL(`**/experiments/${SHELL_ID}`);
    await expect(visitor.locator('.xp-xsum')).toHaveText(RELEASED_SUMMARY);
    await desk.bringToFront();
    await as(desk, EMAIL.rahul, '/student');
    await sidebar(desk, '/student/courses');
    await reachAndClick(
      desk,
      desk
        .getByRole('navigation', { name: 'My courses' })
        .getByRole('link', { name: 'Experiments' }),
    );
    await reachAndClick(desk, main(desk).getByRole('link', { name: RELEASED_NAME }).first());
    await desk.waitForURL(`**/student/experiments/${SHELL_ID}`);
    await expect(h1(desk)).toHaveText(RELEASED_NAME);
    await signOut(desk, ACCOUNT.rahul);
    await as(desk, EMAIL.kavya, '/content-manager');
    await openPublished(desk, RELEASED_NAME);
    await expect(main(desk)).toContainText('Published');
    await signOut(desk, ACCOUNT.kavya);
  });

  // TE-6: the whole walk survives a reload of every tab; nobody is signed in afterwards.
  for (const tab of [visitor, admin, desk]) await tab.reload();
  await visitor.bringToFront();
  await expect(visitor.locator('.xp-xsum')).toHaveText(RELEASED_SUMMARY);
  await expect(admin).toHaveURL(/\/sign-in\?/);
  // Nothing a person typed as a password, and no session, is kept in the browser's storage.
  const kept = await visitor.evaluate(() => JSON.stringify({ ...window.localStorage }));
  expect(kept).toContain('REQ-0042');
  expect(kept).not.toContain('sample-password');
  expect(kept).not.toMatch(/"sessionKey"|ses-\d{6}/);
});
