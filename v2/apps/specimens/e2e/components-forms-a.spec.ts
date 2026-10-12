import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';

import { openSpecimen } from './support/specimen';

/**
 * Field, TextInput, Select, Textarea, Checkbox / Radio groups and ChoiceCard in a real browser at
 * the four approved viewports (Appendix F WP-0.6 acceptance 3–4): axe, every focus stop visible,
 * validation on the primary action (Appendix E §5.1), the label as the target, radio arrow keys
 * (board 12 "Radio groups, scales"), 44 px targets (board 12 "Target size") and long values.
 */
for (const id of ['c-field', 'c-text-input', 'c-select', 'c-textarea', 'c-choice']) {
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

const computed = (locator: Locator, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

const RED = 'rgb(180, 35, 24)'; // #B42318, xr-foundation.css [aria-invalid="true"]
const NAVY = 'rgb(20, 27, 94)'; // #141B5E, .xr-choice:has(input:checked), .xr-choice.is-checked

test.describe('Field', () => {
  test('errors come only from the primary action: words under the field, described, invalid', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-field');
    const name = page.getByRole('textbox', { name: 'Full name' });
    const studentId = page.getByRole('textbox', { name: 'Student ID' });
    const programme = page.getByRole('textbox', { name: 'Programme (optional)' });
    const submit = page.getByRole('button', { name: 'Add student' });
    await expect(name).not.toHaveAttribute('aria-invalid');
    await expect(studentId).toHaveAccessibleDescription(
      'Your institution’s ID for this student, for example GIT-2026-0418.',
    );

    await submit.click();
    await expect(page.locator('[data-probe="checks"]')).toHaveText('Checked 1');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Enter the full name');
    await expect(studentId).toHaveAccessibleDescription(
      'Your institution’s ID for this student, for example GIT-2026-0418. Enter the student ID',
    );
    await expect(programme).not.toHaveAttribute('aria-invalid');
    // The error is drawn under its field, in words, with the Failed icon.
    const error = page.locator('#Aa-name-e');
    await expect(error).toHaveClass('xw-ferr');
    const [inputBox, errorBox] = [await name.boundingBox(), await error.boundingBox()];
    expect(errorBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
    await settle(page);
    expect(await computed(name, 'border-top-color')).toBe(RED);

    // As B2-07 draws it, editing a field clears only that field's error; the others stay.
    const email = page.getByRole('textbox', { name: 'Institution e-mail' });
    await name.fill('Priya');
    await expect(name).not.toHaveAttribute('aria-invalid');
    await expect(page.locator('#Aa-name-e')).toHaveCount(0);
    await expect(name).not.toHaveAttribute('aria-describedby');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    // No live validation: emptying the field again shows nothing until the primary action.
    await name.fill('');
    await expect(name).not.toHaveAttribute('aria-invalid');
    await expect(page.locator('#Aa-name-e')).toHaveCount(0);
    await submit.click();
    await expect(page.locator('[data-probe="checks"]')).toHaveText('Checked 2');
    await expect(name).toHaveAccessibleDescription('Enter the full name');
    // Re-validated on the next primary action, keeping what was typed.
    await name.fill('Priya Natarajan');
    await submit.click();
    await expect(page.locator('[data-probe="checks"]')).toHaveText('Checked 3');
    await expect(name).not.toHaveAttribute('aria-invalid');
    await expect(name).toHaveValue('Priya Natarajan');
    await expect(page.locator('#Aa-name-e')).toHaveCount(0);
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('the label sits above its control, always visible, and focuses it', async ({ page }) => {
    await openSpecimen(page, 'c-field');
    const label = page.locator('label[for="Aa-sid"]');
    const input = page.locator('#Aa-sid');
    const [labelBox, inputBox] = [await label.boundingBox(), await input.boundingBox()];
    expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(inputBox!.y);
    await label.click();
    await expect(input).toBeFocused();
    await expect(page.getByRole('combobox', { name: 'Group (optional)' })).toHaveValue('');
  });
});

test('inputs, selects and textareas are at least 44 px tall with 16 px text', async ({ page }) => {
  for (const id of ['c-field', 'c-text-input', 'c-select', 'c-textarea']) {
    await openSpecimen(page, id);
    const controls = await page
      .locator('.xr-input, .xr-select, .xr-textarea')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          height: element.getBoundingClientRect().height,
          font: getComputedStyle(element).fontSize,
        })),
      );
    expect(controls.length, id).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.font).toBe('16px');
    }
  }
});

