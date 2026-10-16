import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * RV-03 Review a submission and RV-06 its decided state (board B6-03 f0 … f5; B6-11 f0 … f3;
 * B6-12 f1), on the test-hook build at 1440, 1024, 768 and 375, as Prof. A. Menon on spine-start.
 * Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24
 * targets, no developer surface, no sideways scroll).
 *
 * - (a) SUB-0086 Flash Distillation has no learning outcomes yet (f2): Approve is refused until one
 *   is added (B6-11 f2); an outcome typed and added, Approve through DL-1 (“Approving does not
 *   publish it”) → RV-06 read-only, with the Content Manager.
 * - (b) SUB-0077 is prepared through the CI seam (Anil Shetty saves and submits Flow E’s content,
 *   set-up only); Return to vendor by real clicks — the reason first required (B6-11 f1), then a
 *   reason and a reference; the Vendor reads that reason (`getRecord` as Anil). Anil revises the VR
 *   device need and resubmits through the seam (the dev server’s routing stand-in routes it back,
 *   PC-66): “What changed in revision 2” and the previous return (f0, f1, f5); the board’s three
 *   outcomes added and approved through DL-1 (B6-11 f0).
 * - (c) SUB-0071 back from the Content Manager for a re-check (f3; B6-11 f3): the reason first;
 *   the Pitot-tube outcome edited, then approved.
 * - (d) SUB-0074 decided, read-only (RV-06, f4), and “Back to the review queue”.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const MENON = { personId: 'per-a-menon' };
const ANIL = { personId: 'per-anil-shetty' };
const COMPOSITE = 'Conduction Through a Composite Wall';
const RETURN_REASON = 'Please clarify the VR device requirements.';
const NEW_DEVICE =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';
const BOARD_OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];
const FLASH_OUTCOME = 'Find the vapour fraction of a feed flashed at a set drum pressure.';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/reviewer-review';

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

/**
 * Flow E’s content (`contract-suite/cases/flow-e.ts` `contentFor`): ME ZG523 — the course of the
 * published Shell-and-Tube Heat Exchanger — WEB and VR. `vrDevice` is the revision’s change.
 */
