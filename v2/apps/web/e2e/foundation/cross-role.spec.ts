import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
  inspectWorld,
  reachAndClick,
  switchIdentity,
  TEST_HOOKS_URL,
} from '../support';
import {
  ACCOUNT_LINES,
  expectSameDocument,
  markDocument,
  openAs,
  revealSidebar,
  roleEntry,
  type RoleEntry,
  sidebarHelp,
  SUPER_ADMIN,
  waitForShell,
} from '../support/workspace';

/**
 * WP-0.14 (b) — the cross-role browser proofs on Phase-0 screens only (Appendix F WP-0.14
 * acceptance 4; owner instruction §8), at the four widths. Each scenario is ONE tab, ONE world:
 * the identity changes through the CI-only same-tab session switch (`switchIdentity`; owner
 * instruction §7) and other roles act through `actAs`; nothing reloads, no second world is built,
 * and no UI ever chooses an identity. After every switch the tab's previous answers are gone, the
 * session key is new and the shell is the new person's own (from the world's records).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const STUDENT = roleEntry('student');
const FACULTY = roleEntry('faculty');
const INSTITUTE_ADMIN = roleEntry('tenant_admin');
const ADMIN = roleEntry('super_admin');
const PAUSED = 'Your institution’s access is paused — your work is kept.';
const INACTIVE = 'Your account is inactive. Contact your institution administrator.';

interface Tab {
  readonly instance: string;
  readonly seedId: string;
  readonly mark: string;
}

/** Remembers this tab's document and world, to prove later that neither changed. */
async function rememberTab(page: Page): Promise<Tab> {
  const world = await inspectWorld(page);
  expect(world.attached, 'one world per tab').toBe(1);
  return { instance: world.instance, seedId: world.seedId, mark: await markDocument(page) };
}

async function expectSameTab(page: Page, tab: Tab): Promise<void> {
  await expectSameDocument(page, tab.mark);
  const world = await inspectWorld(page);
  expect(
    { instance: world.instance, seedId: world.seedId, attached: world.attached },
    'the same world instance — nothing reloaded, no second world',
  ).toEqual({ instance: tab.instance, seedId: tab.seedId, attached: 1 });
}

/** The workspace shell is the person's own: sidebar landmark and account-menu line (board 06). */
async function expectShellOf(page: Page, entry: RoleEntry): Promise<void> {
  await expect(page.locator('aside.xr-side')).toHaveAttribute(
    'aria-label',
    `${entry.label} workspace`,
  );
  await expect(page.getByRole('button', { name: ACCOUNT_LINES[entry.role] })).toBeAttached();
}

/**
 * Switches the tab to `entry`'s person and brings them to their own Help: the address the tab was
 * on belongs to the previous workspace, so the new shell shows XS-06 there, and its "Back to
 * Home" is followed client-side (same document, same world).
 */
async function switchTo(page: Page, entry: RoleEntry, from: RoleEntry): Promise<string> {
  const before = await inspectWorld(page);
  const switched = await switchIdentity(page, entry.person);
  expect(switched.personId).toBe(entry.person.personId);
  expect(switched.sessionKey, 'a new session key').not.toBe(switched.previousSessionKey);
  expect(switched.worldVersion, 'switching writes nothing').toBe(before.worldVersion);
  if (before.session.status === 'signed-in')
    expect(switched.previousSessionKey).toBe(before.session.sessionKey);
  const after = await inspectWorld(page);
  expect(after.instance).toBe(before.instance);
  if (before.session.status === 'signed-in')
    expect(after.cachedSessionKeys, 'the previous person’s answers are gone').not.toContain(
      before.session.sessionKey,
    );
  await expectShellOf(page, entry);
  if (from.base !== entry.base) {
    const message = page.locator('main .xr-msg');
    await expect(
      page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
    ).toBeVisible();
    await expect(message).toContainText(`You’re signed in to the ${entry.label} workspace.`);
    await message.getByRole('link', { name: 'Back to Home' }).click();
    // Built homes: the Super Admin's since Package 1D (SA-01 Overview), the Institute Admin's and
    // the Student's since Package 2A (IA-01 Overview, ST-01 Home), the Faculty member's since Phase
    // 4A (FA-01 Overview); Help is then a sidebar step.
    const home: Readonly<Partial<Record<string, string>>> = {
      super_admin: 'Overview',
      tenant_admin: 'Overview',
      student: 'Hello, Rahul',
      faculty: 'Overview',
    };
    const heading = home[entry.role];
    if (heading) {
      await page.waitForURL((url) => url.pathname === entry.base);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await revealSidebar(page);
      await sidebarHelp(page).click();
    }
    await page.waitForURL(`**${entry.base}/help`);
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await expect(sidebarHelp(page)).toHaveAttribute('aria-current', 'page');
  // Nothing of the previous person shows, and no identity UI exists.
  const text = await page.locator('body').innerText();
  if (from.base !== entry.base) expect(text).not.toContain(`${from.label} workspace`);
  await expectNoDeveloperSurfaces(page);
  return switched.sessionKey!;
}

/** XS-07's My reports has loaded (a negated text check passes too early while it loads). */
async function myReportsLoaded(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 2, name: 'My reports' })).toBeVisible();
  await expect(page.getByText('Loading your reports')).toHaveCount(0);
}

