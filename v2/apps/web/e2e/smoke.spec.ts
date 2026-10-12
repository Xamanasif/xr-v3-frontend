import { expect, test } from '@playwright/test';

/**
 * Phase-0 smoke (WP-0.3): the web liveness route answers, and the retired foundation pages
 * are gone. `/` stays 404 until the public landing page is built in its approved phase.
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
