/**
 * The Faculty reads (Phase 4A) load, each declares its record kinds once, and each one a Faculty
 * page depends on is refreshed by the commands of the Faculty pages and by the Institute Admin's
 * Faculty course mapping (FMAP) — the one-world rule (ADR-0004).
 */
import { describe, expect, it } from 'vitest';

import * as teaching from './teaching';

interface QueryShape {
  readonly view: string;
  readonly deps: readonly string[];
}

const QUERIES: readonly QueryShape[] = (Object.values(teaching) as unknown[]).filter(
  (value): value is QueryShape =>
    typeof value === 'object' && value !== null && 'deps' in value && 'view' in value,
);

describe('the Faculty reads (queries/teaching.ts)', () => {
  it('defines nine reads, each with distinct record kinds', () => {
    expect(QUERIES.map((query) => query.view)).toEqual([
      'faculty-overview',
      'faculty-my-courses',
      'faculty-teaching-experiment',
      'faculty-assessments',
      'faculty-create-options',
      'faculty-assessment',
      'faculty-assessment-preview',
      'faculty-question-bank',
      'faculty-question',
    ]);
    for (const query of QUERIES) {
      expect(new Set(query.deps).size, query.view).toBe(query.deps.length);
    }
  });

  it('every read follows the Faculty course mapping and the institution’s plans', () => {
    for (const query of QUERIES) {
      expect(query.deps, query.view).toEqual(expect.arrayContaining(['FMAP', 'ACC', 'EXP']));
    }
  });

  it('the assessment and bank reads follow assessment and question changes', () => {
    for (const query of QUERIES.filter((entry) => entry.view !== 'faculty-my-courses')) {
      if (query.view === 'faculty-teaching-experiment') continue;
      expect(query.deps, query.view).toEqual(expect.arrayContaining(['ASMT']));
    }
    for (const view of [
      'faculty-assessment',
      'faculty-assessment-preview',
      'faculty-question-bank',
    ]) {
      expect(QUERIES.find((query) => query.view === view)!.deps, view).toContain('Q');
    }
  });
});
