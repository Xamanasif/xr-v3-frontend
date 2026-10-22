import { expect, type Page, test } from '@playwright/test';

import { expectNoAxeViolations, expectNoInvisibleFocusTargets, reachAndClick } from '../support';
import { checkLanding } from '../support/landing';
import { checkState, smallTargets } from '../support/screen-checks';
import { expectSameDocument, markDocument } from '../support/workspace';

/**
 * The public surface — PU-01 Landing with PU-14 (the V1 landing since prompt 13; its own suite is
 * `e2e/landing-v1/`), PU-02 / PU-03 / PU-05 (B1-03), PU-04 Catalogue
 * (B1-04), PU-06 Experiment (B1-05) and the framed public PU-15 — on the PRODUCT build (no test
 * hooks; the tab's own spine-start world, signed out), at 1440, 1024, 768 and 375 (Phase-1
 * Package 1B). Every drawn state passes the screen checks (axe WCAG 2.0/2.1/2.2 A+AA, one H1, no
 * invisible focus target, 24 px targets, no developer or Slice-1 surface, no sideways scroll);
 * presses are real pointer clicks (`reachAndClick`); moves between pages keep the document (the
 * tab's one sample world, ADR-0004). Loading and failed states are proven in jsdom
 * (`features/public/public.test.tsx`, fault plan): the product build has no fault seam.
 */

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** The V1 landing (prompt 13), its data read: the featured cards and the area explorer. */
async function landing(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Experiment areas' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'CNC Turning Centre' })).toBeVisible();
}

/** A public header destination: in the header from 1024 px, in the menu sheet below. */
async function openFromHeader(page: Page, name: string): Promise<void> {
  if (!wide(page)) {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name }));
  } else {
    await reachAndClick(
      page,
      page.locator('header .xp-nav').getByRole('link', { name, exact: true }),
    );
  }
}

