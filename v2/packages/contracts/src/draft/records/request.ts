/**
 * M03 Access request (REQ) + payment attempt, M04 Selection (Appendix C §2) as output schemas.
 * No Declined state and no decline command exist (T-02); nothing leaves "Information requested"
 * (T-03). The requester's "Under review" comes from the seeded or test-only review-start fact,
 * never from opening a screen (owner decision AD-14 / P1-04, 12 Oct 2026).
 */
import {
  type AccessRequest,
  type PaymentAttempt,
  REQUEST_STATUSES,
  type RequestContact,
  type RequestDecision,
  type RequestEvent,
  type RequestOrigin,
  type RequestType,
  type RequestedItem,
  type RequestedTerm,
  type Selection,
  type SelectionItem,
} from '@xr/domain';
import { z } from 'zod';

import {
  accessPlanId,
  actorRef,
  calendarDate,
  experimentId,
  historyOf,
  institutionId,
  isoInstant,
  paymentAttemptId,
  recordMeta,
  requestId,
  requestRouteId,
  requestStatusToken,
  technology,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';
import { institutionKind } from './institution.js';

export const REQUEST_TYPES = vocabulary<RequestType>()([
  'new-access',
  'additional-licences',
  'renewal',
]);
export const REQUEST_ORIGINS = vocabulary<RequestOrigin>()(['public', 'institute-admin']);
export const REQUEST_EVENTS = vocabulary<RequestEvent>()([
  'submitted',
  'review-started',
  'information-requested',
  'approved',
  'approved-with-changes',
  'payment-started',
  'payment-not-completed',
  'payment-confirmed',
  'access-active',
]);

export const requestType = z.enum(REQUEST_TYPES);
export const requestOrigin = z.enum(REQUEST_ORIGINS);
export const requestStatus = z.enum(REQUEST_STATUSES);

const monthly = z.object({ kind: z.literal('monthly') });
const quarterly = z.object({ kind: z.literal('quarterly') });
const yearly = z.object({ kind: z.literal('yearly') });

/** B1-07 term options; 'current-plan' is the additional-licences "Current term" (B1-11 REQ-0040). */
export const requestedTerm = typedAs<RequestedTerm>()(
  z.discriminatedUnion('kind', [
    monthly,
    quarterly,
    yearly,
    z.object({ kind: z.literal('until-date'), endsOn: calendarDate }),
    z.object({ kind: z.literal('current-plan') }),
  ]),
);

export const requestedItem = typedAs<RequestedItem>()(
  z.object({ experimentId, formats: z.array(technology).min(1) }),
);

export const requestContact = typedAs<RequestContact>()(
  z.object({ person: z.string().min(1), email: z.string().min(1), phone: z.string().nullable() }),
);

export const requestDecision = typedAs<RequestDecision>()(
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('approved-as-requested'),
      at: isoInstant,
      by: actorRef,
      route: institutionKind,
    }),
    z.object({
      kind: z.literal('approved-smaller-scope'),
      at: isoInstant,
      by: actorRef,
      route: institutionKind,
      approvedItems: z.array(requestedItem),
      approvedLicences: z.number().int().min(1),
      approvedTerm: z.discriminatedUnion('kind', [monthly, quarterly, yearly]),
      reason: z.string().min(1),
    }),
  ]),
);

/** Provider-neutral: no amount, method, provider or refund (T-05). */
export const paymentAttempt = typedAs<PaymentAttempt>()(
  z.object({
    id: paymentAttemptId,
    startedAt: isoInstant,
    outcome: z.enum(['pending', 'confirmed', 'failed']),
    outcomeAt: isoInstant.nullable(),
  }),
);

const accessRequestObject = z.object({
  ...recordMeta,
  id: requestId,
  statusToken: requestStatusToken,
  routeId: requestRouteId,
  type: requestType,
  origin: requestOrigin,
  institutionId: institutionId.nullable(),
  institutionName: z.string().min(1),
  contact: requestContact,
  items: z.array(requestedItem),
  licencesRequested: z.number().int().min(1),
  term: requestedTerm,
  message: z.string().nullable(),
  sourcePlanId: accessPlanId.nullable(),
  receivedAt: isoInstant,
  reviewStartedAt: isoInstant.nullable(),
  status: requestStatus,
  route: institutionKind.nullable(),
  decision: requestDecision.nullable(),
  informationRequest: z
    .object({ reason: z.string().min(1), at: isoInstant, by: actorRef })
    .nullable(),
  payments: z.array(paymentAttempt),
  activatedPlanId: accessPlanId.nullable(),
  history: historyOf(REQUEST_EVENTS),
});

export const accessRequest = typedAs<AccessRequest>()(accessRequestObject);

/**
 * The request record as the Super Admin's decision page and every decision receipt carry it: all
 * of it but the requester's ticket, which never leaves the adapter (PC-34; ADR-0009).
 */
export const requestForDecision = typedAs<Omit<AccessRequest, 'statusToken'>>()(
  accessRequestObject.omit({ statusToken: true }),
);

export const selectionItem = typedAs<SelectionItem>()(
  z.object({ experimentId, formats: z.array(technology).min(1), addedAt: isoInstant }),
);

/**
 * M04: the visitor's browser-session Selection — not a world record (B1-06). `lastRemovedAt` is the
 * position Undo puts the removed item back to (B1-06 `undo`; PC-35).
 */
export const selection = typedAs<Selection>()(
  z.object({
    items: z.array(selectionItem),
    lastRemoved: selectionItem.nullable(),
    lastRemovedAt: z.number().int().min(0).nullable(),
  }),
);
