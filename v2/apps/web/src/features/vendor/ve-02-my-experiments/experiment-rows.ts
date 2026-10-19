/**
 * Pure view helpers of VE-02 My experiments (the owner-approved Vendor export, VE-v1
 * `Main.dc.html` `listView`, `stSub`), shared with VE-01: the status the Vendor reads, its pill
 * and plain line, the row's one action, the “Changed in the last 7 days” rule and the address's
 * `?status=` and `?changed=`. Whether a returned record holds saved changes is
 * `shared/saved-changes.ts`, the one rule every Vendor screen reads. Nothing here
 * decides a state: the record's status and guards are the service's
 * (`ProductionService.listMyExperiments`); this only words and places them.
 */
import type { listMyExperimentsOutput, Out } from '@xr/contracts/draft';
import type { StatusTone } from '@xr/ui/v3';

import { dayMonth, dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  editDraftRowName,
  MY_EXPERIMENTS_WORDS,
  onDay,
  returnedByLine,
  reviseRowName,
  STATUS_LINES,
  type StatusTabKey,
} from '@/copy/vendor-home';
import { EDITOR_STEPS, editDraftAddress, myExperimentsAddress, reviseAddress } from '@/nav/vendor';
import type { MyExperimentsStatus } from '@/queries/production';

import { approvedAt } from '../shared/approval';
import { vendorPill } from '../shared/status-pill';

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

/** `?status=` of the address (a tab); anything else is All. */
export function statusFilterOf(search: string): MyExperimentsStatus | null {
  const status = new URLSearchParams(search).get('status');
  return (STATUSES as readonly string[]).includes(status ?? '')
    ? (status as MyExperimentsStatus)
    : null;
}

/** The address's value of “Changed in the last 7 days” (`?changed=last-7-days`). */
export const RECENT_PARAMETER = { name: 'changed', value: 'last-7-days' } as const;

/** Whether the address ticks “Changed in the last 7 days”. */
export function recentFilterOf(search: string): boolean {
  return new URLSearchParams(search).get(RECENT_PARAMETER.name) === RECENT_PARAMETER.value;
}

/**
 * VE-02 with its tab and 7-day filter in the address (`?status=…&changed=last-7-days`); the
 * Overview's “Changed in the last 7 days” opens it with the filter on (LINK-MAP L17).
 */
export function myExperimentsFilterAddress(
  status: MyExperimentsStatus | null,
  recent: boolean,
): string {
  const base = myExperimentsAddress(status ?? undefined);
  if (!recent) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${RECENT_PARAMETER.name}=${RECENT_PARAMETER.value}`;
}

/**
 * The status the Vendor reads, as the tabs name it: “Submitted” after a resubmit until the record
 * moves on (M-3), “With Academic Reviewer” for a first review or a re-check.
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

/** Whether a row is in a tab: All holds every row; the others the service's status filter's. */
export function inTab(row: MyExperimentRow, tab: StatusTabKey): boolean {
  return tab === 'all' || vendorStatusOf(row.submission) === tab;
}

/** A draft whose course is no longer one of the Vendor's opens read-only (OD-B5-01). */
export function isReadOnlyDraft(row: MyExperimentRow): boolean {
  return row.submission.status.state === 'draft' && row.guards.courseNoLongerAssigned;
}

/**
 * The status pill: its words and shape (`vendorPill`, HANDOFF §2; the one rule every Vendor screen
 * draws) — “Draft · read-only” for a draft whose course is no longer assigned.
 */
export function rowStatus(row: MyExperimentRow): {
  readonly label: string;
  readonly tone: StatusTone;
} {
  const pill = vendorPill(row.submission, row.guards.courseNoLongerAssigned);
  return { label: pill.words, tone: pill.tone };
}

/** The step a draft last reached, counted as the editor's four steps (Course 1 … Check 4). */
export function stepNumber(step: Submission['lastStepReached']): number {
  return EDITOR_STEPS.indexOf(step) + 1;
}

/** The same calendar day as the sample clock's “now” (Indian time, as every date is written). */
export function isToday(instant: string, now: string | null): boolean {
  return now !== null && dayMonthYear(instant) === dayMonthYear(now);
}

/** “on 24 Aug”, or “today”. */
export function onDayOf(instant: string, now: string | null): string {
  return onDay(dayMonth(instant), isToday(instant, now));
}

/**
 * The one plain line under the pill (HANDOFF §2; state-copy `VE-02.status-line`); none for a
 * Super Admin override, whose Vendor words are not drawn.
 */
export function statusLine(row: MyExperimentRow, now: string | null): string | null {
  const { submission } = row;
  const { status } = submission;
  if (isReadOnlyDraft(row)) return stateWords('VE-02.read-only-line');
  switch (status.state) {
    case 'draft':
      return STATUS_LINES.draft(stepNumber(submission.lastStepReached));
    case 'with-academic-reviewer':
      if (status.reason === 'recheck') return STATUS_LINES.recheck;
      return vendorStatusOf(submission) === 'submitted'
        ? STATUS_LINES.submitted(
            submission.revision,
            onDayOf(submission.lastResubmittedAt ?? status.since, now),
          )
        : STATUS_LINES.withReviewer(onDayOf(status.since, now));
    case 'resubmitted':
      return STATUS_LINES.submitted(submission.revision, onDayOf(status.since, now));
    case 'returned':
      return status.by === 'super-admin-override'
        ? null
        : returnedByLine(status.by, onDayOf(status.since, now));
    case 'with-content-manager':
      return STATUS_LINES.withContentManager(onDayOf(approvedAt(submission), now));
    case 'published':
      return STATUS_LINES.published(dayMonth(status.at));
  }
}

export interface RowAction {
  readonly label: string;
  /** “Revise Forced Convection”, “Edit the draft of Pin Fin Efficiency”. */
  readonly name: string;
  readonly href: string;
}

/**
 * The row's one action (state-copy `VE-02.row-action`): a returned record → “Revise” (VE-08); a
 * draft → “Edit draft” at the step it last reached (VE-09); none for anything else — a read-only
 * draft and a returned record whose course is no longer assigned among them (the chevron; the
 * name opens the record).
 */
export function rowAction(row: MyExperimentRow): RowAction | null {
  const { submission, guards } = row;
  const name = submission.content.name;
  if (guards.courseNoLongerAssigned) return null;
  if (submission.status.state === 'returned') {
    return {
      label: MY_EXPERIMENTS_WORDS.revise,
      name: reviseRowName(name),
      href: reviseAddress(submission.id),
    };
  }
  if (submission.status.state === 'draft') {
    return {
      label: MY_EXPERIMENTS_WORDS.editDraft,
      name: editDraftRowName(name),
      href: editDraftAddress(submission.id, submission.lastStepReached),
    };
  }
  return null;
}

/** The window of “Changed in the last 7 days” (state-copy `VE-02.changed-recently`, OD-B5-13). */
export const RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the record's last change (`updatedAt`) falls within the last seven days of the sample
 * clock (`now`, the session's sign-in instant on the sample clock — the screens have no clock of
 * their own). A change after `now` counts.
 */
export function changedRecently(updatedAt: string, now: string): boolean {
  return Date.parse(updatedAt) >= Date.parse(now) - RECENT_DAYS * DAY_MS;
}

/** Oldest change first (ties keep the service's order); the service answers newest first. */
export function oldestFirst(rows: readonly MyExperimentRow[]): MyExperimentRow[] {
  return [...rows].sort((a, b) => {
    const left = a.submission.updatedAt;
    const right = b.submission.updatedAt;
    return left === right ? 0 : left < right ? -1 : 1;
  });
}
