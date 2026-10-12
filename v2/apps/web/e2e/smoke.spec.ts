import { expect, test } from '@playwright/test';

import {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
} from './support';

/**
 * Phase-0 smoke (WP-0.3, extended in WP-0.4): the web liveness route answers, the retired
 * foundation pages are gone, and every page the build serves today passes the WP-0.4
 * accessibility, keyboard and owner-constraint checks. `/` stays 404 until the public landing
 * page is built in its approved phase.
 */
test('the web liveness route answers with the web service identity', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.status()).toBe(200);
  expect((await response.json()).service).toBe('xr-platform-web');
});

for (const path of ['/', '/system']) {
  test(`${path} returns 404 and shows no retired foundation UI`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('api-health')).toHaveCount(0);
    await expect(page.locator('[data-component="foundation-status-list"]')).toHaveCount(0);
    await expect(page.getByText(/V2 foundation|API connectivity|Foundation checks/)).toHaveCount(0);
  });
}

test('the not-found page passes the accessibility, keyboard and owner-constraint checks', async ({
  page,
}) => {
  await page.goto('/');
  await expectNoAxeViolations(page);
  await expectNoInvisibleFocusTargets(page);
  await expectNoDeveloperSurfaces(page);
});

// The specimen harness (VD-17) is a separate, non-deployed app; it is never a product route.
for (const path of ['/specimens', '/specimens/harness-probe', '/harness-probe']) {
  test(`${path} is not a product route`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}