async function checkScreen(page: Page): Promise<void> {
  await expectNoAxeViolations(page);
  expect((await expectNoInvisibleFocusTargets(page)).length).toBeGreaterThan(0);
}

/** The XS-07 form, filled and sent with a real pointer; answers the SUP reference shown. */
async function sendReport(page: Page, whatHappened: string): Promise<string> {
  await page.locator('main').getByRole('link', { name: 'Report a problem' }).click();
  await page.waitForURL('**/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  await page.getByLabel('What happened?').fill(whatHappened);
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
  return (await page.locator('main .xr-msg .xr-id').textContent())!;
}

async function godavari(page: Page, paused: boolean): Promise<void> {
  const found = await actAs<{ ok: boolean; value: { institution: { rev: number } } }>(
    page,
    SUPER_ADMIN,
    { port: 'institutions', method: 'getInstitution', input: 'godavari' },
  );
  expect(
    await actAs(page, SUPER_ADMIN, {
      port: 'institutions',
      method: paused ? 'pauseInstitution' : 'restoreInstitution',
      input: {
        institutionId: 'godavari',
        reason: paused
          ? 'The institution asked us to pause access while it checks its student list.'
          : 'The student list is checked.',
        expectedRev: found.value.institution.rev,
      },
    }),
  ).toMatchObject({ ok: true });
}

async function expectBanner(page: Page, words: string | null): Promise<void> {
  const banner = page.locator('.xr-banner');
  if (words === null) {
    await expect(banner).toHaveCount(0);
    return;
  }
  await expect(banner).toHaveCount(1);
  await expect(banner).toHaveAttribute('role', 'status');
  await expect(banner).toContainText(words);
}

test('A · support across roles: Student reports on XS-07, the Super Admin resolves with a note, the Student reads Resolved and the note', async ({
  page,
}) => {
  await openAs(page, STUDENT.person, '/student/help');
  await waitForShell(page);
  const tab = await rememberTab(page);
  const studentKey = (await inspectWorld(page)).session;

  // 1–4. The Student sends a report from XS-07; the world gives it a SUP reference.
  const reference = await sendReport(page, 'The VR headset lost tracking during the lab.');
  expect(reference).toMatch(/^SUP-\d{4}$/);
  expect(reference).not.toBe('SUP-0213');
  await checkScreen(page);

  // 5. The Super Admin, in this same tab, resolves that report with a note (the approved bridge:
  //    SA-21 is a Phase-6 screen).
  await switchTo(page, ADMIN, STUDENT);
  const report = await actAs<{ ok: boolean; value: { id: string; rev: number; state: string } }>(
    page,
    SUPER_ADMIN,
    { port: 'operations', method: 'getMyReport', input: reference },
  );
  expect([report.ok, report.value.state], 'the Super Admin reads the Student’s report').toEqual([
    true,
    'open',
  ]);
  const note = 'Fixed — the headset firmware was updated. Please try again.';
  expect(
    await actAs(page, SUPER_ADMIN, {
      port: 'operations',
      method: 'resolveReport',
      input: { id: reference, note, expectedRev: report.value.rev },
    }),
  ).toMatchObject({ ok: true, value: { state: 'resolved' } });
  // The Super Admin's own My reports never lists another person's report.
  await myReportsLoaded(page);
  await expect(page.locator('main')).not.toContainText(reference);
  await checkScreen(page);

  // 6. Back to the Student, in the same tab: a new session, nothing of the Super Admin's.
  await switchTo(page, STUDENT, ADMIN);
  const back = await inspectWorld(page);
  expect(back.session.status === 'signed-in' && back.session.personId).toBe('per-0002');
  if (studentKey.status === 'signed-in' && back.session.status === 'signed-in')
    expect(back.session.sessionKey, 'a new Student session').not.toBe(studentKey.sessionKey);
  expect(back.cachedSessionKeys.every((key) => !key.includes(ADMIN.person.personId))).toBe(true);

  // 7–8. The report detail: Resolved, with the exact note.
  const row = page.locator('main.xr-page ul.xr-rows a.xr-row-link', { hasText: reference });
  await expect(row).toContainText('Resolved');
  await row.click();
  await page.waitForURL(`**/student/help/reports/${reference}`);
  await expect(page.locator('.xr-phead .xr-id')).toHaveText(reference);
  await expect(page.locator('.xr-notice--ok')).toContainText(`“${note}”`);
  await expect(
    page.getByRole('region', { name: 'History' }).getByRole('listitem').first(),
  ).toHaveText(/Resolved\s*.* · resolution note added/);
  await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Super Admin');
  await checkScreen(page);
  await expectSameTab(page, tab);
});

test('B · institution pause and restoration reach the Student, Faculty and Institute Admin of Godavari', async ({
  page,
}) => {
  await openAs(page, STUDENT.person, '/student/help');
  await waitForShell(page);
  const tab = await rememberTab(page);
  const people = [STUDENT, FACULTY, INSTITUTE_ADMIN] as const;
  // Each one's session is active and unbannered before the pause.
  let current: RoleEntry = STUDENT;
  for (const entry of people) {
    if (entry !== current) await switchTo(page, entry, current);
    current = entry;
    await expectBanner(page, null);
  }
  const before = await inspectWorld(page);

  // The Super Admin pauses Godavari: the same world, one new version.
  await godavari(page, true);
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion + 1);
  for (const entry of [...people].reverse()) {
    if (entry !== current) await switchTo(page, entry, current);
    current = entry;
    await expectBanner(page, PAUSED);
    await expect(page.locator('.xr-banner').getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      `${entry.base}/help`,
    );
    await checkScreen(page);
  }
  // The read model says the same as the banner: each person's own session carries it.
  for (const entry of people) {
    const session = await actAs<{ ok: boolean; value: { banners: string[] } }>(page, entry.person, {
      port: 'session',
      method: 'getSession',
    });
    expect(session.value.banners).toContain('institution-paused');
  }

  // Restored: the banners go, for every one of them.
  await godavari(page, false);
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion + 2);
  for (const entry of people) {
    if (entry !== current) await switchTo(page, entry, current);
    current = entry;
    await expectBanner(page, null);
  }
  await expectSameTab(page, tab);
});

