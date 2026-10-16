import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview (board B4-06 f0 … f6) on the
 * test-hook build, at 1440, 1024, 768 and 375, as Dr S. Ranganathan. After Flow D, ASMT-0009
 * "Heat Exchanger — post-lab" is Ready with Rahul's submission: a changed rule warns of a new
 * version (f1), a changed result option warns that a submitted student's result changes (f2), and
 * a real save — the deadline typed "20 Nov 2026, 23:59" — makes version 2. After Flow C a draft
 * saved through the assessments port shows every rule empty (f3). The preview switches between the
 * student view (f5) and the answer key (f6), mirrored into `?view=key`, and writes nothing. Each
 * drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no
 * sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// Each test checks several drawn states (axe at every width) on the shared dev server.
test.describe.configure({ timeout: 90_000 });

const RANGANATHAN = { personId: 'per-0014' };
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SETTINGS = `/faculty/assessments/${ASMT}/settings`;
const PREVIEW = `/faculty/assessments/${ASMT}/preview`;

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RANGANATHAN });
  await page.goto(path);
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

const main = (page: Page) => page.locator('main');
const settingsForm = (page: Page) => page.getByRole('form', { name: 'Settings' });
const fieldOf = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const passMark = (page: Page) => fieldOf(page, 'Pass mark (%)');
const attempts = (page: Page) => fieldOf(page, 'Attempts allowed');
const deadline = (page: Page) => fieldOf(page, 'Deadline');
const saveButton = (page: Page) => page.getByRole('button', { name: 'Save settings' });
const warningTitles = (page: Page) => main(page).locator('.xr-notice--warn .xr-notice-title');
const saved = (page: Page) => page.locator('#Es-saved');
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'Preview as' });

async function retype(field: Locator, value: string): Promise<void> {
  await field.fill(value);
}

