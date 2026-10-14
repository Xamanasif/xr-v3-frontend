/**
 * What an adapter hands the contract suite (Appendix F §7.4: "`factory(fixture) → { ports,
 * session, standins, clock }`"). The mock (`@xr/sample-platform`, WP-0.11) supplies it now; an HTTP
 * adapter supplies the same shape later.
 *
 * Identity is set only through the test-harness session seam (`as`) — never through a UI, an
 * account switcher or a URL (ADR-0003 §5; owner constraint). The fixtures are the scripted-walk
 * points of Appendix F §4.3; the people are the documented sample people (Appendix C §4.1 [C]).
 */
import type { MethodId, ProductPorts } from '../ports/index.js';
import type { ImplementationPhase } from '../ledger/entry.js';
import type { StandinPorts } from '../standins/index.js';

/**
 * The scripted-walk points (Appendix F §3.7, §4.3): the spine-start seed; the walk after a flow
 * (A … F, the device chain); after Flow B's first step plus the untraced setup S1–S7; the 12 Oct
 * later sample; and the state-coverage world.
 */
export type ContractFixture =
  | { readonly kind: 'spine-start' }
  | { readonly kind: 'after-flow'; readonly flow: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'Device' }
  | { readonly kind: 'after-setup' }
  | { readonly kind: 'later-sample' }
  | { readonly kind: 'state-coverage' };

/** The documented sample people the flows name (Appendix C §4.1 [C]; flows.json; B8-04). */
export const SAMPLE_PEOPLE = {
  'Rahul Verma': 'student',
  'Meera Iyer': 'tenant_admin',
  'Dr S. Ranganathan': 'faculty',
  'Anil Shetty': 'vendor',
  'Prof. A. Menon': 'academic_reviewer',
  'Kavya Nair': 'content_manager',
  'Arjun Mehta': 'super_admin',
} as const;

export type SamplePerson = keyof typeof SAMPLE_PEOPLE;

/**
 * Test-only seams for the WP-0.9 system writers that have no Appendix C stand-in port (ADR-0007;
 * `@xr/sample-platform/testing`). A case that needs one it is not given reports "not run".
 */
export interface ContractSeams {
  /** AD-14 / P1-04: the seeded or test-only "BITS started reviewing" fact. */
  readonly recordReviewStarted?: (requestId: string) => void;
  /** DV-2: choice-question marks supplied by fixtures (no scoring function exists). */
  readonly supplyObjectiveMarks?: (attemptId: string) => void;
  /** M-3 / OD-B5-05: route a resubmission by the approved workflow rule (when the adapter holds it). */
  readonly routeResubmission?: (submissionId: string) => void;
}

/** World internals a few invariants read (sample provenance, invariant 12). */
export interface ContractInspection {
  /** The provenance of every runtime event the world holds (`sample-standin` / `sample-fixture`). */
  readonly runtimeEventOrigins: () => readonly string[];
}

export interface ContractSubject {
  /** The ledger phases whose methods this adapter implements (`['WP-0.11']` for the Phase-0 mock). */
  readonly implements: readonly ImplementationPhase[];
  /**
   * Later-phase methods it implements ahead of their phase, as an authorised package delivered
   * them (ledger `PACKAGE_DELIVERIES`); none by default.
   */
  readonly delivered?: readonly MethodId[];
  /** One visitor's browser session on the public surface, for the subject's lifetime. */
  readonly publicPorts: ProductPorts;
  /**
   * A further visitor in a browser session of its own — another browser, a cold visit (B1-08 "Who
   * can open this page"; O-05): it holds none of the request tickets `publicPorts` holds.
   */
  readonly newVisitor: () => ProductPorts;
  /** The ports as a documented sample person — set by the test-harness seam, never a UI. */
  readonly as: (person: SamplePerson) => ProductPorts;
  readonly standins: StandinPorts;
  readonly seams: ContractSeams;
  /**
   * Every record the world holds, keyed `KIND:id` (the `RecordRef` of the record): a read, a
   * preview or a refusal must leave it unchanged, and a command's `changed` must list exactly the
   * keys whose records it changed.
   */
  readonly snapshot: () => WorldSnapshot;
  readonly inspect?: ContractInspection;
}

export type WorldSnapshot = Readonly<Record<string, unknown>>;

/** Builds a fresh subject for a fixture, or `null` when the adapter cannot build that fixture yet. */
export type ContractFactory = (
  fixture: ContractFixture,
) => Promise<ContractSubject | null> | ContractSubject | null;

/** A case's needs: a fixture, the methods it calls, and any seam or inspection. */
export interface CaseRequirement {
  readonly fixture: ContractFixture;
  readonly methods: readonly MethodId[];
  readonly seams?: readonly (keyof ContractSeams)[];
  readonly inspection?: boolean;
}
