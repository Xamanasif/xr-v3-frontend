import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
  reachAndClick,
} from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * WP-0.8 — the seven role shells in a real browser (Appendix F WP-0.8 acceptance 2–6; Appendix E
 * §4, §6.1, §7.3; boards 05, 06, 08, 12). Board 06 is read from the frozen design here, so what
 * renders is compared with the board itself: labels, order, icon paths, counts in words, the
 * workspace label and line, Help last, and the account menu's lines and items. The responsive
 * states are measured on the app width, which each test asserts first: the drawer below 1024 px
 * (1023), the 72 px rail at 1024–1279 (1100), the full 248 px sidebar from 1280 (1440). Real
 * keyboard (Tab, Enter, Esc) and real pointer (`reachAndClick`: wheel, hit test, mouse click).
 *
 * The harness composes each state from the @xr/ui shell parts with fixture data (it may import
 * @xr/ui only): which destinations are built and which item is current are the specimen's, not
 * apps/web's map and manifest. Those, the account-menu rules and the rail store are unit-tested in
 * apps/web against the same frozen boards; WP-0.13's route suite repeats these checks on the real
 * composition.
 */

const SIDEBAR = V46_CONTAINER_THRESHOLDS.sidebar.px;

const ROLES = [
  ['student', 'Student'],
  ['faculty', 'Faculty'],
  ['institute-admin', 'Institute Admin'],
  ['vendor', 'Vendor'],
  ['academic-reviewer', 'Academic Reviewer'],
  ['content-manager', 'Content Manager'],
  ['super-admin', 'Super Admin'],
] as const;

const BOARDS = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'design',
  'handoff-v46',
  'canvas-v46',
  'project',
);
const board = (file: string) => readFileSync(join(BOARDS, file), 'utf8');

/** Board 06 `raw[]` and its icon paths (`const I`), from the frozen board. */
const BOARD_06 = (() => {
  const text = board('06-Sidebar-Variants.dc.html');
  const iconStart = text.indexOf('const I = {');
  const icons = Object.fromEntries(
    [...text.slice(iconStart, text.indexOf('};', iconStart)).matchAll(/(\w+): '([^']+)'/g)].map(
      ([, key, path]) => [key!, path!],
    ),
  );
  const rawStart = text.indexOf('const raw = [');
  const raw = text.slice(rawStart, text.indexOf('];', rawStart));
  const GIT = 'Godavari Institute of Technology';
  return new Map(
    [...raw.matchAll(/\{ ws: '([^']+)', inst: ([^,]+), summary: '[^']*', nav: \[(.*?)\] \}/g)].map(
      ([, ws, inst, nav]) => [
        ws!,
        {
          line: inst === 'GIT' ? GIT : inst!.replace(/^'|'$/g, ''),
          nav: [...nav!.matchAll(/n\('([^']+)', '(\w+)'(?:, '([^']*)', '([^']*)')?\)/g)].map(
            ([, label, icon, count, countText]) => ({
              label: label!,
              path: icons[icon!]!,
              count,
              countText,
            }),
          ),
        },
      ],
    ),
  );
})();

/** Board 06's account-menu table: workspace → name, role line, line, items. */
const ACCOUNT = (() => {
  const text = board('06-Sidebar-Variants.dc.html');
  const start = text.indexOf('<th>Workspace</th><th>Name (sample)</th>');
  const body = text.slice(start, text.indexOf('</table>', start));
  return new Map(
    [
      ...body.matchAll(
        /<tr><td><strong>([^<]+)<\/strong><\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>(.*?)<\/td><td>([^<]+)<\/td><\/tr>/g,
      ),
    ].map(([, workspace, name, role, line, items]) => [
      workspace!,
      {
        name: name!,
        role: role!,
        line: line!.includes('(platform role)') ? null : line!,
        items: items!.replace('*', '').split(' · '),
      },
    ]),
  );
})();

/** Lets running transitions finish (the v46 reduced-motion backstop makes them 0.01 ms). */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

/**
 * Opens a specimen at the viewport's own width with reduced motion, after hydration and the web
 * font. With `app`, the viewport is set first and the app's measured width must equal it (classic
 * scrollbars would narrow the app, R-20).
 */
async function ready(page: Page, id: string, app?: number): Promise<void> {
  if (app !== undefined) await page.setViewportSize({ width: app, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id);
  await expect(page.locator('[data-ready]')).toHaveCount(1);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await settle(page);
  if (app !== undefined) {
    expect(
      await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        app: document.querySelector('.xr-app')!.getBoundingClientRect().width,
      })),
    ).toEqual({ viewport: app, app });
  }
}

