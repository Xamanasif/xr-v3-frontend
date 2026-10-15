import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3, the Institute Admin's Requests (B3-08, B3-09) on the test-hook build at 1440, 1024, 768
 * and 375: IA-17 Requests to BITS, its form and its request detail, IA-18 Device requests and
 * IA-19 Device request — review & forward, as Meera Iyer (Godavari). Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll); DL-1 passes axe and keeps the keyboard inside it, Esc returning
 * focus to its trigger. Worlds: after Flow B (REQ-0042 only; no device request), after Flow C
 * (REQ-0058 Under review; DTR-0018 decided), and the state coverage (DTR-0019 waiting on Meera).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';

async function open(
  page: Page,
  fixture: string,
  person: { readonly personId: string },
  path: string,
): Promise<void> {
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');

/** DL-1 is accessible and modal: axe, Tab stays inside, Esc closes it back to its trigger. */
async function checkDialog(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeVisible();
  await expectNoAxeViolations(page);
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

test.describe('IA-17 Requests to BITS (B3-08)', () => {
  test('the list after IA-17: REQ-0058 Under review above REQ-0042; Requests current (f3, f7)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests');
    const rows = page.getByRole('table', { name: 'Requests to BITS' }).locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('REQ-0058');
    await expect(rows.nth(0)).toContainText('60 more licences · Shell-and-Tube Heat Exchanger');
    await expect(rows.nth(0)).toContainText('Under review');
    await expect(rows.nth(1)).toContainText('Access active since 8 Oct 2026');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await expect(
      page
        .getByRole('navigation', { name: 'Requests' })
        .getByRole('link', { name: 'Requests to BITS' }),
    ).toHaveAttribute('aria-current', 'page');
    await checkState(page, 'Requests');
  });

  test('more licences: the drawn errors, then sent — Under review, back to the list (f1 → f0 done → f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/requests');
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    );
    const title = page.getByRole('heading', {
      level: 1,
      name: 'Ask for a renewal or more licences',
    });
    await expect(title).toBeFocused();
    await reachAndClick(
      page,
      page.getByRole('radio', { name: /More licences for experiments you hold/ }),
    );
    const licences = page.getByRole('textbox', { name: 'Licences requested' });
    await licences.fill('sixty');
    await reachAndClick(page, page.getByRole('button', { name: 'Send request to BITS' }));
    const summary = page.locator('.xw-errsum');
    await expect(summary).toContainText('Check your request');
    await expect(summary).toContainText('Enter a whole number, like 60');
    await expect(summary).toBeFocused();
    await expect(licences).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Ask for a renewal or more licences');
    await licences.fill('60');
    await reachAndClick(page, page.getByRole('button', { name: 'Send request to BITS' }));
    const sent = page.getByRole('heading', { level: 1, name: /^Request REQ-\d{4} sent to BITS$/ });
    await expect(sent).toBeVisible();
    await expect(main(page)).toContainText(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    await expect(page.locator('#ask-done')).toBeFocused();
    await checkState(page, (await sent.textContent())!.trim());
    await reachAndClick(page, page.getByRole('button', { name: 'Back to Requests' }));
    const rows = page.getByRole('table', { name: 'Requests to BITS' }).locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Under review');
  });

  test('renewal mirrors the plan (f2)', async ({ page }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/requests');
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    );
    await reachAndClick(page, page.getByRole('radio', { name: /Renew access plan ACC-0107/ }));
    const renewing = page.getByRole('region', { name: 'The plan you’re renewing' });
    await expect(renewing).toContainText('Yearly · current plan ends 7 Oct 2027');
    await expect(renewing).toContainText('120 licences');
    await checkState(page, 'Ask for a renewal or more licences');
  });

  test('request detail · Under review (f4)', async ({ page }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests/REQ-0058');
    await expect(page.getByRole('heading', { level: 1, name: '60 more licences' })).toBeVisible();
    await expect(main(page).locator('.xr-phead-meta')).toContainText('Sent 21 Oct 2026, 16:05');
    await expect(page.getByRole('region', { name: 'History' })).toContainText('Sent to BITS');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await checkState(page, '60 more licences');
  });
});

