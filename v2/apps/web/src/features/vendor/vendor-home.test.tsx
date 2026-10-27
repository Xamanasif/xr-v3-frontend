/**
 * VE-01 Overview and VE-02 My experiments in the owner-approved Vendor export's design (V3 Refined
 * B, design/v3-refined-b/roles/VE-v1 `Main.dc.html`) on the real composition root and the sample
 * world, as Anil Shetty (Northline Simulation Studio, ME ZG523; MEL ZG512 withdrawn on 15 Aug). The
 * spine-start world holds his five records — SUB-0079 Pin Fin Efficiency (draft), SUB-0081 Forced
 * Convection (returned by the Academic Reviewer), SUB-0074 Transient Cooling (with the Content
 * Manager), SUB-0083 Surface Roughness in Turning (read-only draft) and SUB-0052 Fin-Tube Bundle
 * (published); Flow E's SUB-0077 “Conduction Through a Composite Wall” is saved and submitted
 * through his own ports, as the editor would. The one world moves the pages: the Academic
 * Reviewer's return, the Content Manager's send-back and the Vendor's own Save changes through
 * their ports change both screens in the same tab. Ritu Sharma (Meridian) has nothing to do (calm);
 * a Vendor the Super Admin has just registered has no experiment yet (first visit, empty). The
 * undrawn overview loading and failed states, and the list's, read again. No page names an
 * experiment by its reference (the owner's identifier rule for the Vendor, 22 Oct 2026; state-copy
 * `VE-02.no-reference`): every drawn state is checked, and rows are found by their link's address.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, SubmissionId } from '@xr/domain';
import { asPersonId, beginSession, faults, fixtureWorld } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { STATE_COPY_VENDOR_HOME } from '@/copy/state-copy-vendor-home';
import type { PlatformRuntime } from '@/platform/runtime';
import { renderInTab, tabPlatform, testNavigation, worldPlatform } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { VendorOverview } from './ve-01-overview/overview';
import {
  changedRecently,
  myExperimentsFilterAddress,
  type MyExperimentRow,
  recentFilterOf,
  statusFilterOf,
  vendorStatusOf,
} from './ve-02-my-experiments/experiment-rows';
import { MyExperiments } from './ve-02-my-experiments/my-experiments';
import { hasSavedChanges, savedChangesAt } from './shared/saved-changes';
import { vendorPill } from './shared/status-pill';

afterEach(() => {
  forgetLastAddress();
});

const ANIL = 'per-anil-shetty';
const RITU = 'per-ritu-sharma';
const MENON = 'per-a-menon';
const KAVYA = 'per-kavya-nair';
const ARJUN = 'sa-arjun-mehta';
const NORTHLINE = 'Northline Simulation Studio';
const THERMO = 'thermodynamics-heat-transfer';
const REASON =
  'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.';
/** The export's “now”, 27 Aug 2026 (10:00 in Indian time): its 7-day filter's window. */
const BOARD_NOW = '2026-08-27T04:30:00.000Z';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

