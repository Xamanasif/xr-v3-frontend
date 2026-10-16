import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * The Super Admin's Operations — SA-18 Device transfers (B3-11 f0, f2, f3; B7-09 f0, f2) and SA-19
 * Device transfer decision (B3-11 f1, f4 … f7; B7-10 f14), with SA-07's device-transfer row
 * (B7-03 `att`) — on the test-hook build at 1440, 1024, 768 and 375. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll); the DL-1 confirmation passes axe and keeps the keyboard inside it,
 * Esc returning focus to "Approve transfer". Worlds: after Flow B with DTR-0018 requested by Rahul
 * and forwarded by Meera in the same tab (`actAs`), after the device flow (DTR-0018 approved) and
 * the state-coverage world (DTR-0019 still with Godavari).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const ADMIN = { personId: 'sa-arjun-mehta' };
const RAHUL = { personId: 'per-0002' };
const MEERA = { personId: 'per-0001' };
const LIST = '/admin/operations/device-transfers';

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: ADMIN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');

/** A table's body rows as their cells' text. */
async function cells(page: Page): Promise<string[][]> {
  return page
    .getByRole('table', { name: 'Device transfers' })
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? '')),
    );
}

interface Listed {
  readonly ok: boolean;
  readonly value: readonly { readonly id: string; readonly rev: number }[];
}

/** Device 1 and 2 in this tab's world: Rahul requests DTR-0018, Meera forwards it to BITS. */
async function forwardDtr0018(page: Page): Promise<void> {
  await actAs(page, RAHUL, {
    port: 'operations',
    method: 'requestDeviceTransfer',
    input: {
      newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
      note: 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
    },
  });
  const listed = await actAs<Listed>(page, MEERA, {
    port: 'operations',
    method: 'listDeviceRequests',
    input: {},
  });
  const transfer = listed.value.find((entry) => entry.id === 'DTR-0018')!;
  await actAs(page, MEERA, {
    port: 'operations',
    method: 'forwardDeviceTransfer',
    input: { id: transfer.id, expectedRev: transfer.rev },
  });
}

test.describe('SA-18 Operations › Device transfers', () => {
  test('forwarded: DTR-0018 waits for BITS, Review opens its decision (B3-11 f0)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', LIST);
    await expect(
      page.getByRole('heading', { name: 'No device transfers waiting for BITS' }),
    ).toBeVisible();
    await forwardDtr0018(page);
    await expect(page.getByRole('table', { name: 'Device transfers' })).toBeVisible();
    const [row] = await cells(page);
    expect(row!.slice(0, 2)).toEqual([
      'DTR-0018Rahul Verma · VR',
      'Godavari Institute of Technology',
    ]);
    expect(row![2]).toMatch(/^\d{1,2} \w{3} 2026, \d\d:\d\d · Meera Iyer$/);
    expect(row!.slice(3)).toEqual(['Forwarded', 'Review']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    // Phase 6 (B7-09 f0): the three Operations tab links, Device transfers current.
    const tabs = page.getByRole('navigation', { name: 'Operations' }).getByRole('link');
    await expect(tabs).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs.first()).toHaveAttribute('aria-current', 'page');
    await expect(tabs.nth(1)).toHaveAttribute('href', '/admin/operations/support');
    await expect(tabs.nth(2)).toHaveAttribute('href', '/admin/operations/access-ending');
    await checkState(page, 'Operations');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Review DTR-0018' }));
    await page.waitForURL(`**${LIST}/DTR-0018`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' }),
    ).toBeVisible();
  });

  test('still with an institution: read-only — no link, “Not yet” (B3-11 f2)', async ({ page }) => {
    await open(page, 'state-coverage', `${LIST}?show=with-institution`);
    await expect(page.getByRole('table', { name: 'Device transfers' })).toBeVisible();
    expect(await cells(page)).toEqual([
      [
        'DTR-0019Imran Shaikh · VR',
        'Godavari Institute of Technology',
        'Not yet',
        'Still with the institution',
        '',
      ],
    ]);
    await expect(
      page.getByRole('table', { name: 'Device transfers' }).getByRole('link'),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole('group', { name: 'Show' })
        .getByRole('link', { name: 'Still with an institution' }),
    ).toHaveAttribute('aria-current', 'true');
    await checkState(page, 'Operations');
  });

  test('approved, reached through Show; /admin/operations opens Device transfers (B3-11 f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-device', '/admin/operations');
    await page.waitForURL(`**${LIST}`);
    await expect(
      page.getByRole('heading', { name: 'No device transfers waiting for BITS' }),
    ).toBeVisible();
    await reachAndClick(
      page,
      page.getByRole('group', { name: 'Show' }).getByRole('link', { name: 'Approved' }),
    );
    await page.waitForURL(`**${LIST}?show=approved`);
    await expect(page.getByRole('table', { name: 'Device transfers' })).toBeVisible();
    expect(await cells(page)).toEqual([
      [
        'DTR-0018Rahul Verma · VR',
        'Godavari Institute of Technology',
        '23 Oct 2026, 10:00 · Meera Iyer',
        'Approved',
        '',
      ],
    ]);
    await checkState(page, 'Operations');
  });
});

