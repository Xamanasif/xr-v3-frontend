/**
 * RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (boards B6-01 f0 … f2, B6-02 f0 …
 * f5; B6-11 f13, f14; B6-12 f0) on the real composition root and the sample world, as Prof. A.
 * Menon. The board’s world is prepared through the ports from spine-start (set-up only): Kavya
 * Nair sends the Distillation Column correction UPD-0005 for academic review, Anil Shetty submits
 * “Conduction Through a Composite Wall” (the first save mints SUB-0077), Prof. Menon returns it,
 * Anil revises and resubmits (the routing stand-in sends it back to the reviewer as revision 2) —
 * the board’s four waiting items, oldest first, and its decided rows. Everything the screens do is
 * read from that one world. The undrawn loading and failed states run under the fault plan.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IsoInstant } from '@xr/domain';
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
import { oldestToReview, ReviewerOverview, type WaitingItem } from './rv-01-overview/overview';
import {
  courseOptions,
  filterQueue,
  type QueueItem,
  ReviewQueue,
  typeOf,
} from './rv-02-queue/review-queue';
import {
  decisionView,
  type DecidedRow,
  ReviewedByMe,
  showsRow,
} from './rv-05-reviewed/reviewed-by-me';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const MENON = 'per-a-menon';
const ANIL = 'per-anil-shetty';
const KAVYA = 'per-kavya-nair';
const THERMO = 'thermodynamics-heat-transfer';
const COMPOSITE = 'Conduction Through a Composite Wall';
const RECHECK_REASON =
  'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.';

/** The set-up’s sample times, in Indian time. */
const UPDATE_SENT = '2026-10-05T05:30:00.000Z'; // 5 Oct 2026, 11:00
const SUBMITTED = '2026-10-06T05:30:00.000Z'; // 6 Oct 2026
const RETURNED = '2026-10-07T05:30:00.000Z'; // 7 Oct 2026
const RESUBMITTED = '2026-10-08T05:30:00.000Z'; // 8 Oct 2026

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05); the revision changes the VR device need. */
function compositeWall(vrDevice: string) {
  return {
    courseId: THERMO,
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
  } as never;
}

/** Kavya Nair sends the Distillation Column correction (1.2 → 1.3) for academic review (UPD-0005). */
async function sendUpdate(sample: Sample) {
  const cm = asPersonId(sample, KAVYA);
  const opened = ok(
    await cm.corrections.openCorrection({
      experimentId: 'distillation-column' as never,
      entry: 'edit-catalogue-details',
    }),
  );
  const saved = ok(
    await cm.corrections.saveCorrection({
      id: opened.update.id,
      proposed: {
        ...opened.update.proposed,
        description:
          'Learners start a binary column from cold and bring it to steady state. Raising the reflux ratio raises the overhead purity.',
      },
      whatChangesAndWhy: 'Corrects the reflux statement in the description.',
      versionLabel: '1.3',
      expectedRev: opened.update.rev,
    } as never),
  );
  ok(await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }));
  return saved.id;
}

/** Anil saves (minting SUB-0077) and submits it for academic review. */
async function submitComposite(sample: Sample): Promise<string> {
  const vendor = asPersonId(sample, ANIL);
  const draft = ok(
    await vendor.production.saveDraft({
      id: null,
      content: compositeWall('VR headset'),
      step: 'course',
      expectedRev: null,
    } as never),
  );
  ok(
    await vendor.production.submitForReview({
      id: draft.id,
      content: compositeWall('VR headset'),
      expectedRev: draft.rev,
    } as never),
  );
  return draft.id;
}

/** Prof. Menon returns it to the vendor (revision 1). */
async function returnComposite(sample: Sample, id: string) {
  const reviewer = asPersonId(sample, MENON);
  const view = ok(await reviewer.production.getSubmissionForReview(id as never));
  ok(
    await reviewer.production.returnSubmission({
      id: view.submission.id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: [],
      expectedRev: view.submission.rev,
    } as never),
  );
}

