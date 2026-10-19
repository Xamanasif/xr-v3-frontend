'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/**
 * Today on the sample clock, in words (“Thursday 27 August 2026”): a Vendor page head's date line
 * on phones (`p.rb-eyebrow-date`; the V3 top bar shows it from 768 px). The screens have no clock
 * of their own: it is the session's sign-in instant, as the shell's top line. (The Super Admin's
 * Content screens have the same hook, `features/admin/sa-10-updates/content-head.tsx`: a candidate
 * for `features/shared` once a third role needs it.)
 */
export function useTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}
