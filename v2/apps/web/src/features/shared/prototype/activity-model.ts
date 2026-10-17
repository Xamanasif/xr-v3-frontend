/**
 * The sample WEB activity's rig (TE-3; owner authorisation of Phase 7): deterministic — the same
 * experiment and level always give the same measured value, so a walk-through and a test read the
 * same numbers. The value rises with the level, so the check question has one right answer: the
 * highest level the Student ran. Nothing here is a model of the real experiment.
 */
export const LEVELS = [1, 2, 3, 4, 5] as const;
/** The platform checks the same number (`SAMPLE_WEB_TRIALS` in `@xr/sample-platform`). */
export const TRIALS_NEEDED = 3;

export interface Trial {
  readonly level: number;
  readonly value: number;
}

function seedOf(name: string): number {
  let seed = 7;
  for (const character of name) seed = (seed * 31 + character.charCodeAt(0)) % 997;
  return seed;
}

/** The measured value at a level (one decimal place). */
export function measuredValue(experimentName: string, level: number): number {
  const seed = seedOf(experimentName);
  const base = 10 + (seed % 9);
  const step = 6 + (seed % 4);
  return Math.round((base + level * step - level * level * 0.4) * 10) / 10;
}

/** The level whose trial gave the highest measured value. */
export function highestLevel(trials: readonly Trial[]): number | null {
  if (trials.length === 0) return null;
  return trials.reduce((best, trial) => (trial.value > best.value ? trial : best)).level;
}
