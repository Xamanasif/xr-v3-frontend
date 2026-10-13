/**
 * Academic structure, platform course codes, institution course codes and the public catalogue
 * (Appendix C M06–M09; matrix CRS-*, CC-*, EXP-*; Appendix D §5.3 `publicCatalogue`).
 *
 * - Areas and courses: Super Admin only; no retire, no artwork upload (D3; CRS-05).
 * - Platform course codes: Content Manager only (M-2 single writer; CC-04/05; CC-07 Super Admin
 *   denied). Unique among non-blank codes, compared trimmed and case-insensitively (B6-10 script);
 *   whether internal spaces are also ignored is open (§7 D-25, §8-29) and not decided here.
 * - Institution codes: Institute Admin, not while paused; a semester needs a code (BR-021).
 */
import type { PersonActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import {
  type Decision,
  invalidInput,
  isBlank,
  notPermitted,
  ok,
  refused,
} from '../kernel/decision.js';
import { historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { AreaId, CourseId, ExperimentId } from '../kernel/ids.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Institution } from '../institution/model.js';
import type {
  Course,
  EngineeringArea,
  Experiment,
  InstitutionCodeStatus,
  InstitutionCourseCode,
  PlatformCourseCode,
} from './model.js';
import { publishedFormats } from './model.js';

/** Names compare trimmed and case-insensitively ("There is already an area called …"). */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('en') === b.trim().toLocaleLowerCase('en');
}

interface StructureBase {
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

export interface AddAreaInput extends StructureBase {
  readonly areas: readonly EngineeringArea[];
  readonly name: string;
  readonly description: string | null;
}

/** Add an engineering area (CRS-01): "Enter the area name" / "There is already an area called …". */
export function addArea(input: AddAreaInput): Decision<EngineeringArea> {
  if (isBlank(input.name)) return invalidInput({ field: 'name', rule: 'required' });
  if (input.areas.some((area) => sameName(area.name, input.name))) {
    return invalidInput({ field: 'name', rule: 'taken' });
  }
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('area'),
    name: input.name.trim(),
    description: isBlank(input.description) ? null : input.description!.trim(),
    artworkKey: null,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'area-added',
        at: input.now,
        actor: input.actor,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}

export interface AddCourseInput extends StructureBase {
  readonly courses: readonly Course[];
  readonly areas: readonly EngineeringArea[];
  readonly areaId: AreaId | null;
  readonly name: string;
  readonly description: string | null;
}

/** Add a course, with no platform code (CRS-02): "The platform course code is added by the
 *  Content Manager in Course codes." (B7-07 f7–8). */
export function addCourse(input: AddCourseInput): Decision<Course> {
  const issues = [
    ...(isBlank(input.name)
      ? [{ field: 'name', rule: 'required' }]
      : input.courses.some((course) => sameName(course.name, input.name))
        ? [{ field: 'name', rule: 'taken' }]
        : []),
    ...(input.areaId && input.areas.some((area) => area.id === input.areaId)
      ? []
      : [{ field: 'areaId', rule: 'required' }]),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('course'),
    areaId: input.areaId!,
    name: input.name.trim(),
    description: isBlank(input.description) ? null : input.description!.trim(),
    platformCode: null,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'course-added',
        at: input.now,
        actor: input.actor,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}

export interface RenameInput<R extends EngineeringArea | Course> extends StructureBase {
  readonly record: R;
  readonly siblings: readonly R[];
  readonly name: string;
}

/** Rename an area or a course (CRS-03): "Enter a different name — this is the current one". */
export function renameStructure<R extends EngineeringArea | Course>(
  input: RenameInput<R>,
): Decision<R> {
  if (isBlank(input.name)) return invalidInput({ field: 'name', rule: 'required' });
  if (input.name.trim() === input.record.name)
    return invalidInput({ field: 'name', rule: 'unchanged' });
  if (
    input.siblings.some((other) => other.id !== input.record.id && sameName(other.name, input.name))
  ) {
    return invalidInput({ field: 'name', rule: 'taken' });
  }
  return ok({
    ...input.record,
    ...nextMeta(input.record, input.now),
    name: input.name.trim(),
    history: [
      ...input.record.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'renamed',
        at: input.now,
        actor: input.actor,
        note: input.record.name,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}

export interface DescriptionInput<R extends EngineeringArea | Course> extends StructureBase {
  readonly record: R;
  readonly description: string | null;
}

/** Edit an area or course description (CRS-03; optional text). */
export function editDescription<R extends EngineeringArea | Course>(
  input: DescriptionInput<R>,
): Decision<R> {
  return ok({
    ...input.record,
    ...nextMeta(input.record, input.now),
    description: isBlank(input.description) ? null : input.description!.trim(),
    history: [
      ...input.record.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'description-changed',
        at: input.now,
        actor: input.actor,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}

export interface MoveCourseInput extends StructureBase {
  readonly course: Course;
  readonly areas: readonly EngineeringArea[];
  readonly targetAreaId: AreaId | null;
  /** Students and Faculty filed against the course (B7-07 move rule). */
  readonly filed: { readonly students: number; readonly faculty: number };
}

/**
 * Move a course to another area (CRS-04, PROVISIONAL; OD-B7-12): blocked while students or Faculty
 * are filed against it; published experiments, institutions' access and Vendor course lists move
 * with it (they reference the course, not the area).
 */
export function moveCourse(input: MoveCourseInput): Decision<Course> {
  if (!input.targetAreaId || !input.areas.some((area) => area.id === input.targetAreaId)) {
    return invalidInput({ field: 'targetAreaId', rule: 'required' });
  }
  if (input.targetAreaId === input.course.areaId) {
    return invalidInput({ field: 'targetAreaId', rule: 'unchanged' });
  }
  if (input.filed.students > 0 || input.filed.faculty > 0)
    return refused('course-has-people-filed');
  return ok({
    ...input.course,
    ...nextMeta(input.course, input.now),
    areaId: input.targetAreaId,
    history: [
      ...input.course.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'course-moved',
        at: input.now,
        actor: input.actor,
        visibleTo: ['super_admin'],
      }),
    ],
  });
}

/** The comparison key of a platform code: trimmed, upper-case (B6-10 `T(r.code).toUpperCase()`). */
export function platformCodeKey(code: string): string {
  return code.trim().toUpperCase();
}

export interface PlatformCodesInput extends StructureBase {
  readonly courses: readonly Course[];
  readonly changes: readonly { readonly courseId: CourseId; readonly code: string | null }[];
}

/**
 * Save platform course codes (CC-04; CC-05 for courses with published experiments — saved
 * directly, no downstream effect implemented, OD-B6-13). Blank allowed: "No code yet". Each code
 * unique: "{code} is already the code for {course}. Each course needs its own code."
 */
export function savePlatformCourseCodes(input: PlatformCodesInput): Decision<readonly Course[]> {
  const next = new Map(
    input.courses.map((course) => [course.id, course.platformCode as string | null]),
  );
  for (const change of input.changes) {
    if (!next.has(change.courseId))
      return invalidInput({ field: change.courseId, rule: 'unknown-course' });
    next.set(change.courseId, isBlank(change.code) ? null : change.code!.trim());
  }
  const seen = new Map<string, CourseId>();
  const issues = [];
  for (const [courseId, code] of next) {
    if (code === null) continue;
    const key = platformCodeKey(code);
    if (seen.has(key)) issues.push({ field: courseId, rule: 'code-taken' });
    else seen.set(key, courseId);
  }
  if (issues.length > 0) return invalidInput(...issues);
  return ok(
    input.courses.map((course) => {
      const code = next.get(course.id) ?? null;
      if (code === course.platformCode) return course;
      return {
        ...course,
        ...nextMeta(course, input.now),
        platformCode: code as PlatformCourseCode | null,
        history: [
          ...course.history,
          historyEntry({
            id: input.ids.next('history'),
            event: 'platform-code-set' as const,
            at: input.now,
            actor: input.actor,
            note: code,
            visibleTo: ['content_manager', 'super_admin'],
          }),
        ],
      };
    }),
  );
}

/** "Missing / Added" (B2-03 `stateText`). */
export function institutionCodeStatus(code: InstitutionCourseCode | null): InstitutionCodeStatus {
  return code && !isBlank(code.code) ? 'added' : 'missing';
}

export interface InstitutionCodeInput {
  readonly existing: InstitutionCourseCode | null;
  readonly institution: Institution;
  readonly courseId: CourseId;
  /** Courses in the institution's content access (CC-01 scope). */
  readonly coursesInAccess: readonly CourseId[];
  readonly code: string | null;
  readonly semester: string | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
}

/**
 * Set or clear the institution's own course code and optional semester (CC-01). Read-only while
 * paused (B2-03 f9; CC-02). "Add your course code, or clear the semester" (B2-03 f8).
 */
export function setInstitutionCourseCode(
  input: InstitutionCodeInput,
): Decision<InstitutionCourseCode> {
  if (input.institution.pause) return refused('institution-paused');
  if (!input.coursesInAccess.includes(input.courseId)) return notPermitted('out-of-scope');
  const code = isBlank(input.code) ? null : input.code!.trim();
  const semester = isBlank(input.semester) ? null : input.semester!.trim();
  if (semester !== null && code === null)
    return invalidInput({ field: 'code', rule: 'semester-needs-code' });
  const base = input.existing ?? {
    ...newMeta(input.now),
    institutionId: input.institution.id,
    courseId: input.courseId,
  };
  return ok({
    ...base,
    ...(input.existing ? nextMeta(input.existing, input.now) : {}),
    institutionId: input.institution.id,
    courseId: input.courseId,
    code,
    semester,
    setAt: input.now,
    setBy: input.actor,
  });
}

/** One public catalogue entry: published experiments only (EXP-01; BR-029). */
export interface PublicCatalogueEntry {
  readonly experimentId: ExperimentId;
  readonly courseId: CourseId;
  readonly areaId: AreaId;
  readonly name: string;
  readonly summary: string;
  /** "Available in" — published formats, never an entitlement (B1-04). */
  readonly formats: readonly Technology[];
  readonly platformCode: PlatformCourseCode | null;
}

/**
 * The public catalogue reads publication only (Appendix D §5.3) — never institution access,
 * grants, activity or completion. Areas and courses appear only with a published experiment
 * (CRS-09). An unknown or unpublished experiment is simply absent (EXP-02: not found).
 */
export function publicCatalogue(
  experiments: readonly Experiment[],
  courses: readonly Course[],
): readonly PublicCatalogueEntry[] {
  const byId = new Map(courses.map((course) => [course.id, course]));
  return experiments.flatMap((experiment) => {
    const course = byId.get(experiment.courseId);
    if (!course) return [];
    return [
      {
        experimentId: experiment.id,
        courseId: course.id,
        areaId: course.areaId,
        name: experiment.live.catalogue.name,
        summary: experiment.live.catalogue.summary,
        formats: publishedFormats(experiment),
        platformCode: course.platformCode,
      },
    ];
  });
}

/** The areas the public explorer lists: those with a published experiment (CRS-09, OD-B7-13). */
export function publicAreas(
  areas: readonly EngineeringArea[],
  catalogue: readonly PublicCatalogueEntry[],
): readonly EngineeringArea[] {
  const withContent = new Set(catalogue.map((entry) => entry.areaId));
  return areas.filter((area) => withContent.has(area.id));
}
