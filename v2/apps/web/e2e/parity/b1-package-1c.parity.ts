import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll, stableShot } from '../../../../tools/board-capture/src/parity.mjs';
import { actAs, bootWorld, planPayment, type SamplePerson, startReview } from '../support';
import { SUPER_ADMIN } from '../support/workspace';
import { type CompareItem, expect, test } from './support';

/**
 * Phase-1 Package 1C: boards B1-06 (PU-07 Your selection), B1-07 (PU-08 Request institutional
 * access, PU-09 Request sent) and B1-08 (PU-10 Request status, PU-12 Payment, PU-13 Access active)
 * against the built public pages of the test-hook build, each frame at its drawn width × 900, on
 * the spine-start sample world, signed out.
 *
 * The board states are reproduced as a person reaches them: the selection a tab's browser session
 * holds (planted in its session storage, as after adding on PU-06), the request typed and sent
 * through PU-08, and what no requester can do from these pages through the CI-only seams — the
 * Super Admin's decisions (`actAs`), the AD-14 review start (`startReview`) and the TE-4 provider's
 * outcomes (`planPayment`). The page clock is moved so the world records the boards' own times
 * (the world's clock starts at its anchor, 2 Oct 2026, 10:00 IST). Where the world or a board
 * differs, the comparison names its register entry — measured, pinned and reported for the owner's
 * review, never approved here. Not compared (no reachable product state): B1-07 "Submitting" (the
 * sample adapter answers at once; the busy button is unit-tested) and "Failed + retry" (no fault
 * seam in a browser build; jsdom).
 */
const SPINE_START = 'spine-start';
/** The real time each page boots at. */
const FROZEN = new Date('2026-10-14T10:00:00+05:30');
/** The world's anchor (`SPINE_ANCHOR`): its clock reads this at boot. */
const ANCHOR = new Date('2026-10-02T10:00:00+05:30');

/** Moves the page clock so the sample world reads `ist` (`YYYY-MM-DD HH:MM`, India time). */
async function worldTime(page: Page, ist: string): Promise<void> {
  const target = new Date(`${ist.replace(' ', 'T')}:00+05:30`);
  await page.clock.setFixedTime(new Date(FROZEN.getTime() + target.getTime() - ANCHOR.getTime()));
}

interface Chosen {
  readonly experimentId: string;
  readonly formats: readonly string[];
}

const SHELL: Chosen = { experimentId: 'shell-and-tube-heat-exchanger', formats: ['web', 'vr'] };
const DISTILLATION: Chosen = { experimentId: 'distillation-column', formats: ['web'] };
const INDUCTION: Chosen = { experimentId: 'induction-motor-loading', formats: ['vr', 'mr'] };

/** A browser-session selection as the tab stores it (`xr.selection.v1`, ADR-0004 §2). */
function stored(items: readonly Chosen[]): string {
  return JSON.stringify({
    items: items.map((item) => ({ ...item, addedAt: '2026-10-02T04:30:00.000Z' })),
    lastRemoved: null,
    lastRemovedAt: null,
  });
}

async function open(
  context: BrowserContext,
  width: number,
  path: string,
  ready: (page: Page) => Promise<void>,
  options: {
    readonly selection?: readonly Chosen[];
    readonly session?: SamplePerson;
    /** Capture height (default 900); see the B1-06 "Mobile 375" frame. */
    readonly height?: number;
  } = {},
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: options.height ?? 900 });
  await page.clock.setFixedTime(FROZEN);
  if (options.selection) {
    await page.addInitScript(
      (value) => sessionStorage.setItem('xr.selection.v1', value),
      stored(options.selection),
    );
  }
  await bootWorld(page, { fixture: SPINE_START, session: options.session ?? null });
  await page.goto(path);
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/**
 * Nothing focused or hovered, and nothing still rendering: the frames are drawn at rest. A seam's
 * write refreshes the page's reads; the capture waits until every transition has ended and the
 * page has stopped changing (no DOM mutation for 250 ms), so an element is never captured between
 * two renders or halfway through a hover ending.
 */
