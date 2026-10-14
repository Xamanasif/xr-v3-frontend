/**
 * Read-model pieces several ports share. Canonical states and facts only — the words are the web
 * layer's (Appendix C §3.0 rule 5); every view reads the live version (B7-11).
 */
import type {
  AreaCard,
  CatalogueEntry,
  CourseCard,
  PublicExperimentPage,
} from '@xr/contracts/draft';
import {
  type Course,
  type EngineeringArea,
  type Experiment,
  FORMAT_META,
  inDisplayOrder,
  type PublicCatalogueEntry,
  publishedFormats,
  type Technology,
} from '@xr/domain';

import { values } from '../world/records.js';
import type { WorldRecords } from '../world/types.js';

/** PU-01 / PU-02 / PU-03: an area's card, its counts from the published catalogue only (B1-02). */
export function areaCardOf(
  area: EngineeringArea,
  catalogue: readonly PublicCatalogueEntry[],
): AreaCard {
  const entries = catalogue.filter((entry) => entry.areaId === area.id);
  return {
    id: area.id,
    name: area.name,
    description: area.description,
    artworkKey: area.artworkKey,
    courseCount: new Set(entries.map((entry) => entry.courseId)).size,
    experimentCount: entries.length,
  };
}

export function courseCardOf(records: WorldRecords, course: Course): CourseCard {
  const formats = new Set<Technology>();
  for (const experiment of values(records.experiments)) {
    if (experiment.courseId === course.id)
      publishedFormats(experiment).forEach((f) => formats.add(f));
  }
  return {
    id: course.id,
    name: course.name,
    platformCode: course.platformCode,
    description: course.description,
    formatsInCourse: inDisplayOrder(formats),
  };
}

export function catalogueEntryOf(records: WorldRecords, experiment: Experiment): CatalogueEntry {
  const course = records.courses[experiment.courseId];
  if (!course) throw new Error(`${experiment.id} names a course that does not exist.`);
  return {
    experimentId: experiment.id,
    name: experiment.live.catalogue.name,
    summary: experiment.live.catalogue.summary,
    courseId: course.id,
    courseName: course.name,
    platformCode: course.platformCode,
    availableIn: [...publishedFormats(experiment)],
    artworkKey: experiment.artworkKey,
  };
}

/** PU-06 and every page that shows an experiment's catalogue view (the live version only). */
export function publicPageOf(records: WorldRecords, experiment: Experiment): PublicExperimentPage {
  const entry = catalogueEntryOf(records, experiment);
  const course = records.courses[experiment.courseId]!;
  const area = records.areas[course.areaId];
  if (!area) throw new Error(`${course.id} names an area that does not exist.`);
  return {
    ...entry,
    description: experiment.live.catalogue.description,
    areaName: area.name,
    learningOutcomes: experiment.learningOutcomes.map((outcome) => outcome.text),
    formats: inDisplayOrder(experiment.live.formats.map((entry) => entry.format)).map((format) => {
      const delivery = experiment.live.formats.find((entry) => entry.format === format)!.delivery;
      return {
        format,
        howItRuns: FORMAT_META[format].howItRuns,
        deviceNeeds:
          delivery.format === 'web' ? delivery.browserAndComputer : delivery.deviceNeeded,
      };
    }),
    preview: experiment.live.preview,
    // OD-B7-05 (is the version public?) is open: the contract types this `null` (PC-14).
    versionLabel: null,
  };
}