/** An internal reference no Vendor page shows (the owner's identifier rule, 22 Oct 2026). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No reference in the words, names, titles or placeholders drawn, nor in the tab's title. */
function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** Flow E's SUB-0077, as the walk's E1 saves it. */
function compositeWall() {
  return {
    courseId: THERMO as CourseId,
    name: 'Conduction Through a Composite Wall',
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface.',
    version: '1.0',
    formats: ['web', 'vr'] as ('web' | 'vr')[],
    delivery: {
      web: {
        format: 'web' as const,
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current Chrome, Edge, Firefox or Safari on a laptop or desktop',
        notes: null,
      },
      vr: {
        format: 'vr' as const,
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: null,
        packageFileName: 'composite-wall-vr-1.0.zip',
        deviceNeeded: 'VR headset',
        installNotes: 'Install the build named above on the headset and open “Composite Wall Lab”.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

/** Anil saves SUB-0077 (the editor's first save mints it), optionally at a later step, and submits. */
async function saveCompositeWall(
  runtime: PlatformRuntime,
  options: { readonly step?: 'course' | 'formats'; readonly submit?: boolean } = {},
) {
  let id: SubmissionId | null = null;
  await act(async () => {
    const answer = await runtime.ports.production.saveDraft({
      id: null,
      content: compositeWall(),
      step: options.step ?? 'course',
      expectedRev: null,
    });
    if (!answer.ok) throw new Error(`save ${JSON.stringify(answer.error)}`);
    await runtime.invalidate(answer.changed);
    const saved = answer.value;
    id = saved.id;
    if (options.submit) {
      const sent = await runtime.ports.production.submitForReview({
        id: saved.id,
        content: compositeWall(),
        expectedRev: saved.rev,
      });
      if (!sent.ok) throw new Error(`submit ${JSON.stringify(sent.error)}`);
      await runtime.invalidate(sent.changed);
    }
  });
  return id!;
}

/** The Academic Reviewer returns a submission (RV-03), through his own ports. */
async function menonReturns(runtime: PlatformRuntime, sample: Sample, id: SubmissionId) {
  const menon = asPersonId(sample, MENON);
  await act(async () => {
    const page = ok(await menon.production.getSubmissionForReview(id));
    const returned = await menon.production.returnSubmission({
      id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: [],
      expectedRev: page.submission.rev,
    });
    if (!returned.ok) throw new Error(`return ${JSON.stringify(returned.error)}`);
    await runtime.invalidate(returned.changed);
  });
}

/** Anil's Save changes on SUB-0081 (VE-08), through his own port: a private, unsent revision. */
async function anilSavesChanges(runtime: PlatformRuntime) {
  await act(async () => {
    const record = ok(await runtime.ports.production.getRecord('SUB-0081' as SubmissionId));
    const saved = await runtime.ports.production.saveRevision({
      id: record.submission.id,
      content: record.submission.content,
      expectedRev: record.submission.rev,
    });
    if (!saved.ok) throw new Error(`save changes ${JSON.stringify(saved.error)}`);
    await runtime.invalidate(saved.changed);
  });
}

/** A Vendor the Super Admin registers now (SA-16): no experiment yet. */
/** A Vendor registered just now — with “Any course” (the dialog's default, PD-3) unless not. */
async function newVendor(anyCourse = true): Promise<{ runtime: PlatformRuntime; sample: Sample }> {
  const { runtime, sample } = await tabPlatform(null, 'spine-start');
  const holder = ok(
    await asPersonId(sample, ARJUN).platformRoles.registerHolder({
      role: 'vendor',
      name: 'Kiran Rao',
      workEmail: 'kiran.rao@northline.example',
      organisation: NORTHLINE,
      anyCourse,
    }),
  );
  beginSession(sample, holder.personId);
  await runtime.session.refresh();
  return { runtime, sample };
}

function showOverview(runtime: PlatformRuntime) {
  const navigation = testNavigation('/vendor');
  const view = renderInTab(
    <WorkspaceLayout workspace="vendor">
      <VendorOverview />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

function showList(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation('/vendor/experiments', search);
  const view = renderInTab(
    <WorkspaceLayout workspace="vendor">
      <MyExperiments />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const h1 = () => screen.getByRole('heading', { level: 1 });
const texts = (nodes: Iterable<Element>) => [...nodes].map((node) => node.textContent);

// ---- VE-01 Overview helpers ----
const attention = () => screen.findByRole('region', { name: 'Needs your action' });
const activity = () => screen.getByRole('region', { name: 'Recent activity' });
const figures = () => main().querySelector('dl[aria-label="Your experiments at a glance"]');
const figureRows = () =>
  [...(figures()?.querySelectorAll(':scope > div') ?? [])].map((figure) =>
    texts(figure.children).join(' | '),
  );
const lead = (region: HTMLElement) => region.querySelector('.rb-lead') as HTMLElement | null;
const itemRows = (region: HTMLElement) =>
  [...region.querySelectorAll('ul.vr-ai-list > li')] as HTMLElement[];
const activityRows = () =>
  [...activity().querySelectorAll('li')].map(
    (row) =>
      `${row.querySelector('.rb-row-when b')?.textContent} ${row.querySelector('.rb-row-when span')?.textContent} · ${row.querySelector('.rb-row-t')?.textContent} · ${row.querySelector('a')?.textContent}`,
  );

// ---- VE-02 My experiments helpers ----
/** The list once its rows are on show (the tool row is drawn around the loading rows too). */
const list = async () => {
  await screen.findByRole('table');
  return screen.getByRole('region', { name: 'Your experiments' });
};
const tools = () => screen.getByRole('search', { name: 'Search your experiments' });
const searchBox = () =>
  within(tools()).getByRole('searchbox', { name: 'Search by name or course' });
const recentBox = () =>
  within(tools()).getByRole('checkbox', { name: 'Changed in the last 7 days' });
const count = () => within(tools()).getByRole('status');
const tabs = () => screen.getByRole('group', { name: 'Show experiments by status' });
const tabNames = () =>
  within(tabs())
    .getAllByRole('button')
    .map((tab) => tab.getAttribute('aria-label'));
const pressedTab = () => tabs().querySelector('[aria-pressed="true"]')?.getAttribute('aria-label');
const table = () => screen.getByRole('table');
const bodyRows = () => [...table().querySelectorAll('tbody tr')] as HTMLElement[];
const rowNames = () => bodyRows().map((row) => row.querySelector('a.vr-name')?.textContent);
/** Each row's record, read from its name link's address (no row shows the reference). */
const rowIds = () => bodyRows().map((row) => idOfRow(row));
const idOfRow = (row: Element) =>
  /^\/vendor\/experiments\/([^/?]+)$/.exec(
    row.querySelector('a.vr-name')?.getAttribute('href') ?? '',
  )?.[1];
const rowOf = (name: string) =>
  bodyRows().find((row) => row.querySelector('a.vr-name')?.textContent === name)!;

// ---- VE-01 Overview ---------------------------------------------------------------------------

describe('VE-01 Overview — Anil Shetty (the export’s portfolio)', () => {
  it('the studio band, its counts, the returned lead, the draft to finish and Recent activity', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    const region = await attention();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1()).toHaveAccessibleName(/^Overview,\s?Northline Simulation Studio$/);
    expect(h1()).toHaveAttribute('tabindex', '-1');
    const band = h1().closest('section') as HTMLElement;
    expect(band.querySelector('.rb-eyebrow-date')).toHaveTextContent('Friday 2 October 2026');
    await waitFor(() =>
      expect(band.querySelector('.rb-id-status')).toHaveTextContent(
        'Your course: ME ZG523 · Thermodynamics & Heat Transfer',
      ),
    );
    // Create experiment in the band is the default (white) button.
    const create = within(band).getByRole('link', { name: 'Create experiment' });
    expect(create.className).toBe('rb-btn rb-btn--lg');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    // The four counts: With you, In review, Published and Read-only (SUB-0083).
    expect(figureRows()).toEqual([
      'With you | 2 | 1 returned · 1 draft',
      'In review | 1 | Nothing needed from you',
      'Published | 1 | Live in the catalogue',
      'Read-only | 1 | Course no longer assigned',
    ]);
    // “Needs your action”: the returned item leads, the draft follows; the read-only draft is not
    // listed.
    expect(region.querySelector('.rb-att-head .rb-note')).toHaveTextContent('2 items');
    const leading = lead(region)!;
    expect(leading.querySelector('.vr-kind')).toHaveTextContent('Returned to you');
    expect(leading.querySelector('.rb-lead-t')).toHaveTextContent('Forced Convection');
    expect(leading.querySelector('.vr-lead-meta')).toHaveTextContent(
      'Academic Reviewer · Prof. A. Menon · 24 Aug 2026',
    );
    expect(leading.querySelector('blockquote')).toHaveTextContent(REASON);
    expect(leading.querySelector('.vr-lead-refs-k')).toHaveTextContent('Refers to');
    expect(texts(leading.querySelectorAll('.vr-ref'))).toEqual([
      'AR · Device need',
      'AR · Install notes',
    ]);
    expect(leading.querySelector('.vr-lead-pend')).toBeNull();
    const revise = within(leading).getByRole('link', {
      name: 'Revise Forced Convection, returned by the Academic Reviewer',
    });
    expect(revise).toHaveTextContent('Revise “Forced Convection”');
    expect(revise.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    const [draft] = itemRows(region);
    expect(itemRows(region)).toHaveLength(1);
    expect(draft!.querySelector('.rb-ai-t')).toHaveTextContent('Draft to finishPin Fin Efficiency');
    expect(draft!.querySelector('.rb-ai-d')).toHaveTextContent(
      'Saved at step 1 of 4 · 25 Aug 2026 · only you can see it',
    );
    const finish = within(draft!).getByRole('link', {
      name: 'Finish the draft of Pin Fin Efficiency',
    });
    expect(finish).toHaveTextContent('Finish draft');
    expect(finish.className).toBe('rb-btn');
    expect(finish).toHaveAttribute('href', '/vendor/experiments/SUB-0079/edit');
    // One gold action on the page.
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(screen.queryByText('Surface Roughness in Turning', { exact: false })).toBeNull();
    // Recent activity: the five newest entries the Vendor may see, each opening its record.
    expect(activity().querySelector('.rb-note')).toHaveTextContent('Newest first');
    expect(activityRows()).toEqual([
      '25 Aug 10:00 · Draft saved · Pin Fin Efficiency',
      '24 Aug 10:00 · Returned with a reason · Forced Convection',
      '18 Aug 10:00 · Submitted for academic review · Forced Convection',
      '17 Aug 10:00 · Draft saved · Forced Convection',
      '14 Aug 15:10 · Approved by the Academic Reviewer · Transient Cooling',
    ]);
    expect(
      within(activity()).getByRole('link', {
        name: 'Draft saved, Pin Fin Efficiency, 25 Aug 2026, 10:00. Open the experiment record',
      }),
    ).toHaveAttribute('href', '/vendor/experiments/SUB-0079');
    expect(
      within(activity()).getByRole('link', { name: 'Changed in the last 7 days' }),
    ).toHaveAttribute('href', '/vendor/experiments?changed=last-7-days');
    expect(
      within(activity()).getByRole('link', { name: 'See all your experiments' }),
    ).toHaveAttribute('href', '/vendor/experiments');
    // The shell: the rail's two destinations, Overview current.
    const sidebar = screen.getByRole('navigation', { name: 'Vendor navigation' });
    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Overview', 'My experiments']);
    expect(sidebar.querySelector('[aria-current="page"]')).toHaveAttribute('href', '/vendor');
    expectNoReferences();
  });

  it('after Flow E’s submit: In review counts it and Recent activity opens with it', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    const id = await saveCompositeWall(runtime, { submit: true });
    await waitFor(() => expect(figureRows()[1]).toBe('In review | 2 | Nothing needed from you'));
    expect(figureRows()[0]).toBe('With you | 2 | 1 returned · 1 draft');
    expect(activityRows().slice(0, 2)).toEqual([
      expect.stringMatching(
        /^Today \d\d:\d\d · Submitted for academic review · Conduction Through a Composite Wall$/,
      ),
      expect.stringMatching(
        /^Today \d\d:\d\d · Draft saved · Conduction Through a Composite Wall$/,
      ),
    ]);
    expect(
      within(activity()).getAllByRole('link', { name: /Conduction Through a Composite Wall/ })[0],
    ).toHaveAttribute('href', `/vendor/experiments/${id}`);
    const region = await attention();
    expect(lead(region)?.querySelector('.rb-lead-t')).toHaveTextContent('Forced Convection');
    expect(itemRows(region)).toHaveLength(1);
    expectNoReferences();
  });

  it('a new draft joins the drafts to finish (changed last first); Finish draft opens its step', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    const id = await saveCompositeWall(runtime, { step: 'formats' });
    await waitFor(async () =>
      expect((await attention()).querySelector('.rb-att-head .rb-note')).toHaveTextContent(
        '3 items',
      ),
    );
    const region = await attention();
    expect(itemRows(region).map((row) => row.querySelector('.rb-ai-t')?.textContent)).toEqual([
      'Draft to finishConduction Through a Composite Wall',
      'Draft to finishPin Fin Efficiency',
    ]);
    expect(itemRows(region)[0]!.querySelector('.rb-ai-d')).toHaveTextContent(
      'Saved at step 2 of 4 · 2 Oct 2026 · only you can see it',
    );
    expect(figureRows()[0]).toBe('With you | 3 | 1 returned · 2 drafts');
    const newDraft = within(itemRows(region)[0]!).getByRole('link', {
      name: 'Finish the draft of Conduction Through a Composite Wall',
    });
    expect(newDraft).toHaveAttribute('href', `/vendor/experiments/${id}/edit?step=formats`);
    // The lead keeps the one gold action.
    for (const row of itemRows(region)) {
      expect(within(row).getByRole('link').className).toBe('rb-btn');
    }
    expectNoReferences();
  });

  it('one world: the Academic Reviewer’s return leads; the older return follows with Revise', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    const id = await saveCompositeWall(runtime, { submit: true });
    await menonReturns(runtime, sample, id);
    await waitFor(async () =>
      expect(lead(await attention())?.querySelector('.rb-lead-t')).toHaveTextContent(
        'Conduction Through a Composite Wall',
      ),
    );
    const region = await attention();
    const leading = lead(region)!;
    expect(leading.querySelector('.vr-lead-meta')).toHaveTextContent(
      'Academic Reviewer · Prof. A. Menon · 2 Oct 2026',
    );
    expect(leading.querySelector('blockquote')).toHaveTextContent(
      'Please clarify the VR device requirements.',
    );
    expect(texts(leading.querySelectorAll('.vr-ref'))).toEqual(['VR · Device need']);
    expect(region.querySelector('.rb-att-head .rb-note')).toHaveTextContent('3 items');
    const [older, draft] = itemRows(region);
    expect(older!.querySelector('.rb-ai-t')).toHaveTextContent('Returned to youForced Convection');
    expect(older!.querySelector('.rb-ai-d')).toHaveTextContent(
      'By the Academic Reviewer on 24 Aug',
    );
    const revise = within(older!).getByRole('link', {
      name: 'Revise Forced Convection, returned by the Academic Reviewer',
    });
    expect(revise.className).toBe('rb-btn');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    expect(draft!.querySelector('.rb-ai-t')).toHaveTextContent('Draft to finishPin Fin Efficiency');
    expect(figureRows()[0]).toBe('With you | 3 | 2 returned · 1 draft');
    expect(activityRows()[0]).toMatch(
      /^Today \d\d:\d\d · Returned with a reason · Conduction Through a Composite Wall$/,
    );
    expectNoReferences();
  });

  it('Save changes on the returned item: the lead says the changes are saved, not resubmitted', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    const region = await attention();
    expect(lead(region)!.querySelector('.vr-lead-pend')).toBeNull();
    await anilSavesChanges(runtime);
    await waitFor(() =>
      expect(lead(region)!.querySelector('.vr-lead-pend')).toHaveTextContent(
        'Your changes are saved, not resubmitted. Only you can see them.',
      ),
    );
    // Nothing new in the history: Save changes is not an event.
    expect(activityRows()[0]).toBe('25 Aug 10:00 · Draft saved · Pin Fin Efficiency');
    expectNoReferences();
  });

  it('calm (Ritu Sharma): nothing waiting, the calm block, no gold action', async () => {
    const { runtime } = await tabPlatform(RITU, 'spine-start');
    showOverview(runtime);
    const region = await attention();
    expect(h1()).toHaveAccessibleName(/^Overview,\s?Meridian Virtual Labs$/);
    expect(region.querySelector('.rb-att-head .rb-note')).toHaveTextContent('Nothing waiting');
    const calm = region.querySelector('.rb-calm')!;
    expect(calm.querySelector('.rb-calm-t')).toHaveTextContent('Nothing needs you right now');
    expect(calm.querySelector('.rb-calm-d')).toHaveTextContent(
      'Experiments with the Academic Reviewer or the Content Manager need nothing from you. You’ll see them here if they come back.',
    );
    expect(lead(region)).toBeNull();
    expect(itemRows(region)).toHaveLength(0);
    expect(figureRows()[0]).toBe('With you | 0 | Nothing waiting');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(0);
    expect(
      within(h1().closest('section')!).getByRole('link', { name: 'Create experiment' }),
    ).toBeVisible();
    expect(activity()).toBeVisible();
    expectNoReferences();
  });

  it('first visit: no counts, no panels; the gold Create experiment is in the first-visit surface', async () => {
    const { runtime } = await newVendor();
    showOverview(runtime);
    const first = await screen.findByRole('heading', {
      level: 2,
      name: 'Create your first experiment',
    });
    const surface = screen.getByRole('region', { name: 'Create your first experiment' });
    expect(surface).toContainElement(first);
    expect(surface).toHaveTextContent(
      'Describe it, add its formats and delivery, then submit it for academic review. You can save a draft at every step.',
    );
    const create = within(surface).getByRole('link', { name: 'Create experiment' });
    expect(create.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    expect(main().querySelectorAll('a')).toHaveLength(1);
    expect(figures()).toBeNull();
    expect(screen.queryByRole('region', { name: 'Needs your action' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Recent activity' })).toBeNull();
    expect(h1()).toHaveAccessibleName(/^Overview,\s?Northline Simulation Studio$/);
    expectNoReferences();
  });

  it('no course assigned (PD-3): the calm state instead of Create experiment — nothing to click', async () => {
    const { runtime } = await newVendor(false);
    showOverview(runtime);
    const calm = await screen.findByRole('heading', {
      level: 2,
      name: 'No course is assigned to you yet',
    });
    expect(
      screen.getByRole('region', { name: 'No course is assigned to you yet' }),
    ).toContainElement(calm);
    expect(main()).toHaveTextContent(
      'The platform team assigns the courses you can submit experiments to. Once a course is assigned, you can create experiments here.',
    );
    expect(screen.queryByRole('link', { name: 'Create experiment' })).toBeNull();
    expect(main().querySelectorAll('a')).toHaveLength(0);
    expectNoReferences();
  });

  it('undrawn: failed with Try again under the band, then the overview; focus goes to the H1', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.getVendorOverview');
    showOverview(runtime);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(STATE_COPY_VENDOR_HOME['VE-01.failed'].words);
    expect(alert).toHaveTextContent('Nothing has changed. Try again.');
    expect(h1()).toHaveAccessibleName(/Northline Simulation Studio$/);
    expectNoReferences();
    const retry = within(alert).getByRole('button', { name: 'Try again' });
    retry.focus();
    await userEvent.click(retry);
    await attention();
    await waitFor(() => expect(document.activeElement).toBe(h1()));
    expectNoReferences();
  });

  it('undrawn: loading is announced politely under the studio band', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    const status = await screen.findByText(STATE_COPY_VENDOR_HOME['VE-01.loading'].words);
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('[aria-busy="true"]')).not.toBeNull();
    expect(h1()).toBeVisible();
    expectNoReferences();
    await attention();
  });
});

// ---- VE-02 My experiments ---------------------------------------------------------------------

describe('VE-02 My experiments — Anil Shetty (the export’s list)', () => {
  it('the head, the tabs, the tool row, the count and every row, newest change first', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const id = await saveCompositeWall(runtime, { submit: true });
    showList(runtime);
    const section = await list();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1()).toHaveTextContent('My experiments');
    expect(h1()).toHaveAttribute('tabindex', '-1');
    expect(main()).toHaveTextContent('Every experiment you created, in any status');
    const create = within(main()).getAllByRole('link', { name: 'Create experiment' });
    expect(create).toHaveLength(1);
    expect(create[0]!.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(create[0]).toHaveAttribute('href', '/vendor/experiments/new');
    // The tabs: All and each status he has (no resubmission, so no Submitted), each counted.
    expect(tabNames()).toEqual([
      'All, 6 experiments',
      'Returned, 1 experiment',
      'Draft, 2 experiments',
      'With Academic Reviewer, 1 experiment',
      'With Content Manager, 1 experiment',
      'Published, 1 experiment',
    ]);
    expect(pressedTab()).toBe('All, 6 experiments');
    // The tool row: search, the 7-day filter, the count; no Clear filters while nothing applies.
    expect(searchBox()).toHaveAttribute('placeholder', 'Search by name or course');
    expect(recentBox()).not.toBeChecked();
    expect(count()).toHaveTextContent('6 experiments');
    expect(within(tools()).queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(
      within(tools()).getByRole('button', { name: 'Sort: newest first. Change order' }),
    ).toBeVisible();
    // The table.
    expect(table()).toHaveAccessibleName('Your experiments, last change, newest first');
    expect(texts(table().querySelectorAll('thead th'))).toEqual([
      'Experiment',
      'Formats',
      'Status',
      'Last change',
      'Action',
    ]);
    expect(rowIds()).toEqual([id, 'SUB-0079', 'SUB-0081', 'SUB-0074', 'SUB-0083', 'SUB-0052']);

    const expectRow = (
      name: string,
      expected: {
        id: string;
        meta: string;
        formats: string[];
        pill: string;
        tone: string;
        line: string;
        date: string;
        action?: { name: string; label: string; href: string };
      },
    ) => {
      const row = rowOf(name);
      const rowId = expected.id;
      expect(
        within(row).getByRole('link', {
          name: `${name}, ${expected.pill}, last change ${expected.date}. Open the experiment record`,
        }),
      ).toHaveAttribute('href', `/vendor/experiments/${rowId}`);
      // The line under the name is the course code alone (state-copy `VE-02.course-code`).
      expect(row.querySelector('.vr-meta')!.innerHTML).toBe(expected.meta);
      expect(texts(row.querySelectorAll('.vr-c-fmt .xr-fmt'))).toEqual(expected.formats);
      const pill = row.querySelector('.vr-c-st .xr-st')!;
      expect(pill).toHaveTextContent(expected.pill);
      expect(pill.className).toBe(expected.tone);
      expect(row.querySelector('.vr-stsub')).toHaveTextContent(expected.line);
      expect(row.querySelector('.vr-c-date .vr-dated')).toHaveTextContent(expected.date);
      if (expected.action) {
        const action = within(row).getByRole('link', { name: expected.action.name });
        expect(action).toHaveTextContent(expected.action.label);
        expect(action).toHaveAttribute('href', expected.action.href);
        expect(action.className).toBe('rb-btn vr-rowbtn');
      } else {
        expect(row.querySelector('.vr-c-act a')).toBeNull();
        expect(row.querySelector('.vr-c-act svg')).toHaveAttribute('class', 'vr-chev');
      }
    };
    expectRow('Conduction Through a Composite Wall', {
      id: id!,
      meta: 'ME ZG523',
      formats: ['WEB', 'VR'],
      pill: 'With Academic Reviewer',
      tone: 'xr-st xr-st--info',
      line: 'Submitted today',
      date: '2 Oct 2026',
    });
    expectRow('Forced Convection', {
      id: 'SUB-0081',
      meta: 'ME ZG523',
      formats: ['WEB', 'AR'],
      pill: 'Returned',
      tone: 'xr-st xr-st--err',
      line: 'By the Academic Reviewer on 24 Aug',
      date: '24 Aug 2026',
      action: {
        name: 'Revise Forced Convection',
        label: 'Revise',
        href: '/vendor/experiments/SUB-0081/revise',
      },
    });
    expectRow('Pin Fin Efficiency', {
      id: 'SUB-0079',
      meta: 'ME ZG523',
      formats: ['WEB'],
      pill: 'Draft',
      tone: 'xr-st',
      line: 'Saved at step 1 of 4 · only you can see it',
      date: '25 Aug 2026',
      action: {
        name: 'Edit the draft of Pin Fin Efficiency',
        label: 'Edit draft',
        href: '/vendor/experiments/SUB-0079/edit',
      },
    });
    expectRow('Transient Cooling', {
      id: 'SUB-0074',
      meta: 'ME ZG523',
      formats: ['WEB'],
      pill: 'With Content Manager',
      tone: 'xr-st xr-st--info',
      line: 'Approved on 14 Aug',
      date: '14 Aug 2026',
    });
    expectRow('Fin-Tube Bundle', {
      id: 'SUB-0052',
      meta: 'ME ZG523',
      formats: ['WEB', 'VR'],
      pill: 'Published',
      tone: 'xr-st xr-st--ok',
      line: 'Live in the catalogue since 30 Jul',
      date: '30 Jul 2026',
    });
    // SUB-0083: MEL ZG512 withdrawn from him — read-only, the record only (OD-B5-01).
    expectRow('Surface Roughness in Turning', {
      id: 'SUB-0083',
      meta: 'MEL ZG512',
      formats: ['WEB'],
      pill: 'Draft · read-only',
      tone: 'xr-st xr-st--paused',
      line: 'Course withdrawn · read-only',
      date: '14 Aug 2026',
    });
    expect(section.querySelectorAll('.vr-pending')).toHaveLength(0);
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expectNoReferences();
    expect(
      screen
        .getByRole('navigation', { name: 'Vendor navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/vendor/experiments');
  });

  it('Returned from the address; the tabs mirror into it; Clear filters returns focus to Search', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const { navigation } = showList(runtime, '?status=returned');
    await list();
    await waitFor(() => expect(count()).toHaveTextContent('1 of 5 experiments'));
    expect(pressedTab()).toBe('Returned, 1 experiment');
    expect(rowNames()).toEqual(['Forced Convection']);
    const clear = within(tools()).getByRole('button', { name: 'Clear filters' });
    expect(clear.className).toBe('rk-clear');

    // Draft takes the read-only draft too.
    await userEvent.click(within(tabs()).getByRole('button', { name: 'Draft, 2 experiments' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/vendor/experiments?status=draft');
    await waitFor(() =>
      expect(rowNames()).toEqual(['Pin Fin Efficiency', 'Surface Roughness in Turning']),
    );
    expect(count()).toHaveTextContent('2 of 5 experiments');
    expect(pressedTab()).toBe('Draft, 2 experiments');
    expectNoReferences();

    await userEvent.click(within(tools()).getByRole('button', { name: 'Clear filters' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/vendor/experiments');
    await waitFor(() => expect(count()).toHaveTextContent('5 experiments'));
    expect(pressedTab()).toBe('All, 5 experiments');
    expect(document.activeElement).toBe(searchBox());
    expectNoReferences();
  });

  it('the search matches the name, the SUB id and the course code; the tab counts follow it', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    await list();
    // The service's search still matches a reference typed into it; the row does not show it.
    await userEvent.type(searchBox(), 'SUB-0081');
    await waitFor(() => expect(rowNames()).toEqual(['Forced Convection']));
    expect(rowIds()).toEqual(['SUB-0081']);
    expectNoReferences();
    expect(count()).toHaveTextContent('1 of 5 experiments');
    await waitFor(() => expect(tabNames()[0]).toBe('All, 1 experiment'));
    expect(tabNames()[1]).toBe('Returned, 1 experiment');
    expect(tabNames()[2]).toBe('Draft, 0 experiments');
    await userEvent.clear(searchBox());
    await userEvent.type(searchBox(), 'MEL ZG512');
    await waitFor(() => expect(rowNames()).toEqual(['Surface Roughness in Turning']));
    await userEvent.clear(searchBox());
    await userEvent.type(searchBox(), 'fin');
    await waitFor(() => expect(rowNames()).toEqual(['Pin Fin Efficiency', 'Fin-Tube Bundle']));
    expectNoReferences();
  });

  it('no match: “No experiments match”, its Clear filters brings every row back', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    const section = await list();
    await userEvent.type(searchBox(), 'Radiation');
    const none = await within(section).findByText('No experiments match');
    const state = none.closest('.rk-state') as HTMLElement;
    expect(state).toHaveTextContent('Try a different name or course, or clear the filters.');
    expectNoReferences();
    expect(count()).toHaveTextContent('0 of 5 experiments');
    expect(screen.queryByRole('table')).toBeNull();
    expect(within(section).getAllByRole('button', { name: 'Clear filters' })).toHaveLength(2);
    expect(tabNames()[0]).toBe('All, 0 experiments');
    await userEvent.click(within(state).getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(bodyRows()).toHaveLength(5));
    expect(searchBox()).toHaveValue('');
    expect(document.activeElement).toBe(searchBox());
  });

  it('“Changed in the last 7 days” on its own clock (27 Aug 2026), mirrored into the address', async () => {
    const world = await fixtureWorld('spine-start');
    const { runtime } = await worldPlatform(ANIL, { ...world, anchor: BOARD_NOW as never });
    const id = await saveCompositeWall(runtime, { submit: true });
    const { navigation } = showList(runtime);
    await list();
    await waitFor(() => expect(count()).toHaveTextContent('6 experiments'));
    await userEvent.click(recentBox());
    expect(navigation.replace).toHaveBeenLastCalledWith('/vendor/experiments?changed=last-7-days');
    expect(recentBox()).toBeChecked();
    expect(count()).toHaveTextContent('3 of 6 experiments');
    expect([...rowIds()].sort()).toEqual([id, 'SUB-0079', 'SUB-0081'].sort());
    expect(id).toBe('SUB-0077');
    expect(tabNames()).toEqual([
      'All, 3 experiments',
      'Returned, 1 experiment',
      'Draft, 1 experiment',
      'With Academic Reviewer, 1 experiment',
      'With Content Manager, 0 experiments',
      'Published, 0 experiments',
    ]);
    // With a tab: the returned one only.
    await userEvent.click(within(tabs()).getByRole('button', { name: 'Returned, 1 experiment' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/vendor/experiments?status=returned&changed=last-7-days',
    );
    await waitFor(() => expect(count()).toHaveTextContent('1 of 6 experiments'));
    expectNoReferences();
    await userEvent.click(within(tabs()).getByRole('button', { name: 'Published, 0 experiments' }));
    expect(await screen.findByText('No experiments match')).toBeVisible();
    expectNoReferences();
  });

  it('the Overview’s “Changed in the last 7 days” opens the list with the filter ticked', async () => {
    const world = await fixtureWorld('spine-start');
    const { runtime } = await worldPlatform(ANIL, { ...world, anchor: BOARD_NOW as never });
    showList(runtime, '?changed=last-7-days');
    await list();
    expect(recentBox()).toBeChecked();
    await waitFor(() => expect(count()).toHaveTextContent('2 of 5 experiments'));
    expect(rowIds()).toEqual(['SUB-0079', 'SUB-0081']);
    expect(within(tools()).getByRole('button', { name: 'Clear filters' })).toBeVisible();
    expectNoReferences();
  });

  it('the visible sort: Last change turns the order to oldest first and back', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    await list();
    const head = table().querySelector('th[aria-sort]')!;
    expect(head).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(
      within(head as HTMLElement).getByRole('button', {
        name: 'Last change, newest first. Change order',
      }),
    );
    expect(head).toHaveAttribute('aria-sort', 'ascending');
    expect(table()).toHaveAccessibleName('Your experiments, last change, oldest first');
    expect(rowIds()).toEqual(['SUB-0052', 'SUB-0083', 'SUB-0074', 'SUB-0081', 'SUB-0079']);
    await userEvent.click(
      within(tools()).getByRole('button', { name: 'Sort: oldest first. Change order' }),
    );
    expect(rowIds()).toEqual(['SUB-0079', 'SUB-0081', 'SUB-0074', 'SUB-0083', 'SUB-0052']);
    expectNoReferences();
  });

  it('one world: the Content Manager sends SUB-0074 back — Returned, its line, Revise, on top', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    await list();
    expect(rowOf('Transient Cooling').querySelector('.xr-st')).toHaveTextContent(
      'With Content Manager',
    );
    const kavya = asPersonId(sample, KAVYA);
    await act(async () => {
      const decision = ok(
        await kavya.production.getPublicationDecision('SUB-0074' as SubmissionId),
      );
      const sent = await kavya.production.sendBack({
        id: 'SUB-0074' as SubmissionId,
        to: 'vendor',
        reason: 'The summary repeats the description. Please write one sentence.',
        references: [{ step: 'course-and-description', format: null, field: 'summary' }],
        expectedRev: decision.submission.rev,
      });
      if (!sent.ok) throw new Error(`send back ${JSON.stringify(sent.error)}`);
      await runtime.invalidate(sent.changed);
    });
    await waitFor(() =>
      expect(rowOf('Transient Cooling').querySelector('.xr-st')).toHaveTextContent('Returned'),
    );
    const row = rowOf('Transient Cooling');
    expect(row.querySelector('.vr-stsub')).toHaveTextContent('By the Content Manager today');
    expect(within(row).getByRole('link', { name: 'Revise Transient Cooling' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0074/revise',
    );
    expect(bodyRows()[0]).toBe(row);
    expect(idOfRow(row)).toBe('SUB-0074');
    expect(tabNames()[1]).toBe('Returned, 2 experiments');
    expectNoReferences();
  });

  it('Save changes on a returned experiment: its row says “Changes saved, not resubmitted”', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    await list();
    expect(rowOf('Forced Convection').querySelector('.vr-pending')).toBeNull();
    await anilSavesChanges(runtime);
    await waitFor(() =>
      expect(rowOf('Forced Convection').querySelector('.vr-pending')).toHaveTextContent(
        'Changes saved, not resubmitted',
      ),
    );
    expect(rowOf('Forced Convection').querySelector('.xr-st')).toHaveTextContent('Returned');
    expectNoReferences();
  });

  it('no experiments yet: the empty state with the gold Create experiment, no tabs, no tools', async () => {
    const { runtime } = await newVendor();
    showList(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'You haven’t created an experiment yet',
    });
    const section = screen.getByRole('region', { name: 'Your experiments' });
    expect(section).toContainElement(title);
    expect(section).toHaveTextContent(
      'Create one, describe it, add its formats and delivery, and submit it for academic review.',
    );
    const create = within(main()).getAllByRole('link', { name: 'Create experiment' });
    expect(create).toHaveLength(1);
    expect(section).toContainElement(create[0]!);
    expect(create[0]!.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Show experiments by status' })).toBeNull();
    expectNoReferences();
  });

  it('no course assigned (PD-3): the calm empty state, no Create experiment anywhere', async () => {
    const { runtime } = await newVendor(false);
    showList(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'No course is assigned to you yet',
    });
    expect(screen.getByRole('region', { name: 'Your experiments' })).toContainElement(title);
    expect(screen.queryByRole('link', { name: 'Create experiment' })).toBeNull();
    expectNoReferences();
  });

  it('could not load: Try again reads again; focus goes to the H1', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.listMyExperiments');
    showList(runtime);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(STATE_COPY_VENDOR_HOME['VE-02.failed'].words);
    expect(alert).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.getByRole('region', { name: 'Your experiments' })).toContainElement(alert);
    expect(tools()).toBeVisible();
    expectNoReferences();
    const retry = within(alert).getByRole('button', { name: 'Try again' });
    retry.focus();
    await userEvent.click(retry);
    await waitFor(() => expect(count()).toHaveTextContent('5 experiments'));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
    expectNoReferences();
  });

  it('loading is announced politely over skeleton rows', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    const status = await screen.findByText(STATE_COPY_VENDOR_HOME['VE-02.loading'].words);
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('[aria-busy="true"]')).not.toBeNull();
    expect(status.closest('section')).toHaveAccessibleName('Your experiments');
    expectNoReferences();
    await list();
    await waitFor(() => expect(count()).toHaveTextContent('5 experiments'));
  });
});

describe('VE-02 helpers', () => {
  it('statusFilterOf reads the six service values; anything else is All', () => {
    expect(statusFilterOf('?status=returned')).toBe('returned');
    expect(statusFilterOf('?status=with-academic-reviewer&changed=last-7-days')).toBe(
      'with-academic-reviewer',
    );
    expect(statusFilterOf('?status=with_rv')).toBeNull();
    expect(statusFilterOf('')).toBeNull();
  });

  it('the 7-day filter in the address', () => {
    expect(recentFilterOf('?changed=last-7-days')).toBe(true);
    expect(recentFilterOf('?status=draft&changed=last-7-days')).toBe(true);
    expect(recentFilterOf('?changed=7')).toBe(false);
    expect(myExperimentsFilterAddress(null, false)).toBe('/vendor/experiments');
    expect(myExperimentsFilterAddress(null, true)).toBe('/vendor/experiments?changed=last-7-days');
    expect(myExperimentsFilterAddress('returned', true)).toBe(
      '/vendor/experiments?status=returned&changed=last-7-days',
    );
  });

  it('changedRecently: within seven days of the sample clock, a later change counts', () => {
    expect(changedRecently('2026-08-20T04:30:00.000Z', BOARD_NOW)).toBe(true);
    expect(changedRecently('2026-08-20T04:29:59.000Z', BOARD_NOW)).toBe(false);
    expect(changedRecently('2026-08-15T04:30:00.000Z', BOARD_NOW)).toBe(false);
    expect(changedRecently('2026-08-28T04:30:00.000Z', BOARD_NOW)).toBe(true);
  });

  it('vendorStatusOf: a resubmission reads “Submitted” until it moves on (M-3); a re-check is with the reviewer', () => {
    const of = (status: unknown, revision: number) =>
      vendorStatusOf({ status, revision } as MyExperimentRow['submission']);
    expect(of({ state: 'resubmitted', since: BOARD_NOW }, 2)).toBe('submitted');
    expect(
      of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'resubmission' }, 2),
    ).toBe('submitted');
    expect(of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'recheck' }, 1)).toBe(
      'with-academic-reviewer',
    );
    expect(
      of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'first-review' }, 1),
    ).toBe('with-academic-reviewer');
  });

  it('vendorPill: the words and shape every Vendor screen draws (HANDOFF §2)', () => {
    const of = (status: unknown, revision = 1, readOnlyDraft = false) =>
      vendorPill({ status, revision } as MyExperimentRow['submission'], readOnlyDraft);
    expect(of({ state: 'draft' })).toEqual({ tone: 'neutral', words: 'Draft' });
    expect(of({ state: 'draft' }, 1, true)).toEqual({ tone: 'paused', words: 'Draft · read-only' });
    expect(of({ state: 'returned', since: BOARD_NOW, by: 'academic-reviewer' }, 1, true)).toEqual({
      tone: 'err',
      words: 'Returned',
    });
    // A Super Admin override's Vendor words are not drawn: “Returned”.
    expect(of({ state: 'returned', since: BOARD_NOW, by: 'super-admin-override' }).words).toBe(
      'Returned',
    );
    expect(of({ state: 'resubmitted', since: BOARD_NOW }, 2)).toEqual({
      tone: 'info',
      words: 'Submitted',
    });
    expect(of({ state: 'published', at: BOARD_NOW }).tone).toBe('ok');
  });

  it('hasSavedChanges / savedChangesAt: a returned record written after its return, nothing else', () => {
    const facts = (status: unknown, updatedAt: string) =>
      ({ status, updatedAt }) as MyExperimentRow['submission'];
    const of = (status: unknown, updatedAt: string) => hasSavedChanges(facts(status, updatedAt));
    const returned = { state: 'returned', since: BOARD_NOW, by: 'academic-reviewer' };
    expect(of(returned, BOARD_NOW)).toBe(false);
    expect(of(returned, '2026-08-27T05:00:00.000Z')).toBe(true);
    expect(of({ state: 'draft' }, '2026-08-27T05:00:00.000Z')).toBe(false);
    expect(of({ state: 'resubmitted', since: BOARD_NOW }, '2026-08-27T05:00:00.000Z')).toBe(false);
    // The instant they were saved — the record's and the editor's outline line read it.
    expect(savedChangesAt(facts(returned, '2026-08-27T05:00:00.000Z'))).toBe(
      '2026-08-27T05:00:00.000Z',
    );
    expect(savedChangesAt(facts(returned, BOARD_NOW))).toBeNull();
  });
});
