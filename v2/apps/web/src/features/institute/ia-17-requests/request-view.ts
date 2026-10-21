/**
 * IA-17's pure view rules (the owner-approved Institute Admin export, IA-v1 `Main.dc.html` `vm17`,
 * `vm17detail`): a request of the institution as the list row, the detail's title, its facts,
 * where it stands and its history — each written from the canonical facts the ports answer (the
 * list row's `type`, the requester's view of the request, the catalogue's names and the plans' own
 * history for a renewal). Words come from `@/copy/institute-requests` and the role-relative status
 * table; nothing here counts licences (D7), says a plan changed (OD-B3-09) or names a request or a
 * plan by its reference (state-copy `IA-17.no-reference`).
 */
import type { RequesterRequestView } from '@xr/contracts/draft';
import type { AccessPlan, RequestStatus, RequestType, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { dateTime } from '@/copy/dates';
import { requestWords, wordsOf } from '@/copy/flow-state-words';
import {
  ASK_FORM,
  approvedAsAskedWords,
  askedTermWords,
  experimentCourseWords,
  historyWhen,
  lastChangeWords,
  moreLicencesWords,
  newAccessTitle,
  paymentConfirmedWords,
  planActiveSinceWords,
  quoted,
  RENEWAL_OF_YOUR_PLAN,
  REQUEST_DETAIL,
  REQUEST_HISTORY,
  requestKindWords,
  requestWhatWords,
} from '@/copy/institute-requests';

/** An experiment as the published catalogue names it ("Shell-and-Tube Heat Exchanger · ME ZG523"). */
export interface ExperimentNaming {
  readonly name: string;
  readonly platformCode: string | null;
}

export type ExperimentNames = ReadonlyMap<string, ExperimentNaming>;

/** Its name, or its reference where the catalogue no longer names it (state-copy `IA-17.unnamed-experiment`). */
export function nameOf(names: ExperimentNames, experimentId: string): ExperimentNaming {
  return names.get(experimentId) ?? { name: experimentId, platformCode: null };
}

/**
 * The status's tone as IA-v1 draws it (`RQ`): Under review `info`, Information requested `err`,
 * Approved — payment required `warn`, Access active `ok`; the two payment states IA-v1 does not
 * draw keep their v46 tones in the V3 grammar (not confirmed `warn`, failed `err`).
 */
export const REQUEST_TONE: Readonly<Record<RequestStatus, StatusTone>> = {
  'under-review': 'info',
  'information-requested': 'err',
  'approved-payment-required': 'warn',
  'payment-not-confirmed': 'warn',
  'payment-failed': 'err',
  'access-active': 'ok',
};

/** The status as the Institute Admin reads it ("Under review" whether or not review started). */
export function requestStatusWords(view: {
  readonly status: RequestStatus;
  readonly reviewStarted: boolean;
}): string {
  return wordsOf(requestWords(view, 'tenant_admin')) ?? view.status;
}

/**
 * The plan a renewal asks to renew: the one whose own history names the request
 * (`renewal-requested`), or none (state-copy `IA-17.renewal-words`).
 */
export function renewalPlanOf(requestId: string, plans: readonly AccessPlan[]): string | null {
  const plan = plans.find((candidate) =>
    candidate.history.some(
      (entry) =>
        entry.event === 'renewal-requested' &&
        entry.refs.some((ref) => ref.kind === 'REQ' && ref.id === requestId),
    ),
  );
  return plan?.id ?? null;
}

/** The plan a request created when access became active (its `sourceRequestId`), or none. */
export function createdPlanOf(requestId: string, plans: readonly AccessPlan[]): AccessPlan | null {
  return plans.find((plan) => plan.sourceRequestId === requestId) ?? null;
}

/** Every format asked for, in the display order WEB · AR · VR · MR. */
export function requestFormats(view: RequesterRequestView): Technology[] {
  return inDisplayOrder([...new Set(view.asked.items.flatMap((item) => item.formats))]);
}

function byTime<T extends { readonly at: string }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/** The newest history entry of a kind, if any. */
function latest(view: RequesterRequestView, event: string) {
  return (
    byTime(view.history)
      .reverse()
      .find((entry) => entry.event === event) ?? null
  );
}

/** When the request was sent: its `submitted` entry ("Sent 21 Oct 2026, 16:05"). */
export function sentAt(view: RequesterRequestView): string {
  return view.history.find((entry) => entry.event === 'submitted')?.at ?? view.updatedAt;
}

/** When BITS last asked for more information, if it did. */
export function informationAskedAt(view: RequesterRequestView): string | null {
  return latest(view, 'information-requested')?.at ?? null;
}

export interface RequestRowView {
  readonly kind: string;
  readonly what: string;
  readonly status: string;
  readonly tone: StatusTone;
  readonly sentAt: string;
  readonly lastChange: string;
}

/** One IA-17 row: the kind, when it was sent, what was asked for, the status, the last change. */
export function requestRowView(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): RequestRowView {
  const sorted = byTime(view.history);
  return {
    kind: requestKindWords(type),
    what: requestWhatWords({
      type,
      experiments: view.asked.items.map((item) => nameOf(names, item.experimentId).name),
      formats: requestFormats(view),
      licences: view.asked.licences,
      term: view.asked.term,
      renewalOfKnownPlan: type === 'renewal' && renewalPlanOf(view.reference, plans) !== null,
    }),
    status: requestStatusWords(view),
    tone: REQUEST_TONE[view.status],
    sentAt: sentAt(view),
    lastChange: lastChangeWords(sorted.at(-1)?.at ?? view.updatedAt),
  };
}

/** The request in one line, as its "Sent to BITS" note writes it ("60 more licences · …"). */
export function requestSummary(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): string {
  return requestRowView(type, view, names, plans).what;
}

/**
 * The detail's title, which is also its crumb and its browser tab (IA-v1 `vm17detail` `title`;
 * state-copy `IA-17.detail.title`): "60 more licences", "Renewal of your access plan", "New
 * access · Shell-and-Tube Heat Exchanger".
 */
export function requestTitle(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): string {
  if (type === 'additional-licences') return moreLicencesWords(view.asked.licences);
  if (type === 'renewal') {
    return renewalPlanOf(view.reference, plans) ? RENEWAL_OF_YOUR_PLAN : requestKindWords(type);
  }
  const first = view.asked.items[0];
  return newAccessTitle(first ? nameOf(names, first.experimentId).name : null);
}

/** "Experiment": one line per experiment asked for ("Shell-and-Tube Heat Exchanger · ME ZG523"). */
export function askedExperimentLines(view: RequesterRequestView, names: ExperimentNames): string[] {
  return view.asked.items.map((item) => {
    const naming = nameOf(names, item.experimentId);
    return experimentCourseWords(naming.name, naming.platformCode);
  });
}

export interface AskedFact {
  readonly term: string;
  /** One line, or one line per experiment. */
  readonly value: string | readonly string[];
}

/** "What you asked for", kind by kind (IA-v1 `asked`; the Formats row is the badges, after these). */
export function askedFacts(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): AskedFact[] {
  const { keys } = REQUEST_DETAIL;
  const experiments = askedExperimentLines(view, names);
  if (type === 'additional-licences') {
    return [
      { term: keys.type, value: ASK_FORM.more },
      { term: keys.experiment, value: experiments },
      { term: keys.licencesRequested, value: String(view.asked.licences) },
    ];
  }
  if (type === 'renewal') {
    return [
      {
        term: keys.type,
        value: renewalPlanOf(view.reference, plans) ? ASK_FORM.renew : requestKindWords(type),
      },
      { term: keys.whatItAsks, value: REQUEST_DETAIL.renewalWhat },
      { term: keys.experiment, value: experiments },
    ];
  }
  return [
    { term: keys.type, value: REQUEST_DETAIL.newAccessType },
    { term: keys.experiment, value: experiments },
    { term: keys.licences, value: String(view.asked.licences) },
    { term: keys.term, value: askedTermWords(view.asked.term) },
  ];
}

export interface StandFact {
  readonly term: string;
  readonly value: string;
}

/**
 * "Where it stands": the request, the payment and the access plan kept apart (IA-v1 `stand`;
 * state-copy `IA-17.detail.stands`). `holdsPlan`: the institution holds an access plan.
 */
export function requestStands(
  view: RequesterRequestView,
  plans: readonly AccessPlan[],
): StandFact[] {
  const { stand } = REQUEST_DETAIL;
  const status = requestStatusWords(view);
  const plan = plans.length > 0 ? stand.planUnchanged : stand.planNotYet;
  switch (view.status) {
    case 'access-active': {
      const created = createdPlanOf(view.reference, plans);
      const confirmed = latest(view, 'payment-confirmed');
      const internal = !view.history.some((entry) => entry.event.startsWith('payment-'));
      return [
        { term: stand.request, value: stand.approved },
        {
          term: stand.payment,
          value: internal ? stand.paymentNotNeeded : paymentConfirmedWords(confirmed?.at ?? null),
        },
        {
          term: stand.plan,
          value: created ? planActiveSinceWords(created.activatedAt) : stand.planActive,
        },
      ];
    }
    case 'approved-payment-required':
      return [
        { term: stand.request, value: stand.approved },
        { term: stand.payment, value: stand.paymentWaiting },
        { term: stand.plan, value: plan },
      ];
    case 'payment-not-confirmed':
    case 'payment-failed':
      return [
        { term: stand.request, value: stand.approved },
        { term: stand.payment, value: status },
        { term: stand.plan, value: plan },
      ];
    case 'under-review':
    case 'information-requested':
      return [
        { term: stand.request, value: status },
        { term: stand.payment, value: stand.paymentNotStarted },
        { term: stand.plan, value: plan },
      ];
  }
}

export interface RequestHistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * "History", newest first: the drawn lines and the undrawn events in B1-08's words (state-copy
 * `IA-17.detail.history`). "Access active" says a plan was created only when one was activated by
 * the request — a renewal or more licences never says a plan changed (OD-B3-09).
 */