async function contentFor(page: Page, vrDevice = 'A supported VR headset.') {
  const found = await port<{
    readonly entries: readonly { readonly name: string; readonly courseId: string }[];
  }>(page, ANIL, 'catalogue', 'searchCatalogue', {
    text: 'Shell-and-Tube Heat Exchanger',
    sort: 'default',
  });
  const shell = found.entries.find((entry) => entry.name === 'Shell-and-Tube Heat Exchanger')!;
  return {
    courseId: shell.courseId,
    name: COMPOSITE,
    summary: 'Heat flow through a wall of several layers.',
    description:
      'Learners build a wall of three layers and compare the temperature profile with the series-resistance model.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current browser on a laptop or desktop.',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Composite Wall VR',
        packageReference: 'NSS-CW-VR-1.0',
        packageFileName: null,
        deviceNeeded: vrDevice,
        installNotes: 'Install it from the lab’s device manager.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const addField = (page: Page) => page.getByRole('textbox', { name: /^Add a learning outcome/ });
const outcomeTexts = (page: Page) =>
  page.getByRole('list', { name: 'Learning outcomes' }).locator('.xg-lo-t');
const decided = (page: Page) => page.locator('#rv-dec');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A board frame drawn at 720: the 768 run takes it at 720 too. */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  await shot(page, name);
  await page.setViewportSize({ width: 768, height: 1024 });
}

async function open(page: Page, id: string, name: string): Promise<void> {
  await page.goto(`/reviewer/submissions/${id}`);
  await expect(heading(page, name)).toBeVisible({ timeout: 90_000 });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** ~72 / 28 from 860 px of content; below, the panel under the content with “Go to decision”. */
async function expectDecisionLayout(page: Page): Promise<void> {
  const stack = await main(page).locator('.xr-decide > .xr-stack').boundingBox();
  const aside = await panel(page).boundingBox();
  if (!stack || !aside) throw new Error('not laid out');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  const jump = main(page).locator('a.xr-jump');
  if (contentWidth >= 860) {
    expect(aside.x).toBeGreaterThan(stack.x + stack.width - 1);
    expect(aside.width / (stack.width + aside.width)).toBeLessThan(0.34);
    await expect(jump).toBeHidden();
  } else {
    expect(aside.y).toBeGreaterThan(stack.y + stack.height - 1);
    await expect(jump).toBeVisible();
  }
}

/** Below 860 px of content, “Go to decision” moves focus to the panel (f5). */
async function goToDecision(page: Page): Promise<void> {
  const jump = main(page).locator('a.xr-jump');
  if (!(await jump.isVisible())) return;
  await jump.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeFocused();
}

async function addOutcome(page: Page, words: string): Promise<void> {
  await addField(page).fill(words);
  await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
  await expect(addField(page)).toHaveValue('');
}

/** Approve → DL-1 → Approve: the record goes to the Content Manager; RV-06 shows it. */
async function approveThroughDialog(page: Page, name: string, outcomes: number): Promise<Locator> {
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve' }));
  const dialog = page.getByRole('dialog', { name: `Approve “${name}”?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.xr-dialog-body')).toHaveText(
    `It goes to the Content Manager with its ${outcomes} learning outcome${outcomes === 1 ? '' : 's'}. Approving does not publish it.`,
  );
  await expect(dialog.getByRole('button', { name: 'Approve' })).toBeFocused();
  return dialog;
}

async function expectApprovedPanel(page: Page): Promise<void> {
  await expect(decided(page).locator('.xr-status--ok')).toHaveText(
    'Approved — with the Content Manager',
  );
  await expect(decided(page)).toContainText(
    'The Content Manager decides whether to publish it. Nothing is published yet.',
  );
  await expect(
    decided(page).getByRole('link', { name: 'Back to the review queue' }),
  ).toHaveAttribute('href', '/reviewer/queue');
  await expect(main(page).locator('.xr-phead-meta .xr-status')).toHaveText(
    'Approved — with the Content Manager',
  );
  await expect(page.getByRole('textbox')).toHaveCount(0);
}

test.describe('RV-03 Review a submission', () => {
  test('(a) SUB-0086 not ready (f2): Approve refused until an outcome is added (B6-11 f2), then DL-1 → RV-06', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0086', 'Flash Distillation');
    const mark = await markDocument(page);
    await expect(main(page).locator('.xr-overline')).toHaveText('SUB-0086 · New submission');
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Waiting · revision 1Meridian Virtual Labs · CHE ZG513 · Process Instrumentation & Control',
    );
    const outcomesSection = page.getByRole('region', { name: 'Learning outcomes' });
    await expect(outcomesSection.locator('.xr-notice--warn')).toHaveText(
      'No learning outcomes yetAdd at least one before you approve. One set for the Experiment, whichever format a learner uses.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
    if (width(page) >= 1024) {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Review queue\s*\/\s*SUB-0086/,
      );
    } else {
      await expect(page.locator('.xr-top-title')).toHaveText('Review queue');
    }
    await expectDecisionLayout(page);
    await checkState(page, 'Flash Distillation');
    await shotAt720(page, 'b6-03-f2-not-ready');
    await goToDecision(page);

    // B6-11 f2: Approve with no outcome explains why it can’t go yet; nothing opens.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve' }));
    const error = panel(page).locator('#rv-derr');
    await expect(error).toHaveText('Add at least one learning outcome before you approve');
    await expect(error).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, 'Flash Distillation');
    if (width(page) === 1024) await shot(page, 'b6-11-f2-no-outcomes');

    // An outcome: blank first, then typed and added.
    await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
    await expect(outcomesSection.locator('.xr-error')).toHaveText('Enter the outcome text');
    await addOutcome(page, FLASH_OUTCOME);
    await expect(outcomeTexts(page)).toHaveText([FLASH_OUTCOME]);
    await expect(page.locator('#rv-lo-msg')).toHaveText('Outcome added — 1 outcome in the list.');
    await expect(error).toHaveCount(0);

    // DL-1 “Approving does not publish it.” → RV-06.
    const dialog = await approveThroughDialog(page, 'Flash Distillation', 1);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve' }));
    await expect(dialog).toBeHidden();
    await expectApprovedPanel(page);
    await expect(decided(page)).toBeFocused();
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ul.xv-los li'),
    ).toHaveText([FLASH_OUTCOME]);
    await checkState(page, 'Flash Distillation');
    // Approving publishes nothing: the public catalogue does not list it.
    const listed = await port<{ readonly entries: readonly unknown[] }>(
      page,
      ANIL,
      'catalogue',
      'searchCatalogue',
      { text: 'Flash Distillation', sort: 'default' },
    );
    expect(listed.entries).toEqual([]);
    await expectSameDocument(page, mark);
  });

  test('(b) SUB-0077: Return to vendor (B6-11 f1) — the Vendor sees the reason; resubmitted (f0, f1, f5) → approved (B6-11 f0)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(page.locator('main')).toBeVisible({ timeout: 90_000 });
    // Set-up through the seam: Anil saves (minting SUB-0077) and submits Flow E’s content.
    const content = await contentFor(page);
    const draft = await port<{ readonly id: string; readonly rev: number }>(
      page,
      ANIL,
      'production',
      'saveDraft',
      { id: null, content, step: 'course', expectedRev: null },
    );
    await port(page, ANIL, 'production', 'submitForReview', {
      id: draft.id,
      content,
      expectedRev: draft.rev,
    });
    expect(draft.id).toBe('SUB-0077');
    await softNavigate(page, `/reviewer/submissions/${draft.id}`);
    await expect(heading(page, COMPOSITE)).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Waiting · revision 1Northline Simulation Studio · ME ZG523 · Thermodynamics & Heat Transfer',
    );

    // Return to vendor, by real clicks.
    await reachAndClick(page, panel(page).getByRole('radio', { name: /^Return to vendor/ }));
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Return to vendor' }));
    const dialog = page.getByRole('dialog', { name: 'Return to vendor?' });
    await expect(dialog).toBeVisible();
    const reason = dialog.getByRole('textbox', { name: 'Reason the vendor will see' });
    await expect(reason).toBeFocused();
    const refs = dialog.getByRole('group', { name: /^What it refers to/ });
    await expect(refs.locator('label.xr-check')).toHaveText([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Formats & delivery · VR · Package',
      'Formats & delivery · VR · Device need',
      'Formats & delivery · VR · Install notes',
      'Preview & documents · Preview link',
    ]);
    // B6-11 f1: Return with no reason — the error on the field, which takes focus.
    await dialog.getByRole('button', { name: 'Return to vendor' }).click();
    await expect(dialog.locator('.xr-error')).toHaveText(
      'Add a reason so the vendor knows what to change',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toBeFocused();
    await checkState(page, COMPOSITE);
    if (width(page) === 1024) await shot(page, 'b6-11-f1-reason-required');
    await reason.fill(RETURN_REASON);
    await dialog.getByRole('checkbox', { name: 'Formats & delivery · VR · Device need' }).check();
    await dialog.getByRole('button', { name: 'Return to vendor' }).click();
    await expect(dialog).toBeHidden();
    await expect(decided(page).locator('.xr-status--err')).toHaveText('Returned to vendor');
    await expect(decided(page)).toContainText(`“${RETURN_REASON}”`);
    await expect(decided(page)).toContainText(
      'The vendor sees your reason and can revise and resubmit.',
    );
    await expect(decided(page)).toBeFocused();
    await checkState(page, COMPOSITE);

    // The Vendor sees that reason and its reference (VE-07, as Anil through the seam).
    const record = await port<{
      readonly submission: { readonly rev: number; readonly status: { readonly state: string } };
      readonly lastReturn: {
        readonly reason: string;
        readonly references: readonly unknown[];
      } | null;
    }>(page, ANIL, 'production', 'getRecord', draft.id);
    expect(record.submission.status.state).toBe('returned');
    expect(record.lastReturn?.reason).toBe(RETURN_REASON);
    expect(record.lastReturn?.references).toEqual([
      { step: 'formats-and-delivery', format: 'vr', field: 'device-need' },
    ]);

    // Set-up through the seam: Anil revises the VR device need and resubmits; the dev server’s
    // routing stand-in routes it back to the reviewer (PC-66).
    const revised = await contentFor(page, NEW_DEVICE);
    const saved = await port<{ readonly rev: number }>(page, ANIL, 'production', 'saveRevision', {
      id: draft.id,
      content: revised,
      expectedRev: record.submission.rev,
    });
    await port(page, ANIL, 'production', 'resubmit', {
      id: draft.id,
      content: revised,
      expectedRev: saved.rev,
    });

    // f0: the page reads it again — resubmitted, revision 2, what changed first.
    await expect(main(page).locator('.xr-phead-meta .xr-status')).toHaveText(
      'Resubmitted · revision 2',
    );
    const changed = main(page).locator('.xr-decide > .xr-stack > .xg-changed');
    await expect(changed.getByRole('heading', { level: 2 })).toHaveText(
      'What changed in revision 2',
    );
    await expect(changed.locator('p.xl-meta')).toHaveText(
      /^You returned revision 1 on \d{1,2} [A-Z][a-z]{2}: “Please clarify the VR device requirements\.”$/,
    );
    await expect(changed.locator('li.xg-chg-row')).toHaveText([
      `Formats & delivery · VR · Device needWasA supported VR headset.Now${NEW_DEVICE}`,
    ]);
    await expect(
      page.getByRole('region', { name: 'Formats and delivery' }).locator('.xw-tag--warn'),
    ).toHaveText('Changed');
    const history = page.getByRole('region', { name: 'Review history' }).locator('li.xr-tl');
    await expect(history.first()).toContainText('Resubmitted · revision 2');
    await expect(history.first()).toContainText(
      'Northline Simulation Studio changed the VR device need.',
    );
    await expect(history.nth(1)).toContainText('Returned to vendor by Prof. A. Menon');
    for (const outcome of BOARD_OUTCOMES) await addOutcome(page, outcome);
    await expect(outcomeTexts(page)).toHaveText(BOARD_OUTCOMES);
    await expectDecisionLayout(page);
    await checkState(page, COMPOSITE);
    if (width(page) === 1440) await shot(page, 'b6-03-f0-resubmitted');
    if (width(page) === 1024) await shot(page, 'b6-03-f1-resubmitted');
    if (width(page) === 375) await shot(page, 'b6-03-f5-resubmitted');
    await goToDecision(page);

    // B6-11 f0: DL-1 — “Approving does not publish it.” Cancel returns to the panel.
    let approveDialog = await approveThroughDialog(page, COMPOSITE, 3);
    if (width(page) === 1024) await shot(page, 'b6-11-f0-approve-dialog');
    await approveDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(approveDialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Approve' })).toBeFocused();
    approveDialog = await approveThroughDialog(page, COMPOSITE, 3);
    await approveDialog.getByRole('button', { name: 'Approve' }).click();
    await expect(approveDialog).toBeHidden();
    await expectApprovedPanel(page);
    await checkState(page, COMPOSITE);
    // The set travelled with the record; nothing is published.
    const after = await port<{
      readonly submission: { readonly learningOutcomes: readonly { readonly text: string }[] };
    }>(page, ANIL, 'production', 'getRecord', draft.id);
    expect(after.submission.learningOutcomes.map((outcome) => outcome.text)).toEqual(
      BOARD_OUTCOMES,
    );
    const listed = await port<{ readonly entries: readonly { readonly name: string }[] }>(
      page,
      ANIL,
      'catalogue',
      'searchCatalogue',
      { text: COMPOSITE, sort: 'default' },
    );
    expect(listed.entries.map((entry) => entry.name)).not.toContain(COMPOSITE);
    await expectSameDocument(page, mark);
  });

  test('(c) SUB-0071 back for a re-check (f3; B6-11 f3): the reason first; an outcome edited, then approved', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0071', 'Venturi Meter Calibration');
    await expect(main(page).locator('.xr-overline')).toHaveText('SUB-0071 · Re-check');
    await expect(main(page).locator('.xr-phead-meta .xr-status--wait')).toHaveText(
      'Back for a re-check',
    );
    const first = main(page).locator('.xr-decide > .xr-stack > :first-child');
    await expect(first).toHaveClass(/xv-reason/);
    await expect(first.getByRole('heading', { level: 2 })).toHaveText(
      'Sent back by the Content Manager for a re-check',
    );
    await expect(first.locator('blockquote')).toHaveText(
      'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.',
    );
    await expect(first.locator('.xr-meta')).toHaveText(
      /^\d{1,2} Aug 2026, \d\d:\d\d · Kavya Nair$/,
    );
    await expectDecisionLayout(page);
    await checkState(page, 'Venturi Meter Calibration');
    await shotAt720(page, 'b6-03-f3-recheck');
    if (width(page) === 1024) await shot(page, 'b6-11-f3-recheck');

    // Edit outcome 2 (the Pitot tube): Save outcome → “Outcome 2 saved.”
    await reachAndClick(page, page.getByRole('button', { name: 'Edit outcome 2' }));
    const field = page.getByRole('textbox', { name: 'Outcome 2' });
    await expect(field).toBeFocused();
    await field.fill('Compare the discharge coefficient with the weigh-tank reading.');
    await reachAndClick(page, page.getByRole('button', { name: 'Save outcome' }));
    await expect(page.locator('#rv-lo-msg')).toHaveText('Outcome 2 saved.');
    await expect(page.getByRole('button', { name: 'Edit outcome 2' })).toBeFocused();
    await expect(outcomeTexts(page).nth(1)).toHaveText(
      'Compare the discharge coefficient with the weigh-tank reading.',
    );
    // Move it down and back up.
    await reachAndClick(page, page.getByRole('button', { name: 'Move outcome 2 down' }));
    await expect(page.locator('#rv-lo-msg')).toHaveText(
      'Outcome 2 moved down — it is now outcome 3.',
    );
    await reachAndClick(page, page.getByRole('button', { name: 'Move outcome 3 up' }));
    await expect(outcomeTexts(page).nth(1)).toHaveText(
      'Compare the discharge coefficient with the weigh-tank reading.',
    );
    await checkState(page, 'Venturi Meter Calibration');

    const dialog = await approveThroughDialog(page, 'Venturi Meter Calibration', 3);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve' }));
    await expect(dialog).toBeHidden();
    await expectApprovedPanel(page);
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ul.xv-los li'),
    ).toHaveText([
      'Calibrate a Venturi meter against a weigh tank.',
      'Compare the discharge coefficient with the weigh-tank reading.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    await expect(main(page).locator('.xv-reason')).toHaveCount(0);
  });
});

test.describe('RV-06 Decided · read-only', () => {
  test('(d) SUB-0074 approved — with the Content Manager (f4); Back to the review queue', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0074', 'Transient Cooling');
    const mark = await markDocument(page);
    await expect(main(page).locator('.xr-overline')).toHaveText('SUB-0074 · New submission');
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ul.xv-los li'),
    ).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(decided(page)).toHaveText(
      'Approved — with the Content Manager14 Aug 2026, 15:10 · Prof. A. MenonThe Content Manager decides whether to publish it. Nothing is published yet.Back to the review queue',
    );
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
    await expectDecisionLayout(page);
    await checkState(page, 'Transient Cooling');
    await shotAt720(page, 'b6-03-f4-decided');
    await goToDecision(page);
    await reachAndClick(
      page,
      decided(page).getByRole('link', { name: 'Back to the review queue' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/queue$/);
    await expectSameDocument(page, mark);
  });
});
