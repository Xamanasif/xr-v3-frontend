// @vitest-environment node
/**
 * The landing's layout values against the frozen `renderVals` (21 FROZEN 1572–2057), at the four
 * sample widths and on both sides of every breakpoint (phone < 560, narrow < 1024, mid < 1300).
 */
import { describe, expect, it } from 'vitest';

import { breakpointOf, landingLayout, storyConfig } from './layout';

describe('breakpoints (frozen 1578)', () => {
  it.each([
    [320, 'phone'],
    [375, 'phone'],
    [559, 'phone'],
    [560, 'narrow'],
    [768, 'narrow'],
    [1023, 'narrow'],
    [1024, 'mid'],
    [1299, 'mid'],
    [1300, 'wide'],
    [1440, 'wide'],
  ] as const)('%i px is %s', (width, band) => {
    expect(breakpointOf(width)).toBe(band);
  });
});

describe('layout values (frozen renderVals)', () => {
  it('at 1440 / 1024 / 768 / 375', () => {
    const pick = (width: number) => {
      const l = landingLayout(width);
      return [
        l.padX,
        l.secPad,
        l.headerH,
        l.canvasH,
        l.h1Size,
        l.leadSize,
        l.h2Size,
        l.expRowH,
        l.featColumns,
        l.fmtColumns,
        l.accColumns,
        l.ctaSize,
      ];
    };
    expect(pick(1440)).toEqual([64, 96, 76, 640, 56, 17.5, 46, 580, 4, 4, 3, 54]);
    expect(pick(1024)).toEqual([40, 96, 76, 580, 46, 16, 46, 520, 2, 4, 3, 54]);
    expect(pick(768)).toEqual([28, 64, 76, 780, 46, 16, 36, 720, 2, 2, 2, 40]);
    expect(pick(375)).toEqual([18, 56, 60, 690, 31, 14.5, 30, 696, 1, 2, 1, 34]);
  });

  it('the header: logo box, brand size, nav gap, nav shown from 1024 px', () => {
    expect(landingLayout(1440)).toMatchObject({ logoW: 68, logoH: 34, brandSize: 19, navGap: 28 });
    expect(landingLayout(1299)).toMatchObject({ brandSize: 17, navGap: 20, navShown: true });
    expect(landingLayout(1023)).toMatchObject({ navShown: false });
    expect(landingLayout(559)).toMatchObject({ logoW: 48, logoH: 24, brandSize: 15 });
  });
});

describe('story configuration (frozen 1733–1749; D-9)', () => {
  it('scroll mode at ≥ 560 px, centred in the real viewport height', () => {
    const wide = storyConfig(1440, false, 940);
    expect(wide.mode).toBe('scroll');
    // 76 + round((940 − 76 − 640) / 2) — the frozen formula, with the viewport's height.
    expect(wide.stickyTop).toBe(188);
    expect(wide.R).toBe(1530);
    expect(wide.knots).toEqual([-400, -40, 160, 410, 550, 840, 980, 1250]);
    expect(wide.holdD).toEqual([140, 480, 910, 1310]);
    expect(wide.lift).toEqual([-37, 0]);
    expect(storyConfig(1440, false, 1200).stickyTop).toBe(76 + 242);

    const tablet = storyConfig(768, false, 900);
    expect(tablet).toMatchObject({ mode: 'scroll', stageH: 660, R: 1320, E: 110, Eo: 90 });
    expect(tablet.stickyTop).toBe(76 + 82);
    expect(tablet.lift).toEqual([-61, 70]);
    expect(storyConfig(1024, false, 940)).toMatchObject({ stageH: 620, lift: [-76, 0], par: 1 });
  });

  it('tap mode on phones and on viewports too short for the stage; static under reduced motion', () => {
    expect(storyConfig(375, false, 812).mode).toBe('tap');
    expect(storyConfig(375, false, 812).cams[0]).toEqual([0, -2, 1.9, 1]);
    // 76 + 640 + 40 = 756 px is the least that holds the wide stage.
    expect(storyConfig(1440, false, 756).mode).toBe('scroll');
    expect(storyConfig(1440, false, 755).mode).toBe('tap');
    expect(storyConfig(1440, true, 940).mode).toBe('static');
    expect(storyConfig(375, true, 812).mode).toBe('static');
    // The minimum gap of 20 px above the stage (1740 `Math.max(20, …)`).
    expect(storyConfig(1440, false, 700).stickyTop).toBe(96);
  });
});
