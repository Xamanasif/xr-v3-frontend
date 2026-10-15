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
 * SA-06 Institutions (B7-02) and SA-07 Institution detail (B7-03, B7-04) on the test-hook build, as
 * the Super Admin, at 1440, 1024, 768 and 375 (Phase-1 Package 1D). The world is the walk after
 * Flow C (27 Oct 2026), whose seven institutions stand as the B7 boards draw them on 23 Oct. Every
 * drawn state passes `checkState` (axe, one h1, focus, 24 × 24 targets, no sideways scroll); clicks
 * are real pointer clicks reached by scrolling; every command is the port's, and a refusal leaves
 * the world's version where it was.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const FIXTURE = 'after-flow-c';

async function open(page: Page, path: string): Promise<void> {
  await bootWorld(page, { fixture: FIXTURE, session: SUPER_ADMIN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');

/**
 * A status tab by a real pointer click: the strip scrolls sideways below 1024 px (B7-02 f6 "tabs
 * scroll sideways"), so it is swiped to the tab first, as a person would, then clicked.
 */
async function chooseTab(page: Page, name: string): Promise<void> {
  const tab = page.getByRole('tab', { name });
  await tab.evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  await reachAndClick(page, tab);
}
const status = (page: Page) => page.locator('.xr-toolbar-status [role="status"]');
const rowNames = (page: Page) => main(page).locator('tbody tr strong').allTextContents();
const flash = (page: Page) => main(page).locator('p.xa-save[role="status"]');

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

test('SA-06: every institution, the drawn tabs and figures (B7-02 f0, f6)', async ({ page }) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 of 7 institutions');
  await checkState(page, 'Institutions');
  await expect(page).toHaveTitle('Institutions · XR Learning Platform');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/institutions');
  await expect(page.getByRole('tab')).toHaveText([
    'All 7',
    'Access active 4',
    'Ending soon 2',
    'Paused 1',
    'Awaiting payment 1',
    'No Institute Admin 1',
  ]);
  expect(await rowNames(page)).toHaveLength(7);
  const sahyadri = main(page).locator('tbody tr', { hasText: 'Sahyadri Institute of Engineering' });
  await expect(sahyadri).toContainText('Not assigned');
  await expect(sahyadri.locator('.xw-tag--warn')).toHaveText('Needs one');
  await expect(main(page)).toContainText(
    'Institutions are created only by approving a request — there is no direct creation',
  );
  await expect(main(page)).not.toContainText('(T-09)');
  // Below 760 px of content the rows are labelled blocks: each value carries its column's name.
  const content = await main(page)
    .locator('.xr-content')
    .evaluate((element) => element.getBoundingClientRect().width);
  const label = await sahyadri
    .locator('td[data-label="Institute Admin"]')
    .evaluate((cell) => getComputedStyle(cell, '::before').content);
  if (content < 760) expect(label).toContain('Institute Admin');
  else expect(['none', 'normal', '']).toContain(label);
});

test('SA-06: tabs by pointer and by keyboard, search, no match, Clear filters (B7-02 f2 … f4)', async ({
  page,
}) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 of 7 institutions');
  await chooseTab(page, 'No Institute Admin 1');
  await expect(status(page)).toHaveText('1 of 7 institutions');
  expect(await rowNames(page)).toEqual(['Sahyadri Institute of Engineering']);
  // ← moves to the previous tab and selects it (board 12 "Patterns"); one tab stop.
  await expect(page.getByRole('tab', { name: 'No Institute Admin 1' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Awaiting payment 1' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Awaiting payment 1' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect.poll(() => rowNames(page)).toEqual(['Vizag Polytechnic']);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => rowNames(page)).toEqual(['Deccan Institute of Technology']);
  await checkState(page, 'Institutions');
  await reachAndClick(page, page.getByRole('button', { name: 'Clear filters' }));
  await expect(status(page)).toHaveText('7 of 7 institutions');
  const search = page.getByRole('searchbox', { name: 'Search institutions' });
  await reachAndClick(page, search);
  await search.fill('Narmada');
  await expect(main(page).getByRole('heading', { name: 'No institutions match' })).toBeVisible();
  await expect(status(page)).toHaveText('0 of 7 institutions');
  await checkState(page, 'Institutions');
  await reachAndClick(
    page,
    main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
  );
  await expect(status(page)).toHaveText('7 of 7 institutions');
  await expect(search).toHaveValue('');
  await search.fill('kulkarni');
  await expect.poll(() => rowNames(page)).toEqual(['Deccan Institute of Technology']);
});

test('SA-06 → SA-07 by the row’s Open, and back: one document (B7-02 → B7-03)', async ({
  page,
}) => {
  await open(page, '/admin/institutions');
  await expect(status(page)).toHaveText('7 of 7 institutions');
  const mark = await markDocument(page);
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open Godavari Institute of Technology' }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Godavari Institute of Technology' }),
  ).toBeVisible();
  // After a move, focus is in the new page's main content (route focus, WP-0.13).
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  await expect(page).toHaveTitle(
    'Godavari Institute of Technology · Institutions · XR Learning Platform',
  );
  await checkState(page, 'Godavari Institute of Technology');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/institutions');
  await reachAndClick(page, main(page).locator('a.xr-back'));
  await page.waitForURL('**/admin/institutions');
  await expect(status(page)).toHaveText('7 of 7 institutions');
  await expectSameDocument(page, mark);
});

// ---- SA-07 -------------------------------------------------------------------------------------

