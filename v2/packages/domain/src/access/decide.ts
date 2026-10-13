/**
 * Give students access and withdraw an individual grant (Appendix C M15; matrix SACC-01, -02, -04
 * … -11; B2-04, B2-05). No format picker: formats are inherited from the plan (SACC-03). No licence
 * arithmetic anywhere: a wait is a supplied fact (T-06, D7; ACC-08).
 */
import type { PersonActorRef } from '../roles.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isBlank,
  notPermitted,
  ok,
  policyOpen,
  refused,
} from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId } from '../kernel/ids.js';
import { isDrawnTransition } from '../kernel/machine.js';
import { newMeta, nextMeta, ref } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import { accessPlanStatus } from '../institution/decide.js';
import type { AccessPlan, AccessPlanEvent, Institution } from '../institution/model.js';
import type { Group, StudentPerson } from '../people/model.js';
import { currentMembers } from '../people/decide.js';
import {
  GRANT_TRANSITIONS,
  type LicenceAvailabilityOracle,
  type ProvidedLicenceWait,
  type StudentAccessGrant,
} from './model.js';

const ADMIN_READERS = ['tenant_admin', 'super_admin'] as const;

export type GiveAccessTarget =
  | { readonly kind: 'students'; readonly students: readonly StudentPerson[] }
  /** One non-empty group; `members` are its current members' records. */
  | { readonly kind: 'group'; readonly group: Group; readonly members: readonly StudentPerson[] };

