import type { Submission } from '@xr/domain';

/** What the rule reads of a record: its status and its last change. */
type SavedChangesFacts = Pick<Submission, 'status' | 'updatedAt'>;

/**
 * Changes saved and not resubmitted (VE-v1 HANDOFF §3, the private revision; state-copy
 * `VE-01.saved-not-resubmitted`, `VE-07.saved-changes`, `VE-08.private-revision`): a returned record
 * written after its return holds them — only the Vendor's Save changes (`saveRevision`) writes a
 * returned record. The instant they were saved, or `null`. Which fields changed is not in the read
 * model. The one rule the Overview, My experiments, the record and the editor's outline all read.
 */
export function savedChangesAt(submission: SavedChangesFacts): string | null {
  const { status } = submission;
  if (status.state !== 'returned') return null;
  return Date.parse(submission.updatedAt) > Date.parse(status.since) ? submission.updatedAt : null;
}

/** Whether a returned record holds changes saved and not resubmitted (`savedChangesAt`). */
export function hasSavedChanges(submission: SavedChangesFacts): boolean {
  return savedChangesAt(submission) !== null;
}
