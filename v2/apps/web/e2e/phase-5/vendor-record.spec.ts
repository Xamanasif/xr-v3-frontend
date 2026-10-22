import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState as checkScreen } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * VE-07 Experiment record and VE-13 Submission and version history, as the owner-approved Vendor
 * export draws its record view (design/v3-refined-b/roles/VE-v1, `Main.dc.html` `V.record`;
 * renders `VE-07_*`, `VE-13_*`), on the test-hook build at 1440, 1024, 768 and 375. Each state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). Worlds: spine-start as Anil Shetty — the seeded draft (SUB-0079),
 * returned (SUB-0081), with the Content Manager (SUB-0074), draft in a withdrawn course (SUB-0083)
 * and published (SUB-0052) records; Flow E’s SUB-0077 and Anil’s saved changes are prepared through
 * the CI seam (Anil saves and submits, Prof. A. Menon returns and approves, Anil saves changes or
 * resubmits, Kavya Nair publishes or sends back) — set-up only: the page under test is read live
 * as the one world moves, and its own controls (the breadcrumb, the head’s action, a reference
 * chip, the tabs) are real clicks. No state names the experiment by its reference (the owner's
 * identifier rule for the Vendor, 22 Oct 2026): every checked state is searched for one; the
 * reference is read from the address only.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ANIL = { personId: 'per-anil-shetty' };
const MENON = { personId: 'per-a-menon' };
const KAVYA = { personId: 'per-kavya-nair' };
const LIST = '/vendor/experiments';
const record = (id: string) => `${LIST}/${id}`;
const TABS = ['Details', 'Submission and version history'];

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/ve-record/shots';

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

type Submission = { readonly id: string; readonly rev: number; readonly content: unknown };

/** SUB-0077 as Anil Shetty sends it (VE-03 … VE-06); the revision changes the VR device need. */
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
const head = (page: Page) => main(page).locator('.rk-head');
const pill = (page: Page) => head(page).locator('.rk-meta .xr-st');
const eyebrow = (page: Page) => head(page).locator('.rk-eyebrow');
/** The head’s facts after the pill: course, revision, last change. */
const metaFacts = (page: Page) =>
  head(page).locator('.rk-meta > span:not(.xr-st):not(.rk-meta-sep)');
const headAction = (page: Page) => head(page).locator('.rk-head-act a');
const notice = (page: Page) => main(page).locator('.rk-notice');
const panel = (page: Page) => main(page).locator('section.vr-ret');
const region = (page: Page, name: string) => page.getByRole('region', { name });
const intro = (page: Page) => main(page).locator('.vr-sheet > p.vr-intro');
const history = (page: Page) => region(page, 'Submission and version history');
const historyWhat = (page: Page) => history(page).locator('.rk-tl-w');
const historyNote = (page: Page) => history(page).locator('.rk-tl-n');
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Experiment record' });
const stand = (page: Page) => page.getByRole('complementary', { name: 'Where it stands' });
const crumbs = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** The shell: My experiments current in the rail (or the drawer’s, below 1024 px). */
async function expectShell(page: Page): Promise<void> {
  await expect(currentSidebarItem(page).first()).toHaveAttribute('href', LIST);
}

/** A section’s `dl.rk-dl` rows: “key = value”. */
async function rows(page: Page, name: string): Promise<string[]> {
  return region(page, name)
    .locator(':scope > dl.rk-dl')
    .evaluate((list) =>
      [...list.querySelectorAll('dt')].map(
        (key) =>
          `${key.textContent} = ${(key.nextElementSibling?.textContent ?? '').replace(/\s+/g, ' ').trim()}`,
      ),
    );
}

