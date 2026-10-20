import type {
  ActorRef,
  CorrectionUpdate,
  IsoInstant,
  Submission,
  UpdateReviewDecision,
} from '@xr/domain';

/**
 * The facts more than one Content Manager screen reads from a submission or a correction: who
 * acted, and when — each from the record's own fields and decisions, never from its history's
 * words. Nothing here is a rule the record does not state.
 */

/** A person's name as the record carries it (a system step has none). */
export function cmActorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** The Academic Reviewer's last approval of a submission (who, when), if any. */
export function lastApproval(
  submission: Pick<Submission, 'reviewDecisions'>,
): { readonly by: string; readonly at: IsoInstant } | null {
  const approval = submission.reviewDecisions.findLast((entry) => entry.decision === 'approve');
  return approval ? { by: cmActorName(approval.decidedBy), at: approval.decidedAt } : null;
}

/** The Academic Reviewer's last decision of a kind on a correction (the return, the approval). */
export function lastUpdateDecision(
  update: Pick<CorrectionUpdate, 'reviewDecisions'>,
  decision: UpdateReviewDecision['decision'],
): UpdateReviewDecision | null {
  return update.reviewDecisions.findLast((entry) => entry.decision === decision) ?? null;
}

/**
 * When a correction last reached the Super Admin's release decision: the last lift of a hold,
 * else the approval (the export's `u.lifted || u.appr`).
 */
export function awaitingSince(
  update: Pick<CorrectionUpdate, 'reviewDecisions' | 'holdLifts'>,
): IsoInstant | null {
  return update.holdLifts.at(-1)?.at ?? lastUpdateDecision(update, 'approve')?.at ?? null;
}
