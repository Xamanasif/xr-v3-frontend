import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * RV-03 Review a submission and RV-06 its decided state — the owner-approved Academic Reviewer
 * export (V3, design/v3-refined-b/roles/RV-v1, `RV.dc.html` item view) — on the test-hook build at
 * 1440, 1024, 768 and 375, as Prof. A. Menon on spine-start. Each drawn state passes `checkState`
 * (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no
 * sideways scroll) and the owner's identifier rule (no internal reference anywhere the reviewer
 * reads or hears it, nor in the tab's title).
 *
 * - (a) SUB-0086 Flash Distillation has no learning outcomes yet (RV03-outcomes): nothing chosen
 *   asks for a decision; Approve is refused until one is added, in the panel's summary and at the
 *   field; an outcome typed and added, Approve through the confirmation → RV-06, with the Content
 *   Manager.
 * - (b) SUB-0077 is prepared through the CI seam (Anil Shetty saves and submits Flow E’s content,
 *   set-up only); Return to vendor in the panel by real clicks — the reason first required
 *   (RV03-return-errors), then a reason and a reference grouped under its section; the Vendor reads
 *   that reason (`getRecord` as Anil). Anil revises the VR device need and resubmits through the
 *   seam (the dev server’s routing stand-in routes it back, PC-66): “What changed in revision 2”
 *   with the earlier reason (RV03); three outcomes added and approved (RV03-confirm, -approved).
 * - (c) SUB-0071 back from the Content Manager for a re-check (RV03-recheck): the reason first;
 *   an outcome edited (RV03-editing), then approved.
 * - (d) SUB-0074 decided, read-only (RV06), and “Back to Reviewed by me”.
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/rv-submission/shots';

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
const outcomeList = (page: Page) => page.getByRole('list', { name: 'Learning outcomes' });
const outcomeTexts = (page: Page) => outcomeList(page).locator('.rv-lo-t');
const decided = (page: Page) => page.locator('#rv-done');
const summary = (page: Page) => panel(page).locator('#rv-errs');
const crumbs = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });
const idCard = (page: Page) => main(page).locator('header.rv-idcard');

/** An internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference where the reviewer reads or hears it (the owner's identifier rule, RV-v1
 * HANDOFF): the page's words (screen-reader-only words included), every dialog's words, the route
 * announcer's, every `aria-label`, `title`, `placeholder` and field value, and the tab's title.
 * The vendor's build name (`NSS-CW-VR-1.0`) is vendor data, not a platform reference.
 */
async function expectNoReference(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const reference = new RegExp(source);
    const hits: string[] = [];
    const check = (where: string, words: string | null | undefined) => {
      const match = words ? reference.exec(words) : null;
      if (match && words) {
        hits.push(`${where}: …${words.slice(Math.max(0, match.index - 40), match.index + 20)}…`);
      }
    };
    check('page words', document.body.innerText);
    // Screen-reader-only words (visually hidden, so not in `innerText`).
    for (const hidden of document.querySelectorAll('.xr-sr'))
      check('hidden words', hidden.textContent);
    for (const dialog of document.querySelectorAll('dialog')) check('dialog', dialog.textContent);
    check(
      'route announcer',
      document.querySelector('next-route-announcer')?.shadowRoot?.textContent,
    );
    for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
      for (const attribute of ['aria-label', 'title', 'placeholder']) {
        check(`${attribute} of ${element.tagName.toLowerCase()}`, element.getAttribute(attribute));
      }
    }
    for (const field of document.querySelectorAll('input, textarea, select')) {
      check('field value', (field as HTMLInputElement).value);
    }
    check('tab title', document.title);
    return hits;
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

