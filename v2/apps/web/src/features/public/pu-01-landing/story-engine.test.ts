/**
 * The story engine (21 FROZEN 1255–1449): its maths against values the frozen engine itself
 * produces — pinned below, and compared function for function across the whole range with the
 * frozen source kept in `design/v1-landing/` — and the running engine's modes (scroll, tap, static).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readV1Landing } from '@/test-support/v1-landing';

import { storyConfig, type StoryConfig } from './layout';
import { StoryEngine, storyCss, storyMap, storyParams, storySettle } from './story-engine';

const WIDE = storyConfig(1440, false, 940);

describe('storyMap and storySettle (pinned from the frozen engine, wide)', () => {
  it('maps the scroll distance to p through the knots', () => {
    const pinned: [number, number][] = [
      [-500, -1],
      [-400, -1],
      [-100, -0.166667],
      [-40, 0],
      [160, 0],
      [300, 0.56],
      [410, 1],
      [550, 1],
      [700, 1.517241],
      [840, 2],
      [980, 2],
      [1100, 2.444444],
      [1250, 3],
      [1600, 3],
    ];
    for (const [d, p] of pinned) expect(storyMap(WIDE, d)).toBeCloseTo(p, 5);
  });

  it('settles the stage at both ends of the runway', () => {
    const pinned: [number, number][] = [
      [-200, 0],
      [-60, 13.5],
      [0, 37.5],
      [60, 13.5],
      [149, 0.001667],
      [150, 0],
      [1420, 0],
      [1500, -14.545455],
      [1530, -27.5],
      [1600, -3.636364],
      [1640, 0],
    ];
    for (const [d, y] of pinned) expect(storySettle(WIDE, d)).toBeCloseTo(y, 5);
  });
});

describe('storyParams → storyCss (pinned from the frozen engine, wide)', () => {
  const css = (p: number) => storyCss(storyParams(WIDE, p));

  it('writes the 89 custom properties the stage reads', () => {
    expect(Object.keys(css(0))).toHaveLength(89);
  });

  it.each([
    [
      -1,
      {
        '--scam': 'translate3d(0%,3%,0) scale(1.02)',
        '--sq0o': '0',
        '--sxg': 'translateX(0%)',
        '--std': '100',
      },
    ],
    [0, { '--scam': 'translate3d(0%,-1%,0) scale(1.04)', '--sq0o': '1', '--sq1o': '0' }],
    [0.5, { '--sq1o': '0.722', '--sxg': 'translateX(50%)', '--sno': '0.352' }],
    [
      1.5,
      {
        '--scam': 'translate3d(0.376%,0%,0) scale(1.0112)',
        '--sq2o': '0.722',
        '--sq2v': 'visible',
        '--sx2c': 'rgb(240,241,250)',
        '--sx2w': '700',
        '--std': '88.35',
        '--snk': '75.75%',
      },
    ],
    [
      2.5,
      {
        '--scam': 'translate3d(-5.964%,1.071%,0) scale(0.9467)',
        '--sq3o': '0.722',
        '--spk':
          'radial-gradient(circle farthest-corner at 18% 72%,#000 53.42%,transparent 77.42%)',
      },
    ],
    [3, { '--scam': 'translate3d(-12%,2%,0) scale(0.88)', '--sq3o': '1', '--spk': 'none' }],
  ])('p = %s', (p, expected) => {
    expect(css(p)).toMatchObject(expected);
  });
});

describe('function for function against the frozen source (design/v1-landing)', () => {
  const frozen = () => {
    const lines = readV1Landing().toString('utf8').split('\n');
    // 1276–1382: storyMap, storySettle, storyParams, storyCss, as the frozen class has them.
    const body = lines.slice(1275, 1382).join('\n');
    const Frozen = new Function(`return class { ${body} }`)() as new () => {
      _sc: StoryConfig;
      _sX: number;
      storyMap(d: number): number;
      storySettle(d: number): number;
      storyParams(p: number): Record<string, number>;
      storyCss(v: Record<string, number>): Record<string, string>;
    };
    return new Frozen();
  };

  it.each([
    ['wide', storyConfig(1440, false, 940)],
    ['mid', storyConfig(1100, false, 940)],
    ['tablet', storyConfig(768, false, 900)],
    ['phone', storyConfig(375, false, 812)],
  ])('%s: every value from p = −1 to 3 and every scroll distance', (_band, config) => {
    const reference = frozen();
    reference._sc = config;
    for (const xs of [0, 0.4]) {
      reference._sX = xs;
      for (let p = -1; p <= 3.0001; p += 0.05) {
        expect(storyCss(storyParams(config, p, xs))).toEqual(
          reference.storyCss(reference.storyParams(p)),
        );
      }
    }
    for (let d = -600; d <= 1800; d += 7) {
      expect(storyMap(config, d)).toBe(reference.storyMap(d));
      expect(storySettle(config, d)).toBe(reference.storySettle(d));
    }
  });
});

/** A window with a hand-run animation-frame queue and a settable scroll position. */
function fakeWindow() {
  let frames: FrameRequestCallback[] = [];
  let clock = 0;
  const win = {
    scrollY: 0,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame: () => undefined,
    scrollTo: vi.fn((_x: number, y: number) => {
      win.scrollY = y;
    }),
    performance: { now: () => clock },
  };
  const run = (ms = 16, times = 1) => {
    for (let i = 0; i < times; i++) {
      clock += ms;
      const due = frames;
      frames = [];
      for (const frame of due) frame(clock);
    }
  };
  return { win: win as unknown as Window, raw: win, run, pending: () => frames.length };
}

