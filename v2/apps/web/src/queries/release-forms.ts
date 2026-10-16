/**
 * SA-11 Release or hold an update (Phase 6; boards B7-05 f9, B7-10 f1): the Hold reason checked on
 * the contract's own schema before anything is sent — features import contracts for types only
 * (Appendix F §3.8), so the runtime piece lives here. `holdUpdateInput` requires a reason with the
 * message key `SA-11.reason.required` (“Add a reason — the Content Manager sees it”), and the
 * service's own `validation-failed` answer is read the same way.
 */
import { holdUpdateInput, parseInput, type ValidationFailed } from '@xr/contracts/draft';

import { fieldWords } from '@/copy/field-words';

const REASON_KEY = 'SA-11.reason.required';

/** A `validation-failed` answer's reason error in words (the catalogue's drawn message). */
export function holdReasonErrorOf(error: ValidationFailed): string | null {
  for (const fieldError of error.fieldErrors) {
    if (fieldError.key !== REASON_KEY) continue;
    const words = fieldWords(fieldError);
    if (words) return words;
  }
  return null;
}

/** B7-05 `doHold`: a blank reason is refused before anything is sent; `null` when it may go. */
export function checkHoldReason(reason: string): string | null {
  const checked = parseInput(holdUpdateInput, { id: 'UPD-0000', reason, expectedRev: 1 }, null);
  return checked.ok ? null : holdReasonErrorOf(checked.error);
}
