'use client';

/**
 * The published catalogue as names for other screens (Appendix F §3.2 `queries/<port>.ts`),
 * through `CatalogueService.searchCatalogue` — the public read every session may make. Requests
 * name experiments by id only (`@xr/contracts/draft` `requestedItem`); SA-02 and SA-03 write each
 * one's title and course as B1-10 and B1-11 do ("Shell-and-Tube Heat Exchanger", "ME ZG523 ·
 * Thermodynamics & Heat Transfer"). A release or a publication changes what it returns, so it
 * depends on the experiments and courses.
 */
import type { AreaCard, CourseCard, ProductPorts, Result } from '@xr/contracts/draft';
import type { AreaId, CourseId, ExperimentId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

export const publishedCatalogue = defineQuery({
  family: 'EXP',
  view: 'catalogue-names',
  deps: ['EXP', 'CRS'],
  read: (ports: ProductPorts) => ports.catalogue.searchCatalogue({ sort: 'default' }),
});

export function usePublishedCatalogue() {
  return useXrQuery(publishedCatalogue, null);
}

// ---- The public surface (Phase-1 Package 1B: PU-01 … PU-06, PU-14; TE-8) --------------------
//
// Every public page reads the tab's one sample world in the browser (TE-8: client-rendered in
// sample mode, ADR-0004). The reads need no sign-in and say nothing about access, entitlement,
// activity or completion (BC3, BC9); a publication or a release changes their answers, so each
// depends on the catalogue's record kinds.

/** PU-01 explorer and plain list, PU-02: the areas with a published experiment (listAreas). */
export const publicAreas = defineQuery({
  family: 'AREA',
  view: 'public-areas',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts) => ports.catalogue.listAreas(),
});

export function usePublicAreas() {
  return useXrQuery(publicAreas, null);
}

/** PU-03: one area, its card and the courses with published experiments (getArea). */
export const publicArea = defineQuery({
  family: 'AREA',
  view: 'public-area',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, areaId: string) => ports.catalogue.getArea(areaId as AreaId),
});

export function usePublicArea(areaId: string) {
  return useXrQuery(publicArea, areaId);
}

/**
 * PU-01 explorer (each area's courses, B1-02) and PU-04's area and course filters: every listed
 * area with its courses — `listAreas`, then `getArea` for each. A failure of either is the read's.
 */
export const publicStructure = defineQuery({
  family: 'AREA',
  view: 'public-structure',
  deps: ['AREA', 'CRS', 'EXP'],
  read: async (
    ports: ProductPorts,
  ): Promise<
    Result<readonly { readonly area: AreaCard; readonly courses: readonly CourseCard[] }[]>
  > => {
    const areas = await ports.catalogue.listAreas();
    if (!areas.ok) return areas;
    const pages = await Promise.all(areas.value.map((area) => ports.catalogue.getArea(area.id)));
    const structure = [];
    for (const [index, page] of pages.entries()) {
      // An area hidden between the two reads (nothing published any more) is left out.
      if (!page.ok && page.error.kind === 'not-found') continue;
      if (!page.ok) return page;
      structure.push({ area: areas.value[index]!, courses: page.value.courses });
    }
    return { ok: true, value: structure, changed: [] };
  },
});

export function usePublicStructure() {
  return useXrQuery(publicStructure, null);
}

/** PU-05 (and PU-06's "Part of the course"): a course, its area and its experiments (getCourse). */
export const publicCourse = defineQuery({
  family: 'CRS',
  view: 'public-course',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, courseId: string) => ports.catalogue.getCourse(courseId as CourseId),
});

export function usePublicCourse(courseId: string, options: { readonly enabled?: boolean } = {}) {
  return useXrQuery(publicCourse, courseId, options);
}

/** What the public catalogue is asked for (PU-04 search and order; PU-01 featured; PU-03 area). */
export interface CatalogueAsk {
  readonly text: string;
  readonly areaId: string | null;
  readonly featured: boolean;
  readonly sort: 'default' | 'title-a-z' | 'course-code';
}

/** `searchCatalogue`: the published experiments that match, in the order asked for. */
export const publicCatalogue = defineQuery({
  family: 'EXP',
  view: 'public-catalogue',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, ask: { readonly [Name in keyof CatalogueAsk]: CatalogueAsk[Name] }) =>
    ports.catalogue.searchCatalogue({
      ...(ask.text.trim() ? { text: ask.text } : {}),
      ...(ask.areaId ? { areaId: ask.areaId as AreaId } : {}),
      ...(ask.featured ? { featured: true } : {}),
      sort: ask.sort,
    }),
});

/** The catalogue for this ask; the previous rows stay on show while a new search loads (B1-04). */
export function usePublicCatalogue(ask: CatalogueAsk) {
  return useXrQuery(publicCatalogue, { ...ask }, { keepPrevious: true });
}

/** PU-06: a published experiment's public page; unpublished or unknown is not found (getExperiment). */
export const publicExperiment = defineQuery({
  family: 'EXP',
  view: 'public-page',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, experimentId: string) =>
    ports.catalogue.getExperiment(experimentId as ExperimentId),
});

export function usePublicExperiment(experimentId: string) {
  return useXrQuery(publicExperiment, experimentId);
}
