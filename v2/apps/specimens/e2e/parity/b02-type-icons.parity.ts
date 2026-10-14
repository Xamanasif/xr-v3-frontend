import type { Locator, Page } from '@playwright/test';

import {
  compareAll,
  keyboardFocus,
  pointerAway,
} from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 02 "Tokens and typography" against Text, Link, IdChip, NavItem and Icon (WP-0.15).
 * Not compared: "Typeface" and "Token names" (documentation of the font and the token names),
 * "Hierarchy in use" (a composition of the same type styles, back link and id chip), "Focus on
 * light" (static `.is-focus` buttons — board 03 already compares real focus — and an input,
 * DEV-03), "Motion principles" (words only), and the type-scale "label" row (no Text variant: the
 * label style is the Field label, compared on board 03).
 */
function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

const TYPE_ROWS = [
  'display',
  'h1',
  'h2',
  'h3',
  'lead',
  'body',
  'small',
  'meta',
  'overline',
  'caption',
];

const ICON_COUNT = 48;

test('board 02 · type scale, links, navy focus, icon sizes and working set', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('02-Tokens-Typography.dc.html');
  await page.goto('/p-02-type-icons');
  const product = (id: string) => page.locator(`[data-parity="${id}"] > *`).first();
  const scale = section(board, 'Type scale');
  const links = section(board, 'Links and focus');
  const icons = section(board, 'Icon sizing and working icon set');
  const productIcons = page.locator('[data-parity^="icon-"]:not([data-parity^="icon-size"]) > *');
  await expect(productIcons).toHaveCount(ICON_COUNT);
  const boardTiles = icons.locator('.doc-card').nth(1).locator(':scope > div > span:first-child');
  await expect(boardTiles).toHaveCount(ICON_COUNT);
  const iconNames = await page
    .locator('[data-parity^="icon-"]:not([data-parity^="icon-size"])')
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-parity')!));

  const items: CompareItem[] = [
    ...TYPE_ROWS.map((token): CompareItem => ({
      name: `02-type-${token}`,
      reference: scale.locator(`td > span.xr-${token}`),
      product: product(`type-${token}`),
      margin: 2,
      // The words wrap at the table cell's content width (the display row wraps on the board).
      containerWidth: true,
    })),
    {
      name: '02-type-chip',
      reference: scale.locator('td > span.xr-fmt'),
      product: product('type-chip'),
      margin: 2,
      containerWidth: true,
    },
    {
      name: '02-link-in-text',
      reference: links.locator('.doc-card').nth(0).locator('p.xr-body').nth(0),
      product: product('link-in-text'),
      matchWidth: true,
    },
    {
      name: '02-link-hover',
      reference: links.locator('.doc-card').nth(0).locator('p.xr-body').nth(1),
      product: product('link-hover'),
      matchWidth: true,
      before: { product: () => page.locator('[data-parity="link-hover"] a').hover() },
      after: { product: () => pointerAway(page) },
    },
    {
      name: '02-link-external',
      reference: links.locator('.doc-card').nth(0).locator('p.xr-body').nth(2),
      product: product('link-external'),
      matchWidth: true,
    },
    {
      name: '02-id-chip',
      reference: section(board, 'Hierarchy in use').locator('span.xr-id'),
      product: product('id-chip'),
      matchWidth: true,
      margin: 2,
    },
    {
      name: '02-focus-on-navy-nav-item',
      reference: links.locator('.xr-side .xr-nav a'),
      product: page.locator('[data-parity="focus-on-navy"] .xr-nav a'),
      margin: 4,
      matchWidth: true,
      before: {
        product: () => keyboardFocus(page.locator('[data-parity="focus-on-navy"] .xr-nav a')),
      },
    },
    ...([16, 20, 24] as const).map((size, index): CompareItem => ({
      name: `02-icon-size-${size}`,
      reference: icons.locator('.doc-card').nth(0).locator('svg.xr-ico').nth(index),
      product: product(`icon-size-${size}`),
      margin: 1,
      deviation: size === 24 ? 'DEV-05' : undefined,
    })),
    ...iconNames.map((id, index): CompareItem => ({
      name: `02-${id}`,
      reference: boardTiles.nth(index),
      product: product(id),
    })),
  ];
  expect(items).toHaveLength(TYPE_ROWS.length + 6 + 3 + ICON_COUNT);
  await compareAll({ expect, testInfo, kind: 'specimen', items });
});
