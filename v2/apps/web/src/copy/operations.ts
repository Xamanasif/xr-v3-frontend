/**
 * The words of the Super Admin's Operations page (its head and tabs, shared by SA-18, SA-20 and
 * SA-22), of Operations › Device transfers (SA-18) and of the Device transfer decision (SA-19) in
 * the owner-approved V3 Refined B design — the Super Admin export
 * (design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `opsHead`, `V.transfers`,
 * `V.transfer`, `SA.DLG.approveDtr`) — and of the device-transfer row of SA-07's "Needs
 * attention" (B7-03 `att`). Every fixed phrase is the export's own, found verbatim in its views
 * (`operations.test.ts`); the composed ones follow the views' expressions with the DTR record's
 * values. The state words ("Forwarded", "Still with the institution", "Approved") and "Approve
 * transfer" are the shared flow words (`flow-state-words.ts`). The export's sample transfers,
 * people, devices and dates are never copied. Internal references (DTR-…) never appear in the
 * Super Admin's words (the export's HANDOFF). What the export does not word is an entry of the
 * state-copy register (`state-copy-operations.ts`, VD-12).
 */
import type { Technology } from '@xr/domain';

import { formatName } from './flow-state-words';

// ---- The Operations page: head and tabs (SA-18, SA-20, SA-22; `opsHead`) ----

export const OPERATIONS_PAGE = {
  /** `h1.rb-h1` (the destination). */
  title: 'Operations',
  /** `p.rk-sub` under the title on the three lists. */
  lead: 'Device transfers, support reports and access that is ending.',
  /** `nav.rk-tabs.sa-tabs[aria-label]`. */
  tabsLabel: 'Operations',
  /** The three tabs, in the export's order (links; `nav/operations.ts` OPERATIONS_TABS). */
  tabs: {
    'device-transfers': 'Device transfers',
    support: 'Support',
    'access-ending': 'Access ending',
  },
} as const;

// ---- SA-18 Operations › Device transfers (`V.transfers`) ----

export const TRANSFERS_LIST = {
  /** `section.rk-surface[aria-label]`, and the start of the table's caption. */
  label: 'Device transfers',
  /** `div.rb-switch[role=group][aria-label]` (the `sa-seg` view switch). */
  switchLabel: 'Show device transfers',
  show: {
    forwarded: 'Forwarded to BITS',
    'with-institution': 'Still with an institution',
    approved: 'Approved',
  },
  columns: {
    student: 'Student and format',
    institution: 'Institution',
    forwardedBy: 'Forwarded by',
    forwarded: 'Forwarded',
    status: 'Status',
  },
  /** "Forwarded by" before the Institute Admin forwards it. */
  notForwardedYet: 'Not forwarded yet',
  /** "Forwarded" before the Institute Admin forwards it. */
  notYet: 'Not yet',
  /** `p.rk-ca-foot` under the list. */
  foot: 'Approving moves a student’s authorisation to a new device. It doesn’t send, collect or register a device. A transfer BITS doesn’t approve stays Forwarded.',
} as const;

/** The table's caption: "Device transfers, Forwarded to BITS". */
export function transfersCaption(view: string): string {
  return `${TRANSFERS_LIST.label}, ${view}`;
}

/** The line under the Student's name: "VR device transfer". */
export function transferKindWords(format: Technology): string {
  return `${formatName(format)} device transfer`;
}

/** The record's name (SA-19's H1, the row link's words): "VR device transfer for Rahul Verma". */
export function decisionTitle(format: Technology, student: string): string {
  return `${formatName(format)} device transfer for ${student}`;
}

/** The row link's name: "VR device transfer for Rahul Verma, Forwarded. Open". */
export function transferRowLabel(format: Technology, student: string, status: string): string {
  return `${decisionTitle(format, student)}, ${status}. Open`;
}

/** "Forwarded by": "Meera Iyer, Institute Admin". */
export function forwardedByWords(name: string, role: string): string {
  return `${name}, ${role}`;
}

// ---- SA-19 Device transfer decision (`V.transfer`, `SA.DLG.approveDtr`) ----