function stage() {
  const element = document.createElement('div');
  element.innerHTML = [0, 1, 2, 3]
    .map((i) => `<div data-sq="${i}"></div><button data-sx="${i}"></button>`)
    .join('');
  return element;
}

function track(top: number) {
  const element = document.createElement('div');
  Object.defineProperty(element, 'offsetTop', { value: top });
  Object.defineProperty(element, 'offsetParent', { value: null });
  return element;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the running engine', () => {
  it('scroll mode: the page’s scroll drives the state; an index click scrolls to its hold point', () => {
    const { win, raw, run } = fakeWindow();
    const config = storyConfig(1440, false, 940);
    const el = stage();
    const host = {
      config: () => config,
      stage: () => el,
      track: () => track(3000),
      selected: () => 0,
      select: vi.fn(),
    };
    const engine = new StoryEngine(host, win);
    engine.sync();
    // pin = 3000 − 188; at the second state's hold point the stage reads step 02.
    raw.scrollY = 3000 - 188 + 480;
    engine.kick();
    run(16, 200);
    expect(engine.state).toBe(1);
    expect(el.querySelector('[data-sx="1"]')).toHaveAttribute('aria-pressed', 'true');
    expect(el.querySelector('[data-sq="1"]')).toHaveAttribute('aria-hidden', 'false');
    expect(el.querySelector('[data-sq="0"]')).toHaveAttribute('aria-hidden', 'true');
    expect(el.style.getPropertyValue('--sq1o')).toBe('1');
    engine.choose(3);
    expect(raw.scrollTo).toHaveBeenLastCalledWith(0, 3000 - 188 + 1310);
    run(16, 200);
    expect(engine.state).toBe(3);
    expect(host.select).not.toHaveBeenCalled();
  });

  it('tap mode: an index click tweens over 1 000 ms and selects the step', () => {
    const { win, raw, run } = fakeWindow();
    const config = storyConfig(375, false, 812);
    const el = stage();
    let selected = 0;
    const host = {
      config: () => config,
      stage: () => el,
      track: () => track(3000),
      selected: () => selected,
      select: vi.fn((index: number) => {
        selected = index;
      }),
    };
    const engine = new StoryEngine(host, win);
    engine.sync();
    run();
    expect(engine.state).toBe(0);
    engine.choose(1);
    expect(host.select).toHaveBeenCalledWith(1);
    run(100, 4);
    expect(engine.state).toBe(0);
    run(100, 7);
    expect(engine.state).toBe(1);
    expect(raw.scrollTo).not.toHaveBeenCalled();
    // A distant jump cross-blends (820 ms) instead of tweening through the steps between.
    engine.choose(3);
    run(16);
    expect(engine.state).toBe(3);
  });

  it('static mode (reduced motion): immediate', () => {
    const { win, run } = fakeWindow();
    const config = storyConfig(1440, true, 940);
    const el = stage();
    let selected = 0;
    const engine = new StoryEngine(
      {
        config: () => config,
        stage: () => el,
        track: () => track(3000),
        selected: () => selected,
        select: (index) => {
          selected = index;
        },
      },
      win,
    );
    engine.sync();
    engine.choose(2);
    run();
    expect(engine.state).toBe(2);
    expect(el.style.getPropertyValue('--sq2o')).toBe('1');
    expect(el.style.getPropertyValue('--sty')).toBe('none');
  });

  it('wheel or key input cancels a scroll-mode tween', () => {
    const { win, raw, run } = fakeWindow();
    const config = storyConfig(1440, false, 940);
    const el = stage();
    const engine = new StoryEngine(
      {
        config: () => config,
        stage: () => el,
        track: () => track(3000),
        selected: () => 0,
        select: () => undefined,
      },
      win,
    );
    engine.sync();
    raw.scrollY = 3000 - 188 + 140;
    run(16, 50);
    engine.choose(1);
    engine.input();
    raw.scrollY = 3000 - 188 + 140;
    run(16, 200);
    // Without the tween, p follows the scroll position back to the first state.
    expect(engine.state).toBe(0);
  });
});
