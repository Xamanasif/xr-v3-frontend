import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  reachAndClick,
  type FocusStop,
} from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * WP-0.7 — the DataTable sort and the B1-10 fix in a real browser (BC13; START-HERE Known
 * exception 1; B8-03 "Open finding — B1-10 at 375"; B8-08 "B1-10 sort button at 375"; Appendix E
 * §6.1, §7.1; Appendix F WP-0.7 acceptance 2–4). B1-10's sortable "Received" column has two
 * controls on one sort state: the header's button (`th[aria-sort] > button.xr-x-th-sort`) from
 * 760 px of content, and the sort bar (`.xr-x-table-sortbar`) in the toolbar's status row below
 * 760 px, where v46 clips the header (labelled rows). Every check confirms the container width
 * first, then drives the page with the real keyboard (Tab, Enter, Space) and the real pointer
 * (`reachAndClick`: wheel, hit test, mouse click). jsdom cannot prove any of this.
 *
 * The route-level test on SA-02 itself is Phase 1 (apps/web/e2e/a11y/datatable-sort.spec.ts,
 * written as `fixme`: SA-02 is not built).
 */

const LABELLED_ROWS = V46_CONTAINER_THRESHOLDS.labelledRows.px;

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};
const PHONE = V46_CONTAINER_THRESHOLDS.phone.px;

const NEWEST = 'Received, newest first. Change order';
const OLDEST = 'Received, oldest first. Change order';
/** Either sort control, by its exact accessible name. */
const SORT_NAME = /^Received, (?:newest|oldest) first\. Change order$/;
const TABLE_NAME = 'Institutional access requests';

/** B1-10's seven requests, newest first (`iso`); oldest first is the reverse. */
const NEWEST_FIRST = [
  'REQ-0042',
  'REQ-0041',
  'REQ-0040',
  'REQ-0039',
  'REQ-0038',
  'REQ-0037',
  'REQ-0036',
];
const OLDEST_FIRST = [...NEWEST_FIRST].reverse();

/**
 * The specimen frame width that gives `content` px of `.xr-content`: the frame is the
 * `.xr-app`, and `.xr-page` pads each side by 16 below 600, 24 below 1024, 32 below 1280 and 40
 * from there (xr-foundation.css).
 */
function frameFor(content: number): number {
  for (const [pad, below] of [
    [16, 600],
    [24, 1024],
    [32, 1280],
  ] as const) {
    if (content + 2 * pad < below) return content + 2 * pad;
  }
  return content + 80;
}

/**
 * Lets running transitions finish. With reduced motion the v46 backstop makes every property
 * change a 0.01 ms transition, so a computed value read in the same frame is still the old one.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

/** Role queries stay inside the specimen (Next's route announcer is a hidden role=alert). */
const frame = (page: Page) => page.locator('div.specimen-frame');

/** The `xr-content` container the table and its toolbar sit in. */
const content = (page: Page) => frame(page).locator('main .xr-content');

const widthOf = (locator: Locator) =>
  locator.evaluate((element) => element.getBoundingClientRect().width);

/**
 * Opens a specimen with reduced motion, waits for hydration (`data-ready`) and the web font, and
 * settles. With `contentWidth`, the frame is sized so `.xr-content` is exactly that wide, and that
 * is asserted before anything else.
 */
async function ready(page: Page, id: string, contentWidth?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, contentWidth === undefined ? undefined : frameFor(contentWidth));
  await expect(page.locator('[data-ready]')).toHaveCount(1);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await settle(page);
  if (contentWidth !== undefined) expect(await widthOf(content(page))).toBe(contentWidth);
}

/** The displayed sort controls (role queries skip `display:none`), and all of them. */
const sortControls = (page: Page) => frame(page).getByRole('button', { name: SORT_NAME });
const allSortControls = (page: Page) =>
  frame(page).getByRole('button', { name: SORT_NAME, includeHidden: true });
const headerButton = (page: Page) => frame(page).locator('th[aria-sort] > button.xr-x-th-sort');
const headerWords = (page: Page) => frame(page).locator('th[aria-sort] > span.xr-x-th-text');
const sortBar = (page: Page) => frame(page).locator('.xr-x-table-sortbar');
const barButton = (page: Page) => sortBar(page).locator('button');
const sortedHead = (page: Page) => frame(page).locator('th[aria-sort]');
const table = (page: Page) => frame(page).getByRole('table', { name: TABLE_NAME });
const references = (page: Page) => table(page).locator('tbody td.is-primary a');
/** The table's own status region (the toolbar's count is another `role=status`). */
const tableStatus = (page: Page) => frame(page).locator('.xr-table-wrap > [role="status"]');