test('C · Student deactivation: the Institute Admin deactivates Rahul; his next session shows the inactive banner; nothing else changes', async ({
  page,
}) => {
  await openAs(page, INSTITUTE_ADMIN.person, '/institute/help');
  await waitForShell(page);
  const tab = await rememberTab(page);
  const read = (person: { personId: string }, id: string) =>
    actAs<{
      ok: boolean;
      value: { student: { rev: number; accountStatus: string; fullName: string } };
    }>(page, INSTITUTE_ADMIN.person, { port: 'people', method: 'getStudent', input: id }).then(
      (answer) => ({ person, ...answer.value.student }),
    );
  const rahul = await read(STUDENT.person, 'per-0002');
  const priya = await read({ personId: 'per-0003' }, 'per-0003');
  expect([rahul.fullName, rahul.accountStatus, priya.fullName, priya.accountStatus]).toEqual([
    'Rahul Verma',
    'active',
    'Priya Natarajan',
    'active',
  ]);
  const facultyBanners = async () =>
    (
      await actAs<{ ok: boolean; value: { banners: string[] } }>(page, FACULTY.person, {
        port: 'session',
        method: 'getSession',
      })
    ).value.banners;
  const faculty = await facultyBanners();

  // The authorised Institute Admin deactivates the active Student.
  expect(
    await actAs(page, INSTITUTE_ADMIN.person, {
      port: 'people',
      method: 'deactivateStudent',
      input: { id: 'per-0002', reason: 'Left the programme.', expectedRev: rahul.rev },
    }),
  ).toMatchObject({ ok: true, value: { accountStatus: 'inactive' } });
  await expectBanner(page, null); // the Institute Admin is not inactive

  // Rahul's next (test-only) session: the inactive banner, in his own shell.
  await switchTo(page, STUDENT, INSTITUTE_ADMIN);
  await expectBanner(page, INACTIVE);
  await expect(page.locator('.xr-banner')).toHaveClass(/xr-dark/);
  await checkScreen(page);

  // Unrelated records are untouched: Priya as she was; the Faculty member's session unbannered.
  const priyaAfter = await read({ personId: 'per-0003' }, 'per-0003');
  expect([priyaAfter.accountStatus, priyaAfter.rev]).toEqual([priya.accountStatus, priya.rev]);
  expect(await facultyBanners(), 'the Faculty member’s session is unchanged').toEqual(faculty);
  expect(faculty).not.toContain('account-inactive');
  await switchTo(page, FACULTY, STUDENT);
  await expectBanner(page, null);
  await expectSameTab(page, tab);
});

