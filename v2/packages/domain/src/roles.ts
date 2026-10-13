/**
 * The seven authenticated roles — and no eighth (STK31-01, STK31-02, STK31-03; PM-07;
 * v46 owner binding constraint BC1). PUBLIC is a surface, not a role.
 *
 * - The role ids are stable internal identifiers. The id `tenant_admin` is kept; its
 *   display name is "Institute Admin" (docs/OPEN_DECISIONS.md A-20, annotated with the
 *   v46 position and not resolved).
 * - Internal BITS / WILP content teams operate through the Vendor role.
 * - One role per signed-in person (v46: choosing between several roles is not designed).
 *
 * Source: ui-ux/17-stakeholder-correction-blueprint/04_FINAL_ROLE_AND_AUTHORITY_MODEL.md;
 * display names: design/handoff-v46 board B8-03 (frozen canvas v46).
 */
import type { PersonId } from './kernel/ids.js';

export const PLATFORM_ROLES = [
  'student',
  'faculty',
  'tenant_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
] as const;

export type Role = (typeof PLATFORM_ROLES)[number];

/** Which plane a role acts on. The Super Admin spans both (FRD 1.3.5, PM-13). */
export type RolePlane = 'tenant' | 'platform' | 'both';

export const ROLE_PLANE: Readonly<Record<Role, RolePlane>> = {
  student: 'tenant',
  faculty: 'tenant',
  tenant_admin: 'tenant',
  vendor: 'platform',
  academic_reviewer: 'platform',
  content_manager: 'platform',
  super_admin: 'both',
};

/**
 * Role display names as the frozen v46 boards draw them (B8-03). The only role words
 * that may reach product copy. Labels are copy: changing one never changes a role id.
 */
export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  student: 'Student',
  faculty: 'Faculty',
  tenant_admin: 'Institute Admin',
  vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer',
  content_manager: 'Content Manager',
  super_admin: 'Super Admin',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value);
}

/**
 * Who reads a label, a history entry or a read model. PUBLIC is an audience of the public
 * surface, never a role (BC1; Appendix C §1.3).
 */
export type Audience = Role | 'public';

/**
 * Non-human writers (Appendix C §1.3, §3.18). Each is driven only by the seed and by tests —
 * never by a control of any kind, product or developer (ADR-0002 decision 6, ADR-0007).
 *
 * - `runtime-report`: runtime activity and the completion report (completing event open, T-12).
 * - `payment-provider`: the payment outcome (provider open, T-05).
 * - `workflow-routing`: routes a resubmission, only to the drawn default (OD-B5-05, M-3).
 * - `release-setting`: a result released by the assessment's own setting (B4-14 D4).
 * - `term-clock`: Ending soon / Access ended by the plan term.
 * - `review-start`: the request's "BITS started reviewing" fact, from the seed or a test only —
 *   opening SA-03 never starts review (owner decision AD-14 / P1-04, 12 Oct 2026; ADR-0007 §4).
 * - `objective-marks`: choice-question marks supplied by fixtures, with no scoring engine
 *   (DV-2 interim; ATT-07 UNRESOLVED; P4-01).
 */
export const SYSTEM_ACTORS = [
  'system:runtime-report',
  'system:payment-provider',
  'system:workflow-routing',
  'system:release-setting',
  'system:term-clock',
  'system:review-start',
  'system:objective-marks',
] as const;

export type SystemActor = (typeof SYSTEM_ACTORS)[number];

/** A signed-in person acting in their one role (one role per person, P2; XS-02 deferred). */
export interface PersonActorRef {
  readonly kind: 'person';
  readonly personId: PersonId;
  readonly role: Role;
  readonly displayName: string;
}

/** The public contact person of a request: no account (T-01). */
export interface RequesterActorRef {
  readonly kind: 'requester';
  readonly name: string;
}

export interface SystemActorRef<S extends SystemActor = SystemActor> {
  readonly kind: 'system';
  readonly system: S;
}

/** Who did something — recorded on history entries and decisions (Appendix C §1.3). */
export type ActorRef = PersonActorRef | RequesterActorRef | SystemActorRef;

export function systemActor<S extends SystemActor>(system: S): SystemActorRef<S> {
  return { kind: 'system', system };
}
