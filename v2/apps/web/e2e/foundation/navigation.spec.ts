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
  ['AssessmentsAssessments', '/student/assessments'],
  ['ProgressProgress', '/student/progress'],
  SIDEBAR_HELP,
];
// The Help views' own breadcrumb, in the page (XS `XsHelp`): the shell's top bar names the view.
const CRUMB = ['Help & support', '/student/help'];

test.describe('every rendered link is in the link-target ledger', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'The DOM is the same at every width.');

  test('Help — My reports (with reports)', async ({ page }) => {
    await openAs(page, RAHUL.person, '/student/help');
    await expect(page.locator('main.xr-page ul.xs-reports > li')).toHaveCount(1);
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      ['Report a problem', '/student/help/report'],
      [
        'The VR simulation stopped loading at the second stepSUP-0213 · Sent 16 Oct 2026Open',
        '/student/help/reports/SUP-0213',
      ],
    ]);
  });

  test('Help — My reports (empty)', async ({ page }) => {
    await openAs(page, roleEntry('vendor').person, '/vendor/help');
    await expect(page.getByText('No reports yet')).toBeVisible();
    // The Vendor's V3 rail (VE-v1): Overview and My experiments, then Help & support in its foot.
    expect(await links(page)).toEqual([
      SKIP,
      ['Overview', '/vendor'],
      ['My experiments', '/vendor/experiments'],
      ['Help & support', '/vendor/help'],
      ['Report a problem', '/vendor/help/report'],
    ]);
  });

  test('Report a problem — form, with the error summary, then Report sent', async ({ page }) => {
    await openAs(page, RAHUL.person, '/student/help/report');
    await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible();
    const form = [SKIP, ...SIDEBAR, CRUMB, ['Cancel', '/student/help']];
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
    await expect(
      page.locator('.rk-sec', {
        has: page.getByRole('heading', { name: 'History', exact: true }),
      }),
    ).toBeVisible();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      CRUMB,
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
        '/student/catalogue',
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
    await expect(page.locator('.rk-banner')).toBeVisible();
    await page.getByRole('button', { name: ACCOUNT_LINES.student, exact: true }).click();
    expect(await links(page)).toEqual([
      SKIP,
      ...SIDEBAR,
      // Phase 3: Rahul holds VR, so the account menu offers My device (kept while paused, B3-07 f8).
      ['My device', '/student/device'],
      ['Help & support', '/student/help'], // the account menu
      ['Help', '/student/help'], // the banner
      ['Back to Home', '/student'],
      ['Help', '/student/help'],
    ]);
    await expect(page.locator('.xs-menu').getByRole('button')).toHaveText(['Sign out']);
  });
});

