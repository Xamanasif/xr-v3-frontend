/**
 * “Inside a simulation” — the story engine (PU-01 V1, prompt 13): a framework-free port of the
 * frozen engine (21 FROZEN 1255–1449). One continuous value p (−1 entry … 0–3 states) drives
 * every layer of the stage through about 60 CSS custom properties, written straight onto the stage
 * element, as the frozen file does.
 *
 * - Scroll mode (≥ 560 px): p follows the page's scroll through the runway under the sticky stage,
 *   smoothed exponentially (τ 70 ms); an index click scrolls to that state's hold point.
 * - Tap mode (phone, and short viewports — owner decision D-9): an index click tweens p (1 000 ms).
 * - Static mode (reduced motion): immediate.
 * A distant jump cross-blends over 820 ms; text-bearing layers fade out, then in.
 *
 * The maths is the frozen file's, unchanged. The one adapter change: the frozen stage scrolled
 * inside a fixed-height frame (`frame.scrollTop`), the product scrolls the window, so the track's
 * position is its document offset and the scroll position is `window.scrollY`.
 */
import type { StoryConfig, StoryMode } from './layout';

export type StoryValues = Record<string, number>;

/** p for a scroll distance d past the pin point (1276–1281). */
export function storyMap(c: StoryConfig, d: number): number {
  const K = c.knots;
  const P = [-1, 0, 0, 1, 1, 2, 2, 3];
  if (d <= K[0]!) return -1;
  for (let i = 1; i < K.length; i++)
    if (d < K[i]!) return P[i - 1]! + ((P[i]! - P[i - 1]!) * (d - K[i - 1]!)) / (K[i]! - K[i - 1]!);
  return 3;
}

/** The stage's settle offset at both ends of the runway (1282–1288). */
export function storySettle(c: StoryConfig, d: number): number {
  const E = c.E;
  const u = d - c.R;
  if (d > -E && d < E) return ((E - d) * (E - d)) / (4 * E) - Math.max(0, -d);
  const F = c.Eo || E;
  if (u > -F && u < F) return Math.max(0, u) - ((u + F) * (u + F)) / (4 * F);
  return 0;
}

