import type { Submission } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { submissionWords, wordsOf } from '@/copy/flow-state-words';
import { READ_ONLY_DRAFT, RETURNED } from '@/copy/vendor-home';

/** The pill's shape per status (the export's `STK`): a draft plain, returned err, published ok. */
const TONE: Readonly<Record<Submission['status']['state'], StatusTone>> = {
  draft: 'neutral',
  'with-academic-reviewer': 'info',
  resubmitted: 'info',
  returned: 'err',
  'with-content-manager': 'info',
  published: 'ok',
};

/**
 * The status pill a Vendor reads for a record (VE-v1 HANDOFF §2): the shared Vendor words
 * (`submissionWords(…, 'vendor')`: "Submitted" after a resubmit, the next stage never named) in
 * the grammar's tone; "Draft · read-only" (paused) for a draft whose course is no longer assigned;
 * after a Super Admin override, whose Vendor words are not drawn, "Returned". The one rule My
 * experiments' rows, the record's head, the editor's head and its outcome card draw.
 */
export function vendorPill(
  submission: Pick<Submission, 'status' | 'revision'>,
  readOnlyDraft = false,
): { readonly tone: StatusTone; readonly words: string } {
  if (readOnlyDraft && submission.status.state === 'draft') {
    return { tone: 'paused', words: READ_ONLY_DRAFT };
  }
  return {
    tone: TONE[submission.status.state],
    words: wordsOf(submissionWords(submission, 'vendor')) ?? RETURNED,
  };
}
