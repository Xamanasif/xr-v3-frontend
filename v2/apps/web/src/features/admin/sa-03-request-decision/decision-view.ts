/**
 * SA-03's view of the port's answers (board B1-11), as pure functions: which drawn panel applies,
 * what the decision form holds and still needs, the words of "Existing access", "Where this
 * request stands" and the history. It decides nothing — every decision is the
 * `AccessRequestService` command's, and its refusals are shown as they come — and it reads only
 * facts the ports answered (`DecisionPage`, the published catalogue).
 */
import type { DecisionPage, FieldError } from '@xr/contracts/draft';
import type {
  AccessPlan,
  InstitutionKind,
  RequestedItem,
  RequestStatus,
  Technology,
} from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';

import {
  createdActive,
  createdWaitingPayment,
  DECISION_ERRORS,
  differenceLines,
  EXISTING_NO_PLAN,
  existingPlanWords,
  formatList,
  historyLine,
  type HistoryLine,
  NEXT_LINES,
  noInstitutionYet,
  PAUSED_SUFFIX,
  PENDING_HINTS,
  STAND,
  termWords,
} from '@/copy/requests';

export type DecisionChoice = 'approve' | 'smaller' | 'info';
export type ApprovedTerm = 'monthly' | 'quarterly' | 'yearly';

/** Which of B1-11's panels the request is in (`open`, `blocked`, `done`). */
export type PanelKind = 'open' | 'blocked' | 'decided';

/**
 * B1-11: a request under review is decided in the open panel — unless its institution is paused
 * (f14: "no decision controls while paused"); any other status has been decided (f9 … f12).
 * The commands decide again whatever the panel shows.
 */
export function panelKindOf(page: DecisionPage): PanelKind {
  if (page.request.status !== 'under-review') return 'decided';
  return page.existingAccess?.paused ? 'blocked' : 'open';
}

/** The decision the Super Admin is composing (B1-11 `dcInit`). `null` = as requested. */
export interface DecisionDraft {
  readonly choice: DecisionChoice | null;
  readonly route: InstitutionKind | null;
  /** The first experiment's formats to keep (single-experiment narrowing only, P1-07). */
  readonly formats: readonly Technology[] | null;
  readonly licences: string | null;
  readonly term: ApprovedTerm | null;
  readonly reason: string;
}

export const EMPTY_DRAFT: DecisionDraft = {
  choice: null,
  route: null,
  formats: null,
  licences: null,
  term: null,
  reason: '',
};

const APPROVED_TERMS: readonly ApprovedTerm[] = ['monthly', 'quarterly', 'yearly'];

/** The first experiment's requested formats (B1-11 narrows only `R.exps[0]`, P1-07). */
export function requestedFormatsOf(page: DecisionPage): readonly Technology[] {
  return inDisplayOrder(page.request.items[0]?.formats ?? []);
}

export function keptFormats(page: DecisionPage, draft: DecisionDraft): readonly Technology[] {
  return draft.formats ?? requestedFormatsOf(page);
}

export function licencesValue(page: DecisionPage, draft: DecisionDraft): string {
  return draft.licences ?? String(page.request.licencesRequested);
}

/**
 * The term the select shows. A request asked for a term the select does not offer (more licences
 * for the "Current term", REQ-0040; a fixed end date) shows its first option, Monthly, as a native
 * select does — and the difference then says so (PROVISIONAL, state-copy `SA-03.term-not-offered`).
 */
export function termValue(page: DecisionPage, draft: DecisionDraft): ApprovedTerm {
  if (draft.term) return draft.term;
  const asked = page.request.term.kind;
  return (APPROVED_TERMS as readonly string[]).includes(asked)
    ? (asked as ApprovedTerm)
    : 'monthly';
}

/** "Different from the request" (B1-11 `diffs`): what the smaller scope changes. */
export function differencesOf(page: DecisionPage, draft: DecisionDraft): readonly string[] {
  const requested = requestedFormatsOf(page);
  const kept = keptFormats(page, draft);
  const licences = licencesValue(page, draft);
  const term = termValue(page, draft);
  const askedTerm = termWords(page.request.term);
  const keptTerm = termWords({ kind: term });
  return differenceLines({
    formats:
      kept.length !== requested.length
        ? { asked: formatList(requested), kept: formatList(kept) }
        : null,
    licences:
      licences !== String(page.request.licencesRequested)
        ? { asked: String(page.request.licencesRequested), kept: licences }
        : null,
    term: keptTerm !== askedTerm ? { asked: askedTerm, kept: keptTerm } : null,
  });
}

/** The institution's route still has to be chosen at this approval (REQ-12; B1-11 `needsRoute`). */
export function needsRoute(page: DecisionPage, draft: DecisionDraft): boolean {
  return (draft.choice === 'approve' || draft.choice === 'smaller') && page.routeCommitted === null;
}

