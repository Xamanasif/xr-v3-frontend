import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * The experiment editor — VE-03 … VE-06 (boards B5-03, B5-04, B5-05), VE-09 Edit draft and VE-08
 * Revise and resubmit (B5-07; B5-08 f0) — on the test-hook build at 1440, 1024, 768 and 375. Each
 * drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets,
 * no developer surface, no sideways scroll). World: spine-start as Anil Shetty (Northline
 * Simulation Studio, ME ZG523 only). Flow E's E1 is done with real clicks and typing: Anil creates
 * “Conduction Through a Composite Wall” (the contract suite's content) through the four steps,
 * saves the draft (the first save mints SUB-0077), leaves and comes back with what he typed kept,
 * and submits through DL-1. The revise walk: the CI seam only SETS UP the world — Anil's SUB-0077
 * submitted through his own port and returned by Prof. A. Menon — then Anil revises with real
 * clicks and typing and resubmits; he reads “Submitted” (M-3) and the reviewer's queue holds
 * revision 2 (the routing stand-in, PC-66), read through the seam.
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/vendor-editor';

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

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const overline = (page: Page) => main(page).locator('.xr-phead .xr-overline');
const idLine = (page: Page) => main(page).locator('.xr-phead-meta .xl-meta');
const summary = (page: Page) => page.locator('#Ve-err');
const button = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
const panel = (page: Page, name: string) => page.getByRole('region', { name });

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
  await type(page.getByLabel('Experiment name'), FLOW_E.name);
  await type(page.getByLabel('Summary'), FLOW_E.summary);
  await type(page.getByLabel('Description'), FLOW_E.description);
  await type(page.getByLabel('Version'), FLOW_E.version);
}

async function stepTwo(page: Page): Promise<void> {
  await reachAndClick(page, page.getByRole('checkbox', { name: /Browser \(WEB\)/ }));
  await reachAndClick(page, page.getByRole('checkbox', { name: /Virtual reality \(VR\)/ }));
  const web = panel(page, 'Browser (WEB) · Web link');
  await type(web.getByLabel('Web link'), FLOW_E.webLink);
  await type(web.getByLabel('Browser and computer needed'), FLOW_E.browser);
  const vr = panel(page, 'Virtual reality (VR) · App package');
  await type(vr.getByLabel('Package label'), FLOW_E.packageLabel);
  await type(vr.getByLabel('Package reference'), FLOW_E.packageReference);
  await type(vr.getByLabel('Device needed'), FLOW_E.device);
  await type(vr.getByLabel('Install notes'), FLOW_E.install);
}

