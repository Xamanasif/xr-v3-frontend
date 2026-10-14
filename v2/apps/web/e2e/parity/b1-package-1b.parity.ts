import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { bootWorld } from '../support';
import { type CompareItem, expect, test } from './support';

/**
 * Phase-1 Package 1B: boards B1-01 (PU-01 Landing, PU-14), B1-02 (the area explorer), B1-03
 * (PU-02 / PU-03 / PU-05), B1-04 (PU-04 Catalogue) and B1-05 (PU-06 Experiment) against the
 * built public pages of the test-hook build, each frame at its drawn width × 900, on the
 * spine-start sample world, signed out (the public surface needs no session).
 *
 * Where the world holds the board's state the part is compared at the component tolerance; where
 * the world differs from the board's sample, the comparison names its register entry (DEV-27,
 * DEV-28; DEV-23 for the back icon; DEV-29 art; DEV-31 a whole frame's fractional height) —
 * measured, pinned and reported for the owner's review, never approved here. Since Package 1C the
 * drawn ways into the Selection render (DEV-26 is no longer observed): B1-01 "Mobile 375 · menu
 * open" draws one experiment in the selection, so its product page starts with one in the tab's
 * browser-session selection. Not compared
 * (no reachable product state): B1-01 "Areas loading → plain list" and "Area without artwork"
 * (every area has artwork; the plain list shows only while the courses load or fail — jsdom),
 * B1-02's nine-area proofs (test fixtures, not product data), B1-03 "All areas · loading",
 * "· failed", "Area without artwork" and "Course without a platform code" (a course the world does
 * not hold), B1-04 "Loading" and "Failed" (no fault seam in a browser build; jsdom).
 */
const SPINE_START = 'spine-start';
const FROZEN = new Date('2026-10-14T10:00:00+05:30');

/** A browser-session selection as the tab stores it (`xr.selection.v1`, ADR-0004 §2). */
const ONE_IN_SELECTION = JSON.stringify({
  items: [
    {
      experimentId: 'shell-and-tube-heat-exchanger',
      formats: ['web', 'vr'],
      addedAt: '2026-10-02T04:30:00.000Z',
    },
  ],
  lastRemoved: null,
  lastRemovedAt: null,
});

