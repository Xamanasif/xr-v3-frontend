/**
 * §3.14 AcademicStructureService + PlatformCourseCodeService — SA-14, SA-15, CM-09 — and §3.15
 * PlatformRoleService — SA-16, SA-17.
 *
 * Engineering area groups courses; there is no Programme level and no Module layer (BC2). A course
 * move is blocked while people are filed against it (B7-07). The platform code has one writer, the
 * Content Manager (M-2); a code is unique among non-blank codes, compared trimmed and
 * case-insensitively (B6-10). Scope decides what a Vendor, Academic Reviewer or Content Manager
 * can act on; nothing is sent when a holder is registered (T-11).
 */
import type { Course, EngineeringArea, PlatformRoleHolder } from '@xr/domain';
import { emailAsDrawn, optionalTrimmed, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import { expectedRev, ids, institutionId, roleHolderId } from '../kernel/primitives.js';
import { course, courseUsage, engineeringArea } from '../records/catalogue.js';
import { platformRole, platformRoleHolder, roleScope, scopeStatus } from '../records/operations.js';
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
import type { Answer, In, Out } from './common.js';
import { key, requiredChoice } from './fields.js';

// ---- AcademicStructureService ----

/** SA-14 (B7-07): uniqueness ("There is already an area called …") is the domain's answer. */
export const addAreaInput = z.object({
  name: requiredTrimmed(key('SA-14.areaName.required')),
  description: optionalTrimmed(),
});

export const addCourseInput = z.object({
  name: requiredTrimmed(key('SA-14.courseName.required')),
  areaId: requiredChoice(ids.in.area, key('SA-14.areaId.required')),
  description: optionalTrimmed(),
});

/** SA-15: "Enter a name"; an unchanged or taken name is the domain's answer. */
export const renameInput = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.literal('area'),
      id: ids.in.area,
      name: requiredTrimmed(key('SA-15.name.required')),
      expectedRev,
    }),
    z.object({
      kind: z.literal('course'),
      id: ids.in.course,
      name: requiredTrimmed(key('SA-15.name.required')),
      expectedRev,
    }),
  ],
  { error: key('contract.invalid-input') },
);

export const editDescriptionInput = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.literal('area'),
      id: ids.in.area,
      description: optionalTrimmed(),
      expectedRev,
    }),
    z.object({
      kind: z.literal('course'),
      id: ids.in.course,
      description: optionalTrimmed(),
      expectedRev,
    }),
  ],
  { error: key('contract.invalid-input') },
);

export const previewMoveCourseInput = z.object({ courseId: ids.in.course, toAreaId: ids.in.area });

export const moveCourseInput = z.object({
  courseId: ids.in.course,
  toAreaId: requiredChoice(ids.in.area, key('SA-15.toAreaId.required')),
  expectedRev,
});

export const structureOutput = z.array(
  z.object({
    area: engineeringArea,
    courses: z.array(z.object({ course, publishedExperiments: z.number().int().min(0) })),
  }),
);
export const getStructureAreaOutput = z.object({ area: engineeringArea, courses: z.array(course) });
/**
 * SA-15 "What uses this course" (B7-07 f1, f3, f4) as facts beside the counts of `courseUsage`
 * (Phase 6; provisional register PC-69): the institutions whose access plans hold one of its
 * experiments (an ended plan marked ended; with the institution's own code for the course), the
 * Vendors whose scope covers it, and the Faculty mapped to it by institution. The area's name is
 * the record's own.
 */
export const courseUsageDetail = z.object({
  institutions: z.array(
    z.object({
      institutionId,
      name: z.string().min(1),
      institutionCode: z.string().nullable(),
      ended: z.boolean(),
    }),
  ),
  vendors: z.array(
    z.object({ holderId: roleHolderId, name: z.string().min(1), organisation: z.string().min(1) }),
  ),
  faculty: z.array(
    z.object({ institutionId, institutionName: z.string().min(1), names: z.array(z.string()) }),
  ),
});
export const getStructureCourseOutput = z.object({
  course,
  areaName: z.string().min(1),
  usage: courseUsage,
  detail: courseUsageDetail,
});
export const previewMoveCourseOutput = z.object({
  blocked: z.boolean(),
  blockers: z.object({ students: z.number().int().min(0), faculty: z.number().int().min(0) }),
  movesWithIt: courseUsage,
});
export const renameOutput = z.union([engineeringArea, course]);

type SaWrite = NotSignedIn | NotPermitted | Unavailable;

export interface AcademicStructureService {
  getStructure(): Answer<Out<typeof structureOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getArea(
    id: In<typeof ids.in.area>,
  ): Answer<
    Out<typeof getStructureAreaOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  getCourse(
    id: In<typeof ids.in.course>,
  ): Answer<
    Out<typeof getStructureCourseOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  /** The public explorer is unchanged until the area has published experiments [U OD-B7-13]. */
  addArea(input: In<typeof addAreaInput>): Answer<EngineeringArea, ValidationFailed | SaWrite>;
  addCourse(
    input: In<typeof addCourseInput>,
  ): Answer<Course, ValidationFailed | NotFound | SaWrite>;
  rename(
    input: In<typeof renameInput>,
  ): Answer<EngineeringArea | Course, ValidationFailed | NotFound | StaleVersion | SaWrite>;
  editDescription(
    input: In<typeof editDescriptionInput>,
  ): Answer<EngineeringArea | Course, NotFound | StaleVersion | SaWrite>;
  /** Writes nothing. */
  /** Validates the move as `moveCourse` does; the people filed against the course are a value (`blocked`). */
  previewMoveCourse(
    input: In<typeof previewMoveCourseInput>,
  ): Answer<
    Out<typeof previewMoveCourseOutput>,
    ValidationFailed | NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  moveCourse(
    input: In<typeof moveCourseInput>,
  ): Answer<
    Course,
    ValidationFailed | NotFound | Refused<'course-has-people-filed'> | StaleVersion | SaWrite
  >;
}

