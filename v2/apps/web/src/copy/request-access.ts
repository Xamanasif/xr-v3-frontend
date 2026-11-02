/**
 * The words of the public request (Phase-1 Package 1C): PU-07 Your selection (B1-06), PU-08 Request
 * institutional access and PU-09 Request sent (B1-07), PU-10 Request status with PU-13 Access
 * active and PU-12 Payment (B1-08), written from the canonical facts the services answer. Every
 * string is a board's own; what no board words is a provisional entry of the state-copy register
 * (`state-copy.ts`, VD-12) and is read from there. Never cart, basket, checkout, buy or prices
 * (B1-06 "Words"); never an amount, a method, a provider or "mark paid" (B1-08); "Approved" never
 * reads as "active" and "Payment started" never as "paid" (B1-08 "Three separate facts").
 */
import type { RequesterRequestView } from '@xr/contracts/draft';
import {
  FORMAT_META,
  type HistoryEntry,
  type RequestedItem,
  type RequestEvent,
  type Technology,
} from '@xr/domain';

import { dateTime } from './dates';
import { formatList, licencesRequestedWords, termWords } from './requests';
import { stateWords } from './state-copy';

// ---- the request stepper (B1-06, B1-07: `ol.xr-steps aria-label="Request institutional access"`) ----

export const REQUEST_STEPS = {
  label: 'Request institutional access',
  steps: ['Selection', 'Request details', 'Review', 'Sent'],
} as const;

// ---- counts (B1-06 `plural`) ----

/** "1 experiment", "2 experiments" (B1-06 `plural(n, 'experiment')`). */
export function experimentCount(count: number): string {
  return `${count} experiment${count === 1 ? '' : 's'}`;
}

/** "1 format", "3 formats" (B1-06 `plural(nf, 'format')`). */
export function formatCount(count: number): string {
  return `${count} format${count === 1 ? '' : 's'}`;
}

/** The header link's name: "Selection, 1 experiment" / "Selection, empty" (B1-06 `selAria`). */
export function selectionLinkName(experiments: number): string {
  return experiments > 0 ? `Selection, ${experimentCount(experiments)}` : 'Selection, empty';
}

export const SELECTION_LINK = 'Selection';
export const REQUEST_ACCESS = 'Request access';

// ---- PU-07 Your selection (B1-06) ----

export const SELECTION = {
  title: 'Your selection',
  lead: 'Check the experiments and formats your institution needs. You can change formats or remove an experiment here.',
  undo: 'Undo',
  remove: 'Remove',
  locked: 'At least one format stays chosen. To take this experiment out, use Remove.',
  summary: 'Summary',
  summaryExperiments: 'Experiments',
  summaryFormats: 'Formats chosen',
  summaryHint:
    'Nothing is requested until you send the request. You’ll add your institution’s details next.',
  continueToRequest: 'Continue to request',
  continueBrowsing: 'Continue browsing',
  emptyTitle: 'Your selection is empty',
  emptyLine:
    'Browse experiments and add the ones your institution needs, with the formats for each.',
  browse: 'Browse experiments',
} as const;

/** "Removed Shell-and-Tube Heat Exchanger from your selection." (B1-06 `undoText`). */
export function removedWords(title: string): string {
  return `Removed ${title} from your selection.`;
}

/** "Remove Shell-and-Tube Heat Exchanger from your selection" (B1-06 `removeLabel`). */
export function removeLabel(title: string): string {
  return `Remove ${title} from your selection`;
}

/** "Formats for Shell-and-Tube Heat Exchanger" (B1-06 `legend`). */
export function formatsLegend(title: string): string {
  return `Formats for ${title}`;
}

/** "WEB · Browser" (B1-06 `label: f + ' · ' + FN[f]`). */
export function formatOption(format: Technology): string {
  return `${FORMAT_META[format].code} · ${FORMAT_META[format].name}`;
}

/** "1 experiment · 2 formats" (B1-06 `bar`). */
export function selectionBarWords(experiments: number, formats: number): string {
  return `${experimentCount(experiments)} · ${formatCount(formats)}`;
}