/** Every layer's value at p (1289–1354); `xs` is the exit progress past the runway (`_sX`). */
export function storyParams(c: StoryConfig, p: number, xs = 0): StoryValues {
  const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const sg = (x: number, a: number, b: number) => cl((x - a) / (b - a));
  const sm = (t: number) => t * t * (3 - 2 * t);
  const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2);
  const eo = (t: number) => 1 - Math.pow(1 - t, 3);
  const ei = (t: number) => t * t;
  type Ease = (t: number) => number;
  type Window = readonly [number, number, Ease];
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const W = (a: number, b: number, f?: Ease): Window => [a, b, f || sm];
  const D: Window = [0, 1, sm];
  const T = [cl(p + 1), cl(p), cl(p - 1), cl(p - 2)];
  const k = p < 0 ? 0 : p < 1 ? 1 : p < 2 ? 2 : 3;
  const tk = T[k]!;
  const seq = (a: readonly number[], w?: readonly (Window | undefined)[]) => {
    const q = (w && w[k]) || D;
    return L(a[k]!, a[k + 1]!, q[2](sg(tk, q[0], q[1])));
  };
  const pres = (
    a: number | null,
    wa: readonly [number, number],
    b: number | null,
    wb: readonly [number, number],
  ) => [a == null ? 1 : sm(sg(T[a]!, wa[0], wa[1])), b == null ? 0 : sm(sg(T[b]!, wb[0], wb[1]))];
  const v: StoryValues = {};
  const m = c.cams;
  const A = m[k]!;
  const B = m[k + 1]!;
  const cw = [W(0, 0.9, eo), W(0.08, 0.92, io), W(0.15, 0.92, io), W(0.08, 0.9, io)][k]!;
  const cu = cw[2](sg(tk, cw[0], cw[1]));
  v.camX = L(A[0], B[0], cu);
  v.camY = L(A[1], B[1], cu);
  v.camS = Math.exp(L(Math.log(A[2]), Math.log(B[2]), cu));
  v.cao = seq(
    m.map((x) => x[3]),
    [W(0, 0.6), D, D, W(0.1, 0.85)],
  );
  const mv = [W(0, 1, eo), W(0.1, 0.9), W(0.15, 0.9), W(0.1, 0.9)];
  v.bgx = c.par * seq([0, 0, -6, -3, 5], mv);
  v.bgy = c.par * seq([16, 0, 4, -2, -5], mv);
  v.bgs = seq([1.05, 1.02, 1, 1.03, 1.01], mv);
  const gw = [W(0.1, 0.8), W(0.1, 0.8), W(0.2, 0.9), W(0.1, 0.85)];
  const gm = [W(0, 1, eo), D, W(0.2, 0.9), W(0.1, 0.9)];
  const surge = k === 2 ? Math.sin(Math.PI * sg(tk, 0.3, 1)) : 0;
  const gf = [D, W(0.1, 0.9), W(0.15, 0.9), W(0.1, 0.9)];
  v.bf = 0.35 + 0.65 * eo(sg(T[0]!, 0, 0.9));
  v.fo = c.vig * seq([0, 0.5, 0.7, 0.8, 0.6], gw) * (1 - 0.5 * xs);
  v.fx = c.par * seq([0, 0, -18, 12, 26], gf);
  v.fy = c.par * seq([0, -4, 18, 22, 0], gf);
  v.wo = (seq([0, 1, 0.55, 0.9, 0.6], gw) + 0.1 * surge) * (1 - 0.25 * xs);
  v.ws = 1 + 0.12 * c.par * surge;
  v.wx = c.par * seq([0, 0, 0, 8, 30], gm);
  v.wy = c.par * seq([6, 0, 0, 4, -4], gm);
  v.co = seq([0, 0.9, 0.7, 0.55, 0.95], gw);
  v.gx = c.par * seq([0, 0, 0, 0, -8], gm);
  v.gy = c.par * seq([6, 0, 0, 0, -4], gm);
  v.vi = c.vig * seq([0.5, 0.16, 0.06, 0.2, 0.16], mv) * (1 - 0.6 * xs);
  v.c1 = seq([0, 1, 0.38, 0.28, 0.18], [W(0.25, 0.7), W(0.1, 0.75), W(0.2, 0.8), W(0.1, 0.6)]);
  v.fl = seq([0, 0.15, 1, 1, 0.6], [W(0.3, 0.9), W(0.2, 0.8), D, W(0.1, 0.7)]);
  v.r0 = seq([0, 0, 1, 0.35, 0], [D, W(0.28, 0.6), W(0.1, 0.45), W(0.1, 0.5)]);
  v.r2 = seq([0, 0, 1, 0.35, 0], [D, W(0.34, 0.66), W(0.1, 0.45), W(0.1, 0.5)]);
  v.r1 = seq([0, 0, 1, 1, 0.25], [D, W(0.4, 0.72), D, W(0.1, 0.5)]);
  v.r3 = seq([0, 0, 1, 1, 0.25], [D, W(0.46, 0.78), D, W(0.1, 0.5)]);
  v.bo = seq([0, 0, 0, 1, 0], [D, D, W(0.3, 0.75), W(0.2, 0.65)]);
  v.bx = seq([0, 0, 0, 190, 190], [D, D, W(0.3, 0.92, io)]);
  v.gi =
    seq([0, 0, 0, 0.25, 0], [D, D, W(0.2, 0.6), W(0, 0.4)]) +
    (k === 2 ? 0.7 * Math.sin(Math.PI * sg(tk, 0.16, 0.7)) : 0);
  v.to = seq([0, 0, 0, 1, 0], [D, D, W(0.22, 0.36), W(0.1, 0.32)]);
  v.td = seq([100, 100, 100, 0, 0], [D, D, W(0.3, 0.95, io)]);
  const hf = 1 - v.td / 100;
  v.sho = 0.9 * 4 * hf * (1 - hf);
  v.sth = v.td - 95;
  v.tl = k === 3 ? sm(sg(tk, 0.08, 0.28)) * (1 - 0.65 * sm(sg(tk, 0.55, 0.9))) : 0;
  const lu = k === 3 ? io(sg(tk, 0.1, 0.55)) : 0;
  v.tx = c.lift[0] * lu;
  v.ty = c.lift[1] * lu - 18 * Math.sin(Math.PI * lu);
  v.o1 = seq([0, 0, 0, 1, 0], [D, D, W(0.55, 0.85), W(0.1, 0.5)]);
  v.o1s = seq([0.6, 0.6, 0.6, 1, 1.2], [D, D, W(0.55, 0.95, eo), W(0.1, 0.5)]);
  v.o3 = seq([0, 0, 0, 1, 0], [D, D, W(0.62, 0.92), W(0.1, 0.5)]);
  v.o3s = seq([0.6, 0.6, 0.6, 1, 1.2], [D, D, W(0.62, 1, eo), W(0.1, 0.5)]);
  v.ko = seq([0, 0, 1, 1, 0], [D, W(0.3, 0.8), D, W(0, 0.4)]);
  v.ky = c.amp * seq([12, 12, 0, -4, 8], [D, W(0.3, 0.9, eo), W(0.05, 0.35), W(0, 0.45)]);
  v.ka = seq([0, 0, 0, 1, 0], [D, D, W(0.05, 0.35), W(0, 0.35)]);
  v.kn = seq([36, 36, 36, 76, 76], [D, D, W(0.12, 0.55, io)]);
  const chips: readonly [
    number | null,
    readonly [number, number],
    number | null,
    readonly [number, number],
    number,
    number,
  ][] = [
    [0, [0.5, 0.8], 1, [0, 0.35], 4, 4],
    [0, [0.58, 0.88], 1, [0.04, 0.39], -4, -4],
    [0, [0.66, 0.96], 1, [0.08, 0.43], 0, -4],
    [1, [0.55, 0.95], 2, [0, 0.32], 0, -4],
    [2, [0.6, 0.98], 3, [0, 0.32], 0, -4],
  ];
  chips.forEach((h, i) => {
    const q = pres(h[0], h[1], h[2], h[3]);
    v[`h${i}o`] = q[0]! * (1 - q[1]!);
    v[`h${i}x`] = c.amp * h[4] * ei(q[1]!);
    v[`h${i}y`] = c.amp * (6 * (1 - eo(q[0]!)) + h[5] * ei(q[1]!));
  });
  const qin = (t: number) =>
    t < 0.46 ? 0.7 * sm(sg(t, 0.18, 0.46)) : 0.7 + 0.3 * sm(sg(t, 0.46, 0.7));
  const qout = (t: number) =>
    t < 0.36 ? 1 - 0.8 * sm(sg(t, 0.04, 0.36)) : 0.2 * (1 - sm(sg(t, 0.36, 0.5)));
  for (let i = 0; i < 4; i++) {
    const iu = i === 0 ? sm(sg(T[0]!, 0.42, 0.88)) : qin(T[i]!);
    const keep = i < 3 ? qout(T[i + 1]!) : 1;
    v[`q${i}o`] = iu * keep;
    v[`q${i}y`] =
      c.Y * (1 - (i === 0 ? eo(iu) : sm(sg(T[i]!, 0.18, 0.7)))) -
      c.Y * (i < 3 ? sm(sg(T[i + 1]!, 0.04, 0.5)) : 0);
  }
  const t3 = T[3]!;
  const pe = eo(sg(t3, 0.2, 0.7));
  v.po = sm(sg(t3, 0.26, 0.62));
  v.pm = io(sg(t3, 0.26, 0.7));
  v.sps = v.po * v.pm * v.pm;
  v.px = -12 * c.amp * (1 - pe);
  v.ps = 0.96 + 0.04 * pe;
  v.ax = 100 * (1 - io(sg(t3, 0.34, 0.6)));
  v.gr = sm(sg(t3, 0.4, 0.66));
  for (let i = 0; i < 8; i++) v[`p${i}`] = sm(sg(t3, 0.5 + i * 0.03, 0.6 + i * 0.03));
  v.cv = 100 - 45 * io(sg(t3, 0.2, 0.46)) - 55 * io(sg(t3, 0.72, 0.94));
  v.lg = sm(sg(t3, 0.7, 0.92));
  v.ixo = 0.25 + 0.75 * sm(sg(T[0]!, 0.3, 0.8));
  v.xg = p < 0 ? 0 : p > 3 ? 3 : p;
  const entry = sm(sg(T[0]!, 0, 0.4));
  v.xo = entry;
  v.xy = 8 * (1 - eo(entry));
  for (let j = 0; j < 4; j++) {
    v[`a${j}`] =
      p <= j
        ? j === 0
          ? sm(sg(T[0]!, 0.5, 0.8))
          : sm(sg(p - j + 1, 0.36, 0.55))
        : 1 - sm(sg(p - j, 0.2, 0.36));
    v[`f${j}`] = eo(j === 0 ? sg(T[0]!, 0.45, 0.9) : sg(T[j]!, 0.2, 0.8));
  }
  return v;
}

