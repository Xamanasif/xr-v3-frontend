import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { bootWorld, type SamplePerson } from '../support';
import { type CompareItem, expect, test } from './support';

/**
 * Board 07 "Help & support" (XS-07, GL-03) against the built Help screens of the test-hook build
 * (WP-0.15), each frame at its drawn width × 900 on the connected sample world (after-flow-d),
 * the person signed in through the CI-only boot descriptor and the browser clock frozen by
 * Playwright (the world's anchored clock then stands at the fixture's sample "today").
 *
 * Per frame: the top bar and the sidebar's head, workspace and Help foot are compared strictly,
 * the whole sidebar against DEV-10 (P0-35: the Phase-0 sidebar lists no destination); the page
 * content is compared part by part where the world holds the board's state, at the component
 * tolerance; and the whole frame at the screen tolerance (a frame whose size differs names the
 * register entries that change it). Frames the
 * world cannot show — "1b · Sending" (a pending command), "2 · My reports" (Institute Admin
 * reports) and "3 · Report detail" (Faculty, SUP-0198) — are compared at component level with the
 * board's own data (apps/specimens `b07-help.parity.ts`).
 */
const FIXTURE = 'after-flow-d';
const FROZEN = new Date('2026-10-14T09:00:00+05:30');

const RAHUL: SamplePerson = { personId: 'per-0002' };
const ANIL: SamplePerson = { personId: 'per-anil-shetty' };
const KAVYA: SamplePerson = { personId: 'per-kavya-nair' };