const display = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).display);

/**
 * Whether script focus can land on the element (never, for a `display:none` control). Focus goes
 * back where it was, so a keyboard walk in progress is not disturbed.
 */
const takesFocus = (locator: Locator) =>
  locator.evaluate((element) => {
    const previous = document.activeElement;
    (element as HTMLElement).focus();
    const focused = document.activeElement === element;
    if (previous instanceof HTMLElement && previous !== document.body) previous.focus();
    else if (focused) (element as HTMLElement).blur();
    return focused;
  });

const box = async (locator: Locator) => {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value!;
};

/**
 * Presses Tab from the start of the document until `target` has focus (a real keyboard walk,
 * as a person would reach it). Returns the number of presses.
 */
async function tabTo(page: Page, target: Locator, maxPresses = 120): Promise<number> {
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
    root.removeAttribute('tabindex');
  });
  const handle = await target.elementHandle();
  for (let presses = 1; presses <= maxPresses; presses += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((element) => document.activeElement === element, handle)) {
      return presses;
    }
  }
  throw new Error(`Tab did not reach the target in ${maxPresses} presses.`);
}

/** The Tab stops named like a sort control: exactly one is expected at any width. */
const sortStops = (stops: readonly FocusStop[]) =>
  stops.filter((stop) => /"Received, (?:newest|oldest) first\. Change order"$/.test(stop.element));

/**
 * Asserts which control is displayed for a content width: from 760 px the header button (and
 * the header's words alone are not displayed); below, the sort bar, while the header button and
 * the header-cell control are `display:none` and cannot take focus.
 */
async function expectOneSortControl(page: Page, labelled: boolean, name = NEWEST) {
  await expect(allSortControls(page)).toHaveCount(2);
  await expect(sortControls(page)).toHaveCount(1);
  await expect(sortControls(page)).toHaveAccessibleName(name);
  if (labelled) {
    expect(await display(sortBar(page))).toBe('flex');
    expect(await display(headerButton(page))).toBe('none');
    expect(await display(headerWords(page))).toBe('inline');
    await expect(barButton(page)).toBeVisible();
    await expect(headerButton(page)).toBeHidden();
    expect(await takesFocus(headerButton(page))).toBe(false);
    expect(await takesFocus(barButton(page))).toBe(true);
  } else {
    expect(await display(sortBar(page))).toBe('none');
    expect(await display(headerButton(page))).toBe('inline-flex');
    expect(await display(headerWords(page))).toBe('none');
    await expect(headerButton(page)).toBeVisible();
    await expect(sortBar(page)).toBeHidden();
    expect(await takesFocus(barButton(page))).toBe(false);
    expect(await takesFocus(headerButton(page))).toBe(true);
  }
}

/** The displayed control: the sort bar's button below 760 px of content, else the header's. */
const visibleControl = (page: Page, labelled: boolean) =>
  labelled ? barButton(page) : headerButton(page);

/**
 * Asserts the order on screen: the references, `aria-sort`, the displayed control's accessible
 * name, and the label the hidden one will have when the width changes (a `display:none` control
 * has no accessible name: it is not in the accessibility tree).
 */
async function expectOrder(page: Page, direction: 'descending' | 'ascending') {
  await expect(references(page)).toHaveText(
    direction === 'descending' ? NEWEST_FIRST : OLDEST_FIRST,
  );
  await expect(sortedHead(page)).toHaveAttribute('aria-sort', direction);
  const name = direction === 'descending' ? NEWEST : OLDEST;
  await expect(sortControls(page)).toHaveAccessibleName(name);
  await expect(headerButton(page)).toHaveAttribute('aria-label', name);
  await expect(barButton(page)).toHaveAttribute('aria-label', name);
}

