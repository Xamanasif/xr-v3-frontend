'use client';

import { dayMonth, weekdayDate } from '@/copy/dates';
import { ageWords, sinceWords } from '@/copy/rv-shared';
import { useSession } from '@/queries/session';

/**
 * How long an item has waited for the reviewer, on the session's clock (the export's `ageOf` and
 * `short`): whole calendar days in Indian time — the sample world's zone, as every date of the app
 * is read — from the day it reached the reviewer to today. The screens have no clock of their own:
 * today is the session's sign-in instant, as the shell's top line.
 */
export interface RvWaitingAge {
  readonly days: number;
  /** "Today", "1 day", "13 days" (`b`). */
  readonly age: string;
  /** The day it arrived: "24 Aug". */
  readonly day: string;
  /** "since 24 Aug". */
  readonly since: string;
}

const DAY_MS = 86_400_000;

const IST_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

/** The calendar day of an instant in Indian time, as a day number. */
function istDayNumber(instant: string): number {
  const parts = Object.fromEntries(
    IST_DAY.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!) / DAY_MS;
}

/** Whole calendar days from `from` to `today`, never below 0. */
export function daysWaiting(from: string, today: string): number {
  return Math.max(0, istDayNumber(today) - istDayNumber(from));
}

/** The waiting age of an item that arrived at `since`, seen on `today`. */
export function waitingAge(since: string, today: string): RvWaitingAge {
  const days = daysWaiting(since, today);
  const day = dayMonth(since);
  return { days, age: ageWords(days), day, since: sinceWords(day) };
}

/** Today on the session's clock (its sign-in instant); `null` before the session is known. */
export function useRvToday(): string | null {
  const session = useSession();
  return session.status === 'signed-in' ? session.signedInAt : null;
}

/** Today in words for the date line on phones (`p.rb-eyebrow-date`): "Friday 2 October 2026". */
export function useRvTodayLine(): string | undefined {
  const today = useRvToday();
  return today === null ? undefined : weekdayDate(today);
}