async function open(
  context: BrowserContext,
  width: number,
  path: string,
  ready: (page: Page) => Promise<void>,
  selection: string | null = null,
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  if (selection) {
    // The tab's browser session already holds this selection, as after adding on PU-06.
    await page.addInitScript(
      (value) => sessionStorage.setItem('xr.selection.v1', value),
      selection,
    );
  }
  await bootWorld(page, { fixture: SPINE_START, session: null });
  await page.goto(path);
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Nothing focused or hovered: the frames are drawn at rest. */
async function rest(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
}

function collector(testInfo: TestInfo) {
  const failures: string[] = [];
  return {
    failures,
    run: async (items: CompareItem[]) => {
      try {
        await compareAll({ expect, testInfo, kind: 'specimen', items });
      } catch (error) {
        failures.push(String((error as Error).message).split('\n')[0]!);
      }
    },
  };
}

const landingReady = async (page: Page) => {
  await expect(page.locator('.xp-ex-card.is-selected')).toBeVisible();
  await expect(page.locator('.xp-sec--tint .xp-card')).toHaveCount(4);
  await expect(page.locator('.xp-hero-cap')).toBeVisible();
  await expect(page.locator('.xp-fcard-n')).toHaveCount(4);
};
const areasReady = async (page: Page) => {
  await expect(page.locator('.xp-acard')).toHaveCount(3);
};
const areaReady = async (page: Page) => {
  await expect(page.locator('.xp-course')).toHaveCount(2);
};
const courseReady = async (page: Page) => {
  await expect(page.locator('.xp-erow')).toHaveCount(3);
};
const catalogueReady = async (page: Page) => {
  await expect(page.locator('.xp-erow-title a').first()).toBeVisible();
  await expect(page.locator('.xp-count')).not.toHaveText('');
};
const experimentReady = async (page: Page) => {
  await expect(page.locator('h1.xp-xtitle')).toBeVisible();
  await expect(page.locator('.xp-mini').first()).toBeVisible();
};

test.describe('B1-01 · PU-01 Landing and PU-14 on the built page', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-01-Public-Landing.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(5);
  });

  test('f0 · Landing · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/', landingReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-01-f0-header',
        reference: frame.locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
      },
      {
        name: 'b1-01-f0-hero-heading',
        reference: frame.locator('h1.xp-hero-h'),
        product: ours.locator('h1.xp-hero-h'),
      },
      {
        name: 'b1-01-f0-hero-lead',
        reference: frame.locator('.xp-hero-lead'),
        product: ours.locator('.xp-hero-lead'),
      },
      {
        name: 'b1-01-f0-hero-cta',
        reference: frame.locator('.xp-hero-text > a.xp-cta'),
        product: ours.locator('.xp-hero-text > a.xp-cta'),
      },
      {
        name: 'b1-01-f0-hero-paths',
        reference: frame.locator('ul.xp-paths'),
        product: ours.locator('ul.xp-paths'),
      },
      {
        name: 'b1-01-f0-hero-figure',
        reference: frame.locator('figure.xp-hero-fig'),
        product: ours.locator('figure.xp-hero-fig'),
        deviation: 'DEV-29',
      },
      {
        name: 'b1-01-f0-explorer-head',
        reference: frame.locator('section[aria-labelledby="L-ex-h"] .xp-sec-head'),
        product: ours.locator('section[aria-labelledby="landing-explore"] .xp-sec-head'),
      },
      {
        name: 'b1-01-f0-explorer',
        reference: frame.locator('.xp-ex'),
        product: ours.locator('.xp-ex'),
      },
      {
        name: 'b1-01-f0-featured-head',
        reference: frame.locator('.xp-sec--tint .xp-sec-head'),
        product: ours.locator('.xp-sec--tint .xp-sec-head'),
      },
      {
        name: 'b1-01-f0-featured-grid',
        reference: frame.locator('.xp-sec--tint .xp-grid'),
        product: ours.locator('.xp-sec--tint .xp-grid'),
      },
      {
        name: 'b1-01-f0-formats',
        reference: frame.locator('.xp-sec--lilac'),
        product: ours.locator('.xp-sec--lilac'),
        deviation: 'DEV-29',
      },
      {
        name: 'b1-01-f0-institutions-steps',
        reference: frame.locator('#for-institutions ol.xp-steps4'),
        product: ours.locator('#for-institutions ol.xp-steps4'),
      },
      {
        name: 'b1-01-f0-institutions',
        reference: frame.locator('#for-institutions'),
        product: ours.locator('#for-institutions'),
      },
      {
        name: 'b1-01-f0-band',
        reference: frame.locator('section.xp-band'),
        product: ours.locator('section.xp-band'),
      },
      {
        name: 'b1-01-f0-footer',
        reference: frame.locator('footer.xp-foot'),
        product: ours.locator('footer.xp-foot'),
      },
      {
        name: 'b1-01-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · Mobile 375 · top of page · f2 · menu open', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, '/', landingReady);
    await rest(ours);
    await run([
      {
        name: 'b1-01-f1-mobile-header',
        reference: frames.nth(1).locator('header.xp-head'),
        product: ours.locator('header.xp-head'),
      },
      {
        name: 'b1-01-f1-mobile-hero-heading',
        reference: frames.nth(1).locator('h1.xp-hero-h'),
        product: ours.locator('h1.xp-hero-h'),
      },
      {
        name: 'b1-01-f1-mobile-hero-cta',
        reference: frames.nth(1).locator('.xp-hero-text > a.xp-cta'),
        product: ours.locator('.xp-hero-text > a.xp-cta'),
      },
      {
        name: 'b1-01-f1-mobile-hero-figure',
        reference: frames.nth(1).locator('figure.xp-hero-fig'),
        product: ours.locator('figure.xp-hero-fig'),
      },
    ]);
    // f2 draws one experiment in the selection ("Selection 1"): a tab whose session holds one.
    const selected = await open(context, 375, '/', landingReady, ONE_IN_SELECTION);
    await selected.getByRole('button', { name: 'Menu' }).click();
    await expect(selected.locator('#public-menu')).toBeVisible();
    await rest(selected);
    await run([
      {
        name: 'b1-01-f2-menu-sheet',
        reference: frames.nth(2).locator('.xp-sheet'),
        product: selected.locator('.xp-sheet'),
      },
      {
        name: 'b1-01-f2-menu-list',
        reference: frames.nth(2).locator('ul.xp-sheet-list'),
        product: selected.locator('ul.xp-sheet-list'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-02 · the engineering-area explorer on the built landing', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-02-Area-Explorer.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(5);
  });

  for (const [index, width, label] of [
    [0, 1440, 'three areas · 1440'],
    [2, 375, 'mobile 375 · three areas'],
    [4, 768, 'tablet 768'],
  ] as const) {
    test(`f${index} · ${label}`, async ({ context }, testInfo) => {
      const { run, failures } = collector(testInfo);
      const ours = await open(context, width, '/', landingReady);
      await rest(ours);
      await run([
        {
          name: `b1-02-f${index}-explorer`,
          reference: frames.nth(index).locator('.xp-ex'),
          product: ours.locator('.xp-ex'),
        },
      ]);
      expect(failures).toEqual([]);
    });
  }
});

