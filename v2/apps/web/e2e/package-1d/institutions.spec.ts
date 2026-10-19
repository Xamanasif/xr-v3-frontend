import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  inspectWorld,
  reachAndClick,
  switchIdentity,
  TEST_HOOKS_URL,
} from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  SUPER_ADMIN,
} from '../support/workspace';

/**
 * SA-06 Institutions and SA-07 Institution detail in the owner-approved V3 Refined B design (SA-v1
 * `V.institutions`, `V.institution`; behaviour of B7-02 … B7-04) on the test-hook build, as the
 * Super Admin, at 1440, 1024, 768 and 375 (Phase-1 Package 1D). The world is the walk after Flow
 * C (27 Oct 2026), whose seven institutions stand as the boards draw them. Every drawn state
 * passes `checkState` (axe, one h1, focus, 24 × 24 targets, no sideways scroll); clicks are real
 * pointer clicks reached by scrolling; every command is the port's, and a refusal leaves the
 * world's version where it was. No internal reference (REQ-, ACC-, DTR-) is shown.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const FIXTURE = 'after-flow-c';

async function open(page: Page, path: string): Promise<void> {
  await bootWorld(page, { fixture: FIXTURE, session: SUPER_ADMIN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');

/** The status filter (a native select, as a person picks from it). */
async function chooseStatus(page: Page, value: string): Promise<void> {
  const select = page.getByRole('combobox', { name: 'Status' });
  await reachAndClick(page, select);
  await select.selectOption(value);
}
const status = (page: Page) => main(page).locator('.rk-count[role="status"]');
const rowNames = (page: Page) => main(page).locator('tbody tr a.rk-rowlink').allTextContents();
const flash = (page: Page) => main(page).locator('.rk-notice--ok[role="status"]');
const panel = (page: Page) => page.getByRole('complementary', { name: 'What you can do' });
const internalReference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

interface Detail {
  readonly ok: boolean;
  readonly value: {
    readonly status: string;
    readonly institution: {
      readonly rev: number;
      readonly instituteAdmin: { readonly personId: string; readonly name: string } | null;
    };
    readonly people: {
      readonly studentList: readonly {
        readonly id: string;
        readonly name: string;
        readonly status: string;
        readonly rev: number;
      }[];
    };
  };
}

async function detailOf(page: Page, institutionId: string): Promise<Detail['value']> {
  const answer = await actAs<Detail>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'getInstitution',
    input: institutionId,
  });
  expect(answer.ok).toBe(true);
  return answer.value;
}

// ---- SA-06 -------------------------------------------------------------------------------------

test('SA-06: every institution by name, the status filter and its figures (SA-v1 `V.institutions`)', async ({
  page,
}) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 institutions');
  await checkState(page, 'Institutions');
  await expect(page).toHaveTitle('Institutions · XR Learning Platform');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/institutions');
  await expect(page.getByRole('combobox', { name: 'Status' }).locator('option')).toHaveText([
    'All statuses (7)',
    'Access active (4)',
    'Ending soon (2)',
    'Access paused (1)',
    'Approved — payment required (1)',
    'Access ended (1)',
    'No Institute Admin (1)',
  ]);
  const names = await rowNames(page);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  expect(names).toHaveLength(7);
  const sahyadri = main(page).locator('tbody tr', { hasText: 'Sahyadri Institute of Engineering' });
  await expect(sahyadri.locator('.rk-tag-warn')).toHaveText('Needs one');
  await expect(main(page).locator('.rk-ca-foot')).toHaveText(
    'Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.',
  );
  await expect(main(page)).not.toContainText(internalReference);
  // The table's own layouts: below its breakpoint the head is hidden and each date carries its
  // label inline ("Access ends 29 Sep 2027").
  const headShown = await main(page)
    .locator('table.rk-table thead')
    .evaluate((head) => getComputedStyle(head).display !== 'none');
  await expect(sahyadri.locator('.rk-inlabel')).toBeVisible({ visible: !headShown });
});