test.describe('TextInput', () => {
  test('search: the leading icon sits inside the box before the text; the query is React state', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-text-input');
    const search = page.getByRole('searchbox', { name: 'Search' });
    const icon = page.locator('.xr-search > svg');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    const [box, iconBox] = [await search.boundingBox(), await icon.boundingBox()];
    const indent = Number.parseFloat(await computed(search, 'padding-left'));
    expect(indent).toBe(42);
    expect(iconBox!.x).toBeGreaterThanOrEqual(box!.x);
    expect(iconBox!.x + iconBox!.width).toBeLessThanOrEqual(box!.x + indent);
    expect(iconBox!.y).toBeGreaterThanOrEqual(box!.y);
    expect(iconBox!.y + iconBox!.height).toBeLessThanOrEqual(box!.y + box!.height);
    await search.fill('REQ-0042');
    await expect(page.locator('[data-probe="query"]')).toHaveText('Searching for REQ-0042');
  });

  test('invalid e-mail: described by its error and drawn red; date and tel are native', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-text-input');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const email = page.getByRole('textbox', { name: 'Institution e-mail' });
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(
      'Enter a full e-mail address, like name@institution.edu',
    );
    await settle(page);
    expect(await computed(email, 'border-top-color')).toBe(RED);
    const date = page.getByLabel('End date');
    await expect(date).toHaveAttribute('type', 'date');
    await date.fill('2027-10-07');
    await expect(date).toHaveValue('2027-10-07');
    await expect(page.getByRole('textbox', { name: 'Phone (optional)' })).toHaveAttribute(
      'type',
      'tel',
    );
  });
});