/** Anil revises and resubmits; the routing stand-in sends it back to the reviewer (revision 2). */
async function resubmitComposite(sample: Sample, id: string) {
  const vendor = asPersonId(sample, ANIL);
  const content = compositeWall('Standalone VR headset and about 2 × 2 m of clear floor');
  const record = ok(await vendor.production.getRecord(id as never));
  const saved = ok(
    await vendor.production.saveRevision({
      id: record.submission.id,
      content,
      expectedRev: record.submission.rev,
    } as never),
  );
  ok(await vendor.production.resubmit({ id: saved.id, content, expectedRev: saved.rev } as never));
}

/** B6-01 f0 / B6-02 f0’s world: four items waiting, oldest first, and the decided rows (f1). */
async function boardWorld() {
  const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
  moveClock(sample, UPDATE_SENT);
  const update = await sendUpdate(sample);
  moveClock(sample, SUBMITTED);
  const composite = await submitComposite(sample);
  moveClock(sample, RETURNED);
  await returnComposite(sample, composite);
  moveClock(sample, RESUBMITTED);
  await resubmitComposite(sample, composite);
  return { runtime, sample, update, composite };
}

/** Nothing waiting (B6-01 f1, B6-02 f4): Prof. Menon has decided both spine-start items. */
async function nothingWaiting() {
  const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
  const reviewer = asPersonId(sample, MENON);
  for (const id of ['SUB-0086', 'SUB-0071']) {
    const view = ok(await reviewer.production.getSubmissionForReview(id as never));
    ok(
      await reviewer.production.approveSubmission({
        id: view.submission.id,
        outcomes:
          view.submission.learningOutcomes.length > 0
            ? view.submission.learningOutcomes.map((outcome) => outcome.text)
            : ['Find the vapour fraction of a feed flashed at a set pressure.'],
        expectedRev: view.submission.rev,
      } as never),
    );
  }
  return { runtime, sample };
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="reviewer">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function show(runtime: PlatformRuntime, ui: ReactNode, pathname: string, search = '') {
  const navigation = testNavigation(pathname, search);
  const view = renderInTab(inShell(ui), { runtime, navigation });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const sidebarCurrent = () =>
  screen
    .getByRole('navigation', { name: 'Academic Reviewer navigation' })
    .querySelector('[aria-current="page"]');

async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

// ---- RV-01 Overview ---------------------------------------------------------------------------

describe('RV-01 Overview — four items waiting (B6-01 f0, f2)', () => {
  it('the overline, the counts, the scope line, the oldest, the rows oldest first', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewerOverview />, '/reviewer');
    await h1('Overview');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Prof. A. Menon');
    const status = await waitFor(() => {
      const line = main().querySelector('.xr-phead-meta p.xv-statusline[role="status"]');
      expect(line).not.toBeNull();
      return line!;
    });
    expect([...status.querySelectorAll(':scope > span')].map((part) => text(part))).toEqual([
      '4 items waiting',
      '1 re-check from the Content Manager',
      '1 update',
    ]);
    expect(status.querySelector('strong')).toHaveTextContent('4 items');
    const scope = main().querySelector('.xr-phead-meta p.xg-scope')!;
    expect(scope).toHaveTextContent('You review: ME ZG523 · MEL ZG512 · CHE ZG513');
    expect(scope.querySelector('svg.xr-ico.xr-ico--16')).not.toBeNull();

    // The one primary and the queue, in `div.xw-actions`.
    const actions = main().querySelector('.xw-actions')!;
    const oldest = within(actions as HTMLElement).getByRole('link', {
      name: 'Review the oldest — Flash Distillation',
    });
    expect(oldest).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(oldest).toHaveAttribute('href', '/reviewer/submissions/SUB-0086');
    expect(
      within(actions as HTMLElement).getByRole('link', { name: 'Open the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(main().querySelectorAll('a.xr-btn--primary')).toHaveLength(1);

    const section = screen.getByRole('region', { name: 'Waiting for your decision' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      '4 items · oldest first',
    );
    const items = [...section.querySelectorAll('li.xr-row')];
    expect(
      items.map((row) => [
        text(row.querySelector('.xr-row-title')),
        text(row.querySelector('.xr-row-sub')),
        [...row.querySelector('.xr-row-icon')!.classList].join(' '),
      ]),
    ).toEqual([
      [
        'Review: Flash Distillation',
        'New submission · no learning outcomes yet · Meridian Virtual Labs · 24 Aug 2026',
        'xr-row-icon xr-row-icon--info',
      ],
      [
        'Re-check: Venturi Meter Calibration',
        `Content Manager · 25 Aug 2026 · “${RECHECK_REASON}”`,
        'xr-row-icon xr-row-icon--err',
      ],
      [
        'Update: Distillation Column',
        'Correction to the live version 1.2 → 1.3 · from Kavya Nair · Content Manager · 5 Oct 2026',
        'xr-row-icon xr-row-icon--wait',
      ],
      [
        `Review: ${COMPOSITE}`,
        'Resubmitted · revision 2 · Northline Simulation Studio · 8 Oct 2026',
        'xr-row-icon xr-row-icon--info',
      ],
    ]);
    // Each submission row has its “Review”; the update’s “Review update” (RV-04) is not rendered.
    const review = within(items[0] as HTMLElement).getByRole('link', {
      name: 'Review Flash Distillation',
    });
    expect(review).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(review).toHaveTextContent('Review');
    expect(review).toHaveAttribute('href', '/reviewer/submissions/SUB-0086');
    expect(
      within(items[1] as HTMLElement).getByRole('link', {
        name: 'Review Venturi Meter Calibration',
      }),
    ).toHaveAttribute('href', '/reviewer/submissions/SUB-0071');
    expect(items[2]!.querySelector('a, button')).toBeNull();
    expect(screen.queryByText('Review update')).toBeNull();
    expect(
      within(items[3] as HTMLElement).getByRole('link', { name: `Review ${COMPOSITE}` }),
    ).toHaveAttribute('href', '/reviewer/submissions/SUB-0077');

    // The shell: Overview current, the top bar “Overview”, the queue’s count in the sidebar.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Overview');
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer');
    const queueItem = screen
      .getByRole('navigation', { name: 'Academic Reviewer navigation' })
      .querySelector('a[href="/reviewer/queue"]')!;
    await waitFor(() => expect(queueItem).toHaveTextContent(/4, 4 (items )?waiting for review/));
  });

  it('spine-start: two items waiting, the status line’s zero form', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, <ReviewerOverview />, '/reviewer');
    await h1('Overview');
    await waitFor(() =>
      expect(text(main().querySelector('p.xv-statusline'))).toBe(
        '2 items waiting1 re-check from the Content Manager0 updates',
      ),
    );
    expect(
      screen.getByRole('link', { name: 'Review the oldest — Flash Distillation' }),
    ).toHaveAttribute('href', '/reviewer/submissions/SUB-0086');
    expect(
      screen
        .getByRole('region', { name: 'Waiting for your decision' })
        .querySelector('.xr-section-head .xr-meta'),
    ).toHaveTextContent('2 items · oldest first');
  });

  it('the oldest is the oldest submission or re-check — never an update (RV-04 not built)', () => {
    const item = (kind: 'SUB' | 'UPD', id: string) =>
      ({ ref: { kind, id }, name: id }) as unknown as WaitingItem;
    expect(oldestToReview([item('UPD', 'UPD-1'), item('SUB', 'SUB-1')])?.ref.id).toBe('SUB-1');
    expect(oldestToReview([item('SUB', 'SUB-1'), item('SUB', 'SUB-2')])?.ref.id).toBe('SUB-1');
    expect(oldestToReview([item('UPD', 'UPD-1')])).toBeNull();
  });
});

describe('RV-01 — nothing waiting (B6-01 f1)', () => {
  it('the scope line stays; the calm state with “Open Reviewed by me”; no actions', async () => {
    const { runtime } = await nothingWaiting();
    show(runtime, <ReviewerOverview />, '/reviewer');
    await h1('Overview');
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'Nothing is waiting for your decision',
    });
    const empty = title.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(empty).toHaveTextContent(
      'New submissions, updates and re-checks appear here when they reach you.',
    );
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Open Reviewed by me' }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    expect(main().querySelector('p.xv-statusline')).toBeNull();
    expect(main().querySelector('p.xg-scope')).toHaveTextContent(
      'You review: ME ZG523 · MEL ZG512 · CHE ZG513',
    );
    expect(main().querySelector('.xw-actions')).toBeNull();
    expect(screen.queryByRole('link', { name: /Review the oldest/ })).toBeNull();
  });
});

