import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll, stableShot } from '../../../../tools/board-capture/src/parity.mjs';
import { actAs, bootWorld, type SamplePerson } from '../support';
import { SUPER_ADMIN } from '../support/workspace';
import { type CompareItem, expect, test } from './support';

/**
 * Phase-1 Package 1D: boards B7-01 (SA-01 Overview, its Phase-1 Requests group), B7-02 (SA-06
 * Institutions), B7-03 (SA-07 Institution detail) and B7-04 f0 (SA-07, the Super Admin's frame of
 * the pause effects) against the built screens of the test-hook build, each frame at its drawn
 * width × 900, as the Super Admin. The world is the walk after Flow C (opening 27 Oct 2026): its
 * seven institutions stand as the B7 boards draw them on 23 Oct 2026 (statuses, plans, Institute
 * Admins, Godavari's twelve students); the calm Overview is reached on the spine-start world with
 * the two requests under review answered through the CI-only `actAs`.
 *
 * Where a part holds the board's words it is compared at the component tolerance; where it
 * differs the comparison names its register entry — the Phase-1 scope of SA-01 (DEV-34, DEV-35),
 * the decision ids taken out of the copy (P1-14, DEV-36), the list's order (DEV-37), the Phase-1
 * attention rows (DEV-38), the canvas sample labels (DEV-39), the history as the record keeps it
 * (DEV-40), the sample world's background institutions (DEV-41), the canvas runtime's wrapper
 * round bound words in a button (DEV-42) and the unbuilt sidebar destinations (DEV-21) —
 * measured, pinned and reported for the owner's review, never approved here. Not compared: B7-01 f2 and B7-02 f5 "Loading" (the sample adapter answers at once and the
 * browser build has no delay seam; unit-tested in jsdom), B7-02 f1 (the same Godavari detail as
 * B7-03 f0) and B7-04 f1 … f3 (other roles' pages of Phases 2 and 4, reference frames).
 */
const AFTER_FLOW_C = 'after-flow-c';
const SPINE_START = 'spine-start';
const FROZEN = new Date('2026-10-27T10:00:00+05:30');

