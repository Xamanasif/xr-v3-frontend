/**
 * WP-0.14 (a) — the cross-role thin vertical proof at port level, on ONE world (Appendix F
 * WP-0.14 acceptance 1, 2 and 7; Appendix D §4.2–§4.9, §5.5). One sample platform runs the
 * whole scripted walk — every flows.json step with its board reference — and then the
 * cross-cutting commands and the drawn alternates, in order. Each test is one proof step; the
 * world carries over, so a failure stops every later step with the first step's name.
 *
 * What each step checks is in `test-support/one-world/` (harness, spine, tail): the actual
 * command results, the resulting records, what every relevant role reads through its own port
 * methods, the drawn absences as refusals that write nothing, the twelve invariants per commit
 * and per step, and append-only history with `changed` equal to what was written.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, describe, expect, test } from 'vitest';

import { pendingReservations } from './ids/id-source.js';
import { worldOf } from './testing/harness.js';
import { WALK_STEPS } from './testing/walk.js';
import {
  CROSS_CUTTING,
  DRAWN_ALTERNATES,
  flowKey,
  type FlowsJsonStep,
  INTERIMS,
} from './test-support/one-world/coverage.js';
import { oneWorld, type ProofStep, useExpect } from './test-support/one-world/harness.js';
import { SPINE } from './test-support/one-world/steps-spine.js';
import { TAIL } from './test-support/one-world/steps-tail.js';

useExpect(expect);

const STEPS: readonly ProofStep[] = [...SPINE, ...TAIL];

/** The 27 approved steps, read from the frozen handoff (never copied into the proof). */
const FROZEN_FLOW_STEPS: readonly FlowsJsonStep[] = (
  JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        '..',
        '..',
        'design',
        'handoff-v46',
        'canvas-v46',
        'project',
        'handoff',
        'flows.json',
      ),
      'utf8',
    ),
  ) as { steps: FlowsJsonStep[] }
).steps;

describe.sequential(
  'WP-0.14 — Flows A–F, the device chain, cross-cutting commands and alternates on one world',
  () => {
    const world = oneWorld();
    let failedAt: string | null = null;
    afterAll(() => world.dispose());

    for (const step of STEPS) {
      const interim = step.interim ? ` [interim ${step.interim}]` : '';
      test(`${step.id} · ${step.covers.join(' · ')} — ${step.title}${interim}`, async () => {
        if (failedAt) throw new Error(`Not run: the shared world stopped at step ${failedAt}.`);
        try {
          await world.runStep(step);
        } catch (error) {
          // A failed check leaves the world as the commands made it; a failed command does not.
          if ((error as { phase?: string }).phase !== 'verify') failedAt = step.id;
          throw error;
        }
      }, 60_000);
    }

    test('coverage: every frozen flows.json step, every drawn alternate, cross-cutting command and interim', () => {
      const covered = new Set(STEPS.flatMap((step) => step.covers));
      const flows = FROZEN_FLOW_STEPS;
      expect(flows, 'flows.json holds the 27 approved steps').toHaveLength(27);
      expect(
        flows.map(flowKey).filter((key) => !covered.has(key)),
        'flows.json steps without a proof step',
      ).toEqual([]);
      expect(
        [...DRAWN_ALTERNATES, ...CROSS_CUTTING, ...INTERIMS].filter((key) => !covered.has(key)),
      ).toEqual([]);
      // Every interim is named in the title of the steps that use it.
      for (const step of STEPS.filter((candidate) =>
        candidate.covers.some((key) => key.startsWith('interim ')),
      )) {
        expect(step.interim, `${step.id} names its interim`).toBeTruthy();
      }
    });

    test('one world: the walk ran once, in order; the board references are the walk’s; nothing stole a reserved id', () => {
      expect(failedAt).toBeNull();
      expect(world.walked, 'every walk step ran exactly once, in board-date order').toEqual(
        WALK_STEPS.map((step) => step.id),
      );
      const versions = world.commitLog.map((commit) => commit.entry.worldVersion);
      expect(
        world.commitLog.every(
          (commit, index) => index === 0 || commit.before === world.commitLog[index - 1]!.after,
        ),
        'each commit starts from the world the previous one left',
      ).toBe(true);
      expect(versions, 'one world: its versions only ever rise by one').toEqual(
        versions.map((_, index) => versions[0]! + index),
      );
      const records = worldOf(world.platform);
      const final = records.records;
      expect([
        final.requests['REQ-0042']?.status,
        final.plans['ACC-0107']?.id,
        final.grants['SACC-0310']?.state,
        final.submissions['SUB-0077']?.status.state,
        final.updates['UPD-0005']?.state,
        final.transfers['DTR-0018']?.state,
        final.assessments['ASMT-0009']?.id,
        final.attempts['ATT-0450']?.marking.confirmed !== null
          ? 'marks confirmed'
          : 'not confirmed',
        final.reports['SUP-0213']?.state,
        final.requests['REQ-0058']?.status,
      ]).toEqual([
        'access-active',
        'ACC-0107',
        'withdrawn',
        'published',
        'released',
        'approved',
        'ASMT-0009',
        'marks confirmed',
        'resolved',
        'under-review',
      ]);
      // Only the later-sample references (B2-04, B2-08) are still reserved: no alternate took one.
      expect([...pendingReservations(records.idSource)].sort()).toEqual(
        ['GRP-0013', 'SACC-0311', 'SACC-0312', 'SACC-0313', 'SACC-0314'].sort(),
      );
    });

    afterAll(() => {
      // Evidence for the verification record, only when asked for (Vitest output is quiet here).
      const target = process.env.XR_ONE_WORLD_REPORT;
      if (!target) return;
      const summary = world.reports.map((report) => ({
        step: report.id,
        covers: STEPS.find((step) => step.id === report.id)?.covers ?? [],
        interim: STEPS.find((step) => step.id === report.id)?.interim ?? null,
        calls: report.calls.length,
        refusals: report.calls.filter((call) => (call.answer as { ok?: boolean })?.ok === false)
          .length,
        commits: report.commits.map((commit) => commit.entry.method),
        invariantEvaluations: report.invariantChecks,
      }));
      writeFileSync(target, JSON.stringify({ steps: summary }, null, 2));
    });
  },
);
