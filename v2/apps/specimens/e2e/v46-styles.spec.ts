import { expect, test, type Page } from '@playwright/test';
import { expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from '@xr/ui';

/**
 * Computed styles of `@xr/ui/styles.css` in a real browser (WP-0.5 acceptance 2; Appendix E
 * §2.2–§2.3, §6, §7). The `v46-*` specimens are static board excerpts; each test names the
 * product-layer entry (PF-xx) or v46 rule it proves. Without `?width=` the frame fills the
 * viewport, so the four approved viewports (1440, 1024, 768, 375) are the app widths.
 */

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

/**
 * Lets running transitions finish. With reduced motion the v46 backstop
 * `*{transition-duration:.01ms!important}` makes EVERY property change a (very short) transition
 * (transition-property defaults to `all`), so a computed value read in the same frame as a focus
 * or scroll change is still the old one.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

/** Opens a specimen with reduced motion (the v46 backstop keeps changes instant) and settles. */
async function open(page: Page, path: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await settle(page);
}

const style = (page: Page, probe: string, property: string) =>
  page
    .locator(`[data-probe="${probe}"]`)
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

const appWidth = (page: Page) =>
  page.locator('[data-probe="app"]').evaluate((element) => element.getBoundingClientRect().width);

/** Presses Tab until `probe` has focus (a keyboard walk, so :focus-visible applies). */
async function tabTo(page: Page, probe: string): Promise<void> {
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press('Tab');
    await settle(page);
    if (
      await page.evaluate(
        (name) => document.activeElement?.getAttribute('data-probe') === name,
        probe,
      )
    )
      return;
  }
  throw new Error(`Tab never reached [data-probe="${probe}"]`);
}

