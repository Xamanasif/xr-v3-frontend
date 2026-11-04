/**
 * Development seed for the D1 catalogue tables (ADR-0013).
 *
 * The data is the sample world's catalogue, exported as plain JSON by `@xr/sample-platform`
 * (`pnpm --filter @xr/sample-platform export:catalogue-seed` → `prisma/seed/catalogue.json`), so
 * the API serves the same catalogue the typed mock does. It is a development fixture only, never a
 * production record (STK31-23): `scripts/db-seed.mjs` refuses to run outside development.
 *
 * This package may import no other workspace package, so the file shape is declared here; the
 * sample platform's exporter writes the same shape and its test keeps the committed file current.
 */
import type { PrismaClient, Technology } from './generated/prisma/client.js';

export type SeedDelivery =
  | {
      readonly format: 'web';
      readonly webLink: string;
      readonly browserAndComputer: string;
      readonly notes: string | null;
    }
  | {
      readonly format: 'ar' | 'vr' | 'mr';
      readonly packageLabel: string;
      readonly packageReference: string | null;
      readonly packageFileName: string | null;
      readonly deviceNeeded: string;
      readonly installNotes: string;
      readonly notes: string | null;
    };

export interface SeedVersion {
  readonly label: string;
  /** ISO 8601 instants. */
  readonly liveFrom: string;
  readonly liveUntil: string | null;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly preview: { readonly label: string | null; readonly link: string } | null;
  readonly formats: readonly { readonly format: Technology; readonly delivery: SeedDelivery }[];
}

export interface CatalogueSeed {
  readonly source: string;
  /** Each list is in the catalogue's own order; its index is the stored `catalogue_order`. */
  readonly areas: readonly {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    readonly artworkKey: string | null;
  }[];
  readonly courses: readonly {
    readonly id: string;
    readonly areaId: string;
    readonly name: string;
    readonly description: string | null;
    readonly platformCode: string | null;
  }[];
  readonly experiments: readonly {
    readonly id: string;
    readonly courseId: string;
    readonly artworkKey: string | null;
    readonly publishedAt: string;
    /** The label of the live version; it must be one of `versions`. */
    readonly liveVersion: string;
    readonly versions: readonly SeedVersion[];
    readonly learningOutcomes: readonly { readonly id: string; readonly text: string }[];
  }[];
  /** The landing's featured experiments, in order (PC-32). */
  readonly featured: readonly string[];
}

export interface CatalogueSeedResult {
  readonly areas: number;
  readonly courses: number;
  readonly experiments: number;
  readonly versions: number;
  readonly featured: number;
}

function deliveryColumns(delivery: SeedDelivery) {
  return delivery.format === 'web'
    ? {
        webLink: delivery.webLink,
        browserAndComputer: delivery.browserAndComputer,
        notes: delivery.notes,
      }
    : {
        packageLabel: delivery.packageLabel,
        packageReference: delivery.packageReference,
        packageFileName: delivery.packageFileName,
        deviceNeeded: delivery.deviceNeeded,
        installNotes: delivery.installNotes,
        notes: delivery.notes,
      };
}

/**
 * Replace every catalogue row with `seed`, in one transaction: a failure leaves the previous
 * catalogue in place. Constraint violations (an unknown course, a live label that is not a version,
 * a delivery of the wrong kind) reject the whole seed.
 */
export async function seedCatalogue(
  client: PrismaClient,
  seed: CatalogueSeed,
): Promise<CatalogueSeedResult> {
  let versions = 0;
  await client.$transaction(async (tx) => {
    await tx.featuredExperiment.deleteMany();
    await tx.experiment.updateMany({ data: { liveVersionId: null } });
    await tx.experiment.deleteMany();
    await tx.course.deleteMany();
    await tx.engineeringArea.deleteMany();

    await tx.engineeringArea.createMany({
      data: seed.areas.map((area, catalogueOrder) => ({ ...area, catalogueOrder })),
    });
    await tx.course.createMany({
      data: seed.courses.map((course, catalogueOrder) => ({ ...course, catalogueOrder })),
    });
    for (const [catalogueOrder, experiment] of seed.experiments.entries()) {
      await tx.experiment.create({
        data: {
          id: experiment.id,
          courseId: experiment.courseId,
          artworkKey: experiment.artworkKey,
          publishedAt: new Date(experiment.publishedAt),
          catalogueOrder,
          learningOutcomes: {
            create: experiment.learningOutcomes.map((outcome, position) => ({
              ...outcome,
              position,
            })),
          },
        },
      });
      let liveVersionId: string | null = null;
      for (const version of experiment.versions) {
        const created = await tx.experimentVersion.create({
          data: {
            experimentId: experiment.id,
            label: version.label,
            liveFrom: new Date(version.liveFrom),
            liveUntil: version.liveUntil === null ? null : new Date(version.liveUntil),
            name: version.name,
            summary: version.summary,
            description: version.description,
            previewLabel: version.preview?.label ?? null,
            previewLink: version.preview?.link ?? null,
            formats: {
              create: version.formats.map(({ format, delivery }) => ({
                format,
                ...deliveryColumns(delivery),
              })),
            },
          },
          select: { id: true },
        });
        versions += 1;
        if (version.label === experiment.liveVersion) liveVersionId = created.id;
      }
      if (liveVersionId === null) {
        throw new Error(
          `${experiment.id}: live version ${experiment.liveVersion} is not one of its versions`,
        );
      }
      await tx.experiment.update({ where: { id: experiment.id }, data: { liveVersionId } });
    }
    await tx.featuredExperiment.createMany({
      data: seed.featured.map((experimentId, position) => ({ experimentId, position })),
    });
  });
  return {
    areas: seed.areas.length,
    courses: seed.courses.length,
    experiments: seed.experiments.length,
    versions,
    featured: seed.featured.length,
  };
}
