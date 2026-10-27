import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState as checkScreen } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * The experiment editor — VE-03 … VE-06, VE-09 Edit draft and VE-08 Revise and resubmit, the one
 * four-step editor of the V3 Vendor design (VE-v1 `Main.dc.html`) — on the test-hook build at 1440,
 * 1024, 768 and 375. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus
 * targets, 24 × 24 targets, no developer surface, no sideways scroll). World: spine-start as Anil
 * Shetty (Northline Simulation Studio, ME ZG523 only). Flow E's E1 is done with real clicks and
 * typing: Anil creates “Conduction Through a Composite Wall” (the contract suite's content) through
 * the four steps, saves the draft (the first save mints SUB-0077), leaves and comes back with what
 * he typed kept, meets “Leave without saving?” on a link with unsaved changes, and submits through
 * the confirmation to the outcome card. The revise walk: the CI seam only SETS UP the world —
 * Anil's SUB-0077 submitted through his own port and returned by Prof. A. Menon — then Anil revises
 * with real clicks and typing and resubmits; he reads “Submitted” (M-3), the stale revise link is
 * refused, and the reviewer's queue holds revision 2 (the routing stand-in, PC-66), read through the
 * seam. No state names the experiment by its reference (the owner's identifier rule for the
 * Vendor, 22 Oct 2026): every checked state is searched for one; the reference is read from the
 * address only.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ANIL = { personId: 'per-anil-shetty' };
const MENON = { personId: 'per-a-menon' };
const THERMO = 'thermodynamics-heat-transfer';
const NEW = '/vendor/experiments/new';
const LIST = '/vendor/experiments';

/** The contract suite's Flow E content (`contract-suite/cases/flow-e.ts` `contentFor`). */
const FLOW_E = {
  name: 'Conduction Through a Composite Wall',
  summary: 'Heat flow through a wall of several layers.',
  description:
    'Learners build a wall of three layers and compare the temperature profile with the series-resistance model.',
  version: '1.0',
  webLink: 'https://labs.northline.example/composite-wall',
  browser: 'A current browser on a laptop or desktop.',
  packageLabel: 'Composite Wall VR',
  packageReference: 'NSS-CW-VR-1.0',
  device: 'A supported VR headset.',
  install: 'Install it from the lab’s device manager.',
} as const;

const REASON = 'Please clarify the VR device requirements.';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/ve-editor/spec-shots';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam (set-up only), which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/** The same content as the contract's input, for the set-up of the revise walk. */
const CONTENT = {
  courseId: THERMO,
  name: FLOW_E.name,
  summary: FLOW_E.summary,
  description: FLOW_E.description,
  version: FLOW_E.version,
  formats: ['web', 'vr'],
  delivery: {
    web: {
      format: 'web',
      webLink: FLOW_E.webLink,
      browserAndComputer: FLOW_E.browser,
      notes: null,
    },
    vr: {
      format: 'vr',
      packageLabel: FLOW_E.packageLabel,
      packageReference: FLOW_E.packageReference,
      packageFileName: null,
      deviceNeeded: 'VR headset',
      installNotes: FLOW_E.install,
      notes: null,
    },
  },
  preview: { label: null, link: null },
  documents: [],
};

/** An internal reference no Vendor page shows (the owner's identifier rule, 22 Oct 2026). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference in the page's words (visible or visually hidden), accessible names,
 * titles, placeholders or the browser tab's title (state-copy `VE-02.no-reference`).
 */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const reference = new RegExp(source);
    const hits: string[] = [];
    const visible = document.body.innerText.match(reference);
    if (visible) hits.push(`innerText: ${visible[0]}`);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest('script, style, noscript, template')) continue;
      const hidden = (node.textContent ?? '').match(reference);
      if (hidden) hits.push(`text: ${hidden[0]} in <${node.parentElement?.tagName.toLowerCase()}>`);
    }
    for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
      for (const name of ['aria-label', 'title', 'placeholder']) {
        const value = element.getAttribute(name) ?? '';
        if (reference.test(value)) hits.push(`${name}: ${value}`);
      }
    }
    if (reference.test(document.title)) hits.push(`document.title: ${document.title}`);
    return hits;
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

