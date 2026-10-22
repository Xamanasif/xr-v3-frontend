import { expect, type Page, test } from '@playwright/test';

import { expectNoAxeViolations, reachAndClick } from '../support';
import { checkLanding } from '../support/landing';

/**
 * PU-01 Landing with PU-14 — the V1 Direction B2 landing (owner-authorised prompt 13), at the four
 * approved widths: the frozen section order and geometry, the owner's additions, every link to an
 * existing route, the hero's rotation and Pause/Play, the explorer, the story's scroll and tap
 * modes, the format previews, reduced motion, the accessibility checks every built state passes,
 * and the landing's isolation from the other public pages.
 *
 * The reference is `21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html`
 * (SHA-256 3dbe9412…4d07c), measured in its own design host (PUBLIC-LANDING-INTEGRATION-PLAN §2.1;
 * `frozen-probe.json`): section heights below are its numbers.
 */

const width = (page: Page) => page.viewportSize()?.width ?? 0;
const band = (page: Page) =>
  width(page) < 560 ? 'phone' : width(page) < 1024 ? 'narrow' : width(page) < 1300 ? 'mid' : 'wide';

/** Frozen section heights (frozen-probe.json), by the landing's sample widths. */
const FROZEN_HEIGHTS: Record<number, Record<string, number>> = {
  1440: {
    Introduction: 754,
    Featured: 866,
    Explore: 937,
    Story: 2438,
    Formats: 731,
    Academic: 636,
    Access: 635,
    Closing: 266,
    Footer: 122,
  },
  1024: {
    Introduction: 703,
    Featured: 1337,
    Explore: 877,
    Story: 2467,
    Formats: 815,
    Academic: 840,
    Access: 659,
    Closing: 266,
    Footer: 150,
  },
  768: {
    Introduction: 990,
    Featured: 1352,
    Explore: 997,
    Story: 2241,
    Formats: 1037,
    Academic: 913,
    Access: 759,
    Closing: 273,
    Footer: 212,
  },
  375: {
    Introduction: 954,
    Featured: 1124,
    Explore: 986,
    Story: 816,
    Formats: 846,
    Academic: 1142,
    Access: 1056,
    Closing: 245,
    Footer: 223,
  },
};

/**
 * Where the owner's decisions change a height (22 Oct 2026, plan §8): the request button under
 * PU-14 (D-5: its 44 / 28 px space and 56 px height); the Pause button shown at phone width (D-8:
 * a 44 px row and the 10 px gap); the durations hidden (D-7: at 375 px the chips no longer wrap
 * under them, 23 px a card); the shorter product name (D-4: the 1024 px footer note has room for
 * one line fewer).
 */
const OWNER_DELTAS: Record<number, Record<string, number>> = {
  1440: { Access: 100 },
  1024: { Access: 100, Footer: -17 },
  768: { Access: 100 },
  375: { Access: 84, Introduction: 54, Featured: -92 },
};

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.pl1-root[data-intro]')).toBeAttached();
  await expect(page.getByRole('heading', { level: 3, name: 'CNC Turning Centre' })).toBeAttached();
}

async function sectionHeights(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => {
    const names = [
      'Introduction',
      'Featured',
      'Explore',
      'Story',
      'Formats',
      'Academic',
      'Access',
      'Closing',
    ];
    const boxes = [...document.querySelectorAll('.pl1 main > section')].map((section) =>
      Math.round(section.getBoundingClientRect().height),
    );
    const out: Record<string, number> = Object.fromEntries(names.map((n, i) => [n, boxes[i]!]));
    out.Footer = Math.round(document.querySelector('.pl1 footer')!.getBoundingClientRect().height);
    return out;
  });
}

