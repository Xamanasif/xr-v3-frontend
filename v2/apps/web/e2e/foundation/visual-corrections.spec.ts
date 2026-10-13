import { expect, type Locator, test } from '@playwright/test';

import { TEST_HOOKS_URL } from '../support';
import { openAs, roleEntry } from '../support/workspace';

/**
 * The owner-authorised narrow corrections of WP-0.13 (packages/ui/src/styles/product.css PF-14,
 * PF-15, PF-16), read as computed styles on the real Phase-0 routes, each against the board frame
 * whose inline style it reproduces. Phone-width values below 600 px of app width (the v46 phone
 * scale); the desktop values at the other three widths.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const INK_2 = 'rgb(64, 71, 107)'; // #40476B
const LINE = 'rgb(225, 228, 243)'; // #E1E4F3

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

const isPhone = (width: number | undefined) => (width ?? 0) < 600;

test('PF-14 · the report form card and its actions (board 07 "State 1"; board 11 "375 · AR-8 form")', async ({
  page,
  viewport,
}) => {
  await openAs(page, roleEntry('student').person, '/student/help/report');
  const card = page.locator('main .xr-section.xr-x-help-form');
  await expect(card).toBeVisible();
  const padding = isPhone(viewport?.width) ? '20px' : '24px';
  expect(
    await styleOf(card, ['padding-top', 'padding-left', 'display', 'flex-direction', 'row-gap']),
  ).toEqual({
    'padding-top': padding,
    'padding-left': padding,
    display: 'flex',
    'flex-direction': 'column',
    'row-gap': '20px',
  });
  const actions = card.locator('> .xw-actions');
  expect(
    await styleOf(actions, ['flex-wrap', 'justify-content', 'padding-top', 'column-gap']),
  ).toEqual({
    'flex-wrap': 'wrap-reverse',
    'justify-content': 'flex-end',
    'padding-top': '4px',
    'column-gap': '12px',
  });
  const send = actions.getByRole('button', { name: 'Send report' });
  if (isPhone(viewport?.width)) {
    // "Primary button fills the row" beside Cancel (board 11).
    expect(await styleOf(send, ['flex-grow', 'flex-basis'])).toEqual({
      'flex-grow': '1',
      'flex-basis': '160px',
    });
    const [cancelBox, sendBox, actionsBox] = await Promise.all([
      actions.getByRole('link', { name: 'Cancel' }).boundingBox(),
      send.boundingBox(),
      actions.boundingBox(),
    ]);
    expect(Math.round(sendBox!.x + sendBox!.width)).toBe(
      Math.round(actionsBox!.x + actionsBox!.width),
    );
    expect(Math.round(sendBox!.y)).toBe(Math.round(cancelBox!.y));
  } else {
    expect(await styleOf(send, ['flex-grow'])).toEqual({ 'flex-grow': '0' });
  }
  // The back link's 8 px gap (board 07: `a.xr-back style="margin-bottom: 8px"`).
  expect(await styleOf(page.locator('main a.xr-back.xr-x-help-back'), ['margin-bottom'])).toEqual({
    'margin-bottom': '8px',
  });
});

test('PF-14 · My reports empty: the top rule; PF-16 · the empty line in ink-2 (board 07 "State 2a")', async ({
  page,
}) => {
  await openAs(page, roleEntry('vendor').person, '/vendor/help');
  const empty = page.locator('main .xr-empty.xr-x-help-empty');
  await expect(empty).toBeVisible();
  expect(
    await styleOf(empty, ['border-top-width', 'border-top-style', 'border-top-color']),
  ).toEqual({
    'border-top-width': '1px',
    'border-top-style': 'solid',
    'border-top-color': LINE,
  });
  expect(await styleOf(empty.locator('> p.xr-small'), ['color'])).toEqual({ color: INK_2 });
  // The icon keeps the v46 default tint, as board 07 draws it (no inline tint there).
  expect(await styleOf(empty.locator('.xr-empty-icon'), ['background-color', 'color'])).toEqual({
    'background-color': 'rgb(238, 240, 248)',
    color: 'rgb(20, 27, 94)',
  });
});

test('PF-14 · the detail’s closing line in ink-2 (board 07 "State 3")', async ({ page }) => {
  await openAs(page, roleEntry('student').person, '/student/help/reports/SUP-0213');
  const foot = page.locator('main p.xr-small.xr-x-help-foot');
  await expect(foot).toContainText('Something else isn’t working?');
  expect(await styleOf(foot, ['color'])).toEqual({ color: INK_2 });
  expect(await styleOf(page.locator('main a.xr-back.xr-x-help-back'), ['margin-bottom'])).toEqual({
    'margin-bottom': '8px',
  });
});

test('PF-15 · "Report sent": the ok tint and the ink-2 sentence (board 07 "State 1c")', async ({
  page,
}) => {
  await openAs(page, roleEntry('student').person, '/student/help/report');
  await page.getByLabel('What happened?').fill('It froze.');
  await page.getByRole('button', { name: 'Send report' }).click();
  const message = page.locator('main .xr-msg');
  await expect(message.getByRole('heading', { name: 'Report sent' })).toBeVisible();
  expect(await styleOf(message.locator('.xr-msg-icon'), ['background-color', 'color'])).toEqual({
    'background-color': 'rgb(232, 244, 236)', // #E8F4EC
    color: 'rgb(29, 107, 69)', // #1D6B45
  });
  expect(await styleOf(message.locator('> p.xr-body'), ['color'])).toEqual({ color: INK_2 });
});

test('PF-15 · XS-06 in the shell: left-aligned near the top; full-width primary at phone width (board 08)', async ({
  page,
  viewport,
}) => {
  await openAs(page, roleEntry('student').person, '/admin/help');
  const message = page.locator('main .xr-msg.xr-x-msg--shell');
  await expect(message).toBeVisible();
  const phone = isPhone(viewport?.width);
  expect(await styleOf(message, ['margin-top', 'margin-left', 'margin-bottom'])).toEqual({
    'margin-top': phone ? '8px' : '24px',
    'margin-left': '0px',
    'margin-bottom': '0px',
  });
  expect(await styleOf(message.locator('> p.xr-body'), ['color'])).toEqual({ color: INK_2 });
  // Board 08's neutral circle (#EEF0F8 / #141B5E) for the lock.
  expect(await styleOf(message.locator('.xr-msg-icon'), ['background-color', 'color'])).toEqual({
    'background-color': 'rgb(238, 240, 248)',
    color: 'rgb(20, 27, 94)',
  });
  const [actions, primary] = await Promise.all([
    message.locator('.xr-msg-actions').boundingBox(),
    message.getByRole('link', { name: 'Back to Home' }).boundingBox(),
  ]);
  if (phone) {
    const column = await message.boundingBox();
    expect(Math.round(actions!.width)).toBe(Math.round(column!.width));
    expect(Math.round(primary!.width)).toBe(Math.round(actions!.width));
  } else {
    expect(primary!.width).toBeLessThan(actions!.width);
  }
});

test('PF-15 · the public not-found: B1-03’s placement on a public page (product build)', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/anything');
  const message = page.locator('main.xp-page .xr-msg.xr-x-msg--public');
  await expect(message).toBeVisible();
  expect(await styleOf(message, ['margin-top', 'margin-bottom', 'margin-left'])).toEqual({
    'margin-top': '24px',
    'margin-bottom': '40px',
    'margin-left': '0px',
  });
  expect(await styleOf(message.locator('> p.xr-body'), ['color'])).toEqual({ color: INK_2 });
});
