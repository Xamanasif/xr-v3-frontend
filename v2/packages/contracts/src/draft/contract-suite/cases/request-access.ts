/**
 * Request status, payment and activation on the public surface (Phase-1 Package 1C; B1-06 …
 * B1-08; owner decisions DV-5 / O-05 and TE-4, 14 Oct 2026; ADR-0009).
 *
 * A request's public pages are keyed by its opaque address (`routeId`), never by its reference
 * and never by the ticket the sending browser session holds (B1-07, B1-08; V-17). Only that browser
 * session (REQ-04) or the signed-in Institute Admin of the requesting institution (REQ-28; B3-08)
 * reads or pays; anyone else — another browser, a cold visit, another role — is answered as an
 * address that names nothing (`not-found`; REQ-05, the owner's not-found treatment) and learns not
 * even that the request exists. The ticket never crosses a port: the Super Admin's decision page
 * carries the request without it. Approval, payment confirmation and activation stay separate events
 * (BR-036); an internal approval never shows a payment step (REQ-09); paying again while a
 * confirmation is pending is not offered (REQ-08); the payment outcome comes only from the
 * provider stand-in (TE-4; T-05).
 */
import type { RequestedItem } from '@xr/domain';

import type { MethodId } from '../../ports/index.js';
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { DRAWN, SAMPLE, WALK } from '../sample.js';

const SEND: readonly MethodId[] = [
  'CatalogueService.searchCatalogue',
  'SelectionService.add',
  'SelectionService.get',
  'AccessRequestService.submitPublicRequest',
  'AccessRequestService.getRequestStatus',
];

const DECIDE: readonly MethodId[] = [
  'AccessRequestService.getRequestForDecision',
  'AccessRequestService.approveRequest',
];

/** A visitor chooses Shell-and-Tube (WEB + VR) and sends the drawn request (B1-05 … B1-07). */
async function send(context: CaseContext) {
  const visitor = context.publicPorts;
  const shell = await experimentNamed(visitor, SAMPLE.experiments.shellAndTube);
  valueOf(
    visitor.selection.add({ experimentId: shell.experimentId, formats: ['web', 'vr'] }),
    'add to the selection',
  );
  const sent = valueOf(
    await visitor.accessRequests.submitPublicRequest({
      ...SAMPLE.request,
      phone: null,
      message: null,
      term: { kind: 'yearly' },
    }),
    'send the request',
  );
  return { visitor, shell, sent };
}

/** The Super Admin approves the request on the route given (SA-03, B1-11). */
async function approve(
  context: CaseContext,
  reference: Parameters<CaseContext['publicPorts']['accessRequests']['getRequestForDecision']>[0],
  route: 'internal' | 'external' | null,
) {
  const admin = context.as('Arjun Mehta');
  const page = valueOf(await admin.accessRequests.getRequestForDecision(reference), 'SA-03');
  return valueOf(
    await admin.accessRequests.approveRequest({
      id: reference,
      route,
      expectedRev: page.request.rev,
    }),
    `approve (${route ?? 'route already set'})`,
  );
}

