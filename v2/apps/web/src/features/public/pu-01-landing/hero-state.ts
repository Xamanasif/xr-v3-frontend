/**
 * The hero's scene and motion state (PU-01 V1, prompt 13): the frozen `heroSel`, `heroGen`,
 * `playing` and `ambient` (21 FROZEN 1106) and the transitions the frozen component makes on them —
 * `tick` (1218–1231), `selectHero` (1232–1235), the Pause/Play toggle (2011–2015) and the
 * reduced-motion listener (1118–1124) — as a pure reducer.
 */
import { HERO_ROTATION_MS } from './layout';

export interface HeroState {
  /** The scene on show. */
  readonly sel: number;
  /** Counts scene changes; a change replays the light sweep (1623). */
  readonly gen: number;
  /** Auto-rotation is on. */
  readonly playing: boolean;
  /** The ambient loops run (glow drift, field spin, flows). */
  readonly ambient: boolean;
}

export type HeroAction =
  | { readonly type: 'advance'; readonly count: number }
  | { readonly type: 'select'; readonly index: number }
  | { readonly type: 'toggle'; readonly reduce: boolean }
  | { readonly type: 'reduce'; readonly matches: boolean };

export const INITIAL_HERO: HeroState = { sel: 0, gen: 0, playing: true, ambient: true };

/** Whether motion is on — the Pause/Play button's state (1649 `motionOn`). */
export function motionOn(state: HeroState, reduce: boolean): boolean {
  return (state.playing || state.ambient) && !reduce;
}

/** Whether the scene rotates on its own (`tick` 1220: playing, not reduced). */
export function rotates(state: HeroState, reduce: boolean): boolean {
  return state.playing && !reduce;
}

export function heroReducer(state: HeroState, action: HeroAction): HeroState {
  switch (action.type) {
    case 'advance':
      // 1229: the next scene, and a new sweep.
      return { ...state, sel: (state.sel + 1) % action.count, gen: state.gen + 1 };
    case 'select':
      // 1233–1234: a manual pick stops rotation (ambient motion continues); picking the scene on
      // show only pauses.
      if (action.index === state.sel) return { ...state, playing: false };
      return { ...state, sel: action.index, gen: state.gen + 1, playing: false };
    case 'toggle': {
      // 2015: Pause stops rotation and every ambient loop; Play starts both.
      const on = motionOn(state, action.reduce);
      return { ...state, playing: !on, ambient: !on };
    }
    case 'reduce':
      // 1122: reduced motion stops rotation; leaving it keeps what was chosen.
      return action.matches ? { ...state, playing: false } : state;
  }
}

/** The rotation period, re-exported for the scheduler and the tests. */
export const ROTATION_MS = HERO_ROTATION_MS;