/**
 * PU-07's line for a request this browser holds the ticket of, still in progress (owner decision,
 * 24 Oct 2026; state-copy `PU-07.request-in-progress`): "You have a request in progress for
 * Godavari Institute of Technology." — named by its institution only.
 */
export function requestInProgressWords(institutionName: string): string {
  return `${stateWords('PU-07.request-in-progress')} for ${institutionName}.`;
}

// ---- PU-08 Request institutional access (B1-07) ----

export const REQUEST_FORM = {
  backToSelection: 'Back to selection',
  title: 'Request institutional access',
  lead: 'Tell BITS what your institution needs and for how long. Provide your institution and contact details so BITS can review your request.',
  formName: 'Request details',
  part1: 'Part 1 of 3',
  organisation: 'Organisation and contact person',
  institution: 'Institution name',
  contact: 'Contact person',
  contactHint: 'The person BITS will contact about this request.',
  email: 'E-mail',
  phone: 'Phone',
  optional: '(optional)',
  part2: 'Part 2 of 3',
  needs: 'What you need',
  change: 'Change',
  licences: 'Licences requested',
  licencesHint: 'How many licences your institution is asking for.',
  message: 'Message to BITS',
  part3: 'Part 3 of 3',
  howLong: 'For how long',
  term: 'Access term',
  termHint: 'BITS confirms the term when it decides the request.',
  endsOn: 'End date',
  review: 'Review request',
} as const;

/** B1-07 `terms`: the four options and their sub-lines, in drawn order. */
export const TERM_CHOICES: readonly {
  readonly value: 'monthly' | 'quarterly' | 'yearly' | 'until-date';
  readonly title: string;
  readonly sub: string;
}[] = [
  { value: 'monthly', title: 'Monthly', sub: 'Recurring term' },
  { value: 'quarterly', title: 'Quarterly', sub: 'Recurring term' },
  { value: 'yearly', title: 'Yearly', sub: 'Recurring term' },
  { value: 'until-date', title: 'Until a fixed date', sub: 'Access ends on a date you choose' },
];

/** The review step (B1-07 f5 … f7, "Check your request"). */
export const REQUEST_REVIEW = {
  title: 'Check your request',
  lead: 'Make sure everything is right before you send it.',
  section: 'Your request',
  institution: 'Institution',
  contact: 'Contact person',
  email: 'E-mail',
  phone: 'Phone',
  experiments: 'Experiments and formats',
  licences: 'Licences requested',
  term: 'Access term',
  message: 'Message to BITS',
  phoneNone: 'Not given',
  messageNone: 'None',
  edit: 'Edit',
  change: 'Change',
  note: 'After you send it you’ll get a reference number for this request. BITS reviews every request; if a payment is needed, the request status will say so.',
  back: 'Back to request details',
  submit: 'Submit request',
  sending: 'Sending request…',
  sendingStatus: 'Sending your request',
  failedTitle: 'We couldn’t send your request',
  failedLine: 'Nothing was sent. Your details are still here — try again.',
} as const;

/**
 * "Edit contact person" (B1-07 `editLabel: 'Edit ' + k.toLowerCase()`). The board's script
 * lowercases the whole label, "BITS" too; the product keeps the acronym, PROVISIONAL (state-copy
 * `PU-08.edit-label`).
 */
export function editLabel(label: string): string {
  return `Edit ${label.replace(/(?:^|\s)(?!BITS\b)\S+/g, (word) => word.toLowerCase())}`;
}

// ---- PU-09 Request sent (B1-07 f2, f8) ----

export const REQUEST_SENT = {
  title: 'Request sent',
  referenceBefore: 'Your reference is ',
  referenceAfter: '. Use it whenever you refer to this request.',
  emptied: 'Your selection was sent with this request, so it is empty again.',
  checkStatus: 'Check request status',
  browse: 'Browse experiments',
} as const;

// ---- experiments and formats as one line (B1-07 review, B1-08 table, PU-12) ----

/** An experiment as the catalogue names it, for these pages. */
export interface NamedExperiment {
  readonly name: string;
}

