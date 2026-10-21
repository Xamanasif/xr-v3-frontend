import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
  sidebarLink,
} from '../support/workspace';

/**
 * RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me in the V3 Refined B design (the
 * owner-approved export design/v3-refined-b/roles/RV-v1, `RV.dc.html`), on the test-hook build at
 * 1440, 1024, 768 and 375, as Prof. A. Menon. Each drawn state passes `checkState` (axe WCAG A/AA,
 * one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll) and
 * shows no internal reference (SUB-, UPD-, …) in its words, names, titles or placeholders (the
 * owner's identifier rule): a record's reference is read from the address only. The world starts
 * at spine-start; the CI seam only SETS UP the world — Kavya Nair sends the Distillation Column
 * correction (UPD-0005), Anil Shetty submits “Conduction Through a Composite Wall” (SUB-0077),
 * Prof. Menon returns it and Anil resubmits (the routing stand-in sends revision 2 back to the
 * reviewer); or, for the calm state, Prof. Menon decides both waiting items. Everything the screens
 * do — the desk's Start review and Review, In your queue, Your review scope, Recently decided, the
 * tabs (by click and by arrow key), Course, the search, the chips, Clear filters, each row's link,
 * “Open Reviewed by me” — is done by real clicks and typing. RV-03, RV-04 and RV-06 are other
 * groups' pages: only their address and an h1 are checked. Loading, couldn't load and Reviewed by
 * me's empty state run in the component tests (the fault plan exists only there).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const MENON = { personId: 'per-a-menon' };
const ANIL = { personId: 'per-anil-shetty' };
const KAVYA = { personId: 'per-kavya-nair' };
const COMPOSITE = 'Conduction Through a Composite Wall';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/rv-lists/shots';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };
interface Rev {
  readonly id: string;
  readonly rev: number;
}

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

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05); the revision changes the VR device need. */
function compositeWall(vrDevice: string) {
  return {
    courseId: 'thermodynamics-heat-transfer',
    name: COMPOSITE,
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current browser on a laptop or desktop',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: null,
        packageFileName: 'composite-wall-vr-1.0.zip',
        deviceNeeded: vrDevice,
        installNotes: 'Install the build named above on the headset and open “Composite Wall Lab”.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

/** B6-01 f0 / B6-02 f0’s world from spine-start: four items waiting and SUB-0077 decided once. */
async function boardWorld(page: Page): Promise<void> {
  const opened = await port<{
    readonly update: Rev & { readonly proposed: Record<string, unknown> };
  }>(page, KAVYA, 'corrections', 'openCorrection', {
    experimentId: 'distillation-column',
    entry: 'edit-catalogue-details',
  });
  const corrected = await port<Rev>(page, KAVYA, 'corrections', 'saveCorrection', {
    id: opened.update.id,
    proposed: {
      ...opened.update.proposed,
      description:
        'Learners start a binary column from cold and bring it to steady state. Raising the reflux ratio raises the overhead purity.',
    },
    whatChangesAndWhy: 'Corrects the reflux statement in the description.',
    versionLabel: '1.3',
    expectedRev: opened.update.rev,
  });
  await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
    id: corrected.id,
    expectedRev: corrected.rev,
  });

  const draft = await port<Rev>(page, ANIL, 'production', 'saveDraft', {
    id: null,
    content: compositeWall('VR headset'),
    step: 'course',
    expectedRev: null,
  });
  await port(page, ANIL, 'production', 'submitForReview', {
    id: draft.id,
    content: compositeWall('VR headset'),
    expectedRev: draft.rev,
  });
  const view = await port<{ readonly submission: Rev }>(
    page,
    MENON,
    'production',
    'getSubmissionForReview',
    draft.id,
  );
  await port(page, MENON, 'production', 'returnSubmission', {
    id: view.submission.id,
    reason: 'Please clarify the VR device requirements.',
    references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
    outcomes: [],
    expectedRev: view.submission.rev,
  });
  const revised = compositeWall('Standalone VR headset and about 2 × 2 m of clear floor');
  const record = await port<{ readonly submission: Rev }>(
    page,
    ANIL,
    'production',
    'getRecord',
    draft.id,
  );
  const saved = await port<Rev>(page, ANIL, 'production', 'saveRevision', {
    id: record.submission.id,
    content: revised,
    expectedRev: record.submission.rev,
  });
  await port(page, ANIL, 'production', 'resubmit', {
    id: saved.id,
    content: revised,
    expectedRev: saved.rev,
  });
}

