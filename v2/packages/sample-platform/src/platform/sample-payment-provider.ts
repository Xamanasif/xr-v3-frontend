/**
 * The simulated payment provider's page, as the platform serves it (owner decisions DP-05 and DP-06,
 * 5 Nov 2026; B2B milestone I3; a build that runs the sample stand-ins only). It stands in for a
 * payment provider's page: no amount, no payment details and no provider exist, and nothing is
 * collected. The payer — whoever may open the request (O-05: the browser session holding its
 * ticket, or the requesting institution's signed-in Institute Admin) — chooses what the provider
 * reports for the payment waiting on that request. The report is written by
 * `system:payment-provider` with `sample-standin` provenance, exactly as the TE-4 stand-in's, so
 * approval, payment and activation stay separate events (BR-036) and "mark paid" stays impossible:
 *
 * - **confirmed**: access activates as the domain decides (a new external institution's plan is
 *   created; renewal and more licences keep OD-B3-09 open). Refused while the institution is paused
 *   (DP-08): the payment stays unconfirmed, with its history, until access is restored.
 * - **failed**: "Payment not completed"; the payer may try the payment again (a new attempt).
 * - leaving it unconfirmed reports nothing: the payment waits (DP-06) and can be answered here later.
 *
 * Every attempt stays in the request's record and history. An internal request never waits for a
 * payment (REQ-09), so it never appears here.
 */
import type { RecordRef, RequestRouteId } from '@xr/domain';

import type { ProductPorts } from '@xr/contracts/draft';
import { reportPayment } from '../handlers/payment-provider.js';
import type { PlatformCore } from './core.js';

/** A payment waiting for the provider that this tab's session may answer. */
export interface SamplePaymentWaiting {
  readonly routeId: string;
  readonly reference: string;
  readonly institutionName: string;
  /** When the waiting attempt started. */
  readonly startedAt: string;
}

export type SamplePaymentAnswer =
  | { readonly ok: true; readonly changed: readonly RecordRef[] }
  | {
      readonly ok: false;
      readonly reason: 'not-found' | 'not-waiting' | 'institution-paused';
    };

export interface SamplePaymentProvider {
  /**
   * Whether "Continue to payment" sends the payer to the provider page: true when nothing answers a
   * started payment on its own (the prototype profile); false in a local build, whose stand-in
   * confirms each payment as it starts (the page then answers only payments left waiting).
   */
  readonly sendsPayerToPage: boolean;
  /** The payments waiting for the provider that this tab's session may open, newest first. */
  waiting(): Promise<readonly SamplePaymentWaiting[]>;
  /** The provider's report on the payment waiting for the request at this address. */
  report(routeId: string, outcome: 'confirmed' | 'failed'): Promise<SamplePaymentAnswer>;
}

export function samplePaymentProvider(
  core: PlatformCore,
  ports: ProductPorts,
): SamplePaymentProvider {
  /** The request's status page as this session may read it — the O-05 gate — or `null`. */
  const openable = async (routeId: string) => {
    const answer = await ports.accessRequests.getRequestStatus(routeId as RequestRouteId);
    return answer.ok ? answer.value : null;
  };
  return {
    sendsPayerToPage: core.payments.mode !== 'confirm-on-start',
    async waiting() {
      const pending = Object.values(core.store.world.records.requests).filter(
        (request) =>
          request.status === 'payment-not-confirmed' &&
          request.payments.at(-1)?.outcome === 'pending',
      );
      const shown: SamplePaymentWaiting[] = [];
      for (const request of pending) {
        if (!(await openable(request.routeId))) continue;
        shown.push({
          routeId: request.routeId,
          reference: request.id,
          institutionName: request.institutionName,
          startedAt: request.payments.at(-1)!.startedAt,
        });
      }
      return shown.sort((a, b) =>
        a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0,
      );
    },
    async report(routeId, outcome) {
      // Only whoever may open the request answers for it; anyone else learns nothing of it (O-05).
      const view = await openable(routeId);
      if (!view) return { ok: false, reason: 'not-found' };
      return core.store.serialize((): SamplePaymentAnswer => {
        const request = core.store.world.records.requests[view.reference];
        if (
          !request ||
          request.status !== 'payment-not-confirmed' ||
          request.payments.at(-1)?.outcome !== 'pending'
        ) {
          return { ok: false, reason: 'not-waiting' };
        }
        const reported = reportPayment(core, { requestId: request.id, outcome }, 'sample-standin');
        if (reported.ok) return { ok: true, changed: reported.changed };
        return {
          ok: false,
          reason:
            reported.error.current === 'institution-paused' ? 'institution-paused' : 'not-waiting',
        };
      });
    },
  };
}
