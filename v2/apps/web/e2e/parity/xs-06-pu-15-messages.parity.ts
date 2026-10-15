import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { bootWorld, type SamplePerson } from '../support';
import { type CompareItem, expect, test } from './support';

/**
 * Board 08 "System and message pages" against the built message screens of the test-hook build
 * (WP-0.15): PU-15 in a workspace (an unbuilt address under the Student base), PU-15 public (an
 * unknown root address, signed out), XS-06 (the Student at the Faculty base) at 1440, and XS-06
 * at 375 in the Student's own shell. The family frames draw each message under a simplified strip
 * (canvas), so the message block (`div.xr-msg`) is compared. The other family members — ST-19
 * (twice), Access paused, Access ended, Short success confirmation — are Phase-2/3 screens,
 * compared at component level (apps/specimens `b08-messages.parity.ts`).
 */
const FIXTURE = 'after-flow-d';
const FROZEN = new Date('2026-10-14T09:00:00+05:30');
const RAHUL: SamplePerson = { personId: 'per-0002' };

async function open(
  context: BrowserContext,
  width: number,
  person: SamplePerson | null,
  path: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  await bootWorld(page, { fixture: FIXTURE, session: person });
  await page.goto(path);
  await expect(page.locator('.xr-msg')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  return page;
}

async function run(testInfo: TestInfo, items: CompareItem[], failures: string[]) {
  try {
    await compareAll({ expect, testInfo, kind: 'specimen', items });
  } catch (error) {
    failures.push(String((error as Error).message).split('\n')[0]!);
  }
}

test('board 08 · PU-15 (workspace, public) and XS-06 on the built screens', async ({
  context,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('08-System-Messages.dc.html');
  const family = board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2', { hasText: 'The family' }) })
    .locator('.doc-frame .xr-msg');
  await expect(family).toHaveCount(8);
  const failures: string[] = [];
  // The family frames hold each message at the canvas frame's width (562 px); the product's
  // message reaches its 600 px max-width on a page without a shell, so the message is compared
  // part by part (the full block at the drawn width is compared at component level) and the
  // sentence of the two shell-less pages is registered (DEV-19).
  const message = (frame: Locator, ours: Page, name: string, sentence?: string): CompareItem[] => [
    {
      name: `${name}-icon`,
      reference: frame.locator('.xr-msg-icon'),
      product: ours.locator('.xr-msg .xr-msg-icon'),
    },
    {
      name: `${name}-title`,
      reference: frame.locator('.xr-msg-title'),
      product: ours.locator('.xr-msg .xr-msg-title'),
    },
    {
      name: `${name}-sentence`,
      reference: frame.locator('p'),
      product: ours.locator('.xr-msg > p'),
      deviation: sentence,
    },
    {
      name: `${name}-actions`,
      reference: frame.locator('.xr-msg-actions'),
      product: ours.locator('.xr-msg .xr-msg-actions'),
    },
  ];
  // An unbuilt Student address (My courses is built since Package 2A; Progress is Phase 3).
  const inShell = await open(context, 1440, RAHUL, '/student/progress');
  await run(
    testInfo,
    message(family.nth(0), inShell, '08-f1-page-not-found-workspace-message'),
    failures,
  );
  const publicPage = await open(context, 1440, null, '/no-such-page');
  await run(
    testInfo,
    message(family.nth(1), publicPage, '08-f2-page-not-found-public-message', 'DEV-19'),
    failures,
  );
  const notYours = await open(context, 1440, RAHUL, '/faculty');
  await run(
    testInfo,
    message(family.nth(2), notYours, '08-f3-not-your-workspace-message', 'DEV-19'),
    failures,
  );
  expect(failures).toEqual([]);
});

test('board 08 · "At 375 px": XS-06 in the Student’s shell', async ({
  context,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('08-System-Messages.dc.html', {
    frameMinHeight: 900,
  });
  const frame = board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2', { hasText: 'At 375 px' }) })
    .locator('.doc-frame > .xr-app');
  const ours = await open(context, 375, RAHUL, '/faculty');
  const failures: string[] = [];
  await run(
    testInfo,
    [
      {
        name: '08-f9-at-375-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: '08-f9-at-375-message',
        reference: frame.locator('.xr-msg'),
        product: ours.locator('.xr-msg'),
      },
      {
        name: '08-f9-at-375-whole-frame',
        reference: frame,
        product: ours.locator('div.xr-app'),
        kind: 'screen',
        frame: true,
      },
    ],
    failures,
  );
  expect(failures).toEqual([]);
});
