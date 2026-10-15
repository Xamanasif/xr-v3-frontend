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

export type InstitutionTabId = (typeof INSTITUTION_TAB_WORDS)[number][0];

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
