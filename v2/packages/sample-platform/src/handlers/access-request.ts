/**
 * §3.4 AccessRequestService (PU-07 … PU-14, IA-17, SA-01 … SA-03; M03; Flow A).
 *
 * Approval, payment and activation stay separate events (BR-036); no decision creates a Student
 * grant (BC9); there is no decline (T-02); "Information requested" has no exit (T-03). Opening
 * SA-03 changes nothing: "BITS started reviewing" is a seeded or test-only fact (AD-14 / P1-04).
 * The payment outcome comes only from the sample payment provider stand-in (TE-4): in a local
 * prototype build it confirms the payment "Continue to payment" started, as its own system event;
 * no person confirms or marks a payment, and nothing is collected.
 *
 * PU-10 / PU-12 (DV-5 / O-05; ADR-0009): a request's public pages are found by its opaque address
 * (`routeId`), and shown only to the browser session holding its ticket (REQ-04) or to the
 * signed-in Institute Admin of the requesting institution (REQ-28). The ticket never crosses a
 * port: the session holds it, and this adapter reads it from there. In a local prototype build the
 * visitor's own ticket is also kept in this browser (owner decision, 24 Oct 2026; ADR-0009
 * amendment), and PU-07 lists the requests in progress it holds tickets for — nothing else.
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
  type ApprovalOutcome,
  EMPTY_SELECTION,
  type Institution,
  institutionStatus,
  inDisplayOrder,
  type PersonActorRef,
  publishedFormats,
  type RecordRef,
  type RequesterActorRef,
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
import { ticketHolder } from '../session/browser-session.js';
import { forDecision } from './decision-view.js';
import { reportPayment } from './payment-provider.js';
import { plansOf, sameNameInstitutionsOf } from '../world/queries.js';
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

/**
 * PU-10 / PU-13 / IA-17: canonical states and facts only. While the request's institution is paused
 * no payment step is offered (DP-08): "Continue to payment" and "Try payment again" become `none`,
 * so PU-12 opens the request status instead; the status and its history are unchanged.
 */
export function requesterView(request: AccessRequest, paused = false): RequesterRequestView {
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
      ? paused
        ? 'none'
        : 'continue-to-payment'
      : request.status === 'payment-not-confirmed'
        ? 'check-again'
        : request.status === 'payment-failed'
          ? paused
            ? 'none'
            : 'try-payment-again'
          : request.status === 'access-active'
            ? 'sign-in'
            : 'none';
  return {
    reference: request.id,
    routeId: request.routeId,
    rev: request.rev,
    institutionName: request.institutionName,
    status: request.status,
    reviewStarted: request.reviewStartedAt !== null,
    updatedAt: request.updatedAt,
    asked: { items: request.items, licences: request.licencesRequested, term: request.term },
    approved,
    whatBitsAsked: request.informationRequest?.reason ?? null,
    whyItChanged: decision?.kind === 'approved-smaller-scope' ? decision.reason : null,
    message: request.message,
    nextStep,
    activatedPlanId: request.activatedPlanId,
    history: request.history,
  };
}