/** Prof. Menon decides both spine-start items: nothing waits (B6-01 f1, B6-02 f4). */
async function decideBoth(page: Page): Promise<void> {
  for (const id of ['SUB-0086', 'SUB-0071']) {
    const view = await port<{
      readonly submission: Rev & {
        readonly learningOutcomes: readonly { readonly text: string }[];
      };
    }>(page, MENON, 'production', 'getSubmissionForReview', id);
    const outcomes = view.submission.learningOutcomes.map((outcome) => outcome.text);
    await port(page, MENON, 'production', 'approveSubmission', {
      id: view.submission.id,
      outcomes: outcomes.length > 0 ? outcomes : ['Find the vapour fraction of a flashed feed.'],
      expectedRev: view.submission.rev,
    });
  }
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const region = (page: Page, name: string) => page.getByRole('region', { name });
const table = (page: Page) => main(page).locator('table.rk-table');
const rowLinks = (page: Page) => table(page).locator('tbody a.rk-rowlink');
const status = (page: Page) => main(page).locator('.rk-statusline [role="status"]');
const tab = (page: Page, name: RegExp) => page.getByRole('tab', { name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

/** An internal reference (the owner's identifier rule, every role). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference in the page's words (`document.body.innerText`, and every text node
 * outside scripts and styles, so hidden and screen-reader-only words and the announcements too),
 * in any `aria-label`, `title` or `placeholder`, or in the tab's title (`document.title`). No
 * seeded quote that names one reaches these three lists, so nothing is excepted.
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

/** A drawn state: the screen checks and no internal reference. */
async function drawn(page: Page, title: string): Promise<void> {
  await checkState(page, title);
  await expectNoReferences(page);
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** On a phone a table's rows become labelled blocks: its head is hidden; on wide pages it shows. */
async function expectTableLayout(page: Page): Promise<void> {
  const head = table(page).locator('thead');
  if (width(page) <= 375) {
    await expect
      .poll(() =>
        head.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.display === 'none' || style.position === 'absolute';
        }),
      )
      .toBe(true);
  } else if (width(page) >= 1440) {
    await expect(head).toBeVisible();
  }
}

/** A link reached and pressed: Enter after focus (a wrapped inline link at 375), else a click. */
async function follow(page: Page, link: Locator): Promise<void> {
  if (width(page) <= 375) {
    await link.focus();
    await page.keyboard.press('Enter');
  } else {
    await reachAndClick(page, link);
  }
}

/** Opens a rail destination with a real click (the Menu drawer below 1024 px). */
async function openFromRail(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href).first());
}

