import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3, ST-18 My device (B3-07) and its XS-05 account-menu entry, on the test-hook build at
 * 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll). The chain runs on one
 * world: Rahul sends the request through the form (f4); Meera Iyer forwards it (f5) and Arjun
 * Mehta approves it (f6) through their own ports (`actAs`), and their receipts refresh the page.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = { personId: 'per-0002' };
const IMRAN = { personId: 'per-0006' };
const MEERA = { personId: 'per-0001' };
const ARJUN = { personId: 'sa-arjun-mehta' };
const GIT_VR_03 = 'ME lab VR headset, asset tag GIT-VR-03';
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';
const ACCOUNT = /^Account menu, Rahul Verma, Student/;

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
const region = (page: Page, name: string) => main(page).getByRole('region', { name });

interface Transfer {
  readonly id: string;
  readonly rev: number;
  readonly state: string;
}

/** Runs a transfer command as another person on the person's newest open transfer. */
async function moveTransfer(
  page: Page,
  person: { readonly personId: string },
  list: 'listDeviceRequests' | 'listDeviceTransfers',
  method: 'forwardDeviceTransfer' | 'approveDeviceTransfer',
): Promise<void> {
  const listed = await actAs<{ ok: boolean; value: Transfer[] }>(page, person, {
    port: 'operations',
    method: list,
    input: {},
  });
  const transfer = listed.value.find((entry) => entry.state !== 'approved')!;
  const moved = await actAs<{ ok: boolean }>(page, person, {
    port: 'operations',
    method,
    input: { id: transfer.id, expectedRev: transfer.rev },
  });
  expect(moved.ok).toBe(true);
}

test('f1 → f0: “My device” in the account menu opens the page; nothing in the sidebar is current', async ({
  page,
}) => {
  await open(page, 'after-flow-b', RAHUL, '/student/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  const account = page.getByRole('button', { name: ACCOUNT });
  await account.click();
  const menu = page.locator('.xs-menu');
  await expect(menu.locator('a, button')).toHaveText(['My device', 'Help & support', 'Sign out']);
  await menu.getByRole('link', { name: 'My device' }).click();
  await page.waitForURL('**/student/device');
  await expect(page.getByRole('heading', { level: 1, name: 'My device' })).toBeVisible();
  await expect(page.locator('.xs-menu')).toHaveCount(0);
  await expect(currentSidebarItem(page)).toHaveCount(0);
  const device = region(page, 'Authorised device');
  await expect(device.locator('.xl-dev-name')).toHaveText(GIT_VR_03);
  await expect(device.locator('.xl-dev .xl-meta')).toHaveText(
    'Used for VR · Shell-and-Tube Heat Exchanger',
  );
  await expect(region(page, 'Request history')).toContainText('No transfer requests yet.');
  await checkState(page, 'My device');
});

test('f2: no headset format — no entry; the address is the in-shell not-found (P3-06)', async ({
  page,
}) => {
  await open(page, 'after-setup', RAHUL, '/student/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await page.getByRole('button', { name: ACCOUNT }).click();
  await expect(page.locator('.xs-menu').locator('a, button')).toHaveText([
    'Help & support',
    'Sign out',
  ]);
  await page.goto('/student/device');
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  await expect(currentSidebarItem(page)).toHaveCount(0);
});

test('f3: validation — “New device” is the only required field', async ({ page }) => {
  await open(page, 'after-flow-b', RAHUL, '/student/device');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Request a device transfer' }));
  const field = page.getByRole('textbox', { name: 'New device' });
  await expect(field).toBeFocused();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Send request' }));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toBeFocused();
  await expect(region(page, 'Request a device transfer').locator('.xw-ferr')).toHaveText(
    'Describe the new device',
  );
  await checkState(page, 'My device');
});

test('f4 → f5 → f6: sent, forwarded to BITS, approved — the same DTR-0018', async ({ page }) => {
  await open(page, 'after-flow-b', RAHUL, '/student/device');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Request a device transfer' }));
  await page.getByRole('textbox', { name: 'New device' }).fill(GIT_VR_07);
  await page
    .getByRole('textbox', { name: 'Anything your Institute Admin should know (optional)' })
    .fill('GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Send request' }));

  // f4 "With your Institute Admin": the status takes focus.
  const request = region(page, 'Your transfer request');
  await expect(request.locator('.xr-status--wait')).toHaveText('With your Institute Admin');
  await expect(page.locator('#device-status')).toBeFocused();
  await expect(request.locator('.xr-id')).toHaveText('DTR-0018');
  await expect(request.locator('dl.xl-kv dd')).toHaveText([GIT_VR_03, GIT_VR_07]);
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toHaveCount(
    0,
  );
  await checkState(page, 'My device');

  // f5 "Forwarded to BITS" (Meera Iyer, B3-09).
  await moveTransfer(page, MEERA, 'listDeviceRequests', 'forwardDeviceTransfer');
  await expect(request.locator('.xr-status--info')).toHaveText('Forwarded to BITS');
  await expect(region(page, 'Request history').locator('.xr-tl-what')).toHaveText([
    'Forwarded to BITS by Meera Iyer',
    'Requested by Rahul Verma',
  ]);
  await checkState(page, 'My device');

  // f6 "Approved" (B3-11): the authorised device is the new one.
  await moveTransfer(page, ARJUN, 'listDeviceTransfers', 'approveDeviceTransfer');
  await expect(request.locator('.xr-status--ok')).toHaveText('Approved');
  await expect(region(page, 'Authorised device').locator('.xl-dev-name')).toHaveText(GIT_VR_07);
  await expect(region(page, 'Request history').locator('.xr-tl-what')).toHaveText([
    'Approved by BITS',
    'Forwarded to BITS by Meera Iyer',
    'Requested by Rahul Verma',
  ]);
  await checkState(page, 'My device');
});

test('f8: paused — no new request, the drawn words under the banner', async ({ page }) => {
  await open(page, 'after-flow-b', RAHUL, '/student/device');
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toBeVisible();
  const found = await actAs<{ ok: boolean; value: { institution: { rev: number } } }>(page, ARJUN, {
    port: 'institutions',
    method: 'getInstitution',
    input: 'godavari',
  });
  const paused = await actAs<{ ok: boolean }>(page, ARJUN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: 'godavari',
      reason: 'Licence review.',
      expectedRev: found.value.institution.rev,
    },
  });
  expect(paused.ok).toBe(true);
  await expect(region(page, 'Authorised device')).toContainText(
    'You can’t request a transfer while your institution’s access is paused.',
  );
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toHaveCount(
    0,
  );
  await expect(
    page.locator('.rk-x-region--banner > .rk-banner:not(.xs-banner--inactive)'),
  ).toBeVisible();
  await checkState(page, 'My device');
});

test('state coverage: Imran’s DTR-0019, still with the institution', async ({ page }) => {
  await open(page, 'state-coverage', IMRAN, '/student/device');
  const request = region(page, 'Your transfer request');
  await expect(request.locator('.xr-id')).toHaveText('DTR-0019');
  await expect(request.locator('.xr-status--wait')).toHaveText('With your Institute Admin');
  await checkState(page, 'My device');
});
