import type { Locator, Page } from '@playwright/test';

import { compareAll, keyboardFocus } from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 03 "Core component language" (every section after "Actions") against the product
 * components (WP-0.15). One board load and one specimen page; each drawn specimen is compared as
 * an element. `matchWidth` gives the harness box the drawn element's width (block components
 * fill their container); `margin` leaves room for a focus ring.
 *
 * Not compared here, by design: the breadcrumbs, drawn outside a top bar with an inline
 * `display:flex` (the product shows them in the top bar only; compared in the board 05, 07 and 11
 * top bars); the ErrorSummary drawn as `xr-notice--err` (VD-22: the product
 * baseline comes from B4-04, `b4-04-error-summary.parity.ts`); the open account menus, which
 * board 03 lays out `position: static; width: 100%` (compared on the board 05 shell instead);
 * the loading skeleton, read-only box and comparison block, drawn with board-only inline layout;
 * the editable table (DataTable editing is not a Phase-0 component).
 */
function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

test('board 03 · form controls, toolbar, tabs, header, rows, notices, stepper, timeline, decision panel, account', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('03-Core-Components.dc.html');
  await page.goto('/p-03-components');
  const product = (id: string) => page.locator(`[data-parity="${id}"] > *`).first();

  const forms = section(board, 'Form controls');
  const card = (n: number) => forms.locator('.doc-card').nth(n);
  const find = section(board, 'Search, filter, segmented and tabs');
  const nav = section(board, 'Breadcrumbs, back link and page header');
  const list = section(board, 'List rows and attention items');
  const notices = section(board, 'Notices, empty, error, loading and read-only');
  const proc = section(board, 'Stepper, timeline and comparison');
  const decision = section(board, 'Decision panel and editable table');
  const account = section(board, 'Account menu');
  const warn = notices.locator('.xr-notice').nth(2);

  const item = (
    name: string,
    reference: Locator,
    id: string,
    options: {
      matchWidth?: boolean;
      widthFrom?: Locator;
      margin?: number;
      productLocator?: Locator;
      deviation?: string;
    } = {},
  ): CompareItem => ({
    name: `03-${name}`,
    reference,
    product: options.productLocator ?? product(id),
    margin: options.margin ?? 0,
    matchWidth: options.widthFrom ? false : (options.matchWidth ?? true),
    widthFrom: options.widthFrom,
    deviation: options.deviation,
  });

  const items: CompareItem[] = [
    item('text-input-empty', card(0).locator('.xr-field').nth(0), 'field-text-empty'),
    {
      ...item('text-input-focused', card(0).locator('.xr-field').nth(1), 'field-text-focused', {
        margin: 6,
        deviation: 'DEV-03',
      }),
      before: { product: () => keyboardFocus(page.locator('#c-in2')) },
    },
    item('text-input-error', card(0).locator('.xr-field').nth(2), 'field-text-error'),
    item('read-only-value', card(0).locator('.xr-field').nth(3), 'field-read-only', {
      deviation: 'DEV-02',
    }),
    item('textarea', card(1).locator('.xr-field').nth(0), 'field-textarea'),
    item('select', card(1).locator('.xr-field').nth(1), 'field-select'),
    item('file-input', card(1).locator('.xr-field').nth(2), 'field-file'),
    item('checkbox-group', card(2).locator('fieldset').nth(0), 'field-checkboxes'),
    item('radio-group', card(2).locator('fieldset').nth(1), 'field-radios'),
    item('search-input', card(2).locator('.xr-field'), 'field-search'),
    item('long-values-375', forms.locator('.doc-frame > .xr-content').nth(0), 'lv-375', {
      matchWidth: false,
    }),
    item('long-values-768', forms.locator('.doc-frame > .xr-content').nth(1), 'lv-768', {
      matchWidth: false,
    }),
    item('list-toolbar-1112', find.locator('.doc-frame > .xr-content').nth(0), 'tb-1112', {
      matchWidth: false,
    }),
    item('list-toolbar-720', find.locator('.doc-frame > .xr-content').nth(1), 'tb-720', {
      matchWidth: false,
    }),
    item('list-toolbar-343', find.locator('.doc-frame > .xr-content').nth(2), 'tb-343', {
      matchWidth: false,
    }),
    item('segmented-control', find.locator('.xr-seg'), 'segmented'),
    item('record-tabs', find.locator('.xr-tabs[role="tablist"]'), 'record-tabs'),
    item('section-tabs', find.locator('nav.xr-tabs'), 'section-tabs'),
    item('back-link', nav.locator('.doc-card').nth(0).locator('a.xr-back'), 'back-link'),
    item('page-header', nav.locator('.xr-phead'), 'page-header'),
    item('list-rows-table', list.locator('.xr-content').first(), 'rows-table', {
      deviation: 'DEV-04',
    }),
    item('attention-list', list.locator('section.xr-section'), 'attention'),
    item('notice-info', notices.locator('.xr-notice').nth(0), 'notice-info'),
    // The product's default ok icon is the product boards' Done tick; board 03 draws the circle
    // tick (DEV-18, reported by the icon check).
    item('notice-ok', notices.locator('.xr-notice').nth(1), 'notice-ok', { deviation: 'DEV-18' }),
    // The board's two-column grid stretches the warn notice to the err notice's row height (canvas
    // layout), so its icon and body are compared on their own, the body at the drawn width.
    item('notice-warn-icon', warn.locator('svg.xr-ico'), 'notice-warn', {
      matchWidth: false,
      productLocator: product('notice-warn').locator('svg.xr-ico'),
      deviation: 'DEV-05',
    }),
    item('notice-warn-body', warn.locator('.xr-notice-body'), 'notice-warn', {
      widthFrom: warn,
      productLocator: product('notice-warn').locator('.xr-notice-body'),
    }),
    item('notice-err-failed-state', notices.locator('.xr-notice').nth(3), 'notice-err'),
    item('empty-state', notices.locator('.xr-empty'), 'empty', { deviation: 'DEV-04' }),
    item('stepper', proc.locator('ol.xr-steps'), 'stepper', {
      productLocator: page.locator('[data-parity="stepper"] ol.xr-steps'),
    }),
    item('timeline', proc.locator('ol.xr-timeline'), 'timeline'),
    item('decision-panel', decision.locator('aside.xr-dpanel'), 'decision-panel', {
      deviation: 'DEV-04',
    }),
    item('account-button-closed', account.locator('.xr-acct'), 'account-closed', {
      matchWidth: false,
    }),
  ];
  expect(items).toHaveLength(32);
  await compareAll({ expect, testInfo, kind: 'specimen', items });
});
