/**
 * The words of the Super Admin's Content › All content (SA-12) and Content record (SA-13) — board
 * B7-06 (f0 … f8; B7-10 f5, f6; B7-12 f4 … f7), composed from the facts `listAllContent` and
 * `getContentRecord` answer (PC-71). Statuses as B7-06's script words them (`stw`, `where`, the
 * update tags `upw`); the override (DL-2) as B7-06 f5 draws it. A correction is never "Publish":
 * the Super Admin releases (B8-03). Rules the board does not draw word for word are state-copy
 * entries (`state-copy-content-oversight.ts`, `SA-12.*`, `SA-13.*`).
 */
import type { UpdateState } from '@xr/domain';

import { dateTime, dayMonthYear } from './dates';

/** The Content destination's header and sub-navigation (B7-05 / B7-06 f0). */
export const CONTENT_PAGE = {
  title: 'Content',
  meta: 'Where every experiment is in the workflow, and who can act on it',
  /** `nav.xr-tabs[aria-label]`. */
  tabsLabel: 'Content',
} as const;

/** SA-12 Content › All content (B7-06 f0, f7). */
export const ALL_CONTENT = {
  showStuck: 'Show stuck records',
  updateWaitingTitle: 'A correction is waiting for your release decision',
  openUpdates: 'Open Updates',
  sectionTitle: 'Every experiment and submission',
  sectionMeta: 'Read-only · open a record for its history',
  /** The tablist's name (B7-06 `aria-label="Show"`). */
  tabsLabel: 'Show',
  tabs: { all: 'All', stuck: 'Stuck', workflow: 'In the workflow', published: 'Published' },
  searchLabel: 'Search content',
  searchPlaceholder: 'Name, reference or course code',
  clearFilters: 'Clear filters',
  columns: {
    content: 'Content',
    status: 'Workflow status',
    who: 'Who can act',
    action: 'Action',
  },
  /** The labels of the stacked cells below 760 px of content (B7-06 `td[data-label]`). */
  cellLabels: { status: 'Status', who: 'Who can act' },
  /** An experiment published before the sample period has no SUB reference (B7-06 e-rows). */
  publishedExperiment: 'Published experiment',
  open: 'Open',
  noMatchTitle: 'No content matches',
  noMatchLine: 'Try another name, reference or course code.',
  /** Nobody can act on a published record (B7-06 `who: '—'`). */
  nobody: '—',
} as const;

export type AllContentShow = keyof typeof ALL_CONTENT.tabs;

/** B7-06 f0: "1 record stuck — nobody can act". */
export function stuckTitle(count: number): string {
  return `${count} ${count === 1 ? 'record' : 'records'} stuck — nobody can act`;
}

/**
 * B7-06 f0: "SUB-0085 · DC Motor Speed Control (EEE ZC341). Open the record to see why." — every
 * stuck record, joined with " · " (B7-06 `stuckBody`).
 */
export function stuckBody(
  records: readonly {
    readonly reference: string;
    readonly name: string;
    readonly course: string | null;
  }[],
): string {
  const named = records.map(({ reference, name, course }) =>
    course === null ? `${reference} · ${name}` : `${reference} · ${name} (${course})`,
  );
  return `${named.join(' · ')}. Open the record to see why.`;
}

/**
 * B7-06 f0: "UPD-0005 · Distillation Column 1.2 → 1.3 — approved by the Academic Reviewer." — one
 * line per correction waiting for her release decision (state-copy `SA-12.update-notice`).
 */
export function updateWaitingLine(
  reference: string,
  experiment: string,
  from: string,
  to: string | null,
): string {
  const versions = to === null ? from : `${from} → ${to}`;
  return `${reference} · ${experiment} ${versions} — approved by the Academic Reviewer.`;
}

/** More than one correction waiting (state-copy `SA-12.update-notice`). */
export function updatesWaitingTitle(count: number): string {
  return count === 1
    ? ALL_CONTENT.updateWaitingTitle
    : `${count} corrections are waiting for your release decision`;
}

/** B7-06 f0 toolbar: "19 of 19 records". */
export function recordCountWords(shown: number, total: number): string {
  return `${shown} of ${total} ${total === 1 ? 'record' : 'records'}`;
}