test.describe('B1-03 · PU-02, PU-03 and PU-05 on the built pages', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-03-Areas-and-Course.dc.html', {
      uncrop: true,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(10);
  });

  test('f0 · PU-02 All engineering areas · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/areas', areasReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-03-f0-page-header',
        reference: frame.locator('.xp-phead'),
        product: ours.locator('.xp-phead'),
      },
      {
        name: 'b1-03-f0-area-cards',
        reference: frame.locator('.xp-page .xp-grid'),
        product: ours.locator('.xp-page .xp-grid'),
      },
      {
        name: 'b1-03-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: 'DEV-31',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · PU-03 Engineering area · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/areas/mechanical-manufacturing', areaReady);
    await rest(ours);
    const frame = frames.nth(1);
    await run([
      {
        name: 'b1-03-f1-page-header',
        reference: frame.locator('.xp-phead'),
        product: ours.locator('.xp-phead'),
      },
      {
        name: 'b1-03-f1-courses',
        reference: frame.locator('.xp-page .xp-in'),
        product: ours.locator('.xp-page .xp-in'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f2 · PU-05 Course · 1440 · f9 · Course · mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const wide = await open(context, 1440, '/courses/thermodynamics-heat-transfer', courseReady);
    await rest(wide);
    const phone = await open(context, 375, '/courses/thermodynamics-heat-transfer', courseReady);
    await rest(phone);
    await run([
      {
        name: 'b1-03-f2-page-header',
        reference: frames.nth(2).locator('.xp-phead'),
        product: wide.locator('.xp-phead'),
      },
      {
        name: 'b1-03-f2-experiments',
        reference: frames.nth(2).locator('.xp-page .xp-in'),
        product: wide.locator('.xp-page .xp-in'),
        deviation: 'DEV-29',
      },
      {
        name: 'b1-03-f9-mobile-page-header',
        reference: frames.nth(9).locator('.xp-phead'),
        product: phone.locator('.xp-phead'),
      },
      {
        name: 'b1-03-f9-mobile-experiments',
        reference: frames.nth(9).locator('.xp-page .xp-in'),
        product: phone.locator('.xp-page .xp-in'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f7 · nothing published yet · f8 · not found (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const empty = await open(context, 720, '/courses/fluid-mechanics', async (page) => {
      await expect(page.locator('.xr-empty')).toBeVisible();
    });
    await rest(empty);
    const missing = await open(context, 720, '/areas/no-such-area', async (page) => {
      await expect(page.locator('.xr-msg')).toBeVisible();
    });
    await rest(missing);
    await run([
      {
        // The world's course with nothing published is Fluid Mechanics (no code); B1-03 draws
        // MEL ZG512 — only the empty block, the same words, is compared.
        name: 'b1-03-f7-nothing-published',
        reference: frames.nth(7).locator('.xr-section'),
        product: empty.locator('.xr-section'),
      },
      {
        name: 'b1-03-f8-not-found-message',
        reference: frames.nth(8).locator('.xr-msg'),
        product: missing.locator('.xr-msg'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-04 · PU-04 Catalogue on the built page', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-04-Catalogue.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(11);
  });

  test('f0 · Catalogue · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, '/experiments', catalogueReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-04-f0-page-header',
        reference: frame.locator('.xp-phead'),
        product: ours.locator('.xp-phead'),
      },
      {
        name: 'b1-04-f0-filters',
        reference: frame.locator('aside.xp-filters'),
        product: ours.locator('aside.xp-filters'),
      },
      {
        name: 'b1-04-f0-toolbar',
        reference: frame.locator('.xr-toolbar'),
        product: ours.locator('.xr-toolbar'),
      },
      {
        name: 'b1-04-f0-count',
        reference: frame.locator('.xr-toolbar-status'),
        product: ours.locator('.xr-toolbar-status'),
      },
      {
        name: 'b1-04-f0-rows',
        reference: frame.locator('ul.xp-erows'),
        product: ours.locator('ul.xp-erows'),
      },
      {
        name: 'b1-04-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · by area · f2 · by format · f3 · link adjusted (1080)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const byArea = await open(
      context,
      1080,
      '/experiments?area=mechanical-manufacturing',
      catalogueReady,
    );
    await rest(byArea);
    const byFormat = await open(context, 1080, '/experiments?format=vr', catalogueReady);
    await rest(byFormat);
    const adjusted = await open(
      context,
      1080,
      '/experiments?area=mechanical-manufacturing&area=retired-area',
      async (page) => {
        await catalogueReady(page);
        await expect(page.locator('.xr-notice')).toBeVisible();
      },
    );
    await rest(adjusted);
    await run([
      {
        name: 'b1-04-f1-filters',
        reference: frames.nth(1).locator('aside.xp-filters'),
        product: byArea.locator('aside.xp-filters'),
      },
      {
        name: 'b1-04-f1-count',
        reference: frames.nth(1).locator('.xr-toolbar-status'),
        product: byArea.locator('.xr-toolbar-status'),
      },
      {
        name: 'b1-04-f1-rows',
        reference: frames.nth(1).locator('ul.xp-erows'),
        product: byArea.locator('ul.xp-erows'),
      },
      {
        name: 'b1-04-f2-filters',
        reference: frames.nth(2).locator('aside.xp-filters'),
        product: byFormat.locator('aside.xp-filters'),
      },
      {
        name: 'b1-04-f2-rows',
        reference: frames.nth(2).locator('ul.xp-erows'),
        product: byFormat.locator('ul.xp-erows'),
      },
      {
        name: 'b1-04-f3-adjusted-notice',
        reference: frames.nth(3).locator('.xr-notice'),
        product: adjusted.locator('.xr-notice'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f4 · no results · f7 · by area view (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const none = await open(context, 720, '/experiments?q=forging', async (page) => {
      await expect(page.locator('.xr-empty')).toBeVisible();
    });
    await rest(none);
    const grouped = await open(context, 720, '/experiments?view=area', async (page) => {
      await expect(page.locator('.xp-group-h')).toHaveCount(3);
    });
    await rest(grouped);
    await run([
      {
        name: 'b1-04-f4-no-results',
        reference: frames.nth(4).locator('.xr-section'),
        product: none.locator('.xr-section'),
      },
      {
        name: 'b1-04-f4-count',
        reference: frames.nth(4).locator('.xr-toolbar-status'),
        product: none.locator('.xr-toolbar-status'),
      },
      {
        name: 'b1-04-f7-by-area',
        reference: frames.nth(7).locator('.xr-content'),
        product: grouped.locator('.xr-content'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f8 · mobile 375 · f9 · filter sheet · f10 · no results', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const phone = await open(context, 375, '/experiments', catalogueReady);
    await rest(phone);
    await run([
      {
        name: 'b1-04-f8-mobile-toolbar',
        reference: frames.nth(8).locator('.xr-toolbar'),
        product: phone.locator('.xr-toolbar'),
      },
      {
        name: 'b1-04-f8-mobile-rows',
        reference: frames.nth(8).locator('ul.xp-erows'),
        product: phone.locator('ul.xp-erows'),
      },
    ]);
    const sheet = await open(context, 375, '/experiments?format=vr', catalogueReady);
    await sheet.getByRole('button', { name: 'Filters (1)' }).click();
    await expect(sheet.locator('.xp-fsheet')).toBeVisible();
    await rest(sheet);
    const none = await open(context, 375, '/experiments?q=forging', async (page) => {
      await expect(page.locator('.xr-empty')).toBeVisible();
    });
    await rest(none);
    await run([
      {
        name: 'b1-04-f9-sheet-head',
        reference: frames.nth(9).locator('.xp-fsheet-head'),
        product: sheet.locator('.xp-fsheet-head'),
      },
      {
        name: 'b1-04-f9-sheet-foot',
        reference: frames.nth(9).locator('.xp-fsheet-foot'),
        product: sheet.locator('.xp-fsheet-foot'),
        deviation: 'DEV-30',
      },
      {
        name: 'b1-04-f9-sheet-format-facet',
        reference: frames.nth(9).locator('.xp-fsheet .xp-fgroup').nth(2),
        product: sheet.locator('.xp-fsheet .xp-fgroup').nth(2),
      },
      {
        name: 'b1-04-f10-mobile-no-results',
        reference: frames.nth(10).locator('.xr-section'),
        product: none.locator('.xr-section'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-05 · PU-06 Experiment on the built page', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-05-Experiment-Detail.dc.html', {
      uncrop: true,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(9);
  });

  const SHELL = '/experiments/shell-and-tube-heat-exchanger';

  test('f0 · Experiment · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, SHELL, experimentReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-05-f0-hero-text',
        reference: frame.locator('.xp-xtext'),
        product: ours.locator('.xp-xtext'),
      },
      {
        name: 'b1-05-f0-hero-art',
        reference: frame.locator('figure.xp-xart'),
        product: ours.locator('figure.xp-xart'),
      },
      {
        name: 'b1-05-f0-crumbs',
        reference: frame.locator('.xp-xhero ol.xp-crumbs'),
        product: ours.locator('.xp-xhero ol.xp-crumbs'),
      },
      {
        name: 'b1-05-f0-panel',
        reference: frame.locator('aside.xp-panel'),
        product: ours.locator('aside.xp-panel'),
      },
      {
        name: 'b1-05-f0-outcomes',
        reference: frame.locator('.xp-xmain > section').nth(0),
        product: ours.locator('.xp-xmain > section').nth(0),
      },
      {
        name: 'b1-05-f0-formats',
        reference: frame.locator('.xp-xmain > section').nth(1),
        product: ours.locator('.xp-xmain > section').nth(1),
      },
      {
        // The large crop hides one changed sentence under the tolerance: the VR cell alone.
        name: 'b1-05-f0-formats-vr-how-it-runs',
        reference: frame.locator('.xp-ftable tbody tr').nth(2).locator('td').nth(1),
        product: ours.locator('.xp-ftable tbody tr').nth(2).locator('td').nth(1),
        deviation: 'DEV-28',
      },
      {
        name: 'b1-05-f0-preview',
        reference: frame.locator('.xp-xmain > section').nth(2),
        product: ours.locator('.xp-xmain > section').nth(2),
        deviation: 'DEV-27',
      },
      {
        name: 'b1-05-f0-aside',
        reference: frame.locator('aside.xp-xside'),
        product: ours.locator('aside.xp-xside'),
      },
      {
        name: 'b1-05-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-27', 'DEV-28', 'DEV-31'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('panel states (720): in your selection · validation · change formats · not found', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 720, SHELL, experimentReady);
    const panel = ours.locator('aside.xp-panel');
    // f2 · Validation · no format chosen.
    await panel.getByRole('button', { name: 'Add to selection' }).click();
    await expect(panel.getByRole('alert')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-05-f2-validation-panel',
        reference: frames.nth(2).locator('aside.xp-panel'),
        product: panel,
      },
    ]);
    // f1 · In your selection (WEB + VR).
    await panel.getByText('Browser').click();
    await panel.getByText('Virtual reality').click();
    await panel.getByRole('button', { name: 'Add to selection' }).click();
    await expect(panel.locator('.xp-insel')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-05-f1-in-selection-panel',
        reference: frames.nth(1).locator('aside.xp-panel'),
        product: panel,
      },
      {
        name: 'b1-05-f1-in-selection-status',
        reference: frames.nth(1).locator('.xp-insel'),
        product: panel.locator('.xp-insel'),
      },
    ]);
    // f3 · Change formats.
    await panel.getByRole('button', { name: 'Change formats' }).click();
    await expect(panel.getByRole('button', { name: 'Update selection' })).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-05-f3-change-formats-panel',
        reference: frames.nth(3).locator('aside.xp-panel'),
        product: panel,
      },
    ]);
    const missing = await open(context, 720, '/experiments/no-such-experiment', async (page) => {
      await expect(page.locator('.xr-msg')).toBeVisible();
    });
    await rest(missing);
    await run([
      {
        name: 'b1-05-f4-not-found-message',
        reference: frames.nth(4).locator('.xr-msg'),
        product: missing.locator('.xr-msg'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f5 · arrived with a format filter · f6 · poster only (1080)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1080, `${SHELL}?format=vr`, experimentReady);
    await rest(ours);
    await run([
      {
        name: 'b1-05-f5-back-link',
        reference: frames.nth(5).locator('.xp-xhero a.xr-back'),
        product: ours.locator('.xp-xhero a.xr-back'),
        deviation: 'DEV-23',
      },
      {
        name: 'b1-05-f5-panel',
        reference: frames.nth(5).locator('aside.xp-panel'),
        product: ours.locator('aside.xp-panel'),
      },
      {
        name: 'b1-05-f5-formats',
        reference: frames.nth(5).locator('.xp-xmain > section').nth(1),
        product: ours.locator('.xp-xmain > section').nth(1),
        deviation: 'DEV-28',
      },
      {
        name: 'b1-05-f6-poster',
        reference: frames.nth(6).locator('.xp-xmain > section').nth(2),
        product: ours.locator('.xp-xmain > section').nth(2),
        deviation: 'DEV-29',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f7 · mobile 375 · f8 · in your selection', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, SHELL, experimentReady);
    await rest(ours);
    const panel = ours.locator('aside.xp-panel');
    await run([
      {
        name: 'b1-05-f7-mobile-hero-text',
        reference: frames.nth(7).locator('.xp-xtext'),
        product: ours.locator('.xp-xtext'),
      },
      {
        name: 'b1-05-f7-mobile-panel',
        reference: frames.nth(7).locator('aside.xp-panel'),
        product: panel,
      },
    ]);
    await panel.getByText('Browser').click();
    await panel.getByText('Virtual reality').click();
    await panel.getByRole('button', { name: 'Add to selection' }).click();
    await expect(panel.locator('.xp-insel')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-05-f8-mobile-in-selection-panel',
        reference: frames.nth(8).locator('aside.xp-panel'),
        product: panel,
      },
    ]);
    expect(failures).toEqual([]);
  });
});