/** The stage's custom properties for a set of values (1355–1382). */
export function storyCss(v: StoryValues): Record<string, string> {
  const n = (x: number, d?: number) => String(+x.toFixed(d == null ? 3 : d));
  const tr = (x: number, y: number, u?: string) =>
    `translate3d(${n(x, 2)}${u || 'px'},${n(y, 2)}${u || 'px'},0)`;
  const mix = (a: readonly number[], b: readonly number[], t: number) =>
    `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * t)},${Math.round(a[1]! + (b[1]! - a[1]!) * t)},${Math.round(a[2]! + (b[2]! - a[2]!) * t)})`;
  const g = (key: string) => v[key]!;
  const o: Record<string, string> = {
    '--scam': `translate3d(${n(g('camX'))}%,${n(g('camY'))}%,0) scale(${n(g('camS'), 4)})`,
    '--scao': n(g('cao')),
    '--sbg': `${tr(g('bgx'), g('bgy'))} scale(${n(g('bgs'), 4)})`,
    '--swo': n(g('wo')),
    '--swt': `${tr(g('wx'), g('wy'), '%')} scale(${n(g('ws'), 4)})`,
    '--sco': n(g('co')),
    '--sct': tr(g('gx'), g('gy'), '%'),
    '--svi': n(g('vi')),
    '--sc1': n(g('c1')),
    '--sfl': n(g('fl')),
    '--sr0': n(g('r0')),
    '--sr1': n(g('r1')),
    '--sr2': n(g('r2')),
    '--sr3': n(g('r3')),
    '--sbo': n(g('bo')),
    '--sbx': `translateX(${n(g('bx'), 2)}px)`,
    '--sto': n(g('to')),
    '--std': n(g('td'), 2),
    '--stt': `translate(${n(g('tx'), 2)}px,${n(g('ty'), 2)}px)`,
    '--so1': n(g('o1')),
    '--so1t': `scale(${n(g('o1s'))})`,
    '--so3': n(g('o3')),
    '--so3t': `scale(${n(g('o3s'))})`,
    '--sno': n(g('ko')),
    '--snt': tr(0, g('ky')),
    '--sna': n(g('ka')),
    '--snk': `${n(g('kn'), 2)}%`,
    '--spo': n(g('po')),
    '--sps': n(g('sps')),
    '--spt': `${tr(g('px'), 0)} scale(${n(g('ps'), 4)})`,
    '--spk':
      g('pm') >= 0.999
        ? 'none'
        : `radial-gradient(circle farthest-corner at 18% 72%,#000 ${n(g('pm') * 124 - 24, 2)}%,transparent ${n(g('pm') * 124, 2)}%)`,
    '--sbf': n(g('bf')),
    '--sfo': n(g('fo')),
    '--sft': tr(g('fx'), g('fy'), '%'),
    '--sgi': n(g('gi')),
    '--sho': n(g('sho')),
    '--sth': n(g('sth'), 2),
    '--stl': n(g('tl')),
    '--sxo': n(g('ixo')),
    '--sxt': `scaleX(${n((g('xg') + 1) / 4, 4)})`,
    '--sxg': `translateX(${n(g('xg') * 100, 2)}%)`,
    '--sax': n(g('ax'), 2),
    '--sgr': n(g('gr')),
    '--scv': n(g('cv'), 2),
    '--slg': n(g('lg')),
    '--scx': n(g('xo')),
    '--scxt': tr(0, g('xy')),
  };
  for (let i = 0; i < 5; i++) {
    o[`--sh${i}o`] = n(g(`h${i}o`));
    o[`--sh${i}t`] = tr(g(`h${i}x`), g(`h${i}y`));
  }
  for (let i = 0; i < 4; i++) {
    const q = g(`q${i}o`);
    o[`--sq${i}o`] = n(q);
    o[`--sq${i}t`] = tr(0, g(`q${i}y`));
    o[`--sq${i}v`] = q > 0.004 ? 'visible' : 'hidden';
  }
  for (let i = 0; i < 8; i++) o[`--sp${i}`] = n(g(`p${i}`));
  for (let j = 0; j < 4; j++) {
    const a = Math.max(0, Math.min(1, g(`a${j}`)));
    o[`--sx${j}c`] = mix([169, 176, 224], [255, 255, 255], a);
    o[`--sx${j}n`] = mix([140, 148, 207], [247, 201, 91], a);
    o[`--sx${j}w`] = a >= 0.5 ? '700' : '500';
  }
  return o;
}