/** `checkState`, and no internal reference anywhere on the page. */
async function checkState(page: Page, title: string): Promise<void> {
  await checkScreen(page, title);
  await expectNoReferences(page);
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
/** The head's eyebrow (`p.rk-eyebrow`) and the meta line's last words (`div.rk-meta > span`). */
const overline = (page: Page) => main(page).locator('.rk-head .rk-eyebrow');
const idLine = (page: Page) => main(page).locator('.rk-head .rk-meta > span').last();
const summary = (page: Page) => page.locator('#Ve-err');
const button = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
/** A delivery block, by its heading (“Browser · Web link”). */
const panel = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
/** A field by its label (exactly: “Description” is also in the step's name). */
const label = (page: Page, name: string | RegExp) =>
  typeof name === 'string' ? page.getByLabel(name, { exact: true }) : page.getByLabel(name);
const crumb = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name, exact: true });
const leaveDialog = (page: Page) => page.getByRole('dialog', { name: 'Leave without saving?' });

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

async function shot(page: Page, name: string, at?: number): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  const before = page.viewportSize();
  if (at && before && at !== before.width) {
    await page.setViewportSize({ width: at, height: before.height });
  }
  await page.screenshot({
    path: join(SHOTS, `${name}-${at ?? width(page)}.png`),
    fullPage: true,
  });
  if (at && before && at !== before.width) await page.setViewportSize(before);
}

/** Types into a field as a person would (key by key). */
async function type(field: Locator, value: string): Promise<void> {
  await field.click();
  await field.pressSequentially(value);
}

async function stepOne(page: Page): Promise<void> {
  await page.getByRole('combobox', { name: 'Course' }).selectOption(THERMO);
  await type(label(page, 'Experiment name'), FLOW_E.name);
  await type(label(page, 'Summary'), FLOW_E.summary);
  await type(label(page, 'Description'), FLOW_E.description);
  await type(label(page, 'Version'), FLOW_E.version);
}

async function stepTwo(page: Page): Promise<void> {
  await reachAndClick(page, page.getByRole('checkbox', { name: /Browser/ }));
  await reachAndClick(page, page.getByRole('checkbox', { name: /Virtual reality/ }));
  const web = panel(page, 'Browser · Web link');
  await type(web.getByLabel('Web link'), FLOW_E.webLink);
  await type(web.getByLabel('Browser and computer needed'), FLOW_E.browser);
  const vr = panel(page, 'Virtual reality · App package');
  await type(vr.getByLabel('Package label'), FLOW_E.packageLabel);
  await type(vr.getByLabel('Package reference'), FLOW_E.packageReference);
  await type(vr.getByLabel('Device needed'), FLOW_E.device);
  await type(vr.getByLabel('Install notes'), FLOW_E.install);
}