async function rest(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
  // Each batch starts from the top of the page, as a frame is drawn: no part waits under the
  // sticky header from an earlier capture's scroll.
  await page.evaluate(() => window.scrollTo(0, 0));
  // A transition the pointer's move started (a hover ending) runs to its end first.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null))),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let timer = window.setTimeout(done, 250);
        const observer = new MutationObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(done, 250);
        });
        function done() {
          observer.disconnect();
          resolve();
        }
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }),
  );
}

/**
 * The harness's sub-pixel alignment (parity.mjs `alignToReference`, the README's "Sub-pixel
 * alignment" normalisation), applied with the same rule before the harness runs: the product part
 * is moved by the shortest difference of the two fractional offsets. The harness then finds the
 * offsets equal and moves nothing.
 */
async function alignFirst(reference: Locator, product: Locator): Promise<void> {
  await reference.scrollIntoViewIfNeeded();
  await product.scrollIntoViewIfNeeded();
  const [board, ours] = [await reference.boundingBox(), await product.boundingBox()];
  if (!board || !ours) return;
  const fraction = (value: number) => value - Math.floor(value);
  const shortest = (value: number) => (value > 0.5 ? value - 1 : value < -0.5 ? value + 1 : value);
  const unit = (value: number) => Math.round(value * 64) / 64;
  const dx = unit(shortest(fraction(board.x) - fraction(ours.x)));
  const dy = unit(shortest(fraction(board.y) - fraction(ours.y)));
  if (dx === 0 && dy === 0) return;
  await product.evaluate(
    (element, [x, y]) => {
      const host = (element.closest('[data-parity]') ?? element) as HTMLElement;
      host.style.position = 'relative';
      host.style.left = `${(parseFloat(host.style.left) || 0) + x!}px`;
      host.style.top = `${(parseFloat(host.style.top) || 0) + y!}px`;
    },
    [dx, dy],
  );
}

function collector(testInfo: TestInfo) {
  const failures: string[] = [];
  return {
    failures,
    run: async (items: CompareItem[]) => {
      // Right before each comparison, its product part is aligned as the harness aligns it and
      // captured once, thrown away: after a re-render (or a new `position`), Chromium settles the
      // line boxes of wrapped text (a trailing space at a line break) at the first element
      // capture, so the harness's before/after fingerprint check would otherwise see its own
      // capture change the element. Nothing is compared or kept from this capture.
      const settledItems = items.map((item) => ({
        ...item,
        before: {
          ...item.before,
          product: async () => {
            await item.before?.product?.();
            await alignFirst(item.reference, item.product).catch(() => undefined);
            await stableShot(item.product).catch(() => undefined);
          },
        },
      }));
      try {
        await compareAll({ expect, testInfo, kind: 'specimen', items: settledItems });
      } catch (error) {
        failures.push(String((error as Error).message).split('\n')[0]!);
      }
    },
  };
}

const selectionReady = async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Your selection' })).toBeVisible();
};
const detailsReady = async (page: Page) => {
  await expect(
    page.getByRole('heading', { level: 1, name: 'Request institutional access' }),
  ).toBeVisible();
};

/** B1-07's continuity record, typed into PU-08 (`rf`). */
async function typeRecord(page: Page): Promise<void> {
  await page
    .getByLabel('Institution name', { exact: true })
    .fill('Godavari Institute of Technology');
  await page.getByLabel('Contact person', { exact: true }).fill('Meera Iyer');
  await page.getByLabel('E-mail', { exact: true }).fill('meera.iyer@godavari.edu.in');
  await page.getByLabel('Licences requested', { exact: true }).fill('120');
  await page
    .getByLabel(/^Message to BITS/)
    .fill(
      'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
    );
  await page.locator('label[for="request-term-2"]').click();
}