/** WCAG relative-luminance contrast of two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((index) => {
      const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

test.describe('v46 foundation (xr-foundation.css body; single xr.v46 layer)', () => {
  test('body: canvas #F4F5FB, ink #12173F, the Public Sans stack', async ({ page }) => {
    await open(page, '/v46-foundation');
    const body = await page.evaluate(() => {
      const computed = getComputedStyle(document.body);
      return [computed.backgroundColor, computed.color, computed.fontFamily, computed.margin];
    });
    expect(body).toEqual([
      rgb('#F4F5FB'),
      rgb('#12173F'),
      '"Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
      '0px',
    ]);
  });

  test('a disabled or busy delete button is #5C6389, not the delete red (one shared layer)', async ({
    page,
  }) => {
    await open(page, '/v46-foundation');
    expect(await style(page, 'delete', 'color')).toBe(rgb('#B42318'));
    expect(await style(page, 'delete-aria-disabled', 'color')).toBe(rgb('#5C6389'));
    expect(await style(page, 'delete-disabled', 'color')).toBe(rgb('#5C6389'));
  });

  test('PF-13: the four non-token literals are named --xr-x-* on :root', async ({ page }) => {
    await open(page, '/v46-foundation');
    const literals = await page.evaluate(() =>
      ['--xr-x-skel', '--xr-x-err-line', '--xr-x-danger-hover', '--xr-x-paused-line'].map((name) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim().toLowerCase(),
      ),
    );
    expect(literals).toEqual(['#e6e8f3', '#f3c4bf', '#8f1c13', '#e8d3a3']);
  });

  test('type scale: H1 32/40, phone scale 26/34 below 600 app width (T-6)', async ({ page }) => {
    await open(page, '/v46-foundation');
    const phone = (await appWidth(page)) < V46_CONTAINER_THRESHOLDS.phone.px;
    expect([await style(page, 'h1', 'font-size'), await style(page, 'h1', 'line-height')]).toEqual(
      phone ? ['26px', '34px'] : ['32px', '40px'],
    );
  });

  test('Public Sans loads from the boards’ Google Fonts link where the network allows', async ({
    page,
  }) => {
    const fontCss = page.waitForResponse((response) =>
      response.url().startsWith('https://fonts.googleapis.com/css2?family=Public+Sans'),
    );
    await open(page, '/v46-foundation');
    const response = await Promise.race([
      fontCss,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    test.skip(
      !response || !response.ok(),
      `Google Fonts did not answer (${response?.status() ?? 'no response'}): Public Sans loading cannot be verified on this machine — a limitation, not a pass.`,
    );
    const fonts = await page.evaluate(async () => {
      const faces = await document.fonts.load('16px "Public Sans"');
      const bold = await document.fonts.load('700 16px "Public Sans"');
      return {
        regular: faces.map((face) => face.status),
        bold: bold.map((face) => face.status),
        check: document.fonts.check('16px "Public Sans"'),
      };
    });
    expect(fonts.regular.length).toBeGreaterThan(0);
    expect([...fonts.regular, ...fonts.bold].every((status) => status === 'loaded')).toBe(true);
    expect(fonts.check).toBe(true);
  });
});

test.describe('v46 workspace shell (PF-02, PF-03, PF-07; Appendix E §6.1)', () => {
  test('PF-02: the app root is at least the viewport tall, and the page scrolls naturally', async ({
    page,
  }) => {
    await open(page, '/v46-drawer-shell');
    const result = await page.evaluate(() => {
      const app = document.querySelector('[data-probe="app"]')!;
      return {
        appHeight: app.getBoundingClientRect().height,
        minHeight: getComputedStyle(app).minHeight,
        appOverflow: getComputedStyle(app).overflowY,
        viewport: window.innerHeight,
        documentScrolls: document.scrollingElement!.scrollHeight > window.innerHeight,
      };
    });
    expect(result.minHeight).toBe(`${result.viewport}px`);
    expect(result.appHeight).toBeGreaterThanOrEqual(result.viewport);
    expect(result.appOverflow).toBe('visible');
    expect(result.documentScrolls).toBe(true);
  });

  test('PF-03: below 1024 the open drawer and its scrim are fixed to the viewport', async ({
    page,
  }) => {
    await open(page, '/v46-drawer-shell');
    const drawer = (await appWidth(page)) < V46_CONTAINER_THRESHOLDS.sidebar.px;
    if (!drawer) {
      // From 1024 the same markup is the sidebar column (v46), and the scrim is not displayed.
      expect(await style(page, 'side', 'position')).toBe('relative');
      expect(await style(page, 'scrim', 'display')).toBe('none');
      return;
    }
    expect(await style(page, 'side', 'position')).toBe('fixed');
    expect(await style(page, 'scrim', 'position')).toBe('fixed');
    await page.evaluate(() => window.scrollTo(0, 1200));
    const boxes = await page.evaluate(() =>
      ['side', 'scrim'].map((probe) => {
        const box = document.querySelector(`[data-probe="${probe}"]`)!.getBoundingClientRect();
        return [Math.round(box.top), Math.round(box.bottom)];
      }),
    );
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const viewport = await page.evaluate(() => window.innerHeight);
    expect(boxes).toEqual([
      [0, viewport],
      [0, viewport],
    ]);
  });

  test('PF-07: a focused sidebar link has the gold ring #F7C95B (≥ 3:1 on navy); the page keeps #1F4FD8', async ({
    page,
  }) => {
    await open(page, '/v46-drawer-shell');
    await tabTo(page, 'nav-home');
    expect(await style(page, 'nav-home', 'outline-color')).toBe(rgb(V46_FOCUS_COLOURS.focusDark));
    expect(await style(page, 'nav-home', 'outline-style')).toBe('solid');
    expect(await style(page, 'side', 'background-color')).toBe(rgb('#141B5E'));
    expect(contrast(V46_FOCUS_COLOURS.focusDark, '#141B5E')).toBeGreaterThanOrEqual(3);
    expect(contrast(V46_FOCUS_COLOURS.focus, '#141B5E')).toBeLessThan(3); // the defect PF-07 fixes
    await tabTo(page, 'page-link');
    expect(await style(page, 'page-link', 'outline-color')).toBe(rgb(V46_FOCUS_COLOURS.focus));
  });

  test('responsive shell: Menu and drawer below 1024, rail to 1279, full sidebar from 1280', async ({
    page,
  }) => {
    await open(page, '/v46-drawer-shell');
    const width = await appWidth(page);
    const menu = await page
      .locator('.xr-menu-btn')
      .evaluate((element) => getComputedStyle(element).display);
    const side = await page
      .locator('[data-probe="side"]')
      .evaluate((element) => element.getBoundingClientRect().width);
    if (width < V46_CONTAINER_THRESHOLDS.sidebar.px) {
      expect(menu).not.toBe('none');
    } else {
      expect(menu).toBe('none');
      expect(side).toBe(width < V46_CONTAINER_THRESHOLDS.fullSidebar.px ? 72 : 248);
    }
  });
});

test.describe('PF-01: no control stays focusable in a clipped table header', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'The frame sets the content width; one viewport is enough.',
  );

  const visible = (page: Page, probe: string) =>
    page
      .locator(`[data-probe="${probe}"]`)
      .evaluate((element) => getComputedStyle(element).display !== 'none');

  for (const width of [343, 599, 600, 759, 760, 1112]) {
    test(`content width ${width}`, async ({ page }) => {
      await open(page, `/v46-tables?width=${width}`);
      // Thresholds of the v46 clip rules: .xr-table and .xp-ftable below 760, .xp-compare below 600.
      expect(await visible(page, 'xr-table-sort')).toBe(
        width >= V46_CONTAINER_THRESHOLDS.labelledRows.px,
      );
      expect(await visible(page, 'xp-ftable-control')).toBe(
        width >= V46_CONTAINER_THRESHOLDS.labelledRows.px,
      );
      expect(await visible(page, 'xp-compare-control')).toBe(
        width >= V46_CONTAINER_THRESHOLDS.phone.px,
      );
      await expectNoInvisibleFocusTargets(page);
    });
  }

  test('negative control: without the guard the B1-10 header button is an invisible focus target', async ({
    page,
  }) => {
    await open(page, '/v46-tables?width=343');
    // An inline !important outranks every layered declaration — it stands in for "no PF-01 rule".
    await page
      .locator('[data-probe="xr-table-sort"]')
      .evaluate((element) =>
        (element as HTMLElement).style.setProperty('display', 'inline-flex', 'important'),
      );
    await expect(expectNoInvisibleFocusTargets(page)).rejects.toThrow();
  });
});

test.describe('v46 public root (PF-02, PF-05, PF-06; VD-23 provisional)', () => {
  test('PF-06: the public root clips with overflow:clip and is not a scroll container', async ({
    page,
  }) => {
    await open(page, '/v46-public-page');
    expect(await style(page, 'xp', 'overflow')).toBe('clip');
    const result = await page.evaluate(() => {
      const xp = document.querySelector('[data-probe="xp"]')!;
      return {
        xpHeight: xp.getBoundingClientRect().height,
        viewport: window.innerHeight,
        minHeight: getComputedStyle(xp).minHeight,
      };
    });
    // PF-02 (public part): the root is at least the viewport tall.
    expect(result.minHeight).toBe(`${result.viewport}px`);
    expect(result.xpHeight).toBeGreaterThanOrEqual(result.viewport);
  });

  test('PF-06: below 1024 the bottom bar sticks to the viewport bottom while the page scrolls', async ({
    page,
  }) => {
    await open(page, '/v46-public-page');
    const xpWidth = await page
      .locator('[data-probe="xp"]')
      .evaluate((element) => element.getBoundingClientRect().width);
    const display = await style(page, 'bottombar', 'display');
    if (xpWidth >= V46_CONTAINER_THRESHOLDS.sidebar.px) {
      // From 1024 xp the Selection summary is a side panel; the bar is not displayed (v46).
      expect(display).toBe('none');
      return;
    }
    expect(await style(page, 'bottombar', 'position')).toBe('sticky');
    await page.evaluate(() => window.scrollTo(0, 600));
    const bar = await page.evaluate(() => ({
      bottom: Math.round(
        document.querySelector('[data-probe="bottombar"]')!.getBoundingClientRect().bottom,
      ),
      viewport: window.innerHeight,
    }));
    expect(bar.bottom).toBe(bar.viewport);
  });

  test('PF-05: the open menu’s scrim is fixed to the viewport below the header, under the sheet', async ({
    page,
  }) => {
    await open(page, '/v46-public-menu');
    expect(await style(page, 'scrim', 'position')).toBe('fixed');
    const boxes = await page.evaluate(() => {
      const box = (probe: string) =>
        document.querySelector(`[data-probe="${probe}"]`)!.getBoundingClientRect();
      return {
        headBottom: Math.round(box('head').bottom),
        scrimTop: Math.round(box('scrim').top),
        scrimBottom: Math.round(box('scrim').bottom),
        viewport: window.innerHeight,
        scrimZ: getComputedStyle(document.querySelector('[data-probe="scrim"]')!).zIndex,
        sheetZ: getComputedStyle(document.querySelector('[data-probe="sheet"]')!).zIndex,
      };
    });
    // Header is 76 px tall (64 below 600 xp) plus its 1 px border, which the scrim covers as drawn.
    expect(boxes.scrimTop).toBe(boxes.headBottom - 1);
    expect(boxes.scrimBottom).toBe(boxes.viewport);
    expect([boxes.scrimZ, boxes.sheetZ]).toEqual(['29', '31']);
    // The Close button stays above the scrim (it is what a pointer reaches at its centre).
    const menu = page.locator('[data-probe="menu-btn"]');
    if (await menu.isVisible()) {
      const hit = await menu.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const target = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return element.contains(target);
      });
      expect(hit).toBe(true);
    }
  });

  test('PF-05: the catalogue filter sheet is a viewport-fixed modal layer', async ({ page }) => {
    await open(page, '/v46-public-filters');
    expect(await style(page, 'fsheet', 'position')).toBe('fixed');
    await page.evaluate(() => window.scrollTo(0, 900));
    const box = await page.evaluate(() => {
      const rect = document.querySelector('[data-probe="fsheet"]')!.getBoundingClientRect();
      return [Math.round(rect.top), Math.round(rect.bottom), window.innerHeight];
    });
    expect([box[0], box[1]]).toEqual([0, box[2]]);
  });
});

test.describe('PF-11: focus is never hidden under the focused-task bar', () => {
  /**
   * For each answer: put it 20 px below the viewport top — under the sticky bar, yet "in view" —
   * focus the next answer, and press Shift+Tab. Returns the answers left hidden under the bar
   * (WCAG 2.4.11 Focus Not Obscured: the case a plain scroll-into-view does not catch).
   */
  async function hiddenUnderBar(page: Page): Promise<string[]> {
    const hidden: string[] = [];
    for (let n = 4; n >= 1; n -= 1) {
      await page.locator(`[data-probe="answer-${n + 1}"]`).evaluate((element) => {
        (element as HTMLElement).focus({ preventScroll: true });
      });
      await page.locator(`[data-probe="answer-${n}"]`).evaluate((element) => {
        window.scrollBy(0, element.getBoundingClientRect().top - 20);
      });
      await settle(page);
      await page.keyboard.press('Shift+Tab');
      await settle(page);
      const stop = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        const bar = document.querySelector('[data-probe="bar"]')!;
        return {
          name: active.getAttribute('data-probe') ?? active.tagName,
          top: active.getBoundingClientRect().top,
          barBottom: bar.getBoundingClientRect().bottom,
        };
      });
      expect(stop.name).toBe(`answer-${n}`);
      if (stop.top < stop.barBottom) hidden.push(`${stop.name} at ${Math.round(stop.top)}`);
    }
    return hidden;
  }

  test('Shift+Tab up the page never leaves a focused answer under the sticky bar', async ({
    page,
  }) => {
    await open(page, '/v46-focused-task');
    expect(await style(page, 'bar', 'position')).toBe('sticky');
    expect(await hiddenUnderBar(page)).toEqual([]);
  });

  test('the root scroll padding (113 px) applies only while focus is in the task page', async ({
    page,
  }) => {
    await open(page, '/v46-focused-task');
    const padding = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);
    expect(await padding()).toBe('auto');
    await page.locator('[data-probe="answer-2"]').focus();
    await settle(page);
    expect(await padding()).toBe('113px');
    await page.locator('.xr-back').focus();
    await settle(page);
    expect(await padding()).toBe('auto');
    // v46 keeps its own question-card offset.
    expect(
      await page
        .locator('.xa-q')
        .first()
        .evaluate((element) => getComputedStyle(element).scrollMarginTop),
    ).toBe('72px');
  });

  test('focus moving into the bar itself does not scroll the page', async ({ page }) => {
    await open(page, '/v46-focused-task');
    await page.locator('[data-probe="answer-5"]').focus();
    await page.evaluate(() => window.scrollTo(0, 900));
    await settle(page);
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.down('Shift');
    await page.locator('.xr-back').focus();
    await page.keyboard.up('Shift');
    await settle(page);
    expect(before).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('Shift+Tab onto an answer-strip link under the bar clears it too', async ({ page }) => {
    await open(page, '/v46-focused-task');
    await page.locator('[data-probe="strip-6"]').evaluate((element) => {
      window.scrollBy(0, element.getBoundingClientRect().top - 20);
    });
    await page.locator('[data-probe="card-1"] textarea').evaluate((element) => {
      (element as HTMLElement).focus({ preventScroll: true });
    });
    await page.keyboard.press('Shift+Tab');
    await settle(page);
    const stop = await page.evaluate(() => ({
      name: document.activeElement?.getAttribute('data-probe'),
      top: document.activeElement!.getBoundingClientRect().top,
      barBottom: document.querySelector('[data-probe="bar"]')!.getBoundingClientRect().bottom,
    }));
    expect(stop.name).toBe('strip-6');
    expect(stop.top).toBeGreaterThanOrEqual(stop.barBottom);
  });

  test('an answer-strip jump still lands the card where v46 puts it (72 px)', async ({ page }) => {
    await open(page, '/v46-focused-task');
    await page.locator('[data-probe="strip-3"]').click();
    await settle(page);
    expect(
      await page
        .locator('#q3')
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    ).toBe(72);
    await open(page, '/v46-focused-task');
    await page.locator('[data-probe="strip-4"]').focus();
    await page.keyboard.press('Enter');
    await settle(page);
    expect(
      await page
        .locator('#q4')
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    ).toBe(72);
  });

  test('negative control: without the PF-11 padding, focus lands under the bar', async ({
    page,
  }) => {
    await open(page, '/v46-focused-task');
    await page.evaluate(() =>
      document.documentElement.style.setProperty('scroll-padding-top', '0px', 'important'),
    );
    expect((await hiddenUnderBar(page)).length).toBeGreaterThan(0);
  });
});