/** B7-06 row action name: "Open DC Motor Speed Control" (`aria-label="Open " + name`). */
export function openRecordLabel(name: string): string {
  return `Open ${name}`;
}

/** B7-06 `stw`: a record's workflow status in words (the chip). */
export const STATUS_WORDS = {
  published: 'Published',
  stuck: 'Stuck — nobody can act',
  review: 'With Academic Reviewer',
  cm: 'With Content Manager',
  vendor: 'Returned to vendor',
  /** Undrawn: a resubmission not yet routed (M-3; state-copy `SA-12.resubmitted`). */
  resubmitted: 'Resubmitted',
} as const;

export type WorkflowKind = keyof typeof STATUS_WORDS;

/** B7-06 `where`: "Published · version 1.2 · live since 3 Jul 2026". */
export function publishedWhere(label: string, since: string): string {
  return `Published · version ${label} · live since ${dayMonthYear(since)}`;
}

/** B7-06 `where`: "With the Academic Reviewer since 2 Oct 2026". */
export function withReviewerWhere(since: string): string {
  return `With the Academic Reviewer since ${dayMonthYear(since)}`;
}

/** B7-06 `where`: "Back with the Academic Reviewer for a re-check since 25 Aug 2026". */
export function recheckWhere(since: string): string {
  return `Back with the Academic Reviewer for a re-check since ${dayMonthYear(since)}`;
}

/** B7-06 `where`: "With the Content Manager since 14 Aug 2026". */
export function withContentManagerWhere(since: string): string {
  return `With the Content Manager since ${dayMonthYear(since)}`;
}

/** B7-06 `where`: "Returned to the vendor on 24 Aug 2026". */
export function returnedWhere(since: string): string {
  return `Returned to the vendor on ${dayMonthYear(since)}`;
}

/** B7-06 script after an override: "Moved back to the vendor on 23 Oct 2026 (Super Admin override)". */
export function overriddenWhere(since: string): string {
  return `Moved back to the vendor on ${dayMonthYear(since)} (Super Admin override)`;
}

/** Undrawn: "Resubmitted on 21 Oct 2026 · revision 2" (state-copy `SA-12.resubmitted`). */
export function resubmittedWhere(since: string, revision: number): string {
  return `Resubmitted on ${dayMonthYear(since)} · revision ${revision}`;
}

/**
 * B7-06 `upw`: a published row's open correction, as far as she may see it — "Update UPD-0005 ·
 * approved — waiting for your release decision", "Update UPD-0004 · on hold" (state-copy
 * `SA-12.update-tag`: the service names an update to her only once it is approved, UPD-18).
 */
export function updateTag(reference: string, state: UpdateState): string {
  return `Update ${reference} · ${UPDATE_STATE_WORDS[state]}`;
}

const UPDATE_STATE_WORDS: Readonly<Record<UpdateState, string>> = {
  'awaiting-release-decision': 'approved — waiting for your release decision',
  'on-hold': 'on hold',
  returned: 'returned to the Content Manager',
  'in-academic-review': 'with the Academic Reviewer',
  draft: 'a draft with the Content Manager',
  released: 'released',
  withdrawn: 'withdrawn',
};

/** SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6). */
export const CONTENT_RECORD = {
  back: 'All content',
  stuckTitle: 'Stuck — nobody can act',
  openPlatformRoles: 'Open Platform roles',
  moveStatus: 'Move status (override)',
  publishedReadOnly:
    'Published · read-only. Published content changes only through a correction: Content Manager → Academic Reviewer → your release decision.',
  openReleaseDecision: 'Open the release decision',
  openUpdates: 'Open Updates',
  /** B7-06 `rUpdOther` (an update she may not see yet is never named to her, UPD-18). */
  updateNotReached: 'Nothing reaches you until the Academic Reviewer approves it.',
  inWorkflowTitle: 'In the workflow',
  catalogueTitle: 'Catalogue details',
  readOnly: 'Read-only',
  keys: {
    summary: 'Summary',
    formats: 'Formats',
    liveVersion: 'Live version',
    vendor: 'Vendor',
    whoCanAct: 'Who can act',
  },
  outcomesTitle: 'Learning outcomes',
  historyTitle: 'Governance history',
  historyMeta: 'Newest first',
  none: '—',
  // DL-2 Move status (override), B7-06 f5.
  from: 'From',
  to: 'To',
  overrideEffect:
    'An override is recorded with your name and reason. Published is never offered — only the Content Manager publishes.',
  reasonLabel: 'Reason — kept in the history',
  confirm: 'Move status',
  busy: 'Moving…',
} as const;

