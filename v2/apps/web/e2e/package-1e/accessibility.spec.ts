import { expect, type Locator, type Page, test } from '@playwright/test';

import { addShellAndTube, fillDetails, panelOf, SHELL_AND_TUBE, shown } from '../package-1c/flow';
import {
  actAs,
  bootWorld,
  expectNoAxeViolations,
  inspectWorld,
  reachAndClick,
  TEST_HOOKS_URL,
} from '../support';
import { checkState, smallTargets } from '../support/screen-checks';
import { SUPER_ADMIN } from '../support/workspace';

/**
 * Package 1E — the Phase-1 states the earlier packages checked only in part (coverage review):
 * the keyboard inside SA-03's and SA-07's dialogs (Tab and Shift+Tab stay in the dialog, Esc is
 * Cancel, focus returns to the trigger), SA-03's smaller-scope state and its confirmation, an
 * unknown SA-03 reference, and PU-08's "Until a fixed date" — at 1440, 1024, 768 and 375, with
 * real keys and pointer clicks reached by the wheel.
 */

/** Tab (or Shift+Tab) round the dialog more than once: focus never leaves it (board 10). */
async function expectFocusKeptIn(page: Page, dialog: Locator, key: 'Tab' | 'Shift+Tab') {
  const stops = await dialog.evaluate(
    (node) =>
      node.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea, select, a[href], [tabindex="0"]',
      ).length,
  );
  for (let press = 0; press < stops * 2 + 1; press += 1) {
    await page.keyboard.press(key);
    expect(
      await dialog.evaluate((node) => node.contains(node.ownerDocument.activeElement)),
      `${key} ${press + 1}: focus stays in the dialog`,
    ).toBe(true);
  }
}

