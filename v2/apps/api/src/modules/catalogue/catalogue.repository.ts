import type { PrismaClient } from '@xr/database';
import {
  type AreaId,
  type CourseId,
  type ExperimentId,
  type PlatformCourseCode,
  type PreviewLink,
  type PublishedExperimentFacts,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

export interface CatalogueAreaRow {
  readonly id: AreaId;
  readonly name: string;
  readonly description: string | null;
  readonly artworkKey: string | null;
}

export interface CatalogueCourseRow {
  readonly id: CourseId;
  readonly areaId: AreaId;
  readonly name: string;
  readonly description: string | null;
  readonly platformCode: PlatformCourseCode | null;
}

/** A published experiment as the public catalogue reads it: the live version only (B7-11). */
export interface PublishedExperimentRow extends PublishedExperimentFacts {
  readonly artworkKey: string | null;
  readonly live: {
    readonly catalogue: {
      readonly name: string;
      readonly summary: string;
      readonly description: string;
    };
    /** The device line of each published format (WEB: browser and computer; else the device). */
    readonly formats: readonly { readonly format: Technology; readonly deviceNeeds: string }[];
    readonly preview: PreviewLink | null;
  };
  readonly learningOutcomes: readonly string[];
}

/** Everything the public catalogue reads, each list in the catalogue's own order. */
export interface CatalogueReadModel {
  readonly areas: readonly CatalogueAreaRow[];
  readonly courses: readonly CatalogueCourseRow[];
  readonly experiments: readonly PublishedExperimentRow[];
  /** P1-22 interim (PC-32): the landing's featured experiments, in their seeded order. */
  readonly featured: readonly ExperimentId[];
}

/** The catalogue's storage. Rejects when the store cannot be read; never answers partially. */
export abstract class CatalogueRepository {
  abstract load(): Promise<CatalogueReadModel>;
}

/**
 * The D1 tables through Prisma (ADR-0013). The whole public catalogue is read per request — it is
 * small (the sample world holds 12 experiments) — in ONE repeatable-read transaction, so a
 * concurrent publication or re-seed can never produce a torn read (an experiment whose course is
 * not in the same answer). Only experiments with a live version are public.
 */
export class PrismaCatalogueRepository extends CatalogueRepository {
  constructor(private readonly client: () => PrismaClient) {
    super();
  }

  async load(): Promise<CatalogueReadModel> {
    const [areas, courses, experiments, featured] = await this.client().$transaction(
      (tx) =>
        Promise.all([
          tx.engineeringArea.findMany({
            orderBy: { catalogueOrder: 'asc' },
            select: { id: true, name: true, description: true, artworkKey: true },
          }),
          tx.course.findMany({
            orderBy: { catalogueOrder: 'asc' },
            select: { id: true, areaId: true, name: true, description: true, platformCode: true },
          }),
          tx.experiment.findMany({
            where: { liveVersionId: { not: null } },
            orderBy: { catalogueOrder: 'asc' },
            select: {
              id: true,
              courseId: true,
              artworkKey: true,
              liveVersion: {
                select: {
                  name: true,
                  summary: true,
                  description: true,
                  previewLabel: true,
                  previewLink: true,
                  formats: {
                    select: { format: true, browserAndComputer: true, deviceNeeded: true },
                  },
                },
              },
              learningOutcomes: { orderBy: { position: 'asc' }, select: { text: true } },
            },
          }),
          tx.featuredExperiment.findMany({
            orderBy: { position: 'asc' },
            select: { experimentId: true },
          }),
        ]),
      { isolationLevel: 'RepeatableRead' },
    );

    return {
      areas: areas.map((area) => ({ ...area, id: unsafeBrand<AreaId>(area.id) })),
      courses: courses.map((course) => ({
        ...course,
        id: unsafeBrand<CourseId>(course.id),
        areaId: unsafeBrand<AreaId>(course.areaId),
        platformCode:
          course.platformCode === null
            ? null
            : unsafeBrand<PlatformCourseCode>(course.platformCode),
      })),
      experiments: experiments.map((experiment) => {
        const live = experiment.liveVersion;
        if (!live) throw new Error(`${experiment.id} has no live version`);
        return {
          id: unsafeBrand<ExperimentId>(experiment.id),
          courseId: unsafeBrand<CourseId>(experiment.courseId),
          artworkKey: experiment.artworkKey,
          live: {
            catalogue: { name: live.name, summary: live.summary, description: live.description },
            formats: live.formats.map((entry) => {
              const deviceNeeds =
                entry.format === 'web' ? entry.browserAndComputer : entry.deviceNeeded;
              // The delivery CHECK makes this impossible; fail loudly rather than publish a hole.
              if (deviceNeeds === null) {
                throw new Error(`${experiment.id} ${entry.format}: delivery has no device line`);
              }
              return { format: entry.format, deviceNeeds };
            }),
            preview:
              live.previewLink === null
                ? null
                : { label: live.previewLabel, link: live.previewLink },
          },
          learningOutcomes: experiment.learningOutcomes.map((outcome) => outcome.text),
        };
      }),
      featured: featured.map((entry) => unsafeBrand<ExperimentId>(entry.experimentId)),
    };
  }
}