test.describe('PU-01 V1 landing — the page', () => {
  test('frozen order and geometry; the owner’s additions; no sideways scroll; the accessibility checks', async ({
    page,
  }) => {
    await open(page);
    const frozen = FROZEN_HEIGHTS[width(page)]!;
    const deltas = OWNER_DELTAS[width(page)] ?? {};
    const heights = await sectionHeights(page);
    for (const [name, value] of Object.entries(frozen)) {
      expect(heights[name], name).toBe(value + (deltas[name] ?? 0));
    }
    // The header: 76 px, 60 px at phone width; sticky.
    const header = page.getByRole('banner');
    expect((await header.boundingBox())!.height).toBe(width(page) < 560 ? 60 : 76);
    await page.evaluate(() => window.scrollTo(0, 2400));
    await expect.poll(async () => (await header.boundingBox())!.y).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    // The official lockup at its frozen box; Public Sans loaded.
    const logo = header.getByRole('img', {
      name: 'BITS Pilani Work Integrated Learning Programmes',
    });
    expect(
      await logo.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]),
    ).toEqual([632, 316]);
    const box = (await logo.boundingBox())!;
    expect([box.width, box.height]).toEqual(width(page) < 560 ? [48, 24] : [68, 34]);
    expect(await page.evaluate(() => document.fonts.check('700 16px "Public Sans"'))).toBe(true);
    // The product name (D-4) and Sign in (D-3), in the header at every width.
    await expect(header).toContainText('XR Learning Platform');
    await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Featured', exact: true })).toBeVisible({
      visible: width(page) >= 1024,
    });
    // The frozen entry fade of the story's index (see checkLanding): faint until the stage pins.
    if (width(page) >= 560) await expect(page.locator('.pl1-idx')).toHaveCSS('opacity', '0.25');
    await checkLanding(page);
  });

  test('the frozen type and colour at this width (isolation from the v46 and V3 sheets)', async ({
    page,
  }) => {
    await open(page);
    const style = (selector: string, property: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);
    const h1 = { wide: '56px', mid: '46px', narrow: '46px', phone: '31px' }[band(page)];
    expect(await style('.pl1-h1', 'font-size')).toBe(h1);
    expect(await style('.pl1-h1', 'font-family')).toContain('Public Sans');
    expect(await style('.pl1-hdr', 'background-color')).toBe('rgb(20, 27, 94)');
    expect(await style('#featured', 'background-color')).toBe('rgb(244, 245, 251)');
    expect(await style('#featured .pl1-h2', 'font-size')).toBe(
      { wide: '46px', mid: '46px', narrow: '36px', phone: '30px' }[band(page)],
    );
    expect(await style('.pl1-headcta', 'background-color')).toBe('rgb(233, 168, 37)');
    // The frozen design host has no border-box reset (content-box), the UA's border-box on buttons.
    expect(await style('.pl1-stage', 'box-sizing')).toBe('content-box');
    expect(await style('.pl1-pick', 'box-sizing')).toBe('border-box');
    // The off-state chip on white, raised to AA (D-10): 4.53:1.
    expect(await style('.pl1-chip--light:not(.is-on)', 'color')).toBe('rgb(108, 116, 159)');
  });
});

test.describe('PU-01 V1 landing — the frozen breakpoints (phone < 560, narrow < 1024, mid < 1300)', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'The boundaries are set per test.');

  for (const [w, expected] of [
    [559, { h1: '31px', header: 60, nav: 'none', featured: 1, pickThumb: '72px' }],
    [560, { h1: '46px', header: 76, nav: 'none', featured: 2, pickThumb: '100%' }],
    [1023, { h1: '46px', header: 76, nav: 'none', featured: 2, pickThumb: '100%' }],
    [1024, { h1: '46px', header: 76, nav: 'block', featured: 2, pickThumb: '108px' }],
    [1299, { h1: '46px', header: 76, nav: 'block', featured: 2, pickThumb: '108px' }],
    [1300, { h1: '56px', header: 76, nav: 'block', featured: 4, pickThumb: '128px' }],
  ] as const) {
    test(`${w} px: the landing's own layout, nothing scrolls sideways`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await open(page);
      await expect(page.locator('.pl1-h1')).toHaveCSS('font-size', expected.h1);
      expect((await page.getByRole('banner').boundingBox())!.height).toBe(expected.header);
      await expect(page.locator('.pl1-navlink').first()).toHaveCSS('display', expected.nav);
      await expect(page.locator('.pl1-signin')).toBeVisible();
      expect(
        await page
          .locator('.pl1-feat-grid')
          .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length),
      ).toBe(expected.featured);
      const thumb = await page
        .locator('.pl1-pick-thumb')
        .first()
        .evaluate((el) => {
          const own = el.getBoundingClientRect().width;
          const parent = el.parentElement!.getBoundingClientRect();
          const style = getComputedStyle(el.parentElement!);
          const inner =
            parent.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2;
          return Math.abs(own - inner) < 1 ? '100%' : `${Math.round(own)}px`;
        });
      expect(thumb).toBe(expected.pickThumb);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  }
});

