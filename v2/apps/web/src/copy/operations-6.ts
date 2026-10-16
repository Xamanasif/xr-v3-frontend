/**
 * The words of Phase 6's Operations screens — SA-20 Operations › Support, SA-21 Support report and
 * SA-22 Operations › Access ending (board B7-09 f4 … f14; B7-10 f12, f13; B7-12 f28 … f31) — and
 * of the access-ending row of SA-07's "Needs attention" (B7-03 `att`, konark). Every phrase is the
 * frozen boards' own, found verbatim in their markup or script (`operations-6.test.ts`); the
 * composed ones follow B7-09's script (`spView`) with the records' values — the boards' sample
 * reports, people, plans and dates are never copied. What the boards do not word is a provisional
 * entry of the state-copy register (`state-copy-operations-6.ts`, VD-12).
 *
 * P1-14 / VD-10 (the house rule since Package 1D): B7-09 writes two decision ids into its copy —
 * "No response-time target is set (ND-14)." and "… no reminder channel is set (T-31). …". The
 * product shows both sentences without the id (`STRIPPED_OPERATIONS`, state-copy
 * `SA-21.decision-ids`, `SA-22.decision-ids`); the frozen wording is kept beside them.
 */
import type { AccessEndingRow, InstitutionKind, Role, SupportState } from '@xr/domain';
import { ROLE_LABEL } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { kindWords } from './institutions';

/** A board sentence the product shows without its decision id (P1-14 / VD-10). */
export interface StrippedOperationsSentence {
  /** The words the product shows. */
  readonly words: string;
  /** The frozen board's wording, the id included (found verbatim on B7-09). */
  readonly drawn: string;
  readonly ids: readonly string[];
}

export const STRIPPED_OPERATIONS = {
  /** SA-21's panel foot (`p.xl-open`, B7-09 f8 … f14; B7-10 f12). */
  noResponseTarget: {
    words: 'No response-time target is set.',
    drawn: 'No response-time target is set (ND-14).',
    ids: ['ND-14'],
  },
  /** SA-22's note under the list (`p.xl-open`, B7-09 f4, f5, f6; B7-10 f13). */
  reminderStatusOnly: {
    words:
      '“Reminder due” is a status only — nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
    drawn:
      '“Reminder due” is a status only — nothing is sent from here, and no reminder channel is set (T-31). Renewals come in as requests.',
    ids: ['T-31'],
  },
} as const satisfies Readonly<Record<string, StrippedOperationsSentence>>;

// ---- the Operations page (B7-09 f4 … f7, f13) ----------------------------------------------

/**
 * `span.xl-meta` in `div.xr-phead-meta` under "Operations" on Support and Access ending (B7-09 f4,
 * f5, f6, f7, f13; B7-10 f13). Device transfers keeps its own frame's words (B7-09 f0 "… and
 * access ending", `OPERATIONS_PAGE.meta`; state-copy `SA-20.page-meta`).
 */
export const OPERATIONS_6_META = 'Device transfers, support reports and access that is ending';

// ---- SA-20 Operations › Support (B7-09 f7, f13) --------------------------------------------

/** The report states in words and the tone B7-09 draws each in (`stw`, `stk`). */
export const SUPPORT_STATUS: Readonly<
  Record<SupportState, { readonly words: string; readonly tone: StatusTone }>
> = {
  open: { words: 'Open', tone: 'info' },
  resolved: { words: 'Resolved', tone: 'ok' },
  reopened: { words: 'Reopened', tone: 'wait' },
};

export const SUPPORT_LIST = {
  sectionTitle: 'Support reports',
  sectionMeta: 'Sent from Help by any signed-in person · oldest open first',
  /** `div.xr-tabs[role=tablist][aria-label]`. */
  showLabel: 'Show',
  /** B7-09 `F`: Open (open and reopened) · Resolved · All. */
  shows: { open: 'Open', resolved: 'Resolved', all: 'All' },
  columns: {
    report: 'Report',
    from: 'From',
    status: 'Status',
    /** The action column's header is visually hidden (`span.xr-sr`). */
    action: 'Action',
  },
  /** `xr-btn--secondary.xr-btn--sm` on every row. */
  open: 'Open',
  /** B7-09 `noRowsText`, per view. */
  empty: {
    open: 'No open support reports',
    resolved: 'No resolved reports yet',
    all: 'No support reports',
  },
  emptyLine: 'Reports sent from Help appear here.',
} as const;