export function requestHistoryLines(
  view: RequesterRequestView,
  summary: string,
): RequestHistoryLine[] {
  const entries = view.history;
  const internal =
    entries.some((entry) => entry.event === 'access-active') &&
    !entries.some((entry) => entry.event.startsWith('payment-'));
  const answered = (index: number) =>
    entries
      .slice(index + 1)
      .some(
        (later) => later.event === 'payment-confirmed' || later.event === 'payment-not-completed',
      );
  const lines: RequestHistoryLine[] = [];
  entries.forEach((entry, index) => {
    const bits = historyWhen(entry.at, REQUEST_HISTORY.bits);
    const line = (what: string, when: string, note: string | null = null) =>
      lines.push({ id: entry.id, what, when, note });
    switch (entry.event) {
      case 'submitted': {
        const who =
          entry.actor.kind === 'person'
            ? entry.actor.displayName
            : entry.actor.kind === 'requester'
              ? entry.actor.name
              : null;
        line(REQUEST_HISTORY.sent, historyWhen(entry.at, who), summary);
        return;
      }
      case 'review-started':
        line('BITS started reviewing', bits);
        return;
      case 'information-requested':
        line(
          REQUEST_HISTORY.informationRequested,
          bits,
          view.whatBitsAsked ? quoted(view.whatBitsAsked) : null,
        );
        return;
      case 'approved':
        if (internal) line('Approved', bits, approvedAsAskedWords(view.asked.licences));
        else
          line(
            REQUEST_HISTORY.approvedPaymentRequired,
            bits,
            approvedAsAskedWords(view.asked.licences),
          );
        return;
      case 'approved-with-changes':
        line(
          internal ? 'Approved with changes' : 'Approved with changes — payment required',
          bits,
          view.whyItChanged ? quoted(view.whyItChanged) : null,
        );
        return;
      case 'payment-started':
        if (!answered(index)) line('Payment started', dateTime(entry.at));
        return;
      case 'payment-not-completed':
        line('Payment not completed', dateTime(entry.at));
        return;
      case 'payment-confirmed':
        line('Payment confirmed', dateTime(entry.at));
        return;
      case 'access-active':
        line('Access active', dateTime(entry.at), entry.note ? REQUEST_HISTORY.planCreated : null);
        return;
    }
  });
  return lines.reverse();
}

/** Every plan the institution holds, once each (content access lists them per course). */
export function plansOf(
  rows: readonly { readonly plans: readonly { readonly plan: AccessPlan }[] }[],
): AccessPlan[] {
  const byId = new Map<string, AccessPlan>();
  for (const row of rows)
    for (const standing of row.plans) byId.set(standing.plan.id, standing.plan);
  return [...byId.values()];
}
