import type { Page } from '@playwright/test';

/** One element that received focus during the keyboard walk. */
export interface FocusStop {
  /** 1-based position in the Tab order. */
  readonly index: number;
  /** `<tag#id.class> "name"` */
  readonly element: string;
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /** Why the focused element was not visibly on screen; empty when it was. */
  readonly problems: readonly string[];
}

export interface FocusWalkOptions {
  /** Upper bound on Tab presses before the walk is reported as never ending (default 400). */
  readonly maxStops?: number;
}

/** Thrown when the Tab order reaches an element a sighted keyboard user cannot see. */
export class InvisibleFocusTargetError extends Error {
  override readonly name = 'InvisibleFocusTargetError';

  constructor(
    message: string,
    readonly stops: readonly FocusStop[],
  ) {
    super(message);
  }
}

const WALK_KEY = '__xrFocusWalk';

type StepResult =
  | { readonly kind: 'end' }
  | { readonly kind: 'wrapped' }
  | {
      readonly kind: 'stop';
      readonly id: number;
      readonly frame: boolean;
      readonly stop: Omit<FocusStop, 'index'>;
    };

/** Tab presses allowed inside one iframe before the walk gives up on leaving it. */
const MAX_PRESSES_IN_FRAME = 200;

/**
 * Walks the page with the Tab key from the start of the document until focus leaves the
 * document or returns to an element already visited, and fails when the walk reaches an
 * invisible focus target (Appendix F §7.2; the B1-10 defect class, BC13).
 *
 * Every focused element must:
 *  - pass `checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })`;
 *  - have a box of at least 2×2 CSS px;
 *  - have at least 2×2 of that box inside the viewport;
 *  - not be clipped below 2×2 by its own `clip` / `clip-path: inset(…)`, or by an ancestor
 *    that clips it: `overflow` other than `visible`, `contain: paint`, `clip` on an absolutely
 *    positioned box, or `clip-path: inset(…)`. Containing blocks are respected, so an overflow
 *    ancestor does not clip a `position: fixed` or `absolute` descendant it does not contain.
 *
 * Each element is measured once focus scrolling has settled (smooth scrolling included). The
 * walk starts at the top: the document element is focused for an instant (a temporary
 * `tabindex="-1"`, removed at once, `preventScroll`) so the next Tab reaches the first
 * focusable element, as on a fresh page load. An iframe is checked as one stop and the walk
 * continues after it; the frame's own content is not walked.
 *
 * Returns every stop so a caller can assert more (for example the expected first stop).
 */
export async function expectNoInvisibleFocusTargets(
  page: Page,
  options: FocusWalkOptions = {},
): Promise<readonly FocusStop[]> {
  const maxStops = options.maxStops ?? 400;
  await page.evaluate((key) => {
    const root = document.documentElement;
    const previous = root.getAttribute('tabindex');
    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
    if (previous === null) root.removeAttribute('tabindex');
    else root.setAttribute('tabindex', previous);
    (window as unknown as Record<string, unknown>)[key] = { seen: new WeakMap(), next: 0 };
  }, WALK_KEY);

  const stops: FocusStop[] = [];
  let resumeAfterFrame = false;
  try {
    for (;;) {
      if (stops.length >= maxStops) {
        throw new InvisibleFocusTargetError(
          `The Tab walk did not end after ${maxStops} stops (a focus trap that never cycles, or more stops than maxStops).`,
          stops,
        );
      }
      // After an iframe, focus already rests on the first element past it: inspect that one.
      if (!resumeAfterFrame) await page.keyboard.press('Tab');
      resumeAfterFrame = false;
      await page.evaluate(settleFocus);
      const step = await page.evaluate(inspectActiveElement, WALK_KEY);
      if (step.kind !== 'stop') break;
      stops.push({ index: stops.length + 1, ...step.stop });
      if (step.frame) {
        await leaveFrame(page, step.id, stops);
        resumeAfterFrame = true;
      }
    }
  } finally {
    await page.evaluate((key) => {
      delete (window as unknown as Record<string, unknown>)[key];
    }, WALK_KEY);
  }

  const invisible = stops.filter((stop) => stop.problems.length > 0);
  if (invisible.length > 0) {
    const lines = invisible.map(
      (stop) =>
        `  Tab stop ${stop.index}: ${stop.element}\n    - ${stop.problems.join('\n    - ')}`,
    );
    throw new InvisibleFocusTargetError(
      `${invisible.length} of ${stops.length} keyboard focus target(s) cannot be seen when focused:\n${lines.join('\n')}`,
      stops,
    );
  }
  return stops;
}

