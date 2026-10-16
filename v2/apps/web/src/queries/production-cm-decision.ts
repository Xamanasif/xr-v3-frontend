/**
 * CM-03 Publication decision and CM-05 Published experiment (Phase 5; boards B6-07, B6-08, B6-11):
 * the read models’ types and the Send back check on the contract’s own schema — features import
 * contracts for types only (Appendix F §3.8), so the runtime pieces live here. Send back is
 * checked before anything is sent with `sendBackInput`’s rules and message keys (“Choose who it
 * goes back to”, “Add a reason so they know what to change”; both at once, as B6-11 f7 draws
 * them), and the service’s own `validation-failed` answer is read the same way.
 */
import {
  type Out,
  parseInput,
  type publicationDecisionOutput,
  type publishedExperimentOutput,
  sendBackInput,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { ReturnReference } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

/** `getPublicationDecision`: the submission, the publication check and the catalogue preview. */
export type PublicationDecisionView = Out<typeof publicationDecisionOutput>;

/** `getPublishedExperiment`: the live experiment, its open correction, whether she may join it. */
export type PublishedExperimentView = Out<typeof publishedExperimentOutput>;

/** Who a submission goes back to (B6-11 f7 “Send it to”), or nobody chosen yet. */
export type SendBackTo = 'academic-reviewer' | 'vendor';

export interface SendBackDraft {
  readonly to: SendBackTo | null;
  readonly reason: string;
  /** Only toward the vendor (OD-B6-05); ignored for the Academic Reviewer. */
  readonly references: readonly ReturnReference[];
}

/** The dialog’s two drawn errors, in words. */
export interface SendBackErrors {
  readonly to?: string;
  readonly reason?: string;
}

const FIELD_OF_KEY: Readonly<Record<string, keyof SendBackErrors>> = {
  'CM-03.to.required': 'to',
  'CM-03.reason.required': 'reason',
};

/** A `validation-failed` answer as the dialog’s errors (the catalogue’s drawn words). */
export function sendBackErrorsOf(error: ValidationFailed): SendBackErrors {
  const errors: { to?: string; reason?: string } = {};
  for (const fieldError of error.fieldErrors) {
    const field = FIELD_OF_KEY[fieldError.key];
    const words = fieldWords(fieldError);
    if (field && words && errors[field] === undefined) errors[field] = words;
  }
  return errors;
}

/**
 * B6-07 `doSend`: who and why are both required, and both errors show at once (B6-11 f7). The
 * union refuses a missing “to” before it reads the reason, so the reason is checked on its own
 * branch too (the same rule in both branches).
 */
export function checkSendBack(draft: SendBackDraft): SendBackErrors | null {
  const errors: { to?: string; reason?: string } = {};
  const probe = { id: 'SUB-0000', reason: draft.reason, references: [], expectedRev: 1 };
  if (draft.to === null) {
    const who = parseInput(sendBackInput, { ...probe, to: undefined }, null);
    if (!who.ok) Object.assign(errors, sendBackErrorsOf(who.error));
  }
  const why = parseInput(
    sendBackInput,
    { ...probe, to: draft.to ?? 'academic-reviewer', references: [] },
    null,
  );
  if (!why.ok && why.error.fieldErrors.some((entry) => entry.key === 'CM-03.reason.required')) {
    const reason = sendBackErrorsOf(why.error).reason;
    if (reason) errors.reason = reason;
  }
  return errors.to || errors.reason ? errors : null;
}
