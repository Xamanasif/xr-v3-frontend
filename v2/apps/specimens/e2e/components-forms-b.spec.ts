import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';

import { openSpecimen } from './support/specimen';

/**
 * SegmentedControl, FileInput, Stepper, ErrorSummary and FormFooter in a real browser at the four
 * approved viewports (Appendix F WP-0.6 acceptance 3–4): axe, every focus stop visible, keyboard
 * behaviour, error-summary focus, and the v46 phone rules (below 600 px of `xr-content`).
 */
const IDS = [
  'c-segmented-control',
  'c-file-input',
  'c-stepper',
  'c-error-summary',
  'c-form-footer',
] as const;

for (const id of IDS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await openSpecimen(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

/**
 * Lets running transitions finish. With reduced motion the v46 backstop makes every property
 * change a 0.01 ms transition, so a computed value read in the same frame is still the old one.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

async function open(page: Page, id: string, width?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, width);
  await settle(page);
}

/**
 * The error summary inside the specimen. Scoped to the frame: the Next.js App Router adds its own
 * `role="alert"` route announcer (`next-route-announcer`, open shadow root) to every page, which
 * an unscoped `page.getByRole('alert')` would also match.
 */
const errorSummary = (page: Page) => page.locator('div.specimen-frame').getByRole('alert');

/** The actual inline size of the specimen's `xr-content` container (what its queries use). */
const contentWidth = (page: Page) =>
  page.locator('[data-probe="content"]').evaluate((element) => element.clientWidth);

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  expect(rect, 'element has a layout box').not.toBeNull();
  return rect!;
};

/** Presses Tab until `target` has focus (a keyboard walk, so :focus-visible applies). */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let step = 0; step < 30; step += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error('Tab never reached the target');
}

test.describe('SegmentedControl (board 03 "Segmented control")', () => {
  test('Enter and Space press a segment; it switches the view and never navigates', async ({
    page,
  }) => {
    await open(page, 'c-segmented-control');
    const group = page.getByRole('group', { name: 'Show reports' });
    const openView = group.getByRole('button', { name: 'Open' });
    const resolved = group.getByRole('button', { name: 'Resolved' });
    const all = group.getByRole('button', { name: 'All' });
    const url = page.url();

    await expect(openView).toHaveAttribute('aria-pressed', 'true');
    await tabTo(page, resolved);
    await page.keyboard.press('Enter');
    await expect(resolved).toHaveAttribute('aria-pressed', 'true');
    await expect(openView).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-probe="view"]')).toHaveText('Showing: resolved');
    await expect(resolved).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(all).toBeFocused();
    await page.keyboard.press('Space');
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-probe="view"]')).toHaveText('Showing: all');
    await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
    expect(page.url()).toBe(url);
  });

  test('the focus ring sits inside the segment (xr-seg outline-offset -4px)', async ({ page }) => {
    await open(page, 'c-segmented-control');
    const resolved = page.getByRole('button', { name: 'Resolved' });
    await tabTo(page, resolved);
    await settle(page);
    const outline = await resolved.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, offset: style.outlineOffset };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.offset).toBe('-4px');
  });
});

test.describe('FileInput (board 03; board 07 "State 1 · Report a problem · Student")', () => {
  test('the native input is reached by Tab, named by its label and described by its hint', async ({
    page,
  }) => {
    await open(page, 'c-file-input');
    const input = page.locator('#s1-shot');
    await tabTo(page, input);
    await expect(input).toHaveAccessibleName('Screenshot (optional)');
    await expect(input).toHaveAccessibleDescription('A picture of the screen can help.');
  });

  test('choosing a file reaches the input (empty → chosen)', async ({ page }) => {
    await open(page, 'c-file-input');
    const input = page.locator('#s1-shot');
    await expect(page.locator('[data-probe="chosen"]')).toHaveText('Files chosen: 0');
    await input.setInputFiles({
      name: 'screen.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
    });
    await expect(page.locator('[data-probe="chosen"]')).toHaveText('Files chosen: 1');
    expect(await input.evaluate((element) => (element as HTMLInputElement).files?.[0]?.name)).toBe(
      'screen.png',
    );
  });
});

