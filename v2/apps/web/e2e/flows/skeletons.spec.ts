import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { COVERAGE, expectedWords, FROZEN_STEPS, phaseOf, SKELETONS } from './registry';

/**
 * The flow register itself (WP-0.14 acceptance 5; Phase 7): every approved flows.json step and
 * every drawn alternate has exactly one entry naming its actor, planned screens, expected words and
 * implementation phase — and, since Phase 7, the product-build test that drives it through the
 * screens (the 36 deferred `fixme` skeletons are gone). Width-independent: one width proves it.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

const E2E = join(__dirname, '..');

test('one entry per flows.json step (27) and per drawn alternate (9)', () => {
  expect(FROZEN_STEPS).toHaveLength(27);
  const steps = SKELETONS.filter((skeleton) => skeleton.kind === 'flows.json');
  const alternates = SKELETONS.filter((skeleton) => skeleton.kind === 'alternate');
  expect(steps).toHaveLength(27);
  expect(alternates.map((skeleton) => skeleton.key)).toEqual([
    'A-info',
    'B-withdraw',
    'E-alt1',
    'E-alt2',
    'E-alt3',
    'Hold',
    'Lift hold',
    'F-alt return',
    'F-alt withdraw',
  ]);
  expect(new Set(SKELETONS.map((skeleton) => skeleton.key)).size).toBe(SKELETONS.length);
  for (const skeleton of SKELETONS) {
    expect(skeleton.actor, skeleton.key).not.toBe('');
    expect(skeleton.screens.length, `${skeleton.key} names its screens`).toBeGreaterThan(0);
    expect(phaseOf(skeleton), `${skeleton.key} has a later phase than Phase 0`).toMatch(/^P[1-6]$/);
    expect(expectedWords(skeleton).length, `${skeleton.key} names its words`).toBeGreaterThan(0);
  }
});

test('every entry is driven by one product-build test that exists (Phase 7; none deferred)', () => {
  expect(Object.keys(COVERAGE).sort()).toEqual(SKELETONS.map((skeleton) => skeleton.key).sort());
  for (const skeleton of SKELETONS) {
    const coverage = COVERAGE[skeleton.key]!;
    const source = readFileSync(join(E2E, coverage.spec), 'utf8');
    // The product build: no test-hook address, no boot descriptor, no CI-only seam.
    expect(source, `${coverage.spec} runs on the product build`).not.toMatch(
      /TEST_HOOKS_URL|bootWorld\(|actAs\(|reportRuntime\(|switchIdentity\(/,
    );
    expect(source, `${skeleton.key}: "${coverage.test}"`).toContain(`'${coverage.test}'`);
    if (coverage.step) {
      // The walk-through names each step's test.step from the register.
      expect(source, `${skeleton.key}: its test.step`).toContain(`stepTitle('${skeleton.key}')`);
    }
  }
});
