/**
 * VE-07 Experiment record and VE-13 Submission and version history, drawn as the owner-approved
 * Vendor export draws its record view (design/v3-refined-b/roles/VE-v1, `Main.dc.html` `V.record`;
 * renders `VE-07_*`, `VE-13_*`), on the real composition root and the sample world, as Anil Shetty.
 * The spine-start seed holds the states — a draft (SUB-0079), returned by the Academic Reviewer
 * (SUB-0081), with the Content Manager (SUB-0074), a draft in a withdrawn course (SUB-0083),
 * published (SUB-0052). Flow E’s SUB-0077 moves through the ports as each role would (Anil saves
 * and submits, Prof. A. Menon returns and approves, Anil resubmits — the routing stand-in routes it
 * at once, PC-66 — Kavya Nair publishes or sends back) while the page reads the one world. Anil’s
 * Save changes on a returned record (the changes saved, not resubmitted); the undrawn loading,
 * failed, not found, not permitted and policy-open states; the tabs and `?tab=history`.
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts, Result } from '@xr/contracts/draft';
import type { IsoInstant, SubmissionId } from '@xr/domain';
import { V3_ICON_PATHS } from '@xr/ui/v3';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { dateTime } from '@/copy/dates';
import { NavigationProvider } from '@/nav/navigation';
import { PlatformRuntimeProvider } from '@/platform/platform-provider';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { ExperimentRecord } from './ve-07-record/experiment-record';
import { historyEvents, recordStateOf, type VendorRecordView } from './ve-07-record/record-view';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const ANIL = 'per-anil-shetty';
const MENON = 'per-a-menon';
const KAVYA = 'per-kavya-nair';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function at(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/** A command as another role (or Anil himself), its receipt refreshing the page’s reads. */
async function as<T>(
  runtime: PlatformRuntime,
  sample: Sample,
  personId: string,
  command: (ports: ProductPorts) => Promise<Result<T>>,
): Promise<T> {
  let value: T | undefined;
  await act(async () => {
    const answer = await command(asPersonId(sample, personId));
    value = ok(answer);
    if (answer.ok) await runtime.invalidate(answer.changed);
  });
  return value as T;
}

/** SUB-0077 as Anil sends it (VE-03 … VE-06); the revision changes the VR device need (VE-08). */
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
  } as never;
}
const VR_DEVICE_REVISED =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="vendor">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

/**
 * The record at its address, in the Vendor’s shell. `tab` follows a tab link: the page is drawn
 * again at the other address, as the router does (the same document).
 */
