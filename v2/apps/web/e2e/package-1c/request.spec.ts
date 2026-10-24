import { expect, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument } from '../support/workspace';
import {
  addShellAndTube,
  fillDetails,
  panelOf,
  RECORD,
  SHELL_AND_TUBE,
  shown,
  statusHead,
  wide,
} from './flow';

/**
 * PU-07 Your selection (B1-06), PU-08 Request institutional access and PU-09 Request sent (B1-07),
 * on the PRODUCT build at 1440, 1024, 768 and 375: each drawn state passes the screen checks (one
 * H1, axe, visible focus, 24-px targets, no developer surface, no sideways scroll), every move is a
 * real pointer click reached by scrolling, focus lands where the board puts it, and Back / Forward
 * keep the tab's one document and sample world (ADR-0004). The request is sent once, by this tab's
 * browser session, which keeps its ticket (O-05).
 */

test.describe('PU-07 Your selection (B1-06)', () => {
  test('a cold visit: empty — Browse experiments, no Continue to request', async ({ page }) => {
    await page.goto('/selection');
    await checkState(page, 'Your selection');
    await expect(page).toHaveTitle('Your selection · XR Learning Platform');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue to request' })).toHaveCount(0);
    await expect(page.locator('.xp-bottombar')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Request institutional access' })).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: 'Browse experiments' }),
    ).toHaveAttribute('href', '/experiments');
  });

  test('the record: formats, the locked last format, Remove and Undo; Back and Forward to PU-06', async ({
    page,
  }) => {
    test.slow();
    await page.goto(SHELL_AND_TUBE);
    const mark = await markDocument(page);
    await addShellAndTube(page);
    await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
    await page.waitForURL('**/selection');
    await expect(page.locator('main#main')).toBeFocused();
    await checkState(page, 'Your selection');
    await expect(page.getByRole('link', { name: 'Selection, 1 experiment' })).toHaveCount(1);
    // The summary card from 1024 px; the bottom bar below (B1-06 "Mobile 375").
    if (wide(page)) {
      await expect(page.getByRole('complementary', { name: 'Summary' })).toBeVisible();
      await expect(page.locator('.xp-bottombar')).toBeHidden();
    } else {
      await expect(page.locator('.xp-bottombar')).toBeVisible();
      await expect(page.locator('.xp-bottombar')).toContainText('1 experiment · 2 formats');
    }

    const pills = page.getByRole('group', { name: 'Formats for Shell-and-Tube Heat Exchanger' });
    await reachAndClick(page, pills.getByText('VR · Virtual reality'));
    const web = pills.getByRole('checkbox', { name: 'WEB · Browser' });
    await expect(web).toBeChecked();
    await expect(web).toBeDisabled();
    await expect(
      page.getByText('At least one format stays chosen. To take this experiment out, use Remove.'),
    ).toBeVisible();
    await checkState(page, 'Your selection');
    await reachAndClick(page, pills.getByText('VR · Virtual reality'));
    await expect(web).toBeEnabled();

    // Remove → the notice with Undo takes focus; Undo → the experiment is back, its title focused.
    await reachAndClick(
      page,
      page.getByRole('button', {
        name: 'Remove Shell-and-Tube Heat Exchanger from your selection',
      }),
    );
    const notice = page.locator('.xr-notice[role="status"]');
    await expect(notice).toContainText(
      'Removed Shell-and-Tube Heat Exchanger from your selection.',
    );
    await expect(notice).toBeFocused();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
    await checkState(page, 'Your selection');
    await reachAndClick(page, notice.getByRole('button', { name: 'Undo' }));
    await expect(page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' })).toBeFocused();
    await expect(page.locator('.xp-srow')).toHaveCount(1);

    // Back to the experiment: still in the selection; Forward to the selection again.
    await page.goBack();
    await page.waitForURL(`**${SHELL_AND_TUBE}`);
    await expect(panelOf(page).getByRole('status')).toContainText('Formats: WEB · VR');
    await page.goForward();
    await page.waitForURL('**/selection');
    await expect(page.locator('.xp-srow')).toHaveCount(1);
    await expectSameDocument(page, mark);
  });
});

test.describe('PU-08 Request institutional access and PU-09 Request sent (B1-07)', () => {
  test('nothing to request: the request pages go to Your selection (P1-03)', async ({ page }) => {
    for (const address of [
      '/request-access',
      '/request-access?step=review',
      '/request-access/sent',
    ]) {
      await page.goto(address);
      await page.waitForURL('**/selection');
      await expect(page.getByRole('heading', { level: 1, name: 'Your selection' })).toBeVisible();
    }
  });

  test('details → validation → review → Edit → Submit → Request sent → Check request status', async ({
    page,
  }) => {
    test.slow();
    await page.goto(SHELL_AND_TUBE);
    const mark = await markDocument(page);
    await addShellAndTube(page);
    await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
    await page.waitForURL('**/selection');
    await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
    await page.waitForURL('**/request-access');
    await checkState(page, 'Request institutional access');
    await expect(page).toHaveTitle('Request institutional access · XR Learning Platform');
    // Never asked: internal or external, payment details or prices (B1-07).
    await expect(page.locator('main')).not.toContainText(/internal|external|price|payment/i);

    // Review request empty: the summary first, focused; each line goes to its field.
    await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
    const summary = page.locator('.xw-errsum');
    await expect(summary).toContainText('There are 5 problems with this request');
    await expect(summary).toBeFocused();
    await checkState(page, 'Request institutional access');
    await reachAndClick(
      page,
      summary.getByRole('link', { name: 'Enter the contact person’s name' }),
    );
    await expect(page.getByLabel('Contact person', { exact: true })).toBeFocused();
    // Typing clears that field's line and recounts (B1-07 `delete ne[name]`).
    await page.keyboard.type(RECORD.contact);
    await expect(summary).toContainText('There are 4 problems with this request');

    // Until a fixed date asks for its end date.
    await reachAndClick(page, page.locator('label[for="request-term-3"]'));
    await expect(page.getByLabel('End date', { exact: true })).toBeVisible();

    await fillDetails(page);
    await expect(page.getByLabel('End date', { exact: true })).toHaveCount(0);
    await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
    await page.waitForURL('**/request-access?step=review');
    const review = page.getByRole('heading', { level: 1, name: 'Check your request' });
    await expect(review).toBeFocused();
    await checkState(page, 'Check your request');
    await expect(page.locator('.xp-review dd').nth(12)).toHaveText('Yearly');

    // Edit goes back to the field itself; the answer is kept.
    await reachAndClick(page, page.getByRole('button', { name: 'Edit e-mail' }));
    await page.waitForURL('**/request-access?step=details');
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(RECORD.email);
    await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
    await page.waitForURL('**/request-access?step=review');

    // Submit: sent once; PU-09 with the reference, focus on its heading; the selection is empty.
    await reachAndClick(page, page.getByRole('button', { name: 'Submit request' }));
    await page.waitForURL('**/request-access/sent');
    await expect(page.getByRole('heading', { level: 1, name: 'Request sent' })).toBeFocused();
    await checkState(page, 'Request sent');
    await expect(page.locator('main')).toContainText(
      'Your reference is REQ-0042. Use it whenever you refer to this request.',
    );
    await expect(page.getByRole('link', { name: 'Selection, empty' })).toHaveCount(1);
    const status = page.getByRole('link', { name: 'Check request status' });
    const address = await status.getAttribute('href');
    expect(address).toMatch(/^\/requests\/rq-\d{4}$/);
    expect(address).not.toContain('REQ-0042');

    // Back from PU-09 never returns to a review that could send it again: the selection is empty.
    await page.goBack();
    await page.waitForURL('**/selection');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
    // The request just sent is in progress: Your selection leads back to it (owner decision,
    // 24 Oct 2026; ADR-0009 amendment) — named by its institution, at its address.
    const inProgress = page.locator('main').getByRole('note');
    await expect(inProgress).toHaveText(
      `You have a request in progress for ${RECORD.institution}. Check request status`,
    );
    await expect(inProgress.getByRole('link', { name: 'Check request status' })).toHaveAttribute(
      'href',
      address!,
    );
    await checkState(page, 'Your selection');
    await page.goForward();
    await page.waitForURL('**/request-access/sent');

    // Check request status: PU-10, Submitted, at the opaque address.
    await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
    await page.waitForURL(`**${address}`);
    await checkState(page, 'Request REQ-0042');
    await expect(page).toHaveTitle('Request REQ-0042 · XR Learning Platform');
    await expect(statusHead(page)).toContainText('Submitted');
    await expect(statusHead(page)).toContainText('We’ve received your request');
    await expect(statusHead(page).getByRole('link')).toHaveCount(0);
    await expect(page.locator('.xp-compare tbody tr')).toHaveText([
      /Experiments and formats.*Shell-and-Tube Heat Exchanger — WEB, VR.*Not decided yet/,
      /Licences.*120.*Not decided yet/,
      /Access term.*Yearly.*Not decided yet/,
    ]);
    await expectSameDocument(page, mark);
  });
});
