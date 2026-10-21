'use client';

import { useMemo } from 'react';

import { useAllStudents } from '@/queries/people';

import type { StudentNames } from './transfer-view';

/**
 * The institution's students by id (`PeopleService.listStudents`, unfiltered): the name and
 * institution student id B3-09 writes for each request ("Rahul Verma · GIT-2026-0418"). A failed
 * read names none rather than blocking the page: the request's own history names the student
 * (state-copy `IA-18.student`).
 */
export function useStudentNames(): { readonly byId: StudentNames; readonly pending: boolean } {
  const students = useAllStudents();
  const answer = students.data;
  const byId = useMemo<StudentNames>(
    () =>
      answer?.ok
        ? new Map(
            answer.value.map((row) => [
              row.student.id as string,
              {
                fullName: row.student.fullName,
                institutionStudentId: row.student.institutionStudentId,
              },
            ]),
          )
        : new Map(),
    [answer],
  );
  return { byId, pending: students.isPending && !students.isError };
}
