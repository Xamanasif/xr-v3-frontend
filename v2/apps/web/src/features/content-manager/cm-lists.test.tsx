/**
 * CM-01 Overview (board B6-05 f0 … f2), CM-02 Ready to publish (B6-06 f0, f2, f3; B6-12 f2), CM-04
 * Content library (B6-06 f1, f4) and CM-09 Course codes (B6-10 f0 … f2; B6-11 f12) on the real
 * composition root and the sample world, as Kavya Nair. At spine-start the world holds B6-05’s
 * and B6-06’s records (SUB-0074 and SUB-0070 approved, SUB-0071 back for a re-check, UPD-0006
 * returned, UPD-0004 on hold, twelve published experiments); Anil Shetty creates and submits
 * “Conduction Through a Composite Wall” and Prof. A. Menon approves it (Flow E’s E1 and E3, through
 * the ports) for B6-06 f0. The one world moves the pages: publishing empties Ready to publish
 * (f3); a code saved on CM-09 is the platform’s code. The drawn validation (a duplicate code); the
 * undrawn loading, failed, stale and policy-open states.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { IsoInstant, SubmissionId } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
import { CmOverview } from './cm-01-overview/overview';
import { openChecks, ReadyToPublish } from './cm-02-ready/ready-to-publish';
import { ContentLibrary, submissionWhere } from './cm-04-library/content-library';
import { clearCodeEdits } from './cm-09-course-codes/code-edits';
import { CourseCodes } from './cm-09-course-codes/course-codes';

afterEach(() => {
  forgetLastAddress();
  clearCodeEdits();
  vi.restoreAllMocks();
});

const KAVYA = 'per-kavya-nair';
const ANIL = 'per-anil-shetty';
const MENON = 'per-a-menon';

/** Flow E’s experiment as the walk types it (E1), and the reviewer’s outcomes (E3). */
const COMPOSITE_WALL = {
  courseId: 'thermodynamics-heat-transfer',
  name: 'Conduction Through a Composite Wall',
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
      browserAndComputer: 'A current Chrome, Edge, Firefox or Safari on a laptop or desktop',
      notes: null,
    },
    vr: {
      format: 'vr',
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
} as const;
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
];
/** B6-06 f0’s approval: 27 Aug 2026, 15:20 in Indian time. */
const E3_APPROVED = '2026-08-27T09:50:00.000Z';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** E1 and E3 through the ports: SUB-0077 is approved and with the Content Manager. */
async function approveCompositeWall(sample: Sample): Promise<string> {
  const vendor = asPersonId(sample, ANIL);
  const draft = ok(
    await vendor.production.saveDraft({
      id: null,
      content: COMPOSITE_WALL as never,
      step: 'course',
      expectedRev: null,
    }),
  );
  const submitted = ok(
    await vendor.production.submitForReview({
      id: draft.id,
      content: COMPOSITE_WALL as never,
      expectedRev: draft.rev,
    }),
  );
  standinsOf(sample).clock.setSampleNow(E3_APPROVED as IsoInstant);
  const reviewer = asPersonId(sample, MENON);
  const view = ok(await reviewer.production.getSubmissionForReview(submitted.id));
  ok(
    await reviewer.production.approveSubmission({
      id: view.submission.id,
      outcomes: OUTCOMES,
      expectedRev: view.submission.rev,
    }),
  );
  return submitted.id;
}

