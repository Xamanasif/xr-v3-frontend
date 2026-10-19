/**
 * The words of Phase 6's Operations screens — SA-20 Operations › Support, SA-21 Support report and
 * SA-22 Operations › Access ending — in the owner-approved V3 Refined B design: the Super Admin
 * export (design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `V.support`, `V.report`,
 * `SA.DLG.reopen`, `V.accessEnding`); and of the access-ending row of SA-07's "Needs attention"
 * (B7-03 `att`, konark). Every fixed phrase is the export's own, found verbatim in its views
 * (`operations-6.test.ts`); the composed ones follow the views' expressions with the records'
 * values — the export's sample reports, people, plans and dates are never copied. The report
 * statuses are the reporter's own words (`flow-state-words.ts` `supportWords`: "the same status
 * words as the reporter side"). Internal references (SUP-, REQ-, ACC-…) never appear in the Super
 * Admin's words. What the export does not word is an entry of the state-copy register
 * (`state-copy-operations-6.ts`, VD-12).
 */
import type { AccessEndingRow, Role, SupportState } from '@xr/domain';
import { ROLE_LABEL } from '@xr/domain';

import { supportWords, wordsOf } from './flow-state-words';

/** The status tones the Super Admin's operations screens draw (the V3 kit's `Status` tones). */
export type OperationsTone = 'info' | 'ok' | 'warn' | 'ended';

// ---- SA-20 Operations › Support (`V.support`) ----------------------------------------------

/** The report statuses (the reporter's words) and the tone the export draws each in (`SUP`). */
export const SUPPORT_STATUS: Readonly<
  Record<SupportState, { readonly words: string; readonly tone: OperationsTone }>
> = {
  open: { words: wordsOf(supportWords('open')) ?? '', tone: 'info' },
  resolved: { words: wordsOf(supportWords('resolved')) ?? '', tone: 'ok' },
  reopened: { words: wordsOf(supportWords('reopened')) ?? '', tone: 'warn' },
};

export const SUPPORT_LIST = {
  /** `section.rk-surface[aria-label]`. */
  label: 'Support reports',
  /** `div.rb-switch[role=group][aria-label]` (the `sa-seg` view switch). */
  switchLabel: 'Show support reports',
  /** Open holds open and reopened reports. */
  shows: { open: 'Open', resolved: 'Resolved', all: 'All' },
  /** `p.rk-hint` beside the switch. */
  hint: 'Sent from Help by anyone signed in · oldest first',
  caption: 'Support reports, oldest first',
  columns: {
    report: 'Report',
    from: 'From',
    where: 'Where',
    activity: 'Last activity',
    status: 'Status',
  },
  /** The empty view's title, per view. */
  empty: {
    open: 'Nothing is open',
    resolved: 'No resolved reports yet',
    all: 'No support reports yet',
  },
  emptyLine: 'Reports sent from Help appear here.',
  /** `p.rk-ca-foot` under the list. */
  foot: 'The reporter reads your resolution note. No response-time target is set.',
} as const;

/** "Sent 3 Oct 2026" (under a report's title; the report's head). */
export function sentWords(day: string): string {
  return `Sent ${day}`;
}

/** The row link's name: "<title>, Open. Open the report". */
export function reportRowLabel(title: string, status: string): string {
  return `${title}, ${status}. Open the report`;
}

/** The reporter's role, and their institution when they belong to one: "Student · Godavari …". */
export function reporterLine(role: Role, institution: string | null): string {
  return [ROLE_LABEL[role], ...(institution ? [institution] : [])].join(' · ');
}

/** "Last activity": "Sent 30 Sep", "Resolved 3 Oct", "Reopened 6 Oct". */
export function lastActivityWords(event: 'sent' | 'resolved' | 'reopened', day: string): string {
  return `${REPORT_HISTORY[event]} ${day}`;
}

// ---- SA-21 Support report (`V.report`, `SA.DLG.reopen`) ------------------------------------

export const REPORT_PAGE = {
  /** `p.rk-eyebrow` above the title. */
  eyebrow: 'Support report',
  /** `a.rb-btn.rk-goto` (under 860 px, to the panel). */
  goTo: 'Go to decision',
  reported: 'What they reported',
  keys: {
    from: 'From',
    whatHappened: 'What happened',
    where: 'Where',
    screenshot: 'Screenshot',
  },
  /** A report sent without a screenshot; a screenshot is its file name only. */
  noScreenshot: 'No screenshot added',
  history: 'History',
  historyNote: 'Newest first',
  /** The panel's heading: open or reopened, then resolved. */
  panelTitle: { open: 'Resolve', resolved: 'Resolved' },
  noteLabel: 'Resolution note (required)',
  noteHint: 'The reporter sees this note on their report in Help & support.',
  resolve: 'Resolve report',
  resolving: 'Resolving…',
  /** `p.rk-hint` under Resolve. */
  noTarget: 'No response-time target is set.',
  /** Under the note in the decided panel (`p.rk-quote-by`). */
  noteShown: 'Note shown to the reporter',
  reopen: 'Reopen',
  reopening: 'Reopening…',
  cancel: 'Cancel',
  /** Under Reopen (`p.rk-hint`), and the confirmation's line. */
  reopenEffect:
    'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
  reopenTitle: 'Reopen this report?',
  /** The notice on a reopened report, when the reporter reopened it. */
  reopenedByReporter: 'Reopened by the reporter',
  /** The flashes. */
  resolvedFlash: 'Report resolved.',
  reopenedFlash: 'Report reopened.',
  reopenedFlashLine: 'It is back with the open reports.',
  /** The refusal notice's action: closes it and moves focus to the page's heading. */
  checkAgain: 'Check it again',
} as const;

