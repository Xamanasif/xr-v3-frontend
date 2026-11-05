/**
 * The simulated payment provider's page (owner decisions DP-05, DP-06, DP-07, DP-08, DP-13, DP-15;
 * B2B milestone I3): the payer chooses success, failure or no answer for the payment waiting on a
 * request they may open; every attempt stays in the record and its history; a failed payment can be
 * tried again; a waiting payment can be answered later; a paused institution's payment is never
 * completed; access activates only on an allowed confirmation; an internal request never waits.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import { type ExperimentId, type RequestId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed } from './index.js';
import type { SamplePlatform } from './platform/create.js';
import { asPerson, asPersonId, beginSession, visitorPorts, worldOf } from './testing/index.js';

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function prototypePlatform(): SamplePlatform {
  // The prototype profile: nothing answers a started payment on its own; the page serves the payer.
  return createSamplePlatform({
    world: seed(),
    paymentStandIn: 'provider-reports',
    paymentProviderPage: true,
  });
}

async function send(ports: ProductPorts, institutionName = 'Krishna Engineering College') {
  ok(ports.selection.add({ experimentId: SHELL, formats: ['web'] }));
  return ok(
    await ports.accessRequests.submitPublicRequest({
      institutionName,
      contactPerson: 'R. Rao',
      email: 'r.rao@krishna.edu.in',
      phone: null,
      licencesRequested: '30',
      message: null,
      term: { kind: 'yearly' },
    }),
  );
}

async function approve(
  platform: SamplePlatform,
  reference: RequestId,
  route: 'internal' | 'external',
) {
  const admin = asPerson(platform, 'Arjun Mehta');
  const page = ok(await admin.accessRequests.getRequestForDecision(reference));
  ok(
    await admin.accessRequests.approveRequest({
      id: reference,
      route,
      expectedRev: page.request.rev,
    }),
  );
}

/** The tab's visitor sends a request, BITS approves it (external), and the visitor starts paying. */
async function waitingPayment() {
  const platform = prototypePlatform();
  const sent = await send(platform.ports);
  await approve(platform, sent.reference, 'external');
  const view = ok(await platform.ports.accessRequests.getRequestStatus(sent.routeId));
  ok(
    await platform.ports.accessRequests.startPayment({
      request: sent.routeId,
      expectedRev: view.rev,
    }),
  );
  return { platform, sent, provider: platform.samplePaymentProvider! };
}

const requestOf = (platform: SamplePlatform, reference: string) =>
  worldOf(platform).records.requests[reference]!;

