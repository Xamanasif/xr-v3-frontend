import { expect, type Locator, test } from '@playwright/test';

import { PRODUCT_URL, TEST_HOOKS_URL } from '../support';
import { openAs, roleEntry } from '../support/workspace';

/**
 * The owner-authorised narrow corrections of WP-0.13 (packages/ui/src/styles/product.css PF-14,
 * PF-15, PF-16) where they still apply (PU-15), and the XS look of XS-07 / XS-06 that superseded
 * them, read as computed styles on the real routes, each against the board frame
 * whose inline style it reproduces. Phone-width values below 600 px of app width (the v46 phone
 * scale); the desktop values at the other three widths.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const INK_2 = 'rgb(64, 71, 107)'; // #40476B

async function styleOf(locator: Locator, properties: readonly string[]) {
  // The v46 reduced-motion backstop turns property changes into .01 ms transitions: let them end.
  await locator.page().waitForTimeout(50);
  return locator.evaluate(
    (element, names) =>
      Object.fromEntries(
        names.map((name) => [name, getComputedStyle(element).getPropertyValue(name)]),
      ),
    properties,
  );
}

/*
 * XS-07 and XS-06 are drawn by the owner-approved Entry & shared design (V3; design/v3-refined-b/
 * roles/XS-v6): the v46 corrections PF-14 / PF-15 no longer apply to them (they stay for the
 * in-shell and public not-found, PU-15). Their own look is read here on the same real routes, from
 * the export's `xs-shared.css` and the kit; phone width is under 760 px of app width (the XS
 * breakpoint, `@container rb`).
 */
const INK_2_V3 = 'rgb(54, 61, 98)'; // --ink-2 #363D62
const isV3Phone = (width: number | undefined) => (width ?? 0) < 760;

test('XS-07 · Report a problem: the form surface and its actions (XS `xs-form-surface`)', async ({
  page,
  viewport,
}) => {
  await openAs(page, roleEntry('student').person, '/student/help/report');
  const form = page.locator('main .rk-x-region form.rk-surface.xs-form-surface');
  await expect(form).toBeVisible();
  const phone = isV3Phone(viewport?.width);
  expect(
    await styleOf(form, ['padding-top', 'padding-left', 'display', 'flex-direction', 'row-gap']),
  ).toEqual({
    'padding-top': phone ? '20px' : '26px',
    'padding-left': phone ? '18px' : '28px',
    display: 'flex',
    'flex-direction': 'column',
    'row-gap': '22px',
  });
  const actions = form.locator('> .xs-form-act');
  const send = actions.getByRole('button', { name: 'Send report' });
  const cancel = actions.getByRole('link', { name: 'Cancel' });
  const [actionsBox, sendBox, cancelBox] = await Promise.all([
    actions.boundingBox(),
    send.boundingBox(),
    cancel.boundingBox(),
  ]);
  if (phone) {
    // Full-width primary actions, 46 px tall, Send above Cancel.
    expect(Math.round(sendBox!.width)).toBe(Math.round(actionsBox!.width));
    expect(Math.round(cancelBox!.width)).toBe(Math.round(actionsBox!.width));
    expect(Math.round(sendBox!.height)).toBe(46);
    expect(cancelBox!.y).toBeGreaterThan(sendBox!.y);
  } else {
    // One row, centred: the ghost Cancel is drawn 40 px tall beside the 46 px Send (rb.css).
    expect(sendBox!.width).toBeLessThan(actionsBox!.width / 2);
    expect(Math.round(sendBox!.y + sendBox!.height / 2)).toBe(
      Math.round(cancelBox!.y + cancelBox!.height / 2),
    );
  }
});

