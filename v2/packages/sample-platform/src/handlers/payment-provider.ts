/**
 * The sample payment provider's report on a started payment (TE-4; Appendix C §3.18
 * `PaymentOutcomePort`; ADR-0007 amendment, Package 1C). The provider is not decided (T-05 / R06):
 * this is its stand-in — written by `system:payment-provider` with sample provenance, never by a
 * person, a product control or a "mark paid" (REQ-21). Confirmed for a new external institution:
 * the plan is created and access activates (ACC-02); confirmed for an existing institution: the
 * request reads Access active and no plan is written while OD-B3-09 is open; failed: "Try payment
 * again" (REQ-07). Approval, payment and activation stay separate events (BR-036).
 *
 * Two callers: the stand-in port of `./testing` (the seed walk, fixtures, tests) and — in a local
 * prototype build whose composition root asks for it (`paymentStandIn: 'confirm-on-start'`) —
 * `AccessRequestService.startPayment`, right after the payment it started has been committed.
 */
import type { DecisionOutcome, InvalidState, Result } from '@xr/contracts/draft';
import { reportPaymentOutcome, systemActor } from '@xr/domain';

import type { PlatformCore } from '../platform/core.js';
import { settle, SystemRefusal, systemCommand } from '../pipeline/runner.js';
import { plansOf } from '../world/queries.js';
import { forDecision } from './decision-view.js';
import type { SampleOrigin } from '../world/types.js';

export function reportPayment(
  core: PlatformCore,
  input: { readonly requestId: string; readonly outcome: 'confirmed' | 'failed' },
  origin: SampleOrigin,
): Result<DecisionOutcome, InvalidState> {
  const outcome = systemCommand(core, 'PaymentOutcomePort.report', origin, (op) => {
    const request = op.records.requests[input.requestId];
    if (!request) throw new SystemRefusal('unknown-request');
    const institution = request.institutionId
      ? op.records.institutions[request.institutionId]
      : undefined;
    if (!institution) throw new SystemRefusal(request.status);
    const actor = systemActor('system:payment-provider');
    const decided = settle(
      reportPaymentOutcome({
        request,
        outcome: input.outcome,
        institution,
        plans: plansOf(op.records, institution.id),
        actor,
        now: op.now,
        ids: op.ids,
      }),
    );
    op.tx.put('requests', decided.request.id, decided.request);
    if (decided.institution) op.tx.put('institutions', decided.institution.id, decided.institution);
    if (decided.plan) op.tx.put('plans', decided.plan.id, decided.plan);
    // The receipt carries the request without the requester's ticket (PC-34).
    const value: DecisionOutcome = { ...decided, request: forDecision(decided.request) };
    return { value, decision: 'reportPaymentOutcome', actor };
  });
  return outcome.ok
    ? { ok: true, value: outcome.value, changed: outcome.changed }
    : { ok: false, error: { kind: 'invalid-state', current: outcome.current } };
}
