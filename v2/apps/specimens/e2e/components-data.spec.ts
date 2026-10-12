import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * Data display in a real browser at the four approved viewports (Appendix F WP-0.6 acceptance
 * 3–4; Appendix E §3.3, §5.4, §5.5, §6.1): DataTable (labelled rows below 760 px of content, row
 * links, the loading / empty / no-match / failed states), ListToolbar (count in `role="status"`,
 * chips removed with the keyboard, More filters and the second filter below 600 px of content),
 * Tabs (status-tab arrow keys, the tab panel, the current section tab scrolled into view),
 * Timeline and DecisionLayout ("Go to decision" below 860 px of content). jsdom cannot prove
 * these: container queries, real Tab order, scrolling and computed styles.
 */

const LABELLED_ROWS = V46_CONTAINER_THRESHOLDS.labelledRows.px;
const PHONE = V46_CONTAINER_THRESHOLDS.phone.px;
const DECISION_PANEL = V46_CONTAINER_THRESHOLDS.decisionPanel.px;

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

/** The inline size the `xr-content` container queries resolve against. */
const contentWidth = (page: Page) =>
  page
    .locator('[data-probe="content"]')
    .evaluate((element) => element.getBoundingClientRect().width);

/**
 * Opens a specimen with reduced motion, waits for hydration (`data-ready`) and settles. With
 * `content`, the frame is sized so `.xr-content` is exactly that wide (asserted).
 */
async function ready(page: Page, id: string, content?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, content === undefined ? undefined : frameFor(content));
  await expect(page.locator('[data-probe="app"][data-ready]')).toHaveCount(1);
  // Widths depend on the web font (tab strips, toolbar rows): measure once it has loaded.
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await settle(page);
  if (content !== undefined) expect(await contentWidth(page)).toBe(content);
}

/** Role queries stay inside the specimen (Next's route announcer is a hidden role=alert). */
const frame = (page: Page) => page.locator('div.specimen-frame');

const box = async (locator: Locator) => {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value!;
};

const REFERENCES = [
  'REQ-0042',
  'REQ-0041',
  'REQ-0040',
  'REQ-0039',
  'REQ-0038',
  'REQ-0037',
  'REQ-0036',
];

const SPECIMENS = [
  'c-data-table',
  'c-data-table-states',
  'c-data-table-flush',
  'c-tabs',
  'c-tabs-375',
  'c-timeline',
  'c-decision-layout',
  'c-decision-layout-static',
];