/** B7-06 f1: "Nobody — no Academic Reviewer has EEE ZC341 in scope. It has been waiting since 2 Oct 2026." */
export function stuckWhy(whoCanAct: string, since: string): string {
  return `${whoCanAct}. It has been waiting since ${dayMonthYear(since)}.`;
}

/**
 * B7-06 f1: "Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use
 * the override only when that isn’t possible."
 */
export function stuckAdvice(course: string): string {
  return `Giving an Academic Reviewer ${course} in Platform roles lets the review continue. Use the override only when that isn’t possible.`;
}

/** B7-06 f4: "Who can act: Prof. A. Menon · Academic Reviewer. Nothing to do here." */
export function inWorkflowLine(whoCanAct: string | null): string {
  return whoCanAct === null
    ? 'Nothing to do here.'
    : `Who can act: ${whoCanAct}. Nothing to do here.`;
}

/** B7-06 f2: "Version 1.2 stays live until you release it." */
export function staysLiveUntilReleased(label: string): string {
  return `Version ${label} stays live until you release it.`;
}

/** B7-06 f6: "Version 2.0 stays live." */
export function staysLive(label: string): string {
  return `Version ${label} stays live.`;
}

/** B7-06 f2: "1.2 · since 3 Jul 2026". */
export function liveVersionWords(label: string, since: string): string {
  return `${label} · since ${dayMonthYear(since)}`;
}

/** B7-06 f1 overline: "SUB-0085 · EEE ZC341 · Electrical Machines" (upper-cased by the sheet). */
export function recordOverline(
  reference: string | null,
  courseCode: string | null,
  courseName: string | null,
): string {
  return [reference, courseCode, courseName].filter((part) => part !== null).join(' · ');
}

/** B7-06 f5 DL-2 title: "Move SUB-0085 out of review?". */
export function overrideTitle(reference: string): string {
  return `Move ${reference} out of review?`;
}

/** B7-06 f5 "From": "With Academic Reviewer — nobody can act". */
export const OVERRIDE_FROM = `${STATUS_WORDS.review} — nobody can act`;

/**
 * B7-06 f5 "To": "Returned to vendor — Ritu Sharma · Meridian Virtual Labs can change it and send it
 * again" (the one supported move, OD-B7-09).
 */
export function overrideTo(vendor: string): string {
  return `${STATUS_WORDS.vendor} — ${vendor} can change it and send it again`;
}

/** B7-06 script result: "SUB-0085 is now with the vendor. Ritu Sharma · Meridian Virtual Labs can act on it." */
export function overriddenFlash(reference: string, vendor: string): string {
  return `${reference} is now with the vendor. ${vendor} can act on it.`;
}

/** "Ritu Sharma · Meridian Virtual Labs" — who submitted it and their organisation. */
export function vendorWho(person: string | null, organisation: string): string {
  return person === null ? organisation : `${person} · ${organisation}`;
}

// ---- Governance history (B7-06 `hist`: what · when · note, newest first) ----

/** B7-06 f1: "No Academic Reviewer has EEE ZC341 in scope". */
export function noReviewerWhat(course: string): string {
  return `No Academic Reviewer has ${course} in scope`;
}

/** B7-06 f1: "Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles)." */
export function scopeWithdrawnNote(holder: string, course: string, at: string): string {
  return `${holder}’s ${course} scope was withdrawn on ${dayMonthYear(at)} (Platform roles).`;
}

export const HISTORY_WORDS = {
  submitted: 'Submitted for academic review',
  recheck: 'Sent back to the Academic Reviewer for a re-check',
} as const;

