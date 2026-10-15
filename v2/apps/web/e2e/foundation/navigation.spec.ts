import { expect, type Page, test } from '@playwright/test';

import { actAs, inspectWorld, TEST_HOOKS_URL } from '../support';
import {
  ACCOUNT_LINES,
  expectSameDocument,
  markDocument,
  openAs,
  revealSidebar,
  roleEntry,
  ROLES,
  SUPER_ADMIN,
  sidebarHelp,
  waitForShell,
} from '../support/workspace';

/**
 * Safe interim navigation (ADR-0005 §8; Appendix F §3.3; WP-0.13 acceptance 9), in the browser:
 * - every link a Phase-0 page renders is a link-target ledger entry (`src/nav/link-targets.ts`) —
 *   nothing undocumented, nothing to an unbuilt page except the one recorded dead link;
 * - every ordinary navigation item leads to a built route (Help, and the Super Admin's Requests);
 * - following each link is a client-side navigation: the same document, so the same sample world,
 *   QueryClient and session (no silent reload, ADR-0004);
 * - after a client-side navigation focus is in `main` (the drawer's chosen link is hidden).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = roleEntry('student');

/** Every link in the page (rendered in the DOM), as [accessible name, href]. */
async function links(page: Page): Promise<string[][]> {
  return page
    .locator('a[href]')
    .evaluateAll((anchors) =>
      anchors.map((anchor) => [
        (anchor.getAttribute('aria-label') ?? anchor.textContent ?? '').replace(/\s+/g, ' ').trim(),
        anchor.getAttribute('href') ?? '',
      ]),
    );
}

const SKIP = ['Skip to main content', '#main'];
// `xr-nav-text` + rail tooltip `xr-tip` (text content). Package 2A builds the Student's Home and My
// courses, Phase 3 their Progress, which the sidebar renders before Help.
const SIDEBAR_HELP = ['HelpHelp', '/student/help'];
const SIDEBAR = [
  ['HomeHome', '/student'],
  ['My coursesMy courses', '/student/courses'],
  ['ProgressProgress', '/student/progress'],
  SIDEBAR_HELP,
];
const CRUMB = ['Help & support', '/student/help'];

test.describe('every rendered link is in the link-target ledger', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'The DOM is the same at every width.');

  test('Help — My reports (with reports)', async ({ page }) => {
    await openAs(page, RAHUL.person, '/student/help');
    await expect(page.locator('main.xr-page ul.xr-rows > li')).toHaveCount(1);
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      ['Report a problem', '/student/help/report'],
      [
        'The VR simulation stopped loading at the second stepSUP-0213 · sent 16 OctOpen',
        '/student/help/reports/SUP-0213',
      ],
    ]);
  });

  test('Help — My reports (empty)', async ({ page }) => {
    await openAs(page, roleEntry('vendor').person, '/vendor/help');
    await expect(page.getByRole('heading', { name: 'No reports yet' })).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ['HelpHelp', '/vendor/help'],
      ['Report a problem', '/vendor/help/report'],
    ]);
  });

  test('Report a problem — form, with the error summary, then Report sent', async ({ page }) => {
    await openAs(page, RAHUL.person, '/student/help/report');
    await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
    const form = [
      SKIP,
      ...SIDEBAR,
      CRUMB,
      ['Help & support', '/student/help'],
      ['Cancel', '/student/help'],
    ];
    expect(await links(page)).toEqual(form);
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.locator('main').getByRole('alert')).toBeVisible();
    const withSummary = await links(page);
    expect(withSummary).toContainEqual(['Say what happened', expect.stringMatching(/^#.+-what$/)]);
    await page.getByLabel('What happened?').fill('It froze.');
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      CRUMB,
      ['View my reports', '/student/help'],
      ['Back to Home', '/student'],
    ]);
  });

  test('Report detail', async ({ page }) => {
    await openAs(page, RAHUL.person, '/student/help/reports/SUP-0213');
    await expect(page.getByRole('region', { name: 'History' })).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      CRUMB,
      ['Help & support', '/student/help'],
      ['Report a problem', '/student/help/report'],
    ]);
  });

  test('XS-06, the in-shell PU-15, the banner and the account menu', async ({ page }) => {
    await openAs(page, RAHUL.person, '/faculty/help');
    await expect(
      page.getByRole('heading', { name: 'This page isn’t part of your workspace' }),
    ).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      ['Back to Home', '/student'],
      ['Help', '/student/help'],
    ]);

    await page.evaluate(() => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        '/student/assessments',
      );
    });
    await expect(page.getByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      ['Back to Home', '/student'],
      ['Help', '/student/help'],
    ]);

    const found = await actAs<{ ok: boolean; value: { institution: { id: string; rev: number } } }>(
      page,
      SUPER_ADMIN,
      {
        port: 'institutions',
        method: 'getInstitution',
        input: 'godavari',
      },
    );
    await actAs(page, SUPER_ADMIN, {
      port: 'institutions',
      method: 'pauseInstitution',
      input: {
        institutionId: found.value.institution.id,
        reason: 'Checking.',
        expectedRev: found.value.institution.rev,
      },
    });
    await expect(page.locator('.xr-banner')).toBeVisible();
    await page.getByRole('button', { name: ACCOUNT_LINES.student, exact: true }).click();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      // Phase 3: Rahul holds VR, so the account menu offers My device (kept while paused, B3-07 f8).
      ['My device', '/student/device'],
      ['Help', '/student/help'], // the account menu
      ['Help', '/student/help'], // the banner
      ['Back to Home', '/student'],
      ['Help', '/student/help'],
    ]);
    await expect(page.locator('.xr-menu').getByRole('button')).toHaveText(['Sign out']);
  });
});

