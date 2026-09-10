import { expect, test } from '@playwright/test';

test('the foundation page renders, routes, and reaches the API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('V2 foundation');

  const health = page.getByTestId('api-health');
  await expect(health).toHaveAttribute('data-state', 'ok', { timeout: 15_000 });
  await expect(health).toContainText('xr-platform-api');

  await page.getByRole('link', { name: 'Open the /system route' }).click();
  await expect(page).toHaveURL(/\/system$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('System');
});

test('the web liveness route answers', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).service).toBe('xr-platform-web');
});
