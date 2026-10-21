'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/**
 * Today in words for the date line over a page's title (`p.rb-eyebrow-date`, the export's
 * `S.dateLong`): "Thursday 22 October 2026", on the session's clock (its sign-in instant) — the
 * screens have no clock of their own. Nothing before the session is known.
 */
export function useInstituteTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}
