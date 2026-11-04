#!/usr/bin/env node
// Catalogue parity (ADR-0013): every CatalogueService answer of the typed mock
// (@xr/sample-platform, spine-start world) against GET /api/v1/catalogue/… of a running API whose
// database holds the development seed. Exits 1 on any difference.
//
//   pnpm --filter @xr/database db:seed
//   pnpm exec turbo run build --filter=@xr/api --filter=@xr/sample-platform
//   pnpm --filter @xr/api start            # in another terminal
//   node scripts/catalogue-parity.mjs http://localhost:4000
//
// A development check, not a test: the API package may not import the sample platform, and the
// contract suite needs an HTTP subject for every port before it can run against the API (TE-2).
import { createSamplePlatform } from '../packages/sample-platform/dist/index.js';

const base = `${process.argv[2] ?? 'http://localhost:4000'}/api/v1/catalogue`;
const port = createSamplePlatform().ports.catalogue;
const failures = [];
let comparisons = 0;

async function overHttp(path) {
  const response = await fetch(base + path);
  return { status: response.status, body: await response.json() };
}

function fromMock(answer) {
  if (answer.ok) return { status: 200, body: answer.value };
  return { status: answer.error.kind === 'not-found' ? 404 : 500, body: null };
}

async function compare(label, mockAnswer, path) {
  comparisons += 1;
  const mock = fromMock(await mockAnswer);
  const api = await overHttp(path);
  const same =
    mock.status === api.status &&
    (mock.status !== 200 || JSON.stringify(mock.body) === JSON.stringify(api.body));
  if (!same) failures.push({ label, path, mock, api });
}

await compare('listAreas', port.listAreas(), '/areas');
const areas = (await port.listAreas()).value;
for (const area of areas) {
  await compare(`getArea ${area.id}`, port.getArea(area.id), `/areas/${area.id}`);
  for (const course of (await port.getArea(area.id)).value.courses) {
    await compare(`getCourse ${course.id}`, port.getCourse(course.id), `/courses/${course.id}`);
  }
}
await compare('getArea unknown', port.getArea('no-such-area'), '/areas/no-such-area');
await compare('getCourse unknown', port.getCourse('no-such-course'), '/courses/no-such-course');

const queries = [];
for (const sort of ['default', 'title-a-z', 'course-code']) {
  queries.push({ sort }, { sort, featured: true }, { sort, featured: false });
  for (const area of areas) queries.push({ sort, areaId: area.id });
  for (const format of ['web', 'ar', 'vr', 'mr']) queries.push({ sort, format });
  for (const text of ['heat', 'ME ZG', '  COMPOSITE ', 'nothing-matches', 'Fluid'])
    queries.push({ sort, text });
  queries.push(
    { sort, featured: true, format: 'vr' },
    { sort, areaId: areas[0].id, text: 'wall', format: 'web' },
  );
}
for (const query of queries) {
  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  );
  await compare(
    `search ${JSON.stringify(query)}`,
    port.searchCatalogue(query),
    `/experiments?${params}`,
  );
}
for (const entry of (await port.searchCatalogue({ sort: 'default' })).value.entries) {
  await compare(
    `getExperiment ${entry.experimentId}`,
    port.getExperiment(entry.experimentId),
    `/experiments/${entry.experimentId}`,
  );
}
await compare(
  'getExperiment unknown',
  port.getExperiment('no-such-experiment'),
  '/experiments/no-such-experiment',
);

console.log(`${comparisons} comparisons, ${failures.length} differences`);
for (const failure of failures.slice(0, 5)) console.log(JSON.stringify(failure).slice(0, 1500));
process.exit(failures.length === 0 ? 0 : 1);
