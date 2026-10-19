/**
 * The words of the Super Admin's institution screens — SA-06 Institutions (B7-02) and SA-07
 * Institution detail (B7-03, B7-04) — written from the canonical facts the ports answer
 * (`@xr/contracts/draft` `institutionRow`, `institutionDetail`): read models carry no words. Each
 * entry names the board that draws it; what no board words is a provisional entry of the
 * state-copy register (`state-copy.ts`, VD-12), never an invented rule. Status words come from the
 * role-relative table (`flow-state-words.ts` `institutionWords`).
 *
 * P1-14 / VD-10 (owner decision, Package-1D authorisation §2): B7-02 and B7-03 write internal
 * decision ids into five sentences — "(T-06)", "(T-08)", "(T-09)", "(T-11)", "(T-25)". The product
 * shows each sentence without them; `STRIPPED` keeps every sentence's frozen board wording and its
 * ids, so the copy stays traceable to the boards (`institutions.test.ts`). The ids themselves stay
 * in the domain, the tests and the documents.
 */
import type {
  AccessPlanTerm,
  InstitutionKind,
  RequestStatus,
  RequestType,
  Technology,
} from '@xr/domain';

import { calendarDay } from './dates';
import { REQUEST_TYPE_WORDS, routeWords } from './requests';

/** A sentence the product shows without the internal decision ids its board writes (P1-14). */
export interface StrippedSentence {
  /** The words the product shows. */
  readonly words: string;
  /** The frozen board's wording, ids included (found verbatim on `board`). */
  readonly drawn: string;
  /** The internal decision ids taken out, in board order. */
  readonly ids: readonly string[];
  /** The board and the place that draw it. */
  readonly board: string;
}

function stripped(drawn: string, board: string): StrippedSentence {
  const ids = [...drawn.matchAll(/ \((T-\d{2})\)/g)].map((match) => match[1]!);
  return { words: drawn.replace(/ \(T-\d{2}\)/g, ''), drawn, ids, board };
}

/**
 * The five B7-02 / B7-03 sentences that carry decision ids (Appendix E §10 VD-10; Appendix G
 * P1-14: "Strip the suffix through a copy table and keep the sentence"). The assign flash's second
 * sentence follows the person and institution `assignedFlash` names.
 */
export const STRIPPED = {
  noDirectCreation: stripped(
    'Institutions are created only by approving a request — there is no direct creation (T-09)',
    'B7-02 f0 … f6 page header (`xl-meta`)',
  ),
  licenceNote: stripped(
    'Licence figures are shown as provided — how licences are counted is still open (T-06). A plan can’t be amended here; changes come through a new request (T-08).',
    'B7-03 “Access plans” (`p.xl-meta` under the table)',
  ),
  reportNote: stripped(
    'Per format, never added up into one figure. Student feedback is not shown here (T-25).',
    'B7-03 “Institution report” (`p.xl-meta` under the table)',
  ),
  assignBody: stripped(
    'They manage people, groups and student access for this institution. Nothing is sent from here (T-11).',
    'B7-03 f6 “Assign the Institute Admin for …” (`xr-dialog-body`)',
  ),
  assignedFlash: stripped(
    'Nothing is sent from here — how they first sign in is still open (T-11).',
    'B7-03 script `doAssign` flash (after “<name> is now the Institute Admin for <institution>.”)',
  ),
} as const satisfies Readonly<Record<string, StrippedSentence>>;

// ---- shared ----

/** "Internal" / "External" (B7-02 row line, B7-03 summary "Internal or external"). */
export function kindWords(kind: InstitutionKind): string {
  return routeWords(kind);
}

/** "12 students", "1 student" (B7-03 "12 students · 3 Faculty"; the singular is undrawn). */
function students(count: number): string {
  return `${count} ${count === 1 ? 'student' : 'students'}`;
}

