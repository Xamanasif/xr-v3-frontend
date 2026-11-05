/**
 * §3.4 AccessRequestService — PU-07…PU-14, IA-17, SA-01 (requests group), SA-02, SA-03.
 *
 * Approval, payment and activation are separate events (BR-036); no decision creates a Student
 * grant (BC9). There is no Declined state and no decline (T-02). "Information requested" has no
 * exit (T-03 → `policy-open`). The requester's "Under review" comes only from the seeded or
 * test-only review-start fact (AD-14 / P1-04) — opening SA-03 changes nothing.
 *
 * PU-10 / PU-12 (owner decision DV-5 / O-05, 14 Oct 2026; ADR-0009): a request's public pages are
 * keyed by its opaque `routeId` — never the reference, never the ticket. The browser session that
 * sent the request holds its ticket (B1-07 "continues from this session"); the adapter reads it from
 * that session, so no port takes or returns the ticket (V-17). Only that session, or the signed-in
 * Institute Admin of the requesting institution (REQ-28; B3-08), reads or pays; anyone else is
 * answered as for any request it may not open.
 *
 * Owner decision, 24 Oct 2026 (ADR-0009 amendment): in a local prototype build the requester's own
 * ticket is kept in this browser, so PU-07 "You have a request in progress" leads back to a request
 * still in progress — `listRequestsInProgress`, which answers only the requests whose ticket this
 * browser session holds for the user session asking (a method added to Appendix C's §3.4,
 * `CONTRACT_ADDITIONS`).
 */
import {
  type AccessPlan,
  type AccessRequest,
  type CalendarDate,
  type Institution,
  type PlanEffect,
} from '@xr/domain';
import {
  calendarDateString,
  emailAsDrawn,
  optionalTrimmed,
  requiredTrimmed,
  wholeNumberString,
} from '@xr/validation';
import { z } from 'zod';

import {
  accessPlanId,
  expectedRev,
  experimentId,
  historyOf,
  ids,
  institutionId,
  isoInstant,
  requestId,
  requestRouteId,
  technology,
} from '../kernel/primitives.js';
import { branded, typedAs } from '../kernel/typed.js';
import { accessPlan, institution, institutionKind } from '../records/institution.js';
import {
  REQUEST_EVENTS,
  requestForDecision,
  requestedItem,
  requestedTerm,
  requestStatus,
  requestType,
} from '../records/request.js';
import type {
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  StaleVersion,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key, requiredChoice, wholeNumberUntrimmed } from './fields.js';

// ---- inputs ----

const requestedTermInput = z.discriminatedUnion(
  'kind',
  [
    z.object({ kind: z.literal('monthly') }),
    z.object({ kind: z.literal('quarterly') }),
    z.object({ kind: z.literal('yearly') }),
    z.object({
      kind: z.literal('until-date'),
      endsOn: branded<CalendarDate>()(
        calendarDateString(key('PU-08.term.endsOn.required'), key('contract.invalid-input')),
      ),
    }),
  ],
  { error: key('PU-08.term.required') },
);

/**
 * PU-08 (B1-07 `reqValidate`). The items come from the Selection, never from the form; nothing is
 * asked about the route, a price or a payment (BR-031).
 */
export const publicRequestInput = z.object({
  institutionName: requiredTrimmed(key('PU-08.institutionName.required')),
  contactPerson: requiredTrimmed(key('PU-08.contactPerson.required')),
  email: emailAsDrawn(key('PU-08.email.required'), key('PU-08.email.format')),
  phone: optionalTrimmed(),
  licencesRequested: wholeNumberString(
    key('PU-08.licencesRequested.required'),
    key('PU-08.licencesRequested.whole-number'),
  ),
  message: optionalTrimmed(),
  term: requiredChoice(requestedTermInput, key('PU-08.term.required')),
});

/**
 * "Continue to payment" / "Try payment again" on PU-12 (B1-08; REQ-07). The request is named by its
 * public address; who pays is resolved from the session — the sending browser session by its ticket,
 * or the requesting institution's Institute Admin ("Open the payment page", B3-08) — never from the
 * input (O-05; ADR-0009).
 */
