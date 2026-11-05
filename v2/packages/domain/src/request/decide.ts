/**
 * Access-request decisions (Appendix C M03; matrix REQ-*, INST-01, ACC-01, ACC-02; B1-07, B1-08,
 * B1-11, B3-08). Four separate events (BR-036): institution record created · request approved ·
 * payment confirmed (external only) · access activated (internal on approval; external after
 * payment). A record is not access. Approving gives no Student any access (SEL-04, BC9).
 */
import type { ActorRef, PersonActorRef, RequesterActorRef, SystemActorRef } from '../roles.js';
import { inDisplayOrder } from '../technology.js';
import {
  type Decision,
  type InputIssue,
  invalidInput,
  invalidState,
  isBlank,
  isWholeNumber,
  notPermitted,
  ok,
  policyOpen,
  refused,
} from '../kernel/decision.js';
import { historyEntry, type HistoryEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { AccessPlanId, ExperimentId, InstitutionId } from '../kernel/ids.js';
import { isDrawnTransition } from '../kernel/machine.js';
import { provided } from '../kernel/provided.js';
import { newMeta, nextMeta, ref } from '../kernel/record.js';
import { type CalendarDate, dateOf, daysBetween, type IsoInstant } from '../kernel/time.js';
import { accessPlanStatus, WORK_EMAIL } from '../institution/decide.js';
import { newAccessPlan, newInstitution } from '../institution/records.js';
import type {
  AccessPlan,
  AccessPlanTerm,
  Institution,
  InstitutionKind,
} from '../institution/model.js';
import { termEndsOn } from '../institution/term.js';
import {
  type AccessRequest,
  EMPTY_SELECTION,
  REQUEST_TRANSITIONS,
  type RequestCommand,
  type RequestDecision,
  type RequestedItem,
  type RequestedTerm,
  type RequestEvent,
  type RequestStatus,
  type Selection,
} from './model.js';

const REQUEST_READERS = ['public', 'tenant_admin', 'super_admin'] as const;

function entry(
  ids: IdSource,
  event: RequestEvent,
  at: IsoInstant,
  actor: HistoryEntry<RequestEvent>['actor'],
  note: string | null = null,
): HistoryEntry<RequestEvent> {
  return historyEntry({
    id: ids.next('history'),
    event,
    at,
    actor,
    note,
    visibleTo: REQUEST_READERS,
  });
}

function moved(request: AccessRequest, to: RequestStatus, command: RequestCommand): boolean {
  return isDrawnTransition(REQUEST_TRANSITIONS, request.status, to, command);
}

export interface PublicRequestForm {
  readonly institutionName: string;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly contactPhone: string | null;
  readonly licences: number | null;
  readonly term: Exclude<RequestedTerm, { kind: 'current-plan' }> | null;
  readonly message: string | null;
}

export interface SubmitPublicRequestInput {
  readonly selection: Selection;
  readonly form: PublicRequestForm;
  /** The experiment's published formats now, or null when it is not published any more. */
  readonly publishedFormatsOf: (experimentId: ExperimentId) => readonly string[] | null;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * B1-07 `reqValidate`: the drawn required fields and rules of the public request form; and an
 * "Until a fixed date" end date must be later than today (`today` from the platform clock, the
 * date every plan starts on) — a past or same-day end would create access that has already ended
 * (audit G-10 / N-04; owner approval of B2B milestone I1, C2, 5 Nov 2026).
 */
export function publicRequestIssues(form: PublicRequestForm, today: CalendarDate): InputIssue[] {
  return [
    ...(isBlank(form.institutionName) ? [{ field: 'institutionName', rule: 'required' }] : []),
    ...(isBlank(form.contactPerson) ? [{ field: 'contactPerson', rule: 'required' }] : []),
    ...(isBlank(form.contactEmail)
      ? [{ field: 'contactEmail', rule: 'required' }]
      : WORK_EMAIL.test(form.contactEmail.trim())
        ? []
        : [{ field: 'contactEmail', rule: 'email-format' }]),
    ...(form.licences === null
      ? [{ field: 'licences', rule: 'required' }]
      : isWholeNumber(form.licences, 1)
        ? []
        : [{ field: 'licences', rule: 'whole-number' }]),
    ...(form.term === null ? [{ field: 'term', rule: 'required' }] : []),
    ...(form.term?.kind === 'until-date' && daysBetween(today, form.term.endsOn) < 1
      ? [{ field: 'term.endsOn', rule: 'after-today' }]
      : []),
  ];
}

export interface SubmittedPublicRequest {
  readonly request: AccessRequest;
  /** "Your selection was sent with this request, so it is empty again." (B1-07). */
  readonly selection: Selection;
}

/** Submit an institutional access request from the visitor's selection (REQ-01). No account. */
export function submitPublicRequest(
  input: SubmitPublicRequestInput,
): Decision<SubmittedPublicRequest> {
  if (input.selection.items.length === 0) return refused('selection-empty');
  const issues = publicRequestIssues(input.form, dateOf(input.now));
  for (const item of input.selection.items) {
    const published = input.publishedFormatsOf(item.experimentId);
    if (!published || item.formats.some((format) => !published.includes(format))) {
      issues.push({ field: 'selection', rule: 'format-not-published' });
      break;
    }
  }
  if (issues.length > 0) return invalidInput(...issues);
  const form = input.form;
  const id = input.ids.next('request');
  const requester: RequesterActorRef = { kind: 'requester', name: form.contactPerson.trim() };
  const request: AccessRequest = {
    ...newMeta(input.now),
    id,
    statusToken: input.ids.next('statusToken'),
    routeId: input.ids.next('requestRoute'),
    type: 'new-access',
    origin: 'public',
    institutionId: null,
    institutionName: form.institutionName.trim(),
    contact: {
      person: form.contactPerson.trim(),
      email: form.contactEmail.trim(),
      phone: isBlank(form.contactPhone) ? null : form.contactPhone!.trim(),
    },
    items: input.selection.items.map((item) => ({
      experimentId: item.experimentId,
      formats: inDisplayOrder(item.formats),
    })),
    licencesRequested: form.licences!,
    term: form.term!,
    message: isBlank(form.message) ? null : form.message!.trim(),
    sourcePlanId: null,
    receivedAt: input.now,
    reviewStartedAt: null,
    status: 'under-review',
    route: null,
    decision: null,
    informationRequest: null,
    payments: [],
    activatedPlanId: null,
    history: [entry(input.ids, 'submitted', input.now, requester)],
  };
  return ok({ request, selection: EMPTY_SELECTION });
}

export interface InstituteRequestBase {
  readonly institution: Institution;
  readonly plan: AccessPlan;
  readonly message: string | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

export interface InstituteRequestOutcome {
  readonly request: AccessRequest;
  readonly institution: Institution;
  readonly plan: AccessPlan;
}

function instituteRequest(
  input: InstituteRequestBase,
  type: 'renewal' | 'additional-licences',
  items: readonly RequestedItem[],
  licences: number,
  term: RequestedTerm,
): InstituteRequestOutcome {
  const id = input.ids.next('request');
  const request: AccessRequest = {
    ...newMeta(input.now),
    id,
    statusToken: input.ids.next('statusToken'),
    routeId: input.ids.next('requestRoute'),
    type,
    origin: 'institute-admin',
    institutionId: input.institution.id,
    institutionName: input.institution.name,
    contact: {
      person: input.actor.displayName,
      email: input.institution.instituteAdmin?.workEmail ?? '',
      phone: null,
    },
    items,
    licencesRequested: licences,
    term,
    message: isBlank(input.message) ? null : input.message!.trim(),
    sourcePlanId: input.plan.id,
    receivedAt: input.now,
    reviewStartedAt: null,
    status: 'under-review',
    route: input.institution.kind,
    decision: null,
    informationRequest: null,
    payments: [],
    activatedPlanId: null,
    history: [entry(input.ids, 'submitted', input.now, input.actor)],
  };
  const event = type === 'renewal' ? 'renewal-requested' : 'licences-requested';
  return {
    request,
    institution: {
      ...input.institution,
      ...nextMeta(input.institution, input.now),
      history: [
        ...input.institution.history,
        historyEntry({
          id: input.ids.next('history'),
          event,
          at: input.now,
          actor: input.actor,
          visibleTo: ['super_admin'],
          refs: [ref('REQ', id)],
        }),
      ],
    },
    plan:
      type === 'renewal'
        ? {
            ...input.plan,
            ...nextMeta(input.plan, input.now),
            history: [
              ...input.plan.history,
              historyEntry({
                id: input.ids.next('history'),
                event: 'renewal-requested',
                at: input.now,
                actor: input.actor,
                visibleTo: ['tenant_admin', 'super_admin'],
                refs: [ref('REQ', id)],
              }),
            ],
          }
        : input.plan,
  };
}

/**
 * Raise a renewal of the institution's own plan (REQ-25): the request mirrors the plan's
 * experiments, formats, licences and term (T-07; B3-08 f2) — nothing can be changed (REQ-29).
 * Every Institute Admin write is refused while paused (schemas §8-33; INST-13).
 */
export function submitRenewalRequest(
  input: InstituteRequestBase,
): Decision<InstituteRequestOutcome> {
  if (input.institution.pause) return refused('institution-paused');
  const status = accessPlanStatus(input.plan, input.institution, input.now);
  if (status !== 'access-active' && status !== 'ending-soon' && status !== 'access-ended') {
    return invalidState(status);
  }
  // A plan with a fixed end date has no recurring term to mirror; not drawn (T-07).
  if (input.plan.term === 'until-date') return policyOpen('T-07');
  return ok(
    instituteRequest(input, 'renewal', input.plan.items, input.plan.licences, {
      kind: input.plan.term,
    }),
  );
}

export interface AdditionalLicencesInput extends InstituteRequestBase {
  readonly experimentIds: readonly ExperimentId[];
  readonly licences: number | null;
}

/**
 * Raise a more-licences request for experiments already in the plan (REQ-26): "Choose at least
 * one experiment"; whole-number licences; no term, experiments or formats can be added (REQ-30) —
 * formats come from the plan and the term is "Current term" (B1-11 REQ-0040).
 */
export function submitAdditionalLicencesRequest(
  input: AdditionalLicencesInput,
): Decision<InstituteRequestOutcome> {
  if (input.institution.pause) return refused('institution-paused');
  const status = accessPlanStatus(input.plan, input.institution, input.now);
  if (status !== 'access-active') return invalidState(status);
  const inPlan = new Set(input.plan.items.map((item) => item.experimentId));
  const issues = [
    ...(input.experimentIds.length === 0 ? [{ field: 'experimentIds', rule: 'required' }] : []),
    ...(input.experimentIds.some((id) => !inPlan.has(id))
      ? [{ field: 'experimentIds', rule: 'not-in-plan' }]
      : []),
    ...(input.licences === null
      ? [{ field: 'licences', rule: 'required' }]
      : isWholeNumber(input.licences, 1)
        ? []
        : [{ field: 'licences', rule: 'whole-number' }]),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  const chosen = new Set(input.experimentIds);
  return ok(
    instituteRequest(
      input,
      'additional-licences',
      input.plan.items.filter((item) => chosen.has(item.experimentId)),
      input.licences!,
      { kind: 'current-plan' },
    ),
  );
}

export interface ReviewStartedInput {
  readonly request: AccessRequest;
  readonly actor: SystemActorRef<'system:review-start'>;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * The seeded or test-supplied "BITS started reviewing" fact (owner decision AD-14 / P1-04,
 * ADR-0007 §4). No product code path calls this: reading or opening the request changes nothing.
 */
export function recordReviewStarted(input: ReviewStartedInput): Decision<AccessRequest> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:review-start')
    return notPermitted('wrong-workspace');
  if (
    !moved(input.request, 'under-review', 'recordReviewStarted') ||
    input.request.reviewStartedAt
  ) {
    return invalidState(input.request.reviewStartedAt ? 'review-started' : input.request.status);
  }
  return ok({
    ...input.request,
    ...nextMeta(input.request, input.now),
    reviewStartedAt: input.now,
    history: [...input.request.history, entry(input.ids, 'review-started', input.now, input.actor)],
  });
}

/** "Submitted" (requester, before review starts) vs "Under review" (B1-08; B1-13). */
export function requesterSeesSubmitted(request: AccessRequest): boolean {
  return request.status === 'under-review' && request.reviewStartedAt === null;
}

interface DecideBase {
  readonly request: AccessRequest;
  /** The request's institution when it already exists (renewals, more licences, or seeded). */
  readonly institution: Institution | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Before any decision: open, not paused (B1-11 f14; REQ-23); nothing leaves "Information requested". */
function decidable(input: DecideBase): Decision<null> {
  if (input.request.status === 'information-requested') return policyOpen('T-03');
  if (input.request.status !== 'under-review') return invalidState(input.request.status);
  if (input.institution?.pause) return refused('institution-paused');
  return ok(null);
}

export interface MoreInformationInput extends DecideBase {
  readonly reason: string;
}

/** Request more information (REQ-17): keeps the request open; none of the four events happen. */
export function requestMoreInformation(input: MoreInformationInput): Decision<AccessRequest> {
  const open = decidable(input);
  if (!open.ok) return open;
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.request,
    ...nextMeta(input.request, input.now),
    status: 'information-requested',
    informationRequest: { reason, at: input.now, by: input.actor },
    history: [
      ...input.request.history,
      entry(input.ids, 'information-requested', input.now, input.actor, reason),
    ],
  });
}

/** What activation does to the plans: created, nothing yet (payment pending), or open. */
export type PlanEffect =
  | { readonly kind: 'none' }
  | { readonly kind: 'plan-created'; readonly planId: AccessPlanId }
  /** Renewal or more licences, or new access for an existing institution: OD-B3-09 is open, so no
   *  plan record is written (Appendix C M05; §3.18 PaymentOutcomePort). */
  | { readonly kind: 'policy-open'; readonly decision: 'OD-B3-09' };

export interface ApprovalOutcome {
  readonly request: AccessRequest;
  readonly institution: Institution;
  readonly plan: AccessPlan | null;
  readonly planEffect: PlanEffect;
}

export interface ApproveInput extends DecideBase {
  /** "Choose internal or external": required when the institution is new (REQ-12). */
  readonly route: InstitutionKind | null;
  /**
   * The existing institutions whose name is the same as the request's (`institutionIdsNamed`,
   * DP-09). Read only when the request has no institution yet — when approving would create one.
   */
  readonly sameNameInstitutions: readonly InstitutionId[];
}

/**
 * DP-09 interim safeguard (owner, 5 Nov 2026; audit P0-5; P1 register §A): approving a request
 * whose institution does not exist yet creates its record (INST-01), so when an institution of
 * the same name already exists the approval would create a second record of it. Until a request
 * can be matched to an existing institution (Q-A1; SEL-05 unresolved) the decision waits: nothing
 * is written and nothing merges. A request that already has its institution (a renewal, more
 * licences) is never held here.
 */
function wouldDuplicate(input: ApproveInput): Decision<null> {
  if (input.institution === null && input.sameNameInstitutions.length > 0) {
    return policyOpen('SEL-05');
  }
  return ok(null);
}

function resolveRoute(input: ApproveInput): Decision<InstitutionKind> {
  if (input.institution) {
    if (input.route !== null && input.route !== input.institution.kind)
      return refused('route-locked');
    return ok(input.institution.kind);
  }
  if (input.route === null) return invalidInput({ field: 'route', rule: 'required' });
  return ok(input.route);
}

interface ActivationContext {
  readonly request: AccessRequest;
  readonly actor: ActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Activation creates the plan (internal approval, or external payment confirmed) — new access only. */
function activate(
  input: ActivationContext,
  institution: Institution,
  items: readonly RequestedItem[],
  licences: number,
  term: RequestedTerm,
): { plan: AccessPlan; institution: Institution } {
  if (term.kind === 'current-plan') {
    throw new Error('A more-licences request never creates a plan here (OD-B3-09 is open).');
  }
  const startsOn = dateOf(input.now);
  const kind: AccessPlanTerm = term.kind;
  const plan = newAccessPlan({
    id: input.ids.next('accessPlan'),
    institutionId: institution.id,
    fromRequest: input.request.id,
    items,
    licences: provided(licences),
    term: kind,
    startsOn,
    endsOn: termEndsOn(kind, startsOn, term.kind === 'until-date' ? term.endsOn : null),
    actor: input.actor,
    now: input.now,
    ids: input.ids,
  });
  return {
    plan,
    institution: {
      ...institution,
      ...nextMeta(institution, input.now),
      history: [
        ...institution.history,
        historyEntry({
          id: input.ids.next('history'),
          event: 'access-activated',
          at: input.now,
          actor: input.actor,
          visibleTo: ['super_admin'],
          refs: [ref('REQ', input.request.id), ref('ACC', plan.id)],
        }),
      ],
    },
  };
}

function approve(
  input: ApproveInput,
  decision: RequestDecision,
  items: readonly RequestedItem[],
  licences: number,
  term: RequestedTerm,
): Decision<ApprovalOutcome> {
  const route = decision.route;
  const command =
    decision.kind === 'approved-as-requested' ? 'approveRequest' : 'approveSmallerScope';
  const to: RequestStatus = route === 'external' ? 'approved-payment-required' : 'access-active';
  if (!moved(input.request, to, command)) return invalidState(input.request.status);
  const isNew = input.institution === null;
  let institution =
    input.institution ??
    newInstitution({
      id: input.ids.next('institution'),
      name: input.request.institutionName,
      kind: route,
      fromRequest: input.request.id,
      actor: input.actor,
      now: input.now,
      ids: input.ids,
    });
  let plan: AccessPlan | null = null;
  let planEffect: PlanEffect = { kind: 'none' };
  const history = [
    ...input.request.history,
    entry(
      input.ids,
      decision.kind === 'approved-as-requested' ? 'approved' : 'approved-with-changes',
      input.now,
      input.actor,
      decision.kind === 'approved-smaller-scope' ? decision.reason : route,
    ),
  ];
  if (route === 'internal') {
    if (isNew && input.request.type === 'new-access') {
      const activated = activate(input, institution, items, licences, term);
      plan = activated.plan;
      institution = activated.institution;
      planEffect = { kind: 'plan-created', planId: plan.id };
    } else {
      planEffect = { kind: 'policy-open', decision: 'OD-B3-09' };
    }
    history.push(entry(input.ids, 'access-active', input.now, input.actor, plan?.id ?? null));
  }
  return ok({
    request: {
      ...input.request,
      ...nextMeta(input.request, input.now),
      institutionId: institution.id,
      status: to,
      route,
      decision,
      activatedPlanId: plan?.id ?? null,
      history,
    },
    institution,
    plan,
    planEffect,
  });
}

/**
 * Approve request (REQ-13 external · REQ-14 internal; DL-1). External: Approved — payment
 * required; the institution record is created if new, no plan and no access yet. Internal:
 * approval and activation together — the plan is created for a new institution (ACC-01).
 */
export function approveRequest(input: ApproveInput): Decision<ApprovalOutcome> {
  const open = decidable(input);
  if (!open.ok) return open;
  const single = wouldDuplicate(input);
  if (!single.ok) return single;
  const route = resolveRoute(input);
  if (!route.ok) return route;
  return approve(
    input,
    { kind: 'approved-as-requested', at: input.now, by: input.actor, route: route.value },
    input.request.items,
    input.request.licencesRequested,
    input.request.term,
  );
}

export interface SmallerScopeInput extends ApproveInput {
  readonly items: readonly RequestedItem[];
  readonly licences: number | null;
  readonly term: Extract<RequestedTerm, { kind: 'monthly' | 'quarterly' | 'yearly' }> | null;
  readonly reason: string;
}

function sameItems(a: readonly RequestedItem[], b: readonly RequestedItem[]): boolean {
  const key = (items: readonly RequestedItem[]) =>
    items
      .map((item) => `${item.experimentId}:${inDisplayOrder(item.formats).join(',')}`)
      .sort()
      .join('|');
  return key(a) === key(b);
}

/**
 * Approve a smaller scope with a reason "Shown to the requester on their request status."
 * (REQ-15; B1-11): fewer formats per experiment ("Keep at least one format"), a whole number of
 * licences, a Monthly · Quarterly · Yearly term; "Change at least one thing, or choose Approve
 * request". Not on a renewal (REQ-16). Narrowing a multi-experiment request is not drawn (REQ-19
 * OPEN). Licences above the request and formats outside it are not "smaller" [PROPOSED reading].
 */
export function approveSmallerScope(input: SmallerScopeInput): Decision<ApprovalOutcome> {
  const open = decidable(input);
  if (!open.ok) return open;
  const single = wouldDuplicate(input);
  if (!single.ok) return single;
  if (input.request.type === 'renewal') return refused('renewal-scope-not-adjustable');
  const requested = new Map(input.request.items.map((item) => [item.experimentId, item.formats]));
  if (input.request.items.length > 1 && !sameItems(input.items, input.request.items)) {
    return policyOpen('REQ-19');
  }
  const issues: InputIssue[] = [];
  if (
    input.items.length !== input.request.items.length ||
    input.items.some((item) => !requested.has(item.experimentId))
  ) {
    issues.push({ field: 'items', rule: 'same-experiments' });
  }
  if (input.items.some((item) => item.formats.length === 0)) {
    issues.push({ field: 'items', rule: 'keep-one-format' });
  }
  if (
    input.items.some((item) =>
      item.formats.some((format) => !(requested.get(item.experimentId) ?? []).includes(format)),
    )
  ) {
    issues.push({ field: 'items', rule: 'not-requested' });
  }
  if (input.licences === null || !isWholeNumber(input.licences, 1)) {
    issues.push({ field: 'licences', rule: 'whole-number' });
  } else if (input.licences > input.request.licencesRequested) {
    issues.push({ field: 'licences', rule: 'not-smaller' });
  }
  if (input.term === null) issues.push({ field: 'term', rule: 'required' });
  if (isBlank(input.reason)) issues.push({ field: 'reason', rule: 'required' });
  if (
    issues.length === 0 &&
    sameItems(input.items, input.request.items) &&
    input.licences === input.request.licencesRequested &&
    input.term?.kind === input.request.term.kind
  ) {
    issues.push({ field: 'decision', rule: 'change-something' });
  }
  if (issues.length > 0) return invalidInput(...issues);
  const route = resolveRoute(input);
  if (!route.ok) return route;
  const items = input.items.map((item) => ({ ...item, formats: inDisplayOrder(item.formats) }));
  return approve(
    input,
    {
      kind: 'approved-smaller-scope',
      at: input.now,
      by: input.actor,
      route: route.value,
      approvedItems: items,
      approvedLicences: input.licences!,
      approvedTerm: input.term!,
      reason: input.reason.trim(),
    },
    items,
    input.licences!,
    input.term!,
  );
}

export interface StartPaymentInput {
  readonly request: AccessRequest;
  /** The request's institution (created at approval), whose pause holds every payment (DP-08). */
  readonly institution: Institution | null;
  /** The public requester (status page from the sending session) or the institution's own IA. */
  readonly payer: RequesterActorRef | PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * Continue to payment / Try payment again — external route only (REQ-07). Provider-neutral: no
 * amount, method or provider; nothing is paid here (T-05). Paying again while a confirmation is
 * pending is not offered (REQ-08); an internal request never shows a payment step (REQ-09).
 * While the institution is paused no payment starts (DP-08, owner, 5 Nov 2026; PD-B2B-3): the
 * request keeps its status and its payment history, and the payment can start once access is
 * restored.
 */
export function startPayment(input: StartPaymentInput): Decision<AccessRequest> {
  if (!moved(input.request, 'payment-not-confirmed', 'startPayment')) {
    return invalidState(input.request.status);
  }
  if (input.institution?.pause) return refused('institution-paused');
  return ok({
    ...input.request,
    ...nextMeta(input.request, input.now),
    status: 'payment-not-confirmed',
    payments: [
      ...input.request.payments,
      {
        id: input.ids.next('paymentAttempt'),
        startedAt: input.now,
        outcome: 'pending',
        outcomeAt: null,
      },
    ],
    history: [
      ...input.request.history,
      entry(input.ids, 'payment-started', input.now, input.payer),
    ],
  });
}

export interface PaymentOutcomeInput {
  readonly request: AccessRequest;
  readonly outcome: 'confirmed' | 'failed';
  /** The institution created at approval. */
  readonly institution: Institution;
  /** Its existing plans. */
  readonly plans: readonly AccessPlan[];
  readonly actor: SystemActorRef<'system:payment-provider'>;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * The payment outcome — system only (stand-in `PaymentOutcomePort`, test and seed only; T-05).
 * Confirmed for a new external institution: the plan is created and access activates (ACC-02).
 * Confirmed for an existing institution: Access active on the request, institution unchanged,
 * plan effect open (OD-B3-09). Failed: "Try payment again" is offered.
 *
 * While the institution is paused a confirmation is refused (DP-08, owner, 5 Nov 2026; PD-B2B-3):
 * nothing is completed or activated, the attempt stays "Payment not confirmed" and its history is
 * kept, and the same report is accepted once access is restored. A failure is still recorded — it
 * completes and activates nothing. How a real provider's report is reconciled when it arrives
 * during a pause is a production requirement kept apart from this simulated stand-in (A-17, E-10).
 */
export function reportPaymentOutcome(input: PaymentOutcomeInput): Decision<ApprovalOutcome> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:payment-provider')
    return notPermitted('wrong-workspace');
  const command = input.outcome === 'confirmed' ? 'paymentConfirmed' : 'paymentFailed';
  const to: RequestStatus = input.outcome === 'confirmed' ? 'access-active' : 'payment-failed';
  if (!moved(input.request, to, command)) return invalidState(input.request.status);
  if (input.outcome === 'confirmed' && input.institution.pause) {
    return refused('institution-paused');
  }
  const payments = input.request.payments.map((payment, index, all) =>
    index === all.length - 1 && payment.outcome === 'pending'
      ? { ...payment, outcome: input.outcome, outcomeAt: input.now }
      : payment,
  );
  if (input.outcome === 'failed') {
    return ok({
      request: {
        ...input.request,
        ...nextMeta(input.request, input.now),
        status: to,
        payments,
        history: [
          ...input.request.history,
          entry(input.ids, 'payment-not-completed', input.now, input.actor),
        ],
      },
      institution: input.institution,
      plan: null,
      planEffect: { kind: 'none' },
    });
  }
  const own = input.plans.filter((plan) => plan.institutionId === input.institution.id);
  const decision = input.request.decision;
  let institution = input.institution;
  let plan: AccessPlan | null = null;
  let planEffect: PlanEffect = { kind: 'policy-open', decision: 'OD-B3-09' };
  if (own.length === 0 && input.request.type === 'new-access') {
    const items =
      decision?.kind === 'approved-smaller-scope' ? decision.approvedItems : input.request.items;
    const licences =
      decision?.kind === 'approved-smaller-scope'
        ? decision.approvedLicences
        : input.request.licencesRequested;
    const term =
      decision?.kind === 'approved-smaller-scope' ? decision.approvedTerm : input.request.term;
    const activated = activate(
      { request: input.request, actor: input.actor, now: input.now, ids: input.ids },
      institution,
      items,
      licences,
      term,
    );
    institution = activated.institution;
    plan = activated.plan;
    planEffect = { kind: 'plan-created', planId: plan.id };
  }
  return ok({
    request: {
      ...input.request,
      ...nextMeta(input.request, input.now),
      status: to,
      payments,
      activatedPlanId: plan?.id ?? input.request.activatedPlanId,
      history: [
        ...input.request.history,
        entry(input.ids, 'payment-confirmed', input.now, input.actor),
        entry(input.ids, 'access-active', input.now, input.actor, plan?.id ?? null),
      ],
    },
    institution,
    plan,
    planEffect,
  });
}