async function open(
  context: BrowserContext,
  width: number,
  path: string,
  ready: (page: Page) => Promise<void>,
  options: { readonly fixture?: string; readonly person?: SamplePerson } = {},
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  await bootWorld(page, {
    fixture: options.fixture ?? AFTER_FLOW_C,
    session: options.person ?? SUPER_ADMIN,
  });
  await page.goto(path);
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Nothing focused or hovered, nothing still rendering (as the Package-1C spec settles its pages). */
async function rest(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
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

/** The harness's own sub-pixel alignment, applied first (as in the Package-1C spec). */
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
      // Each product part is aligned as the harness aligns it and captured once, thrown away, so
      // Chromium settles wrapped text before the harness's own captures (Package-1C pattern).
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

const heading = (name: string) => async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
};
const institutionsReady = async (page: Page) => {
  await expect(page.locator('main tbody tr').first()).toBeVisible();
};

/**
 * The `tr` of an institution, by its name. On the board the bound name sits in the canvas
 * runtime's wrapper inside the `strong`, so the name is matched as the whole text of the cell's
 * `strong` (an inner locator, resolved inside each row of the same page).
 */
const rowOf = (root: Locator | Page, name: string) => {
  const page = 'page' in root ? root.page() : root;
  const exact = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  return root
    .locator('tbody tr')
    .filter({ has: page.locator('td.is-primary strong', { hasText: exact }) });
};

/** A titled section of a page, by its heading. */
const sectionOf = (root: Locator | Page, title: string) =>
  root.locator(
    `section.xr-section:has(> .xr-section-head > h2.xr-h2:text-is(${JSON.stringify(title)}))`,
  );

/**
 * The shell parts every Super Admin frame shares (sidebar destinations: DEV-21). The sidebar is
 * as tall as the page, so `height` names the entries that make the page shorter or taller.
 */
function shellParts(
  prefix: string,
  frame: Locator,
  ours: Page,
  height: readonly string[] = [],
): CompareItem[] {
  return [
    {
      name: `${prefix}-top-bar`,
      reference: frame.locator('header.xr-top'),
      product: ours.locator('header.xr-top'),
    },
    {
      name: `${prefix}-sidebar`,
      reference: frame.locator('aside.xr-side'),
      product: ours.locator('aside.xr-side'),
      deviation: height.length > 0 ? ['DEV-21', ...height] : 'DEV-21',
    },
  ];
}

// ---- B7-01 · SA-01 Overview, its Phase-1 Requests group -----------------------------------------

test.describe('B7-01 · SA-01 Overview (Phase-1 Requests group)', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B7-01-SA-Overview.dc.html', {
      frameMinHeight: 900,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(4);
  });

  test('f0 · Overview · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/admin', heading('Overview'));
    await expect(ours.locator('section.xd-group .xr-row')).toHaveCount(3);
    await rest(ours);
    const frame = frames.nth(0);
    const group = (root: Locator | Page) => root.locator('section.xd-group').first();
    const row = (root: Locator | Page, reference: string) =>
      group(root).locator('li.xr-row', { hasText: reference });
    await run([
      ...shellParts('b7-01-f0', frame, ours, ['DEV-34']),
      {
        // Phase 6: the "15 items waiting across 8 groups · 23 Oct 2026" line.
        name: 'b7-01-f0-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
        deviation: 'DEV-34',
      },
      {
        name: 'b7-01-f0-requests-head',
        reference: group(frame).locator('.xr-section-head'),
        product: group(ours).locator('.xr-section-head'),
      },
      {
        name: 'b7-01-f0-req-0040-row',
        reference: row(frame, 'REQ-0040'),
        product: row(ours, 'REQ-0040'),
      },
      {
        name: 'b7-01-f0-req-0058-row',
        reference: row(frame, 'REQ-0058'),
        product: row(ours, 'REQ-0058'),
        deviation: 'DEV-35',
      },
      {
        // The line's words (DEV-35) and the day the world received REQ-0038 (DEV-22).
        name: 'b7-01-f0-req-0038-row',
        reference: row(frame, 'REQ-0038'),
        product: row(ours, 'REQ-0038'),
        deviation: ['DEV-22', 'DEV-35'],
      },
      {
        name: 'b7-01-f0-requests-group',
        reference: group(frame),
        product: group(ours),
        deviation: ['DEV-22', 'DEV-35'],
      },
      {
        name: 'b7-01-f0-whole-frame',
        reference: frame.locator('.xr-app'),
        product: ours.locator('div.xr-app'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-21', 'DEV-22', 'DEV-34', 'DEV-35'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · Nothing is waiting (1024)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1024, '/admin', heading('Overview'), {
      fixture: SPINE_START,
    });
    for (const reference of ['REQ-0040', 'REQ-0038']) {
      const opened = await actAs<{ value: { request: { rev: number } } }>(ours, SUPER_ADMIN, {
        port: 'accessRequests',
        method: 'getRequestForDecision',
        input: reference,
      });
      const asked = await actAs<{ ok: boolean }>(ours, SUPER_ADMIN, {
        port: 'accessRequests',
        method: 'requestMoreInformation',
        input: {
          id: reference,
          reason: 'Please confirm the student numbers.',
          expectedRev: opened.value.request.rev,
        },
      });
      expect(asked.ok).toBe(true);
    }
    await expect(ours.getByRole('heading', { name: 'Nothing is waiting' })).toBeVisible();
    await rest(ours);
    const frame = frames.nth(1);
    const calm = (root: Locator | Page) => sectionOf(root, 'Waiting on you');
    await run([
      {
        name: 'b7-01-f1-calm-head',
        reference: calm(frame).locator('.xr-section-head'),
        product: calm(ours).locator('.xr-section-head'),
      },
      {
        name: 'b7-01-f1-calm-icon',
        reference: calm(frame).locator('.xr-empty-icon'),
        product: calm(ours).locator('.xr-empty-icon'),
      },
      {
        name: 'b7-01-f1-calm-title',
        reference: calm(frame).locator('.xr-empty h3'),
        product: calm(ours).locator('.xr-empty h3'),
      },
      {
        // Phase 1: "Requests appear here when they need you." (state-copy SA-01.calm).
        name: 'b7-01-f1-calm',
        reference: calm(frame),
        product: calm(ours),
        deviation: 'DEV-35',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · Mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, '/admin', heading('Overview'));
    await expect(ours.locator('section.xd-group .xr-row')).toHaveCount(3);
    await rest(ours);
    const frame = frames.nth(3);
    const group = (root: Locator | Page) => root.locator('section.xd-group').first();
    await run([
      {
        name: 'b7-01-f3-mobile-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: 'b7-01-f3-mobile-requests-head',
        reference: group(frame).locator('.xr-section-head'),
        product: group(ours).locator('.xr-section-head'),
      },
      {
        name: 'b7-01-f3-mobile-req-0040-row',
        reference: group(frame).locator('li.xr-row', { hasText: 'REQ-0040' }),
        product: group(ours).locator('li.xr-row', { hasText: 'REQ-0040' }),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

// ---- B7-02 · SA-06 Institutions ------------------------------------------------------------------

const INSTITUTIONS = [
  'Godavari Institute of Technology',
  'BITS Pilani — Hyderabad Campus',
  'Konark Polytechnic',
  'Sahyadri Institute of Engineering',
  'Vizag Polytechnic',
  'Deccan Institute of Technology',
  'Malnad College of Engineering',
] as const;

/** The board's last row and the product's (newest first, DEV-37). */
const LAST_ROW_SWAPPED: ReadonlySet<string> = new Set([
  'Deccan Institute of Technology',
  'Malnad College of Engineering',
]);

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

test.describe('B7-02 · SA-06 Institutions', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B7-02-Institutions.dc.html', {
      frameMinHeight: 900,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(7);
  });

  test('f0 · Institutions · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/admin/institutions', institutionsReady);
    await rest(ours);
    const frame = frames.nth(0);
    const section = (root: Locator | Page) => root.locator('main section.xr-section').first();
    await run([
      ...shellParts('b7-02-f0', frame, ours),
      {
        name: 'b7-02-f0-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        // P1-14: the line without "(T-09)" (under the tolerance of the whole header, so the line
        // is compared on its own, as DEV-32 is in Package 1C).
        name: 'b7-02-f0-header-line',
        reference: frame.locator('main .xr-phead .xr-phead-meta'),
        product: ours.locator('main .xr-phead .xr-phead-meta'),
        deviation: 'DEV-36',
      },
      {
        name: 'b7-02-f0-section-head',
        reference: section(frame).locator('.xr-section-head'),
        product: section(ours).locator('.xr-section-head'),
      },
      {
        name: 'b7-02-f0-tabs',
        reference: frame.locator('main [role="tablist"]'),
        product: ours.locator('main [role="tablist"]'),
      },
      {
        name: 'b7-02-f0-toolbar',
        reference: frame.locator('main .xr-toolbar'),
        product: ours.locator('main .xr-toolbar'),
      },
      {
        name: 'b7-02-f0-count',
        reference: frame.locator('main .xr-toolbar-status'),
        product: ours.locator('main .xr-toolbar-status'),
      },
      {
        name: 'b7-02-f0-table-head',
        reference: frame.locator('main table.xr-table thead'),
        product: ours.locator('main table.xr-table thead'),
      },
      // Each institution's row: the same facts on the board and in the world. The table's last
      // row has no bottom rule: Malnad on the board, Deccan in the product (the order, DEV-37).
      ...INSTITUTIONS.map((name) => ({
        name: `b7-02-f0-row-${slug(name)}`,
        reference: rowOf(frame, name),
        product: rowOf(ours, name),
        ...(LAST_ROW_SWAPPED.has(name) ? { deviation: 'DEV-37' } : {}),
      })),
      {
        name: 'b7-02-f0-table',
        reference: frame.locator('main .xr-table-wrap'),
        product: ours.locator('main .xr-table-wrap'),
        deviation: 'DEV-37',
      },
      {
        name: 'b7-02-f0-whole-frame',
        reference: frame.locator('.xr-app'),
        product: ours.locator('div.xr-app'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-21', 'DEV-36', 'DEV-37'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f2 · Tab No Institute Admin · f3 · Tab Paused · f4 · No match (720)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const noAdmin = await open(context, 720, '/admin/institutions', institutionsReady);
    await noAdmin.getByRole('tab', { name: 'No Institute Admin 1' }).click();
    await expect(noAdmin.locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '1 of 7 institutions',
    );
    await rest(noAdmin);
    // The click scrolled the strip to its last tab; B7-02 f2 is a still frame of the strip at its
    // start (the selected tab beyond its right edge), so the strip goes back there.
    await noAdmin.locator('main [role="tablist"]').evaluate((strip) => {
      strip.scrollLeft = 0;
    });
    await run([
      {
        name: 'b7-02-f2-tabs',
        reference: frames.nth(2).locator('main [role="tablist"]'),
        product: noAdmin.locator('main [role="tablist"]'),
      },
      {
        name: 'b7-02-f2-count',
        reference: frames.nth(2).locator('main .xr-toolbar-status'),
        product: noAdmin.locator('main .xr-toolbar-status'),
      },
      {
        name: 'b7-02-f2-table',
        reference: frames.nth(2).locator('main .xr-table-wrap'),
        product: noAdmin.locator('main .xr-table-wrap'),
      },
    ]);
    const paused = await open(context, 720, '/admin/institutions', institutionsReady);
    await paused.getByRole('tab', { name: 'Paused 1' }).click();
    await expect(paused.locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '1 of 7 institutions',
    );
    await rest(paused);
    await run([
      {
        name: 'b7-02-f3-count',
        reference: frames.nth(3).locator('main .xr-toolbar-status'),
        product: paused.locator('main .xr-toolbar-status'),
      },
      {
        name: 'b7-02-f3-table',
        reference: frames.nth(3).locator('main .xr-table-wrap'),
        product: paused.locator('main .xr-table-wrap'),
      },
    ]);
    const none = await open(context, 720, '/admin/institutions', institutionsReady);
    await none.getByRole('searchbox', { name: 'Search institutions' }).fill('Narmada');
    await expect(none.getByRole('heading', { name: 'No institutions match' })).toBeVisible();
    await rest(none);
    await run([
      {
        name: 'b7-02-f4-toolbar',
        reference: frames.nth(4).locator('main .xr-toolbar'),
        product: none.locator('main .xr-toolbar'),
      },
      {
        name: 'b7-02-f4-count',
        reference: frames.nth(4).locator('main .xr-toolbar-status'),
        product: none.locator('main .xr-toolbar-status'),
      },
      {
        name: 'b7-02-f4-no-match',
        reference: frames.nth(4).locator('main .xr-empty'),
        product: none.locator('main .xr-empty'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f6 · Mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, '/admin/institutions', institutionsReady);
    await rest(ours);
    const frame = frames.nth(6);
    await run([
      {
        name: 'b7-02-f6-mobile-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: 'b7-02-f6-mobile-tabs',
        reference: frame.locator('main [role="tablist"]'),
        product: ours.locator('main [role="tablist"]'),
      },
      ...(['Godavari Institute of Technology', 'Vizag Polytechnic'] as const).map((name) => ({
        name: `b7-02-f6-mobile-row-${slug(name)}`,
        reference: rowOf(frame, name),
        product: rowOf(ours, name),
      })),
    ]);
    expect(failures).toEqual([]);
  });
});

// ---- B7-03 · SA-07 Institution detail, and B7-04 f0 ---------------------------------------------

/** The page's opening parts: back link, page header, actions. */
function headParts(prefix: string, frame: Locator, ours: Page): CompareItem[] {
  return [
    {
      name: `${prefix}-back-link`,
      reference: frame.locator('main a.xr-back'),
      product: ours.locator('main a.xr-back'),
    },
    {
      name: `${prefix}-header`,
      reference: frame.locator('main .xr-phead'),
      product: ours.locator('main .xr-phead'),
    },
    {
      // "Open request <reference>": the canvas runtime's binding wrapper (DEV-42).
      name: `${prefix}-actions`,
      reference: frame.locator('main .xw-actions').first(),
      product: ours.locator('main .xw-actions').first(),
      deviation: 'DEV-42',
    },
  ];
}

test.describe('B7-03 · SA-07 Institution detail', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B7-03-Institution-Detail.dc.html', {
      frameMinHeight: 900,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(10);
  });

  test('f0 · Godavari Institute of Technology · Access active · 1440', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(
      context,
      1440,
      '/admin/institutions/godavari',
      heading('Godavari Institute of Technology'),
    );
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      // The page is shorter by its "Needs attention" rows (DEV-38) and its History (DEV-40).
      ...shellParts('b7-03-f0', frame, ours, ['DEV-38', 'DEV-40']),
      ...headParts('b7-03-f0', frame, ours),
      {
        name: 'b7-03-f0-summary',
        reference: sectionOf(frame, 'Institution summary'),
        product: sectionOf(ours, 'Institution summary'),
      },
      {
        name: 'b7-03-f0-plans-table',
        reference: sectionOf(frame, 'Access plans').locator('.xr-table-wrap'),
        product: sectionOf(ours, 'Access plans').locator('.xr-table-wrap'),
      },
      {
        // P1-14: the note without "(T-06)" and "(T-08)".
        name: 'b7-03-f0-plans',
        reference: sectionOf(frame, 'Access plans'),
        product: sectionOf(ours, 'Access plans'),
        deviation: 'DEV-36',
      },
      {
        name: 'b7-03-f0-attention',
        reference: sectionOf(frame, 'Needs attention'),
        product: sectionOf(ours, 'Needs attention'),
        deviation: 'DEV-38',
      },
      {
        name: 'b7-03-f0-report',
        reference: sectionOf(frame, 'Institution report'),
        product: sectionOf(ours, 'Institution report'),
        deviation: ['DEV-36', 'DEV-39', 'DEV-41'],
      },
      {
        name: 'b7-03-f0-people',
        reference: sectionOf(frame, 'People'),
        product: sectionOf(ours, 'People'),
      },
      {
        name: 'b7-03-f0-history',
        reference: sectionOf(frame, 'History'),
        product: sectionOf(ours, 'History'),
        deviation: 'DEV-40',
      },
      {
        name: 'b7-03-f0-whole-frame',
        reference: frame.locator('.xr-app'),
        product: ours.locator('div.xr-app'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-21', 'DEV-36', 'DEV-38', 'DEV-39', 'DEV-40', 'DEV-41'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · No Institute Admin — Sahyadri · f2 · Access paused — Deccan (1024)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const sahyadri = await open(
      context,
      1024,
      '/admin/institutions/sahyadri',
      heading('Sahyadri Institute of Engineering'),
    );
    await rest(sahyadri);
    const f1 = frames.nth(1);
    await run([
      ...headParts('b7-03-f1', f1, sahyadri),
      {
        name: 'b7-03-f1-notice',
        reference: f1.locator('main .xr-notice').first(),
        product: sahyadri.locator('main .xr-notice').first(),
      },
      {
        name: 'b7-03-f1-summary',
        reference: sectionOf(f1, 'Institution summary'),
        product: sectionOf(sahyadri, 'Institution summary'),
      },
      {
        name: 'b7-03-f1-attention',
        reference: sectionOf(f1, 'Needs attention'),
        product: sectionOf(sahyadri, 'Needs attention'),
      },
      {
        name: 'b7-03-f1-people',
        reference: sectionOf(f1, 'People'),
        product: sectionOf(sahyadri, 'People'),
        deviation: 'DEV-39',
      },
    ]);
    const deccan = await open(
      context,
      1024,
      '/admin/institutions/deccan',
      heading('Deccan Institute of Technology'),
    );
    await rest(deccan);
    const f2 = frames.nth(2);
    await run([
      ...headParts('b7-03-f2', f2, deccan),
      {
        name: 'b7-03-f2-paused-notice',
        reference: f2.locator('main .xr-notice').first(),
        product: deccan.locator('main .xr-notice').first(),
      },
      {
        name: 'b7-03-f2-attention',
        reference: sectionOf(f2, 'Needs attention'),
        product: sectionOf(deccan, 'Needs attention'),
      },
      {
        name: 'b7-03-f2-summary',
        reference: sectionOf(f2, 'Institution summary'),
        product: sectionOf(deccan, 'Institution summary'),
        deviation: 'DEV-41',
      },
      {
        name: 'b7-03-f2-history',
        reference: sectionOf(f2, 'History'),
        product: sectionOf(deccan, 'History'),
        deviation: 'DEV-40',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · Approved — payment required — Vizag · f4 · Access ended — Malnad · f5 · Ending soon — BITS (1024)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const vizag = await open(
      context,
      1024,
      '/admin/institutions/vizag',
      heading('Vizag Polytechnic'),
    );
    await rest(vizag);
    const f3 = frames.nth(3);
    await run([
      ...headParts('b7-03-f3', f3, vizag),
      {
        name: 'b7-03-f3-summary',
        reference: sectionOf(f3, 'Institution summary'),
        product: sectionOf(vizag, 'Institution summary'),
      },
      {
        name: 'b7-03-f3-plans',
        reference: sectionOf(f3, 'Access plans'),
        product: sectionOf(vizag, 'Access plans'),
      },
      {
        name: 'b7-03-f3-attention',
        reference: sectionOf(f3, 'Needs attention'),
        product: sectionOf(vizag, 'Needs attention'),
      },
      {
        name: 'b7-03-f3-report-body',
        reference: sectionOf(f3, 'Institution report').locator('.xr-section-body'),
        product: sectionOf(vizag, 'Institution report').locator('.xr-section-body'),
      },
    ]);
    const malnad = await open(
      context,
      1024,
      '/admin/institutions/malnad',
      heading('Malnad College of Engineering'),
    );
    await rest(malnad);
    const f4 = frames.nth(4);
    await run([
      ...headParts('b7-03-f4', f4, malnad),
      {
        name: 'b7-03-f4-attention',
        reference: sectionOf(f4, 'Needs attention'),
        product: sectionOf(malnad, 'Needs attention'),
      },
      {
        name: 'b7-03-f4-summary',
        reference: sectionOf(f4, 'Institution summary'),
        product: sectionOf(malnad, 'Institution summary'),
        deviation: 'DEV-41',
      },
    ]);
    const bits = await open(
      context,
      1024,
      '/admin/institutions/bitshyd',
      heading('BITS Pilani — Hyderabad Campus'),
    );
    await rest(bits);
    const f5 = frames.nth(5);
    await run([
      ...headParts('b7-03-f5', f5, bits),
      {
        name: 'b7-03-f5-plans-table',
        reference: sectionOf(f5, 'Access plans').locator('.xr-table-wrap'),
        product: sectionOf(bits, 'Access plans').locator('.xr-table-wrap'),
      },
      {
        name: 'b7-03-f5-attention',
        reference: sectionOf(f5, 'Needs attention'),
        product: sectionOf(bits, 'Needs attention'),
        deviation: 'DEV-38',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f6 · Assign validation · f7 · Pause reason required · f8 · Override reason required (1024)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const sahyadri = await open(
      context,
      1024,
      '/admin/institutions/sahyadri',
      heading('Sahyadri Institute of Engineering'),
    );
    await sahyadri
      .locator('main .xw-actions')
      .getByRole('button', { name: 'Assign Institute Admin' })
      .click();
    const assign = sahyadri.getByRole('dialog');
    await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('n.joshi@sahyadri');
    await assign.getByRole('button', { name: 'Assign' }).click();
    await expect(assign).toContainText('Enter an e-mail address like name@institution.edu.in');
    await rest(sahyadri);
    await run([
      {
        name: 'b7-03-f6-assign-dialog',
        reference: frames.nth(6).locator('.xr-dialog'),
        product: assign,
        insetX: 1,
      },
      {
        // P1-14: the sentence without "(T-11)" (under the tolerance of the whole dialog, so the
        // sentence is compared on its own).
        name: 'b7-03-f6-assign-sentence',
        reference: frames.nth(6).locator('.xr-dialog .xr-dialog-body > p'),
        product: assign.locator('.xr-dialog-body > p'),
        deviation: 'DEV-36',
      },
      {
        name: 'b7-03-f6-assign-fields',
        reference: frames.nth(6).locator('.xr-dialog .xr-field').nth(0),
        product: assign.locator('.xr-field').nth(0),
      },
      {
        name: 'b7-03-f6-assign-email',
        reference: frames.nth(6).locator('.xr-dialog .xr-field').nth(1),
        product: assign.locator('.xr-field').nth(1),
      },
    ]);
    const konark = await open(
      context,
      1024,
      '/admin/institutions/konark',
      heading('Konark Polytechnic'),
    );
    await konark.getByRole('button', { name: 'Pause access' }).click();
    const pause = konark.getByRole('dialog');
    await pause.getByRole('button', { name: 'Pause access' }).click();
    await expect(pause).toContainText('Add a reason — it is kept in the history');
    await rest(konark);
    await run([
      {
        name: 'b7-03-f7-pause-dialog',
        reference: frames.nth(7).locator('.xr-dialog'),
        product: pause,
        insetX: 1,
      },
    ]);
    const godavari = await open(
      context,
      1024,
      '/admin/institutions/godavari',
      heading('Godavari Institute of Technology'),
    );
    await godavari.getByRole('button', { name: 'Change status for Sneha Reddy' }).click();
    await godavari.getByRole('button', { name: 'Change to Active' }).click();
    await expect(godavari.getByRole('region', { name: 'People' })).toContainText(
      'Add a reason — it is kept in the history',
    );
    await rest(godavari);
    const sneha = (root: Locator | Page) => root.locator('li.xg-lo', { hasText: 'Sneha Reddy' });
    await run([
      {
        // "Change to Active": the canvas runtime's binding wrapper (DEV-42).
        name: 'b7-03-f8-override-row',
        reference: sneha(frames.nth(8)),
        product: sneha(godavari),
        deviation: 'DEV-42',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f9 · Mobile 375 · Konark Polytechnic', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(
      context,
      375,
      '/admin/institutions/konark',
      heading('Konark Polytechnic'),
    );
    await rest(ours);
    const frame = frames.nth(9);
    await run([
      {
        name: 'b7-03-f9-mobile-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      ...headParts('b7-03-f9-mobile', frame, ours),
      {
        name: 'b7-03-f9-mobile-plans-table',
        reference: sectionOf(frame, 'Access plans').locator('.xr-table-wrap'),
        product: sectionOf(ours, 'Access plans').locator('.xr-table-wrap'),
      },
      {
        name: 'b7-03-f9-mobile-summary',
        reference: sectionOf(frame, 'Institution summary'),
        product: sectionOf(ours, 'Institution summary'),
        deviation: 'DEV-41',
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B7-04 · the Super Admin’s pause (SA-07)', () => {
  test('f0 · Godavari Institute of Technology (1440)', async ({
    context,
    openBoardPage,
  }, testInfo) => {
    const { page: board } = await openBoardPage('B7-04-Pause-Effects.dc.html', {
      frameMinHeight: 900,
    });
    const frame = board.locator('.b1-frame').nth(0);
    const { run, failures } = collector(testInfo);
    const ours = await open(
      context,
      1440,
      '/admin/institutions/godavari',
      heading('Godavari Institute of Technology'),
    );
    await rest(ours);
    await run([
      ...headParts('b7-04-f0', frame, ours),
      {
        name: 'b7-04-f0-summary',
        reference: sectionOf(frame, 'Institution summary'),
        product: sectionOf(ours, 'Institution summary'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});
