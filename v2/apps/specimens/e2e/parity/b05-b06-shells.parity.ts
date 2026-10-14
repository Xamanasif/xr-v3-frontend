import type { Locator, Page } from '@playwright/test';

import { setBoardProps } from '../../../../tools/board-capture/src/boards.mjs';
import { compareAll, pointerAway } from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Boards 05 (GL-01 Workspace Shell) and 06 (Sidebar variants) against the product shell parts —
 * WorkspaceShell, Sidebar, NavItem, TopBar, AccountMenu, ShellBanner — composed with board 05/06
 * fixture copy in the harness (WP-0.15). Board 05 is driven through its own canvas props
 * (role × banner, startWithMenuOpen) and its own sidebar (Help).
 *
 * Applicable banner states (domain `shellBanner`, XS-08): every role without a banner; "Institution
 * paused" for Student, Faculty and Institute Admin; "Account inactive" for Student. The board's
 * other canvas combinations are captured as references only (references.parity.ts).
 */
const ROLES = [
  ['student', 'Student'],
  ['faculty', 'Faculty'],
  ['institute-admin', 'Institute Admin'],
  ['vendor', 'Vendor'],
  ['academic-reviewer', 'Academic Reviewer'],
  ['content-manager', 'Content Manager'],
  ['super-admin', 'Super Admin'],
] as const;

const APPLICABLE: readonly (readonly [
  string,
  string,
  'None' | 'Institution paused' | 'Account inactive',
])[] = [
  ...ROLES.map(([slug, label]) => [slug, label, 'None'] as const),
  ['student', 'Student', 'Institution paused'],
  ['faculty', 'Faculty', 'Institution paused'],
  ['institute-admin', 'Institute Admin', 'Institution paused'],
  ['student', 'Student', 'Account inactive'],
];

const BANNER_SLUG = {
  None: 'none',
  'Institution paused': 'paused',
  'Account inactive': 'inactive',
};

const slug = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, '-');

test.use({ viewport: { width: 1440, height: 900 } });

test('board 05 · the shell for 7 roles × applicable banners: sidebar, top bar, banner', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('05-Workspace-Shell.dc.html');
  const failures: string[] = [];
  for (const [role, label, banner] of APPLICABLE) {
    const facts = await setBoardProps(board, { role: label, banner, startWithMenuOpen: false });
    expect(facts.markers).toBe(0);
    await page.goto(`/p-shell-${role}-${BANNER_SLUG[banner]}`);
    const name = `05-${slug(label)}-${BANNER_SLUG[banner]}`;
    const items: CompareItem[] = [
      {
        name: `${name}-sidebar`,
        reference: board.locator('aside.xr-side'),
        product: page.locator('aside.xr-side'),
      },
      {
        name: `${name}-top-bar`,
        reference: board.locator('header.xr-top'),
        product: page.locator('header.xr-top'),
      },
    ];
    if (banner !== 'None') {
      items.push({
        name: `${name}-banner`,
        reference: board.locator('.xr-banner'),
        product: page.locator('.xr-banner'),
      });
    }
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  }
  expect(failures).toEqual([]);
});

test('board 05 · the account menu open, 7 roles (startWithMenuOpen)', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('05-Workspace-Shell.dc.html');
  const failures: string[] = [];
  for (const [role, label] of ROLES) {
    await setBoardProps(board, { role: label, banner: 'None', startWithMenuOpen: true });
    await page.goto(`/p-shell-${role}-none`);
    await page.locator('.xr-acct-btn').click();
    await expect(page.locator('.xr-menu')).toBeVisible();
    await pointerAway(page);
    try {
      await compareAll({
        expect,
        testInfo,
        kind: 'specimen',
        items: [
          {
            name: `05-${slug(label)}-account-menu-open`,
            reference: board.locator('.xr-menu'),
            product: page.locator('.xr-menu'),
          },
        ],
      });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  }
  expect(failures).toEqual([]);
});

test('board 05 · Help state: sidebar with Help current, top bar, Help & support page', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('05-Workspace-Shell.dc.html');
  const failures: string[] = [];
  for (const [role, label] of ROLES) {
    await setBoardProps(board, { role: label, banner: 'None', startWithMenuOpen: false });
    await board.locator('aside.xr-side .xr-side-foot a').click();
    await expect(board.locator('header.xr-top .xr-top-title')).toHaveText('Help & support');
    await pointerAway(board);
    await board.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.goto(`/p-shell-${role}-help`);
    const name = `05-${slug(label)}-help`;
    const items: CompareItem[] = [
      {
        name: `${name}-sidebar`,
        reference: board.locator('aside.xr-side'),
        product: page.locator('aside.xr-side'),
      },
      {
        name: `${name}-top-bar`,
        reference: board.locator('header.xr-top'),
        product: page.locator('header.xr-top'),
      },
    ];
    if (role === 'institute-admin') {
      items.push(
        {
          name: `${name}-page-header`,
          reference: board.locator('main .xr-phead'),
          product: page.locator('main .xr-phead'),
        },
        {
          name: `${name}-my-reports`,
          reference: board.locator('main section.xr-section'),
          product: page.locator('main section.xr-section'),
        },
      );
    }
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  }
  expect(failures).toEqual([]);
});

function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