const frame = (page: Page) => page.locator('div.specimen-frame');
const aside = (page: Page) => frame(page).locator('aside.xr-side');
const width = (locator: Locator) =>
  locator.evaluate((element) => Math.round(element.getBoundingClientRect().width));

/** Presses Tab from the start of the document until `target` has focus (a real keyboard walk). */
async function tabTo(page: Page, target: Locator, maxPresses = 60): Promise<void> {
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
    root.removeAttribute('tabindex');
  });
  const handle = await target.elementHandle();
  for (let presses = 0; presses < maxPresses; presses += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((element) => document.activeElement === element, handle)) return;
  }
  throw new Error('Tab did not reach the target.');
}

/**
 * A destination link's accessible name: the destination, then its count in board 12's words
 * ("Marking, 12 written answers to mark"). Chromium joins the count's `xr-sr` words (v46 `.xr-sr`
 * is absolutely positioned) with a space — "Marking , 12 written answers to mark" — as it does for
 * the boards' own markup, so that one space is allowed; it is reported for the owner (WP-0.8), with
 * the narrow fix an `aria-label` on counted links would be.
 */
const destinationName = (label: string, countText?: string) => {
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return countText
    ? new RegExp(`^${escape(label)} ?, ${escape(countText)}$`)
    : new RegExp(`^${escape(label)}$`);
};

/** The account's accessible name per board 06's table. */
const accountName = (label: string) => {
  const row = ACCOUNT.get(label)!;
  return `Account menu: ${[row.name, row.role, row.line].filter(Boolean).join(', ')}`;
};