test.describe('FA-10 Assessment · Settings', () => {
  test('as set: the record’s own values, the drawn form and foot (f0, f4)', async ({ page }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    const tabs = page.getByRole('navigation', { name: NAME });
    await expect(tabs.getByRole('link')).toHaveText([
      'Summary',
      'Questions 4',
      'Settings',
      'Preview',
      'Submissions 1',
    ]);
    await expect(tabs.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(fieldOf(page, 'Assessment name')).toHaveValue(NAME);
    await expect(passMark(page)).toHaveValue('50');
    await expect(attempts(page)).toHaveValue('2');
    await expect(deadline(page)).toHaveValue('14 Nov 2026, 23:59');
    await expect(page.getByRole('radio', { name: /After the deadline/ })).toBeChecked();
    await expect(main(page)).toContainText(
      'No time limit. Each value belongs to this assessment only.',
    );
    await expect(warningTitles(page)).toHaveCount(0);
    await expect(main(page).locator('.xr-btn--primary')).toHaveText(['Save settings']);
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveClass(/xr-btn--text/);
    // f4 (768) and wider: pass mark and attempts side by side; the narrowest width may stack them.
    const width = page.viewportSize()?.width ?? 1440;
    const passBox = (await passMark(page).boundingBox())!;
    const attemptsBox = (await attempts(page).boundingBox())!;
    if (width >= 768) {
      expect(Math.abs(passBox.y - attemptsBox.y)).toBeLessThan(2);
      expect(attemptsBox.x).toBeGreaterThan(passBox.x + passBox.width);
    }
    await checkState(page, NAME);
  });

  test('a changed rule warns of a new version; the typed deadline saves for real (f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await retype(passMark(page), '60');
    await expect(warningTitles(page)).toHaveText(['This makes a new version']);
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      '1 student has submitted. Their submission keeps the rules they answered under; new attempts use these.',
    );
    await checkState(page, NAME);
    // Put back: the warning goes; then the deadline typed as the hint shows it.
    await retype(passMark(page), '50');
    await expect(warningTitles(page)).toHaveCount(0);
    await retype(deadline(page), '20 Nov 2026, 23:59');
    await expect(warningTitles(page)).toHaveText(['This makes a new version']);
    const before = (await inspectWorld(page)).worldVersion;
    await reachAndClick(page, saveButton(page));
    await expect(saved(page)).toHaveText(
      'Settings saved as version 2. Earlier submissions keep the version they answered.',
    );
    await expect(saved(page)).toBeFocused();
    await expect(warningTitles(page)).toHaveCount(0);
    await expect(main(page).locator('.xa-headfacts')).toContainText('Due 20 Nov 2026, 23:59');
    await expect(deadline(page)).toHaveValue('20 Nov 2026, 23:59');
    expect((await inspectWorld(page)).worldVersion).toBeGreaterThan(before);
    await checkState(page, NAME);
  });

  test('a changed result option warns of a new version and of the submissions’ terms (f1, f2; P4-06)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await page.getByText('Immediately after marking', { exact: true }).click();
    await expect(warningTitles(page)).toHaveText([
      'This makes a new version',
      'This changes when students see their result',
    ]);
    await expect(main(page).locator('.xr-notice--warn').nth(1)).toContainText(
      '1 student has submitted. Submissions already made keep the result terms of the version they answered; new attempts use these.',
    );
    await checkState(page, NAME);
    // Cancel puts the record's values back.
    await reachAndClick(page, page.getByRole('button', { name: 'Cancel' }));
    await expect(page.getByRole('radio', { name: /After the deadline/ })).toBeChecked();
    await expect(warningTitles(page)).toHaveCount(0);
  });

  test('the service’s checks: “Check these settings” with links to the fields', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await retype(passMark(page), '150');
    await retype(attempts(page), '0');
    await reachAndClick(page, saveButton(page));
    const summary = page.locator('#Es-err[role="alert"]');
    await expect(summary).toBeFocused();
    await expect(summary.locator('strong')).toHaveText('Check these settings');
    await expect(summary.getByRole('link')).toHaveText([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
    ]);
    await expect(passMark(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(main(page).locator('.xr-error')).toHaveCount(2);
    await checkState(page, NAME);
    // By keyboard through the summary's links (a wrapped link's box centre can fall between its
    // lines, so a pointer is not used here).
    await summary.getByRole('link').first().focus();
    await page.keyboard.press('Tab');
    await expect(summary.getByRole('link', { name: /attempts/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(attempts(page)).toBeFocused();
    await retype(attempts(page), '2');
    await expect(summary.getByRole('link')).toHaveCount(1);
  });

  test('a new draft: every rule empty, no option chosen (f3)', async ({ page }) => {
    await open(page, 'after-flow-c', '/faculty/help');
    await waitForShell(page);
    const created = await actAs<{ readonly ok: boolean; readonly value: { readonly id: string } }>(
      page,
      RANGANATHAN,
      {
        port: 'assessments',
        method: 'createAssessment',
        input: {
          mode: 'save-as-draft',
          experimentId: 'shell-and-tube-heat-exchanger',
          name: 'Heat Exchanger — draft',
          introduction: null,
          rules: {
            passMarkPercent: '',
            attemptsAllowed: '',
            deadline: '',
            releaseOption: null,
            releaseDate: null,
          },
          questions: [],
        },
      },
    );
    expect(created.ok).toBe(true);
    await softNavigate(page, `/faculty/assessments/${created.value.id}/settings`);
    await expect(settingsForm(page)).toBeVisible();
    await expect(main(page).locator('.xw-hubhead')).toContainText('Draft — not ready');
    await expect(passMark(page)).toHaveValue('');
    await expect(attempts(page)).toHaveValue('');
    await expect(deadline(page)).toHaveValue('');
    await expect(fieldOf(page, 'Introduction (optional)')).toHaveValue('');
    for (const name of [/Immediately after marking/, /After the deadline/, /On a date/]) {
      await expect(page.getByRole('radio', { name })).not.toBeChecked();
    }
    await checkState(page, 'Heat Exchanger — draft');
    // Nobody has submitted a draft: no warning; partial rules save.
    await retype(passMark(page), '40');
    await expect(warningTitles(page)).toHaveCount(0);
    await reachAndClick(page, saveButton(page));
    await expect(saved(page)).toHaveText('Settings saved.');
  });
});

test.describe('FA-11 Assessment · Preview', () => {
  test('student view: the pinned questions as a student sees them, nothing written (f5)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', PREVIEW);
    await expect(viewSwitch(page)).toBeVisible();
    const before = (await inspectWorld(page)).worldVersion;
    await expect(viewSwitch(page).getByRole('button', { name: 'Student view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'Previewing creates no attempt and saves nothing.',
    );
    await expect(main(page).locator('p.xl-meta')).toHaveText(
      'As a student sees it: 4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit.',
    );
    await expect(main(page).locator('.xa-q-n')).toHaveText([
      'Question 1 of 4 · Multiple choice',
      'Question 2 of 4 · Multiple choice',
      'Question 3 of 4 · True or false',
      'Question 4 of 4 · Written answer',
    ]);
    await expect(main(page).getByRole('radio')).toHaveCount(10);
    for (const radio of await main(page).getByRole('radio').all()) {
      await expect(radio).toBeDisabled();
      await expect(radio).not.toBeChecked();
    }
    await expect(
      page.getByRole('textbox', { name: 'Answer to question 4 (preview)' }),
    ).toBeDisabled();
    await expect(main(page)).toContainText('Your faculty marks written answers.');
    await expect(main(page).locator('.xa-mk')).toHaveCount(0);
    await checkState(page, NAME);
    expect((await inspectWorld(page)).worldVersion).toBe(before);
  });

  test('answer key: mirrored into `?view=key`, the correct answers and guidance (f6)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', PREVIEW);
    await expect(viewSwitch(page)).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Answer key' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await expect(main(page).locator('p.xl-meta')).toHaveText(
      'Only you see the answer key and the marking guidance.',
    );
    await expect(main(page).locator('.xa-mk.is-ok')).toHaveCount(3);
    await expect(main(page).locator('.xa-mk.is-ok').first()).toHaveText('Correct');
    await expect(main(page).locator('.xa-ans-row > span:first-child')).toHaveText([
      'Explanation',
      'Explanation',
      'Explanation',
      'Marking guidance',
      'Explanation',
    ]);
    await expect(main(page).getByRole('radio')).toHaveCount(0);
    await checkState(page, NAME);
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Student view' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}$`));
    await expect(main(page).locator('.xa-mk')).toHaveCount(0);
  });

  test('the key by its address; Back leaves the page; Forward returns to the key', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', `${PREVIEW}?view=key`);
    await expect(main(page).locator('p.xl-meta')).toHaveText(
      'Only you see the answer key and the marking guidance.',
    );
    await expect(viewSwitch(page).getByRole('button', { name: 'Answer key' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // From Settings through the tab, then the switch: the switch replaces the address.
    await softNavigate(page, SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: NAME }).getByRole('link', { name: 'Preview' }),
    );
    await expect(viewSwitch(page)).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Answer key' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${SETTINGS}$`));
    await expect(settingsForm(page)).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await expect(main(page).locator('p.xl-meta')).toHaveText(
      'Only you see the answer key and the marking guidance.',
    );
  });

  test('an unknown view becomes the bare address', async ({ page }) => {
    await open(page, 'after-flow-d', `${PREVIEW}?view=marks`);
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}$`));
    await expect(main(page).locator('p.xl-meta')).toContainText('As a student sees it:');
  });
});
