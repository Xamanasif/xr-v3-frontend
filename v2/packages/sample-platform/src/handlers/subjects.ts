/**
 * The records a policy check reads (`@xr/domain` `Subject`), always loaded from the canonical
 * world — never from what the caller sent. The policy computes gates and scopes from these itself.
 */
import {
  type AccessFacts,
  type Course,
  type CorrectionUpdate,
  type Experiment,
  type FacultyCourseMapping,
  type Group,
  type Institution,
  type OverlapGrantPolicy,
  type Person,
  type StudentAccessGrant,
  type StudentPerson,
  type SubjectOf,
  type Submission,
} from '@xr/domain';

import {
  accessFacts,
  coursesInAccess,
  groupsOf,
  mappingsOf,
  openUpdateOf,
  peopleOf,
  plansOf,
} from '../world/queries.js';
import { formatKey, values } from '../world/records.js';
import type { SeededFacts, WorldRecords } from '../world/types.js';

export function institutionSubject(
  records: WorldRecords,
  institution: Institution,
): SubjectOf<'institution'> {
  return {
    kind: 'institution',
    institution,
    plans: plansOf(records, institution.id),
    people: peopleOf(records, institution.id),
    groups: groupsOf(records, institution.id),
    mappings: mappingsOf(records, institution.id),
    coursesInAccess: coursesInAccess(records, institution.id),
  };
}

export function personSubject(records: WorldRecords, person: Person): SubjectOf<'person'> | null {
  const institution = records.institutions[person.institutionId];
  return institution ? { kind: 'person', person, institution } : null;
}

export function grantSubject(
  records: WorldRecords,
  grant: StudentAccessGrant,
): SubjectOf<'grant'> | null {
  const institution = records.institutions[grant.institutionId];
  const plan = records.plans[grant.accessPlanId];
  if (!institution || !plan) return null;
  const student =
    grant.target.kind === 'student' ? (records.people[grant.target.studentId] ?? null) : null;
  return {
    kind: 'grant',
    grant,
    institution,
    plan,
    student: student?.kind === 'student' ? student : null,
  };
}

export function groupSubject(records: WorldRecords, group: Group): SubjectOf<'group'> | null {
  const institution = records.institutions[group.institutionId];
  return institution ? { kind: 'group', group, institution } : null;
}

export function facultyCourseSubject(
  records: WorldRecords,
  mapping: FacultyCourseMapping,
): SubjectOf<'faculty-course'> | null {
  const institution = records.institutions[mapping.institutionId];
  return institution ? { kind: 'faculty-course', mapping, institution } : null;
}

/** People filed against a course: students imported against it and Faculty teaching it (B7-07). */
export function filedAgainst(
  records: WorldRecords,
  courseId: string,
): { readonly students: number; readonly faculty: number } {
  return {
    students: values(records.people).filter(
      (person) =>
        person.kind === 'student' &&
        person.courseFilings.some((filing) => filing.courseId === courseId),
    ).length,
    faculty: new Set(
      values(records.mappings)
        .filter((mapping) => mapping.courseId === courseId && mapping.removedAt === null)
        .map((mapping) => mapping.facultyId as string),
    ).size,
  };
}

export function structureSubject(
  records: WorldRecords,
  course: Course | null,
): SubjectOf<'structure'> {
  return {
    kind: 'structure',
    areas: values(records.areas),
    courses: values(records.courses),
    course,
    filed: course ? filedAgainst(records, course.id) : { students: 0, faculty: 0 },
  };
}

export function experimentSubject(
  records: WorldRecords,
  experiment: Experiment,
): SubjectOf<'experiment'> {
  return { kind: 'experiment', experiment, openUpdate: openUpdateOf(records, experiment.id) };
}

export function updateSubject(
  records: WorldRecords,
  update: CorrectionUpdate,
): SubjectOf<'update'> | null {
  const experiment = records.experiments[update.experimentId];
  return experiment ? { kind: 'update', update, experiment } : null;
}

export function submissionSubject(
  records: WorldRecords,
  submission: Submission | null,
): SubjectOf<'submission'> {
  return { kind: 'submission', submission, holders: values(records.holders) };
}

/** A Student's experiment: the policy computes the open gate from `access` itself. */
export function learningSubject(
  records: WorldRecords,
  seeded: SeededFacts,
  overlap: OverlapGrantPolicy,
  student: StudentPerson,
  experiment: Experiment,
): SubjectOf<'learning'> | null {
  const access = accessFacts(records, seeded, student, overlap, experiment.id);
  if (!access) return null;
  return {
    kind: 'learning',
    experiment,
    access,
    webActivity: records.activities[formatKey(student.id, experiment.id, 'web')] ?? null,
  };
}

export function studentAccess(
  records: WorldRecords,
  seeded: SeededFacts,
  overlap: OverlapGrantPolicy,
  student: StudentPerson,
  experimentId: string | null,
): AccessFacts | null {
  return accessFacts(records, seeded, student, overlap, experimentId);
}
