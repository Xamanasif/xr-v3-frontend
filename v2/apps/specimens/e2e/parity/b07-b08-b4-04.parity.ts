import type { Locator, Page } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { type CompareItem, expect, test } from './support';

/**
 * Component-level parity with the boards' own data (WP-0.15): the board 07 states the sample world
 * cannot show on the built screens (Sending; the Institute Admin's three reports; the Faculty
 * member's resolved SUP-0198), board 08's whole message family at the drawn width (562 px) and its
 * "In context" frame, and the ErrorSummary baseline from B4-04 "Step 2 · validation" (VD-22).
 * The built screens themselves are compared in apps/web (xs-07-help, xs-06-pu-15-messages).
 */
async function collect(failures: string[], work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    failures.push(String((error as Error).message).split('\n')[0]!);
  }
}

test('board 07 · Sending, My reports (Institute Admin), Report detail (Faculty)', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('07-Help-Support.dc.html', { frameMinHeight: 900 });
  const frames = board.locator('.doc-frame > .xr-app');
  await expect(frames).toHaveCount(10);
  await page.setViewportSize({ width: 1280, height: 900 });
  const failures: string[] = [];
  const shell = (name: string, frame: Locator, deviation?: string): CompareItem[] => [
    {
      name: `${name}-top-bar`,
      reference: frame.locator('header.xr-top'),
      product: page.locator('header.xr-top'),
    },
    {
      name: `${name}-sidebar`,
      reference: frame.locator('aside.xr-side'),
      product: page.locator('aside.xr-side'),
      deviation,
    },
  ];

  await page.goto('/p-07-sending');
  const sending = frames.nth(2);
  await collect(failures, () =>
    compareAll({
      expect,
      testInfo,
      kind: 'specimen',
      items: [
        ...shell('07-f2-state-1b-sending', sending),
        {
          name: '07-f2-state-1b-sending-back-link',
          reference: sending.locator('main a.xr-back'),
          product: page.locator('main a.xr-back'),
        },
        {
          name: '07-f2-state-1b-sending-header',
          reference: sending.locator('main .xr-phead'),
          product: page.locator('main .xr-phead'),
        },
        ...[0, 1, 2].map((index): CompareItem => ({
          name: `07-f2-state-1b-sending-field-${index + 1}`,
          reference: sending.locator('main .xr-section .xr-field').nth(index),
          product: page.locator('main .xr-section .xr-field').nth(index),
        })),
        {
          // Board 07 is one of the eight Batch-0 aria-busy drawings (DEV-01).
          name: '07-f2-state-1b-sending-actions',
          reference: sending.locator('main .xr-section .xr-btn--primary'),
          product: page.locator('main .xr-section .xr-btn--primary'),
          margin: 2,
          deviation: 'DEV-01',
        },
        {
          name: '07-f2-state-1b-sending-cancel',
          reference: sending.locator('main .xr-section a.xr-btn--text'),
          product: page.locator('main .xr-section .xr-btn--text'),
          margin: 2,
        },
      ],
    }),
  );

  await page.goto('/p-07-institute-admin-reports');
  const reports = frames.nth(4);
  await collect(failures, () =>
    compareAll({
      expect,
      testInfo,
      kind: 'specimen',
      items: [
        ...shell('07-f4-state-2-my-reports-institute-admin', reports, 'DEV-17'),
        {
          name: '07-f4-state-2-my-reports-institute-admin-page',
          reference: reports.locator('main .xr-content'),
          product: page.locator('main .xr-content'),
        },
      ],
    }),
  );

  await page.goto('/p-07-faculty-detail');
  const detail = frames.nth(6);
  await collect(failures, () =>
    compareAll({
      expect,
      testInfo,
      kind: 'specimen',
      items: [
        ...shell('07-f6-state-3-report-detail-faculty', detail, 'DEV-17'),
        {
          name: '07-f6-state-3-back-link',
          reference: detail.locator('main a.xr-back'),
          product: page.locator('main a.xr-back'),
        },
        {
          name: '07-f6-state-3-header',
          reference: detail.locator('main .xr-phead'),
          product: page.locator('main .xr-phead'),
        },
        {
          name: '07-f6-state-3-resolution-note',
          reference: detail.locator('main .xr-stack > .xr-notice'),
          product: page.locator('main .xr-stack > .xr-notice'),
        },
        {
          name: '07-f6-state-3-history',
          reference: detail.locator('main section.xr-section').nth(1),
          product: page.locator('main section.xr-section').nth(1),
        },
        {
          name: '07-f6-state-3-report-another',
          reference: detail.locator('main .xr-stack > p.xr-small'),
          product: page.locator('main .xr-stack > p.xr-small'),
        },
      ],
    }),
  );
  expect(failures).toEqual([]);
});