test.describe('Stepper (board 03 "Stepper · guided flows (AR-5)")', () => {
  /** Rendered widths of one part of every step (`xr-step-label` or `xr-step-n`). */
  const widths = (page: Page, probe: string, part: 'label' | 'n') =>
    page
      .locator(`[data-probe="${probe}"] .xr-step-${part}`)
      .evaluateAll((parts) => parts.map((element) => element.getBoundingClientRect().width));

  test('aria-current marks the current step only; the list is named by the flow', async ({
    page,
  }) => {
    await open(page, 'c-stepper');
    const steps = page.locator('[data-probe="step-2"] li');
    await expect(steps).toHaveCount(3);
    expect(
      await steps.evaluateAll((items) => items.map((item) => item.getAttribute('aria-current'))),
    ).toEqual([null, 'step', null]);
    await expect(
      page.locator('[data-probe="step-1"] li[aria-current="step"] .xr-step-label'),
    ).toHaveText('Experiments');
    await expect(
      page.getByRole('list', { name: 'Give students access' }).first().getByRole('listitem'),
    ).toHaveCount(3);
  });

  test('phone rule: below 600 px of content only the current step’s words show, with the count', async ({
    page,
  }) => {
    await open(page, 'c-stepper');
    const width = await contentWidth(page);
    await expect(page.locator('[data-probe="step-2"] .xr-overline')).toHaveText('Step 2 of 3');
    await expect(page.locator('[data-probe="step-2"] .xr-overline')).toBeVisible();
    for (const part of ['label', 'n'] as const) {
      const shown = (await widths(page, 'step-2', part)).map((partWidth) => partWidth > 1);
      // Below 600 px the others are visually hidden (1 px, clipped) but still read out.
      expect(shown, `xr-step-${part} at ${width} px`).toEqual(
        width < 600 ? [false, true, false] : [true, true, true],
      );
    }
    // Clipped, not removed: every step's words stay in the accessibility tree at every width.
    const tree = (await page.locator('[data-probe="step-2"] ol').ariaSnapshot()).toLowerCase();
    for (const words of ['step 1 · done', 'experiments', 'students', 'review and give access']) {
      expect(tree, `"${words}" is read out at ${width} px`).toContain(words);
    }
  });

  test.describe('at set content widths', () => {
    test.skip(
      ({ viewport }) => viewport?.width !== 1440,
      'The frame sets the content width; one viewport is enough.',
    );
    for (const frameWidth of [640, 660]) {
      test(`frame ${frameWidth}`, async ({ page }) => {
        await open(page, 'c-stepper', frameWidth);
        const width = await contentWidth(page);
        for (const part of ['label', 'n'] as const) {
          const shown = (await widths(page, 'step-1', part)).map((partWidth) => partWidth > 1);
          expect(shown, `xr-step-${part} at ${width} px`).toEqual(
            width < 600 ? [true, false, false] : [true, true, true],
          );
        }
      });
    }
  });
});

test.describe('ErrorSummary (B4-04 "Step 2 · validation"; board 12 "Patterns")', () => {
  test('appears on submit and takes focus; its links move focus to the fields without navigating', async ({
    page,
  }) => {
    await open(page, 'c-error-summary');
    const summary = errorSummary(page);
    await expect(summary).toHaveCount(0);
    const url = page.url();

    await page.locator('[data-probe="continue"]').focus();
    await page.keyboard.press('Enter');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary).toHaveAttribute('tabindex', '-1');
    await expect(summary.getByRole('link')).toHaveCount(2);

    await page.keyboard.press('Tab');
    await expect(summary.getByRole('link', { name: 'Enter a full e-mail address' })).toBeFocused();
    await page.keyboard.press('Enter');
    const address = page.getByLabel('Institution e-mail');
    await expect(address).toBeFocused();
    await expect(address).toBeInViewport();
    await expect(address).toHaveAccessibleDescription(
      'Enter a full e-mail address, like name@institution.edu',
    );

    await summary.getByRole('link', { name: 'Say what happened' }).click();
    await expect(page.getByLabel('What happened?')).toBeFocused();
    expect(page.url()).toBe(url);
  });

  test('a second failed submit focuses the summary again', async ({ page }) => {
    await open(page, 'c-error-summary');
    const submit = page.locator('[data-probe="continue"]');
    await submit.click();
    await expect(errorSummary(page)).toBeFocused();
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-probe="attempts"]')).toHaveText('Attempts: 2');
    await expect(errorSummary(page)).toBeFocused();
  });

  test('shown: axe and visible focus stops', async ({ page }) => {
    await open(page, 'c-error-summary');
    await page.locator('[data-probe="continue"]').click();
    await expect(errorSummary(page)).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
});