/** The SA-02 row of a request (SA-01's Requests group reads the same rows). */
export function requestRow(request: AccessRequest): RequestRow {
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

export function newestFirst(a: AccessRequest, b: AccessRequest): number {
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
    request: forDecision(request),
    publishedFormats: published,
    existingAccess: institution
      ? { institutionId: institution.id, plans, paused: institution.pause !== null }
      : null,
    routeCommitted: institution?.kind ?? null,
    // DP-09: an institution of the same name already exists, so approving would duplicate it.
    sameNameInstitutions: sameNameInstitutionsOf(records, request).map((existing) => ({
      institutionId: existing.id,
      name: existing.name,
      kind: existing.kind,
    })),
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

/** DP-08: the request's institution is paused, so no payment step is offered. */
function isPaused(records: WorldRecords, request: AccessRequest): boolean {
  return (institutionOf(records, request)?.pause ?? null) !== null;
}

/** The request a public address names (`/requests/[requestId]`, O-05) — never by reference or ticket. */
function requestByRoute(records: WorldRecords, routeId: string): AccessRequest | undefined {
  return values(records.requests).find((request) => request.routeId === routeId);
}

/**
 * O-05 (ADR-0009): who may open a request's public pages — the signed-in Institute Admin of the
 * requesting institution (REQ-28; B3-08), or the browser session holding its ticket for the user
 * session that sent it (REQ-04). Everyone else is answered as an address that names nothing.
 */
function mayOpen(op: Op, request: AccessRequest): boolean {
  const target = { kind: 'request' as const, request };
  const person = op.sessionPerson();
  if (person?.role === 'tenant_admin' && op.canSee(person, target)) return true;
  return op.canSee(op.visitor(), target);
}

/**
 * The requester's statuses "still in progress" (owner decision, 24 Oct 2026): Submitted and Under
 * review (`under-review`), Information requested, Approved — payment required, Payment not
 * confirmed, Payment failed. Access active is where a request ends.
 */
const IN_PROGRESS: ReadonlySet<AccessRequest['status']> = new Set([
  'under-review',
  'information-requested',
  'approved-payment-required',
  'payment-not-confirmed',
  'payment-failed',
]);

/** Two receipts' changed records, each once. */
function joined(first: readonly RecordRef[], second: readonly RecordRef[]): readonly RecordRef[] {
  const seen = new Set(first.map((ref) => `${ref.kind}:${ref.id}`));
  return [...first, ...second.filter((ref) => !seen.has(`${ref.kind}:${ref.id}`))];
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
          value: { reference: request.id, routeId: request.routeId },
          decision: 'submitPublicRequest',
          actor: { kind: 'requester', name: request.contact.person },
          after: () => {
            // "Your selection was sent with this request, so it is empty again." (B1-07)
            browser.selection = EMPTY_SELECTION;
            // The ticket is this user session's: the signed-out visitor's (kept in this browser in a
            // local prototype build, ADR-0009 amendment), or this sign-in's.
            browser.holdTicket(request, ticketHolder(op.liveSession()));
          },
        };
      }),

    getRequestStatus: (id) =>
      read(call, 'AccessRequestService.getRequestStatus', (op) => {
        const request = op.found(requestByRoute(op.records, op.idText(id)));
        // O-05: anyone who may not open it — another browser, a cold visit, another person
        // signed in to the same tab, another role or institution — is answered as an address
        // that names nothing (REQ-05; the owner's not-found treatment) and learns not even that
        // the request exists.
        if (!mayOpen(op, request)) op.refuse({ kind: 'not-found' });
        return requesterView(request, isPaused(op.records, request));
      }),

    startPayment: async (input) => {
      let reported: readonly RecordRef[] = [];
      const answer = await command(call, 'AccessRequestService.startPayment', (op) => {
        const request = op.found(requestByRoute(op.records, op.idText(field(input, 'request'))));
        // Only whoever may open the request pays for it; anyone else learns nothing of it (O-05).
        if (!mayOpen(op, request)) op.refuse({ kind: 'not-found' });
        const subject = {
          kind: 'request' as const,
          request,
          institution: institutionOf(op.records, request),
        };
        // Who pays is the session's: the browser session that sent the request, by the ticket it
        // holds for the user session that sent it (REQ-07 from PU-10; ADR-0009), or the
        // requesting institution's signed-in Institute Admin ("Open the payment page", B3-08).
        const visitor = op.visitor();
        const person = visitor.requestTokens.includes(request.statusToken)
          ? null
          : op.sessionPerson();
        let payer: RequesterActorRef | PersonActorRef;
        if (person) {
          const signedIn = op.person();
          op.allow(signedIn, 'request.start-payment', subject);
          payer = signedIn.ref;
        } else {
          op.allow(visitor, 'request.start-payment', subject);
          payer = { kind: 'requester', name: request.contact.person };
        }
        const accepted = op.parse(startPaymentInput, input);
        op.rev(request, accepted.expectedRev);
        const next = op.decide(
          startPayment({
            request,
            institution: subject.institution,
            payer,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('requests', next.id, next);
        return {
          value: requesterView(next, isPaused(op.records, next)),
          decision: 'startPayment',
          actor: payer,
          // TE-4: the sample payment provider reports on the payment just started — a system event
          // of its own, with sample provenance, never this command's write (BR-036).
          after: () => {
            const outcome = call.core.payments.take();
            if (!outcome) return;
            const report = reportPayment(
              call.core,
              { requestId: next.id, outcome },
              'sample-standin',
            );
            if (report.ok) reported = report.changed;
          },
        };
      });
      // The receipt names the provider's records too, so every page reading them refreshes.
      return answer.ok && reported.length > 0
        ? { ...answer, changed: joined(answer.changed, reported) }
        : answer;
    },

    // PU-07 "You have a request in progress" (owner decision, 24 Oct 2026; ADR-0009 amendment).
    listRequestsInProgress: () =>
      read(call, 'AccessRequestService.listRequestsInProgress', (op) => {
        // Only what the status page's read policy shows this browser session's visitor — the
        // requests whose ticket it holds for the user session asking (REQ-04). Nothing is looked
        // up by reference or institution; a signed-in person's own role grants nothing here.
        const visitor = op.visitor();
        return values(op.records.requests)
          .filter((request) => IN_PROGRESS.has(request.status))
          .filter((request) => op.canSee(visitor, { kind: 'request', request }))
          .sort(newestFirst)
          .map((request) => ({
            routeId: request.routeId,
            institutionName: request.institutionName,
          }));
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
        return requesterView(request, isPaused(op.records, request));
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
            sameNameInstitutions: sameNameInstitutionsOf(op.records, request).map(({ id }) => id),
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
            sameNameInstitutions: sameNameInstitutionsOf(op.records, request).map(({ id }) => id),
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
          request: forDecision(next),
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
  outcome: ApprovalOutcome,
  decision: 'approveRequest' | 'approveSmallerScope',
  actor: PersonActorRef,
) {
  op.tx.put('requests', outcome.request.id, outcome.request);
  if (outcome.institution) op.tx.put('institutions', outcome.institution.id, outcome.institution);
  if (outcome.plan) op.tx.put('plans', outcome.plan.id, outcome.plan);
  const value: DecisionOutcome = { ...outcome, request: forDecision(outcome.request) };
  return { value, decision, actor };
}
