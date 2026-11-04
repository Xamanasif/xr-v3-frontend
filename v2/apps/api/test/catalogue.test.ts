/**
 * The public catalogue over HTTP (D1, ADR-0013), in process, on an in-memory read model: the
 * routes, the rules they apply (publication only; hidden areas; not found), the contract on the
 * way in and out, the problems, and the published document. The same routes against PostgreSQL
 * run in `catalogue.db.test.ts` (`pnpm test:db`).
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PROBLEM_JSON, problemDetailsSchema, toOpenApiSchema } from '@xr/contracts';
import {
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
} from '@xr/contracts/draft';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OPENAPI_JSON_PATH, createApp } from '../src/bootstrap.js';
import {
  CATALOGUE_FIXTURE,
  FIXTURE_IDS as id,
  InMemoryCatalogueRepository,
} from './fixtures/catalogue.fixture.js';

const ENV = { APP_ENV: 'development', DATABASE_URL: '' };
const BASE = '/api/v1/catalogue';

async function started(repository: InMemoryCatalogueRepository): Promise<NestFastifyApplication> {
  const app = await createApp({ env: ENV, catalogueRepository: repository });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe('the public catalogue over HTTP', () => {
  let app: NestFastifyApplication;
  const get = (url: string) => app.inject({ method: 'GET', url: `${BASE}${url}` });
  const ids = (body: { entries: { experimentId: string }[] }) =>
    body.entries.map((entry) => entry.experimentId);

  beforeAll(async () => {
    app = await started(InMemoryCatalogueRepository.of());
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists only the areas with a published experiment, with counts from publication', async () => {
    const response = await get('/areas');
    expect(response.statusCode).toBe(200);
    const areas = listAreasOutput.parse(response.json());
    expect(areas).toEqual([
      {
        id: id.mechanical,
        name: 'Mechanical & Manufacturing',
        description: null,
        artworkKey: 'thermal',
        courseCount: 1,
        experimentCount: 2,
      },
    ]);
  });

  it('an area page lists the courses that have published experiments; a hidden area is 404', async () => {
    const page = getAreaOutput.parse((await get(`/areas/${id.mechanical}`)).json());
    expect(page.courses.map((course) => course.id)).toEqual([id.thermo]);
    expect(page.courses[0]!.formatsInCourse).toEqual(['web', 'ar', 'vr']);

    const hidden = await get(`/areas/${id.chemical}`);
    expect(hidden.statusCode).toBe(404);
    expect(hidden.headers['content-type']).toContain(PROBLEM_JSON);
    expect(problemDetailsSchema.parse(hidden.json()).detail).toBe(
      'The engineering area is not in the public catalogue.',
    );
  });

  it('a course page carries its area and experiments; a course of a hidden area is 404', async () => {
    const page = getCourseOutput.parse((await get(`/courses/${id.thermo}`)).json());
    expect(page.area).toEqual({ id: id.mechanical, name: 'Mechanical & Manufacturing' });
    expect(page.experiments.map((entry) => entry.experimentId)).toEqual([id.shell, id.wall]);

    const empty = getCourseOutput.parse((await get(`/courses/${id.casting}`)).json());
    expect(empty.experiments).toEqual([]);
    expect(empty.course.formatsInCourse).toEqual([]);

    expect((await get(`/courses/${id.process}`)).statusCode).toBe(404);
    expect((await get('/courses/unknown')).statusCode).toBe(404);
  });

  it('search: catalogue order, featured order, filters and the B1-04 orders', async () => {
    const search = async (query: string) =>
      searchCatalogueOutput.parse((await get(`/experiments?${query}`)).json());
    expect(ids(await search('sort=default'))).toEqual([id.shell, id.wall]);
    expect(ids(await search('sort=default&featured=true'))).toEqual([id.wall, id.shell]);
    expect(ids(await search('sort=default&featured=false'))).toEqual([id.shell, id.wall]);
    expect(ids(await search('sort=title-a-z'))).toEqual([id.wall, id.shell]);
    expect(ids(await search('sort=default&format=ar'))).toEqual([id.wall]);
    expect(ids(await search(`sort=default&areaId=${id.chemical}`))).toEqual([]);
    expect(ids(await search('sort=default&text=%20me%20zg523'))).toEqual([id.shell, id.wall]);
    const result = await search('sort=default&text=nothing');
    expect(result).toEqual({ total: 0, entries: [] });
    expect((await search('sort=default')).entries[0]!.availableIn).toEqual(['web', 'vr']);
  });

  it('the experiment page is the live catalogue view in display order; unknown is 404', async () => {
    const page = publicExperimentPage.parse((await get(`/experiments/${id.shell}`)).json());
    expect(page.areaName).toBe('Mechanical & Manufacturing');
    expect(page.formats.map((format) => format.format)).toEqual(['web', 'vr']);
    expect(page.formats[0]!.deviceNeeds).toBe('Laptop or desktop with a current web browser');
    expect(page.learningOutcomes).toEqual(['Determine LMTD', 'Compare arrangements']);
    expect(page.preview).toEqual({
      label: 'Watch the walkthrough',
      link: 'https://preview.example/shell',
    });
    expect(page.versionLabel).toBeNull();

    const unknown = await get('/experiments/not-published?token=sekret');
    expect(unknown.statusCode).toBe(404);
    const problem = problemDetailsSchema.parse(unknown.json());
    expect(problem.detail).toBe('The experiment is not in the public catalogue.');
    expect(problem.instance).toBe(`${BASE}/experiments/not-published`);
    expect(JSON.stringify(problem)).not.toContain('sekret');
  });

  it('refuses a query outside the contract — no coercion, no unknown keys, sort required', async () => {
    for (const query of [
      '',
      'sort=newest',
      'sort=default&featured=1',
      'sort=default&format=xr',
      'sort=default&page=2',
    ]) {
      const response = await get(`/experiments?${query}`);
      expect(response.statusCode, query).toBe(400);
      expect(problemDetailsSchema.parse(response.json()).title).toBe('Validation failed');
    }
    // The contract, not the router, answers on id length: up to 200 characters are allowed.
    expect((await get(`/experiments/${'x'.repeat(150)}`)).statusCode).toBe(404);
    expect((await get(`/experiments/${'x'.repeat(201)}`)).statusCode).toBe(400);
  });

  it('holds publication only: no access, entitlement, activity or completion field anywhere', async () => {
    const bodies = [
      (await get('/areas')).body,
      (await get(`/courses/${id.thermo}`)).body,
      (await get(`/experiments/${id.shell}`)).body,
    ].join(' ');
    for (const word of ['entitle', 'licence', 'access', 'progress', 'complet', 'grant']) {
      expect(bodies.toLowerCase()).not.toContain(`"${word}`);
    }
  });
});

describe('the catalogue when its store cannot be read', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await started(
      new InMemoryCatalogueRepository(() =>
        Promise.reject(new Error('connect ECONNREFUSED db.internal:5432 password "hunter2"')),
      ),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 503 with a generic problem; the reason stays in the server log', async () => {
    for (const url of ['/areas', `/experiments/${id.shell}`, '/experiments?sort=default']) {
      const response = await app.inject({ method: 'GET', url: `${BASE}${url}` });
      expect(response.statusCode, url).toBe(503);
      expect(response.headers['content-type']).toContain(PROBLEM_JSON);
      const problem = problemDetailsSchema.parse(response.json());
      expect(problem.title).toBe('Service Unavailable');
      for (const leak of ['db.internal', '5432', 'hunter2', 'ECONNREFUSED']) {
        expect(response.body).not.toContain(leak);
      }
    }
  });
});

describe('the catalogue in the published document', () => {
  let app: NestFastifyApplication;
  let document: { paths: Record<string, Record<string, Record<string, unknown>>> };

  beforeAll(async () => {
    app = await started(InMemoryCatalogueRepository.of(CATALOGUE_FIXTURE));
    document = (await app.inject({ method: 'GET', url: `/${OPENAPI_JSON_PATH}` })).json();
  });

  afterAll(async () => {
    await app.close();
  });

  const responseSchema = (path: string) =>
    (
      document.paths[path]!.get!.responses as Record<
        string,
        { content: Record<string, { schema: unknown }> }
      >
    )['200']!.content['application/json']!.schema;

  it('publishes the five routes, each 200 schema equal to the port schema it serves', () => {
    expect(responseSchema(`${BASE}/areas`)).toEqual(toOpenApiSchema(listAreasOutput));
    expect(responseSchema(`${BASE}/areas/{areaId}`)).toEqual(toOpenApiSchema(getAreaOutput));
    expect(responseSchema(`${BASE}/courses/{courseId}`)).toEqual(toOpenApiSchema(getCourseOutput));
    expect(responseSchema(`${BASE}/experiments`)).toEqual(toOpenApiSchema(searchCatalogueOutput));
    expect(responseSchema(`${BASE}/experiments/{experimentId}`)).toEqual(
      toOpenApiSchema(publicExperimentPage),
    );
  });

  it('publishes the search parameters with their constraints, and the problems', () => {
    const search = document.paths[`${BASE}/experiments`]!.get!;
    const parameters = search.parameters as {
      name: string;
      required: boolean;
      schema: Record<string, unknown>;
    }[];
    const byName = Object.fromEntries(parameters.map((parameter) => [parameter.name, parameter]));
    expect(Object.keys(byName).sort()).toEqual(['areaId', 'featured', 'format', 'sort', 'text']);
    expect(byName['sort']).toMatchObject({
      required: true,
      schema: { enum: ['default', 'title-a-z', 'course-code'] },
    });
    expect(byName['featured']).toMatchObject({
      required: false,
      schema: { type: 'string', enum: ['true', 'false'] },
    });
    expect(byName['format']!.schema['enum']).toEqual(['web', 'vr', 'mr', 'ar']);
    expect(Object.keys(search.responses as object).sort()).toEqual(['200', '400', '500', '503']);
    const page = document.paths[`${BASE}/experiments/{experimentId}`]!.get!;
    expect(Object.keys(page.responses as object).sort()).toEqual([
      '200',
      '400',
      '404',
      '500',
      '503',
    ]);
  });
});