test.describe('the test-hook build (spine-start world, the Super Admin)', () => {
  test.use({ baseURL: TEST_HOOKS_URL });

  const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });

  async function openDecision(page: Page, id: string): Promise<void> {
    await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
    await page.goto(`/admin/requests/${id}`);
    await expect(panel(page)).toBeVisible();
  }

  test('SA-03 external confirmation: the keyboard stays in it, Esc is Cancel, focus back', async ({
    page,
  }) => {
    await openDecision(page, 'REQ-0040');
    const before = await inspectWorld(page);
    await reachAndClick(page, panel(page).locator('label[for="decision-approve"]'));
    const trigger = panel(page).getByRole('button', { name: 'Approve request' });
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('dialog', {
      name: 'Approve the request from Konark Polytechnic?',
    });
    // The V3 confirmation opens on its title (SA-v1 `openDlg` → `dlg-t`).
    await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
    await expectNoAxeViolations(page);
    expect(await smallTargets(page)).toEqual([]);
    await expectFocusKeptIn(page, dialog, 'Tab');
    await expectFocusKeptIn(page, dialog, 'Shift+Tab');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  });

  test('SA-03 smaller scope: the composed state and its confirmation', async ({ page }) => {
    await openDecision(page, 'REQ-0040');
    await reachAndClick(page, panel(page).locator('label[for="decision-smaller"]'));
    await reachAndClick(page, panel(page).locator('label[for="decision-format-ar"]'));
    await panel(page)
      .getByLabel('Reason for the change (required)')
      .fill('AR is not part of the second section.');
    await expect(panel(page)).toContainText('Different from the request');
    await checkState(page, 'Konark Polytechnic');
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve smaller scope' }));
    const dialog = page.getByRole('dialog', {
      name: 'Approve a smaller scope for Konark Polytechnic?',
    });
    await expect(dialog).toContainText('The requester sees what changed and your reason.');
    await expectNoAxeViolations(page);
    expect(await smallTargets(page)).toEqual([]);
    await expectFocusKeptIn(page, dialog, 'Tab');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Approve smaller scope' })).toBeFocused();
  });

  test('SA-03 unknown reference: the GL-04 “not available” page, nothing of any request', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
    await page.goto('/admin/requests/REQ-9999');
    await checkState(page, 'This page isn’t available');
    await expect(page.locator('main')).not.toContainText(/REQ-\d{4} ·|Konark|Godavari/);
  });

  test('SA-07 Assign Institute Admin: the keyboard stays in the dialog, Esc is Cancel, focus back', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
    await page.goto('/admin/institutions/sahyadri');
    const trigger = page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Assign Institute Admin' });
    await expect(trigger).toBeVisible();
    const before = await inspectWorld(page);
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('dialog', {
      name: 'Assign the Institute Admin for Sahyadri Institute of Engineering',
    });
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused();
    await expectNoAxeViolations(page);
    expect(await smallTargets(page)).toEqual([]);
    await expectFocusKeptIn(page, dialog, 'Tab');
    await expectFocusKeptIn(page, dialog, 'Shift+Tab');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  });
  test('SA-07 Restore access: the dialog’s keyboard, then the restored state', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
    await page.goto('/admin/institutions/sahyadri');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sahyadri Institute of Engineering' }),
    ).toBeVisible();
    // Paused first, by the Super Admin's own command (the bridge; its receipt refreshes the page).
    const read = await actAs<{ value: { institution: { rev: number } } }>(page, SUPER_ADMIN, {
      port: 'institutions',
      method: 'getInstitution',
      input: 'sahyadri',
    });
    await actAs(page, SUPER_ADMIN, {
      port: 'institutions',
      method: 'pauseInstitution',
      input: {
        institutionId: 'sahyadri',
        reason: 'Checking the plan.',
        expectedRev: read.value.institution.rev,
      },
    });
    const trigger = page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Restore access' });
    await expect(trigger).toBeVisible();
    await checkState(page, 'Sahyadri Institute of Engineering');
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('dialog', {
      name: 'Restore access for Sahyadri Institute of Engineering?',
    });
    await expect(dialog.getByRole('textbox')).toBeFocused();
    await expectNoAxeViolations(page);
    expect(await smallTargets(page)).toEqual([]);
    await expectFocusKeptIn(page, dialog, 'Tab');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await reachAndClick(page, trigger);
    await dialog.getByRole('textbox').fill('The plan is confirmed.');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Restore access' }));
    await expect(page.locator('main .rk-notice--ok[role="status"]')).toHaveText(
      'Access restored.Sahyadri Institute of Engineering can work again.',
    );
    await checkState(page, 'Sahyadri Institute of Engineering');
  });
});

test.describe('the product build', () => {
  test('PU-01 area explorer at a phone width: swiped to the second area, the page checked', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 600, 'The swipe counter is the explorer below 600 px.');
    await page.goto('/');
    const region = page.getByRole('region', { name: 'Engineering areas' });
    await expect(region.getByText('Swipe for more areas')).toBeVisible();
    await region.locator('.xp-ex-track').evaluate((track) => {
      const second = track.children[1] as HTMLElement;
      track.scrollTo({ left: second.offsetLeft - 2 });
    });
    await expect(region.locator('.xp-ex-count')).toHaveText('2 of 3');
    await checkState(page, 'Set the conditions.');
  });

  test('PU-08 “Until a fixed date”: the end date asked for, checked on every width', async ({
    page,
  }) => {
    await page.goto(SHELL_AND_TUBE);
    await addShellAndTube(page);
    await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
    await page.waitForURL('**/selection');
    await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
    await page.waitForURL('**/request-access');
    await fillDetails(page);
    await reachAndClick(page, page.locator('label[for="request-term-3"]'));
    const end = page.getByLabel('End date', { exact: true });
    await expect(end).toBeVisible();
    await checkState(page, 'Request institutional access');
    // Without the date the review is refused on the field (B1-07), focus on the error summary.
    await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
    const summary = page.locator('#request-errors');
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('There is 1 problem with this request');
    await expect(end).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Request institutional access');
  });
});
