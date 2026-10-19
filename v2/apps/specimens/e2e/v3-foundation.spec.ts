import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';

import { openSpecimen } from './support/specimen';

/**
 * The V3 foundation (XR-V3-RB-1.0; ADR-0010) in a real browser, at the four approved widths: the
 * five supplied Refined B screens built from @xr/ui/v3 (specimens `v3-*`), and the scope boundary.
 *
 * - every specimen renders with Public Sans in its 400–800 range, with no horizontal scroll and no
 *   axe violation;
 * - the shell: the rail from 1024 px of app width, "Menu" and the drawer below it — focus entry,
 *   Tab kept inside, Esc returning focus, the page behind inert, and the drawer closing with focus
 *   on the rail's current destination when the window grows past 1024 px (V3P-03);
 * - the request table: exactly one sort control displayed at every width, at the table's own
 *   breakpoint (V3P-02), with the table semantics kept in its narrow layouts;
 * - the decision page: the error summary and its links, the native confirmation dialog (focus on
 *   the title, Tab cycling, Esc back to the decision button, the page behind inert), the outcome;
 * - no internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-) anywhere on the Super Admin pages;
 * - the scope boundary: a v46 component inside a v46 island computes exactly the styles it has
 *   outside any V3 root, and the V3 classes it shares a name with keep their Refined B look.
 */

const SPECIMENS = [
  'v3-sa-01',
  'v3-sa-02',
  'v3-sa-02-nomatch',
  'v3-sa-02-loading',
  'v3-sa-02-failed',
  'v3-sa-02-empty',
  'v3-sa-03',
  'v3-sa-03-renewal',
  'v3-sa-03-paused',
  'v3-sa-03-decided',
  'v3-ia-01',
  'v3-ia-02',
  'v3-ia-02-active',
  'v3-ia-02-activated',
  'v3-ia-02-paused',
  'v3-ia-02-ended',
  'v3-ia-02-none',
  'v3-ia-02-nomatch',
  'v3-ia-02-loading',
  'v3-ia-02-failed',
] as const;

const SUPER_ADMIN = SPECIMENS.filter((id) => id.startsWith('v3-sa-'));

/** The project's viewport width (1440, 1024, 768 or 375). */
function viewportWidth(page: Page): number {
  return page.viewportSize()?.width ?? 1440;
}