/** B7-03 People line: "12 students · 3 Faculty". */
export function peopleWords(studentCount: number, facultyCount: number): string {
  return `${students(studentCount)} · ${facultyCount} Faculty`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// ---- SA-06 Institutions (B7-02) ----

export const INSTITUTIONS_PAGE = {
  title: 'Institutions',
  /** B7-02 page header, without "(T-09)" (P1-14). */
  meta: STRIPPED.noDirectCreation.words,
  sectionTitle: 'Every institution',
  sectionMeta: 'Created when a request is approved',
  tabsLabel: 'Show',
  searchLabel: 'Search institutions',
  searchPlaceholder: 'Institution, access plan or Institute Admin',
  clearFilters: 'Clear filters',
  columns: {
    institution: 'Institution',
    status: 'Status',
    instituteAdmin: 'Institute Admin',
    accessEnds: 'Access ends',
    action: 'Action',
  },
  open: 'Open',
  notAssigned: 'Not assigned',
  needsOne: 'Needs one',
  /** B7-02 f5: "Loading institutions…" (the section's status). */
  loading: 'Loading institutions…',
  noMatchTitle: 'No institutions match',
  noMatchLine: 'Try another name or clear the filters.',
} as const;

/** The B7-02 status tabs, in board order (the contract's `access-ended` has no tab). */
export const INSTITUTION_TAB_WORDS = [
  ['all', 'All'],
  ['access-active', 'Access active'],
  ['ending-soon', 'Ending soon'],
  ['access-paused', 'Paused'],
  ['approved-payment-required', 'Awaiting payment'],
  ['no-institute-admin', 'No Institute Admin'],
] as const;

/**
 * The SA-06 list's status filter (`listInstitutions` tabs): the V3 status select's options
 * (`SA_INSTITUTION_FILTERS`), which add Access ended to B7-02's tabs.
 */
export type InstitutionTabId = (typeof SA_INSTITUTION_FILTERS)[number][0];

/** B7-02 status line: "7 of 7 institutions" (always "x of y"; `plural(n, 'institution')`). */
export function institutionCountWords(shown: number, total: number): string {
  return `${shown} of ${plural(total, 'institution')}`;
}

/**
 * B7-02 row line after the kind: "ACC-0107 · 1 course · 1 experiment", or "No access plan yet · 1
 * experiment requested" before the payment. Several plans (undrawn: a renewal or more licences
 * leaves the plan as it is, OD-B3-09) are each written so, joined by " · ".
 */
export function planSummaryWords(
  plans: readonly {
    readonly id: string;
    readonly courseCount: number;
    readonly experimentCount: number;
  }[],
  requestedExperiments: number,
): string {
  if (plans.length === 0) {
    return `No access plan yet · ${plural(requestedExperiments, 'experiment')} requested`;
  }
  return plans
    .map(
      (plan) =>
        `${plan.id} · ${plural(plan.courseCount, 'course')} · ${plural(plan.experimentCount, 'experiment')}`,
    )
    .join(' · ');
}

/** B7-02 "Access ends": "Ends 7 Oct 2027", "Ended 15 Oct 2026", "—" before a plan. */
export function accessEndsWords(endsOn: string | null, ended: boolean): string {
  if (endsOn === null) return '—';
  return `${ended ? 'Ended' : 'Ends'} ${calendarDay(endsOn)}`;
}

/** B7-02 row action name: "Open Godavari Institute of Technology". */
export function openInstitutionLabel(name: string): string {
  return `Open ${name}`;
}

// ---- SA-07 Institution detail (B7-03) ----

export const DETAIL_PAGE = {
  back: 'Institutions',
  assign: 'Assign Institute Admin',
  pause: 'Pause access',
  restore: 'Restore access',
  pausedTitle: 'Access paused',
  pausedTail: 'Students can’t open experiments. Everyone’s work is kept.',
  noAdminTitle: 'No Institute Admin',
  noAdminLine: 'Nobody at this institution can give students access until you assign one.',
  summary: 'Institution summary',
  summaryKeys: {
    status: 'Status',
    kind: 'Internal or external',
    instituteAdmin: 'Institute Admin',
    plan: 'Access plan',
    people: 'People',
  },
  adminLater: 'The Institute Admin is assigned once access is active.',
  plans: 'Access plans',
  plansMeta: 'Read-only',
  planColumns: {
    plan: 'Plan',
    experiments: 'Experiments and formats',
    experimentsLabel: 'Experiments',
    licences: 'Licences',
    term: 'Term',
    status: 'Status',
  },
  /** B7-03 "Access plans" note, without "(T-06)" and "(T-08)" (P1-14). */
  licenceNote: STRIPPED.licenceNote.words,
  attention: 'Needs attention',
  nothingNeedsAttention: 'Nothing needs attention.',
  report: 'Institution report',
  reportColumns: {
    experiment: 'Experiment',
    studentsWithAccess: 'Students with access',
    byFormat: 'By format',
  },
  /** B7-03 "Institution report" note, without "(T-25)" (P1-14). */
  reportNote: STRIPPED.reportNote.words,
  noActivity: 'No activity yet — access hasn’t started.',
  people: 'People',
  peopleTail:
    'The Institute Admin manages people; a status change here is an override with a reason.',
  studentsLabel: 'Students',
  changeStatus: 'Change status',
  overrideHint: 'An override — kept in the history. The Institute Admin normally changes this.',
  cancel: 'Cancel',
  history: 'History',
  historyMeta: 'Newest first',
  reasonLabel: 'Reason — kept in the history',
  reasonRequired: 'Add a reason — it is kept in the history',
  assignFields: { name: 'Name', workEmail: 'Work e-mail' },
  /** B7-03 f6 dialog body, without "(T-11)" (P1-14). */
  assignBody: STRIPPED.assignBody.words,
  assignConfirm: 'Assign',
  assignBusy: 'Assigning…',
  pauseBusy: 'Pausing…',
  restoreBusy: 'Restoring…',
  pauseBody:
    'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.” Students can’t open experiments until you restore access. The access plan and everyone’s work are kept.',
} as const;

/** B7-03 overline: "External institution · access plan ACC-0107" ("Internal institution" before a plan). */
export function detailOverline(kind: InstitutionKind, planId: string | null): string {
  return `${kindWords(kind)} institution${planId ? ` · access plan ${planId}` : ''}`;
}

/** B7-03 page header: "Institute Admin: Meera Iyer" ("Not assigned" when none). */
export function instituteAdminLine(name: string | null): string {
  return `Institute Admin: ${name ?? INSTITUTIONS_PAGE.notAssigned}`;
}

/** B7-03 "Open request REQ-0042": the request the institution was created from. */
export function openRequestWords(reference: string): string {
  return `Open request ${reference}`;
}

/** B7-03 paused notice: "Paused on 12 Oct 2026 · “…reason…” Students can’t open experiments. …". */
export function pausedLine(pausedOn: string, reason: string): string {
  return `Paused on ${pausedOn} · “${reason}” ${DETAIL_PAGE.pausedTail}`;
}

/** B7-03 term words: "Yearly" (B1-11 approves Monthly · Quarterly · Yearly). */
export function planTermWords(term: AccessPlanTerm): string {
  switch (term) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    case 'until-date':
      // B1-07's "Until a fixed date" has no Super Admin wording (P1-10; state-copy SA-07.term-until).
      return 'Until a fixed date';
  }
}

