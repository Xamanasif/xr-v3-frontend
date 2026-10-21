import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-10 Settings", "FA-11 Preview"; earlier board B4-06 f0 … f6) on the test-hook
 * build, at 1440, 1024, 768 and 375, as Dr S. Ranganathan. After Flow D, "Heat Exchanger —
 * post-lab" is Ready with Rahul's submission: a changed rule warns of a new version, a changed
 * result option warns of the new version and that submitted attempts keep their result terms, and
 * a real save — the deadline typed "20 Nov 2026, 23:59" — makes version 2. After Flow C a draft
 * saved through the assessments port shows every rule empty. The preview switches between the
 * student view and the answer key, mirrored into `?view=key`, and writes nothing. Each drawn state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll)
 * and names no assessment, attempt or question by its reference.
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
const warningTitles = (page: Page) => main(page).locator('.fa-fsec--warn .rk-notice-t');
const warnings = (page: Page) => main(page).locator('.fa-fsec--warn .rk-notice--warn');
const saved = (page: Page) => page.locator('#Es-saved');
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'Preview as' });
const tabs = (page: Page) => page.getByRole('navigation', { name: `${NAME} sections` });
const sheetHead = (page: Page) => main(page).locator('.fa-pvhead');

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;

/** No reference in the page's words, its accessible names and placeholders, or the tab title. */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].map(
      (element) =>
        `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('placeholder') ?? ''}`,
    );
    return [document.body.innerText, document.title, ...named].filter((text) => pattern.test(text));
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

async function retype(field: Locator, value: string): Promise<void> {
  await field.fill(value);
}

