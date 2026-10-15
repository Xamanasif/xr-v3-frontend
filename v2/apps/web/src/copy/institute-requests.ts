/**
 * The words of the Institute Admin's Requests destination — IA-17 Requests to BITS and its request
 * detail (B3-08), IA-18 Device requests and IA-19 Device request — review & forward (B3-09) — and
 * of the Phase-2 actions they enable on IA-01, IA-02, IA-03 and IA-05 (B2-01, B2-02, B2-03, B2-05).
 * Written from the canonical facts the ports answer (`requestRow`, `requesterRequestView`,
 * `deviceTransfer`): read models carry no words. Each entry names the board that draws it; the
 * status words come from the role-relative table (`flow-state-words.ts` `requestWords`,
 * `transferWords`); what no board words is a provisional entry of the state-copy register
 * (`state-copy-institute-requests.ts`), never an invented rule. Licences are a number as asked —
 * nothing here counts them (D7).
 */
import { messageFor, summaryTitleFor } from '@xr/contracts/draft';
import type { AccessPlanTerm, RequestedTerm, RequestType, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';

import { calendarDay, dateTime, dayMonthYear } from './dates';
import { formatName, TRANSFER_ACTIONS } from './flow-state-words';
import { stateWords } from './state-copy';

// ---- the Phase-2 actions IA-17 / IA-18 enable (B2-01, B2-02, B2-03, B2-05) ----

export const REQUEST_ACTIONS = {
  requestRenewal: 'Request renewal', // B2-01 f3, f4, f7; B2-02 f3, f4; B2-03 f3; B2-05 f16
  viewRequestStatus: 'View request status', // B2-01 f1
  openRequests: 'Open requests', // B2-01 f7 (the device-request row)
  needMore: 'Need more, or a renewal?', // B2-03 f0 … f5
  askFromRequests: 'Ask BITS from Requests', // B2-03 f0 … f5
} as const;

/** IA-01's device-request row title (B2-01 f7 "1 device request to forward to BITS"). */
export function deviceRowTitle(count: number): string {
  return count === 1
    ? '1 device request to forward to BITS'
    : `${count} device requests to forward to BITS`;
}

/** IA-01's device-request row line (B2-01 f7 "From Imran Shaikh · 18 Sep 2027"): the newest. */
export function deviceRowLine(student: string, requestedAt: string): string {
  return `From ${student} · ${dayMonthYear(requestedAt)}`;
}

// ---- IA-17 Requests to BITS (B3-08 f0, f3, f7) ----

export const REQUESTS_PAGE = {
  title: 'Requests',
  meta: 'What you’ve asked BITS for, and device requests from your students',
  ask: 'Ask BITS for a renewal or more licences',
  tabsLabel: 'Requests',
  tabs: { bits: 'Requests to BITS', devices: 'Device requests' },
  caption: 'Requests to BITS',
  columns: {
    request: 'Request',
    what: 'What you asked for',
    status: 'Status',
    lastChange: 'Last change',
  },
} as const;

/** The row's kind under its reference (B3-08 RQ "New access", "More licences"). */
export function requestKindWords(type: RequestType): string {
  switch (type) {
    case 'new-access':
      return 'New access';
    case 'additional-licences':
      return 'More licences';
    case 'renewal':
      return stateWords('IA-17.kind-renewal');
  }
}

/** Formats in words as B3-08 writes them: "WEB and VR" (display order WEB · AR · VR · MR). */
export function formatWords(formats: readonly Technology[]): string {
  const names = inDisplayOrder(formats).map(formatName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

/** A requested term in words (B3-08 RQ "Yearly"; B1-11 "Monthly", "Quarterly"). */
export function askedTermWords(term: RequestedTerm): string {
  switch (term.kind) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    case 'until-date':
      return `Until ${calendarDay(term.endsOn)}`;
    case 'current-plan':
      return 'Current term';
  }
}

/** "60 more licences" (B3-08 f4 title; RQ "60 more licences · …"). */
export function moreLicencesWords(licences: number): string {
  return `${licences} more licences`;
}

/** "Renewal of ACC-0107" (B3-08 script `sentWhat`). */
export function renewalOfWords(planId: string): string {
  return `Renewal of ${planId}`;
}

/**
 * "What you asked for" in the list (B3-08 RQ): more licences "60 more licences · Shell-and-Tube
 * Heat Exchanger"; new access "Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences ·
 * Yearly". A renewal reads "Renewal of ACC-0107" when its plan is known (state-copy
 * `IA-17.renewal-words`), else as new access does.
 */
export function requestWhatWords(request: {
  readonly type: RequestType;
  readonly experiments: readonly string[];
  readonly formats: readonly Technology[];
  readonly licences: number;
  readonly term: RequestedTerm;
  readonly renewalOf: string | null;
}): string {
  const experiments = request.experiments.join(', ');
  if (request.type === 'additional-licences') {
    return `${moreLicencesWords(request.licences)} · ${experiments}`;
  }
  if (request.type === 'renewal' && request.renewalOf !== null) {
    return renewalOfWords(request.renewalOf);
  }
  return `${experiments} · ${formatWords(request.formats)} · ${request.licences} licences · ${askedTermWords(request.term)}`;
}

/** "Last change": "Access active since 8 Oct 2026" (B3-08 RQ), else the change's date and time. */
export function lastChangeWords(accessActiveAt: string | null, lastChangeAt: string): string {
  return accessActiveAt !== null
    ? `Access active since ${dayMonthYear(accessActiveAt)}`
    : dateTime(lastChangeAt);
}

// ---- IA-17 the form (B3-08 f1, f2) and its result ----

export const ASK_FORM = {
  back: 'Requests',
  overline: 'Request to BITS',
  title: 'Ask for a renewal or more licences',
  need: 'What you need',
  renewSub: 'Asks for the same plan again: the same experiments, formats, licences and term.',
  more: 'More licences for experiments you hold',
  moreSub: 'A new request. BITS reviews it like any other request.',
  renewing: 'The plan you’re renewing',
  keys: {
    plan: 'Access plan',
    experiment: 'Experiment',
    formats: 'Formats',
    licences: 'Licences',
    term: 'Term',
  },
  experimentsAndLicences: 'Experiments and licences',
  licencesRequested: 'Licences requested',
  licencesHint: 'How many more you need, as a whole number.',
  organisation: 'Organisation and contact person',
  institution: 'Institution',
  contactPerson: 'Contact person',
  message: 'Message to BITS',
  optional: '(optional)',
  cancel: 'Cancel',
  send: 'Send request to BITS',
  sending: 'Sending…',
  backToRequests: 'Back to Requests',
} as const;

/** "Choose what you need" (B3-08 script `submit`): the form's own check, before anything is sent. */
export function needRequiredWords(): string {
  return messageFor('IA-17.need.required') ?? '';
}

/** "Check your request" (B3-08 f1 `xw-errsum`), whatever the count. */
export function askSummaryTitle(count: number): string {
  return summaryTitleFor('IA-17', count) ?? '';
}

/** "Renew access plan ACC-0107" (B3-08 f1, f2 choice). */
export function renewChoiceWords(planId: string): string {
  return `Renew access plan ${planId}`;
}

/** "Experiments in ACC-0107" (B3-08 f1 legend). */
export function experimentsInWords(planId: string): string {
  return `Experiments in ${planId}`;
}

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (B3-08 f2), the code left out when none is set. */
export function experimentCourseWords(name: string, platformCode: string | null): string {
  return platformCode ? `${name} · ${platformCode}` : name;
}

/** "· ME ZG523 · WEB and VR" after the experiment's name in its check row (B3-08 f1). */
export function experimentRowMeta(
  platformCode: string | null,
  formats: readonly Technology[],
): string {
  return `· ${platformCode ? `${platformCode} · ` : ''}${formatWords(formats)}`;
}

/** "120 licences" (B3-08 f2). */
export function licencesWords(licences: number): string {
  return `${licences} licences`;
}

/** "Yearly · current plan ends 7 Oct 2027" (B3-08 f2). */
export function renewingTermWords(term: AccessPlanTerm, endsOn: string): string {
  const kind =
    term === 'yearly'
      ? 'Yearly'
      : term === 'monthly'
        ? 'Monthly'
        : term === 'quarterly'
          ? 'Quarterly'
          : 'Until a fixed date';
  return `${kind} · current plan ends ${calendarDay(endsOn)}`;
}

/** "Meera Iyer · meera.iyer@godavari.edu.in" (B3-08 f1, f2). */
export function contactWords(name: string, address: string): string {
  return `${name} · ${address}`;
}

/** The result's lead (B3-08 f0 `done`): "60 more licences · …. Status: Under review. …". */
export function sentLine(what: string, status: string): string {
  return `${what}. Status: ${status}. Each change shows here, in Requests.`;
}

export const SENT_TITLE = { before: 'Request ', after: ' sent to BITS' } as const;

// ---- the request detail (B3-08 f4 … f6) ----

export const REQUEST_DETAIL = {
  back: 'Requests',
  overline: 'Request to BITS',
  asked: 'What you asked for',
  history: 'History',
  keys: {
    type: 'Request type',
    experiment: 'Experiment',
    licences: 'Licences requested',
    message: 'Message to BITS',
    term: 'Term',
  },
  infoTitle: 'BITS asked for more information', // f5
  paymentTitle: 'Approved — payment required', // f6
  paymentLine: 'Nothing changes until the payment is confirmed.', // f6
  openPayment: 'Open the payment page', // f6
} as const;

/** "Sent 21 Oct 2026, 16:05" (B3-08 f4 header). */
export function sentWords(at: string): string {
  return `Sent ${dateTime(at)}`;
}

/** "Shell-and-Tube Heat Exchanger · ME ZG523 · WEB and VR" (B3-08 f4 "Experiment"). */
export function askedExperimentWords(
  name: string,
  platformCode: string | null,
  formats: readonly Technology[],
): string {
  return `${experimentCourseWords(name, platformCode)} · ${formatWords(formats)}`;
}

/** "21 Oct 2026, 16:05 · Meera Iyer" (B3-08 f4 … f6 history). */
export function historyWhen(at: string, who: string | null): string {
  return who ? `${dateTime(at)} · ${who}` : dateTime(at);
}

/** "“Please confirm …”" (B3-08 f5 notice and history). */
export function quoted(text: string): string {
  return `“${text}”`;
}

/** "Approved as asked: 60 licences" (B3-08 f6 history). */
export function approvedAsAskedWords(licences: number): string {
  return `Approved as asked: ${licences} licences`;
}

export const REQUEST_HISTORY = {
  sent: 'Sent to BITS', // f4
  bits: 'BITS', // f5, f6 "… · BITS"
  informationRequested: 'BITS asked for more information', // f5
  approvedPaymentRequired: 'Approved — payment required', // f6
} as const;

// ---- IA-18 Device requests (B3-09 f0) ----

export const DEVICE_REQUESTS = {
  line: 'You forward device requests to BITS. BITS decides.',
  caption: 'Device requests',
  columns: { student: 'Student', request: 'Request', status: 'Status', action: 'Action' },
  review: 'Review',
  emptyTitle: 'No device request yet', // B3-09 f1 … f5 (none), B3-12 f7
} as const;

/** "VR device transfer" (B3-09 f0 row). */
export function transferKindWords(format: Technology): string {
  return `${formatName(format)} device transfer`;
}

/** "DTR-0018 · 22 Oct 2026" (B3-09 f0 row sub-line, after the reference). */
export function transferDateWords(requestedAt: string): string {
  return ` · ${dayMonthYear(requestedAt)}`;
}

/** "Review Rahul Verma’s request" (B3-09 f0 `aria-label`). */
export function reviewLabel(student: string): string {
  return `Review ${student}’s request`;
}

// ---- IA-19 Device request — review & forward (B3-09 f1 … f5) ----

export const DEVICE_REQUEST = {
  back: 'Device requests',
  overline: 'Device request',
  asked: 'What the student asked for',
  keys: {
    student: 'Student',
    format: 'Format',
    from: 'Moving from',
    newDevice: 'New device',
    note: 'Note to you',
  },
  noNote: 'No note',
  action: 'Your action',
  canForward: 'Forward it to BITS. BITS decides; you can’t approve device transfers.',
  forwarded: 'Forwarded. Nothing more is needed from you; BITS decides.',
  approved: 'BITS approved this transfer. Nothing more is needed from you.',
  blocked: 'Forwarding is unavailable while access is paused.',
  pausedTitle: 'You can’t forward requests right now',
  pausedLine: 'Your institution’s access is paused. Requests wait here until BITS lifts the pause.',
  history: 'History',
  approvedByBits: 'Approved by BITS',
  forward: TRANSFER_ACTIONS.forward,
  forwarding: 'Forwarding…',
} as const;

/** "VR device transfer for Rahul Verma" (B3-09 f1 title). */
export function transferTitle(format: Technology, student: string): string {
  return `${transferKindWords(format)} for ${student}`;
}

/** "Requested 22 Oct 2026, 09:10 by Rahul Verma" (B3-09 f1 header). */
export function requestedWords(at: string, student: string): string {
  return `Requested ${dateTime(at)} by ${student}`;
}

/** " for Shell-and-Tube Heat Exchanger" after the format chip (B3-09 f1 "Format"). */
export function forExperimentWords(experiment: string): string {
  return ` for ${experiment}`;
}

/** The flash after forwarding (B3-09 f1 → f2 `flashFwd`). */
export function forwardedFlash(student: string): string {
  return `Forwarded to BITS. ${student} sees “Forwarded to BITS”. BITS decides.`;
}

/** "Requested by Rahul Verma" · "From … to …" (B3-09 history). */
export function requestedByWords(student: string): string {
  return `Requested by ${student}`;
}

export function fromToWords(from: string, to: string): string {
  return `From ${from} to ${to}`;
}

/** "Forwarded to BITS by Meera Iyer" (B3-09 f2 history). */
export function forwardedByWords(who: string): string {
  return `Forwarded to BITS by ${who}`;
}

/** "The authorised device is now: …" (B3-09 f3 history). */
export function authorisedNowWords(device: string): string {
  return `The authorised device is now: ${device}`;
}

/** DL-1 (B3-09 f1 `dFwd`): "Forward DTR-0018 to BITS?". */
export function forwardTitle(reference: string): string {
  return `Forward ${reference} to BITS?`;
}

/** DL-1's effect, around the new device in `strong` (B3-09 f1). */
export function forwardEffect(
  student: string,
  format: Technology,
): { readonly before: string; readonly after: string } {
  return {
    before: `BITS decides whether ${student} can move ${formatName(format)} to `,
    after: '. You can’t take it back once it’s forwarded.',
  };
}
