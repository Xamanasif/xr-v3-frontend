/**
 * Institution and access-plan decisions and derivations (Appendix C M01, M02, M05; matrix INST-*,
 * ACC-*). The institution and its plans change only by the Super Admin's request decisions, the
 * payment outcome (system), Pause / Restore and the term clock — never by Publish, Release, an
 * Institute Admin or a Student (Appendix D §5.2, BC9).
 */
import type { PersonActorRef } from '../roles.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isBlank,
  ok,
  policyOpen,
  refused,
} from '../kernel/decision.js';
import { historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { PersonId } from '../kernel/ids.js';
import { nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type {
  AccessPlan,
  AccessPlanStatus,
  Institution,
  InstitutionKind,
  InstitutionStatus,
} from './model.js';
import { planTermState } from './term.js';

/** A plan's status: the institution's pause, else the term clock (B2-03, B7-03). */
export function accessPlanStatus(
  plan: AccessPlan,
  institution: Institution,
  now: IsoInstant,
): AccessPlanStatus {
  if (institution.pause) return 'paused';
  const term = planTermState(plan, now);
  return term === 'active'
    ? 'access-active'
    : term === 'ending-soon'
      ? 'ending-soon'
      : 'access-ended';
}

/**
 * An institution's status is read, not stored (Appendix C M01): no plan yet → awaiting payment
 * (an external institution approved before payment); paused → paused; otherwise the most live
 * of its plans. A plan that ends while the institution is paused is not drawn [U]; the pause wins.
 */
export function institutionStatus(
  institution: Institution,
  plans: readonly AccessPlan[],
  now: IsoInstant,
): InstitutionStatus {
  const own = plans.filter((plan) => plan.institutionId === institution.id);
  if (own.length === 0) return 'approved-payment-required';
  if (institution.pause) return 'access-paused';
  const terms = own.map((plan) => planTermState(plan, now));
  if (terms.includes('active')) return 'access-active';
  if (terms.includes('ending-soon')) return 'ending-soon';
  return 'access-ended';
}

/** "Not set yet / Internal / External" (B1-10): the route of a new institution's first request. */
export function institutionKind(institution: Institution | null): InstitutionKind | null {
  return institution?.kind ?? null;
}

export interface PauseInput {
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
  readonly reason: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

export interface InstitutionChange {
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
}

/** Pause access (DL-2, reason kept in the history) — from Access active or Ending soon (INST-07). */
export function pauseInstitution(input: PauseInput): Decision<InstitutionChange> {
  const status = institutionStatus(input.institution, input.plans, input.now);
  if (status !== 'access-active' && status !== 'ending-soon') return invalidState(status);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const institution: Institution = {
    ...input.institution,
    ...nextMeta(input.institution, input.now),
    pause: { since: input.now, by: input.actor, reason: input.reason.trim() },
    history: [
      ...input.institution.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'paused',
        at: input.now,
        actor: input.actor,
        note: input.reason.trim(),
        visibleTo: ['super_admin'],
      }),
    ],
  };
  return ok({ institution, plans: withPlanEntry(input, 'paused') });
}

/** Restore access (DL-2, reason) — Access paused → the previous status (INST-08). */
export function restoreInstitution(input: PauseInput): Decision<InstitutionChange> {
  const status = institutionStatus(input.institution, input.plans, input.now);
  if (status !== 'access-paused') return invalidState(status);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const institution: Institution = {
    ...input.institution,
    ...nextMeta(input.institution, input.now),
    pause: null,
    history: [
      ...input.institution.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'restored',
        at: input.now,
        actor: input.actor,
        note: input.reason.trim(),
        visibleTo: ['super_admin'],
      }),
    ],
  };
  return ok({ institution, plans: withPlanEntry(input, 'restored') });
}

/** Plan history "Access paused by BITS" (B2-03). The pause reason shown to users is open [U]. */
function withPlanEntry(input: PauseInput, event: 'paused' | 'restored'): readonly AccessPlan[] {
  return input.plans
    .filter((plan) => plan.institutionId === input.institution.id)
    .map((plan) => ({
      ...plan,
      ...nextMeta(plan, input.now),
      history: [
        ...plan.history,
        historyEntry({
          id: input.ids.next('history'),
          event,
          at: input.now,
          actor: input.actor,
          visibleTo: ['tenant_admin', 'super_admin'],
        }),
      ],
    }));
}

export const WORK_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AssignInstituteAdminInput {
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
  readonly name: string;
  readonly workEmail: string;
  readonly personId: PersonId;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * Assign Institute Admin (name + work e-mail; "Nothing is sent from here") — once access is active
 * and while none is assigned (INST-04). Before activation: "The Institute Admin is assigned once
 * access is active." (B7-03 f3; INST-05, OD-B7-11). Replacing one is not designed (INST-06 OPEN).
 */
export function assignInstituteAdmin(input: AssignInstituteAdminInput): Decision<Institution> {
  const status = institutionStatus(input.institution, input.plans, input.now);
  if (status === 'approved-payment-required' || status === 'access-ended') {
    return refused('access-not-active');
  }
  if (input.institution.instituteAdmin) return policyOpen('INST-06');
  const issues = [
    ...(isBlank(input.name) ? [{ field: 'name', rule: 'required' }] : []),
    ...(isBlank(input.workEmail)
      ? [{ field: 'workEmail', rule: 'required' }]
      : WORK_EMAIL.test(input.workEmail.trim())
        ? []
        : [{ field: 'workEmail', rule: 'email-format' }]),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  const assignment = {
    id: input.ids.next('instituteAdminAssignment'),
    institutionId: input.institution.id,
    name: input.name.trim(),
    workEmail: input.workEmail.trim(),
    assignedAt: input.now,
    assignedBy: input.actor,
    personId: input.personId,
  };
  return ok({
    ...input.institution,
    ...nextMeta(input.institution, input.now),
    instituteAdmin: assignment,
    history: [
      ...input.institution.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'institute-admin-assigned',
        at: input.now,
        actor: input.actor,
        note: assignment.name,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}
