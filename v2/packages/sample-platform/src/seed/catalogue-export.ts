/**
 * The sample world's catalogue as plain data, for the API's development database (ADR-0013).
 *
 * `scripts/export-catalogue-seed.mjs` writes it to `packages/database/prisma/seed/catalogue.json`,
 * which `pnpm --filter @xr/database db:seed` loads — so the API serves the catalogue the typed
 * mock serves. The two packages may not import each other; the shape below is the one
 * `@xr/database` declares (`CatalogueSeed`), and `catalogue-export.test.ts` keeps the committed
 * file equal to this export. Development fixture only, never a production record (STK31-23).
 *
 * Every list keeps the world's record order: it is the catalogue's own order (`default` sort,
 * the area and course lists), stored as `catalogue_order`.
 */
import type { ExperimentVersion } from '@xr/domain';

import { values } from '../world/records.js';
import type { World } from '../world/types.js';

function versionOf(version: ExperimentVersion) {
  return {
    label: version.label,
    liveFrom: version.liveFrom,
    liveUntil: version.liveUntil,
    name: version.catalogue.name,
    summary: version.catalogue.summary,
    description: version.catalogue.description,
    preview: version.preview,
    formats: version.formats.map(({ format, delivery }) => ({ format, delivery })),
  };
}

export function catalogueSeedOf(world: World) {
  const records = world.records;
  return {
    source: `@xr/sample-platform seed '${world.seedId}' (development fixture only; STK31-23)`,
    areas: values(records.areas).map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      artworkKey: area.artworkKey,
    })),
    courses: values(records.courses).map((course) => ({
      id: course.id,
      areaId: course.areaId,
      name: course.name,
      description: course.description,
      platformCode: course.platformCode,
    })),
    experiments: values(records.experiments).map((experiment) => ({
      id: experiment.id,
      courseId: experiment.courseId,
      artworkKey: experiment.artworkKey,
      publishedAt: experiment.publishedAt,
      liveVersion: experiment.live.label,
      versions: experiment.versions.map(versionOf),
      learningOutcomes: experiment.learningOutcomes.map((outcome) => ({
        id: outcome.id,
        text: outcome.text,
      })),
    })),
    featured: [...world.seeded.featuredExperiments],
  };
}

/** The file as committed: two-space JSON with a trailing newline. */
export function catalogueSeedJson(world: World): string {
  return `${JSON.stringify(catalogueSeedOf(world), null, 2)}\n`;
}