/** Review → Submit at 2 Oct 2026, 10:14 (B1-08 "Request submitted"); the page then shows PU-09. */
async function submitRecord(page: Page): Promise<void> {
  await typeRecord(page);
  await page.getByRole('button', { name: 'Review request' }).click();
  await page.waitForURL('**/request-access?step=review');
  await worldTime(page, '2026-10-02 10:14');
  await page.getByRole('button', { name: 'Submit request' }).click();
  await page.waitForURL('**/request-access/sent');
}

/** A tab whose visitor has sent REQ-0042 and opened its status (B1-08 f1 "Submitted"). */
async function sentRequest(context: BrowserContext, width: number): Promise<Page> {
  const page = await open(context, width, '/request-access', detailsReady, {
    selection: [SHELL],
  });
  await submitRecord(page);
  await page.getByRole('link', { name: 'Check request status' }).click();
  await page.waitForURL('**/requests/rq-*');
  await expect(page.locator('.xp-statushead')).toContainText('Submitted');
  return page;
}

/** The Super Admin's decision on REQ-0042 (SA-03 through the CI-only `actAs`, same world). */
async function decide(page: Page, method: string, input: Record<string, unknown>): Promise<void> {
  const opened = await actAs<{ value: { request: { rev: number } } }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  const answer = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method,
    input: { id: 'REQ-0042', expectedRev: opened.value.request.rev, ...input },
  });
  expect(answer.ok, method).toBe(true);
}

/** Review started 5 Oct; approved (External) 8 Oct 2026, 11:20 (B1-08 f0). */
async function approved(page: Page): Promise<void> {
  await worldTime(page, '2026-10-05 10:00');
  await startReview(page, 'REQ-0042');
  await worldTime(page, '2026-10-08 11:20');
  await decide(page, 'approveRequest', { route: 'external' });
  await expect(page.locator('.xp-statushead')).toContainText('Approved — payment required');
}

/** PU-12 → Continue to payment at `ist`, the provider answering as planned. */
async function pay(page: Page, ist: string, outcome: 'pending' | 'confirmed'): Promise<void> {
  await page.locator('.xp-statushead').getByRole('link', { name: 'Continue to payment' }).click();
  await page.waitForURL('**/payment');
  await expect(page.getByRole('heading', { level: 1, name: 'Pay for access' })).toBeVisible();
  await worldTime(page, ist);
  await planPayment(page, outcome);
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/payment'));
}

/**
 * A history line's time ("5 Oct 2026" on B1-08, "5 Oct 2026, 10:00" in the product: DEV-32),
 * compared on its own — inside the whole history the difference is under the tolerance.
 */
function whenLine(name: string, what: string, frame: Locator, ours: Page): CompareItem {
  const line = (root: Locator | Page) =>
    root.locator('ol.xr-timeline > li').filter({ hasText: what }).locator('.xr-tl-when');
  return { name, reference: line(frame), product: line(ours), deviation: 'DEV-32' };
}

/** The status line after a date-only event ("Updated 5 Oct 2026" on B1-08: DEV-32). */
function updatedLine(name: string, frame: Locator, ours: Page): CompareItem {
  return {
    name,
    reference: frame.locator('.xp-statushead-ref .xr-meta'),
    product: ours.locator('.xp-statushead-ref .xr-meta'),
    deviation: 'DEV-32',
  };
}

/**
 * The blocks of a PU-10 frame: the status head, asked vs approved, the history. The table is
 * compared whole where its capture holds still: at 1440 and 375, and at 720 once both columns carry
 * the experiment line (f4, f6 – f8). While BITS has decided nothing (f1 – f3 at 720) the first row
 * wraps against "Not decided yet", and Chromium measures the trailing space at that line break
 * differently before and after a capture, so the harness's capture-stability check cannot hold
 * the whole table: f1 and f2 compare its heading and its two other rows (pixel-exact), and f3 —
 * the same table as f2, under a taller status head that puts the rows' borders between pixel rows
 * — compares no table part.
 */
