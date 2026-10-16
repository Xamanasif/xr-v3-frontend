'use client';

/**
 * The Super Admin's Academic structure (Phase 6; boards B7-07, B7-10, B7-12), through
 * `AcademicStructureService`: the areas and their courses (SA-14), an area (SA-15 area record)
 * and a course with what uses it (SA-15 course record, PC-69). The forms are commands —
 * `useCommand(ports => ports.academicStructure.addArea | addCourse | rename | editDescription |
 * previewMoveCourse | moveCourse)` — and every receipt (`AREA`, `CRS`) refreshes the public
 * explorer, catalogue and course pages, the Content Manager's course codes and the Vendor's course
 * lists read in the same tab. The platform course code is read-only here (M-2).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { AreaId, CourseId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

const DEPS = ['AREA', 'CRS', 'EXP'] as const;
/** What uses a course: plans, institutions, their codes, Vendor scopes, Faculty, filed students. */
const COURSE_DEPS = ['AREA', 'CRS', 'EXP', 'ACC', 'INST', 'CCODE', 'ROLE', 'FMAP', 'PER'] as const;

export const academicStructure = defineQuery({
  family: 'AREA',
  view: 'sa-structure',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.academicStructure.getStructure(),
});

/** SA-14 (B7-07 f0): areas in order, each with its courses and their published experiments. */
export function useAcademicStructure(enabled = true) {
  return useXrQuery(academicStructure, null, { enabled });
}

export const structureArea = defineQuery({
  family: 'AREA',
  view: 'sa-structure-area',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) => ports.academicStructure.getArea(id as AreaId),
});

/** SA-15 area record (B7-07 f5). */
export function useStructureArea(id: string | null, enabled = true) {
  return useXrQuery(structureArea, id ?? '', { enabled: enabled && id !== null });
}

export const structureCourse = defineQuery({
  family: 'CRS',
  view: 'sa-structure-course',
  deps: COURSE_DEPS,
  read: (ports: ProductPorts, id: string) => ports.academicStructure.getCourse(id as CourseId),
});

/** SA-15 course record (B7-07 f1, f3, f4, f8): the course, its area, what uses it. */
export function useStructureCourse(id: string | null, enabled = true) {
  return useXrQuery(structureCourse, id ?? '', { enabled: enabled && id !== null });
}
