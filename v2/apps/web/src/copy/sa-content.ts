/**
 * The words of the Super Admin's Content screens in the V3 Refined B design — SA-10 Content
 * updates, SA-11 Release or hold an update, SA-12 All content and SA-13 Content record — as the
 * owner-approved Super Admin export draws them (design/v3-refined-b/roles/SA-v1,
 * `project/sa-views-c.js` `V.updates`, `V.update`, `V.allContent`, `V.record` and their dialogs
 * `SA.DLG.releaseUpd`, `holdUpd`, `liftUpd`, `override`; `project/sa-core.js` `CONT_LBL`,
 * `whoCanAct`). The list states, the refusals and the rules are the state-copy register's
 * (`state-copy-release.ts`, `state-copy-content-oversight.ts`), which cites the export where it
 * draws them.
 *
 * - **No internal references** (the export's HANDOFF "Shell and shared behaviour"): no UPD-, SUB-,
 *   ACC- or REQ- reference is part of any sentence here; corrections are named by their
 *   experiment and versions, records by their name. Course codes stay.
 * - **Never “Publish”** on the release path: a correction is released, held, or its hold lifted.
 * - The v46 words of these screens (`release.ts`, `content-oversight.ts`) stay for the boards'
 *   evidence tests; the screens read these.
 */
import type { UpdateState } from '@xr/domain';

import { HOLD_OPEN } from './release';

/** The Refined B status tones these screens use (the V3 StatusPill tones). */
export type ContentTone = 'info' | 'ok' | 'warn' | 'err' | 'paused';

function records(count: number): string {
  return `${count} ${count === 1 ? 'record' : 'records'}`;
}

// ---- The Content destination: its head and page tabs (`contentHead`, `contentTabs`) ----

export const CONTENT_HEAD = {
  title: 'Content',
  /** `nav.rk-tabs.sa-tabs[aria-label]`. */
  tabsLabel: 'Content',
  tabs: { updates: 'Updates', all: 'All content' },
  updatesLead:
    'Corrections to published experiments reach you after the Academic Reviewer approves them. Nothing goes live until you release it.',
  allLead: 'Where every experiment and submission is in the workflow, and who can act on it.',
} as const;

// ---- SA-10 Content updates (`V.updates`) ----

export type UpdateShowKey = 'waiting' | 'on-hold' | 'released';

export const UPDATES_LIST = {
  surfaceLabel: 'Corrections to published content',
  /** `div.rb-switch[role=group][aria-label]`. */
  showLabel: 'Show corrections',
  shows: {
    waiting: 'Waiting for your decision',
    'on-hold': 'On hold',
    released: 'Released',
  } satisfies Readonly<Record<UpdateShowKey, string>>,
  headers: {
    who: 'Experiment',
    what: 'What changes',
    kind: 'Approved by',
    when: 'Approved',
    status: 'Status',
  },
  /** `span.rk-inlabel` before the date once the table stacks. */
  whenLabel: 'Approved',
  reviewerRole: 'Academic Reviewer',
  emptyTitle: 'No corrections yet',
  emptyLine: 'Corrections reach you after the Academic Reviewer approves them.',
  /** A segment with nothing in it (the export's per-tab empty state). */
  none: {
    waiting: 'Nothing is waiting for your release decision',
    'on-hold': 'No correction is on hold',
    released: 'No correction has been released yet',
  } satisfies Readonly<Record<UpdateShowKey, string>>,
  foot: 'The only route for changing published content: Content Manager, then Academic Reviewer, then your release decision.',
} as const;

/** The table's name: "Corrections, Waiting for your decision". */
export function updatesCaption(show: UpdateShowKey): string {
  return `Corrections, ${UPDATES_LIST.shows[show]}`;
}

/** "Version 1.2 → 1.3". */
export function versionsLine(from: string, to: string): string {
  return `Version ${from} → ${to}`;
}