/** B7-06 f1: "Revision 1 · from Ritu Sharma, Meridian Virtual Labs". */
export function submittedNote(revision: number, who: string | null, organisation: string): string {
  return who === null
    ? `Revision ${revision} · from ${organisation}`
    : `Revision ${revision} · from ${who}, ${organisation}`;
}

/** B7-06 f3: "Returned to the vendor by Prof. A. Menon" · "Revision 1." */
export function returnedByWhat(who: string): string {
  return `Returned to the vendor by ${who}`;
}

/** Undrawn: the Content Manager's send-back to the vendor (state-copy `SA-13.history`). */
export function sentBackToVendorWhat(who: string): string {
  return `Sent back to the vendor by ${who}`;
}

/** B7-06 f3: "Revision 1." */
export function revisionNote(revision: number): string {
  return `Revision ${revision}.`;
}

/** B7-06 f3: "Resubmitted · revision 2" · "From Anil Shetty, Northline Simulation Studio." */
export function resubmittedWhat(revision: number): string {
  return `Resubmitted · revision ${revision}`;
}

export function fromNote(who: string | null, organisation: string): string {
  return who === null ? `From ${organisation}.` : `From ${who}, ${organisation}.`;
}

/** B7-06 f3: "Approved by Prof. A. Menon" · "Academic review, revision 2." */
export function approvedByWhat(who: string): string {
  return `Approved by ${who}`;
}

export function academicReviewNote(revision: number): string {
  return `Academic review, revision ${revision}.`;
}

/** B7-06 f3: "By Kavya Nair, Content Manager."; with no person named, "By the Content Manager." */
export function byContentManagerNote(who: string | null): string {
  return who === null ? 'By the Content Manager.' : `By ${who}, Content Manager.`;
}

/** B7-06 f2, f3: "Published · version 1.0". */
export function publishedVersionWhat(label: string): string {
  return `Published · version ${label}`;
}

/** B7-06 f2: "Version 1.2 released" · "Correction UPD-0002 — released by the Super Admin." */
export function versionReleasedWhat(label: string): string {
  return `Version ${label} released`;
}

export function releasedCorrectionNote(reference: string): string {
  return `Correction ${reference} — released by the Super Admin.`;
}

/**
 * B7-06 f2: "UPD-0005 approved by the Academic Reviewer — waiting for the release decision" while it
 * still waits; an earlier approval of a correction now on hold without the clause.
 */
export function updateApprovedWhat(reference: string, waiting: boolean): string {
  const what = `${reference} approved by the Academic Reviewer`;
  return waiting ? `${what} — waiting for the release decision` : what;
}

/** B7-06 f2: "Correction 1.2 → 1.3. Version 1.2 stays live until it is released." */
export function updateApprovedNote(from: string, to: string | null): string {
  const versions = to === null ? from : `${from} → ${to}`;
  return `Correction ${versions}. Version ${from} stays live until it is released.`;
}

/** B7-06 f6: "UPD-0004 put on hold by Arjun Mehta" · "Version 2.0 stays live." */
export function updateHeldWhat(reference: string, who: string): string {
  return `${reference} put on hold by ${who}`;
}

/** Undrawn: a hold lifted (state-copy `SA-13.history`). */
export function holdLiftedWhat(reference: string, who: string): string {
  return `Hold on ${reference} lifted by ${who}`;
}

export function holdLiftedNote(live: string): string {
  return `Waiting for the release decision again. Version ${live} stays live.`;
}

/** B7-06 script: "Status moved by Arjun Mehta — override". */
export function overrideWhat(who: string): string {
  return `Status moved by ${who} — override`;
}

/** B7-06 script: "“<reason>” From “With Academic Reviewer” to “Returned to vendor”." */
export function overrideNote(reason: string): string {
  return `“${reason}” From “${STATUS_WORDS.review}” to “${STATUS_WORDS.vendor}”.`;
}

/** The history's dates: the day (B7-06 `hist`); an override with its time (B7-06 script `now()`). */
export function historyDay(instant: string): string {
  return dayMonthYear(instant);
}

export function historyMoment(instant: string): string {
  return dateTime(instant);
}
