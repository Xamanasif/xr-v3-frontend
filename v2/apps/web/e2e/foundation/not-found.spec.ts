import { expect, test } from '@playwright/test';

import { expectNoAxeViolations, TEST_HOOKS_URL } from '../support';
import {
  expectSameDocument,
  markDocument,
  openAs,
  ROLES,
  roleEntry,
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

  // Every designed destination is built since Phase 6, so an address no designed screen owns stands
  // in for each workspace (ST-20's signed-in catalogue, a reports page, a Vendor's undesigned
  // VE-10 … VE-15 page, the update list RV-04 has no page for — `/reviewer/updates` alone —, the
  // Content Manager's undesigned CM-10, the Super Admin's settings removed by the boards, B7-09),
  // then unknown ones.
  const UNBUILT: Readonly<Record<string, string>> = {
    student: '/student/catalogue',
    faculty: '/faculty/reports',
    tenant_admin: '/institute/reports',
    vendor: '/vendor/reports',
    academic_reviewer: '/reviewer/updates',
    content_manager: '/content-manager/reports',
    super_admin: '/admin/settings',
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
        await expect(
          page.locator('aside.xr-side [aria-current], aside.rb-rail [aria-current]'),
        ).toHaveCount(0);
        await expect(page).toHaveURL(`${TEST_HOOKS_URL}${path}`);
        await expect(page).toHaveTitle('Not found · XR Learning Platform');
      });
    }
  }

  test('"Back to Home" goes to the built home (RV-01, Phase 5), client-side; Help goes to Help', async ({
    page,
  }) => {
    const entry = roleEntry('academic_reviewer');
    await openAs(page, entry.person, '/reviewer/updates');
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    const mark = await markDocument(page);
    await page.locator('main .xr-msg').getByRole('link', { name: 'Back to Home' }).click();
    await page.waitForURL((url) => url.pathname === '/reviewer');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await expectSameDocument(page, mark);
    // An unbuilt workspace address reached client-side keeps the document too (RSC answer 200).
    await page.evaluate(() => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        '/reviewer/updates',
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
    await expect(
      page.locator('aside.xr-side [aria-current], aside.rb-rail [aria-current]'),
    ).toHaveCount(0);
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
      '/student/catalogue',
      '/student/zz/deep',
      '/student/help/reports/SUP-9999',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    expect((await request.get('/nope')).status()).toBe(404);
  });
});