test.describe('VE-03 … VE-06 · Flow E: Anil creates and submits SUB-0077', () => {
  test('the four steps with real typing, Save draft (SUB-0077), leave and come back, Leave without saving?, the confirmation → the outcome card', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(NEW);
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    const document = await markDocument(page);

    // VE-03: the head, the breadcrumbs, the sections, only ME ZG523.
    await expect(overline(page)).toHaveText('Create experiment · Step 1 of 4');
    await expect(idLine(page)).toHaveText('Not saved yet');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      'Create experiment',
    );
    await expect(page.getByRole('group', { name: 'Course and name' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Course' }).locator('option')).toHaveText([
      'Choose a course',
      'ME ZG523 · Thermodynamics & Heat Transfer',
    ]);
    // Course-restricted (Anil holds ME ZG523): the hint states the restriction (PC-77).
    await expect(page.getByRole('combobox', { name: 'Course' })).toHaveAccessibleDescription(
      'Only the courses the platform team assigned to you are listed.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    // The aside outline on wide layouts, the top stepper on narrow ones — never both.
    const aside = page.locator('aside.ve-edaside');
    const stepper = page.locator('nav.ve-steps');
    if (width(page) === 1440) {
      await expect(aside).toBeVisible();
      await expect(stepper).toBeHidden();
      await expect(aside.locator('.vr-sub')).toContainText('Course and name');
    } else {
      await expect(aside).toBeHidden();
      await expect(stepper).toBeVisible();
    }
    await checkState(page, 'Course and description');
    await shot(page, 'VE-03_new');

    // Continue with nothing entered — the summary takes focus.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page)).toBeFocused();
    await expect(summary(page).locator('li a')).toHaveText([
      'Choose a course',
      'Enter the experiment name',
      'Enter a one-sentence summary',
      'Enter a description',
      'Enter a version, for example 1.0',
    ]);
    await expect(label(page, 'Experiment name')).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Course and description');
    await shot(page, 'VE-03_validation');

    // The name of the published “Composite Wall Conduction” is the service's answer.
    await type(label(page, 'Experiment name'), 'Composite Wall Conduction');
    await page.getByRole('combobox', { name: 'Course' }).selectOption(THERMO);
    await type(label(page, 'Summary'), FLOW_E.summary);
    await type(label(page, 'Description'), FLOW_E.description);
    await type(label(page, 'Version'), FLOW_E.version);
    await reachAndClick(page, button(page, 'Continue'));
    const taken =
      'An experiment called “Composite Wall Conduction” already exists. Choose a different name.';
    await expect(summary(page).locator('li a')).toHaveText([taken]);
    await expect(page.locator('#Ve-name-e')).toHaveText(taken);
    await checkState(page, 'Course and description');
    await shot(page, 'VE-03_name-taken');
    await label(page, 'Experiment name').fill('');
    await type(label(page, 'Experiment name'), FLOW_E.name);

    // Save draft — the first save mints SUB-0077; the draft's own address, no new document.
    await reachAndClick(page, button(page, 'Save draft'));
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-0077\/edit$/);
    await expect(idLine(page)).toHaveText('Only you can see a draft', {
      timeout: 60_000,
    });
    await expect(overline(page)).toHaveText('Edit draft · Step 1 of 4');
    await expect(page.locator('#Ve-saved')).toHaveText(
      /^Draft saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/,
    );
    await expect(page.locator('#Ve-saved')).toBeFocused();
    await expect(label(page, 'Experiment name')).toHaveValue(FLOW_E.name);
    await expectSameDocument(page, document);
    await checkState(page, 'Course and description');
    await shot(page, 'VE-03_saved');

    // VE-04: Continue, choose WEB and VR, type the delivery (not saved yet).
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-0077\/edit\?step=formats$/);
    await expect(overline(page)).toHaveText('Edit draft · Step 2 of 4');
    // No format chosen.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page).locator('li a')).toHaveText(['Choose at least one format']);
    await checkState(page, 'Formats and delivery');
    await shot(page, 'VE-04_no-format');
    await stepTwo(page);
    await expect(page.locator('#Ve-err')).toHaveCount(0);
    await expect(panel(page, 'Browser · Web link').locator('.vr-dlv-st')).toHaveText('Complete');
    await expect(main(page).locator('.vr-sec-st[role="status"]')).toHaveText(
      '2 of 2 formats complete',
    );
    await checkState(page, 'Formats and delivery');
    await shot(page, 'VE-04_two-formats');

    // Leave through a link with unsaved changes: “Leave without saving?” — Keep editing keeps it.
    await reachAndClick(page, crumb(page, 'My experiments'));
    await expect(leaveDialog(page)).toBeVisible();
    await expect(
      leaveDialog(page).getByRole('heading', { name: 'Leave without saving?' }),
    ).toBeFocused();
    await expect(leaveDialog(page)).toContainText(
      'Your changes since you last saved will be lost. Save a draft first to keep them.',
    );
    // As the export draws it: no body, Keep editing and the navy “Leave without saving”.
    await expect(leaveDialog(page).locator('.rk-dlg-body')).toHaveCount(0);
    await expect(
      leaveDialog(page).getByRole('button', { name: 'Leave without saving' }),
    ).toHaveAttribute('class', 'rb-btn rb-btn--navy rb-btn--lg');
    await shot(page, 'VE-04_leave-guard');
    await reachAndClick(page, leaveDialog(page).getByRole('button', { name: 'Keep editing' }));
    await expect(leaveDialog(page)).toBeHidden();
    await expect(heading(page, 'Formats and delivery')).toBeVisible();
    await expect(panel(page, 'Browser · Web link').getByLabel('Web link')).toHaveValue(
      FLOW_E.webLink,
    );

    // Leave for My experiments and come back (in-app, unguarded): what was typed is kept.
    await softNavigate(page, LIST);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('checkbox', { name: /Virtual reality/ })).toBeChecked();
    await expect(
      panel(page, 'Virtual reality · App package').getByLabel('Device needed'),
    ).toHaveValue(FLOW_E.device);
    await expect(panel(page, 'Browser · Web link').getByLabel('Web link')).toHaveValue(
      FLOW_E.webLink,
    );
    await expectSameDocument(page, document);

    // VE-05: everything optional.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('p.vr-empty')).toHaveText('No documents added.');
    await checkState(page, 'Preview and documents');
    await shot(page, 'VE-05_preview');

    // VE-06: everything required is provided; one review section per step.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-notice--ok')).toContainText(
      'Everything required is provided',
    );
    await expect(
      page.getByRole('region', { name: 'Course and description', exact: true }).locator('dd'),
    ).toHaveText([
      FLOW_E.name,
      'ME ZG523 · Thermodynamics & Heat Transfer',
      '1.0',
      FLOW_E.summary,
      FLOW_E.description,
    ]);
    await expect(
      page.getByRole('region', { name: 'Formats and delivery', exact: true }).locator('.vr-dlv'),
    ).toHaveCount(2);
    await expect(
      page.getByRole('region', { name: /^Preview and documents/ }).locator('dd'),
    ).toHaveText(['None', 'None']);
    await expect(main(page).locator('p.ve-submitnote')).toHaveText(
      'Submitting sends it to the Academic Reviewer. It does not publish anything.',
    );
    await checkState(page, 'Check and submit');
    await shot(page, 'VE-06_ready');

    // The confirmation beside Submit — “It does not publish anything”.
    await reachAndClick(page, button(page, 'Submit for academic review'));
    const dialog = page.getByRole('dialog', { name: 'Submit for academic review?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.',
    );
    await expect(dialog).toContainText('What happens now');
    await shot(page, 'VE-06_dialog');
    await reachAndClick(
      page,
      dialog.getByRole('button', { name: 'Submit for academic review', exact: true }),
    );

    // The outcome card: Submitted for academic review, with the record and My experiments.
    await expect(heading(page, 'Submitted for academic review')).toBeVisible({ timeout: 60_000 });
    const card = page.locator('#Ve-done');
    await expect(card.locator('.rk-eyebrow')).toHaveText('Conduction Through a Composite Wall');
    await expect(card).toContainText(
      'It is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
    );
    await expect(card.locator('.vr-facts .xr-st')).toHaveText('With Academic Reviewer');
    await expect(
      main(page).getByRole('link', { name: 'Open the experiment record' }),
    ).toHaveAttribute('href', '/vendor/experiments/SUB-0077');
    await expect(heading(page, 'Submitted for academic review')).toBeFocused();
    await checkState(page, 'Submitted for academic review');
    await shot(page, 'VE-06_submitted');
    // The one world: it is with the Academic Reviewer, revision 1, and nothing is published.
    const review = await port<{
      readonly submission: {
        readonly revision: number;
        readonly status: { readonly state: string };
      };
    }>(page, MENON, 'production', 'getSubmissionForReview', 'SUB-0077');
    expect(review.submission).toMatchObject({
      revision: 1,
      status: { state: 'with-academic-reviewer' },
    });
    await expectSameDocument(page, document);
  });

  test('the drawn validation of steps 2–4, Attach file and the sample documents', async ({
    page,
  }) => {
    test.skip(width(page) !== 1024 && width(page) !== 375, 'two widths cover these states');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(NEW);
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    await stepOne(page);
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    // A link without https://, an empty VR block but its label.
    await reachAndClick(page, page.getByRole('checkbox', { name: /Browser/ }));
    await reachAndClick(page, page.getByRole('checkbox', { name: /Virtual reality/ }));
    await type(
      panel(page, 'Browser · Web link').getByLabel('Web link'),
      'labs.northline.example/composite-wall',
    );
    const vr = panel(page, 'Virtual reality · App package');
    await type(vr.getByLabel('Package label'), 'Composite Wall — VR build 1.0');
    await expect(vr.locator('.vr-dlv-st')).toHaveText('3 still needed');
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page).locator('li a')).toHaveText([
      'Enter a web link that starts with https://',
      'Say which browser and computer WEB needs',
      'Enter a package reference for VR, or attach the package file',
      'Say which device VR needs',
      'Add install notes for VR',
    ]);
    await expect(vr.locator('.vr-dlv-st')).toHaveText('3 to fix');
    await checkState(page, 'Formats and delivery');
    await shot(page, 'VE-04_validation');
    // Attach file: a sample name instead of a reference, nothing uploaded.
    await reachAndClick(page, vr.getByRole('button', { name: 'Attach the VR package file' }));
    await expect(vr.locator('.ve-file')).toContainText(
      'conduction-through-a-composite-wall-vr-1.0.zip',
    );
    await expect(page.locator('#Ve-VR_ref-e')).toHaveCount(0);
    await panel(page, 'Browser · Web link').getByLabel('Web link').fill('');
    await type(panel(page, 'Browser · Web link').getByLabel('Web link'), FLOW_E.webLink);
    await type(
      panel(page, 'Browser · Web link').getByLabel('Browser and computer needed'),
      FLOW_E.browser,
    );
    await type(vr.getByLabel('Device needed'), 'VR headset');
    await type(vr.getByLabel('Install notes'), FLOW_E.install);
    await expect(vr.locator('.vr-dlv-st')).toHaveText('Complete');
    await checkState(page, 'Formats and delivery');
    await shot(page, 'VE-04_attached');
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });

    // A label without a link; two sample documents.
    await type(label(page, /^Preview label/), 'Two-minute walkthrough');
    await reachAndClick(page, button(page, 'Add document'));
    await reachAndClick(page, button(page, 'Add document'));
    await expect(main(page).locator('ul.ve-files > li')).toHaveCount(2);
    await reachAndClick(page, button(page, 'Continue'));
    const missingLink = 'Add a preview link for “Two-minute walkthrough”, or remove the label';
    await expect(summary(page).locator('li a')).toHaveText([missingLink]);
    await checkState(page, 'Preview and documents');
    await shot(page, 'VE-05_preview-error');

    // On to the check; Submit lists what is missing.
    await label(page, /^Preview label/).fill('');
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, button(page, 'Back'));
    await expect(heading(page, 'Preview and documents')).toBeVisible();
    await reachAndClick(page, button(page, 'Back'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible();
    await panel(page, 'Virtual reality · App package').getByLabel('Device needed').fill('');
    await type(label(page, /^Notes for WEB/), 'Works offline once loaded.');
    await panel(page, 'Browser · Web link').getByLabel('Web link').fill('');
    await reachAndClick(page, button(page, 'Save draft'));
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-\d{4}\/edit\?step=formats$/);
    await softNavigate(page, new URL(page.url()).pathname + '?step=submit');
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.rk-notice--warn')).toContainText(
      '2 things to finish before you can submit',
    );
    await reachAndClick(page, button(page, 'Submit for academic review'));
    await expect(page.locator('#Ve-miss')).toBeFocused();
    await expect(page.locator('#Ve-miss li')).toHaveText([
      'Enter the web link for WEB Go to formats and delivery',
      'Say which device VR needs Go to formats and delivery',
    ]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, 'Check and submit');
    await shot(page, 'VE-06_missing');
    // “Go to formats and delivery” opens the step with its errors, focus on the field.
    await reachAndClick(page, page.locator('#Ve-miss li').nth(1).getByRole('link'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible();
    await expect(
      panel(page, 'Virtual reality · App package').getByLabel('Device needed'),
    ).toBeFocused();
  });

  test('Leave without saving? from the Menu drawer: Keep editing keeps every value, Leave goes on', async ({
    page,
  }) => {
    test.skip(width(page) >= 1024, 'the drawer exists below 1024 px');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(NEW);
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    await type(label(page, 'Experiment name'), 'Half-typed name');
    await reachAndClick(page, page.getByRole('button', { name: 'Menu', exact: true }));
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await reachAndClick(page, drawer.getByRole('link', { name: /Overview/ }));
    await expect(leaveDialog(page)).toBeVisible();
    await expect(drawer).toHaveCount(0);
    await reachAndClick(page, leaveDialog(page).getByRole('button', { name: 'Keep editing' }));
    await expect(leaveDialog(page)).toBeHidden();
    await expect(label(page, 'Experiment name')).toHaveValue('Half-typed name');
    await reachAndClick(page, page.getByRole('button', { name: 'Menu', exact: true }));
    await reachAndClick(page, drawer.getByRole('link', { name: /Overview/ }));
    await reachAndClick(
      page,
      leaveDialog(page).getByRole('button', { name: 'Leave without saving' }),
    );
    await expect(page).toHaveURL(/\/vendor$/, { timeout: 60_000 });
  });
});