/** B7-03 plan dates: "8 Oct 2026 – 7 Oct 2027". */
export function planDates(startsOn: string, endsOn: string): string {
  return `${calendarDay(startsOn)} – ${calendarDay(endsOn)}`;
}

/** B7-03 summary "Access plan": "ACC-0107 · 120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027". */
export function planLine(plan: {
  readonly id: string;
  readonly licences: number;
  readonly term: AccessPlanTerm;
  readonly startsOn: string;
  readonly endsOn: string;
}): string {
  return `${plan.id} · ${plan.licences} licences · ${planTermWords(plan.term)} · ${planDates(plan.startsOn, plan.endsOn)}`;
}

/** B7-03 f3: "No access plan yet — it is created when the payment for REQ-0037 is confirmed". */
export function noPlanLine(reference: string): string {
  return `No access plan yet — it is created when the payment for ${reference} is confirmed`;
}

/** B7-03 plan row experiment: "Shell-and-Tube Heat Exchanger · ME ZG523". */
export function planExperimentWords(name: string, platformCode: string | null): string {
  return platformCode ? `${name} · ${platformCode}` : name;
}

/** B7-03 report "By format": "4 started · 2 completed" (beside the format chip). */
export function startedCompletedWords(started: number, completed: number): string {
  return `${started} started · ${completed} completed`;
}