test('SA-06: status by pointer, search, no match, chips and Clear filters (SA-v1 `inChip`, `inClear`)', async ({
  page,
}) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 institutions');
  await chooseStatus(page, 'no-institute-admin');
  await expect(status(page)).toHaveText('1 of 7 institutions');
  expect(await rowNames(page)).toEqual(['Sahyadri Institute of Engineering']);
  await expect(main(page).locator('.rk-chip')).toHaveText('Status: No Institute Admin');
  await chooseStatus(page, 'approved-payment-required');
  await expect.poll(() => rowNames(page)).toEqual(['Vizag Polytechnic']);
  await chooseStatus(page, 'access-ended');
  await expect.poll(() => rowNames(page)).toEqual(['Malnad College of Engineering']);
  await checkState(page, 'Institutions');
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Remove filter Status: Access ended' }),
  );
  await expect(status(page)).toHaveText('7 institutions');
  const search = page.getByRole('searchbox', { name: 'Search' });
  await expect(search).toBeFocused();
  await search.fill('Narmada');
  await expect(main(page).getByText('No institutions match')).toBeVisible();
  await expect(status(page)).toHaveText('0 of 7 institutions');
  await checkState(page, 'Institutions');
  await reachAndClick(
    page,
    main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
  );
  await expect(status(page)).toHaveText('7 institutions');
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await search.fill('kulkarni');
  await expect.poll(() => rowNames(page)).toEqual(['Deccan Institute of Technology']);
  await expect(main(page).locator('.rk-chip')).toHaveText('Search: “kulkarni”');
  await reachAndClick(
    page,
    main(page).locator('.rk-statusline').getByRole('button', { name: 'Clear filters' }),
  );
  await expect(status(page)).toHaveText('7 institutions');
});

test('SA-06 → SA-07 by the row, and back by the breadcrumb: one document (SA-v1 LINK-MAP)', async ({
  page,
}) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 institutions');
  const mark = await markDocument(page);
  // A press anywhere on the row opens it (the export's `tr[data-href]`); its link names the row.
  const link = page.getByRole('link', {
    name: 'Konark Polytechnic, Ending soon. Open the institution',
  });
  await expect(link).toHaveAttribute('href', '/admin/institutions/konark');
  await reachAndClick(page, main(page).locator('tbody tr', { has: link }));
  await page.waitForURL('**/admin/institutions/konark');
  const title = page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' });
  await expect(title).toBeVisible();
  // After a move, focus is in the new page's main content (route focus: its heading, or `main`
  // itself while the record was still loading when the address changed).
  expect(
    await page.evaluate(
      () =>
        document.activeElement === document.getElementById('main') ||
        document.activeElement === document.querySelector('main h1'),
    ),
  ).toBe(true);
  await expect(page).toHaveTitle('Konark Polytechnic · Institutions · XR Learning Platform');
  await checkState(page, 'Konark Polytechnic');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/institutions');
  await reachAndClick(
    page,
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Institutions' }),
  );
  await page.waitForURL('**/admin/institutions');
  await expect(status(page)).toHaveText('7 institutions');
  await expectSameDocument(page, mark);
});

// ---- SA-07 -------------------------------------------------------------------------------------

test('SA-07: each drawn state from the shared world (SA-v1 `V.institution`)', async ({ page }) => {
  await open(page, '/admin/institutions/godavari');
  await checkState(page, 'Godavari Institute of Technology');
  await expect(panel(page).getByRole('button')).toHaveText(['Pause access']);
  await expect(panel(page).locator('.sa-attn')).toContainText(
    'Additional licences request under review',
  );
  await expect(page.getByRole('region', { name: 'People' }).getByRole('listitem')).toHaveCount(12);
  await expect(page.getByRole('region', { name: '1 experiment · 120 licences' })).toBeVisible();
  await expect(main(page)).not.toContainText(internalReference);
  // Under 860 px the panel follows the record and "Go to actions" leads to it.
  const goTo = page.getByRole('link', { name: 'Go to actions' });
  if (await goTo.isVisible()) {
    await reachAndClick(page, goTo);
    await expect(panel(page)).toBeInViewport();
  }
  for (const [id, name, buttons, notice, links] of [
    [
      'sahyadri',
      'Sahyadri Institute of Engineering',
      ['Assign Institute Admin', 'Pause access'],
      '.rk-notice--warn',
      [],
    ],
    ['deccan', 'Deccan Institute of Technology', ['Restore access'], '.rk-banner', []],
    ['vizag', 'Vizag Polytechnic', [], null, ['Open request']],
    ['malnad', 'Malnad College of Engineering', [], null, []],
    ['bitshyd', 'BITS Pilani — Hyderabad Campus', ['Pause access'], null, ['Open request']],
    ['konark', 'Konark Polytechnic', ['Pause access'], null, ['Open request']],
  ] as const) {
    await page.evaluate((href) => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        href,
      );
    }, `/admin/institutions/${id}`);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(panel(page).getByRole('button')).toHaveText([...buttons]);
    await expect(panel(page).getByRole('link')).toHaveText([...links]);
    if (notice) await expect(main(page).locator(notice)).toBeVisible();
    await expect(main(page)).not.toContainText(internalReference);
    await checkState(page, name);
  }
  // Ending soon: the plan band's notes (renewal under review; reminder due).
  await expect(main(page).locator('.rk-plan-note--warn')).toContainText(
    'Reminder due. Nothing is sent from here.',
  );
});

