import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * Foundation structure components in a real browser at the four approved viewports (Appendix F
 * WP-0.6 acceptance 3–4; Appendix E §3.1 Section / Stack, PageHeader, Breadcrumbs,
 * LogoPlaceholder, Avatar · CountBadge, IdChip, Typography, Rows / AttentionList, SkipLink): axe,
 * every focus stop visible, and the behaviour the components own — the skip link moves focus into
 * `main`, the H1, a section H2 and a plain surface take focus after an action (never tab stops), a
 * live section count changes in place, page-header actions go full width below 600 px of app
 * width, breadcrumbs replace the top-bar title from 1024, the phone type scale, and row actions
 * dropping under the text on a phone. Without `?width=` the frame fills the viewport, so the
 * viewport is the app width; every width-dependent assertion reads the `xr-app` box itself.
 */

const PHONE = V46_CONTAINER_THRESHOLDS.phone.px;
const SIDEBAR = V46_CONTAINER_THRESHOLDS.sidebar.px;

const SPECIMENS = [
  'c-section',
  'c-page-header',
  'c-breadcrumbs',
  'c-logo-placeholder',
  'c-avatar-count',
  'c-typography',
  'c-rows',
  'c-attention-all-clear',
  'c-skip-link',
] as const;

/**
 * Lets running transitions finish: with reduced motion the v46 backstop makes every property
 * change a 0.01 ms transition, so a computed value read in the same frame can still be the old one.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

/** Opens a specimen with reduced motion and settles. */
async function open(page: Page, id: string, width?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, width);
  await settle(page);
}

const appWidth = (page: Page) =>
  page.locator('[data-probe="app"]').evaluate((element) => element.getBoundingClientRect().width);

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  expect(rect, 'element has a layout box').not.toBeNull();
  return rect!;
};

/** Presses Tab until `target` has focus (a keyboard walk, so :focus-visible applies). */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press('Tab');
    await settle(page);
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error('Tab never reached the target');
}

