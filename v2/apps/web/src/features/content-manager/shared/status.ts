import type { Submission, UpdateState } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { CM_SUBMISSION_STATUS, CM_UPDATE_STATUS, readyToResolve } from '@/copy/cm-shared';

/** A status pill's words and its tone in the V3 status grammar (`StatusPill`). */
export interface CmPill {
  readonly tone: StatusTone;
  readonly words: string;
}

/**
 * A submission's status as the Content Manager reads it (CM-v1 COMPONENT-EXTENSIONS "Status
 * mapping used"; the script's `subSt`): Ready to publish, In academic review and Back with the
 * Academic Reviewer (a re-check she asked for) in the info ring; approved with checks not met
 * ("Ready to publish · 2 to resolve") in error; With the vendor neutral; Published ok. A
 * resubmission not yet routed is in academic review; a draft (never hers to see) reads as with
 * the vendor.
 */
export function cmSubmissionPill(status: Submission['status'], blockers = 0): CmPill {
  switch (status.state) {
    case 'with-content-manager':
      return blockers > 0
        ? { tone: 'err', words: readyToResolve(blockers) }
        : { tone: 'info', words: CM_SUBMISSION_STATUS.ready };
    case 'with-academic-reviewer':
      return status.reason === 'recheck'
        ? { tone: 'info', words: CM_SUBMISSION_STATUS.recheck }
        : { tone: 'info', words: CM_SUBMISSION_STATUS.inReview };
    case 'resubmitted':
      return { tone: 'info', words: CM_SUBMISSION_STATUS.inReview };
    case 'published':
      return { tone: 'ok', words: CM_SUBMISSION_STATUS.published };
    case 'returned':
    case 'draft':
      return { tone: 'neutral', words: CM_SUBMISSION_STATUS.withVendor };
  }
}

const UPDATE_TONE: Readonly<Record<UpdateState, StatusTone>> = {
  draft: 'neutral',
  'in-academic-review': 'info',
  returned: 'err',
  'awaiting-release-decision': 'info',
  'on-hold': 'paused',
  released: 'ok',
  withdrawn: 'ended',
};

/**
 * A correction's tone (COMPONENT-EXTENSIONS "Status mapping used"; the script's `UST`): Draft
 * neutral, In academic review info, Returned error, Awaiting release decision info, On hold
 * paused, Released ok, Withdrawn ended. Also the tone of CM-04's open-correction chip.
 */
export function cmUpdateTone(state: UpdateState): StatusTone {
  return UPDATE_TONE[state];
}

/** A correction's status pill (CM-05 band, CM-08 list and detail, CM-01 "With others"). */
export function cmUpdatePill(state: UpdateState): CmPill {
  return { tone: UPDATE_TONE[state], words: CM_UPDATE_STATUS[state] };
}
