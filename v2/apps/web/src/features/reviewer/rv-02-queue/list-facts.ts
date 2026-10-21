import type { Out, reviewedByMeOutput, reviewQueueItem } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';

import { dayMonth } from '@/copy/dates';
import {
  fromWords,
  NO_OUTCOMES_YET,
  recheckFocus,
  type ReviewItemType,
} from '@/copy/reviewer-lists';
import { revisionDetail } from '@/copy/rv-shared';
import { reviewQueueAddress, reviewSubmissionAddress, reviewUpdateAddress } from '@/nav/reviewer';

import { queueItemKind, reviewedRowKind, type RvKindModel } from '../shared/kind';

/**
 * Facts the Academic Reviewer's lists (RV-01, RV-02, RV-05) share in the V3 design: a row's
 * format codes, where an item is reviewed, who sent it and what to look at first (the export's
 * `fromOf`, `focusOf`), the review queue's address with its Type and Course, and a decision's type
 * as decided — each computed from what the lists' reads hold, nothing more.
 */

export type QueueItem = Out<typeof reviewQueueItem>;
export type DecidedRow = Out<typeof reviewedByMeOutput>[number];

/** A row's formats as the badges name them, WEB · AR · VR · MR. */
export function formatCodes(formats: readonly Technology[]): FormatCode[] {
  return inDisplayOrder(new Set(formats)).map((format) => FORMAT_META[format].code as FormatCode);
}

/** Where an item is reviewed: RV-03 for a submission or a re-check, RV-04 for an update. */
export function reviewAddressOf(item: { readonly ref: QueueItem['ref'] }): string {
  return item.ref.kind === 'UPD'
    ? reviewUpdateAddress(item.ref.id)
    : reviewSubmissionAddress(item.ref.id);
}

/** Where a decided item opens read-only: RV-06 for a submission, RV-04 decided for an update. */
export function decidedAddressOf(row: { readonly recordRef: DecidedRow['recordRef'] }): string {
  return row.recordRef.kind === 'UPD'
    ? reviewUpdateAddress(row.recordRef.id)
    : reviewSubmissionAddress(row.recordRef.id);
}

/** The item a reviewer opens first: the queue's first — it is oldest first — whatever its kind. */
export function oldestToReview<Item>(waiting: readonly Item[]): Item | null {
  return waiting[0] ?? null;
}

/**
 * Who sent an item (the export's `fromOf`): a first review is revision 1 from its vendor; a
 * resubmission names the day it came back (`waitingSince`); an update the Content Manager who sent
 * it (the service's “Kavya Nair · Content Manager”); a re-check the Content Manager (the reads hold
 * neither the revision nor who sent it back).
 */
export function fromOf(item: QueueItem, kind: RvKindModel = queueItemKind(item)): string {
  if (item.type === 'update') {
    return fromWords({ kind: 'update', person: item.who.split(' · ')[0] ?? item.who });
  }
  if (item.type === 'recheck') return fromWords({ kind: 'recheck' });
  if (kind.kind === 'resub') {
    return fromWords({
      kind: 'resubmission',
      who: item.who,
      resubmitted: dayMonth(item.waitingSince),
    });
  }
  return fromWords({ kind: 'new', who: item.who });
}

/**
 * What to look at first (the export's `focusOf`), as far as the lists' reads hold it: a re-check
 * quotes the Content Manager's reason (the overview read); a first review without outcomes is
 * flagged “No learning outcomes yet” (the service's sub-line). The outcome count, a resubmission's
 * changed fields and an update's changed fields are in no list read: nothing is said (state-copy
 * `RV-02.focus`).
 */
export function focusOf(
  item: QueueItem,
  reason: string | null,
): { readonly flag: string | null; readonly focus: string | null } {
  if (item.type === 'recheck') return { flag: null, focus: reason ? recheckFocus(reason) : null };
  if (item.type === 'new' && /no learning outcomes yet$/.test(item.subLine)) {
    return { flag: NO_OUTCOMES_YET, focus: null };
  }
  return { flag: null, focus: null };
}

/** The queue's Type from its address (`?type=new | update | recheck`); anything else is All. */
export function typeOf(search: string): ReviewItemType | null {
  const type = new URLSearchParams(search).get('type');
  return type === 'new' || type === 'update' || type === 'recheck' ? type : null;
}

/** The queue's Course from its address (`?course=CHE ZG513`, a platform code); none is All. */
export function courseOf(search: string): string | null {
  return new URLSearchParams(search).get('course') || null;
}

/**
 * The review queue on a Type and a Course (state-copy `RV-02.filters`): `?type=` as
 * `reviewQueueAddress` writes it, then `?course=` with the course's code.
 */
export function queueAddress(
  filters: { readonly type?: ReviewItemType | null; readonly course?: string | null } = {},
): string {
  const address = reviewQueueAddress(filters.type ? { type: filters.type } : {});
  if (!filters.course) return address;
  return `${address}${address.includes('?') ? '&' : '?'}${new URLSearchParams({ course: filters.course })}`;
}

/**
 * The type of a decided item as it was when decided (the export's `reviewedVals` kind): the role's
 * shared rule (`reviewedRowKind`), and a return the vendor has since answered names the revision
 * returned (“New submission · revision 1”; as the decision words named it before).
 */
export function decidedKind(row: DecidedRow): RvKindModel {
  const decision = row.decision as { readonly decision: string; readonly revision?: number };
  const kind = reviewedRowKind({
    type: row.type,
    decision: decision.revision === undefined ? {} : { revision: decision.revision },
  });
  const movedOn =
    decision.decision === 'return-to-vendor' &&
    typeof row.nowState !== 'string' &&
    row.nowState.state !== 'returned';
  if (kind.kind === 'new' && kind.detail === null && movedOn) {
    return { ...kind, detail: revisionDetail(decision.revision ?? 1) };
  }
  return kind;
}

/** Whether the reviewer approved: a submission's or an update's `approve`. */
export function approvedOf(row: DecidedRow): boolean {
  return row.decision.decision === 'approve';
}

/** When the reviewer decided: a submission decision's `decidedAt`, an update decision's `at`. */
export function decidedAt(row: DecidedRow): string {
  const decision = row.decision as { readonly decidedAt?: string; readonly at?: string };
  return decision.decidedAt ?? decision.at ?? '';
}
