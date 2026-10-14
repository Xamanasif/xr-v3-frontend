/**
 * §3.2 CatalogueService (public surface) — PU-01…PU-06, PU-15. No sign-in. Reads only published
 * experiments; never states access or entitlement (BC9). A new experiment appears only after the
 * Content Manager publishes it; a release changes what these reads return for everyone (B7-11).
 */
import { z } from 'zod';

import {
  areaId,
  courseId,
  experimentId,
  ids,
  platformCourseCode,
  technology,
} from '../kernel/primitives.js';
import { previewLink } from '../records/catalogue.js';
import type { NotFound, Unavailable } from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

export const areaCard = z.object({
  id: areaId,
  name: z.string().min(1),
  description: z.string().nullable(),
  artworkKey: z.string().nullable(),
  courseCount: z.number().int().min(0),
  experimentCount: z.number().int().min(0),
});

/** The code chip is omitted when the platform code is blank (`null`, T-17). */
export const courseCard = z.object({
  id: courseId,
  name: z.string().min(1),
  platformCode: platformCourseCode.nullable(),
  description: z.string().nullable(),
  formatsInCourse: z.array(technology),
});

export const catalogueEntry = z.object({
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
});

/** The area a course belongs to: PU-05's eyebrow, breadcrumb and back link (B1-03; PC-30). */
export const areaRef = z.object({ id: areaId, name: z.string().min(1) });

/**
 * PU-06. `versionLabel` stays `null` while OD-B7-05 (is the version public?) is open — the field is
 * typed `null` so no adapter can decide it (provisional register).
 */
export const publicExperimentPage = catalogueEntry.extend({
  description: z.string(),
  areaName: z.string().min(1),
  learningOutcomes: z.array(z.string()),
  formats: z.array(
    z.object({ format: technology, howItRuns: z.string(), deviceNeeds: z.string() }),
  ),
  preview: previewLink.nullable(),
  versionLabel: z.null(),
});

/**
 * B1-04: no default order is assumed — the caller names it. `featured: true` keeps the landing's
 * featured experiments only (B1-01 "Featured experiments"), in their seeded order under `default`
 * (P1-22 interim: a seeded list; curated vs derived is OPEN — PC-32).
 */
export const catalogueQuery = z.object({
  text: z.string().optional(),
  areaId: ids.in.area.optional(),
  format: technology.optional(),
  featured: z.boolean({ error: key('contract.invalid-input') }).optional(),
  sort: z.enum(['default', 'title-a-z', 'course-code'], { error: key('contract.invalid-input') }),
});

export const listAreasOutput = z.array(areaCard);
export const getAreaOutput = z.object({ area: areaCard, courses: z.array(courseCard) });
export const getCourseOutput = z.object({
  course: courseCard,
  area: areaRef,
  experiments: z.array(catalogueEntry),
});
export const searchCatalogueOutput = z.object({
  total: z.number().int().min(0),
  entries: z.array(catalogueEntry),
});

export type AreaCard = Out<typeof areaCard>;
export type CourseCard = Out<typeof courseCard>;
export type CatalogueEntry = Out<typeof catalogueEntry>;
export type AreaRef = Out<typeof areaRef>;
export type PublicExperimentPage = Out<typeof publicExperimentPage>;
export type CatalogueQuery = In<typeof catalogueQuery>;

export interface CatalogueService {
  listAreas(): Answer<Out<typeof listAreasOutput>, Unavailable>;
  getArea(
    areaId: In<typeof ids.in.area>,
  ): Answer<Out<typeof getAreaOutput>, NotFound | Unavailable>;
  getCourse(
    courseId: In<typeof ids.in.course>,
  ): Answer<Out<typeof getCourseOutput>, NotFound | Unavailable>;
  searchCatalogue(query: CatalogueQuery): Answer<Out<typeof searchCatalogueOutput>, Unavailable>;
  /** Unpublished or unknown → `not-found` (PU-15). */
  getExperiment(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<PublicExperimentPage, NotFound | Unavailable>;
}