/** She publishes a ready submission through the port, as CM-03 would. */
async function publishThrough(runtime: PlatformRuntime, sample: Sample, id: string) {
  const cm = asPersonId(sample, KAVYA);
  await act(async () => {
    const decision = ok(await cm.production.getPublicationDecision(id as SubmissionId));
    const published = await cm.production.publish({
      id: decision.submission.id,
      expectedRev: decision.submission.rev,
    });
    ok(published);
    if (published.ok) await runtime.invalidate(published.changed);
  });
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="content-manager">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

/** Without the shell, so the page’s own loading state is the first thing drawn. */
function bare(runtime: PlatformRuntime, ui: ReactNode, pathname: string) {
  return renderInTab(ui, { runtime, navigation: testNavigation(pathname) });
}

function show(runtime: PlatformRuntime, ui: ReactNode, pathname: string, search = '') {
  const navigation = testNavigation(pathname, search);
  const view = renderInTab(inShell(ui), { runtime, navigation });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const sidebarCurrent = () =>
  screen
    .getByRole('navigation', { name: 'Content Manager navigation' })
    .querySelector('[aria-current="page"]')!;

async function tableRows(): Promise<string[][]> {
  const found = await screen.findByRole('table', {}, { timeout: 5000 });
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

function section(name: string): HTMLElement {
  return screen.getByRole('region', { name });
}

function rowTexts(region: HTMLElement): string[] {
  return [...region.querySelectorAll('li.xr-row')].map((row) => text(row));
}

// ---- CM-01 Overview ---------------------------------------------------------------------------

describe('CM-01 Overview at spine-start (B6-05 f0, f2)', () => {
  it('the overline, the status line, “Needs your decision” and “With others”, with their actions', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CmOverview />, '/content-manager');
    await h1('Overview');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Kavya Nair');
    const line = main().querySelector('p.xv-statusline[role="status"]');
    // UPD-0005 is Flow F’s, not spine-start’s: two with others here (B6-05 f0 draws three).
    await waitFor(() =>
      expect([...line!.querySelectorAll('span')].map(text)).toEqual([
        '2 ready to publish',
        '1 correction needs you',
        '2 with others',
      ]),
    );
    expect(line!.querySelector('strong')).toHaveTextContent('2');
    const library = within(main()).getByRole('link', { name: 'Content library' });
    expect(library).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(library).toHaveAttribute('href', '/content-manager/library');
    expect(library.closest('.xr-phead-actions')).not.toBeNull();

    const needs = section('Needs your decision');
    expect(rowTexts(needs)).toEqual([
      'Ready to publish: Transient CoolingSUB-0074 · ME ZG523 · approved 14 Aug 2026 · oldest of 2Open the next ready item',
      'Ready to publish: Packed Bed Pressure DropSUB-0070 · CHE ZG513 · approved 21 Aug 2026Open decision',
      'Update returned: Induction Motor Loading 1.1UPD-0006 · returned by the Academic Reviewer on 26 Aug 2026 · “The proposed description says slip falls as the load rises…”',
    ]);
    const next = within(needs).getByRole('link', { name: 'Open the next ready item' });
    expect(next).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(next).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    const other = within(needs).getByRole('link', {
      name: 'Open decision for Packed Bed Pressure Drop',
    });
    expect(other).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(other).toHaveAttribute('href', '/content-manager/decisions/SUB-0070');
    // The returned correction keeps its words; “Open update” waits for CM-08 (Phase 6).
    expect(within(needs).queryByRole('link', { name: /update/i })).toBeNull();
    const icons = [...needs.querySelectorAll('.xr-row-icon')].map((icon) => icon.className);
    expect(icons).toEqual([
      'xr-row-icon xr-row-icon--info',
      'xr-row-icon xr-row-icon--info',
      'xr-row-icon xr-row-icon--err',
    ]);

    const others = section('With others');
    expect(others.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'For information — nothing to do',
    );
    expect(rowTexts(others)).toEqual([
      'Venturi Meter Calibration — with the Academic Reviewer for a re-checkSUB-0071 · you sent it back on 25 Aug 2026Open',
      'Boiler Drum Level 2.1 — on holdUPD-0004 · the Super Admin put it on hold on 20 Aug 2026 · version 2.0 stays live',
    ]);
    const open = within(others).getByRole('link', { name: 'Open Venturi Meter Calibration' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--text', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', '/content-manager/decisions/SUB-0071');
    expect(within(others).getAllByRole('link')).toHaveLength(1);

    // The shell: Overview current, Ready to publish counted from the same records.
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager');
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Overview');
  });

  it('after SUB-0077 is approved: three ready, the oldest still first', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await approveCompositeWall(sample);
    show(runtime, <CmOverview />, '/content-manager');
    await h1('Overview');
    const needs = await screen.findByRole('region', { name: 'Needs your decision' });
    await waitFor(() => expect(rowTexts(needs)[0]).toContain('approved 14 Aug 2026 · oldest of 3'));
    expect(rowTexts(needs)[2]).toBe(
      'Ready to publish: Conduction Through a Composite WallSUB-0077 · ME ZG523 · approved 27 Aug 2026Open decision',
    );
    expect(text(main().querySelector('.xv-statusline'))).toContain('3 ready to publish');
  });

  it('nothing waiting (f1): the calm state and the Content library one click away', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    vi.spyOn(runtime.ports.production, 'getContentManagerOverview').mockResolvedValue({
      ok: true,
      value: { attention: [], withOthers: [] },
      changed: [],
    });
    show(runtime, <CmOverview />, '/content-manager');
    const calm = await screen.findByRole('heading', {
      level: 2,
      name: 'Nothing is waiting for your publication decision',
    });
    expect(calm).toHaveClass('xr-h3');
    const empty = calm.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(empty).toHaveTextContent(
      'Approved experiments and corrections that need you appear here.',
    );
    const open = within(empty as HTMLElement).getByRole('link', {
      name: 'Open the Content library',
    });
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(open).toHaveAttribute('href', '/content-manager/library');
    expect([...main().querySelectorAll('.xv-statusline span')].map(text)).toEqual([
      '0 ready to publish',
      '0 corrections need you',
      '0 with others',
    ]);
    expect(screen.queryByRole('region', { name: 'With others' })).toBeNull();
  });

  it('nothing needs her but others have work: the calm state, then “With others”', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    vi.spyOn(runtime.ports.production, 'getContentManagerOverview').mockResolvedValue({
      ok: true,
      value: {
        attention: [],
        withOthers: [
          {
            kind: 'update-awaiting-release',
            updateId: 'UPD-0005' as never,
            name: 'Distillation Column',
            versionLabel: '1.3',
            approvedAt: '2026-08-26T04:30:00.000Z' as IsoInstant,
          },
          {
            kind: 'update-in-review',
            updateId: 'UPD-0007' as never,
            name: 'Transformer Tests',
            versionLabel: '1.1',
            sentAt: '2026-08-25T04:30:00.000Z' as IsoInstant,
          },
        ],
      },
      changed: [],
    });
    show(runtime, <CmOverview />, '/content-manager');
    await screen.findByText('Nothing is waiting for your publication decision');
    expect(rowTexts(section('With others'))).toEqual([
      'Distillation Column 1.3 — awaiting release decisionUPD-0005 · the Academic Reviewer approved it on 26 Aug 2026',
      'Transformer Tests 1.1 — in academic reviewUPD-0007 · sent on 25 Aug 2026',
    ]);
    expect(within(section('With others')).queryByRole('link')).toBeNull();
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.getContentManagerOverview');
    bare(runtime, <CmOverview />, '/content-manager');
    expect(document.querySelector('[aria-busy="true"] .xr-sr[role="status"]')).toHaveTextContent(
      'Loading what needs your decision',
    );
    expect(await screen.findByText('We couldn’t load your overview')).toBeVisible();
    expect(document.body).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Needs your decision' })).toBeVisible();
  });
});