/** "Sent 3 Oct 2026" (B7-09 `'Sent ' + x.sent`): the row's meta after the reference, the header's. */
export function sentWords(day: string): string {
  return `Sent ${day}`;
}

/** The row's Open, named for screen readers: "Open SUP-0213 VR simulation …" (B7-09 `aria`). */
export function openReportLabel(reference: string, title: string): string {
  return `Open ${reference} ${title}`;
}

/**
 * "From": "Rahul Verma · Student · Godavari Institute of Technology", "Kavya Nair · Content
 * Manager" (B7-09 `who`) — the reporter's name, role and, when they belong to one, their
 * institution (state-copy `SA-20.from`).
 */
export function fromWords(name: string, role: Role, institution: string | null): string {
  return [name, ROLE_LABEL[role], ...(institution ? [institution] : [])].join(' · ');
}

// ---- SA-21 Support report (B7-09 f8 … f12, f14; B7-10 f12; B7-12 f28 … f31) ----------------

export const REPORT_PAGE = {
  /** `a.xr-back` to the list. */
  back: 'Support',
  /** "Support report · SUP-0213" (`span.xr-overline`; the reference in `span.xr-id`). */
  overline: 'Support report',
  reported: 'What they reported',
  keys: {
    from: 'From',
    whatHappened: 'What happened',
    where: 'Where',
    screenshot: 'Screenshot',
  },
  /** B7-09 `shot` when none was named — a file name only; nothing is uploaded. */
  noScreenshot: 'No screenshot added',
  history: 'History',
  historyMeta: 'Newest first',
  /** `h2.xr-dpanel-title`. */
  panelTitle: 'Resolve',
  noteLabel: 'Note to the reporter',
  noteHint: 'They see it with the report. Say what changed and what to try.',
  resolve: 'Resolve',
  resolving: 'Resolving…',
  /** The decided panel (`rDone`). */
  resolved: 'Resolved',
  reporterSees: 'The reporter sees this note.',
  reopen: 'Reopen',
  reopening: 'Reopening…',
  cancel: 'Cancel',
  /** `div.xr-notice--warn` on a reopened report (`hasPrev`). */
  reopenedByReporter: 'Reopened by the reporter',
} as const;

/** B7-09 `a.xr-btn--text`: "Open Godavari Institute of Technology". */
export function openInstitutionWords(institution: string): string {
  return `Open ${institution}`;
}

/** A note as B7-09 quotes it (`'“' + r.note + '”'`). */
export function quoted(note: string): string {
  return `“${note}”`;
}

/** B7-09 `rResolved`: "Resolved on 23 Sep 2026 by Arjun Mehta". */
export function resolvedOnWords(day: string, by: string): string {
  return `Resolved on ${day} by ${by}`;
}

/**
 * The reopened notice's title when someone other than the reporter reopened it: "Reopened by
 * Arjun Mehta" — B7-09's "Reopened by the reporter" with the name its history writes (`'By ' +
 * D.sa`; state-copy `SA-21.reopened-by`).
 */
export function reopenedByTitle(name: string): string {
  return `Reopened by ${name}`;
}

/** B7-09 f10 notice body: "Earlier note: “The import now finishes. …”". */
export function earlierNoteWords(note: string): string {
  return `Earlier note: ${quoted(note)}`;
}

/** B7-09 `resolve` flash: "SUP-0213 resolved. The reporter sees your note." */
export function resolvedFlash(reference: string): string {
  return `${reference} resolved. The reporter sees your note.`;
}