// ---- PlatformCourseCodeService ----

/** CM-09 (B6-10): a blank code is `null`; a duplicate is reported on the row that repeats it. */
export const savePlatformCodesInput = z.object({
  changes: z.array(z.object({ courseId: ids.in.course, code: optionalTrimmed(), expectedRev }), {
    error: key('contract.invalid-input'),
  }),
});

export const platformCodesOutput = z.array(
  z.object({
    course,
    areaName: z.string().min(1),
    publishedExperiments: z.number().int().min(0),
  }),
);
export const savePlatformCodesOutput = z.array(course);

export interface PlatformCourseCodeService {
  list(): Answer<Out<typeof platformCodesOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /** Content Manager only (M-2). Policy-open: CC-06 (a Content Manager with a limited scope). */
  save(
    input: In<typeof savePlatformCodesInput>,
  ): Answer<readonly Course[], ValidationFailed | NotFound | StaleVersion | PolicyOpen | SaWrite>;
}

// ---- PlatformRoleService ----

export const listHoldersInput = z.object({
  tab: z.enum(['vendors', 'reviewers', 'content-managers'], {
    error: key('contract.invalid-input'),
  }),
  search: z.string().optional(),
});

/** SA-16 (B7-08 `doReg`). An e-mail already registered is the domain's answer. */
export const registerHolderInput = z.object({
  role: platformRole,
  name: requiredTrimmed(key('SA-16.name.required')),
  workEmail: emailAsDrawn(key('SA-16.workEmail.required'), key('SA-16.workEmail.format')),
  organisation: requiredTrimmed(key('SA-16.organisation.required')),
});

/** SA-17 (B7-08 `doScope`): what they act on, then the course or the experiment. */
export const assignScopeInput = z
  .object({
    holderId: ids.in.roleHolder,
    target: z.discriminatedUnion(
      'kind',
      [
        z.object({ kind: z.literal('all') }),
        z.object({
          kind: z.literal('course'),
          courseId: requiredChoice(ids.in.course, key('SA-17.courseId.required')),
        }),
        z.object({
          kind: z.literal('experiment'),
          experimentId: requiredChoice(ids.in.experiment, key('SA-17.experimentId.required')),
        }),
        // No choice yet: "Choose what they can act on".
        z.object({ kind: z.null() }),
      ],
      { error: key('SA-17.target.required') },
    ),
    expectedRev,
  })
  .transform((input, context) => {
    if (input.target.kind === null) {
      context.addIssue({ code: 'custom', path: ['target'], message: key('SA-17.target.required') });
      return z.NEVER;
    }
    return { holderId: input.holderId, target: input.target, expectedRev: input.expectedRev };
  });

export const withdrawScopeInput = z.object({
  holderId: ids.in.roleHolder,
  scopeId: ids.in.scope,
  reason: requiredTrimmed(key('SA-17.reason.required')),
  expectedRev,
});

export const restoreScopeInput = z.object({
  holderId: ids.in.roleHolder,
  scopeId: ids.in.scope,
  expectedRev,
});

/**
 * SA-16 / SA-17 "Can act on" as facts, not words (Phase 6; provisional register PC-70): each of the
 * holder's scopes with its status and what it names — a course's platform code (null while it has
 * none) and name, an experiment's live name, nothing for all experiments. Appendix C gave the row a
 * pre-rendered `canActOn` (PC-13).
 */
export const scopeView = z.object({
  scope: roleScope,
  status: scopeStatus,
  courseCode: z.string().nullable(),
  name: z.string().nullable(),
});
export const holderView = z.object({ holder: platformRoleHolder, scopes: z.array(scopeView) });
/** Each tab's holders, first registered first. */
export const listHoldersOutput = z.array(holderView);

export interface PlatformRoleService {
  listHolders(
    filter: In<typeof listHoldersInput>,
  ): Answer<Out<typeof listHoldersOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getHolder(
    id: In<typeof ids.in.roleHolder>,
  ): Answer<Out<typeof holderView>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** Only Vendors, Academic Reviewers and Content Managers (ROLE-07); no scope yet. */
  registerHolder(
    input: In<typeof registerHolderInput>,
  ): Answer<PlatformRoleHolder, ValidationFailed | SaWrite>;
  assignScope(
    input: In<typeof assignScopeInput>,
  ): Answer<PlatformRoleHolder, ValidationFailed | NotFound | StaleVersion | SaWrite>;
  /** "They stop seeing it straight away"; work in flight is not changed (ROLE-09 open). */
  withdrawScope(
    input: In<typeof withdrawScopeInput>,
  ): Answer<
    PlatformRoleHolder,
    ValidationFailed | NotFound | InvalidState | StaleVersion | SaWrite
  >;
  restoreScope(
    input: In<typeof restoreScopeInput>,
  ): Answer<PlatformRoleHolder, NotFound | InvalidState | StaleVersion | SaWrite>;
}
