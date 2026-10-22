import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { landingSignIn, onLanding } from '../support/landing';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar, sidebarLink } from '../support/workspace';

/**
 * The Package-2B demonstration (owner §7), in ONE browser tab of the PRODUCT build — no test hooks,
 * nothing but the screens — at 1440, 1024, 768 and 375, on one sample world:
 *
 *  1. the public request → the Super Admin approves it → the requester pays (TE-4) → access active;
 *     the Super Admin's first Institute Admin e-mail already signs someone in and is refused (the
 *     sample-mode identity safeguard, PC-49), then Meera Iyer is assigned;
 *  2. Meera signs in: Overview (IA-01) → Content access (IA-02) → the plan (IA-03) → Course codes
 *     (IA-16): MEC-523 saved;
 *  3. Import students (IA-11): a file with errors (and an e-mail another account signs in with) is
 *     refused as a whole, the corrected file imports three students;
 *  4. Groups (IA-13): a group created → the group (IA-14): two members added → "Give this group
 *     access" (IA-05 with the group chosen) → the group grant; Arun Kumar is given the experiment
 *     on his own from his record (IA-07 → IA-05);
 *  5. Arun signs in: Home (ST-01), My courses (ST-02, the institution's code) and All experiments
 *     (ST-04) show the experiment;
 *  6. Meera withdraws Arun's grant (IA-04); Arun's All experiments is empty; Rahul Verma, a member of
 *     the group, still has it through the group;
 *  7. Meera adds a faculty member (IA-10) → "Assign a course" (IA-15 with them chosen) → the Faculty
 *     record (IA-09) and the Faculty tab (IA-08) show the same course.
 *
 * Every step is a port command or read on the one world; one document throughout (ADR-0004): every
 * address is reached by a link or a button, except where marked TEST NAVIGATION (the app router).
 */

const card = (page: Page) => page.locator('.xs-card');
const main = (page: Page) => page.locator('main');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await page.waitForURL((url) => url.pathname === href);
}

async function toSignIn(page: Page): Promise<void> {
  // The landing draws its own header with Sign in at every width (owner decision D-3).
  if (await onLanding(page)) return landingSignIn(page);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await reachAndClick(page, page.locator('header a.xp-signin'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name: 'Sign in' }));
  }
  await page.waitForURL('**/sign-in');
}

/** A drawn checkbox, ticked by a pointer click on its label (the v46 control draws the box). */
async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

/**
 * A People tab (the page's own tabs navigation). V3 (IA-v1) names a tab with its count after a
 * comma ("Faculty, 3 faculty members"); "Faculty courses" has none.
 */
async function peopleTab(page: Page, name: string): Promise<void> {
  await reachAndClick(
    page,
    page
      .getByRole('navigation', { name: 'People' })
      .getByRole('link', { name: new RegExp(`^${name}\\s*(,|$)`) }),
  );
}

const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const ARUN = 'Account menu, Arun Kumar, Student, Godavari Institute of Technology';
const RAHUL = 'Account menu, Rahul Verma, Student, Godavari Institute of Technology';
const SHELL = 'Shell-and-Tube Heat Exchanger';
const GROUP = 'ME ZG523 — Sem II';
/**
 * The identifier rule (owner, every V3 role; IA-v1): no internal reference in the Institute
 * Admin's words — the references stay in addresses, keys and services.
 */
const REFERENCE = /\b(?:SACC|ACC|REQ|GRP|DTR|FMAP)-\d+/;
const IDENTITY_WORDS =
  'This e-mail is already used to sign in to the platform. Use a different e-mail.';

const HEADER = 'student_id,full_name,email,programme,course,course_code';
const row = (id: string, name: string, email: string, code = 'ME ZG523') =>
  `${id},${name},${email},B.Tech Mechanical,Thermodynamics & Heat Transfer,${code}`;
const CORRECTED = [
  HEADER,
  row('GIT-2026-0418', 'Rahul Verma', 'rahul.verma@godavari.edu.in'),
  row('GIT-2026-0431', 'Priya Natarajan', 'priya.natarajan@godavari.edu.in'),
  row('GIT-2026-0377', 'Arun Kumar', 'arun.kumar@godavari.edu.in'),
].join('\r\n');
const WITH_ERRORS = [
  HEADER,
  row('GIT-2026-0418', 'Rahul Verma', 'rahul.verma@godavari.edu.in'),
  row('GIT-2026-0418', 'Rahul V.', 'rahul.v@godavari.edu.in'),
  row('GIT-2026-0377', 'Arun Kumar', 'arun.kumar@godavari'),
  row('GIT-2026-0999', 'Meera Iyer', 'meera.iyer@godavari.edu.in'),
].join('\r\n');