const sessionGate: ContractCase = {
  id: 'request-access:session-gate',
  title:
    'PU-10 / PU-12 open only for the sending browser session; the reference and the ticket are not addresses (O-05)',
  group: 'access',
  evidence:
    'B1-07 "continues from this session"; B1-08 "Who can open this page"; owner DV-5 / O-05 (14 Oct 2026); Appendix D V-17; matrix REQ-04, REQ-05',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...SEND, ...DECIDE, 'AccessRequestService.startPayment'],
  },
  run: async (context) => {
    const { visitor, sent } = await send(context);
    check(
      String(sent.routeId) !== String(sent.reference) && !('statusToken' in sent),
      'PU-09 answers the reference and an opaque address; the ticket stays with the browser session',
    );
    const own = valueOf(
      await visitor.accessRequests.getRequestStatus(sent.routeId),
      'PU-10 from the sending browser session',
    );
    check(
      own.reference === sent.reference && own.routeId === sent.routeId,
      'REQ-04: the sending session reads its request at its address',
    );

    errorOf(
      await context.newVisitor().accessRequests.getRequestStatus(sent.routeId),
      'not-found',
      'REQ-05: another browser (a cold visit) opens the address and learns nothing — not even that the request exists',
    );
    errorOf(
      await visitor.accessRequests.getRequestStatus(
        sent.reference as unknown as typeof sent.routeId,
      ),
      'not-found',
      'the reference used as an address',
    );

    const admin = context.as('Arjun Mehta');
    const record = valueOf(
      await admin.accessRequests.getRequestForDecision(sent.reference),
      'SA-03',
    );
    check(
      !('statusToken' in record.request),
      'PC-34: the Super Admin’s decision page carries the request without the requester’s ticket',
    );
    const ticket = (context.snapshot()[`REQ:${sent.reference}`] as { statusToken: string })
      .statusToken;
    errorOf(
      await visitor.accessRequests.getRequestStatus(ticket as unknown as typeof sent.routeId),
      'not-found',
      'the ticket used as an address (V-17)',
    );
    for (const person of ['Arjun Mehta', 'Kavya Nair'] as const) {
      errorOf(
        await context.as(person).accessRequests.getRequestStatus(sent.routeId),
        'not-found',
        `O-05 names two readers only: ${person}, signed in, is not one of them`,
      );
    }

    await approve(context, sent.reference, 'external');
    const toPay = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    check(toPay.nextStep === 'continue-to-payment', 'B1-08 f0: "Continue to payment"');
    errorOf(
      await context
        .newVisitor()
        .accessRequests.startPayment({ request: sent.routeId, expectedRev: toPay.rev }),
      'not-found',
      'another browser starts the payment',
    );
    errorOf(
      await context
        .as('Kavya Nair')
        .accessRequests.startPayment({ request: sent.routeId, expectedRev: toPay.rev }),
      'not-found',
      'a signed-in Content Manager starts the payment',
    );
    errorOf(
      await visitor.accessRequests.startPayment({
        request: 'rq-unknown' as typeof sent.routeId,
        expectedRev: toPay.rev,
      }),
      'not-found',
      'an address that names no request',
    );
  },
};

const instituteAdmin: ContractCase = {
  id: 'request-access:institute-admin',
  title:
    'The signed-in Institute Admin of the requesting institution reads its requests at their address; no other institution’s (O-05; REQ-28)',
  group: 'access',
  evidence:
    'B3-08 (REQ-0042 row → B1-08); owner DV-5 / O-05 (14 Oct 2026); matrix REQ-28; Appendix A PU-10 gate',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'AccessRequestService.getInstitutionRequest',
      'AccessRequestService.getRequestStatus',
      'AccessRequestService.listRequests',
      'AccessRequestService.getRequestForDecision',
    ],
  },
  run: async (context) => {
    const meera = context.as('Meera Iyer');
    const detail = valueOf(
      await meera.accessRequests.getInstitutionRequest(WALK.request),
      'IA-17 detail',
    );
    const page = valueOf(
      await meera.accessRequests.getRequestStatus(detail.routeId),
      'PU-10 as the Institute Admin',
    );
    check(
      page.reference === WALK.request &&
        page.status === 'access-active' &&
        page.activatedPlanId === WALK.plan,
      'REQ-28: Godavari’s Institute Admin reads REQ-0042 — Access active, ACC-0107 (B1-08 f8)',
    );
    errorOf(
      await context.publicPorts.accessRequests.getRequestStatus(detail.routeId),
      'not-found',
      'a visitor without the ticket',
    );

    const admin = context.as('Arjun Mehta');
    const rows = valueOf(
      await admin.accessRequests.listRequests({ sort: 'received-newest' }),
      'SA-02',
    );
    const elsewhere = rows.find((row) => row.institutionName !== SAMPLE.request.institutionName);
    check(elsewhere !== undefined, 'another institution has a request');
    const foreign = valueOf(
      await admin.accessRequests.getRequestForDecision(elsewhere.id),
      'SA-03 of another institution',
    );
    errorOf(
      await meera.accessRequests.getRequestStatus(foreign.request.routeId),
      'not-found',
      'O-05: an Institute Admin never opens another institution’s request',
    );
  },
};