/**
 * "Shell-and-Tube Heat Exchanger — WEB, VR"; several are joined with "; " (B1-08 f9 "Composite Wall
 * Conduction — WEB, AR; Fin-Tube Bundle — WEB, VR").
 */
export function itemsLine(
  items: readonly RequestedItem[],
  nameOf: (experimentId: string) => string,
): string {
  return items
    .map((item) => `${nameOf(item.experimentId)} — ${formatList(item.formats)}`)
    .join('; ');
}

// ---- PU-10 Request status, PU-13 Access active (B1-08) ----

export const REQUEST_STATUS = {
  eyebrow: 'Request status',
  /** `h1 > span.xr-sr "Request "` before the reference. */
  titleBefore: 'Request ',
  compareTitle: 'What you asked for and what was approved',
  compareItem: 'Item',
  asked: 'You asked for',
  approved: 'BITS approved',
  experiments: 'Experiments and formats',
  licences: 'Licences',
  term: 'Access term',
  notDecided: 'Not decided yet',
  changed: 'Changed',
  history: 'History',
  whatBitsAsked: 'What BITS asked',
  /**
   * P1 register item E (audit F-08): the requester was told BITS needs information but not how to
   * give it. IA-17's approved line for the same state (`informationLine`), word for word.
   */
  replyOutside: 'Reply outside the platform; there is no reply form here.',
  whyItChanged: 'Why it changed',
  accessPlan: 'Access plan ',
  signInHint: 'Institution administrators sign in to give students access.',
} as const;

/** "Updated 8 Oct 2026, 11:20" (B1-08 `xp-statushead-ref`). */
export function updatedWords(at: string): string {
  return `Updated ${dateTime(at)}`;
}

/** The statushead's drawn words and tone, by the request's state for its requester. */
export interface StatusHead {
  readonly tone: 'info' | 'wait' | 'err' | 'ok';
  readonly title: string;
  readonly text: string;
}

export function statusHead(view: RequesterRequestView): StatusHead {
  const institution = view.institutionName;
  switch (view.status) {
    case 'under-review':
      return view.reviewStarted
        ? {
            tone: 'info',
            title: 'BITS is reviewing your request',
            text: 'Nothing is needed from you right now. This page changes when BITS decides.',
          }
        : {
            tone: 'info',
            title: 'We’ve received your request',
            text: 'BITS will review it. Nothing is needed from you right now.',
          };
    case 'information-requested':
      return {
        tone: 'err',
        title: 'BITS needs more information',
        text: 'Your request stays open while BITS waits for this information.',
      };
    case 'approved-payment-required':
      return view.whyItChanged !== null
        ? {
            tone: 'wait',
            title: 'Approved with changes. Payment is needed before access starts.',
            text: 'BITS approved a smaller scope than you asked for. The reason is below.',
          }
        : {
            tone: 'wait',
            title: 'Approved. Payment is needed before access starts.',
            text: `When the payment is confirmed, access becomes active for ${institution}.`,
          };
    case 'payment-not-confirmed':
      return {
        tone: 'wait',
        title: 'Payment not confirmed yet',
        text: 'Access starts once the payment is confirmed. Check again later to see the result.',
      };
    case 'payment-failed':
      return {
        tone: 'err',
        title: 'The payment didn’t go through',
        text: 'Nothing has been activated. You can try the payment again.',
      };
    case 'access-active':
      return {
        tone: 'ok',
        title: 'Access is active',
        text: `${institution} now has access to the approved experiments. Its institution administrator gives students access.`,
      };
  }
}

/** The asked-for and approved licences, as B1-08 writes them ("120"; a more-licences request "60 more"). */
export function licencesLine(
  type: 'new-access' | 'additional-licences' | 'renewal',
  licences: number,
): string {
  return licencesRequestedWords(type, licences);
}

export { termWords };

