'use client';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/** Today, as the Faculty pages read it: the session's clock (its sign-in instant). */
export interface FacultyToday {
  /** The instant (deadlines, days waiting, inactivity are counted from it). */
  readonly now: string;
  /** "Saturday 7 November 2026": the date line over a page's title (`p.rb-eyebrow-date`). */
  readonly line: string;
  /** "7 Nov 2026": the "As of …" of the activity counts. */
  readonly day: string;
}

/**
 * Today for every Faculty page (the export's `W.clock`: `sh.date` on FA-01, FA-02, FA-03, FA-05,
 * FA-06, FA-08 … FA-12, FA-14, FA-18, FA-20): the screens have no clock of their own, so it is the
 * session's sign-in instant, as the existing Faculty pages count it. `null` before the session is
 * known.
 */
export function useFacultyToday(): FacultyToday | null {
  const session = useSession();
  if (session.status !== 'signed-in') return null;
  const now = session.signedInAt;
  return { now, line: weekdayDate(now), day: dayMonthYear(now) };
}