/** A drawn state: the screen checks and the identifier rule. */
async function drawn(page: Page, name: string): Promise<void> {
  await checkState(page, name);
  await expectNoReference(page);
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
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

/**
 * The panel beside the content from 860 px of page width (the kit's `rk-detail` container query);
 * below, the panel after the content — before the history — and “Go to decision” in the card.
 */
async function expectDecisionLayout(page: Page): Promise<void> {
  const content = await main(page).locator('.rv-main').boundingBox();
  const aside = await panel(page).boundingBox();
  const history = await page.getByRole('region', { name: 'Review history' }).boundingBox();
  if (!content || !aside || !history) throw new Error('not laid out');
  const goTo = idCard(page).locator('a.rk-goto');
  if (aside.y < content.y + content.height - 1) {
    expect(aside.x).toBeGreaterThan(content.x + content.width - 1);
    expect(history.y).toBeGreaterThan(content.y + content.height - 1);
    await expect(goTo).toBeHidden();
  } else {
    expect(history.y).toBeGreaterThan(aside.y + aside.height - 1);
    await expect(goTo).toBeVisible();
  }
}

/** While the panel sits below the content, “Go to decision” moves focus to its heading. */
async function goToDecision(page: Page): Promise<void> {
  const goTo = idCard(page).locator('a.rk-goto');
  if (!(await goTo.isVisible())) return;
  await goTo.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page).getByRole('heading', { name: 'Your decision' })).toBeFocused();
}

/**
 * A control in the decision panel. From 860 px the panel is sticky and scrolls within itself when
 * it is taller than the viewport (rb-kit `rk-aside`: the return's reason and references make it
 * so): the wheel turns over the panel, as a person's pointer would, until the control is in view —
 * `reachAndClick` turns it at the viewport's centre, over the content, which never scrolls the
 * panel. On one column the page scrolls and `reachAndClick` reaches it.
 */
async function reachInPanel(page: Page, target: Locator): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  for (let step = 0; step < 40; step += 1) {
    const box = await target.boundingBox();
    if (box && box.y >= 0 && box.y + box.height <= viewport.height) break;
    const aside = await panel(page).boundingBox();
    if (!aside) break;
    const top = Math.max(aside.y, 0);
    const bottom = Math.min(aside.y + aside.height, viewport.height);
    await page.mouse.move(aside.x + aside.width / 2, (top + bottom) / 2);
    await page.mouse.wheel(0, box && box.y < 0 ? -120 : 120);
  }
  await target.click();
}

async function addOutcome(page: Page, words: string): Promise<void> {
  await addField(page).fill(words);
  await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
  await expect(addField(page)).toHaveValue('');
}

async function chooseApprove(page: Page): Promise<void> {
  await reachAndClick(page, panel(page).getByRole('radio', { name: /^Approve/ }));
}