type TableParts = 'whole' | 'rows' | 'none';

function statusParts(
  name: string,
  frame: Locator,
  ours: Page,
  parts: TableParts = 'whole',
): CompareItem[] {
  const table = (root: Locator | Page) => root.locator('.xr-stack > section.xr-section').nth(0);
  const compare: CompareItem[] =
    parts === 'whole'
      ? [{ name: `${name}-compare`, reference: table(frame), product: table(ours) }]
      : parts === 'rows'
        ? [
            {
              name: `${name}-compare-head`,
              reference: table(frame).locator('.xr-section-head'),
              product: table(ours).locator('.xr-section-head'),
            },
            ...[1, 2].map((row) => ({
              name: `${name}-compare-row-${row + 1}`,
              reference: table(frame).locator('table.xp-compare tbody tr').nth(row),
              product: table(ours).locator('table.xp-compare tbody tr').nth(row),
            })),
          ]
        : [];
  return [
    {
      name: `${name}-statushead`,
      reference: frame.locator('.xp-statushead'),
      product: ours.locator('.xp-statushead'),
    },
    ...compare,
    {
      name: `${name}-history`,
      reference: frame.locator('.xr-stack > section.xr-section').nth(1),
      product: ours.locator('.xr-stack > section.xr-section').nth(1),
    },
  ];
}