/** REQ-0058 (B3-08 "60 more licences", walk step IA-17): the Institute Admin's own request. */
const REQ_0058 = 'REQ-0058' as typeof WALK.request;

const instituteAdminPays: ContractCase = {
  id: 'request-access:institute-admin-pays',
  title:
    'The Institute Admin pays its own approved request; stale and repeated payments are refused; OD-B3-09 writes no plan',
  group: 'access',
  evidence:
    'B3-08 f6 "Open the payment page" → B1-08 PU-12; matrix REQ-07, REQ-08; OD-B3-09 / T-07; TE-4',
  requires: {
    fixture: { kind: 'after-flow', flow: 'Device' },
    methods: [
      ...DECIDE,
      'AccessRequestService.getRequestStatus',
      'AccessRequestService.startPayment',
    ],
  },
  run: async (context) => {
    const decided = await approve(context, REQ_0058, null);
    check(
      decided.request.status === 'approved-payment-required' && decided.plan === null,
      'REQ-0058 is approved — payment required; nothing changes until the payment is confirmed (B3-08)',
    );
    const meera = context.as('Meera Iyer');
    const view = valueOf(
      await meera.accessRequests.getRequestStatus(decided.request.routeId),
      'PU-10 for the Institute Admin',
    );
    check(view.nextStep === 'continue-to-payment', 'PU-10 offers "Continue to payment"');
    errorOf(
      await context
        .newVisitor()
        .accessRequests.startPayment({ request: view.routeId, expectedRev: view.rev }),
      'not-found',
      'a visitor without the ticket pays',
    );
    errorOf(
      await meera.accessRequests.startPayment({ request: view.routeId, expectedRev: view.rev - 1 }),
      'stale-version',
      'a payment started from a stale page',
    );
    const started = await meera.accessRequests.startPayment({
      request: view.routeId,
      expectedRev: view.rev,
    });
    const pending = valueOf(started, 'the Institute Admin starts the payment');
    check(
      pending.status === 'payment-not-confirmed' &&
        changedKinds(started).every((kind) => kind === 'REQ'),
      'Starting a payment writes the request only — no plan, no access (BR-036)',
    );
    errorOf(
      await meera.accessRequests.startPayment({ request: view.routeId, expectedRev: pending.rev }),
      'invalid-state',
      'paying again while the confirmation is pending (REQ-08)',
    );
    const planBefore = context.snapshot()[`ACC:${WALK.plan}`];
    const paid = context.standins.paymentOutcome.report({
      requestId: REQ_0058,
      outcome: 'confirmed',
    });
    check(paid.ok, 'the provider stand-in confirms (TE-4)');
    if (paid.ok) {
      check(
        paid.value.plan === null &&
          paid.value.planEffect.kind === 'policy-open' &&
          paid.value.planEffect.decision === 'OD-B3-09',
        'OD-B3-09 is open: a confirmed payment on an existing institution writes no plan',
      );
    }
    deepEqual(
      context.snapshot()[`ACC:${WALK.plan}`],
      planBefore,
      'ACC-0107 is unchanged — no licence is added while OD-B3-09 is open',
    );
    const after = valueOf(await meera.accessRequests.getRequestStatus(view.routeId), 'PU-10');
    check(
      after.status === 'access-active' && after.activatedPlanId === null,
      'The request reads Access active; no new plan is named',
    );
  },
};