test.describe('PU-01 V1 landing — the phone header with Sign in (owner D-3; lead decision on narrow phones)', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'The widths are set per test.');

  for (const w of [320, 360, 373, 374, 375]) {
    test(`${w} px: one row at 60 px, nothing overlaps or scrolls sideways; the brand named`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: 812 });
      await open(page);
      const header = page.getByRole('banner');
      expect((await header.boundingBox())!.height).toBe(60);
      const box = async (selector: string) => (await header.locator(selector).boundingBox())!;
      const tile = await box('.pl1-logo');
      expect([tile.width, tile.height]).toEqual([68, 34]);
      const signIn = await box('.pl1-signin');
      const cta = await box('.pl1-headcta');
      expect(cta.width).toBeCloseTo(96, 0);
      expect(signIn.x + signIn.width).toBeLessThanOrEqual(cta.x);
      const brand = header.getByRole('link', { name: /XR Learning Platform$/ });
      // The product name stays in the brand link's name at every width (and in the footer).
      await expect(brand).toHaveAccessibleName(
        'BITS Pilani Work Integrated Learning Programmes XR Learning Platform',
      );
      const name = header.locator('.pl1-brand-name');
      if (w >= 374) {
        // Two lines, as the frozen brand: “XR Learning” / “Platform”.
        const text = await name.boundingBox();
        expect(Math.round(text!.height / (15 * 1.05))).toBe(2);
        expect(text!.x + text!.width).toBeLessThanOrEqual(signIn.x);
        await expect(header.locator('.pl1-brand-sep')).toBeVisible();
      } else {
        // Below 374 px the brand text is for assistive technology only; the divider is dropped.
        expect((await name.boundingBox())!.width).toBeLessThanOrEqual(1);
        await expect(header.locator('.pl1-brand-sep')).toBeHidden();
        expect(tile.x + tile.width).toBeLessThanOrEqual(signIn.x);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await expectNoAxeViolations(page, { include: ['header.pl1-hdr'] });
    });
  }
});

test.describe('PU-01 V1 landing — links to the existing routes', () => {
  test('the header: Browse the catalogue, Sign in', async ({ page }) => {
    await open(page);
    const header = page.getByRole('banner');
    await reachAndClick(
      page,
      header.getByRole('link', { name: /^(Browse the catalogue|Catalogue)$/ }),
    );
    await page.waitForURL((url) => url.pathname === '/experiments');
    await page.goto('/');
    await reachAndClick(page, header.getByRole('link', { name: 'Sign in' }));
    await page.waitForURL('**/sign-in');
  });

  test('PU-14: one “Request institutional access” to the selection (D-5)', async ({ page }) => {
    await open(page);
    const section = page.locator('#for-institutions');
    await expect(section.getByRole('listitem')).toHaveCount(6);
    await reachAndClick(page, section.getByRole('link', { name: 'Request institutional access' }));
    await page.waitForURL((url) => url.pathname === '/selection');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your selection');
  });

  test('Featured opens the catalogue search; an area and a format filter it', async ({ page }) => {
    await open(page);
    await reachAndClick(
      page,
      page.getByRole('link', { name: 'View CNC Turning Centre in the catalogue' }),
    );
    await page.waitForURL((url) => url.pathname === '/experiments' && url.search === '?q=CNC');
    await expect(page.getByRole('main')).toContainText('CNC Turning Centre');
    await page.goto('/');
    await reachAndClick(
      page,
      page.locator('.pl1-xp.is-on').getByRole('link', { name: /Browse 5 experiments/ }),
    );
    await page.waitForURL((url) => url.search === '?area=mechanical-manufacturing');
    await page.goto('/');
    await reachAndClick(page, page.locator('#formats').getByRole('link', { name: /^Browse MR/ }));
    await page.waitForURL((url) => url.search === '?format=mr');
  });

  test('“How institutional access works” from an area lands on PU-14 with its heading focused', async ({
    page,
  }) => {
    await page.goto('/areas/mechanical-manufacturing');
    await reachAndClick(
      page,
      page.getByRole('link', { name: 'How institutional access works' }).first(),
    );
    await page.waitForURL((url) => url.pathname === '/' && url.hash === '#for-institutions');
    await expect(page.locator('#for-institutions h2')).toBeFocused();
    await expect(page.locator('#for-institutions h2')).toBeInViewport();
  });
});

