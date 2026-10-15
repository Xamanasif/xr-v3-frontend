/**
 * The words of the Super Admin's Operations › Device transfers (SA-18) and Device transfer
 * decision (SA-19) — boards B3-11 (f0 … f7) and B7-09 (f0 … f3, the same design re-used), B7-10
 * f14 (a transfer that has not reached BITS) — and of the device-transfer row of SA-07's "Needs
 * attention" (B7-03 `att`). Every phrase is the frozen boards' own, found verbatim in their markup
 * or script (`operations.test.ts`); the composed ones follow B3-11's script (`dcView`). The state
 * words ("Forwarded", "Still with the institution", "Approved") and "Approve transfer" are the
 * shared flow words (`flow-state-words.ts`). The boards' sample transfers, people, devices and
 * dates are never copied: they come from the DTR record. What the boards do not word is a
 * provisional entry of the state-copy register (`state-copy-operations.ts`, VD-12).
 */
import type { Technology } from '@xr/domain';

import { formatName } from './flow-state-words';

// ---- SA-18 Operations › Device transfers (B3-11 f0, f2, f3) ----

export const OPERATIONS_PAGE = {
  /** `h1.xr-h1` (the destination). */
  title: 'Operations',
  /** `div.xr-phead-meta` under the title. */
  meta: 'Device transfers, support reports and access ending',
  /** `nav.xr-tabs[aria-label]` and its one built tab (Support and Access ending are Phase 6). */
  tabsLabel: 'Operations',
  deviceTransfersTab: 'Device transfers',
} as const;

export const TRANSFERS_LIST = {
  /** `div.xr-seg.xl-seg[role=group][aria-label]`. */
  showLabel: 'Show',
  show: {
    forwarded: 'Forwarded to BITS',
    'with-institution': 'Still with an institution',
    approved: 'Approved',
  },
  /** `caption.xr-sr`. */
  caption: 'Device transfers',
  columns: {
    request: 'Request',
    institution: 'Institution',
    forwarded: 'Forwarded',
    status: 'Status',
    /** The action column's header is visually hidden (`span.xr-sr`). */
    action: 'Action',
  },
  /** B3-11 `fwdText` before the Institute Admin forwards it (f2). */
  notYet: 'Not yet',
  /** `a.xr-btn--secondary.xr-btn--sm` on a forwarded row (f0). */
  review: 'Review',
} as const;

/** B3-11 f0: the Review link's name, "Review DTR-0018". */
export function reviewLabel(reference: string): string {
  return `Review ${reference}`;
}

/** B3-11 f0 `span.xr-sub` under the reference: "Rahul Verma · VR". */
export function transferSubLine(student: string, format: Technology): string {
  return `${student} · ${formatName(format)}`;
}

/** B3-11 `fwdText`: "23 Oct 2026, 10:00 · Meera Iyer" (`D.t.fwd + ' · ' + D.ia`). */
export function forwardedCell(when: string, by: string): string {
  return `${when} · ${by}`;
}

// ---- SA-19 Device transfer decision (B3-11 f1, f4, f5; B7-10 f14) ----

export const DECISION_PAGE = {
  /** `a.xr-back` to the list. */
  back: 'Device transfers',
  /** "Device transfer · DTR-0018" (the reference in `span.xr-id`, composed by the screen). */
  overline: 'Device transfer',
  transfer: 'The transfer',
  history: 'History',
  /** `h2.xr-dpanel-title`. */
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
  /** B3-11 `note: s.note.trim() || 'No note'`. */
  noNote: 'No note',
  /** The DL-1 confirm while busy (B3-11 `approving`). */
  approving: 'Approving…',
  cancel: 'Cancel',
} as const;

/** B3-11 f1 `h1`: "VR device transfer for Rahul Verma". */
export function decisionTitle(format: Technology, student: string): string {
  return `${formatName(format)} device transfer for ${student}`;
}

/** B3-11 f1 "Format": the chip, then " for Shell-and-Tube Heat Exchanger". */
export function formatForWords(experiment: string): string {
  return ` for ${experiment}`;
}

/** B3-11 f1 "Forwarded by": "Meera Iyer, Institute Admin". */
export function forwardedByWords(name: string, role: string): string {
  return `${name}, ${role}`;
}

/** B3-11 f1 decision panel: "Approving moves Rahul Verma’s VR authorisation to the new device." */
export function approvingMovesWords(student: string, format: Technology): string {
  return `Approving moves ${student}’s ${formatName(format)} authorisation to the new device.`;
}

/** B3-11 f5 decision panel: "Approved on 24 Oct 2026, 12:30 by Arjun Mehta." */
export function approvedOnWords(when: string, by: string): string {
  return `Approved on ${when} by ${by}.`;
}

/** B3-11 f4 DL-1 title: "Approve DTR-0018?". */
export function confirmTitle(reference: string): string {
  return `Approve ${reference}?`;
}

/**
 * B3-11 f4 DL-1 body, around the new device in `strong`: "Rahul Verma’s authorised device for VR
 * becomes <strong>…</strong>. The student and Meera Iyer see “Approved”." — what changes; nothing
 * is shipped.
 */
export function confirmEffectParts(
  student: string,
  format: Technology,
  instituteAdmin: string,
): { readonly before: string; readonly after: string } {
  return {
    before: `${student}’s authorised device for ${formatName(format)} becomes `,
    after: `. The student and ${instituteAdmin} see “Approved”.`,
  };
}

/** B3-11 `flashAppr`: "Approved. Rahul Verma and Meera Iyer now see “Approved”." */
export function approvedFlash(student: string, instituteAdmin: string): string {
  return `Approved. ${student} and ${instituteAdmin} now see “Approved”.`;
}

/** B3-11 `hist` (newest first): the transfer record's own three events. */
export const HISTORY_WORDS = {
  approved: 'Approved by BITS',
  approvedNote: (device: string) => `The authorised device is now: ${device}`,
  forwarded: (instituteAdmin: string) => `Forwarded to BITS by ${instituteAdmin}`,
  requested: (student: string) => `Requested by ${student}`,
  requestedNote: (from: string, to: string) => `From ${from} to ${to}`,
} as const;

/** B3-11 `beforeSA` and B7-10 f14: a transfer still with its institution — nothing to approve. */
export const NOT_YET_WITH_BITS = {
  back: 'Operations',
  title: 'Device transfers',
  heading: (reference: string) => `${reference} hasn’t reached BITS yet`,
  line: 'It is still with the institution. It appears here when the Institute Admin forwards it.',
} as const;

// ---- SA-07 "Needs attention" (B7-03 `att`, godavari) ----

/** "DTR-0018 — device transfer forwarded on 23 Oct 2026". */
export function attentionTransfer(reference: string, forwardedOn: string): string {
  return `${reference} — device transfer forwarded on ${forwardedOn}`;
}

/** The row's action: the Operations destination (B7-03 `["…", "Operations", "sops"]`). */
export const ATTENTION_OPERATIONS = 'Operations';
