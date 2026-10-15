import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, TEST_HOOKS_URL } from '../support';
import {
  expectSameDocument,
  markDocument,
  openAs,
  ROLES,
  roleEntry,
  sidebarHelp,
  waitForShell,
} from '../support/workspace';

/**
 * PU-15 (Appendix F WP-0.13 acceptance 4; board 08), at the four widths. The public variant
 * answers 404 at every address outside the workspaces (the product build, no session needed); the
 * workspace variant renders in the person's own shell for unknown and for designed-but-unbuilt
 * workspace addresses — with HTTP 200, a recorded sample-mode limitation (spikes S1/S1b) — with
 * nothing current, "Back to Home" through the interim landing and Help to the built Help.
 */

test.describe('public variant (product build)', () => {
  // `/sign-in` and `/signed-out` are built in Phase-1 Package 1A (XS-01, XS-03): see
  // `e2e/package-1a/sign-in.spec.ts`; `/`, `/areas[/…]`, `/courses/…` and `/experiments[/…]` in
  // Package 1B (`e2e/package-1b/`); `/selection`, `/request-access[/sent]` and
  // `/requests/[requestId][/payment]` in Package 1C (`e2e/package-1c/`). Around them, nothing.
  for (const path of [
    '/nope',
    '/sign-in/elsewhere',
    '/selection/x',
    '/request-access/elsewhere',
    '/requests',
    '/requests/rq-0011/receipt',
  ]) {
    test(`${path}: 404, "We can’t find that page", Browse experiments, no Help`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(['We can’t find that page']);
      await expect(page.locator('.xr-msg')).toContainText(
        'The address may be wrong, or the page may have moved. Published experiments are all in the catalogue.',
      );
      const links = page.locator('main a');
      await expect(links).toHaveText(['Browse experiments']);
      await expect(links.first()).toHaveAttribute('href', '/experiments');
      await expect(page).toHaveTitle('We can’t find that page · XR Learning Platform');
      // Inside the public frame since Package 1B: the public header and footer, no workspace shell.
      await expect(page.locator('header.xp-head')).toHaveCount(1);
      await expect(page.locator('footer.xp-foot')).toHaveCount(1);
      await expect(page.locator('aside.xr-side, .xr-app')).toHaveCount(0);
      await expect(
        page.locator('div.xp > main.xp-page#main > div.xp-in > .xr-msg.xr-x-msg--public'),
      ).toHaveCount(1);
      await expectNoAxeViolations(page);
    });
  }
});

test.describe('workspace variant (test-hook build)', () => {
  test.use({ baseURL: TEST_HOOKS_URL });

  // Designed but not built yet (each workspace's first unbuilt destination; the Super Admin's
  // Requests are built in Package 1A, Overview and Institutions in 1D; the Student's My courses and
  // the Institute Admin's People in 2A; Progress, Requests, Usage and Operations in Phase 3 — the
  // Institute Admin has no unbuilt destination left, so an undesigned address stands in), then
  // unknown ones.
  const UNBUILT: Readonly<Record<string, string>> = {
    student: '/student/assessments',
    faculty: '/faculty/marking',
    tenant_admin: '/institute/reports',
    vendor: '/vendor/experiments',
    academic_reviewer: '/reviewer/queue',
    content_manager: '/content-manager/ready',
    super_admin: '/admin/content/updates',
  };

  for (const entry of ROLES) {
    for (const path of [UNBUILT[entry.role]!, `${entry.base}/zz-not-a-page/deep`]) {
      test(`${entry.label} at ${path}: in-shell not-found, nothing current`, async ({ page }) => {
        await openAs(page, entry.person, path);
        await waitForShell(page);
        const message = page.locator('main .xr-msg');
        await expect(
          page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
        ).toBeVisible();
        await expect(message).toContainText(
          'The address may be wrong, or the page may have moved.',
        );
        await expect(message).not.toContainText('catalogue');
        await expect(message.locator('a')).toHaveText(['Back to Home', 'Help']);
        await expect(message.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
          'href',
          entry.base,
        );
        await expect(message.getByRole('link', { name: 'Help' })).toHaveAttribute(
          'href',
          `${entry.base}/help`,
        );
        await expect(page.locator('aside.xr-side [aria-current]')).toHaveCount(0);
        await expect(page).toHaveURL(`${TEST_HOOKS_URL}${path}`);
        await expect(page).toHaveTitle('Not found · XR Learning Platform');
      });
    }
  }

  test('"Back to Home" goes through the interim landing to Help, client-side; Help goes to Help', async ({
    page,
  }) => {
    const entry = roleEntry('academic_reviewer');
    await openAs(page, entry.person, '/reviewer/queue');
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    const mark = await markDocument(page);
    await page.locator('main .xr-msg').getByRole('link', { name: 'Back to Home' }).click();
    await page.waitForURL('**/reviewer/help');
    await expect(sidebarHelp(page)).toHaveAttribute('aria-current', 'page');
    await expectSameDocument(page, mark);
    // An unbuilt workspace address reached client-side keeps the document too (RSC answer 200).
    await page.evaluate(() => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        '/reviewer/reviewed',
      );
    });
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    await page.locator('main .xr-msg').getByRole('link', { name: 'Help' }).click();
    await page.waitForURL('**/reviewer/help');
    await expectSameDocument(page, mark);
  });

  test('a report that is not the person’s, or does not exist: not found in the shell', async ({
    page,
  }) => {
    await openAs(page, roleEntry('faculty').person, '/faculty/help/reports/SUP-0213');
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText('VR simulation');
    await expect(page.locator('aside.xr-side [aria-current]')).toHaveCount(0);
  });

  for (const reportId of ['constructor', '__proto__', 'toString']) {
    test(`a reference naming a built-in object member (${reportId}) is not found, never "failed"`, async ({
      page,
    }) => {
      await openAs(page, roleEntry('student').person, `/student/help/reports/${reportId}`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
      await expect(page.getByText(/didn’t load/)).toHaveCount(0);
    });
  }

  test('the HTTP status of the workspace not-found is 200 (spikes S1/S1b; recorded limitation)', async ({
    request,
  }) => {
    test.skip(test.info().project.name !== 'chromium-1440x900', 'Width-independent.');
    for (const path of [
      '/student/assessments',
      '/student/zz/deep',
      '/student/help/reports/SUP-9999',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    expect((await request.get('/nope')).status()).toBe(404);
  });
});
