import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SCREEN_PHASE } from '@xr/contracts/draft';

import { EXPECTED_WORDS, type FlowStep, UNWORDED_STEPS } from '../../src/copy/flow-words.fixture';

/**
 * The full-UI flow register (Appendix F §7.2 "Flow skeletons"; WP-0.14 (c), acceptance 5): one
 * entry per approved flows.json step and per drawn alternate, each naming its flow step, actor,
 * planned screen ids, the role-relative words to assert (from the independent board fixture,
 * `src/copy/flow-words.fixture.ts`) and the phase that built its screens (B8-06, `SCREEN_PHASE`).
 *
 * Phase 7 (owner authorisation, 17 Oct 2026) removed the 36 deferred `test.fixme` skeletons: every
 * entry is now driven through the screens of the PRODUCT build (no test hook, no fixture), and
 * `COVERAGE` names the test — and, for the shared-world walk-through, the `test.step` — that does
 * it. `skeletons.spec.ts` checks that every entry has exactly one such place and that it exists.
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

/** The title of a skeleton's `test.step` in the walk-through: its key, actor and screens. */
export function stepTitle(key: FlowStep): string {
  const skeleton = SKELETONS.find((entry) => entry.key === key);
  if (!skeleton) throw new Error(`No flow step ${key}.`);
  return `${skeleton.key} · ${skeleton.actor} · ${skeleton.screens.join(' → ')}`;
}

/** Where a register entry is driven through the screens of the product build. */
export interface Coverage {
  /** The spec file, relative to `e2e/`. */
  readonly spec: string;
  /** The test's exact title. */
  readonly test: string;
  /** In the shared-world walk-through: the entry's own `test.step` (`stepTitle`). */
  readonly step?: string;
}

const WALKTHROUGH = {
  spec: 'flows/walkthrough.spec.ts',
  test: 'Flows A–F and the device chain on one shared sample world, through the product build’s screens',
} as const;

const ALTERNATES_SPEC = 'flows/alternates.spec.ts';

/**
 * Phase 7: every entry's product-build test. The 27 flows.json steps are the `test.step`s of the
 * one shared-world walk-through (A → B → C → Device → D → E → F, two tabs, one world kept by TE-6);
 * the alternates run on worlds of their own — three in the Phase-1/2/6 demonstrations that already
 * drive them on the product build, six in `alternates.spec.ts`.
 */
export const COVERAGE: Readonly<Record<string, Coverage>> = {
  ...Object.fromEntries(
    FROZEN_STEPS.map((step) => {
      const key = keyOf(step);
      return [key, { ...WALKTHROUGH, step: stepTitle(key) }];
    }),
  ),
  'A-info': {
    spec: 'package-1e/journey.spec.ts',
    test: 'the A-info alternate: information requested, shown to the requester, no reply field (T-03)',
  },
  'B-withdraw': {
    spec: 'package-2a/demonstration.spec.ts',
    test: 'one tab, the product build: approval → the Institute Admin’s plan, people and Give access → the Student’s access → withdrawal',
  },
  Hold: {
    spec: 'phase-6/demonstration.spec.ts',
    test: 'one tab, the product build: Flow F — a correction released, then another held; the live version, access and the Student follow only the release',
  },
  'E-alt1': {
    spec: ALTERNATES_SPEC,
    test: 'E-alt1 · the Content Manager sends an approved submission back to the Academic Reviewer for a re-check',
  },
  'E-alt2': {
    spec: ALTERNATES_SPEC,
    test: 'E-alt2 · the Content Manager returns an approved submission to the Vendor',
  },
  'E-alt3': {
    spec: ALTERNATES_SPEC,
    test: 'E-alt3 · the Super Admin returns a submission stuck with the Academic Reviewer to the Vendor',
  },
  'Lift hold': {
    spec: ALTERNATES_SPEC,
    test: 'Hold and Lift hold · a held correction goes back to waiting for the Super Admin’s decision',
  },
  'F-alt return': {
    spec: ALTERNATES_SPEC,
    test: 'F-alt return · the Academic Reviewer returns a correction to the Content Manager',
  },
  'F-alt withdraw': {
    spec: ALTERNATES_SPEC,
    test: 'F-alt withdraw · the Content Manager withdraws a correction in academic review',
  },
};
