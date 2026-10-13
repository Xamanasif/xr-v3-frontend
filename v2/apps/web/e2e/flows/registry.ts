import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test } from '@playwright/test';
import { SCREEN_PHASE } from '@xr/contracts/draft';

import { EXPECTED_WORDS, type FlowStep, UNWORDED_STEPS } from '../../src/copy/flow-words.fixture';

/**
 * The full-UI flow skeletons (Appendix F §7.2 "Flow skeletons"; WP-0.14 (c), acceptance 5): one
 * explicitly deferred `test.fixme` per approved flows.json step and per drawn alternate, each
 * naming its flow step, actor, planned screen ids, the role-relative words to assert (from the
 * independent board fixture, `src/copy/flow-words.fixture.ts`) and the phase that builds its
 * screens (B8-06, `SCREEN_PHASE`). Phase 7 removes the `fixme`s once every screen exists; until
 * then the cross-role behaviour is proved at port level (`@xr/sample-platform` one-world) and on
 * the Phase-0 screens (`e2e/foundation/cross-role.spec.ts`). Nothing here drives a screen.
 */

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');

interface FrozenStep {
  readonly flow: string;
  readonly step: string;
  readonly actor: string;
  readonly screens: string;
  readonly record: string;
  readonly transition: string;
}

/** The 27 approved steps, read from the frozen handoff (never copied). */
export const FROZEN_STEPS: readonly FrozenStep[] = (
  JSON.parse(
    readFileSync(
      join(REPO_ROOT, 'design', 'handoff-v46', 'canvas-v46', 'project', 'handoff', 'flows.json'),
      'utf8',
    ),
  ) as { steps: FrozenStep[] }
).steps;

export type FlowLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'Device';

export interface Skeleton {
  readonly key: FlowStep;
  readonly flow: FlowLetter;
  readonly kind: 'flows.json' | 'alternate';
  readonly actor: string;
  /** Planned screen ids, in the order the step visits them. */
  readonly screens: readonly string[];
  readonly record: string;
  readonly transition: string;
  /** A handoff defect or open decision the full-UI test must respect. */
  readonly note?: string;
}

/** The drawn alternates (Appendix D §4.2–§4.7; Appendix F §7.2). */
const ALTERNATES: readonly Skeleton[] = [
  {
    key: 'A-info',
    flow: 'A',
    kind: 'alternate',
    actor: 'Super Admin → requester',
    screens: ['SA-03', 'PU-10'],
    record: 'REQ',
    transition: 'Under review → Information requested (no exit: T-03)',
  },
  {
    key: 'B-withdraw',
    flow: 'B',
    kind: 'alternate',
    actor: 'Institute Admin → Student',
    screens: ['IA-04', 'ST-01', 'ST-02', 'ST-19'],
    record: 'SACC-0310',
    transition: 'Active → Withdrawn (work kept)',
    note: 'SACC-14 open: which pages stay viewable read-only',
  },
  {
    key: 'E-alt1',
    flow: 'E',
    kind: 'alternate',
    actor: 'Content Manager → Academic Reviewer',
    screens: ['CM-03', 'RV-02', 'RV-03', 'VE-07'],
    record: 'SUB',
    transition: 'With Content Manager → With Academic Reviewer (re-check)',
  },
  {
    key: 'E-alt2',
    flow: 'E',
    kind: 'alternate',
    actor: 'Content Manager → Vendor',
    screens: ['CM-03', 'VE-07', 'VE-08', 'RV-06'],
    record: 'SUB',
    transition: 'With Content Manager → Returned (by the Content Manager)',
  },
  {
    key: 'E-alt3',
    flow: 'E',
    kind: 'alternate',
    actor: 'Super Admin',
    screens: ['SA-12', 'SA-13'],
    record: 'SUB-0085',
    transition: 'Stuck with the Academic Reviewer → Returned to vendor (override)',
    note: 'Vendor-side override words not drawn (B7-06)',
  },
  {
    key: 'Hold',
    flow: 'F',
    kind: 'alternate',
    actor: 'Super Admin',
    screens: ['SA-10', 'SA-11', 'CM-08'],
    record: 'UPD-0005',
    transition: 'Awaiting release decision → On hold',
  },
  {
    key: 'Lift hold',
    flow: 'F',
    kind: 'alternate',
    actor: 'Super Admin',
    screens: ['SA-11', 'CM-08'],
    record: 'UPD-0005',
    transition: 'On hold → Awaiting release decision',
  },
  {
    key: 'F-alt return',
    flow: 'F',
    kind: 'alternate',
    actor: 'Academic Reviewer → Content Manager',
    screens: ['RV-04', 'CM-08'],
    record: 'UPD',
    transition: 'In academic review → Returned',
  },
  {
    key: 'F-alt withdraw',
    flow: 'F',
    kind: 'alternate',
    actor: 'Content Manager',
    screens: ['CM-08', 'RV-02'],
    record: 'UPD',
    transition: 'Returned / In academic review → Withdrawn (not after approval, BR-111)',
  },
];