describe('RV-01 — loading and failed (undrawn; state-copy RV-01.loading, RV-01.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.getReviewerOverview');
    renderInTab(<ReviewerOverview />, { runtime, navigation: testNavigation('/reviewer') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading your overview',
    );
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your overview',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    expect(failed.closest('.xr-empty')!.querySelector('.xr-empty-icon')).toHaveClass(
      'bg-err-bg',
      'text-err',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('link', { name: 'Review the oldest — Flash Distillation' }),
    ).toBeVisible();
  });
});

// ---- RV-02 Review queue -----------------------------------------------------------------------

describe('RV-02 Review queue — four items waiting (B6-02 f0; B6-12 f0)', () => {
  it('the header, the section, the toolbar, the count and the table, oldest first', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewQueue />, '/reviewer/queue');
    await h1('Review queue');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'New submissions, updates (Content Manager corrections) and re-checks — one queue',
    );
    const section = screen.getByRole('region', { name: 'Waiting for your decision' });
    expect(section.querySelector('.xr-section-head h2')).toHaveAttribute('tabindex', '-1');
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'Drafts are never listed',
    );
    await table();
    const search = within(section).getByRole('searchbox', { name: 'Search the queue' });
    expect(search).toHaveAttribute('placeholder', 'Name, ID, course or vendor');
    expect(search.closest('.xr-field')).toHaveClass('xr-toolbar-search');
    const type = within(section).getByRole('combobox', { name: 'Type' });
    expect(
      within(type)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['All types', 'New submission', 'Update', 'Re-check']);
    const course = within(section).getByRole('combobox', { name: 'Course' });
    await waitFor(() =>
      expect(
        within(course)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['All courses', 'ME ZG523', 'MEL ZG512', 'CHE ZG513']),
    );
    expect(section.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      '4 of 4 items · oldest first',
    );
    expect(within(section).queryByRole('button', { name: 'Clear filters' })).toBeNull();

    const found = await table();
    expect(found.closest('.xr-table-wrap')).toHaveClass('rounded-none', 'border-x-0', 'border-b-0');
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Item',
      'Type',
      'Formats',
      'Waiting since',
      'Action',
    ]);
    expect(found.querySelector('th:last-child .xr-sr')).toHaveTextContent('Action');
    expect(await rows()).toEqual([
      [
        'Flash DistillationSUB-0086 · CHE ZG513 · Meridian Virtual LabsNew submission · no learning outcomes yet',
        'New submission',
        'WEB',
        '24 Aug 2026',
        'Review',
      ],
      [
        'Venturi Meter CalibrationSUB-0071 · CHE ZG513 · Meridian Virtual LabsBack from the Content Manager for a re-check',
        'Re-check',
        'WEBAR',
        '25 Aug 2026',
        'Review',
      ],
      [
        'Distillation ColumnUPD-0005 · CHE ZG513 · Kavya Nair · Content ManagerCorrection to the live version 1.2 → 1.3',
        'Update',
        'WEBVR',
        '5 Oct 2026',
        '',
      ],
      [
        `${COMPOSITE}SUB-0077 · ME ZG523 · Northline Simulation StudioResubmitted · revision 2`,
        'New submission',
        'WEBVR',
        '8 Oct 2026',
        'Review',
      ],
    ]);
    const first = found.querySelector('tbody tr')!;
    expect(first.querySelector('td.is-primary strong')).toHaveTextContent('Flash Distillation');
    expect(first.querySelector('td.is-primary .xr-id')).toHaveTextContent('SUB-0086');
    expect(
      [...first.querySelectorAll('td[data-label]')].map((cell) => cell.getAttribute('data-label')),
    ).toEqual(['Type', 'Formats', 'Waiting since']);
    expect(first.querySelector('.xw-tag')).not.toHaveClass('xw-tag--warn');
    expect(found.querySelectorAll('tbody tr')[1]!.querySelector('.xw-tag')).toHaveClass(
      'xw-tag--warn',
    );
    expect(first.querySelector('.xv-chips .xr-fmt.xr-fmt--compact')).toHaveTextContent('WEB');
    const review = within(first as HTMLElement).getByRole('link', {
      name: 'Review Flash Distillation',
    });
    expect(review).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(review).toHaveAttribute('href', '/reviewer/submissions/SUB-0086');
    // The update’s Review (RV-04) is not rendered.
    expect(found.querySelectorAll('tbody tr')[2]!.querySelector('a, button')).toBeNull();

    // The shell: Review queue current with its count, the top bar “Review queue”.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Review queue');
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer/queue');
    await waitFor(() =>
      expect(sidebarCurrent()).toHaveTextContent(/4, 4 (items )?waiting for review/),
    );
  });

  it('the filters: Type (mirrored in the address), Course, the search; no match; Clear filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await boardWorld();
    const { navigation } = show(runtime, <ReviewQueue />, '/reviewer/queue');
    await table();
    const status = () => text(main().querySelector('.xr-toolbar-status [role="status"]'));
    const names = async () =>
      (await rows()).map((cells) => cells[0]!.split('SUB-')[0]!.split('UPD-')[0]);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'recheck');
    expect(navigation.replace).toHaveBeenLastCalledWith('/reviewer/queue?type=recheck');
    expect(await names()).toEqual(['Venturi Meter Calibration']);
    expect(status()).toBe('1 of 4 items · oldest first');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toHaveClass('xr-btn--text');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'all');
    expect(navigation.replace).toHaveBeenLastCalledWith('/reviewer/queue');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), 'CHE ZG513');
    expect(await names()).toEqual([
      'Flash Distillation',
      'Venturi Meter Calibration',
      'Distillation Column',
    ]);
    expect(status()).toBe('3 of 4 items · oldest first');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), 'MEL ZG512');
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Nothing in the queue matches' }),
    ).toBeVisible();
    expect(status()).toBe('0 of 4 items · oldest first');
    expect(main()).toHaveTextContent('Try a different name, or clear the filters.');
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    await user.click(clears[1]!);
    expect(await rows()).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();

    // The search: the vendor, the ID, the course code (the board’s `qq`).
    await user.type(screen.getByRole('searchbox', { name: 'Search the queue' }), 'northline');
    expect(await names()).toEqual([COMPOSITE]);
    await user.clear(screen.getByRole('searchbox', { name: 'Search the queue' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search the queue' }), 'upd-0005');
    expect(await names()).toEqual(['Distillation Column']);
    await user.clear(screen.getByRole('searchbox', { name: 'Search the queue' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search the queue' }), 'me zg523');
    expect(await names()).toEqual([COMPOSITE]);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await rows()).toHaveLength(4);
    expect(screen.getByRole('searchbox', { name: 'Search the queue' })).toHaveValue('');
  });

  it('reads Type from the address', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewQueue />, '/reviewer/queue', '?type=update');
    await table();
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('update');
    expect(await rows()).toHaveLength(1);
    expect(typeOf('?type=nonsense')).toBeNull();
    expect(typeOf('?type=new')).toBe('new');
  });

  it('the filter rules (state-copy RV-02.filters)', () => {
    const item = (id: string, code: string | null, who: string, type: QueueItem['type']) =>
      ({ ref: { kind: 'SUB', id }, name: `Name ${id}`, courseCode: code, who, type }) as QueueItem;
    const items = [
      item('SUB-1', 'ME ZG523', 'Northline', 'new'),
      item('SUB-2', null, 'Meridian', 'recheck'),
    ];
    expect(filterQueue(items, { type: null, course: null, search: '  MERIDIAN ' })).toHaveLength(1);
    expect(filterQueue(items, { type: 'recheck', course: null, search: '' })[0]!.ref.id).toBe(
      'SUB-2',
    );
    expect(filterQueue(items, { type: null, course: 'ME ZG523', search: '' })[0]!.ref.id).toBe(
      'SUB-1',
    );
    expect(courseOptions(['CHE ZG513'], items, 'EEE ZC341').map((option) => option.label)).toEqual([
      'All courses',
      'CHE ZG513',
      'ME ZG523',
      'EEE ZC341',
    ]);
  });
});