const duplicatesAndStale: ContractCase = {
  id: 'request-access:duplicates',
  title:
    'A request is sent once: a second send finds the selection empty; a stale or repeated payment start is refused and writes nothing',
  group: 'access',
  evidence:
    'B1-07 f6 "nothing can be sent twice"; B1-08 f6 "No pay again"; matrix REQ-08; ADR-0008',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...SEND,
      ...DECIDE,
      'AccessRequestService.listRequests',
      'AccessRequestService.startPayment',
    ],
  },
  run: async (context) => {
    const { visitor, sent } = await send(context);
    const again = await visitor.accessRequests.submitPublicRequest({
      ...SAMPLE.request,
      phone: null,
      message: null,
      term: { kind: 'yearly' },
    });
    check(
      errorOf(again, 'refused', 'send again').code === 'selection-empty',
      'B1-07: the selection was sent with the request, so a second send is refused',
    );
    const rows = valueOf(
      await context.as('Arjun Mehta').accessRequests.listRequests({ sort: 'received-newest' }),
      'SA-02',
    );
    check(
      rows.filter((row) => row.institutionName === SAMPLE.request.institutionName).length === 1,
      'Exactly one request reaches the Super Admin',
    );
    await approve(context, sent.reference, 'external');
    const toPay = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    errorOf(
      await visitor.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: toPay.rev + 1,
      }),
      'stale-version',
      'a payment started from a stale page',
    );
    const pending = valueOf(
      await visitor.accessRequests.startPayment({ request: sent.routeId, expectedRev: toPay.rev }),
      'start the payment',
    );
    errorOf(
      await visitor.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: pending.rev,
      }),
      'invalid-state',
      'start it again while the confirmation is pending (REQ-08)',
    );
  },
};

const internalRoute: ContractCase = {
  id: 'request-access:internal',
  title:
    'Internal route: approval activates access directly; the requester never sees a payment step (REQ-09)',
  group: 'access',
  evidence:
    'B1-08 "Two routes, one record", f9 internal route; B1-11 f3, f11; matrix REQ-09, REQ-14',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...SEND, ...DECIDE, 'AccessRequestService.startPayment'],
  },
  run: async (context) => {
    const { visitor, sent } = await send(context);
    const decided = await approve(context, sent.reference, 'internal');
    check(
      decided.request.status === 'access-active' && decided.plan !== null,
      'Internal approval: access active and the plan created together',
    );
    const page = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-13');
    check(
      page.status === 'access-active' &&
        page.nextStep === 'sign-in' &&
        page.activatedPlanId !== null &&
        DRAWN.plan.test(page.activatedPlanId),
      'B1-08 f9: Access active, the plan named, next step Sign in',
    );
    check(
      page.history.every((entry) => !entry.event.startsWith('payment-')),
      'B1-08 f9: approval followed directly by activation — no payment event',
    );
    errorOf(
      await visitor.accessRequests.startPayment({ request: sent.routeId, expectedRev: page.rev }),
      'invalid-state',
      'a payment on an internal request (REQ-09)',
    );
  },
};

const paymentFailedAndRetried: ContractCase = {
  id: 'request-access:payment-failed',
  title:
    'Payment failed: nothing is activated and "Try payment again" starts a new attempt; confirmed then activates access',
  group: 'access',
  evidence: 'B1-08 f7 "Payment failed", f8 "Access active"; matrix REQ-07; TE-4; T-05',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...SEND, ...DECIDE, 'AccessRequestService.startPayment'],
  },
  run: async (context) => {
    const { visitor, sent } = await send(context);
    await approve(context, sent.reference, 'external');
    const first = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    valueOf(
      await visitor.accessRequests.startPayment({ request: sent.routeId, expectedRev: first.rev }),
      'start the payment',
    );
    const failed = context.standins.paymentOutcome.report({
      requestId: sent.reference,
      outcome: 'failed',
    });
    check(
      failed.ok && failed.value.plan === null,
      'The provider stand-in reports a failure; nothing is activated',
    );
    const retry = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    check(
      retry.status === 'payment-failed' &&
        retry.nextStep === 'try-payment-again' &&
        retry.activatedPlanId === null,
      'B1-08 f7: Payment failed — "Try payment again", no plan',
    );
    valueOf(
      await visitor.accessRequests.startPayment({ request: sent.routeId, expectedRev: retry.rev }),
      'try the payment again',
    );
    const paid = context.standins.paymentOutcome.report({
      requestId: sent.reference,
      outcome: 'confirmed',
    });
    check(
      paid.ok && paid.value.planEffect.kind === 'plan-created',
      'Confirmed: the plan is created and access activates (ACC-02)',
    );
    const active = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-13');
    check(
      active.status === 'access-active' && active.nextStep === 'sign-in',
      'B1-08 f8: Access active — Sign in for the institution administrator',
    );
    deepEqual(
      active.history.map((entry) => entry.event),
      [
        'submitted',
        'approved',
        'payment-started',
        'payment-not-completed',
        'payment-started',
        'payment-confirmed',
        'access-active',
      ],
      'Approval, payment and activation stay separate events (BR-036)',
    );
  },
};

