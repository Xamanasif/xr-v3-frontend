import type { Locator, Page } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 04 "Status words, format chips and the state grammar" against StatusPill, FormatBadge,
 * Notice and ShellBanner (WP-0.15). Not compared: "Four things the chips must never blur" and
 * the state-grammar table (documentation tables of the same chips), and the composed
 * "Waiting on another role" / "Not available · inline" boxes (board-only inline layout).
 */
function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

const STATUS_WORDS = [
  'Not started',
  'Draft',
  'No access yet',
  'Under review',
  'With Academic Reviewer',
  'In progress',
  'Waiting for marking',
  'Waiting for a licence',
  'Awaiting release decision',
  'Access active',
  'Completed',
  'Published',
  'Resolved',
  'Returned',
  'Information requested',
  'Payment failed',
  'Paused',
  'On hold',
  'Read-only',
  'Inactive',
  'Ended',
  'Withdrawn',
];

test('board 04 · status chips, format chips, state grammar notices, shell banners', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('04-Status-Format-States.dc.html');
  await page.goto('/p-04-status-format');
  const product = (id: string) => page.locator(`[data-parity="${id}"] > *`).first();
  const chips = section(board, 'Status chips · tone, icon, words');
  const formats = section(board, 'Format chips · WEB · AR · VR · MR');
  const card = (n: number) => formats.locator('.doc-card').nth(n);
  const grammar = section(board, 'State grammar · one pattern per state');

  const chip = (where: Locator, classes: string, words: string) =>
    where
      .locator(`span.xr-fmt${classes}`)
      .filter({ hasText: new RegExp(`^${words}$`) })
      .first();

  const items: CompareItem[] = [
    ...STATUS_WORDS.map((words, index): CompareItem => ({
      name: `04-status-${words.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      reference: chips.locator('span.xr-status', { hasText: new RegExp(`^${words}$`) }).first(),
      product: product(`status-${index}`),
      // Chips have fractional boxes: a 2 px margin keeps both anti-aliased ends in the clip.
      margin: 2,
    })),
    {
      name: '04-format-offered-web',
      reference: chip(card(0), '', 'WEB'),
      product: product('fmt-offered-web'),
      margin: 2,
    },
    {
      name: '04-format-offered-ar',
      reference: chip(card(0), '', 'AR'),
      product: product('fmt-offered-ar'),
      margin: 2,
    },
    {
      name: '04-format-offered-vr',
      reference: chip(card(0), '', 'VR'),
      product: product('fmt-offered-vr'),
      margin: 2,
    },
    {
      name: '04-format-offered-mr',
      reference: chip(card(0), '', 'MR'),
      product: product('fmt-offered-mr'),
      margin: 2,
    },
    {
      name: '04-format-yours-web',
      reference: chip(card(1), '.xr-fmt--yours', 'WEB'),
      product: product('fmt-yours-web'),
      margin: 2,
    },
    {
      name: '04-format-yours-vr',
      reference: chip(card(1), '.xr-fmt--yours', 'VR'),
      product: product('fmt-yours-vr'),
      margin: 2,
    },
    {
      name: '04-format-off-ar',
      reference: chip(card(2), '.xr-fmt--off', 'AR'),
      product: product('fmt-off-ar'),
      margin: 2,
    },
    {
      name: '04-format-off-mr',
      reference: chip(card(2), '.xr-fmt--off', 'MR'),
      product: product('fmt-off-mr'),
      margin: 2,
    },
    {
      name: '04-format-compact-web',
      reference: chip(card(4), '.xr-fmt--compact', 'WEB'),
      product: product('fmt-compact-web'),
      margin: 2,
    },
    {
      name: '04-format-compact-vr',
      reference: chip(card(4), '.xr-fmt--compact', 'VR'),
      product: product('fmt-compact-vr'),
      margin: 2,
    },
    {
      name: '04-format-compact-ar-off',
      reference: chip(card(4), '.xr-fmt--compact.xr-fmt--off', 'AR'),
      product: product('fmt-compact-ar-off'),
      margin: 2,
    },
    {
      name: '04-format-on-dark-web',
      reference: chip(card(5), '.xr-fmt--on-dark', 'WEB'),
      product: product('fmt-on-dark-web'),
      margin: 2,
    },
    {
      name: '04-format-on-dark-vr',
      reference: chip(card(5), '.xr-fmt--on-dark', 'VR'),
      product: product('fmt-on-dark-vr'),
      margin: 2,
    },
    {
      name: '04-grammar-refused-with-reason',
      reference: grammar.locator('.xr-notice--err'),
      product: product('grammar-refused'),
      matchWidth: true,
    },
    {
      name: '04-grammar-after-resubmitting',
      reference: grammar.locator('.xr-notice--ok'),
      product: product('grammar-submitted'),
      matchWidth: true,
      // Board 04 draws the circle tick; the product default is the Done tick (DEV-18).
      deviation: 'DEV-18',
    },
    {
      name: '04-banner-paused',
      reference: grammar.locator('.xr-banner--paused'),
      product: product('banner-paused'),
      matchWidth: true,
      deviation: 'DEV-04',
    },
    {
      name: '04-banner-inactive',
      reference: grammar.locator('.xr-banner--inactive'),
      product: product('banner-inactive'),
      matchWidth: true,
    },
  ];
  expect(items).toHaveLength(39);
  await compareAll({ expect, testInfo, kind: 'specimen', items });
});
