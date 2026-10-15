/**
 * IA-17's pure view rules (B3-08): a request of the institution as the list row, the detail's title
 * and facts, and its history — each written from the canonical facts the ports answer (the list
 * row's `type`, the requester's view of the request, the catalogue's names and the plans' own
 * history for a renewal). Words come from `@/copy/institute-requests` and the role-relative
 * status table; nothing here counts licences (D7) or says a plan changed (OD-B3-09).
 */
import type { RequesterRequestView } from '@xr/contracts/draft';
import type { AccessPlan, RequestStatus, RequestType, Technology } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { dateTime } from '@/copy/dates';
import { requestWords, wordsOf } from '@/copy/flow-state-words';
import {
  approvedAsAskedWords,
  askedExperimentWords,
  historyWhen,
  lastChangeWords,
  moreLicencesWords,
  quoted,
  renewalOfWords,
  renewChoiceWords,
  REQUEST_HISTORY,
  requestKindWords,
  requestWhatWords,
  ASK_FORM,
} from '@/copy/institute-requests';

/** An experiment as the published catalogue names it (B3-08 "Shell-and-Tube Heat Exchanger · ME ZG523"). */
export interface ExperimentNaming {
  readonly name: string;
  readonly platformCode: string | null;
}

export type ExperimentNames = ReadonlyMap<string, ExperimentNaming>;

/** Its name, or its reference where the catalogue no longer names it (state-copy `IA-17.unnamed-experiment`). */
export function nameOf(names: ExperimentNames, experimentId: string): ExperimentNaming {
  return names.get(experimentId) ?? { name: experimentId, platformCode: null };
}

/** B3-08's status chips: Under review `wait`, Information requested `info`, Approved — payment required `wait`, Access active `ok`. */
export const REQUEST_TONE: Readonly<Record<RequestStatus, StatusTone>> = {
  'under-review': 'wait',
  'information-requested': 'info',
  'approved-payment-required': 'wait',
  'payment-not-confirmed': 'wait',
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

function formatsOf(view: RequesterRequestView): Technology[] {
  return [...new Set(view.asked.items.flatMap((item) => item.formats))];
}

/** The newest history entry of the request, and the time it became active, if it did. */
function changes(view: RequesterRequestView): {
  readonly lastAt: string;
  readonly activeAt: string | null;
} {
  const sorted = [...view.history].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const active =
    view.status === 'access-active'
      ? ([...sorted].reverse().find((entry) => entry.event === 'access-active') ?? null)
      : null;
  return { lastAt: sorted.at(-1)?.at ?? view.updatedAt, activeAt: active?.at ?? null };
}

export interface RequestRowView {
  readonly id: string;
  readonly kind: string;
  readonly what: string;
  readonly status: string;
  readonly tone: StatusTone;
  readonly lastChange: string;
}

/** One B3-08 table row: reference and kind, what was asked for, the status, the last change. */
export function requestRowView(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): RequestRowView {
  const { lastAt, activeAt } = changes(view);
  return {
    id: view.reference,
    kind: requestKindWords(type),
    what: requestWhatWords({
      type,
      experiments: view.asked.items.map((item) => nameOf(names, item.experimentId).name),
      formats: formatsOf(view),
      licences: view.asked.licences,
      term: view.asked.term,
      renewalOf: type === 'renewal' ? renewalPlanOf(view.reference, plans) : null,
    }),
    status: requestStatusWords(view),
    tone: REQUEST_TONE[view.status],
    lastChange: lastChangeWords(activeAt, lastAt),
  };
}

/** The request in one line, as its "Sent to BITS" note writes it (B3-08 f4: "60 more licences · …"). */
export function requestSummary(
  type: RequestType,
  view: RequesterRequestView,
  names: ExperimentNames,
  plans: readonly AccessPlan[],
): string {
  return requestRowView(type, view, names, plans).what;
}

/** The detail's title (B3-08 f4 "60 more licences"; state-copy `IA-17.detail.title`). */
export function requestTitle(
  type: RequestType,
  view: RequesterRequestView,
  plans: readonly AccessPlan[],
): string {
  if (type === 'additional-licences') return moreLicencesWords(view.asked.licences);
  if (type === 'renewal') {
    const plan = renewalPlanOf(view.reference, plans);
    return plan ? renewalOfWords(plan) : requestKindWords(type);
  }
  return requestKindWords(type);
}

/** "Request type" (B3-08 f4 "More licences for experiments you hold"; state-copy `IA-17.detail.title`). */
export function requestTypeWords(
  type: RequestType,
  requestId: string,
  plans: readonly AccessPlan[],
): string {
  if (type === 'additional-licences') return ASK_FORM.more;
  if (type === 'renewal') {
    const plan = renewalPlanOf(requestId, plans);
    return plan ? renewChoiceWords(plan) : requestKindWords(type);
  }
  return requestKindWords(type);
}

/** "Experiment": one line per experiment asked for (B3-08 f4). */
export function askedExperimentLines(view: RequesterRequestView, names: ExperimentNames): string[] {
  return view.asked.items.map((item) => {
    const naming = nameOf(names, item.experimentId);
    return askedExperimentWords(naming.name, naming.platformCode, item.formats);
  });
}

/** When the request was sent: its `submitted` entry (B3-08 f4 "Sent 21 Oct 2026, 16:05"). */
export function sentAt(view: RequesterRequestView): string {
  return view.history.find((entry) => entry.event === 'submitted')?.at ?? view.updatedAt;
}

export interface RequestHistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * B3-08 "History", newest first: the drawn lines (f4 … f6) and the undrawn events in B1-08's words
 * (state-copy `IA-17.detail.history`). "Access active" names a plan only when one was activated by
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
        line('Access active', dateTime(entry.at), entry.note ? `Access plan ${entry.note}.` : null);
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