/** "Before clicking, the panel says what is still needed" (B1-11 f4 `pending`). */
export function pendingHint(page: DecisionPage, draft: DecisionDraft): string | null {
  if (!draft.choice) return null;
  if (needsRoute(page, draft) && !draft.route) return PENDING_HINTS.route;
  if (
    draft.choice === 'smaller' &&
    (differencesOf(page, draft).length === 0 || draft.reason.trim() === '')
  ) {
    return PENDING_HINTS.smaller;
  }
  if (draft.choice === 'info' && draft.reason.trim() === '') return PENDING_HINTS.info;
  return null;
}

/** The panel's errors, by the place B1-11 shows each one. */
export interface PanelErrors {
  readonly choice?: string;
  readonly route?: string;
  readonly formats?: string;
  readonly licences?: string;
  readonly term?: string;
  readonly change?: string;
  readonly reason?: string;
  /**
   * The command refused a rule no board words (a smaller scope's licences above the request,
   * PC-06 `not-smaller`; a missing term): the places it named. The panel then shows "Check your
   * decision" without a line and marks those fields invalid — never a silent close (state-copy
   * `SA-03.undrawn-refusal`).
   */
  readonly undrawn?: readonly ErrorPlace[];
}

type ErrorPlace = Exclude<keyof PanelErrors, 'undrawn'>;

const WHOLE_NUMBER = /^[1-9][0-9]*$/;

/**
 * B1-11 `validate`, run when the panel's button is pressed and before a confirmation opens: the
 * drawn checks of the form as it stands. The command validates again (`@xr/domain`), and its
 * refusal replaces these if it still refuses (`panelErrorsOf`).
 */
export function draftErrors(page: DecisionPage, draft: DecisionDraft): PanelErrors {
  const errors: { -readonly [Key in ErrorPlace]?: string } = {};
  if (!draft.choice) errors.choice = DECISION_ERRORS.choice;
  if (needsRoute(page, draft) && !draft.route) errors.route = DECISION_ERRORS.route;
  if (draft.choice === 'smaller') {
    if (keptFormats(page, draft).length === 0) errors.formats = DECISION_ERRORS.formats;
    if (!WHOLE_NUMBER.test(licencesValue(page, draft))) errors.licences = DECISION_ERRORS.licences;
    if (differencesOf(page, draft).length === 0) errors.change = DECISION_ERRORS.change;
  }
  if ((draft.choice === 'smaller' || draft.choice === 'info') && draft.reason.trim() === '') {
    errors.reason = draft.choice === 'info' ? DECISION_ERRORS.question : DECISION_ERRORS.reason;
  }
  return errors;
}

/** Where a field error of the service shows in the panel (the contract's input paths). */
const FIELD_PLACE: Readonly<Record<string, ErrorPlace>> = {
  route: 'route',
  items: 'formats',
  licences: 'licences',
  term: 'term',
  decision: 'change',
  reason: 'reason',
};

/** The command's field errors in the panel's places; undrawn rules carry no words (`null`). */
export function panelErrorsOf(fieldErrors: readonly FieldError[]): PanelErrors {
  const errors: { -readonly [Key in ErrorPlace]?: string } = {};
  const undrawn: ErrorPlace[] = [];
  for (const fieldError of fieldErrors) {
    const place = FIELD_PLACE[fieldError.field.split('.')[0]!] ?? 'change';
    if (!fieldError.message) {
      if (!undrawn.includes(place)) undrawn.push(place);
      continue;
    }
    if (!errors[place]) errors[place] = fieldError.message;
  }
  // A refusal always shows: an undrawn rule still opens "Check your decision".
  return undrawn.length > 0 || fieldErrors.length > 0 ? { ...errors, undrawn } : errors;
}

/** Whether the panel shows "Check your decision": drawn messages, or an undrawn refusal. */
export function hasPanelErrors(errors: PanelErrors): boolean {
  return errorList(errors).length > 0 || (errors.undrawn?.length ?? 0) > 0;
}

/** The messages in the order B1-11's "Check your decision" lists them (its `errs` keys). */
export function errorList(errors: PanelErrors): readonly string[] {
  return (['choice', 'route', 'formats', 'licences', 'term', 'change', 'reason'] as const)
    .map((key) => errors[key])
    .filter((message): message is string => Boolean(message));
}

/** The items a smaller scope approves: the first experiment narrowed, the others as asked. */
export function smallerScopeItems(
  page: DecisionPage,
  draft: DecisionDraft,
): readonly RequestedItem[] {
  return page.request.items.map((item, index) =>
    index === 0
      ? { experimentId: item.experimentId, formats: [...keptFormats(page, draft)] }
      : item,
  );
}