for (const [slug, label] of ROLES) {
  for (const [suffix, state] of [
    ['', 'Phase 0 (Help only)'],
    ['-built', 'every destination built'],
  ] as const) {
    test(`c-role-${slug}${suffix} (${label}, ${state}): axe, visible focus stops, no developer surfaces`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}${suffix}`);
      await expectNoAxeViolations(page);
      const stops = await expectNoInvisibleFocusTargets(page);
      // Board 12 "Shell tab order": the skip link is the first stop.
      expect(stops[0]?.element).toContain('Skip to main content');
      await expectNoDeveloperSurfaces(page);
    });
  }
}

test('c-role-student-not-your-workspace (XS-06): axe, visible focus stops, nothing current', async ({
  page,
}) => {
  await ready(page, 'c-role-student-not-your-workspace');
  await expectNoAxeViolations(page);
  await expectNoInvisibleFocusTargets(page);
  await expectNoDeveloperSurfaces(page);
  await expect(aside(page).locator('[aria-current]')).toHaveCount(0);
  await expect(
    frame(page).getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
});

test.describe('board 06 fidelity at 1440 (the full sidebar)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: labels, order, icons, counts in words, the line, Help last; the account menu as board 06 lists it`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`, 1440);
      const drawn = BOARD_06.get(label)!;
      expect(await width(aside(page))).toBe(248);
      await expect(aside(page).locator('.xr-ws-label')).toHaveText(label);
      if (drawn.line) await expect(aside(page).locator('.xr-ws-inst')).toHaveText(drawn.line);
      else await expect(aside(page).locator('.xr-ws-inst')).toHaveCount(0);
      const nav = frame(page).getByRole('navigation', { name: `${label} navigation` });
      const links = nav.getByRole('link');
      await expect(links).toHaveCount(drawn.nav.length);
      await expect(nav.locator('.xr-nav-text')).toHaveText(drawn.nav.map((item) => item.label));
      expect(
        await nav
          .locator('a path')
          .evaluateAll((paths) => paths.map((path) => path.getAttribute('d'))),
      ).toEqual(drawn.nav.map((item) => item.path));
      for (const [index, item] of drawn.nav.entries()) {
        // Board 12: "Sidebar counts are spoken in words: “Marking, 12 written answers to mark”".
        await expect(links.nth(index)).toHaveAccessibleName(
          destinationName(item.label, item.countText),
        );
      }
      // Help is last, in the foot, after the destinations.
      const help = aside(page).locator('.xr-side-foot').getByRole('link', { name: 'Help' });
      await expect(help).toBeVisible();
      expect(
        await aside(page)
          .locator('a')
          .evaluateAll((all) => all.at(-1)?.textContent),
      ).toBe('HelpHelp');
      // The first destination is current: gold inset rule, bold, aria-current (never colour alone).
      const current = aside(page).locator('[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current.locator('.xr-nav-text')).toHaveText(drawn.nav[0]!.label);
      expect(
        await current.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.boxShadow, style.fontWeight];
        }),
      ).toEqual(['rgb(233, 168, 37) 3px 0px 0px 0px inset', '700']);

      // The account menu, by keyboard: Enter opens, Tab moves through the items, Esc returns.
      const account = frame(page).getByRole('button', { name: /^Account menu: / });
      await expect(account).toHaveAccessibleName(accountName(label));
      await tabTo(page, account);
      await page.keyboard.press('Enter');
      await expect(account).toHaveAttribute('aria-expanded', 'true');
      const menu = frame(page).locator('.xr-menu');
      const row = ACCOUNT.get(label)!;
      await expect(menu.locator('.xr-menu-head > span')).toHaveText(
        [row.name, row.role, row.line].filter((line): line is string => Boolean(line)),
      );
      await expect(menu.locator('.xr-menu-item')).toHaveText(row.items);
      for (const item of row.items) {
        await page.keyboard.press('Tab');
        await expect(menu.locator('.xr-menu-item', { hasText: item })).toBeFocused();
      }
      await page.keyboard.press('Escape');
      await expect(account).toHaveAttribute('aria-expanded', 'false');
      await expect(account).toBeFocused();
    });
  }
});

test.describe('counts in words: named exactly as the frozen board’s own markup is named', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  test('Super Admin "Requests": the product link and B1-10’s own link get the same name in Chromium', async ({
    page,
  }) => {
    await ready(page, 'c-role-super-admin-built', 1440);
    // B1-10's Requests link, verbatim (the board's ten instances are identical), in the same list.
    const drawn =
      /<li><a [^>]*>(?:(?!<\/li>).)*?xr-nav-text">Requests<\/span>(?:(?!<\/li>).)*?<\/a><\/li>/.exec(
        board('B1-10-SA-Requests.dc.html'),
      )![0];
    const list = aside(page).getByRole('navigation').locator('ul.xr-nav');
    await list.evaluate((element, markup) => {
      element.insertAdjacentHTML('beforeend', markup);
      element.lastElementChild!.setAttribute('data-board', '');
    }, drawn);
    // Chromium joins the absolutely positioned `.xr-sr` words with a space in both: the product's
    // name is the board's, character for character.
    const name = 'Requests , 3 requests under review';
    await expect(list.locator('li[data-board] > a')).toHaveAccessibleName(name);
    await expect(
      list.locator('li:not([data-board]) > a', { hasText: 'Requests' }),
    ).toHaveAccessibleName(name);
    await list.evaluate((element) => element.querySelector('li[data-board]')!.remove());
  });
});

test.describe('Phase 0 (Help only): only Help & support is built', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: the sidebar shows Help alone, current; no empty navigation; the account menu has Help and Sign out`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}`, 1440);
      await expect(aside(page).getByRole('navigation')).toHaveCount(0);
      const links = aside(page).getByRole('link');
      await expect(links).toHaveCount(1);
      await expect(links.first()).toHaveAccessibleName('Help');
      await expect(links.first()).toHaveAttribute('aria-current', 'page');
      expect(await links.first().evaluate((element) => getComputedStyle(element).boxShadow)).toBe(
        'rgb(233, 168, 37) 3px 0px 0px 0px inset',
      );
      await expect(frame(page).locator('.xr-crumbs [aria-current="page"]')).toHaveText(
        'Help & support',
      );
      const account = frame(page).getByRole('button', { name: /^Account menu: / });
      await expect(account).toHaveAccessibleName(accountName(label));
      await reachAndClick(page, account);
      await expect(frame(page).locator('.xr-menu .xr-menu-item')).toHaveText(['Help', 'Sign out']);
    });
  }
});

test.describe('below 1024: the drawer at app width 1023', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: Menu ("Open menu") → focus to "Close menu", the rest inert; Esc, the scrim and a destination close it`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`, SIDEBAR - 1);
      const menu = frame(page).getByRole('button', { name: 'Open menu' });
      await expect(menu).toBeVisible();
      await expect(menu).toHaveText('Menu');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(aside(page)).toBeHidden();

      // Keyboard: Enter opens; focus moves to "Close menu"; everything behind is inert.
      await tabTo(page, menu);
      await page.keyboard.press('Enter');
      const close = frame(page).getByRole('button', { name: 'Close menu' });
      await expect(close).toBeFocused();
      await expect(aside(page)).toBeVisible();
      await expect(frame(page).locator('.xr-shell')).toHaveClass(/is-drawer/);
      await expect(frame(page).locator('.xr-main')).toHaveAttribute('inert', '');
      await expect(frame(page).locator('.xr-skip')).toHaveAttribute('inert', '');
      await expect(frame(page).getByRole('link', { name: 'Help' }).last()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(aside(page)).toBeHidden();
      await expect(menu).toBeFocused();
      await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert');

      // Pointer: the scrim closes it, and focus returns to Menu.
      await reachAndClick(page, menu);
      await expect(close).toBeFocused();
      const drawer = await aside(page).boundingBox();
      await page.mouse.click(drawer!.x + drawer!.width + 40, 450);
      await expect(aside(page)).toBeHidden();
      await expect(menu).toBeFocused();

      // Choosing a destination closes it.
      await reachAndClick(page, menu);
      await reachAndClick(page, aside(page).getByRole('link').first());
      await expect(aside(page)).toBeHidden();
      await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert');
    });
  }
});

test.describe('Phase 0 in the drawer (1023) and on the rail (1100): Help alone, current', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: the drawer holds Help alone — focus to "Close menu", Esc back to Menu, choosing Help closes it`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}`, SIDEBAR - 1);
      const menu = frame(page).getByRole('button', { name: 'Open menu' });
      await tabTo(page, menu);
      await page.keyboard.press('Enter');
      await expect(frame(page).getByRole('button', { name: 'Close menu' })).toBeFocused();
      await expect(frame(page).locator('.xr-main')).toHaveAttribute('inert', '');
      await expect(aside(page).getByRole('navigation')).toHaveCount(0);
      const links = aside(page).getByRole('link');
      await expect(links).toHaveCount(1);
      await expect(links.first()).toHaveAccessibleName('Help');
      await expect(links.first()).toHaveAttribute('aria-current', 'page');
      await expect(links.first()).toBeInViewport();
      await page.keyboard.press('Escape');
      await expect(aside(page)).toBeHidden();
      await expect(menu).toBeFocused();

      // Pointer: choosing Help closes the drawer; nothing stays inert.
      await reachAndClick(page, menu);
      await reachAndClick(page, links.first());
      await expect(aside(page)).toBeHidden();
      await expect(frame(page).locator('.xr-main')).not.toHaveAttribute('inert');
    });

    test(`${label}: the rail shows Help with its tooltip on hover and focus; "Expand menu" brings the workspace back`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}`, 1100);
      expect(await width(aside(page))).toBe(72);
      await expect(aside(page).getByRole('navigation')).toHaveCount(0);
      const help = aside(page).getByRole('link');
      await expect(help).toHaveCount(1);
      await expect(help).toHaveAccessibleName('Help');
      await expect(help).toHaveAttribute('aria-current', 'page');
      const tip = help.locator('.xr-tip');
      await expect(tip).toHaveText('Help');
      const box = (await help.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await settle(page);
      expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
      await page.mouse.move(700, 450);
      await settle(page);
      expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('0');
      await tabTo(page, help);
      await settle(page);
      expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');

      await reachAndClick(page, frame(page).getByRole('button', { name: 'Expand menu' }));
      await settle(page);
      expect(await width(aside(page))).toBe(248);
      await expect(aside(page).locator('.xr-ws-label')).toHaveText(label);
      await expect(aside(page).getByRole('link')).toHaveCount(1);
      await expectSideBySide(page);
      await page.keyboard.press('Enter');
      await settle(page);
      expect(await width(aside(page))).toBe(72);
      await expectSideBySide(page);
    });
  }
});

