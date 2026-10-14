import type { Locator, Page } from '@playwright/test';

import { compareAll, pointerAway } from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Board 10 "Dialogs DL-1 · DL-2 · DL-3" against ConfirmDialog, ReasonDialog and EditDialog
 * (WP-0.15). The board draws each dialog frame-absolute over a canvas scrim; the product dialog
 * is a native top-layer `dialog.xr-dialog` (PF-04), so the dialog box is compared part by part —
 * head (title + Close), effect sentence, field, footer — and its size is checked. The footers
 * differ by VD-06 (DEV-08); the static `.is-focus` fields are canvas-only (DEV-03); the busy
 * confirm differs by DEV-01. Not compared: "Try it" (the live demo triggers) and "When a dialog
 * is allowed" (words only).
 */
const STATES = [
  { state: 'dl1-default', field: null, foot: ['DEV-08'] },
  { state: 'dl1-destructive', field: null, foot: ['DEV-08'] },
  { state: 'dl2-validation', field: 'DEV-03', foot: ['DEV-08'] },
  { state: 'dl2-busy', field: undefined, foot: ['DEV-01', 'DEV-08'] },
  { state: 'dl3-default', field: 'DEV-03', foot: ['DEV-08'] },
  { state: 'dl3-validation', field: undefined, foot: ['DEV-08'] },
] as const;

function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

function parts(
  name: string,
  drawn: Locator,
  ours: Locator,
  field: string | null | undefined,
  foot: readonly string[],
): CompareItem[] {
  const items: CompareItem[] = [
    {
      name: `${name}-head`,
      reference: drawn.locator('.xr-dialog-head'),
      product: ours.locator('.xr-dialog-head'),
      insetX: 1,
    },
    {
      name: `${name}-foot`,
      reference: drawn.locator('.xr-dialog-foot'),
      product: ours.locator('.xr-dialog-foot'),
      insetX: 1,
      deviation: [...foot],
    },
  ];
  // The confirming button on its own, so the registered Cancel difference (DEV-08) hides nothing
  // else in the footer.
  items.push({
    name: `${name}-confirm`,
    reference: drawn.locator('.xr-dialog-foot .xr-btn').last(),
    product: ours.locator('.xr-dialog-foot .xr-btn').last(),
    margin: 4,
    deviation: foot.includes('DEV-01') ? 'DEV-01' : undefined,
  });
  if (field !== null) {
    items.splice(1, 0, {
      name: `${name}-field`,
      reference: drawn.locator('.xr-field'),
      product: ours.locator('.xr-field'),
      margin: 4,
      deviation: field,
    });
  }
  return items;
}

test('board 10 · dialog states: head, effect, field, footer, size', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('10-Dialogs.dc.html');
  const frames = section(board, 'States · focus, validation, busy').locator('.doc-frame');
  await expect(frames).toHaveCount(STATES.length);
  const failures: string[] = [];
  for (const [index, { state, field, foot }] of STATES.entries()) {
    await page.goto(`/p-10-${state}`);
    const ours = page.locator('dialog.xr-dialog[open]');
    await expect(ours).toBeVisible();
    const drawn = frames.nth(index).locator('.xr-dialog');
    if (state === 'dl2-busy') {
      // Busy follows a press of the confirm: focus rests on it, without a keyboard ring.
      // aria-disabled while busy: Playwright's actionability would wait for "enabled" forever.
      await ours.locator('.xr-dialog-foot .xr-btn--danger').click({ force: true });
      await pointerAway(page);
    }
    if (state === 'dl3-validation') {
      // The static frame draws the invalid field unfocused (board 10's rule moves focus to it on
      // a failed save — behaviour, checked by the dialog suites); the error look is compared.
      await ours.locator('input').evaluate((element) => (element as HTMLElement).blur());
    }
    // Size. The DL-3 state frames render an empty templated `<p>` body: 0 px tall, but it adds the
    // body's 16 px row gap, which no product dialog without an effect sentence has (the board's own
    // live DL-3 dialog, "Try it", has no such paragraph). That measured gap is taken off.
    const emptyGap = await drawn.evaluate((dialog) => {
      const paragraph = dialog.querySelector('.xr-dialog-body > p');
      return paragraph && paragraph.textContent!.trim() === ''
        ? parseFloat(getComputedStyle(paragraph.parentElement!).rowGap)
        : 0;
    });
    const drawnBox = (await drawn.boundingBox())!;
    const a = { width: drawnBox.width, height: drawnBox.height - emptyGap };
    const b = await ours.boundingBox();
    if (Math.abs(a.width - b!.width) > 0.5 || Math.abs(a.height - b!.height) > 0.5) {
      failures.push(
        `10-${state}: dialog ${a.width}×${a.height} drawn, ${b!.width}×${b!.height} built`,
      );
    }
    const items = parts(`10-${state}`, drawn, ours, field, foot);
    const effect = drawn.locator('.xr-dialog-body > p');
    if ((await effect.count()) > 0 && (await effect.textContent())!.trim() !== '') {
      items.splice(1, 0, {
        name: `10-${state}-effect`,
        reference: effect,
        product: ours.locator('.xr-dialog-body > p'),
        margin: 2,
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

test('board 10 · the dialog at 375 px: bottom sheet, buttons stacked', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('10-Dialogs.dc.html');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/p-10-phone');
  const ours = page.locator('dialog.xr-dialog[open]');
  await expect(ours).toBeVisible();
  const drawn = section(board, 'Keyboard path and phone layout').locator('.doc-frame .xr-dialog');
  // At the bottom of the screen, full width (board 10: "sits at the bottom … at full width"),
  // with the gap the board's frame draws below it (the scrim's 16 px padding).
  const box = (await ours.boundingBox())!;
  const drawnBox = (await drawn.boundingBox())!;
  const app = (await section(board, 'Keyboard path and phone layout')
    .locator('.doc-frame .xr-app')
    .boundingBox())!;
  expect(Math.round(900 - (box.y + box.height))).toBe(
    Math.round(app.y + app.height - (drawnBox.y + drawnBox.height)),
  );
  expect(Math.round(drawnBox.width)).toBe(Math.round(box.width));
  // The static frame draws the reason box unfocused (initial focus is behaviour).
  await ours.locator('textarea').evaluate((element) => (element as HTMLElement).blur());
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: [...parts('10-phone', drawn, ours, undefined, ['DEV-08'])],
  });
});