/** One line of the requester's history (B1-08 `xr-timeline`), newest first by the caller. */
export interface RequesterHistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * The requester's history as B1-08 writes it. A payment start shows while it waits ("Payment
 * started · Waiting for confirmation.", f6); once the provider answers, its outcome stands in its
 * place (f7 "Payment not completed", f8 "Payment confirmed"). The deciding Super Admin is never
 * named: BITS decides (B1-08; INST-15). Undrawn lines are PROVISIONAL (state-copy
 * `PU-10.history-undrawn`).
 */
export function requesterHistory(view: RequesterRequestView): readonly RequesterHistoryLine[] {
  const entries = view.history;
  const answered = (index: number): boolean =>
    entries
      .slice(index + 1)
      .some(
        (later) => later.event === 'payment-confirmed' || later.event === 'payment-not-completed',
      );
  const internal =
    entries.some((entry) => entry.event === 'access-active') &&
    !entries.some((entry) => entry.event.startsWith('payment-'));
  const lines: RequesterHistoryLine[] = [];
  entries.forEach((entry, index) => {
    if (entry.event === 'payment-started' && answered(index)) return;
    lines.push(historyLineOf(entry, view, internal));
  });
  return lines.reverse();
}

function historyLineOf(
  entry: HistoryEntry<RequestEvent>,
  view: RequesterRequestView,
  internal: boolean,
): RequesterHistoryLine {
  const at = dateTime(entry.at);
  const line = (what: string, note: string | null = null, when = at): RequesterHistoryLine => ({
    id: entry.id,
    what,
    when,
    note,
  });
  switch (entry.event) {
    case 'submitted': {
      // The public contact, or the Institute Admin who sent an IA-17 request (its contact person).
      const sender =
        entry.actor.kind === 'requester'
          ? entry.actor.name
          : entry.actor.kind === 'person'
            ? entry.actor.displayName
            : null;
      return line('Request submitted', null, sender ? `${at} · ${sender}, contact person` : at);
    }
    case 'review-started':
      return line('BITS started reviewing');
    case 'information-requested':
      return line('BITS asked for more information', quoted(view.whatBitsAsked));
    case 'approved':
      return internal
        ? line('Approved', 'Approved as requested.')
        : line('Approved — payment needed', 'Approved as requested.');
    case 'approved-with-changes':
      return internal
        ? line(
            stateWords('PU-10.history-approved-with-changes-internal'),
            quoted(view.whyItChanged),
          )
        : line('Approved with changes — payment needed', quoted(view.whyItChanged));
    case 'payment-started':
      return line('Payment started', 'Waiting for confirmation.');
    case 'payment-not-completed':
      return line('Payment not completed');
    case 'payment-confirmed':
      return line('Payment confirmed');
    case 'access-active': {
      const plan = entry.note;
      if (internal) {
        return line(
          'Access active',
          plan
            ? `Access plan ${plan}. No payment step.`
            : stateWords('PU-10.history-no-plan-internal'),
        );
      }
      return line('Access active', plan ? `Access plan ${plan}.` : null);
    }
  }
}

function quoted(text: string | null): string | null {
  return text === null ? null : `“${text}”`;
}

// ---- PU-12 Payment (B1-08 f5, external route only) ----

export const PAYMENT = {
  back: 'Back to request status',
  eyebrowBefore: 'Payment · ',
  title: 'Pay for access',
  activated: 'What will be activated',
  institution: 'Institution',
  experiments: 'Experiments and formats',
  licences: 'Licences',
  term: 'Access term',
  request: 'Request',
  note: 'You’ll complete the payment on the payment step that follows. After that step, the request status shows whether the payment was confirmed.',
  continue: 'Continue to payment',
} as const;

/** "Access for Godavari Institute of Technology starts after the payment is confirmed." (B1-08 f5). */
export function paymentLead(institution: string): string {
  return `Access for ${institution} starts after the payment is confirmed.`;
}

/** PU-10's one next action (B1-08 f0, f4, f6, f7, f8). */
export const NEXT_ACTION = {
  'continue-to-payment': 'Continue to payment',
  'check-again': 'Check again',
  'try-payment-again': 'Try payment again',
  'sign-in': 'Sign in',
} as const;
