/**
 * The API's development catalogue seed is this world's catalogue (ADR-0013): the committed
 * `packages/database/prisma/seed/catalogue.json` must equal the export, so the API and the typed
 * mock serve the same catalogue. On a difference: `pnpm --filter @xr/sample-platform
 * export:catalogue-seed`.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { seed } from './spine-start.js';
import { catalogueSeedJson, catalogueSeedOf } from './catalogue-export.js';

const COMMITTED = new URL('../../../database/prisma/seed/catalogue.json', import.meta.url);

describe('the catalogue seed for the API database', () => {
  it('the committed file is the current export of the spine-start world', () => {
    // Compared as text after line-ending normalisation (a Windows checkout may write CRLF).
    const committed = readFileSync(COMMITTED, 'utf8').replace(/\r\n/g, '\n');
    expect(committed).toBe(catalogueSeedJson(seed()));
  });

  it('every experiment names a live version it holds, and every reference resolves', () => {
    const data = catalogueSeedOf(seed());
    const areas = new Set(data.areas.map((area) => area.id));
    const courses = new Set(data.courses.map((course) => course.id));
    const experiments = new Set<string>(data.experiments.map((experiment) => experiment.id));
    for (const course of data.courses) expect(areas.has(course.areaId)).toBe(true);
    for (const experiment of data.experiments) {
      expect(courses.has(experiment.courseId)).toBe(true);
      expect(experiment.versions.map((version) => version.label)).toContain(experiment.liveVersion);
    }
    for (const id of data.featured) expect(experiments.has(id)).toBe(true);
  });

  it('holds catalogue records only — no access, people, activity or completion', () => {
    expect(Object.keys(catalogueSeedOf(seed()))).toEqual([
      'source',
      'areas',
      'courses',
      'experiments',
      'featured',
    ]);
  });
});