/** B7-03 People list: "Active" / "Inactive" (`stw`). */
export function accountWords(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'Active' : 'Inactive';
}

/** B7-03 "Change status for Sneha Reddy" (the button's name). */
export function changeStatusLabel(name: string): string {
  return `Change status for ${name}`;
}

/** B7-03 f8 field: "Reason for changing the status to Active". */
export function overrideReasonLabel(to: 'active' | 'inactive'): string {
  return `Reason for changing the status to ${accountWords(to)}`;
}

/** B7-03 f8 button: "Change to Active". */
export function overrideConfirm(to: 'active' | 'inactive'): string {
  return `Change to ${accountWords(to)}`;
}

/** B7-03 flash after an override: "Sneha Reddy is now active." */
export function overriddenFlash(name: string, to: 'active' | 'inactive'): string {
  return `${name} is now ${to}.`;
}

/** B7-03 dialog titles. */
export function assignTitle(name: string): string {
  return `Assign the Institute Admin for ${name}`;
}
export function pauseTitle(name: string): string {
  return `Pause access for ${name}?`;
}
export function restoreTitle(name: string): string {
  return `Restore access for ${name}?`;
}
export function restoreBody(name: string): string {
  return `Everyone at ${name} can work again on the experiments in its access plan. The pause and your reason stay in the history.`;
}

/** B7-03 flashes after Assign (P1-14: without "(T-11)"), Pause and Restore. */
export function assignedFlash(adminName: string, name: string): string {
  return `${adminName} is now the Institute Admin for ${name}. ${STRIPPED.assignedFlash.words}`;
}
export function pausedFlash(name: string): string {
  return `Access paused. Everyone at ${name} now sees the paused banner.`;
}
export function restoredFlash(name: string): string {
  return `Access restored. ${name} can work again.`;
}

/** B7-03 assign field errors (the contract catalogue's `SA-07.*` keys hold the same words). */
export const ASSIGN_ERRORS = {
  nameRequired: 'Enter the person’s name',
  emailRequired: 'Enter a work e-mail address',
  emailFormat: 'Enter an e-mail address like name@institution.edu.in',
} as const;

// ---- "Needs attention" (B7-03 `att`) ----

/** B7-03 Sahyadri: "No Institute Admin yet — nobody can give students access". */
export const ATTENTION_NO_ADMIN = 'No Institute Admin yet — nobody can give students access';

/** B7-03 Deccan: "Access paused since 12 Oct 2026". */
export function attentionPaused(since: string): string {
  return `Access paused since ${since}`;
}

/**
 * B7-03 Vizag: "Approved — payment required (REQ-0037). Access starts when the payment is
 * confirmed." — the request the institution was created from, waiting for its payment.
 */
export function attentionAwaitingPayment(reference: string): string {
  return `Approved — payment required (${reference}). Access starts when the payment is confirmed.`;
}

/**
 * Another open request of the institution: "REQ-0040 additional licences — under review",
 * "REQ-0036 additional licences — payment not confirmed" (B7-03 Konark, Sahyadri): reference, the
 * type and the status in lower case. Other combinations follow the same two drawn rows
 * (state-copy `SA-07.attention-request`).
 */
export function attentionRequest(
  reference: string,
  type: RequestType,
  statusWords: string,
): string {
  return `${reference} ${REQUEST_TYPE_WORDS[type].toLowerCase()} — ${statusWords.toLowerCase()}`;
}

/** The requests that still need a decision or a payment: everything but Access active. */
export function isOpenRequest(status: RequestStatus): boolean {
  return status !== 'access-active';
}

/** The action of a request row: the Requests list (B7-03 `["…", "Requests", "sareq"]`). */
export const ATTENTION_REQUESTS = 'Requests';

// ---- History (B7-03 `hist`; institution events as the boards word them) ----

