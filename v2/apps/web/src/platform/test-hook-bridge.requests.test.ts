/**
 * The CI-only request seams of the test-hook bridge (Package 1C; AD-14 / P1-04, TE-4): the
 * review-start fact and the sample payment provider's reports, written into the tab's own world by
 * non-human writers of `@xr/sample-platform/testing` — never by a product control. The page reads
 * them through its own session (the ticket it holds), and its reads are invalidated. Its own file:
 * the bridge attaches once per page.
 */
import type { RequesterRequestView } from '@xr/contracts/draft';
import type { ExperimentId, RequestRouteId } from '@xr/domain';
import { describe, expect, it, vi } from 'vitest';

import { xrQueryKey } from '@/queries/keys';

import {
  BOOT_DESCRIPTOR_GLOBAL,
  TEST_HOOKS_GLOBAL,
  TEST_REQUEST_SEAMS_MARKER,
} from './test-hook-bridge';

vi.mock('@/platform/test-hooks', async () => await import('./test-hook-bridge'));

const { bootPlatform } = await import('./runtime');

interface Hooks {
  actAs(personId: unknown, command: unknown): Promise<unknown>;
  startReview(reference: unknown): Promise<{ marker: string }>;
  planPayment(outcome: unknown): Promise<{ marker: string }>;
  reportPayment(reference: unknown, outcome: unknown): Promise<unknown>;
  inspect(): Promise<{ worldVersion: number }>;
}

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

describe('the request seams — review start and the payment provider, in the tab’s own world', () => {
  it('moves REQ-0042 through review, approval, a pending and a failed payment, and activation', async () => {
    Reflect.set(
      window,
      BOOT_DESCRIPTOR_GLOBAL,
      Object.freeze({ fixture: 'spine-start', session: null }),
    );
    const runtime = await bootPlatform();
    const hooks = Reflect.get(window, TEST_HOOKS_GLOBAL) as Hooks;
    const ports = runtime.ports;

    // The visitor of this tab sends the drawn request (B1-07 f4): the tab holds its ticket.
    ok(
      ports.selection.add({
        experimentId: 'shell-and-tube-heat-exchanger' as ExperimentId,
        formats: ['web', 'vr'],
      }),
    );
    const sent = ok(
      await ports.accessRequests.submitPublicRequest({
        institutionName: 'Godavari Institute of Technology',
        contactPerson: 'Meera Iyer',
        email: 'meera.iyer@godavari.edu.in',
        phone: null,
        licencesRequested: '120',
        message: null,
        term: { kind: 'yearly' },
      }),
    );
    expect(sent.reference).toBe('REQ-0042');
    const status = async (): Promise<RequesterRequestView> =>
      ok(await ports.accessRequests.getRequestStatus(sent.routeId as RequestRouteId));
    expect(await status()).toMatchObject({ status: 'under-review', reviewStarted: false });

    // A cached read of the request is invalidated by each seam's write.
    const snapshot = runtime.session.getSnapshot();
    const key = [
      ...xrQueryKey(snapshot.status === 'unknown' ? '' : snapshot.sessionKey, 'REQ', 'probe'),
    ];
    const probe = () => {
      runtime.queryClient
        .getQueryCache()
        .build(runtime.queryClient, { queryKey: key, meta: { deps: ['REQ'] } });
      runtime.queryClient.setQueryData(key, 'cached');
    };

    // AD-14: the review-start fact, by the seam only.
    probe();
    const before = (await hooks.inspect()).worldVersion;
    expect(await hooks.startReview('REQ-0042')).toEqual({ marker: TEST_REQUEST_SEAMS_MARKER });
    expect((await hooks.inspect()).worldVersion).toBe(before + 1);
    expect(runtime.queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    expect(await status()).toMatchObject({ status: 'under-review', reviewStarted: true });
    // Started once: the seam refuses a second start and writes nothing.
    await expect(hooks.startReview('REQ-0042')).rejects.toThrow(/review-start seam was refused/);
    expect((await hooks.inspect()).worldVersion).toBe(before + 1);

    // The Super Admin approves it External, in a session of their own.
    const page = ok(
      (await hooks.actAs('sa-arjun-mehta', {
        port: 'accessRequests',
        method: 'getRequestForDecision',
        input: 'REQ-0042',
      })) as { ok: true; value: { request: { rev: number } } },
    );
    ok(
      (await hooks.actAs('sa-arjun-mehta', {
        port: 'accessRequests',
        method: 'approveRequest',
        input: { id: 'REQ-0042', route: 'external', expectedRev: page.request.rev },
      })) as { ok: true; value: unknown },
    );
    let view = await status();
    expect(view).toMatchObject({
      status: 'approved-payment-required',
      nextStep: 'continue-to-payment',
    });

    // TE-4: a planned "pending" leaves the payment unconfirmed — "Check again", never "pay again".
    expect(await hooks.planPayment('pending')).toEqual({ marker: TEST_REQUEST_SEAMS_MARKER });
    ok(await ports.accessRequests.startPayment({ request: view.routeId, expectedRev: view.rev }));
    view = await status();
    expect(view).toMatchObject({ status: 'payment-not-confirmed', nextStep: 'check-again' });

    // The provider's later report: failed → "Try payment again"; nothing activated.
    probe();
    const failed = (await hooks.reportPayment('REQ-0042', 'failed')) as { ok: boolean };
    expect(failed.ok).toBe(true);
    expect(runtime.queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    view = await status();
    expect(view).toMatchObject({
      status: 'payment-failed',
      nextStep: 'try-payment-again',
      activatedPlanId: null,
    });

    // Tried again, and this time the local prototype stand-in confirms on start: access activates.
    ok(await ports.accessRequests.startPayment({ request: view.routeId, expectedRev: view.rev }));
    view = await status();
    expect(view).toMatchObject({ status: 'access-active', nextStep: 'sign-in' });
    expect(view.activatedPlanId).toMatch(/^ACC-\d{4}$/);

    // A report on a request with no payment under way is refused and writes nothing.
    const settled = (await hooks.inspect()).worldVersion;
    expect(await hooks.reportPayment('REQ-0042', 'confirmed')).toMatchObject({
      ok: false,
      error: { kind: 'invalid-state' },
    });
    expect((await hooks.inspect()).worldVersion).toBe(settled);

    // Malformed calls fail loudly: the seams name a request by its reference only.
    await expect(hooks.startReview(sent.routeId)).rejects.toThrow(/by its reference/);
    await expect(hooks.startReview('REQ-9999')).rejects.toThrow(/review-start seam was refused/);
    await expect(hooks.reportPayment('REQ-0042', 'pending')).rejects.toThrow(/confirmed or failed/);
    await expect(hooks.planPayment('paid')).rejects.toThrow(/pending, failed or confirmed/);
    expect((await hooks.inspect()).worldVersion).toBe(settled);
  });
});
