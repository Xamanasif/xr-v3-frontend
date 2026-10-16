/**
 * SA-21 Support report (Phase 6; board B7-09 f8 … f12; B7-10 f12): the Resolve note's check on
 * the contract's own schema — features import contracts for types only (Appendix F §3.8), so the
 * runtime piece lives here. Pressing Resolve with no note shows "Add a note — the reporter sees
 * it" before anything is sent (B7-09 `resolve`, f11), with `resolveReportInput`'s rule and message
 * key (`SA-21.note.required`); the service's own `validation-failed` answer is read the same way.
 */
import { parseInput, resolveReportInput, type ValidationFailed } from '@xr/contracts/draft';

import { fieldWords } from '@/copy/field-words';

/** The note's error in words from a `validation-failed` answer, or `null` when it names none. */
export function noteErrorOf(error: ValidationFailed): string | null {
  for (const fieldError of error.fieldErrors) {
    if (fieldError.field !== 'note') continue;
    const words = fieldWords(fieldError);
    if (words) return words;
  }
  return null;
}

/**
 * B7-09 `resolve`: the note is required (a blank or spaces-only note is refused by the schema's
 * `requiredTrimmed`). Answers the drawn error, or `null` when the note may be sent.
 */
export function checkResolveNote(note: string): string | null {
  const parsed = parseInput(resolveReportInput, { id: 'SUP-0000', note, expectedRev: 1 }, null);
  return parsed.ok ? null : noteErrorOf(parsed.error);
}
