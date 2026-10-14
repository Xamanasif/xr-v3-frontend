import {
  blurAll,
  compareAll,
  keyboardFocus,
  pointerAway,
} from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 03 "Actions" against the product `Button` (WP-0.15). Each drawn button is compared as an
 * element with a 6 px margin (room for the focus ring). Hover = the pointer over the product
 * button; keyboard focus = real `:focus-visible` focus; busy = the component's busy state.
 */
const VARIANTS = [
  { key: 'primary', label: 'Give access', states: ['default', 'hover', 'focus', 'busy'] },
  { key: 'secondary', label: 'Save draft', states: ['default', 'hover', 'focus', 'busy'] },
  { key: 'text', label: 'View my reports', states: ['default', 'hover', 'focus'] },
  { key: 'danger', label: 'Withdraw access', states: ['default', 'hover', 'focus', 'busy'] },
  { key: 'danger-quiet', label: 'Deactivate account', states: ['default', 'hover', 'focus'] },
] as const;

test('board 03 · Actions · Button variants, states, sizes, unavailable', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('03-Core-Components.dc.html');
  const section = board.locator('section.doc-sec').filter({
    has: board.locator('h2.doc-sec-title', { hasText: /^Actions$/ }),
  });
  const table = section.locator('.doc-card').first();
  await page.goto('/p-03-actions');
  const product = (id: string) => page.locator(`[data-parity="${id}"] > *`);

  const items: CompareItem[] = VARIANTS.flatMap(({ key, states }): CompareItem[] => {
    const drawn = table.locator(`button.xr-btn--${key}`);
    return states.map((state, index) => ({
      name: `03-actions-${key}-${state}`,
      reference: drawn.nth(index),
      product: product(`btn-${key}-${state}`),
      margin: 6,
      // DEV-01: the product's busy look follows the product boards, not the Batch-0 boards.
      deviation: state === 'busy' ? 'DEV-01' : undefined,
      before:
        state === 'hover'
          ? { product: () => product(`btn-${key}-${state}`).hover() }
          : state === 'focus'
            ? { product: () => keyboardFocus(product(`btn-${key}-${state}`)) }
            : undefined,
      after: { product: async () => (await pointerAway(page), await blurAll(page)) },
    }));
  });
  const cards = section.locator('.doc-card');
  items.push(
    {
      name: '03-actions-size-default-44',
      reference: cards.nth(1).locator('button', { hasText: 'Default 44' }),
      product: product('btn-size-default'),
      margin: 6,
    },
    {
      name: '03-actions-size-small-36',
      reference: cards.nth(1).locator('button', { hasText: 'Small 36' }),
      product: product('btn-size-small'),
      margin: 6,
    },
    {
      name: '03-actions-unavailable-submit-feedback',
      reference: cards.nth(3).locator('button', { hasText: 'Submit feedback' }),
      product: product('btn-unavailable'),
      margin: 6,
    },
  );
  expect(items).toHaveLength(21);
  await compareAll({ expect, testInfo, kind: 'specimen', items });
});