/** "Request REQ-0042 approved — payment required" / "Request REQ-0039 approved". */
export function historyApproved(reference: string, kind: InstitutionKind): string {
  return `Request ${reference} approved${kind === 'external' ? ' — payment required' : ''}`;
}

/** The note under an approval: "External." / "Internal." (B7-03 sahyadri, bitshyd). */
export function historyApprovedNote(kind: InstitutionKind): string {
  return `${kindWords(kind)}.`;
}

/** "Access active · ACC-0107". */
export function historyActivated(planId: string): string {
  return `Access active · ${planId}`;
}

/** "Payment confirmed." (external) / "Internal — no payment step." (internal). */
export function historyActivatedNote(kind: InstitutionKind): string {
  return kind === 'external' ? 'Payment confirmed.' : 'Internal — no payment step.';
}

/** "Institute Admin assigned — Meera Iyer". */
export function historyAssigned(name: string): string {
  return `Institute Admin assigned — ${name}`;
}

/** The note of an assignment (B7-03 `doAssign`): "n.joshi@sahyadri.edu.in · Arjun Mehta". */
export function historyAssignedNote(workEmail: string, by: string): string {
  return `${workEmail} · ${by}`;
}

/** "Access paused by Arjun Mehta" / "Access restored by Arjun Mehta"; the note is the reason. */
export function historyPaused(by: string): string {
  return `Access paused by ${by}`;
}
export function historyRestored(by: string): string {
  return `Access restored by ${by}`;
}
export function quoted(reason: string): string {
  return `“${reason}”`;
}

/** "Request REQ-0040 received — additional licences" / "Renewal REQ-0038 received". */
export function historyLicencesRequested(reference: string): string {
  return `Request ${reference} received — additional licences`;
}
export function historyRenewalRequested(reference: string): string {
  return `Renewal ${reference} received`;
}

/** The note of a request an Institute Admin sent (B7-03 godavari): "Meera Iyer, Institute Admin". */
export function historySentBy(name: string): string {
  return `${name}, Institute Admin`;
}

/** "Access ended · ACC-0079" (B7-03 malnad); "Student status changed" (B7-03 `save`). */
export function historyEnded(planId: string | null): string {
  return planId ? `Access ended · ${planId}` : 'Access ended';
}
export const HISTORY_OVERRIDE = 'Student status changed';

/** Formats as the boards write them in a chip ("WEB", "VR"). */
export function formatCode(format: Technology): string {
  return format.toUpperCase();
}

// ==== V3 Refined B — the owner-approved Super Admin export (SA-v1) ===============================
//
// SA-06 and SA-07 in the V3 Refined B design (design/v3-refined-b/roles/SA-v1, `sa-views-b.js`
// `V.institutions`, `V.institution`, its dialogs and flashes): the export's words for what it
// draws; the state-copy register's for what it does not. No internal reference (REQ-, ACC-, DTR-)
// appears in these words or in an accessible name: plans are named by their content and term,
// requests by their content (the export's HANDOFF "Shell and shared behaviour"). The B7 wording
// above stays for its traceability tests; the screens read the words below.

/** SA-06's status select, in the export's order (`FILTERS`), by `listInstitutions` tab. */
export const SA_INSTITUTION_FILTERS = [
  ['all', 'All statuses'],
  ['access-active', 'Access active'],
  ['ending-soon', 'Ending soon'],
  ['access-paused', 'Access paused'],
  ['approved-payment-required', 'Approved — payment required'],
  ['access-ended', 'Access ended'],
  ['no-institute-admin', 'No Institute Admin'],
] as const;

