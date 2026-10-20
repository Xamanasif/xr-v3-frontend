import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * CM-03 Publication decision and CM-05 Published experiment in the owner-approved Content Manager
 * export's V3 Refined B design (design/v3-refined-b/roles/CM-v1, `Main.dc.html` `v.decision`,
 * `v.published`; boards CM03-Decision, P01 … P09, CM05-Published, C14 … C16; the entries' behaviour
 * is `e2e/phase-6/cm-correction.spec.ts`) on the test-hook build at 1440, 1024, 768 and 375, as
 * Kavya Nair on the spine-start world. Each drawn state passes `checkState` (axe WCAG A/AA, one h1,
 * visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 *
 * Everything the screens do — choosing Publish or Send back, the publish confirmation, the send
 * back with its validation, references and reason, following the result to the public experiment
 * page, the course page and the catalogue — is done by real clicks and typing in one tab (one
 * world, no reload). The CI seam only READS (that publishing changed no access plan, licence or
 * Student grant; where a sent-back record now is) or SETS UP a world (UPD-0005 for CM-05's update
 * states). Neither page shows an internal reference (SUB-, UPD- …) in its words, names, dialogs,
 * announcements or tab title (owner visual-review correction, 20 Oct 2026): `expectNoReference`.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const KAVYA = { personId: 'per-kavya-nair' };
const SUPER_ADMIN = { personId: 'sa-arjun-mehta' };
const RITU = { personId: 'per-ritu-sharma' };
const MENON = { personId: 'per-a-menon' };
const DECISION = (id: string) => `/content-manager/decisions/${id}`;
const PUBLISHED = (id: string) => `/content-manager/published/${id}`;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/cm-decision/shots';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam, which must succeed. */
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

/** The spine-start world's Institute Admins: Malnad, Deccan (paused) and Konark. */
const INSTITUTE_ADMINS = [
  { personId: 'per-v-hegde' },
  { personId: 'per-s-kulkarni' },
  { personId: 'per-r-bhatt' },
] as const;

/**
 * Every access fact a publication could touch, read through the CI seam (reads only): each
 * institution with its plans, licences and people as the Super Admin reads it, and each
 * institution's content access and Student grants as its Institute Admin reads them (whatever
 * each answers — a paused institution's refusal included).
 */
async function accessFacts(page: Page): Promise<string> {
  const rows = await port<readonly { readonly id: string }[]>(
    page,
    SUPER_ADMIN,
    'institutions',
    'listInstitutions',
    { tab: 'all' },
  );
  const details = [];
  for (const row of rows) {
    details.push(await port(page, SUPER_ADMIN, 'institutions', 'getInstitution', row.id));
  }
  const admins = [];
  for (const admin of INSTITUTE_ADMINS) {
    admins.push(
      await actAs(page, admin, { port: 'institutions', method: 'listContentAccess' }),
      await actAs(page, admin, {
        port: 'studentAccess',
        method: 'listGrants',
        input: { showWithdrawn: true },
      }),
    );
  }
  return JSON.stringify({ rows, details, admins });
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const corrections = (page: Page) => page.getByRole('complementary', { name: 'Corrections' });
/** The identity band (`section.rb-id.cm-idband`). */
const band = (page: Page) => main(page).locator('section.rb-id.cm-idband');
/** The band's status pill (`div.rb-id-status > span.xr-st.rk-st-lg`). */
const chip = (page: Page) => band(page).locator('.rb-id-status > .xr-st');
const crumbs = (page: Page) => main(page).getByRole('navigation', { name: 'Breadcrumb' });
const region = (page: Page, name: string) => main(page).getByRole('region', { name });
const historyWhat = (page: Page) => region(page, 'History').locator('.rk-tl-w');
const historyNote = (page: Page) => region(page, 'History').locator('.rk-tl-n');
const done = (page: Page) => page.locator('#cm-d-done');

/** An internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference where a person reads or hears it (owner visual-review correction, 20 Oct
 * 2026; the SA-v1 rule): the page's words (`document.body.innerText`, screen-reader-only words and
 * status regions included), every dialog's words whether it is shown or not, the route
 * announcer's, every `aria-label`, `title` and `placeholder`, and the tab's title. CM-03 and CM-05
 * quote no seeded text holding a reference (the seeded “Correction UPD-0006.” is the correction
 * page's), so nothing is excepted. The references stay in the addresses.
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
    for (const dialog of document.querySelectorAll(
      'dialog, [role="dialog"], [role="alertdialog"]',
    )) {
      check('dialog', dialog.textContent);
    }
    check(
      'route announcer',
      document.querySelector('next-route-announcer')?.shadowRoot?.textContent,
    );
    for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
      for (const attribute of ['aria-label', 'title', 'placeholder']) {
        check(`${attribute} of ${element.tagName.toLowerCase()}`, element.getAttribute(attribute));
      }
    }
    check('tab title', document.title);
    return hits;
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/**
 * The detail layout: the record on the left and the panel beside it; below 860 px of page width
 * the panel under the record, with “Go to …” in the band.
 */
async function expectDetailLayout(page: Page, aside: Locator): Promise<void> {
  const sheet = await main(page).locator('.rk-mainsheet').boundingBox();
  const box = await aside.boundingBox();
  if (!sheet || !box) throw new Error('not laid out');
  const goTo = band(page).locator('a.rk-goto');
  if (await goTo.isVisible()) {
    expect(box.y).toBeGreaterThan(sheet.y + sheet.height - 1);
  } else {
    expect(box.x).toBeGreaterThan(sheet.x + sheet.width - 1);
  }
}

/** Waits for the element's CSS animations and transitions (a dialog fading in) to finish. */
async function settle(locator: Locator): Promise<void> {
  await locator.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => null)),
    ),
  );
}

