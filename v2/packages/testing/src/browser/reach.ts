import type { Locator, Page } from '@playwright/test';

export interface ReachOptions {
  /** Wheel distance per step in CSS px (default 120, one wheel notch). */
  readonly step?: number;
  /** Upper bound on wheel steps before giving up (default 200). */
  readonly maxSteps?: number;
}

/** Thrown when a real pointer cannot reach the target. The message says what was hit instead. */
export class ReachError extends Error {
  override readonly name = 'ReachError';
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface HitTest {
  readonly hit: boolean;
  readonly target: string;
  readonly atPoint: string;
  readonly scroll: string;
}

/** Wheel steps without movement before the page is declared to have stopped scrolling. */
const STILL_STEPS = 3;

/**
 * The real-pointer reach test (`handoff/README.md` "What the build must add"; B8-06 Tests;
 * B8-05 "Real-pointer reach … mouse wheel + click"; the Batch-4 lesson that programmatic
 * scrolling had hidden a clipped Submit; Appendix F §7.2):
 *
 *  1. move the mouse to the centre of the viewport and wheel back to the top;
 *  2. wheel (`page.mouse.wheel`) until the target's box is in the viewport;
 *  3. hit-test the centre of its visible part with `document.elementFromPoint`, which must
 *     be the target or inside it;
 *  4. click there with `page.mouse.click`.
 *
 * It never calls `scrollIntoView`, `window.scrollTo` or `locator.click()` (which scrolls by
 * itself), so a control that only programmatic scrolling can reveal fails here. It fails
 * when the target is never hit-testable: hidden, clipped (for example by `overflow: clip`),
 * covered, or beyond the end of everything the wheel can scroll.
 */
export async function reachAndClick(
  page: Page,
  target: Locator,
  options: ReachOptions = {},
): Promise<void> {
  const step = options.step ?? 120;
  const maxSteps = options.maxSteps ?? 200;
  await target.waitFor({ state: 'attached' });

  const viewport =
    page.viewportSize() ??
    (await page.evaluate(() => ({ width: innerWidth, height: innerHeight })));
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  // 1. Back to the top, by wheel only.
  let still = 0;
  for (let i = 0; i < maxSteps && still < STILL_STEPS; i += 1) {
    const before = await settledBox(page, target);
    await page.mouse.wheel(0, -step * 8);
    const after = await settledBox(page, target);
    still = sameBox(before, after) ? still + 1 : 0;
  }

  // 2–4. Wheel down until the target can be hit, then click it.
  still = 0;
  let last: HitTest | null = null;
  let box: Box | null = null;
  for (let i = 0; i <= maxSteps; i += 1) {
    box = await settledBox(page, target);
    if (!box) {
      throw new ReachError(
        `The target has no box (it is not rendered: display:none, detached or zero-size).`,
      );
    }
    const visible = visiblePart(box, viewport);
    if (visible) {
      const x = visible.x + visible.width / 2;
      const y = visible.y + visible.height / 2;
      last = await target.evaluate(hitTestInPage, { x, y });
      if (last.hit) {
        await page.mouse.click(x, y);
        return;
      }
    }
    if (still >= STILL_STEPS || i === maxSteps) break;

    const dx =
      box.x + box.width / 2 < 0 ? -step : box.x + box.width / 2 > viewport.width ? step : 0;
    const dy = box.y + box.height / 2 < 0 ? -step : visible && dx === 0 ? step / 2 : step;
    await page.mouse.wheel(dx, dy);
    const moved = await settledBox(page, target);
    still = sameBox(box, moved) ? still + 1 : 0;
  }

  const where = box
    ? `box ${round(box.width)}×${round(box.height)} at ${round(box.x)},${round(box.y)} in a ${viewport.width}×${viewport.height} viewport`
    : 'no box';
  const detail = last
    ? `the point over it hits ${last.atPoint} instead of ${last.target}; scroll position ${last.scroll}`
    : 'it never entered the viewport';
  throw new ReachError(
    `A real pointer cannot reach the target by mouse wheel: ${where}; ${detail}. ` +
      `The wheel ${still >= STILL_STEPS ? 'stopped moving the page' : `ran out after ${maxSteps} steps`}, ` +
      `so the control is clipped, covered or beyond what scrolling can show.`,
  );
}

/** The target's box once two animation frames in a row leave it where it is. */
async function settledBox(page: Page, target: Locator): Promise<Box | null> {
  let previous = await target.boundingBox();
  for (let i = 0; i < 40; i += 1) {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    const current = await target.boundingBox();
    if (i > 0 && sameBox(previous, current)) return current;
    previous = current;
  }
  return previous;
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/** The part of the box inside the viewport, when it is at least 2×2. */
function visiblePart(box: Box, viewport: { width: number; height: number }): Box | null {
  const left = Math.max(box.x, 0);
  const top = Math.max(box.y, 0);
  const right = Math.min(box.x + box.width, viewport.width);
  const bottom = Math.min(box.y + box.height, viewport.height);
  if (right - left < 2 || bottom - top < 2) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function round(value: number): number {
  return Math.round(value);
}

/** Runs in the page; self-contained because Playwright serialises it. */
function hitTestInPage(element: Element, point: { x: number; y: number }): HitTest {
  const describe = (node: Element | null): string => {
    if (!node) return '(nothing)';
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : '';
    const classes =
      typeof node.className === 'string' && node.className.trim()
        ? `.${node.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
    const label =
      node.getAttribute('aria-label') ?? (node.textContent ?? '').replace(/\s+/g, ' ').trim();
    const name = label ? ` "${label.length > 40 ? `${label.slice(0, 37)}…` : label}"` : '';
    return `<${tag}${id}${classes}>${name}`;
  };
  const atPoint = document.elementFromPoint(point.x, point.y);
  return {
    hit: atPoint !== null && (atPoint === element || element.contains(atPoint)),
    target: describe(element),
    atPoint: describe(atPoint),
    scroll: `${Math.round(scrollX)},${Math.round(scrollY)}`,
  };
}