test.describe('VE-03 … VE-06 · Flow E: Anil creates and submits SUB-0077', () => {
  test('the four steps with real typing, Save draft (SUB-0077), leave and come back, DL-1 → Submitted', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(NEW);
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    const document = await markDocument(page);

    // B5-03 f0 (f1 at 768, f2 at 375): the header, the stepper, only ME ZG523.
    await expect(overline(page)).toHaveText('Create experiment · Step 1 of 4');
    await expect(idLine(page)).toHaveText('Not saved yet');
    await expect(page.getByRole('combobox', { name: 'Course' }).locator('option')).toHaveText([
      'Choose a course',
      'ME ZG523 · Thermodynamics & Heat Transfer',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await checkState(page, 'Course and description');
    if (width(page) === 1440) await shot(page, 'B5-03-f0');
    if (width(page) === 768) await shot(page, 'B5-03-f1');
    if (width(page) === 375) await shot(page, 'B5-03-f2');

    // f3: Continue with nothing entered — the summary takes focus.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page)).toBeFocused();
    await expect(summary(page).locator('li a')).toHaveText([
      'Choose a course',
      'Enter the experiment name',
      'Enter a one-sentence summary',
      'Enter a description',
      'Enter a version, for example 1.0',
    ]);
    await expect(page.getByLabel('Experiment name')).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Course and description');
    if (width(page) === 1024) await shot(page, 'B5-03-f3', 1080);

    // f4: the name of the published “Composite Wall Conduction” is the service's answer.
    await type(page.getByLabel('Experiment name'), 'Composite Wall Conduction');
    await page.getByRole('combobox', { name: 'Course' }).selectOption(THERMO);
    await type(page.getByLabel('Summary'), FLOW_E.summary);
    await type(page.getByLabel('Description'), FLOW_E.description);
    await type(page.getByLabel('Version'), FLOW_E.version);
    await reachAndClick(page, button(page, 'Continue'));
    const taken =
      'An experiment called “Composite Wall Conduction” already exists. Choose a different name.';
    await expect(summary(page).locator('li a')).toHaveText([taken]);
    await expect(page.locator('#Ve-name-e')).toHaveText(taken);
    await checkState(page, 'Course and description');
    if (width(page) === 1024) await shot(page, 'B5-03-f4', 1080);
    await page.getByLabel('Experiment name').fill('');
    await type(page.getByLabel('Experiment name'), FLOW_E.name);

    // f6: Save draft — the first save mints SUB-0077; the draft's own address, no new document.
    await reachAndClick(page, button(page, 'Save draft'));
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-0077\/edit$/);
    await expect(idLine(page)).toHaveText('SUB-0077 · draft', { timeout: 60_000 });
    await expect(overline(page)).toHaveText('Edit draft · Step 1 of 4');
    await expect(page.locator('#Ve-saved')).toHaveText(
      /^Draft saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/,
    );
    await expect(page.locator('#Ve-saved')).toBeFocused();
    await expect(page.getByLabel('Experiment name')).toHaveValue(FLOW_E.name);
    await expectSameDocument(page, document);
    await checkState(page, 'Course and description');
    if (width(page) === 1024) await shot(page, 'B5-03-f6', 1080);

    // VE-04: Continue, tick WEB and VR, type the delivery (not saved yet).
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-0077\/edit\?step=formats$/);
    await expect(overline(page)).toHaveText('Edit draft · Step 2 of 4');
    if (width(page) === 1440) await shot(page, 'B5-04-f0');
    // f5: no format chosen.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page).locator('li a')).toHaveText(['Choose at least one format']);
    await checkState(page, 'Formats and delivery');
    if (width(page) === 1024) await shot(page, 'B5-04-f5', 1080);
    await stepTwo(page);
    await expect(page.locator('#Ve-err')).toHaveCount(0);
    await checkState(page, 'Formats and delivery');
    if (width(page) === 1024) await shot(page, 'B5-04-f3', 1080);
    if (width(page) === 375) await shot(page, 'B5-04-f2');

    // Leave for My experiments and come back (in-app): what was typed is kept (`VE-03.kept`).
    await reachAndClick(page, main(page).locator('a.xr-back'));
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('checkbox', { name: /Virtual reality \(VR\)/ })).toBeChecked();
    await expect(
      panel(page, 'Virtual reality (VR) · App package').getByLabel('Device needed'),
    ).toHaveValue(FLOW_E.device);
    await expect(panel(page, 'Browser (WEB) · Web link').getByLabel('Web link')).toHaveValue(
      FLOW_E.webLink,
    );
    await expectSameDocument(page, document);

    // VE-05: everything optional.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });
    await expect(main(page)).toContainText('No documents added.');
    await checkState(page, 'Preview and documents');
    if (width(page) === 1024) await shot(page, 'B5-05-f3', 1080);

    // VE-06: everything required is provided.
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-notice--ok')).toContainText(
      'Everything required is provided',
    );
    await expect(main(page).locator('dl.xv-kv > dd')).toHaveText([
      FLOW_E.name,
      'ME ZG523 · Thermodynamics & Heat Transfer',
      '1.0',
      'WEB · VR',
      'None',
      'None',
    ]);
    await checkState(page, 'Check and submit');
    if (width(page) === 1440) await shot(page, 'B5-05-f0');
    if (width(page) === 375) await shot(page, 'B5-05-f2');

    // f6: DL-1 beside Submit — “It does not publish anything”.
    await reachAndClick(page, button(page, 'Submit for academic review'));
    const dialog = page.getByRole('dialog', { name: 'Submit for academic review?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.',
    );
    if (width(page) === 1024) await shot(page, 'B5-05-f6', 1080);
    await reachAndClick(
      page,
      dialog.getByRole('button', { name: 'Submit for academic review', exact: true }),
    );

    // f1: Submitted for academic review, with the record and My experiments.
    await expect(heading(page, 'Submitted for academic review')).toBeVisible({ timeout: 60_000 });
    await expect(main(page)).toContainText(
      'SUB-0077 · Conduction Through a Composite Wall is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
    );
    await expect(
      main(page).getByRole('link', { name: 'Open the experiment record' }),
    ).toHaveAttribute('href', '/vendor/experiments/SUB-0077');
    await expect(page.locator('#Ve-done')).toBeFocused();
    await checkState(page, 'Submitted for academic review');
    if (width(page) === 768) await shot(page, 'B5-05-f1', 720);
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

  test('the drawn validation of steps 2–4 (B5-04 f4, B5-05 f4, f5) and the sample file names', async ({
    page,
  }) => {
    test.skip(width(page) !== 1024 && width(page) !== 375, 'two widths cover these states');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(NEW);
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    await stepOne(page);
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    // f4: a link without https://, an empty VR panel but its label.
    await reachAndClick(page, page.getByRole('checkbox', { name: /Browser \(WEB\)/ }));
    await reachAndClick(page, page.getByRole('checkbox', { name: /Virtual reality \(VR\)/ }));
    await type(
      panel(page, 'Browser (WEB) · Web link').getByLabel('Web link'),
      'labs.northline.example/composite-wall',
    );
    const vr = panel(page, 'Virtual reality (VR) · App package');
    await type(vr.getByLabel('Package label'), 'Composite Wall — VR build 1.0');
    await reachAndClick(page, button(page, 'Continue'));
    await expect(summary(page).locator('li a')).toHaveText([
      'Enter a web link that starts with https://',
      'Say which browser and computer WEB needs',
      'Enter a package reference for VR, or attach the package file',
      'Say which device VR needs',
      'Add install notes for VR',
    ]);
    await checkState(page, 'Formats and delivery');
    if (width(page) === 1024) await shot(page, 'B5-04-f4', 1080);
    // f1: a package file instead of a reference — a sample name, nothing uploaded.
    await reachAndClick(page, vr.getByRole('button', { name: 'Choose file' }));
    await expect(vr.locator('.xv-file')).toContainText(
      'conduction-through-a-composite-wall-vr-1.0.zip',
    );
    await expect(page.locator('#Ve-VR_ref-e')).toHaveCount(0);
    await panel(page, 'Browser (WEB) · Web link').getByLabel('Web link').fill('');
    await type(panel(page, 'Browser (WEB) · Web link').getByLabel('Web link'), FLOW_E.webLink);
    await type(
      panel(page, 'Browser (WEB) · Web link').getByLabel('Browser and computer needed'),
      FLOW_E.browser,
    );
    await type(vr.getByLabel('Device needed'), 'VR headset');
    await type(vr.getByLabel('Install notes'), FLOW_E.install);
    await checkState(page, 'Formats and delivery');
    if (width(page) === 1024) await shot(page, 'B5-04-f1', 720);
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });

    // B5-05 f4: a label without a link; two sample documents.
    await type(page.getByLabel(/^Preview label/), 'Two-minute walkthrough');
    await reachAndClick(page, button(page, 'Add document'));
    await reachAndClick(page, button(page, 'Add document'));
    await expect(main(page).locator('ul.xv-files > li')).toHaveCount(2);
    await reachAndClick(page, button(page, 'Continue'));
    const label = 'Add a preview link for “Two-minute walkthrough”, or remove the label';
    await expect(summary(page).locator('li a')).toHaveText([label]);
    await checkState(page, 'Preview and documents');
    if (width(page) === 1024) await shot(page, 'B5-05-f4', 1080);

    // B5-05 f5: on to the check by the stepper's address; Submit lists what is missing.
    await page.getByLabel(/^Preview label/).fill('');
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, button(page, 'Back'));
    await expect(heading(page, 'Preview and documents')).toBeVisible();
    await reachAndClick(page, button(page, 'Back'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible();
    await panel(page, 'Virtual reality (VR) · App package').getByLabel('Device needed').fill('');
    await type(page.getByLabel(/^Notes for WEB/), 'Works offline once loaded.');
    await panel(page, 'Browser (WEB) · Web link').getByLabel('Web link').fill('');
    await reachAndClick(page, button(page, 'Save draft'));
    await expect(page).toHaveURL(/\/vendor\/experiments\/SUB-\d{4}\/edit\?step=formats$/);
    await softNavigate(page, new URL(page.url()).pathname + '?step=submit');
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      '2 things to finish before you can submit',
    );
    await reachAndClick(page, button(page, 'Submit for academic review'));
    await expect(page.locator('#Ve-miss')).toBeFocused();
    await expect(page.locator('#Ve-miss li > span')).toHaveText([
      'Enter the web link for WEB',
      'Say which device VR needs',
    ]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, 'Check and submit');
    if (width(page) === 1024) await shot(page, 'B5-05-f5', 1080);
    // “Go to formats and delivery” opens the step with its errors, focus on the field.
    await reachAndClick(page, page.locator('#Ve-miss li').nth(1).getByRole('button'));
    await expect(heading(page, 'Formats and delivery')).toBeVisible();
    await expect(
      panel(page, 'Virtual reality (VR) · App package').getByLabel('Device needed'),
    ).toBeFocused();
  });
});