/**
 * A press inside a decision panel. On wide screens the panel is sticky and, when taller than the
 * window, scrolls on its own (`aside.rk-aside`, rb-kit.css); the person scrolls the panel to the
 * control first, as the wheel over the page does not.
 */
async function pressInPanel(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await reachAndClick(page, target);
}

async function openDecision(page: Page, id: string, name: string): Promise<void> {
  await page.goto(DECISION(id));
  await expect(heading(page, name)).toBeVisible({ timeout: 90_000 });
  await expect(panel(page)).toBeVisible();
}

/** The gate's checks, in order (`li.cm-check`). */
function checkRows(page: Page): Locator {
  return main(page).getByRole('list', { name: 'Publication check' }).locator('li');
}

/** The summary's delivery rows (`ul.cm-devs` under “Delivery by format”). */
function deliveryRows(page: Page): Locator {
  return region(page, 'Submission and review summary').locator(
    'ul.cm-devs > li.cm-dev:not(.cm-dev--head)',
  );
}

test.describe('CM-03 Publication decision', () => {
  test('SUB-0074: Publish through the confirmation → Published; the public pages list it; no access changed', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0074', 'Transient Cooling');
    const mark = await markDocument(page);
    const world = await inspectWorld(page);

    // CM03-Decision: open, nothing missing, no choice yet.
    await expect(crumbs(page).getByRole('link', { name: 'Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    // The record kind and the tab name no submission reference (it stays in the address).
    await expect(band(page).locator('.rk-eyebrow')).toHaveText('First publication');
    await expect(page).toHaveTitle('Transient Cooling · Ready to publish · XR Learning Platform');
    await expect(chip(page)).toHaveText('Ready to publish');
    await expect(chip(page)).toHaveClass(/xr-st--info/);
    await expect(band(page).locator('.rb-id-status')).toContainText(
      'From Northline Simulation Studio',
    );
    await expect(band(page).locator('dl.cm-idfacts > div')).toHaveText([
      /Formats\s*WEB/,
      /Learning outcomes\s*2/,
      /Version\s*1\.0/,
      /Submission\s*Revision 1/,
    ]);
    const track = band(page).getByRole('list', { name: 'Where this submission is' });
    await expect(track.locator('li[aria-current="step"]')).toContainText('Publication decision');
    await expect(track.locator('li[aria-current="step"] .cm-you')).toHaveText('Your step');
    await expect(region(page, 'Publication check').locator('.cm-gateline')).toHaveText(
      'All 4 met · ready to publish',
    );
    await expect(checkRows(page)).toHaveText([
      'Met: Approved by the Academic ReviewerProf. A. Menon · 14 Aug 2026',
      'Met: Learning outcomes2 outcomes · one set for every format',
      'Met: Catalogue detailsName, course, summary, description, version',
      'Met: Delivery details for each formatWEB — complete',
    ]);
    const preview = region(page, 'Catalogue preview').locator('article.cm-cat');
    await expect(preview.locator('.cm-cat-top > .xr-st')).toHaveText('Preview — not public yet');
    await expect(preview.locator('.cm-cat-course')).toHaveText(
      'ME ZG523Thermodynamics & Heat Transfer',
    );
    await expect(preview.locator('ol.cm-ol li')).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(region(page, 'Submission and review summary').locator('dl.rk-dl')).toContainText(
      'Northline Simulation Studio · Anil Shetty',
    );
    await expect(deliveryRows(page)).toHaveText([/WEB\s*Browser.*Web link.*Passed review/]);
    await expect(historyWhat(page)).toHaveText([
      'Approved by Prof. A. Menon',
      'Submitted for academic review',
    ]);
    await expect(panel(page).getByRole('radio', { name: 'Publish' })).not.toBeChecked();
    await expect(panel(page).locator('p.rk-pending')).toHaveText('Choose Publish or Send back.');
    await expect(currentSidebarItem(page).first()).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    await expectDetailLayout(page, panel(page));
    await checkState(page, 'Transient Cooling');
    await expectNoReference(page);
    await shot(page, 'cm03-open');

    // No choice made: the error summary takes focus.
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Publish' }));
    const summary = panel(page).locator('#cm-d-errs');
    await expect(summary).toBeFocused();
    await expect(summary).toHaveText(/Check your decision\s*Choose a decision/);
    await checkState(page, 'Transient Cooling');
    if (width(page) === 1440) await shot(page, 'cm03-choice-error');

    const before = await accessFacts(page);

    // The confirmation (P01): what publishing does now, and only after later events.
    await pressInPanel(page, panel(page).getByRole('radio', { name: 'Publish' }));
    await expect(summary).toBeHidden();
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Publish' }));
    const dialog = page.getByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-now li')).toHaveText([
      'It appears in the public catalogue under ME ZG523 · Thermodynamics & Heat Transfer with WEB.',
      'The vendor and the Academic Reviewer see it as Published. Its submission becomes read-only.',
      'Any later change goes through a correction: you, then the Academic Reviewer, then the Super Admin’s release.',
    ]);
    await expect(dialog.locator('.rk-dlg-later li')).toHaveText([
      'Institutions can use it only once BITS gives them access to it. Publishing gives no one access.',
      'Students get access only when their institution’s administrator gives it.',
    ]);
    await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
    await expectNoReference(page);
    await settle(dialog);
    if (width(page) === 1440 || width(page) === 375) await shot(page, 'cm03-confirm');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Publish' })).toBeFocused();
    await expect(chip(page)).toHaveText('Ready to publish');

    await pressInPanel(page, panel(page).getByRole('button', { name: 'Publish' }));
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Publish' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // P06: the result; focus on it; publishing gave no one access.
    await expect(done(page)).toBeFocused();
    await expect(done(page).locator('.xr-st--ok')).toHaveText('Published');
    await expect(done(page).locator('.rk-done-meta')).toHaveText(/^Published by you on /);
    await expect(done(page).locator('dl.rk-stand > div')).toHaveText([
      /Catalogue\s*Listed under ME ZG523 with WEB/,
      /Institution access\s*Unchanged — no institution was given access/,
      /Student access\s*Unchanged — no student was given access/,
      /Vendor and reviewer\s*See it as Published, read-only/,
    ]);
    await expect(chip(page)).toHaveText('Published');
    await expect(deliveryRows(page)).toHaveText([/WEB\s*Browser.*Published/]);
    await expect(historyWhat(page).first()).toHaveText('Published by Kavya Nair');
    await expect(historyNote(page).first()).toHaveText(
      'In the public catalogue under ME ZG523 · Thermodynamics & Heat Transfer with WEB. No one was given access.',
    );
    await expect(
      done(page).getByRole('link', { name: 'Open the published experiment' }),
    ).toHaveAttribute('href', '/content-manager/published/transient-cooling');
    await expect(
      done(page).getByRole('link', { name: 'Back to Ready to publish' }),
    ).toHaveAttribute('href', '/content-manager/ready');
    await checkState(page, 'Transient Cooling');
    await expectNoReference(page);
    await shot(page, 'cm03-published');

    // Publishing gave no one access: every plan, licence and Student grant reads as before.
    expect(await accessFacts(page)).toBe(before);
    const after = await inspectWorld(page);
    expect([after.instance, after.attached]).toEqual([world.instance, 1]);

    // The public experiment page (PU-06), in the same tab.
    await pressInPanel(page, done(page).getByRole('link', { name: 'View the public page' }));
    await expect(heading(page, 'Transient Cooling')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/experiments\/transient-cooling$/);
    await expectSameDocument(page, mark);
    // Its course page (PU-05) lists it.
    await reachAndClick(page, main(page).getByRole('link', { name: 'View the course' }));
    await expect(page).toHaveURL(/\/courses\/thermodynamics-heat-transfer$/);
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    // The public catalogue (PU-04, from the public footer at every width) lists it.
    await reachAndClick(
      page,
      page.locator('footer').getByRole('link', { name: 'Browse experiments' }),
    );
    await expect(page).toHaveURL(/\/experiments$/);
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('before publication the public page does not exist and the course does not list it', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await page.goto('/experiments/transient-cooling');
    await expect(heading(page, 'We can’t find that experiment')).toBeVisible({ timeout: 90_000 });
    await page.goto('/courses/thermodynamics-heat-transfer');
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Fin-Tube Bundle' }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toHaveCount(0);
  });

  test('SUB-0070: Send back to the vendor — who and why first, then a reason and a reference', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0070', 'Packed Bed Pressure Drop');
    await pressInPanel(page, panel(page).getByRole('radio', { name: 'Send back' }));
    await expect(panel(page).getByRole('group', { name: /^Send it to/ })).toBeVisible();
    await expect(panel(page).getByRole('button', { name: 'Send back' })).toBeVisible();

    // P03: both errors at once in the summary, which takes focus.
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Send back' }));
    const summary = panel(page).locator('#cm-d-errs');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveText([
      'Choose who it goes back to',
      'Add a reason so they know what to change',
    ]);
    // From the keyboard, the summary's first link moves focus to its field.
    await page.keyboard.press('Tab');
    await expect(summary.getByRole('link', { name: 'Choose who it goes back to' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel(page).getByRole('radio', { name: 'Academic Reviewer' })).toBeFocused();
    await expect(panel(page).locator('.rk-ferr')).toHaveText([
      'Choose who it goes back to',
      'Add a reason so they know what to change',
    ]);
    await expect(
      panel(page).getByRole('textbox', { name: 'Reason they will see (required)' }),
    ).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Packed Bed Pressure Drop');
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'cm03-send-errors');

    // P04: to the vendor, the reason label names them; references show (OD-B6-05).
    await pressInPanel(page, panel(page).getByRole('radio', { name: 'Vendor' }));
    await expect(panel(page).getByRole('radio', { name: 'Vendor' })).toBeChecked();
    await expect(panel(page).locator('.rk-ferr')).toHaveText([
      'Add a reason so they know what to change',
    ]);
    const reason = panel(page).getByRole('textbox', {
      name: 'Reason the vendor will see (required)',
    });
    const refs = panel(page).getByRole('group', { name: /What it refers to/ });
    await expect(refs).toBeVisible();
    await expect(refs.locator('label.rk-check')).toHaveText([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Formats & delivery · AR · Package',
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
      'Preview & documents · Preview link',
    ]);
    await reason.fill('');
    await reason.pressSequentially('Name the supported phones and tablets for the AR build.');
    await expect(panel(page).locator('.rk-ferr')).toHaveCount(0);
    await pressInPanel(
      page,
      refs.getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    );
    await expect(
      refs.getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    ).toBeChecked();
    await checkState(page, 'Packed Bed Pressure Drop');
    if (width(page) === 1440) await shot(page, 'cm03-send-vendor');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Send back' }));

    await expect(done(page)).toBeFocused({ timeout: 30_000 });
    await expect(done(page).locator('.xr-st.rk-st-lg')).toHaveText('With the vendor');
    await expect(done(page).locator('.rk-done-meta')).toHaveText(/^Sent back by you on /);
    await expect(done(page).locator('blockquote.rk-quote')).toHaveText(
      '“Name the supported phones and tablets for the AR build.”',
    );
    await expect(done(page)).toContainText(
      'Nothing is published. It goes back to the Academic Reviewer when the vendor resubmits.',
    );
    await expect(
      done(page).getByRole('link', { name: 'Back to Ready to publish' }),
    ).toHaveAttribute('href', '/content-manager/ready');
    await expect(chip(page)).toHaveText('With the vendor');
    await expect(historyWhat(page).first()).toHaveText('Sent back to the vendor by Kavya Nair');
    await expect(historyNote(page).first()).toHaveText(
      '“Name the supported phones and tablets for the AR build.” Refers to: Formats & delivery · AR · Device need.',
    );
    await checkState(page, 'Packed Bed Pressure Drop');
    await expectNoReference(page);

    // Where it is now, read as the vendor (CI seam, read only).
    const record = await port<{
      readonly submission: { readonly status: { readonly state: string; readonly by?: string } };
      readonly lastReturn: {
        readonly reason: string;
        readonly references: readonly unknown[];
      } | null;
    }>(page, RITU, 'production', 'getRecord', 'SUB-0070');
    expect(record.submission.status).toMatchObject({ state: 'returned', by: 'content-manager' });
    expect(record.lastReturn?.reason).toBe(
      'Name the supported phones and tablets for the AR build.',
    );
    expect(record.lastReturn?.references).toEqual([
      { step: 'formats-and-delivery', format: 'ar', field: 'device-need' },
    ]);

    // Back to Ready to publish: it is no longer listed.
    await pressInPanel(page, done(page).getByRole('link', { name: 'Back to Ready to publish' }));
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 60_000 });
  });

  test('SUB-0074: Send back to the Academic Reviewer with a reason (a re-check)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0074', 'Transient Cooling');
    await pressInPanel(page, panel(page).getByRole('radio', { name: 'Send back' }));
    await pressInPanel(page, panel(page).getByRole('radio', { name: 'Academic Reviewer' }));
    const reason = panel(page).getByRole('textbox', {
      name: 'Reason the Academic Reviewer will see (required)',
    });
    await expect(panel(page).getByRole('group', { name: /What it refers to/ })).toHaveCount(0);
    await reason.pressSequentially('Please re-check the second outcome against the description.');
    await pressInPanel(page, panel(page).getByRole('button', { name: 'Send back' }));

    // P05: the result names the reviewer.
    await expect(done(page)).toBeFocused({ timeout: 30_000 });
    await expect(done(page).locator('.xr-st--info')).toHaveText('Back with the Academic Reviewer');
    await expect(done(page).locator('dl.rk-stand > div').last()).toHaveText(
      /Now with\s*Prof\. A\. Menon, Academic Reviewer/,
    );
    await expect(chip(page)).toHaveText('Back with the Academic Reviewer');
    await expect(historyWhat(page).first()).toHaveText(
      'Sent back to the Academic Reviewer by Kavya Nair',
    );
    await expect(historyNote(page).first()).toHaveText(
      '“Please re-check the second outcome against the description.”',
    );
    await checkState(page, 'Transient Cooling');
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'cm03-sent-reviewer');

    // The Academic Reviewer has it back as a re-check (CI seam, read only).
    const queue = await port<readonly { readonly ref: { readonly id: string } }[]>(
      page,
      MENON,
      'production',
      'getReviewQueue',
      { type: 'recheck' },
    );
    expect(queue.map((item) => item.ref.id)).toContain('SUB-0074');
  });

  test('SUB-0086 still in academic review: read-only, nothing to decide yet', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0086', 'Flash Distillation');
    await expect(chip(page)).toHaveText('In academic review');
    await expect(chip(page)).toHaveClass(/xr-st--info/);
    await expect(crumbs(page).getByRole('link', { name: 'Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library?tab=in-review',
    );
    await expect(band(page).locator('.rb-id-status')).toContainText('From Meridian Virtual Labs');
    await expect(band(page).locator('li[aria-current="step"]')).toContainText('In academic review');
    await expect(region(page, 'Publication check').locator('.cm-gateline')).toHaveText(
      'Read from the record',
    );
    const notice = panel(page).locator('.rk-notice');
    await expect(notice).toHaveClass(/rk-notice--info/);
    await expect(notice).toContainText('Still in academic review');
    await expect(notice).toContainText(
      'The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then.',
    );
    await expect(checkRows(page).first()).toHaveText(
      'Not met: Approved by the Academic ReviewerNot approved yet',
    );
    await expect(deliveryRows(page)).toHaveText([/WEB\s*Browser.*In review/]);
    await expect(panel(page)).toContainText('Nothing to decide yet.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(panel(page).getByRole('radio')).toHaveCount(0);
    await expect(
      panel(page).getByRole('link', { name: 'Back to the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library?tab=in-review');
    await expectDetailLayout(page, panel(page));
    await checkState(page, 'Flash Distillation');
    await expect(band(page).locator('.rk-eyebrow')).toHaveText('First publication');
    await expect(page).toHaveTitle('Flash Distillation · Ready to publish · XR Learning Platform');
    await expectNoReference(page);
    await shot(page, 'cm03-in-review');
  });

  test('with the vendor (SUB-0081) and a re-check she asked for (SUB-0071): read-only', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0081', 'Forced Convection');
    await expect(chip(page)).toHaveText('With the vendor');
    const notice = panel(page).locator('.rk-notice');
    await expect(notice).toHaveClass(/rk-notice--off/);
    await expect(notice).toContainText('With the vendor');
    await expect(notice).toContainText(
      'The Academic Reviewer returned it with a reason on 24 Aug 2026. It comes back to the Academic Reviewer when the vendor resubmits.',
    );
    await expect(panel(page)).toContainText('Nothing to decide yet.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Forced Convection');
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'cm03-with-vendor');

    await page.goto(DECISION('SUB-0071'));
    await expect(heading(page, 'Venturi Meter Calibration')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Back with the Academic Reviewer');
    await expect(panel(page).locator('.rk-notice')).toContainText(
      'Back with the Academic Reviewer for a re-check',
    );
    await expect(panel(page).locator('.rk-notice')).toContainText(
      'You sent it back on 25 Aug 2026: “The second learning outcome',
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Venturi Meter Calibration');
    await expect(page).toHaveTitle(
      'Venturi Meter Calibration · Ready to publish · XR Learning Platform',
    );
    await expectNoReference(page);
  });

  test('after Flow E: SUB-0077 published — the result read from the record', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: KAVYA });
    await openDecision(page, 'SUB-0077', 'Conduction Through a Composite Wall');
    await expect(chip(page)).toHaveText('Published');
    await expect(done(page).locator('.xr-st--ok')).toHaveText('Published');
    await expect(done(page).locator('dl.rk-stand > div').first()).toHaveText(
      /Catalogue\s*Listed under ME ZG523 with WEB and VR/,
    );
    await expect(region(page, 'Publication check').locator('.cm-gateline')).toHaveText(
      'All 4 were met when it was published',
    );
    await expect(band(page).locator('li.cm-step.is-done')).toHaveCount(4);
    await expect(region(page, 'Submission and review summary').locator('dl.rk-dl')).toContainText(
      '— after 1 return with a reason',
    );
    await checkState(page, 'Conduction Through a Composite Wall');
    await expect(page).toHaveTitle(
      'Conduction Through a Composite Wall · Ready to publish · XR Learning Platform',
    );
    await expectNoReference(page);
    await shot(page, 'cm03-sub0077');

    // Its published experiment (CM-05): the first publication names no submission reference.
    await pressInPanel(
      page,
      done(page).getByRole('link', { name: 'Open the published experiment' }),
    );
    await expect(heading(page, 'Conduction Through a Composite Wall')).toBeVisible({
      timeout: 90_000,
    });
    await expect(historyWhat(page).last()).toHaveText(/^Published · version /);
    await expect(historyNote(page).last()).toHaveText('First publication by the Content Manager.');
    await expectNoReference(page);
  });
});

