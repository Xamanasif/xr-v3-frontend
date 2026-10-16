/**
 * Pure view helpers of VE-02 My experiments (board B5-02): the status the Vendor reads, its chip
 * tone, who has the record now, the row's one action, the “Changed in the last 7 days” rule and the
 * address's `?status=`. Nothing here decides a state: the record's status and guards are the
 * service's (`ProductionService.listMyExperiments`); this only words and places them as B5-02's
 * script does (`stw`, `stk`, `withw`, `r.act`, `recentIds`).
 */
import type { listMyExperimentsOutput, Out } from '@xr/contracts/draft';
import type { StatusTone } from '@xr/ui';

import { wordsOf, submissionWords } from '@/copy/flow-state-words';
import {
  MY_EXPERIMENTS_WORDS,
  READ_ONLY_DRAFT,
  RETURNED,
  rowActionLabel,
  WITH_WORDS,
} from '@/copy/vendor-home';
import { editDraftAddress, experimentRecordAddress, reviseAddress } from '@/nav/vendor';
import type { MyExperimentsStatus } from '@/queries/production';

export type MyExperimentRow = Out<typeof listMyExperimentsOutput>[number];
type Submission = MyExperimentRow['submission'];

const STATUSES: readonly MyExperimentsStatus[] = [
  'draft',
  'submitted',
  'with-academic-reviewer',
  'returned',
  'with-content-manager',
  'published',
];

/** `?status=` of the address (B5-02 f1 “Filtered: Returned”); anything else is “All statuses”. */
export function statusFilterOf(search: string): MyExperimentsStatus | null {
  const status = new URLSearchParams(search).get('status');
  return (STATUSES as readonly string[]).includes(status ?? '')
    ? (status as MyExperimentsStatus)
    : null;
}

/**
 * The status the Vendor reads, as the Status filter's values name it: “Submitted” after a
 * resubmit until the record moves on (B5-06 f4; M-3), “With Academic Reviewer” for a first review
 * or a re-check (B5-02 `fst === 'with_rv'` takes `recheck` too).
 */
export function vendorStatusOf(submission: Submission): MyExperimentsStatus {
  const { status } = submission;
  switch (status.state) {
    case 'resubmitted':
      return 'submitted';
    case 'with-academic-reviewer':
      return submission.revision > 1 && status.reason === 'resubmission'
        ? 'submitted'
        : 'with-academic-reviewer';
    default:
      return status.state;
  }
}

/** A draft whose course is no longer one of the Vendor's opens read-only (OD-B5-01; SUB-0083). */
export function isReadOnlyDraft(row: MyExperimentRow): boolean {
  return row.submission.status.state === 'draft' && row.guards.courseNoLongerAssigned;
}

/** B5-02 `stk`: draft off, with a role wait, returned err, submitted info, published ok, read-only paused. */
const TONE: Readonly<Record<MyExperimentsStatus, StatusTone>> = {
  draft: 'off',
  submitted: 'info',
  'with-academic-reviewer': 'wait',
  returned: 'err',
  'with-content-manager': 'wait',
  published: 'ok',
};

/** The status chip: its words (`submissionWords(…, 'vendor')`, or B5-02 `stw.readonly`) and tone. */
export function rowStatus(row: MyExperimentRow): {
  readonly label: string;
  readonly tone: StatusTone;
} {
  if (isReadOnlyDraft(row)) return { label: READ_ONLY_DRAFT, tone: 'paused' };
  const status = vendorStatusOf(row.submission);
  // A Super Admin's override return has no Vendor-side words (B7-06): the drawn “Returned”
  // (state-copy `VE-02.override-return`).
  const label = wordsOf(submissionWords(row.submission, 'vendor')) ?? RETURNED;
  return { label, tone: TONE[status] };
}

/**
 * Who has it now (B5-02 `withw`): the Vendor while it is a draft or returned; the Academic
 * Reviewer or the Content Manager while it is with them; “—” once published, while it reads
 * “Submitted” (the next gate is never named, M-3) and for a read-only draft.
 */
export function withWho(row: MyExperimentRow): string {
  if (isReadOnlyDraft(row)) return WITH_WORDS.nobody;
  switch (vendorStatusOf(row.submission)) {
    case 'draft':
    case 'returned':
      return WITH_WORDS.you;
    case 'with-academic-reviewer':
      return WITH_WORDS.academicReviewer;
    case 'with-content-manager':
      return WITH_WORDS.contentManager;
    case 'submitted':
    case 'published':
      return WITH_WORDS.nobody;
  }
}

export interface RowAction {
  readonly label: string;
  /** The action's accessible name: “Revise Forced Convection” (B5-02 `r.aria`). */
  readonly name: string;
  readonly href: string;
  /** Revise is the row's primary (B5-02 f1 “Revise is the primary action”); the rest secondary. */
  readonly primary: boolean;
}

/**
 * The row's one action (B5-02 `r.act`, state-copy `VE-02.row-action`): a returned record →
 * “Revise” (VE-08); a draft → “Edit draft” at the step it last reached (VE-09); anything else —
 * a read-only draft and a returned record whose course is no longer assigned among them — “Open”
 * (the record, VE-07).
 */
export function rowAction(row: MyExperimentRow): RowAction {
  const { submission, guards } = row;
  const name = submission.content.name;
  const state = submission.status.state;
  if (state === 'returned' && !guards.courseNoLongerAssigned) {
    const label = MY_EXPERIMENTS_WORDS.revise;
    return {
      label,
      name: rowActionLabel(label, name),
      href: reviseAddress(submission.id),
      primary: true,
    };
  }
  if (state === 'draft' && !guards.courseNoLongerAssigned) {
    const label = MY_EXPERIMENTS_WORDS.editDraft;
    return {
      label,
      name: rowActionLabel(label, name),
      href: editDraftAddress(submission.id, submission.lastStepReached),
      primary: false,
    };
  }
  const label = MY_EXPERIMENTS_WORDS.open;
  return {
    label,
    name: rowActionLabel(label, name),
    href: experimentRecordAddress(submission.id),
    primary: false,
  };
}

/** The window of “Changed in the last 7 days” (state-copy `VE-02.changed-recently`, OD-B5-13). */
export const RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the record's last change (`updatedAt`, the date under its status) falls within the last
 * seven days of the sample clock (`now`, the session's sign-in instant on the sample clock — the
 * screens have no clock of their own). A change after `now` counts.
 */
export function changedRecently(updatedAt: string, now: string): boolean {
  return Date.parse(updatedAt) >= Date.parse(now) - RECENT_DAYS * DAY_MS;
}
