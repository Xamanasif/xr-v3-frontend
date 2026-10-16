import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  SUPER_ADMIN,
} from '../support/workspace';

/**
 * SA-01 Overview (B7-01), its Requests group (Package 1D; the full overview of Phase 6 — figures,
 * eight groups, the calm state — is `e2e/phase-6/content-oversight.spec.ts`), on the test-hook
 * build at 1440, 1024, 768 and 375: the requests under review — the sidebar's own figure — each
 * opening its decision; "Open Requests" opens the list; with no request under review the group is
 * left out; "Back to Home" in the Super Admin's shell reaches it.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function open(page: Page, fixture: string, path = '/admin'): Promise<void> {
  await bootWorld(page, { fixture, session: SUPER_ADMIN });
  await page.goto(path);
}

const group = (page: Page) => page.getByRole('region', { name: /^Requests/ });

test('SA-01: the requests under review, each opening its decision (B7-01 f0, f3)', async ({
  page,
}) => {
  await open(page, 'after-flow-c');
  await expect(group(page).locator('.xr-row-title')).toHaveText([
    'REQ-0058 · Godavari Institute of Technology',
    'REQ-0040 · Konark Polytechnic',
    'REQ-0038 · BITS Pilani — Hyderabad Campus',
  ]);
  await checkState(page, 'Overview');
  await expect(page).toHaveTitle('Overview · XR Learning Platform');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin');
  await expect(group(page).locator('.xd-gn')).toHaveText('3');
  await expect(page.locator('main .xr-overline')).toHaveText('Super Admin · Arjun Mehta');
  // Phase 6: the two figures are drawn above the groups (B7-01 f0).
  await expect(page.locator('main .xd-figs')).toHaveCount(1);
  const mark = await markDocument(page);
  await reachAndClick(
    page,
    group(page).getByRole('link', { name: 'Open: REQ-0040 · Konark Polytechnic' }),
  );
  await page.waitForURL('**/admin/requests/REQ-0040');
  await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible();
  await page.goBack();
  await expect(group(page)).toBeVisible();
  await reachAndClick(page, group(page).getByRole('link', { name: 'Open Requests' }));
  await page.waitForURL('**/admin/requests');
  await expect(page.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
  await expectSameDocument(page, mark);
});

test('SA-01: with no request under review the Requests group is left out', async ({ page }) => {
  await open(page, 'spine-start');
  await expect(group(page).locator('.xr-row')).toHaveCount(2);
  for (const reference of ['REQ-0040', 'REQ-0038']) {
    const page_ = await actAs<{
      ok: boolean;
      value: { request: { id: string; rev: number } };
    }>(page, SUPER_ADMIN, {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: reference,
    });
    const asked = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
      port: 'accessRequests',
      method: 'requestMoreInformation',
      input: {
        id: page_.value.request.id,
        reason: 'Please confirm the student numbers.',
        expectedRev: page_.value.request.rev,
      },
    });
    expect(asked.ok).toBe(true);
  }
  // The other groups stay (spine-start: stuck content and more); B7-01 f1's calm state is
  // e2e/phase-6/content-oversight.spec.ts.
  await expect(page.getByRole('region', { name: /^Stuck content/ })).toBeVisible();
  await expect(group(page)).toHaveCount(0);
  await expect(page.locator('aside.xr-side .xr-count')).toHaveCount(0);
  await checkState(page, 'Overview');
});

test('“Back to Home” in the Super Admin’s shell reaches SA-01, client-side', async ({ page }) => {
  await open(page, 'after-flow-c', '/admin/zz-unknown');
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  const mark = await markDocument(page);
  await reachAndClick(
    page,
    page.locator('main .xr-msg').getByRole('link', { name: 'Back to Home' }),
  );
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  await expectSameDocument(page, mark);
});
