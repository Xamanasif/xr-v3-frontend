import { expect, test } from '@playwright/test';

import { expectedWords, FROZEN_STEPS, phaseOf, SKELETONS } from './registry';

/**
 * The skeleton register itself (WP-0.14 acceptance 5): an active check, apart from the deferred
 * `fixme`s, that every approved flows.json step and every drawn alternate has exactly one
 * skeleton naming its actor, planned screens, expected words and implementation phase.
 * Width-independent: one width proves it.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

test('one deferred full-UI test per flows.json step (27) and per drawn alternate (9)', () => {
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
