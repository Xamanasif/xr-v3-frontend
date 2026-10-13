/**
 * M12 Person (Student, Faculty), M13 Group + membership, M14 Faculty course mapping (Appendix C §2).
 * Programme is free text on the Student record only (BC2). Adding a person creates a record only:
 * no invitation or activation (T-11). Nothing is hard-deleted (BR-126).
 */
import {
  ACCOUNT_STATUSES,
  type FacultyCourseMapping,
  type FacultyPerson,
  GROUP_MEMBER_STANDINGS,
  type Group,
  type GroupEvent,
  type GroupMembership,
  type Person,
  type PersonEvent,
  STUDENT_DIRECTORY_STATUSES,
  type StudentCourseFiling,
  type StudentPerson,
} from '@xr/domain';
import { z } from 'zod';

import {
  actorRef,
  courseId,
  facultyCourseMappingId,
  groupId,
  historyOf,
  institutionId,
  isoInstant,
  personId,
  recordMeta,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const PERSON_EVENTS = vocabulary<PersonEvent>()([
  'added',
  'imported',
  'deactivated',
  'reactivated',
  'status-overridden',
  'group-joined',
  'group-left',
  'access-given',
  'access-withdrawn',
  'course-assigned',
  'course-removed',
]);

export const GROUP_EVENTS = vocabulary<GroupEvent>()([
  'created',
  'renamed',
  'member-added',
  'member-removed',
  'access-given',
]);

export const accountStatus = z.enum(ACCOUNT_STATUSES);
export const studentDirectoryStatus = z.enum(STUDENT_DIRECTORY_STATUSES);
export const groupMemberStanding = z.enum(GROUP_MEMBER_STANDINGS);

const personBase = {
  ...recordMeta,
  id: personId,
  institutionId,
  fullName: z.string().min(1),
  institutionEmail: z.string().min(1),
  accountStatus,
  added: z.object({
    at: isoInstant,
    by: actorRef,
    how: z.enum(['form', 'import']),
    importFileName: z.string().nullable(),
  }),
  history: historyOf(PERSON_EVENTS),
};

export const studentCourseFiling = typedAs<StudentCourseFiling>()(
  z.object({
    courseId,
    codeAsGiven: z.string().min(1),
    filedAt: isoInstant,
    source: z.literal('import'),
  }),
);

export const studentPerson = typedAs<StudentPerson>()(
  z.object({
    ...personBase,
    kind: z.literal('student'),
    institutionStudentId: z.string().min(1),
    programme: z.string().nullable(),
    courseFilings: z.array(studentCourseFiling),
    deactivation: z.object({ at: isoInstant, by: actorRef, reason: z.string().min(1) }).nullable(),
  }),
);

export const facultyPerson = typedAs<FacultyPerson>()(
  z.object({ ...personBase, kind: z.literal('faculty') }),
);

export const person = typedAs<Person>()(z.union([studentPerson, facultyPerson]));

export const groupMembership = typedAs<GroupMembership>()(
  z.object({
    studentId: personId,
    addedAt: isoInstant,
    addedBy: actorRef,
    removedAt: isoInstant.nullable(),
    removedBy: actorRef.nullable(),
  }),
);

export const group = typedAs<Group>()(
  z.object({
    ...recordMeta,
    id: groupId,
    institutionId,
    name: z.string().min(1),
    createdAt: isoInstant,
    createdBy: actorRef,
    memberships: z.array(groupMembership),
    history: historyOf(GROUP_EVENTS),
  }),
);

/** FMAP-0021: sets the Faculty workspace scope; gives students nothing (B2-09). */
export const facultyCourseMapping = typedAs<FacultyCourseMapping>()(
  z.object({
    ...recordMeta,
    id: facultyCourseMappingId,
    institutionId,
    facultyId: personId,
    courseId,
    assignedAt: isoInstant,
    assignedBy: actorRef,
    removedAt: isoInstant.nullable(),
    removedBy: actorRef.nullable(),
  }),
);
