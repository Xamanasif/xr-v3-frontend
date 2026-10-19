import type { Submission } from '@xr/domain';

/** What the rule reads of a record: its review decisions, status and last change. */
type ApprovalFacts = Pick<Submission, 'reviewDecisions' | 'status' | 'updatedAt'>;

/** The instant of the Academic Reviewer's last approval, if there is one. */
export function lastApprovalAt(submission: ApprovalFacts): string | null {
  return (
    submission.reviewDecisions.findLast((decision) => decision.decision === 'approve')?.decidedAt ??
    null
  );
}

/**
 * When the Academic Reviewer approved the version now with the Content Manager: the last approval,
 * else when it reached the Content Manager, else its last change (My experiments' status line, the
 * record's notice).
 */
export function approvedAt(submission: ApprovalFacts): string {
  return (
    lastApprovalAt(submission) ??
    (submission.status.state === 'with-content-manager'
      ? submission.status.since
      : submission.updatedAt)
  );
}