for (const id of SPECIMENS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await ready(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

/** How the B1-10 table is laid out: a table, or labelled rows (Appendix E §6.1). */
async function tableLayout(page: Page) {
  return frame(page)
    .getByRole('table', { name: 'Institutional access requests' })
    .evaluate((table) => {
      const head = table.querySelector('thead')!;
      const cell = table.querySelector('tbody tr:first-child td[data-label]')!;
      const primary = table.querySelector('tbody tr:first-child td.is-primary')!;
      return {
        head: getComputedStyle(head).position,
        headHeight: head.getBoundingClientRect().height,
        cell: getComputedStyle(cell).display,
        label: getComputedStyle(cell, '::before').content,
        primaryLabel: getComputedStyle(primary, '::before').content,
      };
    });
}

test.describe('DataTable (B1-10 "SA-02 Requests · 1440 · interactive"; 11 "Lists")', () => {
  test('at the viewport’s own width: labelled rows exactly below 760 px of content; every row opens its record', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    const layout = await tableLayout(page);
    if ((await contentWidth(page)) < LABELLED_ROWS) {
      expect(layout).toMatchObject({ head: 'absolute', cell: 'block' });
      expect(layout.label).toBe('"Institution and contact person"');
    } else {
      expect(layout).toMatchObject({ head: 'static', cell: 'table-cell', label: 'none' });
    }
    const table = frame(page).getByRole('table', { name: 'Institutional access requests' });
    await expect(table.getByRole('row')).toHaveCount(REFERENCES.length + 1);
    for (const reference of REFERENCES) {
      await expect(
        table.getByRole('link', { name: new RegExp(`^Open request ${reference},`) }),
      ).toHaveAttribute('href', `#${reference.toLowerCase()}`);
    }
  });

  test.describe('at set content widths', () => {
    test.skip(
      ({ viewport }) => viewport?.width !== 1440,
      'The frame sets the content width; one viewport is enough.',
    );

    for (const content of [343, 759, 760, 1112]) {
      test(`content ${content}: ${content < LABELLED_ROWS ? 'labelled rows' : 'a table'}; every row link is a visible Tab stop`, async ({
        page,
      }) => {
        await ready(page, 'c-data-table', content);
        const layout = await tableLayout(page);
        if (content < LABELLED_ROWS) {
          // xr-foundation.css: the head is clipped to 1 px, each cell is a block with its label
          // above the value; the primary cell has no label.
          expect(layout).toMatchObject({
            head: 'absolute',
            cell: 'block',
            label: '"Institution and contact person"',
            primaryLabel: 'none',
          });
          expect(layout.headHeight).toBeLessThanOrEqual(1);
        } else {
          expect(layout).toMatchObject({ head: 'static', cell: 'table-cell', label: 'none' });
          expect(layout.headHeight).toBeGreaterThan(30);
        }
        const stops = await expectNoInvisibleFocusTargets(page);
        for (const reference of REFERENCES) {
          expect(
            stops.filter((stop) => stop.element.includes(`"Open request ${reference},`)),
            reference,
          ).toHaveLength(1);
        }
      });
    }
  });
});

test.describe('ListToolbar (03 "Search, filter, segmented and tabs"; B1-10)', () => {
  const count = (page: Page) => frame(page).locator('.xr-toolbar-status [role="status"]');
  const rowLinks = (page: Page) =>
    frame(page).getByRole('table', { name: 'Institutional access requests' }).getByRole('link');

  test('the count updates in its role=status; a chip is removed with the keyboard and focus stays in the toolbar', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    const status = count(page);
    await expect(status).toHaveText('7 requests');
    const statusHandle = await status.elementHandle();
    await frame(page).getByRole('combobox', { name: 'Status' }).selectOption('review');
    await expect(status).toHaveText('3 of 7 requests');
    await expect(rowLinks(page)).toHaveCount(3);
    // The live region is the same node, only its words changed (Appendix E §5.5).
    expect(await status.evaluate((node, handle) => node === handle, statusHandle)).toBe(true);

    const typeSelect = page.locator('#Qq-type');
    if ((await contentWidth(page)) < PHONE) {
      await frame(page).getByRole('button', { name: 'More filters' }).click();
      await page.locator('#Qq-type2').selectOption('Renewal');
    } else {
      await typeSelect.selectOption('Renewal');
    }
    await expect(status).toHaveText('1 of 7 requests');

    // Board 12 "Target size": the chip's remove button is 28 × 28.
    const removeStatus = frame(page).getByRole('button', { name: 'Remove Status: Under review' });
    const target = await box(removeStatus);
    expect([Math.round(target.width), Math.round(target.height)]).toEqual([28, 28]);

    // Keyboard: Enter on the first chip removes it; focus moves to the next chip.
    await removeStatus.focus();
    await page.keyboard.press('Enter');
    await expect(removeStatus).toHaveCount(0);
    await expect(status).toHaveText('1 of 7 requests');
    const removeType = frame(page).getByRole('button', { name: 'Remove Type: Renewal' });
    await expect(removeType).toBeFocused();
    // Space on the last chip: no chip and no "Clear filters" remain; focus returns to the search.
    await page.keyboard.press('Space');
    await expect(removeType).toHaveCount(0);
    await expect(frame(page).getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
    await expect(frame(page).getByRole('searchbox', { name: 'Search' })).toBeFocused();
    await expect(status).toHaveText('7 requests');
    await expect(rowLinks(page)).toHaveCount(7);
  });

  test('More filters: aria-expanded, the panel, "More filters (1)"; below 600 px of content the second filter lives in the panel', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    const phone = (await contentWidth(page)) < PHONE;
    const more = frame(page).getByRole('button', { name: 'More filters' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    // xr-foundation.css: below 600 px of content `.xr-toolbar > .xr-filter-2{display:none}`.
    if (phone) await expect(page.locator('#Qq-type')).toBeHidden();
    else await expect(page.locator('#Qq-type')).toBeVisible();

    await more.focus();
    await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    const panel = frame(page).getByRole('group', { name: 'More filters' });
    await expect(panel).toBeVisible();
    await expect(more).toHaveAttribute('aria-controls', (await panel.getAttribute('id'))!);
    // The panel's copy of the second filter shows exactly where the toolbar's copy is hidden.
    if (phone) await expect(page.locator('#Qq-type2')).toBeVisible();
    else await expect(page.locator('#Qq-type2')).toBeHidden();

    await panel.getByRole('combobox', { name: 'Internal or external' }).selectOption('External');
    await expect(frame(page).getByRole('button', { name: 'More filters (1)' })).toBeVisible();
    await expect(count(page)).toHaveText('3 of 7 requests');
    await expect(
      frame(page).getByRole('button', { name: 'Remove Internal or external: External' }),
    ).toBeVisible();
    await expectNoInvisibleFocusTargets(page);
  });

  test('search and filters: one row on wide content; below 600 px the search takes its own row', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    const search = await box(frame(page).locator('.xr-toolbar-search'));
    const filter = await box(
      frame(page).locator('.xr-toolbar > .xr-field:not(.xr-toolbar-search)').first(),
    );
    const width = await contentWidth(page);
    if (width < PHONE) {
      expect(filter.y).toBeGreaterThanOrEqual(search.y + search.height);
    } else if (width >= 1000) {
      expect(Math.round(filter.y)).toBe(Math.round(search.y));
    }
  });

  test('no match: "No requests match these filters" with "Clear filters", which restores the list; focus moves to the first row, not the page', async ({
    page,
  }) => {
    await ready(page, 'c-data-table');
    await frame(page).getByRole('searchbox', { name: 'Search' }).fill('Narmada');
    await expect(count(page)).toHaveText('0 of 7 requests');
    const empty = frame(page).locator('.xr-empty');
    await expect(
      empty.getByRole('heading', { name: 'No requests match these filters' }),
    ).toBeVisible();
    await expect(frame(page).getByRole('table')).toHaveCount(0);
    const clear = empty.getByRole('button', { name: 'Clear filters' });
    await clear.focus();
    await page.keyboard.press('Enter');
    await expect(count(page)).toHaveText('7 requests');
    await expect(rowLinks(page)).toHaveCount(7);
    await expect(frame(page).getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    // The focused button went with the no-match state: DataTable moves focus to the first row.
    await expect(clear).toHaveCount(0);
    await expect(rowLinks(page).first()).toBeFocused();
  });
});

test.describe('DataTable states (B1-10 "Loading", "Empty · no requests yet", "No match", "Failed + retry")', () => {
  const block = (page: Page, probe: string) => frame(page).locator(`[data-probe="${probe}"]`);

  test('loading is announced and busy, with skeleton rows hidden from screen readers', async ({
    page,
  }) => {
    await ready(page, 'c-data-table-states');
    const loading = block(page, 'loading');
    const wrap = loading.locator('.xr-table-wrap');
    await expect(wrap).toHaveAttribute('aria-busy', 'true');
    await expect(loading.getByRole('status')).toHaveText('Loading requests');
    await expect(loading.getByRole('table')).toHaveCount(0);
    await expect(wrap.locator('table[aria-hidden="true"] .xr-skel')).toHaveCount(5 * 6);
    // Reduced motion: the shimmer does not run (board 12 "Reduced motion").
    const animation = await wrap
      .locator('.xr-skel')
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(animation)).toBeLessThan(0.1);
  });

  test('empty: icon, one line, no table', async ({ page }) => {
    await ready(page, 'c-data-table-states');
    const empty = block(page, 'empty');
    await expect(empty.getByRole('heading', { name: 'No requests yet' })).toBeVisible();
    await expect(
      empty.getByText('Requests that institutions send from the public site appear here.'),
    ).toBeVisible();
    await expect(empty.getByRole('table')).toHaveCount(0);
  });

  test('no match: "Clear filters" by keyboard brings the rows back; focus moves to the first row, not the page', async ({
    page,
  }) => {
    await ready(page, 'c-data-table-states');
    const noMatch = block(page, 'no-match');
    await expect(
      noMatch.getByRole('heading', { name: 'No requests match these filters' }),
    ).toBeVisible();
    const clear = noMatch.getByRole('button', { name: 'Clear filters' });
    await clear.focus();
    await page.keyboard.press('Enter');
    const links = noMatch.getByRole('table').getByRole('link');
    await expect(links).toHaveCount(3);
    await expect(clear).toHaveCount(0);
    await expect(links.first()).toBeFocused();
  });

  test('failed: the error notice in place; "Try again" loads (announced) and the rows arrive; focus stays in the list', async ({
    page,
  }) => {
    await ready(page, 'c-data-table-states');
    const failed = block(page, 'failed');
    // The DataTable's one container (the block holds its heading, then the table's container).
    const wrap = failed.locator(':scope > div');
    await expect(wrap).toHaveCount(1);
    await expect(wrap).not.toHaveAttribute('tabindex');
    const alert = failed.getByRole('alert');
    await expect(alert).toContainText('We couldn’t load the requests');
    await expect(alert).toContainText('Nothing has changed. Try again.');
    await expect(failed.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '#report-a-problem',
    );
    const status = failed.getByRole('status');
    await expect(status).toHaveText('');
    await failed.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Loading requests');
    await expect(failed.locator('[aria-busy="true"]')).toHaveCount(1);
    // The focused "Try again" went with its notice: the busy container holds focus
    // (tabindex=-1, not a Tab stop), not the page.
    await expect(wrap).toBeFocused();
    await expect(wrap).toHaveAttribute('tabindex', '-1');
    const links = failed.getByRole('table').getByRole('link');
    await expect(links).toHaveCount(3, { timeout: 5_000 });
    await expect(status).toHaveText('');
    await expect(failed.getByRole('alert')).toHaveCount(0);
    // The rows arrive in the same container, which keeps focus; Tab goes on to the first row and
    // the container is drawn as the boards draw it again.
    await expect(wrap).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(links.first()).toBeFocused();
    await expect(wrap).not.toHaveAttribute('tabindex');
  });

  test('changed and error rows are tinted (board 03 "Decision panel and editable table")', async ({
    page,
  }) => {
    await ready(page, 'c-data-table-states');
    const tints = await block(page, 'tints')
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) => [
          row.className,
          getComputedStyle(row.querySelector('td')!).backgroundColor,
        ]),
      );
    expect(tints).toEqual([
      ['', 'rgba(0, 0, 0, 0)'],
      ['is-changed', 'rgb(255, 251, 240)'],
      ['is-error', 'rgb(255, 247, 246)'],
      ['', 'rgba(0, 0, 0, 0)'],
    ]);
  });

  test('flush: the table sits in its section without a border of its own (B2-03)', async ({
    page,
  }) => {
    await ready(page, 'c-data-table-flush');
    const wrap = frame(page).locator('.xr-section .xr-table-wrap.xw-table-flush');
    await expect(wrap).toHaveCount(1);
    expect(await wrap.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('0px');
    await expect(
      frame(page)
        .getByRole('table', { name: 'Students given access under ACC-0107' })
        .getByRole('link'),
    ).toHaveCount(4);
  });
});

