import { faDaysLeftWords, FA_DEADLINE_WORDS } from '@/copy/fa-shared';

const DAY_MS = 86_400_000;

const IST_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

/** The calendar day of an instant in Indian time (the sample world's zone), as a day number. */
function istDayNumber(instant: string): number {
  const parts = Object.fromEntries(
    IST_DAY.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!) / DAY_MS;
}

/** A deadline seen on the session's day (the export's `days`, `past`). */
export interface DeadlineView {
  /** Whole calendar days from today to the deadline's day (0: due today). */
  readonly days: number;
  /** The deadline instant is behind `now`. */
  readonly passed: boolean;
}

/**
 * A deadline against the session's clock (the screens have no clock of their own: the session's
 * sign-in instant, as the existing Faculty pages): calendar days in Indian time, and whether the
 * instant has gone by. Presentation only — the service decides what a passed deadline means.
 */
export function deadlineView(deadline: string, now: string): DeadlineView {
  return {
    days: istDayNumber(deadline) - istDayNumber(now),
    passed: Date.parse(deadline) < Date.parse(now),
  };
}

/**
 * The deadline's short words while it is open ("7 days left", "Due today" or "today"), or
 * "Deadline passed" — the export's `left` / `dueNote` with the records' dates.
 */
export function deadlineWords(
  deadline: string,
  now: string,
  sameDay: 'due' | 'short' = 'due',
): string {
  const view = deadlineView(deadline, now);
  return view.passed ? FA_DEADLINE_WORDS.passed : faDaysLeftWords(Math.max(view.days, 0), sameDay);
}
