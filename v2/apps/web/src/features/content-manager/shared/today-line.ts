'use client';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/**
 * Today on the sample clock, in words (“Thursday 27 August 2026”): the date line every Content
 * Manager page draws on phones (`p.rb-eyebrow-date` — the kit's `PageHead` `date` and
 * `CmIdentityBand` `date`; the V3 top bar shows it from 768 px). The screens have no clock of their
 * own: it is the session's sign-in instant, as the shell's top line (the Vendor's
 * `features/vendor/shared/today-line.ts` and the Super Admin's Content heads do the same).
 */
export function useCmTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}
