/**
 * The public catalogue's wire contract (D1; ADR-0013, promoted to the root entry by ADR-0014 §8).
 *
 * These schemas ARE the `CatalogueService` port's output schemas (Appendix C §3.2): the draft port
 * (`./draft`, `ports/catalogue.ts`) re-exports them, the typed mock answers with them, the API
 * publishes them with its routes and in `WIRE_CONTRACTS`, and the web's HTTP adapter validates
 * every answer against them. One definition, so the four cannot disagree.
 *
 * The wire-only shapes are the path parameters and the search query: a querystring carries text
 * only and coercion is refused on the wire (B7), so `featured` travels as `'true' | 'false'`.
 */
import { type PreviewLink, TECHNOLOGIES } from '@xr/domain';
import { z } from 'zod';

import {
  areaId,
  courseId,
  experimentId,
  ids,
  platformCourseCode,
  technology,
} from './kernel/primitives.js';
import { typedAs } from './kernel/typed.js';
import { wireSchema } from './openapi.js';

export const previewLink = typedAs<PreviewLink>()(
  z.object({ label: z.string().nullable(), link: z.string().min(1) }),
);

export const areaCard = wireSchema(
  z.object({
    id: areaId,
    name: z.string().min(1),
    description: z.string().nullable(),
    artworkKey: z.string().nullable(),
    courseCount: z.number().int().min(0),
    experimentCount: z.number().int().min(0),
  }),
  'output',
);

/** The code chip is omitted when the platform code is blank (`null`, T-17). */
export const courseCard = wireSchema(
  z.object({
    id: courseId,
    name: z.string().min(1),
    platformCode: platformCourseCode.nullable(),
    description: z.string().nullable(),
    formatsInCourse: z.array(technology),
  }),
  'output',
);

export const catalogueEntry = wireSchema(
  z.object({
    experimentId,
    name: z.string().min(1),
    summary: z.string(),
    courseId,
    courseName: z.string().min(1),
    platformCode: platformCourseCode.nullable(),
    /** Published formats, in display order. */
    availableIn: z.array(technology),
    /**
     * The concept artwork key of the row thumbnail, cards and hero (B1-04 "Thumbnail (concept
     * artwork, decorative)", B1-05); `null` → the drawn fallback. Presentation only (PC-31).
     */
    artworkKey: z.string().nullable(),
  }),
  'output',
);

/** The area a course belongs to: PU-05's eyebrow, breadcrumb and back link (B1-03; PC-30). */
export const areaRef = wireSchema(z.object({ id: areaId, name: z.string().min(1) }), 'output');

/**
 * PU-06. `versionLabel` stays `null` while OD-B7-05 (is the version public?) is open — the field is
 * typed `null` so no adapter can decide it (provisional register).
 */
export const publicExperimentPage = wireSchema(
  catalogueEntry.extend({
    description: z.string(),
    areaName: z.string().min(1),
    learningOutcomes: z.array(z.string()),
    formats: z.array(
      z.object({ format: technology, howItRuns: z.string(), deviceNeeds: z.string() }),
    ),
    preview: previewLink.nullable(),
    versionLabel: z.null(),
  }),
  'output',
);

export const listAreasOutput = wireSchema(z.array(areaCard), 'output');
export const getAreaOutput = wireSchema(
  z.object({ area: areaCard, courses: z.array(courseCard) }),
  'output',
);
export const getCourseOutput = wireSchema(
  z.object({ course: courseCard, area: areaRef, experiments: z.array(catalogueEntry) }),
  'output',
);
export const searchCatalogueOutput = wireSchema(
  z.object({ total: z.number().int().min(0), entries: z.array(catalogueEntry) }),
  'output',
);

/** Path parameters: lenient bounded ids; existence is the answer (`404`), never the shape. */
export const catalogueAreaParam = wireSchema(ids.in.area, 'input');
export const catalogueCourseParam = wireSchema(ids.in.course, 'input');
export const catalogueExperimentParam = wireSchema(ids.in.experiment, 'input');

/** `GET /api/v1/catalogue/experiments`: the port's `CatalogueQuery` as a querystring. */
export const catalogueSearchQuery = wireSchema(
  z
    .object({
      text: z.string().max(200).optional().describe('Matches name, summary, course and code.'),
      areaId: ids.in.area.optional().describe('Only this engineering area.'),
      format: z.enum(TECHNOLOGIES).optional().describe('Only experiments published in it.'),
      featured: z
        .enum(['true', 'false'])
        .optional()
        .describe('`true`: only the landing’s featured experiments (B1-01).'),
      sort: z
        .enum(['default', 'title-a-z', 'course-code'])
        .describe('No default order is assumed: the caller names one (B1-04).'),
    })
    .strict(),
  'input',
);
export type CatalogueSearchQuery = z.output<typeof catalogueSearchQuery>;