test('D · identity continuity: a change made as one role is there for the next, the previous answers are gone, the shell is the new person’s own', async ({
  page,
}) => {
  await openAs(page, STUDENT.person, '/student/help');
  await waitForShell(page);
  const tab = await rememberTab(page);
  const start = await inspectWorld(page);
  expect(start.cachedSessionKeys.length).toBeGreaterThan(0);

  // A permitted change, made through the Student's own screen.
  const reference = await sendReport(page, 'The lab brief link opened a blank page.');
  const changed = await inspectWorld(page);
  expect(changed.worldVersion).toBe(start.worldVersion + 1);

  // Switch to the Super Admin in the same tab.
  await switchTo(page, ADMIN, STUDENT);
  const asAdmin = await inspectWorld(page);
  expect(asAdmin.instance).toBe(start.instance);
  expect(asAdmin.worldVersion, 'the switch wrote nothing').toBe(changed.worldVersion);
  expect(
    asAdmin.cachedSessionKeys.filter((key) => key.startsWith('person:per-0002#')),
    'none of the Student’s cached answers remain',
  ).toEqual([]);

  // The same record change is visible where authorised (the Super Admin's read of it, SA-21)…
  const seen = await actAs<{ ok: boolean; value: { state: string; whatHappened: string } }>(
    page,
    SUPER_ADMIN,
    { port: 'operations', method: 'getMyReport', input: reference },
  );
  expect([seen.ok, seen.value.state, seen.value.whatHappened]).toEqual([
    true,
    'open',
    'The lab brief link opened a blank page.',
  ]);
  // …and only there: the Super Admin's own Help lists their reports, not the Student's.
  await myReportsLoaded(page);
  await expect(page.locator('main')).not.toContainText(reference);

  // The new role's actual workspace: its shell, its navigation (its built destinations — the
  // Super Admin's Requests since Package 1A, Overview and Institutions since 1D, Operations since
  // Phase 3 — and Help) and its permissions: the Student's addresses are not part of it.
  await expectShellOf(page, ADMIN);
  await expect(page.locator('aside.xr-side nav a .xr-nav-text')).toHaveText([
    'Overview',
    'Requests',
    'Institutions',
    'Operations',
  ]);
  await expect(sidebarHelp(page)).toHaveAttribute('href', '/admin/help');
  await checkScreen(page);
  await page.locator('main').getByRole('link', { name: 'Report a problem' }).click();
  await page.waitForURL('**/admin/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  await expectShellOf(page, ADMIN);

  // And back: the Student's report is still in the one world.
  await switchTo(page, STUDENT, ADMIN);
  await expect(
    page.locator('main.xr-page ul.xr-rows a.xr-row-link', { hasText: reference }),
  ).toContainText('Open');
  await expectSameTab(page, tab);
});
