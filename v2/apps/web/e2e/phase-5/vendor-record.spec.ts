import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * VE-07 Experiment record and VE-13 History (board B5-06 f0 … f10; the same record on B5-08 f2 and
 * B6-12 f4), on the test-hook build at 1440, 1024, 768 and 375. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). Worlds: spine-start as Anil Shetty — the seeded draft (SUB-0079),
 * returned (SUB-0081), with the Content Manager (SUB-0074), draft in a withdrawn course (SUB-0083)
 * and published (SUB-0052) records; Flow E’s SUB-0077 is prepared through the CI seam (Anil saves
 * and submits, Prof. A. Menon returns and approves, Anil resubmits, Kavya Nair publishes or sends
 * back) — set-up only: the page under test is read live as the one world moves, and its own
 * actions (the back link, Edit draft, Revise & resubmit) are real clicks.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ANIL = { personId: 'per-anil-shetty' };
const MENON = { personId: 'per-a-menon' };
const KAVYA = { personId: 'per-kavya-nair' };
const LIST = '/vendor/experiments';
const record = (id: string) => `${LIST}/${id}`;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/vendor-record';

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

type Submission = { readonly id: string; readonly rev: number };

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05); the revision changes the VR device need. */
function compositeWall(vrDevice: string) {
  return {
    courseId: 'thermodynamics-heat-transfer',
    name: 'Conduction Through a Composite Wall',
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface. They compare the measured profile and heat flux with the series thermal-resistance model and explain where the two differ.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer:
          'A current Chrome, Edge, Firefox or Safari on a laptop or desktop, with a keyboard and mouse',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: 'NSS-CW-VR-1.0',
        packageFileName: null,
        deviceNeeded: vrDevice,
        installNotes:
          'Install the build named above on the headset and open “Composite Wall Lab”. On first launch, set the play-area boundary.',
        notes: null,
      },
    },
    preview: {
      label: 'Two-minute walkthrough',
      link: 'https://media.northline.example/composite-wall-walkthrough',
    },
    documents: [
      { fileName: 'Lab handout — Composite Wall.pdf' },
      { fileName: 'Thermocouple positions.pdf' },
    ],
  };
}
const VR_DEVICE_REVISED =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

/** The record as the reviewer reads it now (its revision for the next command). */
async function reviewerView(page: Page, id: string): Promise<Submission> {
  const view = await port<{ readonly submission: Submission }>(
    page,
    MENON,
    'production',
    'getSubmissionForReview',
    id,
  );
  return view.submission;
}

async function vendorView(page: Page, id: string): Promise<Submission> {
  const view = await port<{ readonly submission: Submission }>(
    page,
    ANIL,
    'production',
    'getRecord',
    id,
  );
  return view.submission;
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');
const overline = (page: Page) => main(page).locator('.xr-phead .xr-overline');
const banner = (page: Page) => main(page).locator('.xr-notice').first();
const section = (page: Page, name: string) => page.getByRole('region', { name });
const details = (page: Page) => section(page, 'Details');
const history = (page: Page) => section(page, 'Submission and version history');
const historyWhat = (page: Page) => history(page).locator('.xr-tl-what');
const historyNote = (page: Page) => history(page).locator('.xr-tl-note');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A frame drawn at 720: shot at 720 from the 768 project, then back. */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  await shot(page, name);
  await page.setViewportSize({ width: 768, height: 1024 });
}

/** The shell as B5-06 draws it: My experiments current; “My experiments / Experiment record”. */
async function expectShell(page: Page): Promise<void> {
  await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
  if (width(page) < 1024) {
    await expect(page.locator('.xr-top-title')).toHaveText('Experiment record');
  } else {
    await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
      /My experiments\s*\/\s*Experiment record/,
    );
  }
}

/** Details › key → value, as `dl.xv-kv` pairs. */
async function detailsRows(page: Page): Promise<string[]> {
  return details(page)
    .locator('dl.xv-kv')
    .first()
    .evaluate((list) =>
      [...list.querySelectorAll('dt')].map(
        (key) =>
          `${key.textContent} = ${(key.nextElementSibling?.textContent ?? '').replace(/\s+/g, ' ').trim()}`,
      ),
    );
}