function show(runtime: PlatformRuntime, submissionId: string, search = '') {
  const pathname = `/vendor/experiments/${submissionId}`;
  let navigation = testNavigation(pathname, search);
  const tree = () => (
    <PlatformRuntimeProvider runtime={runtime} queryClient={runtime.queryClient}>
      <NavigationProvider value={navigation}>
        {inShell(<ExperimentRecord submissionId={submissionId} />)}
      </NavigationProvider>
    </PlatformRuntimeProvider>
  );
  const view = render(tree());
  return {
    get navigation() {
      return navigation;
    },
    view,
    tab(next: 'details' | 'history') {
      navigation = testNavigation(pathname, next === 'history' ? '?tab=history' : '');
      view.rerender(tree());
    },
  };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const title = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const head = () => main().querySelector('.rk-head')!;
const pill = () => head().querySelector('.rk-meta .xr-st');
const eyebrow = () => text(head().querySelector('.rk-eyebrow'));
/** The head’s facts after the pill: course, revision, last change. */
const metaFacts = () =>
  [...head().querySelectorAll('.rk-meta > span:not(.xr-st):not(.rk-meta-sep)')].map((item) =>
    text(item),
  );
const headAction = () => head().querySelector('.rk-head-act a');
const notice = () => main().querySelector('.rk-notice');
const noticeTitle = () => text(notice()?.querySelector('.rk-notice-t') ?? null);
const glyph = (element: Element | null) =>
  element?.querySelector(':scope > svg path')?.getAttribute('d');
const region = (name: string | RegExp) => screen.getByRole('region', { name });
const returned = () => main().querySelector('section.vr-ret');
const intro = () => text(main().querySelector('.vr-sheet > p.vr-intro'));
const historySheet = () => region('Submission and version history');
const what = () => [...historySheet().querySelectorAll('.rk-tl-w')].map((line) => text(line));
const notes = () =>
  [...historySheet().querySelectorAll('ol.rk-tl > li')].map((item) =>
    text(item.querySelector('.rk-tl-n')),
  );
const links = () =>
  within(main())
    .getAllByRole('link')
    .map((link) => text(link));
const TABS = ['Details', 'Submission and version history'];

/** A section’s `dl.rk-dl` rows: “key = value”. */
function rows(name: string): string[] {
  const list = region(name).querySelector(':scope > dl.rk-dl')!;
  return [...list.querySelectorAll('dt')].map((key) =>
    `${text(key)} = ${text(key.nextElementSibling)}`.trim(),
  );
}

/** The read-only delivery blocks: the head, then each row. */
function deliveryBlocks(): string[][] {
  return [...region('Formats and delivery').querySelectorAll('.vr-dlvs > .vr-dlv')].map((block) => [
    text(block.querySelector('.vr-dlv-h')),
    ...[...block.querySelectorAll('dt')].map(
      (key) => `${text(key)} = ${text(key.nextElementSibling)}`,
    ),
  ]);
}

/** “Where it stands”: “term = value”; the formats by their visually hidden name. */
function stand(): string[] {
  const aside = screen.getByRole('complementary', { name: 'Where it stands' });
  return [...aside.querySelectorAll('dl.rk-stand > div')].map((row) => {
    const value = row.querySelector('dd')!;
    const chips = value.querySelector('.ve-chips .xr-sr');
    return `${text(row.querySelector('dt'))} = ${chips ? text(chips) : text(value)}`;
  });
}

function currentTab(): string {
  return text(
    screen
      .getByRole('navigation', { name: 'Experiment record' })
      .querySelector('[aria-current="page"]'),
  );
}

/** The history tab’s entries, then back to Details. */
async function readHistory(page: ReturnType<typeof show>) {
  page.tab('history');
  await waitFor(() => expect(historySheet()).toBeVisible());
  const entries = { what: what(), notes: notes(), text: text(historySheet()) };
  page.tab('details');
  await waitFor(() => expect(screen.getByRole('region', { name: 'Formats and delivery' })));
  return entries;
}

describe('VE-07 — a draft (VE-07_draft)', () => {
  it('the head with Edit draft, the notice, the Details sheet, “Where it stands”; the shell', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0079');
    await title('Pin Fin Efficiency');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'My experiments' })).toHaveAttribute(
      'href',
      '/vendor/experiments',
    );
    expect(text(crumbs.querySelector('[aria-current="page"]'))).toBe('Pin Fin Efficiency');
    expect(eyebrow()).toBe('Experiment · SUB-0079');
    await waitFor(() => expect(metaFacts()[0]).toBe('ME ZG523'));
    // A draft has no revision in the head (`meta`), only the course and the last change.
    expect(metaFacts()).toEqual([
      'ME ZG523',
      expect.stringMatching(/^Last change \d+ \w{3} \d{4}$/),
    ]);
    expect(pill()).toHaveTextContent('Draft');
    expect(pill()!.className).toBe('xr-st rk-st-lg');
    const edit = headAction()!;
    expect(edit).toHaveTextContent('Edit draft');
    expect(edit).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    // Where the draft stopped: the seed’s draft last reached the first step.
    expect(edit).toHaveAttribute('href', '/vendor/experiments/SUB-0079/edit');
    // The status once more, and only once: the notice.
    expect(notice()).toHaveClass('rk-notice', 'rk-notice--off');
    expect(notice()).toHaveAttribute('role', 'status');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.edit);
    expect(noticeTitle()).toBe('Draft — only you can see it');
    expect(text(notice()!.querySelector('.rk-notice-d'))).toBe(
      'Finish it and submit it for academic review.',
    );
    expect(notice()!.querySelector('.rk-notice-act')).toBeNull();
    expect(returned()).toBeNull();
    // Details: one sheet with the version line.
    expect(currentTab()).toBe('Details');
    expect(intro()).toMatch(
      /^Your draft as last saved on \d+ \w{3} 2026, \d\d:\d\d\. Nothing here has been submitted\.$/,
    );
    expect(rows('Course and description')).toEqual([
      'Course = ME ZG523 · Thermodynamics & Heat Transfer',
      'Summary = —',
      'Description = —',
      'Version = 1.0',
    ]);
    expect(deliveryBlocks()).toEqual([
      [
        'WEBBrowser · Web link',
        'Web link = —',
        'Browser and computer = A current browser on a laptop or desktop',
      ],
    ]);
    expect(rows('Preview and documents')).toEqual(['Preview = None', 'Documents = None']);
    const outcomes = region('Learning outcomes');
    expect(text(outcomes.querySelector('.vr-sec-st'))).toBe(
      'Added by the Academic Reviewer · read-only',
    );
    expect(text(outcomes.querySelector('p.ve-intro'))).toBe(
      'None yet. The Academic Reviewer adds them during review — one set for every format.',
    );
    // “Where it stands”: the formats and the last change — no status, no revision, no submission.
    expect(stand()).toEqual(['Formats = Formats: WEB', expect.stringMatching(/^Last change = /)]);
    expect(links()).toEqual(['My experiments', 'Edit draft', ...TABS]);
    // The history tab.
    const history = await readHistory(page);
    expect(history.what).toEqual(['Draft saved']);
    expect(history.notes).toEqual(['Only you can see a draft.']);
    // The shell: My experiments current.
    expect(document.querySelector('aside.rb-rail .rb-nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      '/vendor/experiments',
    );
  });

  it('Edit draft opens the editor at the step the draft last reached', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const record = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0079' as SubmissionId),
    );
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.saveDraft({
        id: record.submission.id,
        content: record.submission.content as never,
        step: 'preview',
        expectedRev: record.submission.rev,
      }),
    );
    show(runtime, 'SUB-0079');
    await title('Pin Fin Efficiency');
    expect(screen.getByRole('link', { name: 'Edit draft' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0079/edit?step=preview',
    );
  });
});