/** The sidebar and the content side by side: never overlapping, no sideways scroll. */
async function expectSideBySide(page: Page): Promise<void> {
  const layout = await page.evaluate(() => {
    const side = document.querySelector('aside.xr-side')!.getBoundingClientRect();
    const main = document.querySelector('.xr-main')!.getBoundingClientRect();
    return {
      overlap: main.left < side.right - 0.5,
      sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(layout).toEqual({ overlap: false, sideways: false });
}

/**
 * Toggles the sidebar from a scrolled page: the toggle has keyboard focus, the wheel scrolls the
 * document, Enter toggles. Neither the scroll position nor the page heading moves.
 */
async function expectToggleInPlace(
  page: Page,
  name: 'Expand menu' | 'Collapse menu',
  widthAfter: number,
): Promise<void> {
  const toggle = frame(page).getByRole('button', { name });
  await tabTo(page, toggle);
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width - 24, viewport.height / 2);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await settle(page);
  await expect(toggle).toBeFocused();
  const heading = frame(page).locator('main h1');
  const top = () => heading.evaluate((element) => element.getBoundingClientRect().top);
  const before = { scroll: await page.evaluate(() => window.scrollY), heading: await top() };
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await width(aside(page))).toBe(widthAfter);
  expect({ scroll: await page.evaluate(() => window.scrollY), heading: await top() }).toEqual(
    before,
  );
  await expectSideBySide(page);
}

test.describe('1024–1279: the 72 px rail at app width 1100', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: tooltips named by destination on hover and focus; "Expand menu" pushes the content to 248 and back`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`, 1100);
      expect(await width(aside(page))).toBe(72);
      await expect(frame(page).getByRole('button', { name: 'Open menu' })).toBeHidden();
      await expect(aside(page).locator('.xr-ws')).toBeHidden();
      await expectSideBySide(page);
      const drawn = BOARD_06.get(label)!;
      const links = aside(page).getByRole('navigation').getByRole('link');
      for (const [index, item] of drawn.nav.entries()) {
        const link = links.nth(index);
        // The accessible name is always the destination name (board 06 "Behaviour").
        await expect(link).toHaveAccessibleName(destinationName(item.label, item.countText));
        const tip = link.locator('.xr-tip');
        await expect(tip).toHaveText(item.label);
        // Real pointer hover shows it; it goes when the pointer leaves.
        const box = (await link.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await settle(page);
        expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
        await page.mouse.move(700, 450);
        await settle(page);
        expect(await tip.evaluate((element) => getComputedStyle(element).opacity)).toBe('0');
      }
      // Keyboard focus shows it too.
      const first = links.first();
      await tabTo(page, first);
      await settle(page);
      expect(
        await first.locator('.xr-tip').evaluate((element) => getComputedStyle(element).opacity),
      ).toBe('1');

      // "Expand menu" widens the rail and pushes the content; nothing overlaps or scrolls.
      const contentBefore = await width(frame(page).locator('main .xr-content'));
      const scroll = await page.evaluate(() => window.scrollY);
      const expand = frame(page).getByRole('button', { name: 'Expand menu' });
      await expect(expand).toHaveAttribute('aria-expanded', 'false');
      await reachAndClick(page, expand);
      await settle(page);
      expect(await width(aside(page))).toBe(248);
      await expect(aside(page).locator('.xr-ws-label')).toHaveText(label);
      await expectSideBySide(page);
      expect(await width(frame(page).locator('main .xr-content'))).toBe(contentBefore - 176);
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
      const collapse = frame(page).getByRole('button', { name: 'Collapse menu' });
      await expect(collapse).toHaveAttribute('aria-expanded', 'true');
      await expect(collapse).toBeFocused();
      await page.keyboard.press('Enter');
      await settle(page);
      expect(await width(aside(page))).toBe(72);
      await expectSideBySide(page);

      // From a scrolled page: no scroll and no jump either way.
      await expectToggleInPlace(page, 'Expand menu', 248);
      await expectToggleInPlace(page, 'Collapse menu', 72);
    });
  }
});

