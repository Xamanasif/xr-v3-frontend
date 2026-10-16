'use client';

/**
 * SA-14 Academic structure and SA-15 Area / course record (Phase 6; boards B7-07, B7-10): the forms’
 * checks on the contract’s own schemas and the move check — features import contracts for types
 * only (Appendix F §3.8), so the runtime pieces live here.
 *
 * - **Checks**: a blank name, no area chosen (Add course, Move) are caught before anything is
 *   sent, with the input schemas’ own message keys (`addAreaInput`, `addCourseInput`,
 *   `renameInput`, `moveCourseInput`), both of Add course’s errors at once (B7-07 f7). Whether a
 *   name is taken or unchanged is the service’s answer, read the same way (`fieldErrorsOf`).
 * - **The move check**: `AcademicStructureService.previewMoveCourse` (it writes nothing) answers
 *   whether people are filed against the course and what moves with it — the move rule is the
 *   service’s, never the screen’s (OD-B7-12).
 */
import {
  addAreaInput,
  addCourseInput,
  moveCourseInput,
  type Out,
  parseInput,
  type previewMoveCourseOutput,
  type ProductPorts,
  renameInput,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { AreaId, CourseId } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

import { defineQuery, useXrQuery } from './use-xr-query';

/** A form’s errors in words, by field (`name`, `areaId`, `toAreaId`). */
export type StructureFieldErrors = Readonly<Record<string, string>>;

/** A `validation-failed` answer as the form’s errors: the first drawn words per field. */
export function fieldErrorsOf(error: ValidationFailed): StructureFieldErrors {
  const errors: Record<string, string> = {};
  for (const item of error.fieldErrors) {
    const field = item.field.split('.')[0]!;
    const words = fieldWords(item);
    if (words && errors[field] === undefined) errors[field] = words;
  }
  return errors;
}

function errorsOrNull(errors: StructureFieldErrors): StructureFieldErrors | null {
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Add area (B7-07 `doAddArea`): “Enter the area name”. */
export function checkAddArea(draft: {
  readonly name: string;
  readonly description: string;
}): StructureFieldErrors | null {
  const parsed = parseInput(addAreaInput, draft, null);
  return parsed.ok ? null : errorsOrNull(fieldErrorsOf(parsed.error));
}

/** Add course (B7-07 f7, `doAddCourse`): the name and the area, both errors at once. */
export function checkAddCourse(draft: {
  readonly name: string;
  readonly areaId: string | null;
  readonly description: string;
}): StructureFieldErrors | null {
  const parsed = parseInput(addCourseInput, draft, null);
  return parsed.ok ? null : errorsOrNull(fieldErrorsOf(parsed.error));
}

/** Rename (B7-07 f6, `doRename`): “Enter a name”; unchanged or taken is the service’s answer. */
export function checkRename(draft: {
  readonly kind: 'area' | 'course';
  readonly id: string;
  readonly name: string;
  readonly expectedRev: number;
}): StructureFieldErrors | null {
  const parsed = parseInput(renameInput, draft, null);
  return parsed.ok ? null : errorsOrNull(fieldErrorsOf(parsed.error));
}

/** Move (B7-07 `doMove`): “Choose the area to move it to”. */
export function checkMove(draft: {
  readonly courseId: string;
  readonly toAreaId: string | null;
  readonly expectedRev: number;
}): StructureFieldErrors | null {
  const parsed = parseInput(moveCourseInput, draft, null);
  return parsed.ok ? null : errorsOrNull(fieldErrorsOf(parsed.error));
}

/** What `previewMoveCourse` answers: blocked, who is filed, what moves with the course. */
export type MoveCheck = Out<typeof previewMoveCourseOutput>;

/** The move check reads what the course record reads (its filings, plans, scopes). */
const MOVE_CHECK_DEPS = ['AREA', 'CRS', 'EXP', 'ACC', 'ROLE', 'FMAP', 'PER'] as const;

export const courseMoveCheck = defineQuery({
  family: 'CRS',
  view: 'sa-structure-move-check',
  deps: MOVE_CHECK_DEPS,
  read: (ports: ProductPorts, params: { readonly courseId: string; readonly toAreaId: string }) =>
    ports.academicStructure.previewMoveCourse({
      courseId: params.courseId as CourseId,
      toAreaId: params.toAreaId as AreaId,
    }),
});

/**
 * SA-15 (B7-07 f1, f3, f4; B7-10 f9): the service’s move check for the course toward `toAreaId`
 * (another area), or no read while there is none. The previous answer stays while the next loads.
 */
export function useCourseMoveCheck(courseId: string, toAreaId: string | null) {
  return useXrQuery(
    courseMoveCheck,
    { courseId, toAreaId: toAreaId ?? '' },
    { enabled: toAreaId !== null, keepPrevious: true },
  );
}
