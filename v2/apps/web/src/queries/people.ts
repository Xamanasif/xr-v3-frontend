'use client';

/**
 * People for the Institute Admin (IA-06 Students, IA-07 Student record, IA-08 Faculty, IA-10 Add a
 * person; boards B2-06, B2-07), through `PeopleService` and `GroupService`. The port resolves who
 * is asking from the session: an Institute Admin reads and writes their own institution's People
 * only. The filters (Status, Group or "Not in a group", Search) go to the port, which decides which
 * students match; every status, grant word and refusal is the adapter's.
 *
 * The actions are commands — `useCommand(ports => ports.people.addStudent)` (also `addFaculty`,
 * `deactivateStudent`, `reactivateStudent`) — each sent with the revision the page read
 * (`expectedRev`); their receipts (`changed: PER`, `GRP`) refresh these reads.
 */
import {
  type ProductPorts,
  summaryTitleFor,
  toErrorSummary,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { GroupId, PersonId, StudentDirectoryStatus } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** The IA-06 filters as the toolbar holds them (`''` = not applied). */
export type StudentFilter = {
  readonly status: StudentDirectoryStatus | '';
  /** A group's id, or `not-in-group`. */
  readonly group: string;
  readonly search: string;
};

export const NOT_IN_GROUP = 'not-in-group';

/**
 * `listStudents`: the institution's students matching the filters, each with the directory status,
 * current groups, the experiments active grants give them now (formats from the plan) and the
 * courses they are filed against.
 */
export const studentDirectory = defineQuery({
  family: 'PER',
  view: 'institute-students',
  deps: ['PER', 'GRP', 'SACC', 'ACC', 'EXP', 'CRS'],
  read: (ports: ProductPorts, filter: StudentFilter) =>
    ports.people.listStudents({
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.group === NOT_IN_GROUP
        ? { notInGroup: true }
        : filter.group
          ? { groupId: filter.group as GroupId }
          : {}),
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

const NO_FILTER: StudentFilter = { status: '', group: '', search: '' };

/** The students for the filters; the rows on show stay while the next filter's rows load. */
export function useStudentDirectory(filter: StudentFilter) {
  return useXrQuery(studentDirectory, filter, { keepPrevious: true });
}

/** Every student, for the count's total ("3 of 12 students") and the empty state. */
export function useAllStudents() {
  return useXrQuery(studentDirectory, NO_FILTER);
}

/** `listFaculty`: the institution's faculty and the courses their current mappings name. */
export const facultyDirectory = defineQuery({
  family: 'PER',
  view: 'institute-faculty',
  deps: ['PER', 'FMAP', 'CRS'],
  read: (ports: ProductPorts) => ports.people.listFaculty(),
});

export function useFacultyDirectory(enabled = true) {
  return useXrQuery(facultyDirectory, null, { enabled });
}

/** `listGroups`: the institution's groups (IA-06's Group filter, IA-10's Group). */
export const groupList = defineQuery({
  family: 'GRP',
  view: 'institute-groups',
  deps: ['GRP'],
  read: (ports: ProductPorts) => ports.groups.listGroups(),
});

export function useGroupList(enabled = true) {
  return useXrQuery(groupList, null, { enabled });
}

/**
 * `getStudent`: the student, their groups, the grants that reach them (each as IA-04 reads it for
 * them) and the courses they are filed against (IA-07).
 */
export const studentRecord = defineQuery({
  family: 'PER',
  view: 'institute-student',
  deps: ['PER', 'GRP', 'SACC', 'ACC', 'EXP', 'CRS', 'INST'],
  // The address is untrusted text: existence and scope are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, studentId: string) => ports.people.getStudent(studentId as PersonId),
});

export function useStudentRecord(studentId: string) {
  return useXrQuery(studentRecord, studentId);
}

// ---- IA-10 Add a student / Add a faculty member (B2-07) ----

/** The IA-10 fields, by the contract's field names (`addStudentInput`, `addFacultyInput`). */
export type PersonField = 'fullName' | 'institutionEmail' | 'institutionStudentId';

const PERSON_FIELDS: ReadonlySet<string> = new Set([
  'fullName',
  'institutionEmail',
  'institutionStudentId',
]);

/** One field's drawn error, with the words its summary link uses. */
export interface PersonFieldError {
  readonly field: PersonField;
  readonly message: string;
  readonly summaryText: string;
}

/** The service's drawn words for the IA-10 fields, in the form's order (B2-07 `submit`). */
export function personFieldErrors(error: ValidationFailed): PersonFieldError[] {
  const errors: PersonFieldError[] = [];
  for (const item of toErrorSummary(error).items) {
    const field = item.field.split('.')[0]!;
    if (!PERSON_FIELDS.has(field) || !item.message) continue;
    if (errors.some((entry) => entry.field === field)) continue;
    errors.push({
      field: field as PersonField,
      message: item.message,
      summaryText: item.summaryText ?? item.message,
    });
  }
  return errors;
}

/**
 * B2-07 `errTitle`: "One thing needs fixing" / "2 things need fixing" — the catalogue's own title
 * for the form, recounted as typing clears a field's error.
 */
export function personSummaryTitle(count: number): string {
  return summaryTitleFor('IA-10', count) ?? '';
}
