import type { Locator, Page } from '@playwright/test';

import {
  compareAll,
  keyboardFocus,
  pointerAway,
} from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 11 "Responsive proof · 1440 · 1024 · 768 · 375" against the product shell parts at each
 * frame width (WP-0.15): top bars (breadcrumbs, Menu, Expand menu, account), sidebars, the rail,
 * the drawer, the open account menu, and the four People section-tab strips at 375. The frames'
 * page areas — AR-2 People, AR-4 request decision, AR-10 "not available" — are later-phase screens
 * (references only); the AR-8 "Report a problem" frame is the XS-07 form, compared on the built
 * screen (apps/web parity suite). Sidebars are compared part by part: the canvas frames give the
 * shell a fixed min-height (920–1760 px) where the product shell is the 900 px viewport.
 */
function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

const sidebarParts = (name: string, drawn: Locator, ours: Locator, insetX = 0): CompareItem[] => [
  {
    name: `${name}-sidebar-workspace`,
    reference: drawn.locator('.xr-ws'),
    product: ours.locator('.xr-ws'),
    insetX,
  },
  {
    name: `${name}-sidebar-destinations`,
    reference: drawn.locator('nav'),
    product: ours.locator('nav'),
    insetX,
  },
  {
    name: `${name}-sidebar-help`,
    reference: drawn.locator('.xr-side-foot'),
    product: ours.locator('.xr-side-foot'),
    insetX,
  },
];

test('board 11 · shells at 1440, 1024, 768 and 375', async ({ page, openBoardPage }, testInfo) => {
  const { page: board } = await openBoardPage('11-Responsive-Proof.dc.html', {
    viewport: { width: 2720, height: 900 },
  });
  const apps = board.locator('.doc-frame > .xr-app');
  const app = (n: number) => apps.nth(n);
  const failures: string[] = [];
  const run = async (
    width: number,
    path: string,
    items: (ours: Page) => Promise<CompareItem[]> | CompareItem[],
    open?: () => Promise<void>,
  ) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await open?.();
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items: await items(page) });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  };
  // 1440 · Institute Admin · People › Students · account menu open
  await run(
    1440,
    '/p-11-institute-admin-people-students',
    (ours) => [
      {
        name: '11-p1440-top-bar',
        reference: app(0).locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: '11-p1440-account-menu',
        reference: app(0).locator('.xr-menu'),
        product: ours.locator('.xr-menu'),
      },
      ...sidebarParts('11-p1440', app(0).locator('aside.xr-side'), ours.locator('aside.xr-side')),
    ],
    async () => {
      await page.locator('.xr-acct-btn').click();
      await pointerAway(page);
    },
  );
  // 1024 · Super Admin · Request decision · rail
  await run(1024, '/p-11-super-admin-req-0042', (ours) => [
    {
      name: '11-p1024-top-bar',
      reference: app(1).locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
    {
      name: '11-p1024-rail-destinations',
      reference: app(1).locator('aside.xr-side nav'),
      product: ours.locator('aside.xr-side nav'),
    },
    {
      name: '11-p1024-rail-help',
      reference: app(1).locator('aside.xr-side .xr-side-foot'),
      product: ours.locator('aside.xr-side .xr-side-foot'),
    },
  ]);
  // 768 · Institute Admin · People (drawer closed: Menu in the top bar)
  await run(768, '/p-11-institute-admin-people', (ours) => [
    {
      name: '11-p768-top-bar',
      reference: app(2).locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
  ]);
  // 375 · Drawer open (focus on "Close menu", by keyboard)
  await run(
    375,
    '/p-11-student-home',
    (ours) => [
      {
        name: '11-m-drawer-head',
        reference: app(3).locator('aside.xr-side .xr-side-head'),
        product: ours.locator('aside.xr-side .xr-side-head'),
        insetX: 1,
        deviation: 'DEV-06',
      },
      ...sidebarParts(
        '11-m-drawer',
        app(3).locator('aside.xr-side'),
        ours.locator('aside.xr-side'),
        1,
      ),
    ],
    async () => {
      await page.getByRole('button', { name: 'Open menu' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    },
  );
  // 375 · Account menu
  await run(
    375,
    '/p-11-student-home',
    (ours) => [
      {
        name: '11-m-acct-top-bar',
        reference: app(4).locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: '11-m-acct-account-menu',
        reference: app(4).locator('.xr-menu'),
        product: ours.locator('.xr-menu'),
      },
    ],
    async () => {
      await page.locator('.xr-acct-btn').click();
      await pointerAway(page);
    },
  );
  // 375 · AR-2 list (Institute Admin) and AR-4 decision (Super Admin): the top bars
  await run(375, '/p-11-institute-admin-people', (ours) => [
    {
      name: '11-m-list-top-bar',
      reference: app(5).locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
  ]);
  await run(375, '/p-11-super-admin-req-0042-mobile', (ours) => [
    {
      name: '11-m-dec-top-bar',
      reference: app(6).locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
  ]);
  expect(failures).toEqual([]);
});

test('board 11 · People section tabs at 375, each tab current', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('11-Responsive-Proof.dc.html', {
    viewport: { width: 2720, height: 900 },
  });
  const strips = section(board, 'Section tabs at 375 px').locator('nav.xr-tabs');
  await expect(strips).toHaveCount(4);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/p-11-people-tabs');
  const ids = ['students', 'faculty', 'groups', 'faculty-courses'];
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: ids.map((id, index): CompareItem => ({
      name: `11-tabs-375-${id}-current`,
      reference: strips.nth(index),
      product: page.locator(`[data-parity="tabs-375-${id}"] nav.xr-tabs`),
      margin: id === 'groups' ? 4 : 0,
      // Board: "Current: Groups" draws its tab with the static `.is-focus`; product: real focus.
      before:
        id === 'groups'
          ? {
              product: () =>
                keyboardFocus(
                  page.locator(
                    '[data-parity="tabs-375-groups"] nav.xr-tabs a[aria-current="page"]',
                  ),
                ),
            }
          : undefined,
    })),
  });
});