describe('VE-07 — returned by the Academic Reviewer (VE-07_returned)', () => {
  it('the returned-reason panel with who, when, the reason and the chips; Revise and resubmit', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0081');
    await title('Forced Convection');
    expect(pill()).toHaveTextContent('Returned');
    expect(pill()).toHaveClass('xr-st--err');
    await waitFor(() => expect(metaFacts()).toHaveLength(3));
    expect(metaFacts().slice(0, 2)).toEqual(['ME ZG523', 'Revision 1']);
    const panel = region('Returned by the Academic Reviewer');
    expect(panel).toBe(returned());
    expect(panel).toHaveAttribute('tabindex', '-1');
    expect(text(panel.querySelector('.vr-ret-m'))).toBe('24 Aug 2026, 10:00 · Prof. A. Menon');
    expect(text(panel.querySelector('blockquote.vr-ret-q'))).toBe(
      'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
    );
    const references = within(panel).getByRole('list', { name: 'What it refers to' });
    expect(
      within(references)
        .getAllByRole('button')
        .map((chip) => chip.getAttribute('aria-label')),
    ).toEqual([
      'Revise: go to Formats & delivery · AR · Device need',
      'Revise: go to Formats & delivery · AR · Install notes',
    ]);
    // Nothing saved since the return: no saved-changes block.
    expect(panel.querySelector('.vr-ret-pend')).toBeNull();
    // The status is stated by the pill and the panel only: no notice.
    expect(notice()).toBeNull();
    const revise = headAction()!;
    expect(revise).toHaveTextContent('Revise and resubmit');
    expect(revise).toHaveClass('rb-btn--primary', 'rb-btn--lg');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    expect(links()).toEqual(['My experiments', 'Revise and resubmit', ...TABS]);
    expect(intro()).toMatch(/^Revision 1 as it was submitted on \d+ \w{3} 2026\.$/);
    expect(deliveryBlocks().map((block) => block[0])).toEqual([
      'WEBBrowser · Web link',
      'ARAugmented reality · App package',
    ]);
    expect(deliveryBlocks()[1]).toEqual([
      'ARAugmented reality · App package',
      'Package label = Forced Convection — AR build 1.0',
      'Package reference = —',
      // The file’s name alone: the sample-file label does not ship (T-36).
      'Package file = forced-convection-ar-1.0.zip',
      'Device needed = Supported phone or tablet',
      'Install notes = Install the build named above.',
    ]);
    expect(stand()).toEqual([
      'Formats = Formats: WEB, AR',
      'Revision = 1',
      expect.stringMatching(/^Last submitted = \d+ \w{3} 2026$/),
      'Returned = 24 Aug 2026 · Academic Reviewer',
      expect.stringMatching(/^Last change = /),
    ]);
    // A chip opens the editor at that field (LINK-MAP L53): its step and `field=` (the editor's
    // `referenceFieldKey`), which the editor focuses once the reason shows.
    await user.click(
      within(references).getByRole('button', {
        name: 'Revise: go to Formats & delivery · AR · Device need',
      }),
    );
    expect(page.navigation.navigate).toHaveBeenCalledWith(
      '/vendor/experiments/SUB-0081/revise?step=formats&field=ar.device-need',
    );
    const history = await readHistory(page);
    expect(history.what).toEqual([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(history.notes).toEqual([
      'Academic Reviewer: “The AR install notes don’t say which phones and tablets it runs on…”',
      'With the Academic Reviewer. Nothing is published.',
      'Only you can see a draft.',
    ]);
  });

  it('changes saved, not resubmitted: stated inside the panel, Continue revising, the private-changes note', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0081');
    await title('Forced Convection');
    const record = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0081' as SubmissionId),
    ).submission;
    at(sample, '2026-10-20T05:10:00.000Z'); // 20 Oct 2026, 10:40
    const content = record.content as unknown as {
      delivery: { ar: Record<string, unknown> };
    };
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.saveRevision({
        id: record.id,
        content: {
          ...content,
          delivery: {
            ...content.delivery,
            ar: { ...content.delivery.ar, deviceNeeded: 'Android phones that support ARCore' },
          },
        } as never,
        expectedRev: record.rev,
      }),
    );
    const saved = await within(region('Returned by the Academic Reviewer')).findByRole('status');
    expect(saved).toHaveClass('vr-ret-pend');
    expect(glyph(saved)).toBe(V3_ICON_PATHS.lock);
    expect(text(saved.querySelector('.vr-ret-pend-t'))).toBe(
      'Your changes are saved but not resubmitted',
    );
    expect(text(saved.querySelector('.vr-ret-pend-d'))).toBe(
      'Saved 20 Oct 2026, 10:40. Only you can see them. Everyone else still sees revision 1 as it was submitted.',
    );
    // No changed-field list: the Vendor’s read does not say which fields changed.
    expect(saved.querySelector('.vr-ret-pend-k, .vr-ret-pend-l')).toBeNull();
    expect(headAction()).toHaveTextContent('Continue revising');
    expect(headAction()).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    expect(pill()).toHaveTextContent('Returned');
    // Details shows the saved changes and says so.
    expect(intro()).toBe(
      'Your changes as last saved on 20 Oct 2026, 10:40. They are not resubmitted yet.',
    );
    expect(deliveryBlocks()[1]).toContain('Device needed = Android phones that support ARCore');
    // The history: the private-changes note, and no entry for the saved changes.
    page.tab('history');
    const sheet = await screen.findByRole('region', { name: 'Submission and version history' });
    expect(text(sheet.querySelector('p.vr-intro--inline'))).toBe(
      'Your changes saved on 20 Oct 2026, 10:40 are not part of this history until you resubmit.',
    );
    expect(what()).toEqual([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
  });
});