test.describe('from 1280: the full sidebar at app width 1440', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [slug, label] of ROLES) {
    test(`${label}: 248 px with the workspace block; "Collapse menu" narrows it to the rail and back, without overlap or scrolling`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`, 1440);
      expect(await width(aside(page))).toBe(248);
      await expectSideBySide(page);
      const scroll = await page.evaluate(() => window.scrollY);
      const collapse = frame(page).getByRole('button', { name: 'Collapse menu' });
      await reachAndClick(page, collapse);
      await settle(page);
      expect(await width(aside(page))).toBe(72);
      await expectSideBySide(page);
      const expand = frame(page).getByRole('button', { name: 'Expand menu' });
      await expect(expand).toBeFocused();
      await page.keyboard.press('Enter');
      await settle(page);
      expect(await width(aside(page))).toBe(248);
      await expectSideBySide(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll);

      // From a scrolled page: no scroll and no jump either way.
      await expectToggleInPlace(page, 'Collapse menu', 72);
      await expectToggleInPlace(page, 'Expand menu', 248);
    });
  }
});

test.describe('app-width boundaries (Appendix E §6.1; app width measured)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own app width; one project is enough.',
  );

  for (const [app, band] of [
    [1023, 'drawer'],
    [1024, 'rail'],
    [1279, 'rail'],
    [1280, 'full'],
  ] as const) {
    for (const specimen of ['c-role-institute-admin-built', 'c-role-student']) {
      test(`app ${app}: ${band} (${specimen})`, async ({ page }) => {
        await ready(page, specimen, app);
        const menu = frame(page).getByRole('button', { name: 'Open menu' });
        if (band === 'drawer') {
          await expect(menu).toBeVisible();
          await expect(aside(page)).toBeHidden();
        } else {
          await expect(menu).toBeHidden();
          expect(await width(aside(page))).toBe(band === 'rail' ? 72 : 248);
          await expectSideBySide(page);
        }
        await expectNoAxeViolations(page);
        await expectNoInvisibleFocusTargets(page);
      });
    }
  }
});

test.describe('at each approved width (1440 · 1024 · 768 · 375): the band, the drawer, the document scrolling', () => {
  for (const [slug, label] of ROLES) {
    test(`${label}: the band the app width gives; below 1024 the drawer by pointer and Esc; the document is the one scroller`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`);
      const app = await frame(page)
        .locator('.xr-app')
        .evaluate((element) => element.getBoundingClientRect().width);
      expect(app).toBe(page.viewportSize()!.width);
      const menu = frame(page).getByRole('button', { name: 'Open menu' });
      const drawn = BOARD_06.get(label)!;
      if (app < SIDEBAR) {
        await expect(menu).toBeVisible();
        await expect(aside(page)).toBeHidden();
        await reachAndClick(page, menu);
        await expect(frame(page).getByRole('button', { name: 'Close menu' })).toBeFocused();
        // v46: the drawer is min(320px, 86%) of the shell, with every destination and Help in it.
        expect(await width(aside(page))).toBe(Math.round(Math.min(320, app * 0.86)));
        await expect(aside(page).getByRole('navigation').locator('.xr-nav-text')).toHaveText(
          drawn.nav.map((item) => item.label),
        );
        await expect(
          aside(page).locator('.xr-side-foot').getByRole('link', { name: 'Help' }),
        ).toBeAttached();
        await page.keyboard.press('Escape');
        await expect(aside(page)).toBeHidden();
        await expect(menu).toBeFocused();
      } else {
        await expect(menu).toBeHidden();
        expect(await width(aside(page))).toBe(app < 1280 ? 72 : 248);
        await expectSideBySide(page);
      }
      // Natural document scrolling: the wheel over the page scrolls the document, and nothing in
      // the shell is a scroller of its own.
      const viewport = page.viewportSize()!;
      await page.mouse.move(viewport.width - 24, viewport.height / 2);
      await page.mouse.wheel(0, 400);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      expect(
        await page.evaluate(() =>
          [...document.querySelectorAll('.xr-app, .xr-app *')]
            .filter((element) => {
              const style = getComputedStyle(element);
              return (
                /auto|scroll/.test(style.overflowY) &&
                element.scrollHeight > element.clientHeight + 1
              );
            })
            .map((element) => element.className),
        ),
      ).toEqual([]);
    });
  }
});

test.describe('the skip link (board 12 "Shell tab order"; WCAG 2.4.1)', () => {
  for (const [slug] of [ROLES[1], ROLES[6]]) {
    test(`c-role-${slug}: the first Tab reaches "Skip to main content", visible; Enter moves focus to main#main`, async ({
      page,
    }) => {
      await ready(page, `c-role-${slug}-built`);
      await page.evaluate(() => {
        const root = document.documentElement;
        root.setAttribute('tabindex', '-1');
        root.focus({ preventScroll: true });
        root.removeAttribute('tabindex');
      });
      await page.keyboard.press('Tab');
      const skip = frame(page).getByRole('link', { name: 'Skip to main content' });
      await expect(skip).toBeFocused();
      await settle(page);
      await expect(skip).toBeInViewport();
      await page.keyboard.press('Enter');
      const main = frame(page).locator('main#main');
      await expect(main).toBeFocused();
      // The next Tab continues in the page content, not in the sidebar or top bar.
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('main#main')))).toBe(
        true,
      );
    });
  }
});
