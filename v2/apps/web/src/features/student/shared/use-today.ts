'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/** Today, as the Student pages read it: the session's clock (its sign-in instant). */
export interface StudentToday {
  /** The instant the pages count from ("in 13 days", "due today"). */
  readonly now: string;
  /** "Thursday 5 November 2026": the date line over a page's title (`p.rb-eyebrow-date`). */
  readonly line: string;
}

/**
 * Today for every Student page (the export's `S.dateLong` and its `whenOf` clock): the screens have
 * no clock of their own, so it is the session's sign-in instant — as the V3 shell's top line
 * (`WorkspaceFrame` passes `signedInAt`) and the Faculty pages (`useFacultyToday`) read it. `null`
 * before the session is known.
 */
export function useStudentToday(): StudentToday | null {
  const session = useSession();
  if (session.status !== 'signed-in') return null;
  return { now: session.signedInAt, line: weekdayDate(session.signedInAt) };
}

/** Today's date line alone ("Monday 12 October 2026"), or nothing before the session is known. */
export function useStudentTodayLine(): string | undefined {
  return useStudentToday()?.line;
}