/** Under the versions: "Version 1.2 stays live until released", or "Released 5 Aug 2026". */
export function versionsNote(from: string, releasedOn: string | null): string {
  return releasedOn === null
    ? `Version ${from} stays live until released`
    : `Released ${releasedOn}`;
}

/**
 * The row link's name: "Distillation Column correction, version 1.2 to 1.3, Waiting for your
 * decision. Open".
 */
export function updateRowLabel(name: string, from: string, to: string, status: string): string {
  return `${name} correction, version ${from} to ${to}, ${status}. Open`;
}

/** An update's status pill as the Super Admin reads it (the export's `UPD_LBL`, `UPD_KIND`). */
export const CORRECTION_STATUS = {
  'awaiting-release-decision': { words: 'Waiting for your decision', tone: 'warn' },
  'on-hold': { words: 'On hold', tone: 'paused' },
  released: { words: 'Released', tone: 'ok' },
} as const satisfies Readonly<
  Partial<Record<UpdateState, { readonly words: string; readonly tone: ContentTone }>>
>;

// ---- SA-11 Release or hold an update (`V.update`) ----

export const UPDATE_DECISION = {
  eyebrow: 'Correction to a published experiment',
  goTo: 'Go to decision',
  facts: {
    liveNow: 'Live now',
    proposed: 'Proposed',
    released: 'Released',
    course: 'Course',
    formats: 'Formats',
  },
  whatChanges: 'What changes',
  changedOnly: 'Changed fields only',
  compareCaption: 'Changed fields, live and proposed',
  field: 'Field',
  liveBefore: 'Live before',
  liveBeforeNote: '“Live before” is the version that was live until the release.',
  whyTitle: 'Why, from the Content Manager',
  reviewTitle: 'Academic review',
  institutionsTitle: 'Institutions using it',
  institutionsCaption: 'Institutions using this experiment',
  columns: { institution: 'Institution', access: 'Access', status: 'Status' },
  noInstitutions: 'No institution has it in an access plan.',
  institutionsNote:
    'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
  historyTitle: 'History',
  historyNote: 'Newest first · kept after every decision',
  panelTitle: 'Your decision',
  errorsTitle: 'Check your decision',
  chooseDecision: 'Choose a decision',
  legend: 'Decision',
  release: 'Release update',
  hold: 'Hold',
  reasonLabel: 'Reason for the hold (required)',
  reasonHint: 'The Content Manager sees this reason.',
  reasonPending: 'Add the reason before holding.',
  holdGo: 'Hold update',
  releaseGo: 'Release update',
  accessHint: 'Releasing never grants or changes an institution’s access.',
  onHold: 'On hold',
  heldTitle: 'Release isn’t available while the update is on hold',
  heldLine:
    'Lift the hold first. It goes back to waiting for your decision; nothing goes live by itself.',
  liftHold: 'Lift hold',
  /** What a hold blocks is open (T-28): said as the export says it, without the decision id. */
  holdOpen: HOLD_OPEN.words,
  released: 'Released',
  stand: { liveNow: 'Live now', liveBefore: 'Live before', access: 'Institutional access' },
  unchanged: 'Unchanged',
  recorded: 'This decision is recorded and read-only.',
  backToUpdates: 'Back to Updates',
  /** Not approved yet (the export's `notForSA` message). */
  nothingTitle: 'Nothing to decide',
  nothingLine:
    'This correction hasn’t been approved by the Academic Reviewer yet. It reaches you when it is. The live version is unchanged.',
  /** The refusal's way on (the export's `refusalHtml`). */
  checkAgain: 'Check it again',
  /** A hold lifted earlier, shown while no flash says so (state-copy `SA-11.lifted-notice`). */
  liftedTitle: 'Hold lifted',
} as const;

/** "Version 1.2". */
export function versionWords(label: string): string {
  return `Version ${label}`;
}

/** The head's meta: "Approved by Prof. A. Menon on 27 Aug 2026". */
export function approvedMeta(name: string, day: string): string {
  return `Approved by ${name} on ${day}`;
}

