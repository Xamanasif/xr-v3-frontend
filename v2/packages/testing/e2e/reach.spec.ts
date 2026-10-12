import { expect, test } from '@playwright/test';

import { reachAndClick, ReachError } from '../src/browser/index.js';
import { failureOf } from './support/failure.js';
import { openFixture } from './support/fixtures.js';

/**
 * WP-0.4 acceptance (1), second half: `reachAndClick` reaches a genuine below-the-fold
 * button by mouse wheel only, and fails meaningfully on a button `overflow: clip` makes
 * unreachable (the Batch-4 lesson: programmatic scrolling had hidden a clipped Submit).
 */
interface BelowFoldRecord {
  clicks: number;
  wheelEvents: number;
  programmaticScrolls: string[];
}

test.describe('reachAndClick', () => {
  test('reaches a genuine below-the-fold button by mouse wheel and clicks it', async ({ page }) => {
    await openFixture(page, 'reach-below-fold');
    const confirm = page.getByRole('button', { name: 'Confirm transfer' });
    await expect(confirm).not.toBeInViewport();

    await reachAndClick(page, confirm);

    const record = await page.evaluate(
      () => (window as unknown as { __fixture: BelowFoldRecord }).__fixture,
    );
    expect(record.clicks).toBe(1);
    expect(record.wheelEvents).toBeGreaterThan(0);
    expect(record.programmaticScrolls).toEqual([]);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(confirm).toBeInViewport();
  });

  test('uses the wheel alone: with wheel scrolling blocked the same button is unreachable', async ({
    page,
  }) => {
    await openFixture(page, 'reach-below-fold');
    await page.evaluate(() =>
      window.addEventListener('wheel', (event) => event.preventDefault(), { passive: false }),
    );

    const error = await failureOf(
      reachAndClick(page, page.getByRole('button', { name: 'Confirm transfer' }), { maxSteps: 12 }),
    );

    expect(error).toBeInstanceOf(ReachError);
    expect(error.message).toContain('it never entered the viewport');
    const record = await page.evaluate(
      () => (window as unknown as { __fixture: BelowFoldRecord }).__fixture,
    );
    expect(record.clicks).toBe(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test('fails meaningfully on a button clipped by overflow:clip inside the viewport', async ({
    page,
  }) => {
    await openFixture(page, 'reach-clip');

    const error = await failureOf(
      reachAndClick(page, page.getByRole('button', { name: 'Confirm (clipped in view)' })),
    );

    expect(error).toBeInstanceOf(ReachError);
    expect(error.message).toContain('A real pointer cannot reach the target by mouse wheel');
    expect(error.message).toMatch(
      /the point over it hits <(?!button)[^>]+>.* instead of <button> "Confirm \(clipped in view\)"/,
    );
    expect(error.message).toContain('stopped moving the page');
    expect(
      await page.evaluate(
        () => (window as unknown as { __fixture: { clicks: string[] } }).__fixture.clicks,
      ),
    ).toEqual([]);
  });

  test('fails meaningfully on a button clipped by overflow:clip below the fold', async ({
    page,
  }) => {
    await openFixture(page, 'reach-clip');

    const error = await failureOf(
      reachAndClick(page, page.getByRole('button', { name: 'Submit (clipped below the fold)' })),
    );

    expect(error).toBeInstanceOf(ReachError);
    expect(error.message).toContain('it never entered the viewport');
    expect(error.message).toContain('clipped, covered or beyond what scrolling can show');
  });

  test('reaches the unclipped control on the same page (positive control)', async ({ page }) => {
    await openFixture(page, 'reach-clip');

    await reachAndClick(page, page.getByRole('button', { name: 'Save draft' }));

    expect(
      await page.evaluate(
        () => (window as unknown as { __fixture: { clicks: string[] } }).__fixture.clicks,
      ),
    ).toEqual(['save']);
  });
});
