/**
 * The six test / seed-only stand-in ports (Appendix C §3.18; ADR-0008 decision 1) — exported only
 * from `@xr/contracts/draft/standins`, never from `./draft`, and fenced out of product code.
 *
 * They stand in for the non-human writers and for the board controls ("Restart", "Sample: …",
 * moving the sample date, the workflow routing a resubmission) that are not product features
 * (START-HERE Known exception 4). Only the seed loader and test harnesses call them. They have no
 * UI of any kind — no product control, no developer surface, no clock control, no runtime-event
 * or payment simulator, no account switcher (ADR-0002 decision 6, ADR-0007).
 *
 * Three are the WP-0.9 domain policy interfaces themselves, so an undecided rule keeps the one
 * shape the domain decides with: `WorkflowRoutingPolicy` can only return the drawn default
 * (OD-B5-05, M-3); `LicenceAvailabilityOracle` answers only from seeded data and never counts
 * (T-06, D7) — WP-0.9 answers `{ waiting: true } | null`, the wait record being written with the
 * grant; `OverlapGrantPolicy` has no default (OD-B2-01) and may answer `undecided`.
 */
import type {
  ActivityReport,
  ClockPort as DomainClockPort,
  CompletionReport,
  FormatCompletion,
  IsoInstant,
  LicenceAvailabilityOracle,
  OverlapGrantPolicy,
  RuntimeActivity,
  SystemActor,
  WorkflowRoutingPolicy,
} from '@xr/domain';
import { z } from 'zod';

import {
  accessPlanId,
  experimentId,
  ids,
  isoInstant,
  personId,
  technology,
} from '../kernel/primitives.js';
import { typedAs } from '../kernel/typed.js';
import { studentAccessGrant } from '../records/access.js';
import { formatCompletion, runtimeActivity } from '../records/learning.js';
import { submission } from '../records/submission.js';
import type { DecisionOutcome } from '../ports/access-request.js';
import { decisionOutcome } from '../ports/access-request.js';
import type { InvalidState, Result } from '../errors/service-error.js';

/** One clock for every service (BC14). `setSampleNow` exists for the seed and test harnesses only. */
export interface ClockPort extends DomainClockPort {
  setSampleNow(instant: IsoInstant): void;
}

export const paymentOutcomeInput = z.object({
  requestId: ids.in.request,
  outcome: z.enum(['confirmed', 'failed']),
});

/**
 * TE-4: the payment provider's report. Confirmed for a new external institution → plan created,
 * institution and request "Access active"; confirmed for a renewal, more licences or an existing
 * institution → `planEffect: policy-open OD-B3-09`, no plan written; failed → "Payment failed".
 */
export interface PaymentOutcomePort {
  report(input: z.input<typeof paymentOutcomeInput>): Result<DecisionOutcome, InvalidState>;
}

export const activityReportInput = typedAs<ActivityReport>()(
  z.object({
    studentId: personId,
    experimentId,
    format: technology,
    kind: z.enum(['opened', 'saved', 'session']),
    at: isoInstant,
  }),
);

export const completionReportInput = typedAs<CompletionReport>()(
  z.object({
    studentId: personId,
    experimentId,
    format: technology,
    at: isoInstant,
    from: z.enum(['simulation', 'headset']),
  }),
);

/**
 * X-7: runtime activity, and the completion report — the ONLY way a `FormatCompletion` is written
 * (by the system completion handler; the first completion stands). The completing event itself is
 * open (T-12): nothing here infers Completed from a launch, a session or time.
 */
export interface RuntimeReportPort {
  reportActivity(input: ActivityReport): Result<RuntimeActivity, InvalidState>;
  reportCompletion(input: CompletionReport): Result<FormatCompletion, InvalidState>;
}

export const licenceWaitInput = z.object({
  planId: accessPlanId,
  studentId: personId,
  experimentId,
});
export const overlapInput = z.object({
  grants: z.array(studentAccessGrant),
  studentId: personId,
});

export type { LicenceAvailabilityOracle, OverlapGrantPolicy, WorkflowRoutingPolicy };