test('SA-07 Assign: both errors at once, the identity safeguard, then assigned; the Institute Admin’s own workspace', async ({
  page,
}) => {
  await open(page, '/admin/institutions/sahyadri');
  await checkState(page, 'Sahyadri Institute of Engineering');
  const before = await inspectWorld(page);
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Assign Institute Admin' }));
  const dialog = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Sahyadri Institute of Engineering',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill('n.joshi@sahyadri');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Assign' }));
  await expect(dialog).toContainText('Enter the person’s name');
  await expect(dialog).toContainText('Enter an e-mail address like name@institution.edu.in');
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  await checkState(page, 'Sahyadri Institute of Engineering');
  // An e-mail someone else already signs in with: a field error, nothing assigned (PC-49).
  await dialog.getByRole('textbox', { name: 'Name' }).fill('M. Iyer');
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Assign' }));
  await expect(dialog).toContainText(
    'This e-mail is already used to sign in to the platform. Use a different e-mail.',
  );
  await expect(dialog.getByRole('textbox', { name: 'Work e-mail' })).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  await dialog.getByRole('textbox', { name: 'Name' }).fill('N. Joshi');
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill('n.joshi@sahyadri.edu.in');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Assign' }));
  await expect(dialog).toBeHidden();
  await expect(flash(page)).toHaveText(
    'N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering.Nothing is sent from here. How they first sign in is still open.',
  );
  await expect(flash(page)).toBeFocused();
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: N. Joshi');
  await checkState(page, 'Sahyadri Institute of Engineering');
  // The assigned person's actual access, in this tab and world (CI seam: their own session).
  const assigned = (await detailOf(page, 'sahyadri')).institution.instituteAdmin!;
  await switchIdentity(page, { personId: assigned.personId });
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/institute',
    );
  });
  // Their base is IA-01 Overview since Package 2A (before, the interim landing: Help).
  await page.waitForURL((url) => url.pathname === '/institute');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Account menu, N. Joshi, Institute Admin, Sahyadri Institute of Engineering',
      exact: true,
    }),
  ).toBeAttached();
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/admin/institutions/sahyadri',
    );
  });
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
  await expect(main(page)).not.toContainText('Sahyadri Institute of Engineering');
});

test('SA-07 Pause, then Restore: a reason each time; its people see the paused banner (SA-v1 `pause`, `restore`; B7-04)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/konark');
  await checkState(page, 'Konark Polytechnic');
  await reachAndClick(page, page.getByRole('button', { name: 'Pause access' }));
  const dialog = page.getByRole('dialog', { name: 'Pause access for Konark Polytechnic?' });
  const reason = dialog.getByRole('textbox', { name: 'Reason, kept in the history' });
  await expect(reason).toBeFocused();
  await reachAndClick(page, dialog.getByRole('button', { name: 'Pause access' }));
  await expect(dialog).toContainText('Add a reason — it is kept in the history');
  await expect(reason).toBeFocused();
  await checkState(page, 'Konark Polytechnic');
  await reason.fill('Licence review.');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Pause access' }));
  await expect(flash(page)).toHaveText(
    'Access paused.Everyone at Konark Polytechnic now sees the paused banner. Their work is kept.',
  );
  await expect(flash(page)).toBeFocused();
  await expect(main(page).locator('.rk-banner')).toContainText('Access paused on');
  await checkState(page, 'Konark Polytechnic');
  // Its Institute Admin, in this tab: the shared paused banner (B7-04 f1, XS-08).
  const bhatt = (await detailOf(page, 'konark')).institution.instituteAdmin!;
  await switchIdentity(page, { personId: bhatt.personId });
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/institute/help',
    );
  });
  await expect(page.locator('.rk-banner')).toContainText(
    'Your institution’s access is paused — your work is kept.',
  );
  // Back to the Super Admin: Restore.
  await switchIdentity(page, SUPER_ADMIN);
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/admin/institutions/konark',
    );
  });
  await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible();
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Restore access' }));
  const restore = page.getByRole('dialog', { name: 'Restore access for Konark Polytechnic?' });
  await restore.getByRole('textbox', { name: 'Reason, kept in the history' }).fill('Review done.');
  await reachAndClick(page, restore.getByRole('button', { name: 'Restore access' }));
  await expect(flash(page)).toHaveText('Access restored.Konark Polytechnic can work again.');
  await expect(main(page).locator('.rk-meta')).toContainText('Ending soon');
  expect((await detailOf(page, 'konark')).status).toBe('ending-soon');
});