test.describe('PU-01 V1 landing — the hero', () => {
  test('rotates every 7.6 s; a manual pick stops it; Pause and Play (shown at every width, D-8)', async ({
    page,
  }) => {
    await page.clock.install();
    await open(page);
    // From here the page's clock moves only when the test moves it.
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
    const group = page.getByRole('group', { name: 'Experiment scenes' });
    const pressed = () =>
      group
        .locator('.pl1-pick')
        .evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-pressed')));
    expect(await pressed()).toEqual(['true', 'false', 'false']);
    await page.clock.runFor(7700);
    await expect.poll(pressed).toEqual(['false', 'true', 'false']);
    await page.clock.runFor(7700);
    await expect.poll(pressed).toEqual(['false', 'false', 'true']);
    const pause = group.getByRole('button', { name: 'Pause motion' });
    await expect(pause).toBeVisible();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await pause.click();
    const play = group.getByRole('button', { name: 'Play motion' });
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await page.clock.runFor(20000);
    expect(await pressed()).toEqual(['false', 'false', 'true']);
    // Every ambient loop stops with it.
    await expect(page.locator('.pl1-scene.is-on .pl1-glow')).toHaveCSS(
      'animation-play-state',
      'paused',
    );
    await play.click();
    await page.clock.runFor(7700);
    await expect.poll(pressed).toEqual(['true', 'false', 'false']);
    // A manual pick selects and stops rotation; the ambient loops go on.
    await group.locator('.pl1-pick').nth(1).click();
    await page.clock.runFor(20000);
    expect(await pressed()).toEqual(['false', 'true', 'false']);
    await expect(group.getByRole('button', { name: 'Pause motion' })).toBeVisible();
  });
});