/** “Where it stands”: “term = value”, the formats by their visually hidden name. */
async function standRows(page: Page): Promise<string[]> {
  return stand(page).evaluate((aside) =>
    [...aside.querySelectorAll('dl.rk-stand > div')].map((row) => {
      const value = row.querySelector('dd');
      const chips = value?.querySelector('.ve-chips .xr-sr');
      const words = (element: Element | null | undefined) =>
        (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return `${words(row.querySelector('dt'))} = ${chips ? words(chips) : words(value)}`;
    }),
  );
}

async function open(page: Page, id: string, name: string, search = ''): Promise<void> {
  await page.goto(`${record(id)}${search}`);
  await expect(heading(page, name)).toBeVisible({ timeout: 90_000 });
}

/** A tab, by a real click; the tab’s heading takes focus (LINK-MAP L55). */
async function toTab(page: Page, name: 'Details' | 'Submission and version history') {
  await reachAndClick(page, tabs(page).getByRole('link', { name }));
  await expect(tabs(page).locator('[aria-current="page"]')).toHaveText(name);
  if (name === 'Details') {
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  } else {
    await expect(
      history(page).getByRole('heading', { level: 2, name: 'Submission and version history' }),
    ).toBeFocused();
  }
}

async function expectLinks(page: Page, links: readonly string[]): Promise<void> {
  await expect(main(page).getByRole('link')).toHaveText([...links]);
}

async function expectPill(page: Page, words: string, tone: RegExp | null): Promise<void> {
  await expect(pill(page)).toHaveText(words);
  if (tone) await expect(pill(page)).toHaveClass(tone);
  else await expect(pill(page)).toHaveAttribute('class', 'xr-st rk-st-lg');
}

async function expectNotice(
  page: Page,
  tone: string,
  title: string,
  line: string | RegExp,
): Promise<Locator> {
  const box = notice(page);
  await expect(box).toHaveClass(new RegExp(`rk-notice--${tone}`));
  await expect(box).toHaveAttribute('role', 'status');
  await expect(box.locator('.rk-notice-t')).toHaveText(title);
  await expect(box.locator('.rk-notice-d')).toHaveText(line);
  return box;
}

test.describe('VE-07 Experiment record — the seeded states', () => {
  test('draft (VE-07_draft): Edit draft opens the editor where the draft stopped', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0079', 'Pin Fin Efficiency');
    await expect(crumbs(page).getByRole('link')).toHaveText(['My experiments']);
    await expect(crumbs(page).locator('[aria-current="page"]')).toHaveText('Pin Fin Efficiency');
    await expect(eyebrow(page)).toHaveText('Experiment');
    await expectPill(page, 'Draft', null);
    await expect(metaFacts(page)).toHaveText(['ME ZG523', /^Last change \d+ \w{3} 2026$/]);
    await expectNotice(
      page,
      'off',
      'Draft — only you can see it',
      'Finish it and submit it for academic review.',
    );
    const edit = headAction(page);
    await expect(edit).toHaveText('Edit draft');
    await expect(edit).toHaveClass(/rb-btn--primary/);
    await expect(edit).toHaveAttribute('href', `${record('SUB-0079')}/edit`);
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Details');
    await expect(intro(page)).toHaveText(
      /^Your draft as last saved on \d+ \w{3} 2026, \d\d:\d\d\. Nothing here has been submitted\.$/,
    );
    expect(await rows(page, 'Course and description')).toEqual([
      'Course = ME ZG523 · Thermodynamics & Heat Transfer',
      'Summary = —',
      'Description = —',
      'Version = 1.0',
    ]);
    await expect(region(page, 'Formats and delivery').locator('.vr-dlv-h')).toHaveText([
      'WEBBrowser · Web link',
    ]);
    await expect(region(page, 'Formats and delivery').locator('.vr-dlv dd')).toHaveText([
      '—',
      'A current browser on a laptop or desktop',
    ]);
    await expect(region(page, 'Learning outcomes').locator('p.ve-intro')).toHaveText(
      'None yet. The Academic Reviewer adds them during review — one set for every format.',
    );
    expect(await standRows(page)).toEqual([
      'Formats = Formats: WEB',
      expect.stringMatching(/^Last change = /),
    ]);
    await expectLinks(page, ['My experiments', 'Edit draft', ...TABS]);
    await expectShell(page);
    await checkState(page, 'Pin Fin Efficiency');
    await shot(page, 'VE-07_draft');

    // The history tab, and back.
    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page)).toHaveText(['Draft saved']);
    await expect(historyNote(page)).toHaveText(['Only you can see a draft.']);
    await checkState(page, 'Pin Fin Efficiency');
    await toTab(page, 'Details');

    const mark = await markDocument(page);
    await reachAndClick(page, headAction(page));
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0079')}/edit$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('returned by the Academic Reviewer (VE-07_returned): the panel, its chips, Revise and resubmit', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0081', 'Forced Convection');
    await expect(eyebrow(page)).toHaveText('Experiment');
    await expectPill(page, 'Returned', /xr-st--err/);
    await expect(metaFacts(page)).toHaveText(['ME ZG523', 'Revision 1', /^Last change /]);
    const reason = region(page, 'Returned by the Academic Reviewer');
    await expect(reason).toHaveClass('vr-ret');
    await expect(reason.locator('.vr-ret-m')).toHaveText(
      /^\d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · Prof\. A\. Menon$/,
    );
    await expect(reason.locator('blockquote.vr-ret-q')).toHaveText(
      'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
    );
    const references = reason.getByRole('list', { name: 'What it refers to' });
    await expect(references.getByRole('button')).toHaveText([
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
    ]);
    await expect(reason.locator('.vr-ret-pend')).toHaveCount(0);
    // The status is stated by the pill and the panel only.
    await expect(notice(page)).toHaveCount(0);
    const revise = headAction(page);
    await expect(revise).toHaveText('Revise and resubmit');
    await expect(revise).toHaveClass(/rb-btn--primary/);
    await expect(revise).toHaveAttribute('href', `${record('SUB-0081')}/revise`);
    await expect(intro(page)).toHaveText(/^Revision 1 as it was submitted on \d+ \w{3} 2026\.$/);
    await expect(region(page, 'Formats and delivery').locator('.vr-dlv-h')).toHaveText([
      'WEBBrowser · Web link',
      'ARAugmented reality · App package',
    ]);
    await expect(region(page, 'Formats and delivery')).toContainText(
      'forced-convection-ar-1.0.zip',
    );
    expect(await standRows(page)).toEqual([
      'Formats = Formats: WEB, AR',
      'Revision = 1',
      expect.stringMatching(/^Last submitted = /),
      'Returned = 24 Aug 2026 · Academic Reviewer',
      expect.stringMatching(/^Last change = /),
    ]);
    await expectLinks(page, ['My experiments', 'Revise and resubmit', ...TABS]);
    await expectShell(page);
    await checkState(page, 'Forced Convection');
    await shot(page, 'VE-07_returned');

    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page)).toHaveText([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(historyNote(page).first()).toHaveText(
      'Academic Reviewer: “The AR install notes don’t say which phones and tablets it runs on…”',
    );
    await checkState(page, 'Forced Convection');
    await shot(page, 'VE-13_returned');

    // A reference chip opens the editor at that field, focused (LINK-MAP L53), in the same tab:
    // its step and its `field=`.
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      references.getByRole('button', {
        name: 'Revise: go to Formats & delivery · AR · Device need',
      }),
    );
    await expect(page).toHaveURL(
      new RegExp(`${record('SUB-0081')}/revise\\?step=formats&field=ar\\.device-need$`),
    );
    await expect(heading(page, 'Formats and delivery')).toBeVisible({ timeout: 60_000 });
    const arDevice = page
      .getByRole('region', { name: /^Augmented reality ?· App package$/ })
      .getByLabel('Device needed', { exact: true });
    await expect(arDevice).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expectSameDocument(page, mark);

    // Revise and resubmit opens the editor.
    await open(page, 'SUB-0081', 'Forced Convection');
    const again = await markDocument(page);
    await reachAndClick(page, headAction(page));
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}/revise$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
    await expectSameDocument(page, again);
  });

  test('changes saved, not resubmitted (VE-07_private-revision): inside the panel, Continue revising', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0081', 'Forced Convection');
    const current = await vendorView(page, 'SUB-0081');
    const content = current.content as { delivery: { ar: Record<string, unknown> } };
    await port(page, ANIL, 'production', 'saveRevision', {
      id: current.id,
      content: {
        ...content,
        delivery: {
          ...content.delivery,
          ar: { ...content.delivery.ar, deviceNeeded: 'Android phones that support ARCore' },
        },
      },
      expectedRev: current.rev,
    });
    const saved = panel(page).getByRole('status');
    await expect(saved.locator('.vr-ret-pend-t')).toHaveText(
      'Your changes are saved but not resubmitted',
    );
    await expect(saved.locator('.vr-ret-pend-d')).toHaveText(
      /^Saved \d+ \w{3} 2026, \d\d:\d\d\. Only you can see them\. Everyone else still sees revision 1 as it was submitted\.$/,
    );
    await expect(headAction(page)).toHaveText('Continue revising');
    await expect(headAction(page)).toHaveAttribute('href', `${record('SUB-0081')}/revise`);
    await expectPill(page, 'Returned', /xr-st--err/);
    await expect(intro(page)).toHaveText(
      /^Your changes as last saved on \d+ \w{3} 2026, \d\d:\d\d\. They are not resubmitted yet\.$/,
    );
    await expect(region(page, 'Formats and delivery')).toContainText(
      'Android phones that support ARCore',
    );
    await checkState(page, 'Forced Convection');
    await shot(page, 'VE-07_private-revision');

    await toTab(page, 'Submission and version history');
    await expect(history(page).locator('p.vr-intro--inline')).toHaveText(
      /^Your changes saved on \d+ \w{3} 2026, \d\d:\d\d are not part of this history until you resubmit\.$/,
    );
    await expect(historyWhat(page)).toHaveText([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await checkState(page, 'Forced Convection');
  });

  test('with the Content Manager, course no longer assigned, published — read-only', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    // VE-07_with-cm: approved by the Academic Reviewer; nothing is needed from the Vendor.
    await open(page, 'SUB-0074', 'Transient Cooling');
    await expectPill(page, 'With Content Manager', /xr-st--info/);
    await expectNotice(
      page,
      'info',
      'With the Content Manager',
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    await expect(region(page, 'Learning outcomes').locator('ol.ve-los li')).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(region(page, 'Learning outcomes').locator('p.ve-intro')).toHaveText(
      'One set for every format.',
    );
    expect(await standRows(page)).toContain('Approved by the Academic Reviewer = 14 Aug 2026');
    await expect(headAction(page)).toHaveCount(0);
    await expectLinks(page, ['My experiments', ...TABS]);
    await expectShell(page);
    await checkState(page, 'Transient Cooling');
    await shot(page, 'VE-07_with-cm');

    // VE-07_readonly: MEL ZG512 was withdrawn from Anil — the draft is kept, read-only.
    await open(page, 'SUB-0083', 'Surface Roughness in Turning');
    await expectPill(page, 'Draft · read-only', /xr-st--paused/);
    await expect(metaFacts(page)).toHaveText(['MEL ZG512', /^Last change /]);
    const readOnly = await expectNotice(
      page,
      'warn',
      'MEL ZG512 is no longer assigned to you',
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    const help = readOnly.getByRole('link', { name: 'Ask for help' });
    await expect(help).toHaveAttribute('href', '/vendor/help/report');
    await expect(main(page).getByRole('link', { name: 'Edit draft' })).toHaveCount(0);
    await expect(intro(page)).toHaveText(/It can’t be changed or submitted\.$/);
    expect((await rows(page, 'Course and description'))[0]).toBe(
      'Course = MEL ZG512 · Manufacturing Processes',
    );
    await expectLinks(page, ['My experiments', 'Ask for help', ...TABS]);
    await checkState(page, 'Surface Roughness in Turning');
    await shot(page, 'VE-07_readonly');
    // Ask for help opens the report form, its “Where” filled from this page.
    const toHelp = await markDocument(page);
    await reachAndClick(page, help);
    await expect(page).toHaveURL(/\/vendor\/help\/report$/);
    await expect(heading(page, 'Report a problem')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel('Where did it happen?')).toHaveValue(/^My experiments/);
    await expectSameDocument(page, toHelp);

    // VE-07_published: read-only, the formats published.
    await open(page, 'SUB-0052', 'Fin-Tube Bundle');
    await expectPill(page, 'Published', /xr-st--ok/);
    await expectNotice(
      page,
      'ok',
      'Published · 30 Jul 2026',
      'It is live in the catalogue with the formats below. It is read-only here.',
    );
    await expect(intro(page)).toHaveText(
      'The published version, live in the catalogue since 30 Jul 2026.',
    );
    await expect(region(page, 'Formats and delivery').locator('.vr-sec-st')).toHaveText(
      'Formats published: WEB · VR',
    );
    await expect(region(page, 'Formats and delivery').locator('p.vr-foot')).toHaveText(
      'Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(await standRows(page)).toContain('Published = 30 Jul 2026');
    await expectLinks(page, ['My experiments', ...TABS]);
    await checkState(page, 'Fin-Tube Bundle');
    await shot(page, 'VE-07_published');
    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page).first()).toHaveText('Published by the Content Manager');
    await expect(historyNote(page).first()).toHaveText('WEB and VR are live in the catalogue.');
    await checkState(page, 'Fin-Tube Bundle');
    await shot(page, 'VE-13_history-published');

    // The breadcrumb reaches My experiments, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(page, crumbs(page).getByRole('link', { name: 'My experiments' }));
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('VE-07 — Flow E on one world (SUB-0077)', () => {
  test('saved, submitted, returned, resubmitted — “Submitted” (VE-07_submitted-rev2), with the CM, published', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    // Before the first save the record does not exist.
    await page.goto(`${record('SUB-0077')}?tab=history`);
    await expect(heading(page, 'Experiment record')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).getByRole('heading', { level: 2 })).toHaveText(
      'We can’t find that experiment',
    );

    // Anil’s first save mints SUB-0077: the page reads it live, on its history tab.
    const saved = await port<Submission>(page, ANIL, 'production', 'saveDraft', {
      id: null,
      content: compositeWall('VR headset'),
      step: 'course',
      expectedRev: null,
    });
    expect(saved.id).toBe('SUB-0077');
    await expect(heading(page, 'Conduction Through a Composite Wall')).toBeVisible();
    await expectPill(page, 'Draft', null);
    await expect(historyWhat(page)).toHaveText(['Draft saved']);
    await checkState(page, 'Conduction Through a Composite Wall');

    // He submits it for academic review: revision 1, read-only for the Vendor.
    await port(page, ANIL, 'production', 'submitForReview', {
      id: saved.id,
      content: compositeWall('VR headset'),
      expectedRev: saved.rev,
    });
    await expectPill(page, 'With Academic Reviewer', /xr-st--info/);
    await expect(metaFacts(page)).toHaveText(['ME ZG523', 'Revision 1', /^Last change /]);
    await expectNotice(
      page,
      'info',
      'With the Academic Reviewer',
      'Nothing is needed from you now. You can edit it again only if it is returned to you.',
    );
    await expect(historyWhat(page)).toHaveText(['Submitted for academic review', 'Draft saved']);
    await expect(historyNote(page).first()).toHaveText(
      'With the Academic Reviewer. Nothing is published.',
    );
    await expectLinks(page, ['My experiments', ...TABS]);
    await checkState(page, 'Conduction Through a Composite Wall');
    await shot(page, 'VE-07_with-rv-first-history');

    // Prof. A. Menon returns it with a reason and what it refers to.
    let review = await reviewerView(page, saved.id);
    await port(page, MENON, 'production', 'returnSubmission', {
      id: saved.id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: OUTCOMES,
      expectedRev: review.rev,
    });
    await expectPill(page, 'Returned', /xr-st--err/);
    await expect(panel(page).locator('blockquote')).toHaveText(
      'Please clarify the VR device requirements.',
    );
    await expect(panel(page).locator('button.ve-ref')).toHaveText([
      'Formats & delivery · VR · Device need',
    ]);
    await expect(historyNote(page).first()).toHaveText(
      'Academic Reviewer: “Please clarify the VR device requirements.”',
    );
    await checkState(page, 'Conduction Through a Composite Wall');
    await toTab(page, 'Details');
    await expect(region(page, 'Learning outcomes').locator('.ve-los li')).toHaveText(OUTCOMES);

    // He resubmits: “Submitted”, no gate named — though the workflow rule routed it (M-3).
    let current = await vendorView(page, saved.id);
    await port(page, ANIL, 'production', 'resubmit', {
      id: saved.id,
      content: compositeWall(VR_DEVICE_REVISED),
      expectedRev: current.rev,
    });
    await expectPill(page, 'Submitted', /xr-st--info/);
    await expect(metaFacts(page)).toHaveText(['ME ZG523', 'Revision 2', /^Last change /]);
    await expectNotice(
      page,
      'info',
      'Submitted',
      'Your changes have been submitted for review. Nothing is needed from you now.',
    );
    await expect(panel(page)).toHaveCount(0);
    await expect(intro(page)).toHaveText(/^Revision 2 as it was submitted on \d+ \w{3} 2026\.$/);
    await expect(region(page, 'Formats and delivery')).toContainText(VR_DEVICE_REVISED);
    await expectLinks(page, ['My experiments', ...TABS]);
    await checkState(page, 'Conduction Through a Composite Wall');
    await shot(page, 'VE-07_submitted-rev2');
    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page)).toHaveText([
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(main(page)).not.toContainText('Routed by the approved workflow rule.');
    await checkState(page, 'Conduction Through a Composite Wall');
    await shot(page, 'VE-13_history-rev2');

    // He approves revision 2: with the Content Manager; the routing entry is never the Vendor’s.
    review = await reviewerView(page, saved.id);
    await port(page, MENON, 'production', 'approveSubmission', {
      id: saved.id,
      outcomes: OUTCOMES,
      expectedRev: review.rev,
    });
    await expectPill(page, 'With Content Manager', /xr-st--info/);
    await expect(historyWhat(page)).toHaveText([
      'Approved by the Academic Reviewer',
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    await expect(history(page)).not.toContainText('With Academic Reviewer · revision 2');
    await checkState(page, 'Conduction Through a Composite Wall');

    // Kavya Nair publishes it: read-only, the formats published.
    current = await vendorView(page, saved.id);
    await port(page, KAVYA, 'production', 'publish', { id: saved.id, expectedRev: current.rev });
    await expectPill(page, 'Published', /xr-st--ok/);
    await expect(historyWhat(page).first()).toHaveText('Published by the Content Manager');
    await toTab(page, 'Details');
    await expect(region(page, 'Formats and delivery').locator('.vr-sec-st')).toHaveText(
      'Formats published: WEB · VR',
    );
    await expectLinks(page, ['My experiments', ...TABS]);
    await checkState(page, 'Conduction Through a Composite Wall');
  });

  test('returned by the Content Manager (VE-07_returned-by-cm)', async ({ page }) => {
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
    await expectPill(page, 'Returned', /xr-st--err/);
    const reason = region(page, 'Returned by the Content Manager');
    await expect(reason.locator('.vr-ret-m')).toHaveText(/ · Kavya Nair$/);
    await expect(reason.getByRole('button')).toHaveText(['Course & description · Summary']);
    await expect(notice(page)).toHaveCount(0);
    await expect(headAction(page)).toHaveText('Revise and resubmit');
    await expect(headAction(page)).toHaveAttribute('href', `${record('SUB-0074')}/revise`);
    expect(await standRows(page)).toEqual(
      expect.arrayContaining([
        'Approved by the Academic Reviewer = 14 Aug 2026',
        expect.stringMatching(/^Returned = .+ · Content Manager$/),
      ]),
    );
    await checkState(page, 'Transient Cooling');
    await shot(page, 'VE-07_returned-by-cm');
    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page).first()).toHaveText('Returned with a reason');
    await expect(historyNote(page).first()).toHaveText(
      'Content Manager: “The summary runs to three sentences…”',
    );
    await checkState(page, 'Transient Cooling');

    // Its chip opens the summary, focused (LINK-MAP L53): a Course and description reference has
    // no `step=` (the editor's first step).
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      reason.getByRole('button', { name: 'Revise: go to Course & description · Summary' }),
    );
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0074')}/revise\\?field=summary$`));
    await expect(heading(page, 'Course and description')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel('Summary', { exact: true })).toBeFocused();
    await expectSameDocument(page, mark);
  });

  test('back with the Academic Reviewer for a re-check (VE-07_recheck)', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0074', 'Transient Cooling');
    const current = await vendorView(page, 'SUB-0074');
    await port(page, KAVYA, 'production', 'sendBack', {
      id: 'SUB-0074',
      to: 'academic-reviewer',
      reason: 'Please check the second outcome against the description.',
      expectedRev: current.rev,
    });
    await expectPill(page, 'With Academic Reviewer', /xr-st--info/);
    await expectNotice(
      page,
      'info',
      'Back with the Academic Reviewer for a re-check',
      'The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you.',
    );
    // The Content Manager’s reason is not the Vendor’s to read.
    await expect(main(page)).not.toContainText('Please check the second outcome');
    await expectLinks(page, ['My experiments', ...TABS]);
    await checkState(page, 'Transient Cooling');
    await shot(page, 'VE-07_recheck');
    await toTab(page, 'Submission and version history');
    await expect(historyWhat(page).first()).toHaveText(
      'Back with the Academic Reviewer for a re-check',
    );
    await expect(historyNote(page).first()).toHaveText(
      'Sent back by the Content Manager. Nothing is needed from you.',
    );
    await expect(main(page)).not.toContainText('Please check the second outcome');
  });
});