test.describe('RV-01 Overview and RV-02 Review queue', () => {
  test('spine-start, then four items waiting: the desk, its side cards, the queue, filters and rows', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const lead = main(page).locator('.rk-head p.rk-sub');
    await expect(lead).toHaveText('2 items are waiting for your academic decision, oldest first.');
    const desk = region(page, 'Waiting for your decision');
    await expect(desk.locator('.rv-next h3.rv-next-t')).toHaveText('Flash Distillation');
    await expect(desk.locator('li.rv-wl-row .rv-wl-t')).toHaveText(['Venturi Meter Calibration']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer');
    await drawn(page, 'Overview');

    // The world moves (set-up): four items, oldest first.
    await boardWorld(page);
    await expect(lead).toHaveText('4 items are waiting for your academic decision, oldest first.');
    const next = desk.locator('.rv-next');
    await expect(next.locator('.rv-kind')).toHaveText('New submission');
    await expect(next.locator('.rv-from')).toHaveText('Revision 1 · from Meridian Virtual Labs');
    await expect(next.locator('.rk-tag-warn')).toHaveText('No learning outcomes yet');
    await expect(next.locator('.rv-age--lg span')).toHaveText('since 24 Aug');
    const start = next.getByRole('link', { name: 'Start review: Flash Distillation' });
    await expect(start).toHaveClass(/rb-btn--primary/);
    await expect(main(page).locator('a.rb-btn--primary')).toHaveCount(1);
    const rest = desk.locator('li.rv-wl-row');
    await expect(rest.locator('.rv-wl-t')).toHaveText([
      'Venturi Meter Calibration',
      'Distillation Column',
      COMPOSITE,
    ]);
    await expect(rest.locator('.rv-kind')).toHaveText([
      'Re-check',
      /^Update\s*1\.2 → 1\.3$/,
      /^Resubmitted\s*revision 2$/,
    ]);
    await expect(rest.locator('.rv-from')).toHaveText([
      'Sent back by the Content Manager',
      'From Kavya Nair, Content Manager',
      /^Resubmitted \d{1,2} [A-Z][a-z]{2} · from Northline Simulation Studio$/,
    ]);
    await expect(rest.nth(0).locator('.rv-wl-focus')).toHaveText(
      '“The second learning outcome mentions a Pitot tube, which this experiment…”',
    );
    await expect(
      rest.getByRole('link', { name: 'Review the update to Distillation Column' }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0005');
    await expect(region(page, 'In your queue').locator('b.rv-type-n')).toHaveText(['2', '1', '1']);
    await expect(region(page, 'Your review scope').locator('a.rv-course')).toHaveCount(3);
    await expect(region(page, 'Recently decided').locator('.rv-recent-t')).toHaveText([
      COMPOSITE,
      'Forced Convection',
      'Packed Bed Pressure Drop',
    ]);
    await drawn(page, 'Overview');
    await shot(page, 'rv01-overview');

    // “Open the review queue”, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Open the review queue', exact: true }),
    );
    await expect(page).toHaveURL(/\/reviewer\/queue$/);
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
    await expect(status(page)).toHaveText('4 items · oldest first');
    await expect(page.getByRole('tab')).toHaveText([
      'All, 4',
      'New submissions, 2',
      'Re-checks, 1',
      'Updates, 1',
    ]);
    await expect(rowLinks(page)).toHaveText([
      'Flash Distillation',
      'Venturi Meter Calibration',
      'Distillation Column',
      COMPOSITE,
    ]);
    const body = table(page).locator('tbody tr');
    await expect(body.nth(1).locator('.xr-fmt')).toHaveText(['WEB', 'AR']);
    await expect(body.nth(1).locator('.rv-kind')).toHaveClass(/rv-kind--recheck/);
    await expect(
      table(page).getByRole('link', {
        name: /^Distillation Column, update 1\.2 → 1\.3, waiting since \d{1,2} [A-Z][a-z]{2} 2026\. Review it$/,
      }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0005');
    await expect(page.getByRole('combobox', { name: 'Course' }).locator('option')).toHaveText([
      'All courses',
      'ME ZG523',
      'MEL ZG512',
      'CHE ZG513',
    ]);
    await expectTableLayout(page);
    await drawn(page, 'Review queue');
    await shot(page, 'rv02-queue');

    // The tabs, by click and by arrow key: Type is mirrored in the address.
    await reachAndClick(page, tab(page, /^Re-checks/));
    await expect(page).toHaveURL(/\/reviewer\/queue\?type=recheck$/);
    await expect(rowLinks(page)).toHaveText(['Venturi Meter Calibration']);
    await expect(status(page)).toHaveText('1 of 4 items · oldest first');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, /^Updates/)).toBeFocused();
    await expect(tab(page, /^Updates/)).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/\/reviewer\/queue\?type=update$/);
    await expect(rowLinks(page)).toHaveText(['Distillation Column']);
    await page.keyboard.press('Home');
    await expect(tab(page, /^All/)).toBeFocused();
    await expect(page).toHaveURL(/\/reviewer\/queue$/);

    // Course, its chip, no match, Clear filters.
    await page.getByRole('combobox', { name: 'Course' }).selectOption('MEL ZG512');
    await expect(page).toHaveURL(/\/reviewer\/queue\?course=MEL\+ZG512$/);
    await expect(main(page).getByText('No items match these filters')).toBeVisible();
    await expect(status(page)).toHaveText('0 of 4 items · oldest first');
    await expect(main(page).locator('.rk-chip')).toHaveText('Course: MEL ZG512');
    await drawn(page, 'Review queue');
    if (width(page) === 1024) await shot(page, 'rv02-nomatch');
    await reachAndClick(
      page,
      main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(rowLinks(page)).toHaveCount(4);
    const search = page.getByRole('searchbox', { name: 'Search the queue' });
    await expect(search).toBeFocused();
    await search.pressSequentially('dist');
    await page.getByRole('combobox', { name: 'Course' }).selectOption('CHE ZG513');
    await expect(rowLinks(page)).toHaveText(['Flash Distillation', 'Distillation Column']);
    await expect(main(page).locator('.rk-chip')).toHaveText([
      'Search: “dist”',
      'Course: CHE ZG513',
    ]);
    await drawn(page, 'Review queue');
    if (width(page) === 1440) await shot(page, 'rv02-filtered');
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Remove filter Search: “dist”' }),
    );
    await expect(rowLinks(page)).toHaveCount(3);
    await reachAndClick(
      page,
      main(page).locator('.rk-statusline').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(rowLinks(page)).toHaveCount(4);
    await expect(search).toHaveValue('');

    // A row's link opens RV-03 for that submission, in the same tab.
    await follow(page, rowLinks(page).filter({ hasText: COMPOSITE }));
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0077$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);

    // The Overview's one primary opens the item waiting longest.
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Start review: Flash Distillation' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0086$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    // A desk row's Review: the re-check.
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Review Venturi Meter Calibration' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0071$/);
    // In your queue opens the queue on its tab; a scope course on its course.
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Updates: 1 item. Open them in the review queue' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/queue\?type=update$/);
    await expect(tab(page, /^Updates/)).toHaveAttribute('aria-selected', 'true');
    await expect(rowLinks(page)).toHaveText(['Distillation Column']);
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      region(page, 'Your review scope').getByRole('link', { name: /^ME ZG523\b/ }),
    );
    await expect(page).toHaveURL(/\/reviewer\/queue\?course=ME\+ZG523$/);
    await expect(page.getByRole('combobox', { name: 'Course' })).toHaveValue('ME ZG523');
    await expect(rowLinks(page)).toHaveText([COMPOSITE]);
    // Recently decided: a decision opens its decided page; All decisions opens Reviewed by me.
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      region(page, 'Recently decided').getByRole('link', { name: /^Forced Convection, / }),
    );
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0081$/);
    await openFromRail(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, main(page).getByRole('link', { name: 'All decisions' }));
    await expect(page).toHaveURL(/\/reviewer\/reviewed$/);
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('nothing waiting: the calm desk, the empty queue and “Open Reviewed by me”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.rv-next')).toBeVisible();
    await decideBoth(page);
    const desk = region(page, 'Waiting for your decision');
    const calm = desk.getByRole('status');
    await expect(calm).toContainText('Nothing is waiting for your decision');
    await expect(calm).toContainText(
      'New submissions, updates and re-checks appear here when they reach you.',
    );
    await expect(main(page).locator('.rk-head p.rk-sub')).toHaveText(
      'Nothing is waiting for your decision.',
    );
    await expect(page.getByRole('region', { name: 'In your queue' })).toHaveCount(0);
    await expect(region(page, 'Your review scope').locator('a.rv-course')).toHaveCount(3);
    await expect(main(page).locator('a.rb-btn--primary')).toHaveCount(0);
    await drawn(page, 'Overview');
    await shot(page, 'rv01-calm');

    const mark = await markDocument(page);
    await reachAndClick(page, desk.getByRole('link', { name: 'Open Reviewed by me' }));
    await expect(page).toHaveURL(/\/reviewer\/reviewed$/);
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 60_000 });

    await openFromRail(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).getByText('Nothing is waiting for your decision')).toBeVisible();
    await expect(main(page)).toContainText(
      'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
    );
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await drawn(page, 'Review queue');
    if (width(page) === 1024) await shot(page, 'rv02-empty');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open Reviewed by me' }));
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('RV-05 Reviewed by me', () => {
  test('the decisions newest first: the tabs, the search, no match, and a row’s link', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer/reviewed');
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 90_000 });
    await expect(status(page)).toHaveText('9 decisions · newest first');
    // UPD-0006 (EEE ZC341, a scope withdrawn on 1 Oct 2026) is not listed: the service decides.
    await expect(rowLinks(page).filter({ hasText: 'Induction Motor Loading' })).toHaveCount(0);
    await boardWorld(page);
    await expect(status(page)).toHaveText('10 decisions · newest first');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/reviewed');
    await expect(page.getByRole('tab')).toHaveText(['All, 10', 'New submissions, 6', 'Updates, 4']);
    await expect(rowLinks(page)).toHaveText([
      COMPOSITE,
      'Forced Convection',
      'Packed Bed Pressure Drop',
      'Venturi Meter Calibration',
      'Transient Cooling',
      'Boiler Drum Level',
      'Orifice Plate Metering',
      'Fin-Tube Bundle',
      'Distillation Column',
      'Distillation Column',
    ]);
    const body = table(page).locator('tbody tr');
    await expect(body.locator('td.rv-c-dec .xr-st')).toHaveText([
      'Returned to vendor',
      'Returned to vendor',
      'Approved',
      'Approved',
      'Approved',
      'Update approved',
      'Update approved',
      'Approved',
      'Update approved',
      'Update approved',
    ]);
    await expect(body.locator('.rv-now')).toHaveText([
      'In your queue',
      'With the vendor to revise',
      'With the Content Manager · not published',
      'Back in your queue for a re-check',
      'With the Content Manager · not published',
      'With the Super Admin for a release decision',
      'Released by the Super Admin',
      /^Published on \d{1,2} [A-Z][a-z]{2} 2026$/,
      'Released by the Super Admin',
      'Released by the Super Admin',
    ]);
    // SUB-0077 has moved on since (resubmitted): its type names the revision returned.
    await expect(body.nth(0).locator('.rv-kind')).toHaveText(/^New submission\s*revision 1$/);
    await expect(body.nth(0).locator('.xr-st')).toHaveClass(/xr-st--err/);
    await expect(body.nth(2).locator('.xr-st')).toHaveClass(/xr-st--ok/);
    await expect(body.nth(1).locator('td.rv-c-dec .rk-small')).toHaveText(/24 Aug 2026$/);
    await expect(
      table(page).getByRole('link', {
        name: 'Boiler Drum Level, update approved on 14 Aug 2026. Open it',
      }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0004');
    await expectTableLayout(page);
    await drawn(page, 'Reviewed by me');
    await shot(page, 'rv05-reviewed');

    await reachAndClick(page, tab(page, /^Updates/));
    await expect(rowLinks(page)).toHaveCount(4);
    await expect(status(page)).toHaveText('4 of 10 decisions · newest first');
    await drawn(page, 'Reviewed by me');
    if (width(page) === 1440) await shot(page, 'rv05-updates');
    await tab(page, /^Updates/).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, /^New submissions/)).toBeFocused();
    await expect(rowLinks(page)).toHaveCount(6);
    await expect(status(page)).toHaveText('6 of 10 decisions · newest first');
    await page.keyboard.press('Home');
    await expect(rowLinks(page)).toHaveCount(10);

    const search = page.getByRole('searchbox', { name: 'Search your decisions' });
    await search.pressSequentially('heat exchanger');
    await expect(main(page).getByText('No decisions match these filters')).toBeVisible();
    await expect(status(page)).toHaveText('0 of 10 decisions · newest first');
    await drawn(page, 'Reviewed by me');
    if (width(page) === 1024) await shot(page, 'rv05-nomatch');
    await reachAndClick(
      page,
      main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(rowLinks(page)).toHaveCount(10);
    await expect(search).toBeFocused();

    const mark = await markDocument(page);
    await follow(page, rowLinks(page).filter({ hasText: 'Forced Convection' }));
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0081$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});
