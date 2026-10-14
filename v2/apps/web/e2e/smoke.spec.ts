import { expect, test } from '@playwright/test';

import {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
} from './support';

/**
 * Phase-0 smoke (WP-0.3, extended in WP-0.4): the web liveness route answers, the retired
 * foundation pages are gone, and the not-found page passes the WP-0.4 accessibility, keyboard
 * and owner-constraint checks. `/` answered 404 until the public landing was built; since
 * Phase-1 Package 1B it is PU-01 (P1-16), with no foundation UI (its own checks:
 * `e2e/package-1b/public.spec.ts`).
 */
test('the web liveness route answers with the web service identity', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.status()).toBe(200);
  expect((await response.json()).service).toBe('xr-platform-web');
});

for (const [path, status] of [
  ['/', 200],
  ['/system', 404],
] as const) {
  test(`${path} returns ${status} and shows no retired foundation UI`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    await expect(page.getByTestId('api-health')).toHaveCount(0);
    await expect(page.locator('[data-component="foundation-status-list"]')).toHaveCount(0);
    await expect(page.getByText(/V2 foundation|API connectivity|Foundation checks/)).toHaveCount(0);
  });
}

test('the not-found page passes the accessibility, keyboard and owner-constraint checks', async ({
  page,
}) => {
  await page.goto('/system');
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
