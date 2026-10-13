/**
 * The term clock (system:term-clock; matrix ACC-06): Ending soon and Access ended are derived from
 * the plan dates and `now` on every read — never stored, never scheduled (ADR-0007 §1).
 *
 * Rules carried over from the Slice-1 `term.ts` (Appendix F §2.3), re-expressed for v46 calendar
 * dates and words (Access active · Ending soon · Access ended):
 *  - the Ending-soon boundary is inclusive: exactly `ENDING_SOON_DAYS` days left is Ending soon;
 *  - an Ending-soon plan is still live: it keeps giving access through its end date.
 * Changed from Slice-1: an unreadable end date is invalid data (CF-06 interim) — a `CalendarDate`
 * cannot hold one — never "expired".
 *
 * Day counts are whole calendar days, matching the drawn samples: "31 Oct 2026 · 8 days left" on
 * 23 Oct, "Ended 8 days ago" (B7-09 f4), "15 days left" (B2-01 f3). The plan is live through its
 * end date ("Yearly · 8 Oct 2026 to 7 Oct 2027", B2-03) [PROPOSED reading].
 */
import {
  addDays,
  type CalendarDate,
  dateOf,
  daysBetween,
  type IsoInstant,
} from '../kernel/time.js';
import type { AccessPlanTerm } from './model.js';

/**
 * 'Ending soon' / 'Reminder due' window. PROVISIONAL (BR-049 "for the frontend build only"; T-31;
 * schemas §8-32): one named constant, so an owner answer changes one line.
 */
export const ENDING_SOON_DAYS = 15;

export type PlanTermState = 'active' | 'ending-soon' | 'ended';

/** Days from today to the end date: 0 on the end date itself, negative once it has passed. */
export function daysLeft(plan: { readonly endsOn: CalendarDate }, now: IsoInstant): number {
  return daysBetween(dateOf(now), plan.endsOn);
}

export function planTermState(
  plan: { readonly endsOn: CalendarDate },
  now: IsoInstant,
): PlanTermState {
  const left = daysLeft(plan, now);
  if (left < 0) return 'ended';
  return left <= ENDING_SOON_DAYS ? 'ending-soon' : 'active';
}

/** "Ended 8 days ago" — `null` while the plan is live. */
export function endedDaysAgo(
  plan: { readonly endsOn: CalendarDate },
  now: IsoInstant,
): number | null {
  const left = daysLeft(plan, now);
  return left < 0 ? -left : null;
}

const MONTHS: Readonly<Record<Exclude<AccessPlanTerm, 'until-date'>, number>> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * The last day of a plan that starts on `startsOn`: "Yearly · 8 Oct 2026 to 7 Oct 2027" (B2-03),
 * i.e. the same day one term later, minus one day. Monthly and quarterly follow the same reading
 * [PROPOSED — not drawn]. "Until a fixed date" ends on the date given.
 */
export function termEndsOn(
  term: AccessPlanTerm,
  startsOn: CalendarDate,
  untilDate: CalendarDate | null = null,
): CalendarDate {
  if (term === 'until-date') {
    if (untilDate === null) throw new RangeError('An until-date term needs its end date.');
    return untilDate;
  }
  const [year, month, day] = startsOn.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 + MONTHS[term], 1));
  const lastOfMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastOfMonth));
  return addDays(target.toISOString().slice(0, 10) as CalendarDate, -1);
}
