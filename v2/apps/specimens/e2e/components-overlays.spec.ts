import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * Overlays in a real browser at the four approved viewports (Appendix F WP-0.6 acceptance 3–4;
 * Appendix E §3.4, §5.3, §5.4): Dialog (board 10), Drawer (boards 06, 12), AccountMenu (board 12
 * "Patterns"), RailTooltip (board 06). jsdom cannot prove these: the top layer, the inert page,
 * Tab containment, Esc, focus return, container queries and the PF-03/PF-04 geometry.
 */

/**
 * Lets running transitions finish. With reduced motion the v46 backstop makes every property
 * change a 0.01 ms transition, so a computed value read in the same frame is still the old one.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

/** Opens a specimen with reduced motion, waits for hydration (`data-ready`) and settles. */
async function ready(page: Page, id: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id);
  await expect(page.locator('[data-probe="app"][data-ready]')).toHaveCount(1);
  await settle(page);
}

const appWidth = (page: Page) =>
  page.locator('[data-probe="app"]').evaluate((element) => element.getBoundingClientRect().width);

const openDialogs = (page: Page) => page.locator('dialog[open]');

/** Focuses a trigger and presses Enter, as a keyboard user opens a dialog (board 10 step 1). */
async function openWithKeyboard(page: Page, trigger: string): Promise<Locator> {
  const button = page.getByRole('button', { name: trigger, exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(openDialogs(page)).toHaveCount(1);
  return button;
}

/** What has focus, and whether it is inside the open dialog. */
async function focusInDialog(page: Page): Promise<{ inside: boolean; name: string }> {
  return page.evaluate(() => {
    const active = document.activeElement;
    const dialog = document.querySelector('dialog[open]');
    const label =
      active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement
        ? (active.labels?.[0]?.textContent ?? '')
        : (active?.getAttribute('aria-label') ?? active?.textContent ?? '');
    return { inside: Boolean(dialog && active && dialog.contains(active)), name: label.trim() };
  });
}

const ALIGNS = ['centre', 'start', 'end', 'decision', 'marks'] as const;
const SPECIMENS = [
  'c-dialog',
  ...ALIGNS.map((align) => `c-dialog-align-${align}`),
  'c-drawer',
  'c-account-menu',
  'c-rail-tooltip',
];

for (const id of SPECIMENS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await ready(page, id);
    if (id.startsWith('c-dialog-align-')) await expect(openDialogs(page)).toHaveCount(1);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

test.describe('Dialog (board 10 "Keyboard path and phone layout")', () => {
  const INITIAL_FOCUS = [
    {
      trigger: 'Publish…',
      title: 'Publish Shell-and-Tube Heat Exchanger?',
      focused: (dialog: Locator) => dialog.getByRole('button', { name: 'Publish', exact: true }),
    },
    {
      // VD-07: destructive DL-1 focuses Cancel, as board 10 draws it (B2-08/B2-09/B4-07 differ).
      trigger: 'Remove from group…',
      title: 'Remove Priya Natarajan from Section A?',
      focused: (dialog: Locator) => dialog.getByRole('button', { name: 'Cancel', exact: true }),
    },
    {
      trigger: 'Return to vendor…',
      title: 'Return to vendor?',
      focused: (dialog: Locator) => dialog.getByLabel('Reason the vendor will see'),
    },
    {
      trigger: 'Withdraw access…',
      title: 'Withdraw Rahul Verma’s access?',
      focused: (dialog: Locator) => dialog.getByLabel('Reason', { exact: true }),
    },
    {
      trigger: 'Rename group…',
      title: 'Rename group',
      focused: (dialog: Locator) => dialog.getByLabel('Group name'),
    },
  ];

  for (const { trigger, title, focused } of INITIAL_FOCUS) {
    test(`initial focus by kind: ${trigger}`, async ({ page }) => {
      await ready(page, 'c-dialog');
      await openWithKeyboard(page, trigger);
      const dialog = page.getByRole('dialog', { name: title });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      await expect(focused(dialog)).toBeFocused();
    });
  }

  test('Tab and Shift+Tab cycle Close, the field, Cancel and the confirm, and never leave the dialog', async ({
    page,
  }) => {
    await ready(page, 'c-dialog');
    await openWithKeyboard(page, 'Return to vendor…');
    const forward: string[] = [];
    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press('Tab');
      const focus = await focusInDialog(page);
      expect(focus.inside, `Tab ${press + 1} left the dialog`).toBe(true);
      forward.push(focus.name);
    }
    const cycle = ['Cancel', 'Return to vendor', 'Close', 'Reason the vendor will see'];
    expect(forward).toEqual([...cycle, ...cycle]);
    const backward: string[] = [];
    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press('Shift+Tab');
      const focus = await focusInDialog(page);
      expect(focus.inside, `Shift+Tab ${press + 1} left the dialog`).toBe(true);
      backward.push(focus.name);
    }
    const reverse = ['Close', 'Return to vendor', 'Cancel', 'Reason the vendor will see'];
    expect(backward).toEqual([...reverse, ...reverse]);
    // The page behind is inert (board 10 "The page behind becomes inert"): it cannot take focus.
    const behind = await page.evaluate(() => {
      const publish = [...document.querySelectorAll('button')].find(
        (button) => button.textContent === 'Publish…',
      );
      publish?.focus();
      return { found: Boolean(publish), focused: document.activeElement === publish };
    });
    expect(behind).toEqual({ found: true, focused: false });
  });

  test('Esc is Cancel: nothing changes and focus returns to the trigger', async ({ page }) => {
    await ready(page, 'c-dialog');
    const trigger = await openWithKeyboard(page, 'Rename group…');
    await page.keyboard.type(' edited');
    await page.keyboard.press('Escape');
    await expect(openDialogs(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-probe="group-name"]')).toHaveText(
      'ME ZG523 · Sem II · Section A',
    );
    await expect(page.locator('[data-probe="confirms"]')).toHaveText('Confirm presses: 0');
    await expect(page.locator('[data-probe="flash"]')).toHaveText('');
  });

  test('Close and Cancel also cancel and return focus to the trigger', async ({ page }) => {
    await ready(page, 'c-dialog');
    let trigger = await openWithKeyboard(page, 'Publish…');
    await page.keyboard.press('Shift+Tab'); // Cancel
    await page.keyboard.press('Enter');
    await expect(openDialogs(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    trigger = await openWithKeyboard(page, 'Return to vendor…');
    await page.getByRole('dialog', { name: 'Return to vendor?' }).getByLabel('Close').click();
    await expect(openDialogs(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('when the trigger is gone, focus goes to the flash notice', async ({ page }) => {
    await ready(page, 'c-dialog');
    await openWithKeyboard(page, 'Remove from group…');
    const dialog = page.getByRole('dialog', { name: 'Remove Priya Natarajan from Section A?' });
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Remove from group', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(openDialogs(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove from group…', exact: true })).toHaveCount(
      0,
    );
    const flash = page.locator('[data-probe="flash"]');
    await expect(flash).toBeFocused();
    await expect(flash).toContainText('Priya Natarajan was removed from the group.');
  });

  test('busy: the confirm says what is happening and ignores repeat presses; Close and Cancel stay as drawn', async ({
    page,
  }) => {
    await ready(page, 'c-dialog');
    const trigger = await openWithKeyboard(page, 'Publish…');
    const dialog = page.getByRole('dialog', { name: 'Publish Shell-and-Tube Heat Exchanger?' });
    await expect(dialog.getByRole('button', { name: 'Publish', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    const busy = dialog.getByRole('button', { name: 'Publishing…' });
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    await expect(busy).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    // Playwright will not click an aria-disabled element unless forced; force sends a real click.
    await busy.click({ force: true });
    await expect(page.locator('[data-probe="confirms"]')).toHaveText('Confirm presses: 1');
    // No board disables Close or Cancel while busy (B2-06 "… interactive deactivate").
    for (const control of [
      dialog.getByRole('button', { name: 'Cancel', exact: true }),
      dialog.getByRole('button', { name: 'Close', exact: true }),
    ]) {
      await expect(control).toBeEnabled();
      await expect(control).not.toHaveAttribute('aria-disabled', 'true');
    }
    await expect(openDialogs(page)).toHaveCount(1);
    // The harness finishes the action: the dialog closes, focus returns and the notice confirms.
    await expect(openDialogs(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-probe="flash"]')).toContainText('Published');
    await expect(page.locator('[data-probe="confirms"]')).toHaveText('Confirm presses: 1');
  });

  test('busy: Esc is still Cancel, reported to the caller (the harness abandons its wait)', async ({
    page,
  }) => {
    await ready(page, 'c-dialog');
    const trigger = await openWithKeyboard(page, 'Rename group…');
    const dialog = page.getByRole('dialog', { name: 'Rename group' });
    await dialog.getByLabel('Group name').fill('Lab batch B');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Saving…' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(openDialogs(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-probe="group-name"]')).toHaveText(
      'ME ZG523 · Sem II · Section A',
    );
    await expect(page.locator('[data-probe="flash"]')).toHaveText('');
  });

  test('a failed confirm moves focus to the first invalid field, and its message describes it', async ({
    page,
  }) => {
    await ready(page, 'c-dialog');
    const trigger = await openWithKeyboard(page, 'Return to vendor…');
    const dialog = page.getByRole('dialog', { name: 'Return to vendor?' });
    const field = dialog.getByLabel('Reason the vendor will see');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Return to vendor', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(
      'Add a reason so the vendor knows what to change',
    );
    await expect(openDialogs(page)).toHaveCount(1);
    await page.keyboard.type('The VR build stops at step 2.');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Returning…' })).toBeVisible();
    await expect(openDialogs(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-probe="flash"]')).toContainText('Returned to vendor');
  });

  test('DL-3: Enter in the field saves (an empty name is refused first)', async ({ page }) => {
    await ready(page, 'c-dialog');
    const trigger = await openWithKeyboard(page, 'Rename group…');
    const dialog = page.getByRole('dialog', { name: 'Rename group' });
    const field = dialog.getByLabel('Group name');
    await expect(field).toBeFocused();
    await field.fill('');
    await page.keyboard.press('Enter');
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('Enter a group name');
    await field.fill('Lab batch B');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Saving…' })).toBeVisible();
    await expect(openDialogs(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator('[data-probe="group-name"]')).toHaveText('Lab batch B');
    await expect(trigger).toBeFocused();
  });

  for (const align of ALIGNS) {
    test(`align ${align}: the bottom sheet below 600; the PF-04 position from 600 (VD-08 provisional)`, async ({
      page,
    }) => {
      await ready(page, `c-dialog-align-${align}`);
      const dialog = page.locator('dialog.xr-dialog');
      await expect(dialog).toHaveJSProperty('open', true);
      await settle(page);
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      expect(await dialog.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
      const width = await appWidth(page);
      const box = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          viewport: window.innerHeight,
        };
      });
      const cancel = await dialog
        .getByRole('button', { name: 'Cancel', exact: true })
        .boundingBox();
      const confirm = await dialog
        .getByRole('button', { name: 'Return to vendor', exact: true })
        .boundingBox();
      expect(cancel).not.toBeNull();
      expect(confirm).not.toBeNull();

      if (width < V46_CONTAINER_THRESHOLDS.phone.px) {
        // Board 10 375 frame: full width less the 16 px gutters, 16 px from the bottom, buttons
        // stacked with the confirming action on top.
        expect([box.left, box.width, box.bottom]).toEqual([
          16,
          Math.round(width) - 32,
          box.viewport - 16,
        ]);
        expect(Math.round(confirm!.y + confirm!.height)).toBeLessThanOrEqual(Math.round(cancel!.y));
        return;
      }
      expect(box.width).toBe(520);
      expect(Math.abs(box.left - (width - 520) / 2)).toBeLessThanOrEqual(1);
      expect(Math.round(confirm!.y)).toBe(Math.round(cancel!.y)); // one row from 600
      expect(confirm!.x).toBeGreaterThan(cancel!.x); // Cancel first, the confirm last
      // decision: bottom-aligned below 908 app width (product.css PF-04, xr-govern.css xg-dlg).
      const top =
        align === 'start' ||
        (align === 'decision' && width >= 908) ||
        (align === 'marks' && width >= V46_CONTAINER_THRESHOLDS.sidebar.px);
      const bottom = align === 'end' || align === 'decision' || align === 'marks';
      if (top) expect(box.top).toBe(88);
      else if (bottom) expect(box.bottom).toBe(box.viewport - 88);
      else expect(Math.abs(box.top - (box.viewport - box.height) / 2)).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('Drawer (board 06 "Behaviour"; board 12 "Patterns")', () => {
  const menuButton = (page: Page) => page.locator('.xr-menu-btn');
  const shell = (page: Page) => page.locator('[data-probe="shell"]');
  const main = (page: Page) => page.locator('[data-probe="main"]');

  async function openDrawer(page: Page): Promise<void> {
    await menuButton(page).focus();
    await page.keyboard.press('Enter');
    await settle(page);
  }

  test('Menu opens it: focus moves to Close menu, the rest is inert, the drawer is fixed (PF-03); Esc closes it and focus returns to Menu', async ({
    page,
  }) => {
    await ready(page, 'c-drawer');
    test.skip(
      (await appWidth(page)) >= V46_CONTAINER_THRESHOLDS.sidebar.px,
      'From 1024 app width the sidebar is not a drawer.',
    );
    await expect(menuButton(page)).toHaveAccessibleName('Open menu');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await openDrawer(page);
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await expect(shell(page)).toHaveClass('xr-shell is-drawer');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(main(page)).toHaveAttribute('inert', '');
    expect(
      await page
        .locator('[data-probe="side"]')
        .evaluate((element) => getComputedStyle(element).position),
    ).toBe('fixed');
    // The page behind is inert, so Tab stays among the drawer's own controls.
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() =>
          document.querySelector('[data-probe="side"]')!.contains(document.activeElement),
        ),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(menuButton(page)).toBeFocused();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(main(page)).not.toHaveAttribute('inert', '');
  });

  test('the scrim and Close menu close it and focus returns to Menu', async ({ page }) => {
    await ready(page, 'c-drawer');
    const width = await appWidth(page);
    test.skip(width >= V46_CONTAINER_THRESHOLDS.sidebar.px, 'From 1024 there is no drawer.');
    await openDrawer(page);
    // The drawer is min(320px, 86%) wide; the scrim shows to its right.
    await page.locator('.xr-scrim').click({ position: { x: Math.round(width) - 8, y: 300 } });
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(menuButton(page)).toBeFocused();
    await openDrawer(page);
    await page.keyboard.press('Enter'); // "Close menu" has focus
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(menuButton(page)).toBeFocused();
  });

  test('it closes itself once the app is 1024 or wider, and nothing stays inert', async ({
    page,
  }) => {
    await ready(page, 'c-drawer');
    test.skip(
      (await appWidth(page)) >= V46_CONTAINER_THRESHOLDS.sidebar.px,
      'From 1024 there is no drawer.',
    );
    await openDrawer(page);
    await expect(shell(page)).toHaveClass('xr-shell is-drawer');
    await page.setViewportSize({ width: 1180, height: page.viewportSize()?.height ?? 800 });
    await settle(page);
    expect(await appWidth(page)).toBeGreaterThanOrEqual(V46_CONTAINER_THRESHOLDS.sidebar.px);
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(main(page)).not.toHaveAttribute('inert', '');
    await expect(menuButton(page)).toBeHidden();
  });

  test('choosing a destination closes it', async ({ page }) => {
    await ready(page, 'c-drawer');
    test.skip(
      (await appWidth(page)) >= V46_CONTAINER_THRESHOLDS.sidebar.px,
      'From 1024 there is no drawer.',
    );
    await openDrawer(page);
    await page.getByRole('link', { name: 'My courses', exact: true }).click();
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(main(page)).not.toHaveAttribute('inert', '');
  });

  test('from 1024 the same sidebar is the rail (tooltip on keyboard focus, 1024–1279) or the full sidebar (no tooltip, from 1280)', async ({
    page,
  }) => {
    await ready(page, 'c-drawer');
    const width = await appWidth(page);
    test.skip(width < V46_CONTAINER_THRESHOLDS.sidebar.px, 'Below 1024 the sidebar is a drawer.');
    await expect(menuButton(page)).toBeHidden();
    const home = page.getByRole('link', { name: 'Home', exact: true });
    await expect(home).toHaveCount(1);
    const tip = home.locator('.xr-tip');
    await page.keyboard.press('Tab'); // the skip link
    await page.keyboard.press('Tab');
    await settle(page);
    await expect(home).toBeFocused();
    if (width < V46_CONTAINER_THRESHOLDS.fullSidebar.px) {
      expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
      await expect(tip).toBeInViewport();
    } else {
      expect(await tip.evaluate((element) => getComputedStyle(element).display)).toBe('none');
    }
  });
});

test.describe('AccountMenu (board 12 "Patterns": Enter opens · Tab moves through items · Esc closes)', () => {
  const NAME = 'Account menu: Rahul Verma, Student, Godavari Institute of Technology';
  const accountButton = (page: Page) => page.getByRole('button', { name: NAME });

  async function openMenu(page: Page): Promise<void> {
    await accountButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'true');
  }

  test('Enter opens it (a disclosure: focus stays on the button), Tab moves through the items, Esc closes and returns focus', async ({
    page,
  }) => {
    await ready(page, 'c-account-menu');
    await openMenu(page);
    await expect(accountButton(page)).toBeFocused();
    const panel = page.locator('.xr-menu');
    await expect(panel).toBeVisible();
    expect(await panel.getAttribute('id')).toBe(
      await accountButton(page).getAttribute('aria-controls'),
    );
    await expect(page.getByRole('menu')).toHaveCount(0);
    for (const item of [
      page.getByRole('link', { name: 'My device', exact: true }),
      page.getByRole('link', { name: 'Help', exact: true }),
      page.getByRole('button', { name: 'Sign out', exact: true }),
    ]) {
      await page.keyboard.press('Tab');
      await expect(item).toBeFocused();
      await expect(item).toBeInViewport();
    }
    await page.keyboard.press('Escape');
    await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveCount(0);
    await expect(accountButton(page)).toBeFocused();
  });

  test('focus leaving the menu closes it', async ({ page }) => {
    await ready(page, 'c-account-menu');
    await openMenu(page);
    for (let press = 0; press < 4; press += 1) await page.keyboard.press('Tab');
    await expect(page.locator('[data-probe="after-menu"]')).toBeFocused();
    await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.xr-menu')).toHaveCount(0);
  });

  test('a press outside closes it', async ({ page }) => {
    await ready(page, 'c-account-menu');
    await openMenu(page);
    // A point well away from the menu (top right): the bottom-left corner of the viewport. At
    // 375 px the open menu covers the page heading, so the heading is not "outside".
    const viewport = page.viewportSize()!;
    const menu = (await page.locator('.xr-menu').boundingBox())!;
    expect(menu.x + menu.width > 8 && menu.y + menu.height < viewport.height - 8).toBe(true);
    await page.mouse.click(4, viewport.height - 4);
    await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Sign out runs, closes the menu and returns focus to the button', async ({ page }) => {
    await ready(page, 'c-account-menu');
    await openMenu(page);
    for (let press = 0; press < 3; press += 1) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-probe="sign-outs"]')).toHaveText('Sign out pressed 1');
    await expect(accountButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(accountButton(page)).toBeFocused();
  });

  test('below 1024 the top bar shows the avatar only; the name still says who and which role', async ({
    page,
  }) => {
    await ready(page, 'c-account-menu');
    const width = await appWidth(page);
    const display = await page
      .locator('.xr-acct-text')
      .evaluate((element) => getComputedStyle(element).display);
    expect(display).toBe(width < V46_CONTAINER_THRESHOLDS.sidebar.px ? 'none' : 'flex');
    await expect(accountButton(page)).toHaveAccessibleName(NAME);
  });
});

test.describe('RailTooltip (board 06 "Rail · Institute Admin · tooltip on hover and focus")', () => {
  const DESTINATIONS = [
    'Overview',
    'Content access',
    'Student access',
    'People',
    'Requests',
    'Usage',
    'Help',
  ];

  test('each rail link is named by its destination, once; no role="tooltip"', async ({ page }) => {
    await ready(page, 'c-rail-tooltip');
    for (const name of DESTINATIONS) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(1);
    }
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('the tooltip is hidden until keyboard focus or hover', async ({ page }) => {
    await ready(page, 'c-rail-tooltip');
    const tip = (name: string) => page.getByRole('link', { name, exact: true }).locator('.xr-tip');
    const opacity = (locator: Locator) =>
      locator.evaluate((element) => getComputedStyle(element).opacity);
    expect(await opacity(tip('Overview'))).toBe('0');
    await page.keyboard.press('Tab');
    await settle(page);
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
    expect(await opacity(tip('Overview'))).toBe('1');
    await expect(tip('Overview')).toBeInViewport();
    expect(await opacity(tip('People'))).toBe('0');
    await page.getByRole('link', { name: 'People', exact: true }).hover();
    await settle(page);
    expect(await opacity(tip('People'))).toBe('1');
  });
});