test.describe('B1-10 sort at the four content widths (Appendix F WP-0.7 acceptance 2)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'The frame sets the content width; one viewport is enough.',
  );

  for (const width of [343, 759, 760, 1112]) {
    const labelled = width < LABELLED_ROWS;

    test(`content ${width}: ${labelled ? 'the sort bar above the first row; the header button is display:none' : 'the header button; the sort bar is not displayed'}`, async ({
      page,
    }) => {
      await ready(page, 'c-data-table', width);
      // v46's own mode switch at this width: clipped head and labelled rows, or a table.
      const head = await table(page)
        .locator('thead')
        .evaluate((element) => getComputedStyle(element).position);
      expect(head).toBe(labelled ? 'absolute' : 'static');

      await expectOneSortControl(page, labelled);
      await expectOrder(page, 'descending');
      if (labelled) {
        // In the toolbar's status row, after the count, above the first row (VD-04 placement).
        await expect(
          frame(page).locator('.xr-toolbar-status > [role="status"] + .xr-x-table-sortbar'),
        ).toHaveCount(1);
        const [bar, firstRow] = [
          await box(barButton(page)),
          await box(table(page).locator('tbody tr').first()),
        ];
        expect(bar.y + bar.height).toBeLessThanOrEqual(firstRow.y);
      }

      // Every Tab stop is visible, and exactly one of them is a sort control.
      const stops = await expectNoInvisibleFocusTargets(page);
      const sorts = sortStops(stops);
      expect(sorts).toHaveLength(1);
      expect(sorts[0]!.element).toContain(labelled ? 'xr-btn--sm' : 'xr-x-th-sort');
      for (const reference of NEWEST_FIRST) {
        expect(
          stops.filter((stop) => stop.element.includes(`"Open request ${reference},`)),
        ).toHaveLength(1);
      }
    });

    test(`content ${width}: Enter, Space and a real click on the displayed control reverse the rows, flip aria-sort and rename both controls`, async ({
      page,
    }) => {
      await ready(page, 'c-data-table', width);
      const control = visibleControl(page, labelled);
      await tabTo(page, control);
      await expect(control).toBeFocused();
      // Reached by keyboard, it shows the v46 focus ring (board 02 "Links and focus"; 2.4.7).
      await settle(page);
      expect(
        await control.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.outlineStyle, style.outlineWidth, style.outlineColor];
        }),
      ).toEqual(['solid', '2px', rgb(V46_FOCUS_COLOURS.focus)]);

      await page.keyboard.press('Enter');
      await expectOrder(page, 'ascending');
      await expect(references(page).first()).toHaveText('REQ-0036');
      await expect(control).toBeFocused();
      await expect(tableStatus(page)).toHaveText('Received, oldest first');
      await expectOneSortControl(page, labelled, OLDEST);

      await page.keyboard.press('Space');
      await expectOrder(page, 'descending');
      await expect(references(page).first()).toHaveText('REQ-0042');
      await expect(control).toBeFocused();
      await expect(tableStatus(page)).toHaveText('Received, newest first');

      await reachAndClick(page, control);
      await expectOrder(page, 'ascending');
      await expectOneSortControl(page, labelled, OLDEST);
      // The other control was never displayed, whatever the order.
      expect(await takesFocus(visibleControl(page, !labelled))).toBe(false);
    });
  }

  test('one sort state across the modes: the order set at 343 is the order shown at 1112', async ({
    page,
  }) => {
    await ready(page, 'c-data-table', 343);
    await tabTo(page, barButton(page));
    await page.keyboard.press('Enter');
    await expectOrder(page, 'ascending');
    // Widen the same page: the frame is the app, so the content grows past 760.
    await frame(page).evaluate((element, width) => {
      (element as HTMLElement).style.inlineSize = `${width}px`;
    }, frameFor(1112));
    await settle(page);
    expect(await widthOf(content(page))).toBe(1112);
    await expectOneSortControl(page, false, OLDEST);
    await expectOrder(page, 'ascending');
    await reachAndClick(page, headerButton(page));
    await expectOrder(page, 'descending');
  });

  test('filtered to no match, no sort control is shown; clearing brings the rows back in the chosen order', async ({
    page,
  }) => {
    for (const width of [343, 1112]) {
      await ready(page, 'c-data-table', width);
      await reachAndClick(page, visibleControl(page, width < LABELLED_ROWS));
      await expectOrder(page, 'ascending');
      await frame(page).getByRole('searchbox', { name: 'Search' }).fill('Narmada');
      await expect(
        frame(page).getByRole('heading', { name: 'No requests match these filters' }),
      ).toBeVisible();
      await expect(allSortControls(page)).toHaveCount(0);
      const clear = frame(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' });
      await clear.focus();
      await page.keyboard.press('Enter');
      await expect(references(page)).toHaveText(OLDEST_FIRST);
      await expectOneSortControl(page, width < LABELLED_ROWS, OLDEST);
      await expect(references(page).first()).toBeFocused();
    }
  });

  test('a filtered list sorts the rows it shows (B1-10 "Filtered · Under review" at content 672)', async ({
    page,
  }) => {
    await ready(page, 'c-data-table', 672);
    await frame(page).getByRole('combobox', { name: 'Status' }).selectOption('review');
    await expect(references(page)).toHaveText(['REQ-0042', 'REQ-0040', 'REQ-0038']);
    await expectOneSortControl(page, true);
    await tabTo(page, barButton(page));
    await page.keyboard.press('Enter');
    await expect(references(page)).toHaveText(['REQ-0038', 'REQ-0040', 'REQ-0042']);
    await expectNoInvisibleFocusTargets(page);
  });

  for (const width of [343, 1112]) {
    test(`axe (WCAG 2.2 AA) in ${width < LABELLED_ROWS ? 'labelled-row' : 'table'} mode, in both orders (content ${width})`, async ({
      page,
    }) => {
      await ready(page, 'c-data-table', width);
      await expectNoAxeViolations(page);
      await reachAndClick(page, visibleControl(page, width < LABELLED_ROWS));
      await expectOrder(page, 'ascending');
      await expectNoAxeViolations(page);
    });
  }

  test('Chromium’s accessibility tree: one sort button per mode; the head keeps its words; table semantics stay in labelled rows', async ({
    page,
  }) => {
    for (const [width, headName] of [
      [343, 'Received'],
      [1112, NEWEST],
    ] as const) {
      await ready(page, 'c-data-table', width);
      const cdp = await page.context().newCDPSession(page);
      try {
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const shown = nodes.filter((node) => !node.ignored);
        const named = (role: string) =>
          shown
            .filter((node) => node.role?.value === role)
            .map((node) => String(node.name?.value ?? ''));
        expect(named('button').filter((name) => SORT_NAME.test(name))).toEqual([NEWEST]);
        expect(named('columnheader')).toEqual([
          'Reference',
          'Institution and contact person',
          'Experiments',
          'Type',
          headName,
          'Status',
        ]);
        expect(named('table')).toEqual([TABLE_NAME]);
        // Labelled rows are display:block in v46: Chromium keeps the rows and cells (R-15;
        // WebKit/VoiceOver are not verified here, P0-28).
        expect(named('row')).toHaveLength(NEWEST_FIRST.length + 1);
        expect(named('cell').length).toBeGreaterThanOrEqual(NEWEST_FIRST.length * 6);
      } finally {
        await cdp.detach();
      }
    }
  });
});

