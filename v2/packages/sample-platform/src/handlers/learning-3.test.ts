/**
 * Phase 3 on the sample adapter: ST-07's format chooser (`getSimulationChooser`, the one deferred
 * Phase-3 read) — one progress view per format the experiment publishes, in display order, read
 * from the same records as the hub and Progress; nothing a Student does completes a format: a
 * launch, a resource and a format page leave the completions untouched, and only the runtime
 * report stand-in (seed and tests only) writes one (BC3, ADR-0006, T-12 open).
 */
import { simulationChooserOutput } from '@xr/contracts/draft';
import { type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import {
  asPerson,
  fixtureWorld,
  type FixtureName,
  personIdOf,
  standinsOf,
  worldOf,
} from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');

async function platformOn(fixture: FixtureName) {
  return createSamplePlatform({ world: await fixtureWorld(fixture) });
}

describe('getSimulationChooser (ST-07)', () => {
  it('answers one not-started view per published format before any runtime report', async () => {
    const platform = await platformOn('after-flow-b');
    const rows = ok(await asPerson(platform, 'Rahul Verma').learning.getSimulationChooser(SHELL));
    expect(simulationChooserOutput.safeParse(rows).success).toBe(true);
    const published = worldOf(platform).records.experiments[SHELL]!.live.formats.map(
      (entry) => entry.format,
    );
    expect(new Set(rows.map((row) => row.format))).toEqual(new Set(published));
    for (const row of rows) {
      expect(row.status).toBe('not-started');
      expect(row.completion).toBeNull();
      expect(row.feedback).toBe('not-offered');
    }
  });

  it('reads the walk’s completions and feedback per format after Flow C', async () => {
    const platform = await platformOn('after-flow-c');
    const rows = ok(await asPerson(platform, 'Rahul Verma').learning.getSimulationChooser(SHELL));
    const web = rows.find((row) => row.format === 'web')!;
    const vr = rows.find((row) => row.format === 'vr')!;
    expect(web.status).toBe('completed');
    expect(web.completion?.reportedFrom).toBe('simulation');
    expect(typeof web.feedback === 'object' && 'sentAt' in web.feedback).toBe(true);
    expect(vr.status).toBe('completed');
    expect(vr.completion?.reportedFrom).toBe('headset');
  });

  it('refuses an experiment that is not given, as the hub does', async () => {
    const platform = await platformOn('after-flow-b');
    const answer = await asPerson(platform, 'Rahul Verma').learning.getSimulationChooser(
      unsafeBrand<ExperimentId>('fin-tube-bundle'),
    );
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.kind).toBe('refused');
  });

  it('a launch, an opened resource and the format pages write no completion; the runtime report does', async () => {
    const platform = await platformOn('after-flow-b');
    const rahul = asPerson(platform, 'Rahul Verma');
    ok(await rahul.learning.openResource({ resourceId: unsafeBrand('res-shell-brief') }));
    ok(await rahul.learning.launchWebFormat({ experimentId: SHELL }));
    ok(await rahul.learning.getFormatPage({ experimentId: SHELL, format: 'web' }));
    ok(await rahul.learning.getFormatPage({ experimentId: SHELL, format: 'vr' }));
    expect(Object.keys(worldOf(platform).records.completions)).toEqual([]);
    expect(
      ok(await rahul.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' })).state,
    ).toBe('not-eligible');

    const studentId = personIdOf(worldOf(platform), 'Rahul Verma');
    const now = new Date().toISOString() as never;
    ok(
      standinsOf(platform).runtimeReport.reportActivity({
        studentId,
        experimentId: SHELL,
        format: 'web',
        kind: 'opened',
        at: now,
      }),
    );
    const started = ok(await rahul.learning.getSimulationChooser(SHELL));
    expect(started.find((row) => row.format === 'web')!.status).toBe('in-progress');
    expect(Object.keys(worldOf(platform).records.completions)).toEqual([]);

    ok(
      standinsOf(platform).runtimeReport.reportCompletion({
        studentId,
        experimentId: SHELL,
        format: 'web',
        at: now,
        from: 'simulation',
      }),
    );
    const done = ok(await rahul.learning.getSimulationChooser(SHELL));
    expect(done.find((row) => row.format === 'web')!.status).toBe('completed');
    expect(done.find((row) => row.format === 'vr')!.status).toBe('not-started');
    expect(
      ok(await rahul.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' })).state,
    ).toBe('eligible');
    expect(
      ok(await rahul.feedback.getFeedbackState({ experimentId: SHELL, format: 'vr' })).state,
    ).toBe('not-eligible');
  });
});
