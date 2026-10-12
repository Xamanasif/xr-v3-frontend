import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Page } from '@playwright/test';

/**
 * Isolated fixture pages for the helper self-tests. They are served from a reserved
 * `.test` origin (RFC 6761) by Playwright route interception: no server, no product route,
 * and a real navigation, so the page behaves exactly as a loaded document.
 */
export const FIXTURE_ORIGIN = 'http://harness.xr.test';

const fixtureDir = join(import.meta.dirname, '..', 'fixtures');

export async function openFixture(page: Page, name: string): Promise<void> {
  await page.route(`${FIXTURE_ORIGIN}/**`, async (route) => {
    const file = new URL(route.request().url()).pathname.replace(/^\//, '');
    if (!/^[a-z0-9-]+\.html$/.test(file)) {
      await route.fulfill({ status: 404, body: 'not a fixture' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: readFileSync(join(fixtureDir, file), 'utf8'),
    });
  });
  await page.goto(`${FIXTURE_ORIGIN}/${name}.html`);
}
