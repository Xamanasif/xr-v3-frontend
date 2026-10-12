import { expect, test } from '@playwright/test';
import {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
  reachAndClick,
} from '@xr/testing/browser';

/**
 * The specimen harness self-check (VD-17, WP-0.4): a specimen renders as a hydrated client
 * component, inside a frame of a set content width that container queries resolve against,
 * and the shared browser helpers (keyboard walk, wheel reach, axe) work on it at every
 * approved viewport.
 */
test('frames a specimen at the requested content width', async ({ page }) => {
  await page.goto('/harness-probe?width=343');
  const frame = page.locator('div.specimen-frame');
  await expect(frame).toHaveAttribute('data-content-width', '343');
  expect((await frame.boundingBox())?.width).toBe(343);
});

test('resolves container queries against the content width, not the viewport', async ({ page }) => {
  const columns = async (width: number) => {
    await page.goto(`/harness-probe?width=${width}`);
    return page
      .getByTestId('layout-probe')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  };
  expect(await columns(759)).toBe(1);
  expect(await columns(760)).toBe(2);
  expect(await columns(1112)).toBe(2);
});

test('hydrates the specimen: a real pointer reaches and clicks a below-the-fold control', async ({
  page,
}) => {
  await page.goto('/harness-probe');
  await expect(page.getByRole('status')).toHaveText('Not confirmed yet');
  await reachAndClick(page, page.getByRole('button', { name: 'Confirm' }));
  await expect(page.getByRole('status')).toHaveText('Confirmed 1');
});

test('passes the keyboard, accessibility and owner-constraint checks', async ({ page }) => {
  await page.goto('/harness-probe');
  const stops = await expectNoInvisibleFocusTargets(page);
  expect(stops.map((stop) => stop.element)).toEqual(['<button> "Confirm"']);
  await expectNoAxeViolations(page);
  await expectNoDeveloperSurfaces(page);
});

for (const path of [
  '/',
  '/not-a-specimen',
  '/harness-probe?width=abc',
  '/harness-probe?width=10',
]) {
  test(`${path} is not a specimen address`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}
