import { expect, type Page, test } from '@playwright/test';

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
 * SA-03 Request decision (board B1-11) on the spine-start sample world, as the Super Admin, at
 * 1440, 1024, 768 and 375 (Phase-1 Package 1A): the details, the sticky decision panel beside
 * them from 860 px of content and under them below (with "Go to decision"), the panel's drawn
 * checks, the confirmation (DL-1), the commands' change to the shared world, the renewal's
 * unavailable smaller scope and the paused institution's blocked panel (after a real pause).
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function openDecision(page: Page, requestId: string): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
  await page.goto(`/admin/requests/${requestId}`);
  await expect(page.getByRole('complementary', { name: 'Your decision' })).toBeVisible();
}

const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });

interface DecisionAnswer {
  readonly ok: boolean;
  readonly value: { readonly request: { readonly status: string; readonly rev: number } };
}

async function statusOf(page: Page, requestId: string): Promise<string> {
  const answer = await actAs<DecisionAnswer>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: requestId,
  });
  return answer.value.request.status;
}

test('REQ-0038 (renewal): details and panel; the panel beside or under the details', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0038');
  await checkState(page, 'BITS Pilani — Hyderabad Campus');
  await expect(page).toHaveTitle('REQ-0038 · XR Learning Platform');
  const decision = panel(page);
  await expect(decision.getByRole('radio', { name: /Approve a smaller scope/ })).toBeDisabled();
  await expect(decision).toContainText(
    'Not available for a renewal — the term continues the current plan.',
  );
  const content = await page
    .locator('main .xr-content')
    .evaluate((element) => element.getBoundingClientRect().width);
  const jump = page.getByRole('link', { name: 'Go to decision' });
  if (content >= 860) {
    // B1-11: details ~72 %, the sticky panel ~28 % beside them; no jump link.
    await expect(jump).toBeHidden();
    await expect(decision).toHaveCSS('position', 'sticky');
    const [main, side] = [
      await page.locator('.xr-decide > .xr-stack').boundingBox(),
      await decision.boundingBox(),
    ];
    expect(side!.x).toBeGreaterThan(main!.x + main!.width - 1);
  } else {
    // f15: the panel under the content; "Go to decision" moves focus to it.
    await reachAndClick(page, jump);
    await expect(decision).toBeFocused();
  }
});

test('Approve request (REQ-0038, internal): confirm, then the decided panel', async ({ page }) => {
  await openDecision(page, 'REQ-0038');
  const decision = panel(page);
  const before = await inspectWorld(page);
  await reachAndClick(page, decision.locator('label[for="decision-approve"]'));
  await expect(decision).toContainText(
    'Internal or external: Internal — set when this institution was first approved.',
  );
  await reachAndClick(page, decision.getByRole('button', { name: 'Approve request' }));
  const dialog = page.getByRole('dialog', { name: 'Approve REQ-0038?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Approve request' })).toBeFocused();
  await expectNoAxeViolations(page);
  expect(await smallTargets(page)).toEqual([]);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Approve request' }));
  await expect(dialog).toBeHidden();
  await expect(decision.locator('.xr-status')).toHaveText('Access active');
  await expect(decision.getByRole('heading', { name: 'Your decision' })).toBeFocused();
  await expect(decision.locator('dl.xp-stand dd')).toHaveText([
    'Exists',
    'Approved · Internal',
    'Not needed (internal)',
    'Active',
  ]);
  expect(await statusOf(page, 'REQ-0038')).toBe('access-active');
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion + 1);
  await checkState(page, 'BITS Pilani — Hyderabad Campus');
});

test('Request more information (REQ-0040): the question is required, then it waits', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  const decision = panel(page);
  await reachAndClick(page, decision.locator('label[for="decision-info"]'));
  await reachAndClick(page, decision.getByRole('button', { name: 'Send request for information' }));
  const errors = decision.getByRole('alert');
  await expect(errors).toContainText('Enter what you need from the requester');
  await expect(errors).toBeFocused();
  await checkState(page, 'Konark Polytechnic');
  await decision
    .getByLabel('What do you need from the requester? (required)')
    .fill('Please confirm the size of the second section.');
  await reachAndClick(page, decision.getByRole('button', { name: 'Send request for information' }));
  await expect(decision.locator('.xr-status')).toHaveText('Information requested');
  await expect(decision.getByRole('heading', { name: 'Your decision' })).toBeFocused();
  expect(await statusOf(page, 'REQ-0040')).toBe('information-requested');
  await expect(page.getByRole('region', { name: 'History' })).toContainText(
    '“Please confirm the size of the second section.”',
  );
  // The sidebar's count follows the world: one request under review now.
  await expect(
    page.locator('aside.xr-side nav a[href="/admin/requests"] .xr-count .xr-sr'),
  ).toHaveText(', 1 requests under review');
});

test('the confirmation: Esc is Cancel — nothing changes, focus back to the trigger', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  const decision = panel(page);
  const before = await inspectWorld(page);
  await reachAndClick(page, decision.locator('label[for="decision-approve"]'));
  const trigger = decision.getByRole('button', { name: 'Approve request' });
  await reachAndClick(page, trigger);
  const dialog = page.getByRole('dialog', { name: 'Approve REQ-0040?' });
  await expect(dialog).toContainText(
    'Approves the request. Its status becomes Approved — payment required.',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  expect(await statusOf(page, 'REQ-0040')).toBe('under-review');
});

test('a paused institution (B1-11 f14): no decision controls, after a real pause', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
  await page.goto('/admin/requests');
  await expect(page.locator('table.xr-table tbody td.is-primary a').first()).toBeVisible();
  const konark = await actAs<{ value: { institution: { id: string; rev: number } } }>(
    page,
    SUPER_ADMIN,
    { port: 'institutions', method: 'getInstitution', input: 'konark' },
  );
  await actAs(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: konark.value.institution.id,
      reason: 'Licence review.',
      expectedRev: konark.value.institution.rev,
    },
  });
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open request REQ-0040, Konark Polytechnic' }),
  );
  const decision = panel(page);
  await expect(decision).toContainText('This institution is paused');
  await expect(decision.getByRole('radio')).toHaveCount(0);
  await expect(decision.getByRole('button')).toHaveCount(0);
  await checkState(page, 'Konark Polytechnic');
});