test('board 06 · the seven sidebars at full width: head, workspace, destinations, Help', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('06-Sidebar-Variants.dc.html', {
    viewport: { width: 2080, height: 900 },
  });
  const sidebars = section(board, 'The seven sidebars').locator('aside.xr-side');
  await expect(sidebars).toHaveCount(7);
  const failures: string[] = [];
  for (const [index, [role, label]] of ROLES.entries()) {
    await page.goto(`/p-shell-${role}-none`);
    const aside = sidebars.nth(index);
    const ours = page.locator('aside.xr-side');
    try {
      await compareAll({
        expect,
        testInfo,
        kind: 'specimen',
        items: [
          {
            name: `06-${slug(label)}-sidebar-workspace`,
            reference: aside.locator('.xr-ws'),
            product: ours.locator('.xr-ws'),
          },
          {
            name: `06-${slug(label)}-sidebar-destinations`,
            reference: aside.locator('nav'),
            product: ours.locator('nav'),
          },
          {
            // The foot's list: the specimen asides carry an inline `border-radius: 12px` (canvas
            // presentation); the whole foot is compared on board 05's full-height sidebars.
            name: `06-${slug(label)}-sidebar-help`,
            reference: aside.locator('.xr-side-foot > ul'),
            product: ours.locator('.xr-side-foot > ul'),
          },
        ],
      });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  }
  expect(failures).toEqual([]);
});

test('board 06 · rail (Institute Admin, People current, tooltip) and drawer (Student, 375)', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('06-Sidebar-Variants.dc.html', {
    viewport: { width: 2080, height: 900 },
  });
  const collapse = section(board, 'Collapsed rail and mobile drawer');
  const rail = collapse.locator('aside.xr-side--rail');
  // The product rail at 1100 px of app width (1024–1279: the rail by default, board 06).
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/p-shell-institute-admin-people');
  const ourRail = page.locator('aside.xr-side');
  const items: CompareItem[] = [
    {
      name: '06-rail-institute-admin-destinations',
      reference: rail.locator('nav'),
      product: ourRail.locator('nav'),
      deviation: 'DEV-07',
    },
    {
      name: '06-rail-institute-admin-help',
      reference: rail.locator('.xr-side-foot'),
      product: ourRail.locator('.xr-side-foot'),
      deviation: 'DEV-07',
    },
    {
      // Board: the tooltip drawn shown with the static `.is-shown`; product: real pointer hover.
      name: '06-rail-tooltip-content-access',
      reference: rail.locator('.xr-tip.is-shown'),
      product: ourRail.locator('nav li').nth(1).locator('.xr-tip'),
      before: { product: () => ourRail.locator('nav li').nth(1).locator('a').hover() },
      after: { product: () => pointerAway(page) },
    },
  ];
  const failures: string[] = [];
  const collect = async (batch: CompareItem[]) => {
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items: batch });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  };
  await collect(items);
  // The drawer at 375: board frame 375 × 700, product viewport 375 × 900, opened with "Menu".
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/p-shell-student-none');
  // The board draws the drawer at x = 657.906 inside a bordered canvas frame, the product at the
  // viewport edge over the scrim: after the sub-pixel alignment the outermost pixel columns blend
  // with different backdrops, so the drawer parts are cropped 1 px inside on the left and right.
  // By keyboard, as board 06 draws it: focus moves to "Close menu" and is visible.
  await page.getByRole('button', { name: 'Open menu' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  const drawer = collapse.locator('.doc-frame .xr-shell.is-drawer > aside.xr-side');
  const ourDrawer = page.locator('.xr-shell.is-drawer > aside.xr-side');
  await collect([
    {
      // Board: `.is-focus` on "Close menu" (a static state, blue on navy); product: real focus
      // after opening, gold on navy (PF-07).
      name: '06-drawer-student-head',
      reference: drawer.locator('.xr-side-head'),
      product: ourDrawer.locator('.xr-side-head'),
      insetX: 1,
      deviation: 'DEV-06',
    },
    {
      name: '06-drawer-student-workspace',
      reference: drawer.locator('.xr-ws'),
      product: ourDrawer.locator('.xr-ws'),
      insetX: 1,
    },
    {
      name: '06-drawer-student-destinations',
      reference: drawer.locator('nav'),
      product: ourDrawer.locator('nav'),
      insetX: 1,
    },
    {
      name: '06-drawer-student-help',
      reference: drawer.locator('.xr-side-foot'),
      product: ourDrawer.locator('.xr-side-foot'),
      insetX: 1,
    },
  ]);
  expect(failures).toEqual([]);
});

/** Board 06 "Nested destinations": the section tabs under each page header (frame by frame). */
const NESTED = [
  ['super-admin', 'super-admin-content', 'Content'],
  ['super-admin', 'super-admin-operations', 'Operations'],
  ['institute-admin', 'institute-admin-people', 'People'],
  ['institute-admin', 'institute-admin-requests', 'Requests'],
] as const;

test('board 06 · nested destinations: section tabs, current part marked', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('06-Sidebar-Variants.dc.html', {
    viewport: { width: 2080, height: 900 },
  });
  const frames = section(board, 'Nested destinations').locator('.doc-frame');
  await expect(frames).toHaveCount(NESTED.length);
  await page.goto('/p-06-nested-tabs');
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: NESTED.map(([, id], index): CompareItem => ({
      name: `06-nested-${id}-section-tabs`,
      reference: frames.nth(index).locator('nav.xr-tabs'),
      product: page.locator(`[data-parity="${id}"] > *`),
      matchWidth: true,
    })),
  });
});