function section(board: Page, title: string): Locator {
  return board
    .locator('section.doc-sec')
    .filter({ has: board.locator('h2.doc-sec-title', { hasText: title }) });
}

const FAMILY = [
  'pu-15-workspace',
  'pu-15-public',
  'xs-06',
  'st-19-not-given',
  'st-19-no-longer',
  'access-paused',
  'access-ended',
  'success',
];

test('board 08 · the message family at the drawn width, and "In context" at 1312', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('08-System-Messages.dc.html', {
    frameMinHeight: 900,
  });
  const family = section(board, 'The family').locator('.doc-frame .xr-msg');
  await expect(family).toHaveCount(FAMILY.length);
  await page.goto('/p-08-message-family');
  const failures: string[] = [];
  await collect(failures, () =>
    compareAll({
      expect,
      testInfo,
      kind: 'specimen',
      items: FAMILY.flatMap((id, index): CompareItem[] => [
        {
          name: `08-family-${id}`,
          reference: family.nth(index),
          product: page.locator(`[data-parity="msg-${id}"] > .xr-msg`),
          matchWidth: true,
        },
        {
          // The icon circle alone: a pale tint difference vanishes under the 0.1 threshold
          // across the whole message, not on the 48 px circle.
          name: `08-family-${id}-icon`,
          reference: family.nth(index).locator('.xr-msg-icon'),
          product: page.locator(`[data-parity="msg-${id}"] .xr-msg-icon`),
          deviation: id === 'access-paused' ? 'DEV-16' : undefined,
        },
      ]),
    }),
  );
  const context = section(board, 'In context').locator('.doc-frame > .xr-app');
  await page.setViewportSize({ width: 1310, height: 900 });
  await page.goto('/p-08-in-context');
  await collect(failures, () =>
    compareAll({
      expect,
      testInfo,
      kind: 'specimen',
      items: [
        {
          name: '08-in-context-top-bar',
          reference: context.locator('header.xr-top'),
          product: page.locator('header.xr-top'),
        },
        {
          name: '08-in-context-sidebar',
          reference: context.locator('aside.xr-side'),
          product: page.locator('aside.xr-side'),
        },
        {
          name: '08-in-context-message',
          reference: context.locator('.xr-msg'),
          product: page.locator('.xr-msg'),
        },
      ],
    }),
  );
  expect(failures).toEqual([]);
});

test('B4-04 f3 · Step 2 · validation: the linked ErrorSummary (VD-22 baseline)', async ({
  page,
  openBoardPage,
}, testInfo) => {
  const { page: board, facts } = await openBoardPage('B4-04-Assessments-and-Create.dc.html');
  expect(facts.markersInText).toBe(0);
  const frames = board.locator('.b1-frame');
  // frame-index.json lists 12 frames for B4-04.
  await expect(frames).toHaveCount(12);
  await page.goto('/p-b4-04-error-summary');
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: [
      {
        name: 'B4-04-f3-step-2-validation-error-summary',
        reference: frames.nth(3).locator('.xw-errsum'),
        product: page.locator('[data-parity="errsum"] > .xw-errsum'),
        matchWidth: true,
      },
    ],
  });
});
