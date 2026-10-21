/**
 * Whole calendar days in Indian time from one instant to another (state-copy `FA-18.days`): the
 * sample world is set in Indian time, so a day is a date there whatever the browser's zone. A
 * later `from` than `to` reads 0 (“Today”).
 */
const IST_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

const DAY_MS = 86_400_000;

function istDayNumber(instant: string): number {
  const parts = Object.fromEntries(
    IST_PARTS.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!) / DAY_MS;
}

export function calendarDaysSince(from: string, to: string): number {
  return Math.max(0, istDayNumber(to) - istDayNumber(from));
}
