/**
 * The result of a pure decision (Appendix D §1.3 "decide"; ADR-0008 decision 2). A decision takes
 * the records it needs, the actor and `now`, and returns the next versions of the records it
 * writes — or a refusal that writes nothing. Service-only error kinds (`not-signed-in`,
 * `not-found`, `stale-version`, `unavailable`) belong to the ports (WP-0.10).
 */

/** The Student open gate's refusals (Appendix C M15). */
export type OpenRefusal =
  | 'not-given'
  | 'no-longer-given'
  | 'institution-paused'
  | 'access-ended'
  | 'student-inactive'
  | 'waiting-for-a-licence'
  | 'format-not-in-plan'
  | 'format-not-published';

/**
 * Drawn refusals, each with its own board words (Appendix C §3.0). The last group adds refusals
 * the boards draw that the Appendix C list does not name; each cites its board.
 */
export type RefusalCode =
  | OpenRefusal
  | 'plan-ended'
  | 'nothing-held'
  | 'access-not-active'
  | 'renewal-scope-not-adjustable'
  | 'selection-empty'
  | 'assessment-exists'
  | 'course-not-assigned'
  | 'course-has-people-filed'
  | 'publication-blocked'
  | 'update-already-open'
  | 'not-yet-forwarded'
  | 'transfer-already-open'
  | 'format-not-completed'
  | 'hold-must-be-lifted'
  | 'marks-confirmed'
  | 'no-attempts-left'
  | 'previous-not-released'
  | 'submit-checklist-incomplete'
  | 'override-not-stuck'
  | 'wrong-details'
  | 'last-format-locked'
  // B2-05 step 1: "Not in your access plan" — the experiment can't be ticked (SACC-04).
  | 'experiment-not-in-plan'
  // B2-05: "Rahul can't be ticked again" — a student who already has the experiment (SACC-06).
  | 'already-given'
  // B2-05: "Add members before giving access" — an empty group can't be chosen.
  | 'group-empty'
  // B1-11 / B1-10: a classified institution's route is locked for later requests (REQ-24).
  | 'route-locked'
  // B4-13: "Try again" only when not passed (ATT-06; OD-B4-05).
  | 'already-passed'
  // B3-07 / ST-18: "My device" and a transfer only for a Student holding AR / VR / MR (DTR-05).
  | 'no-authorised-device';

export type NotPermittedWhy = 'wrong-workspace' | 'out-of-scope' | 'not-own-record';

export interface InputIssue {
  /** The command field, e.g. `reason`. */
  readonly field: string;
  /** The rule key; the web layer holds the board copy for it (Appendix C §5.4). */
  readonly rule: string;
}

export type Refusal =
  | { readonly kind: 'not-permitted'; readonly why: NotPermittedWhy }
  | { readonly kind: 'invalid-state'; readonly current: string }
  | { readonly kind: 'refused'; readonly code: RefusalCode }
  /** An undecided rule was reached; `decision` names it (e.g. `OD-B2-01`). Nothing is written. */
  | { readonly kind: 'policy-open'; readonly decision: string }
  | { readonly kind: 'conflict'; readonly code: 'duplicate' | 'already-sent' | 'already-exists' }
  | { readonly kind: 'validation-failed'; readonly issues: readonly InputIssue[] };

export type Decision<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly refusal: Refusal };

export function ok<T>(value: T): Decision<T> {
  return { ok: true, value };
}

export function refuse(refusal: Refusal): { readonly ok: false; readonly refusal: Refusal } {
  return { ok: false, refusal };
}

export const refused = (code: RefusalCode) => refuse({ kind: 'refused', code });
export const invalidState = (current: string) => refuse({ kind: 'invalid-state', current });
export const policyOpen = (decision: string) => refuse({ kind: 'policy-open', decision });
export const notPermitted = (why: NotPermittedWhy) => refuse({ kind: 'not-permitted', why });
export const conflict = (code: 'duplicate' | 'already-sent' | 'already-exists') =>
  refuse({ kind: 'conflict', code });
export const invalidInput = (...issues: InputIssue[]) =>
  refuse({ kind: 'validation-failed', issues });

/** A required free-text value: present once trimmed (every DL-2 reason, XC-03). */
export function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
}

/** Whole number ≥ `min` (licences, marks, attempts — the boards reject "50.5" and "two"). */
export function isWholeNumber(value: number, min = 0): boolean {
  return Number.isInteger(value) && value >= min;
}