test.describe('VE-09 Edit draft · read-only', () => {
  test('SUB-0083: the course is no longer assigned — “What you entered”, nothing to change', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor/experiments/SUB-0083/edit');
    await expect(heading(page, 'Surface Roughness in Turning')).toBeVisible({ timeout: 90_000 });
    await expect(overline(page)).toHaveText('Experiment');
    await expect(main(page).locator('.rk-meta .xr-st')).toHaveText('Draft · read-only');
    await expect(main(page).locator('.rk-notice--warn .rk-notice-t')).toHaveText(
      'MEL ZG512 is no longer assigned to you',
    );
    await expect(page.getByRole('region', { name: 'What you entered' })).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Save draft' })).toHaveCount(0);
    await checkState(page, 'Surface Roughness in Turning');
    await shot(page, 'VE-09_readonly');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Back to My experiments' }));
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));

    // Ask for help opens the report form, its “Where” filled from this page (LINK-MAP L45).
    await page.goto('/vendor/experiments/SUB-0083/edit');
    await expect(heading(page, 'Surface Roughness in Turning')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Ask for help' }));
    await expect(page).toHaveURL(/\/vendor\/help\/report$/);
    await expect(heading(page, 'Report a problem')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel('Where did it happen?')).toHaveValue(/^My experiments/);
    await expectSameDocument(page, mark);
  });

  test('SUB-0074: approved — the refusal with the record and My experiments', async ({ page }) => {
    test.skip(width(page) !== 1440 && width(page) !== 375, 'two widths cover the refusal');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor/experiments/SUB-0074/edit');
    const title = 'This experiment was approved by the Academic Reviewer';
    await expect(heading(page, title)).toBeVisible({ timeout: 90_000 });
    await expect(main(page)).toContainText(
      'It is with the Content Manager. Nothing is needed from you now.',
    );
    await expect(main(page).locator('.rk-state > .rk-eyebrow')).toHaveText('Transient Cooling');
    await checkState(page, title);
    await shot(page, 'VE-09_refused');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open the experiment record' }));
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-0074$/);
  });
});

