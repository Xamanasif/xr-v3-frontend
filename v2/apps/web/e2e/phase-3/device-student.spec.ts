import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * ST-18 My device in the owner-approved V3 Student design (ST-v1 `device`, `msg('dev-not')`) and
 * its XS-05 account-menu entry, on the test-hook build at 1440, 1024, 768 and 375. Each drawn
 * state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no
 * developer surface, no sideways scroll). The chain runs on one world: Rahul sends the request
 * through the form; Meera Iyer forwards it and Arjun Mehta approves it through their own ports
 * (`actAs`), and their receipts refresh the page. The record's reference is never shown.
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
const steps = (page: Page) =>
  main(page).getByRole('list', { name: 'Steps of your transfer request' }).locator('li');
// The date's words are kept on one line with no-break spaces (the export's `nbd`): `\s`.
const DATE = String.raw`\d{1,2}\s[A-Z][a-z]{2}\s2026,\s\d\d:\d\d`;
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

/** Nothing the Student reads names the transfer by its record (lead decision 3). */
async function expectNoReference(page: Page): Promise<void> {
  await expect(main(page)).not.toContainText(REFERENCE);
  const labels = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const label of labels) expect(label).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

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

test('“My device” in the account menu opens the page; nothing in the rail is current', async ({
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
  const device = region(page, GIT_VR_03);
  await expect(device.locator('.sv-eyebrow')).toHaveText('Authorised device');
  await expect(device.locator('.sv-devuse')).toHaveText(
    'VRUsed for VR: Shell-and-Tube Heat Exchanger',
  );
  await expect(region(page, 'Transfer requests')).toContainText('No transfer requests yet.');
  await expect(
    main(page).getByRole('complementary', { name: 'How a transfer works' }),
  ).toBeVisible();
  await expectNoReference(page);
  await checkState(page, 'My device');
});

test('no headset format — no entry; the address draws “My device isn’t available to you”', async ({
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
    page.getByRole('heading', { level: 1, name: 'My device isn’t available to you' }),
  ).toBeVisible();
  await expect(main(page).getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
    'href',
    '/student',
  );
  await expect(currentSidebarItem(page)).toHaveCount(0);
  await checkState(page, 'My device isn’t available to you');
});

test('validation — “New device” is the only required field', async ({ page }) => {
  await open(page, 'after-flow-b', RAHUL, '/student/device');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Request a device transfer' }));
  const field = page.getByRole('textbox', { name: 'New device' });
  await expect(field).toBeFocused();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Send request' }));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toBeFocused();
  await expect(
    main(page).getByRole('form', { name: 'Request a device transfer' }).locator('.rk-ferr'),
  ).toHaveText('Describe the new device');
  await checkState(page, 'My device');
});

test('sent, forwarded to BITS, approved — the same request, three dated steps', async ({
  page,
}) => {
  await open(page, 'after-flow-b', RAHUL, '/student/device');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Request a device transfer' }));
  await page.getByRole('textbox', { name: 'New device' }).fill(GIT_VR_07);
  await page
    .getByRole('textbox', { name: 'Anything your Institute Admin should know (optional)' })
    .fill('GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Send request' }));

  // "With your Institute Admin": the steps take focus.
  const request = region(page, 'Your transfer request');
  await expect(request.locator('.sv-devreq-h .xr-st--warn')).toHaveText(
    'With your Institute Admin',
  );
  await expect(page.locator('#device-status')).toBeFocused();
  await expect(steps(page).nth(0)).toHaveAttribute(
    'aria-label',
    new RegExp(`^Requested, done, ${DATE}$`),
  );
  await expect(steps(page).nth(1)).toHaveAttribute(
    'aria-label',
    'Forwarded to BITS, current, With your Institute Admin',
  );
  await expect(request.locator('dl.sv-devdl dd')).toHaveText([
    GIT_VR_03,
    GIT_VR_07,
    'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
  ]);
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toHaveCount(
    0,
  );
  await expectNoReference(page);
  await checkState(page, 'My device');

  // "Forwarded to BITS" (Meera Iyer).
  await moveTransfer(page, MEERA, 'listDeviceRequests', 'forwardDeviceTransfer');
  await expect(request.locator('.xr-st--info')).toHaveText('Forwarded to BITS');
  await expect(steps(page).nth(1)).toHaveAttribute(
    'aria-label',
    new RegExp(`^Forwarded to BITS, done, Meera Iyer · ${DATE}$`),
  );
  await expect(steps(page).nth(2)).toHaveAttribute(
    'aria-label',
    'BITS decides, current, With BITS now',
  );
  await checkState(page, 'My device');

  // "Approved": the authorised device is the new one.
  await moveTransfer(page, ARJUN, 'listDeviceTransfers', 'approveDeviceTransfer');
  await expect(request.locator('.xr-st--ok')).toHaveText('Approved');
  await expect(region(page, GIT_VR_07).locator('.sv-devname')).toHaveText(GIT_VR_07);
  await expect(steps(page).nth(2)).toHaveAttribute(
    'aria-label',
    new RegExp(`^Approved by BITS, done, ${DATE}$`),
  );
  await expectNoReference(page);
  await checkState(page, 'My device');
});

test('paused — no new request, the drawn words under the banner', async ({ page }) => {
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
  await expect(region(page, GIT_VR_03).locator('.sv-devlock')).toHaveText(
    'You can’t request a transfer while your institution’s access is paused.',
  );
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toHaveCount(
    0,
  );
  // The V3 shell's XS-08 banner, first in the page column.
  await expect(main(page).locator('.rk-banner:not(.xs-banner--inactive)')).toContainText(
    'Your institution’s access is paused — your work is kept.',
  );
  await checkState(page, 'My device');
});

test('state coverage: Imran’s request, still with the institution', async ({ page }) => {
  await open(page, 'state-coverage', IMRAN, '/student/device');
  const request = region(page, 'Your transfer request');
  await expect(request.locator('.xr-st--warn')).toHaveText('With your Institute Admin');
  await expect(request).not.toContainText('DTR-0019');
  await expectNoReference(page);
  await checkState(page, 'My device');
});
