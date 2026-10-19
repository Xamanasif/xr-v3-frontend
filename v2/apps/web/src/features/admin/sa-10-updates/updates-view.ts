/**
 * SA-10 as a view of the approved corrections the Super Admin reads (`listUpdatesForRelease`, one
 * read per segment) — pure functions, no React. The rows carry canonical facts only; the words are
 * the Super Admin export's (`@/copy/sa-content`, the export's `V.updates`). The order is the
 * service's (state-copy `SA-10.rows`). A correction is named by its experiment and versions, never
 * by its reference.
 */
import { dayMonthYear } from '@/copy/dates';
import {
  CORRECTION_STATUS,
  type ContentTone,
  updateRowLabel,
  type UpdateShowKey,
  versionsLine,
  versionsNote,
} from '@/copy/sa-content';
import { updateDecisionAddress } from '@/nav/admin-content';
import type { ReleaseTab } from '@/queries/corrections';
import type { ReleaseRow } from '@/queries/correction-view';

import { actorName } from '../sa-11-update-decision/decision-view';

/** The read each `?show=` segment shows. */
export const RELEASE_TAB: Readonly<Record<UpdateShowKey, ReleaseTab>> = {
  waiting: 'waiting-for-you',
  'on-hold': 'on-hold',
  released: 'released',
};

/** One row as the export draws it: experiment and course, what changes, who approved and when. */
export interface UpdateRowFacts {
  readonly id: string;
  readonly href: string;
  /** The experiment's name (the row link). */
  readonly name: string;
  /** The platform course code under the name; none without one. */
  readonly courseCode: string | null;
  /** "Version 1.2 → 1.3". */
  readonly versions: string;
  /** "Version 1.2 stays live until released", or "Released 5 Aug 2026". */
  readonly versionsNote: string;
  /** The Academic Reviewer whose approval sent it to her ("Prof. A. Menon"); none before one. */
  readonly reviewer: string | null;
  /** The day of that approval ("27 Aug 2026"). */
  readonly approvedOn: string;
  readonly status: { readonly words: string; readonly tone: ContentTone };
  /** The row link's name: the row in words and what the link does. */
  readonly linkLabel: string;
}

export function updateRowFacts(row: ReleaseRow, show: UpdateShowKey): UpdateRowFacts {
  const { update } = row;
  const from = update.baseVersionLabel;
  const to = update.versionLabel ?? from;
  const approval = update.reviewDecisions.findLast((entry) => entry.decision === 'approve');
  const status =
    show === 'on-hold'
      ? CORRECTION_STATUS['on-hold']
      : show === 'released'
        ? CORRECTION_STATUS.released
        : CORRECTION_STATUS['awaiting-release-decision'];
  const releasedOn =
    show === 'released' ? dayMonthYear(update.release?.at ?? update.updatedAt) : null;
  return {
    id: update.id,
    href: updateDecisionAddress(update.id),
    name: row.experimentName,
    courseCode: row.courseCode,
    versions: versionsLine(from, to),
    versionsNote: versionsNote(from, releasedOn),
    reviewer: approval ? actorName(approval.by) || null : null,
    approvedOn: dayMonthYear(approval?.at ?? update.updatedAt),
    status,
    linkLabel: updateRowLabel(row.experimentName, from, to, status.words),
  };
}