test.describe('VE-13 History and the calm states', () => {
  test('?tab=history lands on the history tab, its heading focused; another tab value is the bare record', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await open(page, 'SUB-0081', 'Forced Convection', '?tab=history');
    const historyHeading = history(page).getByRole('heading', {
      level: 2,
      name: 'Submission and version history',
    });
    await expect(historyHeading).toBeFocused();
    await expect(historyHeading).toBeInViewport();
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText(
      'Submission and version history',
    );
    await expect(history(page).locator('.vr-sec-st')).toHaveText('Newest first · not an audit log');
    await expect(history(page).locator('ol.rk-tl > li').first()).toHaveClass('is-latest');
    await expect(historyWhat(page)).toHaveText([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    // “Where it stands” stays beside the history; Details is not drawn.
    await expect(stand(page)).toBeVisible();
    await expect(region(page, 'Course and description')).toHaveCount(0);
    await expectShell(page);
    await checkState(page, 'Forced Convection');

    // The tabs keep their addresses, in the same document.
    const mark = await markDocument(page);
    await toTab(page, 'Details');
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}$`));
    await toTab(page, 'Submission and version history');
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}\\?tab=history$`));
    await expectSameDocument(page, mark);

    await page.goto(`${record('SUB-0081')}?tab=elsewhere`);
    await expect(heading(page, 'Forced Convection')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(new RegExp(`${record('SUB-0081')}$`));
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Details');
  });

  test('an unknown id and another vendor’s record: “We can’t find that experiment”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    for (const id of ['SUB-9999', 'SUB-0086']) {
      await page.goto(record(id));
      await expect(heading(page, 'Experiment record')).toBeVisible({ timeout: 90_000 });
      const calm = main(page).locator('.rk-state');
      await expect(calm.locator('h2')).toHaveText('We can’t find that experiment');
      await expect(calm).toContainText(
        'It isn’t one of your experiments, or the address is wrong. Your experiments are in My experiments.',
      );
      await expect(main(page)).not.toContainText('Flash Distillation');
      await expect(crumbs(page).getByRole('link', { name: 'My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      await expectLinks(page, ['My experiments']);
      await checkState(page, 'Experiment record');
    }
  });
});