test('SA-07: each drawn state from the shared world (B7-03 f0 … f5, f9)', async ({ page }) => {
  await open(page, '/admin/institutions/godavari');
  await checkState(page, 'Godavari Institute of Technology');
  const actions = main(page).locator('.xw-actions').first();
  await expect(actions.locator('.xr-btn')).toHaveText(['Pause access', 'Open request REQ-0042']);
  await expect(page.getByRole('region', { name: 'Needs attention' })).toContainText(
    'REQ-0058 additional licences — under review',
  );
  await expect(page.getByRole('region', { name: 'People' }).getByRole('listitem')).toHaveCount(12);
  for (const [id, name, buttons, notice] of [
    [
      'sahyadri',
      'Sahyadri Institute of Engineering',
      ['Assign Institute Admin', 'Pause access', 'Open request REQ-0033'],
      'No Institute Admin',
    ],
    [
      'deccan',
      'Deccan Institute of Technology',
      ['Restore access', 'Open request REQ-0029'],
      'Access paused',
    ],
    ['vizag', 'Vizag Polytechnic', ['Open request REQ-0037'], null],
    ['malnad', 'Malnad College of Engineering', ['Open request REQ-0027'], null],
    ['bitshyd', 'BITS Pilani — Hyderabad Campus', ['Pause access', 'Open request REQ-0039'], null],
  ] as const) {
    await page.evaluate((href) => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        href,
      );
    }, `/admin/institutions/${id}`);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(main(page).locator('.xw-actions').first().locator('.xr-btn')).toHaveText([
      ...buttons,
    ]);
    if (notice) await expect(main(page).locator('.xr-notice-title').first()).toHaveText(notice);
    await checkState(page, name);
  }
});

test('SA-07 Assign: both errors at once, then assigned; the Institute Admin’s own workspace (B7-03 f1, f6)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/sahyadri');
  await checkState(page, 'Sahyadri Institute of Engineering');
  const before = await inspectWorld(page);
  await reachAndClick(
    page,
    main(page).locator('.xw-actions').getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const dialog = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Sahyadri Institute of Engineering',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await expect(dialog).not.toContainText('(T-11)');
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill('n.joshi@sahyadri');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Assign' }));
  await expect(dialog).toContainText('Enter the person’s name');
  await expect(dialog).toContainText('Enter an e-mail address like name@institution.edu.in');
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  await checkState(page, 'Sahyadri Institute of Engineering');
  await dialog.getByRole('textbox', { name: 'Name' }).fill('N. Joshi');
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill('n.joshi@sahyadri.edu.in');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Assign' }));
  await expect(dialog).toBeHidden();
  await expect(flash(page)).toHaveText(
    'N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering. Nothing is sent from here — how they first sign in is still open.',
  );
  await expect(flash(page)).toBeFocused();
  await expect(main(page).locator('.xr-phead-meta')).toContainText('Institute Admin: N. Joshi');
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
      name: 'Account menu: N. Joshi, Institute Admin, Sahyadri Institute of Engineering',
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

test('SA-07 Pause, then Restore: a reason each time; its people see the paused banner (B7-03 f7; B7-04)', async ({
  page,
}) => {
  await open(page, '/admin/institutions/konark');
  await checkState(page, 'Konark Polytechnic');
  await reachAndClick(page, page.getByRole('button', { name: 'Pause access' }));
  const dialog = page.getByRole('dialog', { name: 'Pause access for Konark Polytechnic?' });
  const reason = dialog.getByRole('textbox', { name: 'Reason — kept in the history' });
  await expect(reason).toBeFocused();
  await reachAndClick(page, dialog.getByRole('button', { name: 'Pause access' }));
  await expect(dialog).toContainText('Add a reason — it is kept in the history');
  await expect(reason).toBeFocused();
  await checkState(page, 'Konark Polytechnic');
  await reason.fill('Licence review.');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Pause access' }));
  await expect(flash(page)).toHaveText(
    'Access paused. Everyone at Konark Polytechnic now sees the paused banner.',
  );
  await expect(flash(page)).toBeFocused();
  await expect(main(page).locator('.xr-notice-title').first()).toHaveText('Access paused');
  await checkState(page, 'Konark Polytechnic');
  // Its Institute Admin, in this tab: the shared paused banner (B7-04 f1, XS-08).
  const bhatt = (await detailOf(page, 'konark')).institution.instituteAdmin!;
  await switchIdentity(page, { personId: bhatt.personId });
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/institute/help',
    );
  });
  await expect(page.locator('.xr-banner')).toContainText(
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
  await reachAndClick(
    page,
    main(page).locator('.xw-actions').getByRole('button', { name: 'Restore access' }),
  );
  const restore = page.getByRole('dialog', { name: 'Restore access for Konark Polytechnic?' });
  await restore.getByRole('textbox', { name: 'Reason — kept in the history' }).fill('Review done.');
  await reachAndClick(page, restore.getByRole('button', { name: 'Restore access' }));
  await expect(flash(page)).toHaveText('Access restored. Konark Polytechnic can work again.');
  await expect(main(page).locator('.xr-phead-meta')).toContainText('Ending soon');
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
  await expect(
    main(page).locator('.xw-actions').getByRole('button', { name: 'Restore access' }),
  ).toBeVisible();
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

test('SA-07 student status: an override with a reason sends the listed revision; a stale one is refused (B7-03 f8)', async ({
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
  await expect(flash(page)).toHaveText('Sneha Reddy is now active.');
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
    page.getByRole('region', { name: 'History' }).locator('.xr-tl-what').first(),
  ).toHaveText('Access restored by Arjun Mehta');
  await expect(pause).toBeVisible();
  let version = (await inspectWorld(page)).worldVersion;
  await reachAndClick(page, pause.getByRole('button', { name: 'Pause access' }));
  await expect(pause).toBeHidden();
  expect((await inspectWorld(page)).worldVersion).toBe(version);
  expect((await detailOf(page, 'godavari')).status).toBe('access-active');
  await expect(flash(page)).toHaveText('');
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
