import { expect, type Page, test } from '@playwright/test';

import { actAs, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import {
  expectSameDocument,
  markDocument,
  openAs,
  revealSidebar,
  roleEntry,
  ROLES,
  sidebarHelp,
  waitForShell,
} from '../support/workspace';

/**
 * XS-07 Help & support, connected (Appendix F WP-0.13 acceptance 2, 7; board 07), at the four
 * widths, on the dedicated test-hook build: the report form sends through the session's
 * OperationsService (the service validates); "Report sent" carries the reference the shared world
 * gave the report; My reports and the detail read it back — all by client-side navigation in ONE
 * document, so the tab keeps the same world, the same QueryClient and the same session (the
 * WP-0.12 open item: a real route-to-route proof). `reachAndClick` presses "Send report" with a
 * real pointer.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = roleEntry('student');

async function worldIdentity(page: Page) {
  const world = await inspectWorld(page);
  return {
    seedId: world.seedId,
    attached: world.attached,
    session: world.session,
    worldVersion: world.worldVersion,
  };
}

/** A QueryClient marker: an object kept on the tab's one QueryClient survives client navigation. */
async function markQueryClient(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __xrQueryClientProbe?: number }).__xrQueryClientProbe = Date.now();
  });
}

test('the seven steps on one world: report, Sent with SUP reference, My reports, detail — no reload', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/progress');
  // 1. Opens Help (from a page outside Help: the in-shell not-found of an unbuilt address).
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  const mark = await markDocument(page);
  await markQueryClient(page);
  const before = await worldIdentity(page);
  expect(before).toMatchObject({
    seedId: 'after-flow-d',
    attached: 1,
    session: { status: 'signed-in', personId: 'per-0002' },
  });
  await revealSidebar(page);
  await sidebarHelp(page).click();
  await page.waitForURL('**/student/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await expect(page.locator('main.xr-page ul.xr-rows > li')).toHaveCount(1);

  // 2. Submits a report (from the header's "Report a problem").
  await page.locator('main').getByRole('link', { name: 'Report a problem' }).click();
  await page.waitForURL('**/student/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  await expect(page.getByLabel('Where did it happen?')).toHaveValue('Not found');
  await page.getByLabel('What happened?').fill('My reports took a long time to appear.');
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));

  // 3. The confirmation carries the SUP reference the world gave the report.
  const sent = page.getByRole('heading', { level: 1, name: 'Report sent' });
  await expect(sent).toBeVisible();
  const reference = (await page.locator('main .xr-msg .xr-id').textContent())!;
  expect(reference).toMatch(/^SUP-\d{4}$/);
  expect(reference).not.toBe('SUP-0213');
  await expect(page.locator('main .xr-msg')).toBeFocused();
  await expect(page).toHaveURL(`${TEST_HOOKS_URL}/student/help/report`);
  const afterSend = await worldIdentity(page);
  expect(afterSend.worldVersion).toBe(before.worldVersion + 1);

  // 4. Navigates to My reports. 5. The same report is there.
  await page.getByRole('link', { name: 'View my reports' }).click();
  await page.waitForURL('**/student/help');
  const rows = page.locator('main.xr-page ul.xr-rows a.xr-row-link');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText(reference);
  await expect(rows.first()).toContainText('My reports took a long time to appear');
  await expect(rows.first()).toContainText('Open');

  // 6. Opens the detail. 7. The report is intact.
  await rows.first().click();
  await page.waitForURL(`**/student/help/reports/${reference}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'My reports took a long time to appear' }),
  ).toBeVisible();
  await expect(page.locator('.xr-phead .xr-id')).toHaveText(reference);
  const reported = page.getByRole('region', { name: 'What you reported' });
  await expect(reported).toContainText('My reports took a long time to appear.');
  await expect(reported).toContainText('Not found');
  await expect(reported).toContainText('No screenshot added');
  await expect(page.getByRole('region', { name: 'History' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);

  // The same document, world instance, QueryClient and session throughout.
  await expectSameDocument(page, mark);
  expect(
    await page.evaluate(
      () => typeof (window as unknown as { __xrQueryClientProbe?: number }).__xrQueryClientProbe,
    ),
  ).toBe('number');
  const end = await worldIdentity(page);
  expect(end).toEqual({ ...before, worldVersion: before.worldVersion + 1 });
  // Nothing of the world or the session was put in browser storage (ADR-0004).
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookie: '' });
});

test('validation: the service refuses an empty "What happened" with board 07’s words; nothing is written', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  const before = await worldIdentity(page);
  await page.getByLabel('What happened?').fill('   ');
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  // In main: Next's route announcer is a `role="alert"` region of its own.
  const summary = page.locator('main').getByRole('alert');
  await expect(summary).toContainText('One thing needs fixing');
  await expect(summary).toBeFocused();
  await expect(page.getByText('Say what happened, so it can be looked into')).toBeVisible();
  await expect(page.getByLabel('What happened?')).toHaveAttribute('aria-invalid', 'true');
  // The summary link moves focus to the field (board 12 "Errors").
  await summary.getByRole('link', { name: 'Say what happened' }).click();
  await expect(page.getByLabel('What happened?')).toBeFocused();
  expect((await worldIdentity(page)).worldVersion).toBe(before.worldVersion);
  await expect(page.getByRole('heading', { name: 'Report sent' })).toHaveCount(0);
});

test('the screenshot field keeps the file NAME only; nothing is uploaded', async ({ page }) => {
  await openAs(page, RAHUL.person, '/student/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  const uploads: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') uploads.push(`${request.method()} ${request.url()}`);
  });
  await page.getByLabel('What happened?').fill('The page went blank.');
  await page.getByLabel(/^Screenshot/).setInputFiles({
    name: 'blank-page.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not really a picture'),
  });
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
  const reference = (await page.locator('main .xr-msg .xr-id').textContent())!;
  const read = await actAs<{ ok: boolean; value: { screenshotFileName: string | null } }>(
    page,
    RAHUL.person,
    {
      port: 'operations',
      method: 'getMyReport',
      input: reference,
    },
  );
  expect(read).toMatchObject({ ok: true, value: { screenshotFileName: 'blank-page.png' } });
  expect(JSON.stringify(read)).not.toContain('not really a picture');
  expect(uploads).toEqual([]);
});

test('My reports holds only the signed-in person’s reports; another person’s report is not found', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/help');
  await expect(page.locator('main.xr-page ul.xr-rows a.xr-row-link')).toHaveCount(1);
  // Kavya's SUP-0207 exists in this world …
  const kavyas = await actAs<{ ok: boolean; value: { id: string }[] }>(
    page,
    roleEntry('content_manager').person,
    {
      port: 'operations',
      method: 'listMyReports',
    },
  );
  expect(kavyas.value.map((report) => report.id)).toEqual(['SUP-0207']);
  // … but it is neither listed nor reachable for Rahul: the in-shell not-found, nothing revealed.
  await expect(page.locator('main')).not.toContainText('SUP-0207');
  const mark = await markDocument(page);
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/student/help/reports/SUP-0207',
    );
  });
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('preview');
  await expectSameDocument(page, mark);
});

test('a receipt refreshes the open page; another person’s report never joins Rahul’s list', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/help');
  const rows = page.locator('main.xr-page ul.xr-rows a.xr-row-link');
  await expect(rows).toHaveCount(1);
  // Rahul, in a session of his own (as from another tab of the same world): his open My reports
  // refreshes from the receipt (`changed: SUP`) — no reload, no polling.
  const his = await actAs<{ ok: boolean; value: { id: string } }>(page, RAHUL.person, {
    port: 'operations',
    method: 'reportProblem',
    input: { whatHappened: 'The list did not refresh.', where: null, screenshotFileName: null },
  });
  expect(his.ok).toBe(true);
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText(his.value.id);
  // A Faculty member's report refreshes the same reads, and is not Rahul's.
  const made = await actAs<{ ok: boolean; value: { id: string } }>(
    page,
    roleEntry('faculty').person,
    {
      port: 'operations',
      method: 'reportProblem',
      input: {
        whatHappened: 'The marking list did not load.',
        where: null,
        screenshotFileName: null,
      },
    },
  );
  expect(made.ok).toBe(true);
  await expect(rows).toHaveCount(2);
  await expect(page.locator('main')).not.toContainText(made.value.id);
  const facultys = await actAs<{ ok: boolean; value: { id: string }[] }>(
    page,
    roleEntry('faculty').person,
    { port: 'operations', method: 'listMyReports' },
  );
  expect(facultys.value.map((report) => report.id)).toEqual([made.value.id]);
});

test('report detail states from the world: reopened (SUP-0207) and resolved with its note', async ({
  page,
}) => {
  await openAs(page, roleEntry('content_manager').person, '/content-manager/help/reports/SUP-0207');
  await expect(page.getByText('This report is open again')).toBeVisible();
  await expect(page.getByText('It was reopened on 6 Oct. You can follow it here.')).toBeVisible();
  const history = page.getByRole('region', { name: 'History' }).getByRole('listitem');
  await expect(history).toHaveText([
    /Reopened\s*6 Oct/,
    /Resolved\s*30 Sep · “The preview now loads\. Please try again\.”/,
    /Sent\s*28 Sep/,
  ]);
  // Resolved by the Super Admin in this world: the Content Manager reads the note first.
  const current = await actAs<{ ok: boolean; value: { rev: number } }>(
    page,
    roleEntry('content_manager').person,
    {
      port: 'operations',
      method: 'getMyReport',
      input: 'SUP-0207',
    },
  );
  const resolved = await actAs(page, roleEntry('super_admin').person, {
    port: 'operations',
    method: 'resolveReport',
    input: {
      id: 'SUP-0207',
      note: 'The preview loads again after the fix.',
      expectedRev: current.value.rev,
    },
  });
  expect(resolved).toMatchObject({ ok: true });
  await expect(page.getByText(/^Resolution note · /)).toBeVisible();
  await expect(page.locator('.xr-notice--ok')).toContainText(
    '“The preview loads again after the fix.”',
  );
  await expect(page.getByText('This report is open again')).toHaveCount(0);
  await expect(history.first()).toHaveText(/Resolved\s*.* · resolution note added/);
});

test.describe('the same Help template in all seven workspaces', () => {
  for (const entry of ROLES) {
    test(`${entry.label}: My reports at ${entry.base}/help, Help current`, async ({ page }) => {
      await openAs(page, entry.person, `${entry.base}/help`);
      await waitForShell(page);
      await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'My reports' })).toBeVisible();
      await expect(
        page.getByText('Something isn’t working? Report it here and follow what happens.'),
      ).toBeVisible();
      await expect(sidebarHelp(page)).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveTitle('Help & support · XR Learning Platform');
      const report = page.locator('main').getByRole('link', { name: 'Report a problem' });
      await expect(report).toHaveAttribute('href', `${entry.base}/help/report`);
    });
  }
});

test('the interim landing: /<base> lands on that workspace’s Help (ADR-0005 §8)', async ({
  page,
}) => {
  await openAs(page, roleEntry('vendor').person, '/vendor');
  await page.waitForURL('**/vendor/help');
  await expect(page.getByRole('heading', { level: 3, name: 'No reports yet' })).toBeVisible();
  const report = page.locator('main .xr-empty').getByRole('link', { name: 'Report a problem' });
  await expect(report).toHaveAttribute('href', '/vendor/help/report');
});

test('/<base>/help/reports redirects to /<base>/help (Appendix A §3.7 row 20)', async ({
  page,
}) => {
  await openAs(page, roleEntry('faculty').person, '/faculty/help/reports');
  await page.waitForURL('**/faculty/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
});