async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test.describe('V3 specimens render at every width', () => {
  for (const id of SPECIMENS) {
    test(`${id}: Public Sans 400–800, no horizontal scroll, no axe violation`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await openSpecimen(page, id);
      await expect(page.locator('div.xr.rb')).toHaveCount(1);
      await fontsReady(page);
      // A weight a page does not use is not fetched until asked for: ask, then check it loaded.
      const fonts = await page.evaluate(async () => {
        await Promise.all(
          ['400 16px', '650 15px', '800 16px'].map((font) =>
            document.fonts.load(`${font} "Public Sans"`),
          ),
        );
        return {
          regular: document.fonts.check('400 16px "Public Sans"'),
          semibold650: document.fonts.check('650 15px "Public Sans"'),
          extrabold: document.fonts.check('800 16px "Public Sans"'),
        };
      });
      expect(fonts).toEqual({ regular: true, semibold650: true, extrabold: true });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'horizontal scroll').toBeLessThanOrEqual(0);
      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('V3 workspace shell', () => {
  test('the rail from 1024 px, Menu below; the reserved logo slot and the current destination', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02');
    const rail = page.getByRole('complementary', { name: 'Super Admin workspace' });
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    if (viewportWidth(page) >= 1024) {
      await expect(rail).toBeVisible();
      await expect(menu).toBeHidden();
      await expect(rail.locator('.rb-logo')).toHaveText('Official WILP logo');
      await expect(
        rail.getByRole('link', { name: 'Requests , 3 requests under review' }),
      ).toHaveAttribute('aria-current', 'page');
    } else {
      await expect(rail).toBeHidden();
      await expect(menu).toBeVisible();
    }
  });

  test('the drawer: focus to Close, Tab stays inside, Esc returns to Menu, the page is inert', async ({
    page,
  }) => {
    test.skip(viewportWidth(page) >= 1024, 'the drawer exists below 1024 px of app width');
    await openSpecimen(page, 'v3-sa-01');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await menu.click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await expect(page.locator('.rb-main')).toHaveAttribute('inert', '');
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => document.activeElement?.closest('.rb-drawer') !== null,
      );
      expect(inside, `Tab ${step + 1} stays in the drawer`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
    await expect(page.locator('.rb-main')).not.toHaveAttribute('inert', '');
  });

  test('V3P-03: growing past 1024 px closes the drawer and focus moves to the rail', async ({
    page,
  }) => {
    test.skip(viewportWidth(page) >= 1024, 'the drawer exists below 1024 px of app width');
    await openSpecimen(page, 'v3-sa-01');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
    await expect(
      page.getByRole('complementary', { name: 'Super Admin workspace' }).getByRole('link', {
        name: 'Overview',
      }),
    ).toBeFocused();
  });

  test('the skip link is the first stop, shown when focused, and moves focus into the page', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box && box.y >= 0 && box.height >= 44, 'visible while focused').toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('every Tab stop is visible (no hidden sort button, no hidden control)', async ({ page }) => {
    await openSpecimen(page, 'v3-sa-02');
    await fontsReady(page);
    await expectNoInvisibleFocusTargets(page);
  });

  test('the account chrome opens the XS menu (XS-P3) on its first item; Esc returns focus', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-ia-01');
    const trigger = page.getByRole('button', {
      name: 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology',
    });
    await trigger.click();
    const help = page.getByRole('list', { name: 'Account' }).getByRole('link', {
      name: 'Help & support',
    });
    await expect(help).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

/** Whether exactly one sort control is displayed, and which. */
async function sortControls(page: Page): Promise<{ head: boolean; bar: boolean }> {
  return page.evaluate(() => {
    const shown = (element: Element | null) =>
      element instanceof HTMLElement && element.checkVisibility();
    return {
      head: shown(document.querySelector('.rk-table th .rk-sortbtn')),
      bar: shown(document.querySelector('.rk-sortbar .rk-sortbtn')),
    };
  });
}

test.describe('V3 request table (SA-02)', () => {
  test('V3P-02: exactly one sort control at the table’s own breakpoint, and it sorts', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02');
    const { head, bar } = await sortControls(page);
    expect(head !== bar, `head ${head}, bar ${bar}`).toBe(true);
    const first = page.locator('.rk-table tbody tr').first();
    await expect(first).toContainText('21 Oct 2026');
    await page.locator(head ? '.rk-table th .rk-sortbtn' : '.rk-sortbar .rk-sortbtn').click();
    await expect(first).toContainText('18 Sep 2026');
  });

  test('V3P-02 across the table breakpoint (frame widths around 1194 px of app width)', async ({
    page,
  }) => {
    test.skip(viewportWidth(page) !== 1440, 'one sweep is enough; the frame sets the width');
    for (const width of [1180, 1190, 1193, 1194, 1195, 1196, 1200, 1210, 1279, 1280]) {
      await openSpecimen(page, 'v3-sa-02', width);
      const { head, bar } = await sortControls(page);
      expect(head !== bar, `frame ${width}: head ${head}, bar ${bar}`).toBe(true);
    }
  });

  test('the table keeps its semantics in every layout', async ({ page }) => {
    await openSpecimen(page, 'v3-sa-02');
    const table = page.getByRole('table', {
      name: 'Institutional access requests, received, newest first',
    });
    await expect(table).toBeVisible();
    // The head row is in the tree where it is displayed; the narrow layouts hide it, as drawn.
    const body = table.locator('tbody');
    await expect(body.getByRole('row')).toHaveCount(8);
    for (const row of await body.getByRole('row').all()) {
      await expect(row.getByRole('cell')).toHaveCount(5);
    }
    const rowLink = table.getByRole('link', {
      name: 'Konark Polytechnic, additional licences, received 29 Sep 2026, Under review. Open the request',
    });
    await expect(rowLink).toBeVisible();
  });

  test('filters: the count is announced, chips remove one filter each, Clear returns to Search', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02');
    const search = page.getByRole('searchbox', { name: 'Search' });
    await search.fill('Konark');
    await expect(page.getByRole('status').filter({ hasText: 'requests' })).toHaveText(
      '1 of 8 requests',
    );
    await page.getByRole('button', { name: 'Remove filter Search: “Konark”' }).click();
    await expect(search).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: 'requests' })).toHaveText('8 requests');
    await search.fill('Godavari');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
  });

  test('More filters says how many it holds (Type moves into it under 600 px)', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02');
    const toggle = page.getByRole('button', { name: /^More filters/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('combobox', { name: 'Internal or external' }).selectOption('External');
    // Chromium joins the visually hidden words with a space ("More filters , 1 applied"), as it
    // does for every counted v46 control (packages/ui README, WP-0.8).
    await expect(
      page.getByRole('button', { name: /^More filters\s*,\s*1 applied$/ }),
    ).toBeVisible();
    const typeInMore = page.locator('#rq-type-more');
    if (await typeInMore.isVisible()) {
      await typeInMore.selectOption('Renewal');
      await expect(
        page.getByRole('button', { name: /^More filters\s*,\s*2 applied$/ }),
      ).toBeVisible();
    }
  });

  test('a failed load is an alert and Try again returns to the list with focus on its title', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-02-failed');
    await expect(
      page.getByRole('alert').filter({ hasText: 'We couldn’t load the requests' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Requests' })).toBeFocused();
    await expect(page.locator('.rk-table')).toBeVisible();
  });
});

test.describe('V3 request decision (SA-03)', () => {
  test('“Go to decision” only where the panel follows the details (under 860 px of page)', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-03');
    const goTo = page.getByRole('link', { name: 'Go to decision' });
    if (viewportWidth(page) >= 1440) await expect(goTo).toBeHidden();
    else if (viewportWidth(page) <= 768) await expect(goTo).toBeVisible();
  });

  test('the error summary takes focus and its link moves focus to the field', async ({ page }) => {
    await openSpecimen(page, 'v3-sa-03');
    await page.getByRole('button', { name: 'Approve request' }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'Check your decision' });
    await expect(summary).toBeFocused();
    await summary.getByRole('link', { name: 'Choose a decision' }).click();
    await expect(page.getByRole('radio', { name: 'Approve request' })).toBeFocused();
    await expect(page.getByRole('group', { name: 'Decision' })).toHaveAttribute(
      'aria-describedby',
      'dc-choice-e',
    );
  });

  test('the confirmation: title focused, Tab cycles, Esc returns, confirm shows the outcome', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-03');
    await page.getByRole('radio', { name: 'Approve request' }).check();
    await page.getByRole('radio', { name: 'External institution' }).check();
    const decide = page.locator('button.rk-go');
    await decide.click();
    const dialog = page.getByRole('dialog', {
      name: 'Approve the request from Godavari Institute of Technology?',
    });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#dlg-t')).toBeFocused();
    expect(
      await page.evaluate(() => document.querySelector('dialog.rk-dialog')?.matches(':modal')),
    ).toBe(true);
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Approve request' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(decide).toBeFocused();
    await decide.click();
    await dialog.getByRole('button', { name: 'Approve request' }).click();
    await expect(page.locator('#dc-done')).toBeFocused();
    await expect(page.locator('#dc-done')).toContainText('Approved — payment required');
  });

  test('a renewal: the smaller scope is not available and internal or external is locked', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-sa-03-renewal');
    await expect(page.getByRole('radio', { name: 'Approve a smaller scope' })).toBeDisabled();
    await page.getByRole('radio', { name: 'Approve request' }).check();
    await expect(page.locator('.rk-locked')).toContainText(
      'Internal or external: Internal. Set when this institution was first approved.',
    );
  });

  test('a paused institution shows no decision form', async ({ page }) => {
    await openSpecimen(page, 'v3-sa-03-paused');
    await expect(page.getByText('This institution is paused')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });
});

