import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type {
  AreaCard,
  CatalogueEntry,
  CatalogueQuery,
  CourseCard,
  PublicExperimentPage,
} from '@xr/contracts/draft';
import {
  type AreaId,
  type CourseId,
  type ExperimentId,
  FORMAT_META,
  inDisplayOrder,
  publicAreas,
  publicCatalogue,
  type PublicCatalogueEntry,
  publishedFormats,
  searchPublicCatalogue,
  type Technology,
} from '@xr/domain';

import type {
  CatalogueAreaPage,
  CatalogueCoursePage,
  CatalogueSearchResult,
} from './catalogue.contract.js';
import {
  type CatalogueCourseRow,
  type CatalogueReadModel,
  CatalogueRepository,
  type PublishedExperimentRow,
} from './catalogue.repository.js';

/**
 * §3.2 CatalogueService over the D1 tables (ADR-0013). The same rules as the typed mock
 * (`@xr/sample-platform` `handlers/catalogue.ts`, `views.ts`), from the same domain functions: the
 * catalogue reads publication only — never access, entitlement, activity or completion (BC9);
 * counts, courses and formats derive from published experiments (B1-02, B1-03); an area without a
 * published experiment is hidden, as a list entry and as a page (CRS-09, OD-B7-13), and so are its
 * courses; an unknown or unpublished experiment is not found (PU-15).
 */
@Injectable()
export class CatalogueReader {
  private readonly logger = new Logger(CatalogueReader.name);

  constructor(private readonly repository: CatalogueRepository) {}

  async listAreas(): Promise<readonly AreaCard[]> {
    const model = await this.load();
    const catalogue = catalogueOf(model);
    return publicAreas(model.areas, catalogue).map((area) => areaCardOf(area, catalogue));
  }

  async getArea(areaId: AreaId): Promise<CatalogueAreaPage> {
    const model = await this.load();
    const catalogue = catalogueOf(model);
    const area = shownArea(model, areaId, catalogue);
    if (!area) throw notFound('The engineering area is not in the public catalogue.');
    const published = new Set(
      catalogue.filter((entry) => entry.areaId === area.id).map((entry) => entry.courseId),
    );
    return {
      area: areaCardOf(area, catalogue),
      courses: model.courses
        .filter((course) => published.has(course.id))
        .map((course) => courseCardOf(model, course)),
    };
  }

  async getCourse(courseId: CourseId): Promise<CatalogueCoursePage> {
    const model = await this.load();
    const course = model.courses.find((entry) => entry.id === courseId);
    if (!course) throw notFound('The course is not in the public catalogue.');
    const catalogue = catalogueOf(model);
    const area = shownArea(model, course.areaId, catalogue);
    if (!area) throw notFound('The course is not in the public catalogue.');
    return {
      course: courseCardOf(model, course),
      area: { id: area.id, name: area.name },
      experiments: catalogue
        .filter((entry) => entry.courseId === course.id)
        .map((entry) => catalogueEntryOf(model, experimentOf(model, entry.experimentId))),
    };
  }

  async searchCatalogue(query: CatalogueQuery): Promise<CatalogueSearchResult> {
    const model = await this.load();
    const entries = searchPublicCatalogue(catalogueOf(model), query, {
      courseName: (courseId) => courseOf(model, courseId)?.name ?? null,
      featured: model.featured,
    }).map((entry) => catalogueEntryOf(model, experimentOf(model, entry.experimentId)));
    return { total: entries.length, entries };
  }

  async getExperiment(experimentId: ExperimentId): Promise<PublicExperimentPage> {
    const model = await this.load();
    const experiment = model.experiments.find((entry) => entry.id === experimentId);
    if (!experiment) throw notFound('The experiment is not in the public catalogue.');
    return publicPageOf(model, experiment);
  }

  /**
   * The port's `unavailable`: the store could not be read. The reason may name hosts or
   * credentials — it is logged, never published (the 5xx body is generic).
   */
  private async load(): Promise<CatalogueReadModel> {
    try {
      return await this.repository.load();
    } catch (error) {
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      this.logger.warn(`Catalogue read failed: ${reason.replace(/\s+/g, ' ').trim()}`);
      throw new ServiceUnavailableException('The catalogue is unavailable right now.');
    }
  }
}

function notFound(detail: string): NotFoundException {
  return new NotFoundException(detail);
}

function catalogueOf(model: CatalogueReadModel): readonly PublicCatalogueEntry[] {
  return publicCatalogue(model.experiments, model.courses);
}

function courseOf(model: CatalogueReadModel, courseId: CourseId): CatalogueCourseRow | undefined {
  return model.courses.find((course) => course.id === courseId);
}

function experimentOf(model: CatalogueReadModel, id: ExperimentId): PublishedExperimentRow {
  const experiment = model.experiments.find((entry) => entry.id === id);
  if (!experiment) throw new Error(`${id} is in the catalogue but not in the read model`);
  return experiment;
}

/** The area when it is on the public surface (it holds a published experiment), else nothing. */
function shownArea(
  model: CatalogueReadModel,
  areaId: AreaId,
  catalogue: readonly PublicCatalogueEntry[],
) {
  const area = model.areas.find((entry) => entry.id === areaId);
  return area && publicAreas([area], catalogue).length > 0 ? area : undefined;
}

function areaCardOf(
  area: CatalogueReadModel['areas'][number],
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

function courseCardOf(model: CatalogueReadModel, course: CatalogueCourseRow): CourseCard {
  const formats = new Set<Technology>();
  for (const experiment of model.experiments) {
    if (experiment.courseId === course.id)
      publishedFormats(experiment).forEach((format) => formats.add(format));
  }
  return {
    id: course.id,
    name: course.name,
    platformCode: course.platformCode,
    description: course.description,
    formatsInCourse: inDisplayOrder(formats),
  };
}

function catalogueEntryOf(
  model: CatalogueReadModel,
  experiment: PublishedExperimentRow,
): CatalogueEntry {
  const course = courseOf(model, experiment.courseId);
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

/** PU-06: the live version only. */
function publicPageOf(
  model: CatalogueReadModel,
  experiment: PublishedExperimentRow,
): PublicExperimentPage {
  const entry = catalogueEntryOf(model, experiment);
  const course = courseOf(model, experiment.courseId)!;
  const area = model.areas.find((candidate) => candidate.id === course.areaId);
  if (!area) throw new Error(`${course.id} names an area that does not exist.`);
  return {
    ...entry,
    description: experiment.live.catalogue.description,
    areaName: area.name,
    learningOutcomes: [...experiment.learningOutcomes],
    formats: inDisplayOrder(experiment.live.formats.map((format) => format.format)).map(
      (format) => ({
        format,
        howItRuns: FORMAT_META[format].howItRuns,
        deviceNeeds: experiment.live.formats.find((entry) => entry.format === format)!.deviceNeeds,
      }),
    ),
    preview: experiment.live.preview,
    // OD-B7-05 (is the version public?) is open: the contract types this `null` (PC-14).
    versionLabel: null,
  };
}
