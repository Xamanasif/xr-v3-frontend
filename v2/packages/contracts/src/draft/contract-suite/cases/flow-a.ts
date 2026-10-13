/**
 * Flow A — public discovery → request → Super Admin decision → payment → institutional access
 * (flows.json A1–A4; Appendix D §4.2; B1-01 … B1-13), on the spine-start world. Approval, payment
 * and activation stay separate events (BR-036); no step creates a Student grant (BC9); there is no
 * decline (T-02); opening SA-03 never starts review (AD-14 / P1-04).
 */
import type { MethodId } from '../../ports/index.js';
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, keysOf } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

const A_METHODS: readonly MethodId[] = [
  'CatalogueService.searchCatalogue',
  'SelectionService.add',
  'SelectionService.get',
  'AccessRequestService.submitPublicRequest',
  'AccessRequestService.getRequestStatus',
  'AccessRequestService.listRequests',
  'AccessRequestService.getRequestForDecision',
];

/** A1–A2: the selection, then the request. Returns the request's reference and token. */
async function requestAccess(context: CaseContext) {
  const visitor = context.publicPorts;
  const shell = await experimentNamed(visitor, SAMPLE.experiments.shellAndTube);
  check(
    shell.availableIn.includes('web') && shell.availableIn.includes('vr'),
    'A1: Shell-and-Tube Heat Exchanger is published with WEB and VR (B1-05)',
  );
  const before = context.snapshot();
  valueOf(
    visitor.selection.add({ experimentId: shell.experimentId, formats: ['web', 'vr'] }),
    'A1 add to the selection',
  );
  deepEqual(
    context.snapshot(),
    before,
    'A1: the selection lives in the browser session, not the world (B1-06)',
  );

  const invalid = await visitor.accessRequests.submitPublicRequest({
    institutionName: ' ',
    contactPerson: '',
    email: 'meera.iyer@godavari',
    phone: null,
    licencesRequested: 'sixty',
    message: null,
    term: null,
  });
  const failed = errorOf(invalid, 'validation-failed', 'A2 with the drawn validation errors');
  deepEqual(
    keysOf(failed),
    [
      'PU-08.institutionName.required',
      'PU-08.contactPerson.required',
      'PU-08.email.format',
      'PU-08.licencesRequested.whole-number',
      'PU-08.term.required',
    ],
    'A2: B1-07 reports each field, in form order',
  );
  check(
    failed.summaryTitle === 'There are 5 problems with this request',
    'A2: the drawn summary title',
  );

  const answer = await visitor.accessRequests.submitPublicRequest({
    ...SAMPLE.request,
    phone: null,
    message: null,
    term: { kind: 'yearly' },
  });
  const sent = valueOf(answer, 'A2 send the request');
  check(DRAWN.request.test(sent.reference), 'A2: the reference reads REQ-nnnn');
  deepEqual(
    changedKinds(answer),
    ['REQ'],
    'A2: only the request is written — no institution, plan or grant (BC9)',
  );
  check(
    visitor.selection.get().items.length === 0,
    'A2: the selection is sent with the request and empty again (B1-07)',
  );
  return { shell, sent };
}