test.describe('FA-10 Assessment · Settings', () => {
  test('as set: the record’s own values, the form, its foot and How changes apply', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    await expect(tabs(page).getByRole('link')).toHaveText([
      'Summary',
      'Questions4, 4',
      'Settings',
      'Preview',
      'Submissions1, 1',
    ]);
    await expect(tabs(page).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
    await expect(fieldOf(page, 'Assessment name')).toHaveValue(NAME);
    await expect(passMark(page)).toHaveValue('50');
    await expect(attempts(page)).toHaveValue('2');
    await expect(deadline(page)).toHaveValue('14 Nov 2026, 23:59');
    await expect(page.getByRole('radio', { name: /After the deadline/ })).toBeChecked();
    await expect(settingsForm(page)).toContainText(
      'Each value belongs to this assessment only. There is no time limit.',
    );
    await expect(warningTitles(page)).toHaveCount(0);
    await expect(main(page).locator('.rb-btn--primary')).toHaveText(['Save settings']);
    await expect(page.getByRole('button', { name: 'Cancel changes' })).toHaveClass(/\brb-btn\b/);
    const side = page.getByRole('complementary', { name: 'How changes apply' });
    await expect(side.locator('.fa-side-ver')).toHaveText(
      /^Version 1 · since 27 Oct 2026, \d{2}:\d{2}$/,
    );
    await expect(side.locator('.rk-next')).toHaveText(
      'Rahul Verma has submitted version 1. Changing a rule or when results are shown makes version 2; that submission keeps version 1.',
    );
    // The three rules side by side while the form column is 600 px or wider; stacked on phones.
    const width = page.viewportSize()?.width ?? 1440;
    const passBox = (await passMark(page).boundingBox())!;
    const attemptsBox = (await attempts(page).boundingBox())!;
    if (width >= 768) {
      expect(Math.abs(passBox.y - attemptsBox.y)).toBeLessThan(2);
      expect(attemptsBox.x).toBeGreaterThan(passBox.x + passBox.width);
    }
    if (width === 375) expect(attemptsBox.y).toBeGreaterThan(passBox.y + passBox.height);
    // Beside the form from 1020 px of page; below it under that.
    const formBox = (await settingsForm(page).boundingBox())!;
    const sideBox = (await side.boundingBox())!;
    if (width === 1440) expect(sideBox.x).toBeGreaterThan(formBox.x + formBox.width - 1);
    if (width <= 768) expect(sideBox.y).toBeGreaterThan(formBox.y + formBox.height - 1);
    await expectNoReferences(page);
    await checkState(page, NAME);
  });

  test('a changed rule warns of a new version; the typed deadline saves for real', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await retype(passMark(page), '60');
    await expect(warningTitles(page)).toHaveText(['This makes a new version']);
    await expect(warnings(page)).toContainText(
      'Rahul Verma has submitted. That submission keeps the rules it was answered under; new attempts use these.',
    );
    await expectNoReferences(page);
    await checkState(page, NAME);
    // Put back: the warning goes; then the deadline typed as the hint shows it.
    await retype(passMark(page), '50');
    await expect(warningTitles(page)).toHaveCount(0);
    await retype(deadline(page), '20 Nov 2026, 23:59');
    await expect(warningTitles(page)).toHaveText(['This makes a new version']);
    const before = (await inspectWorld(page)).worldVersion;
    await reachAndClick(page, saveButton(page));
    await expect(saved(page).locator('.rk-notice-t')).toHaveText('Settings saved as version 2.');
    await expect(saved(page).locator('.rk-notice-d')).toHaveText(
      'Rahul Verma’s submission keeps version 1; new attempts use version 2.',
    );
    await expect(saved(page)).toBeFocused();
    await expect(warningTitles(page)).toHaveCount(0);
    await expect(main(page).locator('.fa-rec .fa-fig').first()).toHaveText(
      'Due 20 Nov 2026, 23:595 days left',
    );
    await expect(main(page).locator('.fa-rec-meta')).toContainText('Version 2');
    await expect(deadline(page)).toHaveValue('20 Nov 2026, 23:59');
    expect((await inspectWorld(page)).worldVersion).toBeGreaterThan(before);
    await expectNoReferences(page);
    await checkState(page, NAME);
  });

  test('a changed result option warns of a new version and of the submissions’ terms (P4-06)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    await page.getByText('Immediately after marking', { exact: true }).click();
    await expect(warningTitles(page)).toHaveText([
      'This makes a new version',
      'This changes when results are shown for new attempts',
    ]);
    await expect(warnings(page).nth(1)).toContainText(
      'Rahul Verma has submitted. Submitted attempts keep the result terms of the version they answered (after the deadline); new attempts use the terms you choose here.',
    );
    await expectNoReferences(page);
    await checkState(page, NAME);
    // Cancel changes puts the record's values back.
    await reachAndClick(page, page.getByRole('button', { name: 'Cancel changes' }));
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
    await expect(summary.locator('.rk-errsum-t')).toHaveText('Check these settings');
    await expect(summary.getByRole('link')).toHaveText([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
    ]);
    await expect(passMark(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(main(page).locator('.rk-ferr')).toHaveCount(2);
    await expectNoReferences(page);
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

  test('a new draft: every rule empty, no option chosen', async ({ page }) => {
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
    await expect(main(page).locator('.fa-rec-meta')).toContainText('Draft — not ready');
    await expect(passMark(page)).toHaveValue('');
    await expect(attempts(page)).toHaveValue('');
    await expect(deadline(page)).toHaveValue('');
    await expect(fieldOf(page, 'Introduction (optional)')).toHaveValue('');
    for (const name of [/Immediately after marking/, /After the deadline/, /On a date/]) {
      await expect(page.getByRole('radio', { name })).not.toBeChecked();
    }
    await expectNoReferences(page);
    await checkState(page, 'Heat Exchanger — draft');
    // Nobody has submitted a draft: no warning; partial rules save.
    await retype(passMark(page), '40');
    await expect(warningTitles(page)).toHaveCount(0);
    await reachAndClick(page, saveButton(page));
    await expect(saved(page).locator('.rk-notice-t')).toHaveText('Settings saved.');
  });
});

test.describe('FA-11 Assessment · Preview', () => {
  test('student view: the pinned questions as a student sees them, nothing written', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', PREVIEW);
    await expect(viewSwitch(page)).toBeVisible();
    const before = (await inspectWorld(page)).worldVersion;
    await expect(viewSwitch(page).getByRole('button', { name: 'Student view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('region', { name: 'Preview' })).toHaveClass(/\bfa-pvsurf\b/);
    await expect(main(page).locator('.fa-pvbar .rk-hint')).toHaveText(
      'Previewing creates no attempt and saves nothing.',
    );
    await expect(sheetHead(page).locator('.fa-pvhead-k')).toHaveText('As students see it');
    await expect(sheetHead(page).locator('.fa-pvhead-t')).toHaveText(NAME);
    await expect(sheetHead(page).locator('.fa-pvhead-d')).toHaveText(
      '4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit',
    );
    await expect(main(page).locator('li.fa-pvq .fa-sheetq-k')).toHaveText([
      'Question 1 of 4 · Multiple choice',
      'Question 2 of 4 · Multiple choice',
      'Question 3 of 4 · True or false',
      'Question 4 of 4 · Written answer',
    ]);
    await expect(main(page).locator('li.fa-opt')).toHaveCount(10);
    // A picture of the sheet: nothing in it can be answered.
    await expect(main(page).getByRole('radio')).toHaveCount(0);
    await expect(main(page).getByRole('textbox')).toHaveCount(0);
    await expect(main(page).locator('.fa-wbox')).toHaveText(
      'The student’s written answer goes here. Your faculty marks written answers.',
    );
    await expect(main(page).locator('.fa-opt.is-correct, .fa-expl, .fa-guide')).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, NAME);
    expect((await inspectWorld(page)).worldVersion).toBe(before);
  });

  test('answer key: mirrored into `?view=key`, the correct answers and guidance', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', PREVIEW);
    await expect(viewSwitch(page)).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Answer key' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await expect(main(page).locator('.fa-pvhead.fa-pvhead--key .fa-pvhead-t')).toHaveText(
      'Only you see the answer key and the marking guidance',
    );
    await expect(main(page).locator('.fa-opt.is-correct')).toHaveCount(3);
    await expect(main(page).locator('.fa-opt.is-correct .fa-opt-ok').first()).toHaveText('Correct');
    await expect(main(page).locator('.fa-guide-k, .fa-expl-k')).toHaveText([
      'Explanation',
      'Explanation',
      'Explanation',
      'Marking guidance · only you see this',
      'Explanation',
    ]);
    await expect(main(page).locator('.fa-wbox')).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Student view' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}$`));
    await expect(main(page).locator('.fa-opt.is-correct')).toHaveCount(0);
  });

  test('the key by its address; Back leaves the page; Forward returns to the key', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', `${PREVIEW}?view=key`);
    await expect(main(page).locator('.fa-pvhead--key .fa-pvhead-t')).toHaveText(
      'Only you see the answer key and the marking guidance',
    );
    await expect(viewSwitch(page).getByRole('button', { name: 'Answer key' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // From Settings through the tab, then the switch: the switch replaces the address.
    await softNavigate(page, SETTINGS);
    await expect(settingsForm(page)).toBeVisible();
    // The tab strip scrolls sideways at 375: the tab is brought into view as a swipe would.
    await tabs(page).getByRole('link', { name: 'Preview' }).click();
    await expect(viewSwitch(page)).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'Answer key' }));
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${SETTINGS}$`));
    await expect(settingsForm(page)).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}\\?view=key$`));
    await expect(main(page).locator('.fa-pvhead--key .fa-pvhead-t')).toHaveText(
      'Only you see the answer key and the marking guidance',
    );
  });

  test('an unknown view becomes the bare address', async ({ page }) => {
    await open(page, 'after-flow-d', `${PREVIEW}?view=marks`);
    await expect(page).toHaveURL(new RegExp(`${PREVIEW}$`));
    await expect(sheetHead(page).locator('.fa-pvhead-k')).toHaveText('As students see it');
  });
});
