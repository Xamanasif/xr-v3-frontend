/**
 * Form-field primitives shared by forms and adapters (Appendix C §5.1–§5.3; Appendix F §6.4).
 *
 * These are ACCEPTED-form schemas: they trim and parse exactly as the boards' own validators do
 * (B1-07 `reqValidate` tests `f.lic.trim()` against `/^[1-9][0-9]*$/`), and a rejected value never
 * becomes a default (Appendix C §5.2). Because they trim and parse, they are never published as
 * wire schemas; a representable wire twin is made when an API serves them (ADR-0008, removal
 * trigger).
 *
 * Every primitive takes the KEY of its drawn message, not the words: the copy catalogue keyed by
 * rule lives with the contracts (ADR-0008 decision 6; Appendix F §6.7), so changing a word never
 * touches a rule. A key is reported as the zod issue message; when a value is both missing and
 * malformed only the first (missing) key is reported, as the boards show one message per field.
 */
import { z } from 'zod';

/** The boards' e-mail rule (B1-07, B2-07, B7-03, B7-08): checked on the trimmed value. */
export const EMAIL_AS_DRAWN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The boards' link rule (B5-04, B5-05): "Enter a web link that starts with https://". */
export const HTTPS_LINK_AS_DRAWN = /^https:\/\/[^\s/.]+\.[^\s]+$/;

/** A whole number of 1 or more, as typed (B1-07 licences; B3-08; B4-07 marks). */
export const WHOLE_NUMBER_FROM_ONE = /^[1-9][0-9]*$/;

/** A whole number of 0 or more, as typed (B4-04 pass mark; B4-09 marks). */
export const WHOLE_NUMBER_FROM_ZERO = /^(?:0|[1-9][0-9]*)$/;

/** Text that must be present once trimmed; the accepted value is trimmed. */
export function requiredTrimmed(key: string) {
  return z.string({ error: key }).trim().min(1, { error: key, abort: true });
}

/**
 * Optional free text: `null`, or a string that is trimmed, with blank read as `null` — an explicit
 * transformation, never a default value.
 */
export function optionalTrimmed() {
  return z
    .string()
    .nullable()
    .transform((value) => {
      if (value === null) return null;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    });
}

/**
 * A whole number typed as text ("120", " 60 "): required (`requiredKey`), then
 * `/^[1-9][0-9]*$/` on the trimmed value (`formatKey`), then parsed to a number.
 */
export function wholeNumberString(requiredKey: string, formatKey: string) {
  return requiredTrimmed(requiredKey)
    .regex(WHOLE_NUMBER_FROM_ONE, { error: formatKey })
    .transform((value) => Number(value));
}

/**
 * A whole number in `[min, max]` typed as text (B4-04 "Enter a pass mark from 0 to 100, as a whole
 * number"; B4-09 "Enter a whole number from 0 to 10"). Out of range or not whole → `formatKey`.
 */
export function wholeNumberInRange(
  min: number,
  max: number,
  requiredKey: string,
  formatKey: string,
) {
  return requiredTrimmed(requiredKey)
    .regex(min === 0 ? WHOLE_NUMBER_FROM_ZERO : WHOLE_NUMBER_FROM_ONE, { error: formatKey })
    .transform((value) => Number(value))
    .refine((value) => value >= min && value <= max, { error: formatKey });
}

/** An e-mail address as the boards check it; the accepted value is trimmed. */
export function emailAsDrawn(requiredKey: string, formatKey: string) {
  return requiredTrimmed(requiredKey).regex(EMAIL_AS_DRAWN, { error: formatKey });
}

/** An https link as the boards check it; the accepted value is trimmed. */
export function httpsLinkAsDrawn(requiredKey: string, formatKey: string) {
  return requiredTrimmed(requiredKey).regex(HTTPS_LINK_AS_DRAWN, { error: formatKey });
}

/** A calendar date `YYYY-MM-DD` that exists (no 30 February), as a form date input sends it. */
export function calendarDateString(requiredKey: string, formatKey: string) {
  return requiredTrimmed(requiredKey).pipe(z.iso.date({ error: formatKey }));
}