export const startPaymentInput = z.object({ request: ids.in.requestRoute, expectedRev });

/** IA-17 renewal: the term is mirrored from the plan, never asked (T-07). */
export const renewalRequestInput = z.object({
  planId: ids.in.accessPlan,
  message: optionalTrimmed(),
});

/** IA-17 more licences (B3-08): no term is asked — "Current term". */
export const additionalLicencesRequestInput = z.object({
  planId: ids.in.accessPlan,
  experimentIds: z
    .array(ids.in.experiment, { error: key('contract.invalid-input') })
    .min(1, { error: key('IA-17.experimentIds.required') }),
  licences: wholeNumberString(key('IA-17.licences.required'), key('IA-17.licences.whole-number')),
  message: optionalTrimmed(),
});

/** SA-02 (B1-10): no Declined filter (T-02); the order is named by the caller. */
export const listRequestsInput = z.object({
  status: requestStatus.optional(),
  type: requestType.optional(),
  route: z.union([institutionKind, z.literal('not-set')]).optional(),
  search: z.string().optional(),
  sort: z.enum(['received-newest', 'received-oldest'], { error: key('contract.invalid-input') }),
});

/** `route` is `null` when the institution's route is already set; required otherwise (REQ-12). */
export const approveRequestInput = z.object({
  id: ids.in.request,
  route: institutionKind.nullable(),
  expectedRev,
});

const requestedItemInput = z.object({
  experimentId: ids.in.experiment,
  formats: z.array(technology),
});

/**
 * SA-03 "Approve smaller scope" (B1-11 `validate`): licences are checked exactly as drawn — the
 * value as typed, not trimmed. "Keep at least one format" and "Change at least one thing" need the
 * request and are decided by the domain.
 */
export const approveSmallerScopeInput = z.object({
  id: ids.in.request,
  route: institutionKind.nullable(),
  items: z.array(requestedItemInput, { error: key('contract.invalid-input') }),
  licences: wholeNumberUntrimmed(key('SA-03.licences.whole-number')),
  term: z.enum(['monthly', 'quarterly', 'yearly'], { error: key('SA-03.term.required') }),
  reason: requiredTrimmed(key('SA-03.reason.required')),
  expectedRev,
});

export const requestMoreInformationInput = z.object({
  id: ids.in.request,
  reason: requiredTrimmed(key('SA-03.informationReason.required')),
  expectedRev,
});

// ---- outputs ----

/**
 * PU-09 "Request sent": the reference to quote, and the address of the status page. The ticket stays
 * with the browser session that sent it (B1-07; V-17) — it is not answered here.
 */
export const submitPublicRequestOutput = z.object({
  reference: requestId,
  routeId: requestRouteId,
});

export const requestRow = z.object({
  id: requestId,
  institutionName: z.string().min(1),
  contactPerson: z.string().min(1),
  type: requestType,
  route: institutionKind.nullable(),
  firstItem: requestedItem.nullable(),
  itemCount: z.number().int().min(0),
  receivedAt: isoInstant,
  status: requestStatus,
});

/** PU-10 / PU-13 / IA-17 detail. Canonical states and facts only — no words. */
export const requesterRequestView = z.object({
  reference: requestId,
  /** The request's public address (`/requests/[requestId]`, O-05): names it, opens nothing. */
  routeId: requestRouteId,
  /** The request's `rev`, so the requester can send `expectedRev` with "Continue to payment" —
   *  a PROVISIONAL engineering field Appendix C's view lacks (provisional register). */
  rev: z.number().int().min(1),
  institutionName: z.string().min(1),
  status: requestStatus,
  /** "BITS started reviewing" — a seeded or test-only fact (AD-14), never set by a read. */
  reviewStarted: z.boolean(),
  updatedAt: isoInstant,
  asked: z.object({
    items: z.array(requestedItem),
    licences: z.number().int().min(1),
    term: requestedTerm,
  }),
  approved: z
    .object({
      items: z.array(requestedItem),
      licences: z.number().int().min(1),
      term: requestedTerm,
      changed: z.array(z.enum(['items', 'licences', 'term'])),
    })
    .nullable(),
  whatBitsAsked: z.string().nullable(),
  whyItChanged: z.string().nullable(),
  /**
   * The requester's own message as sent (PU-08 "Message", IA-17's forms), or `null` — B3-08 f4
   * "Message to BITS" (provisional register PC-50; Appendix C's view lacks it).
   */
  message: z.string().nullable(),
  nextStep: z.enum(['none', 'continue-to-payment', 'check-again', 'try-payment-again', 'sign-in']),
  activatedPlanId: accessPlanId.nullable(),
  history: historyOf(REQUEST_EVENTS),
});