test('SA-07 elsewhere: a pause made in another session shows at once; a stale command is refused and writes nothing (P1-21)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/konark');
  await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause access' })).toBeVisible();
  const detail = await detailOf(page, 'konark');
  const paused = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: 'konark',
      reason: 'Paused from another tab.',
      expectedRev: detail.institution.rev,
    },
  });
  expect(paused.ok).toBe(true);
  // The shared world: this page reads the pause at once and offers Restore, not Pause.
  await expect(panel(page).getByRole('button', { name: 'Restore access' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause access' })).toHaveCount(0);
  await expect(main(page)).toContainText('“Paused from another tab.”');
  // A command still carrying the old revision is refused, and nothing is written.
  const before = await inspectWorld(page);
  for (const method of ['pauseInstitution', 'restoreInstitution'] as const) {
    const stale = await actAs<{ ok: boolean; error: { kind: string } }>(page, SUPER_ADMIN, {
      port: 'institutions',
      method,
      input: { institutionId: 'konark', reason: 'Again.', expectedRev: detail.institution.rev },
    });
    expect(stale.ok).toBe(false);
    expect(['stale-version', 'invalid-state']).toContain(stale.error.kind);
  }
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  await checkState(page, 'Konark Polytechnic');
});

test('SA-07 student status: an override with a reason sends the listed revision; a stale one is refused (SA-v1 inline form)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/godavari');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Godavari Institute of Technology' }),
  ).toBeVisible();
  const before = await detailOf(page, 'godavari');
  const sneha = before.people.studentList.find((student) => student.name === 'Sneha Reddy')!;
  await reachAndClick(page, page.getByRole('button', { name: 'Change status for Sneha Reddy' }));
  const reason = page.getByRole('textbox', { name: 'Reason for changing the status to Active' });
  await expect(reason).toBeFocused();
  await reachAndClick(page, page.getByRole('button', { name: 'Change to Active' }));
  await expect(page.getByRole('region', { name: 'People' })).toContainText(
    'Add a reason — it is kept in the history',
  );
  await expect(reason).toBeFocused();
  await checkState(page, 'Godavari Institute of Technology');
  await reason.fill('Re-enrolled for Sem II.');
  await reachAndClick(page, page.getByRole('button', { name: 'Change to Active' }));
  await expect(flash(page)).toHaveText(
    'Sneha Reddy is now active.The change and your reason are in the history.',
  );
  await expect(flash(page)).toBeFocused();
  const after = await detailOf(page, 'godavari');
  const changed = after.people.studentList.find((student) => student.id === sneha.id)!;
  expect([changed.status, changed.rev]).toEqual(['active', sneha.rev + 1]);
  // Rahul is changed in another session: this page shows it at once (one world, BC14); the
  // revision this page read before is refused, and nothing is written.
  const rahul = after.people.studentList.find((student) => student.name === 'Rahul Verma')!;
  const elsewhere = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'overrideStudentStatus',
    input: {
      studentId: rahul.id,
      to: 'inactive',
      reason: 'From another tab.',
      expectedRev: rahul.rev,
    },
  });
  expect(elsewhere.ok).toBe(true);
  const people = page.getByRole('region', { name: 'People' });
  await expect(people.getByRole('listitem').filter({ hasText: 'Rahul Verma' })).toContainText(
    'Inactive',
  );
  const version = (await inspectWorld(page)).worldVersion;
  const stale = await actAs<{ ok: boolean; error: { kind: string } }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'overrideStudentStatus',
    input: { studentId: rahul.id, to: 'inactive', reason: 'Again.', expectedRev: rahul.rev },
  });
  expect([stale.ok, stale.error.kind]).toEqual([false, 'stale-version']);
  expect((await inspectWorld(page)).worldVersion).toBe(version);
});

