/**
 * Reads over the records, shared by the actor resolver and the handlers. They select records and
 * hand them to `@xr/domain`; the rules themselves (gates, scopes, statuses) are never re-derived
 * here.
 */
import {
  type AccessFacts,
  type AccessPlan,
  type AuthorisedDevice,
  type CorrectionUpdate,
  type Course,
  type CourseId,
  type Experiment,
  type ExperimentId,
  facultyScope,
  type FacultyCourseMapping,
  type Group,
  type Institution,
  institutionsNamed,
  type IsoInstant,
  OPEN_UPDATE_STATES,
  type OverlapGrantPolicy,
  type Person,
  type PlatformRoleHolder,
  planTermState,
  type ProvidedLicenceWait,
  type StudentAccessGrant,
  type StudentPerson,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

import { deviceKey, values } from './records.js';
import type { SeededFacts, WorldRecords } from './types.js';

export function institutionById(records: WorldRecords, id: string): Institution | undefined {
  return records.institutions[id];
}

/**
 * SA-03 and the approval commands (DP-09 interim safeguard): the existing institutions whose name is
 * the same as a request's, while the request has no institution yet — approving it would create
 * one. Empty for a request that already has its institution (renewal, more licences).
 */
export function sameNameInstitutionsOf(
  records: WorldRecords,
  request: { readonly institutionId: string | null; readonly institutionName: string },
): readonly Institution[] {
  if (request.institutionId !== null) return [];
  return institutionsNamed(request.institutionName, values(records.institutions));
}

export function plansOf(records: WorldRecords, institutionId: string): AccessPlan[] {
  return values(records.plans).filter((plan) => plan.institutionId === institutionId);
}

export function peopleOf(records: WorldRecords, institutionId: string): Person[] {
  return values(records.people).filter((person) => person.institutionId === institutionId);
}

export function studentsOf(records: WorldRecords, institutionId: string): StudentPerson[] {
  return peopleOf(records, institutionId).filter(
    (person): person is StudentPerson => person.kind === 'student',
  );
}

export function studentById(records: WorldRecords, id: string): StudentPerson | undefined {
  const person = records.people[id];
  return person?.kind === 'student' ? person : undefined;
}

export function groupsOf(records: WorldRecords, institutionId: string): Group[] {
  return values(records.groups).filter((group) => group.institutionId === institutionId);
}

export function mappingsOf(records: WorldRecords, institutionId: string): FacultyCourseMapping[] {
  return values(records.mappings).filter((mapping) => mapping.institutionId === institutionId);
}

export function grantsOf(records: WorldRecords, institutionId: string): StudentAccessGrant[] {
  return values(records.grants).filter((grant) => grant.institutionId === institutionId);
}

export function waitsOf(records: WorldRecords, institutionId: string): ProvidedLicenceWait[] {
  const grants = new Set(grantsOf(records, institutionId).map((grant) => grant.id as string));
  return values(records.waits).filter((wait) => grants.has(wait.grantId));
}

/** Experiments in the institution's plans, with their course (BR-064 "experiments held"). */
export function heldExperiments(
  records: WorldRecords,
  institutionId: string,
): { readonly experimentId: ExperimentId; readonly courseId: CourseId }[] {
  const held = new Map<ExperimentId, CourseId>();
  for (const plan of plansOf(records, institutionId)) {
    for (const item of plan.items) {
      const experiment = records.experiments[item.experimentId];
      if (experiment) held.set(item.experimentId, experiment.courseId);
    }
  }
  return [...held].map(([experimentId, courseId]) => ({ experimentId, courseId }));
}

/** Courses in the institution's content access (CC-01, FCM-01 scope). */
export function coursesInAccess(records: WorldRecords, institutionId: string): CourseId[] {
  return [...new Set(heldExperiments(records, institutionId).map((held) => held.courseId))];
}

/** A Faculty member's experiments: Faculty courses ∩ experiments held (FCM-04, `facultyScope`). */
export function taughtExperiments(records: WorldRecords, faculty: Person): ExperimentId[] {
  return [
    ...facultyScope({
      facultyId: faculty.id,
      mappings: mappingsOf(records, faculty.institutionId),
      heldExperiments: heldExperiments(records, faculty.institutionId),
    }).experimentIds,
  ];
}

export function holderByPerson(
  records: WorldRecords,
  personId: string,
): PlatformRoleHolder | undefined {
  return values(records.holders).find((holder) => holder.personId === personId);
}

export function institutionOfInstituteAdmin(
  records: WorldRecords,
  personId: string,
): Institution | undefined {
  return values(records.institutions).find(
    (institution) => institution.instituteAdmin?.personId === personId,
  );
}

export function experimentById(records: WorldRecords, id: string): Experiment | undefined {
  return records.experiments[id];
}

export function courseById(records: WorldRecords, id: string): Course | undefined {
  return records.courses[id];
}

/** The experiment's one open correction (B6-08 "Never a second, conflicting update"). */
export function openUpdateOf(records: WorldRecords, experimentId: string): CorrectionUpdate | null {
  return (
    values(records.updates).find(
      (update) => update.experimentId === experimentId && OPEN_UPDATE_STATES.includes(update.state),
    ) ?? null
  );
}

/**
 * The plan a Give-access or a request is about: the institution's live plan holding the given
 * experiments, else its newest live plan, else its newest plan (an ended plan answers
 * `plan-ended`, none answers `nothing-held` — the domain decides).
 */
export function currentPlanOf(
  records: WorldRecords,
  institutionId: string,
  now: IsoInstant,
  experimentIds: readonly string[] = [],
): AccessPlan | null {
  const own = plansOf(records, institutionId).sort((a, b) =>
    a.activatedAt === b.activatedAt ? 0 : a.activatedAt < b.activatedAt ? 1 : -1,
  );
  const live = own.filter((plan) => planTermState(plan, now) !== 'ended');
  const holding = live.find((plan) =>
    experimentIds.every((id) => plan.items.some((item) => item.experimentId === id)),
  );
  return holding ?? live[0] ?? own[0] ?? null;
}

/** The records a Student's open gate reads (`AccessFacts`): computed by the domain, never here. */
export function accessFacts(
  records: WorldRecords,
  seeded: SeededFacts,
  student: StudentPerson,
  overlap: OverlapGrantPolicy,
  experimentId: string | null = null,
): AccessFacts | null {
  const institution = records.institutions[student.institutionId];
  if (!institution) return null;
  const unavailable: readonly Technology[] =
    experimentId === null ? [] : (seeded.unavailableRightNow[experimentId] ?? []);
  return {
    student,
    institution,
    plans: plansOf(records, institution.id),
    grants: grantsOf(records, institution.id),
    groups: groupsOf(records, institution.id),
    waits: waitsOf(records, institution.id),
    overlap,
    ...(unavailable.length > 0 ? { unavailableRightNow: unavailable } : {}),
  };
}

/** Experiments a Student has a grant for (any state), in grant order. */
export function experimentsGivenTo(records: WorldRecords, student: StudentPerson): ExperimentId[] {
  const memberOf = new Set(
    groupsOf(records, student.institutionId)
      .filter((group) =>
        group.memberships.some((membership) => membership.studentId === student.id),
      )
      .map((group) => group.id as string),
  );
  const ids: ExperimentId[] = [];
  for (const grant of grantsOf(records, student.institutionId)) {
    const reaches =
      grant.target.kind === 'student'
        ? grant.target.studentId === student.id
        : memberOf.has(grant.target.groupId);
    if (reaches && !ids.includes(grant.experimentId)) ids.push(grant.experimentId);
  }
  return ids;
}

/**
 * The authorised devices of the world (`studentId` narrows to one Student): the device records, and
 * — for a Student with no record for that format — a pre-authorised device the starting world
 * supplies for the Student's institution e-mail (P3-03, local prototype only). The record wins:
 * once a transfer is approved, the record is the Student's device.
 */
export function authorisedDevices(
  records: WorldRecords,
  seeded: SeededFacts,
  studentId: string | null = null,
): AuthorisedDevice[] {
  const held = values(records.devices).filter(
    (device) => studentId === null || device.studentId === studentId,
  );
  const supplied = (seeded.authorisedDevices ?? []).flatMap((fact): AuthorisedDevice[] => {
    const email = fact.institutionEmail.trim().toLowerCase();
    const student = studentsOf(records, fact.institutionId).find(
      (candidate) =>
        candidate.institutionEmail.trim().toLowerCase() === email &&
        (studentId === null || candidate.id === studentId),
    );
    if (!student || records.devices[deviceKey(student.id, fact.format)]) return [];
    return [
      {
        studentId: student.id,
        format: fact.format,
        description: fact.description,
        usedFor: fact.usedFor.map((id) => unsafeBrand<ExperimentId>(id)),
        since: fact.since,
        viaTransferId: null,
      },
    ];
  });
  return [...held, ...supplied];
}

/** A Student's authorised device for one format (a record, or a pre-authorised one), if any. */
export function authorisedDeviceOf(
  records: WorldRecords,
  seeded: SeededFacts,
  studentId: string,
  format: string,
): AuthorisedDevice | null {
  return (
    authorisedDevices(records, seeded, studentId).find((device) => device.format === format) ?? null
  );
}
