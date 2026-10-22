/**
 * The landing's layout values (PU-01 V1, prompt 13): a pure port of the landing half of the frozen
 * `renderVals` (21 FROZEN 1572–2057; the catalogue subview and the harness are left out). The
 * stylesheet (`landing-v1.css`) draws these same numbers with container queries on the landing
 * root; this module gives them to the code that needs them — the story engine, the section scroll
 * offset, the explorer's hover rule — and to the tests that hold the stylesheet to them.
 *
 * Breakpoints are by the landing's own width (frozen 1578): phone < 560, narrow < 1024,
 * mid < 1300, wide ≥ 1300 (768 and 375 are sample widths, not breakpoints).
 */

export type Breakpoint = 'phone' | 'narrow' | 'mid' | 'wide';

export function breakpointOf(width: number): Breakpoint {
  if (width < 560) return 'phone';
  if (width < 1024) return 'narrow';
  if (width < 1300) return 'mid';
  return 'wide';
}

interface Bands {
  readonly phone: boolean;
  readonly narrow: boolean;
  readonly mid: boolean;
  readonly wide: boolean;
}

function bands(width: number): Bands {
  return { phone: width < 560, narrow: width < 1024, mid: width < 1300, wide: width >= 1300 };
}

/** The frozen layout numbers at a width (px unless stated). */
export function landingLayout(width: number) {
  const { phone, narrow, mid, wide } = bands(width);
  const padX = phone ? 18 : narrow ? 28 : mid ? 40 : 64;
  return {
    padX,
    secPad: phone ? 56 : narrow ? 64 : 96,
    headerH: phone ? 60 : 76,
    logoH: phone ? 24 : 34,
    logoW: phone ? 48 : 68,
    brandSize: phone ? 15 : mid ? 17 : 19,
    navGap: mid ? 20 : 28,
    navShown: !narrow,
    canvasH: phone ? 690 : narrow ? 780 : mid ? 580 : 640,
    h1Size: phone ? 31 : narrow ? 46 : mid ? 46 : 56,
    leadSize: phone ? 14.5 : mid ? 16 : 17.5,
    ctaH: phone ? 50 : 54,
    copyW: phone ? 340 : narrow ? 600 : mid ? 520 : 620,
    pickMt: phone ? 14 : narrow ? -16 : -30,
    thumbH: phone ? 48 : narrow ? 88 : mid ? 70 : 82,
    h2Size: phone ? 30 : narrow ? 36 : 46,
    expMt: phone ? 28 : 44,
    featPadT: phone ? 48 : narrow ? 64 : 88,
    featColumns: phone ? 1 : wide ? 4 : 2,
    expRowH: narrow ? (phone ? 696 : 720) : mid ? 520 : 580,
    expVertical: narrow,
    fmtColumns: narrow ? 2 : 4,
    fmtMediaH: phone ? 132 : narrow ? 170 : 210,
    acadSize: phone ? 30 : narrow ? 34 : 42,
    accColumns: phone ? 1 : narrow ? 2 : 3,
    accTitleSize: phone ? 17.5 : 19,
    ctaPad: phone ? 52 : 80,
    ctaSize: phone ? 34 : narrow ? 40 : 54,
    footPad: phone ? 30 : 40,
  };
}

export type StoryMode = 'scroll' | 'tap' | 'static';

/** The story engine's configuration (frozen `this._sc`, 1733–1749). */
export interface StoryConfig {
  readonly mode: StoryMode;
  /** The sticky stage's top: the header, then the stage centred in the viewport (1740). */
  readonly stickyTop: number;
  readonly stageH: number;
  /** The scroll runway under the stage (1742). */
  readonly R: number;
  readonly knots: readonly number[];
  readonly E: number;
  readonly Eo: number;
  /** Where an index click holds the scroll for each state (1745). */
  readonly holdD: readonly number[];
  readonly cams: readonly (readonly [number, number, number, number])[];
  readonly par: number;
  readonly amp: number;
  readonly Y: number;
  readonly vig: number;
  readonly lift: readonly [number, number];
}

/**
 * The story's configuration at a width. `viewH` is the real viewport height (owner decision D-9:
 * the frozen file centred the stage in its fixed 940 / 900 / 812 px frame); a viewport too short
 * to hold the header, the stage and 20 px above and below it falls back to the frozen tap mode
 * (D-9), as reduced motion falls back to the frozen static mode.
 */
export function storyConfig(width: number, reduce: boolean, viewH: number): StoryConfig {
  const { phone, narrow, mid, wide } = bands(width);
  const tablet = narrow && !phone;
  const headerH = phone ? 60 : 76;
  const stageH = tablet ? 660 : wide ? 640 : 620;
  const fits = viewH >= headerH + stageH + 40;
  const mode: StoryMode = reduce ? 'static' : phone || !fits ? 'tap' : 'scroll';
  const stickyTop = headerH + Math.max(20, Math.round((viewH - headerH - stageH) / 2));
  const knots = tablet
    ? [-340, -40, 140, 350, 470, 720, 840, 1080]
    : [-400, -40, 160, 410, 550, 840, 980, 1250];
  return {
    mode,
    stickyTop,
    stageH,
    R: tablet ? 1320 : 1530,
    knots,
    E: tablet ? 110 : 150,
    Eo: tablet ? 90 : 110,
    holdD: [
      knots[2]! - 20,
      (knots[3]! + knots[4]!) / 2,
      (knots[5]! + knots[6]!) / 2,
      knots[7]! + 60,
    ],
    cams: phone
      ? [
          [0, -2, 1.9, 1],
          [0, -2, 1.9, 1],
          [0, 0, 1.02, 1],
          [3, 0, 1.14, 1],
          [-36, 0, 0.5, 0.6],
        ]
      : [
          [0, 3, 1.02, 0.5],
          [0, -1, 1.04, 1],
          [0, 0, 1, 1],
          [1, 0, 1.03, 1],
          [-12, 2, 0.88, 0.85],
        ],
    par: narrow ? 0.5 : 1,
    amp: narrow ? 0.6 : 1,
    Y: narrow ? 6 : 8,
    vig: narrow ? 0.5 : 1,
    lift: phone ? [0, 0] : tablet ? [-61, 70] : mid ? [-76, 0] : [-37, 0],
  };
}

/**
 * Below this width the header shows the logo tile without the brand text (lead decision, 22 Oct
 * 2026): the two-line “XR Learning / Platform” no longer fits beside Sign in and the gold button.
 * The stylesheet's `@container pl1 (width < 374px)` draws it.
 */
export const BRAND_TEXT_MIN_WIDTH = 374;

/** The hero's auto-rotation period (frozen `tick`, 1230). */
export const HERO_ROTATION_MS = 7600;
/** The intro stagger starts this long after mount (1152). */
export const INTRO_DELAY_MS = 90;
/** Scroll reveals are armed this long after mount (1153). */
export const REVEAL_DELAY_MS = 160;
