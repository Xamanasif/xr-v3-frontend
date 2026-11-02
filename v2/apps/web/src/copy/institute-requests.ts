/**
 * The words of the Institute Admin's Requests destination — IA-17 Requests to BITS, its form, its
 * result and its request detail, IA-18 Device requests and IA-19 Device request — review & forward
 * — as the owner-approved Institute Admin export draws them (design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` "Requests head and tabs", "IA-17", "IA-18", "IA-19" and the script's `vm17`,
 * `vm17form`, `vm17detail`, `vm18`, `vm19`, `dlgContent` `forward`), and of the Phase-2 actions
 * they enable on IA-01, IA-02, IA-03 and IA-05 (B2-01, B2-02, B2-03, B2-05). Written from the
 * canonical facts the ports answer (`requestRow`, `requesterRequestView`, `deviceTransfer`): read
 * models carry no words. The status words come from the role-relative table
 * (`flow-state-words.ts` `requestWords`, `transferWords`); what the export does not draw is a
 * provisional entry of the state-copy register (`state-copy-institute-requests.ts`), never an
 * invented rule. Licences are a number as asked — nothing here counts them (D7).
 *
 * No internal reference (REQ-, ACC-, DTR-) is in any of these words (the owner's identifier rule
 * for every role, state-copy `IA-17.no-reference`): a request is named by what it asks for, an
 * access plan as "your access plan", a device request by its format and student. The references
 * stay in the addresses, keys and service calls.
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

// ---- IA-17 Requests to BITS (IA-v1 `Main.dc.html` "Requests head and tabs", "IA-17 list") ----

export const REQUESTS_PAGE = {
  title: 'Requests',
  meta: 'What you’ve asked BITS for, and device requests from your students',
  ask: 'Ask BITS for a renewal or more licences',
  tabsLabel: 'Requests',
  tabs: { bits: 'Requests to BITS', devices: 'Device requests' },
  /** The list's hidden heading (`h2.xr-sr#rq-h`). */
  heading: 'Requests to BITS',
  caption: 'Requests to BITS, newest first',
  columns: {
    request: 'Request',
    what: 'What you asked for',
    status: 'Status',
    lastChange: 'Last change',
  },
  foot: 'Licences are shown as requested and approved by BITS.',
  /** `V.RH.askPaused`. */
  pausedTitle: 'You can’t ask BITS for anything while your institution’s access is paused',
  pausedLine:
    'Your requests and their history stay here. You can ask again when BITS lifts the pause.',
  /** `V.RH.askNoPlan` (its line: state-copy `IA-17.no-plan`). */
  noPlanTitle: 'Renewals and more licences need an active access plan',
  /** A failed read's line and its action (state-copy `IA-17.failed`, `IA-18.failed`). */
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/** The row's kind, its link (IA-v1 `RQK`: "New access", "Renewal", "More licences"). */
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

/** The row's line under its kind: when it was sent, "Sent 21 Oct 2026" (state-copy `IA-17.row-name`). */
export function requestSentDayWords(sentAt: string): string {
  return `Sent ${dayMonthYear(sentAt)}`;
}

/**
 * The row link's name, by content (state-copy `IA-17.row-name`): "More licences, sent 21 Oct
 * 2026, Under review. Open the request" — the kind alone until the request's own read answers.
 */
export function requestRowLabel(
  kind: string,
  sentAt: string | null,
  status: string | null,
): string {
  const facts = [kind, sentAt ? `sent ${dayMonthYear(sentAt)}` : null, status].filter(Boolean);
  return `${facts.join(', ')}. Open the request`;
}

