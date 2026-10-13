/**
 * M01 Institution, M02 Institute Admin assignment, M05 Access plan (Appendix C §2).
 * Boards: B1-11, B7-02, B7-03, B7-04, B7-09, B2-01, B2-02, B2-03, B2-05, 08.
 *
 * The institution stores one status fact — its pause. Every other status word is derived from its
 * plans' dates and the clock, so one change (Pause) updates every surface (BC14). There is no
 * Campus entity: a campus is an Institution (STK31-23; Appendix C M01 [U]). A plan's licence
 * figure is `Provided` — shown as approved, never consumed or derived (T-06, D7).
 */
import type { ActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  AccessPlanId,
  ExperimentId,
  InstituteAdminAssignmentId,
  InstitutionId,
  PersonId,
  RequestId,
} from '../kernel/ids.js';
import type { Provided } from '../kernel/provided.js';
import type { RecordMeta } from '../kernel/record.js';
import type { CalendarDate, IsoInstant } from '../kernel/time.js';

/** 'Internal — BITS campus or programme' | 'External institution' (B1-11), set once (T-04). */
export type InstitutionKind = 'internal' | 'external';

export const INSTITUTION_STATUSES = [
  'approved-payment-required',
  'access-active',
  'ending-soon',
  'access-paused',
  'access-ended',
] as const;

export type InstitutionStatus = (typeof INSTITUTION_STATUSES)[number];

export interface InstitutionPause {
  readonly since: IsoInstant;
  readonly by: ActorRef;
  /** "Add a reason — it is kept in the history" (B7-03 f7). */
  readonly reason: string;
}

export type InstitutionEvent =
  | 'record-created'
  | 'access-activated'
  | 'institute-admin-assigned'
  | 'paused'
  | 'restored'
  | 'student-status-overridden'
  | 'access-ended'
  | 'renewal-requested'
  /** "Request REQ-0040 received - additional licences" (B7-02 data). */
  | 'licences-requested';

export interface InstituteAdminAssignment {
  readonly id: InstituteAdminAssignmentId;
  readonly institutionId: InstitutionId;
  readonly name: string;
  readonly workEmail: string;
  readonly assignedAt: IsoInstant;
  readonly assignedBy: ActorRef;
  /** The identity the session resolves (M26). */
  readonly personId: PersonId;
}

export interface Institution extends RecordMeta {
  readonly id: InstitutionId;
  readonly name: string;
  readonly kind: InstitutionKind;
  /** 'Open request REQ-0042' (B7-03): created only by approving its first request (T-09). */
  readonly createdFromRequestId: RequestId;
  readonly pause: InstitutionPause | null;
  readonly instituteAdmin: InstituteAdminAssignment | null;
  readonly history: readonly HistoryEntry<InstitutionEvent>[];
}

/** Request term options (B1-07); the Super Admin decides Monthly · Quarterly · Yearly (B1-11). */
export type AccessPlanTerm = 'monthly' | 'quarterly' | 'yearly' | 'until-date';

export const ACCESS_PLAN_STATUSES = [
  'access-active',
  'ending-soon',
  'paused',
  'access-ended',
] as const;

export type AccessPlanStatus = (typeof ACCESS_PLAN_STATUSES)[number];

/** "Experiments in this plan": experiments × formats (B2-03). */
export interface AccessPlanItem {
  readonly experimentId: ExperimentId;
  readonly formats: readonly Technology[];
}

export type AccessPlanEvent =
  | 'activated'
  | 'paused'
  | 'restored'
  | 'ending-soon'
  | 'ended'
  | 'renewal-requested'
  | 'renewed'
  | 'access-given'
  | 'access-withdrawn';

export interface AccessPlan extends RecordMeta {
  /** ACC-0107 — exists only after activation (B1-08 PU-13). */
  readonly id: AccessPlanId;
  readonly institutionId: InstitutionId;
  /** 'From request REQ-0042'. */
  readonly sourceRequestId: RequestId;
  readonly items: readonly AccessPlanItem[];
  /** 'Licences 120 — as approved by BITS' (B2-03). Never consumed or derived. */
  readonly licences: Provided<number>;
  readonly term: AccessPlanTerm;
  readonly startsOn: CalendarDate;
  readonly endsOn: CalendarDate;
  /** 'Active since 8 Oct 2026, 15:05'. */
  readonly activatedAt: IsoInstant;
  readonly history: readonly HistoryEntry<AccessPlanEvent>[];
}