const flowA: ContractCase = {
  id: 'flow:A',
  title: 'Flow A — request, decision, payment, access (A1–A4)',
  group: 'flow',
  evidence: 'flows.json A1–A4; Appendix D §4.2; B1-05 … B1-13',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...A_METHODS,
      'AccessRequestService.approveRequest',
      'AccessRequestService.startPayment',
    ],
  },
  run: async (context) => {
    const { sent } = await requestAccess(context);
    const visitor = context.publicPorts;
    const status = valueOf(
      await visitor.accessRequests.getRequestStatus(sent.statusToken),
      'A2 status page',
    );
    check(status.status === 'under-review', 'A2: the request is under review');
    check(
      !status.reviewStarted,
      'A2: "BITS started reviewing" is a seeded or test-only fact (AD-14)',
    );

    const admin = context.as('Arjun Mehta');
    const rows = valueOf(
      await admin.accessRequests.listRequests({ sort: 'received-newest' }),
      'A3 SA-02',
    );
    const row = rows.find((candidate) => candidate.id === sent.reference);
    check(
      row?.status === 'under-review' && row.route === null,
      'A3: SA-02 lists it under review, route not set',
    );
    const page = valueOf(
      await admin.accessRequests.getRequestForDecision(sent.reference),
      'A3 SA-03',
    );
    const after = valueOf(
      await visitor.accessRequests.getRequestStatus(sent.statusToken),
      'A3 status page',
    );
    check(!after.reviewStarted, 'A3: opening SA-03 does not start review (AD-14 / P1-04)');

    const noRoute = await admin.accessRequests.approveRequest({
      id: sent.reference,
      route: null,
      expectedRev: page.request.rev,
    });
    const routeError = errorOf(noRoute, 'validation-failed', 'A3 approve without a route');
    deepEqual(
      keysOf(routeError),
      ['SA-03.route.required'],
      'A3: a new institution needs a route (REQ-12)',
    );

    const decided = await admin.accessRequests.approveRequest({
      id: sent.reference,
      route: 'external',
      expectedRev: page.request.rev,
    });
    const outcome = valueOf(decided, 'A3 approve (external)');
    check(
      outcome.request.status === 'approved-payment-required',
      'A3: Approved — payment required',
    );
    check(
      outcome.institution?.kind === 'external',
      'A3: the institution record is created at the first approval',
    );
    check(
      outcome.plan === null && outcome.planEffect.kind === 'none',
      'A3: no plan until the payment is confirmed',
    );
    check(
      changedKinds(decided).every((kind) => kind === 'REQ' || kind === 'INST'),
      'A3: approval writes the request and the institution only — no plan or grant (BR-036, BC9)',
    );
    check(!('declineRequest' in admin.accessRequests), 'A3: there is no decline (T-02)');
    const again = await admin.accessRequests.approveRequest({
      id: sent.reference,
      route: 'external',
      expectedRev: outcome.request.rev,
    });
    errorOf(again, 'invalid-state', 'A3 approve twice');

    const toPay = valueOf(
      await visitor.accessRequests.getRequestStatus(sent.statusToken),
      'A4 status page',
    );
    check(toPay.nextStep === 'continue-to-payment', 'A4: "Continue to payment" (B1-08 f0)');
    const started = valueOf(
      await visitor.accessRequests.startPayment({
        by: 'status-token',
        token: sent.statusToken,
        expectedRev: toPay.rev,
      }),
      'A4 start the payment',
    );
    check(
      started.status === 'payment-not-confirmed',
      'A4: nothing changes until the payment is confirmed (B3-08)',
    );
    const paid = context.standins.paymentOutcome.report({
      requestId: sent.reference,
      outcome: 'confirmed',
    });
    check(paid.ok, 'A4: the payment provider stand-in confirms');
    if (paid.ok) {
      check(
        paid.value.planEffect.kind === 'plan-created',
        'A4: the confirmed payment activates access and creates the plan',
      );
      if (paid.value.planEffect.kind === 'plan-created')
        check(DRAWN.plan.test(paid.value.planEffect.planId), 'A4: the plan reads ACC-nnnn');
    }
    const active = valueOf(
      await visitor.accessRequests.getRequestStatus(sent.statusToken),
      'A4 status page',
    );
    check(
      active.status === 'access-active' && active.activatedPlanId !== null,
      'A4: Access active, with its plan',
    );
  },
};

const flowAInformation: ContractCase = {
  id: 'flow:A-information',
  title: 'Flow A alternate — "Request more information" has no exit (T-03)',
  group: 'flow',
  evidence: 'Appendix D §4.2 (drawn alternate, not traced in flows.json); B1-11; B1-08 f3; T-03',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...A_METHODS,
      'AccessRequestService.requestMoreInformation',
      'AccessRequestService.approveRequest',
    ],
  },
  run: async (context) => {
    const { sent } = await requestAccess(context);
    const admin = context.as('Arjun Mehta');
    const page = valueOf(await admin.accessRequests.getRequestForDecision(sent.reference), 'SA-03');
    const blank = await admin.accessRequests.requestMoreInformation({
      id: sent.reference,
      reason: '  ',
      expectedRev: page.request.rev,
    });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'ask without saying what is needed')),
      ['SA-03.informationReason.required'],
      'B1-11: "Enter what you need from the requester"',
    );
    const asked = valueOf(
      await admin.accessRequests.requestMoreInformation({
        id: sent.reference,
        reason: SAMPLE.informationReason,
        expectedRev: page.request.rev,
      }),
      'request more information',
    );
    check(asked.request.status === 'information-requested', 'Information requested');
    const seen = valueOf(
      await context.publicPorts.accessRequests.getRequestStatus(sent.statusToken),
      'PU-10',
    );
    check(
      seen.whatBitsAsked === SAMPLE.informationReason,
      'The requester sees what BITS asked (B1-08 f3)',
    );
    const decide = await admin.accessRequests.approveRequest({
      id: sent.reference,
      route: 'external',
      expectedRev: asked.request.rev,
    });
    check(
      errorOf(decide, 'policy-open', 'decide after information was requested').decision === 'T-03',
      'Deciding after "Information requested" is open (T-03): no transition is invented',
    );
  },
};

export const FLOW_A_CASES: readonly ContractCase[] = [flowA, flowAInformation];
