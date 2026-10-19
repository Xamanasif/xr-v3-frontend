import { expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { expectSameDocument, markDocument } from '../support/workspace';

/**
 * The Package-1B demonstration (owner step 9), in ONE browser tab of the PRODUCT build — no test
 * hooks, no boot descriptor, nothing but the screens — on the desktop (1440) and on a phone
 * (375): the Landing → engineering areas → an area → a course → the catalogue → search and
 * filter → an experiment → its WEB / AR / VR / MR formats → Add to selection → How institutional
 * access works → Sign in → back to a valid destination, and the selection is still there. Every
 * move after the first load is client-side: one document, one sample world (ADR-0004). Nothing
 * here claims a request, a payment or institutional access (those are Package 1C's demonstration,
 * `e2e/package-1c/demonstration.spec.ts`).
 */
test.skip(
  ({ viewport }) => viewport?.width !== 1440 && viewport?.width !== 375,
  'The journey on the desktop and on a phone.',
);

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

async function header(page: Page, name: string): Promise<void> {
  if (wide(page)) {
    await reachAndClick(
      page,
      page.locator('header .xp-nav').getByRole('link', { name, exact: true }),
    );
    return;
  }
  await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
  await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name, exact: true }));
}

test('one tab, the product build: landing → areas → course → catalogue → experiment → selection → access → sign in and back', async ({
  page,
}) => {
  // 1. The public landing at `/`.
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Set the conditions.');
  await expect(page.getByRole('region', { name: 'Engineering areas' })).toBeVisible();
  const mark = await markDocument(page);

  // 2. Engineering areas.
  await header(page, 'Areas');
  await page.waitForURL('**/areas');
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering areas' })).toBeVisible();
  await expect(page.locator('main#main')).toBeFocused();

  // 3. An area.
  await reachAndClick(page, page.getByRole('link', { name: 'Mechanical & Manufacturing' }));
  await page.waitForURL('**/areas/mechanical-manufacturing');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mechanical & Manufacturing' }),
  ).toBeVisible();

  // 4. A course.
  await reachAndClick(page, page.getByRole('link', { name: 'Thermodynamics & Heat Transfer' }));
  await page.waitForURL('**/courses/thermodynamics-heat-transfer');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Thermodynamics & Heat Transfer' }),
  ).toBeVisible();
  await expect(page.locator('.xp-erow')).toHaveCount(3);

  // 5. Into the catalogue.
  await header(page, 'Browse experiments');
  await page.waitForURL('**/experiments');
  await expect(page.locator('.xp-count')).toHaveText('12 experiments');

  // 6. Search and filter.
  await page.getByRole('searchbox', { name: 'Search experiments' }).fill('exchanger');
  await expect(page.locator('.xp-count')).toHaveText('1 of 12 experiments');
  await reachAndClick(page, page.getByRole('button', { name: 'Remove Search: “exchanger”' }));
  if (wide(page)) {
    await reachAndClick(page, page.locator('aside.xp-filters').getByText('VR · Virtual reality'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Filters', exact: true }));
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await reachAndClick(page, sheet.getByText('VR · Virtual reality'));
    await reachAndClick(page, sheet.getByRole('button', { name: 'Show 7 experiments' }));
  }
  await expect(page.locator('.xp-count')).toHaveText('7 of 12 experiments');
  await expect(page).toHaveURL(/\/experiments\?format=vr$/);

  // 7. An experiment.
  await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
  await page.waitForURL('**/experiments/shell-and-tube-heat-exchanger?format=vr');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Shell-and-Tube Heat Exchanger' }),
  ).toBeVisible();

  // 8. Its formats: the published ones, and the one it does not have, stated once.
  await expect(page.locator('.xp-xtext .xr-fmt')).toHaveText(['WEB', 'AR', 'VR']);
  await expect(page.locator('.xp-ftable tbody tr .xp-fname')).toHaveText([
    'Browser',
    'Augmented reality',
    'Virtual reality',
  ]);
  await expect(page.getByText('Not available in MR.')).toBeVisible();

  // 9. Add to selection (WEB + VR, B1-13's record), through the browser-session selection.
  const panel = page.getByRole('complementary', { name: 'Get this for your institution' });
  await reachAndClick(page, panel.getByText('Browser'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Add to selection' }));
  await expect(panel.getByRole('status')).toContainText('Formats: WEB · VR');
  // Adding claims no request, payment or access; the way on is "Go to selection" (Package 1C).
  await expect(page.locator('main')).not.toContainText(
    /Request sent|Access active|Payment confirmed|Your request/,
  );
  await expect(panel.getByRole('link', { name: 'Go to selection' })).toHaveAttribute(
    'href',
    '/selection',
  );

  // 10. How institutional access works.
  await reachAndClick(page, page.getByRole('link', { name: /More about access/ }));
  await page.waitForURL('**/#for-institutions');
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Anyone can browse. Institutions request access.',
    }),
  ).toBeFocused();

  // 11. Sign in, and back to a valid destination: the public catalogue, PU-04 (the XS link map,
  // design/v3-refined-b/roles/XS-v6/LINK-MAP.json "Back to experiments"; P1-17).
  if (wide(page)) await reachAndClick(page, page.locator('header a.xp-signin'));
  else await header(page, 'Sign in');
  await page.waitForURL('**/sign-in');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await reachAndClick(page, page.getByRole('link', { name: 'Back to experiments' }));
  await page.waitForURL((url) => url.pathname === '/experiments');

  // The same world all along: the catalogue still marks the experiment in the selection.
  await expect(page.locator('.xp-erow.is-sel .xp-erow-title a')).toHaveText([
    'Shell-and-Tube Heat Exchanger',
  ]);
  await expectSameDocument(page, mark);
});
