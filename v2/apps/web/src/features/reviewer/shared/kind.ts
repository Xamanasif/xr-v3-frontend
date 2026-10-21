import type { CorrectionUpdate, Submission } from '@xr/domain';
import type { RvKind } from '@xr/ui/v3';

import {
  revisionDetail,
  RV_KIND_WORDS,
  toVersionDetail,
  versionChangeDetail,
} from '@/copy/rv-shared';

/**
 * The review type tag's facts (`RvKindTag`; the export's `kindOf`): which of the four kinds of
 * review work an item is — a new submission, a resubmission with its revision, a re-check sent back
 * by the Content Manager, or an update with its versions — computed from what each existing read
 * holds. Nothing here is a rule the record does not state.
 */
export interface RvKindModel {
  readonly kind: RvKind;
  /** "New submission", "Resubmitted", "Re-check", "Update". */
  readonly label: string;
  /** "revision 2", "1.2 → 1.3"; `null` when the read does not hold it. */
  readonly detail: string | null;
}

function model(kind: RvKind, detail: string | null = null): RvKindModel {
  return { kind, label: RV_KIND_WORDS[kind], detail };
}

const RESUBMITTED = /^Resubmitted · revision (\d+)$/;
const VERSIONS = /(\S+) → (\S+)$/;

/**
 * A queue item (`getReviewQueue`, `getReviewerOverview.waiting`): its `type` says new, re-check or
 * update; a resubmission's revision and an update's versions are only in the service's pre-rendered
 * `subLine` (PC-13, provisional: "Resubmitted · revision 2", "Correction to the live version
 * 1.2 → 1.3"), so they are read from it — without them the tag is the plain kind.
 */
export function queueItemKind(item: {
  readonly type: 'new' | 'update' | 'recheck';
  readonly subLine: string;
}): RvKindModel {
  if (item.type === 'recheck') return model('recheck');
  if (item.type === 'update') {
    const versions = VERSIONS.exec(item.subLine);
    return model('update', versions ? versionChangeDetail(versions[1]!, versions[2]!) : null);
  }
  const resubmitted = RESUBMITTED.exec(item.subLine);
  return resubmitted ? model('resub', revisionDetail(Number(resubmitted[1]))) : model('new');
}

/**
 * A submission as the review read holds it (`getSubmissionForReview`): a re-check while the Content
 * Manager's send-back waits for the reviewer; otherwise a later revision is a resubmission and the
 * first a new submission (the export's `kindOf`: `st === 'recheck'`, then `rev > 1`).
 */
export function submissionKind(submission: Pick<Submission, 'status' | 'revision'>): RvKindModel {
  const status = submission.status;
  if (status.state === 'with-academic-reviewer' && status.reason === 'recheck') {
    return model('recheck');
  }
  return submission.revision > 1
    ? model('resub', revisionDetail(submission.revision))
    : model('new');
}

/**
 * An update as the review read holds it (`getUpdateForReview`): from the version it corrects to
 * the version it proposes ("1.2 → 1.3"); without a proposed version label, the plain kind.
 */
export function updateKind(
  update: Pick<CorrectionUpdate, 'baseVersionLabel' | 'versionLabel'>,
): RvKindModel {
  if (!update.versionLabel) return model('update');
  return model(
    'update',
    update.baseVersionLabel
      ? versionChangeDetail(update.baseVersionLabel, update.versionLabel)
      : toVersionDetail(update.versionLabel),
  );
}

/**
 * A decision in Reviewed by me (`listReviewedByMe`), as the item was when decided (the export's
 * `reviewedVals` kind): an update (the row holds no versions, so none is shown), a re-check, a
 * later revision as a resubmission with the revision decided, else a new submission.
 */
export function reviewedRowKind(row: {
  readonly type: 'new' | 'update' | 'recheck';
  /** A submission decision carries the revision it decided; an update decision none. */
  readonly decision: object;
}): RvKindModel {
  if (row.type === 'update') return model('update');
  if (row.type === 'recheck') return model('recheck');
  const decided = row.decision as { readonly revision?: unknown };
  const revision = typeof decided.revision === 'number' ? decided.revision : 1;
  return revision > 1 ? model('resub', revisionDetail(revision)) : model('new');
}