async function open(page: Page, id: string, name: string): Promise<void> {
  await page.goto(record(id));
  await expect(heading(page, name)).toBeVisible({ timeout: 90_000 });
}

test.describe('VE-07 Experiment record — the seeded states', () => {
  test('draft (f1): Edit draft opens the editor where the draft stopped', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0079', 'Pin Fin Efficiency');
    await expect(main(page).locator('a.xr-back')).toHaveText('My experiments');
    await expect(overline(page)).toHaveText('SUB-0079 · ME ZG523');
    await expect(chip(page)).toHaveText('Draft');
    await expect(chip(page)).toHaveClass(/xr-status--off/);
    await expect(banner(page).locator('.xr-notice-title')).toHaveText(
      'Draft — only you can see it',
    );
    await expect(banner(page)).toContainText('Finish it and submit it for academic review.');
    const edit = banner(page).getByRole('link', { name: 'Edit draft' });
    await expect(edit).toHaveClass(/xr-btn--primary/);
    await expect(edit).toHaveAttribute('href', `${record('SUB-0079')}/edit`);
    expect(await detailsRows(page)).toEqual([
      'Course = ME ZG523 · Thermodynamics & Heat Transfer',
      'Summary = ',
      'Description = ',
      'Version = 1.0',
      'Formats = WEB',
      'Preview = None',
      'Documents = None',
    ]);
    await expect(details(page).locator('.xv-deliv-head')).toHaveText(['WEBWeb link']);
    await expect(details(page).locator('.xv-deliv dd')).toHaveText([
      '—',
      'A current browser on a laptop or desktop',
    ]);
    await expect(section(page, 'Learning outcomes')).toContainText(
      'None yet. The Academic Reviewer adds them during review — one set for every format.',
    );
    await expect(history(page).locator('.xr-section-head .xr-meta')).toHaveText(
      'Newest first · not an audit log',
    );
    await expect(historyWhat(page)).toHaveText(['Draft saved']);
    await expect(historyNote(page)).toHaveText(['Only you can see a draft.']);
    await expectShell(page);
    await checkState(page, 'Pin Fin Efficiency');
    await shotAt720(page, 'f1-draft');

    const mark = await markDocument(page);
    await reachAndClick(page, edit);
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0079')}/edit$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('returned by the Academic Reviewer (f3, f10): the reason, what it refers to, Revise & resubmit', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0081', 'Forced Convection');
    await expect(overline(page)).toHaveText('SUB-0081 · ME ZG523');
    await expect(chip(page)).toHaveText('Returned');
    await expect(chip(page)).toHaveClass(/xr-status--err/);
    const reason = main(page).locator('section.xv-reason');
    await expect(reason.locator('h2')).toHaveText('Returned by the Academic Reviewer');
    await expect(reason.locator('.xr-meta')).toHaveText(
      /^\d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · Prof\. A\. Menon$/,
    );
    await expect(reason.locator('blockquote.xv-quote')).toHaveText(
      'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
    );
    await expect(reason.locator('li.xv-ref')).toHaveText([
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
    ]);
    const revise = main(page)
      .locator('.xw-actions')
      .getByRole('link', { name: 'Revise & resubmit' });
    await expect(revise).toHaveClass(/xr-btn--primary/);
    await expect(revise).toHaveAttribute('href', `${record('SUB-0081')}/revise`);
    await expect(details(page).locator('.xv-deliv-head')).toHaveText([
      'WEBWeb link',
      'ARApp package',
    ]);
    await expect(historyWhat(page)).toHaveText([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(historyNote(page).first()).toHaveText(
      'Academic Reviewer: “The AR install notes don’t say which phones and tablets it runs on…”',
    );
    await expectShell(page);
    await checkState(page, 'Forced Convection');
    await shotAt720(page, 'f3-returned');
    if (width(page) === 375) await shot(page, 'f10-returned');

    const mark = await markDocument(page);
    await reachAndClick(page, revise);
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}/revise$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('with the Content Manager (f5), course no longer assigned (f9), published (f8) — read-only', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    // f5: approved by the Academic Reviewer; nothing is needed from the Vendor.
    await open(page, 'SUB-0074', 'Transient Cooling');
    await expect(chip(page)).toHaveText('With Content Manager');
    await expect(chip(page)).toHaveClass(/xr-status--wait/);
    await expect(banner(page).locator('.xr-notice-title')).toHaveText('With the Content Manager');
    await expect(banner(page)).toContainText(
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    await expect(section(page, 'Learning outcomes').locator('.xv-los li')).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(section(page, 'Learning outcomes')).toContainText('One set for every format.');
    await expect(historyWhat(page)).toHaveText([
      'Approved by the Academic Reviewer',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(historyNote(page).first()).toHaveText('With the Content Manager.');
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await expectShell(page);
    await checkState(page, 'Transient Cooling');
    await shotAt720(page, 'f5-with-cm');

    // f9: MEL ZG512 was withdrawn from Anil — the draft is kept, read-only.
    await open(page, 'SUB-0083', 'Surface Roughness in Turning');
    await expect(overline(page)).toHaveText('SUB-0083 · MEL ZG512');
    await expect(chip(page)).toHaveText('Draft · read-only');
    await expect(chip(page)).toHaveClass(/xr-status--paused/);
    await expect(banner(page)).toHaveClass(/xr-notice--warn/);
    await expect(banner(page).locator('.xr-notice-title')).toHaveText(
      'MEL ZG512 is no longer assigned to you',
    );
    await expect(banner(page)).toContainText(
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    await expect(main(page).getByRole('link', { name: 'Edit draft' })).toHaveCount(0);
    expect((await detailsRows(page))[0]).toBe('Course = MEL ZG512 · Manufacturing Processes');
    await checkState(page, 'Surface Roughness in Turning');
    await shotAt720(page, 'f9-read-only');

    // f8: published — read-only, the formats published.
    await open(page, 'SUB-0052', 'Fin-Tube Bundle');
    await expect(chip(page)).toHaveText('Published');
    await expect(chip(page)).toHaveClass(/xr-status--ok/);
    await expect(banner(page)).toHaveClass(/xr-notice--ok/);
    await expect(banner(page).locator('.xr-notice-title')).toHaveText('Published · 30 Jul 2026');
    await expect(banner(page)).toContainText(
      'It is live in the catalogue with the formats below. It is read-only here.',
    );
    await expect(details(page).locator('p.xl-meta')).toHaveText(
      'Formats published: WEB · VR. Changes to a published experiment are not made from the Vendor workspace.',
    );
    await expect(historyWhat(page).first()).toHaveText('Published by the Content Manager');
    await expect(historyNote(page).first()).toHaveText('WEB and VR are live in the catalogue.');
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await checkState(page, 'Fin-Tube Bundle');
    await shotAt720(page, 'f8-published');

    // The back link reaches My experiments, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).locator('a.xr-back'));
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('VE-07 — Flow E on one world (SUB-0077)', () => {
  test('saved, submitted (f2), returned (f3), resubmitted — “Submitted” (f4), with the CM, published (B6-12 f4)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    // Before the first save the record does not exist.
    await page.goto(record('SUB-0077'));
    await expect(heading(page, 'Experiment record')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).getByRole('heading', { level: 2 })).toHaveText(
      'We can’t find that experiment',
    );

    // Anil’s first save mints SUB-0077: the page reads it live (B5-08 f2).
    const saved = await port<Submission>(page, ANIL, 'production', 'saveDraft', {
      id: null,
      content: compositeWall('VR headset'),
      step: 'course',
      expectedRev: null,
    });
    expect(saved.id).toBe('SUB-0077');
    await expect(heading(page, 'Conduction Through a Composite Wall')).toBeVisible();
    await expect(chip(page)).toHaveText('Draft');
    await expect(historyWhat(page)).toHaveText(['Draft saved']);
    await checkState(page, 'Conduction Through a Composite Wall');

    // He submits it for academic review (f2: revision 1, read-only for the Vendor).
    await port(page, ANIL, 'production', 'submitForReview', {
      id: saved.id,
      content: compositeWall('VR headset'),
      expectedRev: saved.rev,
    });
    await expect(chip(page)).toHaveText('With Academic Reviewer');
    await expect(overline(page)).toHaveText('SUB-0077 · ME ZG523');
    await expect(banner(page).locator('.xr-notice-title')).toHaveText('With the Academic Reviewer');
    await expect(banner(page)).toContainText(
      'Nothing is needed from you now. You can edit it again only if it is returned to you.',
    );
    await expect(historyWhat(page)).toHaveText(['Submitted for academic review', 'Draft saved']);
    await expect(historyNote(page).first()).toHaveText(
      'With the Academic Reviewer. Nothing is published.',
    );
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await checkState(page, 'Conduction Through a Composite Wall');
    await shotAt720(page, 'f2-with-ar');
    if (width(page) === 1440) await shot(page, 'f0-with-ar-rev1');

    // Prof. A. Menon returns it with a reason and what it refers to (f3).
    let review = await reviewerView(page, saved.id);
    await port(page, MENON, 'production', 'returnSubmission', {
      id: saved.id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: OUTCOMES,
      expectedRev: review.rev,
    });
    await expect(chip(page)).toHaveText('Returned');
    const reason = main(page).locator('section.xv-reason');
    await expect(reason.locator('blockquote')).toHaveText(
      'Please clarify the VR device requirements.',
    );
    await expect(reason.locator('li.xv-ref')).toHaveText(['Formats & delivery · VR · Device need']);
    await expect(historyNote(page).first()).toHaveText(
      'Academic Reviewer: “Please clarify the VR device requirements.”',
    );
    await expect(section(page, 'Learning outcomes').locator('.xv-los li')).toHaveText(OUTCOMES);
    await checkState(page, 'Conduction Through a Composite Wall');

    // He resubmits: “Submitted”, no gate named — though the workflow rule routed it (f4; M-3).
    let current = await vendorView(page, saved.id);
    await port(page, ANIL, 'production', 'resubmit', {
      id: saved.id,
      content: compositeWall(VR_DEVICE_REVISED),
      expectedRev: current.rev,
    });
    await expect(chip(page)).toHaveText('Submitted');
    await expect(chip(page)).toHaveClass(/xr-status--info/);
    await expect(overline(page)).toHaveText('SUB-0077 · ME ZG523 · revision 2');
    await expect(banner(page).locator('.xr-notice-title')).toHaveText('Submitted');
    await expect(banner(page)).toContainText(
      'Your changes have been submitted for review. Nothing is needed from you now.',
    );
    await expect(historyWhat(page)).toHaveText([
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(main(page)).not.toContainText('Routed by the approved workflow rule.');
    await expect(main(page).locator('section.xv-reason')).toHaveCount(0);
    await expect(details(page)).toContainText(VR_DEVICE_REVISED);
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await checkState(page, 'Conduction Through a Composite Wall');
    await shotAt720(page, 'f4-submitted');
    if (width(page) === 1440) await shot(page, 'f0-submitted-rev2');

    // He approves revision 2: with the Content Manager; the routing entry now reads as f0 draws it.
    review = await reviewerView(page, saved.id);
    await port(page, MENON, 'production', 'approveSubmission', {
      id: saved.id,
      outcomes: OUTCOMES,
      expectedRev: review.rev,
    });
    await expect(chip(page)).toHaveText('With Content Manager');
    await expect(historyWhat(page)).toHaveText([
      'Approved by the Academic Reviewer',
      'With Academic Reviewer · revision 2',
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(history(page)).toContainText('Routed by the approved workflow rule.');
    await checkState(page, 'Conduction Through a Composite Wall');

    // Kavya Nair publishes it: read-only, the formats published (B6-12 f4).
    current = await vendorView(page, saved.id);
    await port(page, KAVYA, 'production', 'publish', { id: saved.id, expectedRev: current.rev });
    await expect(chip(page)).toHaveText('Published');
    await expect(details(page).locator('p.xl-meta')).toHaveText(
      'Formats published: WEB · VR. Changes to a published experiment are not made from the Vendor workspace.',
    );
    await expect(historyWhat(page).first()).toHaveText('Published by the Content Manager');
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await checkState(page, 'Conduction Through a Composite Wall');
    if (width(page) === 768) await shotAt720(page, 'b6-12-f4-published');
  });

  test('returned by the Content Manager (f6)', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0074', 'Transient Cooling');
    const current = await vendorView(page, 'SUB-0074');
    await port(page, KAVYA, 'production', 'sendBack', {
      id: 'SUB-0074',
      to: 'vendor',
      reason:
        'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.',
      references: [{ step: 'course-and-description', format: null, field: 'summary' }],
      expectedRev: current.rev,
    });
    await expect(chip(page)).toHaveText('Returned');
    const reason = main(page).locator('section.xv-reason');
    await expect(reason.locator('h2')).toHaveText('Returned by the Content Manager');
    await expect(reason.locator('.xr-meta')).toHaveText(/ · Kavya Nair$/);
    await expect(reason.locator('li.xv-ref')).toHaveText(['Course & description · Summary']);
    await expect(main(page).getByRole('link', { name: 'Revise & resubmit' })).toHaveAttribute(
      'href',
      `${record('SUB-0074')}/revise`,
    );
    await expect(historyWhat(page).first()).toHaveText('Returned with a reason');
    await expect(historyNote(page).first()).toHaveText(
      'Content Manager: “The summary runs to three sentences…”',
    );
    await checkState(page, 'Transient Cooling');
    await shotAt720(page, 'f6-returned-cm');
  });

  test('back with the Academic Reviewer for a re-check (f7)', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0074', 'Transient Cooling');
    const current = await vendorView(page, 'SUB-0074');
    await port(page, KAVYA, 'production', 'sendBack', {
      id: 'SUB-0074',
      to: 'academic-reviewer',
      reason: 'Please check the second outcome against the description.',
      expectedRev: current.rev,
    });
    await expect(chip(page)).toHaveText('With Academic Reviewer');
    await expect(banner(page).locator('.xr-notice-title')).toHaveText(
      'Back with the Academic Reviewer for a re-check',
    );
    await expect(banner(page)).toContainText(
      'The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you.',
    );
    await expect(historyWhat(page).first()).toHaveText(
      'Back with the Academic Reviewer for a re-check',
    );
    await expect(historyNote(page).first()).toHaveText(
      'Sent back by the Content Manager. Nothing is needed from you.',
    );
    // The Content Manager’s reason is not the Vendor’s to read.
    await expect(main(page)).not.toContainText('Please check the second outcome');
    await expect(main(page).getByRole('link')).toHaveText(['My experiments']);
    await checkState(page, 'Transient Cooling');
    await shotAt720(page, 'f7-recheck');
  });
});

test.describe('VE-13 History and the calm states', () => {
  test('?tab=history lands on the record’s history; another tab value is the bare record', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto(`${record('SUB-0081')}?tab=history`);
    await expect(heading(page, 'Forced Convection')).toBeVisible({ timeout: 90_000 });
    const historyHeading = history(page).getByRole('heading', {
      level: 2,
      name: 'Submission and version history',
    });
    await expect(historyHeading).toBeFocused();
    await expect(historyHeading).toBeInViewport();
    await expect(historyWhat(page)).toHaveText([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expectShell(page);
    await checkState(page, 'Forced Convection');

    await page.goto(`${record('SUB-0081')}?tab=elsewhere`);
    await expect(heading(page, 'Forced Convection')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}$`));
  });

  test('an unknown id and another vendor’s record: “We can’t find that experiment”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    for (const id of ['SUB-9999', 'SUB-0086']) {
      await page.goto(record(id));
      await expect(heading(page, 'Experiment record')).toBeVisible({ timeout: 90_000 });
      const calm = main(page).locator('.xr-empty');
      await expect(calm.locator('h2')).toHaveText('We can’t find that experiment');
      await expect(calm).toContainText(
        'It isn’t one of your experiments, or the address is wrong. Your experiments are in My experiments.',
      );
      await expect(main(page)).not.toContainText('Flash Distillation');
      await expect(main(page).locator('a.xr-back')).toHaveAttribute('href', LIST);
      await checkState(page, 'Experiment record');
    }
  });
});
