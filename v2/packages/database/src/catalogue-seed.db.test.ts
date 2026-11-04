/**
 * The D1 catalogue tables against a real PostgreSQL (ADR-0013): the committed migrations, the
 * development seed and the constraints the schema promises. Runs only through `pnpm test:db`, in a
 * throw-away schema (`@xr/database/testing`), never in the developer's `public` data.
 */
import { readFileSync } from 'node:fs';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { type CatalogueSeed, createPrismaClient, seedCatalogue } from './index.js';
import { createMigratedSchema, type MigratedSchema } from './testing/index.js';

const databaseUrl = process.env['DATABASE_URL'];
const SEED: CatalogueSeed = JSON.parse(
  readFileSync(new URL('../prisma/seed/catalogue.json', import.meta.url), 'utf8'),
);

describe.skipIf(!databaseUrl)('the catalogue tables (migrations, seed, constraints)', () => {
  let schema: MigratedSchema;
  let client: ReturnType<typeof createPrismaClient>;

  beforeAll(async () => {
    schema = await createMigratedSchema(databaseUrl as string);
    client = createPrismaClient({ connectionString: databaseUrl as string, schema: schema.schema });
  }, 30_000);

  afterAll(async () => {
    await client?.$disconnect().catch(() => undefined);
    await schema?.drop();
  });

  it('applies every committed migration, oldest first', () => {
    expect(schema.migrations).toEqual([
      '20260910000000_foundation_probe',
      '20261104091921_d1_catalogue',
      '20261104093000_d1_catalogue_order',
    ]);
  });

  it('loads the development seed, in the catalogue order, and loads it again unchanged', async () => {
    const first = await seedCatalogue(client, SEED);
    expect(first).toEqual({ areas: 3, courses: 6, experiments: 12, versions: 15, featured: 4 });
    const again = await seedCatalogue(client, SEED);
    expect(again).toEqual(first);
    const experiments = await client.experiment.findMany({
      orderBy: { catalogueOrder: 'asc' },
      select: { id: true, liveVersion: { select: { label: true } } },
    });
    expect(experiments.map((experiment) => experiment.id)).toEqual(
      SEED.experiments.map((experiment) => experiment.id),
    );
    expect(experiments.map((experiment) => experiment.liveVersion?.label)).toEqual(
      SEED.experiments.map((experiment) => experiment.liveVersion),
    );
    const featured = await client.featuredExperiment.findMany({ orderBy: { position: 'asc' } });
    expect(featured.map((entry) => entry.experimentId)).toEqual(SEED.featured);
  });

  it('a WEB format is a link and a package format is a package (CHECK)', async () => {
    const version = await client.experimentVersion.findFirstOrThrow({ select: { id: true } });
    await client.experimentVersionFormat.deleteMany({ where: { versionId: version.id } });
    await expect(
      client.experimentVersionFormat.create({
        data: { versionId: version.id, format: 'web', packageLabel: 'x', deviceNeeded: 'x' },
      }),
    ).rejects.toThrow(/delivery_check|check constraint/i);
    await expect(
      client.experimentVersionFormat.create({
        data: { versionId: version.id, format: 'vr', webLink: 'https://x', installNotes: '' },
      }),
    ).rejects.toThrow(/delivery_check|check constraint/i);
  });

  it('the live version is always one of the experiment’s own versions (composite reference)', async () => {
    const [a, b] = await client.experiment.findMany({
      orderBy: { catalogueOrder: 'asc' },
      take: 2,
      select: { id: true, liveVersionId: true },
    });
    await expect(
      client.experiment.update({ where: { id: a!.id }, data: { liveVersionId: b!.liveVersionId } }),
    ).rejects.toThrow();
  });

  it('a seed that fails leaves the previous catalogue in place (one transaction)', async () => {
    await seedCatalogue(client, SEED);
    const broken: CatalogueSeed = {
      ...SEED,
      experiments: SEED.experiments.map((experiment, index) =>
        index === SEED.experiments.length - 1 ? { ...experiment, liveVersion: '9.9' } : experiment,
      ),
    };
    await expect(seedCatalogue(client, broken)).rejects.toThrow(/live version 9.9/);
    expect(await client.experiment.count()).toBe(12);
    expect(await client.experimentVersionFormat.count()).toBe(32);
  });
});

if (!databaseUrl) {
  it('is skipped: DATABASE_URL is not set', () => {
    expect(databaseUrl).toBeUndefined();
  });
}
