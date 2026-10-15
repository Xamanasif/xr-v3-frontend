/**
 * The Student's format chooser (Phase 3; B3-02 ST-07): one progress view per format the experiment
 * publishes, the same reading as each format's own page (ST-08 / ST-09) — per format, never an
 * aggregate (BC4); a runtime completion of one format completes that format only (BC3, T-12
 * open); an experiment that is not given is refused as the hub refuses it.
 */
import { check, valueOf } from '../assert.js';
import { experimentNamed, personIdOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { SAMPLE } from '../sample.js';

const chooser: ContractCase = {
  id: 'learning:chooser',
  title: 'ST-07 reads one view per published format, as each format page does (B3-02)',
  group: 'learning',
  evidence:
    'B3-02 f0 … f3 (one row per format, one status); B3-03 / B3-04 (the format pages); flows.json C1–C2; BC3, BC4; T-12',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'CatalogueService.searchCatalogue',
      'CatalogueService.getExperiment',
      'SessionService.getSession',
      'LearningService.getSimulationChooser',
      'LearningService.getFormatPage',
    ],
  },
  run: async (context) => {
    const student = context.as('Rahul Verma');
    const rahul = await personIdOf(student, 'Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const experimentId = shell.experimentId;
    const published = valueOf(
      await context.publicPorts.catalogue.getExperiment(experimentId),
      'PU-06 the published formats',
    ).formats.map((entry) => entry.format);

    const rows = valueOf(await student.learning.getSimulationChooser(experimentId), 'ST-07');
    check(
      rows.length === published.length &&
        published.every((format) => rows.some((row) => row.format === format)),
      'ST-07: one row per format the experiment publishes',
    );
    for (const row of rows) {
      const page = valueOf(
        await student.learning.getFormatPage({ experimentId, format: row.format }),
        `ST-08/09 ${row.format}`,
      );
      check(
        page.progress.status === row.status && page.progress.feedback === row.feedback,
        `ST-07 and the ${row.format} page read the same progress`,
      );
      check(row.status === 'not-started', `ST-07: ${row.format} not started before any report`);
    }

    const { runtimeReport, clock } = context.standins;
    check(
      runtimeReport.reportCompletion({
        studentId: rahul,
        experimentId,
        format: 'web',
        at: clock.now(),
        from: 'simulation',
      }).ok,
      'the simulation reports WEB completed (the only route, T-12 open)',
    );
    const after = valueOf(await student.learning.getSimulationChooser(experimentId), 'ST-07 after');
    check(
      after.find((row) => row.format === 'web')?.status === 'completed',
      'ST-07: WEB Completed, written by the system',
    );
    check(
      after.filter((row) => row.format !== 'web').every((row) => row.status === 'not-started'),
      'ST-07: one format never completes another (BC4)',
    );
  },
};

export const LEARNING_CASES: readonly ContractCase[] = [chooser];
