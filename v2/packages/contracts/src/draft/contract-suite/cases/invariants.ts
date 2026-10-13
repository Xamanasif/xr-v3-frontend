/**
 * Invariant cases that need a real sample world — the checks WP-0.9 deferred to WP-0.11
 * (`obligations.ts`): invariant 10 on the spine-start, `afterFlow('E')` and `stateCoverage()`
 * worlds, and invariant 12 (sample provenance of runtime events).
 */
import { type SubmissionId, unsafeBrand } from '@xr/domain';

import { check, errorOf, valueOf } from '../assert.js';
import { experimentsNamed } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { SAMPLE } from '../sample.js';

/** The board reference of the second Composite Wall record (B5-08, B6-12). */
const SUB_0077 = unsafeBrand<SubmissionId>('SUB-0077');

async function bothRecordsExist(context: CaseContext): Promise<void> {
  const admin = context.as('Arjun Mehta');
  const old = (
    await experimentsNamed(context.publicPorts, SAMPLE.experiments.compositeWall)
  ).filter((entry) => entry.name === SAMPLE.experiments.compositeWall);
  check(old.length === 1, '"Composite Wall Conduction" is one published record');
  const record = valueOf(
    await admin.production.getContentRecord({ kind: 'SUB', id: SUB_0077 }),
    'SUB-0077 on SA-13',
  );
  check(
    record.submission?.content.name === SAMPLE.experiments.compositeWallNew,
    'SUB-0077 is "Conduction Through a Composite Wall" — its own record',
  );
  if (record.experiment) {
    check(
      record.experiment.id !== old[0]!.experimentId,
      'The two experiments have different ids — never merged (BC11)',
    );
  }
}

export const INVARIANT_CASES: readonly ContractCase[] = [
  {
    id: 'invariant:10-spine-start',
    title: 'Invariant 10 — on the spine-start world SUB-0077 does not exist yet',
    group: 'invariant',
    evidence: 'Appendix D §5.5 invariant 10 (reworded at assembly); Appendix F §4.3',
    requires: {
      fixture: { kind: 'spine-start' },
      methods: ['CatalogueService.searchCatalogue', 'ProductionService.getContentRecord'],
    },
    run: async (context) => {
      const listed = await experimentsNamed(context.publicPorts, 'Composite Wall');
      check(
        listed.every((entry) => entry.name !== SAMPLE.experiments.compositeWallNew),
        '"Conduction Through a Composite Wall" is not published before Flow E',
      );
      const record = await context
        .as('Arjun Mehta')
        .production.getContentRecord({ kind: 'SUB', id: SUB_0077 });
      errorOf(record, 'not-found', 'SUB-0077 before Flow E step 1');
    },
  },
  {
    id: 'invariant:10-after-flow-E',
    title: "Invariant 10 — both Composite Wall records exist after Flow E (afterFlow('E'))",
    group: 'invariant',
    evidence: 'WP-0.9 acceptance 5 (deferred to WP-0.11); Appendix D §5.5 invariant 10; BC11',
    requires: {
      fixture: { kind: 'after-flow', flow: 'E' },
      methods: ['CatalogueService.searchCatalogue', 'ProductionService.getContentRecord'],
    },
    run: bothRecordsExist,
  },
  {
    id: 'invariant:10-state-coverage',
    title: 'Invariant 10 — both Composite Wall records exist in the state-coverage world',
    group: 'invariant',
    evidence: 'WP-0.9 acceptance 5 (deferred to WP-0.11); Appendix C §4.1 state coverage; BC11',
    requires: {
      fixture: { kind: 'state-coverage' },
      methods: ['CatalogueService.searchCatalogue', 'ProductionService.getContentRecord'],
    },
    run: bothRecordsExist,
  },
  {
    id: 'invariant:12-provenance',
    title: 'Invariant 12 — every stand-in or fixture runtime event carries sample provenance',
    group: 'invariant',
    evidence: 'Appendix D §5.5 invariant 12; WP-0.11 acceptance 5; TE-3 (deferred by WP-0.9)',
    requires: { fixture: { kind: 'after-flow', flow: 'C' }, methods: [], inspection: true },
    run: async (context) => {
      const origins = context.inspect!.runtimeEventOrigins();
      check(origins.length > 0, 'After Flow C the world holds runtime events');
      check(
        origins.every((origin) => origin === 'sample-standin' || origin === 'sample-fixture'),
        `Every runtime event is sample-standin or sample-fixture (found ${[...new Set(origins)].join(', ')})`,
      );
    },
  },
];