/** Tabs through an iframe's own content until focus comes back out to this document. */
async function leaveFrame(page: Page, frameId: number, stops: readonly FocusStop[]): Promise<void> {
  for (let presses = 0; presses < MAX_PRESSES_IN_FRAME; presses += 1) {
    const inside = await page.evaluate(
      ({ key, id }) => {
        const walk = (window as unknown as Record<string, { seen: WeakMap<Element, number> }>)[key];
        const active = document.activeElement;
        return Boolean(active && walk?.seen.get(active) === id);
      },
      { key: WALK_KEY, id: frameId },
    );
    if (!inside) return;
    await page.keyboard.press('Tab');
  }
  throw new InvisibleFocusTargetError(
    `Focus did not leave an iframe after ${MAX_PRESSES_IN_FRAME} Tab presses (a focus trap inside the frame).`,
    stops,
  );
}

/** Runs in the page: resolves once the focused element has stopped moving (focus scrolling). */
function settleFocus(): Promise<void> {
  return new Promise((resolve) => {
    let previous = '';
    let still = 0;
    let frames = 0;
    const tick = () => {
      const rect = document.activeElement?.getBoundingClientRect();
      const current = rect ? `${rect.left},${rect.top},${rect.width},${rect.height}` : '';
      still = current === previous ? still + 1 : 0;
      previous = current;
      frames += 1;
      if (still >= 3 || frames > 90) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Runs in the page; self-contained because Playwright serialises it. */
function inspectActiveElement(key: string): StepResult {
  interface Walk {
    seen: WeakMap<Element, number>;
    next: number;
  }
  interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  const walk = (window as unknown as Record<string, Walk | undefined>)[key];
  if (!walk) throw new Error('The focus walk state is missing from the page.');

  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  if (!active || active === document.body || active === document.documentElement) {
    return { kind: 'end' };
  }
  if (walk.seen.has(active)) return { kind: 'wrapped' };
  walk.next += 1;
  const id = walk.next;
  walk.seen.set(active, id);

  const problems: string[] = [];
  const box = active.getBoundingClientRect();
  if (!active.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
    problems.push(
      'checkVisibility() is false (display, visibility, content-visibility or opacity hides it)',
    );
  }
  if (box.width < 2 || box.height < 2) {
    problems.push(`its box is ${round(box.width)}×${round(box.height)} px (under 2×2)`);
  }

  const viewport: Rect = {
    left: 0,
    top: 0,
    right: document.documentElement.clientWidth,
    bottom: document.documentElement.clientHeight,
  };
  let visible = intersect(rectOf(box), viewport);
  if (tooSmall(visible)) {
    problems.push(
      `it is outside the viewport (box ${round(box.width)}×${round(box.height)} at ${round(box.left)},${round(box.top)}; viewport ${viewport.right}×${viewport.bottom})`,
    );
  } else {
    // Its own clip shapes first: overflow never clips an element's own border box.
    const ownStyle = getComputedStyle(active);
    const self = clipShapes(active, ownStyle, visible);
    visible = self.visible;
    if (self.reasons.length > 0 && tooSmall(visible)) {
      problems.push(
        `it is clipped to ${sizeText(visible)} px by its own ${self.reasons.join(', ')}`,
      );
    } else {
      // Then the containing-block chain: an ancestor clips only what it contains.
      let mode = ownStyle.position;
      for (let ancestor = parentOf(active); ancestor; ancestor = parentOf(ancestor)) {
        if (ancestor === document.body || ancestor === document.documentElement) break;
        const style = getComputedStyle(ancestor);
        const establishesForFixed =
          style.transform !== 'none' ||
          style.perspective !== 'none' ||
          style.filter !== 'none' ||
          /\b(?:paint|layout|strict|content)\b/.test(style.contain) ||
          /\b(?:transform|perspective|filter)\b/.test(style.willChange);
        const contains =
          mode === 'fixed'
            ? establishesForFixed
            : mode === 'absolute'
              ? style.position !== 'static' || establishesForFixed
              : true;
        if (!contains) continue;
        mode = style.position;
        if (/^inline(?!-)/.test(style.display) || style.display === 'contents') continue;

        const own = ancestor.getBoundingClientRect();
        const padding: Rect = {
          left: own.left + ancestor.clientLeft,
          top: own.top + ancestor.clientTop,
          right: own.left + ancestor.clientLeft + ancestor.clientWidth,
          bottom: own.top + ancestor.clientTop + ancestor.clientHeight,
        };
        const reasons: string[] = [];
        const paint = /\b(?:paint|strict|content)\b/.test(style.contain);
        if (style.overflowX !== 'visible' || paint) {
          visible = {
            ...visible,
            left: Math.max(visible.left, padding.left),
            right: Math.min(visible.right, padding.right),
          };
          if (style.overflowX !== 'visible') reasons.push(`overflow-x: ${style.overflowX}`);
        }
        if (style.overflowY !== 'visible' || paint) {
          visible = {
            ...visible,
            top: Math.max(visible.top, padding.top),
            bottom: Math.min(visible.bottom, padding.bottom),
          };
          if (style.overflowY !== 'visible') reasons.push(`overflow-y: ${style.overflowY}`);
        }
        if (paint) reasons.push(`contain: ${style.contain}`);
        const shapes = clipShapes(ancestor, style, visible);
        visible = shapes.visible;
        reasons.push(...shapes.reasons);

        if (reasons.length > 0 && tooSmall(visible)) {
          problems.push(
            `it is clipped to ${sizeText(visible)} px by ${describe(ancestor)} (${reasons.join(', ')})`,
          );
          break;
        }
      }
    }
  }

  return {
    kind: 'stop',
    id,
    frame: active.tagName === 'IFRAME' || active.tagName === 'FRAME',
    stop: {
      element: describe(active),
      box: {
        x: round(box.left),
        y: round(box.top),
        width: round(box.width),
        height: round(box.height),
      },
      problems,
    },
  };

  /** `clip` (absolutely positioned boxes) and `clip-path: inset(…)` of one element. */
  function clipShapes(
    element: Element,
    style: CSSStyleDeclaration,
    current: Rect,
  ): { visible: Rect; reasons: string[] } {
    const own = element.getBoundingClientRect();
    const reasons: string[] = [];
    let result = current;
    if ((style.position === 'absolute' || style.position === 'fixed') && style.clip !== 'auto') {
      const clip = /rect\(\s*([-\d.]+)px,?\s*([-\d.]+)px,?\s*([-\d.]+)px,?\s*([-\d.]+)px\s*\)/.exec(
        style.clip,
      );
      if (clip) {
        const [top, right, bottom, left] = clip.slice(1, 5).map(Number) as [
          number,
          number,
          number,
          number,
        ];
        result = intersect(result, {
          left: own.left + left,
          top: own.top + top,
          right: own.left + right,
          bottom: own.top + bottom,
        });
        reasons.push(`clip: ${style.clip}`);
      }
    }
    const inset = /^inset\(([^)]*)\)/.exec(style.clipPath);
    if (inset?.[1]) {
      const parts = (inset[1].split(/\s+round\s+/)[0] ?? '').trim().split(/\s+/);
      const [t, r, b, l] =
        parts.length === 1
          ? [parts[0], parts[0], parts[0], parts[0]]
          : parts.length === 2
            ? [parts[0], parts[1], parts[0], parts[1]]
            : parts.length === 3
              ? [parts[0], parts[1], parts[2], parts[1]]
              : [parts[0], parts[1], parts[2], parts[3]];
      const length = (value: string | undefined, size: number): number =>
        value?.endsWith('%') ? (parseFloat(value) / 100) * size : parseFloat(value ?? '0') || 0;
      result = intersect(result, {
        left: own.left + length(l, own.width),
        top: own.top + length(t, own.height),
        right: own.right - length(r, own.width),
        bottom: own.bottom - length(b, own.height),
      });
      reasons.push(`clip-path: ${style.clipPath}`);
    }
    return { visible: result, reasons };
  }
  function describe(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const elementId = element.id ? `#${element.id}` : '';
    const classes =
      typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
    const label =
      element.getAttribute('aria-label') ??
      element.getAttribute('title') ??
      (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    const name = label ? ` "${label.length > 60 ? `${label.slice(0, 57)}…` : label}"` : '';
    return `<${tag}${elementId}${classes}>${name}`;
  }
  function parentOf(element: Element): Element | null {
    if (element.assignedSlot) return element.assignedSlot;
    if (element.parentElement) return element.parentElement;
    const root = element.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
  }
  function rectOf(rect: DOMRect): Rect {
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  }
  function intersect(a: Rect, b: Rect): Rect {
    return {
      left: Math.max(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.min(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom),
    };
  }
  function tooSmall(rect: Rect): boolean {
    return rect.right - rect.left < 2 || rect.bottom - rect.top < 2;
  }
  function sizeText(rect: Rect): string {
    return `${round(Math.max(0, rect.right - rect.left))}×${round(Math.max(0, rect.bottom - rect.top))}`;
  }
  function round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