async function open(
  context: BrowserContext,
  width: number,
  person: SamplePerson,
  path: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  await bootWorld(page, { fixture: FIXTURE, session: person });
  await page.goto(path);
  await expect(page.locator('main.xr-page#main')).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/**
 * The parts of the shell every frame shares, and the whole frame. Every whole sidebar and whole
 * frame shows DEV-10 (no destination list, so fewer icons); `registered` names the other register
 * entries that make this frame's sidebar or frame differ.
 */
function shell(
  name: string,
  frame: Locator,
  ours: Page,
  registered: {
    sidebar?: readonly string[];
    frame?: readonly string[];
    /**
     * Package 2A built the Student's Home and My courses: the Student's sidebar and whole frame are
     * measured under new names and DEV-21; their Phase-0 pins (DEV-10, Help only) stay as the
     * record and are no longer observed.
     */
    package2a?: boolean;
  } = {},
): CompareItem[] {
  const shellDeviation = registered.package2a ? 'DEV-21' : 'DEV-10';
  // Phase 3 adds the Student's Progress: the Package-2A names become `-phase-3` (their pins stay
  // as the record).
  const suffix = registered.package2a ? '-phase-3' : '';
  return [
    {
      name: `${name}-top-bar`,
      reference: frame.locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
    {
      name: `${name}-sidebar-head`,
      reference: frame.locator('aside.xr-side .xr-side-head'),
      product: ours.locator('aside.xr-side .xr-side-head'),
    },
    {
      name: `${name}-sidebar-workspace`,
      reference: frame.locator('aside.xr-side .xr-ws'),
      product: ours.locator('aside.xr-side .xr-ws'),
    },
    {
      name: `${name}-sidebar-help`,
      reference: frame.locator('aside.xr-side .xr-side-foot'),
      product: ours.locator('aside.xr-side .xr-side-foot'),
    },
    {
      // The whole sidebar at the strict tolerance: the destination list is absent in Phase 0.
      name: `${name}-sidebar${suffix}`,
      reference: frame.locator('aside.xr-side'),
      product: ours.locator('aside.xr-side'),
      kind: 'specimen',
      deviation: [shellDeviation, ...(registered.sidebar ?? [])],
    },
    {
      name: `${name}-whole-frame${suffix}`,
      reference: frame,
      product: ours.locator('div.xr-app'),
      kind: 'screen',
      frame: true,
      deviation: [shellDeviation, ...(registered.frame ?? [])],
    },
  ];
}

test.describe('board 07 · XS-07 Help & support on the built screens', () => {
  let frames: Locator;
  let failures: string[];

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('07-Help-Support.dc.html', { frameMinHeight: 900 });
    frames = board.locator('.doc-frame > .xr-app');
    await expect(frames).toHaveCount(10);
    failures = [];
  });

  const run = async (testInfo: TestInfo, items: CompareItem[]) => {
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  };

  test('State 1 · Report a problem · Student (1280)', async ({ context }, testInfo) => {
    const ours = await open(context, 1280, RAHUL, '/student/help/report');
    // "Where" is filled from the page the person came from; the drawn value is typed (the page it
    // names, a VR format page, is a Phase-2 screen).
    await ours.getByLabel('Where did it happen?').fill('Shell-and-Tube Heat Exchanger · VR');
    await ours.getByLabel('Where did it happen?').blur();
    const frame = frames.nth(0);
    await run(testInfo, [
      ...shell('07-f0-state-1-report-a-problem', frame, ours, { package2a: true }),
      {
        name: '07-f0-state-1-report-a-problem-page',
        reference: frame.locator('main .xr-content'),
        product: ours.locator('main .xr-content'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('State 1a · Validation (1280)', async ({ context }, testInfo) => {
    const ours = await open(context, 1280, RAHUL, '/student/help/report');
    await ours.getByLabel('Where did it happen?').fill('Shell-and-Tube Heat Exchanger · VR');
    await ours.getByRole('button', { name: 'Send report' }).click();
    await expect(ours.locator('main').getByRole('alert')).toContainText('One thing needs fixing');
    // The frame is static: the summary that takes focus after the press is drawn unfocused.
    await ours.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await ours.mouse.move(0, 0);
    const frame = frames.nth(1);
    await run(testInfo, [
      // The summary's 20 px inline gap (board) vs the stack's 24 px (product): DEV-12.
      ...shell('07-f1-state-1a-validation', frame, ours, {
        sidebar: ['DEV-12'],
        frame: ['DEV-12'],
        package2a: true,
      }),
      {
        name: '07-f1-state-1a-validation-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        name: '07-f1-state-1a-validation-summary',
        reference: frame.locator('main .xr-notice--err'),
        product: ours.locator('main [role="alert"]').last(),
        deviation: 'DEV-12',
      },
      {
        name: '07-f1-state-1a-validation-form',
        reference: frame.locator('main .xr-section'),
        product: ours.locator('main .xr-section'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('State 1c · Sent · reference (1280)', async ({ context }, testInfo) => {
    const ours = await open(context, 1280, RAHUL, '/student/help/report');
    await ours
      .getByLabel('What happened?')
      .fill('The VR simulation stopped loading at the second step.');
    await ours.getByRole('button', { name: 'Send report' }).click();
    await expect(ours.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
    await ours.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await ours.mouse.move(0, 0);
    const frame = frames.nth(3);
    // The world has issued SUP-0213 on its walk, so this report is SUP-0214 on every run (DEV-11);
    // nothing is masked. One glyph is inside the whole message's ratio, so the reference chip is
    // also compared on its own, where the difference shows.
    await expect(ours.locator('main .xr-msg .xr-id')).toHaveText('SUP-0214');
    await run(testInfo, [
      ...shell('07-f3-state-1c-sent', frame, ours, { frame: ['DEV-11'], package2a: true }),
      {
        name: '07-f3-state-1c-sent-message',
        reference: frame.locator('main .xr-msg'),
        product: ours.locator('main .xr-msg'),
      },
      {
        name: '07-f3-state-1c-sent-reference',
        reference: frame.locator('main .xr-msg .xr-id'),
        product: ours.locator('main .xr-msg .xr-id'),
        deviation: 'DEV-11',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('State 2a · My reports · empty · Vendor (1280)', async ({ context }, testInfo) => {
    const ours = await open(context, 1280, ANIL, '/vendor/help');
    await expect(ours.getByRole('heading', { name: 'No reports yet' })).toBeVisible();
    const frame = frames.nth(5);
    await run(testInfo, [
      ...shell('07-f5-state-2a-my-reports-empty-vendor', frame, ours),
      {
        name: '07-f5-state-2a-my-reports-empty-vendor-page',
        reference: frame.locator('main .xr-content'),
        product: ours.locator('main .xr-content'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('State 3a · Report detail · reopened · Content Manager (1280)', async ({
    context,
  }, testInfo) => {
    const ours = await open(context, 1280, KAVYA, '/content-manager/help/reports/SUP-0207');
    await expect(ours.locator('.xr-phead .xr-id')).toHaveText('SUP-0207');
    const frame = frames.nth(7);
    const sections = (where: Locator | Page) => where.locator('main section.xr-section');
    await run(testInfo, [
      // "What you reported" is 10 px taller (DEV-11 title, DEV-13 list): so are the sidebar and frame.
      ...shell('07-f7-state-3a-report-detail-reopened', frame, ours, {
        sidebar: ['DEV-11', 'DEV-13'],
        frame: ['DEV-11', 'DEV-13'],
      }),
      {
        name: '07-f7-state-3a-back-link',
        reference: frame.locator('main a.xr-back'),
        product: ours.locator('main a.xr-back'),
      },
      {
        name: '07-f7-state-3a-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
        deviation: 'DEV-11',
      },
      {
        name: '07-f7-state-3a-reopened-notice',
        reference: frame.locator('main .xr-stack > .xr-notice'),
        product: ours.locator('main .xr-stack > .xr-notice'),
      },
      {
        name: '07-f7-state-3a-what-you-reported',
        reference: sections(frame).nth(0),
        product: sections(ours).nth(0),
        deviation: ['DEV-11', 'DEV-13'],
      },
      {
        name: '07-f7-state-3a-history',
        reference: sections(frame).nth(1),
        product: sections(ours).nth(1),
      },
      {
        name: '07-f7-state-3a-report-another',
        reference: frame.locator('main .xr-stack > p.xr-small'),
        product: ours.locator('main .xr-stack > p.xr-small'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('Phone · 375 · Report a problem (and board 11 "375 · AR-8 form")', async ({
    context,
    openBoardPage,
  }, testInfo) => {
    const ours = await open(context, 375, RAHUL, '/student/help/report');
    await ours.getByLabel('Where did it happen?').fill('Shell-and-Tube Heat Exchanger · VR');
    await ours.getByLabel('Where did it happen?').blur();
    const frame = frames.nth(8);
    await run(testInfo, [
      {
        name: '07-f8-phone-375-report-a-problem-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: '07-f8-phone-375-report-a-problem-page',
        reference: frame.locator('main .xr-content'),
        product: ours.locator('main .xr-content'),
        deviation: 'DEV-14',
      },
    ]);
    const { page: eleven } = await openBoardPage('11-Responsive-Proof.dc.html', {
      viewport: { width: 2720, height: 900 },
    });
    const form = eleven.locator('.doc-frame > .xr-app').nth(7);
    await run(testInfo, [
      {
        name: '11-m-form-375-report-a-problem-page',
        reference: form.locator('main .xr-content'),
        product: ours.locator('main .xr-content'),
        deviation: 'DEV-14',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('Phone · 375 · My reports', async ({ context }, testInfo) => {
    const ours = await open(context, 375, RAHUL, '/student/help');
    const frame = frames.nth(9);
    await run(testInfo, [
      {
        name: '07-f9-phone-375-my-reports-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: '07-f9-phone-375-my-reports-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        name: '07-f9-phone-375-my-reports-list',
        reference: frame.locator('main section.xr-section'),
        product: ours.locator('main section.xr-section'),
        deviation: 'DEV-11',
      },
    ]);
    expect(failures).toEqual([]);
  });
});