/**
 * B1-10's own table head, read from the frozen board (the template of its first table, with the
 * descending state filled in): the reference the WP-0.7 visual correction is measured against.
 */
function boardHead(): string {
  const board = readFileSync(
    join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'design',
      'handoff-v46',
      'canvas-v46',
      'project',
      'B1-10-SA-Requests.dc.html',
    ),
    'utf8',
  );
  const start = board.indexOf('<thead><tr><th scope="col">Reference</th>');
  const head = board.slice(start, board.indexOf('</thead>', start) + '</thead>'.length);
  return head
    .replace('{{ q.ariaSort }}', 'descending')
    .replace(' onClick="{{ q.toggleSort }}"', '')
    .replace(/<sc-if value="\{\{ q\.sortIcon \}\}"[^>]*>(.*?)<\/sc-if>/, '$1')
    .replace(/<sc-if value="\{\{ q\.sortAsc \}\}"[^>]*>.*?<\/sc-if>/, '')
    .replace('{{ q.sortLabel }}', 'Received, newest first');
}

/** The sorted header cell's geometry and the button's computed look, in one table wrap. */
function headLook(wrap: Locator) {
  return wrap.evaluate((element) => {
    const round = (value: number) => Math.round(value * 10) / 10;
    const th = element.querySelector('th[aria-sort]')!;
    const button = th.querySelector('button')!;
    const style = getComputedStyle(button);
    const [cell, box] = [th.getBoundingClientRect(), button.getBoundingClientRect()];
    return {
      row: round(element.querySelector('thead tr')!.getBoundingClientRect().height),
      cellPadding: getComputedStyle(th).padding,
      color: style.color,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      decoration: style.textDecorationLine,
      minHeight: style.minHeight,
      padding: style.padding,
      display: style.display,
      gap: style.gap,
      height: round(box.height),
      width: round(box.width),
      top: round(box.top - cell.top),
      left: round(box.left - cell.left),
    };
  });
}

