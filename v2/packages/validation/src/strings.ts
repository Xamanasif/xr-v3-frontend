import { z } from 'zod';

/** A non-empty string, as sent (wire form: no trimming). */
export const nonEmptyString = z.string().min(1);

/** A string bounded to `max` characters (and at least `min`). */
export function boundedString(max: number, min = 1) {
  return z.string().min(min).max(max);
}
