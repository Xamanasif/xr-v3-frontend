import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * The shell primitives in a real browser at the four approved viewports (Appendix F WP-0.6
 * acceptance 3–4; Appendix E §3.5, §4.3, §5.4, §6.1, §7.3, §7.4): WorkspaceShell (board 05),
 * Sidebar + NavItem (board 06), TopBar (boards 05, 11) and the HelpSupport template (board 07).
 * jsdom cannot prove these: the `xr-app` container queries (drawer below 1024, the 72 px rail at
 * 1024–1279, the 248 px sidebar from 1280), the real Tab order, the inert page behind the drawer,
 * PF-03's fixed drawer and the tooltips. Width-dependent checks read the actual app width.
 */

const SIDEBAR = V46_CONTAINER_THRESHOLDS.sidebar.px;
const FULL_SIDEBAR = V46_CONTAINER_THRESHOLDS.fullSidebar.px;

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

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
async function ready(page: Page, id: string, width?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, width);
  await expect(page.locator('[data-probe="root"][data-ready]')).toHaveCount(1);
  await settle(page);
}

/** Role queries stay inside the specimen (Next's route announcer is a hidden `role=alert`). */
const frame = (page: Page) => page.locator('div.specimen-frame');

const appWidth = (page: Page) =>
  frame(page)
    .locator('.xr-app')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);

const widthOf = (locator: Locator) =>
  locator.evaluate((element) => Math.round(element.getBoundingClientRect().width));

const computed = (locator: Locator, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

/** The focused element's name as a person hears it (aria-label, the nav text, or its text). */
async function focusedName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return '';
    return (
      active.getAttribute('aria-label') ??
      active.querySelector('.xr-nav-text')?.textContent ??
      (active.textContent ?? '').trim()
    );
  });
}

const SPECIMENS = [
  'c-workspace-shell',
  'c-workspace-shell-banner',
  'c-sidebar',
  'c-help-home',
  'c-help-empty',
  'c-help-report',
  'c-help-detail',
  'c-help-detail-reopened',
];