describe('VE-07 — read-only states (VE-07_with-cm, VE-07_readonly, VE-07_published)', () => {
  it('with the Content Manager: approved on the day, nothing is needed; the outcomes', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    expect(pill()).toHaveTextContent('With Content Manager');
    expect(pill()).toHaveClass('xr-st--info');
    expect(notice()).toHaveClass('rk-notice--info');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.clock);
    expect(noticeTitle()).toBe('With the Content Manager');
    expect(notice()).toHaveTextContent(
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    const outcomes = region('Learning outcomes');
    expect(text(outcomes.querySelector('p.ve-intro'))).toBe('One set for every format.');
    expect([...outcomes.querySelectorAll('ol.ve-los li')].map((item) => text(item))).toEqual([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    expect(stand()).toEqual([
      'Formats = Formats: WEB',
      'Revision = 1',
      expect.stringMatching(/^Last submitted = /),
      'Approved by the Academic Reviewer = 14 Aug 2026',
      expect.stringMatching(/^Last change = /),
    ]);
    expect(headAction()).toBeNull();
    expect(links()).toEqual(['My experiments', ...TABS]);
    expect(screen.queryAllByRole('button', { name: /withdraw|publish|update|format/i })).toEqual(
      [],
    );
    const history = await readHistory(page);
    expect(history.what).toEqual([
      'Approved by the Academic Reviewer',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(history.notes[0]).toBe('With the Content Manager.');
  });

  it('a draft whose course is no longer assigned: Draft · read-only, Ask for help, no Edit draft', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0083');
    await title('Surface Roughness in Turning');
    await waitFor(() => expect(metaFacts()[0]).toBe('MEL ZG512'));
    expect(metaFacts()).toHaveLength(2);
    expect(pill()).toHaveTextContent('Draft · read-only');
    expect(pill()).toHaveClass('xr-st--paused');
    expect(notice()).toHaveClass('rk-notice--warn');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.lock);
    expect(noticeTitle()).toBe('MEL ZG512 is no longer assigned to you');
    expect(notice()).toHaveTextContent(
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    const help = within(notice() as HTMLElement).getByRole('link', { name: 'Ask for help' });
    expect(help).toHaveClass('rb-btn');
    expect(help).toHaveAttribute('href', '/vendor/help/report');
    expect(headAction()).toBeNull();
    expect(intro()).toMatch(
      /^Your draft as last saved on \d+ \w{3} 2026, \d\d:\d\d\. It can’t be changed or submitted\.$/,
    );
    expect(rows('Course and description')[0]).toBe('Course = MEL ZG512 · Manufacturing Processes');
    expect(stand()).toEqual(['Formats = Formats: WEB', expect.stringMatching(/^Last change = /)]);
    expect(links()).toEqual(['My experiments', 'Ask for help', ...TABS]);
  });

  it('published: the day, the formats published, read-only; no catalogue link', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0052');
    await title('Fin-Tube Bundle');
    expect(pill()).toHaveTextContent('Published');
    expect(pill()).toHaveClass('xr-st--ok');
    expect(notice()).toHaveClass('rk-notice--ok');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.check);
    expect(noticeTitle()).toBe('Published · 30 Jul 2026');
    expect(notice()).toHaveTextContent(
      'It is live in the catalogue with the formats below. It is read-only here.',
    );
    expect(intro()).toBe('The published version, live in the catalogue since 30 Jul 2026.');
    const delivery = region('Formats and delivery');
    expect(text(delivery.querySelector('.vr-sec-st'))).toBe('Formats published: WEB · VR');
    expect(text(delivery.querySelector('p.vr-foot'))).toBe(
      'Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(stand()).toEqual([
      'Formats = Formats: WEB, VR',
      'Revision = 1',
      expect.stringMatching(/^Last submitted = /),
      expect.stringMatching(/^Approved by the Academic Reviewer = /),
      'Published = 30 Jul 2026',
      expect.stringMatching(/^Last change = /),
    ]);
    expect(links()).toEqual(['My experiments', ...TABS]);
    const history = await readHistory(page);
    expect(history.what[0]).toBe('Published by the Content Manager');
    expect(history.notes[0]).toBe('WEB and VR are live in the catalogue.');
  });
});