describe('the simulated payment provider page (DP-05)', () => {
  it('is served only when the composition root asks for it; the prototype profile sends the payer to it', () => {
    expect(createSamplePlatform({ world: seed() }).samplePaymentProvider).toBeNull();
    expect(prototypePlatform().samplePaymentProvider?.sendsPayerToPage).toBe(true);
    const local = createSamplePlatform({
      world: seed(),
      paymentStandIn: 'confirm-on-start',
      paymentProviderPage: true,
    });
    expect(local.samplePaymentProvider?.sendsPayerToPage).toBe(false);
  });

  it('nothing answers a started payment on its own: it waits for the payer', async () => {
    const { platform, sent, provider } = await waitingPayment();
    expect(requestOf(platform, sent.reference).status).toBe('payment-not-confirmed');
    expect(await provider.waiting()).toEqual([
      {
        routeId: sent.routeId,
        reference: sent.reference,
        institutionName: 'Krishna Engineering College',
        startedAt: requestOf(platform, sent.reference).payments[0]!.startedAt,
      },
    ]);
  });

  it('Complete the payment: confirmed by the provider stand-in, then access activates (DP-13)', async () => {
    const { platform, sent, provider } = await waitingPayment();
    const answer = await provider.report(sent.routeId, 'confirmed');
    expect(answer.ok).toBe(true);
    const request = requestOf(platform, sent.reference);
    expect(request.status).toBe('access-active');
    expect(request.activatedPlanId).toMatch(/^ACC-\d{4}$/);
    expect(request.history.map((entry) => [entry.event, entry.actor.kind])).toEqual([
      ['submitted', 'requester'],
      ['approved', 'person'],
      ['payment-started', 'requester'],
      ['payment-confirmed', 'system'],
      ['access-active', 'system'],
    ]);
    const report = worldOf(platform).history.at(-1)!;
    expect([report.method, report.origin]).toEqual(['PaymentOutcomePort.report', 'sample-standin']);
    expect(await provider.waiting()).toEqual([]);
  });

  it('Make the payment fail, then try again and complete: every attempt is kept (DP-07)', async () => {
    const { platform, sent, provider } = await waitingPayment();
    expect((await provider.report(sent.routeId, 'failed')).ok).toBe(true);
    let request = requestOf(platform, sent.reference);
    expect([request.status, request.activatedPlanId]).toEqual(['payment-failed', null]);
    const failed = ok(await platform.ports.accessRequests.getRequestStatus(sent.routeId));
    expect(failed.nextStep).toBe('try-payment-again');
    ok(
      await platform.ports.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: failed.rev,
      }),
    );
    expect((await provider.report(sent.routeId, 'failed')).ok).toBe(true);
    const again = ok(await platform.ports.accessRequests.getRequestStatus(sent.routeId));
    ok(
      await platform.ports.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: again.rev,
      }),
    );
    expect((await provider.report(sent.routeId, 'confirmed')).ok).toBe(true);
    request = requestOf(platform, sent.reference);
    expect(request.status).toBe('access-active');
    expect(request.payments.map((payment) => payment.outcome)).toEqual([
      'failed',
      'failed',
      'confirmed',
    ]);
    expect(request.history.map((entry) => entry.event)).toEqual([
      'submitted',
      'approved',
      'payment-started',
      'payment-not-completed',
      'payment-started',
      'payment-not-completed',
      'payment-started',
      'payment-confirmed',
      'access-active',
    ]);
  });

  it('Leave it unconfirmed: nothing is reported, and the waiting payment can be answered later (DP-06)', async () => {
    const { platform, sent, provider } = await waitingPayment();
    const before = worldOf(platform).worldVersion;
    expect((await provider.waiting()).map((waiting) => waiting.reference)).toEqual([
      sent.reference,
    ]);
    expect(worldOf(platform).worldVersion).toBe(before);
    // Paying again while it waits is not offered (REQ-08): the waiting attempt is the one answered.
    const view = ok(await platform.ports.accessRequests.getRequestStatus(sent.routeId));
    expect(view.nextStep).toBe('check-again');
    expect((await provider.report(sent.routeId, 'confirmed')).ok).toBe(true);
    expect(requestOf(platform, sent.reference).payments).toHaveLength(1);
  });

  it('answers only a payment that is waiting, and only for someone who may open the request (O-05)', async () => {
    const platform = prototypePlatform();
    const provider = platform.samplePaymentProvider!;
    // Another browser session's request: this tab's session learns nothing of it.
    const elsewhere = await send(visitorPorts(platform));
    await approve(platform, elsewhere.reference, 'external');
    expect(await provider.waiting()).toEqual([]);
    expect(await provider.report(elsewhere.routeId, 'confirmed')).toEqual({
      ok: false,
      reason: 'not-found',
    });
    expect(await provider.report('rq-9999', 'confirmed')).toEqual({
      ok: false,
      reason: 'not-found',
    });
    // This tab's own request before any payment started: nothing is waiting.
    const own = await send(platform.ports, 'Tungabhadra College of Engineering');
    await approve(platform, own.reference, 'external');
    expect(await provider.report(own.routeId, 'confirmed')).toEqual({
      ok: false,
      reason: 'not-waiting',
    });
    expect(requestOf(platform, own.reference).status).toBe('approved-payment-required');
  });

  it('an internal BITS request never waits for a payment (DP-15)', async () => {
    const platform = prototypePlatform();
    const sent = await send(platform.ports);
    await approve(platform, sent.reference, 'internal');
    expect(requestOf(platform, sent.reference).status).toBe('access-active');
    expect(requestOf(platform, sent.reference).payments).toEqual([]);
    expect(await platform.samplePaymentProvider!.waiting()).toEqual([]);
    expect(await platform.samplePaymentProvider!.report(sent.routeId, 'confirmed')).toEqual({
      ok: false,
      reason: 'not-waiting',
    });
  });

  it('a paused institution’s payment is never completed; once access is restored it completes (DP-08)', async () => {
    const platform = prototypePlatform();
    const admin = asPerson(platform, 'Arjun Mehta');
    // Konark's more-licences request REQ-0040, approved; its Institute Admin starts the payment.
    const reference = unsafeBrand<RequestId>('REQ-0040');
    const page = ok(await admin.accessRequests.getRequestForDecision(reference));
    ok(
      await admin.accessRequests.approveRequest({
        id: reference,
        route: null,
        expectedRev: page.request.rev,
      }),
    );
    beginSession(platform, 'per-r-bhatt');
    const routeId = requestOf(platform, reference).routeId;
    const view = ok(await platform.ports.accessRequests.getRequestStatus(routeId));
    ok(
      await platform.ports.accessRequests.startPayment({ request: routeId, expectedRev: view.rev }),
    );
    const pause = async (paused: boolean) => {
      const detail = ok(await admin.institutions.getInstitution('konark' as never));
      const input = {
        institutionId: 'konark' as never,
        reason: 'Licence review.',
        expectedRev: detail.institution.rev,
      };
      ok(
        paused
          ? await admin.institutions.pauseInstitution(input)
          : await admin.institutions.restoreInstitution(input),
      );
    };
    await pause(true);
    const provider = platform.samplePaymentProvider!;
    expect(await provider.report(routeId, 'confirmed')).toEqual({
      ok: false,
      reason: 'institution-paused',
    });
    expect(requestOf(platform, reference).status).toBe('payment-not-confirmed');
    expect(requestOf(platform, reference).payments.map((payment) => payment.outcome)).toEqual([
      'pending',
    ]);
    await pause(false);
    expect((await provider.report(routeId, 'confirmed')).ok).toBe(true);
    expect(requestOf(platform, reference).status).toBe('access-active');
    // Another institution's Institute Admin in this tab may not answer it.
    const again = ok(await platform.ports.accessRequests.getRequestStatus(routeId));
    expect(again.status).toBe('access-active');
    beginSession(platform, 'per-p-srinivas');
    expect(await provider.report(routeId, 'confirmed')).toEqual({ ok: false, reason: 'not-found' });
    expect(asPersonId(platform, 'per-p-srinivas')).toBeDefined();
  });
});
