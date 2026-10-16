/**
 * SA-10 as a view of the approved corrections the Super Admin reads (`listUpdatesForRelease`, one
 * read per tab) — pure functions, no React. The rows carry canonical facts only; the words are
 * B7-05's (`@/copy/release`). The order is the service's (state-copy `SA-10.rows`).
 */
import type { StatusTone } from '@xr/ui';

import { dayMonthYear } from '@/copy/dates';
import {
  approvedOnLine,
  onHoldSinceLine,
  releasedOnLine,
  type ReleaseShowKey,
  UPDATE_STATUS,
  UPDATES_PAGE,
  updateName,
} from '@/copy/release';
import type { ReleaseTab } from '@/queries/corrections';
import type { ReleaseRow } from '@/queries/correction-view';

/** The tab each `?show=` view reads (B7-05 U7 `FT`). */
export const RELEASE_TAB: Readonly<Record<ReleaseShowKey, ReleaseTab>> = {
  waiting: 'waiting-for-you',
  'on-hold': 'on-hold',
  released: 'released',
};

/** One row as B7-05 draws it (f0, f2, f3): name, reference and course, status, its day, action. */
export interface ReleaseRowFacts {
  readonly id: string;
  readonly name: string;
  /** The platform course code after the reference (“UPD-0005 · CHE ZG513”); none without one. */
  readonly courseCode: string | null;
  readonly status: { readonly words: string; readonly tone: StatusTone };
  readonly when: string;
  /** “Review” on a waiting row, “Open” on every other (U7 `act`). */
  readonly action: string;
}

export function releaseRowFacts(row: ReleaseRow, show: ReleaseShowKey): ReleaseRowFacts {
  const { update } = row;
  const name = updateName(
    row.experimentName,
    update.baseVersionLabel,
    update.versionLabel ?? update.baseVersionLabel,
  );
  let when: string;
  let status: ReleaseRowFacts['status'];
  if (show === 'on-hold') {
    status = UPDATE_STATUS['on-hold'];
    when = onHoldSinceLine(dayMonthYear(update.hold?.at ?? update.updatedAt));
  } else if (show === 'released') {
    status = UPDATE_STATUS.released;
    when = releasedOnLine(dayMonthYear(update.release?.at ?? update.updatedAt));
  } else {
    status = UPDATE_STATUS['awaiting-release-decision'];
    const approval = update.reviewDecisions.findLast((entry) => entry.decision === 'approve');
    when = approvedOnLine(dayMonthYear(approval?.at ?? update.updatedAt));
  }
  return {
    id: update.id,
    name,
    courseCode: row.courseCode,
    status,
    when,
    action: show === 'waiting' ? UPDATES_PAGE.review : UPDATES_PAGE.open,
  };
}