test('the sidebar offers built destinations only: Help, the Super Admin’s Overview, Requests, Institutions and Operations, the Institute Admin’s and Student’s destinations of Package 2A and Phase 3, and the Faculty destinations of Phase 4A (B8-06)', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium-1440x900',
    'The DOM is the same at every width.',
  );
  for (const entry of ROLES) {
    const tab = await page.context().newPage();
    await openAs(tab, entry.person, `${entry.base}/help`);
    await waitForShell(tab);
    const side = tab.locator('aside.xr-side');
    if (entry.role === 'super_admin') {
      // SA-02 is built (Package 1A), SA-01 and SA-06 (Package 1D), SA-18 Operations (Phase 3):
      // those four, then Help.
      await expect(side.locator('a[href]')).toHaveCount(5);
      expect(
        await side
          .locator('nav a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual([
        '/admin',
        '/admin/requests',
        '/admin/institutions',
        '/admin/operations/device-transfers',
      ]);
      await expect(side.locator('.xr-side-foot a[href]')).toHaveAttribute('href', '/admin/help');
    } else if (
      entry.role === 'tenant_admin' ||
      entry.role === 'student' ||
      entry.role === 'faculty'
    ) {
      // Package 2A: the Institute Admin's Overview, Content access, Student access and People; the
      // Student's Home and My courses. Phase 3: Requests, Usage and Progress. Phase 4A: the
      // Faculty member's Overview, My courses, Assessments and Question bank (Marking and Students
      // wait for Phase 4B; the Student's Assessments too).
      const built =
        entry.role === 'tenant_admin'
          ? [
              '/institute',
              '/institute/content-access',
              '/institute/student-access',
              '/institute/people',
              '/institute/requests',
              '/institute/usage',
            ]
          : entry.role === 'faculty'
            ? ['/faculty', '/faculty/courses', '/faculty/assessments', '/faculty/question-bank']
            : ['/student', '/student/courses', '/student/progress'];
      expect(
        await side
          .locator('nav a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual(built);
      await expect(side.locator('.xr-side-foot a[href]')).toHaveAttribute(
        'href',
        `${entry.base}/help`,
      );
    } else {
      await expect(side.locator('a[href]')).toHaveCount(1);
      await expect(side.locator('a[href]')).toHaveAttribute('href', `${entry.base}/help`);
      // No empty navigation landmark while nothing else is built (WP-0.8).
      await expect(side.locator('nav')).toHaveCount(0);
    }
    await tab.close();
  }
});

