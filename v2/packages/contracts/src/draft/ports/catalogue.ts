/**
 * §3.2 CatalogueService (public surface) — PU-01…PU-06, PU-15. No sign-in. Reads only published
 * experiments; never states access or entitlement (BC9). A new experiment appears only after the
 * Content Manager publishes it; a release changes what these reads return for everyone (B7-11).
 *
 * The output schemas are the root entry's wire contract (`src/catalogue.ts`, ADR-0014 §8),
 * re-exported here so the port, the mock, the API and the web share one definition. Only the
 * accepted input form `catalogueQuery` (a draft input: it parses, with drawn messages) stays here.
 */
import { z } from 'zod';

import {
  areaCard,
  areaRef,
  catalogueEntry,
  courseCard,
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
} from '../../catalogue.js';
import { ids, technology } from '../kernel/primitives.js';
import type { NotFound, Unavailable } from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

export {
  areaCard,
  areaRef,
  catalogueEntry,
  courseCard,
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
};

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
