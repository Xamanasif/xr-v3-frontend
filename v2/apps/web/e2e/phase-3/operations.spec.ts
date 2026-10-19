import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * The Super Admin's Operations in the V3 design (SA-v1 `V.transfers`, `V.transfer`) — SA-18 Device
 * transfers and SA-19 Device transfer decision, with SA-07's device-transfer row (B7-03 `att`) — on
 * the test-hook build at 1440, 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG
 * A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll)
 * and names no DTR reference; the confirmation passes axe and keeps the keyboard inside it, Esc
 * returning focus to "Approve transfer". Worlds: after Flow B with DTR-0018 requested by Rahul and
 * forwarded by Meera in the same tab (`actAs`), after the device flow (DTR-0018 approved) and the
 * state-coverage world (DTR-0019 still with Godavari).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const ADMIN = { personId: 'sa-arjun-mehta' };
const RAHUL = { personId: 'per-0002' };
const MEERA = { personId: 'per-0001' };
const LIST = '/admin/operations/device-transfers';
const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
const APPROVE_TITLE = 'Approve the VR device transfer for Rahul Verma?';

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: ADMIN });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const views = (page: Page) => page.getByRole('group', { name: 'Show device transfers' });
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });

/**
 * Below the switch's own width its views scroll sideways (the export's `rb-switch`): a sideways
 * wheel over it — a swipe on a phone — brings the view into sight before it is pressed.
 */
async function chooseView(page: Page, name: RegExp): Promise<void> {
  const button = views(page).getByRole('button', { name });
  const box = await views(page).boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(600, 0);
  }
  await reachAndClick(page, button);
}

/** A table's body rows as their cells' text. */
async function cells(page: Page, name: string): Promise<string[][]> {
  return page
    .getByRole('table', { name })
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? '')),
    );
}

