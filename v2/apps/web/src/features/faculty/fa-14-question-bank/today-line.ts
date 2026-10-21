'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/**
 * Today in words for the date line over the bank's title (`p.rb-eyebrow-date`, the export's
 * `sh.date`; the shell's top line shows it on wider screens): "Saturday 7 November 2026", on the
 * session's clock (its sign-in instant) — the screens have no clock of their own. Nothing before
 * the session is known.
 */
export function useBankTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}
