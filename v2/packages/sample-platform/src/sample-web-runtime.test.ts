/**
 * TE-3 / T-12 (owner authorisation of Phase 7, 17 Oct 2026; local prototype build only): with a
 * sample WEB activity named by the composition root, "Launch WEB" opens that activity for a launch
 * this tab holds; the activity's reports are written by the system runtime-report handler with
 * `sample-standin` provenance and the same checks a real runtime's would get. A launch, the
 * activity opening or a progress save never completes WEB; only the activity's completion report
 * does — and only after it opened and saved each of its trials — and the first completion stands.
 * Without the option nothing changes (TE-3 interim).
 */
import { type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from './index.js';
import { SAMPLE_WEB_TRIALS } from './platform/sample-web-runtime.js';
import { asPerson, fixtureWorld, worldOf } from './testing/index.js';

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const ACTIVITY = (launch: string) => `http://localhost/sample-web-activity?launch=${launch}`;

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

async function withActivity() {
  return createSamplePlatform({
    world: await fixtureWorld('after-flow-b'),
    webRuntime: { activityHref: ACTIVITY },
  });
}

const launchOf = (href: string) => new URL(href).searchParams.get('launch')!;

describe('TE-3 — the sample WEB activity (local prototype build)', () => {
  it('opens the activity for a held launch; the launch writes nothing', async () => {
    const platform = await withActivity();
    const rahul = asPerson(platform, 'Rahul Verma');
    const before = worldOf(platform).worldVersion;
    const { href } = ok(await rahul.learning.launchWebFormat({ experimentId: SHELL }));
    expect(href).toMatch(/^http:\/\/localhost\/sample-web-activity\?launch=lch-\d{6}\.memory$/);
    expect(worldOf(platform).worldVersion).toBe(before);
    expect(platform.sampleWebRuntime?.describe(launchOf(href))).toEqual({
      experimentName: 'Shell-and-Tube Heat Exchanger',
    });
    expect(platform.sampleWebRuntime?.describe('lch-999999.memory')).toBeNull();
  });

  it('records opened and saved as activity, and only the completion report completes WEB', async () => {
    const platform = await withActivity();
    const runtime = platform.sampleWebRuntime!;
    const rahul = asPerson(platform, 'Rahul Verma');
    const launch = launchOf(ok(await rahul.learning.launchWebFormat({ experimentId: SHELL })).href);
    const web = async () =>
      ok(await rahul.learning.getSimulationChooser(SHELL)).find((row) => row.format === 'web')!;

    expect(await runtime.report(launch, 'opened')).toEqual({
      ok: true,
      changed: [{ kind: 'RUN', id: expect.stringContaining('|web') }],
    });
    expect((await web()).status).toBe('in-progress');
    for (let trial = 1; trial <= SAMPLE_WEB_TRIALS; trial += 1) {
      expect((await runtime.report(launch, 'saved')).ok).toBe(true);
    }
    expect((await web()).status).toBe('in-progress');
    expect(Object.keys(worldOf(platform).records.completions)).toEqual([]);
    expect(
      ok(await rahul.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' })).state,
    ).toBe('not-eligible');

    const completed = await runtime.report(launch, 'completed');
    expect(completed.ok).toBe(true);
    expect((await web()).status).toBe('completed');
    const completion = Object.values(worldOf(platform).records.completions)[0]!;
    expect(completion).toMatchObject({
      format: 'web',
      reportedFrom: 'simulation',
      recordedBy: { kind: 'system', system: 'system:runtime-report' },
    });
    expect(worldOf(platform).runtimeEvents.map((event) => event.origin)).toEqual(
      Array(2 + SAMPLE_WEB_TRIALS).fill('sample-standin'),
    );
    expect(
      ok(await rahul.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' })).state,
    ).toBe('eligible');

    // The first completion stands: a second report never moves the date.
    await runtime.report(launch, 'completed');
    expect(Object.values(worldOf(platform).records.completions)).toEqual([completion]);
  });

  it('refuses a completion before the activity’s own steps: opened, then every trial saved', async () => {
    const platform = await withActivity();
    const runtime = platform.sampleWebRuntime!;
    const rahul = asPerson(platform, 'Rahul Verma');
    const launch = launchOf(ok(await rahul.learning.launchWebFormat({ experimentId: SHELL })).href);
    const notFinished = { ok: false, reason: 'not-finished' };
    expect(await runtime.report(launch, 'completed')).toEqual(notFinished);
    expect(await runtime.report(launch, 'saved')).toEqual(notFinished);
    expect((await runtime.report(launch, 'opened')).ok).toBe(true);
    for (let trial = 1; trial < SAMPLE_WEB_TRIALS; trial += 1) {
      expect((await runtime.report(launch, 'saved')).ok).toBe(true);
    }
    expect(await runtime.report(launch, 'completed')).toEqual(notFinished);
    expect(Object.keys(worldOf(platform).records.completions)).toEqual([]);
    expect((await runtime.report(launch, 'saved')).ok).toBe(true);
    expect((await runtime.report(launch, 'completed')).ok).toBe(true);
  });

  it('refuses an unknown launch and a format no longer open to the Student', async () => {
    const platform = await withActivity();
    const runtime = platform.sampleWebRuntime!;
    const before = worldOf(platform).worldVersion;
    expect(await runtime.report('lch-000001.memory', 'completed')).toEqual({
      ok: false,
      reason: 'unknown-launch',
    });
    expect(worldOf(platform).worldVersion).toBe(before);

    const rahul = asPerson(platform, 'Rahul Verma');
    const launch = launchOf(ok(await rahul.learning.launchWebFormat({ experimentId: SHELL })).href);
    expect((await runtime.report(launch, 'opened')).ok).toBe(true);
    for (let trial = 1; trial <= SAMPLE_WEB_TRIALS; trial += 1) {
      expect((await runtime.report(launch, 'saved')).ok).toBe(true);
    }
    const meera = asPerson(platform, 'Meera Iyer');
    const grant = Object.values(worldOf(platform).records.grants).find(
      (candidate) =>
        candidate.experimentId === SHELL &&
        candidate.target.kind === 'student' &&
        candidate.state === 'active',
    )!;
    ok(
      await meera.studentAccess.withdrawGrant({
        grantId: grant.id,
        reason: 'Moved to another section.',
        expectedRev: grant.rev,
      }),
    );
    expect(await runtime.report(launch, 'completed')).toEqual({ ok: false, reason: 'refused' });
    expect(Object.keys(worldOf(platform).records.completions)).toEqual([]);
  });

  it('keeps the published link and offers no activity without the option (TE-3 interim)', async () => {
    const platform = createSamplePlatform({ world: await fixtureWorld('after-flow-b') });
    expect(platform.sampleWebRuntime).toBeNull();
    const { href } = ok(
      await asPerson(platform, 'Rahul Verma').learning.launchWebFormat({ experimentId: SHELL }),
    );
    expect(href).toMatch(/^https:\/\/[^/]+\.example\//);
  });
});
