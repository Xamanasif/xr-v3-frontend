import { inDisplayOrder, type Technology } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui';

import { dateTime } from '@/copy/dates';
import { submissionWords, wordsOf } from '@/copy/flow-state-words';
import {
  HISTORY,
  publishedNote,
  RECORD,
  resubmittedWhat,
  returnedNote,
  routedWhat,
} from '@/copy/vendor-record';
import type { vendorRecord } from '@/queries/production';

/** The record as `ProductionService.getRecord` answers it: submission, guards, last return. */
export type VendorRecordView = Extract<
  Awaited<ReturnType<(typeof vendorRecord)['read']>>,
  { readonly ok: true }
>['value'];

type RecordSubmission = VendorRecordView['submission'];

/**
 * The record’s state as the Vendor reads it (B5-06 doc “Banner by state”): which chip, banner and
 * action the page draws. A resubmission reads “Submitted” until it moves on — also once the
 * approved workflow rule has routed it back to the Academic Reviewer (f4; M-3, PC-66). A draft or
 * a returned record whose course is no longer assigned opens read-only (f9; OD-B5-01).
 */
export type RecordState =
  | 'draft'
  | 'draft-read-only'
  | 'with-reviewer'
  | 'submitted'
  | 'recheck'
  | 'returned'
  | 'returned-read-only'
  | 'with-content-manager'
  | 'published';

export function recordStateOf(view: VendorRecordView): RecordState {
  const { submission, guards } = view;
  const status = submission.status;
  switch (status.state) {
    case 'draft':
      return guards.courseNoLongerAssigned ? 'draft-read-only' : 'draft';
    case 'with-academic-reviewer':
      if (status.reason === 'recheck') return 'recheck';
      return submission.revision > 1 && status.reason === 'resubmission'
        ? 'submitted'
        : 'with-reviewer';
    case 'resubmitted':
      return 'submitted';
    case 'returned':
      return guards.courseNoLongerAssigned ? 'returned-read-only' : 'returned';
    case 'with-content-manager':
      return 'with-content-manager';
    case 'published':
      return 'published';
  }
}

/** The chip’s tone per state, as B5-06 draws each (`xr-status--off`, `--wait`, `--err` …). */
const CHIP_TONE: Readonly<Record<RecordState, StatusTone>> = {
  draft: 'off',
  'draft-read-only': 'paused',
  'with-reviewer': 'wait',
  submitted: 'info',
  recheck: 'wait',
  returned: 'err',
  'returned-read-only': 'err',
  'with-content-manager': 'wait',
  published: 'ok',
};

/**
 * The status chip: the shared Vendor words (`submissionWords`), “Draft · read-only” for a draft in
 * a withdrawn course (f9); after a Super Admin override, whose Vendor words are not drawn, the
 * returned chip (state-copy `VE-07.returned-by-override`).
 */
export function chipOf(view: VendorRecordView): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  const state = recordStateOf(view);
  const words =
    state === 'draft-read-only'
      ? RECORD.draftReadOnly
      : (wordsOf(submissionWords(view.submission, 'vendor')) ?? RECORD.returnedChip);
  return { tone: CHIP_TONE[state], words };
}

/** The submission’s formats in display order (WEB · AR · VR · MR). */
export function formatsOf(submission: RecordSubmission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

/** When the Academic Reviewer approved the version now with the Content Manager (f5 banner). */
export function approvedAt(submission: RecordSubmission): string {
  const approval = submission.reviewDecisions.findLast(
    (decision) => decision.decision === 'approve',
  );
  if (approval) return approval.decidedAt;
  return submission.status.state === 'with-content-manager'
    ? submission.status.since
    : submission.updatedAt;
}

/**
 * The history as the Vendor reads it (VE-13; B5-06 script `hist`): the record’s entries visible to
 * the Vendor, newest first, in the board’s words per event (state-copy `VE-13.visible-entries`).
 * While the Vendor reads “Submitted”, the routing entry of that revision is left out (`VE-13.routed`).
 */
export function historyEvents(view: VendorRecordView): TimelineEvent[] {
  const { submission } = view;
  const waiting = recordStateOf(view) === 'submitted';
  const visible = submission.history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.visibleTo.includes('vendor'))
    // Newest first; entries of one instant keep their written order, reversed.
    .sort((a, b) =>
      a.entry.at === b.entry.at ? b.index - a.index : a.entry.at < b.entry.at ? 1 : -1,
    );
  const events: TimelineEvent[] = [];
  for (const { entry } of visible) {
    const when = dateTime(entry.at);
    const revision = entry.note ?? String(submission.revision);
    switch (entry.event) {
      case 'draft-saved':
        events.push({ id: entry.id, what: HISTORY.draftSaved, when, note: HISTORY.draftSavedNote });
        break;
      case 'submitted':
        events.push({ id: entry.id, what: HISTORY.submitted, when, note: HISTORY.submittedNote });
        break;
      case 'returned-by-reviewer':
        events.push({
          id: entry.id,
          what: HISTORY.returned,
          when,
          note: returnedNote('academic-reviewer', entry.note ?? ''),
        });
        break;
      case 'returned-by-content-manager':
        events.push({
          id: entry.id,
          what: HISTORY.returned,
          when,
          note: returnedNote('content-manager', entry.note ?? ''),
        });
        break;
      case 'approved-by-reviewer':
        events.push({ id: entry.id, what: HISTORY.approved, when, note: HISTORY.approvedNote });
        break;
      case 'resubmitted':
        events.push({
          id: entry.id,
          what: resubmittedWhat(revision),
          when,
          note: HISTORY.resubmittedNote,
        });
        break;
      case 'routed':
        if (waiting && revision === String(submission.revision)) break;
        events.push({ id: entry.id, what: routedWhat(revision), when, note: HISTORY.routedNote });
        break;
      case 'sent-back-for-recheck':
        events.push({ id: entry.id, what: HISTORY.recheck, when, note: HISTORY.recheckNote });
        break;
      case 'published':
        events.push({
          id: entry.id,
          what: HISTORY.published,
          when,
          note: publishedNote(formatsOf(submission)),
        });
        break;
      case 'status-overridden':
        // The Super Admin’s only (`visibleTo`); never the Vendor’s to read.
        break;
    }
  }
  return events;
}