test.describe('IA-18 Device requests and IA-19 Device request (B3-09)', () => {
  test('IA-18: one row per request with its status in words; Review opens IA-19 (f0)', async ({
    page,
  }) => {
    await open(page, 'state-coverage', MEERA, '/institute/requests?tab=devices');
    const rows = page.getByRole('table', { name: 'Device requests' }).locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Waiting on you');
    await expect(rows.nth(1)).toContainText('Decided · approved by BITS');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await checkState(page, 'Requests');
    await reachAndClick(page, page.getByRole('link', { name: 'Review Imran Shaikh’s request' }));
    await page.waitForURL('**/institute/requests/devices/DTR-0019');
    await expect(
      page.getByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
    ).toBeVisible();
  });

  test('IA-19: Forward to BITS → DL-1 → Forwarded to BITS (f1 → f2, f5)', async ({ page }) => {
    await open(page, 'state-coverage', MEERA, '/institute/requests/devices/DTR-0019');
    const heading = 'VR device transfer for Imran Shaikh';
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await checkState(page, heading);
    const forward = main(page).getByRole('button', { name: 'Forward to BITS' });
    await reachAndClick(page, forward);
    await checkDialog(page, 'Forward DTR-0019 to BITS?');
    await expect(forward).toBeFocused();
    await reachAndClick(page, forward);
    const dialog = page.getByRole('dialog', { name: 'Forward DTR-0019 to BITS?' });
    await expect(dialog.getByRole('button', { name: 'Forward to BITS' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Forward to BITS' }).click();
    await expect(dialog).toBeHidden();
    await expect(main(page)).toContainText(
      'Forwarded to BITS. Imran Shaikh sees “Forwarded to BITS”. BITS decides.',
    );
    await expect(page.locator('#device-request-status')).toBeFocused();
    await expect(page.locator('#device-request-status')).toContainText('Forwarded to BITS');
    await expect(main(page).getByRole('button', { name: 'Forward to BITS' })).toHaveCount(0);
    await checkState(page, heading);
  });

  test('IA-19 waiting on you from a request Rahul sends now (B3-12 f7 → B3-09 f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests?tab=devices');
    const rows = page.getByRole('table', { name: 'Device requests' }).locator('tbody tr');
    await expect(rows).toHaveCount(1);
    const sent = await actAs<{ ok: boolean }>(page, RAHUL, {
      port: 'operations',
      method: 'requestDeviceTransfer',
      input: { newDevice: 'ME lab VR headset, asset tag GIT-VR-07', note: null },
    });
    expect(sent.ok).toBe(true);
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Waiting on you');
    await reachAndClick(page, page.getByRole('link', { name: 'Review Rahul Verma’s request' }));
    const heading = 'VR device transfer for Rahul Verma';
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole('region', { name: 'What the student asked for' })).toContainText(
      GIT_VR_07,
    );
    await expect(page.getByRole('region', { name: 'Your action' })).toContainText(
      'Forward it to BITS. BITS decides; you can’t approve device transfers.',
    );
    await checkState(page, heading);
  });

  test('IA-19 decided · approved by BITS (f3): read-only', async ({ page }) => {
    await open(page, 'after-flow-device', MEERA, '/institute/requests/devices/DTR-0018');
    const heading = 'VR device transfer for Rahul Verma';
    await expect(page.getByRole('region', { name: 'Your action' })).toContainText(
      'BITS approved this transfer. Nothing more is needed from you.',
    );
    await expect(main(page).getByRole('button', { name: 'Forward to BITS' })).toHaveCount(0);
    await checkState(page, heading);
  });
});