const approvedWithChanges: ContractCase = {
  id: 'request-access:approved-with-changes',
  title:
    'Approved with changes: the requester sees what was asked, what was approved, what changed and why',
  group: 'access',
  evidence: 'B1-08 f4 "Approved with changes"; B1-11 f5, f8; matrix REQ-15',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...SEND,
      'AccessRequestService.getRequestForDecision',
      'AccessRequestService.approveSmallerScope',
    ],
  },
  run: async (context) => {
    const { visitor, shell, sent } = await send(context);
    const admin = context.as('Arjun Mehta');
    const page = valueOf(await admin.accessRequests.getRequestForDecision(sent.reference), 'SA-03');
    const items: RequestedItem[] = [{ experimentId: shell.experimentId, formats: ['web', 'vr'] }];
    valueOf(
      await admin.accessRequests.approveSmallerScope({
        id: sent.reference,
        route: 'external',
        items,
        licences: '100',
        term: 'yearly',
        reason: SAMPLE.changeReason,
        expectedRev: page.request.rev,
      }),
      'approve a smaller scope',
    );
    const seen = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    check(
      seen.status === 'approved-payment-required' &&
        seen.nextStep === 'continue-to-payment' &&
        seen.asked.licences === 120 &&
        seen.approved?.licences === 100,
      'B1-08 f4: asked 120, approved 100 — payment required',
    );
    deepEqual(seen.approved?.changed, ['licences'], 'B1-08 f4: only the licences row is "Changed"');
    check(seen.whyItChanged === SAMPLE.changeReason, 'B1-08 f4: "Why it changed" shows the reason');
  },
};

const reviewStart: ContractCase = {
  id: 'request-access:review-start',
  title:
    'The requester reads "Submitted" until the seeded or test-only review-start fact, then "Under review" (AD-14 / P1-04)',
  group: 'access',
  evidence: 'B1-08 f1, f2; B1-13 timeline; owner AD-14 (12 Oct 2026); P1-04 open',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...SEND, 'AccessRequestService.getRequestForDecision'],
    seams: ['recordReviewStarted'],
  },
  run: async (context) => {
    const { visitor, sent } = await send(context);
    valueOf(
      await context.as('Arjun Mehta').accessRequests.getRequestForDecision(sent.reference),
      'SA-03',
    );
    const submitted = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    check(!submitted.reviewStarted, 'Opening SA-03 does not start review (AD-14)');
    context.seams.recordReviewStarted!(sent.reference);
    const reviewing = valueOf(await visitor.accessRequests.getRequestStatus(sent.routeId), 'PU-10');
    check(
      reviewing.reviewStarted &&
        reviewing.status === 'under-review' &&
        reviewing.history.some((entry) => entry.event === 'review-started'),
      'B1-08 f2: "BITS started reviewing" from the test-only fact',
    );
  },
};

export const REQUEST_ACCESS_CASES: readonly ContractCase[] = [
  sessionGate,
  instituteAdmin,
  instituteAdminPays,
  duplicatesAndStale,
  internalRoute,
  paymentFailedAndRetried,
  approvedWithChanges,
  reviewStart,
];
