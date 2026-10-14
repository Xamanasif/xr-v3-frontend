/**
 * M06 Engineering area, M07 Course (+ platform course code), M08 Institution course code, M09
 * Experiment (versions, format delivery, learning outcomes, resources) — Appendix C §2. Engineering
 * area groups courses; there is no Programme level and no Module layer (BC2). An experiment exists
 * only once published; the two Composite Wall experiments are two records (BC11).
 */
import {
  type CatalogueDetails,
  type Course,
  type CourseUsage,
  type DocumentRef,
  type EngineeringArea,
  type Experiment,
  type ExperimentVersion,
  type FormatDelivery,
  INSTITUTION_CODE_STATUSES,
  type InstitutionCourseCode,
  type LearningOutcome,
  type LearningResource,
  type PreviewLink,
  type PublishedFormat,
  type StructureEvent,
} from '@xr/domain';
import { z } from 'zod';

import {
  actorRef,
  areaId,
  courseId,
  experimentId,
  historyOf,
  institutionId,
  isoInstant,
  learningOutcomeId,
  packageFormat,
  platformCourseCode,
  recordMeta,
  resourceId,
  submissionId,
  technology,
  updateId,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const STRUCTURE_EVENTS = vocabulary<StructureEvent>()([
  'area-added',
  'course-added',
  'renamed',
  'description-changed',
  'course-moved',
  'platform-code-set',
]);

export const institutionCodeStatus = z.enum(INSTITUTION_CODE_STATUSES);

export const engineeringArea = typedAs<EngineeringArea>()(
  z.object({
    ...recordMeta,
    id: areaId,
    name: z.string().min(1),
    description: z.string().nullable(),
    artworkKey: z.string().nullable(),
    history: historyOf(STRUCTURE_EVENTS),
  }),
);

export const course = typedAs<Course>()(
  z.object({
    ...recordMeta,
    id: courseId,
    areaId,
    name: z.string().min(1),
    description: z.string().nullable(),
    platformCode: platformCourseCode.nullable(),
    history: historyOf(STRUCTURE_EVENTS),
  }),
);

export const courseUsage = typedAs<CourseUsage>()(
  z.object({
    institutionsWithAccess: z.array(institutionId),
    vendorsInScope: z.number().int().min(0),
    facultyMapped: z.number().int().min(0),
    studentsFiled: z.number().int().min(0),
    publishedExperiments: z.number().int().min(0),
  }),
);

export const institutionCourseCode = typedAs<InstitutionCourseCode>()(
  z.object({
    ...recordMeta,
    institutionId,
    courseId,
    code: z.string().nullable(),
    semester: z.string().nullable(),
    setAt: isoInstant,
    setBy: actorRef,
  }),
);

export const catalogueDetails = typedAs<CatalogueDetails>()(
  z.object({ name: z.string().min(1), summary: z.string(), description: z.string() }),
);

export const formatDelivery = typedAs<FormatDelivery>()(
  z.discriminatedUnion('format', [
    z.object({
      format: z.literal('web'),
      webLink: z.string().min(1),
      browserAndComputer: z.string(),
      notes: z.string().nullable(),
    }),
    z.object({
      format: packageFormat,
      packageLabel: z.string(),
      packageReference: z.string().nullable(),
      packageFileName: z.string().nullable(),
      deviceNeeded: z.string(),
      installNotes: z.string(),
      notes: z.string().nullable(),
    }),
  ]),
);

export const publishedFormat = typedAs<PublishedFormat>()(
  z.object({ format: technology, delivery: formatDelivery }),
);

export const previewLink = typedAs<PreviewLink>()(
  z.object({ label: z.string().nullable(), link: z.string().min(1) }),
);

/** Sample file names only — nothing is uploaded (OD-B5-11). */
export const documentRef = typedAs<DocumentRef>()(z.object({ fileName: z.string().min(1) }));

export const learningOutcome = typedAs<LearningOutcome>()(
  z.object({ id: learningOutcomeId, text: z.string().min(1) }),
);

export const learningResource = typedAs<LearningResource>()(
  z.object({
    id: resourceId,
    title: z.string().min(1),
    kind: z.string(),
    sizeLabel: z.string(),
    href: z.string().min(1),
  }),
);

export const experimentVersion = typedAs<ExperimentVersion>()(
  z.object({
    label: z.string().min(1),
    liveFrom: isoInstant,
    liveUntil: isoInstant.nullable(),
    source: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('first-publication'),
        submissionId: submissionId.nullable(),
        revision: z.number().int().min(1).nullable(),
      }),
      z.object({ kind: z.literal('correction-release'), updateId }),
    ]),
    catalogue: catalogueDetails,
    formats: z.array(publishedFormat),
    preview: previewLink.nullable(),
    documents: z.array(documentRef),
  }),
);

export const experiment = typedAs<Experiment>()(
  z.object({
    ...recordMeta,
    id: experimentId,
    courseId,
    originSubmissionId: submissionId.nullable(),
    vendorOrganisation: z.string(),
    artworkKey: z.string().nullable(),
    live: experimentVersion,
    versions: z.array(experimentVersion),
    learningOutcomes: z.array(learningOutcome),
    resources: z.array(learningResource),
    publishedAt: isoInstant,
    publishedBy: actorRef,
    openUpdateId: updateId.nullable(),
  }),
);