/** How an adapter exposes the stand-ins to its seed loader and tests. */
export interface StandinPorts {
  readonly clock: ClockPort;
  readonly paymentOutcome: PaymentOutcomePort;
  readonly runtimeReport: RuntimeReportPort;
  readonly workflowRouting: WorkflowRoutingPolicy;
  readonly licenceAvailability: LicenceAvailabilityOracle;
  readonly overlapGrant: OverlapGrantPolicy;
}

export interface StandinLedgerEntry {
  readonly port:
    | 'ClockPort'
    | 'PaymentOutcomePort'
    | 'RuntimeReportPort'
    | 'WorkflowRoutingPolicy'
    | 'LicenceAvailabilityOracle'
    | 'OverlapGrantPolicy';
  readonly method: string;
  /** The system writer it stands in for (Appendix C §1.3), or `null` for the clock. */
  readonly writer: SystemActor | null;
  readonly input: z.ZodType | null;
  readonly output: z.ZodType;
  readonly mock: 'WP-0.11';
  /** What it may do — and what it never decides. */
  readonly rule: string;
}

/** The eight stand-in methods (Appendix C §3.18: "Six ports, eight methods"). */
export const STANDIN_LEDGER: readonly StandinLedgerEntry[] = [
  {
    port: 'ClockPort',
    method: 'now',
    writer: null,
    input: null,
    output: isoInstant,
    mock: 'WP-0.11',
    rule: 'The one sample-world clock every service reads (ADR-0007 §1, TE-5); nothing in the product shows or sets it.',
  },
  {
    port: 'ClockPort',
    method: 'setSampleNow',
    writer: null,
    input: isoInstant,
    output: z.undefined(),
    mock: 'WP-0.11',
    rule: 'Seed and test harnesses only (X-8: exported from @xr/sample-platform/testing).',
  },
  {
    port: 'PaymentOutcomePort',
    method: 'report',
    writer: 'system:payment-provider',
    input: paymentOutcomeInput,
    output: decisionOutcome,
    mock: 'WP-0.11',
    rule: 'TE-4. Only "confirmed" activates; a renewal or more licences answers planEffect policy-open OD-B3-09 and writes no plan.',
  },
  {
    port: 'RuntimeReportPort',
    method: 'reportActivity',
    writer: 'system:runtime-report',
    input: activityReportInput,
    output: runtimeActivity,
    mock: 'WP-0.11',
    rule: 'The only writer of runtime activity; activity never grants access or completes a format (BC3).',
  },
  {
    port: 'RuntimeReportPort',
    method: 'reportCompletion',
    writer: 'system:runtime-report',
    input: completionReportInput,
    output: formatCompletion,
    mock: 'WP-0.11',
    rule: 'The only route to a FormatCompletion; the first completion stands; the completing event stays open (T-12).',
  },
  {
    port: 'WorkflowRoutingPolicy',
    method: 'route',
    writer: 'system:workflow-routing',
    input: submission,
    output: z.object({ reason: z.literal('resubmission') }),
    mock: 'WP-0.11',
    rule: 'Can only return the drawn default — back to the Academic Reviewer (OD-B5-05, M-3; B5-08).',
  },
  {
    port: 'LicenceAvailabilityOracle',
    method: 'waitFor',
    writer: null,
    input: licenceWaitInput,
    output: z.object({ waiting: z.literal(true) }).nullable(),
    mock: 'WP-0.11',
    rule: 'Answers only from seeded sample data; never counts licences (T-06, D7).',
  },
  {
    port: 'OverlapGrantPolicy',
    method: 'resolve',
    writer: null,
    input: overlapInput,
    output: z.enum(['open', 'closed', 'undecided']),
    mock: 'WP-0.11',
    rule: 'No default (OD-B2-01 / OD-B2-02); the Phase-0 interim answers "undecided" → policy-open (DV-1).',
  },
];

/** A marker the bundle check looks for: this module must never reach a product build. */
export const STANDINS_MARKER = 'xr-contracts-draft-standins';