async function chooseFile(page: Page, name: string, text: string): Promise<void> {
  await main(page)
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(text, 'utf8') });
  await expect(main(page)).toContainText(name);
}

test('one tab, the product build: activation → course codes, import, group and access → the Students’ access and its withdrawal → Faculty courses', async ({
  page,
}) => {
  // The whole of Phase 2 in one tab: longer than the triple timeout `test.slow()` gives.
  test.setTimeout(300_000);
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. The public request, approved and paid; the Super Admin assigns the Institute Admin.
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: 'Open the new access request from Godavari Institute of Technology',
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const approve = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Approved — payment required');
  await signOut(page, ARJUN);
  await openInTab(page, address);
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');

  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  const search = page.getByRole('searchbox', { name: 'Search' });
  await reachAndClick(page, search);
  await search.fill('godavari');
  await reachAndClick(
    page,
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await reachAndClick(
    page,
    page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  // The identity safeguard: the Content Manager's e-mail is refused, nothing is assigned.
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('kavya.nair@wilp.example');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(assign).toContainText(IDENTITY_WORDS);
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: Meera Iyer');
  await signOut(page, ARJUN);

  // 2. Meera: Overview → Content access → the plan → Course codes (MEC-523).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await expect(main(page).locator('.ia-ov-status')).toContainText('Access active');
  await sidebar(page, '/institute/content-access');
  // V3 (IA-v1): the plan is named by its term; its reference is only in the link's address.
  const viewPlan = page
    .getByRole('region', { name: 'Access plan', exact: true })
    .getByRole('link', { name: /^View access plan, / });
  await expect(viewPlan).toHaveAttribute('href', '/institute/content-access/plans/ACC-0107');
  await reachAndClick(page, viewPlan);
  await page.waitForURL('**/institute/content-access/plans/ACC-0107');
  await expect(
    page
      .getByRole('region', { name: 'Licences and term' })
      .locator('dt', { hasText: /^Licences$/ })
      .locator('xpath=following-sibling::dd[1]'),
  ).toHaveText(/^120\s*as approved by BITS$/);
  await expect(main(page)).not.toContainText(REFERENCE);
  await sidebar(page, '/institute/content-access');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Content access' }).getByRole('link', {
      name: 'Course codes',
    }),
  );
  await page.waitForURL('**/institute/content-access?tab=course-codes');
  // One course: the V3 count words (IA-v1 `vm16`) — "Your institution’s code isn’t added yet".
  await expect(main(page)).toContainText('Your institution’s code isn’t added yet');
  await checkState(page, 'Content access');
  await page
    .getByRole('textbox', { name: 'Your course code for Thermodynamics & Heat Transfer' })
    .fill('MEC-523');
  await page
    .getByRole('textbox', { name: 'Semester for Thermodynamics & Heat Transfer (optional)' })
    .fill('Sem II');
  // One course: "Save course code" (the plural with several, IA-v1 `saveText`).
  await reachAndClick(page, main(page).getByRole('button', { name: 'Save course code' }));
  await expect(main(page)).toContainText(
    'Students and faculty at your institution see MEC-523 with Thermodynamics & Heat Transfer.',
  );
  await expect(main(page)).toContainText('Your institution’s code is added');

  // 3. Import students (IA-11): errors block the whole file; the corrected file imports three.
  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Import students' }),
  );
  await page.waitForURL('**/institute/people/import');
  await expect(page.getByRole('heading', { level: 1, name: 'Choose a file' })).toBeVisible();
  await checkState(page, 'Choose a file');
  await chooseFile(page, 'godavari-me-zg523.csv', WITH_ERRORS);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Check file' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Check rows' })).toBeVisible();
  await expect(main(page)).toContainText('Nothing is imported while the file has errors');
  await expect(main(page)).toContainText('4 rows checked');
  await expect(main(page)).toContainText(
    'Student ID GIT-2026-0418 is also in row 2. Each student needs a different ID.',
  );
  await expect(main(page)).toContainText('E-mail “arun.kumar@godavari” isn’t a full address.');
  await expect(main(page).locator('tbody tr', { hasText: 'Meera Iyer' })).toContainText(
    'meera.iyer@godavari.edu.in',
  );
  await checkState(page, 'Check rows');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Choose the corrected file' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Choose a file' })).toBeVisible();
  await chooseFile(page, 'godavari-me-zg523-corrected.csv', CORRECTED);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Check file' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Check rows' })).toBeVisible();
  await expect(main(page)).toContainText('3 ready to import');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Confirm import' })).toBeVisible();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Import 3 students' }));
  await expect(page.getByRole('heading', { level: 1, name: '3 students imported' })).toBeVisible();
  await expect(main(page)).toContainText('Rahul Verma, Priya Natarajan and Arun Kumar.');
  await checkState(page, '3 students imported');
  await reachAndClick(page, main(page).getByRole('link', { name: 'View students' }));
  await page.waitForURL((url) => url.pathname === '/institute/people');
  await expect(main(page).locator('tbody tr')).toHaveCount(3);

  // 4. A group (IA-13 → IA-14), its members and the group grant; Arun's own grant.
  await peopleTab(page, 'Groups');
  await page.waitForURL('**/institute/people?tab=groups');
  // The head's "Create group" (V3, IA-v1: the empty Groups list repeats it).
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('button', { name: 'Create group' }),
  );
  const create = page.getByRole('dialog', { name: 'Create group' });
  await create.getByRole('textbox', { name: 'Group name' }).fill(GROUP);
  await reachAndClick(page, create.getByRole('button', { name: 'Create group' }));
  await expect(main(page)).toContainText(`Group “${GROUP}” created. Add students to it next.`);
  await checkState(page, 'People');
  await reachAndClick(page, main(page).getByRole('link', { name: `Open group ${GROUP}` }));
  await page.waitForURL('**/institute/people/groups/**');
  await expect(page.getByRole('heading', { level: 1, name: GROUP })).toBeVisible();
  // The head's "Add students" (V3, IA-v1: the empty members list repeats it).
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('button', { name: 'Add students' }),
  );
  await tick(page, page.getByRole('checkbox', { name: /Rahul Verma/ }));
  await tick(page, page.getByRole('checkbox', { name: /Priya Natarajan/ }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add 2 students' }));
  await expect(main(page)).toContainText('2 students were added to the group.');
  await checkState(page, GROUP);
  const giveGroup = main(page)
    .locator('.rk-head-act')
    .getByRole('link', { name: 'Give this group access' });
  // The group is named by its name; its reference stays in the address (IA-v1 identifier rule).
  await expect(giveGroup).toHaveAttribute('href', /[?&]group=GRP-\d+/);
  await expect(main(page)).not.toContainText(REFERENCE);
  await reachAndClick(page, giveGroup);
  await page.waitForURL('**/institute/student-access/give?**');
  await expect(main(page)).toContainText(`Giving access to the group ${GROUP}`);
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Choose students' })).toBeVisible();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Review and give access' }),
  ).toBeVisible();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  await expect(page.getByRole('list', { name: 'Access given' })).toContainText(GROUP);

  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: 'Open student record: Arun Kumar' }),
  );
  await page.waitForURL('**/institute/people/students/**');
  // The record's head action (V3, IA-v1: an empty "Experiments given" repeats it).
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Give this student access' }),
  );
  await page.waitForURL('**/institute/student-access/give?**');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('checkbox', { name: /Arun Kumar/ })).toBeChecked();
  // Rahul holds the experiment through the group only: he is not marked as having it himself.
  await expect(page.getByRole('checkbox', { name: /Rahul Verma/ })).toBeEnabled();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  await expect(page.getByRole('list', { name: 'Access given' })).toContainText('Arun Kumar');
  await signOut(page, MEERA);

  // 5. Arun: Home, My courses (the institution's code) and All experiments show the experiment.
  await signIn(page, 'arun.kumar@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await expect(
    main(page)
      .getByRole('link', { name: `Open experiment, ${SHELL}`, exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await sidebar(page, '/student/courses');
  await expect(main(page)).toContainText('MEC-523');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'My courses' }).getByRole('link', {
      name: 'All experiments',
    }),
  );
  await page.waitForURL('**/student/courses?tab=experiments');
  await expect(main(page).locator('.sv-xpanel li.sv-xli')).toHaveCount(1);
  await expect(main(page).locator('.sv-xpanel li.sv-xli')).toContainText(SHELL);
  await expect(main(page)).toContainText('1 experiment in 1 course');
  await checkState(page, 'My courses');
  await signOut(page, ARUN);

  // 6. Meera withdraws Arun's grant; Arun has nothing now; Rahul keeps it through the group.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/student-access');
  await reachAndClick(
    page,
    main(page).getByRole('button', { name: `Withdraw Arun Kumar’s access to ${SHELL}` }),
  );
  const withdraw = page.getByRole('alertdialog', { name: 'Withdraw access?' });
  await withdraw.getByLabel(/^Reason/).fill('Given to the wrong student.');
  await reachAndClick(page, withdraw.getByRole('button', { name: 'Withdraw access' }));
  await expect(withdraw).toBeHidden();
  await signOut(page, MEERA);

  await signIn(page, 'arun.kumar@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  // ST-01 (ST-v1): the open link reads "Open experiment" (named with the experiment) — none now.
  await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
  await expect(main(page)).not.toContainText('Open experiment');
  await expect(main(page).getByRole('link', { name: new RegExp(SHELL) })).toHaveCount(0);
  // TEST NAVIGATION: All experiments through the app router (a typed address resets the world).
  await openInTab(page, '/student/courses?tab=experiments');
  await expect(main(page).locator('.sv-xpanel li.sv-xli')).toHaveCount(0);
  await expect(main(page)).toContainText('Your institution hasn’t given you access yet');
  await signOut(page, ARUN);

  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await sidebar(page, '/student/courses');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'My courses' }).getByRole('link', {
      name: 'All experiments',
    }),
  );
  await expect(main(page).locator('.sv-xpanel li.sv-xli')).toContainText(SHELL);
  await signOut(page, RAHUL);

  // 7. Faculty: added (IA-10) → Assign a course (IA-15) → the record (IA-09) and the tab (IA-08).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/people');
  await peopleTab(page, 'Faculty');
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Add faculty member' }),
  );
  await page.waitForURL('**/institute/people/add?type=faculty');
  await page.getByLabel('Full name', { exact: true }).fill('Dr S. Ranganathan');
  await page.getByLabel(/^Institution e-mail/).fill('s.ranganathan@godavari.edu.in');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add faculty member' }));
  await reachAndClick(page, main(page).getByRole('link', { name: 'Assign a course' }));
  await page.waitForURL('**/institute/people?tab=faculty-courses&faculty=**');
  // V3 (IA-v1): the assign panel is a region of the page beside the table.
  const panelAside = page.getByRole('region', { name: 'Assign a course' });
  await expect(panelAside.getByRole('combobox', { name: /^Faculty member/ })).toHaveValue(/per-/);
  await panelAside
    .getByRole('combobox', { name: /^Course/ })
    .selectOption({ label: 'ME ZG523 — Thermodynamics & Heat Transfer' });
  await reachAndClick(page, panelAside.getByRole('button', { name: 'Assign course' }));
  await expect(main(page)).toContainText(
    'Dr S. Ranganathan now teaches ME ZG523. It appears in their Faculty workspace.',
  );
  await checkState(page, 'People');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Dr S. Ranganathan' }));
  await page.waitForURL('**/institute/people/faculty/**');
  const taught = main(page)
    .getByRole('table', { name: 'Courses taught by Dr S. Ranganathan' })
    .getByRole('row')
    .filter({ hasText: 'ME ZG523' });
  await expect(taught).toContainText('Thermodynamics & Heat Transfer');
  await checkState(page, 'Dr S. Ranganathan');
  // Back to the Faculty tab: the V3 breadcrumb (IA-v1) in place of the v46 back link.
  await reachAndClick(
    page,
    main(page).getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
      name: 'Faculty',
      exact: true,
    }),
  );
  await page.waitForURL('**/institute/people?tab=faculty');
  await expect(main(page).locator('tbody tr', { hasText: 'Dr S. Ranganathan' })).toContainText(
    'ME ZG523',
  );
  await expectSameDocument(page, mark);
});