test.describe('B1-06 · PU-07 Your selection on the built page', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-06-Selection.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(6);
  });

  test('f0 · Your selection · 1440 · f1 · several experiments (1440)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/selection', selectionReady, { selection: [SHELL] });
    await expect(ours.locator('.xp-srow')).toHaveCount(1);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-06-f0-header',
        reference: frame.locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
      },
      {
        name: 'b1-06-f0-stepper',
        reference: frame.locator('.xp-flow'),
        product: ours.locator('.xp-flow'),
      },
      {
        name: 'b1-06-f0-page-head',
        reference: frame.locator('.xp-phead-main'),
        product: ours.locator('.xp-phead-main'),
      },
      {
        name: 'b1-06-f0-row',
        reference: frame.locator('li.xp-srow'),
        product: ours.locator('li.xp-srow'),
      },
      {
        name: 'b1-06-f0-summary',
        reference: frame.locator('aside.xp-sumcard'),
        product: ours.locator('aside.xp-sumcard'),
      },
      {
        name: 'b1-06-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
      },
    ]);
    const several = await open(context, 1440, '/selection', selectionReady, {
      selection: [SHELL, DISTILLATION, INDUCTION],
    });
    await expect(several.locator('.xp-srow')).toHaveCount(3);
    await rest(several);
    await run([
      {
        name: 'b1-06-f1-rows',
        reference: frames.nth(1).locator('.xp-split > ul'),
        product: several.locator('.xp-split > ul'),
      },
      {
        name: 'b1-06-f1-summary',
        reference: frames.nth(1).locator('aside.xp-sumcard'),
        product: several.locator('aside.xp-sumcard'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f2 · last format locked · f3 · empty (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const locked = await open(context, 720, '/selection', selectionReady, {
      selection: [DISTILLATION],
    });
    await expect(locked.locator('.xp-srow')).toHaveCount(1);
    await rest(locked);
    await run([
      {
        name: 'b1-06-f2-locked-row',
        reference: frames.nth(2).locator('li.xp-srow'),
        product: locked.locator('li.xp-srow'),
      },
      {
        name: 'b1-06-f2-bottom-bar',
        reference: frames.nth(2).locator('.xp-bottombar'),
        product: locked.locator('.xp-bottombar'),
      },
    ]);
    const empty = await open(context, 720, '/selection', selectionReady);
    await rest(empty);
    await run([
      {
        name: 'b1-06-f3-empty',
        reference: frames.nth(3).locator('.xp-in > .xr-section'),
        product: empty.locator('.xp-in > .xr-section'),
      },
      {
        name: 'b1-06-f3-whole-frame',
        reference: frames.nth(3).locator('.xp'),
        product: empty.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: 'DEV-24',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f4 · mobile 375 · f5 · mobile 375 · empty', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    // The board frame is drawn whole; the product page gets a viewport that holds all of it, so
    // the sticky bottom bar sits at its own place after the footer instead of over the rows.
    const ours = await open(context, 375, '/selection', selectionReady, {
      selection: [SHELL, DISTILLATION],
      height: 1800,
    });
    await expect(ours.locator('.xp-srow')).toHaveCount(2);
    await rest(ours);
    await run([
      {
        name: 'b1-06-f4-mobile-header',
        reference: frames.nth(4).locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
        deviation: 'DEV-31',
      },
      {
        name: 'b1-06-f4-mobile-rows',
        reference: frames.nth(4).locator('.xp-split > ul'),
        product: ours.locator('.xp-split > ul'),
      },
      {
        name: 'b1-06-f4-mobile-bottom-bar',
        reference: frames.nth(4).locator('.xp-bottombar'),
        product: ours.locator('.xp-bottombar'),
        deviation: 'DEV-31',
      },
    ]);
    const empty = await open(context, 375, '/selection', selectionReady);
    await rest(empty);
    await run([
      {
        name: 'b1-06-f5-mobile-empty',
        reference: frames.nth(5).locator('.xp-in > .xr-section'),
        product: empty.locator('.xp-in > .xr-section'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-07 · PU-08 Request institutional access and PU-09 Request sent', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-07-Request-Access.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(9);
  });

  test('f0 · Request institutional access · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/request-access', detailsReady, {
      selection: [SHELL],
    });
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-07-f0-back-link',
        reference: frame.locator('.xp-in > a.xr-back'),
        product: ours.locator('.xp-in > a.xr-back'),
        deviation: 'DEV-23',
      },
      {
        name: 'b1-07-f0-stepper',
        reference: frame.locator('.xp-flow'),
        product: ours.locator('.xp-flow'),
      },
      {
        name: 'b1-07-f0-page-head',
        reference: frame.locator('.xp-phead-main'),
        product: ours.locator('.xp-phead-main'),
      },
      {
        name: 'b1-07-f0-part-1',
        reference: frame.locator('section.xp-fsec').nth(0),
        product: ours.locator('section.xp-fsec').nth(0),
      },
      {
        name: 'b1-07-f0-part-2',
        reference: frame.locator('section.xp-fsec').nth(1),
        product: ours.locator('section.xp-fsec').nth(1),
      },
      {
        name: 'b1-07-f0-part-3',
        reference: frame.locator('section.xp-fsec').nth(2),
        product: ours.locator('section.xp-fsec').nth(2),
      },
      {
        name: 'b1-07-f0-form-foot',
        reference: frame.locator('.xp-formfoot'),
        product: ours.locator('.xp-formfoot'),
      },
      {
        // The pixels match; the back link's icon path is board 02's (DEV-23).
        name: 'b1-07-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: 'DEV-23',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · validation · f4 · filled · f5 · review · f8 · request sent (720)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 720, '/request-access', detailsReady, {
      selection: [SHELL],
    });
    // f3 (`rv`): contact typed, a malformed e-mail and licence count, no institution or term.
    await ours.getByLabel('Contact person', { exact: true }).fill('Meera Iyer');
    await ours.getByLabel('E-mail', { exact: true }).fill('meera.iyer@godavari');
    await ours.getByLabel('Licences requested', { exact: true }).fill('120 licences');
    await ours.getByRole('button', { name: 'Review request' }).click();
    await expect(ours.locator('.xw-errsum')).toContainText(
      'There are 4 problems with this request',
    );
    await rest(ours);
    await run([
      {
        name: 'b1-07-f3-summary',
        reference: frames.nth(3).locator('#Rrv-errsum'),
        product: ours.locator('.xw-errsum'),
        deviation: 'DEV-12',
      },
      {
        name: 'b1-07-f3-part-1',
        reference: frames.nth(3).locator('section.xp-fsec').nth(0),
        product: ours.locator('section.xp-fsec').nth(0),
      },
      {
        name: 'b1-07-f3-part-2',
        reference: frames.nth(3).locator('section.xp-fsec').nth(1),
        product: ours.locator('section.xp-fsec').nth(1),
      },
      {
        name: 'b1-07-f3-part-3',
        reference: frames.nth(3).locator('section.xp-fsec').nth(2),
        product: ours.locator('section.xp-fsec').nth(2),
      },
    ]);
    // f4 (`rf`): the continuity record.
    const filled = await open(context, 720, '/request-access', detailsReady, {
      selection: [SHELL],
    });
    await typeRecord(filled);
    await rest(filled);
    await run([
      {
        name: 'b1-07-f4-part-1',
        reference: frames.nth(4).locator('section.xp-fsec').nth(0),
        product: filled.locator('section.xp-fsec').nth(0),
      },
      {
        name: 'b1-07-f4-part-2',
        reference: frames.nth(4).locator('section.xp-fsec').nth(1),
        product: filled.locator('section.xp-fsec').nth(1),
      },
      {
        name: 'b1-07-f4-part-3',
        reference: frames.nth(4).locator('section.xp-fsec').nth(2),
        product: filled.locator('section.xp-fsec').nth(2),
      },
    ]);
    // f5 (`rr`): Check your request.
    await filled.getByRole('button', { name: 'Review request' }).click();
    await filled.waitForURL('**/request-access?step=review');
    await expect(
      filled.getByRole('heading', { level: 1, name: 'Check your request' }),
    ).toBeVisible();
    await rest(filled);
    await run([
      {
        name: 'b1-07-f5-review-stepper',
        reference: frames.nth(5).locator('.xp-flow'),
        product: filled.locator('.xp-flow'),
      },
      {
        name: 'b1-07-f5-review-head',
        reference: frames.nth(5).locator('.xp-phead-main'),
        product: filled.locator('.xp-phead-main'),
      },
      {
        name: 'b1-07-f5-review-answers',
        reference: frames.nth(5).locator('section.xp-fsec'),
        product: filled.locator('section.xp-fsec'),
      },
      {
        name: 'b1-07-f5-review-note',
        reference: frames.nth(5).locator('.xr-notice--quiet'),
        product: filled.locator('.xr-notice--quiet'),
      },
      {
        name: 'b1-07-f5-review-foot',
        reference: frames.nth(5).locator('.xp-formfoot'),
        product: filled.locator('.xp-formfoot'),
      },
    ]);
    // f8 (`rt`): Request sent, REQ-0042.
    await filled.getByRole('button', { name: 'Submit request' }).click();
    await filled.waitForURL('**/request-access/sent');
    await expect(filled.getByRole('heading', { level: 1, name: 'Request sent' })).toBeVisible();
    await rest(filled);
    await run([
      {
        name: 'b1-07-f8-sent-stepper',
        reference: frames.nth(8).locator('.xp-flow'),
        product: filled.locator('.xp-flow'),
      },
      {
        name: 'b1-07-f8-sent-message',
        reference: frames.nth(8).locator('.xr-msg'),
        product: filled.locator('.xr-msg'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · mobile 375 · details · f2 · mobile 375 · sent', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, '/request-access', detailsReady, {
      selection: [SHELL],
    });
    // f1 (`rm`): the institution and the contact person typed.
    await ours
      .getByLabel('Institution name', { exact: true })
      .fill('Godavari Institute of Technology');
    await ours.getByLabel('Contact person', { exact: true }).fill('Meera Iyer');
    await rest(ours);
    await run([
      {
        name: 'b1-07-f1-mobile-header',
        reference: frames.nth(1).locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
        deviation: 'DEV-31',
      },
      {
        name: 'b1-07-f1-mobile-part-1',
        reference: frames.nth(1).locator('section.xp-fsec').nth(0),
        product: ours.locator('section.xp-fsec').nth(0),
      },
      {
        name: 'b1-07-f1-mobile-form-foot',
        reference: frames.nth(1).locator('.xp-formfoot'),
        product: ours.locator('.xp-formfoot'),
      },
    ]);
    const sent = await open(context, 375, '/request-access', detailsReady, {
      selection: [SHELL],
    });
    await submitRecord(sent);
    await rest(sent);
    await run([
      {
        name: 'b1-07-f2-mobile-header',
        reference: frames.nth(2).locator('header.xp-head'),
        product: sent.locator('header.xp-head'),
        deviation: 'DEV-31',
      },
      {
        name: 'b1-07-f2-mobile-sent-message',
        reference: frames.nth(2).locator('.xr-msg'),
        product: sent.locator('.xr-msg'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-08 · PU-10 Request status, PU-12 Payment and PU-13 Access active', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-08-Request-Status.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(11);
  });

  test('f0 · approved, payment required · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 1440);
    await approved(ours);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-08-f0-header',
        reference: frame.locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
      },
      {
        name: 'b1-08-f0-reference',
        reference: frame.locator('.xp-in--read > div').first(),
        product: ours.locator('.xp-in--read > div').first(),
      },
      ...statusParts('b1-08-f0', frame, ours),
      whenLine('b1-08-f0-review-start-when', 'BITS started reviewing', frame, ours),
      {
        name: 'b1-08-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · submitted · f2 · under review · f3 · information requested (720)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 720);
    await rest(ours);
    await run(statusParts('b1-08-f1', frames.nth(1), ours, 'rows'));
    await worldTime(ours, '2026-10-05 10:00');
    await startReview(ours, 'REQ-0042');
    await expect(ours.locator('.xp-statushead')).toContainText('Under review');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f2', frames.nth(2), ours, 'rows'),
      updatedLine('b1-08-f2-updated', frames.nth(2), ours),
      whenLine('b1-08-f2-review-start-when', 'BITS started reviewing', frames.nth(2), ours),
    ]);
    await worldTime(ours, '2026-10-06 10:00');
    await decide(ours, 'requestMoreInformation', {
      reason: 'Please confirm how many students will use VR in the first term.',
    });
    await expect(ours.locator('.xp-statushead')).toContainText('Information requested');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f3', frames.nth(3), ours, 'none'),
      updatedLine('b1-08-f3-updated', frames.nth(3), ours),
      whenLine(
        'b1-08-f3-information-requested-when',
        'BITS asked for more information',
        frames.nth(3),
        ours,
      ),
    ]);
    expect(failures).toEqual([]);
  });

  test('f4 · approved with changes (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 720);
    await worldTime(ours, '2026-10-05 10:00');
    await startReview(ours, 'REQ-0042');
    await worldTime(ours, '2026-10-08 11:20');
    await decide(ours, 'approveSmallerScope', {
      route: 'external',
      items: [{ experimentId: 'shell-and-tube-heat-exchanger', formats: ['web', 'vr'] }],
      licences: '100',
      term: 'yearly',
      reason:
        'Approved for 100 licences for the first term. You can ask for more once enrolment is confirmed.',
    });
    await expect(ours.locator('.xp-statushead')).toContainText('Approved with changes');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f4', frames.nth(4), ours),
      whenLine('b1-08-f4-review-start-when', 'BITS started reviewing', frames.nth(4), ours),
    ]);
    expect(failures).toEqual([]);
  });

  test('f5 · PU-12 payment · f6 · not confirmed · f7 · failed (720)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 720);
    await approved(ours);
    await ours.locator('.xp-statushead').getByRole('link', { name: 'Continue to payment' }).click();
    await ours.waitForURL('**/payment');
    await expect(ours.getByRole('heading', { level: 1, name: 'Pay for access' })).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-08-f5-payment-back-link',
        reference: frames.nth(5).locator('.xp-in > a.xr-back'),
        product: ours.locator('.xp-in > a.xr-back'),
        deviation: 'DEV-23',
      },
      {
        name: 'b1-08-f5-payment-head',
        reference: frames.nth(5).locator('.xp-phead-main'),
        product: ours.locator('.xp-phead-main'),
      },
      {
        name: 'b1-08-f5-payment-summary',
        reference: frames.nth(5).locator('.xp-pay'),
        product: ours.locator('.xp-pay'),
      },
    ]);
    await ours.goBack();
    await ours.waitForURL((url) => !url.pathname.endsWith('/payment'));
    await pay(ours, '2026-10-08 14:52', 'pending');
    await expect(ours.locator('.xp-statushead')).toContainText('Payment not confirmed yet');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f6', frames.nth(6), ours),
      whenLine('b1-08-f6-review-start-when', 'BITS started reviewing', frames.nth(6), ours),
    ]);
    await worldTime(ours, '2026-10-08 14:58');
    const { reportPayment } = await import('../support');
    expect((await reportPayment(ours, 'REQ-0042', 'failed')).ok).toBe(true);
    await expect(ours.locator('.xp-statushead')).toContainText('Payment failed');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f7', frames.nth(7), ours),
      whenLine('b1-08-f7-review-start-when', 'BITS started reviewing', frames.nth(7), ours),
    ]);
    expect(failures).toEqual([]);
  });

  test('f8 · access active (PU-13) (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 720);
    await approved(ours);
    await pay(ours, '2026-10-08 15:05', 'confirmed');
    await expect(ours.locator('.xp-statushead')).toContainText('Access active');
    await rest(ours);
    await run([
      ...statusParts('b1-08-f8', frames.nth(8), ours),
      whenLine('b1-08-f8-review-start-when', 'BITS started reviewing', frames.nth(8), ours),
    ]);
    expect(failures).toEqual([]);
  });

  test('f9 · internal route, REQ-0039, as its Institute Admin (720)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const srinivas: SamplePerson = { personId: 'per-p-srinivas' };
    const page = await open(context, 720, '/institute/help', async () => undefined, {
      session: srinivas,
    });
    const opened = await actAs<{ value: { request: { routeId: string } } }>(page, SUPER_ADMIN, {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: 'REQ-0039',
    });
    await page.evaluate((href) => {
      (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
        href,
      );
    }, `/requests/${opened.value.request.routeId}`);
    await expect(page.locator('.xp-statushead')).toContainText('Access active');
    await page.evaluate(() => document.fonts.ready);
    await rest(page);
    // The asked-vs-approved table holds only the sample's two experiments (DEV-33) and is compared
    // in every other frame; its two wrapped lines do not give one fingerprint from run to run, so a
    // pin could not hold it. The status head and the history are compared.
    const [head, , history] = statusParts('b1-08-f9', frames.nth(9), page);
    await run([head!, { ...history!, deviation: 'DEV-33' }]);
    expect(failures).toEqual([]);
  });

  test('f10 · mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await sentRequest(context, 375);
    await approved(ours);
    await rest(ours);
    await run([
      {
        name: 'b1-08-f10-mobile-header',
        reference: frames.nth(10).locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
        deviation: 'DEV-31',
      },
      ...statusParts('b1-08-f10-mobile', frames.nth(10), ours),
      whenLine(
        'b1-08-f10-mobile-review-start-when',
        'BITS started reviewing',
        frames.nth(10),
        ours,
      ),
    ]);
    expect(failures).toEqual([]);
  });
});