export const SA_INSTITUTIONS = {
  title: 'Institutions',
  lead: 'Every institution on the platform. Each one is created when a request is approved.',
  /** The list surface's name (`section.rk-surface[aria-label]`). */
  surface: 'Institutions',
  toolbar: 'Filter institutions',
  searchLabel: 'Search',
  searchPlaceholder: 'Institution or Institute Admin',
  statusLabel: 'Status',
  caption: 'Institutions, by name',
  columns: {
    institution: 'Institution',
    plan: 'Access plan',
    instituteAdmin: 'Institute Admin',
    accessEnds: 'Access ends',
    status: 'Status',
  },
  needsOne: 'Needs one',
  adminLater: 'Assigned once access is active',
  /** An ended institution that never had an Institute Admin (undrawn; state-copy SA-06.admin-cell). */
  notAssigned: 'Not assigned',
  endsLabel: 'Access ends',
  notSetLabel: 'Access ends:',
  notSetYet: 'not set yet',
  /** Under the empty state's title (state-copy SA-06.none; loading and failed are SA-06.*). */
  emptyLine: 'An institution appears here when you approve its first request.',
  noMatchTitle: 'No institutions match',
  noMatchLine: 'Try another name or clear the filters.',
  clearFilters: 'Clear filters',
  foot: 'Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.',
} as const;

/** A status option with its figure: "All statuses (7)"; the words alone while figures load. */
export function filterOptionWords(label: string, count: number | null): string {
  return count === null ? label : `${label} (${count})`;
}

