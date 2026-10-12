import { expect, test } from '@playwright/test';

import {
  AxeViolationsError,
  DeveloperSurfaceError,
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
} from '../src/browser/index.js';
import { failureOf } from './support/failure.js';
import { openFixture } from './support/fixtures.js';

test.describe('expectNoAxeViolations (accessibility wrapper)', () => {
  test('passes on an accessible region', async ({ page }) => {
    await openFixture(page, 'axe-targets');
    const results = await expectNoAxeViolations(page, { include: ['#clean'] });
    expect(results.violations).toEqual([]);
    expect(results.passes.length).toBeGreaterThan(0);
  });

  test('fails on an unnamed button and an image without a text alternative', async ({ page }) => {
    await openFixture(page, 'axe-targets');
    const error = await failureOf(expectNoAxeViolations(page));
    expect(error).toBeInstanceOf(AxeViolationsError);
    const ids = (error as AxeViolationsError).violations.map((violation) => violation.id).sort();
    expect(ids).toEqual(['button-name', 'image-alt']);
    expect(error.message).toContain('#broken > button');
  });

  test('refuses to switch a rule off without a reason', async ({ page }) => {
    await openFixture(page, 'axe-targets');
    const error = await failureOf(
      expectNoAxeViolations(page, { disableRules: [{ id: 'image-alt', reason: ' ' }] }),
    );
    expect(error.message).toBe('Disabling axe rule "image-alt" needs a reason.');
  });
});

test.describe('expectNoDeveloperSurfaces (owner constraints in rendered DOM)', () => {
  test('passes on a page with product wording only', async ({ page }) => {
    await openFixture(page, 'surfaces-clean');
    await expectNoDeveloperSurfaces(page);
  });

  test('fails on a selector that is in the DOM but hidden in a closed menu', async ({ page }) => {
    await openFixture(page, 'surfaces-hidden');
    const error = await failureOf(expectNoDeveloperSurfaces(page));
    expect(error).toBeInstanceOf(DeveloperSurfaceError);
    // "Switch account" in the closed menu is found; the word "demo" inside a script is not copy.
    expect((error as DeveloperSurfaceError).findings.map((finding) => finding.term)).toEqual([
      'switch-identity',
    ]);
  });

  test('fails on a DEMO strip, a "Viewing as" selector and canvas-only markup', async ({
    page,
  }) => {
    await openFixture(page, 'surfaces-demo');
    const error = await failureOf(expectNoDeveloperSurfaces(page));
    expect(error).toBeInstanceOf(DeveloperSurfaceError);
    const terms = (error as DeveloperSurfaceError).findings.map((finding) => finding.term).sort();
    expect(terms).toEqual([
      'board-control',
      'canvas-class',
      'canvas-class',
      'demo-wording',
      'not-part-of-the-product',
      'viewing-as',
    ]);
  });
});