test.describe('VE-09 Edit draft · read-only (B5-07 f6)', () => {
  test('SUB-0083: the course is no longer assigned — “What you entered”, nothing to change', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor/experiments/SUB-0083/edit');
    await expect(heading(page, 'Surface Roughness in Turning')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText('SUB-0083 · MEL ZG512');
    await expect(main(page).locator('.xr-notice--warn .xr-notice-title')).toHaveText(
      'MEL ZG512 is no longer assigned to you',
    );
    await expect(page.getByRole('region', { name: 'What you entered' })).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Save draft' })).toHaveCount(0);
    await checkState(page, 'Surface Roughness in Turning');
    if (width(page) === 1024) await shot(page, 'B5-07-f6', 1080);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Back to My experiments' }));
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
  });
});

test.describe('VE-08 Revise and resubmit · Flow E E2', () => {
  test('returned by Prof. A. Menon: the reason, a reference to the field, Save changes, Resubmit → Submitted; the queue holds revision 2', async ({
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

    // B5-07 f0 (f7 at 768, f8 at 375): the reason first, then the editor.
    await softNavigate(page, '/vendor/experiments/SUB-0077/revise');
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 60_000 });
    await expect(overline(page)).toHaveText('Revise and resubmit · Step 1 of 4', {
      timeout: 60_000,
    });
    await expect(idLine(page)).toHaveText('SUB-0077 · revision 1 was returned');
    const reason = page.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason.locator('blockquote')).toHaveText(REASON);
    await expect(reason.locator('.xr-meta')).toHaveText(/ · Prof\. A\. Menon$/);
    await checkState(page, 'Course and description');
    if (width(page) === 1440) await shot(page, 'B5-07-f0');
    if (width(page) === 768) await shot(page, 'B5-07-f7');
    if (width(page) === 375) await shot(page, 'B5-07-f8');

    // “What it refers to” opens Formats and delivery with focus on the VR device need.
    await reachAndClick(
      page,
      reason.getByRole('button', { name: 'Go to Formats & delivery · VR · Device need' }),
    );
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/SUB-0077\/revise\?step=formats$/);
    const device = panel(page, 'Virtual reality (VR) · App package').getByLabel('Device needed');
    await expect(device).toBeFocused();
    await device.fill('');
    await device.pressSequentially('Meta Quest 3 standalone headset — no PC needed.');
    await reachAndClick(page, button(page, 'Save changes'));
    await expect(page.locator('#Ve-saved')).toHaveText(
      /^Changes saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · not resubmitted yet$/,
    );
    await checkState(page, 'Formats and delivery');

    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Preview and documents')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, button(page, 'Continue'));
    await expect(heading(page, 'Check and submit')).toBeVisible({ timeout: 60_000 });
    await expect(overline(page)).toHaveText('Revise and resubmit · Step 4 of 4');
    await expect(page.getByRole('region', { name: 'Learning outcomes' }).locator('li')).toHaveText(
      OUTCOMES,
    );
    await checkState(page, 'Check and submit');
    if (width(page) === 1024) await shot(page, 'B5-07-f3', 1080);

    // DL-1, then f4: “Submitted” — no gate named (M-3).
    await reachAndClick(page, button(page, 'Resubmit'));
    const dialog = page.getByRole('dialog', { name: 'Resubmit your changes?' });
    await expect(dialog).toContainText(
      'Your changes are submitted for review. This does not publish anything.',
    );
    await reachAndClick(page, dialog.getByRole('button', { name: 'Resubmit', exact: true }));
    await expect(heading(page, 'Submitted')).toBeVisible({ timeout: 60_000 });
    await expect(main(page)).toContainText('Your changes have been submitted for review.');
    await expect(main(page)).toContainText(
      'SUB-0077 · Conduction Through a Composite Wall · nothing is needed from you now.',
    );
    await expect(page.locator('#Ve-done')).not.toContainText('Reviewer');
    await expect(page.locator('#Ve-done')).not.toContainText('Content Manager');
    await checkState(page, 'Submitted');
    if (width(page) === 1024) await shot(page, 'B5-07-f4', 1080);
    await expectSameDocument(page, document);

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

  test('SUB-0081 returned with two references (B5-07 f2)', async ({ page }) => {
    test.skip(width(page) !== 1024, 'the 1080 frame');
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor/experiments/SUB-0081/revise');
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 90_000 });
    const reason = page.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason.getByRole('button')).toHaveText([
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
    ]);
    await checkState(page, 'Course and description');
    await shot(page, 'B5-07-f2', 1080);
  });
});