test('SA-07 through the screen: a dialog or status change opened before a change made elsewhere is refused as stale, writes nothing, and focus stays on the page (P1-21)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/godavari');
  const title = page.getByRole('heading', { level: 1, name: 'Godavari Institute of Technology' });
  await expect(title).toBeVisible();
  const before = await detailOf(page, 'godavari');
  // The Pause dialog is open while another session pauses and restores Godavari: the page shows
  // it at once (the same controls, a newer revision) and the dialog keeps the revision it opened
  // with.
  await reachAndClick(page, page.getByRole('button', { name: 'Pause access' }));
  const pause = page.getByRole('dialog', {
    name: 'Pause access for Godavari Institute of Technology?',
  });
  await pause.getByRole('textbox').fill('Checking the student list.');
  const paused = await actAs<{ ok: boolean; value: { rev: number } }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: 'godavari',
      reason: 'Paused from another tab.',
      expectedRev: before.institution.rev,
    },
  });
  expect(paused.ok).toBe(true);
  const restored = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'restoreInstitution',
    input: {
      institutionId: 'godavari',
      reason: 'Restored from another tab.',
      expectedRev: paused.value.rev,
    },
  });
  expect(restored.ok).toBe(true);
  await expect(
    page.getByRole('region', { name: 'History' }).locator('.rk-tl-w').first(),
  ).toHaveText('Access restored by Arjun Mehta');
  await expect(pause).toBeVisible();
  let version = (await inspectWorld(page)).worldVersion;
  await reachAndClick(page, pause.getByRole('button', { name: 'Pause access' }));
  await expect(pause).toBeHidden();
  expect((await inspectWorld(page)).worldVersion).toBe(version);
  expect((await detailOf(page, 'godavari')).status).toBe('access-active');
  await expect(flash(page)).toHaveCount(0);
  await expect(title).toBeFocused();
  // A student's status change opened for "Inactive", while another session deactivates Rahul: the
  // panel keeps its change and revision, and is refused rather than turned into the opposite one.
  const rahul = before.people.studentList.find((student) => student.name === 'Rahul Verma')!;
  expect(rahul.status).toBe('active');
  await reachAndClick(page, page.getByRole('button', { name: 'Change status for Rahul Verma' }));
  const reason = page.getByRole('textbox', { name: 'Reason for changing the status to Inactive' });
  await reason.fill('Paused his studies.');
  const elsewhere = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'overrideStudentStatus',
    input: {
      studentId: rahul.id,
      to: 'inactive',
      reason: 'From another tab.',
      expectedRev: rahul.rev,
    },
  });
  expect(elsewhere.ok).toBe(true);
  const people = page.getByRole('region', { name: 'People' });
  await expect(people.getByRole('listitem').filter({ hasText: 'Rahul Verma' })).toContainText(
    'Inactive',
  );
  await expect(reason).toHaveValue('Paused his studies.');
  version = (await inspectWorld(page)).worldVersion;
  await reachAndClick(page, page.getByRole('button', { name: 'Change to Inactive' }));
  await expect(reason).toBeHidden();
  expect((await inspectWorld(page)).worldVersion).toBe(version);
  await expect(page.getByRole('button', { name: 'Change status for Rahul Verma' })).toBeFocused();
  await checkState(page, 'Godavari Institute of Technology');
});

test('only the Super Admin: another role’s address of SA-06 or SA-07 is “Not your workspace”', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-1440x900', 'One width proves the rule.');
  for (const person of [{ personId: 'per-0001' }, { personId: 'per-0002' }]) {
    const tab = await page.context().newPage();
    await bootWorld(tab, { fixture: FIXTURE, session: person });
    for (const path of ['/admin/institutions', '/admin/institutions/godavari', '/admin']) {
      await tab.goto(path);
      await expect(
        tab.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
      ).toBeVisible();
      await expect(tab.locator('main')).not.toContainText(/Godavari Institute|Konark|Sahyadri/);
    }
    await tab.close();
  }
});
