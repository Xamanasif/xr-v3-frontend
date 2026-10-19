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
 * SA-01 Overview in the V3 design (the Super Admin export `sa-views-a.js` `V.overview`), its
 * Requests group and its category switch, on the test-hook build at 1440, 1024, 768 and 375: the
 * requests under review — the rail's own figure — each opening its decision, named by its
 * institution; "Open Requests" opens the list; with no request under review the group is left out
 * of All and says so under Requests; "Back to Home" in the Super Admin's shell reaches it. (The
 * full overview — figures, priority band, the other groups, the calm state — is
 * `e2e/phase-6/content-oversight.spec.ts`.)
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function open(page: Page, fixture: string, path = '/admin'): Promise<void> {
  await bootWorld(page, { fixture, session: SUPER_ADMIN });
  await page.goto(path);
}

const group = (page: Page) => page.getByRole('region', { name: 'Requests', exact: true });

test('SA-01: the requests under review, each opening its decision', async ({ page }) => {
  await open(page, 'after-flow-c');
  await expect(group(page).locator('.rb-row-t')).toHaveText([
    'Godavari Institute of Technology asks for additional licences',
    'Konark Polytechnic asks for additional licences',
    'BITS Pilani — Hyderabad Campus asks to renew its access',
  ]);
  await checkState(page, 'Overview');
  await expect(page).toHaveTitle('Overview · XR Learning Platform');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin');
  // The switch counts the same three requests; the two figures are in the head.
  await expect(
    page.getByRole('group', { name: 'Show what is waiting' }).getByRole('button', {
      name: 'Requests 3',
    }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('main dl.rb-figs')).toHaveCount(1);
  await expect(page.locator('main')).not.toContainText(/\bREQ-\d/);
  const mark = await markDocument(page);
  await reachAndClick(
    page,
    group(page).getByRole('link', {
      name: 'Open the additional licences request from Konark Polytechnic',
    }),
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

test('SA-01: with no request under review the Requests group is left out, and says so when chosen', async ({
  page,
}) => {
  await open(page, 'spine-start');
  await expect(group(page).locator('li.rb-row')).toHaveCount(2);
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
  // The other groups stay (spine-start: stuck content and more); the calm state is
  // e2e/phase-6/content-oversight.spec.ts.
  await expect(page.getByRole('region', { name: 'Stuck content' })).toBeVisible();
  await expect(group(page)).toHaveCount(0);
  await expect(page.locator('.rb-count')).toHaveCount(0);
  await checkState(page, 'Overview');
  // Chosen, the Requests category shows its group with its quiet line.
  const requests = page
    .getByRole('group', { name: 'Show what is waiting' })
    .getByRole('button', { name: 'Requests 0' });
  // The switch row scrolls sideways on narrow screens; the page check above tabbed to its end.
  // Scrolled back into view as a person would swipe the row, it is pressed with the pointer.
  await requests.scrollIntoViewIfNeeded();
  await reachAndClick(page, requests);
  await expect(requests).toHaveAttribute('aria-pressed', 'true');
  await expect(requests).toBeFocused();
  await expect(group(page).locator('.sa-quietrow')).toHaveText(
    'No request is waiting for your decision.',
  );
  await expect(page.getByRole('region', { name: 'Stuck content' })).toHaveCount(0);
  // The switch's pressed look eases in: check the page once its transitions have finished.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((motion) => motion.finished.catch(() => null))),
  );
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
  const title = page.getByRole('heading', { level: 1, name: 'Overview' });
  await expect(title).toBeVisible();
  // V3 shell: focus lands on the page's H1 with the route.
  await expect(title).toBeFocused();
  await expectSameDocument(page, mark);
});