// ---- CM-02 Ready to publish -------------------------------------------------------------------

describe('CM-02 Ready to publish (B6-06 f0, f2, f3; B6-12 f2)', () => {
  it('spine-start (B6-12 f2): two approved, oldest first, each with its check and Open decision', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await h1('Ready to publish');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Approved experiments waiting for your publication decision',
    );
    const region = section('Approved by the Academic Reviewer');
    await waitFor(() =>
      expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
        '2 experiments approved and waiting · oldest first',
      ),
    );
    const found = await screen.findByRole('table');
    expect([...found.querySelectorAll('th')].map(text)).toEqual([
      'Experiment',
      'Formats',
      'Approved',
      'Publication check',
      'Action',
    ]);
    await waitFor(async () =>
      expect(await tableRows()).toEqual([
        [
          'Transient CoolingSUB-0074 · ME ZG523 · Northline Simulation Studio',
          'WEB',
          '14 Aug 2026Prof. A. Menon',
          'Ready',
          'Open decision',
        ],
        [
          'Packed Bed Pressure DropSUB-0070 · CHE ZG513 · Meridian Virtual Labs',
          'WEBAR',
          '21 Aug 2026Prof. A. Menon',
          'Ready',
          'Open decision',
        ],
      ]),
    );
    const first = found.querySelector('tbody tr')!;
    expect(first.querySelector('td.is-primary .xr-id')).toHaveTextContent('SUB-0074');
    expect(first.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expect(first.querySelectorAll('.xv-chips .xr-fmt.xr-fmt--compact')).toHaveLength(1);
    expect(
      [...first.querySelectorAll('td[data-label]')].map((cell) => cell.getAttribute('data-label')),
    ).toEqual(['Formats', 'Approved', 'Publication check']);
    const open = within(first as HTMLElement).getByRole('link', {
      name: 'Open decision for Transient Cooling',
    });
    expect(open).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/ready');
    await waitFor(() => expect(sidebarCurrent()).toHaveTextContent('2'));
  });

  it('f0: once the Academic Reviewer approves SUB-0077 it is listed third, WEB and VR', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const id = await approveCompositeWall(sample);
    expect(id).toBe('SUB-0077');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(async () => expect(await tableRows()).toHaveLength(3));
    expect((await tableRows())[2]).toEqual([
      'Conduction Through a Composite WallSUB-0077 · ME ZG523 · Northline Simulation Studio',
      'WEBVR',
      '27 Aug 2026Prof. A. Menon',
      'Ready',
      'Open decision',
    ]);
    expect(
      section('Approved by the Academic Reviewer').querySelector('.xr-section-head .xr-meta'),
    ).toHaveTextContent('3 experiments approved and waiting · oldest first');
  });

  it('f2 (state sample): a check not met reads “1 to resolve: learning outcomes”', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const real = runtime.ports.production.listReadyToPublish.bind(runtime.ports.production);
    vi.spyOn(runtime.ports.production, 'listReadyToPublish').mockImplementation(async () => {
      const answer = await real();
      if (!answer.ok) return answer;
      return {
        ...answer,
        value: answer.value.map((row) =>
          row.submission.id === 'SUB-0070'
            ? {
                ...row,
                check: row.check.map((item) =>
                  item.check === 'learning-outcomes'
                    ? { ...item, ok: false, fixHint: 'send-back-to-reviewer' as const }
                    : item,
                ),
              }
            : row,
        ),
      };
    });
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(async () =>
      expect((await tableRows())[1]![3]).toBe('1 to resolve: learning outcomes'),
    );
    const blocked = screen.getAllByRole('row')[2]!.querySelector('.xr-status');
    expect(blocked).toHaveClass('xr-status--err');
    // Open decision stays: the decision page lists the blockers.
    expect(
      screen.getByRole('link', { name: 'Open decision for Packed Bed Pressure Drop' }),
    ).toBeVisible();
    expect(
      openChecks([
        { check: 'learning-outcomes', ok: false, fixHint: null },
        { check: 'catalogue-details', ok: false, fixHint: null },
      ]),
    ).toEqual(['learning-outcomes', 'catalogue-details']);
  });

  it('f3: once both are published, nothing is ready — with the Content library', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    await publishThrough(runtime, sample, 'SUB-0074');
    await publishThrough(runtime, sample, 'SUB-0070');
    const empty = await screen.findByRole('heading', {
      level: 3,
      name: 'Nothing is ready to publish',
    });
    expect(empty.closest('.xr-section-body')).not.toBeNull();
    expect(main()).toHaveTextContent(
      'Experiments appear here once the Academic Reviewer approves them.',
    );
    expect(screen.getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    expect(
      section('Approved by the Academic Reviewer').querySelector('.xr-section-head .xr-meta'),
    ).toHaveTextContent('0 experiments approved and waiting · oldest first');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.listReadyToPublish');
    bare(runtime, <ReadyToPublish />, '/content-manager/ready');
    expect(document.querySelector('[aria-busy="true"] .xr-sr[role="status"]')).toHaveTextContent(
      'Loading the approved experiments',
    );
    expect(await screen.findByText('We couldn’t load the approved experiments')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
  });
});