describe('RV-02 — nothing waiting, loading and failed (B6-02 f2 … f4; B6-11 f13, f14)', () => {
  it('f4: “Nothing is waiting for your decision” with “Open Reviewed by me”; no toolbar', async () => {
    const { runtime } = await nothingWaiting();
    show(runtime, <ReviewQueue />, '/reviewer/queue');
    const title = await screen.findByRole('heading', {
      level: 3,
      name: 'Nothing is waiting for your decision',
    });
    const empty = title.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section-body');
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(empty).toHaveTextContent(
      'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
    );
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Open Reviewed by me' }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(main().querySelector('.xr-toolbar-status')).toBeNull();
  });

  it('f2, f3: announces loading; failed has Try again, which reads again and focuses the heading', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.getReviewQueue');
    renderInTab(<ReviewQueue />, { runtime, navigation: testNavigation('/reviewer/queue') });
    const busy = document.querySelector('.xr-section-body > .xr-table-wrap[aria-busy="true"]');
    expect(busy?.querySelector('[role="status"]')).toHaveTextContent('Loading the review queue');
    expect(busy?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
    const failed = await screen.findByRole('heading', {
      level: 3,
      name: 'We couldn’t load the review queue',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.getByRole('region', { name: 'Waiting for your decision' })).toHaveTextContent(
      'Drafts are never listed',
    );
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry).toHaveClass('xr-btn--primary');
    await user.click(retry);
    expect(await rows()).toHaveLength(2);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Waiting for your decision' }),
      ).toHaveFocus(),
    );
  });
});

