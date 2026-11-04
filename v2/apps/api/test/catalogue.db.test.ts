/**
 * The public catalogue over HTTP against PostgreSQL (D1, ADR-0013): the real Prisma repository on
 * the committed migrations and the development seed, in a throw-away schema (`@xr/database/testing`),
 * never the developer's `public` data. Runs only through `pnpm test:db`.
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
} from '@xr/contracts/draft';
import { createPrismaClient, seedCatalogue } from '@xr/database';
import {
  createMigratedSchema,
  developmentCatalogueSeed,
  type MigratedSchema,
} from '@xr/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/bootstrap.js';
import { PrismaCatalogueRepository } from '../src/modules/catalogue/catalogue.repository.js';

const databaseUrl = process.env['DATABASE_URL'];
const BASE = '/api/v1/catalogue';
const SEED = developmentCatalogueSeed();

describe.skipIf(!databaseUrl)('the public catalogue over HTTP, on PostgreSQL', () => {
  let schema: MigratedSchema;
  let client: ReturnType<typeof createPrismaClient>;
  let app: NestFastifyApplication;
  const get = async (url: string) => {
    const response = await app.inject({ method: 'GET', url: `${BASE}${url}` });
    return { status: response.statusCode, body: response.json() as unknown };
  };

  beforeAll(async () => {
    schema = await createMigratedSchema(databaseUrl as string);
    client = createPrismaClient({ connectionString: databaseUrl as string, schema: schema.schema });
    await seedCatalogue(client, SEED);
    app = await createApp({
      env: { APP_ENV: 'development', DATABASE_URL: '' },
      catalogueRepository: new PrismaCatalogueRepository(() => client),
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await client?.$disconnect().catch(() => undefined);
    await schema?.drop();
  });

  it('lists the seeded areas in the catalogue order, counts from publication', async () => {
    const { status, body } = await get('/areas');
    expect(status).toBe(200);
    expect(
      listAreasOutput.parse(body).map((area) => [area.id, area.courseCount, area.experimentCount]),
    ).toEqual([
      ['mechanical-manufacturing', 2, 5],
      ['electrical-electronics', 2, 4],
      ['chemical-process', 1, 3],
    ]);
  });

  it('searches in the seeded order, the featured order and the named orders', async () => {
    const ids = async (query: string) =>
      searchCatalogueOutput
        .parse((await get(`/experiments?${query}`)).body)
        .entries.map((entry) => entry.experimentId);
    expect(await ids('sort=default')).toEqual(SEED.experiments.map((experiment) => experiment.id));
    expect(await ids('sort=default&featured=true')).toEqual(SEED.featured);
    const byTitle = await ids('sort=title-a-z');
    expect(byTitle).toHaveLength(12);
    expect(byTitle).not.toEqual(await ids('sort=default'));
  });

  it('a course with nothing published is a page with no experiments; its area still lists it not', async () => {
    const course = getCourseOutput.parse((await get('/courses/fluid-mechanics')).body);
    expect(course.experiments).toEqual([]);
    const area = getAreaOutput.parse((await get(`/areas/${course.area.id}`)).body);
    expect(area.courses.map((entry) => entry.id)).not.toContain('fluid-mechanics');
  });

  it('serves the live version only: a change to an earlier version is never shown', async () => {
    const live = await client.experiment.findUniqueOrThrow({
      where: { id: 'distillation-column' },
      select: { liveVersion: { select: { label: true } } },
    });
    expect(live.liveVersion?.label).toBe('1.2');
    await client.experimentVersion.update({
      where: { experimentId_label: { experimentId: 'distillation-column', label: '1.0' } },
      data: { name: 'An earlier version' },
    });
    const page = publicExperimentPage.parse((await get('/experiments/distillation-column')).body);
    expect(page.name).toBe('Distillation Column');
    expect(page.areaName).toBe('Chemical & Process');
  });

  it('an experiment without a live version is not public: absent from search, 404 as a page', async () => {
    await client.experiment.update({
      where: { id: 'orifice-plate-metering' },
      data: { liveVersionId: null },
    });
    try {
      expect((await get('/experiments/orifice-plate-metering')).status).toBe(404);
      const all = searchCatalogueOutput.parse((await get('/experiments?sort=default')).body);
      expect(all.entries.map((entry) => entry.experimentId)).not.toContain(
        'orifice-plate-metering',
      );
      expect(all.total).toBe(11);
    } finally {
      await seedCatalogue(client, SEED);
    }
  });
});

if (!databaseUrl) {
  it('is skipped: DATABASE_URL is not set', () => {
    expect(databaseUrl).toBeUndefined();
  });
}