export interface GiveAccessInput {
  readonly institution: Institution;
  /** The institution's active plan; null before activation ("nothing held"). */
  readonly plan: AccessPlan | null;
  readonly experimentIds: readonly ExperimentId[];
  readonly target: GiveAccessTarget;
  /** The institution's existing grants. */
  readonly grants: readonly StudentAccessGrant[];
  readonly licences: LicenceAvailabilityOracle;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

export interface GiveAccessOutcome {
  readonly grants: readonly StudentAccessGrant[];
  /** Supplied waits for the new grants ("Waiting for a licence" — seeded answers only). */
  readonly waits: readonly ProvidedLicenceWait[];
  readonly plan: AccessPlan;
  /** The affected students' records with the "Given …" history entry. */
  readonly students: readonly StudentPerson[];
}

/**
 * Give students access (SACC-01 individual, SACC-02 group; B2-05's three steps). Refused while
 * paused, after the plan has ended or before activation (SACC-05; B2-05 f15–17), for an
 * experiment not in the plan (SACC-04), for an inactive student or one who already has it
 * individually (SACC-06), and for an empty group ("Add members before giving access").
 */
export function giveAccess(input: GiveAccessInput): Decision<GiveAccessOutcome> {
  if (input.institution.pause) return refused('institution-paused');
  if (!input.plan) return refused('nothing-held');
  const status = accessPlanStatus(input.plan, input.institution, input.now);
  if (status === 'access-ended') return refused('plan-ended');
  if (input.plan.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  if (input.experimentIds.length === 0)
    return invalidInput({ field: 'experimentIds', rule: 'required' });
  const inPlan = new Set(input.plan.items.map((item) => item.experimentId));
  if (input.experimentIds.some((id) => !inPlan.has(id))) return refused('experiment-not-in-plan');

  const recipients =
    input.target.kind === 'students' ? input.target.students : input.target.members;
  if (input.target.kind === 'students') {
    if (recipients.length === 0) return invalidInput({ field: 'students', rule: 'required' });
  } else {
    if (input.target.group.institutionId !== input.institution.id)
      return notPermitted('out-of-scope');
    const members = new Set(currentMembers(input.target.group));
    if (members.size === 0) return refused('group-empty');
    if (recipients.some((student) => !members.has(student.id)))
      return invalidState('members-changed');
  }
  if (recipients.some((student) => student.institutionId !== input.institution.id)) {
    return notPermitted('out-of-scope');
  }
  if (input.target.kind === 'students') {
    if (recipients.some((student) => student.accountStatus === 'inactive'))
      return refused('student-inactive');
    const hasIt = (student: StudentPerson, experimentId: ExperimentId) =>
      input.grants.some(
        (grant) =>
          grant.state === 'active' &&
          grant.experimentId === experimentId &&
          grant.target.kind === 'student' &&
          grant.target.studentId === student.id,
      );
    if (recipients.some((student) => input.experimentIds.some((id) => hasIt(student, id)))) {
      return refused('already-given');
    }
  }
  if (!isDrawnTransition(GRANT_TRANSITIONS, null, 'active', 'giveAccess'))
    return invalidState('none');

  const plan = input.plan;
  const grants: StudentAccessGrant[] = [];
  const waits: ProvidedLicenceWait[] = [];
  const planEntries: HistoryEntry<AccessPlanEvent>[] = [];
  const given = (
    targetKind: 'student' | 'group',
    experimentId: ExperimentId,
    studentId?: StudentPerson['id'],
  ) => {
    const id = input.ids.next('studentAccessGrant');
    const grant: StudentAccessGrant = {
      ...newMeta(input.now),
      id,
      institutionId: input.institution.id,
      accessPlanId: plan.id,
      experimentId,
      target:
        targetKind === 'student'
          ? { kind: 'student', studentId: studentId! }
          : { kind: 'group', groupId: (input.target as { group: Group }).group.id },
      givenAt: input.now,
      givenBy: input.actor,
      state: 'active',
      withdrawal: null,
      history: [
        historyEntry({
          id: input.ids.next('history'),
          event: 'given',
          at: input.now,
          actor: input.actor,
          visibleTo: ADMIN_READERS,
        }),
      ],
    };
    grants.push(grant);
    planEntries.push(
      historyEntry({
        id: input.ids.next('history'),
        event: 'access-given' as const,
        at: input.now,
        actor: input.actor,
        note: targetKind,
        visibleTo: ADMIN_READERS,
        refs: [ref('SACC', id)],
      }),
    );
    return grant;
  };
  for (const experimentId of input.experimentIds) {
    if (input.target.kind === 'students') {
      for (const student of recipients) {
        const grant = given('student', experimentId, student.id);
        if (input.licences.waitFor({ planId: plan.id, studentId: student.id, experimentId })) {
          waits.push({ grantId: grant.id, studentId: student.id, since: input.now });
        }
      }
    } else {
      const grant = given('group', experimentId);
      for (const student of recipients) {
        if (input.licences.waitFor({ planId: plan.id, studentId: student.id, experimentId })) {
          waits.push({ grantId: grant.id, studentId: student.id, since: input.now });
        }
      }
    }
  }
  return ok({
    grants,
    waits,
    plan: { ...plan, ...nextMeta(plan, input.now), history: [...plan.history, ...planEntries] },
    students: recipients.map((student) => ({
      ...student,
      ...nextMeta(student, input.now),
      history: [
        ...student.history,
        ...grants
          .filter(
            (grant) =>
              grant.target.kind === 'group' ||
              (grant.target.kind === 'student' && grant.target.studentId === student.id),
          )
          .map((grant) =>
            historyEntry({
              id: input.ids.next('history'),
              event: 'access-given' as const,
              at: input.now,
              actor: input.actor,
              note: grant.target.kind,
              visibleTo: ADMIN_READERS,
              refs: [ref('SACC', grant.id)],
            }),
          ),
      ],
    })),
  });
}

export interface WithdrawGrantInput {
  readonly grant: StudentAccessGrant;
  readonly institution: Institution;
  readonly plan: AccessPlan;
  /** The grant's student (individual grants). */
  readonly student: StudentPerson | null;
  readonly reason: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

export interface WithdrawGrantOutcome {
  readonly grant: StudentAccessGrant;
  readonly student: StudentPerson;
  readonly plan: AccessPlan;
}

/**
 * Withdraw an individual grant (SACC-07; DL-2): "Enter the reason for withdrawing access" —
 * "Kept in the access history, which your institution's administrators can see." Work is kept.
 * Group grants are changed on the group, which draws no control (SACC-08 OPEN, OD-B2-01). Not while paused
 * (SACC-09); not for an inactive student (SACC-10); after the plan has ended it is not drawn
 * (SACC-11 UNRESOLVED). The dialog says nothing about licences, and nothing is counted.
 */
export function withdrawGrant(input: WithdrawGrantInput): Decision<WithdrawGrantOutcome> {
  if (input.grant.target.kind === 'group') return policyOpen('OD-B2-01'); // SACC-08
  if (input.grant.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  if (input.institution.pause) return refused('institution-paused');
  if (!isDrawnTransition(GRANT_TRANSITIONS, input.grant.state, 'withdrawn', 'withdrawGrant')) {
    return invalidState(input.grant.state);
  }
  if (accessPlanStatus(input.plan, input.institution, input.now) === 'access-ended')
    return policyOpen('SACC-11');
  const student = input.student;
  if (!student || student.id !== input.grant.target.studentId)
    return invalidState('student-mismatch');
  if (student.accountStatus === 'inactive') return refused('student-inactive');
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    grant: {
      ...input.grant,
      ...nextMeta(input.grant, input.now),
      state: 'withdrawn',
      withdrawal: { at: input.now, by: input.actor, reason },
      history: [
        ...input.grant.history,
        historyEntry({
          id: input.ids.next('history'),
          event: 'withdrawn',
          at: input.now,
          actor: input.actor,
          note: reason,
          visibleTo: ADMIN_READERS,
        }),
      ],
    },
    student: {
      ...student,
      ...nextMeta(student, input.now),
      history: [
        ...student.history,
        historyEntry({
          id: input.ids.next('history'),
          event: 'access-withdrawn',
          at: input.now,
          actor: input.actor,
          note: reason,
          visibleTo: ADMIN_READERS,
          refs: [ref('SACC', input.grant.id)],
        }),
      ],
    },
    plan: {
      ...input.plan,
      ...nextMeta(input.plan, input.now),
      history: [
        ...input.plan.history,
        historyEntry({
          id: input.ids.next('history'),
          event: 'access-withdrawn',
          at: input.now,
          actor: input.actor,
          visibleTo: ADMIN_READERS,
          refs: [ref('SACC', input.grant.id)],
        }),
      ],
    },
  });
}