/** SA-03. */
export const decisionPage = z.object({
  request: requestForDecision,
  publishedFormats: z.record(experimentId, z.array(technology)),
  existingAccess: z
    .object({ institutionId, plans: z.array(accessPlan), paused: z.boolean() })
    .nullable(),
  /** Set at the first approval; later requests show it read-only (REQ-24). */
  routeCommitted: institutionKind.nullable(),
  /**
   * DP-09 interim safeguard (owner, 5 Nov 2026): the existing institutions whose name is the same
   * as the request's while the request has no institution yet. Approving would create a second
   * record of one of them, so `approveRequest` / `approveSmallerScope` answer `policy-open` SEL-05
   * until a request can be matched to an existing institution (Q-A1). Empty otherwise.
   */
  sameNameInstitutions: z.array(
    z.object({ institutionId, name: z.string().min(1), kind: institutionKind }),
  ),
  whereItStands: z.object({
    institutionRecord: z.enum(['not-created', 'created']),
    request: requestStatus,
    payment: z.enum(['not-needed', 'waiting', 'confirmed', 'failed']),
    institutionalAccess: z.enum(['not-active', 'active']),
  }),
});

/**
 * What a decision did to the access plans (WP-0.9 `PlanEffect`). A renewal, more licences or new
 * access for an existing institution reached OD-B3-09: no plan is written until the owner decides
 * (T-07, T-08). Appendix C's `'none-until-payment'` is `{ kind: 'none' }` with the request status
 * "Approved — payment required".
 */
export const planEffect = typedAs<PlanEffect>()(
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({ kind: z.literal('plan-created'), planId: accessPlanId }),
    z.object({ kind: z.literal('policy-open'), decision: z.literal('OD-B3-09') }),
  ]),
);

export const decisionOutcome = z.object({
  request: requestForDecision,
  institution: institution.nullable(),
  plan: accessPlan.nullable(),
  planEffect,
});

export const submitInstituteRequestOutput = z.object({ reference: requestId });
export const listRequestRowsOutput = z.array(requestRow);

/**
 * PU-07 "You have a request in progress" (owner decision, 24 Oct 2026; ADR-0009 amendment): a
 * request still in progress whose ticket this browser session holds — named by its institution,
 * with its address (`/requests/[requestId]`, which opens nothing by itself). Nothing else of it.
 */
export const requestInProgressRow = z.object({
  routeId: requestRouteId,
  institutionName: z.string().min(1),
});
export const listRequestsInProgressOutput = z.array(requestInProgressRow);

export type PublicRequestInput = In<typeof publicRequestInput>;
export type RequestRow = Out<typeof requestRow>;
export type RequesterRequestView = Out<typeof requesterRequestView>;
export type RequestInProgressRow = Out<typeof requestInProgressRow>;
export type DecisionPage = Out<typeof decisionPage>;
/** `requestForDecision`: the request record without the requester's ticket (PC-34). */
export type RequestForDecision = Omit<AccessRequest, 'statusToken'>;

export interface DecisionOutcome {
  readonly request: RequestForDecision;
  readonly institution: Institution | null;
  readonly plan: AccessPlan | null;
  readonly planEffect: PlanEffect;
}