test('following every ledger link is client-side: one document, one world, one session', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/assessments');
  await expect(page.getByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  const mark = await markDocument(page);
  const start = await inspectWorld(page);
  const step = async (click: () => Promise<void>, url: string, heading: string) => {
    await click();
    await page.waitForURL(`${TEST_HOOKS_URL}${url}`);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expectSameDocument(page, mark);
    await expect(page.locator('main.xr-page#main')).toBeFocused();
  };
  const main = page.locator('main');
  // PU-15 → Back to Home (the Student's Home, ST-01, since Package 2A); PU-15 → Help.
  await step(
    () => main.getByRole('link', { name: 'Back to Home' }).click(),
    '/student',
    'Hello, Rahul',
  );
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  await step(
    () => main.getByRole('link', { name: 'Help' }).click(),
    '/student/help',
    'Help & support',
  );
  // My reports → Report a problem → back link / Cancel / crumb.
  await step(
    () => main.getByRole('link', { name: 'Report a problem' }).click(),
    '/student/help/report',
    'Report a problem',
  );
  await step(
    () => main.getByRole('link', { name: 'Help & support' }).click(),
    '/student/help',
    'Help & support',
  );
  await step(
    () => main.getByRole('link', { name: 'Report a problem' }).click(),
    '/student/help/report',
    'Report a problem',
  );
  await step(
    () => main.getByRole('link', { name: 'Cancel' }).click(),
    '/student/help',
    'Help & support',
  );
  // My reports → row → detail → crumb / back / Report a problem.
  await step(
    () => main.locator('a.xr-row-link').first().click(),
    '/student/help/reports/SUP-0213',
    'The VR simulation stopped loading at the second step',
  );
  if (await page.locator('ol.xr-crumbs a').isVisible()) {
    await step(() => page.locator('ol.xr-crumbs a').click(), '/student/help', 'Help & support');
    await step(
      () => main.locator('a.xr-row-link').first().click(),
      '/student/help/reports/SUP-0213',
      'The VR simulation stopped loading at the second step',
    );
  }
  await step(() => main.locator('a.xr-back').click(), '/student/help', 'Help & support');
  await step(
    () => main.locator('a.xr-row-link').first().click(),
    '/student/help/reports/SUP-0213',
    'The VR simulation stopped loading at the second step',
  );
  await step(
    () => main.getByRole('link', { name: 'Report a problem' }).click(),
    '/student/help/report',
    'Report a problem',
  );
  // Send → Sent (in place) → Back to Home (ST-01 since Package 2A).
  await page.getByLabel('What happened?').fill('A link went nowhere.');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
  await step(
    () => main.getByRole('link', { name: 'Back to Home' }).click(),
    '/student',
    'Hello, Rahul',
  );
  // The account menu's Help and the sidebar's Help.
  await page.getByRole('button', { name: ACCOUNT_LINES.student, exact: true }).click();
  await step(
    () => page.locator('.xr-menu').getByRole('link', { name: 'Help' }).click(),
    '/student/help',
    'Help & support',
  );
  await revealSidebar(page);
  await sidebarHelp(page).click();
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  await expectSameDocument(page, mark);

  const end = await inspectWorld(page);
  expect(end).toMatchObject({ seedId: start.seedId, attached: 1, session: start.session });
  expect(end.worldVersion).toBe(start.worldVersion + 1); // the one report sent
});

test('choosing a destination in the drawer moves focus to the new page, never to a hidden link', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium-375x812',
    'The drawer is the sidebar below 1024 px.',
  );
  await openAs(page, RAHUL.person, '/student/help/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await sidebarHelp(page).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/student/help');
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  // The same destination again: the page does not change, focus still leaves the hidden drawer.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await sidebarHelp(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('a document load starts on the skip link: no focus is moved on arrival', async ({ page }) => {
  await openAs(page, roleEntry('content_manager').person, '/content-manager');
  await page.waitForURL('**/content-manager/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await expect(page.locator('main.xr-page#main')).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});
