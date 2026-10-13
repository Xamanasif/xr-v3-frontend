/**
 * Dates as the boards write them (Appendix F §3.2 `copy/dates.ts`; B8-03: words, never numeric
 * dates). The sample world is set in Indian time (`@xr/sample-platform` anchor, IST), so dates are
 * read in Asia/Kolkata whatever the browser's own zone. Month names are written out here rather
 * than taken from `Intl` (whose English short month for September is "Sept" in current ICU data,
 * where the boards draw "Sep").
 */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const IST = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

function partsOf(instant: string): { day: number; month: number; year: number } {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) throw new Error(`"${instant}" is not an instant.`);
  const parts = Object.fromEntries(
    IST.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return { day: parts['day']!, month: parts['month']!, year: parts['year']! };
}

/**
 * Day and month, "3 Oct" — the form board 07 uses for every Help & support date ("sent 3 Oct",
 * "Resolution note · 23 Sep", "Sent 21 Sep").
 */
export function dayMonth(instant: string): string {
  const { day, month } = partsOf(instant);
  return `${day} ${MONTHS[month - 1]}`;
}

/** Day, month and year, "8 Oct 2026" (B8-03). */
export function dayMonthYear(instant: string): string {
  const { day, month, year } = partsOf(instant);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