// ---- after a decision (B1-11 f9 … f12) ----

/**
 * The institution record was created by this request's own approval (B1-11 `isNew`): the request
 * asked for new access, it has been approved, and every plan the institution holds came from it.
 * Display only — the words "Created · …" and "Institution record created by this approval".
 */
export function createdByThisApproval(page: DecisionPage): boolean {
  const { request, existingAccess } = page;
  return (
    request.type === 'new-access' &&
    request.decision !== null &&
    existingAccess !== null &&
    existingAccess.plans.every((plan) => plan.sourceRequestId === request.id)
  );
}

/** The plan the request concerns: its source plan (renewal, more licences), else the newest. */
function planOf(page: DecisionPage): AccessPlan | null {
  const plans = page.existingAccess?.plans ?? [];
  const source = page.request.sourcePlanId
    ? plans.find((plan) => plan.id === page.request.sourcePlanId)
    : undefined;
  if (source) return source;
  return [...plans].sort((a, b) => (a.activatedAt < b.activatedAt ? 1 : -1))[0] ?? null;
}

function eventAt(page: DecisionPage, event: string): string | null {
  return [...page.request.history].reverse().find((entry) => entry.event === event)?.at ?? null;
}

/** B1-11 "Existing access" (`existing`), before and after the decision. */
export function existingAccessWords(
  page: DecisionPage,
  experimentName: (experimentId: string) => string,
): string {
  const { request, existingAccess } = page;
  if (!existingAccess || page.whereItStands.institutionRecord === 'not-created') {
    return noInstitutionYet(request.institutionName);
  }
  if (createdByThisApproval(page) && request.decision) {
    if (request.status === 'access-active') {
      const activatedAt = eventAt(page, 'access-active') ?? request.decision.at;
      return createdActive(
        request.decision.at,
        request.decision.route,
        activatedAt,
        request.activatedPlanId,
      );
    }
    return createdWaitingPayment(request.decision.at);
  }
  const plan = planOf(page);
  const paused = existingAccess.paused ? PAUSED_SUFFIX : '';
  if (!plan) return `${EXISTING_NO_PLAN}${paused}`;
  return `${existingPlanWords(plan, { renewal: request.type === 'renewal', experimentName })}${paused}`;
}

export interface StandRow {
  readonly key: string;
  readonly value: string;
}

/** B1-11 "Where this request stands" (`stand`), for a decided request. */
export function standRows(page: DecisionPage): readonly StandRow[] {
  const { request, whereItStands } = page;
  if (request.status === 'information-requested') {
    return [
      {
        key: STAND.institutionRecord,
        value: whereItStands.institutionRecord === 'created' ? STAND.exists : STAND.notCreated,
      },
      { key: STAND.request, value: STAND.informationRequested },
      { key: STAND.payment, value: STAND.paymentNone },
      { key: STAND.access, value: STAND.accessNotActive },
    ];
  }
  const decision = request.decision;
  const route: InstitutionKind = decision?.route ?? page.routeCommitted ?? 'external';
  const payment =
    whereItStands.payment === 'not-needed'
      ? STAND.paymentNotNeeded
      : whereItStands.payment === 'confirmed'
        ? STAND.paymentConfirmed(eventAt(page, 'payment-confirmed'))
        : whereItStands.payment === 'failed'
          ? STAND.paymentFailed
          : STAND.paymentWaiting;
  return [
    {
      key: STAND.institutionRecord,
      value: createdByThisApproval(page) && decision ? STAND.created(decision.at) : STAND.exists,
    },
    { key: STAND.request, value: STAND.approved(route) },
    { key: STAND.payment, value: payment },
    {
      key: STAND.access,
      value:
        whereItStands.institutionalAccess === 'active'
          ? STAND.accessActive(request.activatedPlanId)
          : STAND.accessNotActive,
    },
  ];
}

/** The decided panel's next line (B1-11 `next`); none where B1-11 draws none (PROVISIONAL). */
export function nextLine(status: RequestStatus): string | null {
  switch (status) {
    case 'approved-payment-required':
      return NEXT_LINES.payment;
    case 'access-active':
      return NEXT_LINES.active;
    case 'information-requested':
      return NEXT_LINES.information;
    default:
      return null;
  }
}

/** The request's history for the Super Admin, newest first (B1-11 `hist`). */
export function historyLines(page: DecisionPage): readonly HistoryLine[] {
  const createdInstitution = createdByThisApproval(page);
  return page.request.history
    .filter((entry) => entry.visibleTo.includes('super_admin'))
    .map((entry) => historyLine(entry, page.request, { createdInstitution }))
    .reverse();
}
