import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  inspectWorld,
  reachAndClick,
  startReview,
  TEST_HOOKS_URL,
} from '../support';
import { checkState } from '../support/screen-checks';
import { SUPER_ADMIN } from '../support/workspace';

/**
 * Package 1E — SA-03 keeps the revision a decision began with (P1-21; state-copy `SA-03.moved-on`),
 * through the screen, at 1440, 1024, 768 and 375. Test-hook build: the change made meanwhile is the
 * AD-14 review start, a CI-only fact (`startReview`) that keeps the request under review with a
 * newer revision — no ordinary product interaction can make it. Before Package 1E the panel sent
 * the revision read at confirm, so these decisions were accepted on a request that had changed.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const heading = (page: Page) => panel(page).getByRole('heading', { name: 'Your decision' });

interface DecisionAnswer {
  readonly value: {
    readonly request: {
      readonly status: string;
      readonly rev: number;
      readonly decision: unknown;
      readonly informationRequest: unknown;
    };
  };
}

async function requestOf(page: Page, id: string): Promise<DecisionAnswer['value']['request']> {
  const answer = await actAs<DecisionAnswer>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: id,
  });
  return answer.value.request;
}

async function openDecision(page: Page, id: string): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
  await page.goto(`/admin/requests/${id}`);
  await expect(panel(page)).toBeVisible();
}

/** The review start recorded meanwhile; the page shows it (the request stays under review). */
async function reviewStartedMeanwhile(page: Page, id: string): Promise<void> {
  const before = (await requestOf(page, id)).rev;
  await startReview(page, id);
  await expect(page.getByRole('region', { name: 'History' })).toContainText(
    'BITS started reviewing',
  );
  expect((await requestOf(page, id)).rev).toBe(before + 1);
}

test('the confirmation open while the request changes: refused as stale, nothing written, focus on the panel', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  await reachAndClick(page, panel(page).locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve request' }));
  const dialog = page.getByRole('dialog', { name: 'Approve REQ-0040?' });
  await expect(dialog).toBeVisible();
  const lines = await dialog.locator('li').allTextContents();
  await reviewStartedMeanwhile(page, 'REQ-0040');
  await expect(dialog).toBeVisible();
  expect(await dialog.locator('li').allTextContents()).toEqual(lines);
  const before = await inspectWorld(page);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Approve request' }));
  await expect(dialog).toBeHidden();
  await expect(heading(page)).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  const request = await requestOf(page, 'REQ-0040');
  expect([request.status, request.decision]).toEqual(['under-review', null]);
  await expect(panel(page).getByRole('radio', { name: /Approve request/ })).toBeChecked();
  await checkState(page, 'Konark Polytechnic');
  // Decided again on the request as it is now shown: accepted.
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve request' }));
  await reachAndClick(page, dialog.getByRole('button', { name: 'Approve request' }));
  await expect(panel(page).locator('.xr-status')).toHaveText('Approved — payment required');
  await expect(heading(page)).toBeFocused();
});

test('Request more information typed before the change: refused, the question kept, then sent', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  await reachAndClick(page, panel(page).locator('label[for="decision-info"]'));
  const question = panel(page).getByLabel('What do you need from the requester? (required)');
  await question.fill('Please confirm the size of the second section.');
  await reviewStartedMeanwhile(page, 'REQ-0040');
  const before = await inspectWorld(page);
  const send = panel(page).getByRole('button', { name: 'Send request for information' });
  await reachAndClick(page, send);
  await expect(heading(page)).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(before.worldVersion);
  expect((await requestOf(page, 'REQ-0040')).informationRequest).toBeNull();
  await expect(question).toHaveValue('Please confirm the size of the second section.');
  await checkState(page, 'Konark Polytechnic');
  await reachAndClick(page, send);
  await expect(panel(page).locator('.xr-status')).toHaveText('Information requested');
});

test('decided in another session while the confirmation is open: the decided panel, focus kept on the page', async ({
  page,
}) => {
  await openDecision(page, 'REQ-0040');
  await reachAndClick(page, panel(page).locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve request' }));
  const dialog = page.getByRole('dialog', { name: 'Approve REQ-0040?' });
  await expect(dialog).toBeVisible();
  const opened = await requestOf(page, 'REQ-0040');
  // The bridge's `actAs` is another session on this world; its receipt refreshes this page.
  const elsewhere = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'requestMoreInformation',
    input: { id: 'REQ-0040', reason: 'Asked from another tab.', expectedRev: opened.rev },
  });
  expect(elsewhere.ok).toBe(true);
  const after = await inspectWorld(page);
  await expect(panel(page).locator('.xr-status')).toHaveText('Information requested');
  await expect(dialog).toBeHidden();
  await expect(heading(page)).toBeFocused();
  expect((await inspectWorld(page)).worldVersion).toBe(after.worldVersion);
  await checkState(page, 'Konark Polytechnic');
});