test.describe('PF-01 header look: the sort button matches B1-10 (WP-0.7 visual correction)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'The frame sets the content width; one viewport is enough.',
  );

  for (const width of [760, 1112]) {
    test(`content ${width}: the header button and head row measure as B1-10 draws them, and read as header words`, async ({
      page,
    }) => {
      await ready(page, 'c-data-table', width);
      // The board's head, injected beside the DataTable in the same xr-content.
      await content(page).evaluate((host, head) => {
        const wrap = document.createElement('div');
        wrap.className = 'xr-table-wrap';
        wrap.setAttribute('data-probe', 'board-head');
        wrap.innerHTML = `<table class="xr-table"><caption class="xr-sr">B1-10 head as drawn</caption>${head}</table>`;
        host.append(wrap);
      }, boardHead());
      await settle(page);
      // The DataTable's own wrap: the table's parent.
      const ours = table(page).locator('..');
      const drawn = frame(page).locator('[data-probe="board-head"]');
      const [mine, board] = [await headLook(ours), await headLook(drawn)];
      expect(mine).toEqual(board);
      // About 56.5 px (12 + 32 + 12 and the border), not the 64.5 px of the plain text button.
      expect(mine.row).toBeLessThan(60);
      expect(mine).toMatchObject({
        color: 'rgb(64, 71, 107)',
        fontSize: '14px',
        fontWeight: '700',
        decoration: 'none',
        minHeight: '32px',
        padding: '0px',
        height: 32,
      });
      // The same words look as the plain head cells beside it ("Reference").
      const neighbour = await table(page)
        .locator('thead th')
        .first()
        .evaluate((th) => {
          const style = getComputedStyle(th);
          return [style.color, style.fontSize, style.fontWeight];
        });
      expect([mine.color, mine.fontSize, mine.fontWeight]).toEqual(neighbour);
      // The reference has served; it leaves the page before the keyboard and pointer checks.
      await drawn.evaluate((element) => element.remove());

      // Hover keeps the colour, as the board's inline style does; the focus ring is v46's.
      const button = await box(headerButton(page));
      await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
      await settle(page);
      expect(
        await headerButton(page).evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.color, style.textDecorationLine];
        }),
      ).toEqual(['rgb(64, 71, 107)', 'none']);
      await tabTo(page, headerButton(page));
      await settle(page);
      expect(
        await headerButton(page).evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.outlineStyle, style.outlineWidth, style.outlineColor];
        }),
      ).toEqual(['solid', '2px', rgb(V46_FOCUS_COLOURS.focus)]);
      // Name, aria-sort and sorting are unchanged.
      await expect(sortControls(page)).toHaveAccessibleName(NEWEST);
      await page.keyboard.press('Enter');
      await expectOrder(page, 'ascending');
    });
  }

  test('content 759: the header button stays display:none; the sort bar keeps its §7.1 look in the status row', async ({
    page,
  }) => {
    await ready(page, 'c-data-table', 759);
    await expectOneSortControl(page, true);
    expect(
      await barButton(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.color,
          style.fontSize,
          style.fontWeight,
          style.textDecorationLine,
          style.minHeight,
        ];
      }),
    ).toEqual([rgb(V46_FOCUS_COLOURS.focus), '14px', '600', 'underline', '36px']);
    await expect(
      frame(page).locator('.xr-toolbar-status > [role="status"] + .xr-x-table-sortbar'),
    ).toHaveCount(1);
  });
});

test.describe('B1-10 sort at the viewport’s own width (1440, 1024, 768, 375)', () => {
  test('exactly one visible sort control; Tab reaches it and Enter reverses the rows', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    const width = await widthOf(content(page));
    const labelled = width < LABELLED_ROWS;
    await expectOneSortControl(page, labelled);
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(sortStops(stops)).toHaveLength(1);
    const control = visibleControl(page, labelled);
    await tabTo(page, control);
    await page.keyboard.press('Enter');
    await expectOrder(page, 'ascending');
    await expect(control).toBeFocused();
    await expectNoInvisibleFocusTargets(page);
  });
});

