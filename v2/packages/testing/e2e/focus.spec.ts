import { expect, test } from '@playwright/test';

import { expectNoInvisibleFocusTargets, InvisibleFocusTargetError } from '../src/browser/index.js';
import { failureOf } from './support/failure.js';
import { openFixture } from './support/fixtures.js';

/**
 * WP-0.4 acceptance (1), first half: `expectNoInvisibleFocusTargets` fails on a clipped,
 * invisible but keyboard-focusable button (the B1-10 defect class) and passes once the
 * same button is hidden correctly with `display:none`.
 */
test.describe('expectNoInvisibleFocusTargets', () => {
  test('fails on a clipped, invisible but keyboard-focusable button', async ({ page }) => {
    await openFixture(page, 'focus-targets');

    const error = await failureOf(expectNoInvisibleFocusTargets(page));

    expect(error).toBeInstanceOf(InvisibleFocusTargetError);
    expect(error.message).toContain('1 of 5 keyboard focus target(s) cannot be seen');
    expect(error.message).toContain('Tab stop 3: <button#sort> "Sort by Received"');
    expect(error.message).toMatch(
      /clipped to [\d.]+×0 px by <div\.collapsed-header> "Sort by Received" \(overflow-x: hidden, overflow-y: hidden\)/,
    );
    const stops = (error as InvisibleFocusTargetError).stops;
    expect(stops.map((stop) => stop.element)).toEqual([
      '<a.skip> "Skip to main content"',
      '<button#first> "Visible action"',
      '<button#sort> "Sort by Received"',
      '<button#close.fixed-close> "Close menu"',
      '<button#last> "Below the fold, still visible when focused"',
    ]);
    // Only the clipped button is reported: the focus-revealed skip link, the viewport-fixed
    // button inside a clipped wrapper that does not contain it, and the below-the-fold
    // button (scrolled into view by focus) are all correctly visible.
    expect(stops.filter((stop) => stop.problems.length > 0).map((stop) => stop.index)).toEqual([3]);
  });

  test('passes once the same button is hidden with display:none', async ({ page }) => {
    await openFixture(page, 'focus-targets');
    await page.addStyleTag({ content: '#sort { display: none; }' });

    const stops = await expectNoInvisibleFocusTargets(page);

    expect(stops.map((stop) => stop.element)).toEqual([
      '<a.skip> "Skip to main content"',
      '<button#first> "Visible action"',
      '<button#close.fixed-close> "Close menu"',
      '<button#last> "Below the fold, still visible when focused"',
    ]);
    expect(stops.every((stop) => stop.problems.length === 0)).toBe(true);
  });

  test("fails on a button clipped by its own clip-path, not only by an ancestor's", async ({
    page,
  }) => {
    await openFixture(page, 'focus-targets');
    await page.addStyleTag({
      content: '#sort { display: none; } #first { clip-path: inset(50%); }',
    });

    const error = await failureOf(expectNoInvisibleFocusTargets(page));

    expect(error).toBeInstanceOf(InvisibleFocusTargetError);
    expect(error.message).toContain('Tab stop 2: <button#first> "Visible action"');
    expect(error.message).toContain('by its own clip-path: inset(50%)');
  });

  test('walks on past an iframe and still checks the controls after it', async ({ page }) => {
    await openFixture(page, 'focus-iframe');

    const error = await failureOf(expectNoInvisibleFocusTargets(page));

    expect(error).toBeInstanceOf(InvisibleFocusTargetError);
    const stops = (error as InvisibleFocusTargetError).stops.map((stop) => stop.element);
    expect(stops[0]).toBe('<button#before> "Before the frame"');
    expect(stops[1]).toMatch(/^<iframe> "Embedded content"/);
    expect(stops[2]).toBe('<button#after> "Clipped after the frame"');
    expect(error.message).toContain('Tab stop 3: <button#after> "Clipped after the frame"');
  });

  test('also fails on a skip link that stays off-screen when focused', async ({ page }) => {
    await openFixture(page, 'focus-targets');
    await page.addStyleTag({
      content: '#sort { display: none; } .skip:focus { position: absolute; }',
    });

    const error = await failureOf(expectNoInvisibleFocusTargets(page));

    expect(error).toBeInstanceOf(InvisibleFocusTargetError);
    expect(error.message).toContain('Tab stop 1: <a.skip> "Skip to main content"');
    expect(error.message).toMatch(/under 2×2|outside the viewport/);
  });
});