// ---- RV-05 Reviewed by me ---------------------------------------------------------------------

describe('RV-05 Reviewed by me (B6-02 f1)', () => {
  it('the header, the Show filter, the count and the decisions, newest first', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewedByMe />, '/reviewer/reviewed');
    await h1('Reviewed by me');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'What you approved or returned. Opening one shows it read-only.',
    );
    const section = screen.getByRole('region', { name: 'Your decisions' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'Read-only · newest first',
    );
    const found = await table();
    const showFilter = within(section).getByRole('combobox', { name: 'Show' });
    expect(
      within(showFilter)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Everything I decided', 'New submissions', 'Updates']);
    expect(section.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      '10 of 10 decisions',
    );
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Item',
      'Type',
      'Your decision',
      'Decided on',
      'Action',
    ]);
    expect(await rows()).toEqual([
      [
        `${COMPOSITE}SUB-0077 · ME ZG523`,
        'New submission',
        'Returned to vendor · revision 1',
        '7 Oct 2026',
        'Open',
      ],
      [
        'Forced ConvectionSUB-0081 · ME ZG523',
        'New submission',
        'Returned to vendor',
        '24 Aug 2026',
        'Open',
      ],
      [
        'Packed Bed Pressure DropSUB-0070 · CHE ZG513',
        'New submission',
        'Approved — with the Content Manager',
        '21 Aug 2026',
        'Open',
      ],
      [
        'Venturi Meter CalibrationSUB-0071 · CHE ZG513',
        'New submission',
        'Approved — later sent back for a re-check',
        '18 Aug 2026',
        'Open',
      ],
      [
        'Transient CoolingSUB-0074 · ME ZG523',
        'New submission',
        'Approved — with the Content Manager',
        '14 Aug 2026',
        'Open',
      ],
      [
        'Boiler Drum LevelUPD-0004 · CHE ZG513',
        'Update',
        'Update approved — with the Super Admin',
        '14 Aug 2026',
        '',
      ],
      [
        'Orifice Plate MeteringUPD-0003 · CHE ZG513',
        'Update',
        'Update approved — released',
        '30 Jul 2026',
        '',
      ],
      [
        'Fin-Tube BundleSUB-0052 · ME ZG523',
        'New submission',
        'Approved — published',
        '24 Jul 2026',
        'Open',
      ],
      [
        'Distillation ColumnUPD-0002 · CHE ZG513',
        'Update',
        'Update approved — released',
        '1 Jul 2026',
        '',
      ],
      [
        'Distillation ColumnUPD-0001 · CHE ZG513',
        'Update',
        'Update approved — released',
        '17 Jun 2026',
        '',
      ],
    ]);
    const body = found.querySelectorAll('tbody tr');
    expect(body[0]!.querySelector('.xr-status')).toHaveClass('xr-status--err');
    expect(body[2]!.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    const open = within(body[1] as HTMLElement).getByRole('link', {
      name: 'Open Forced Convection',
    });
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', '/reviewer/submissions/SUB-0081');
    // An update’s Open (RV-04’s decided view) is not rendered.
    expect(body[5]!.querySelector('a, button')).toBeNull();

    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Reviewed by me');
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer/reviewed');
  });

  it('Show: New submissions, Updates, Everything I decided', async () => {
    const user = userEvent.setup();
    const { runtime } = await boardWorld();
    show(runtime, <ReviewedByMe />, '/reviewer/reviewed');
    await table();
    const showFilter = screen.getByRole('combobox', { name: 'Show' });
    const status = () => text(main().querySelector('.xr-toolbar-status [role="status"]'));
    await user.selectOptions(showFilter, 'update');
    expect((await rows()).map((cells) => cells[1])).toEqual([
      'Update',
      'Update',
      'Update',
      'Update',
    ]);
    expect(status()).toBe('4 of 10 decisions');
    await user.selectOptions(showFilter, 'new');
    expect(await rows()).toHaveLength(6);
    expect(status()).toBe('6 of 10 decisions');
    await user.selectOptions(showFilter, 'all');
    expect(await rows()).toHaveLength(10);
  });

  it('the rules: the Show filter, an undrawn approval, a re-check decision', () => {
    const row = (type: DecidedRow['type'], decision: string, nowState: unknown) =>
      ({ type, decision: { decision, revision: 1 }, nowState }) as unknown as DecidedRow;
    const recheck = row('recheck', 'approve', { state: 'with-content-manager' });
    expect(showsRow('new', recheck)).toBe(true);
    expect(showsRow('update', recheck)).toBe(false);
    // Approved, then sent back to the vendor by the Content Manager: the decision alone.
    expect(
      decisionView(row('new', 'approve', { state: 'returned', by: 'content-manager' })),
    ).toEqual({ words: 'Approved', ok: true });
    expect(decisionView(row('update', 'approve', 'withdrawn'))).toEqual({
      words: 'Update approved',
      ok: true,
    });
    expect(decisionView(row('update', 'return-to-content-manager', 'returned'))).toEqual({
      words: 'Returned to the Content Manager',
      ok: false,
    });
  });

  it('loading and failed (undrawn; state-copy RV-05.loading, RV-05.failed), then Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.listReviewedByMe');
    renderInTab(<ReviewedByMe />, { runtime, navigation: testNavigation('/reviewer/reviewed') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading your decisions',
    );
    const failed = await screen.findByRole('heading', {
      level: 3,
      name: 'We couldn’t load your decisions',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.queryByRole('combobox', { name: 'Show' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await rows()).toHaveLength(9);
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Your decisions' })).toHaveFocus(),
    );
  });
});