test.describe('VE-08 Revise and resubmit · Flow E E2', () => {
  test('returned by Prof. A. Menon: the reason first, a reference to the field, Save changes, Resubmit → Submitted; the stale link refused; the queue holds revision 2', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(LIST);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 90_000 });
    // Set-up only: E1 through Anil's own port, then Prof. A. Menon returns it (B6-03).
    const draft = await port<{ readonly id: string; readonly rev: number }>(
      page,
      ANIL,
      'production',
      'saveDraft',
      { id: null, content: CONTENT, step: 'course', expectedRev: null },
    );
    expect(draft.id).toBe('SUB-0077');
    const sent = await port<{ readonly rev: number }>(page, ANIL, 'production', 'submitForReview', {
      id: draft.id,
      content: CONTENT,
      expectedRev: draft.rev,
    });
    await port(page, MENON, 'production', 'returnSubmission', {
      id: draft.id,
      reason: REASON,
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: OUTCOMES,
      expectedRev: sent.rev,
    });
    const document = await markDocument(page);

    // The returned reason first, focused; then the editor.
    await softNavigate(page, '/vendor/experiments/SUB-0077/revise');
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 60_000 });
    await expect(overline(page)).toHaveText('Revise and resubmit · Step 1 of 4', {
      timeout: 60_000,
    });
    await expect(idLine(page)).toHaveText('Revision 1 was returned');
    const reason = page.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason.locator('blockquote')).toHaveText(REASON);
    await expect(reason.locator('.vr-ret-m')).toHaveText(/ · Prof\. A\. Menon$/);
    await expect(reason).toBeFocused();
    await checkState(page, 'Course and description');
    await shot(page, 'VE-08_revise-step1');

    // “What it refers to” opens Formats and delivery with focus on the VR device need, tagged.
    await reachAndClick(
      page,
      reason.getByRole('button', { name: 'Go to Formats & delivery · VR · Device need' }),
    );
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/SUB-0077\/revise\?step=formats$/);
    const vr = panel(page, 'Virtual reality · App package');
    const device = vr.getByLabel('Device needed');
    await expect(device).toBeFocused();
    await expect(vr.locator('.ve-reftag')).toHaveText('Referred to in the return');
    await shot(page, 'VE-08_ref-jump');
    await device.fill('');
    await device.pressSequentially('Meta Quest 3 standalone headset — no PC needed.');
    await reachAndClick(page, button(page, 'Save changes'));
    await expect(page.locator('#Ve-saved')).toHaveText(
      /^Changes saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · not resubmitted yet$/,
    );
    await checkState(page, 'Formats and delivery');
    await shot(page, 'VE-08_changes-saved');

    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await expect(overline(page)).toHaveText('Revise and resubmit · Step 4 of 4');
    await expect(page.getByRole('region', { name: 'Learning outcomes' }).locator('li')).toHaveText(
      OUTCOMES,
    );
    await expect(main(page).locator('p.ve-submitnote')).toHaveText(
      'Resubmitting sends your changes for review. It does not publish anything.',
    );
    await checkState(page, 'Check and submit');
    await shot(page, 'VE-08_check');

    // The confirmation, then the outcome: “Submitted” — no stage named (M-3).
    await reachAndClick(page, button(page, 'Resubmit'));
    const dialog = page.getByRole('dialog', { name: 'Resubmit your changes?' });
    await expect(dialog).toContainText(
      'Your changes are submitted for review. This does not publish anything.',
    );
    await expect(dialog).toContainText('Your changes are sent as revision 2.');
    await shot(page, 'VE-08_dialog');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Resubmit', exact: true }));
    await expect(heading(page, 'Submitted')).toBeVisible({ timeout: 60_000 });
    const card = page.locator('#Ve-done');
    await expect(card).toContainText('Your changes have been submitted for review.');
    await expect(card.locator('.rk-eyebrow')).toHaveText('Conduction Through a Composite Wall');
    await expect(card.locator('.vr-facts .xr-st')).toHaveText('Submitted');
    await expect(card).not.toContainText('Reviewer');
    await expect(card).not.toContainText('Content Manager');
    await checkState(page, 'Submitted');
    await shot(page, 'VE-08_submitted');
    await expectSameDocument(page, document);

    // The stale revise link, opened again from My experiments: “This experiment was already submitted”.
    await softNavigate(page, LIST);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await softNavigate(page, '/vendor/experiments/SUB-0077/revise');
    await expect(heading(page, 'This experiment was already submitted')).toBeVisible({
      timeout: 60_000,
    });
    await checkState(page, 'This experiment was already submitted');
    await shot(page, 'VE-08_already-submitted');

    // The one world: the reviewer's queue holds SUB-0077 at revision 2 (PC-66 routing stand-in).
    const queue = await port<readonly { readonly ref: { readonly id: string } }[]>(
      page,
      MENON,
      'production',
      'getReviewQueue',
      {},
    );
    expect(queue.map((item) => item.ref.id)).toContain('SUB-0077');
    const review = await port<{
      readonly submission: {
        readonly revision: number;
        readonly status: { readonly state: string; readonly reason?: string };
        readonly content: { readonly delivery: { readonly vr: { readonly deviceNeeded: string } } };
      };
    }>(page, MENON, 'production', 'getSubmissionForReview', 'SUB-0077');
    expect(review.submission.revision).toBe(2);
    expect(review.submission.status).toMatchObject({
      state: 'with-academic-reviewer',
      reason: 'resubmission',
    });
    expect(review.submission.content.delivery.vr.deviceNeeded).toBe(
      'Meta Quest 3 standalone headset — no PC needed.',
    );
  });

  test('SUB-0081 returned with two references; the record’s `field=` opens the field', async ({
    page,
  }) => {
    test.skip(width(page) !== 1024, 'one width covers these states');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor/experiments/SUB-0081/revise');
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    const reason = page.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason.getByRole('button')).toHaveText([
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
    ]);
    await checkState(page, 'Course and description');
    // The record's chip names the field: a fresh opening at that step focuses it.
    await page.goto('/vendor/experiments/SUB-0081/revise?step=formats&field=ar.install-notes');
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(
      panel(page, 'Augmented reality · App package').getByLabel('Install notes'),
    ).toBeFocused();
  });
});
