/**
 * §3.4 AccessRequestService (PU-07 … PU-14, IA-17, SA-01 … SA-03; M03; Flow A).
 *
 * Approval, payment and activation stay separate events (BR-036); no decision creates a Student
 * grant (BC9); there is no decline (T-02); "Information requested" has no exit (T-03). Opening
 * SA-03 changes nothing: "BITS started reviewing" is a seeded or test-only fact (AD-14 / P1-04).
 * The payment outcome comes only from the test/seed stand-in (TE-4) — no product path confirms
 * a payment.
 */
import {
  type AccessRequestService,
  additionalLicencesRequestInput,
  approveRequestInput,
  approveSmallerScopeInput,
  type DecisionOutcome,
  type DecisionPage,
  listRequestsInput,
  publicRequestInput,
  renewalRequestInput,
  type RequesterRequestView,
  requestMoreInformationInput,
  type RequestRow,
  startPaymentInput,
} from '@xr/contracts/draft';
import {
  type AccessRequest,
  approveRequest,
  approveSmallerScope,
  EMPTY_SELECTION,
  type Institution,
  institutionStatus,
  inDisplayOrder,
  type PersonActorRef,
  publishedFormats,
  type RequestedItem,
  requestMoreInformation,
  startPayment,
  submitAdditionalLicencesRequest,
  submitPublicRequest,
  submitRenewalRequest,
  type Technology,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { command, type Op, read } from '../pipeline/runner.js';
import { plansOf } from '../world/queries.js';
import { values } from '../world/records.js';
import type { WorldRecords } from '../world/types.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

function sameItems(a: readonly RequestedItem[], b: readonly RequestedItem[]): boolean {
  const key = (items: readonly RequestedItem[]) =>
    items
      .map((item) => `${item.experimentId}:${inDisplayOrder(item.formats).join(',')}`)
      .sort()
      .join('|');
  return key(a) === key(b);
}

/** PU-10 / PU-13 / IA-17: canonical states and facts only. */
export function requesterView(request: AccessRequest): RequesterRequestView {
  const decision = request.decision;
  const approved =
    decision === null
      ? null
      : decision.kind === 'approved-as-requested'
        ? {
            items: request.items,
            licences: request.licencesRequested,
            term: request.term,
            changed: [],
          }
        : {
            items: decision.approvedItems,
            licences: decision.approvedLicences,
            term: decision.approvedTerm,
            changed: [
              ...(sameItems(decision.approvedItems, request.items) ? [] : ['items' as const]),
              ...(decision.approvedLicences === request.licencesRequested
                ? []
                : ['licences' as const]),
              ...(decision.approvedTerm.kind === request.term.kind ? [] : ['term' as const]),
            ],
          };
  const nextStep: RequesterRequestView['nextStep'] =
    request.status === 'approved-payment-required'
      ? 'continue-to-payment'
      : request.status === 'payment-not-confirmed'
        ? 'check-again'
        : request.status === 'payment-failed'
          ? 'try-payment-again'
          : request.status === 'access-active'
            ? 'sign-in'
            : 'none';
  return {
    reference: request.id,
    rev: request.rev,
    institutionName: request.institutionName,
    status: request.status,
    reviewStarted: request.reviewStartedAt !== null,
    updatedAt: request.updatedAt,
    asked: { items: request.items, licences: request.licencesRequested, term: request.term },
    approved,
    whatBitsAsked: request.informationRequest?.reason ?? null,
    whyItChanged: decision?.kind === 'approved-smaller-scope' ? decision.reason : null,
    nextStep,
    activatedPlanId: request.activatedPlanId,
    history: request.history,
  };
}

function requestRow(request: AccessRequest): RequestRow {
  return {
    id: request.id,
    institutionName: request.institutionName,
    contactPerson: request.contact.person,
    type: request.type,
    route: request.route,
    firstItem: request.items[0] ?? null,
    itemCount: request.items.length,
    receivedAt: request.receivedAt,
    status: request.status,
  };
}

function newestFirst(a: AccessRequest, b: AccessRequest): number {
  return a.receivedAt === b.receivedAt ? 0 : a.receivedAt < b.receivedAt ? 1 : -1;
}

/** SA-03: the request, the published formats now, the existing access and where it stands. */
function decisionPage(op: Op, request: AccessRequest): DecisionPage {
  const records = op.records;
  const institution = request.institutionId
    ? (records.institutions[request.institutionId] ?? null)
    : null;
  const published: Record<string, Technology[]> = {};
  for (const item of request.items) {
    const experiment = records.experiments[item.experimentId];
    published[item.experimentId] = experiment ? [...publishedFormats(experiment)] : [];
  }
  const plans = institution ? plansOf(records, institution.id) : [];
  const status = institution ? institutionStatus(institution, plans, op.now) : null;
  const route = request.route ?? institution?.kind ?? null;
  return {
    request,
    publishedFormats: published,
    existingAccess: institution
      ? { institutionId: institution.id, plans, paused: institution.pause !== null }
      : null,
    routeCommitted: institution?.kind ?? null,
    whereItStands: {
      institutionRecord: institution ? 'created' : 'not-created',
      request: request.status,
      payment:
        route === 'internal'
          ? 'not-needed'
          : request.status === 'access-active'
            ? 'confirmed'
            : request.status === 'payment-failed'
              ? 'failed'
              : 'waiting',
      institutionalAccess:
        status === 'access-active' || status === 'ending-soon' ? 'active' : 'not-active',
    },
  };
}

function institutionOf(records: WorldRecords, request: AccessRequest): Institution | null {
  return request.institutionId ? (records.institutions[request.institutionId] ?? null) : null;
}

function requestByToken(records: WorldRecords, token: string): AccessRequest | undefined {
  return values(records.requests).find((request) => request.statusToken === token);
}

export function accessRequestPort(call: Call): AccessRequestService {
  return {
    // ── Public requester (no account) ─────────────────────────────────────────────────────
    submitPublicRequest: (input) =>
      command(call, 'AccessRequestService.submitPublicRequest', (op) => {
        const browser = call.context.browser;
        const visitor = op.visitor();
        op.allow(visitor, 'request.submit-public', {
          kind: 'selection',
          selection: browser.selection,
        });
        const form = op.parse(publicRequestInput, input);
        const { request } = op.decide(
          submitPublicRequest({
            selection: browser.selection,
            form: {
              institutionName: form.institutionName,
              contactPerson: form.contactPerson,
              contactEmail: form.email,
              contactPhone: form.phone,
              licences: form.licencesRequested,
              term: form.term,
              message: form.message,
            },
            publishedFormatsOf: (experimentId) => {
              const experiment = op.records.experiments[experimentId];
              return experiment ? publishedFormats(experiment) : null;
            },
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('requests', request.id, request);
        return {
          value: { reference: request.id, statusToken: request.statusToken },
          decision: 'submitPublicRequest',
          actor: { kind: 'requester', name: request.contact.person },
          after: () => {
            // "Your selection was sent with this request, so it is empty again." (B1-07)
            browser.selection = EMPTY_SELECTION;
            browser.holdTicket(request.statusToken);
          },
        };
      }),

    getRequestStatus: (token) =>
      read(call, 'AccessRequestService.getRequestStatus', (op) => {
        const request = op.found(requestByToken(op.records, op.idText(token)));
        op.see(op.visitor(), { kind: 'request', request });
        return requesterView(request);
      }),

    startPayment: (input) =>
      command(call, 'AccessRequestService.startPayment', (op) => {
        const raw = input as { readonly by?: unknown };
        if (raw?.by === 'institute-admin') {
          const person = op.person();
          const request = op.found(op.records.requests[op.idText(field(input, 'requestId'))]);
          op.allow(person, 'request.start-payment', {
            kind: 'request',
            request,
            institution: institutionOf(op.records, request),
          });
          const accepted = op.parse(startPaymentInput, input);
          if (accepted.by !== 'institute-admin') throw new Error('unreachable');
          op.rev(request, accepted.expectedRev);
          const next = op.decide(
            startPayment({ request, payer: person.ref, now: op.now, ids: op.ids }),
            input,
          );
          op.tx.put('requests', next.id, next);
          return { value: requesterView(next), decision: 'startPayment', actor: person.ref };
        }
        const visitor = op.visitor();
        const request = op.found(requestByToken(op.records, op.idText(field(input, 'token'))));
        op.allow(visitor, 'request.start-payment', {
          kind: 'request',
          request,
          institution: institutionOf(op.records, request),
        });
        const accepted = op.parse(startPaymentInput, input);
        if (accepted.by !== 'status-token') throw new Error('unreachable');
        op.rev(request, accepted.expectedRev);
        const payer = { kind: 'requester' as const, name: request.contact.person };
        const next = op.decide(startPayment({ request, payer, now: op.now, ids: op.ids }), input);
        op.tx.put('requests', next.id, next);
        return { value: requesterView(next), decision: 'startPayment', actor: payer };
      }),

    // ── Institute Admin (IA-17) ────────────────────────────────────────────────────────────
    listInstitutionRequests: () =>
      read(call, 'AccessRequestService.listInstitutionRequests', (op) => {
        const person = op.person();
        return values(op.records.requests)
          .filter((request) => request.institutionId === person.institutionId)
          .filter((request) => op.canSee(person, { kind: 'request', request }))
          .sort(newestFirst)
          .map(requestRow);
      }),

    getInstitutionRequest: (id) =>
      read(call, 'AccessRequestService.getInstitutionRequest', (op) => {
        const person = op.person();
        const request = op.found(op.records.requests[op.idText(id)]);
        op.see(person, { kind: 'request', request });
        return requesterView(request);
      }),

    submitRenewalRequest: (input) =>
      command(call, 'AccessRequestService.submitRenewalRequest', (op) => {
        const person = op.person();
        const planId = op.idText((input as { planId?: unknown } | null)?.planId);
        const plan = op.found(op.records.plans[planId]);
        const institution = op.found(op.records.institutions[plan.institutionId]);
        op.allow(person, 'request.submit-renewal', { kind: 'plan', plan, institution });
        const accepted = op.parse(renewalRequestInput, input);
        const outcome = op.decide(
          submitRenewalRequest({
            institution,
            plan,
            message: accepted.message,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('requests', outcome.request.id, outcome.request);
        op.tx.put('institutions', outcome.institution.id, outcome.institution);
        op.tx.put('plans', outcome.plan.id, outcome.plan);
        return {
          value: { reference: outcome.request.id },
          decision: 'submitRenewalRequest',
          actor: person.ref,
        };
      }),

    submitAdditionalLicencesRequest: (input) =>
      command(call, 'AccessRequestService.submitAdditionalLicencesRequest', (op) => {
        const person = op.person();
        const planId = op.idText((input as { planId?: unknown } | null)?.planId);
        const plan = op.found(op.records.plans[planId]);
        const institution = op.found(op.records.institutions[plan.institutionId]);
        op.allow(person, 'request.submit-additional-licences', { kind: 'plan', plan, institution });
        const accepted = op.parse(additionalLicencesRequestInput, input);
        const outcome = op.decide(
          submitAdditionalLicencesRequest({
            institution,
            plan,
            experimentIds: accepted.experimentIds,
            licences: accepted.licences,
            message: accepted.message,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('requests', outcome.request.id, outcome.request);
        op.tx.put('institutions', outcome.institution.id, outcome.institution);
        op.tx.put('plans', outcome.plan.id, outcome.plan);
        return {
          value: { reference: outcome.request.id },
          decision: 'submitAdditionalLicencesRequest',
          actor: person.ref,
        };
      }),

    // ── Super Admin (SA-01 … SA-03) ────────────────────────────────────────────────────────
    listRequests: (filter) =>
      read(call, 'AccessRequestService.listRequests', (op) => {
        const person = op.person();
        const accepted = op.parse(listRequestsInput, filter);
        const search = accepted.search?.trim().toLowerCase() ?? '';
        const rows = values(op.records.requests)
          .filter((request) => op.canSee(person, { kind: 'request', request }))
          .filter((request) => !accepted.status || request.status === accepted.status)
          .filter((request) => !accepted.type || request.type === accepted.type)
          .filter(
            (request) =>
              !accepted.route ||
              (accepted.route === 'not-set'
                ? request.route === null
                : request.route === accepted.route),
          )
          .filter(
            (request) =>
              search === '' ||
              [request.id, request.institutionName, request.contact.person].some((field) =>
                field.toLowerCase().includes(search),
              ),
          )
          .sort(newestFirst);
        if (accepted.sort === 'received-oldest') rows.reverse();
        return rows.map(requestRow);
      }),

    getRequestForDecision: (id) =>
      read(call, 'AccessRequestService.getRequestForDecision', (op) => {
        const person = op.person();
        const request = op.found(op.records.requests[op.idText(id)]);
        op.see(person, { kind: 'request', request });
        // Opening SA-03 never starts review (AD-14 / P1-04): this read writes nothing.
        return decisionPage(op, request);
      }),

    approveRequest: (input) =>
      command(call, 'AccessRequestService.approveRequest', (op) => {
        const person = op.person();
        const request = op.found(
          op.records.requests[op.idText((input as { id?: unknown } | null)?.id)],
        );
        const institution = institutionOf(op.records, request);
        op.allow(person, 'request.approve', { kind: 'request', request, institution });
        // Choosing the route applies only to a new institution's first request (REQ-12).
        if (institution === null)
          op.allow(person, 'request.set-route', { kind: 'request', request, institution });
        const accepted = op.parse(approveRequestInput, input);
        op.rev(request, accepted.expectedRev);
        const outcome = op.decide(
          approveRequest({
            request,
            institution,
            route: accepted.route,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        return decided(op, outcome, 'approveRequest', person.ref);
      }),

    approveSmallerScope: (input) =>
      command(call, 'AccessRequestService.approveSmallerScope', (op) => {
        const person = op.person();
        const request = op.found(
          op.records.requests[op.idText((input as { id?: unknown } | null)?.id)],
        );
        const institution = institutionOf(op.records, request);
        op.allow(person, 'request.approve-smaller-scope', {
          kind: 'request',
          request,
          institution,
        });
        if (institution === null)
          op.allow(person, 'request.set-route', { kind: 'request', request, institution });
        const accepted = op.parse(approveSmallerScopeInput, input);
        op.rev(request, accepted.expectedRev);
        const outcome = op.decide(
          approveSmallerScope({
            request,
            institution,
            route: accepted.route,
            items: accepted.items,
            licences: accepted.licences,
            term: { kind: accepted.term },
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        return decided(op, outcome, 'approveSmallerScope', person.ref);
      }),

    requestMoreInformation: (input) =>
      command(call, 'AccessRequestService.requestMoreInformation', (op) => {
        const person = op.person();
        const request = op.found(
          op.records.requests[op.idText((input as { id?: unknown } | null)?.id)],
        );
        const institution = institutionOf(op.records, request);
        op.allow(person, 'request.request-information', { kind: 'request', request, institution });
        const accepted = op.parse(requestMoreInformationInput, input);
        op.rev(request, accepted.expectedRev);
        const next = op.decide(
          requestMoreInformation({
            request,
            institution,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('requests', next.id, next);
        const value: DecisionOutcome = {
          request: next,
          institution,
          plan: null,
          planEffect: { kind: 'none' },
        };
        return { value, decision: 'requestMoreInformation', actor: person.ref };
      }),
  };
}

/** Stages an approval's records: the request, the institution (created at the first approval) and any plan. */
function decided(
  op: Op,
  outcome: DecisionOutcome,
  decision: 'approveRequest' | 'approveSmallerScope',
  actor: PersonActorRef,
) {
  op.tx.put('requests', outcome.request.id, outcome.request);
  if (outcome.institution) op.tx.put('institutions', outcome.institution.id, outcome.institution);
  if (outcome.plan) op.tx.put('plans', outcome.plan.id, outcome.plan);
  return { value: outcome, decision, actor };
}