/** Appendix C `DecisionErrors`, with ADR-0008's `not-signed-in` and `unavailable`. */
export type DecisionErrors =
  | ValidationFailed
  | NotSignedIn
  | NotPermitted
  | NotFound
  | InvalidState
  | StaleVersion
  | Refused<'institution-paused'>
  | PolicyOpen
  | Unavailable;

export interface AccessRequestService {
  // Public requester (no account)
  submitPublicRequest(
    input: PublicRequestInput,
  ): Answer<
    Out<typeof submitPublicRequestOutput>,
    ValidationFailed | Refused<'selection-empty'> | Unavailable
  >;
  /**
   * PU-10 / PU-13 by the request's address (O-05; ADR-0009): shown to the browser session holding
   * its ticket for the user session that sent it (REQ-04) or to the signed-in Institute Admin of
   * the requesting institution (REQ-28). The reference alone opens nothing; anyone else is answered
   * exactly as an address that names nothing — `not-found` — and learns not even that the request
   * exists (REQ-05; the owner's not-found treatment).
   */
  getRequestStatus(
    id: In<typeof ids.in.requestRoute>,
  ): Answer<RequesterRequestView, NotFound | Unavailable>;
  /**
   * PU-12 "Continue to payment" (REQ-07). The payer is whoever may open the request (O-05;
   * ADR-0009): the browser session holding its ticket for the user session that sent it, or the
   * requesting institution's signed-in Institute Admin. Anyone else is `not-found`, as for an
   * address that names nothing. Never `not-signed-in`: a visitor needs no account (T-01).
   */
  startPayment(
    input: In<typeof startPaymentInput>,
  ): Answer<
    RequesterRequestView,
    NotPermitted | NotFound | InvalidState | StaleVersion | Unavailable
  >;
  /**
   * PU-07 "You have a request in progress" (owner decision, 24 Oct 2026; ADR-0009 amendment): the
   * requests still in progress — Submitted or Under review, Information requested, Approved with
   * payment required, Payment not confirmed or failed — whose ticket this browser session holds for
   * the user session asking (REQ-04), newest first. Nothing else is listed: no lookup by reference
   * or institution, no request of anyone else, not the Institute Admin's (IA-17 lists those). Never
   * `not-signed-in`: a visitor needs no account (T-01).
   */
  listRequestsInProgress(): Answer<readonly RequestInProgressRow[], Unavailable>;
  // Institute Admin
  listInstitutionRequests(): Answer<
    readonly RequestRow[],
    NotSignedIn | NotPermitted | Unavailable
  >;
  getInstitutionRequest(
    id: In<typeof ids.in.request>,
  ): Answer<RequesterRequestView, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** Policy-open: T-07 (renewing an until-date plan). */
  submitRenewalRequest(
    input: In<typeof renewalRequestInput>,
  ): Answer<
    Out<typeof submitInstituteRequestOutput>,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'institution-paused'>
    | PolicyOpen
    | Unavailable
  >;
  submitAdditionalLicencesRequest(
    input: In<typeof additionalLicencesRequestInput>,
  ): Answer<
    Out<typeof submitInstituteRequestOutput>,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'institution-paused'>
    | Unavailable
  >;
  // Super Admin
  listRequests(
    filter: In<typeof listRequestsInput>,
  ): Answer<readonly RequestRow[], NotSignedIn | NotPermitted | Unavailable>;
  getRequestForDecision(
    id: In<typeof ids.in.request>,
  ): Answer<DecisionPage, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** Policy-open: T-03 (deciding after "Information requested"). */
  approveRequest(
    input: In<typeof approveRequestInput>,
  ): Answer<DecisionOutcome, DecisionErrors | Refused<'route-locked'>>;
  /** Policy-open: REQ-19 (narrowing a multi-experiment request), T-03. */
  approveSmallerScope(
    input: In<typeof approveSmallerScopeInput>,
  ): Answer<
    DecisionOutcome,
    DecisionErrors | Refused<'route-locked' | 'renewal-scope-not-adjustable'>
  >;
  /** Policy-open: T-03. */
  requestMoreInformation(
    input: In<typeof requestMoreInformationInput>,
  ): Answer<DecisionOutcome, DecisionErrors>;
}