/** D4's flows.json screens name "FA-12 (release)": a handoff defect — the board draws no release control (B4-06, B4-14). */
const SCREEN_OVERRIDES: Readonly<Record<string, { screens: readonly string[]; note: string }>> = {
  D4: {
    screens: ['ST-14', 'ST-11', 'FA-12'],
    note: 'flows.json D4 "FA-12 (release)" is a handoff defect: released by the assessment’s own setting; FA-12 reads "Released …" only',
  },
};

function keyOf(step: FrozenStep): FlowStep {
  return (step.flow === 'Device' ? `Device ${step.step}` : `${step.flow}${step.step}`) as FlowStep;
}

export const SKELETONS: readonly Skeleton[] = [
  ...FROZEN_STEPS.map((step): Skeleton => {
    const key = keyOf(step);
    const override = SCREEN_OVERRIDES[key];
    return {
      key,
      flow: step.flow as FlowLetter,
      kind: 'flows.json',
      actor: step.actor,
      screens: override?.screens ?? step.screens.match(/[A-Z]{2}-\d{2}/g) ?? [],
      record: step.record,
      transition: step.transition,
      ...(override ? { note: override.note } : {}),
    };
  }),
  ...ALTERNATES,
];

/** The phase whose screens complete the step (the latest of its screens' B8-06 phases). */
export function phaseOf(skeleton: Skeleton): string {
  const phases = skeleton.screens.map((screen) => SCREEN_PHASE.get(screen));
  if (phases.some((phase) => phase === undefined))
    throw new Error(
      `${skeleton.key}: a planned screen has no B8-06 phase (${skeleton.screens.join(', ')})`,
    );
  return phases.sort().at(-1)!;
}

/** The role-relative words the full-UI test must assert, from the independent board fixture. */
export function expectedWords(skeleton: Skeleton): readonly string[] {
  const words = EXPECTED_WORDS.filter((entry) => entry.step === skeleton.key).map(
    (entry) =>
      `${entry.role} · ${entry.screen}: ${entry.expected === null ? `(not drawn — ${entry.decision})` : `“${entry.expected}”`} [${entry.board} f${entry.frame}]${entry.open ? ` (open: ${entry.open})` : ''}`,
  );
  if (words.length > 0) return words;
  const reason = UNWORDED_STEPS[skeleton.key];
  if (!reason) throw new Error(`${skeleton.key}: no expected words and no reason`);
  return [`(no frame-index state word: ${reason})`];
}

/** Declares one flow's deferred full-UI tests. */
export function declareFlowSkeletons(flow: FlowLetter): void {
  for (const skeleton of SKELETONS.filter((entry) => entry.flow === flow)) {
    const phase = phaseOf(skeleton);
    test.fixme(
      `${skeleton.kind === 'alternate' ? 'Alternate' : 'Step'} ${skeleton.key} · ${skeleton.actor} · ${skeleton.screens.join(' → ')} · screens built in ${phase}, full-UI test in Phase 7`,
      {
        annotation: [
          {
            type: 'flow step',
            description: `${skeleton.key} (${skeleton.kind}) · ${skeleton.record}: ${skeleton.transition}`,
          },
          { type: 'actor', description: skeleton.actor },
          { type: 'planned screens', description: skeleton.screens.join(', ') },
          ...expectedWords(skeleton).map((description) => ({
            type: 'expected words',
            description,
          })),
          {
            type: 'implementation phase',
            description: `${phase} (screens, B8-06); fixme removed in Phase 7 (Appendix F §7.2)`,
          },
          ...(skeleton.note ? [{ type: 'note', description: skeleton.note }] : []),
        ],
      },
      async () => {
        // Deferred: drives the planned screens as the step's actor and asserts the expected words.
      },
    );
  }
}
