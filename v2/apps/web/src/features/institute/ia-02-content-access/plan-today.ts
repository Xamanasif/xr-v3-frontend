'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

import { calendarDateOf } from './plan-facts';

/**
 * Today on the sample clock: the session's sign-in instant (the shell's top line, as the other
 * roles' V3 pages read it) — its words for the date line (`p.rb-eyebrow-date`) and its calendar
 * day, against which "Added on 8 October" leaves out this year.
 */
export function usePlanToday(): { readonly line: string | undefined; readonly day: string | null } {
  const session = useSession();
  if (session.status !== 'signed-in') return { line: undefined, day: null };
  return { line: weekdayDate(session.signedInAt), day: calendarDateOf(session.signedInAt) };
}