/** The comparison's columns: "Live now · 1.2", "Proposed · 1.3", "Released · 1.3". */
export function liveNowColumn(label: string): string {
  return `Live now · ${label}`;
}

export function proposedColumn(label: string): string {
  return `Proposed · ${label}`;
}

export function releasedColumn(label: string): string {
  return `Released · ${label}`;
}

/** The Content Manager's reason, by-line: "Kavya Nair, Content Manager". */
export function whyBy(name: string, role: string): string {
  return role ? `${name}, ${role}` : name;
}

/** "Approved by Prof. A. Menon on 27 Aug 2026, 11:20. The full review history is below." */
export function reviewLine(name: string, when: string): string {
  return `Approved by ${name} on ${when}. The full review history is below.`;
}

/** "In its access plan · WEB, VR". */
export function accessPlanCell(formats: readonly string[]): string {
  return formats.length > 0 ? `In its access plan · ${formats.join(', ')}` : 'In its access plan';
}

/** The decision choices' consequence lines. */
export function releaseChoiceLine(to: string): string {
  return `Version ${to} goes live for everyone.`;
}

export function holdChoiceLine(live: string): string {
  return `Version ${live} stays live. You can lift the hold later.`;
}

/** The held panel: "Put on hold on 20 Aug 2026 by Arjun Mehta". */
export function heldMeta(day: string, by: string): string {
  return `Put on hold on ${day} by ${by}`;
}

/** The released panel: "Released on 5 Aug 2026 by Arjun Mehta". */
export function releasedMeta(day: string, by: string): string {
  return `Released on ${day} by ${by}`;
}

/** The browser tab and Help's "Where did it happen?": "Distillation Column correction". */
export function correctionPlace(name: string): string {
  return `${name} correction`;
}

/** The confirmations' two groups (the export's `dlgList`). */
export const DIALOG_GROUPS = {
  now: 'What happens now',
  later: 'Only after later events, or not from here',
  cancel: 'Cancel',
  yourReason: 'Your reason',
} as const;

export const RELEASE_CONFIRM = {
  description: 'Releasing replaces the live version for everyone at once.',
  confirm: 'Release update',
  busy: 'Releasing…',
  later: ['No institution’s or student’s access changes.'],
} as const;

/** "Release version 1.3 of Distillation Column?". */
export function releaseConfirmTitle(to: string, name: string): string {
  return `Release version ${to} of ${name}?`;
}

export function releaseConfirmNow(to: string, from: string): readonly string[] {
  return [
    `Version ${to} goes live for everyone: the public catalogue and every institution using it.`,
    `Version ${from} is kept in the history as Live before.`,
  ];
}

export const HOLD_CONFIRM = { confirm: 'Hold update', busy: 'Holding…' } as const;

/** "Hold the Distillation Column correction?". */
export function holdConfirmTitle(name: string): string {
  return `Hold the ${name} correction?`;
}

export function holdConfirmDescription(live: string): string {
  return `Version ${live} stays live. The Content Manager sees your reason.`;
}

export const LIFT_CONFIRM = {
  description: 'It goes back to waiting for your decision. Nothing goes live.',
  confirm: 'Lift hold',
  busy: 'Lifting…',
} as const;

/** "Lift the hold on the Distillation Column correction?". */
export function liftConfirmTitle(name: string): string {
  return `Lift the hold on the ${name} correction?`;
}

/** What a decision did, said once it is recorded (the export's `setFlash`). */
export function releasedFlash(to: string): { readonly title: string; readonly line: string } {
  return {
    title: `Version ${to} is live.`,
    line: 'Everyone now sees the corrected experiment. No access changed.',
  };
}

export function heldFlash(live: string): { readonly title: string; readonly line: string } {
  return { title: 'The correction is on hold.', line: `Version ${live} stays live.` };
}

export const LIFTED_FLASH = {
  title: 'Hold lifted.',
  line: 'The correction is waiting for your decision again. Nothing went live.',
} as const;

// ---- SA-12 All content (`V.allContent`) ----

