/**
 * M15 Student access grant (SACC) + provided licence wait + open gate (Appendix C §2).
 * Boards: B2-04, B2-05, B2-06, B2-08, B2-10 … B2-13, B3-02, B3-03, 08.
 *
 * Student entitlement is written only by the Institute Admin — never by publication, release,
 * plan activation, runtime activity, a Faculty member or the Student (BC3, BC9; SACC-17, SACC-18).
 * Formats are never stored on a grant: they are inherited from the plan item (LD-1; SACC-03).
 * "Waiting for a licence" is drawn but its rule (D7) is undecided: the wait is a supplied fact,
 * never computed (T-06; ACC-09).
 */
import type { ActorRef } from '../roles.js';
import type { OpenRefusal } from '../kernel/decision.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  AccessPlanId,
  ExperimentId,
  GroupId,
  InstitutionId,
  PersonId,
  StudentAccessGrantId,
} from '../kernel/ids.js';
import type { TransitionTable } from '../kernel/machine.js';
import type { RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';

export type GrantTarget =
  | { readonly kind: 'student'; readonly studentId: PersonId }
  | { readonly kind: 'group'; readonly groupId: GroupId };

/** The only stored states. */
export const GRANT_STATES = ['active', 'withdrawn'] as const;
export type GrantState = (typeof GRANT_STATES)[number];

export interface StudentAccessGrant extends RecordMeta {
  /** SACC-0310 (individual) · SACC-0311 (group). */
  readonly id: StudentAccessGrantId;
  readonly institutionId: InstitutionId;
  /** Formats are inherited from this plan's item — never stored here (LD-1). */
  readonly accessPlanId: AccessPlanId;
  /** The Student-access unit is the Experiment. */
  readonly experimentId: ExperimentId;
  readonly target: GrantTarget;
  readonly givenAt: IsoInstant;
  readonly givenBy: ActorRef;
  readonly state: GrantState;
  /** Individual grants only. */
  readonly withdrawal: {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly reason: string;
  } | null;
  readonly history: readonly HistoryEntry<'given' | 'withdrawn'>[];
}

/**
 * A supplied "Waiting for a licence" fact for one Student under one grant (seed or the
 * `LicenceAvailabilityOracle` only). Its words differ by reader ("No licence is available for Arun
 * on ACC-0107 right now." / "… for you …", B2-06, B3-02) and live in copy, so the record holds facts
 * only [PROPOSED: Appendix C stores one message].
 */
export interface ProvidedLicenceWait {
  readonly grantId: StudentAccessGrantId;
  readonly studentId: PersonId;
  readonly since: IsoInstant;
}

export type GrantCommand = 'giveAccess' | 'withdrawGrant';

/** Appendix C M15: give (IA), withdraw an individual grant (IA). Group-grant withdrawal is not
 *  designed (SACC-08 OPEN); nothing else ever writes a grant. */
export const GRANT_TRANSITIONS: TransitionTable<GrantState, GrantCommand> = [
  { from: null, to: 'active', command: 'giveAccess', actors: ['tenant_admin'] },
  { from: 'active', to: 'withdrawn', command: 'withdrawGrant', actors: ['tenant_admin'] },
];

/** Per student × grant display status (Appendix C M15 table; words differ by screen, D-24). */
export const GRANT_DISPLAY_STATUSES = [
  'active',
  'waiting-for-a-licence',
  'student-inactive',
  'access-ended',
  'paused',
  'withdrawn',
  'individual-grant-withdrawn',
] as const;
export type GrantDisplayStatus = (typeof GRANT_DISPLAY_STATUSES)[number];

/** Can this Student open this experiment (× format) now? Evaluated on every read. */
export type OpenGate =
  | { readonly canOpen: true; readonly viaGrantIds: readonly StudentAccessGrantId[] }
  | { readonly canOpen: false; readonly reason: OpenRefusal }
  /** An undecided rule was reached; nothing opens and no can / can't statement is made. */
  | { readonly canOpen: false; readonly reason: 'policy-open'; readonly decision: string };

/**
 * OD-B2-01 / OD-B2-02 — the overlap of a withdrawn individual grant and an active group grant.
 * No default exists in the contract (Appendix C §3.18): the caller must pass a policy.
 */
export interface OverlapGrantPolicy {
  resolve(input: {
    readonly grants: readonly StudentAccessGrant[];
    readonly studentId: PersonId;
  }): 'open' | 'closed' | 'undecided';
}

/** The Phase-0 interim (DV-1; Appendix F §10.2): the overlap case is not decided → policy-open. */
export const UNDECIDED_OVERLAP_POLICY: OverlapGrantPolicy = { resolve: () => 'undecided' };

/** T-06 / D7: answers only from seeded sample-world data; never counts (Appendix C §3.18). */
export interface LicenceAvailabilityOracle {
  waitFor(input: {
    readonly planId: AccessPlanId;
    readonly studentId: PersonId;
    readonly experimentId: ExperimentId;
  }): { readonly waiting: true } | null;
}

/** The oracle that never supplies a wait (new grants are Active in the mock; AD-17). */
export const NO_LICENCE_WAITS: LicenceAvailabilityOracle = { waitFor: () => null };
