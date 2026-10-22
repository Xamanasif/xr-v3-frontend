/**
 * The landing's data (PU-01 V1, prompt 13; owner decision D-14): the frozen design's fixture data
 * (21 FROZEN 1015–1076) is never shipped — every count, course line and format the landing shows
 * is read from the existing catalogue reads of the tab's sample world. The design's picks (the
 * hero's three scenes, the four featured cards) are fixed by experiment; a pick that is not
 * published shows nothing of its data (its card, or its scene's chips, is left out).
 */
import type { AreaCard, CatalogueEntry, CourseCard } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

import { courseLine } from '@/copy/public';
import { FEATURED_PICKS, HERO_SCENES } from '@/copy/landing-v1';

/** A scene's annotation (443–447): its course line and the formats it is published in. */
export interface SceneChips {
  readonly course: string;
  readonly formats: readonly Technology[];
}

/** The hero scenes' chips by scene, `null` for a pick that is not published (or not yet read). */
export function heroChips(entries: readonly CatalogueEntry[] | null): (SceneChips | null)[] {
  return HERO_SCENES.map((scene) => {
    const entry = entries?.find((candidate) => candidate.experimentId === scene.experimentId);
    return entry
      ? { course: courseLine(entry.platformCode, entry.courseName), formats: entry.availableIn }
      : null;
  });
}

export interface FeaturedCard {
  readonly experimentId: string;
  readonly name: string;
  /** “ME ZG523 · Thermodynamics & Heat Transfer” (1665). */
  readonly course: string;
  /** The course code alone, as the phone layout shows it (1665); the name without a code. */
  readonly courseShort: string;
  /** The area badge: the first word of the area's name (1665; state-copy `PU-01.featured-tag`). */
  readonly area: string | null;
  readonly formats: readonly Technology[];
  readonly search: string;
  readonly descriptor: string;
  readonly art: string;
  readonly artDescription: string;
}

/**
 * The four featured cards in the design's order (1656–1660), from the featured read; a pick that
 * is not among the published featured experiments is left out.
 */
export function featuredCards(
  featured: readonly CatalogueEntry[],
  structure: readonly { readonly area: AreaCard; readonly courses: readonly CourseCard[] }[] | null,
): FeaturedCard[] {
  const areaOfCourse = new Map<string, string>();
  for (const { area, courses } of structure ?? [])
    for (const course of courses) areaOfCourse.set(course.id, area.name);
  const cards: FeaturedCard[] = [];
  for (const pick of FEATURED_PICKS) {
    const entry = featured.find((candidate) => candidate.experimentId === pick.experimentId);
    if (!entry) continue;
    const areaName = areaOfCourse.get(entry.courseId) ?? null;
    cards.push({
      experimentId: entry.experimentId,
      name: entry.name,
      course: courseLine(entry.platformCode, entry.courseName),
      courseShort: entry.platformCode ?? entry.courseName,
      area: areaName ? (areaName.split(' ')[0] ?? null) : null,
      formats: entry.availableIn,
      search: pick.search,
      descriptor: pick.descriptor,
      art: pick.art,
      artDescription: pick.artDescription,
    });
  }
  return cards;
}

/** The artwork families of the explorer's panels (1684–1685 `expFam`, `expCrop`). */
export type AreaFamily = 'thermal' | 'motor' | 'process';
const FAMILIES: readonly AreaFamily[] = ['thermal', 'motor', 'process'];

export interface AreaPanel {
  readonly id: string;
  readonly name: string;
  readonly family: AreaFamily;
  readonly experiments: number;
  readonly courseCount: number;
  readonly courses: readonly { readonly code: string | null; readonly name: string }[];
}

/**
 * The explorer's panels (1687–1731), one per area with published experiments, in the read's
 * order. An area's artwork family is its record's artwork key; an area without one of the three
 * drawn families takes the family of its position, as the frozen three areas do.
 */
export function areaPanels(
  structure: readonly { readonly area: AreaCard; readonly courses: readonly CourseCard[] }[],
): AreaPanel[] {
  return structure.map(({ area, courses }, index) => ({
    id: area.id,
    name: area.name,
    family: (FAMILIES as readonly string[]).includes(area.artworkKey ?? '')
      ? (area.artworkKey as AreaFamily)
      : FAMILIES[index % FAMILIES.length]!,
    experiments: area.experimentCount,
    courseCount: area.courseCount,
    courses: courses.map((course) => ({ code: course.platformCode, name: course.name })),
  }));
}

/** How many published experiments each format is offered in (1805–1806). */
export function formatCounts(entries: readonly CatalogueEntry[]): Record<Technology, number> {
  const counts: Record<Technology, number> = { web: 0, ar: 0, vr: 0, mr: 0 };
  for (const entry of entries) for (const format of entry.availableIn) counts[format] += 1;
  return counts;
}

/** The landing's destinations (owner decision D-6 and the plan's route map, §5). */
export const LANDING_HREF = {
  home: '/',
  catalogue: '/experiments',
  signIn: '/sign-in',
  selection: '/selection',
  search: (term: string) => `/experiments?q=${encodeURIComponent(term)}`,
  area: (areaId: string) => `/experiments?area=${encodeURIComponent(areaId)}`,
  format: (format: Technology) => `/experiments?format=${format}`,
} as const;
