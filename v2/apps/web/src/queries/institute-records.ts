'use client';

/**
 * The Institute Admin's Package-2B reads (IA-09 Faculty record, IA-13 Groups, IA-14 Group, IA-15
 * Faculty courses, IA-16 Course codes; boards B2-03, B2-06, B2-08, B2-09), through `PeopleService`,
 * `GroupService`, `FacultyCourseService` and `InstitutionCourseCodeService`. The port resolves who
 * is asking from the session and reads the admin's own institution only; every standing, status
 * and refusal is the adapter's. The writes are commands (`useCommand`): `createGroup`,
 * `renameGroup`, `addMembers`, `removeMember`, `facultyCourses.assign` / `previewRemoval` /
 * `remove`, `institutionCourseCodes.set`, `previewStudentImport` (a check that writes nothing) and
 * `commitStudentImport` — their receipts (`PER`, `GRP`, `FMAP`, `CCODE`) refresh these reads.
 */
import {
  parseInput,
  type ProductPorts,
  setInstitutionCourseCodeInput,
  toErrorSummary,
} from '@xr/contracts/draft';
import type { CourseId, GroupId, PersonId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** IA-09: `getFaculty` — the faculty member, their mappings and the courses those name. */
export const facultyRecord = defineQuery({
  family: 'PER',
  view: 'institute-faculty-record',
  deps: ['PER', 'FMAP', 'CRS'],
  // The address is untrusted text: existence and scope are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, facultyId: string) => ports.people.getFaculty(facultyId as PersonId),
});

export function useFacultyRecord(facultyId: string) {
  return useXrQuery(facultyRecord, facultyId);
}

/** IA-15: `FacultyCourseService.list` — every mapping of the institution (current and removed). */
export const facultyCourseList = defineQuery({
  family: 'FMAP',
  view: 'institute-faculty-courses',
  deps: ['FMAP', 'PER', 'CRS'],
  read: (ports: ProductPorts) => ports.facultyCourses.list(),
});

export function useFacultyCourseList(enabled = true) {
  return useXrQuery(facultyCourseList, null, { enabled });
}

/**
 * IA-14: `getGroup` — the group, its current members with their standing per live group grant,
 * and its grants as the page names them (PC-46).
 */
export const groupRecord = defineQuery({
  family: 'GRP',
  view: 'institute-group',
  deps: ['GRP', 'PER', 'SACC', 'ACC', 'EXP', 'CRS', 'INST'],
  read: (ports: ProductPorts, groupId: string) => ports.groups.getGroup(groupId as GroupId),
});

export function useGroupRecord(groupId: string) {
  return useXrQuery(groupRecord, groupId);
}

/**
 * IA-16: `InstitutionCourseCodeService.list` — each course in content access, its BITS code and
 * the institution's own code with its status.
 */
export const courseCodeList = defineQuery({
  family: 'CCODE',
  view: 'institute-course-codes',
  deps: ['CCODE', 'ACC', 'CRS', 'EXP', 'INST'],
  read: (ports: ProductPorts) => ports.institutionCourseCodes.list(),
});

export function useCourseCodeList(enabled = true) {
  return useXrQuery(courseCodeList, null, { enabled });
}

/**
 * B2-03 `save`: one course's code and semester checked by the contract's own input schema — the
 * rule the adapter applies again ("Add your course code, or clear the semester"). Nothing is sent;
 * `null` when the row may be saved.
 */
export function checkCourseCode(
  courseId: string,
  code: string,
  semester: string,
  expectedRev: number | null,
): string | null {
  const parsed = parseInput(
    setInstitutionCourseCodeInput,
    { courseId: courseId as CourseId, code, semester, expectedRev },
    null,
  );
  if (parsed.ok) return null;
  const [item] = toErrorSummary(parsed.error).items;
  return item?.message ?? null;
}
