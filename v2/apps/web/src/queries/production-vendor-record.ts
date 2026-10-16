'use client';

/**
 * The course a Vendor’s record names (VE-07 overline and Details › Course, B5-06: “ME ZG523 ·
 * Thermodynamics & Heat Transfer”). The record’s read carries the course id only, so its code and
 * name are read as the catalogue names them (`CatalogueService.getCourse`, the public read), else
 * from the Vendor’s own assigned courses (`ProductionService.getEditor`) for a course nothing is
 * published in yet. A course found by neither is `null`: the screen shows the record without it.
 */
import type { ProductPorts, Result } from '@xr/contracts/draft';
import type { CourseId, SubmissionId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

export interface RecordCourse {
  /** The platform course code (“ME ZG523”); `null` when blank (T-17). */
  readonly code: string | null;
  readonly name: string;
}

export const recordCourse = defineQuery({
  family: 'CRS',
  view: 'vendor-record-course',
  deps: ['CRS', 'AREA', 'EXP', 'ROLE'],
  read: async (
    ports: ProductPorts,
    input: { readonly submissionId: string; readonly courseId: string },
  ): Promise<Result<RecordCourse | null>> => {
    const page = await ports.catalogue.getCourse(input.courseId as CourseId);
    if (page.ok) {
      return {
        ok: true,
        value: { code: page.value.course.platformCode, name: page.value.course.name },
        changed: [],
      };
    }
    if (page.error.kind !== 'not-found') return page;
    const editor = await ports.production.getEditor({
      id: input.submissionId as SubmissionId,
      step: 'course',
    });
    if (!editor.ok) return editor.error.kind === 'unavailable' ? editor : ok(null);
    const card = editor.value.assignedCourses.find((course) => course.id === input.courseId);
    return ok(card ? { code: card.platformCode, name: card.name } : null);
  },
});

function ok<T>(value: T): Result<T> {
  return { ok: true, value, changed: [] };
}

/** VE-07’s course words; disabled until the record names a course. */
export function useRecordCourse(submissionId: string, courseId: string | null) {
  return useXrQuery(
    recordCourse,
    { submissionId, courseId: courseId ?? '' },
    { enabled: courseId !== null },
  );
}