export const DECISION_PAGE = {
  /** `p.rk-eyebrow` above the title. */
  eyebrow: 'Device transfer',
  /** `a.rb-btn.rk-goto` (under 860 px, to the decision panel). */
  goTo: 'Go to decision',
  transfer: 'The transfer',
  history: 'History',
  /** Beside the History heading. */
  historyNote: 'Newest first',
  /** `h2` of the navy panel head. */
  panelTitle: 'Your decision',
  keys: {
    student: 'Student',
    institution: 'Institution',
    format: 'Format',
    from: 'Moving from',
    to: 'New device',
    note: 'Student’s note',
    forwardedBy: 'Forwarded by',
  },
  /** `p.rk-hint` under the panel's line while the transfer is forwarded. */
  noDecline:
    'Nothing is sent, collected or registered from here. A transfer BITS doesn’t approve stays Forwarded.',
  /** The confirmation's line under its title. */
  confirmLine: 'Approving is not a refusal, so no reason is asked.',
  confirmNow: 'What happens now',
  confirmLater: 'Only after later events, or not from here',
  /** The confirmation's "Only after later events" item. */
  notShipped: 'Nothing is sent, collected or registered from here.',
  /** The confirm button while busy. */
  approving: 'Approving…',
  cancel: 'Cancel',
  /** The flash's title once the approval is recorded. */
  approvedFlash: 'Approved.',
  /** The decided panel's way back (`a.rb-btn`). */
  back: 'Back to device transfers',
  /** The refusal notice's action: closes it and moves focus to the page's heading. */
  checkAgain: 'Check it again',
  /** The panel's notice while the transfer is still with its institution. */
  notYet: {
    title: 'Not BITS’s to decide yet',
    line: 'It is still with the institution. It appears in Forwarded when the Institute Admin forwards it.',
  },
} as const;

/** "Student": "Rahul Verma · GIT-2026-0418" (the institution's own student number). */
export function studentWords(student: string, studentNumber: string | null): string {
  return studentNumber ? `${student} · ${studentNumber}` : student;
}

/** "Format": "VR for Shell-and-Tube Heat Exchanger", or the format alone. */
export function formatValue(format: Technology, experiment: string | null): string {
  return experiment ? `${formatName(format)} for ${experiment}` : formatName(format);
}

/** A note in someone's words, as the export quotes it: “…”. */
export function quotedNote(note: string): string {
  return `“${note}”`;
}

/** The panel's line: "Approving moves Rahul Verma’s VR authorisation to the new device." */
export function approvingMovesWords(student: string, format: Technology): string {
  return `Approving moves ${student}’s ${formatName(format)} authorisation to the new device.`;
}

/** The confirmation's title: "Approve the VR device transfer for Rahul Verma?". */
export function confirmTitle(format: Technology, student: string): string {
  return `Approve the ${decisionTitle(format, student)}?`;
}

/**
 * The confirmation's "What happens now": "Rahul Verma’s VR authorisation moves from <device> to
 * <device>.", then "Rahul Verma and the Institute Admin see “Approved”."
 */
export function confirmNowItems(
  student: string,
  format: Technology,
  from: string,
  to: string,
): readonly string[] {
  return [
    `${student}’s ${formatName(format)} authorisation moves from ${from} to ${to}.`,
    `${student} and the Institute Admin see “Approved”.`,
  ];
}

/** The flash's line: "Rahul Verma and the Institute Admin now see “Approved”." */
export function approvedFlashLine(student: string): string {
  return `${student} and the Institute Admin now see “Approved”.`;
}

/** The decided panel: "Approved on 24 Oct 2026, 12:30 by Arjun Mehta". */
export function approvedOnWords(when: string, by: string): string {
  return `Approved on ${when} by ${by}`;
}

/** The decided panel's line: "Rahul Verma and the Institute Admin see “Approved”. This …". */
export function approvedNextWords(student: string): string {
  return `${student} and the Institute Admin see “Approved”. This decision is read-only.`;
}

/** The record's history, newest first: what happened and who did it. */
export const HISTORY_WORDS = {
  approved: (by: string) => `Approved by ${by}`,
  approvedNote: (format: Technology) =>
    `The ${formatName(format)} authorisation moved to the new device.`,
  forwarded: 'Forwarded to BITS',
  requested: 'Transfer requested',
  /** "By Meera Iyer, Institute Admin." — or the name alone when the record names no role. */
  by: (name: string, role: string | null) => (role ? `By ${name}, ${role}.` : `By ${name}.`),
} as const;

// ---- SA-07 "Needs attention" (B7-03 `att`, godavari) — SA-07's words, unchanged ----

/** "DTR-0018 — device transfer forwarded on 23 Oct 2026". */
export function attentionTransfer(reference: string, forwardedOn: string): string {
  return `${reference} — device transfer forwarded on ${forwardedOn}`;
}

/** The row's action: the Operations destination (B7-03 `["…", "Operations", "sops"]`). */
export const ATTENTION_OPERATIONS = 'Operations';