test.describe('owner decision 6: no internal references on Super Admin pages', () => {
  for (const id of SUPER_ADMIN) {
    test(`${id} shows no REQ-, ACC-, UPD-, DTR-, SUP- or SUB- reference`, async ({ page }) => {
      test.skip(viewportWidth(page) !== 1440, 'the words do not depend on the width');
      await openSpecimen(page, id);
      const found = await page.evaluate(() => {
        const pattern = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
        const hits: string[] = [];
        const text = document.body.textContent ?? '';
        const textHit = pattern.exec(text);
        if (textHit) hits.push(`text ${textHit[0]}`);
        for (const element of document.querySelectorAll('*')) {
          for (const name of ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']) {
            const value = element.getAttribute(name);
            const hit = value ? pattern.exec(value) : null;
            if (hit) hits.push(`${name} ${hit[0]}`);
          }
        }
        return hits;
      });
      expect(found).toEqual([]);
    });
  }
});

/** Computed styles that would show a leak between the two layers. */
const PROPERTIES = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'padding',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-radius',
  'list-style-type',
  'margin-top',
  'margin-bottom',
  'height',
  'text-decoration-line',
  'text-underline-offset',
  'text-rendering',
] as const;

test.describe('V3 scope boundary', () => {
  test('a v46 component inside a v46 island computes exactly the styles it has outside V3', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-scope');
    await fontsReady(page);
    const styles = await page.evaluate((properties) => {
      const read = (scope: string) =>
        [...document.querySelectorAll(`[data-scope="${scope}"] [data-scope-sample] *`)].map(
          (element) => {
            const computed = getComputedStyle(element);
            return {
              tag: element.tagName,
              classes: element.getAttribute('class') ?? '',
              ...Object.fromEntries(
                properties.map((name) => [name, computed.getPropertyValue(name)]),
              ),
            };
          },
        );
      return { outside: read('outside'), island: read('island') };
    }, PROPERTIES);
    expect(styles.island.length).toBeGreaterThan(10);
    expect(styles.island).toEqual(styles.outside);
  });

  test('the V3 classes that share a v46 name keep the Refined B look inside a V3 root', async ({
    page,
  }) => {
    await openSpecimen(page, 'v3-scope');
    const looks = await page.evaluate(() => {
      const style = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const computed = getComputedStyle(element);
        return {
          background: computed.backgroundColor,
          radius: computed.borderRadius,
          height: computed.height,
        };
      };
      return {
        v3: style('[data-scope="v3"] .xr-fmt'),
        v46: style('[data-scope="outside"] .xr-fmt'),
      };
    });
    expect(looks.v3).toEqual({ background: 'rgb(20, 27, 94)', radius: '7px', height: '24px' });
    expect(looks.v46?.radius).toBe('4px');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the drawer opens without its slide', async ({ page }) => {
    test.skip(viewportWidth(page) >= 1024, 'the drawer exists below 1024 px of app width');
    await openSpecimen(page, 'v3-sa-01');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const animation = await page
      .locator('.rb-drawer')
      .evaluate((element) => getComputedStyle(element).animationName);
    expect(animation).toBe('none');
  });
});