test('XS-07 · My reports empty: the action inside the empty state (XS "No reports yet")', async ({
  page,
}) => {
  await openAs(page, roleEntry('vendor').person, '/vendor/help');
  const empty = page.locator('main .rk-x-region section.rk-surface .rk-state');
  await expect(empty).toBeVisible();
  await expect(empty.locator('.rk-state-t')).toHaveText('No reports yet');
  await expect(empty.getByRole('link', { name: 'Report a problem' })).toHaveClass(
    'rb-btn rb-btn--primary rb-btn--lg',
  );
  // No count beside "My reports" and no action in the head while there is nothing to list.
  await expect(page.locator('main .xs-sec-h .rb-note')).toHaveCount(0);
  await expect(page.locator('main .rk-head-act')).toHaveCount(0);
});

test('XS-07 · the detail’s closing line in ink-2 (XS `xs-help-foot`)', async ({ page }) => {
  await openAs(page, roleEntry('student').person, '/student/help/reports/SUP-0213');
  const foot = page.locator('main p.xs-help-foot');
  await expect(foot).toContainText('Something else isn’t working?');
  expect(await styleOf(foot, ['color', 'font-size'])).toEqual({
    color: INK_2_V3,
    'font-size': '15.5px',
  });
});

test('XS-07 · "Report sent": the ok disc and the ink-2 sentence (XS `xs-msg-ico--ok`)', async ({
  page,
}) => {
  await openAs(page, roleEntry('student').person, '/student/help/report');
  await page.getByLabel('What happened?').fill('It froze.');
  await page.getByRole('button', { name: 'Send report' }).click();
  const message = page.locator('main section.xs-msg');
  await expect(message.getByRole('heading', { name: 'Report sent' })).toBeVisible();
  expect(await styleOf(message.locator('.xs-msg-ico'), ['background-color', 'color'])).toEqual({
    'background-color': 'rgb(230, 243, 235)', // --ok-bg #E6F3EB
    color: 'rgb(29, 107, 69)', // --ok #1D6B45
  });
  expect(await styleOf(message.locator('> p.xs-msg-d'), ['color', 'font-size'])).toEqual({
    color: INK_2_V3,
    'font-size': '17px',
  });
});

test('XS-06 · in the person’s own shell: the message card; full-width primary at phone width (XS `XsMessage`)', async ({
  page,
  viewport,
}) => {
  await openAs(page, roleEntry('student').person, '/admin/help');
  const message = page.locator('main .rk-x-region section.xs-msg');
  await expect(message).toBeVisible();
  const phone = isV3Phone(viewport?.width);
  expect(await styleOf(message, ['padding-top', 'padding-left', 'margin-left'])).toEqual({
    'padding-top': phone ? '24px' : '36px',
    'padding-left': phone ? '18px' : '40px',
    'margin-left': '0px',
  });
  expect(await styleOf(message.locator('> p.xs-msg-d'), ['color'])).toEqual({ color: INK_2_V3 });
  // The lock on the selection tint (#EEF0FB) in indigo (#3B49B8).
  expect(await styleOf(message.locator('.xs-msg-ico'), ['background-color', 'color'])).toEqual({
    'background-color': 'rgb(238, 240, 251)',
    color: 'rgb(59, 73, 184)',
  });
  const [actions, primary] = await Promise.all([
    message.locator('.xs-msg-act').boundingBox(),
    message.getByRole('link', { name: 'Back to Home' }).boundingBox(),
  ]);
  if (phone) {
    expect(Math.round(primary!.width)).toBe(Math.round(actions!.width));
  } else {
    expect(primary!.width).toBeLessThan(actions!.width);
  }
});

test('PF-15 · the public not-found: B1-03’s placement on a public page (product build)', async ({
  page,
}) => {
  await page.goto(`${PRODUCT_URL}/anything`);
  const message = page.locator('main.xp-page .xr-msg.xr-x-msg--public');
  await expect(message).toBeVisible();
  expect(await styleOf(message, ['margin-top', 'margin-bottom', 'margin-left'])).toEqual({
    'margin-top': '24px',
    'margin-bottom': '40px',
    'margin-left': '0px',
  });
  expect(await styleOf(message.locator('> p.xr-body'), ['color'])).toEqual({ color: INK_2 });
});