test.describe('PU-01 Landing with PU-14 — the V1 landing (prompt 13)', () => {
  test('default: hero, featured, explorer, story, formats, academic, for institutions, band — counts from the world', async ({
    page,
  }) => {
    await landing(page);
    await expect(page).toHaveTitle('XR Learning Platform');
    // Nothing in the explorer moves on its own (the accordion has no timer).
    const selected = page.locator('[data-sel][aria-pressed="true"]');
    await expect(selected).toHaveAttribute(
      'aria-label',
      'Selected: Mechanical & Manufacturing, 5 experiments',
    );
    await page.waitForTimeout(1500);
    await expect(selected).toHaveAttribute(
      'aria-label',
      'Selected: Mechanical & Manufacturing, 5 experiments',
    );
    await checkLanding(page);
    await expect(page.locator('.pl1-fcard-n')).toHaveText([
      'Offered in 12 of 12 experiments',
      'Offered in 5 of 12 experiments',
      'Offered in 7 of 12 experiments',
      'Offered in 2 of 12 experiments',
    ]);
    // The landing's one way into the Selection (owner decision D-5): PU-14's request button.
    await expect(page.locator('main a[href="/selection"]')).toHaveCount(1);
    await expect(
      page.locator('#for-institutions').getByRole('link', { name: 'Request institutional access' }),
    ).toHaveAttribute('href', '/selection');
    await expect(page.locator('header a.pl1-signin')).toHaveAttribute('href', '/sign-in');
  });

  test('the explorer: focus selects, arrows / Home / End move and focus; hover from 1024 px', async ({
    page,
  }) => {
    await landing(page);
    const group = page.getByRole('group', { name: 'Experiment areas' });
    const selected = () =>
      group.locator('[data-sel][aria-pressed="true"]').getAttribute('aria-label');
    await reachAndClick(page, group.getByRole('button', { name: /^Show Electrical/ }));
    await expect.poll(selected).toBe('Selected: Electrical & Electronics, 4 experiments');
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('button', { name: /^Selected: Chemical/ })).toBeFocused();
    await page.keyboard.press('Home');
    await expect.poll(selected).toBe('Selected: Mechanical & Manufacturing, 5 experiments');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(selected).toBe('Selected: Chemical & Process, 3 experiments');
    // A closed panel's Browse is no Tab stop; the open one's is.
    await expect(group.locator('.pl1-xp.is-on a')).toHaveAttribute('tabindex', '0');
    await expect(group.locator('.pl1-xp:not(.is-on) a')).toHaveCount(2);
    for (const link of await group.locator('.pl1-xp:not(.is-on) a').all()) {
      await expect(link).toHaveAttribute('tabindex', '-1');
    }
    if (wide(page)) {
      await group.locator('.pl1-xp').nth(1).hover();
      await expect.poll(selected).toBe('Selected: Electrical & Electronics, 4 experiments');
    }
    await checkLanding(page);
  });

  test('the menu sheet below 1024 px (the public shell): same items, Sign in, an inert page; Esc returns to Menu', async ({
    page,
  }) => {
    test.skip(wide(page), 'The header shows its items from 1024 px.');
    // The landing draws its own frozen header (no menu, D-3); the public shell's menu is on every
    // other public page.
    await page.goto('/areas');
    await expect(page.getByRole('heading', { level: 1, name: 'Engineering areas' })).toBeVisible();
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    const sheet = page.locator('#public-menu');
    // Since Package 1C the sheet's Selection row and its Request access button too (B1-01
    // "Mobile 375 · menu open").
    await expect(sheet.getByRole('link')).toHaveText([
      'Browse experiments',
      'Areas',
      'For institutions',
      'Selection 0',
      'Sign in',
      'Request access',
    ]);
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await checkState(page, 'Engineering areas');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
    await expect(sheet).toBeHidden();
    // Widened past 1024 px with the sheet open: it closes, and focus, which Menu and the sheet
    // can no longer hold, goes to the page's main region.
    const size = page.viewportSize()!;
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await sheet.getByRole('link', { name: 'Areas' }).focus();
    await page.setViewportSize({ width: 1280, height: size.height });
    await expect(sheet).toBeHidden();
    await expect(page.locator('main#main')).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert');
    await page.setViewportSize(size);
  });

  test('For institutions (PU-14): the section scrolls into view and its heading takes focus', async ({
    page,
  }) => {
    await page.goto('/areas');
    await expect(page.getByRole('heading', { level: 1, name: 'Engineering areas' })).toBeVisible();
    const mark = await markDocument(page);
    await openFromHeader(page, 'For institutions');
    await page.waitForURL('**/#for-institutions');
    const heading = page.getByRole('heading', {
      level: 2,
      name: 'Anyone can browse. Institutions grant access.',
    });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expectSameDocument(page, mark);
    await checkState(page, 'Set the conditions.');
  });
});

