/**
 * What every call shares: the tab's world store, the sample clock, the nonce source, the test-only
 * fault plan and the stand-in policies. One core per platform (per browser tab); any number of
 * session contexts over it.
 */
import type { MethodId } from '@xr/contracts/draft';
import type {
  IsoInstant,
  OverlapGrantPolicy,
  PersonId,
  QuestionDraft,
  QuestionImportRow,
  RecordRef,
  StudentImportRow,
  WorkflowRoutingPolicy,
} from '@xr/domain';

import type { SampleClockControl } from '../clock/clock.js';
import type { BrowserSession } from '../session/browser-session.js';
import type { WorldStore } from '../store/store.js';

/**
 * Command ids, session nonces, launch nonces and browser-session ids (Appendix D §3.4): from an
 * injected deterministic source — never a random number.
 */
export interface NonceSource {
  next(kind: 'command' | 'session' | 'launch' | 'browser'): string;
}

const NONCE_PREFIX = { command: 'cmd', session: 'ses', launch: 'lch', browser: 'bs' } as const;

/** Deterministic counters; `commandsSoFar` continues past the command ids a world's history holds. */
export function counterNonces(commandsSoFar = 0): NonceSource {
  const counters = { command: commandsSoFar, session: 0, launch: 0, browser: 0 };
  return {
    next(kind) {
      counters[kind] += 1;
      return `${NONCE_PREFIX[kind]}-${String(counters[kind]).padStart(6, '0')}`;
    },
  };
}

/**
 * Fault injection for the drawn failure frames (Appendix D §7.4): `unavailable` for the next N
 * calls of a method. Populated only through `@xr/sample-platform/testing`; the product never
 * reaches it, and an empty plan changes nothing.
 */
export class FaultPlan {
  readonly #pending = new Map<string, number>();

  failNext(method: MethodId, times = 1): void {
    this.#pending.set(method, (this.#pending.get(method) ?? 0) + times);
  }

  /** Consumes one planned failure of the method, if any. */
  take(method: string): boolean {
    const left = this.#pending.get(method) ?? 0;
    if (left === 0) return false;
    if (left === 1) this.#pending.delete(method);
    else this.#pending.set(method, left - 1);
    return true;
  }

  clear(): void {
    this.#pending.clear();
  }
}

/** What the sample payment provider reports for a payment just started (TE-4). */
export type PaymentStandInOutcome = 'confirmed' | 'failed' | 'pending';

/**
 * The sample payment provider (TE-4; owner authorisation of Package 1C, 14 Oct 2026; ADR-0007
 * amendment): "Continue to payment" may be confirmed by the approved sample payment stand-in in
 * local prototype builds. No amount, method or provider exists, nothing is collected, and no person
 * reports an outcome — the stand-in is the provider's report (`system:payment-provider`, sample
 * provenance), separate from the payment start, the approval and the activation (BR-036).
 *
 * - `confirm-on-start` (the web composition root, sample mode): each started payment is confirmed.
 * - `provider-reports` (default; the seed, the walk, the contract suite): nothing is reported until
 *   the stand-in port is called.
 *
 * "Payment not confirmed" and "Payment failed" are reached only through fixtures and CI test hooks
 * (`plan`, from `@xr/sample-platform/testing`), never through the product (P1-06, P1-18).
 */
export class PaymentStandIn {
  readonly mode: 'confirm-on-start' | 'provider-reports';
  readonly #planned: PaymentStandInOutcome[] = [];

  constructor(mode: 'confirm-on-start' | 'provider-reports') {
    this.mode = mode;
  }

  /** CI and fixtures only: what the provider reports for the next payment started. */
  plan(outcome: PaymentStandInOutcome): void {
    this.#planned.push(outcome);
  }

  /** The report for a payment just started — `null` leaves it pending ("Payment not confirmed"). */
  take(): 'confirmed' | 'failed' | null {
    const planned = this.#planned.shift();
    if (planned !== undefined) return planned === 'pending' ? null : planned;
    return this.mode === 'confirm-on-start' ? 'confirmed' : null;
  }

  clear(): void {
    this.#planned.length = 0;
  }
}

/**
 * A checked student-import file waiting to be committed (IA-11 step 2 → 3). Adapter state, not a
 * world record — a preview writes nothing. `previewStudentImport` (Phase-2 Package 2B: the CSV
 * parsed by the service) creates these; the walk's S1 and tests may stage validated rows directly.
 */
export interface StagedStudentImport {
  readonly batchId: string;
  readonly institutionId: string;
  readonly fileName: string;
  readonly rows: readonly StudentImportRow[];
}

/** A checked question file waiting for its commit (FA-17 step 2 → 3; adapter state). */
export interface StagedQuestionImport {
  readonly batchId: string;
  readonly institutionId: string;
  readonly experimentId: string;
  readonly personId: string;
  readonly fileName: string;
  readonly rows: readonly QuestionImportRow[];
}

export interface PlatformCore {
  readonly store: WorldStore;
  readonly clock: SampleClockControl;
  readonly nonces: NonceSource;
  readonly faults: FaultPlan;
  readonly imports: Map<string, StagedStudentImport>;
  /** FA-16 drafts waiting for their Faculty member's review (adapter state, never a world record). */
  readonly drafts: Map<string, QuestionDraft>;
  /** FA-17 checked question files waiting for the commit (adapter state). */
  readonly questionImports: Map<string, StagedQuestionImport>;
  /**
   * PC-60 (owner answer to P4-01, 16 Oct 2026): `answer-key-on-submit` — a local prototype build —
   * lets the `system:objective-marks` stand-in mark choice questions by the pinned key when a
   * Student submits; `supplied-only` keeps the DV-2 interim (fixture-supplied marks only).
   */
  readonly objectiveMarks: 'answer-key-on-submit' | 'supplied-only';
  /** OD-B2-01 / OD-B2-02 — no default; the Phase-0 interim answers `undecided` (DV-1). */
  readonly overlap: OverlapGrantPolicy;
  /** OD-B5-05 / M-3 — can only return the drawn default (B5-08). */
  readonly routing: WorkflowRoutingPolicy;
  /** TE-4: the sample payment provider's report after a payment is started. */
  readonly payments: PaymentStandIn;
  /**
   * This platform's world, as the composition root named it (ADR-0009): the request tickets a
   * browser session holds are good for this world only.
   */
  readonly instance: string;
}

/** A signed-in session: only the person id is kept (ADR-0003 §1). */
export interface SessionState {
  readonly personId: PersonId;
  readonly nonce: string;
  readonly signedInAt: IsoInstant;
  readonly returnTo: string | null;
}

/** The first answer of a session-scoped command (sign-in, the selection) for `commandId` repeats. */
export interface SessionReceipt {
  readonly method: string;
  readonly value: unknown;
  readonly changed: readonly RecordRef[];
}

/** One browser tab's session over the shared world. */
export class SessionContext {
  session: SessionState | null = null;
  readonly browser: BrowserSession;
  readonly receipts = new Map<string, SessionReceipt>();

  constructor(browser: BrowserSession) {
    this.browser = browser;
  }

  /** The query-cache partition (Appendix F §4.6): `person:<id>#<nonce>` or `public:<browser id>`. */
  get sessionKey(): string {
    return this.session
      ? `person:${this.session.personId}#${this.session.nonce}`
      : this.browser.key;
  }
}

/** What one port call carries: the core, the session and the client-minted command id, if any. */
export interface Call {
  readonly core: PlatformCore;
  readonly context: SessionContext;
  readonly commandId: string | null;
}