/** Approve → the confirmation (focus on its title): the record goes to the Content Manager. */
async function approveThroughDialog(
  page: Page,
  name: string,
  outcomes: number,
  recheck = false,
): Promise<Locator> {
  await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve' }));
  const dialog = page.getByRole('dialog', { name: `Approve “${name}”?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.rk-dlg-now li').first()).toHaveText(
    `It goes ${recheck ? 'back ' : ''}to the Content Manager with its ${outcomes} learning outcome${outcomes === 1 ? '' : 's'}.`,
  );
  await expect(dialog.locator('.rk-dlg-later')).toContainText('Approving does not publish.');
  await expect(dialog.getByRole('heading', { name: `Approve “${name}”?` })).toBeFocused();
  return dialog;
}

async function expectApprovedPanel(
  page: Page,
  back: 'queue' | 'reviewed' = 'queue',
): Promise<void> {
  await expect(decided(page).locator('.xr-st--ok')).toHaveText(
    'Approved — with the Content Manager',
  );
  await expect(decided(page)).toContainText(
    'The Content Manager decides whether to publish it. Nothing is published yet.',
  );
  await expect(
    decided(page).getByRole('link', {
      name: back === 'queue' ? 'Back to the review queue' : 'Back to Reviewed by me',
    }),
  ).toHaveAttribute('href', back === 'queue' ? '/reviewer/queue' : '/reviewer/reviewed');
  await expect(idCard(page).locator('.rv-meta-main .xr-st')).toHaveText(
    'Approved — with the Content Manager',
  );
  await expect(page.getByRole('textbox')).toHaveCount(0);
}

test.describe('RV-03 Review a submission', () => {
  test('(a) SUB-0086 not ready (RV03-outcomes): a decision first, then an outcome, then the confirmation → RV-06', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0086', 'Flash Distillation');
    const mark = await markDocument(page);
    await expect(idCard(page).locator('.rv-kind')).toHaveText('New submission');
    await expect(idCard(page).locator('.rk-meta')).toHaveText(
      'Waiting for your decisionCHE ZG513Process Instrumentation & ControlFrom Meridian Virtual Labs',
    );
    await expect(crumbs(page)).toHaveText(/Review queue\s*Flash Distillation/);
    await expect(page).toHaveTitle(/^Flash Distillation · Review queue/);
    const outcomesSection = page.getByRole('region', { name: 'Learning outcomes' });
    await expect(outcomesSection.locator('.rk-notice--warn')).toHaveText(
      'No learning outcomes yetApprove needs at least one. Add what a learner can do after this experiment; the same list applies to every format.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
    await expectDecisionLayout(page);
    await drawn(page, 'Flash Distillation');
    await shot(page, 'rv03-outcomes');
    await goToDecision(page);

    // Nothing chosen: “Choose a decision”; nothing opens.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve' }));
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toHaveText('Check your decisionChoose a decision');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Approve with no outcome: the summary and the field say why it can’t go yet.
    await chooseApprove(page);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve' }));
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toHaveText(
      'Check your decisionAdd at least one learning outcome before you approve',
    );
    await expect(page.locator('#rv-lo-err')).toHaveText(
      'Add at least one learning outcome before you approve',
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await drawn(page, 'Flash Distillation');
    if (width(page) === 1440) await shot(page, 'rv03-outcomes-blocked');

    // An outcome: blank first, then typed and added.
    await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
    await expect(page.locator('#rv-lo-new-err')).toHaveText('Enter the outcome text');
    await addOutcome(page, FLASH_OUTCOME);
    await expect(outcomeTexts(page)).toHaveText([`Outcome 1: ${FLASH_OUTCOME}`]);
    await expect(page.locator('#rv-lo-msg')).toHaveText('Outcome added — 1 outcome in the list.');
    await expect(summary(page)).toHaveCount(0);

    // The confirmation: “Approving does not publish.” → RV-06.
    const dialog = await approveThroughDialog(page, 'Flash Distillation', 1);
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'rv03-confirm');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve' }));
    await expect(dialog).toBeHidden();
    await expectApprovedPanel(page);
    await expect(decided(page)).toBeFocused();
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ol.rv-lo-ro li'),
    ).toHaveText([FLASH_OUTCOME]);
    await drawn(page, 'Flash Distillation');
    if (width(page) === 1440) await shot(page, 'rv03-approved');
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

  test('(b) SUB-0077: Return to vendor in the panel (RV03-return-errors) — the Vendor sees the reason; resubmitted (RV03) → approved', async ({
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
    await expect(idCard(page).locator('.rk-meta')).toHaveText(
      'Waiting for your decisionME ZG523Thermodynamics & Heat TransferFrom Northline Simulation Studio',
    );

    // Return to vendor, in the panel, by real clicks.
    await reachAndClick(page, panel(page).getByRole('radio', { name: /^Return to vendor/ }));
    const reason = panel(page).getByRole('textbox', {
      name: 'Reason the vendor will see (required)',
    });
    await expect(reason).toBeVisible();
    const refs = panel(page).getByRole('group', { name: /^What it refers to \(optional\)/ });
    await expect(refs.locator('legend.rv-refgrp-h')).toHaveText([
      'Course & description',
      'Formats & delivery · WEB',
      'Formats & delivery · VR',
    ]);
    await expect(refs.locator('label.rv-ref')).toHaveText([
      'Summary',
      'Description',
      'Web link',
      'Browser and computer',
      'Package',
      'Device need',
      'Install notes',
    ]);
    // Return with no reason: the summary (focused) and the error at the field; nothing is sent.
    await reachInPanel(page, panel(page).getByRole('button', { name: 'Return to vendor' }));
    await expect(summary(page)).toBeFocused();
    await expect(page.locator('#rv-reason-e')).toHaveText(
      'Add a reason so the vendor knows what to change',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await drawn(page, COMPOSITE);
    if (width(page) === 1440) await shot(page, 'rv03-return-errors');
    await reason.fill(RETURN_REASON);
    await refs
      .getByRole('group', { name: 'Formats & delivery · VR' })
      .getByRole('checkbox', { name: 'Device need' })
      .check();
    await expect(page.locator('#rv-reason-e')).toHaveCount(0);
    if (width(page) === 1440) await shot(page, 'rv03-return-filled');
    await reachInPanel(page, panel(page).getByRole('button', { name: 'Return to vendor' }));
    await expect(decided(page).locator('.xr-st--err')).toHaveText('Returned to vendor');
    await expect(decided(page).locator('.rv-done-q')).toHaveText(
      `Your reason“${RETURN_REASON}”Formats & delivery · VR · Device need`,
    );
    await expect(decided(page)).toContainText(
      'The vendor sees your reason above their editor and can revise and resubmit.',
    );
    await expect(decided(page)).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await drawn(page, COMPOSITE);
    if (width(page) === 1440) await shot(page, 'rv03-returned');

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

    // The page reads it again — resubmitted, revision 2, what changed first.
    await expect(idCard(page).locator('.rv-kind')).toHaveText('Resubmittedrevision 2');
    await expect(idCard(page).locator('.rv-meta-main .xr-st')).toHaveText(
      'Waiting for your decision',
    );
    const changed = main(page).locator('.rv-main > :first-child');
    await expect(changed.getByRole('heading', { level: 2 })).toHaveText(
      'What changed in revision 2',
    );
    await expect(changed.locator('blockquote p').first()).toHaveText(`“${RETURN_REASON}”`);
    await expect(changed.locator('.rk-quote-by')).toHaveText(
      /^Your reason when you returned revision 1 · \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    await expect(changed.locator('.rv-cmp-row:not(.rv-cmp-row--head)')).toHaveText([
      `Formats & delivery · VR · Device needWasA supported VR headset.Now${NEW_DEVICE}`,
    ]);
    await expect(
      page.getByRole('region', { name: 'Formats and delivery' }).locator('.rv-tag'),
    ).toHaveText('Changed in revision 2');
    const history = page.getByRole('region', { name: 'Review history' }).locator('ol.rk-tl > li');
    await expect(history.first()).toContainText('Resubmitted · revision 2');
    await expect(history.first()).toContainText(
      'Northline Simulation Studio changed the VR device need.',
    );
    await expect(history.nth(1)).toContainText('Returned to vendor by Prof. A. Menon');
    for (const outcome of BOARD_OUTCOMES) await addOutcome(page, outcome);
    await expect(outcomeTexts(page)).toHaveText(
      BOARD_OUTCOMES.map((outcome, index) => `Outcome ${index + 1}: ${outcome}`),
    );
    await expectDecisionLayout(page);
    await drawn(page, COMPOSITE);
    await shot(page, 'rv03');
    await goToDecision(page);

    // The confirmation; Cancel returns to the panel’s button.
    await chooseApprove(page);
    let approveDialog = await approveThroughDialog(page, COMPOSITE, 3);
    await approveDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(approveDialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Approve' })).toBeFocused();
    approveDialog = await approveThroughDialog(page, COMPOSITE, 3);
    await approveDialog.getByRole('button', { name: 'Approve' }).click();
    await expect(approveDialog).toBeHidden();
    await expectApprovedPanel(page);
    await drawn(page, COMPOSITE);
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

  test('(c) SUB-0071 back for a re-check (RV03-recheck): the reason first; an outcome edited (RV03-editing), then approved', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0071', 'Venturi Meter Calibration');
    await expect(idCard(page).locator('.rv-kind')).toHaveText('Re-check');
    const first = main(page).locator('.rv-main > :first-child');
    await expect(first).toHaveClass(/rv-block--attn/);
    await expect(first.getByRole('heading', { level: 2 })).toHaveText('Sent back for a re-check');
    await expect(first.locator('blockquote p').first()).toHaveText(
      'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.',
    );
    await expect(first.locator('.rk-quote-by')).toHaveText('Kavya Nair, Content Manager');
    await expect(first.locator('.rv-band-note')).toHaveText(/^\d{1,2} Aug 2026, \d\d:\d\d$/);
    await expectDecisionLayout(page);
    await drawn(page, 'Venturi Meter Calibration');
    await shot(page, 'rv03-recheck');

    // Edit outcome 2 (the Pitot tube): Save outcome → “Outcome 2 saved.”
    await reachAndClick(page, page.getByRole('button', { name: 'Edit outcome 2' }));
    const field = page.getByRole('textbox', { name: 'Outcome 2' });
    await expect(field).toBeFocused();
    await expect(page.getByRole('button', { name: 'Delete outcome 1' })).toBeDisabled();
    await drawn(page, 'Venturi Meter Calibration');
    if (width(page) === 375) await shot(page, 'rv03-editing');
    await field.fill('Compare the discharge coefficient with the weigh-tank reading.');
    await reachAndClick(page, page.getByRole('button', { name: 'Save outcome' }));
    await expect(page.locator('#rv-lo-msg')).toHaveText('Outcome 2 saved.');
    await expect(page.getByRole('button', { name: 'Edit outcome 2' })).toBeFocused();
    await expect(outcomeTexts(page).nth(1)).toHaveText(
      'Outcome 2: Compare the discharge coefficient with the weigh-tank reading.',
    );
    // Move it down and back up.
    await reachAndClick(page, page.getByRole('button', { name: 'Move outcome 2 down' }));
    await expect(page.locator('#rv-lo-msg')).toHaveText(
      'Outcome 2 moved down — it is now outcome 3.',
    );
    await reachAndClick(page, page.getByRole('button', { name: 'Move outcome 3 up' }));
    await expect(outcomeTexts(page).nth(1)).toHaveText(
      'Outcome 2: Compare the discharge coefficient with the weigh-tank reading.',
    );
    await drawn(page, 'Venturi Meter Calibration');

    await chooseApprove(page);
    const dialog = await approveThroughDialog(page, 'Venturi Meter Calibration', 3, true);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve' }));
    await expect(dialog).toBeHidden();
    await expectApprovedPanel(page);
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ol.rv-lo-ro li'),
    ).toHaveText([
      'Calibrate a Venturi meter against a weigh tank.',
      'Compare the discharge coefficient with the weigh-tank reading.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    await expect(main(page).locator('.rv-block--attn')).toHaveCount(0);
  });
});

test.describe('RV-06 Decided · read-only', () => {
  test('(d) SUB-0074 approved — with the Content Manager (RV06); Back to Reviewed by me', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await open(page, 'SUB-0074', 'Transient Cooling');
    const mark = await markDocument(page);
    await expect(idCard(page).locator('.rv-kind')).toHaveText('New submission');
    await expect(crumbs(page)).toHaveText(/Reviewed by me\s*Transient Cooling/);
    await expect(
      page.getByRole('region', { name: 'Learning outcomes' }).locator('ol.rv-lo-ro li'),
    ).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(decided(page)).toHaveText(
      'Approved — with the Content ManagerDecided by you on 14 Aug 2026, 15:10Academic reviewApproved by youLearning outcomes2 outcomesPublicationNot published — the Content Manager decidesAccessNone — publishing gives no one accessThe Content Manager decides whether to publish it. Nothing is published yet.Back to Reviewed by me',
    );
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expectDecisionLayout(page);
    await drawn(page, 'Transient Cooling');
    await shot(page, 'rv06');
    await goToDecision(page);
    await reachAndClick(page, decided(page).getByRole('link', { name: 'Back to Reviewed by me' }));
    await expect(page).toHaveURL(/\/reviewer\/reviewed$/);
    await expectSameDocument(page, mark);
  });
});