test.describe('Select', () => {
  test('native and controlled; the chevron is decorative and inside the box', async ({ page }) => {
    await openSpecimen(page, 'c-select');
    const select = page.locator('#c-sel');
    await select.selectOption({ label: 'ME ZG523 — Thermodynamics & Heat Transfer' });
    await expect(page.locator('[data-probe="course"]')).toHaveText(
      'ME ZG523 — Thermodynamics & Heat Transfer',
    );
    const chevron = page.locator('#c-sel + svg');
    await expect(chevron).toHaveAttribute('aria-hidden', 'true');
    const [box, chevronBox] = [await select.boundingBox(), await chevron.boundingBox()];
    expect(chevronBox!.x + chevronBox!.width).toBeLessThanOrEqual(box!.x + box!.width);
    expect(chevronBox!.x).toBeGreaterThan(box!.x + box!.width / 2);
  });

  test('a long value ends with an ellipsis inside its field (board 03 "Long values · at 375 and 768")', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-select', 343);
    const select = page.locator('#c-sel');
    await expect(select).toHaveValue(
      'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
    );
    const geometry = await select.evaluate((element) => {
      const field = element.closest('.xr-field')!.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return {
        fieldLeft: field.left,
        fieldRight: field.right,
        left: box.left,
        right: box.right,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(geometry.fieldLeft - 0.5);
    expect(geometry.right).toBeLessThanOrEqual(geometry.fieldRight + 0.5);
    expect(geometry.pageOverflow).toBeLessThanOrEqual(0);
    expect(await computed(select, 'text-overflow')).toBe('ellipsis');
    expect(await computed(select, 'white-space')).toBe('nowrap');
  });

  test('invalid: described by its error and drawn red', async ({ page }) => {
    await openSpecimen(page, 'c-select');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const select = page.locator('#Rh-scs');
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    await expect(select).toHaveAccessibleDescription('Choose a course');
    await settle(page);
    expect(await computed(select, 'border-top-color')).toBe(RED);
  });
});

test('Textarea: 128 px minimum, resizes vertically, invalid reason described', async ({ page }) => {
  await openSpecimen(page, 'c-textarea');
  const report = page.getByRole('textbox', { name: 'What happened?' });
  expect((await report.boundingBox())!.height).toBeGreaterThanOrEqual(128);
  expect(await computed(report, 'resize')).toBe('vertical');
  await expect(report).toHaveAccessibleDescription('Say what you were doing and what you saw.');
  const reason = page.getByRole('textbox', { name: 'Reason for returning' });
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(reason).toHaveAccessibleDescription(
    'Add a reason so the vendor knows what to change',
  );
});

test.describe('Checkbox / Radio groups, ChoiceCard', () => {
  test('radio rows: arrow keys move the choice and Tab enters the group once (board 12)', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-choice');
    const a = page.getByRole('radio', { name: 'ME ZG523 · Sem II · Section A' });
    const b = page.getByRole('radio', { name: 'ME ZG523 · Sem II · Section B' });
    const value = page.locator('[data-probe="group"]');
    await expect(a).toBeChecked();
    await a.focus();
    for (const [key, to, word] of [
      ['ArrowDown', b, 'Section B'],
      ['ArrowUp', a, 'Section A'],
      ['ArrowRight', b, 'Section B'],
      ['ArrowLeft', a, 'Section A'],
    ] as const) {
      await page.keyboard.press(key);
      await expect(to).toBeChecked();
      await expect(to).toBeFocused();
      await expect(value).toHaveText(word);
    }
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('name'))).not.toBe(
      'c-grp',
    );
    await page.keyboard.press('Shift+Tab');
    await expect(a).toBeFocused();
  });

  test('choice cards: arrow keys skip the unavailable card, which says why; checked is drawn', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSpecimen(page, 'c-choice');
    const approve = page.getByRole('radio', { name: /^Approve request/ });
    const smaller = page.getByRole('radio', { name: /^Approve a smaller scope/ });
    const info = page.getByRole('radio', { name: /^Request more information/ });
    const labelOf = (radio: Locator) => radio.locator('xpath=ancestor::label[1]');
    await expect(smaller).toBeDisabled();
    await expect(labelOf(smaller)).toHaveClass('xr-choice is-off');
    await expect(labelOf(smaller)).toContainText(
      'Not available for a renewal — the term continues the current plan.',
    );
    await settle(page);
    expect(await computed(labelOf(smaller), 'border-top-style')).toBe('dashed');

    await labelOf(approve).getByText('Approve request').click();
    await expect(approve).toBeChecked();
    await expect(page.locator('[data-probe="decision"]')).toHaveText('approve');
    await approve.focus();
    await page.keyboard.press('ArrowDown');
    await expect(info).toBeChecked();
    await expect(info).toBeFocused();
    await expect(page.locator('[data-probe="decision"]')).toHaveText('info');
    await expect(labelOf(info)).toHaveClass('xr-choice is-checked');
    await expect(labelOf(approve)).toHaveClass('xr-choice');
    await settle(page);
    expect(await computed(labelOf(info), 'border-top-color')).toBe(NAVY);
    expect(await computed(labelOf(approve), 'border-top-color')).not.toBe(NAVY);
  });

  test('the whole label is the target: every row and card is at least 44 px tall', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-choice');
    const heights = await page
      .locator('label.xr-check, label.xr-choice')
      .evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().height));
    expect(heights.length).toBe(15);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

    // A press at the far end of the row, away from the box and the words, toggles it.
    const row = page.locator('label.xr-check', { hasText: 'Conduction Through a Composite Wall' });
    const box = (await row.boundingBox())!;
    await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
    const conduction = page.getByRole('checkbox', { name: 'Conduction Through a Composite Wall' });
    await expect(conduction).toBeChecked();
    await expect(page.locator('[data-probe="experiments"]')).toHaveText(
      'Shell-and-Tube Heat Exchanger · Conduction Through a Composite Wall',
    );
    await conduction.focus();
    await page.keyboard.press('Space');
    await expect(conduction).not.toBeChecked();
    await expect(page.locator('[data-probe="experiments"]')).toHaveText(
      'Shell-and-Tube Heat Exchanger',
    );
  });

  test('a group error on the primary action joins the fieldset description, under the options', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-choice');
    const group = page.getByRole('group', { name: 'Access term' });
    const hint = 'BITS confirms the term when it decides the request.';
    const submit = page.getByRole('button', { name: 'Review request' });
    await expect(group).toHaveAccessibleDescription(hint);
    await submit.click();
    await expect(group).toHaveAccessibleDescription(`${hint} Choose how long you need access`);
    const [list, error] = [
      await group.locator('.xr-choice-list').boundingBox(),
      await page.locator('#Rr-term-e').boundingBox(),
    ];
    expect(error!.y).toBeGreaterThanOrEqual(list!.y + list!.height);
    // B1-07: choosing a term clears the group's error; the next primary action finds none.
    await group.getByText('Yearly', { exact: true }).click();
    await expect(group.getByRole('radio', { name: /^Yearly/ })).toBeChecked();
    await expect(group).toHaveAccessibleDescription(hint);
    await expect(page.locator('#Rr-term-e')).toHaveCount(0);
    await submit.click();
    await expect(group).toHaveAccessibleDescription(hint);
  });

  test('B5-04: the error between the hint and the options; the focusable fieldset takes focus', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-choice');
    const group = page.getByRole('group', { name: 'Formats it supports' });
    const hint =
      'Choose every format you are delivering. Each one appears in the catalogue only after it passes review and publication.';
    const submit = page.getByRole('button', { name: 'Continue' });
    await expect(group).toHaveAccessibleDescription(hint);
    await expect(group.locator('legend')).toHaveClass('xr-label');
    await submit.click();
    await expect(group).toHaveAccessibleDescription(`${hint} Choose at least one format`);
    const [hintBox, errorBox, firstRow] = [
      await group.locator('.xr-hint').boundingBox(),
      await page.locator('#Dm-fmts-e').boundingBox(),
      await page.locator('label[for="Dm-fWEB"]').boundingBox(),
    ];
    expect(errorBox!.y).toBeGreaterThanOrEqual(hintBox!.y + hintBox!.height);
    expect(firstRow!.y).toBeGreaterThanOrEqual(errorBox!.y + errorBox!.height);
    // An error-summary link moves focus to the group (tabindex -1), out of the Tab order.
    await group.focus();
    await expect(group).toBeFocused();
    await page.getByRole('checkbox', { name: 'Virtual reality (VR)' }).check();
    await expect(page.locator('#Dm-fmts-e')).toHaveCount(0);
    await submit.click();
    await expect(group).toHaveAccessibleDescription(hint);
    await expect(page.locator('#Dm-fmts-e')).toHaveCount(0);
  });
});
