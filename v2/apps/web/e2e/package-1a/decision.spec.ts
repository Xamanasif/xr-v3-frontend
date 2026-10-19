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
import { revealSidebar, sidebarLink, SUPER_ADMIN } from '../support/workspace';

/**
 * SA-03 Request decision in the V3 design (the Super Admin export `sa-views-a.js` `V.decision`) on
 * the spine-start sample world, as the Super Admin, at 1440, 1024, 768 and 375: the record, the
 * sticky decision panel beside it from 860 px of page and under it below (with "Go to decision"),
 * the panel's checks, the confirmation, the commands' change to the shared world, the renewal's
 * unavailable smaller scope and the paused institution's blocked panel (after a real pause). The
 * request is named by its institution, never by its reference.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function openDecision(page: Page, requestId: string): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
  await page.goto(`/admin/requests/${requestId}`);
  await expect(page.getByRole('complementary', { name: 'Your decision' })).toBeVisible();
}

const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const heading = (page: Page) => panel(page).getByRole('heading', { name: 'Your decision' });
const HYDERABAD = 'BITS Pilani — Hyderabad Campus';

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

test('REQ-0038 (renewal): the record and the panel; the panel beside or under the record', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0038');
  await checkState(page, HYDERABAD);
  await expect(page).toHaveTitle(`${HYDERABAD} · Requests · XR Learning Platform`);
  await expect(page.locator('main')).not.toContainText(/\b(?:REQ|ACC)-\d/);
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Requests' }),
  ).toHaveAttribute('href', '/admin/requests');
  const decision = panel(page);
  const smaller = decision.getByRole('radio', { name: 'Approve a smaller scope' });
  await expect(smaller).toBeDisabled();
  await expect(smaller).toHaveAccessibleDescription(
    'Not available for a renewal. The term continues the current plan.',
  );
  const jump = page.getByRole('link', { name: 'Go to decision' });
  if (await jump.isVisible()) {
    // Under 860 px of page: the panel follows the record; "Go to decision" moves focus to it.
    await reachAndClick(page, jump);
    await expect(heading(page)).toBeFocused();
    const [sheet, side] = [
      await page.locator('main .rk-mainsheet').boundingBox(),
      await decision.boundingBox(),
    ];
    expect(side!.y).toBeGreaterThan(sheet!.y + sheet!.height - 1);
  } else {
    // The record and the sticky panel beside it.
    await expect(decision).toHaveCSS('position', 'sticky');
    const [sheet, side] = [
      await page.locator('main .rk-mainsheet').boundingBox(),
      await decision.boundingBox(),
    ];
    expect(side!.x).toBeGreaterThan(sheet!.x + sheet!.width - 1);
  }
});

test('Approve request (REQ-0038, internal): confirm, then the decided panel', async ({ page }) => {
  await openDecision(page, 'REQ-0038');
  const decision = panel(page);
  const before = await inspectWorld(page);
  await reachAndClick(page, decision.locator('label[for="decision-approve"]'));
  await expect(decision.locator('.rk-locked')).toHaveText(
    'Internal or external: Internal. Set when this institution was first approved.',
  );
  await reachAndClick(page, decision.getByRole('button', { name: 'Approve request' }));
  const dialog = page.getByRole('dialog', { name: `Approve the renewal from ${HYDERABAD}?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
  // The renewal's plan effect is open: the confirmation never claims a plan.
  await expect(dialog.locator('li')).toHaveText([
    'Approves the renewal. There is no payment step.',
    'This page does not change the current plan. Its term still shows as ending on 31 Oct 2026.',
    'Students get access only when the institution’s administrator gives it.',
  ]);
  await expectNoAxeViolations(page);
  expect(await smallTargets(page)).toEqual([]);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Approve request' }));
  await expect(dialog).toBeHidden();
  await expect(decision.locator('.rk-done .xr-st')).toHaveText('Access active');
  await expect(heading(page)).toBeFocused();
  await expect(decision.locator('dl.rk-stand dd')).toHaveText([
    'Exists',
    'Approved (internal)',
    'Not needed (internal)',
    'Active, unchanged',
  ]);
  expect(await statusOf(page, 'REQ-0038')).toBe('access-active');
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion + 1);
  await checkState(page, HYDERABAD);
});

test('Request more information (REQ-0040): the question is required, then it waits', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  const decision = panel(page);
  await reachAndClick(page, decision.locator('label[for="decision-info"]'));
  await reachAndClick(page, decision.getByRole('button', { name: 'Send request for information' }));
  const errors = decision.getByRole('alert');
  await expect(errors).toContainText('Check your decision');
  await expect(
    errors.getByRole('link', { name: 'Enter what you need from the requester' }),
  ).toBeVisible();
  await expect(errors).toBeFocused();
  await checkState(page, 'Konark Polytechnic');
  await decision
    .getByLabel('What do you need from the requester? (required)')
    .fill('Please confirm the size of the second section.');
  await reachAndClick(page, decision.getByRole('button', { name: 'Send request for information' }));
  await expect(decision.locator('.rk-done .xr-st')).toHaveText('Information requested');
  await expect(heading(page)).toBeFocused();
  expect(await statusOf(page, 'REQ-0040')).toBe('information-requested');
  await expect(page.getByRole('region', { name: 'History' })).toContainText(
    '“Please confirm the size of the second section.”',
  );
  // The rail's count follows the world: one request under review now.
  await revealSidebar(page);
  await expect(sidebarLink(page, '/admin/requests').locator('.rb-count .xr-sr')).toHaveText(
    ', 1 request under review',
  );
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
  const dialog = page.getByRole('dialog', { name: 'Approve the request from Konark Polytechnic?' });
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
  await expect(page.locator('table.rk-table a.rk-rowlink').first()).toBeVisible();
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
    page.getByRole('link', {
      name: 'Konark Polytechnic, additional licences, received 29 Sep 2026, Under review. Open the request',
    }),
  );
  const decision = panel(page);
  await expect(decision.locator('.rk-notice--paused')).toContainText('This institution is paused');
  await expect(decision.getByRole('link', { name: 'View institution' })).toHaveAttribute(
    'href',
    '/admin/institutions/konark',
  );
  await expect(decision.getByRole('radio')).toHaveCount(0);
  await expect(decision.getByRole('button')).toHaveCount(0);
  await checkState(page, 'Konark Polytechnic');
});
