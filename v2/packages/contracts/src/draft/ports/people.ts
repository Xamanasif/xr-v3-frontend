/**
 * §3.6 People, groups, Faculty courses, institution course codes (Institute Admin) — IA-06…IA-11,
 * IA-13…IA-16. Every write refuses `institution-paused` while the institution is paused — one rule
 * for all (B2-01 "Pages are read-only until BITS lifts the pause."). Adding a person creates a
 * record only: no invitation (T-11). A Faculty course mapping gives students nothing (B2-09).
 */
import type {
  FacultyCourseMapping,
  FacultyPerson,
  Group,
  InstitutionCourseCode,
  StudentPerson,
} from '@xr/domain';
import { emailAsDrawn, optionalTrimmed, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  courseId,
  expectedRev,
  experimentId,
  groupId,
  ids,
  importBatchId,
  platformCourseCode,
  technology,
} from '../kernel/primitives.js';
import { institutionCodeStatus, institutionCourseCode } from '../records/catalogue.js';
import {
  facultyCourseMapping,
  facultyPerson,
  group,
  groupMemberStanding,
  studentDirectoryStatus,
  studentPerson,
} from '../records/people.js';
import { studentAccessGrant } from '../records/access.js';
import type {
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  StaleVersion,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import { courseCard } from './catalogue.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';
import { grantRow } from './student-access.js';

// ---- PeopleService ----

/**
 * IA-06 (B2-06): Search ("Name, student ID or e-mail", ignoring case), Status and Group. The
 * Group filter's "Not in a group" is `notInGroup` (Phase-2 Package 2A, provisional register PC-39).
 */
export const listStudentsInput = z.object({
  status: studentDirectoryStatus.optional(),
  groupId: ids.in.group.optional(),
  notInGroup: z.boolean().optional(),
  search: z.string().optional(),
});

const personFields = {
  fullName: requiredTrimmed(key('IA-10.fullName.required')),
  institutionEmail: emailAsDrawn(
    key('IA-10.institutionEmail.required'),
    key('IA-10.institutionEmail.format'),
  ),
};

/** IA-10 (B2-07): uniqueness ("already belongs to someone in People", "is already used by") needs the records — the domain decides it. */
export const addStudentInput = z.object({
  ...personFields,
  institutionStudentId: requiredTrimmed(key('IA-10.institutionStudentId.required')),
  programme: optionalTrimmed(),
  groupId: ids.in.group.nullable(),
});

export const addFacultyInput = z.object(personFields);

/** IA-11 step 1: "Choose a CSV file first". Parsing the rows is Phase 2. */
export const previewStudentImportInput = z.object({
  fileName: requiredTrimmed(key('IA-11.file.required')),
  csvText: z.string(),
});

export const commitStudentImportInput = z.object({ batchId: ids.in.importBatch });

export const deactivateStudentInput = z.object({
  id: ids.in.person,
  reason: requiredTrimmed(key('IA-07.reason.required')),
  expectedRev,
});

export const reactivateStudentInput = z.object({ id: ids.in.person, expectedRev });

export const STUDENT_IMPORT_FIELDS = [
  'studentId',
  'fullName',
  'email',
  'programme',
  'course',
  'courseCode',
] as const;

/**
 * IA-11 step 2 (B2-07): one problem per row × field, as a rule key — words come from the copy
 * catalogue. Any error blocks the whole import (all-or-nothing interim, T-24). A course code that
 * names no course is an error — a PROVISIONAL WP-0.9 reading (provisional register).
 */
export const studentImportReport = z.object({
  batchId: importBatchId,
  fileName: z.string().min(1),
  rowsChecked: z.number().int().min(0),
  readyToImport: z.number().int().min(0),
  problems: z.array(
    z.object({
      row: z.number().int().min(1),
      field: z.enum(STUDENT_IMPORT_FIELDS),
      rule: z.enum([
        'required',
        'email-format',
        'in-people',
        'duplicate-in-file',
        'unknown-course',
      ]),
    }),
  ),
  canImport: z.boolean(),
});

/**
 * A course as People names it — "ME ZG523 · Thermodynamics & Heat Transfer" (B2-06 IA-06 "Course
 * and group", IA-07 "Courses and groups", IA-08 "Courses taught"): the platform course's name and
 * code, read from the course record (Phase-2 Package 2A, PC-40).
 */
export const peopleCourse = z.object({
  id: courseId,
  name: z.string().min(1),
  platformCode: platformCourseCode.nullable(),
});

/**
 * IA-06 row (B2-06): the student, the directory status, their current groups ("Course and group")
 * and the experiments active grants give them now ("Experiments given", formats inherited from the
 * plan item, LD-1) — facts the screen cannot read from one record (Phase-2 Package 2A, PC-39) —
 * and the courses the student is filed against (PC-40).
 */
export const studentDirectoryRow = z.object({
  student: studentPerson,
  directoryStatus: studentDirectoryStatus,
  groups: z.array(z.object({ id: groupId, name: z.string().min(1) })),
  given: z.array(z.object({ experimentId, name: z.string().min(1), formats: z.array(technology) })),
  courses: z.array(peopleCourse),
});
export const listStudentsOutput = z.array(studentDirectoryRow);
/**
 * IA-07 (B2-06 f8 … f13, f17). `courses` are the courses the student is filed against; `grantRows`
 * are the grants that reach the student — their individual grants in any state and the grants of
 * the groups they are in now — each as IA-04 reads it for this student (experiment name, course
 * code, formats inherited from the plan item, the Institute Admin's grant word, "Also in" an
 * active group grant, a supplied licence wait): facts `grants` alone does not answer (Phase-2
 * Package 2A, PC-40). No can / can't-open statement is made (OD-B2-01).
 */
export const getStudentOutput = z.object({
  student: studentPerson,
  groups: z.array(group),
  grants: z.array(studentAccessGrant),
  courses: z.array(peopleCourse),
  grantRows: z.array(grantRow),
});
export const commitStudentImportOutput = z.object({ added: z.number().int().min(0) });
/** IA-08 rows (B2-06 f14): `courses` names the courses `coursesTaught` lists (PC-40). */
export const listFacultyOutput = z.array(
  z.object({
    faculty: facultyPerson,
    coursesTaught: z.array(courseId),
    courses: z.array(peopleCourse),
  }),
);
export const getFacultyOutput = z.object({
  faculty: facultyPerson,
  mappings: z.array(facultyCourseMapping),
});

type IaWriteErrors = NotSignedIn | NotPermitted | Refused<'institution-paused'> | Unavailable;

export interface PeopleService {
  listStudents(
    filter: In<typeof listStudentsInput>,
  ): Answer<Out<typeof listStudentsOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getStudent(
    id: In<typeof ids.in.person>,
  ): Answer<Out<typeof getStudentOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  addStudent(
    input: In<typeof addStudentInput>,
  ): Answer<StudentPerson, ValidationFailed | NotFound | IaWriteErrors>;
  addFaculty(
    input: In<typeof addFacultyInput>,
  ): Answer<FacultyPerson, ValidationFailed | IaWriteErrors>;
  previewStudentImport(
    input: In<typeof previewStudentImportInput>,
  ): Answer<Out<typeof studentImportReport>, ValidationFailed | IaWriteErrors>;
  /** Every row or none (T-24 interim); `invalid-state` while the report has errors. */
  commitStudentImport(
    input: In<typeof commitStudentImportInput>,
  ): Answer<
    Out<typeof commitStudentImportOutput>,
    ValidationFailed | NotFound | InvalidState | IaWriteErrors
  >;
  /** Policy-open: PER-07 (deactivating a Faculty member is not designed). */
  deactivateStudent(
    input: In<typeof deactivateStudentInput>,
  ): Answer<
    StudentPerson,
    ValidationFailed | NotFound | InvalidState | StaleVersion | PolicyOpen | IaWriteErrors
  >;
  /** Policy-open: PER-07. */
  reactivateStudent(
    input: In<typeof reactivateStudentInput>,
  ): Answer<StudentPerson, NotFound | InvalidState | StaleVersion | PolicyOpen | IaWriteErrors>;
  listFaculty(): Answer<Out<typeof listFacultyOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getFaculty(
    id: In<typeof ids.in.person>,
  ): Answer<Out<typeof getFacultyOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
}

export type StudentDirectoryRow = Out<typeof studentDirectoryRow>;
export type PeopleCourse = Out<typeof peopleCourse>;
export type StudentRecordView = Out<typeof getStudentOutput>;
export type FacultyDirectoryRow = Out<typeof listFacultyOutput>[number];

// ---- GroupService ----

export const createGroupInput = z.object({ name: requiredTrimmed(key('IA-13.name.required')) });
export const renameGroupInput = z.object({
  id: ids.in.group,
  name: requiredTrimmed(key('IA-13.name.required')),
  expectedRev,
});
export const addMembersInput = z.object({
  id: ids.in.group,
  studentIds: z.array(ids.in.person, { error: key('contract.invalid-input') }),
  expectedRev,
});
export const removeMemberInput = z.object({
  id: ids.in.group,
  studentId: ids.in.person,
  expectedRev,
});

export const listGroupsOutput = z.array(z.object({ group, memberCount: z.number().int().min(0) }));
/**
 * IA-14: each member's standing per group grant. Where the overlap rule is undecided (OD-B2-01),
 * the standing is the open decision itself — no "Can open it" is computed (WP-0.9 DV-1).
 */
export const memberStanding = z.union([
  groupMemberStanding,
  z.object({ kind: z.literal('policy-open'), decision: z.string().min(1) }),
]);

export const getGroupOutput = z.object({
  group,
  members: z.array(z.object({ student: studentPerson, standing: z.array(memberStanding) })),
  grants: z.array(studentAccessGrant),
});

export interface GroupService {
  listGroups(): Answer<Out<typeof listGroupsOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /** Policy-open: OD-B2-01 / OD-B2-02 / GRP-05 in a member's standing (no "Can open it" is computed). */
  getGroup(
    id: In<typeof ids.in.group>,
  ): Answer<Out<typeof getGroupOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  createGroup(input: In<typeof createGroupInput>): Answer<Group, ValidationFailed | IaWriteErrors>;
  renameGroup(
    input: In<typeof renameGroupInput>,
  ): Answer<Group, ValidationFailed | NotFound | StaleVersion | IaWriteErrors>;
  /** "Already a member" is `invalid-state` (WP-0.9), where Appendix C proposed `conflict`. */
  addMembers(
    input: In<typeof addMembersInput>,
  ): Answer<Group, ValidationFailed | NotFound | InvalidState | StaleVersion | IaWriteErrors>;
  removeMember(
    input: In<typeof removeMemberInput>,
  ): Answer<Group, NotFound | InvalidState | StaleVersion | IaWriteErrors>;
}

// ---- FacultyCourseService ----

export const assignFacultyCourseInput = z
  .object({
    facultyId: ids.in.person.nullable(),
    courseId: ids.in.course.nullable(),
  })
  .transform((input, context) => {
    // B2-09 `assign`: the faculty member first, then the course — one message at a time.
    if (input.facultyId === null) {
      context.addIssue({
        code: 'custom',
        path: ['facultyId'],
        message: key('IA-15.facultyId.required'),
      });
      return z.NEVER;
    }
    if (input.courseId === null) {
      context.addIssue({
        code: 'custom',
        path: ['courseId'],
        message: key('IA-15.courseId.required'),
      });
      return z.NEVER;
    }
    return { facultyId: input.facultyId, courseId: input.courseId };
  });
export const previewRemovalInput = z.object({ mappingId: ids.in.facultyCourseMapping });
export const removeFacultyCourseInput = z.object({
  mappingId: ids.in.facultyCourseMapping,
  expectedRev,
});

export const listFacultyCoursesOutput = z.array(facultyCourseMapping);
/** IA-15 removal warning when written answers would be left with no Faculty marker (B4-09 f6). */
export const previewRemovalOutput = z.object({
  warning: z
    .object({ writtenAnswersWaiting: z.number().int().min(1), courseCode: z.string() })
    .nullable(),
});

export interface FacultyCourseService {
  list(): Answer<readonly FacultyCourseMapping[], NotSignedIn | NotPermitted | Unavailable>;
  /** "<name> already teaches <course>" is a field error (B2-09), not a `conflict`. */
  assign(
    input: In<typeof assignFacultyCourseInput>,
  ): Answer<FacultyCourseMapping, ValidationFailed | NotFound | IaWriteErrors>;
  /** Answers what removing would answer (`faculty-course.remove`): paused, or already removed. */
  previewRemoval(
    input: In<typeof previewRemovalInput>,
  ): Answer<Out<typeof previewRemovalOutput>, NotFound | InvalidState | IaWriteErrors>;
  remove(
    input: In<typeof removeFacultyCourseInput>,
  ): Answer<FacultyCourseMapping, NotFound | InvalidState | StaleVersion | IaWriteErrors>;
}

// ---- InstitutionCourseCodeService ----

/** IA-16 (B2-03): a semester needs a code; `expectedRev` is null for a first code. */
export const setInstitutionCourseCodeInput = z
  .object({
    courseId: ids.in.course,
    code: optionalTrimmed(),
    semester: optionalTrimmed(),
    expectedRev: expectedRev.nullable(),
  })
  .superRefine((input, context) => {
    if (input.code === null && input.semester !== null) {
      context.addIssue({
        code: 'custom',
        path: ['code'],
        message: key('IA-16.code.semester-needs-code'),
      });
    }
  });

export const listInstitutionCourseCodesOutput = z.array(
  z.object({
    course: courseCard,
    code: institutionCourseCode.nullable(),
    status: institutionCodeStatus,
  }),
);

export interface InstitutionCourseCodeService {
  list(): Answer<
    Out<typeof listInstitutionCourseCodesOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  set(
    input: In<typeof setInstitutionCourseCodeInput>,
  ): Answer<InstitutionCourseCode, ValidationFailed | NotFound | StaleVersion | IaWriteErrors>;
}