/** A record's workflow status as the Super Admin reads it (`CONT_LBL`, `CONT_KIND`). */
export const WORKFLOW_STATUS = {
  published: { words: 'Published', tone: 'ok' },
  review: { words: 'With the Academic Reviewer', tone: 'info' },
  cm: { words: 'With the Content Manager', tone: 'info' },
  vendor: { words: 'Returned to the vendor', tone: 'warn' },
  stuck: { words: 'Stuck — nobody can act', tone: 'err' },
  /** Undrawn: a resubmission not yet routed (M-3; state-copy `SA-12.resubmitted`). */
  resubmitted: { words: 'Resubmitted', tone: 'warn' },
} as const satisfies Readonly<
  Record<string, { readonly words: string; readonly tone: ContentTone }>
>;

export type WorkflowStatusKey = keyof typeof WORKFLOW_STATUS;

export const ALL_CONTENT_LIST = {
  surfaceLabel: 'Every experiment and submission',
  filterLabel: 'Filter content',
  searchLabel: 'Search',
  searchPlaceholder: 'Experiment or course code',
  statusLabel: 'Workflow status',
  allStatuses: 'All statuses',
  caption: 'Experiments and submissions with their workflow status',
  headers: {
    who: 'Experiment',
    what: 'Where it is',
    kind: 'Who can act',
    when: 'Formats',
    status: 'Status',
  },
  nobodyNeedsToAct: 'Nobody needs to act',
  openUpdates: 'Open Updates',
  showStuck: 'Show stuck records',
  emptyTitle: 'No content yet',
  emptyLine: 'Experiments appear here once a vendor starts one.',
  noMatchTitle: 'No content matches',
  noMatchLine: 'Try another name or course code.',
  clearFilters: 'Clear filters',
  foot: 'Published content is read-only. It changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.',
} as const;

/** "All statuses (19)", "Published (13)". */
export function statusOption(label: string, count: number): string {
  return `${label} (${count})`;
}

