// @vitest-environment node
/**
 * The hero's rotation and Pause/Play state machine (21 FROZEN `tick` 1218–1231, `selectHero`
 * 1232–1235, Pause/Play 2011–2015, the reduced-motion listener 1118–1124).
 */
import { describe, expect, it } from 'vitest';

import { heroReducer, INITIAL_HERO, motionOn, ROTATION_MS, rotates } from './hero-state';

describe('the hero state', () => {
  it('starts on the first scene, rotating every 7.6 s with ambient motion', () => {
    expect(INITIAL_HERO).toEqual({ sel: 0, gen: 0, playing: true, ambient: true });
    expect(ROTATION_MS).toBe(7600);
    expect(rotates(INITIAL_HERO, false)).toBe(true);
    expect(motionOn(INITIAL_HERO, false)).toBe(true);
  });

  it('advances 0 → 1 → 2 → 0, each change a new sweep', () => {
    let state = INITIAL_HERO;
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      state = heroReducer(state, { type: 'advance', count: 3 });
      seen.push(state.sel);
    }
    expect(seen).toEqual([1, 2, 0, 1]);
    expect(state.gen).toBe(4);
  });

  it('a manual pick selects and stops rotation; ambient motion continues', () => {
    const picked = heroReducer(INITIAL_HERO, { type: 'select', index: 2 });
    expect(picked).toEqual({ sel: 2, gen: 1, playing: false, ambient: true });
    expect(rotates(picked, false)).toBe(false);
    // Motion is still on (ambient), so the button still offers Pause.
    expect(motionOn(picked, false)).toBe(true);
    // Picking the scene on show only pauses: no new sweep.
    expect(heroReducer(INITIAL_HERO, { type: 'select', index: 0 })).toEqual({
      ...INITIAL_HERO,
      playing: false,
    });
  });

  it('Pause stops rotation and every ambient loop; Play starts both', () => {
    const paused = heroReducer(INITIAL_HERO, { type: 'toggle', reduce: false });
    expect(paused).toMatchObject({ playing: false, ambient: false });
    expect(motionOn(paused, false)).toBe(false);
    const played = heroReducer(paused, { type: 'toggle', reduce: false });
    expect(played).toMatchObject({ playing: true, ambient: true });
    // After a manual pick (ambient still on) the button pauses everything.
    const picked = heroReducer(INITIAL_HERO, { type: 'select', index: 1 });
    expect(heroReducer(picked, { type: 'toggle', reduce: false })).toMatchObject({
      playing: false,
      ambient: false,
    });
  });

  it('reduced motion: rotation off and motion off; leaving it keeps what was chosen', () => {
    const reduced = heroReducer(INITIAL_HERO, { type: 'reduce', matches: true });
    expect(reduced.playing).toBe(false);
    expect(motionOn(INITIAL_HERO, true)).toBe(false);
    expect(rotates(INITIAL_HERO, true)).toBe(false);
    expect(heroReducer(reduced, { type: 'reduce', matches: false })).toBe(reduced);
    // Under reduced motion Play turns motion on in state, but nothing moves while it lasts.
    const played = heroReducer(reduced, { type: 'toggle', reduce: true });
    expect(played).toMatchObject({ playing: true, ambient: true });
    expect(rotates(played, true)).toBe(false);
  });
});