describe('VE-07 — Flow E on one world (SUB-0077)', () => {
  it('saved, submitted, returned, resubmitted — “Submitted” (VE-07_submitted-rev2), with the CM, published', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0077');
    // Before the first save it does not exist.
    await title('Experiment record');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We can’t find that experiment' }),
    ).toBeVisible();

    at(sample, '2026-10-06T12:10:00.000Z'); // 6 Oct 2026, 17:40
    const saved = await as(runtime, sample, ANIL, (ports) =>
      ports.production.saveDraft({
        id: null,
        content: compositeWall('VR headset'),
        step: 'course',
        expectedRev: null,
      }),
    );
    expect((saved as { id: string }).id).toBe('SUB-0077');
    await title('Conduction Through a Composite Wall');
    expect(pill()).toHaveTextContent('Draft');
    expect(intro()).toBe(
      'Your draft as last saved on 6 Oct 2026, 17:40. Nothing here has been submitted.',
    );
    expect((await readHistory(page)).what).toEqual(['Draft saved']);

    at(sample, '2026-10-07T05:22:00.000Z'); // 7 Oct 2026, 10:52
    const draft = saved as { id: SubmissionId; rev: number };
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.submitForReview({
        id: draft.id,
        content: compositeWall('VR headset'),
        expectedRev: draft.rev,
      }),
    );
    await waitFor(() => expect(pill()).toHaveTextContent('With Academic Reviewer'));
    expect(pill()).toHaveClass('xr-st--info');
    expect(metaFacts()).toEqual(['ME ZG523', 'Revision 1', 'Last change 7 Oct 2026']);
    expect(noticeTitle()).toBe('With the Academic Reviewer');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.clock);
    expect(notice()).toHaveTextContent(
      'Nothing is needed from you now. You can edit it again only if it is returned to you.',
    );
    expect(intro()).toBe('Revision 1 as it was submitted on 7 Oct 2026.');
    let history = await readHistory(page);
    expect(history.what).toEqual(['Submitted for academic review', 'Draft saved']);
    expect(history.text).toContain('7 Oct 2026, 10:52');
    expect(links()).toEqual(['My experiments', ...TABS]);

    at(sample, '2026-10-14T10:35:00.000Z'); // 14 Oct 2026, 16:05
    let review = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview(draft.id),
    ).submission;
    await as(runtime, sample, MENON, (ports) =>
      ports.production.returnSubmission({
        id: draft.id,
        reason: 'Please clarify the VR device requirements.',
        references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
        outcomes: OUTCOMES,
        expectedRev: review.rev,
      }),
    );
    await waitFor(() => expect(pill()).toHaveTextContent('Returned'));
    const panel = returned()!;
    expect(text(panel.querySelector('.vr-ret-m'))).toBe('14 Oct 2026, 16:05 · Prof. A. Menon');
    expect([...panel.querySelectorAll('button.ve-ref')].map((chip) => text(chip))).toEqual([
      'Formats & delivery · VR · Device need',
    ]);
    // The outcomes travel with the return (OD-B6-04).
    expect(
      [...region('Learning outcomes').querySelectorAll('ol.ve-los li')].map((item) => text(item)),
    ).toEqual(OUTCOMES);
    history = await readHistory(page);
    expect(history.notes[0]).toBe(
      'Academic Reviewer: “Please clarify the VR device requirements.”',
    );

    at(sample, '2026-10-21T06:00:00.000Z'); // 21 Oct 2026, 11:30
    let current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.resubmit({
        id: draft.id,
        content: compositeWall(VR_DEVICE_REVISED),
        expectedRev: current.rev,
      }),
    );
    // Routed back to the Academic Reviewer at once (PC-66) — the Vendor reads “Submitted”.
    current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    expect(current.status).toMatchObject({
      state: 'with-academic-reviewer',
      reason: 'resubmission',
    });
    await waitFor(() => expect(pill()).toHaveTextContent('Submitted'));
    expect(pill()).toHaveClass('xr-st--info');
    expect(metaFacts()).toEqual(['ME ZG523', 'Revision 2', 'Last change 21 Oct 2026']);
    expect(noticeTitle()).toBe('Submitted');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.check);
    expect(notice()).toHaveTextContent(
      'Your changes have been submitted for review. Nothing is needed from you now.',
    );
    expect(notice()).not.toHaveTextContent('Academic Reviewer');
    expect(pill()).not.toHaveTextContent('Academic Reviewer');
    expect(returned()).toBeNull();
    expect(intro()).toBe('Revision 2 as it was submitted on 21 Oct 2026.');
    expect(region('Formats and delivery')).toHaveTextContent(VR_DEVICE_REVISED);
    expect(stand()).toEqual([
      'Formats = Formats: WEB, VR',
      'Revision = 2',
      'Last submitted = 21 Oct 2026',
      'Last change = 21 Oct 2026',
    ]);
    expect(links()).toEqual(['My experiments', ...TABS]);
    history = await readHistory(page);
    expect(history.what).toEqual([
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(history.notes[0]).toBe('Your changes have been submitted for review.');
    expect(history.text).not.toContain('Routed by the approved workflow rule.');

    at(sample, '2026-10-22T09:50:00.000Z'); // 22 Oct 2026, 15:20
    review = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview(draft.id),
    ).submission;
    await as(runtime, sample, MENON, (ports) =>
      ports.production.approveSubmission({
        id: draft.id,
        outcomes: OUTCOMES,
        expectedRev: review.rev,
      }),
    );
    await waitFor(() => expect(pill()).toHaveTextContent('With Content Manager'));
    expect(notice()).toHaveTextContent('Approved by the Academic Reviewer on 22 Oct 2026.');
    // The routing entry is never the Vendor’s to read (HANDOFF §2): “Submitted · revision 2” stays.
    history = await readHistory(page);
    expect(history.what).toEqual([
      'Approved by the Academic Reviewer',
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(history.text).not.toContain('With Academic Reviewer · revision 2');

    at(sample, '2026-10-23T04:35:00.000Z'); // 23 Oct 2026, 10:05
    current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.publish({ id: draft.id, expectedRev: current.rev }),
    );
    await waitFor(() => expect(pill()).toHaveTextContent('Published'));
    expect(noticeTitle()).toBe('Published · 23 Oct 2026');
    expect(text(region('Formats and delivery').querySelector('.vr-sec-st'))).toBe(
      'Formats published: WEB · VR',
    );
    expect(stand()).toEqual([
      'Formats = Formats: WEB, VR',
      'Revision = 2',
      'Last submitted = 21 Oct 2026',
      'Approved by the Academic Reviewer = 22 Oct 2026',
      'Published = 23 Oct 2026',
      'Last change = 23 Oct 2026',
    ]);
    history = await readHistory(page);
    expect(history.what[0]).toBe('Published by the Content Manager');
    expect(history.notes[0]).toBe('WEB and VR are live in the catalogue.');
    expect(links()).toEqual(['My experiments', ...TABS]);
  });

  it('returned by the Content Manager (VE-07_returned-by-cm): her reason, the chip, Revise and resubmit', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    const current = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0074' as SubmissionId),
    ).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.sendBack({
        id: current.id,
        to: 'vendor',
        reason:
          'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.',
        references: [{ step: 'course-and-description', format: null, field: 'summary' }],
        expectedRev: current.rev,
      }),
    );
    await waitFor(() => expect(pill()).toHaveTextContent('Returned'));
    const panel = region('Returned by the Content Manager');
    expect(text(panel.querySelector('.vr-ret-m'))).toMatch(/ · Kavya Nair$/);
    expect(
      within(panel)
        .getAllByRole('button')
        .map((chip) => text(chip)),
    ).toEqual(['Course & description · Summary']);
    expect(notice()).toBeNull();
    expect(screen.getByRole('link', { name: 'Revise and resubmit' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0074/revise',
    );
    // Approved before the Content Manager returned it: “Where it stands” keeps the approval.
    expect(stand()).toContain('Approved by the Academic Reviewer = 14 Aug 2026');
    expect(stand()).toContainEqual(expect.stringMatching(/^Returned = .+ · Content Manager$/));
    // A Course and description reference: the first step is the address's default, so no `step=`.
    await userEvent.click(within(panel).getByRole('button'));
    expect(page.navigation.navigate).toHaveBeenCalledWith(
      '/vendor/experiments/SUB-0074/revise?field=summary',
    );
    const history = await readHistory(page);
    expect(history.what[0]).toBe('Returned with a reason');
    expect(history.notes[0]).toBe('Content Manager: “The summary runs to three sentences…”');
  });

  it('back with the Academic Reviewer for a re-check (VE-07_recheck): nothing is needed; her reason is not shown', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    const current = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0074' as SubmissionId),
    ).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.sendBack({
        id: current.id,
        to: 'academic-reviewer',
        reason: 'Please check the second outcome against the description.',
        expectedRev: current.rev,
      }),
    );
    await waitFor(() =>
      expect(noticeTitle()).toBe('Back with the Academic Reviewer for a re-check'),
    );
    expect(pill()).toHaveTextContent('With Academic Reviewer');
    expect(pill()).toHaveClass('xr-st--info');
    expect(glyph(notice())).toBe(V3_ICON_PATHS.clock);
    expect(notice()).toHaveTextContent(
      'The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you.',
    );
    expect(main()).not.toHaveTextContent('Please check the second outcome');
    expect(links()).toEqual(['My experiments', ...TABS]);
    const history = await readHistory(page);
    expect(history.what[0]).toBe('Back with the Academic Reviewer for a re-check');
    expect(history.notes[0]).toBe('Sent back by the Content Manager. Nothing is needed from you.');
    expect(history.text).not.toContain('Please check the second outcome');
  });
});