test.describe('PU-01 V1 landing — the explorer, the story, the formats', () => {
  test('the explorer: hover selects from 1024 px; keys move and focus', async ({ page }) => {
    await open(page);
    const group = page.getByRole('group', { name: 'Experiment areas' });
    const selected = () =>
      group.locator('[data-sel][aria-pressed="true"]').getAttribute('aria-label');
    expect(await selected()).toBe('Selected: Mechanical & Manufacturing, 5 experiments');
    await group.scrollIntoViewIfNeeded();
    await group.locator('.pl1-xp').nth(2).hover();
    if (width(page) >= 1024) {
      await expect.poll(selected).toBe('Selected: Chemical & Process, 3 experiments');
    } else {
      expect(await selected()).toBe('Selected: Mechanical & Manufacturing, 5 experiments');
    }
    await group.locator('[data-sel]').nth(1).focus();
    await expect.poll(selected).toBe('Selected: Electrical & Electronics, 4 experiments');
    await page.keyboard.press('End');
    await expect(group.locator('[data-sel]').nth(2)).toBeFocused();
    await expect.poll(selected).toBe('Selected: Chemical & Process, 3 experiments');
    await page.keyboard.press('ArrowRight');
    await expect.poll(selected).toBe('Selected: Mechanical & Manufacturing, 5 experiments');
    await checkLanding(page);
  });

  test('the story: sticky and scroll-driven from 560 px; tapped on a phone', async ({ page }) => {
    await open(page);
    const stage = page.getByRole('region', {
      name: 'Illustrative session: Shell-and-Tube Heat Exchanger',
    });
    const steps = stage.getByRole('group', { name: 'Story steps' });
    const current = () => steps.locator('[aria-pressed="true"]').getAttribute('aria-label');
    await expect(stage).toContainText('Illustrative · no measured values');
    if (width(page) >= 560) {
      await expect(page.locator('.pl1-root')).toHaveAttribute('data-smode', 'scroll');
      expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
      // Scroll through the runway: the steps follow the page's own scroll.
      const track = await page
        .locator('.pl1-track')
        .evaluate((el) => el.getBoundingClientRect().top + scrollY);
      const stickyTop = await stage.evaluate((el) => parseFloat(getComputedStyle(el).top));
      const vh = page.viewportSize()!.height;
      // The real viewport height centres the stage (D-9).
      const headerH = 76;
      const stageH = width(page) < 1024 ? 660 : width(page) < 1300 ? 620 : 640;
      expect(stickyTop).toBe(headerH + Math.max(20, Math.round((vh - headerH - stageH) / 2)));
      const holds = width(page) < 1024 ? [120, 410, 780, 1140] : [140, 480, 910, 1310];
      for (const [index, hold] of holds.entries()) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(track - stickyTop + hold));
        await expect
          .poll(current)
          .toBe(
            `Step 0${index + 1}: ${['Understand', 'Observe', 'Experiment', 'Interpret'][index]}`,
          );
        await expect.poll(async () => (await stage.boundingBox())!.y).toBeCloseTo(stickyTop, 0);
      }
      // An index click scrolls to its state's hold point.
      await steps.getByRole('button', { name: 'Step 02: Observe' }).click();
      await expect.poll(current).toBe('Step 02: Observe');
      expect(await page.evaluate(() => scrollY)).toBe(Math.round(track - stickyTop + holds[1]!));
    } else {
      await expect(page.locator('.pl1-root')).toHaveAttribute('data-smode', 'tap');
      expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe('relative');
      await reachAndClick(page, steps.getByRole('button', { name: 'Step 03: Experiment' }));
      await expect.poll(current).toBe('Step 03: Experiment');
      await expect(stage.locator('[data-sq="2"]')).toHaveAttribute('aria-hidden', 'false');
      await page.keyboard.press('ArrowRight');
      await expect(steps.getByRole('button', { name: 'Step 04: Interpret' })).toBeFocused();
      await expect.poll(current).toBe('Step 04: Interpret');
    }
  });

  test('the formats: pointer and focus preview a card; Browse is separate', async ({ page }) => {
    await open(page);
    const formats = page.locator('#formats');
    await formats.scrollIntoViewIfNeeded();
    const vr = formats.getByRole('button', { name: /virtual-reality format/ });
    await vr.hover();
    await expect(vr).toHaveAttribute('aria-pressed', 'true');
    await expect(vr).toHaveAccessibleName(/^Previewing\./);
    await expect(formats.locator('.pl1-fcard--vr .pl1-fcard-edge')).toHaveCSS(
      'background-color',
      'rgb(233, 168, 37)',
    );
    await formats.getByRole('button', { name: /browser format/ }).focus();
    await expect(formats.getByRole('button', { name: /browser format/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(vr).toHaveAttribute('aria-pressed', 'false');
    await checkLanding(page);
  });
});

test.describe('PU-01 V1 landing — reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no rotation, reveal, sweep or parallax; the story static; everything shown', async ({
    page,
  }) => {
    await page.clock.install();
    await open(page);
    const group = page.getByRole('group', { name: 'Experiment scenes' });
    await expect(group.getByRole('button', { name: 'Play motion' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.clock.runFor(20000);
    expect(await group.locator('.pl1-pick').first().getAttribute('aria-pressed')).toBe('true');
    await expect(page.locator('.pl1-sweep')).toHaveCount(0);
    await expect(page.locator('.pl1-root')).toHaveAttribute('data-smode', 'static');
    expect(
      await page
        .getByRole('region', { name: /Illustrative session/ })
        .evaluate((el) => getComputedStyle(el).position),
    ).toBe('relative');
    // Nothing waits for a reveal: every section head and grid is fully shown at once.
    const opacities = await page
      .locator('[data-reveal]')
      .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).opacity));
    expect(opacities.length).toBeGreaterThan(0);
    expect(new Set(opacities)).toEqual(new Set(['1']));
    const steps = page.getByRole('group', { name: 'Story steps' });
    await reachAndClick(page, steps.getByRole('button', { name: 'Step 04: Interpret' }));
    await expect(steps.getByRole('button', { name: 'Step 04: Interpret' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await checkLanding(page);
  });
});

test('the skip link lands the hero below the sticky header', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
  const header = (await page.locator('header').first().boundingBox())!;
  const main = (await page.locator('main#main').boundingBox())!;
  expect(main.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
});