test.describe('SA-19 Device transfer decision', () => {
  test('forwarded → DL-1 → approved: the panel, the confirmation, the decided record (B3-11 f1, f4, f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', LIST);
    await expect(page.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    await forwardDtr0018(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'DTR-0018', exact: true }));
    await page.waitForURL(`**${LIST}/DTR-0018`);
    const panel = page.getByRole('complementary', { name: 'Your decision' });
    await expect(panel).toContainText(
      'Approving moves Rahul Verma’s VR authorisation to the new device.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'ForwardedGodavari Institute of Technology',
    );
    await checkState(page, 'VR device transfer for Rahul Verma');

    const approve = panel.getByRole('button', { name: 'Approve transfer' });
    await reachAndClick(page, approve);
    const dialog = page.getByRole('dialog', { name: 'Approve DTR-0018?' });
    await expect(dialog).toContainText(
      'Rahul Verma’s authorised device for VR becomes ME lab VR headset, asset tag GIT-VR-07. The student and Meera Iyer see “Approved”.',
    );
    await expect(dialog.getByRole('button', { name: 'Approve transfer' })).toBeFocused();
    await expectNoAxeViolations(page);
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      );
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(approve).toBeFocused();

    await reachAndClick(page, approve);
    await dialog.getByRole('button', { name: 'Approve transfer' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#transfer-status')).toBeFocused();
    await expect(page.locator('#transfer-status')).toContainText('Approved');
    await expect(
      main(page).getByRole('status').filter({ hasText: 'Approved. Rahul Verma' }),
    ).toHaveText('Approved. Rahul Verma and Meera Iyer now see “Approved”.');
    await expect(panel).toContainText(/Approved on \d{1,2} \w{3} 2026, \d\d:\d\d by Arjun Mehta\./);
    await expect(panel.getByRole('button')).toHaveCount(0);
    await checkState(page, 'VR device transfer for Rahul Verma');

    // The same record, read by the Student and the Institute Admin.
    const mine = await actAs<{
      readonly value: { readonly devices: readonly { readonly description: string }[] };
    }>(page, RAHUL, { port: 'operations', method: 'getMyDevice' });
    expect(mine.value.devices.map((device) => device.description)).toEqual([
      'ME lab VR headset, asset tag GIT-VR-07',
    ]);
    const theirs = await actAs<{ readonly value: { readonly state: string } }>(page, MEERA, {
      port: 'operations',
      method: 'getDeviceRequest',
      input: 'DTR-0018',
    });
    expect(theirs.value.state).toBe('approved');
  });

  test('approved: read-only with who and when (B3-11 f5)', async ({ page }) => {
    await open(page, 'after-flow-device', `${LIST}/DTR-0018`);
    const panel = page.getByRole('complementary', { name: 'Your decision' });
    await expect(panel).toContainText('Approved on 24 Oct 2026, 12:30 by Arjun Mehta.');
    await expect(page.getByRole('button', { name: 'Approve transfer' })).toHaveCount(0);
    await checkState(page, 'VR device transfer for Rahul Verma');
  });

  test('still with the institution: nothing to approve (B7-10 f14)', async ({ page }) => {
    await open(page, 'state-coverage', `${LIST}/DTR-0019`);
    await expect(
      page.getByRole('heading', { level: 2, name: 'DTR-0019 hasn’t reached BITS yet' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve transfer' })).toHaveCount(0);
    await checkState(page, 'Device transfers');
  });
});

test.describe('SA-07 Institution detail', () => {
  test('a forwarded transfer needs attention and opens Operations (B7-03 `att`)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/admin/institutions/godavari');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Godavari Institute of Technology' }),
    ).toBeVisible();
    await forwardDtr0018(page);
    const attention = page.getByRole('region', { name: 'Needs attention' });
    const row = attention.locator('.xr-row', { hasText: 'DTR-0018' });
    await expect(row.locator('.xr-row-title')).toHaveText(
      /^DTR-0018 — device transfer forwarded on \d{1,2} \w{3} 2026$/,
    );
    await checkState(page, 'Godavari Institute of Technology');
    await reachAndClick(page, row.getByRole('link', { name: 'Operations' }));
    await page.waitForURL(`**${LIST}`);
    await expect(page.getByRole('table', { name: 'Device transfers' })).toContainText('DTR-0018');
  });
});
