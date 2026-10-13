/**
 * Time (Appendix C §1.2; Appendix F §6.2). Rules never read the system clock: every decision and
 * derivation takes `now` from the one sample-world clock (`ClockPort`, ADR-0007 §1).
 *
 * - `IsoInstant` is the canonical UTC `toISOString` form; instants compare as strings.
 * - `CalendarDate` is `YYYY-MM-DD` (plan start and end, "Until a fixed date").
 * - Day arithmetic counts whole UTC calendar days. The display zone is not drawn (all sample
 *   times read as Indian local time); it is an owner note, not a rule here (Appendix C §1.2 [P]).
 */
import type { Brand } from './brand.js';

export type IsoInstant = Brand<string, 'IsoInstant'>;
export type CalendarDate = Brand<string, 'CalendarDate'>;

/** One sample-world clock for every service (BC14). */
export interface ClockPort {
  now(): IsoInstant;
}

const INSTANT_FORM = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DATE_FORM = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** Accepts only the canonical form; anything else is invalid data and throws. */
export function isoInstant(value: string): IsoInstant {
  if (!INSTANT_FORM.test(value) || new Date(value).toISOString() !== value) {
    throw new RangeError(`Not a canonical UTC instant: ${value}`);
  }
  return value as IsoInstant;
}

/**
 * Accepts only a real `YYYY-MM-DD` date. An unreadable end date is invalid data, never read as
 * "expired" (CF-06 interim, Appendix F §10.2 — replaces the Slice-1 fail-closed reading).
 */
export function calendarDate(value: string): CalendarDate {
  if (
    !DATE_FORM.test(value) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError(`Not a calendar date: ${value}`);
  }
  return value as CalendarDate;
}

export function compareInstants(a: IsoInstant, b: IsoInstant): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function isBefore(a: IsoInstant, b: IsoInstant): boolean {
  return a < b;
}

/** The UTC calendar date of an instant. */
export function dateOf(instant: IsoInstant): CalendarDate {
  return instant.slice(0, 10) as CalendarDate;
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / DAY_MS,
  );
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10) as CalendarDate;
}

/** The later of two instants. */
export function laterOf(a: IsoInstant, b: IsoInstant): IsoInstant {
  return a >= b ? a : b;
}
