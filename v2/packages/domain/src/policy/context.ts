/**
 * The policy context (Appendix F §5.1): who acts — resolved from records, never passed by the
 * caller (Appendix C §3.0 rule 1) — and `now`. PUBLIC is a surface: a visitor or requester without
 * an account, never a role (BC1; P1).
 */
import type { PersonActorRef, Role, SystemActorRef } from '../roles.js';
import type { ExperimentId, InstitutionId, RequestStatusToken } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import type { PlatformRoleHolder } from '../platform-roles/platform-roles.js';

export interface PublicActor {
  readonly kind: 'public';
  /** The status-page key held by the session that sent a request (REQ-04; T-01). */
  readonly requestTokens: readonly RequestStatusToken[];
}

export interface PersonActor {
  readonly kind: 'person';
  readonly ref: PersonActorRef;
  /** Tenant roles: the person's institution (Student, Faculty, Institute Admin). */
  readonly institutionId: InstitutionId | null;
  /** Platform roles: the holder record with its scopes (Vendor, Academic Reviewer, Content Manager). */
  readonly holder: PlatformRoleHolder | null;
  /** Faculty: experiments in their scope — Faculty courses ∩ experiments held (FCM-04, `facultyScope`).
   *  A Vendor's courses are not passed: the policy reads them from `holder`'s scopes (CRS-08). */
  readonly taughtExperiments: readonly ExperimentId[];
}

export interface SystemPolicyActor {
  readonly kind: 'system';
  readonly ref: SystemActorRef;
}

export type PolicyActor = PublicActor | PersonActor | SystemPolicyActor;

export interface PolicyContext {
  readonly actor: PolicyActor;
  readonly now: IsoInstant;
}

export function roleOf(actor: PolicyActor): Role | 'public' | null {
  return actor.kind === 'person' ? actor.ref.role : actor.kind === 'public' ? 'public' : null;
}