describe('VE-13 Submission and version history (`?tab=history`)', () => {
  it('lands on the record’s history tab with focus on its heading; “Where it stands” stays beside it', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0081', '?tab=history');
    await title('Forced Convection');
    const heading = within(historySheet()).getByRole('heading', {
      level: 2,
      name: 'Submission and version history',
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(text(historySheet().querySelector('.vr-sec-st'))).toBe(
      'Newest first · not an audit log',
    );
    expect(historySheet().querySelector('ol.rk-tl > li')).toHaveClass('is-latest');
    // Dates at the right of each entry (`rk-tl-t`).
    expect(text(historySheet().querySelector('.rk-tl-t'))).toBe(
      dateTime('2026-08-24T04:30:00.000Z'),
    );
    expect(historySheet().querySelector('.vr-intro--inline')).toBeNull();
    expect(page.navigation.replace).not.toHaveBeenCalled();
    expect(currentTab()).toBe('Submission and version history');
    expect(screen.queryByRole('region', { name: 'Course and description' })).toBeNull();
    expect(screen.getByRole('complementary', { name: 'Where it stands' })).toBeVisible();
    // The head and the panel stay: the status is not repeated.
    expect(returned()).not.toBeNull();
    expect(document.querySelector('aside.rb-rail .rb-nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      '/vendor/experiments',
    );
    // Each tab keeps its address.
    const tabs = screen.getByRole('navigation', { name: 'Experiment record' });
    expect(within(tabs).getByRole('link', { name: 'Details' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0081',
    );
    expect(
      within(tabs).getByRole('link', { name: 'Submission and version history' }),
    ).toHaveAttribute('href', '/vendor/experiments/SUB-0081?tab=history');
    // Back on Details, focus returns to the page heading.
    page.tab('details');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
    expect(currentTab()).toBe('Details');
    // And to the history again: its heading.
    page.tab('history');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Submission and version history' }),
      ).toHaveFocus(),
    );
  });

  it('any other tab value shows the record at its bare address', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const page = show(runtime, 'SUB-0081', '?tab=details');
    await title('Forced Convection');
    expect(page.navigation.replace).toHaveBeenCalledWith('/vendor/experiments/SUB-0081');
    expect(currentTab()).toBe('Details');
  });

  it('the Vendor’s entries only: an override is the Super Admin’s; a routing entry is never shown', () => {
    const entry = (event: string, note: string | null, visibleTo: string[], instant: string) => ({
      id: `${event}-${instant}`,
      event,
      at: instant,
      actor: { kind: 'system', system: 'system:workflow-routing' },
      note,
      visibleTo,
      refs: [],
    });
    const staff = ['vendor', 'academic_reviewer', 'content_manager', 'super_admin'];
    const view = (status: unknown, history: unknown[]) =>
      ({
        submission: {
          id: 'SUB-0001',
          revision: 2,
          status,
          content: { formats: ['web'] },
          history,
        },
        guards: { courseNoLongerAssigned: false },
        lastReturn: null,
      }) as unknown as VendorRecordView;
    // The resubmitted state before routing (a build whose seam routes it later): “Submitted”.
    const resubmitted = view({ state: 'resubmitted', since: '2026-08-26T06:00:00.000Z' }, [
      entry('submitted', null, staff, '2026-08-12T05:22:00.000Z'),
      entry('resubmitted', '2', staff, '2026-08-26T06:00:00.000Z'),
    ]);
    expect(recordStateOf(resubmitted)).toBe('submitted');
    expect(historyEvents(resubmitted).map((event) => event.what)).toEqual([
      'Submitted · revision 2',
      'Submitted for academic review',
    ]);
    // Routed: still “Submitted”, the routing entry left out — and once it has moved on too.
    const history = [
      entry('resubmitted', '2', staff, '2026-08-26T06:00:00.000Z'),
      entry('routed', '2', staff, '2026-08-26T06:01:00.000Z'),
      entry('status-overridden', 'Stuck', ['super_admin'], '2026-08-27T06:01:00.000Z'),
    ];
    const routed = view(
      {
        state: 'with-academic-reviewer',
        since: '2026-08-26T06:01:00.000Z',
        reason: 'resubmission',
      },
      history,
    );
    expect(recordStateOf(routed)).toBe('submitted');
    expect(historyEvents(routed).map((event) => event.what)).toEqual(['Submitted · revision 2']);
    const approved = view({ state: 'with-content-manager', since: '2026-08-28T06:00:00.000Z' }, [
      ...history,
      entry('approved-by-reviewer', null, staff, '2026-08-28T06:00:00.000Z'),
    ]);
    expect(historyEvents(approved).map((event) => event.what)).toEqual([
      'Approved by the Academic Reviewer',
      'Submitted · revision 2',
    ]);
    // A single format’s publication note, and three (state-copy VE-13.published-one).
    const published = (formats: string[]) =>
      historyEvents({
        ...view({ state: 'published', at: '2026-08-28T04:35:00.000Z', experimentId: 'x' }, []),
        submission: {
          ...view({ state: 'published' }, []).submission,
          content: { formats },
          history: [entry('published', null, staff, '2026-08-28T04:35:00.000Z')],
        },
      } as unknown as VendorRecordView)[0]!.note;
    expect(published(['web'])).toBe('WEB is live in the catalogue.');
    expect(published(['vr', 'web', 'ar'])).toBe('WEB, AR and VR are live in the catalogue.');
  });
});

describe('VE-07 — not found, not permitted, policy-open, loading and failed (undrawn)', () => {
  it.each([
    ['an unknown id', 'SUB-9999'],
    ['another vendor’s record (Meridian’s SUB-0086)', 'SUB-0086'],
  ])('%s: “We can’t find that experiment”, nothing of the record', async (_, id) => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, id);
    await title('Experiment record');
    const calm = (
      await screen.findByRole('heading', { level: 2, name: 'We can’t find that experiment' })
    ).closest('.rk-state');
    expect(calm).toHaveTextContent(
      'It isn’t one of your experiments, or the address is wrong. Your experiments are in My experiments.',
    );
    expect(calm!.closest('.rk-surface')).not.toBeNull();
    expect(glyph(calm!.querySelector('.rk-state-ico'))).toBe(V3_ICON_PATHS.infoNote);
    expect(main()).not.toHaveTextContent('Flash Distillation');
    expect(links()).toEqual(['My experiments']);
    expect(
      text(screen.getByRole('navigation', { name: 'Breadcrumb' }).querySelector('[aria-current]')),
    ).toBe('Experiment record');
  });

  it('a colleague’s record (policy-open SUB-15): a calm state', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    vi.spyOn(runtime.ports.production, 'getRecord').mockResolvedValue({
      ok: false,
      error: { kind: 'policy-open', decision: 'SUB-15' },
    } as never);
    show(runtime, 'SUB-0099');
    await title('Experiment record');
    const calm = (
      await screen.findByRole('heading', {
        level: 2,
        name: 'This experiment was created by a colleague',
      })
    ).closest('.rk-state');
    expect(calm).toHaveTextContent(
      'Opening a colleague’s experiment isn’t settled yet. Your own experiments are in My experiments.',
    );
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.getRecord');
    renderInTab(<ExperimentRecord submissionId="SUB-0081" />, {
      runtime,
      navigation: testNavigation('/vendor/experiments/SUB-0081'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the experiment record',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Experiment record');
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load the experiment record',
    });
    const state = failed.closest('.rk-state');
    expect(state).toHaveAttribute('role', 'alert');
    expect(state).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await title('Forced Convection')).toBeVisible();
  });
});