/** "19 records · read-only"; filtered, "3 of 19 records · read-only". */
export function contentCount(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${records(total)} · read-only` : `${records(total)} · read-only`;
}

export function searchChip(search: string): string {
  return `Search: “${search}”`;
}

export function statusChip(label: string): string {
  return `Status: ${label}`;
}

/** "Formats: WEB, VR" (what the badges mean, read instead of the codes). */
export function formatsLabel(formats: readonly string[]): string {
  return `Formats: ${formats.join(', ')}`;
}

/** The row link's name: "DC Motor Speed Control, Stuck — nobody can act. Open the record". */
export function contentRowLabel(name: string, status: string): string {
  return `${name}, ${status}. Open the record`;
}

/** A published row's open correction, as far as she may see it (the export's `updTag`). */
export function correctionTag(state: UpdateState): string | null {
  if (state === 'awaiting-release-decision') return 'Correction waiting for your release decision';
  if (state === 'on-hold') return 'Correction on hold';
  return null;
}

/** The notice of corrections waiting for her decision. */
export function correctionsWaitingTitle(count: number): string {
  return count === 1
    ? 'A correction is waiting for your release decision'
    : `${count} corrections are waiting for your release decision`;
}

/** "Distillation Column 1.2 → 1.3." — each correction, joined with " · ". */
export function correctionsWaitingLine(
  corrections: readonly { readonly name: string; readonly from: string; readonly to: string }[],
): string {
  return `${corrections.map(({ name, from, to }) => `${name} ${from} → ${to}`).join(' · ')}.`;
}

/** The stuck notice (a product action the export does not draw): "1 record stuck — nobody can act". */
export function stuckRecordsTitle(count: number): string {
  return `${records(count)} stuck — nobody can act`;
}

/** "DC Motor Speed Control (EEE ZC341). Open the record to see why." */
export function stuckRecordsLine(
  stuck: readonly { readonly name: string; readonly course: string | null }[],
): string {
  const named = stuck.map(({ name, course }) => (course === null ? name : `${name} (${course})`));
  return `${named.join(' · ')}. Open the record to see why.`;
}

// ---- SA-13 Content record (`V.record`) ----

export const CONTENT_RECORD_V3 = {
  submission: 'Submission',
  experiment: 'Experiment',
  goToOverride: 'Go to override',
  stuckTitle: 'Stuck — nobody can act',
  openPlatformRoles: 'Open Platform roles',
  publishedTitle: 'Published · read-only',
  publishedLine:
    'Published content changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.',
  openReleaseDecision: 'Open the release decision',
  openHeldCorrection: 'Open the held correction',
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
  notPublished: 'Not published',
  outcomesTitle: 'Learning outcomes',
  historyTitle: 'Governance history',
  historyNote: 'Newest first',
  panelTitle: 'Move status (override)',
  from: 'From',
  to: 'To',
  fromValue: 'With the Academic Reviewer',
  toValue: 'Returned to the vendor',
  moveHint:
    'Returning it to the vendor is the one supported move for a stuck record. Published is never offered; only the Content Manager publishes.',
  reasonLabel: 'Reason (required)',
  reasonHint: 'Recorded with your name. The vendor sees it with the returned submission.',
  move: 'Move status',
  busy: 'Moving…',
  confirmDescription: 'An override, recorded with your name and reason.',
  confirmLater: [
    'Nothing is published. It goes through academic review again after the vendor resubmits.',
  ],
  flashTitle: 'Returned to the vendor.',
  flashLine: 'The override and your reason are in the governance history.',
  checkAgain: 'Check it again',
} as const;

/**
 * "No Academic Reviewer has EEE ZC341 in scope, so this review can’t continue. Giving an Academic
 * Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that
 * isn’t possible."
 */
export function stuckLine(course: string): string {
  return `No Academic Reviewer has ${course} in scope, so this review can’t continue. Giving an Academic Reviewer ${course} in Platform roles lets the review continue. Use the override only when that isn’t possible.`;
}

/** "Prof. A. Menon · Academic Reviewer can act on it. Nothing is needed from you." */
export function inWorkflowLine(whoCanAct: string): string {
  return `${whoCanAct} can act on it. Nothing is needed from you.`;
}

/** "Version 1.2, live since 3 Jul 2026". */
export function liveVersionLine(label: string, since: string): string {
  return `Version ${label}, live since ${since}`;
}

/** "Return DC Motor Speed Control to the vendor?". */
export function overrideConfirmTitle(name: string): string {
  return `Return ${name} to the vendor?`;
}

export function overrideConfirmNow(vendor: string): readonly string[] {
  return [
    'Its status moves from “With the Academic Reviewer” to “Returned to the vendor”.',
    `${vendor} can work on it again.`,
  ];
}

// The governance history's correction entries, named without the correction's reference.

/** "Correction approved by the Academic Reviewer — waiting for the release decision". */
export function correctionApprovedWhat(waiting: boolean): string {
  const what = 'Correction approved by the Academic Reviewer';
  return waiting ? `${what} — waiting for the release decision` : what;
}

/** "Correction put on hold by Arjun Mehta". */
export function correctionHeldWhat(who: string): string {
  return `Correction put on hold by ${who}`;
}

/** "Hold on the correction lifted by Arjun Mehta". */
export function correctionLiftedWhat(who: string): string {
  return `Hold on the correction lifted by ${who}`;
}

/** Under "Version 1.2 released": "Released by the Super Admin." */
export const RELEASED_BY_SUPER_ADMIN = 'Released by the Super Admin.';

/** "Status moved by Arjun Mehta (override)". */
export function statusMovedWhat(who: string): string {
  return `Status moved by ${who} (override)`;
}

/** "“<reason>” From “With the Academic Reviewer” to “Returned to the vendor”." */
export function statusMovedNote(reason: string): string {
  return `“${reason}” From “${WORKFLOW_STATUS.review.words}” to “${WORKFLOW_STATUS.vendor.words}”.`;
}
