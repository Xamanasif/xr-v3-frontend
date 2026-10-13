/**
 * The one sample-world clock (TE-5; ADR-0007 §1; Appendix F §4.4). Every decision and read model
 * takes `now` from it; time-based states (Ending soon, Access ended, Result ready by date) are
 * derived at read time, never scheduled.
 *
 *  - anchored: `now = anchor + (realNow − seededAtReal)`. The real time is INJECTED by the
 *    composition root — this package never reads a clock itself (no `Date.now`, WP-0.11
 *    acceptance 6) — so dates move naturally and the world stays coherent;
 *  - fixed: no real clock given — the clock stays at the anchor (deterministic builds, tests);
 *  - manual: set by the seed loader and by tests only (`setSampleNow` is exported from
 *    `./testing`, X-8). Nothing in the product shows or sets the clock.
 */
import { isoInstant, type IsoInstant } from '@xr/domain';

export interface SampleClock {
  now(): IsoInstant;
}

/** A clock the seed loader and tests move by hand. */
export interface ManualClock extends SampleClock {
  set(instant: IsoInstant): void;
}

/** Milliseconds since the epoch, supplied from outside (e.g. the browser's clock). */
export type RealNow = () => number;

export function fixedClock(at: IsoInstant): SampleClock {
  return { now: () => at };
}

export function anchoredClock(
  anchor: IsoInstant,
  seededAtReal: number,
  realNow: RealNow,
): SampleClock {
  const anchorMs = Date.parse(anchor);
  return {
    now: () => isoInstant(new Date(anchorMs + Math.max(0, realNow() - seededAtReal)).toISOString()),
  };
}

export function manualClock(start: IsoInstant): ManualClock {
  let current = start;
  return {
    now: () => current,
    set: (instant) => {
      current = isoInstant(instant);
    },
  };
}

/**
 * The platform's clock: the anchored or fixed clock, which only the seed loader and tests can move
 * (`setSampleNow`, exported from `./testing`, X-8). Nothing in the product sets it.
 */
export interface SampleClockControl extends SampleClock {
  set(instant: IsoInstant): void;
}

export function controllableClock(base: SampleClock): SampleClockControl {
  let override: IsoInstant | null = null;
  return {
    now: () => override ?? base.now(),
    set: (instant) => {
      override = isoInstant(instant);
    },
  };
}