for (const id of SPECIMENS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await ready(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

/**
 * An exact accessible name as a pattern. The count badge is an inline-flex box (`span.xr-count`),
 * and Chromium may put a space before its ", n …" words when it computes the name.
 */
const escapeRegExp = (text: string) => text.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
const named = (text: string) => new RegExp(`^${escapeRegExp(text).replace(/, /g, '\\s?, ')}$`);

const IA_DESTINATIONS = [
  'Overview',
  'Content access',
  'Student access',
  'People',
  'Requests, 2 device requests to forward',
  'Usage',
];
const IA_ACCOUNT = 'Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology';

test.describe('WorkspaceShell (board 05; board 12 "Shell tab order")', () => {
  const shell = (page: Page) => frame(page).locator('.xr-shell');
  const aside = (page: Page) => frame(page).locator('aside.xr-side');
  const menu = (page: Page) => frame(page).locator('.xr-menu-btn');
  const toggle = (page: Page) => frame(page).locator('.xr-top-collapse');

  async function openDrawer(page: Page): Promise<void> {
    await menu(page).focus();
    await page.keyboard.press('Enter');
    await settle(page);
  }

  test('the skip link is the first tab stop, visible when focused, and moves focus into main#main', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    const skip = frame(page).getByRole('link', { name: 'Skip to main content' });
    await page.keyboard.press('Tab');
    await settle(page);
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(frame(page).locator('main#main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(frame(page).locator('[data-probe="page-link"]')).toBeFocused();
  });

  test('landmarks: aside "Institute Admin workspace" > nav "Institute Admin navigation", header, main#main', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    if ((await appWidth(page)) < SIDEBAR) await openDrawer(page);
    const workspace = frame(page).getByRole('complementary', { name: 'Institute Admin workspace' });
    await expect(workspace).toBeVisible();
    await expect(
      workspace.getByRole('navigation', { name: 'Institute Admin navigation' }),
    ).toBeVisible();
    await expect(frame(page).locator('header.xr-top')).toBeVisible();
    await expect(frame(page).locator('main#main.xr-page')).toHaveAttribute('tabindex', '-1');
  });

  test('Help is the last item, in the foot; only the current destination has aria-current', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    if ((await appWidth(page)) < SIDEBAR) await openDrawer(page);
    const links = aside(page).getByRole('link');
    await expect(links).toHaveCount(IA_DESTINATIONS.length + 1);
    for (const [index, name] of [...IA_DESTINATIONS, 'Help'].entries()) {
      await expect(links.nth(index)).toHaveAccessibleName(named(name));
    }
    expect(await links.last().evaluate((link) => link.closest('.xr-side-foot') !== null)).toBe(
      true,
    );
    const current = aside(page).locator('[aria-current]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAccessibleName('Overview');
  });

  test('the tab order: skip, sidebar + Help, Menu / Collapse, account, banner Help, main', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell-banner');
    const width = await appWidth(page);
    const stops: string[] = [];
    for (let press = 0; press < 16; press += 1) {
      await page.keyboard.press('Tab');
      stops.push(await focusedName(page));
      if (stops.at(-1) === 'A link on the page') break;
    }
    const account = 'Account menu: Dr S. Ranganathan, Faculty, Godavari Institute of Technology';
    const sidebar = [
      'Overview',
      'My courses',
      'Assessments',
      'Question bank',
      'Marking',
      'Students',
      'Help',
    ];
    const collapse = width < FULL_SIDEBAR ? 'Expand menu' : 'Collapse menu';
    expect(stops).toEqual(
      width < SIDEBAR
        ? ['Skip to main content', 'Open menu', account, 'Help', 'A link on the page']
        : ['Skip to main content', ...sidebar, collapse, account, 'Help', 'A link on the page'],
    );
  });

  test('the top bar keeps the title (below 1024) or the breadcrumbs (from 1024) and the account menu', async ({
    page,
  }) => {
    for (const id of ['c-workspace-shell', 'c-help-detail']) {
      await ready(page, id);
      const width = await appWidth(page);
      const title = frame(page).locator('.xr-top-title');
      const crumbs = frame(page).locator('ol.xr-crumbs');
      if (width < SIDEBAR) {
        await expect(title).toBeVisible();
        await expect(crumbs).toBeHidden();
      } else {
        await expect(crumbs).toBeVisible();
        await expect(title).toBeHidden();
        await expect(crumbs).toHaveAccessibleName('You are here');
      }
      await expect(frame(page).locator('.xr-acct-btn')).toBeVisible();
      if (id === 'c-help-detail') {
        await expect(title).toHaveText('SUP-0198');
        if (width >= SIDEBAR) {
          await expect(crumbs.getByRole('link', { name: 'Help & support' })).toBeVisible();
          await expect(crumbs.locator('[aria-current="page"]')).toHaveText('SUP-0198');
        }
      } else {
        await expect(frame(page).locator('.xr-acct-btn')).toHaveAccessibleName(IA_ACCOUNT);
      }
    }
  });

  test('below 1024: Menu ("Open menu") opens the drawer, focus to "Close menu", the rest inert; Esc closes, focus back to Menu', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    test.skip(
      (await appWidth(page)) >= SIDEBAR,
      'From 1024 app width the sidebar is not a drawer.',
    );
    await expect(aside(page)).toBeHidden();
    await expect(toggle(page)).toBeHidden();
    await expect(menu(page)).toHaveAccessibleName('Open menu');
    await expect(menu(page)).toHaveText('Menu');
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
    await openDrawer(page);
    const close = frame(page).getByRole('button', { name: 'Close menu' });
    await expect(close).toBeFocused();
    await expect(shell(page)).toHaveClass('xr-shell is-drawer');
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(frame(page).locator('.xr-main')).toHaveAttribute('inert', '');
    await expect(frame(page).locator('a.xr-skip')).toHaveAttribute('inert', '');
    // The drawer is fixed to the viewport (PF-03): it still fills it after the page scrolls.
    expect(await computed(aside(page), 'position')).toBe('fixed');
    await page.evaluate(() => window.scrollTo(0, 600));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const box = await aside(page).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), viewport: innerHeight };
    });
    expect([box.top, box.bottom]).toEqual([0, box.viewport]);
    // Main is inert: nothing in it can take focus.
    const pageLinkFocused = await page.evaluate(() => {
      const link = document.querySelector<HTMLElement>('[data-probe="page-link"]')!;
      link.focus();
      return document.activeElement === link;
    });
    expect(pageLinkFocused).toBe(false);
    // Tab moves through the drawer's destinations, with the gold ring on navy (PF-07).
    await close.focus();
    await page.keyboard.press('Tab');
    await settle(page);
    const overview = aside(page).getByRole('link', { name: 'Overview', exact: true });
    await expect(overview).toBeFocused();
    expect(await computed(overview, 'outline-color')).toBe(rgb(V46_FOCUS_COLOURS.focusDark));
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() =>
          document.querySelector('aside.xr-side')!.contains(document.activeElement),
        ),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(menu(page)).toBeFocused();
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert', '');
    await expect(frame(page).locator('a.xr-skip')).not.toHaveAttribute('inert', '');
  });

  test('below 1024: the scrim closes it (focus back to Menu); choosing a destination closes it', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    const width = await appWidth(page);
    test.skip(width >= SIDEBAR, 'From 1024 app width the sidebar is not a drawer.');
    await openDrawer(page);
    // The drawer is min(320px, 86%) wide; the scrim shows to its right.
    await frame(page)
      .locator('.xr-scrim')
      .click({ position: { x: Math.round(width) - 8, y: 300 } });
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(menu(page)).toBeFocused();
    await openDrawer(page);
    await frame(page).getByRole('link', { name: 'Content access', exact: true }).click();
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert', '');
  });

  test('below 1024: when the app grows past 1024 the open drawer closes, nothing stays inert and focus moves to the visible sidebar', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    test.skip(
      (await appWidth(page)) >= SIDEBAR,
      'From 1024 app width the sidebar is not a drawer.',
    );
    await openDrawer(page);
    await expect(shell(page)).toHaveClass('xr-shell is-drawer');
    await expect(frame(page).getByRole('button', { name: 'Close menu' })).toBeFocused();
    await page.setViewportSize({ width: 1280, height: 900 });
    await settle(page);
    await expect(shell(page)).toHaveClass('xr-shell');
    await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert', '');
    await expect(frame(page).locator('a.xr-skip')).not.toHaveAttribute('inert', '');
    // "Close menu" (where opening put focus) is hidden from 1024: focus is not left on it or
    // dropped to the page, but moves to the sidebar's current destination, visible and focused.
    const current = aside(page).locator('a[aria-current="page"]');
    await expect(current).toBeFocused();
    await expect(current).toBeVisible();
    expect(
      await page.evaluate(() => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active !== document.body &&
          active.checkVisibility() &&
          document.querySelector('aside.xr-side')!.contains(active)
        );
      }),
    ).toBe(true);
    expect(await focusedName(page)).toBe('Overview');
    expect(await widthOf(aside(page))).toBe(248);
    await expect(toggle(page)).toHaveAccessibleName('Collapse menu');
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('1024–1279: the 72 px rail with tooltips named by destination; "Expand menu" widens it to 248 and pushes the content', async ({
    page,
    viewport,
  }) => {
    // At 1440 the frame is set to 1100 px; at 1024 the viewport itself is in the band.
    const framed = (viewport?.width ?? 0) >= 1100 ? 1100 : undefined;
    await ready(page, 'c-workspace-shell', framed);
    const width = await appWidth(page);
    test.skip(width < SIDEBAR || width >= FULL_SIDEBAR, 'The rail band is 1024–1279 app width.');
    await expect(menu(page)).toBeHidden();
    expect(await widthOf(aside(page))).toBe(72);
    await expect(toggle(page)).toHaveAccessibleName('Expand menu');
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    // Icons only; each link is named by its destination (the tooltip text), once.
    for (const name of [...IA_DESTINATIONS, 'Help']) {
      await expect(aside(page).getByRole('link', { name: named(name) })).toHaveCount(1);
    }
    await expect(frame(page).getByRole('tooltip')).toHaveCount(0);
    const overview = aside(page).getByRole('link', { name: 'Overview', exact: true });
    expect(await computed(overview.locator('.xr-nav-text'), 'display')).toBe('none');
    const tip = overview.locator('.xr-tip');
    expect(await computed(tip, 'opacity')).toBe('0');
    // Hover shows a destination's tooltip too (board 06 "tooltip on hover and focus").
    const usage = aside(page).getByRole('link', { name: 'Usage', exact: true });
    await usage.hover();
    await settle(page);
    expect(await computed(usage.locator('.xr-tip'), 'opacity')).toBe('1');
    expect(await computed(tip, 'opacity')).toBe('0');
    await page.keyboard.press('Tab'); // the skip link
    await page.keyboard.press('Tab');
    await settle(page);
    await expect(overview).toBeFocused();
    expect(await computed(tip, 'opacity')).toBe('1');
    await expect(tip).toBeInViewport();
    expect(await computed(overview, 'outline-color')).toBe(rgb(V46_FOCUS_COLOURS.focusDark));
    // Expand: 248 px, the toggle now collapses, the content moves right.
    await toggle(page).click();
    await settle(page);
    await expect(shell(page)).toHaveClass('xr-shell is-expanded');
    expect(await widthOf(aside(page))).toBe(248);
    await expect(toggle(page)).toHaveAccessibleName('Collapse menu');
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    expect(await computed(overview.locator('.xr-nav-text'), 'display')).not.toBe('none');
    const mainLeft = await frame(page)
      .locator('.xr-main')
      .evaluate((element) => Math.round(element.getBoundingClientRect().left));
    const appLeft = await frame(page)
      .locator('.xr-app')
      .evaluate((element) => Math.round(element.getBoundingClientRect().left));
    expect(mainLeft - appLeft).toBe(248);
    await toggle(page).click();
    await settle(page);
    expect(await widthOf(aside(page))).toBe(72);
    await expect(toggle(page)).toHaveAccessibleName('Expand menu');
  });

  test('from 1280: the full 248 px sidebar; "Collapse menu" narrows it to the rail and back', async ({
    page,
  }) => {
    await ready(page, 'c-workspace-shell');
    test.skip((await appWidth(page)) < FULL_SIDEBAR, 'The full sidebar starts at 1280 app width.');
    expect(await widthOf(aside(page))).toBe(248);
    await expect(toggle(page)).toHaveAccessibleName('Collapse menu');
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    const help = aside(page).getByRole('link', { name: 'Help', exact: true });
    expect(await computed(help.locator('.xr-tip'), 'display')).toBe('none');
    // The gold focus ring on the navy sidebar (PF-07), in the full sidebar too.
    await page.keyboard.press('Tab'); // the skip link
    await page.keyboard.press('Tab');
    await settle(page);
    const overview = aside(page).getByRole('link', { name: 'Overview', exact: true });
    await expect(overview).toBeFocused();
    expect(await computed(overview, 'outline-color')).toBe(rgb(V46_FOCUS_COLOURS.focusDark));
    await toggle(page).click();
    await settle(page);
    await expect(shell(page)).toHaveClass('xr-shell is-rail');
    expect(await widthOf(aside(page))).toBe(72);
    await expect(toggle(page)).toHaveAccessibleName('Expand menu');
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    // From the toggle, Shift+Tab reaches Help, the last sidebar item: its tooltip shows.
    await page.keyboard.press('Shift+Tab');
    await settle(page);
    await expect(help).toBeFocused();
    expect(await computed(help.locator('.xr-tip'), 'opacity')).toBe('1');
    await toggle(page).click();
    await settle(page);
    expect(await widthOf(aside(page))).toBe(248);
    await expect(toggle(page)).toHaveAccessibleName('Collapse menu');
  });

  test('boundaries: 1279 is the rail, 1280 the full sidebar (frame set at 1440)', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) < 1440, 'Needs a 1440 viewport to frame 1279 and 1280.');
    await ready(page, 'c-workspace-shell', 1279);
    expect(await widthOf(aside(page))).toBe(72);
    await expect(toggle(page)).toHaveAccessibleName('Expand menu');
    await ready(page, 'c-workspace-shell', 1280);
    expect(await widthOf(aside(page))).toBe(248);
    await expect(toggle(page)).toHaveAccessibleName('Collapse menu');
  });
});