/**
 * Appendix E §6.1 / §7.1: content = app − sidebar − 2 × page padding. The boundary app widths
 * are 807/808 (drawer, padding 24) and 1071/1072 with the sidebar expanded (248, padding 32).
 * The viewport is the app here (no frame width), and each test first asserts that `.xr-app` is
 * as wide as the viewport (classic scrollbars would narrow it, R-20) and what `.xr-content` is.
 */
const APP_WIDTHS = [
  { app: 375, specimen: 'c-data-table-shell', sidebar: 'drawer', content: 343 },
  { app: 768, specimen: 'c-data-table-shell', sidebar: 'drawer', content: 720 },
  { app: 807, specimen: 'c-data-table-shell', sidebar: 'drawer', content: 759 },
  { app: 808, specimen: 'c-data-table-shell', sidebar: 'drawer', content: 760 },
  { app: 1024, specimen: 'c-data-table-shell', sidebar: 'rail', content: 888 },
  { app: 1024, specimen: 'c-data-table-shell-expanded', sidebar: 'expanded', content: 712 },
  { app: 1071, specimen: 'c-data-table-shell-expanded', sidebar: 'expanded', content: 759 },
  { app: 1072, specimen: 'c-data-table-shell-expanded', sidebar: 'expanded', content: 760 },
  { app: 1440, specimen: 'c-data-table-shell', sidebar: 'full', content: 1112 },
] as const;

/** The sidebar as laid out: the drawer is off screen until opened; otherwise its width. */
async function sidebarWidth(page: Page): Promise<number> {
  return frame(page)
    .locator('aside.xr-side')
    .evaluate((element) =>
      getComputedStyle(element).display === 'none' ? 0 : element.getBoundingClientRect().width,
    );
}

async function openShell(page: Page, specimen: string, app: number): Promise<void> {
  await page.setViewportSize({ width: app, height: 900 });
  await ready(page, specimen);
  const measured = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    inner: window.innerWidth,
    app: document.querySelector('.xr-app')!.getBoundingClientRect().width,
  }));
  expect(measured).toEqual({ viewport: app, inner: app, app });
}

test.describe('B1-10 sort in the workspace shell at the app-width boundaries (Appendix E §6.1, §7.1)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Each test sets its own viewport; one project is enough.',
  );

  for (const { app, specimen, sidebar, content: expected } of APP_WIDTHS) {
    const labelled = expected < LABELLED_ROWS;

    test(`app ${app}, sidebar ${sidebar}: content ${expected} → ${labelled ? 'labelled rows and the sort bar' : 'table and the header button'}`, async ({
      page,
    }) => {
      await openShell(page, specimen, app);
      expect(await widthOf(content(page))).toBe(expected);
      if (sidebar === 'drawer') {
        await expect(frame(page).getByRole('button', { name: 'Open menu' })).toBeVisible();
      } else {
        expect(await sidebarWidth(page)).toBe(sidebar === 'rail' ? 72 : 248);
      }

      await expectOneSortControl(page, labelled);
      const stops = await expectNoInvisibleFocusTargets(page);
      expect(sortStops(stops)).toHaveLength(1);
      expect(stops[0]!.element).toContain('Skip to main content');

      const control = visibleControl(page, labelled);
      await tabTo(page, control);
      await page.keyboard.press('Enter');
      await expectOrder(page, 'ascending');
      await expect(references(page).first()).toHaveText('REQ-0036');
      await expect(control).toBeFocused();
      await reachAndClick(page, control);
      await expectOrder(page, 'descending');
    });
  }

  test('app 1071: collapsing the expanded sidebar to the rail switches to the header button, keeping the order; expanding switches back', async ({
    page,
  }) => {
    await openShell(page, 'c-data-table-shell-expanded', 1071);
    expect(await widthOf(content(page))).toBe(759);
    await tabTo(page, barButton(page));
    await page.keyboard.press('Enter');
    await expectOrder(page, 'ascending');

    const collapse = frame(page).getByRole('button', { name: 'Collapse menu' });
    await tabTo(page, collapse);
    await page.keyboard.press('Enter');
    await settle(page);
    // The rail: 1071 − 72 − 2 × 32.
    expect(await widthOf(content(page))).toBe(935);
    await expectOneSortControl(page, false, OLDEST);
    await expectOrder(page, 'ascending');

    const expand = frame(page).getByRole('button', { name: 'Expand menu' });
    await expect(expand).toBeFocused();
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await widthOf(content(page))).toBe(759);
    await expectOneSortControl(page, true, OLDEST);
    await expectNoInvisibleFocusTargets(page);
  });

  for (const app of [807, 1072]) {
    test(`axe (WCAG 2.2 AA) in the shell at app ${app}`, async ({ page }) => {
      await openShell(page, app < 1024 ? 'c-data-table-shell' : 'c-data-table-shell-expanded', app);
      await expectNoAxeViolations(page);
    });
  }
});