test('the sidebar offers built destinations only — since Phase 6 every designed destination of every workspace, then Help (B8-06)', async ({
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
    // The v46 sidebar, or a V3 rail (the Super Admin's SA-v1, the Vendor's VE-v1, the Content
    // Manager's CM-v1, the Academic Reviewer's RV-v1, the Institute Admin's IA-v1, the Faculty
    // member's FA-v1), whose Help sits in a navigation of its own in the rail foot.
    const side = tab.locator('aside.xr-side, aside.rb-rail');
    if (entry.role === 'vendor') {
      // VE-01 Overview and VE-02 My experiments, then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(3);
      expect(
        await side
          .locator('nav[aria-label="Vendor navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual(['/vendor', '/vendor/experiments']);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute('href', '/vendor/help');
    } else if (entry.role === 'content_manager') {
      // CM-01, CM-02, CM-04, CM-09 (Phase 5) and CM-08 Updates (Phase 6), then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(6);
      expect(
        await side
          .locator('nav[aria-label="Content Manager navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual([
        '/content-manager',
        '/content-manager/ready',
        '/content-manager/library',
        '/content-manager/updates',
        '/content-manager/course-codes',
      ]);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute(
        'href',
        '/content-manager/help',
      );
    } else if (entry.role === 'academic_reviewer') {
      // RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (Phase 5), then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(4);
      expect(
        await side
          .locator('nav[aria-label="Academic Reviewer navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual(['/reviewer', '/reviewer/queue', '/reviewer/reviewed']);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute('href', '/reviewer/help');
    } else if (entry.role === 'tenant_admin') {
      // Package 2A: Overview, Content access, Student access and People; Phase 3: Requests and
      // Usage. Then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(7);
      expect(
        await side
          .locator('nav[aria-label="Institute Admin navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual([
        '/institute',
        '/institute/content-access',
        '/institute/student-access',
        '/institute/people',
        '/institute/requests',
        '/institute/usage',
      ]);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute(
        'href',
        '/institute/help',
      );
    } else if (entry.role === 'faculty') {
      // Phase 4A: Overview, My courses, Assessments and Question bank; Phase 4B: Marking and
      // Students. Then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(7);
      expect(
        await side
          .locator('nav[aria-label="Faculty navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual([
        '/faculty',
        '/faculty/courses',
        '/faculty/assessments',
        '/faculty/question-bank',
        '/faculty/marking',
        '/faculty/students',
      ]);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute('href', '/faculty/help');
    } else if (entry.role === 'super_admin') {
      // SA-02 (Package 1A), SA-01 and SA-06 (Package 1D), SA-18 Operations (Phase 3), Content,
      // Academic structure and Platform roles (Phase 6): all seven, then Help & support.
      await expect(side.locator('a[href]')).toHaveCount(8);
      expect(
        await side
          .locator('nav[aria-label="Super Admin navigation"] a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual([
        '/admin',
        '/admin/requests',
        '/admin/institutions',
        '/admin/content/updates',
        '/admin/structure',
        '/admin/roles',
        '/admin/operations/device-transfers',
      ]);
      await expect(side.locator('.rb-rail-foot a[href]')).toHaveAttribute('href', '/admin/help');
    } else {
      // Package 2A: the Student's Home and My courses. Phase 3: Progress. Phase 4B: the Student's
      // Assessments. (The Institute Admin's and the Faculty member's destinations and Phase 5's
      // Vendor, Content Manager and Academic Reviewer destinations are in the V3 rail, above.)
      expect(
        await side
          .locator('nav a[href]')
          .evaluateAll((items) => items.map((item) => item.getAttribute('href'))),
      ).toEqual(['/student', '/student/courses', '/student/assessments', '/student/progress']);
      await expect(side.locator('.xr-side-foot a[href]')).toHaveAttribute(
        'href',
        `${entry.base}/help`,
      );
    }
    await tab.close();
  }
});

test('following every ledger link is client-side: one document, one world, one session', async ({
  page,
}) => {
  await openAs(page, RAHUL.person, '/student/catalogue');
  await expect(page.getByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  const mark = await markDocument(page);
  const start = await inspectWorld(page);
  // After a client-side move focus is in the new page: `main` on a v46 page; the page's own H1 on
  // an Entry & shared page drawn in V3 (Help: the XS export's shell patch XS-P2).
  const step = async (click: () => Promise<void>, url: string, heading: string) => {
    await click();
    await page.waitForURL(`${TEST_HOOKS_URL}${url}`);
    const title = page.getByRole('heading', { level: 1, name: heading });
    await expect(title).toBeVisible();
    await expectSameDocument(page, mark);
    if (url.includes('/help')) await expect(title).toBeFocused();
    else await expect(page.locator('main.xr-page#main')).toBeFocused();
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
  // My reports → Report a problem → its breadcrumb / Cancel.
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
  // My reports → row → detail → its breadcrumb / Report a problem.
  await step(
    () => main.locator('a.xs-report').first().click(),
    '/student/help/reports/SUP-0213',
    'The VR simulation stopped loading at the second step',
  );
  await step(() => main.locator('nav.rk-crumbs a').click(), '/student/help', 'Help & support');
  await step(
    () => main.locator('a.xs-report').first().click(),
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
    () => page.locator('.xs-menu').getByRole('link', { name: 'Help & support' }).click(),
    '/student/help',
    'Help & support',
  );
  await revealSidebar(page);
  await sidebarHelp(page).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeFocused();
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
  // Help is an Entry & shared page drawn in V3: focus lands on its H1 (XS-P2).
  const title = page.getByRole('heading', { level: 1, name: 'Help & support' });
  await expect(title).toBeFocused();
  // The same destination again: the page does not change, focus still leaves the hidden drawer.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await sidebarHelp(page).focus();
  await page.keyboard.press('Enter');
  await expect(title).toBeFocused();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('a document load starts on the skip link: no focus is moved on arrival', async ({ page }) => {
  await openAs(page, roleEntry('content_manager').person, '/content-manager');
  // Phase 5: the Content Manager's home is CM-01 Overview (a V3 page since CM-v1).
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(page.locator('main#main')).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});
