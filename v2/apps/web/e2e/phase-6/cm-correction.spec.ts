import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * The correction group in V3 (the owner-approved export CM-v1, `Main.dc.html` “CM-08 Updates
 * list”, “CM-08 Correction detail” and its dialogs): CM-05's correction entry opening the draft
 * (CM-06, CM-07 arrivals), CM-08 Updates (the correction tracker) and the correction page in every
 * state, on the test-hook build at 1440, 1024, 768 and 375, as Kavya Nair. Each state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll).
 *
 * Everything the screens do — Edit catalogue details opening the one draft with the summary focused
 * and the arrival explained, the check before sending (all three errors at once), typing the
 * correction with the comparison and the Changed tags following it, Save draft, “Back to the
 * published experiment” and its notice, Edit delivery link joining the draft, Send for academic
 * review through its dialog, Withdraw through its dialog with its required reason — is done by real
 * clicks and typing in one tab (one world, no reload). The cross-role effect this group owns: a
 * saved draft is never public — the public experiment page (PU-06) still shows the live version —
 * and a sent update is read-only “In academic review”. The CI seam only SETS UP a world (the Super
 * Admin's hold) or READS the record. Loading and couldn't-load are the unit tests' (a fault plan).
 * No page names an update by its reference (UPD-…) — words, hidden dialogs, accessible names, the
 * browser tab — the owner's correction of 20 Oct 2026 (state-copy `CM-08.no-reference`); the
 * reference stays in the address, where this spec reads it.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const KAVYA = { personId: 'per-kavya-nair' };
const SUPER_ADMIN = { personId: 'sa-arjun-mehta' };
const PUBLISHED = (id: string) => `/content-manager/published/${id}`;
const UPDATE = (id: string) => `/content-manager/updates/${id}`;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/cm-correction/shots';

const LIVE_SUMMARY =
  'Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag.';
const NEW_SUMMARY =
  'Bring a binary column from cold start to steady state, raising the reflux ratio for a purer overhead under realistic lag.';
const NEW_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite.';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port call as a sample person through the CI seam, which must succeed. */
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

interface UpdateRecord {
  readonly id: string;
  readonly rev: number;
  readonly state: string;
  readonly proposed: { readonly summary: string; readonly description: string };
  readonly versionLabel: string | null;
}

async function updateRecord(page: Page, id: string): Promise<UpdateRecord> {
  return (
    await port<{ readonly update: UpdateRecord }>(page, KAVYA, 'corrections', 'getUpdate', id)
  ).update;
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
/** The correction's status pill in its identity band. */
const chip = (page: Page) => main(page).locator('section.cm-idband .rb-id-status .xr-st');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your update' });
const stateNotice = (page: Page) => page.locator('#cm-u-state');
const button = (scope: Locator, name: string) => scope.getByRole('button', { name, exact: true });
const field = (page: Page, label: string) =>
  main(page).getByRole('textbox', { name: label, exact: true });
const WHY_FIELD = 'Reason for the change (required to send)';
const VERSION_FIELD = 'New version label (required to send)';
const comparisonFields = (page: Page) => main(page).locator('table.cm-cmp td.cm-cmp-f');

/** Any internal reference (state-copy `CM-08.no-reference`; the SA-v1 rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
/**
 * The only references these pages show: the sample world's seeded “what changes and why” — words a
 * person wrote, quoted as written (the Reason field while editable, “What changes and why” once
 * sent) — named one by one, never a pattern.
 */
type SeededWhy = 'Correction UPD-0006.';

/**
 * No reference in the page's words (`innerText`), in any text of the document — hidden dialogs and
 * screen-reader-only words included — in a field's value, in any `aria-label`, `title` or
 * `placeholder`, or in the browser tab; except the one seeded quote named, which must show where a
 * person's words show.
 */
async function expectNoReferences(page: Page, seeded?: SeededWhy): Promise<void> {
  const seen = await page.evaluate(() => {
    const all: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement?.closest('script, style, noscript, template')) {
        all.push(node.textContent ?? '');
      }
    }
    const why = document.getElementById('cm-u-why');
    return {
      words: document.body.innerText,
      all: all.join(' '),
      values: [...document.querySelectorAll('input, textarea')].map(
        (control) => (control as HTMLInputElement | HTMLTextAreaElement).value,
      ),
      names: [...document.querySelectorAll('[aria-label], [title], [placeholder]')].flatMap(
        (element) =>
          ['aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name) ?? ''),
      ),
      title: document.title,
      quoted: [
        why instanceof HTMLTextAreaElement ? why.value : '',
        ...[...document.querySelectorAll('main blockquote.rk-quote')].map((quote) =>
          (quote as HTMLElement).innerText.trim(),
        ),
      ],
    };
  });
  const drop = (words: string) => (seeded ? words.split(seeded).join('') : words);
  if (seeded) expect(seen.quoted).toContain(seeded);
  expect(drop(seen.words)).not.toMatch(REFERENCE);
  expect(drop(seen.all)).not.toMatch(REFERENCE);
  for (const value of seen.values) expect(drop(value)).not.toMatch(REFERENCE);
  for (const name of seen.names) expect(name).not.toMatch(REFERENCE);
  expect(seen.title).not.toMatch(REFERENCE);
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

test.describe('CM-05 → CM-06 / CM-07 → CM-08: one correction draft, never public until released', () => {
  test('Edit catalogue details opens the draft (arrival, summary focused); the check; typing and Save draft (PU-06 stays live); back; Edit delivery link joins it; Send → In academic review', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('distillation-column'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);

    // CM-06: Edit catalogue details → the one draft, the summary focused, the arrival explained.
    await reachAndClick(page, button(main(page), 'Edit catalogue details'));
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005\?focus=summary$/);
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'Summary')).toBeFocused();
    await expectSameDocument(page, mark);
    await expect(page.locator('#cm-u-entry')).toContainText(
      'New correction draft, from Edit catalogue details',
    );
    await expect(page.locator('#cm-u-entry')).toContainText(
      'Every field is pre-filled with live version 1.2.',
    );
    const band = main(page).locator('section.cm-idband');
    await expect(band.locator('.rk-eyebrow')).toHaveText('Correction to a published experiment');
    await expect(chip(page)).toHaveText('Draft');
    await expect(band.locator('.cm-ver')).toHaveText(/1\.2 live\s*No version label yet/);
    await expect(band.locator('dl.cm-idfacts dd').first()).toHaveText(
      '1.2, unchanged until released',
    );
    await expect(band.locator('.cm-you')).toHaveText('Your step');
    await expect(field(page, 'Name')).toHaveValue('Distillation Column');
    await expect(field(page, 'Summary')).toHaveValue(LIVE_SUMMARY);
    await expect(field(page, 'WEB · web link')).toHaveValue(
      'https://labs.meridian.example/distillation-column',
    );
    await expect(field(page, 'VR · package reference')).toHaveValue('MVL-DC-VR-1.2');
    await expect(main(page).getByRole('region', { name: 'Current and proposed' })).toContainText(
      'Nothing changed yet.',
    );
    await expect(main(page).locator('.rk-tl-w')).toHaveText([
      'Correction started from Edit catalogue details',
    ]);
    await expect(stateNotice(page)).toContainText('Draft — only you can see it');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(
      /^Updates\s*Update to Distillation Column$/,
    );
    await expect(page).toHaveTitle(
      'Update to Distillation Column · Updates · XR Learning Platform',
    );
    // The closed dialogs too name the update by its experiment.
    await expect(page.locator('dialog.rk-dialog h2')).toHaveText([
      'Send the update to Distillation Column for academic review?',
      'Withdraw the update to Distillation Column?',
    ]);
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm06-new-draft');

    // The check: Send with nothing changed — every error at once, the summary focused.
    await reachAndClick(page, button(panel(page), 'Send for academic review'));
    const summary = page.locator('#cm-u-errs');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveText([
      'Say what changes and why',
      'Enter the version label, for example 1.3',
      'Change at least one catalogue detail or delivery link',
    ]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main(page).locator('#cm-u-chg-err')).toHaveText(
      'Change at least one catalogue detail or delivery link',
    );
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    if (width(page) === 1440 || width(page) === 375) await shot(page, 'cm08-draft-errors');
    await summary.getByRole('link', { name: 'Say what changes and why' }).click();
    await expect(field(page, WHY_FIELD)).toBeFocused();

    // Typing the correction: the comparison, the Changed tags and the band follow the form.
    await field(page, WHY_FIELD).fill(WHY);
    await field(page, 'Summary').fill(NEW_SUMMARY);
    await field(page, 'Description').fill(NEW_DESCRIPTION);
    await field(page, VERSION_FIELD).fill('1.3');
    await expect(comparisonFields(page)).toHaveText(['Summary', 'Description', 'Version']);
    await expect(main(page).locator('.cm-tag')).toHaveText(['Changed', 'Changed']);
    await expect(band.locator('.cm-ver')).toHaveText(/1\.2 live\s*1\.3 proposed/);
    await expect(summary).toHaveCount(0);
    await expect(panel(page).locator('dl.rk-stand')).toContainText('you have unsaved changes');
    await reachAndClick(page, button(panel(page), 'Save draft'));
    const saved = page.locator('#cm-u-saved');
    await expect(saved).toContainText('Draft saved');
    await expect(saved).toContainText(/· the live version is unchanged$/);
    await expect(saved).toBeFocused();
    const draft = await updateRecord(page, 'UPD-0005');
    expect([draft.state, draft.proposed.summary, draft.versionLabel]).toEqual([
      'draft',
      NEW_SUMMARY,
      '1.3',
    ]);
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm08-draft-saved');

    // Cross-role: a saved draft is never public — PU-06 still reads the live version.
    await softNavigate(page, '/experiments/distillation-column');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);
    await expect(page.locator('.xp-xsum')).toHaveText(LIVE_SUMMARY);
    await expect(page.locator('main')).not.toContainText(NEW_SUMMARY);
    await page.goBack();
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);

    // “Back to the published experiment”: CM-05 says “Back from the correction” once.
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(main(page)).toContainText('Back from the correction');

    // CM-07 joins the same draft (never a second update), the web link focused, the join said.
    await reachAndClick(page, button(main(page), 'Edit delivery link'));
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005\?focus=web-link$/);
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'WEB · web link')).toBeFocused();
    await expect(page.locator('#cm-u-entry')).toContainText('Your edit joins the open update');
    await expect(page.locator('#cm-u-entry')).toContainText(
      'so your delivery change goes into it. One correction at a time per experiment.',
    );
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm07-joined');
    await field(page, 'WEB · web link').fill(
      'https://labs.meridian.example/distillation-column-1-3',
    );

    // Send for academic review (its dialog): saves what is on the page and sends it.
    await reachAndClick(page, button(panel(page), 'Send for academic review'));
    const dialog = page.getByRole('dialog', {
      name: 'Send the update to Distillation Column for academic review?',
    });
    await expect(dialog).toContainText(
      'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it.',
    );
    await expect(dialog).toContainText(
      'Version 1.2 stays live — nothing changes for the public or for students.',
    );
    await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    if (width(page) === 1440 || width(page) === 375) await shot(page, 'cm08-send-dialog');
    await reachAndClick(page, button(dialog, 'Send for academic review'));
    await expect(chip(page)).toHaveText('In academic review');
    await expect(stateNotice(page)).toBeFocused();
    await expect(stateNotice(page)).toContainText(
      'Read-only while it is reviewed. The live version 1.2 is unchanged.',
    );
    await expect(main(page).getByRole('textbox')).toHaveCount(0);
    await expect(comparisonFields(page)).toHaveText([
      'Summary',
      'Description',
      'WEB · web link',
      'Version',
    ]);
    await expect(main(page).locator('.rk-tl-w')).toHaveText([
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    await expect(panel(page).getByRole('button')).toHaveText(['Withdraw update']);
    await expect(
      panel(page).getByRole('link', { name: 'Open the published experiment' }),
    ).toBeVisible();
    const sent = await updateRecord(page, 'UPD-0005');
    expect(sent.state).toBe('in-academic-review');
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm08-in-review');

    // Only “Open update” on CM-05 now; the public page still reads 1.2's summary.
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      UPDATE('UPD-0005'),
    );
    await expect(button(main(page), 'Edit catalogue details')).toHaveCount(0);
    await softNavigate(page, '/experiments/distillation-column');
    await expect(page.locator('.xp-xsum')).toHaveText(LIVE_SUMMARY, { timeout: 90_000 });
    await expectSameDocument(page, mark);
  });

  test('returned (UPD-0006): the reason first, editable; Withdraw (its dialog) needs a reason → Withdrawn (closed stages dashed)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(UPDATE('UPD-0006'));
    await expect(heading(page, 'Update to Induction Motor Loading')).toBeVisible({
      timeout: 90_000,
    });
    await expect(chip(page)).toHaveText('Returned');
    const reason = main(page).getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason).toContainText('26 Aug 2026, 10:00 · Prof. A. Menon');
    await expect(reason.locator('blockquote p').first()).toHaveText(
      'The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.',
    );
    // The seeded “what changes and why” is a person's words, quoted as written (the one reference).
    await expect(field(page, WHY_FIELD)).toHaveValue('Correction UPD-0006.');
    await expect(stateNotice(page)).toContainText(
      'Prof. A. Menon returned it on 26 Aug 2026. Change it and send it for academic review again.',
    );
    await expect(field(page, 'VR · package reference')).toBeVisible();
    await expect(field(page, 'MR · package reference')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(
      /^Updates\s*Update to Induction Motor Loading$/,
    );
    await expect(page).toHaveTitle(
      'Update to Induction Motor Loading · Updates · XR Learning Platform',
    );
    await checkState(page, 'Update to Induction Motor Loading');
    await expectNoReferences(page, 'Correction UPD-0006.');
    await shot(page, 'cm08-returned');

    await reachAndClick(page, button(panel(page), 'Withdraw update'));
    const dialog = page.getByRole('dialog', {
      name: 'Withdraw the update to Induction Motor Loading?',
    });
    await expect(dialog).toContainText(
      'Nothing changes in the live version. The update closes and can’t be sent again; you can start a new correction later.',
    );
    await expect(dialog.getByLabel('Reason (required)')).toBeFocused();
    await reachAndClick(page, button(dialog, 'Withdraw update'));
    await expect(dialog).toContainText('Add a reason for withdrawing this update');
    await checkState(page, 'Update to Induction Motor Loading');
    await expectNoReferences(page, 'Correction UPD-0006.');
    if (width(page) === 1440 || width(page) === 375) await shot(page, 'cm08-withdraw-dialog');
    await dialog
      .getByLabel('Reason (required)')
      .fill('Raised by mistake — the vendor is sending a corrected build first.');
    await reachAndClick(page, button(dialog, 'Withdraw update'));
    await expect(chip(page)).toHaveText('Withdrawn');
    await expect(stateNotice(page)).toBeFocused();
    await expect(stateNotice(page)).toContainText(
      'Reason: “Raised by mistake — the vendor is sending a corrected build first.”',
    );
    await expect(main(page).locator('section.cm-idband li.cm-step.is-off')).toHaveCount(4);
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(
      main(page).getByRole('region', { name: 'What changes and why' }).locator('blockquote'),
    ).toHaveText('Correction UPD-0006.');
    await checkState(page, 'Update to Induction Motor Loading');
    await expectNoReferences(page, 'Correction UPD-0006.');
    await shot(page, 'cm08-withdrawn');

    // The experiment offers a new correction again; no “Back from the correction” after a withdrawal.
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Induction Motor Loading')).toBeVisible({ timeout: 90_000 });
    await expect(main(page)).not.toContainText('Back from the correction');
    await expect(button(main(page), 'Start a correction')).toBeVisible();
  });

  test('after Flow E: awaiting the release decision; then on hold (the reason shown)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: KAVYA });
    await page.goto(UPDATE('UPD-0005'));
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Awaiting release decision');
    await expect(stateNotice(page)).toContainText('Approved by Prof. A. Menon on');
    await expect(comparisonFields(page)).toHaveText(['Description', 'WEB · web link', 'Version']);
    await expect(main(page).locator('.rk-tl-w')).toHaveText([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm08-awaiting');

    // World set-up through the CI seam: the Super Admin holds UPD-0005.
    const before = await updateRecord(page, 'UPD-0005');
    await port(page, SUPER_ADMIN, 'corrections', 'holdUpdate', {
      id: 'UPD-0005',
      reason: 'Version 1.2 stays live while the 1.3 build is checked.',
      expectedRev: before.rev,
    });
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const held = main(page).getByRole('link', {
      name: 'Open the update to Distillation Column, version 1.3, on hold',
    });
    await expect(held).toHaveAttribute('href', UPDATE('UPD-0005'));
    await expectNoReferences(page);
    await reachAndClick(page, held);
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('On hold');
    await expect(stateNotice(page)).toContainText(
      'Reason: “Version 1.2 stays live while the 1.3 build is checked.” — Arjun Mehta, Super Admin',
    );
    await expect(main(page).locator('.rk-tl-w').first()).toHaveText('Put on hold by Arjun Mehta');
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm08-on-hold');
  });

  test('after Flow F: released (what changed); an update address with no update', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-f', session: KAVYA });
    await page.goto(UPDATE('UPD-0005'));
    await expect(heading(page, 'Update to Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Released');
    await expect(stateNotice(page)).toContainText(
      'The history keeps version 1.2 and every decision.',
    );
    const changed = main(page).getByRole('region', { name: 'What changed' });
    // Wide: the column heads; below 640 px of sheet each value is labelled (`span.cm-inlabel`).
    if (width(page) >= 768) {
      await expect(changed.getByRole('columnheader')).toHaveText([
        'Field',
        'Live before',
        'Released',
      ]);
    } else {
      await expect(changed.locator('tbody tr').first().locator('.cm-inlabel')).toHaveText([
        'Live before',
        'Released',
      ]);
    }
    await expect(comparisonFields(page)).toHaveText(['Description', 'WEB · web link', 'Version']);
    await expect(main(page).locator('.rk-tl-w').first()).toHaveText('Released by Arjun Mehta');
    await checkState(page, 'Update to Distillation Column');
    await expectNoReferences(page);
    await shot(page, 'cm08-released');

    await softNavigate(page, UPDATE('UPD-0099'));
    await expect(heading(page, 'No update open')).toBeVisible({ timeout: 90_000 });
    await expect(main(page)).toContainText('Start a correction from a published experiment.');
    await expect(
      main(page).getByRole('link', { name: 'Open the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(
      /^Updates\s*No update open$/,
    );
    await checkState(page, 'No update open');
    await expectNoReferences(page);
  });
});

test.describe('CM-08 Updates — the correction tracker', () => {
  test('spine-start: grouped by who must act; Continue opens the returned correction', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.cm-trkcount')).toHaveText(
      '5 corrections you raised, most recent change first',
    );
    await expect(main(page).locator('dl.rb-figs .rb-fig-t')).toHaveText([
      'Need you',
      'With others',
    ]);
    await expect(main(page).locator('section.cm-trksec h2')).toHaveText([
      /^Need you\s*1$/,
      /^With others\s*1$/,
      /^Closed\s*3$/,
    ]);
    await expect(main(page).locator('li.cm-trk.is-you .cm-qname')).toHaveText([
      'Induction Motor Loading',
    ]);
    await expect(main(page).locator('li.cm-trk.is-closed p.cm-trk-res')).toHaveCount(3);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    // Each card: the course and last change; its action named by the experiment and the version
    // label (two updates to Distillation Column never share a name); the reference only in its href.
    await expect(main(page).locator('li.cm-trk .cm-trk-meta > span:first-child')).toHaveText([
      'EEE ZC341 · Electrical Machines · last change 26 Aug',
      'CHE ZG513 · Process Instrumentation & Control · last change 20 Aug',
      'CHE ZG513 · Process Instrumentation & Control · last change 5 Aug',
      'CHE ZG513 · Process Instrumentation & Control · last change 3 Jul',
      'CHE ZG513 · Process Instrumentation & Control · last change 19 Jun',
    ]);
    expect(
      await main(page)
        .locator('li.cm-trk .cm-trk-act a')
        .evaluateAll((links) =>
          links.map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]),
        ),
    ).toEqual([
      ['Continue the update to Induction Motor Loading, version 1.1, returned', UPDATE('UPD-0006')],
      ['Open the update to Boiler Drum Level, version 2.1, on hold', UPDATE('UPD-0004')],
      ['Open the update to Orifice Plate Metering, version 1.1, released', UPDATE('UPD-0003')],
      ['Open the update to Distillation Column, version 1.2, released', UPDATE('UPD-0002')],
      ['Open the update to Distillation Column, version 1.1, released', UPDATE('UPD-0001')],
    ]);
    await expect(page).toHaveTitle('Updates · XR Learning Platform');
    await checkState(page, 'Updates');
    await expectNoReferences(page);
    await shot(page, 'cm08-updates');
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      main(page).getByRole('link', {
        name: 'Continue the update to Induction Motor Loading, version 1.1, returned',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0006$/);
    await expect(heading(page, 'Update to Induction Motor Loading')).toBeVisible({
      timeout: 90_000,
    });
    await expectSameDocument(page, mark);
  });
});
