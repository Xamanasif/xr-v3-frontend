import { inDisplayOrder, type Technology } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui/v3';

import { dateTime } from '@/copy/dates';
import {
  HISTORY,
  publishedNote,
  RECORD,
  resubmittedWhat,
  returnedNote,
  valueOrDash,
} from '@/copy/vendor-record';
import type { vendorRecord } from '@/queries/production';

import { vendorPill } from '../shared/status-pill';

/** The record as `ProductionService.getRecord` answers it: submission, guards, last return. */
export type VendorRecordView = Extract<
  Awaited<ReturnType<(typeof vendorRecord)['read']>>,
  { readonly ok: true }
>['value'];

type RecordSubmission = VendorRecordView['submission'];

/**
 * The record’s state as the Vendor reads it (VE-v1 HANDOFF §2): which pill, notice and action the
 * page draws. A resubmission reads “Submitted” until a reviewer decides — also once the approved
 * workflow rule has routed it back to the Academic Reviewer (M-3, PC-66). A draft or a returned
 * record whose course is no longer assigned opens read-only (OD-B5-01).
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

/**
 * The status pill (`vendorPill`, the one rule every Vendor screen draws): “Draft · read-only” for a
 * draft in a withdrawn course; after a Super Admin override, whose Vendor words are not drawn,
 * “Returned” (state-copy `VE-07.returned-by-override`).
 */
export function pillOf(view: VendorRecordView): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  return vendorPill(view.submission, view.guards.courseNoLongerAssigned);
}

/** The submission’s formats in display order (WEB · AR · VR · MR). */
export function formatsOf(submission: RecordSubmission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

/** When it was last sent: the last resubmit, else the first submission (“Last submitted”). */
export function lastSubmittedAt(submission: RecordSubmission): string | null {
  return submission.lastResubmittedAt ?? submission.firstSubmittedAt;
}

/** When it was published, if it is. */
export function publishedAt(submission: RecordSubmission): string | null {
  return submission.status.state === 'published' ? submission.status.at : null;
}

export interface DeliveryBlock {
  readonly format: Technology;
  readonly name: string;
  readonly kind: string;
  readonly rows: readonly { readonly term: string; readonly value: string }[];
}

/**
 * Each chosen format’s delivery, read-only (the export’s `deliv`): a web link, or an app package
 * (label, reference, the file when one is named, device, install notes; notes when given).
 */
export function deliveryBlocks(submission: RecordSubmission): DeliveryBlock[] {
  return formatsOf(submission).map((format) => {
    const delivery = submission.content.delivery[format];
    const rows: { term: string; value: string }[] = [];
    if (format === 'web') {
      const web = delivery?.format === 'web' ? delivery : null;
      rows.push(
        { term: RECORD.rows.webLink, value: valueOrDash(web?.webLink) },
        { term: RECORD.rows.browserAndComputer, value: valueOrDash(web?.browserAndComputer) },
      );
      if (web?.notes?.trim()) rows.push({ term: RECORD.rows.notes, value: web.notes.trim() });
    } else {
      const pkg = delivery && delivery.format !== 'web' ? delivery : null;
      rows.push(
        { term: RECORD.rows.packageLabel, value: valueOrDash(pkg?.packageLabel) },
        { term: RECORD.rows.packageReference, value: valueOrDash(pkg?.packageReference) },
      );
      // The file’s name alone: the export’s sample-file label does not ship (T-36).
      if (pkg?.packageFileName?.trim()) {
        rows.push({ term: RECORD.rows.packageFile, value: pkg.packageFileName.trim() });
      }
      rows.push(
        { term: RECORD.rows.deviceNeeded, value: valueOrDash(pkg?.deviceNeeded) },
        { term: RECORD.rows.installNotes, value: valueOrDash(pkg?.installNotes) },
      );
      if (pkg?.notes?.trim()) rows.push({ term: RECORD.rows.notes, value: pkg.notes.trim() });
    }
    return {
      format,
      name: RECORD.formatNames[format],
      kind: format === 'web' ? RECORD.webLinkKind : RECORD.appPackageKind,
      rows,
    };
  });
}

/**
 * The history as the Vendor reads it (VE-13): the record’s entries visible to the Vendor, newest
 * first, in the export’s words per event (state-copy `VE-13.visible-entries`). The routing entry
 * after a resubmit is never shown: the Vendor reads “Submitted · revision N” (`VE-13.routed`).
 */
export function historyEvents(view: VendorRecordView): TimelineEvent[] {
  const { submission } = view;
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
    switch (entry.event) {
      case 'draft-saved':
        events.push({ what: HISTORY.draftSaved, when, note: HISTORY.draftSavedNote });
        break;
      case 'submitted':
        events.push({ what: HISTORY.submitted, when, note: HISTORY.submittedNote });
        break;
      case 'returned-by-reviewer':
        events.push({
          what: HISTORY.returned,
          when,
          note: returnedNote('academic-reviewer', entry.note ?? ''),
        });
        break;
      case 'returned-by-content-manager':
        events.push({
          what: HISTORY.returned,
          when,
          note: returnedNote('content-manager', entry.note ?? ''),
        });
        break;
      case 'approved-by-reviewer':
        events.push({ what: HISTORY.approved, when, note: HISTORY.approvedNote });
        break;
      case 'resubmitted':
        events.push({
          what: resubmittedWhat(entry.note ?? String(submission.revision)),
          when,
          note: HISTORY.resubmittedNote,
        });
        break;
      case 'sent-back-for-recheck':
        events.push({ what: HISTORY.recheck, when, note: HISTORY.recheckNote });
        break;
      case 'published':
        events.push({ what: HISTORY.published, when, note: publishedNote(formatsOf(submission)) });
        break;
      case 'routed':
        // The neutral “Submitted · revision N” stands until a reviewer decides (HANDOFF §2).
        break;
      case 'status-overridden':
        // The Super Admin’s only (`visibleTo`); never the Vendor’s to read.
        break;
    }
  }
  return events;
}
