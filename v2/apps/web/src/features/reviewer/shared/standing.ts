import type { CorrectionUpdate, SubmissionStatus, UpdateState } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { dayMonthYear } from '@/copy/dates';
import { publishedOn, releasedOn, revisionInQueue, RV_NOW, RV_STATUS } from '@/copy/rv-shared';

/**
 * Where a record stands, as the reviewer may see it (the export's `standing`; COMPONENT-EXTENSIONS
 * status pills): the status pill's words and tone, and "where it is now" — RV-05's column, RV-01's
 * Recently decided and the item page's status. Audience filtered: a hold never shows (an update on
 * hold reads as with the Super Admin) and no hold or withdrawal reason is ever named. Computed from
 * the record's own status only.
 */
export interface RvStanding {
  /** The export's `standing().key`: which line it is. */
  readonly key:
    | 'waiting'
    | 'with-content-manager'
    | 'published'
    | 'returned'
    | 'with-super-admin'
    | 'released'
    | 'withdrawn';
  readonly tone: StatusTone;
  /** The pill: "Approved — with the Content Manager". */
  readonly label: string;
  /** Where it is now: "With the Content Manager · not published". */
  readonly now: string;
}

/**
 * A submission's standing. A resubmission waiting again names its revision when the caller knows
 * it (the item page's read; RV-05's row holds the status only, so "In your queue"). `resubmitted`
 * (sent by the vendor, not yet routed) is routed straight back to the reviewer (PC-66), so it
 * reads as waiting. A draft is never the reviewer's to see: `null`.
 */
export function submissionStanding(
  status: SubmissionStatus,
  revision: number | null = null,
): RvStanding | null {
  switch (status.state) {
    case 'with-academic-reviewer':
    case 'resubmitted': {
      const recheck = status.state === 'with-academic-reviewer' && status.reason === 'recheck';
      const later = revision !== null && revision > 1;
      return {
        key: 'waiting',
        tone: 'info',
        label: RV_STATUS.waiting,
        now: recheck
          ? RV_NOW.recheck
          : later && revision !== null
            ? revisionInQueue(revision)
            : RV_NOW.inYourQueue,
      };
    }
    case 'with-content-manager':
      return {
        key: 'with-content-manager',
        tone: 'ok',
        label: RV_STATUS.withContentManager,
        now: RV_NOW.withContentManagerNotPublished,
      };
    case 'published':
      return {
        key: 'published',
        tone: 'ok',
        label: RV_STATUS.published,
        now: publishedOn(dayMonthYear(status.at)),
      };
    case 'returned':
      return {
        key: 'returned',
        tone: 'err',
        label: RV_STATUS.returnedToVendor,
        now: RV_NOW.withVendor,
      };
    case 'draft':
      return null;
  }
}

/**
 * A correction's standing. Released names its date and the version now live when the caller holds
 * them (the update review read); RV-05's row holds the state only, so the release is named without
 * them. A draft is never the reviewer's to see (UPD-16): `null`.
 */
export function updateStanding(
  state: UpdateState,
  release: { readonly at: string; readonly version: string } | null = null,
): RvStanding | null {
  switch (state) {
    case 'in-academic-review':
      return { key: 'waiting', tone: 'info', label: RV_STATUS.waiting, now: RV_NOW.inYourQueue };
    case 'returned':
      return {
        key: 'returned',
        tone: 'err',
        label: RV_STATUS.returnedToContentManager,
        now: RV_NOW.withContentManager,
      };
    case 'awaiting-release-decision':
    case 'on-hold':
      return {
        key: 'with-super-admin',
        tone: 'ok',
        label: RV_STATUS.withSuperAdmin,
        now: RV_NOW.withSuperAdmin,
      };
    case 'released':
      return {
        key: 'released',
        tone: 'ok',
        label: RV_STATUS.released,
        now: release
          ? releasedOn(dayMonthYear(release.at), release.version)
          : RV_NOW.releasedBySuperAdmin,
      };
    case 'withdrawn':
      return {
        key: 'withdrawn',
        tone: 'ended',
        label: RV_STATUS.withdrawn,
        now: RV_NOW.withdrawn,
      };
    case 'draft':
      return null;
  }
}

/** An update as the review read holds it: its state, and its release and version once released. */
export function updateRecordStanding(
  update: Pick<CorrectionUpdate, 'state' | 'release' | 'versionLabel'>,
): RvStanding | null {
  const release =
    update.release && update.versionLabel
      ? { at: update.release.at, version: update.versionLabel }
      : null;
  return updateStanding(update.state, release);
}

/** A Reviewed by me row (`listReviewedByMe`): an update's `nowState` is its state, a submission's its status. */
export function reviewedRowStanding(row: {
  readonly nowState: SubmissionStatus | UpdateState;
}): RvStanding | null {
  return typeof row.nowState === 'string'
    ? updateStanding(row.nowState)
    : submissionStanding(row.nowState);
}
