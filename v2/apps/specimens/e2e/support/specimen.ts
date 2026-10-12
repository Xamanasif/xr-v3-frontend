import { expect, type Page } from '@playwright/test';

/**
 * Opens a specimen and proves it rendered: a 200 answer and the frame on the page. (An unknown id
 * is the harness's 404 page, which would pass an axe or focus check silently.)
 */
export async function openSpecimen(page: Page, id: string, width?: number): Promise<void> {
  const response = await page.goto(width === undefined ? `/${id}` : `/${id}?width=${width}`);
  expect(response?.status(), `specimen ${id}`).toBe(200);
  await expect(page.locator('div.specimen-frame')).toHaveCount(1);
}