/** B7-09 `doReopen` flash: "SUP-0189 is open again. The reporter sees it is reopened." */
export function reopenedFlash(reference: string): string {
  return `${reference} is open again. The reporter sees it is reopened.`;
}

/** DL-1 (B7-09 f12): "Reopen SUP-0189?" and what it does. */
export function reopenTitle(reference: string): string {
  return `Reopen ${reference}?`;
}

export const REOPEN_EFFECT =
  'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.';

/** The history's lines (B7-09 `hist`): what, and who reopened it. */
export const REPORT_HISTORY = {
  sent: 'Sent',
  resolved: 'Resolved',
  reopened: 'Reopened',
  byReporter: 'By the reporter.',
} as const;

/** B7-09 `doReopen`: "By Arjun Mehta." — a reopening by someone other than the reporter. */
export function reopenedByWords(name: string): string {
  return `By ${name}.`;
}

// ---- SA-22 Operations › Access ending (B7-09 f4, f5, f6; B7-10 f13) ------------------------

export const ACCESS_ENDING = {
  sectionTitle: 'Ending within 15 days, or ended',
  columns: {
    institution: 'Institution',
    ends: 'Access ends',
    status: 'Status',
    /** The actions column's header is visually hidden (`span.xr-sr`). */
    actions: 'Actions',
  },
  /** The standing's chip (`xr-status--info`, `--wait`, `--off`): every standing the service answers. */
  standing: {
    'renewal-in-progress': 'Renewal in progress',
    'reminder-due': 'Reminder due',
    'ended-no-renewal': 'Access ended',
  } satisfies Readonly<Record<AccessEndingRow['standing']['kind'], string>>,
  /** The line under "Reminder due" and under "Access ended". */
  nothingSent: 'Nothing is sent from here',
  noRenewal: 'No renewal requested',
  openRequest: 'Open request',
  openInstitution: 'Open institution',
  emptyTitle: 'No access is ending in the next 15 days',
  emptyLine: 'Institutions whose access ends within 15 days, or has just ended, appear here.',
} as const;

/** The standing's tone (B7-09 f4: info, wait, off). */
export const STANDING_TONE: Readonly<Record<AccessEndingRow['standing']['kind'], StatusTone>> = {
  'renewal-in-progress': 'info',
  'reminder-due': 'wait',
  'ended-no-renewal': 'off',
};

/** "As of 23 Oct 2026 · soonest first" (the section head's meta). */
export function asOfWords(day: string): string {
  return `As of ${day} · soonest first`;
}

/** "ACC-0098 · Internal" under the institution. */
export function planLine(planId: string, kind: InstitutionKind): string {
  return `${planId} · ${kindWords(kind)}`;
}

/** "8 days left"; one day: "1 day left" (state-copy `SA-22.days`). */
export function daysLeftWords(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/** "Ended 8 days ago"; one day: "Ended 1 day ago" (state-copy `SA-22.days`). */
export function endedAgoWords(days: number): string {
  return `Ended ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** "REQ-0038 under review": the renewal request and its status in lower case. */
export function renewalLine(reference: string, statusWords: string | null): string {
  return statusWords ? `${reference} ${statusWords.toLowerCase()}` : reference;
}

/** The actions' names: "Open request REQ-0038", "Open Konark Polytechnic" (B7-09 f4 `aria-label`). */
export function openRequestLabel(reference: string): string {
  return `${ACCESS_ENDING.openRequest} ${reference}`;
}

export function openInstitutionLabel(institution: string): string {
  return `Open ${institution}`;
}

// ---- SA-07 "Needs attention" — access ending (B7-03 `att`, konark) --------------------------

/** "Access ends 2 Nov 2026 — reminder due (nothing is sent from here)". */
export function attentionReminderDue(day: string): string {
  return `Access ends ${day} — reminder due (nothing is sent from here)`;
}

/** The row's action: Operations › Access ending (B7-03 `["…", "Operations › Access ending", "sops"]`). */
export const ATTENTION_ACCESS_ENDING = 'Operations › Access ending';