/** The text-bearing layers that hand off out-then-in during a cross-blend (1411). */
const DIP = /^(q\do|h\do|a\d|ko|po|sps|lg)$/;

export interface StoryEngineHost {
  /** The current configuration (`null` before the landing has measured itself). */
  config(): StoryConfig | null;
  stage(): HTMLElement | null;
  track(): HTMLElement | null;
  /** The selected state React shows (`storySel`), for tap and static modes. */
  selected(): number;
  /** Tap and static modes: the selection changed (React's `storySel`). */
  select(index: number): void;
}

interface Tween {
  readonly from: number;
  readonly to: number;
  readonly t0: number;
  readonly dur: number;
}

interface Blend {
  readonly from: StoryValues;
  readonly t0: number;
  readonly dur: number;
}

/** The document offset of an element (the frozen `offsetTop` walk, 1263–1264). */
function documentTop(element: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = element;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

/**
 * The running engine: one requestAnimationFrame loop, only while something moves (frozen
 * `storyKick`/`storyFrame`/`selectStory`, 1256–1449).
 */
export class StoryEngine {
  private raf = 0;
  private last = 0;
  private pT: number | null = null;
  private pD: number | null = null;
  private tween: Tween | null = null;
  private blend: Blend | null = null;
  private values: StoryValues | null = null;
  private xs = 0;
  private cache: Record<string, string> = {};
  private stageEl: HTMLElement | null = null;
  private current = -1;
  private mode: StoryMode | null = null;
  private geoDirty = true;
  private geoAt = 0;
  private geoEl: HTMLElement | null = null;
  private trackY = 0;

  constructor(
    private readonly host: StoryEngineHost,
    private readonly win: Window = window,
  ) {}

  /** Asks for a frame (frozen `storyKick`). */
  kick(): void {
    if (!this.raf) this.raf = this.win.requestAnimationFrame((now) => this.frame(now));
  }

  /** The layout may have moved (resize, fonts, a re-render): re-read the track's offset. */
  invalidate(): void {
    this.geoDirty = true;
    this.kick();
  }

  /** Wheel, touch, pointer or key input cancels a scroll-mode tween (frozen `_onStoryInput`). */
  input(): void {
    if (this.tween && this.host.config()?.mode === 'scroll') this.tween = null;
  }

  /** The configuration may have changed mode (frozen `componentDidUpdate`, 1161–1175). */
  sync(): void {
    this.geoDirty = true;
    const c = this.host.config();
    if (c && c.mode !== this.mode) {
      const previous = this.mode;
      this.mode = c.mode;
      this.tween = null;
      this.blend = null;
      this.last = 0;
      if (c.mode === 'scroll') {
        this.pD = null;
        this.pT = null;
      } else {
        const cur =
          previous === 'scroll' && this.current >= 0 ? this.current : this.host.selected();
        this.pT = cur;
        this.pD = cur;
        if (cur !== this.host.selected()) this.host.select(cur);
      }
    }
    this.kick();
  }

  destroy(): void {
    if (this.raf) this.win.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** The current state (0–3) the stage shows. */
  get state(): number {
    return this.current;
  }

  private geo(): { top: number; pin: number } | null {
    const t = this.host.track();
    const c = this.host.config();
    if (!t || !c) return null;
    const now = Date.now();
    if (this.geoDirty || this.geoEl !== t || now - this.geoAt > 1500) {
      this.trackY = documentTop(t);
      this.geoEl = t;
      this.geoDirty = false;
      this.geoAt = now;
    }
    return { top: this.win.scrollY, pin: this.trackY - c.stickyTop };
  }

  /** One frame (frozen `storyFrame`, 1383–1432). */
  frame(now: number): void {
    this.raf = 0;
    const c = this.host.config();
    const el = this.host.stage();
    if (!c || !el) {
      this.last = 0;
      return;
    }
    if (el !== this.stageEl) {
      this.stageEl = el;
      this.cache = {};
      this.current = -1;
    }
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    let more = false;
    let ty = 0;
    if (c.mode === 'scroll') {
      const g = this.geo();
      if (g) {
        const d = g.top - g.pin;
        const F = c.Eo || c.E;
        this.pT = storyMap(c, d);
        ty = storySettle(c, d);
        this.xs = Math.max(0, Math.min(1, (d - c.R + F) / (2 * F)));
      }
    } else {
      this.xs = 0;
      if (this.pT == null) this.pT = this.host.selected();
    }
    if (this.pT == null) this.pT = 0;
    if (this.pD == null) this.pD = this.pT;
    const tw = this.tween;
    if (tw) {
      const u = Math.min(1, (now - tw.t0) / tw.dur);
      const q = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      this.pD = tw.from + (tw.to - tw.from) * q;
      if (u >= 1) this.tween = null;
      else more = true;
    } else if (c.mode === 'scroll') {
      const df = this.pT - this.pD;
      if (Math.abs(df) < 0.0008) this.pD = this.pT;
      else {
        this.pD += df * (1 - Math.exp(-dt / 70));
        more = true;
      }
    } else this.pD = this.pT;
    let v = storyParams(c, this.pD, this.xs);
    const bl = this.blend;
    if (bl) {
      const u = Math.min(1, (now - bl.t0) / bl.dur);
      const S = (x: number) => {
        const y = x < 0 ? 0 : x > 1 ? 1 : x;
        return y * y * (3 - 2 * y);
      };
      const q = S(u);
      const mm: StoryValues = {};
      for (const key in v) {
        const f0 = bl.from[key];
        const t0 = v[key]!;
        if (f0 == null) {
          mm[key] = t0;
          continue;
        }
        if (DIP.test(key)) {
          const lo = Math.min(f0, t0);
          mm[key] = u < 0.45 ? f0 + (lo - f0) * S(u / 0.45) : lo + (t0 - lo) * S((u - 0.45) / 0.55);
        } else mm[key] = f0 + (t0 - f0) * q;
      }
      v = mm;
      if (u >= 1) this.blend = null;
      else more = true;
    }
    this.values = v;
    const css = storyCss(v);
    css['--sty'] = Math.abs(ty) > 0.05 ? `translate3d(0,${ty.toFixed(2)}px,0)` : 'none';
    for (const key in css) {
      if (this.cache[key] !== css[key]) {
        el.style.setProperty(key, css[key]!);
        this.cache[key] = css[key]!;
      }
    }
    const cur = Math.max(0, Math.min(3, Math.round(this.pD)));
    if (cur !== this.current) {
      this.current = cur;
      el.querySelectorAll('[data-sx]').forEach((b, i) =>
        b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'),
      );
      el.querySelectorAll('[data-sq]').forEach((nd, i) =>
        nd.setAttribute('aria-hidden', i === cur ? 'false' : 'true'),
      );
    }
    if (more) this.kick();
    else this.last = 0;
  }

  /** An index button chose a state (frozen `selectStory`, 1433–1449). */
  choose(i: number): void {
    const c = this.host.config();
    if (!c) return;
    const now = this.win.performance.now();
    const from = this.pD == null ? this.host.selected() : this.pD;
    if (c.mode === 'static') {
      this.tween = null;
      this.blend = null;
      this.pT = i;
      this.pD = i;
      if (i !== this.host.selected()) this.host.select(i);
      this.kick();
      return;
    }
    if (Math.abs(i - from) <= 1.05)
      this.tween = { from, to: i, t0: now, dur: c.mode === 'tap' ? 1000 : 900 };
    else {
      this.tween = null;
      if (this.values) this.blend = { from: this.values, t0: now, dur: 820 };
      this.pD = i;
    }
    this.pT = i;
    if (c.mode === 'scroll') {
      const g = this.geo();
      if (g) this.win.scrollTo(0, Math.max(0, Math.round(g.pin + c.holdD[i]!)));
    } else if (i !== this.host.selected()) this.host.select(i);
    this.kick();
  }
}