test.describe('FormFooter (board 03 "Button order"; B2-05, B4-04, B6-09)', () => {
  test('quiet action left, Save then primary right; below 600 px the actions go full width above it', async ({
    page,
  }) => {
    await open(page, 'c-form-footer');
    const width = await contentWidth(page);
    const footer = page.locator('[data-probe="cancel-footer"] .xw-flow-foot');
    const cancel = footer.getByRole('link', { name: 'Cancel' });
    const actions = footer.locator('.xw-actions');
    const save = footer.getByRole('button', { name: 'Save as draft' });
    const primary = footer.getByRole('button', { name: 'Continue' });

    const footerBox = await box(footer);
    const cancelBox = await box(cancel);
    const actionsBox = await box(actions);
    const saveBox = await box(save);
    const primaryBox = await box(primary);
    // DOM and reading order: Cancel, Save as draft, Continue (primary last).
    expect(
      await footer
        .locator('a, button')
        .evaluateAll((controls) => controls.map((control) => control.textContent)),
    ).toEqual(['Cancel', 'Save as draft', 'Continue']);
    // Save precedes the primary: beside it, or above it if the actions row wraps.
    expect(saveBox.x < primaryBox.x || saveBox.y < primaryBox.y).toBe(true);
    if (width < 600) {
      expect(Math.abs(actionsBox.width - footerBox.width)).toBeLessThanOrEqual(1);
      expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(cancelBox.y + 1);
    } else {
      expect(cancelBox.x).toBeLessThan(saveBox.x);
      expect(
        Math.abs(primaryBox.x + primaryBox.width - (footerBox.x + footerBox.width)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(cancelBox.y + cancelBox.height / 2 - (primaryBox.y + primaryBox.height / 2)),
      ).toBeLessThanOrEqual(2);
    }
  });

  test('a busy primary ignores repeat presses from the keyboard and the pointer', async ({
    page,
  }) => {
    await open(page, 'c-form-footer');
    const primary = page.locator('[data-probe="back-footer"] .xr-btn--primary');
    await tabTo(page, primary);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-probe="presses"]')).toHaveText('Presses: 1');
    await expect(primary).toHaveAccessibleName('Giving access…');
    await expect(primary).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    // Playwright will not click an aria-disabled element unless forced; force sends a real click.
    await primary.click({ force: true });
    await expect(page.locator('[data-probe="presses"]')).toHaveText('Presses: 1');
    await expect(primary).toBeFocused();
  });

  test('the destructive quiet action is drawn in the danger colour (xg-del, B6-09)', async ({
    page,
  }) => {
    await open(page, 'c-form-footer');
    const withdraw = page.getByRole('button', { name: 'Withdraw update' });
    await expect(withdraw).toHaveClass('xr-btn xr-btn--text xg-del');
    await settle(page);
    expect(await withdraw.evaluate((element) => getComputedStyle(element).color)).toBe(
      'rgb(180, 35, 24)',
    );
  });

  test('every footer control meets the 24 × 24 target minimum (WCAG 2.5.8)', async ({ page }) => {
    await open(page, 'c-form-footer');
    for (const rect of await page
      .locator('.xw-flow-foot a, .xw-flow-foot button')
      .evaluateAll((controls) =>
        controls.map((control) => {
          const { width, height } = control.getBoundingClientRect();
          return { width, height };
        }),
      )) {
      expect(rect.width).toBeGreaterThanOrEqual(24);
      expect(rect.height).toBeGreaterThanOrEqual(24);
    }
  });
});