test.describe('CM-05 Published experiment', () => {
  test('Distillation Column: live and read-only; then an update in progress — draft and in academic review', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('distillation-column'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(crumbs(page).getByRole('link', { name: 'Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    await expect(band(page).locator('.rk-eyebrow')).toHaveText('CHE ZG513 · Published experiment');
    await expect(chip(page)).toHaveText('Published');
    await expect(band(page).locator('.rb-id-status .cm-ver-live')).toHaveText('1.2 live');
    await expect(band(page).locator('.rb-id-status')).toContainText('From Meridian Virtual Labs');
    await expect(band(page).locator('dl.cm-idfacts > div')).toHaveText([
      /Course\s*CHE ZG513 · Process Instrumentation & Control/,
      /Live since\s*3 Jul 2026/,
      /Formats\s*WEB · VR/,
      /Corrections\s*2 corrections released/,
    ]);
    await expect(band(page).getByRole('link', { name: 'View the public page' })).toHaveAttribute(
      'href',
      '/experiments/distillation-column',
    );
    const entry = region(page, 'In the public catalogue').locator('article.cm-cat');
    await expect(entry.locator('.cm-cat-top > .xr-st')).toHaveText('In the public catalogue');
    await expect(entry.locator('.cm-cat-avail')).toContainText('· version 1.2');
    await expect(entry.locator('ol.cm-ol li')).toHaveText([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    await expect(region(page, 'In the public catalogue').locator('dl.cm-p-dl dd')).toHaveText([
      /^Learners start a binary column/,
      '1.2, since 3 Jul 2026',
    ]);
    const delivery = region(page, 'Delivery');
    await expect(delivery.locator('.cm-delcard-h')).toHaveText([
      /WEB\s*Web link/,
      /VR\s*App package \(provisional\)$/,
    ]);
    await expect(delivery).toContainText('MVL-DC-VR-1.2');
    await expect(historyWhat(page)).toHaveText([
      'Version 1.2 released',
      'Version 1.1 released',
      'Published · version 1.0',
    ]);
    // The release notes are the product's words around each version's source (its update's
    // reference only), so the reference is left out — not seeded text quoted.
    await expect(historyNote(page)).toHaveText([
      'Correction released by the Super Admin.',
      'Correction.',
      'First publication by the Content Manager.',
    ]);
    // The Corrections panel: no update open — the three entries (their behaviour is
    // `e2e/phase-6/cm-correction.spec.ts`).
    await expect(corrections(page).getByRole('button')).toHaveText([
      'Start a correction',
      'Edit catalogue details',
      'Edit delivery link',
    ]);
    await expect(corrections(page).getByRole('link')).toHaveCount(0);
    await expect(currentSidebarItem(page).first()).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    await expectDetailLayout(page, corrections(page));
    await checkState(page, 'Distillation Column');
    await expect(page).toHaveTitle('Distillation Column · Content library · XR Learning Platform');
    await expectNoReference(page);
    await shot(page, 'cm05-live');

    // World set-up through the CI seam: Kavya opens UPD-0005 — a draft. Its reference is read from
    // the service's answer and the link's address, never from the page's words.
    const opened = await port<{ readonly update: { readonly id: string } }>(
      page,
      KAVYA,
      'corrections',
      'openCorrection',
      { experimentId: 'distillation-column', entry: 'edit-catalogue-details' },
    );
    const updateId = opened.update.id;
    expect(updateId).toBe('UPD-0005');
    const notice = corrections(page).locator('.rk-notice');
    await expect(notice).toHaveText(
      /A correction is open\s*Update draft in progress\. Edits to this experiment join that update\./,
    );
    await expect(
      corrections(page).getByRole('link', { name: 'Continue the update' }),
    ).toHaveAttribute('href', `/content-manager/updates/${updateId}`);
    await expect(corrections(page).getByRole('button')).toHaveText([
      'Edit catalogue details',
      'Edit delivery link',
    ]);
    const track = band(page).locator('.cm-idflow');
    await expect(band(page).locator('dl.cm-idfacts > div').last()).toHaveText(
      /Corrections\s*Update draft in progress/,
    );
    await expect(track.locator('.cm-idflow-h')).toHaveText(
      /Correction in progress\s*Update draft in progress\s*1\.2 live\s*No version label yet/,
    );
    await expect(
      track.getByRole('list', { name: 'Where the open correction is' }).locator('li'),
    ).toHaveCount(4);
    await expect(historyWhat(page).first()).toHaveText('Update started — draft');
    await checkState(page, 'Distillation Column');
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'cm05-draft');

    // … saved with version 1.3 and sent for academic review.
    const draft = await port<{
      readonly update: { readonly id: string; readonly rev: number; readonly proposed: object };
    }>(page, KAVYA, 'corrections', 'getUpdate', updateId);
    const saved = await port<{ readonly rev: number }>(
      page,
      KAVYA,
      'corrections',
      'saveCorrection',
      {
        id: draft.update.id,
        proposed: {
          ...draft.update.proposed,
          description:
            'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
        },
        whatChangesAndWhy: 'Corrects the reflux statement in the description.',
        versionLabel: '1.3',
        expectedRev: draft.update.rev,
      },
    );
    await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
      id: draft.update.id,
      expectedRev: saved.rev,
    });
    await expect(notice).toHaveText(
      /An update is in progress\s*Update in academic review\. It is with the Academic Reviewer\. You can start another correction once it is decided\./,
    );
    await expect(corrections(page).getByRole('button')).toHaveCount(0);
    await expect(corrections(page).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      `/content-manager/updates/${updateId}`,
    );
    await expect(track.locator('.cm-idflow-h')).toHaveText(
      /Update in academic review\s*1\.2 live\s*1\.3 proposed/,
    );
    await expect(historyWhat(page).first()).toHaveText('Update started — in academic review');
    await expect(historyNote(page).first()).toHaveText(
      'Version 1.3. The live version below is unchanged.',
    );
    await checkState(page, 'Distillation Column');
    await expectNoReference(page);
    if (width(page) === 1440) await shot(page, 'cm05-review');
  });

  test('Induction Motor Loading (UPD-0006 returned) and Boiler Drum Level (UPD-0004 on hold)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('induction-motor-loading'));
    await expect(heading(page, 'Induction Motor Loading')).toBeVisible({ timeout: 90_000 });
    await expect(corrections(page).locator('.rk-notice')).toHaveText(
      /A correction is open\s*Update returned to you\. It was returned to you with a reason\. Edits to this experiment join that update\./,
    );
    await expect(band(page).locator('dl.cm-idfacts > div').last()).toHaveText(
      /Corrections\s*Update returned to you/,
    );
    await expect(band(page).locator('.cm-idflow-h .xr-st')).toHaveText('Update returned to you');
    await expect(band(page).locator('.cm-idflow-h .xr-st')).toHaveClass(/xr-st--err/);
    await expect(
      corrections(page).getByRole('link', { name: 'Continue the update' }),
    ).toHaveAttribute('href', /^\/content-manager\/updates\/UPD-\d+$/);
    await expect(historyWhat(page).first()).toHaveText('Update started — returned');
    await checkState(page, 'Induction Motor Loading');
    await expectNoReference(page);
    await shot(page, 'cm05-returned');

    await page.goto(PUBLISHED('boiler-drum-level'));
    await expect(heading(page, 'Boiler Drum Level')).toBeVisible({ timeout: 90_000 });
    const notice = corrections(page).locator('.rk-notice');
    await expect(notice).toHaveClass(/rk-notice--paused/);
    await expect(notice).toHaveText(
      /An update is in progress\s*Update on hold\. The Super Admin put it on hold\. Version 2\.0 stays live\./,
    );
    await expect(band(page).locator('dl.cm-idfacts > div').last()).toHaveText(
      /Corrections\s*Update on hold/,
    );
    await expect(band(page).locator('.cm-idflow-h .xr-st')).toHaveText('Update on hold');
    await expect(corrections(page).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      '/content-manager/updates/UPD-0004',
    );
    await expect(band(page).locator('dl.cm-idfacts > div').nth(1)).toHaveText(
      /Live since\s*18 Jun 2026/,
    );
    await expect(historyWhat(page).first()).toHaveText('Update on hold');
    await checkState(page, 'Boiler Drum Level');
    await expectNoReference(page);
    await shot(page, 'cm05-on-hold');
  });

  test('after Flow F: version 1.3 released today — the notice, the history keeps every version', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-f', session: KAVYA });
    await page.goto(PUBLISHED('distillation-column'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const released = main(page).locator('.rk-notice--ok');
    await expect(released).toHaveText(
      /Version 1\.3 is live\s*The Super Admin released the correction on .+\. The history keeps version 1\.2 and every decision\. Nobody’s access changed\./,
    );
    await expect(band(page).locator('.rb-id-status .cm-ver-live')).toHaveText('1.3 live');
    await expect(historyWhat(page).first()).toHaveText('Version 1.3 released');
    await expect(historyNote(page).first()).toHaveText('Correction released by the Super Admin.');
    await expect(
      corrections(page).getByRole('button', { name: 'Start a correction' }),
    ).toBeVisible();
    await checkState(page, 'Distillation Column');
    await expectNoReference(page);
    await shot(page, 'cm05-released');
  });
});