const css = (locator: Locator, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

for (const id of SPECIMENS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await open(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

test.describe('SkipLink (boards 05, 12 "Shell tab order")', () => {
  test('is hidden until focused, then shown as the first tab stop', async ({ page }) => {
    await open(page, 'c-skip-link');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    const before = await box(skip);
    expect(before.y + before.height, 'above the frame until focused').toBeLessThanOrEqual(0);

    await page.keyboard.press('Tab');
    await settle(page);
    await expect(skip).toBeFocused();
    const shown = await box(skip);
    expect(shown.y).toBeGreaterThanOrEqual(0);
    expect(shown.y + shown.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await css(skip, 'outline-style')).toBe('solid');
  });

  test('the keyboard walk starts at the skip link', async ({ page }) => {
    await open(page, 'c-skip-link');
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops[0]?.element).toBe('<a.xr-skip> "Skip to main content"');
  });

  test('activating it moves focus into main; the next Tab continues inside main', async ({
    page,
  }) => {
    await open(page, 'c-skip-link');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await settle(page);
    const main = page.locator('main#main');
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-probe="first-in-main"]')).toBeFocused();
    // The top-bar controls were skipped.
    await expect(page.getByRole('button', { name: /^Account menu/ })).not.toBeFocused();
  });

  test('a pointer click on the focused skip link also lands in main', async ({ page }) => {
    await open(page, 'c-skip-link');
    await page.keyboard.press('Tab');
    await page.getByRole('link', { name: 'Skip to main content' }).click();
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('PageHeader (board 03; B2-06; B5-03)', () => {
  test('the H1 takes focus after an action and shows the focus ring', async ({ page }) => {
    await open(page, 'c-page-header');
    const heading = page.getByRole('heading', { level: 1, name: 'Rahul Verma' });
    await expect(heading).toHaveAttribute('tabindex', '-1');
    await tabTo(page, page.locator('[data-probe="save"]'));
    await page.keyboard.press('Enter');
    await settle(page);
    await expect(heading).toBeFocused();
    expect(await css(heading, 'outline-style')).toBe('solid');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('the H1 is not a tab stop', async ({ page }) => {
    await open(page, 'c-page-header');
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops.map((stop) => stop.element)).not.toContainEqual(expect.stringMatching(/^<h1/));
  });

  test('actions go full width below 600 px of app width, and sit at their own width from 600', async ({
    page,
  }) => {
    await open(page, 'c-page-header');
    const width = await appWidth(page);
    const header = await box(page.locator('.xr-phead'));
    const actions = await box(page.locator('.xr-phead-actions'));
    const primary = await box(page.getByRole('link', { name: 'Give this student access' }));
    if (width < PHONE) {
      expect(Math.abs(actions.width - header.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(primary.x + primary.width - (actions.x + actions.width))).toBeLessThanOrEqual(
        1,
      );
    } else {
      expect(actions.width).toBeLessThan(header.width - 1);
    }
  });

  for (const [width, full] of [
    [PHONE - 1, true],
    [PHONE, false],
  ] as const) {
    test(`at an app width of ${width} px the actions are ${full ? '' : 'not '}full width`, async ({
      page,
    }) => {
      await open(page, 'c-page-header', width);
      expect(await appWidth(page)).toBe(width);
      const header = await box(page.locator('.xr-phead'));
      const actions = await box(page.locator('.xr-phead-actions'));
      if (full) expect(Math.abs(actions.width - header.width)).toBeLessThanOrEqual(1);
      else expect(actions.width).toBeLessThan(header.width - 1);
    });
  }

  test('the back link names its destination and comes before the H1', async ({ page }) => {
    await open(page, 'c-page-header');
    const back = page.getByRole('link', { name: 'Students' });
    await expect(back).toHaveClass('xr-back');
    const order = await page.evaluate(() => {
      const back = document.querySelector('a.xr-back');
      const heading = document.querySelector('h1');
      return back && heading
        ? Boolean(back.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false;
    });
    expect(order).toBe(true);
  });
});

test.describe('Breadcrumbs (board 03 "Top-bar breadcrumbs")', () => {
  test('replace the top-bar title from 1024 px of app width', async ({ page }) => {
    await open(page, 'c-breadcrumbs');
    const trail = page.locator('ol.xr-crumbs');
    const title = page.locator('[data-probe="top-title"]');
    await expect(trail).toHaveAttribute('aria-label', 'You are here');
    if ((await appWidth(page)) >= SIDEBAR) {
      await expect(trail).toBeVisible();
      await expect(title).toBeHidden();
      const crumbs = page.getByRole('list', { name: 'You are here' });
      await expect(crumbs.getByRole('link')).toHaveText(['People', 'Students']);
      const current = crumbs.locator('[aria-current="page"]');
      await expect(current).toHaveText('Rahul Verma');
      expect(await current.evaluate((element) => element.closest('a'))).toBeNull();
      // Keyboard: the ancestors are ordinary links, in order.
      await tabTo(page, page.getByRole('link', { name: 'People' }));
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Students' })).toBeFocused();
    } else {
      await expect(trail).toBeHidden();
      await expect(title).toBeVisible();
    }
  });

  test('the separators are hidden from the accessibility tree', async ({ page }) => {
    await open(page, 'c-breadcrumbs', 1100);
    const crumbs = page.getByRole('list', { name: 'You are here' });
    await expect(crumbs).toBeVisible();
    await expect(crumbs.locator('.xr-crumb-sep')).toHaveCount(2);
    for (const separator of await crumbs.locator('.xr-crumb-sep').all()) {
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
    }
    await expect(crumbs.getByRole('listitem')).toHaveCount(3);
  });
});

test.describe('Section / Stack (boards 01, 05, 09a; B2-07, B3-07, B4-04, B4-08)', () => {
  test('titled and labelled sections are regions; a plain surface is not', async ({ page }) => {
    await open(page, 'c-section');
    for (const name of [
      'My reports',
      'What you reported',
      'Drafts to review',
      'Your transfer request',
      'Summary',
    ]) {
      await expect(page.getByRole('region', { name, exact: true })).toHaveCount(1);
    }
    await expect(page.getByRole('region')).toHaveCount(5);
    await expect(page.locator('div.xr-section')).toHaveCount(3);
    await expect(page.locator('.xr-section-head .xr-meta.xr-id')).toHaveText('DTR-0018');
  });

  test('the H2 takes focus after an action and the live count changes in place (B4-08)', async ({
    page,
  }) => {
    await open(page, 'c-section');
    const heading = page.getByRole('heading', { level: 2, name: 'Drafts to review' });
    const count = page.getByRole('region', { name: 'Drafts to review' }).getByRole('status');
    await expect(count).toHaveText('3 left to review');
    const node = await count.elementHandle();
    await tabTo(page, page.locator('[data-probe="add-to-bank"]'));
    await page.keyboard.press('Enter');
    await settle(page);
    await expect(heading).toBeFocused();
    expect(await css(heading, 'outline-style')).toBe('solid');
    await expect(count).toHaveText('2 left to review');
    // The live region is the same node: it was kept mounted and only its text changed.
    expect(await count.evaluate((element, before) => element === before, node)).toBe(true);
  });

  test('a plain surface takes focus after an action (B2-07 "Added")', async ({ page }) => {
    await open(page, 'c-section');
    await tabTo(page, page.locator('[data-probe="add-student"]'));
    await page.keyboard.press('Enter');
    await settle(page);
    const surface = page.locator('div.xr-section#Aa-done');
    await expect(surface).toBeFocused();
    expect(await css(surface, 'outline-style')).toBe('solid');
  });

  test('focus targets are never tab stops', async ({ page }) => {
    await open(page, 'c-section');
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops.map((stop) => stop.element)).not.toContainEqual(
      expect.stringMatching(/^<(h2|div)/),
    );
  });

  test('section heads tighten below 600 px of app width (the sheet’s phone rule)', async ({
    page,
  }) => {
    await open(page, 'c-section');
    const head = page.locator('.xr-section-head').first();
    const padding = await css(head, 'padding');
    expect(padding).toBe((await appWidth(page)) < PHONE ? '16px 16px 12px' : '20px 24px 14px');
  });
});

test.describe('Typography (board 02 "Type scale")', () => {
  test('the phone scale applies below 600 px of app width', async ({ page }) => {
    await open(page, 'c-typography');
    const phone = (await appWidth(page)) < PHONE;
    const size = (id: string) => css(page.locator(`#${id}`), 'font-size');
    expect(await size('t-h1')).toBe(phone ? '26px' : '32px');
    expect(await size('t-h2')).toBe(phone ? '20px' : '22px');
    expect(await size('t-display')).toBe(phone ? '32px' : '44px');
    expect(await size('t-h3')).toBe('18px');
    expect(await size('t-lead')).toBe('18px');
    expect(await size('t-body')).toBe('16px');
    expect(await size('t-caption')).toBe('13px');
    expect(await css(page.locator('#t-overline'), 'text-transform')).toBe('uppercase');
  });

  test('IDs are monospace, figures tabular, hidden words still read', async ({ page }) => {
    await open(page, 'c-typography');
    const id = page.locator('.xr-id', { hasText: 'SUP-0213' });
    expect(await css(id, 'font-family')).toMatch(/monospace/);
    expect(await css(page.locator('.xr-num'), 'font-variant-numeric')).toBe('tabular-nums');
    const external = page.locator('[data-probe="external"]');
    await expect(external).toHaveAccessibleName(/^lab brief\s*\(opens in a new tab\)$/);
    const hidden = await box(external.locator('.xr-sr'));
    expect(hidden.width).toBeLessThanOrEqual(1);
    expect(hidden.height).toBeLessThanOrEqual(1);
  });
});

test.describe('Avatar · CountBadge (boards 03, 05, 06)', () => {
  test('the avatar is hidden inside its named button; counts are read in words', async ({
    page,
  }) => {
    await open(page, 'c-avatar-count');
    const account = page.getByRole('button', { name: 'Account menu: Meera Iyer, Institute Admin' });
    await expect(account).toBeVisible();
    await expect(account.locator('.xr-avatar')).toHaveAttribute('aria-hidden', 'true');
    await expect(account.locator('.xr-avatar')).toHaveText('MI');

    const requests = page.locator('[data-probe="requests"]');
    await expect(requests).toHaveAccessibleName(/^Requests\s*,\s*2 device requests to forward$/);
    await expect(requests.locator('.xr-count > [aria-hidden="true"]')).toHaveText('2');
    await expect(requests.locator('.xr-count > [aria-hidden="true"]')).toBeVisible();

    await expect(page.getByRole('link', { name: /^Students\s*214$/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('.xr-tab-count')).toHaveText(['214', '9']);
  });
});

test.describe('LogoPlaceholder (BC12; board 06)', () => {
  test('is the exact placeholder text in its dashed box, never an image', async ({ page }) => {
    await open(page, 'c-logo-placeholder');
    const logo = page.locator('.xr-logo-ph');
    await expect(logo).toHaveText('BITS Pilani / WILP logo — placeholder');
    await expect(page.locator('img')).toHaveCount(0);
    expect((await box(logo)).height).toBeGreaterThanOrEqual(48);
    expect(await css(logo, 'outline-style')).toBe('dashed');
  });
});

test.describe('Rows / AttentionList (board 03; 09a AR-1)', () => {
  test('every attention item opens something with exactly one action', async ({ page }) => {
    await open(page, 'c-rows');
    const list = page.getByRole('region', { name: 'Needs your attention' }).getByRole('list');
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(4);
    for (const item of await items.all()) {
      await expect(item.getByRole('link')).toHaveCount(1);
    }
    await page.getByRole('link', { name: 'Give access' }).press('Enter');
    await expect(page).toHaveURL(/#give-access$/);
  });

  test('a row link opens its record from the keyboard', async ({ page }) => {
    await open(page, 'c-rows');
    const row = page.getByRole('link', { name: /^VR simulation stopped loading at step 2/ });
    await expect(row).toHaveClass('xr-row xr-row-link');
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#r1$/);
  });

  // 09a AR-1 "Responsive": "row actions drop under the text below 600 px". The sheet does this by
  // wrapping (`.xr-row` flex-wrap, `.xr-row-main` basis 320 px), not by a 600 px query, so the drop
  // depends on the row's width: checked at the phone viewport (375) and from 768 up.
  test('row actions drop under the text on a phone and sit beside it from 768', async ({
    page,
  }) => {
    await open(page, 'c-rows');
    const row = page.locator('li.xr-row').first();
    const text = await box(row.locator('.xr-row-main'));
    const action = await box(row.getByRole('link'));
    if ((await appWidth(page)) < PHONE) {
      expect(action.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
    } else {
      expect(action.y).toBeLessThan(text.y + text.height);
    }
  });

  test('all clear: the caller’s words in place of the rows, no count', async ({ page }) => {
    await open(page, 'c-attention-all-clear');
    const region = page.getByRole('region', { name: 'Needs your attention' });
    await expect(region.getByRole('list')).toHaveCount(0);
    await expect(region.locator('.xr-meta')).toHaveCount(0);
    await expect(region.locator('.xr-empty .xr-h3')).toHaveText('Nothing needs you right now');
    await expect(region.locator('.xr-empty .xr-small')).toHaveText(
      'New items appear here as they come in.',
    );
  });
});