/** Formats in words as the export writes them: "WEB and VR" (display order WEB · AR · VR · MR). */
export function formatWords(formats: readonly Technology[]): string {
  const names = inDisplayOrder(formats).map(formatName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

/** A requested term in words (IA-v1 "Yearly"; B1-11 "Monthly", "Quarterly"). */
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

/** "60 more licences" (IA-v1 detail title; list "60 more licences · …"). */
export function moreLicencesWords(licences: number): string {
  return `${licences} more licences`;
}

/** A renewal named by its plan (IA-v1 `opSendReq` "Renewal of " + plan, without the reference). */
export const RENEWAL_OF_YOUR_PLAN = 'Renewal of your access plan';

/**
 * "What you asked for" in the list (IA-v1 rows): more licences "60 more licences · Shell-and-Tube
 * Heat Exchanger"; new access "Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences ·
 * Yearly". A renewal reads "Renewal of your access plan" when its plan is known (state-copy
 * `IA-17.renewal-words`), else as new access does.
 */
export function requestWhatWords(request: {
  readonly type: RequestType;
  readonly experiments: readonly string[];
  readonly formats: readonly Technology[];
  readonly licences: number;
  readonly term: RequestedTerm;
  readonly renewalOfKnownPlan: boolean;
}): string {
  const experiments = request.experiments.join(', ');
  if (request.type === 'additional-licences') {
    return `${moreLicencesWords(request.licences)} · ${experiments}`;
  }
  if (request.type === 'renewal' && request.renewalOfKnownPlan) return RENEWAL_OF_YOUR_PLAN;
  return `${experiments} · ${formatWords(request.formats)} · ${request.licences} licences · ${askedTermWords(request.term)}`;
}

/** "Last change" (IA-v1 `lastAt`): the newest change's date and time, "21 Oct 2026, 16:05". */
export function lastChangeWords(lastChangeAt: string): string {
  return dateTime(lastChangeAt);
}

// ---- IA-17 the form (IA-v1 "IA-17 form", `vm17form`) and its result ("sent") ----

export const ASK_FORM = {
  /** The form's crumb under "Requests" (`crumb: 'Ask BITS'`). */
  crumb: 'Ask BITS',
  overline: 'Request to BITS',
  title: 'Ask for a renewal or more licences',
  need: 'What you need',
  renew: 'Renew your access plan',
  renewSub: 'Asks for the same plan again: the same experiments, formats, licences and term.',
  more: 'More licences for experiments you hold',
  moreSub: 'A new request. BITS reviews it like any other request.',
  renewing: 'The plan you’re renewing',
  keys: {
    experiment: 'Experiment',
    formats: 'Formats',
    licences: 'Licences',
    term: 'Term',
  },
  experimentsAndLicences: 'Experiments and licences',
  experimentsIn: 'Experiments in your access plan',
  licencesRequested: 'Licences requested',
  licencesHint: 'How many more you need, as a whole number.',
  organisation: 'Organisation and contact person',
  institution: 'Institution',
  contactPerson: 'Contact person',
  message: 'Message to BITS (optional)',
  cancel: 'Cancel',
  send: 'Send request to BITS',
  sending: 'Sending…',
} as const;

/** "Choose what you need" (IA-v1 `send`): the form's own check, before anything is sent. */
export function needRequiredWords(): string {
  return messageFor('IA-17.need.required') ?? '';
}

/** "Check your request" (IA-v1 `rk-errsum-t`), whatever the count. */
export function askSummaryTitle(count: number): string {
  return summaryTitleFor('IA-17', count) ?? '';
}

/** "Shell-and-Tube Heat Exchanger · ME ZG523", the code left out when none is set. */
export function experimentCourseWords(name: string, platformCode: string | null): string {
  return platformCode ? `${name} · ${platformCode}` : name;
}

/** An experiment choice's line (IA-v1 `exps[].d`): "WEB and VR · in your access plan". */
export function experimentChoiceLine(formats: readonly Technology[]): string {
  return `${formatWords(formats)} · in your access plan`;
}

/** "Formats in your access plan: WEB, VR" (IA-v1 `fmAria`, the badges' accessible name). */
export function planFormatsLabel(formats: readonly Technology[]): string {
  return `Formats in your access plan: ${inDisplayOrder(formats).map(formatName).join(', ')}`;
}

/** "120 licences" (IA-v1 `licLine`). */
export function licencesWords(licences: number): string {
  return `${licences} licences`;
}

/** "Yearly · current plan ends 7 Oct 2027" (IA-v1 `termLine`). */
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

/** The note under "What you need" while a renewal is open (IA-v1 `hasOpenRenew`). */
export const OPEN_RENEWAL_TITLE = 'You’ve already asked for a renewal';

/**
 * Its line, the open renewal named by when it was sent and its status (IA-v1 `openRenewT`, without
 * the reference): "Renewal sent 21 Oct 2026 · Under review. You can still send another request;
 * BITS sees both."
 */
export function openRenewalLine(sentAt: string, status: string): string {
  return `Renewal sent ${dayMonthYear(sentAt)} · ${status}. You can still send another request; BITS sees both.`;
}

/** "Meera Iyer · meera.iyer@godavari.edu.in" (IA-v1 `contact`). */
export function contactWords(name: string, address: string): string {
  return `${name} · ${address}`;
}

/** The result (IA-v1 "sent"): its crumb, its heading by content and its two ways on. */
export const SENT_PAGE = {
  crumb: 'Request sent',
  title: 'Request sent to BITS',
  view: 'View request',
  back: 'Back to Requests',
} as const;

/** The result's line (IA-v1 "sent"): "60 more licences · …. Status: Under review. …". */
export function sentLine(what: string, status: string): string {
  return `${what}. Status: ${status}. Each change shows here, in Requests.`;
}

// ---- the request detail (IA-v1 "IA-17 detail", `vm17detail`) ----

export const REQUEST_DETAIL = {
  overline: 'Request to BITS',
  asked: 'What you asked for',
  history: 'History',
  keys: {
    type: 'Request type',
    whatItAsks: 'What it asks for',
    experiment: 'Experiment',
    licences: 'Licences',
    licencesRequested: 'Licences requested',
    term: 'Term',
    formats: 'Formats',
    message: 'Message to BITS',
  },
  newAccessType: 'New access (sent from the public request form)',
  renewalWhat: 'The same plan again: the same experiments, formats, licences and term',
  infoTitle: 'BITS asked for more information',
  paymentTitle: 'Approved — payment required',
  paymentLine: 'Nothing changes until the payment is confirmed.',
  openPayment: 'Open the payment page',
  activeTitle: 'Access active',
  /**
   * An approved renewal or more-licences request writes no plan (`planEffect` policy-open,
   * OD-B3-09). B3-08 drew “BITS has activated this request.”, which reads as if the plan changed;
   * P1 register item B: say what SA-03 says for the same approval.
   */
  activeByBits: 'BITS approved this request. The current plan isn’t changed by it.',
  viewPlan: 'View your access plan',
  stand: {
    title: 'Where it stands',
    request: 'Request',
    payment: 'Payment',
    plan: 'Your access plan',
    approved: 'Approved',
    paymentWaiting: 'Waiting, not confirmed',
    paymentNotStarted: 'Not started',
    paymentConfirmed: 'Confirmed',
    /** An internal approval, active without a payment step (the Super Admin's words, SA-03). */
    paymentNotNeeded: 'Not needed (internal)',
    planUnchanged: 'Unchanged',
    planNotYet: 'Not created yet',
    planActive: 'Active',
    hint: 'Review, payment and your access plan are separate steps. A request doesn’t change your plan by itself.',
  },
} as const;

/** "New access · Shell-and-Tube Heat Exchanger" (IA-v1 detail title for a new-access request). */
export function newAccessTitle(experiment: string | null): string {
  return experiment
    ? `${requestKindWords('new-access')} · ${experiment}`
    : requestKindWords('new-access');
}

/** "Sent 21 Oct 2026, 16:05" (IA-v1 detail head). */
export function sentWords(at: string): string {
  return `Sent ${dateTime(at)}`;
}

/** "Formats: WEB, VR" (IA-v1 detail `fmAria`). */
export function formatsLabel(formats: readonly Technology[]): string {
  return `Formats: ${inDisplayOrder(formats).map(formatName).join(', ')}`;
}

/**
 * "BITS asked for more information" (IA-v1 `infoText`): the reason quoted, when BITS asked and
 * that there is no reply form here (T-03).
 */
export function informationLine(reason: string, at: string | null): string {
  return `${quoted(reason)}${at ? ` · ${dateTime(at)}` : ''}. Reply outside the platform; there is no reply form here.`;
}

/** "Payment confirmed. Your access plan was created 8 Oct 2026, 15:05." (IA-v1 `activeText`). */
export function planCreatedWords(at: string): string {
  return `Payment confirmed. Your access plan was created ${dateTime(at)}.`;
}

/** "Confirmed 8 Oct 2026, 15:05" (IA-v1 "Where it stands" › Payment). */
export function paymentConfirmedWords(at: string | null): string {
  return at
    ? `${REQUEST_DETAIL.stand.paymentConfirmed} ${dateTime(at)}`
    : REQUEST_DETAIL.stand.paymentConfirmed;
}

/** "Active since 8 Oct 2026, 15:05" (IA-v1 "Where it stands" › Your access plan). */
export function planActiveSinceWords(at: string): string {
  return `Active since ${dateTime(at)}`;
}

/** "21 Oct 2026, 16:05 · Meera Iyer" (IA-v1 history `t`). */
export function historyWhen(at: string, who: string | null): string {
  return who ? `${dateTime(at)} · ${who}` : dateTime(at);
}

/** "“Please confirm …”". */
export function quoted(text: string): string {
  return `“${text}”`;
}

/** "Approved as asked: 60 licences" (the history's approval line). */
export function approvedAsAskedWords(licences: number): string {
  return `Approved as asked: ${licences} licences`;
}

export const REQUEST_HISTORY = {
  sent: 'Sent to BITS',
  bits: 'BITS',
  informationRequested: 'BITS asked for more information',
  approvedPaymentRequired: 'Approved — payment required',
  /** "Access active" when a plan was activated by the request (state-copy `IA-17.detail.history`). */
  planCreated: 'Your access plan was created.',
} as const;

// ---- IA-18 Device requests (IA-v1 "IA-18 Device requests tab", `vm18`) ----

export const DEVICE_REQUESTS = {
  line: 'You forward device requests to BITS. BITS decides.',
  /** The list's hidden heading (`h2.xr-sr#dv-h`). */
  heading: 'Device requests',
  caption: 'Device requests from your students',
  columns: { student: 'Student', request: 'Request', status: 'Status', action: 'Action' },
  review: 'Review',
  emptyTitle: 'No device request yet',
  pausedTitle: 'You can’t forward requests right now',
  pausedLine: 'Your institution’s access is paused. Requests wait here until BITS lifts the pause.',
} as const;

/** "VR device transfer" (IA-v1 `what`). */
export function transferKindWords(format: Technology): string {
  return `${formatName(format)} device transfer`;
}

/** "22 Oct 2026" (IA-v1 row line under the request, without the reference). */
export function transferDateWords(requestedAt: string): string {
  return dayMonthYear(requestedAt);
}

/**
 * The request link's name, by content (IA-v1 `openAria` without the reference): "VR device
 * transfer from Rahul Verma, 22 Oct 2026".
 */
export function openTransferLabel(
  format: Technology,
  student: string,
  requestedAt: string,
): string {
  return `${transferKindWords(format)} from ${student}, ${dayMonthYear(requestedAt)}`;
}

/** "Review Rahul Verma’s request" (IA-v1 `reviewAria` without the reference). */
export function reviewLabel(student: string): string {
  return `Review ${student}’s request`;
}

// ---- IA-19 Device request — review & forward (IA-v1 "IA-19", `vm19`) ----

export const DEVICE_REQUEST = {
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
  pausedTitle: DEVICE_REQUESTS.pausedTitle,
  pausedLine: DEVICE_REQUESTS.pausedLine,
  history: 'History',
  approvedByBits: 'Approved by BITS',
  forward: TRANSFER_ACTIONS.forward,
  forwarding: 'Forwarding…',
  /** The flash after forwarding (IA-v1 `ia-flash` title). */
  forwardedTitle: 'Forwarded to BITS',
  stand: {
    request: 'Request',
    forwarded: 'Forwarded to BITS',
    decision: 'BITS decision',
    notYet: 'Not yet',
    notRecorded: 'Not recorded',
    approved: 'Approved',
  },
} as const;

/** "VR device transfer for Rahul Verma" (IA-v1 `title`). */
export function transferTitle(format: Technology, student: string): string {
  return `${transferKindWords(format)} for ${student}`;
}

/** "Requested 22 Oct 2026, 09:10 by Rahul Verma" (IA-v1 `reqLine`). */
export function requestedWords(at: string, student: string): string {
  return `Requested ${dateTime(at)} by ${student}`;
}

/** "for Shell-and-Tube Heat Exchanger" beside the format badge (IA-v1 "Format"). */
export function forExperimentWords(experiment: string): string {
  return `for ${experiment}`;
}

/** The flash's line after forwarding (IA-v1 `flash`): "Rahul Verma sees “Forwarded to BITS”. BITS decides." */
export function forwardedFlash(student: string): string {
  return `${student} sees “${DEVICE_REQUEST.forwardedTitle}”. BITS decides.`;
}

/** "Approved · 24 Oct 2026, 12:30" (IA-v1 "BITS decision"). */
export function decisionWords(at: string | null): string {
  return at ? `${DEVICE_REQUEST.stand.approved} · ${dateTime(at)}` : DEVICE_REQUEST.stand.approved;
}

/** "Requested by Rahul Verma" (IA-v1 history). */
export function requestedByWords(student: string): string {
  return `Requested by ${student}`;
}

/** "From … to …" (the request's devices; kept for the shared history rules, not drawn on IA-19). */
export function fromToWords(from: string, to: string): string {
  return `From ${from} to ${to}`;
}

/** "Forwarded to BITS by Meera Iyer" (IA-v1 history). */
export function forwardedByWords(who: string): string {
  return `Forwarded to BITS by ${who}`;
}

/** "The authorised device is now: …" (IA-v1 history). */
export function authorisedNowWords(device: string): string {
  return `The authorised device is now: ${device}`;
}

/** The forward dialog's question, by content (IA-v1 `dlgContent` `forward`). */
export function forwardTitle(student: string): string {
  return `Forward ${student}’s device request to BITS?`;
}

/** The forward dialog's line (IA-v1 `dlgContent` `forward`). */
export function forwardEffect(student: string, format: Technology, newDevice: string): string {
  return `BITS decides whether ${student} can move ${formatName(format)} to ${newDevice}. You can’t take it back once it’s forwarded.`;
}
