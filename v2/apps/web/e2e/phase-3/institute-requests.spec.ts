import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * Phase 3 in V3, the Institute Admin's Requests as the owner-approved Institute Admin export draws
 * them (design/v3-refined-b/roles/IA-v1), on the test-hook build at 1440, 1024, 768 and 375: IA-17
 * Requests to BITS, its form, its result and its request detail, IA-18 Device requests and IA-19
 * Device request — review & forward, as Meera Iyer (Godavari). Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll) and shows no internal reference (the owner's identifier rule:
 * state-copy `IA-17.no-reference`); the forward dialog passes axe and keeps the keyboard inside it,
 * Esc returning focus to its trigger. Worlds: after Flow B (the new-access request only; no device
 * request), after Flow C (the more-licences request Under review; the decided device request), and
 * the state coverage (Imran Shaikh's device request waiting on Meera).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const ARJUN = { personId: 'sa-arjun-mehta' };
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';
const FORWARD_IMRAN = 'Forward Imran Shaikh’s device request to BITS?';

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

/**
 * No internal reference where a person meets it (state-copy `IA-17.no-reference`): the page's
 * words, the accessible names and titles, and the browser tab.
 */
async function expectNoReference(page: Page): Promise<void> {
  const found = await page.evaluate(() => {
    const reference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
    const named = [...document.querySelectorAll('[aria-label], [title], [placeholder]')].map(
      (element) =>
        ['aria-label', 'title', 'placeholder']
          .map((name) => element.getAttribute(name) ?? '')
          .join(' '),
    );
    return [document.body.innerText, document.title, ...named].filter((text) =>
      reference.test(text),
    );
  });
  expect(found).toEqual([]);
}

/** The forward dialog is accessible and modal: axe, Tab stays inside, Esc closes it back to its trigger. */
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

/** The Super Admin pauses Godavari, as SA-07 does. */
async function pauseGodavari(page: Page): Promise<void> {
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
}

test.describe('IA-17 Requests to BITS (IA-v1)', () => {
  test('the list after IA-17: the more-licences request Under review above the new-access one; Requests current', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests');
    const rows = page
      .getByRole('table', { name: 'Requests to BITS, newest first' })
      .locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('More licences');
    await expect(rows.nth(0)).toContainText('Sent 21 Oct 2026');
    await expect(rows.nth(0)).toContainText('60 more licences · Shell-and-Tube Heat Exchanger');
    await expect(rows.nth(0)).toContainText('Under review');
    await expect(
      rows.nth(0).getByRole('link', {
        name: 'More licences, sent 21 Oct 2026, Under review. Open the request',
      }),
    ).toHaveAttribute('href', '/institute/requests/REQ-0058');
    await expect(rows.nth(1)).toContainText('8 Oct 2026, 15:05');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await expect(
      page
        .getByRole('navigation', { name: 'Requests' })
        .getByRole('link', { name: 'Requests to BITS' }),
    ).toHaveAttribute('aria-current', 'page');
    await checkState(page, 'Requests');
    await expectNoReference(page);
  });

  test('more licences: the drawn errors, then sent — Under review, back to the list', async ({
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
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Ask BITS');
    await reachAndClick(
      page,
      page.getByRole('radio', { name: 'More licences for experiments you hold' }),
    );
    const licences = page.getByRole('textbox', { name: 'Licences requested' });
    await licences.fill('sixty');
    await reachAndClick(page, page.getByRole('button', { name: 'Send request to BITS' }));
    const summary = page.locator('.rk-errsum');
    await expect(summary).toContainText('Check your request');
    await expect(summary).toContainText('Enter a whole number, like 60');
    await expect(summary).toBeFocused();
    await expect(licences).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Ask for a renewal or more licences');
    await expectNoReference(page);
    await licences.fill('60');
    await reachAndClick(page, page.getByRole('button', { name: 'Send request to BITS' }));
    const sent = page.getByRole('heading', { level: 1, name: 'Request sent to BITS' });
    await expect(sent).toBeVisible();
    await expect(main(page)).toContainText(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    await expect(page.locator('#ask-done')).toBeFocused();
    await expect(main(page).getByRole('link', { name: 'View request' })).toHaveAttribute(
      'href',
      /^\/institute\/requests\/REQ-\d{4}$/,
    );
    await checkState(page, 'Request sent to BITS');
    await expectNoReference(page);
    await reachAndClick(page, page.getByRole('button', { name: 'Back to Requests' }));
    const rows = page
      .getByRole('table', { name: 'Requests to BITS, newest first' })
      .locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Under review');
  });

  test('renewal mirrors the plan', async ({ page }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/requests');
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    );
    await reachAndClick(page, page.getByRole('radio', { name: 'Renew your access plan' }));
    const renewing = page.getByRole('region', { name: 'The plan you’re renewing' });
    await expect(renewing).toContainText('Yearly · current plan ends 7 Oct 2027');
    await expect(renewing).toContainText('120 licences');
    await expect(
      renewing.getByRole('img', { name: 'Formats in your access plan: WEB, VR' }),
    ).toBeVisible();
    await checkState(page, 'Ask for a renewal or more licences');
    await expectNoReference(page);
  });

  test('request detail · Under review', async ({ page }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests/REQ-0058');
    await expect(page.getByRole('heading', { level: 1, name: '60 more licences' })).toBeVisible();
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Sent 21 Oct 2026, 16:05');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      '60 more licences',
    );
    await expect(page.getByRole('region', { name: 'History' })).toContainText('Sent to BITS');
    await expect(page.getByRole('region', { name: 'Where it stands' })).toContainText(
      'Not started',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await checkState(page, '60 more licences');
    await expectNoReference(page);
  });

  test('request detail · Approved — payment required, as BITS decides it', async ({ page }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests/REQ-0058');
    await expect(page.getByRole('region', { name: 'History' })).toBeVisible();
    const found = await actAs<{ ok: boolean; value: { request: { rev: number } } }>(page, ARJUN, {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: 'REQ-0058',
    });
    const approved = await actAs<{ ok: boolean }>(page, ARJUN, {
      port: 'accessRequests',
      method: 'approveRequest',
      input: { id: 'REQ-0058', route: null, expectedRev: found.value.request.rev },
    });
    expect(approved.ok).toBe(true);
    const notice = main(page).locator('.rk-notice--warn');
    await expect(notice).toContainText('Approved — payment required');
    await expect(notice.getByRole('link', { name: 'Open the payment page' })).toHaveAttribute(
      'href',
      /^\/requests\/rq-\d+\/payment$/,
    );
    await expect(page.getByRole('region', { name: 'Where it stands' })).toContainText(
      'Waiting, not confirmed',
    );
    await checkState(page, '60 more licences');
    await expectNoReference(page);
  });

  test('paused: read-only — the drawn notice, no ask; the list stays', async ({ page }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests');
    await expect(
      page.getByRole('table', { name: 'Requests to BITS, newest first' }).locator('tbody tr'),
    ).toHaveCount(2);
    await pauseGodavari(page);
    await expect(main(page).locator('.rk-notice--paused')).toContainText(
      'You can’t ask BITS for anything while your institution’s access is paused',
    );
    await expect(
      main(page).getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toHaveCount(0);
    await checkState(page, 'Requests');
    await expectNoReference(page);
  });
});

test.describe('IA-18 Device requests and IA-19 Device request (IA-v1)', () => {
  test('IA-18: one row per request with its status in words; Review opens IA-19', async ({
    page,
  }) => {
    await open(page, 'state-coverage', MEERA, '/institute/requests?tab=devices');
    const rows = page
      .getByRole('table', { name: 'Device requests from your students' })
      .locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Waiting on you');
    await expect(rows.nth(1)).toContainText('Decided · approved by BITS');
    await expect(
      rows.nth(1).getByRole('link', { name: 'VR device transfer from Rahul Verma, 22 Oct 2026' }),
    ).toHaveAttribute('href', '/institute/requests/devices/DTR-0018');
    await expect(
      rows.nth(1).getByRole('link', { name: 'Rahul Verma', exact: true }),
    ).toHaveAttribute('href', '/institute/people/students/per-0002');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/requests');
    await checkState(page, 'Requests');
    await expectNoReference(page);
    await reachAndClick(page, page.getByRole('link', { name: 'Review Imran Shaikh’s request' }));
    await page.waitForURL('**/institute/requests/devices/DTR-0019');
    await expect(
      page.getByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
    ).toBeVisible();
  });

  test('IA-19: Forward to BITS → the dialog → Forwarded to BITS', async ({ page }) => {
    await open(page, 'state-coverage', MEERA, '/institute/requests/devices/DTR-0019');
    const heading = 'VR device transfer for Imran Shaikh';
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(heading);
    await checkState(page, heading);
    await expectNoReference(page);
    const forward = main(page).getByRole('button', { name: 'Forward to BITS' });
    await reachAndClick(page, forward);
    await checkDialog(page, FORWARD_IMRAN);
    await expect(forward).toBeFocused();
    await reachAndClick(page, forward);
    const dialog = page.getByRole('dialog', { name: FORWARD_IMRAN });
    await expect(dialog.getByRole('button', { name: 'Forward to BITS' })).toBeFocused();
    await expectNoReference(page);
    await dialog.getByRole('button', { name: 'Forward to BITS' }).click();
    await expect(dialog).toBeHidden();
    const flash = page.locator('#device-request-flash');
    await expect(flash).toContainText('Forwarded to BITS');
    await expect(flash).toContainText('Imran Shaikh sees “Forwarded to BITS”. BITS decides.');
    await expect(flash).toBeFocused();
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Forwarded to BITS');
    await expect(main(page).getByRole('button', { name: 'Forward to BITS' })).toHaveCount(0);
    await checkState(page, heading);
    await expectNoReference(page);
  });

  test('IA-19 waiting on you from a request Rahul sends now', async ({ page }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/requests?tab=devices');
    const rows = page
      .getByRole('table', { name: 'Device requests from your students' })
      .locator('tbody tr');
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
    await expectNoReference(page);
  });

  test('IA-19 decided · approved by BITS: read-only', async ({ page }) => {
    await open(page, 'after-flow-device', MEERA, '/institute/requests/devices/DTR-0018');
    const heading = 'VR device transfer for Rahul Verma';
    await expect(page.getByRole('region', { name: 'Your action' })).toContainText(
      'BITS approved this transfer. Nothing more is needed from you.',
    );
    await expect(main(page).getByRole('button', { name: 'Forward to BITS' })).toHaveCount(0);
    await checkState(page, heading);
    await expectNoReference(page);
  });

  test('paused: Device requests and the device request wait, read-only', async ({ page }) => {
    await open(page, 'state-coverage', MEERA, '/institute/requests?tab=devices');
    const rows = page
      .getByRole('table', { name: 'Device requests from your students' })
      .locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await pauseGodavari(page);
    await expect(main(page).locator('.rk-notice--paused')).toContainText(
      'You can’t forward requests right now',
    );
    await expect(main(page).getByRole('link', { name: /^Review / })).toHaveCount(0);
    await checkState(page, 'Requests');
    await reachAndClick(
      page,
      page.getByRole('link', { name: 'VR device transfer from Imran Shaikh, 15 Nov 2026' }),
    );
    const heading = 'VR device transfer for Imran Shaikh';
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Your action' })).toContainText(
      'Forwarding is unavailable while access is paused.',
    );
    await expect(main(page).getByRole('button', { name: 'Forward to BITS' })).toHaveCount(0);
    await checkState(page, heading);
    await expectNoReference(page);
  });
});