test.describe('Sidebar standalone (board 06)', () => {
  test('full sidebars at 248 with the workspace block; the rail at 72 with the logo box only', async ({
    page,
  }) => {
    await ready(page, 'c-sidebar');
    const asides = frame(page).locator('aside.xr-side');
    await expect(asides).toHaveCount(3);
    expect(await widthOf(asides.nth(0))).toBe(248);
    expect(await widthOf(asides.nth(2))).toBe(72);
    await expect(asides.nth(0).locator('.xr-ws-label')).toHaveText('Student');
    await expect(asides.nth(0).locator('.xr-ws-inst')).toHaveText(
      'Godavari Institute of Technology',
    );
    await expect(asides.nth(1).locator('.xr-ws-inst')).toHaveCount(0);
    await expect(
      asides.nth(1).getByRole('link', { name: named('Requests, 3 requests under review') }),
    ).toBeVisible();
    await expect(asides.nth(2).locator('.xr-product, .xr-ws')).toHaveCount(0);
    for (const index of [0, 1, 2]) {
      await expect(asides.nth(index).getByRole('link').last()).toHaveAccessibleName('Help');
      await expect(asides.nth(index).locator('[aria-current="page"]')).toHaveCount(1);
    }
  });
});

test.describe('HelpSupport template (board 07)', () => {
  test('My reports: "Report a problem" in the header, the count, rows that open the report with the status in words', async ({
    page,
  }) => {
    await ready(page, 'c-help-home');
    const main = frame(page).locator('main#main');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Help & support');
    await expect(
      main.locator('.xr-phead-actions').getByRole('link', { name: 'Report a problem' }),
    ).toBeVisible();
    const section = main.getByRole('region', { name: 'My reports' });
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText('3 reports');
    const rows = section.locator('a.xr-row-link');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveAccessibleName(
      /^Student import stopped part-way\s*SUP-0211 · sent 1 Oct · reopened 6 Oct\s*Reopened$/,
    );
    await expect(rows.locator('.xr-status')).toHaveText(['Reopened', 'Open', 'Resolved']);
    // Help is current in the sidebar on the Help pages.
    if ((await appWidth(page)) >= SIDEBAR) {
      await expect(frame(page).locator('aside [aria-current="page"]')).toHaveAccessibleName('Help');
    }
  });

  test('empty: no header action, and the action inside the empty state', async ({ page }) => {
    await ready(page, 'c-help-empty');
    const main = frame(page).locator('main#main');
    await expect(main.locator('.xr-phead-actions')).toHaveCount(0);
    const empty = main.locator('.xr-empty');
    await expect(empty.getByRole('heading', { level: 3 })).toHaveText('No reports yet');
    await expect(empty.getByRole('link', { name: 'Report a problem' })).toBeVisible();
    // Board 07 "State 2a" draws the line in the small type (`p.xr-small`, 14/20).
    const line = empty.locator('p');
    await expect(line).toHaveClass('xr-small');
    expect(await computed(line, 'font-size')).toBe('14px');
    expect(await computed(line, 'line-height')).toBe('20px');
  });

  test('Report a problem: validation, the linked summary, sending, then "Report sent" with focus on it', async ({
    page,
  }) => {
    await ready(page, 'c-help-report');
    const f = frame(page);
    await expect(f.getByLabel('Where did it happen?')).toHaveValue(
      'Shell-and-Tube Heat Exchanger · VR',
    );
    await f.getByLabel(/^Screenshot/).setInputFiles({
      name: 'blank-page.png',
      mimeType: 'image/png',
      buffer: Buffer.from('png'),
    });
    await expect(f.locator('[data-probe="screenshot"]')).toHaveText(
      'Screenshot chosen: blank-page.png',
    );
    const send = f.getByRole('button', { name: 'Send report' });
    await send.click();
    const summary = f.getByRole('alert');
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('One thing needs fixing');
    const what = f.getByLabel('What happened?');
    await expect(what).toHaveAttribute('aria-invalid', 'true');
    await expect(what).toHaveAccessibleDescription(
      'Say what you were doing and what you saw. Say what happened, so it can be looked into',
    );
    await f.getByRole('link', { name: 'Say what happened', exact: true }).click();
    await expect(what).toBeFocused();
    await page.keyboard.type('The VR simulation stopped loading at the second step.');
    await send.click();
    const busy = f.getByRole('button', { name: 'Sending…' });
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    // Playwright will not click an aria-disabled element unless forced; force sends a real click.
    await busy.click({ force: true });
    const sent = f.locator('#sent');
    await expect(sent).toBeFocused({ timeout: 10_000 });
    await expect(sent.getByRole('heading', { level: 1 })).toHaveText('Report sent');
    await expect(sent).toContainText(
      'Your reference is SUP-0213. You can follow it in My reports.',
    );
    await expect(f.locator('.xr-top-title')).toHaveText('Report sent');
  });

  test('Report a problem: Cancel right before "Send report", one group at the end of the card (board 07; board 11 "375 · AR-8 form")', async ({
    page,
  }) => {
    await ready(page, 'c-help-report');
    const actions = frame(page).locator('div.xr-section > div.xw-actions.xw-actions--end');
    await expect(actions).toHaveCount(1);
    await expect(frame(page).locator('.xw-flow-foot')).toHaveCount(0);
    const cancel = actions.getByRole('link', { name: 'Cancel', exact: true });
    const send = actions.getByRole('button', { name: 'Send report' });
    const [actionsBox, cancelBox, sendBox] = [
      (await actions.boundingBox())!,
      (await cancel.boundingBox())!,
      (await send.boundingBox())!,
    ];
    // The group fills the card's content box and ends with "Send report".
    const sectionContentRight = await actions.evaluate((element) => {
      const section = element.parentElement!;
      const style = getComputedStyle(section);
      return (
        section.getBoundingClientRect().right -
        Number.parseFloat(style.borderRightWidth) -
        Number.parseFloat(style.paddingRight)
      );
    });
    expect(Math.abs(actionsBox.x + actionsBox.width - sectionContentRight)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(sendBox.x + sendBox.width - (actionsBox.x + actionsBox.width)),
    ).toBeLessThanOrEqual(1);
    // Cancel sits right before Send (the 12 px gap), on the same row at every width: not at the
    // card's start (board 07), not on a row of its own at 375 (board 11).
    expect(Math.abs(sendBox.x - (cancelBox.x + cancelBox.width) - 12)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(cancelBox.y + cancelBox.height / 2 - (sendBox.y + sendBox.height / 2)),
    ).toBeLessThanOrEqual(1);
  });

  test('Report detail: the resolution note first, then what was reported, the history last; no reopen control', async ({
    page,
  }) => {
    await ready(page, 'c-help-detail');
    const main = frame(page).locator('main#main');
    await expect(main.locator('.xr-phead .xr-id')).toHaveText('SUP-0198');
    await expect(main.locator('.xr-phead-meta')).toHaveText('ResolvedSent 21 Sep');
    const stack = main.locator('.xr-stack').first();
    const first = stack.locator(':scope > *').first();
    await expect(first).toHaveAttribute('role', 'status');
    await expect(first).toContainText('Resolution note · 23 Sep');
    await expect(stack.getByRole('region')).toHaveText([/^What you reported/, /^History/]);
    await expect(main.getByRole('button')).toHaveCount(0);
  });

  test('Report detail, reopened: "This report is open again"', async ({ page }) => {
    await ready(page, 'c-help-detail-reopened');
    const main = frame(page).locator('main#main');
    const notice = main.getByRole('status').first();
    await expect(notice).toContainText('This report is open again');
    await expect(notice).toContainText('It was reopened on 6 Oct. You can follow it here.');
    await expect(main.locator('.xr-notice')).toHaveCount(1);
    await expect(main.locator('.xr-phead-meta .xr-status')).toHaveText('Reopened');
  });
});