test.describe('Tabs (03, 11, 12 "Keyboard and focus", B7-02)', () => {
  test('status tabs: ← → move and select, Home/End, one tab stop; Tab enters the panel', async ({
    page,
  }) => {
    await ready(page, 'c-tabs');
    const tablist = frame(page).getByRole('tablist', { name: 'Show' });
    const all = tablist.getByRole('tab', { name: 'All 6' });
    await all.focus();
    await page.keyboard.press('ArrowRight');
    const active = tablist.getByRole('tab', { name: 'Access active 3' });
    await expect(active).toBeFocused();
    await expect(active).toHaveAttribute('aria-selected', 'true');
    await expect(all).toHaveAttribute('aria-selected', 'false');
    await expect(all).toHaveAttribute('tabindex', '-1');
    const panel = frame(page).getByRole('tabpanel', { name: 'Access active 3' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '3 of 6 institutions',
    );
    await expect(panel.getByRole('table').getByRole('link')).toHaveCount(3);

    // Tab enters the panel (VD-14 completion); Shift+Tab returns to the one selected tab.
    await page.keyboard.press('Tab');
    await expect(panel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('searchbox', { name: 'Search institutions' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(active).toBeFocused();

    await page.keyboard.press('End');
    const last = tablist.getByRole('tab', { name: 'No Institute Admin 1' });
    await expect(last).toBeFocused();
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(all).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(last).toBeFocused();
    await page.keyboard.press('Home');
    await expect(all).toBeFocused();
    await expect(frame(page).getByRole('tabpanel', { name: 'All 6' })).toBeVisible();
  });

  test('status tabs filter the list (B7-02): "Clear filters" returns to All; focus moves to the search, not the page', async ({
    page,
  }) => {
    await ready(page, 'c-tabs');
    const tablist = frame(page).getByRole('tablist', { name: 'Show' });
    await tablist.getByRole('tab', { name: 'Paused 1' }).click();
    const panel = frame(page).getByRole('tabpanel', { name: 'Paused 1' });
    await expect(panel.locator('.xr-toolbar-status [role="status"]')).toHaveText(
      '1 of 6 institutions',
    );
    const clear = frame(page).getByRole('button', { name: 'Clear filters' });
    await clear.focus();
    await page.keyboard.press('Enter');
    await expect(tablist.getByRole('tab', { name: 'All 6' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(clear).toHaveCount(0);
    // The focused button went away with the filter: ListToolbar moves focus to its first control.
    await expect(frame(page).getByRole('searchbox', { name: 'Search institutions' })).toBeFocused();
  });

  test('section tabs: links reached with Tab; the current one has aria-current and the gold rule', async ({
    page,
  }) => {
    await ready(page, 'c-tabs');
    const nav = frame(page).getByRole('navigation', { name: 'People sections' });
    const current = nav.getByRole('link', { name: 'Students 214' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    expect(
      await current.evaluate((element) => getComputedStyle(element, '::after').backgroundColor),
    ).toBe('rgb(233, 168, 37)');
    const stops = await expectNoInvisibleFocusTargets(page);
    for (const name of ['Students 214', 'Faculty 9', 'Groups', 'Faculty courses']) {
      expect(
        stops.some((stop) => stop.element.endsWith(`"${name}"`)),
        name,
      ).toBe(true);
    }
    const hub = frame(page).getByRole('navigation', { name: 'Shell-and-Tube Heat Exchanger' });
    await expect(hub).toHaveClass('xr-tabs xr-tabs--on-white xw-hubtabs');
    await expect(hub.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the current section tab is scrolled into view in a 375 strip (11 "Section tabs at 375 px")', async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) !== 1440,
      'The frame sets the content width; one viewport is enough.',
    );
    await ready(page, 'c-tabs-375', 343);
    const nav = frame(page).getByRole('navigation', { name: 'People sections' });
    const geometry = await nav.evaluate((strip) => {
      const tab = strip.querySelector('[aria-current="page"]')!;
      const [s, t] = [strip.getBoundingClientRect(), tab.getBoundingClientRect()];
      return {
        overflows: strip.scrollWidth > strip.clientWidth,
        scrollLeft: strip.scrollLeft,
        inView: t.left >= s.left && t.right <= s.right,
        name: tab.textContent,
      };
    });
    expect(geometry).toMatchObject({ overflows: true, inView: true, name: 'Faculty courses' });
    expect(geometry.scrollLeft).toBeGreaterThan(0);
    // The page itself did not scroll sideways or down to bring it into view.
    expect(await page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([0, 0]);
    // Tab reaches every tab, and the browser keeps the focused one in view.
    const stops = await expectNoInvisibleFocusTargets(page);
    for (const name of ['Students', 'Faculty', 'Groups', 'Faculty courses']) {
      expect(
        stops.some((stop) => stop.element.endsWith(`"${name}"`)),
        name,
      ).toBe(true);
    }
  });

  test('at the viewport’s own width the current section tab is fully in view', async ({ page }) => {
    await ready(page, 'c-tabs-375');
    const inView = await frame(page)
      .getByRole('navigation', { name: 'People sections' })
      .evaluate((strip) => {
        const tab = strip.querySelector('[aria-current="page"]')!;
        const [s, t] = [strip.getBoundingClientRect(), tab.getBoundingClientRect()];
        return t.left >= s.left && t.right <= s.right;
      });
    expect(inView).toBe(true);
  });
});

test.describe('Timeline (03 "Timeline · history last on a record")', () => {
  test('newest first as given; the latest dot is filled; the dots are hidden from screen readers', async ({
    page,
  }) => {
    await ready(page, 'c-timeline');
    const list = frame(page).getByRole('list', { name: 'Submission and review history' });
    await expect(list.getByRole('listitem')).toHaveCount(4);
    const dots = await list
      .locator('.xr-tl-dot')
      .evaluateAll((elements) =>
        elements.map((element) => [
          element.getAttribute('aria-hidden'),
          getComputedStyle(element).backgroundColor,
        ]),
      );
    expect(dots).toEqual([
      ['true', 'rgb(20, 27, 94)'],
      ['true', 'rgb(255, 255, 255)'],
      ['true', 'rgb(255, 255, 255)'],
      ['true', 'rgb(255, 255, 255)'],
    ]);
    await expect(list.getByRole('listitem').first()).toContainText('Approved by Academic Reviewer');
  });
});

test.describe('DecisionLayout + DecisionPanel (B1-11; 11 "Decisions"; AR-4)', () => {
  const jump = (page: Page) => frame(page).getByRole('link', { name: 'Go to decision' });
  const panel = (page: Page) => frame(page).getByRole('complementary', { name: 'Your decision' });
  const mainColumn = (page: Page) => frame(page).locator('.xr-decide > .xr-stack');

  test('at the viewport’s own width: "Go to decision" shows exactly below 860 px of content', async ({
    page,
  }) => {
    await ready(page, 'c-decision-layout');
    const below = (await contentWidth(page)) < DECISION_PANEL;
    if (below) {
      await expect(jump(page)).toBeVisible();
      await jump(page).focus();
      await page.keyboard.press('Enter');
      await settle(page);
      await expect(panel(page)).toBeFocused();
    } else {
      await expect(jump(page)).toBeHidden();
    }
  });

  test.describe('at set content widths', () => {
    test.skip(
      ({ viewport }) => viewport?.width !== 1440,
      'The frame sets the content width; one viewport is enough.',
    );

    test('859: the panel is under the content; Enter on "Go to decision" focuses the panel', async ({
      page,
    }) => {
      await ready(page, 'c-decision-layout', 859);
      const [main, aside, link] = [
        await box(mainColumn(page)),
        await box(panel(page)),
        await box(jump(page)),
      ];
      expect(aside.y).toBeGreaterThanOrEqual(main.y + main.height);
      expect(Math.round(aside.width)).toBe(859);
      // The jump sits at the top, before the content (after the page header).
      expect(link.y + link.height).toBeLessThanOrEqual(main.y);
      await jump(page).focus();
      await page.keyboard.press('Enter');
      await settle(page);
      await expect(panel(page)).toBeFocused();
      await expect(panel(page)).toBeInViewport();
      // `.xr-dpanel:focus` draws the outline (the panel is a focus target, not a tab stop).
      expect(await panel(page).evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
        'solid',
      );
      await expect(panel(page)).toHaveAttribute('tabindex', '-1');
    });

    test('860: content and panel side by side; the jump is not displayed nor a Tab stop; sticky', async ({
      page,
    }) => {
      await ready(page, 'c-decision-layout', 860);
      await expect(jump(page)).toBeHidden();
      const [main, aside] = [await box(mainColumn(page)), await box(panel(page))];
      expect(aside.x).toBeGreaterThanOrEqual(main.x + main.width);
      expect(Math.round(aside.y)).toBe(Math.round(main.y));
      // clamp(260px, 28%, 360px) of 860 = 260 … 360.
      expect(aside.width).toBeGreaterThanOrEqual(260);
      expect(aside.width).toBeLessThanOrEqual(360);
      expect(await panel(page).evaluate((element) => getComputedStyle(element).position)).toBe(
        'sticky',
      );
      const stops = await expectNoInvisibleFocusTargets(page);
      expect(stops.some((stop) => stop.element.includes('Go to decision'))).toBe(false);
    });

    test('static (xg-static, PROVISIONAL VD-05): the panel does not stick from 860', async ({
      page,
    }) => {
      await ready(page, 'c-decision-layout-static', 1112);
      expect(await panel(page).evaluate((element) => getComputedStyle(element).position)).toBe(
        'static',
      );
      await expect(jump(page)).toBeHidden();
    });

    test('static below 860: the jump still moves focus to the panel', async ({ page }) => {
      await ready(page, 'c-decision-layout-static', 600);
      await jump(page).focus();
      await page.keyboard.press('Enter');
      await settle(page);
      await expect(panel(page)).toBeFocused();
    });
  });
});