/** No internal reference in the page's words or accessible names (SA-v1 HANDOFF). */
async function expectNoReferences(page: Page): Promise<void> {
  expect(await main(page).innerText()).not.toMatch(INTERNAL);
  const names = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(INTERNAL);
  expect(await page.title()).not.toMatch(INTERNAL);
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
  test('forwarded: the transfer waits for BITS, named by content; its row opens the decision', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', LIST);
    await expect(main(page).getByText('Nothing is waiting for your approval')).toBeVisible();
    await forwardDtr0018(page);
    const table = 'Device transfers, Forwarded to BITS';
    await expect(page.getByRole('table', { name: table })).toBeVisible();
    const [row] = await cells(page, table);
    expect(row!.slice(0, 3)).toEqual([
      'Rahul VermaVR device transfer',
      'Godavari Institute of Technology',
      'Meera Iyer, Institute Admin',
    ]);
    expect(row![3]).toMatch(/^Forwarded \d{1,2} \w{3} 2026$/);
    expect(row![4]).toBe('Forwarded');
    await expect(views(page).getByRole('button')).toHaveText([
      'Forwarded to BITS 1',
      'Still with an institution 0',
      'Approved 0',
    ]);
    await expect(views(page).getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    // The three Operations tab links, Device transfers current.
    const tabs = page.getByRole('navigation', { name: 'Operations' }).getByRole('link');
    await expect(tabs).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs.first()).toHaveAttribute('aria-current', 'page');
    await expect(tabs.nth(1)).toHaveAttribute('href', '/admin/operations/support');
    await expect(tabs.nth(2)).toHaveAttribute('href', '/admin/operations/access-ending');
    await expectNoReferences(page);
    await checkState(page, 'Operations');
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'VR device transfer for Rahul Verma, Forwarded. Open' }),
    );
    await page.waitForURL(`**${LIST}/DTR-0018`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' }),
    ).toBeVisible();
  });

  test('still with an institution: the transfer is listed and opens its record', async ({
    page,
  }) => {
    await open(page, 'state-coverage', `${LIST}?show=with-institution`);
    const table = 'Device transfers, Still with an institution';
    await expect(page.getByRole('table', { name: table })).toBeVisible();
    expect(await cells(page, table)).toEqual([
      [
        'Imran ShaikhVR device transfer',
        'Godavari Institute of Technology',
        'Not forwarded yet',
        'Forwarded Not yet',
        'Still with the institution',
      ],
    ]);
    await expect(
      views(page).getByRole('button', { name: /^Still with an institution/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('table', { name: table }).getByRole('link', {
        name: 'VR device transfer for Imran Shaikh, Still with the institution. Open',
      }),
    ).toHaveAttribute('href', `${LIST}/DTR-0019`);
    await expectNoReferences(page);
    await checkState(page, 'Operations');
  });

  test('approved, reached through the view switch; /admin/operations opens Device transfers', async ({
    page,
  }) => {
    await open(page, 'after-flow-device', '/admin/operations');
    await page.waitForURL(`**${LIST}`);
    await expect(main(page).getByText('Nothing is waiting for your approval')).toBeVisible();
    await chooseView(page, /^Approved/);
    await page.waitForURL(`**${LIST}?show=approved`);
    const table = 'Device transfers, Approved';
    await expect(page.getByRole('table', { name: table })).toBeVisible();
    await expect(views(page).getByRole('button', { name: /^Approved/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await cells(page, table)).toEqual([
      [
        'Rahul VermaVR device transfer',
        'Godavari Institute of Technology',
        'Meera Iyer, Institute Admin',
        'Forwarded 23 Oct 2026',
        'Approved',
      ],
    ]);
    await checkState(page, 'Operations');
  });
});

test.describe('SA-19 Device transfer decision', () => {
  test('forwarded → confirmation → approved: the panel, the confirmation, the flash, the decided record', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', LIST);
    await expect(page.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    await forwardDtr0018(page);
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'VR device transfer for Rahul Verma, Forwarded. Open' }),
    );
    await page.waitForURL(`**${LIST}/DTR-0018`);
    await expect(panel(page)).toContainText(
      'Approving moves Rahul Verma’s VR authorisation to the new device.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      'ForwardedGodavari Institute of Technology',
    );
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      'OperationsDevice transfersRahul Verma',
    );
    await expectNoReferences(page);
    await checkState(page, 'VR device transfer for Rahul Verma');

    const approve = panel(page).getByRole('button', { name: 'Approve transfer' });
    await reachAndClick(page, approve);
    const dialog = page.getByRole('dialog', { name: APPROVE_TITLE });
    await expect(dialog).toContainText(
      'Rahul Verma’s VR authorisation moves from ME lab VR headset, asset tag GIT-VR-03 to ME lab VR headset, asset tag GIT-VR-07.',
    );
    await expect(dialog).toContainText('Rahul Verma and the Institute Admin see “Approved”.');
    await expect(dialog).toContainText('Nothing is sent, collected or registered from here.');
    await expect(dialog.getByRole('heading', { name: APPROVE_TITLE })).toBeFocused();
    // The dialog pops in (`rk-pop`, 180 ms): axe reads its colours once it has settled.
    await dialog.evaluate((element) =>
      Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => null)),
      ),
    );
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
    const flash = page.locator('#transfer-flash');
    await expect(flash).toBeFocused();
    await expect(flash).toHaveText(
      'Approved.Rahul Verma and the Institute Admin now see “Approved”.',
    );
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Approved');
    await expect(panel(page).locator('.rk-done-meta')).toHaveText(
      /^Approved on \d{1,2} \w{3} 2026, \d\d:\d\d by Arjun Mehta$/,
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(
      panel(page).getByRole('link', { name: 'Back to device transfers' }),
    ).toHaveAttribute('href', LIST);
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

  test('approved: read-only with who and when', async ({ page }) => {
    await open(page, 'after-flow-device', `${LIST}/DTR-0018`);
    await expect(panel(page).locator('.rk-done-meta')).toHaveText(
      'Approved on 24 Oct 2026, 12:30 by Arjun Mehta',
    );
    await expect(page.getByRole('button', { name: 'Approve transfer' })).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, 'VR device transfer for Rahul Verma');
  });

  test('still with the institution: nothing to approve, the panel says why', async ({ page }) => {
    await open(page, 'state-coverage', `${LIST}/DTR-0019`);
    await expect(panel(page).locator('.rk-notice--off')).toHaveText(
      'Not BITS’s to decide yetIt is still with the institution. It appears in Forwarded when the Institute Admin forwards it.',
    );
    await expect(page.getByRole('button', { name: 'Approve transfer' })).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, 'VR device transfer for Imran Shaikh');
  });
});

test.describe('SA-07 Institution detail', () => {
  test('a forwarded transfer waits for the institution and opens its decision (SA-v1 `att`)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', '/admin/institutions/godavari');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Godavari Institute of Technology' }),
    ).toBeVisible();
    await forwardDtr0018(page);
    // "Also waiting for this institution" in the panel (`ul.sa-attn`), named by its content.
    const waiting = page
      .getByRole('complementary', { name: 'What you can do' })
      .locator('.sa-attn li', { hasText: 'VR device transfer for Rahul Verma' });
    await expect(waiting).toBeVisible();
    await expect(waiting).not.toContainText('DTR-');
    await checkState(page, 'Godavari Institute of Technology');
    await reachAndClick(page, waiting.getByRole('link', { name: 'Review transfer' }));
    await page.waitForURL(`**${LIST}/DTR-0018`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Rahul Verma');
  });
});
