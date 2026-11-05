/**
 * SA-03's view of the port's answers (board B1-11), as pure functions: which drawn panel applies,
 * what the decision form holds and still needs, the words of "Existing access", "Where this
 * request stands" and the history. It decides nothing — every decision is the
 * `AccessRequestService` command's, and its refusals are shown as they come — and it reads only
 * facts the ports answered (`DecisionPage`, the published catalogue).
 */
import type { DecisionPage, FieldError, PlanEffect, ProductPorts } from '@xr/contracts/draft';
import type { AccessPlan, InstitutionKind, RequestedItem, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';

import {
  CONFIRM_LINES,
  confirmCreatesRecord,
  createdActive,
  createdWaitingPayment,
  DECISION_ERRORS,
  differenceLines,
  EXISTING_NO_PLAN,
  existingPlanWords,
  formatList,
  historyLine,
  type HistoryLine,
  licencesRequestedWords,
  NEXT_LINES,
  noInstitutionYet,
  sameNameLine,
  PAUSED_SUFFIX,
  PENDING_HINTS,
  planUnchangedLine,
  renewalApprovedLine,
  STAND,
  termWords,
} from '@/copy/requests';

export type DecisionChoice = 'approve' | 'smaller' | 'info';
export type ApprovedTerm = 'monthly' | 'quarterly' | 'yearly';

/**
 * Which of B1-11's panels the request is in (`open`, `blocked`, `done`), and `same-name`: the DP-09
 * interim safeguard (owner, 5 Nov 2026) — an institution of the same name exists, so approving
 * would create a second record and the decision waits.
 */
export type PanelKind = 'open' | 'blocked' | 'same-name' | 'decided';

/**
 * B1-11: a request under review is decided in the open panel — unless its institution is paused
 * (f14: "no decision controls while paused"); any other status has been decided (f9 … f12).
 * The commands decide again whatever the panel shows.
 */
export function panelKindOf(page: DecisionPage): PanelKind {
  if (page.request.status !== 'under-review') return 'decided';
  if (page.existingAccess?.paused) return 'blocked';
  return holdsForSameName(page) ? 'same-name' : 'open';
}

/**
 * DP-09: the request has no institution yet and one of the same name exists — approving would
 * create a second record of it (the commands answer `policy-open` SEL-05).
 */
export function holdsForSameName(page: DecisionPage): boolean {
  return page.existingAccess === null && page.sameNameInstitutions.length > 0;
}

/** "<name> is already on the platform (<route>). This request can’t be decided …", per institution. */
export function sameNameLines(page: DecisionPage): readonly string[] {
  return page.sameNameInstitutions.map((existing) => sameNameLine(existing.name, existing.kind));
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

/** The licences kept, as the request words them ("40 more" for a more-licences request). */
function keptLicencesWords(page: DecisionPage, licences: string): string {
  return page.request.type === 'additional-licences' && licences !== ''
    ? `${licences} more`
    : licences;
}

/** "Different from the request": what the smaller scope changes. */
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
        ? {
            asked: licencesRequestedWords(page.request.type, page.request.licencesRequested),
            kept: keptLicencesWords(page, licences),
          }
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

type DecisionPort = ProductPorts['accessRequests'];

/** A decision as the port's command: which one, and its input. */
export type DecisionCommand =
  | {
      readonly choice: 'approve';
      readonly input: Parameters<DecisionPort['approveRequest']>[0];
    }
  | {
      readonly choice: 'smaller';
      readonly input: Parameters<DecisionPort['approveSmallerScope']>[0];
    }
  | {
      readonly choice: 'info';
      readonly input: Parameters<DecisionPort['requestMoreInformation']>[0];
    };

/**
 * The command a decision sends, built once from the page and the decision as they stand when it
 * is sent or its confirmation opens, with the request's revision from when the decision began
 * (`expectedRev`). Nothing is read again before it goes: a newer read can neither change what a
 * confirmation names nor stand in for its revision — the service refuses a change shown meanwhile
 * as stale (P1-21). `null` until a decision is chosen.
 */
export function decisionCommand(
  page: DecisionPage,
  draft: DecisionDraft,
  expectedRev: number,
): DecisionCommand | null {
  const { request } = page;
  const route = page.routeCommitted === null ? draft.route : null;
  switch (draft.choice) {
    case 'approve':
      return { choice: 'approve', input: { id: request.id, route, expectedRev } };
    case 'smaller':
      return {
        choice: 'smaller',
        input: {
          id: request.id,
          route,
          items: smallerScopeItems(page, draft),
          licences: licencesValue(page, draft),
          term: termValue(page, draft),
          reason: draft.reason,
          expectedRev,
        },
      };
    case 'info':
      return { choice: 'info', input: { id: request.id, reason: draft.reason, expectedRev } };
    default:
      return null;
  }
}

// ---- the confirmation (`SA.DLG.approveReq`) ----

/**
 * Whether an approval would create the access plan: only the first approval of a new institution's
 * request for new access does (`approve` in @xr/domain); any other approval reaches the open policy
 * OD-B3-09 (`planEffect` policy-open) and its words never claim a plan (state-copy
 * `SA-03.internal-confirm-plan`).
 */
export function approvalCreatesPlan(page: DecisionPage): boolean {
  return (
    page.whereItStands.institutionRecord === 'not-created' && page.request.type === 'new-access'
  );
}

/** The confirmation's two groups: what approving does now, and what only follows later events. */
export function confirmLines(
  page: DecisionPage,
  draft: DecisionDraft,
  route: InstitutionKind | null,
): { readonly now: readonly string[]; readonly later: readonly string[] } {
  const now: string[] = [];
  const later: string[] = [];
  const renewal = page.request.type === 'renewal';
  const createsPlan = approvalCreatesPlan(page);
  if (page.whereItStands.institutionRecord === 'not-created') {
    now.push(confirmCreatesRecord(page.request.institutionName, route));
  }
  if (route === 'external') {
    now.push(CONFIRM_LINES.externalApproves);
    later.push(createsPlan ? CONFIRM_LINES.externalNotActive : CONFIRM_LINES.externalExisting);
  } else if (createsPlan) {
    now.push(CONFIRM_LINES.internalApproves, CONFIRM_LINES.internalActive);
  } else {
    now.push(renewal ? CONFIRM_LINES.renewalApproves : CONFIRM_LINES.internalApproves);
    later.push(planUnchangedLine(planOf(page)?.endsOn ?? null));
  }
  if (draft.choice === 'smaller') now.push(CONFIRM_LINES.smaller);
  later.push(CONFIRM_LINES.students);
  return { now, later };
}

// ---- after a decision (`doneHtml`) ----

/**
 * The institution record was created by this request's own approval (the export's `isNew`): the
 * request asked for new access, it has been approved, and every plan the institution holds came
 * from it. Display only — "Created …" and "Institution record created by this approval".
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

/** "Existing access", before and after the decision. */
export function existingAccessWords(
  page: DecisionPage,
  experimentName: (experimentId: string) => string,
): string {
  const { request, existingAccess } = page;
  if (!existingAccess || page.whereItStands.institutionRecord === 'not-created') {
    // DP-09: "None. There is no institution record … yet." would be untrue.
    if (holdsForSameName(page)) return sameNameLines(page).join(' ');
    return noInstitutionYet(request.institutionName, request.status === 'under-review');
  }
  if (createdByThisApproval(page) && request.decision) {
    if (request.status === 'access-active') {
      const activatedAt = eventAt(page, 'access-active') ?? request.decision.at;
      return createdActive(request.decision.at, request.decision.route, activatedAt);
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

/** "Where this request stands" (`dl.rk-stand`), for a decided request. */
export function standRows(page: DecisionPage): readonly StandRow[] {
  const { request, whereItStands } = page;
  const created = createdByThisApproval(page);
  const access =
    whereItStands.institutionalAccess !== 'active'
      ? STAND.accessNotActive
      : created
        ? STAND.accessActiveSince(eventAt(page, 'access-active'))
        : STAND.accessUnchanged;
  if (request.status === 'information-requested') {
    return [
      {
        key: STAND.institutionRecord,
        value: whereItStands.institutionRecord === 'created' ? STAND.exists : STAND.notCreated,
      },
      { key: STAND.request, value: STAND.informationRequested },
      { key: STAND.payment, value: STAND.paymentNotStarted },
      { key: STAND.access, value: access },
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
          : request.status === 'payment-not-confirmed'
            ? STAND.paymentNotConfirmed
            : STAND.paymentWaiting;
  const rows: StandRow[] = [
    {
      key: STAND.institutionRecord,
      value: created && decision ? STAND.created(decision.at) : STAND.exists,
    },
    { key: STAND.request, value: STAND.approved(route) },
    { key: STAND.payment, value: payment },
  ];
  // A payment started but not confirmed: the export draws no access line (`pend`).
  return request.status === 'payment-not-confirmed'
    ? rows
    : [...rows, { key: STAND.access, value: access }];
}

/**
 * What an approval did to the plans: the command's own answer when it was decided here
 * (`planEffect`), else read from the page as the domain decides it — a plan only for a new
 * institution's request for new access (OD-B3-09).
 */
export function planEffectOf(page: DecisionPage, answered: PlanEffect | null): PlanEffect['kind'] {
  if (answered) return answered.kind;
  if (page.request.status !== 'access-active') return 'none';
  return page.request.activatedPlanId !== null || createdByThisApproval(page)
    ? 'plan-created'
    : 'policy-open';
}

/**
 * The decided panel's next line; none where the export draws none (PROVISIONAL, state-copy
 * `SA-03.next-undrawn`). When the approval's plan effect is open the words never claim the plan
 * changed — the copy already used for a renewal and more licences (`planEffect` policy-open).
 */
export function nextLine(page: DecisionPage, answered: PlanEffect | null = null): string | null {
  const { request } = page;
  switch (request.status) {
    case 'approved-payment-required':
      return createdByThisApproval(page) ? NEXT_LINES.paymentNew : NEXT_LINES.paymentExisting;
    case 'access-active': {
      if (planEffectOf(page, answered) !== 'policy-open') {
        return createdByThisApproval(page) ? NEXT_LINES.activeNew : NEXT_LINES.active;
      }
      return request.type === 'renewal'
        ? renewalApprovedLine(planOf(page)?.endsOn ?? null)
        : NEXT_LINES.activePlanUnchanged;
    }
    case 'information-requested':
      return NEXT_LINES.information;
    default:
      return null;
  }
}

/** The request's history for the Super Admin, newest first. */
export function historyLines(page: DecisionPage): readonly HistoryLine[] {
  const createdInstitution = createdByThisApproval(page);
  return page.request.history
    .filter((entry) => entry.visibleTo.includes('super_admin'))
    .map((entry) => historyLine(entry, page.request, { createdInstitution }))
    .reverse();
}