// ---- CM-04 Content library ----------------------------------------------------------------------

describe('CM-04 Content library (B6-06 f1, f4)', () => {
  it('Ready (f1): the tabs with their counts, the search, the count and the rows', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ContentLibrary />, '/content-manager/library');
    await h1('Content library');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Ready · in review · with the vendor · published',
    );
    const region = section('Every experiment you look after');
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'Drafts stay with the vendor and are not listed',
    );
    const tabs = within(region).getByRole('tablist', { name: 'Content library' });
    expect(tabs).toHaveClass('xr-tabs', 'xr-tabs--on-white');
    await waitFor(() =>
      expect(within(tabs).getAllByRole('tab').map(text)).toEqual([
        'Ready 2',
        'In review 3',
        'With vendor 1',
        'Published 12',
      ]),
    );
    expect(within(tabs).getByRole('tab', { name: /^Ready/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const search = within(region).getByRole('searchbox', { name: 'Search the library' });
    expect(search).toHaveAttribute('placeholder', 'Name, ID or course');
    await waitFor(() =>
      expect(region.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
        'Ready · 2 of 2',
      ),
    );
    expect(await tableRows()).toEqual([
      ['Transient CoolingSUB-0074 · ME ZG523', 'WEB', 'Approved 14 Aug 2026', 'Open decision'],
      [
        'Packed Bed Pressure DropSUB-0070 · CHE ZG513',
        'WEBAR',
        'Approved 21 Aug 2026',
        'Open decision',
      ],
    ]);
    const open = within(region).getByRole('link', { name: 'Open decision for Transient Cooling' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/library');
  });

  it('the tabs by click and arrow keys: In review, With vendor, Published; the address follows', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const { navigation } = show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    await user.click(screen.getByRole('tab', { name: /^In review/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=in-review');
    await waitFor(async () =>
      expect(await tableRows()).toEqual([
        [
          'Flash DistillationSUB-0086 · CHE ZG513',
          'WEB',
          'New submission · since 24 Aug 2026',
          'Open',
        ],
        [
          'Venturi Meter CalibrationSUB-0071 · CHE ZG513',
          'WEBAR',
          'Re-check you asked for · since 25 Aug 2026',
          'Open',
        ],
        [
          'DC Motor Speed ControlSUB-0085 · EEE ZC341',
          'WEB',
          'New submission · since 2 Oct 2026',
          'Open',
        ],
      ]),
    );
    expect(screen.getByRole('link', { name: 'Open Venturi Meter Calibration' })).toHaveAttribute(
      'href',
      '/content-manager/decisions/SUB-0071',
    );
    await user.keyboard('{ArrowRight}');
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=with-vendor');
    await waitFor(async () =>
      expect(await tableRows()).toEqual([
        [
          'Forced ConvectionSUB-0081 · ME ZG523',
          'WEBAR',
          'Returned by the Academic Reviewer · 24 Aug 2026',
          'Open',
        ],
      ]),
    );
    await user.click(screen.getByRole('tab', { name: /^Published/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=published');
    await waitFor(async () => expect(await tableRows()).toHaveLength(12));
    const rows = await tableRows();
    expect(rows).toContainEqual([
      'Distillation ColumnCHE ZG513',
      'WEBVR',
      'Version 1.2 · live since 3 Jul 2026',
      'Open',
    ]);
    expect(rows).toContainEqual([
      'Induction Motor LoadingEEE ZC341',
      'WEBVRMR',
      'Version 1.0 · live since 9 Jun 2026 · Update returned to you',
      'Open',
    ]);
    expect(rows).toContainEqual([
      'Boiler Drum LevelCHE ZG513',
      'WEBVR',
      'Version 2.0 · live since 18 Jun 2026 · Update on hold',
      'Open',
    ]);
    expect(screen.getByRole('link', { name: 'Open Distillation Column' })).toHaveAttribute(
      'href',
      '/content-manager/published/distillation-column',
    );
    expect(
      section('Every experiment you look after').querySelector(
        '.xr-toolbar-status [role="status"]',
      ),
    ).toHaveTextContent('Published · 12 of 12');
    await user.click(screen.getByRole('tab', { name: /^Ready/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library');
  });

  it('reads its tab from the address; the search narrows, stays across tabs and clears', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ContentLibrary />, '/content-manager/library', '?tab=in-review');
    await waitFor(async () => expect(await tableRows()).toHaveLength(3));
    expect(screen.getByRole('tab', { name: /^In review/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.type(screen.getByRole('searchbox', { name: 'Search the library' }), 'venturi');
    await waitFor(async () => expect(await tableRows()).toHaveLength(1));
    const status = () =>
      section('Every experiment you look after').querySelector(
        '.xr-toolbar-status [role="status"]',
      );
    await waitFor(() => expect(status()).toHaveTextContent('In review · 1 of 3'));
    // The tab figures are the whole tabs’.
    expect(screen.getByRole('tab', { name: /^In review/ })).toHaveTextContent('In review 3');
    await user.click(screen.getByRole('tab', { name: /^Ready/ }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Nothing here' })).toBeVisible();
    expect(main()).toHaveTextContent('Try another tab or clear the search.');
    await waitFor(() => expect(status()).toHaveTextContent('Ready · 0 of 2'));
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('the Ready tab names a publication check not met (“· 1 to resolve”)', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const real = runtime.ports.production.listReadyToPublish.bind(runtime.ports.production);
    vi.spyOn(runtime.ports.production, 'listReadyToPublish').mockImplementation(async () => {
      const answer = await real();
      if (!answer.ok) return answer;
      return {
        ...answer,
        value: answer.value.map((row) => ({
          ...row,
          check: row.check.map((item) =>
            row.submission.id === 'SUB-0070' && item.check === 'learning-outcomes'
              ? { ...item, ok: false }
              : item,
          ),
        })),
      };
    });
    show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () =>
      expect((await tableRows())[1]![2]).toBe('Approved 21 Aug 2026 · 1 to resolve'),
    );
  });

  it('“Where it is” for every state the service lists', () => {
    const base = {
      kind: 'submission' as const,
      courseCode: 'ME ZG523',
      approvedAt: null,
    };
    const of = (status: unknown, revision = 1) =>
      submissionWhere({ ...base, submission: { status, revision } } as never, 0);
    expect(
      of(
        {
          state: 'with-academic-reviewer',
          since: '2026-08-26T04:30:00.000Z',
          reason: 'resubmission',
        },
        2,
      ),
    ).toBe('Revision 2 · with the Academic Reviewer');
    expect(of({ state: 'resubmitted', since: '2026-08-26T04:30:00.000Z' }, 3)).toBe(
      'Revision 3 · with the Academic Reviewer',
    );
    expect(
      of({ state: 'returned', since: '2026-08-26T04:30:00.000Z', by: 'content-manager' }),
    ).toBe('You sent it back · 26 Aug 2026');
    expect(
      of({ state: 'returned', since: '2026-08-26T04:30:00.000Z', by: 'super-admin-override' }),
    ).toBe('Returned to the vendor by the Super Admin · 26 Aug 2026');
    expect(
      submissionWhere(
        {
          ...base,
          approvedAt: '2026-08-14T09:40:00.000Z',
          submission: {
            status: { state: 'with-content-manager', since: '2026-08-14T09:40:00.000Z' },
            revision: 1,
          },
        } as never,
        2,
      ),
    ).toBe('Approved 14 Aug 2026 · 2 to resolve');
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.getLibrary');
    bare(runtime, <ContentLibrary />, '/content-manager/library');
    expect(document.querySelector('[aria-busy="true"] .xr-sr[role="status"]')).toHaveTextContent(
      'Loading the library',
    );
    expect(await screen.findByText('We couldn’t load the library')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
  });
});

// ---- CM-09 Course codes ---------------------------------------------------------------------------

const codeField = (course: string) =>
  screen.getByRole('textbox', { name: `Platform course code for ${course}` });
const footerStatus = () => main().querySelector('.xw-flow-foot [role="status"]');

describe('CM-09 Course codes (B6-10 f0 … f2; B6-11 f12)', () => {
  it('f0: every course with its area, published count and code; blank says so', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await h1('Course codes');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'The official platform code of each course — shown in the public catalogue',
    );
    const region = section('Courses');
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'From Academic structure (Super Admin)',
    );
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    expect((await tableRows()).map((cells) => cells[0])).toEqual([
      'Thermodynamics & Heat TransferMechanical & Manufacturing · 3 published experiments',
      'Manufacturing ProcessesMechanical & Manufacturing · 2 published experiments',
      'Electrical MachinesElectrical & Electronics · 3 published experiments',
      'Power ElectronicsElectrical & Electronics · 1 published experiment',
      'Process Instrumentation & ControlChemical & Process · 3 published experiments',
      'Fluid MechanicsMechanical & Manufacturing · 0 published experiments',
    ]);
    expect(
      [
        'Thermodynamics & Heat Transfer',
        'Manufacturing Processes',
        'Electrical Machines',
        'Power Electronics',
        'Process Instrumentation & Control',
        'Fluid Mechanics',
      ].map((course) => (codeField(course) as HTMLInputElement).value),
    ).toEqual(['ME ZG523', 'MEL ZG512', 'EEE ZC341', 'EEE ZG512', 'CHE ZG513', '']);
    expect(codeField('Fluid Mechanics')).toHaveAttribute('aria-describedby', 'cc-hint');
    expect(document.getElementById('cc-hint')).toHaveTextContent(
      'Each code must be unique. Leave it blank if the course has no platform code yet.',
    );
    expect(codeField('Fluid Mechanics').closest('td')).toHaveTextContent(
      'No code yet — the catalogue shows the course name only.',
    );
    expect(main().querySelectorAll('.xg-changed-mark')).toHaveLength(0);
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
    expect(screen.queryByRole('button', { name: 'Undo changes' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save codes' })).toHaveClass('xr-btn--primary');
    expect(main().querySelector('p.xl-open')).toHaveTextContent(
      'You are the only person who edits these codes.',
    );
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/course-codes');
  });

  it('B6-11 f12: a duplicate is refused on Save codes — the words under the row and in “Check the codes”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG523');
    const cell = codeField('Fluid Mechanics').closest('td')!;
    expect(cell.querySelector('.xg-changed-mark')).toHaveTextContent('Changed — not saved yet');
    expect(cell).not.toHaveTextContent('No code yet');
    expect(footerStatus()).toHaveTextContent('1 change not saved');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
    expect(summary).toHaveTextContent('Check the codes');
    const words =
      'ME ZG523 is already the code for Thermodynamics & Heat Transfer. Each course needs its own code.';
    await waitFor(() => expect(summary).toHaveFocus());
    const link = within(summary).getByRole('link', { name: words });
    expect(link).toHaveAttribute('href', '#cc-code-5');
    expect(cell.querySelector('.xr-error')).toHaveTextContent(words);
    expect(codeField('Fluid Mechanics')).toHaveAttribute('aria-invalid', 'true');
    expect(codeField('Fluid Mechanics')).toHaveAttribute('aria-describedby', 'cc-hint cc-code-5-e');
    await user.click(link);
    expect(codeField('Fluid Mechanics')).toHaveFocus();
    // Nothing was saved.
    const codes = ok(await asPersonId(sample, KAVYA).platformCourseCodes.list());
    expect(
      codes.find((row) => row.course.id === 'fluid-mechanics')?.course.platformCode,
    ).toBeNull();
    // Typing again clears the row’s error.
    await user.type(codeField('Fluid Mechanics'), '1');
    expect(cell.querySelector('.xr-error')).toBeNull();
  });

  it('a unique code saves: “Codes saved · …” takes focus and the platform has the code', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    standinsOf(sample).clock.setSampleNow('2026-08-27T11:10:00.000Z' as IsoInstant);
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), '  ME ZG541 ');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const saved = await screen.findByText(
      'Codes saved · 27 Aug 2026, 16:40 · the catalogue shows them from now on',
    );
    expect(saved).toHaveClass('xa-save', 'is-ok');
    await waitFor(() => expect(saved).toHaveFocus());
    expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
    const codes = ok(await asPersonId(sample, KAVYA).platformCourseCodes.list());
    expect(codes.find((row) => row.course.id === 'fluid-mechanics')?.course.platformCode).toBe(
      'ME ZG541',
    );
    // A change clears the saved line.
    await user.type(codeField('Fluid Mechanics'), 'X');
    expect(screen.queryByText(/^Codes saved/)).toBeNull();
  });

  it('blank is allowed; Undo changes puts every code back; Save with no change sends nothing', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const save = vi.spyOn(runtime, 'withCommandId');
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    expect(save).not.toHaveBeenCalled();
    await user.clear(codeField('Power Electronics'));
    await user.type(codeField('Manufacturing Processes'), '1');
    expect(codeField('Power Electronics').closest('td')).toHaveTextContent(
      'No code yet — the catalogue shows the course name only.',
    );
    expect(main().querySelectorAll('.xg-changed-mark')).toHaveLength(2);
    expect(footerStatus()).toHaveTextContent('2 changes not saved');
    await user.click(screen.getByRole('button', { name: 'Undo changes' }));
    expect(codeField('Power Electronics')).toHaveValue('EEE ZG512');
    expect(codeField('Manufacturing Processes')).toHaveValue('MEL ZG512');
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
    await waitFor(() => expect(codeField('Thermodynamics & Heat Transfer')).toHaveFocus());
  });

  it('typed codes stay while she moves around the workspace (in memory, this session)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const first = show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG541');
    first.view.unmount();
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(() => expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541'));
    expect(footerStatus()).toHaveTextContent('1 change not saved');
  });

  function answerSaveWith(runtime: PlatformRuntime, error: ServiceError): void {
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        platformCourseCodes: {
          ...ports.platformCourseCodes,
          save: async () => ({ ok: false as const, error }),
        },
      } as typeof ports;
    });
  }

  it.each([
    [
      { kind: 'stale-version', currentRev: 9 } as ServiceError,
      'These codes were changed elsewhere',
      'Nothing was saved and your codes are still here. Check them and save again.',
    ],
    [
      { kind: 'policy-open', decision: 'CC-06' } as ServiceError,
      'These codes can’t be saved yet',
      'Whether you can change platform codes for these courses hasn’t been decided yet. Nothing was saved.',
    ],
    [
      { kind: 'not-permitted', why: 'wrong-workspace' } as unknown as ServiceError,
      'Your codes didn’t save',
      'Nothing was saved and your codes are still here. Try again.',
    ],
  ])('a save refused (%o) says so calmly and keeps the typed code', async (error, title, line) => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerSaveWith(runtime, error);
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG541');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const notice = await screen.findByRole('alert');
    expect(notice).toHaveClass('xr-notice', 'xr-notice--err');
    expect(notice).toHaveTextContent(title);
    expect(notice).toHaveTextContent(line);
    expect(notice.textContent).not.toMatch(/CC-06/);
    await waitFor(() => expect(notice).toHaveFocus());
    expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
    expect(footerStatus()).toHaveTextContent('1 change not saved');
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('PlatformCourseCodeService.list');
    bare(runtime, <CourseCodes />, '/content-manager/course-codes');
    expect(document.querySelector('[aria-busy="true"] .xr-sr[role="status"]')).toHaveTextContent(
      'Loading the course codes',
    );
    expect(await screen.findByText('We couldn’t load the course codes')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
  });
});