/** The count line: "7 institutions"; "1 of 7 institutions" while a search or status applies. */
export function saInstitutionCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${plural(total, 'institution')}` : plural(total, 'institution');
}

/** The chips of the applied filters: "Search: “kulkarni”", "Status: Access paused". */
export function searchChipWords(search: string): string {
  return `Search: “${search}”`;
}
export function statusChipWords(label: string): string {
  return `Status: ${label}`;
}

/**
 * The row link's name: "Sahyadri Institute of Engineering, Access active, no Institute Admin.
 * Open the institution" (the export's `aria-label`).
 */
export function institutionRowLabel(name: string, status: string, needsAdmin: boolean): string {
  return `${name}, ${status}${needsAdmin ? ', no Institute Admin' : ''}. Open the institution`;
}

/**
 * "Access plan": "1 course · 1 experiment"; with several plans "… · 2 plans" (each plan's courses
 * and experiments as the service counts them, added up — state-copy SA-06.plan-cell); before the
 * payment "No access plan yet · 1 experiment requested".
 */
export function saPlanSummaryWords(
  plans: readonly { readonly courseCount: number; readonly experimentCount: number }[],
  requestedExperiments: number,
): string {
  if (plans.length === 0) {
    return `No access plan yet · ${plural(requestedExperiments, 'experiment')} requested`;
  }
  const courses = plans.reduce((sum, plan) => sum + plan.courseCount, 0);
  const experiments = plans.reduce((sum, plan) => sum + plan.experimentCount, 0);
  const several = plans.length > 1 ? ` · ${plans.length} plans` : '';
  return `${plural(courses, 'course')} · ${plural(experiments, 'experiment')}${several}`;
}

/** "Ended 15 Oct 2026" (an ended institution's access end). */
export function endedOnWords(endsOn: string): string {
  return `Ended ${calendarDay(endsOn)}`;
}

/** SA-07 Institution detail as SA-v1 `V.institution` draws it. */
export const SA_INSTITUTION = {
  goTo: 'Go to actions',
  noAdminTitle: 'No Institute Admin',
  noAdminLine: 'Nobody at this institution can give students access until you assign one.',
  facts: {
    status: 'Status',
    kind: 'Internal or external',
    instituteAdmin: 'Institute Admin',
    people: 'People',
  },
  notAssigned: 'Not assigned',
  whyPaused: 'Why access is paused',
  pausedSeen:
    'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.”',
  noPlanTitle: 'Access plan',
  noPlanLine:
    'No access plan yet. It is created when the payment for the approved request is confirmed. Payment isn’t recorded here.',
  openApproved: 'Open the approved request',
  planKicker: 'Access plan',
  renewalUnderReview: 'Its renewal request is under review.',
  renewalApproved: 'Its renewal was approved. This page does not change the term.',
  openRenewal: 'Open renewal request',
  viewRenewal: 'View renewal',
  notCovered: 'Not covered by the renewal request.',
  reminderDue: 'Reminder due. Nothing is sent from here.',
  viewAccessEnding: 'View access ending',
  pausedNoteTitle: 'Read-only while access is paused',
  pausedNoteLine: 'Students can’t open its experiments. Everyone’s work is kept.',
  endedNoteLine: 'Ended access comes back only through a renewal request.',
  planFootnote: 'A plan can’t be amended here; changes come through a new request.',
  inPlan: 'In the plan',
  notInPlan: 'Not in the plan',
  notPublished: 'Not published',
  activity: 'Activity by format',
  activityCaption: 'Students with access and activity by format',
  activityColumns: {
    experiment: 'Experiment',
    studentsWithAccess: 'Students with access',
    byFormat: 'By format',
  },
  activityNote: 'Per format, never added up into one figure. Student feedback is not shown here.',
  people: 'People',
  peopleLine:
    'The Institute Admin manages people. A status change here is an override with a reason.',
  nobody: 'Nobody has been added yet. The Institute Admin adds students and Faculty.',
  changeStatus: 'Change status',
  overrideHint: 'An override, kept in the history. The Institute Admin normally changes this.',
  cancel: 'Cancel',
  history: 'History',
  newestFirst: 'Newest first',
  panel: 'What you can do',
  groupAdmin: 'Institute Admin',
  groupAccess: 'Access',
  groupWaiting: 'Also waiting for this institution',
  adminLater: 'The Institute Admin is assigned once access is active.',
  adminNone: 'Not assigned. They manage people, groups and student access for this institution.',
  assign: 'Assign Institute Admin',
  pauseHint:
    'Pausing stops students opening experiments. It is reversible and everyone’s work is kept.',
  pause: 'Pause access',
  restoreHint: 'Restoring lets everyone work again on the experiments in its access plan.',
  restore: 'Restore access',
  paymentHint: 'No status action here. Payment is confirmed on the request, outside this page.',
  openRequest: 'Open request',
  endedHint: 'No status action here. Ended access comes back only through a renewal request.',
  nothingWaiting: 'Nothing else needs you here.',
  reviewTransfer: 'Review transfer',
  assignDescription:
    'They manage people, groups and student access for this institution. Nothing is sent from here; how they first sign in is still open.',
  assignFields: { name: 'Name', workEmail: 'Work e-mail' },
  assignConfirm: 'Assign',
  assignBusy: 'Assigning…',
  reasonLabel: 'Reason, kept in the history',
  pauseBlocksRequest: 'Its open request can’t be decided while access is paused.',
  pauseBusy: 'Pausing…',
  restoreBusy: 'Restoring…',
  assignedLine: 'Nothing is sent from here. How they first sign in is still open.',
  pausedTitle: 'Access paused.',
  restoredTitle: 'Access restored.',
  overriddenLine: 'The change and your reason are in the history.',
} as const;

/** The eyebrow over the name: "External institution". */
export function institutionEyebrow(kind: InstitutionKind): string {
  return `${kindWords(kind)} institution`;
}

/**
 * The head's line beside the status: "Institute Admin: Meera Iyer", "Institute Admin: not
 * assigned", "Institute Admin: assigned once access is active" (awaiting payment).
 */
export function saInstituteAdminLine(name: string | null, assignedLater: boolean): string {
  return `Institute Admin: ${name ?? (assignedLater ? 'assigned once access is active' : 'not assigned')}`;
}

/** The paused banner: "Access paused on 12 Oct 2026. Students can’t open experiments. …". */
export function pausedBannerWords(pausedOn: string): string {
  return `Access paused on ${pausedOn}. Students can’t open experiments. Everyone’s work is kept.`;
}

/** Who paused it, and when, under the reason: "Arjun Mehta, 12 Oct 2026, 09:40". */
export function pausedByWords(by: string, when: string): string {
  return by ? `${by}, ${when}` : when;
}

/** The plan band's kicker: "Access plan"; with several plans "Access plan 1 of 2". */
export function planKickerWords(index: number, count: number): string {
  return count > 1
    ? `${SA_INSTITUTION.planKicker} ${index + 1} of ${count}`
    : SA_INSTITUTION.planKicker;
}

/** The plan's name, by content: "1 experiment · 120 licences". */
export function planNameWords(experiments: number, licences: number): string {
  return `${plural(experiments, 'experiment')} · ${licences} licences`;
}

/** The line under it: "120 licences, as approved. How licences are counted is still open." */
export function planLicenceLine(licences: number): string {
  return `${licences} licences, as approved. How licences are counted is still open.`;
}

/** The term's label: "Yearly term" ("Until a fixed date" alone; state-copy SA-07.term-until). */
export function termLabelWords(term: AccessPlanTerm): string {
  return term === 'until-date' ? planTermWords(term) : `${planTermWords(term)} term`;
}

/** What is left of the term: "349 days left", "Paused · 263 days left", "Ended 8 days ago". */
export function termLeftWords(state: 'live' | 'paused' | 'ended', days: number): string {
  if (state === 'ended') return `Ended ${plural(days, 'day')} ago`;
  const left = `${plural(days, 'day')} left`;
  return state === 'paused' ? `Paused · ${left}` : left;
}

/** The term track's name: "Yearly term from 8 Oct 2026 to 7 Oct 2027. 349 days left." */
export function termDescription(label: string, start: string, end: string, left: string): string {
  return `${label} from ${start} to ${end}. ${left}.`;
}

/** The format strip's name: "In the plan: WEB, VR. Published: WEB, AR, VR." */
export function planFormatsLabel(inPlan: readonly string[], published: readonly string[]): string {
  return `In the plan: ${inPlan.join(', ')}. Published: ${published.join(', ')}.`;
}

/** The ending note's title: "Ends on 31 Oct 2026"; the ended note's: "This plan ended on …". */
export function endsOnWords(endsOn: string): string {
  return `Ends on ${endsOn}`;
}
export function planEndedWords(endsOn: string): string {
  return `This plan ended on ${endsOn}`;
}

/** The approved formats of an experiment awaiting payment, for assistive technology. */
export function approvedFormatsLabel(formats: readonly string[]): string {
  return `Formats approved: ${formats.join(', ')}`;
}

/**
 * People without a list of names (undrawn as such; state-copy SA-07.people-without-list):
 * "18 students and 1 Faculty."
 */
export function peopleCountsLine(studentCount: number, facultyCount: number): string {
  return `${students(studentCount)} and ${facultyCount} Faculty.`;
}

/** "Also waiting for this institution": "Additional licences request under review". */
export function waitingRequestWords(type: RequestType): string {
  return `${REQUEST_TYPE_WORDS[type]} request under review`;
}

/** "VR device transfer for Rahul Verma" (without a listed name: "VR device transfer"). */
export function waitingTransferWords(format: Technology, student: string | null): string {
  return `${formatCode(format)} device transfer${student ? ` for ${student}` : ''}`;
}

/** The flash after Assign: "N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering." */
export function assignedTitle(adminName: string, name: string): string {
  return `${adminName} is now the Institute Admin for ${name}.`;
}

/** The flash line after Pause: "Everyone at Konark Polytechnic now sees the paused banner. …". */
export function pausedFlashLine(name: string): string {
  return `Everyone at ${name} now sees the paused banner. Their work is kept.`;
}

/** The flash line after Restore: "Konark Polytechnic can work again." */
export function restoredFlashLine(name: string): string {
  return `${name} can work again.`;
}

/** The flash after a status change: "Sneha Reddy is now active." */
export function overriddenTitle(name: string, to: 'active' | 'inactive'): string {
  return `${name} is now ${to}.`;
}

// ---- History (SA-v1 `hist`): the institution record's own events, by content ----

/** "Request approved, payment required" (external) / "Request approved" (internal). */
export function saHistoryApproved(kind: InstitutionKind): string {
  return kind === 'external' ? 'Request approved, payment required' : 'Request approved';
}

export const SA_HISTORY = {
  activated: 'Institutional access activated',
  /** The note of an internal activation: "Internal, no payment step." */
  activatedInternal: 'Internal, no payment step.',
  licencesRequested: 'Request for additional licences received',
  renewalRequested: 'Renewal request received',
  ended: 'Access ended',
} as const;

/** "Institute Admin assigned: Meera Iyer". */
export function saHistoryAssigned(name: string): string {
  return `Institute Admin assigned: ${name}`;
}
