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

/**
 * A checked student-import file waiting to be committed (IA-11 step 2 → 3). Adapter state, not a
 * world record — a preview writes nothing. The Phase-2 preview (CSV parsing) creates these; in
 * WP-0.11 only the seed loader and tests stage the validated rows.
 */
export interface StagedStudentImport {
  readonly batchId: string;
  readonly institutionId: string;
  readonly fileName: string;
  readonly rows: readonly StudentImportRow[];
}

export interface PlatformCore {
  readonly store: WorldStore;
  readonly clock: SampleClockControl;
  readonly nonces: NonceSource;
  readonly faults: FaultPlan;
  readonly imports: Map<string, StagedStudentImport>;
  /** OD-B2-01 / OD-B2-02 — no default; the Phase-0 interim answers `undecided` (DV-1). */
  readonly overlap: OverlapGrantPolicy;
  /** OD-B5-05 / M-3 — can only return the drawn default (B5-08). */
  readonly routing: WorkflowRoutingPolicy;
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