/**
 * PF-01 guards (WP-0.5 rules, kept): every control kind the selector names, in the three heads
 * v46 clips, at the clip thresholds — `.xr-table` and `.xp-ftable` below 760, `.xp-compare` below
 * 600 (Appendix F WP-0.7 acceptance 3). Clipped: `display:none`, no script focus, no Tab stop.
 * Not clipped: displayed and reached by Tab. `[tabindex="-1"]` is never a Tab stop and is left
 * displayed.
 */
test.describe('PF-01 hidden-header guards for every control kind (v46-table-guards)', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'The frame sets the content width; one viewport is enough.',
  );

  const TABLES = [
    { table: 'xr-table', clippedBelow: LABELLED_ROWS },
    { table: 'xp-ftable', clippedBelow: LABELLED_ROWS },
    { table: 'xp-compare', clippedBelow: PHONE },
  ] as const;
  const KINDS = ['link', 'button', 'input', 'select', 'textarea', 'summary', 'tabindex'] as const;

  /**
   * The `data-probe` (or tag) of every Tab stop, from the top of the page until focus leaves the
   * document or comes back to an element already visited (a real keyboard walk).
   */
  async function tabStopProbes(page: Page): Promise<string[]> {
    await page.evaluate(() => {
      const root = document.documentElement;
      root.setAttribute('tabindex', '-1');
      root.focus({ preventScroll: true });
      root.removeAttribute('tabindex');
      (window as unknown as { __xrStops: WeakSet<Element> }).__xrStops = new WeakSet();
    });
    const probes: string[] = [];
    for (let presses = 0; presses < 100; presses += 1) {
      await page.keyboard.press('Tab');
      const probe = await page.evaluate(() => {
        const seen = (window as unknown as { __xrStops: WeakSet<Element> }).__xrStops;
        const active = document.activeElement;
        if (!active || active === document.body || seen.has(active)) return null;
        seen.add(active);
        return active.getAttribute('data-probe') ?? active.tagName.toLowerCase();
      });
      if (probe === null) break;
      probes.push(probe);
    }
    return probes;
  }

  for (const width of [343, 599, 600, 759, 760, 1112]) {
    test(`content and xp ${width}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openSpecimen(page, 'v46-table-guards', width);
      await settle(page);
      const probe = (name: string) => page.locator(`[data-probe="${name}"]`);
      expect(await widthOf(probe('content'))).toBe(width);
      expect(await widthOf(probe('xp'))).toBe(width);

      const probes = await tabStopProbes(page);
      for (const { table, clippedBelow } of TABLES) {
        const clipped = width < clippedBelow;
        for (const kind of KINDS) {
          const control = probe(`${table}-${kind}`);
          if (clipped) expect(await display(control), `${table} ${kind}`).toBe('none');
          else await expect(control, `${table} ${kind}`).toBeVisible();
          if (clipped) {
            expect(await takesFocus(control), `${table} ${kind}`).toBe(false);
            expect(probes, `${table} ${kind}`).not.toContain(`${table}-${kind}`);
          } else {
            expect(probes, `${table} ${kind}`).toContain(`${table}-${kind}`);
          }
        }
        // Not a Tab stop either way, and not hidden by the guard (script focus only).
        const scriptOnly = probe(`${table}-tabindex-minus-one`);
        expect(await display(scriptOnly)).not.toBe('none');
        expect(probes).not.toContain(`${table}-tabindex-minus-one`);
      }
      await expectNoInvisibleFocusTargets(page);
    });
  }
});