test.describe('PF-04: native dialogs, aligned to the viewport (VD-08 provisional mapping)', () => {
  const ALIGNS = ['centre', 'start', 'end', 'decision', 'marks'] as const;

  for (const align of ALIGNS) {
    test(`${align}`, async ({ page }) => {
      await open(page, `/v46-dialog-${align}`);
      const dialog = page.locator('[data-probe="dialog"]');
      await expect(dialog).toHaveJSProperty('open', true);
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      expect(await style(page, 'dialog', 'position')).toBe('fixed');

      const width = await appWidth(page);
      const box = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          viewport: window.innerHeight,
        };
      });
      const buttons = await page.evaluate(() =>
        ['cancel', 'confirm'].map((probe) => {
          const rect = document.querySelector(`[data-probe="${probe}"]`)!.getBoundingClientRect();
          return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
        }),
      );
      const [cancel, confirm] = buttons as [
        { top: number; bottom: number },
        { top: number; bottom: number },
      ];

      if (width < V46_CONTAINER_THRESHOLDS.phone.px) {
        // Bottom sheet whatever the alignment: full width less the 16 px gutters, 16 px from the
        // bottom, buttons stacked with the confirming action on top (board 10, 375 frame).
        expect([box.left, box.width, box.bottom]).toEqual([
          16,
          Math.round(width) - 32,
          box.viewport - 16,
        ]);
        expect(confirm.bottom).toBeLessThanOrEqual(cancel.top);
        return;
      }
      expect(box.width).toBe(520);
      expect(Math.abs(box.left - (width - 520) / 2)).toBeLessThanOrEqual(1);
      expect(confirm.top).toBe(cancel.top); // one row from 600
      const top =
        align === 'start' ||
        (align === 'decision' && width >= 908) ||
        (align === 'marks' && width >= V46_CONTAINER_THRESHOLDS.sidebar.px);
      const bottom = align === 'end' || align === 'decision' || align === 'marks';
      if (top) expect(box.top).toBe(88);
      else if (bottom) expect(box.bottom).toBe(box.viewport - 88);
      else expect(Math.abs(box.top - (box.viewport - box.height) / 2)).toBeLessThanOrEqual(1);
    });
  }
});