test.describe('PU-02 / PU-03 / PU-05 (B1-03)', () => {
  test('PU-02 All engineering areas', async ({ page }) => {
    await page.goto('/areas');
    await expect(page.getByRole('link', { name: 'Chemical & Process' })).toBeVisible();
    await expect(page).toHaveTitle('Engineering areas · XR Learning Platform');
    await checkState(page, 'Engineering areas');
    await expect(page.locator('.xp-fact')).toHaveText(['Areas3', 'Courses5', 'Experiments12']);
  });

  test('PU-03 Engineering area, then an unknown one', async ({ page }) => {
    await page.goto('/areas/electrical-electronics');
    await expect(page.locator('.xp-course')).toHaveCount(2);
    await checkState(page, 'Electrical & Electronics');
    await expect(page.locator('.xp-course-name')).toHaveText([
      'Electrical Machines',
      'Power Electronics',
    ]);
    await page.goto('/areas/no-such-area');
    await checkState(page, 'We can’t find that area');
  });

  test('PU-05 Course, a course with no code and nothing published, an unknown course', async ({
    page,
  }) => {
    await page.goto('/courses/process-instrumentation-control');
    await expect(page.locator('.xp-erow')).toHaveCount(3);
    await checkState(page, 'Process Instrumentation & Control');
    await expect(page.locator('.xp-code')).toHaveText('CHE ZG513');
    await page.goto('/courses/fluid-mechanics');
    await expect(
      page.getByRole('heading', { name: 'No experiments are published for this course yet' }),
    ).toBeVisible();
    await checkState(page, 'Fluid Mechanics');
    await expect(page.locator('.xp-code')).toHaveCount(0);
    await page.goto('/courses/no-such-course');
    await checkState(page, 'We can’t find that course');
  });

  test('/courses redirects to the areas (Appendix A §3.7 row 1)', async ({ page }) => {
    const response = await page.goto('/courses');
    expect(response?.url()).toMatch(/\/areas$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Engineering areas' })).toBeVisible();
  });
});

test.describe('PU-04 Catalogue (B1-04)', () => {
  const count = (page: Page) => page.locator('.xp-count');

  test('default, then search, a facet, the order and By area — in the address, one document', async ({
    page,
  }) => {
    await page.goto('/experiments');
    await expect(count(page)).toHaveText('12 experiments');
    await checkState(page, 'Experiments');
    const mark = await markDocument(page);
    await page.getByRole('searchbox', { name: 'Search experiments' }).fill('column');
    await expect(count(page)).toHaveText('1 of 12 experiments');
    await expect(page).toHaveURL(/\/experiments\?q=column$/);
    await expect(page.getByRole('searchbox', { name: 'Search experiments' })).toBeFocused();
    await reachAndClick(page, page.getByRole('button', { name: 'Remove Search: “column”' }));
    await expect(count(page)).toHaveText('12 experiments');
    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('course-code');
    await expect(page.locator('.xp-erow-title a').first()).toHaveText('Boiler Drum Level');
    await reachAndClick(page, page.getByRole('button', { name: 'By area' }));
    await expect(page.locator('.xp-group-h h2')).toHaveText([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await expect(page).toHaveURL(/\/experiments\?sort=course-code&view=area$/);
    await checkState(page, 'Experiments');
    await expectSameDocument(page, mark);
  });

  test('arrives filtered by area and by format; facets count live (OR inside, AND across)', async ({
    page,
  }) => {
    await page.goto('/experiments?area=mechanical-manufacturing');
    await expect(count(page)).toHaveText('5 of 12 experiments');
    await expect(page.locator('.xr-fchip')).toHaveText(['Area: Mechanical & Manufacturing']);
    await checkState(page, 'Experiments');
    await page.goto('/experiments?format=vr');
    await expect(count(page)).toHaveText('7 of 12 experiments');
    await checkState(page, 'Experiments');
  });

  test('“This link was adjusted”, then no results and Clear all filters', async ({ page }) => {
    await page.goto('/experiments?area=retired-area&format=hologram&format=ar');
    await expect(page.getByText('We adjusted this link')).toBeVisible();
    await expect(count(page)).toHaveText('5 of 12 experiments');
    await expect(page).toHaveURL(/\/experiments\?format=ar$/);
    await checkState(page, 'Experiments');
    await page.goto('/experiments?q=forging');
    await expect(
      page.getByRole('heading', { name: 'No experiments match these filters' }),
    ).toBeVisible();
    await checkState(page, 'Experiments');
    await reachAndClick(
      page,
      page.locator('.xr-empty').getByRole('button', { name: 'Clear all filters' }),
    );
    await expect(count(page)).toHaveText('12 experiments');
  });

  test('the filter panel (≥ 1024 px) or the filter sheet (< 1024 px)', async ({ page }) => {
    await page.goto('/experiments');
    await expect(count(page)).toHaveText('12 experiments');
    if (wide(page)) {
      await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeHidden();
      await reachAndClick(page, page.getByRole('button', { name: 'Hide filters' }));
      await expect(page.locator('aside.xp-filters')).toBeHidden();
      await reachAndClick(page, page.getByRole('button', { name: 'Show filters' }));
      await reachAndClick(page, page.locator('aside.xp-filters').getByText('MR · Mixed reality'));
      await expect(count(page)).toHaveText('2 of 12 experiments');
      return;
    }
    await expect(page.locator('aside.xp-filters')).toBeHidden();
    await reachAndClick(page, page.getByRole('button', { name: 'Filters', exact: true }));
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet.getByRole('button', { name: 'Close filters' })).toBeFocused();
    await reachAndClick(page, sheet.getByText('MR · Mixed reality'));
    await expect(sheet.getByRole('button', { name: 'Show 2 experiments' })).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    // checkState's parts, with the sheet back at its top before the target-size measure: the focus
    // walk leaves the panel scrolled to its end, and the helper does not model the sticky foot —
    // rows scrolled half under it would read as crowded by the foot's buttons.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expectNoAxeViolations(page);
    expect((await expectNoInvisibleFocusTargets(page)).length).toBeGreaterThan(0);
    await sheet.locator('.xp-fsheet-panel').evaluate((panel) => panel.scrollTo({ top: 0 }));
    expect(await smallTargets(page)).toEqual([]);
    // WCAG 2.4.11: an option that takes focus is scrolled above the sticky foot (PF-22).
    for (const option of await sheet.locator('input[type="checkbox"]').all()) {
      await option.focus();
      expect(
        await option.evaluate((input) => {
          const box = input.getBoundingClientRect();
          const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return hit === input || Boolean(input.closest('label')?.contains(hit));
        }),
        (await option.getAttribute('id')) ?? 'option',
      ).toBe(true);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await reachAndClick(page, sheet.getByRole('button', { name: 'Show 2 experiments' }));
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeFocused();
    await expect(count(page)).toHaveText('2 of 12 experiments');
    // A click on the sheet's own text keeps focus in the dialog: Tab enters at its first control,
    // Shift+Tab from there wraps to its last, and Esc closes it back to the button.
    await reachAndClick(page, page.getByRole('button', { name: 'Filters (1)' }));
    await reachAndClick(page, sheet.getByRole('heading', { name: 'Filters' }));
    await page.keyboard.press('Tab');
    await expect(sheet.getByRole('button', { name: 'Close filters' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(sheet.locator('.xp-fsheet-foot button').last()).toBeFocused();
    await reachAndClick(page, sheet.getByRole('heading', { name: 'Filters' }));
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeFocused();
    // Widened past 1024 px with the sheet open: the side panel takes over and focus goes to the
    // page's main region (the Filters button is hidden with the sheet).
    const size = page.viewportSize()!;
    await reachAndClick(page, page.getByRole('button', { name: 'Filters (1)' }));
    await page.setViewportSize({ width: 1280, height: size.height });
    await expect(sheet).toBeHidden();
    await expect(page.locator('main#main')).toBeFocused();
    await expect(page.locator('aside.xp-filters')).toBeVisible();
    await page.setViewportSize(size);
  });

  test('an address change while the catalogue is open: the header link, then Back', async ({
    page,
  }) => {
    test.skip(!wide(page), 'One width is enough: the header link is the same everywhere.');
    await page.goto('/experiments?format=vr');
    await expect(count(page)).toHaveText('7 of 12 experiments');
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      page.locator('header .xp-nav').getByRole('link', { name: 'Browse experiments' }),
    );
    await page.waitForURL((url) => url.pathname === '/experiments' && url.search === '');
    await expect(count(page)).toHaveText('12 experiments');
    await expect(page.locator('.xr-fchip')).toHaveCount(0);
    await page.goBack();
    await page.waitForURL('**/experiments?format=vr');
    await expect(count(page)).toHaveText('7 of 12 experiments');
    await expect(page.locator('.xr-fchip')).toHaveText(['Format: VR']);
    await expectSameDocument(page, mark);
  });
});

test.describe('PU-06 Experiment (B1-05)', () => {
  test('default: hero, outcomes, formats and device needs, poster, course and access beside', async ({
    page,
  }) => {
    await page.goto('/experiments/distillation-column');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Distillation Column' }),
    ).toBeVisible();
    await expect(page.locator('.xp-ftable tbody tr')).toHaveCount(2);
    await checkState(page, 'Distillation Column');
    await expect(page.locator('.xp-unavail')).toHaveText('Not available in AR or MR.');
    // Not in the selection: the panel offers Add, not "Go to selection" (B1-05 "Pick formats").
    const panel = page.getByRole('complementary', { name: 'Get this for your institution' });
    await expect(panel.getByRole('link', { name: 'Go to selection' })).toHaveCount(0);
  });

  test('arrived with a format filter; the panel: validation, Add, Change formats, Remove', async ({
    page,
  }) => {
    await page.goto('/experiments?format=vr');
    await expect(page.locator('.xp-count')).toHaveText('7 of 12 experiments');
    const mark = await markDocument(page);
    await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
    await page.waitForURL('**/experiments/shell-and-tube-heat-exchanger?format=vr');
    const panel = page.getByRole('complementary', { name: 'Get this for your institution' });
    await expect(panel.getByRole('checkbox', { name: /VR/ })).toBeChecked();
    await expect(page.getByRole('link', { name: 'Back to VR experiments' })).toBeVisible();
    await expect(page.locator('main#main')).toBeFocused();
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    // Validation (B1-05 "Validation · no format chosen").
    await reachAndClick(page, panel.getByText('Virtual reality'));
    await reachAndClick(page, panel.getByRole('button', { name: 'Add to selection' }));
    await expect(panel.getByRole('alert')).toHaveText('Choose at least one format to add.');
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    // Add WEB + VR (B1-13's continuity record).
    await reachAndClick(page, panel.getByText('Browser'));
    await reachAndClick(page, panel.getByText('Virtual reality'));
    await reachAndClick(page, panel.getByRole('button', { name: 'Add to selection' }));
    await expect(panel.getByRole('status')).toContainText('Formats: WEB · VR');
    await expect(
      panel.getByRole('heading', { name: 'Get this for your institution' }),
    ).toBeFocused();
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    // Change formats, then Cancel; Remove.
    const panelHeading = panel.getByRole('heading', { name: 'Get this for your institution' });
    await reachAndClick(page, panel.getByRole('button', { name: 'Change formats' }));
    await expect(panel.getByText('Change the formats your institution needs')).toBeVisible();
    await expect(panelHeading).toBeFocused();
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    await reachAndClick(page, panel.getByRole('button', { name: 'Cancel' }));
    await expect(panel.getByRole('status')).toContainText('Formats: WEB · VR');
    await expect(panelHeading).toBeFocused();
    // Back in the catalogue, the row says it is in the selection (B1-04 "Selection marker").
    await reachAndClick(page, page.getByRole('link', { name: 'Back to VR experiments' }));
    await page.waitForURL('**/experiments?format=vr');
    await expect(page.locator('.xp-erow.is-sel .xp-erow-title a')).toHaveText([
      'Shell-and-Tube Heat Exchanger',
    ]);
    await expectSameDocument(page, mark);
  });

  test('an unknown or unpublished experiment', async ({ page }) => {
    await page.goto('/experiments/conduction-through-a-composite-wall');
    await checkState(page, 'We can’t find that experiment');
    await expect(page.locator('main a')).toHaveText(['Browse experiments', 'Home']);
  });
});

test('PU-15 public, inside the public frame: 404, Browse experiments opens the built catalogue', async ({
  page,
}) => {
  const response = await page.goto('/zz-not-a-page');
  expect(response?.status()).toBe(404);
  await checkState(page, 'We can’t find that page');
  const mark = await markDocument(page);
  await reachAndClick(page, page.locator('main').getByRole('link', { name: 'Browse experiments' }));
  await page.waitForURL('**/experiments');
  await expect(page.locator('.xp-count')).toHaveText('12 experiments');
  await expectSameDocument(page, mark);
});

test.describe('breakpoint boundaries (xr-public.css @container xp: 600 · 760 · 1024 · 1280 · 1360)', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'The boundaries are set per test.');

  for (const [width, expected] of [
    [599, { menu: true, filterButton: true, signIn: false, brandName: false }],
    [600, { menu: true, filterButton: true, signIn: false, brandName: true }],
    [1023, { menu: true, filterButton: true, signIn: false, brandName: true }],
    [1024, { menu: false, filterButton: false, signIn: true, brandName: false }],
    [1359, { menu: false, filterButton: false, signIn: true, brandName: false }],
    [1360, { menu: false, filterButton: false, signIn: true, brandName: true }],
  ] as const) {
    test(`${width} px: the public header and the catalogue switch as drawn, nothing scrolls sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      // The public shell's header (the landing draws its own: e2e/landing-v1).
      await page.goto('/areas');
      await expect(page.getByRole('link', { name: 'Chemical & Process' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({
        visible: expected.menu,
      });
      await expect(page.locator('header .xp-signin')).toBeVisible({ visible: expected.signIn });
      await expect(page.locator('header .xp-brand-name')).toBeVisible({
        visible: expected.brandName,
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await openFromHeader(page, 'Browse experiments');
      await expect(page.locator('.xp-count')).toHaveText('12 experiments');
      await expect(page.locator('.xp-filter-btn')).toBeVisible({ visible: expected.filterButton });
      await expect(page.locator('aside.xp-filters')).toBeVisible({
        visible: !expected.filterButton,
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  }
});