/** The head's reporter: "Meera Iyer, Institute Admin". */
export function reporterWords(name: string, role: Role): string {
  return `${name}, ${ROLE_LABEL[role]}`;
}

/** "From": "Meera Iyer · Institute Admin · Godavari Institute of Technology". */
export function fromWords(name: string, role: Role, institution: string | null): string {
  return [name, reporterLine(role, institution)].join(' · ');
}

/** "Open Godavari Institute of Technology" — the reporter's institution, under the facts. */
export function openInstitutionWords(institution: string): string {
  return `Open ${institution}`;
}

/** A note as the export quotes it: “…”. */
export function quoted(note: string): string {
  return `“${note}”`;
}

/** The decided panel: "Resolved on 23 Sep 2026". */
export function resolvedOnWords(day: string): string {
  return `Resolved on ${day}`;
}

/**
 * The reopened notice's title when someone other than the reporter reopened it: "Reopened by
 * Arjun Mehta" (state-copy `SA-21.reopened-by`).
 */
export function reopenedByTitle(name: string): string {
  return `Reopened by ${name}`;
}

/** The reopened notice's line: "Your earlier note: “The import now finishes. …”". */
export function earlierNoteWords(note: string): string {
  return `Your earlier note: ${quoted(note)}`;
}

/** The resolved flash's line: "Meera Iyer sees your note on their report." */
export function resolvedFlashLine(name: string): string {
  return `${name} sees your note on their report.`;
}

/** The history's lines: what happened, and who reopened it. */
export const REPORT_HISTORY = {
  sent: 'Sent',
  resolved: 'Resolved',
  reopened: 'Reopened',
  byReporter: 'By the reporter.',
} as const;

/** "By Arjun Mehta." — a reopening by someone other than the reporter. */
export function reopenedByWords(name: string): string {
  return `By ${name}.`;
}

// ---- SA-22 Operations › Access ending (`V.accessEnding`) ----------------------------------

export const ACCESS_ENDING = {
  /** `section.rk-surface[aria-label]`. */
  label: 'Access ending within 15 days, or recently ended',
  sectionTitle: 'Ending within 15 days, or recently ended',
  /** The table's caption (assistive technology only). */
  caption: 'Access ending within 15 days, or recently ended, soonest first',
  columns: {
    institution: 'Institution',
    ends: 'Access ends',
    status: 'Status',
    actions: 'Actions',
  },
  /** The standing's status: every standing the service answers. */
  standing: {
    'renewal-in-progress': 'Renewal in progress',
    'reminder-due': 'Reminder due',
    'ended-no-renewal': 'Access ended',
  } satisfies Readonly<Record<AccessEndingRow['standing']['kind'], string>>,
  /** The line under "Reminder due" — a status, not a message. */
  nothingSent: 'Nothing is sent from here',
  /** The line under "Access ended". */
  noRenewal: 'No renewal requested',
  openRequest: 'Open request',
  openInstitution: 'Open institution',
  emptyTitle: 'No access is ending in the next 15 days',
  emptyLine: 'Institutions whose access ends within 15 days, or has just ended, appear here.',
  /** `p.rk-ca-foot` under the list. */
  foot: '“Reminder due” is a status only. Nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
} as const;

/** The standing's tone: info, warn (the half disc), ended (the grey dash). */
export const STANDING_TONE: Readonly<Record<AccessEndingRow['standing']['kind'], OperationsTone>> =
  {
    'renewal-in-progress': 'info',
    'reminder-due': 'warn',
    'ended-no-renewal': 'ended',
  };

/** "As of 23 Oct 2026 · soonest first" (beside the section's heading). */
export function asOfWords(day: string): string {
  return `As of ${day} · soonest first`;
}

/** "8 days left"; one day: "1 day left" (state-copy `SA-22.days`). */
export function daysLeftWords(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/** "Ended 8 days ago"; one day: "Ended 1 day ago" (state-copy `SA-22.days`). */
export function endedAgoWords(days: number): string {
  return `Ended ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** The line under "Renewal in progress": "Request under review" (the request's own status). */
export function renewalLine(statusWords: string): string {
  return `Request ${statusWords.toLowerCase()}`;
}

/** "Open request", named: "Open the renewal request from BITS Pilani — Hyderabad Campus". */
export function openRequestLabel(institution: string): string {
  return `Open the renewal request from ${institution}`;
}

/** "Open institution", named: "Open Konark Polytechnic". */
export function openInstitutionLabel(institution: string): string {
  return `Open ${institution}`;
}

// ---- SA-07 "Needs attention" — access ending (B7-03 `att`, konark) — SA-07's words, unchanged

/** "Access ends 2 Nov 2026 — reminder due (nothing is sent from here)". */
export function attentionReminderDue(day: string): string {
  return `Access ends ${day} — reminder due (nothing is sent from here)`;
}

/** The row's action: Operations › Access ending (B7-03 `["…", "Operations › Access ending", "sops"]`). */
export const ATTENTION_ACCESS_ENDING = 'Operations › Access ending';
