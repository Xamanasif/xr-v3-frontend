/**
 * RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me in the V3 Refined B design (the
 * owner-approved export design/v3-refined-b/roles/RV-v1, `RV.dc.html`), on the real composition
 * root and the sample world, as Prof. A. Menon. The world is prepared through the ports from
 * spine-start (set-up only): Kavya Nair sends the Distillation Column correction UPD-0005 for
 * academic review, Anil Shetty submits “Conduction Through a Composite Wall” (the first save mints
 * SUB-0077), Prof. Menon returns it, Anil revises and resubmits (the routing stand-in sends it back
 * to the reviewer as revision 2) — four waiting items, oldest first, and ten decided rows.
 * Everything the screens do is read from that one world. Loading and couldn't load run under the
 * fault plan; Reviewed by me's empty state, which no sample reviewer reaches, runs on a read that
 * answers no decisions. No drawn state names a record by its internal reference (SUB-, UPD-, …) in
 * its words, names, titles or placeholders (the owner's identifier rule).
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
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
import {
  oldestToReview,
  reviewAddressOf,
  ReviewerOverview,
  type WaitingItem,
} from './rv-01-overview/overview';
import { decidedKind, queueAddress } from './rv-02-queue/list-facts';
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
/** An element's words, its text nodes joined by spaces (cells and lines read as words). */
const words = (element: Element | null) => {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    parts.push(node.textContent ?? '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const sidebarCurrent = () =>
  screen
    .getByRole('navigation', { name: 'Academic Reviewer navigation' })
    .querySelector('[aria-current="page"]');
const region = (name: string) => screen.getByRole('region', { name });
/** A tab by its visible words (its name joins the hidden “, ” and the count). */
const tabNamed = (words: string) =>
  screen
    .getAllByRole('tab')
    .find((tab) => text(tab) === words || text(tab).startsWith(`${words},`))!;
const tabWords = () => screen.getAllByRole('tab').map((tab) => text(tab));
const count = () => text(main().querySelector('.rk-statusline [role="status"]'));

async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => words(cell)),
  );
}
const rowNames = async () =>
  [...(await table()).querySelectorAll('tbody a.rk-rowlink')].map((link) => text(link));

/** An internal reference (the owner's identifier rule, every role). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference in the document's words (hidden and screen-reader-only words and the
 * announcements included), in any `aria-label`, `title`, `placeholder` or `value`, or in the tab's
 * title. No seeded quote that names one reaches these three lists, so nothing is excepted.
 */
function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll(
    '[aria-label], [title], [placeholder], input[value]',
  )) {
    for (const name of ['aria-label', 'title', 'placeholder', 'value']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** The runtime with Reviewed by me answering no decisions (the empty state no sample reviewer reaches). */
function withNoDecisions(runtime: PlatformRuntime): PlatformRuntime {
  const production = new Proxy(runtime.ports.production, {
    get(target, key) {
      if (key === 'listReviewedByMe') return async () => ({ ok: true, value: [], changed: [] });
      const value = Reflect.get(target, key) as unknown;
      return typeof value === 'function' ? (value as () => unknown).bind(target) : value;
    },
  });
  const ports = new Proxy(runtime.ports, {
    get: (target, key) => (key === 'production' ? production : Reflect.get(target, key)),
  });
  return new Proxy(runtime, {
    get: (target, key) => (key === 'ports' ? ports : Reflect.get(target, key)),
  });
}

// ---- RV-01 Overview ---------------------------------------------------------------------------

describe('RV-01 Overview — four items waiting', () => {
  it('the head, next in line with the one gold Start review, the rest oldest first', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewerOverview />, '/reviewer');
    const title = await h1('Overview');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(title).toHaveClass('rb-h1');
    expect(main().querySelector('.rk-head p.rb-eyebrow-date')).toHaveTextContent(/2026$/);
    await waitFor(() =>
      expect(main().querySelector('.rk-head p.rk-sub')).toHaveTextContent(
        '4 items are waiting for your academic decision, oldest first.',
      ),
    );
    expect(
      within(main().querySelector('.rk-head-act') as HTMLElement).getByRole('link', {
        name: 'Open the review queue',
      }),
    ).toHaveAttribute('href', '/reviewer/queue');

    const desk = region('Waiting for your decision');
    expect(desk.parentElement).toHaveClass('rv-desk');
    expect(desk.querySelector('.rv-wait-h .rb-note')).toHaveTextContent('Oldest first');
    const next = desk.querySelector('.rv-next')!;
    expect(next.querySelector('.rv-next-k')).toHaveTextContent('Next in line · waiting longest');
    expect(next.querySelector('.rv-kind')).toHaveClass('rv-kind--new');
    expect(next.querySelector('.rv-kind')).toHaveTextContent('New submission');
    expect(next.querySelector('h3.rv-next-t')).toHaveTextContent('Flash Distillation');
    await waitFor(() =>
      expect(words(next.querySelector('.rv-meta-course'))).toBe(
        'CHE ZG513 Process Instrumentation & Control',
      ),
    );
    expect(next.querySelector('.rv-from')).toHaveTextContent(
      'Revision 1 · from Meridian Virtual Labs',
    );
    expect(next.querySelector('.rk-fmts')).toHaveAttribute('aria-label', 'Formats: WEB');
    expect(next.querySelector('.rk-tag-warn')).toHaveTextContent('No learning outcomes yet');
    expect(next.querySelector('.rv-age--lg b')).toHaveTextContent(/^\d+ days$/);
    expect(next.querySelector('.rv-age--lg span')).toHaveTextContent('since 24 Aug');
    const start = within(next as HTMLElement).getByRole('link', {
      name: 'Start review: Flash Distillation',
    });
    expect(start).toHaveTextContent('Start review');
    expect(start).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(start).toHaveAttribute('href', '/reviewer/submissions/SUB-0086');
    expect(main().querySelectorAll('a.rb-btn--primary')).toHaveLength(1);

    expect(desk.querySelector('h3.rv-then')).toHaveTextContent('Then, oldest first');
    const rest = [...desk.querySelectorAll('li.rv-wl-row')];
    expect(
      rest.map((row) => [
        words(row.querySelector('.rv-kind')),
        text(row.querySelector('.rv-wl-t')),
        text(row.querySelector('.rv-meta-course .rk-code')),
        text(row.querySelector('.rv-from')),
        text(row.querySelector('.rv-wl-focus')),
        text(row.querySelector('.rv-wl-act a')),
      ]),
    ).toEqual([
      [
        'Re-check',
        'Venturi Meter Calibration',
        'CHE ZG513',
        'Sent back by the Content Manager',
        '“The second learning outcome mentions a Pitot tube, which this experiment…”',
        'Review',
      ],
      [
        'Update 1.2 → 1.3',
        'Distillation Column',
        'CHE ZG513',
        'From Kavya Nair, Content Manager',
        '',
        'Review update',
      ],
      [
        'Resubmitted revision 2',
        COMPOSITE,
        'ME ZG523',
        'Resubmitted 8 Oct · from Northline Simulation Studio',
        '',
        'Review',
      ],
    ]);
    expect(rest.map((row) => row.querySelector('.rv-kind')!.className)).toEqual([
      'rv-kind rv-kind--recheck',
      'rv-kind rv-kind--update',
      'rv-kind rv-kind--resub',
    ]);
    expect(screen.getByRole('link', { name: 'Review Venturi Meter Calibration' })).toHaveAttribute(
      'href',
      '/reviewer/submissions/SUB-0071',
    );
    expect(
      screen.getByRole('link', { name: 'Review the update to Distillation Column' }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0005');
    expect(screen.getByRole('link', { name: `Review ${COMPOSITE}` })).toHaveAttribute(
      'href',
      '/reviewer/submissions/SUB-0077',
    );

    // The side: the queue by type, the scope by course, the latest three decisions.
    const types = region('In your queue');
    expect(
      [...types.querySelectorAll('a.rv-type')].map((link) => [
        link.getAttribute('aria-label'),
        link.getAttribute('href'),
        text(link.querySelector('.rv-type-d')),
      ]),
    ).toEqual([
      [
        'New submissions: 2 items. Open them in the review queue',
        '/reviewer/queue?type=new',
        'From vendors · 1 is a resubmission',
      ],
      [
        'Re-checks: 1 item. Open them in the review queue',
        '/reviewer/queue?type=recheck',
        'Sent back by the Content Manager',
      ],
      [
        'Updates: 1 item. Open them in the review queue',
        '/reviewer/queue?type=update',
        'Corrections to published experiments',
      ],
    ]);
    const scope = region('Your review scope');
    expect(
      [...scope.querySelectorAll('a.rv-course')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/reviewer/queue?course=ME+ZG523',
      '/reviewer/queue?course=MEL+ZG512',
      '/reviewer/queue?course=CHE+ZG513',
    ]);
    expect(
      within(scope).getByRole('link', {
        name: 'CHE ZG513 Process Instrumentation & Control. Open the review queue for this course',
      }),
    ).toBeVisible();
    expect(scope.querySelector('.rv-side-note')).toHaveTextContent(
      'Only these courses reach your queue.',
    );
    const recent = region('Recently decided');
    expect(within(recent).getByRole('link', { name: 'All decisions' })).toHaveAttribute(
      'href',
      '/reviewer/reviewed',
    );
    expect(
      [...recent.querySelectorAll('a.rv-recent-row')].map((link) => [
        text(link.querySelector('.rv-recent-t')),
        words(link.querySelector('.rv-recent-d')),
        link.querySelector('.xr-st')!.className,
        text(link.querySelector('.rv-recent-now')),
        link.getAttribute('href'),
      ]),
    ).toEqual([
      [
        COMPOSITE,
        'Returned to vendor 7 Oct 2026',
        'xr-st rv-st-sm xr-st--err',
        'In your queue',
        '/reviewer/submissions/SUB-0077',
      ],
      [
        'Forced Convection',
        'Returned to vendor 24 Aug 2026',
        'xr-st rv-st-sm xr-st--err',
        'With the vendor to revise',
        '/reviewer/submissions/SUB-0081',
      ],
      [
        'Packed Bed Pressure Drop',
        'Approved 21 Aug 2026',
        'xr-st rv-st-sm xr-st--ok',
        'With the Content Manager · not published',
        '/reviewer/submissions/SUB-0070',
      ],
    ]);
    expect(
      within(recent).getByRole('link', {
        name: 'Forced Convection, returned to vendor on 24 Aug 2026. Now: With the vendor to revise. Open it',
      }),
    ).toBeVisible();

    // The shell: Overview current; the queue's count in the rail.
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer');
    const queueItem = screen
      .getByRole('navigation', { name: 'Academic Reviewer navigation' })
      .querySelector('a[href="/reviewer/queue"]')!;
    await waitFor(() => expect(queueItem).toHaveTextContent(/4, 4 items waiting for review/));
    expectNoReferences();
  });

  it('spine-start: two items waiting, one update counted as none', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, <ReviewerOverview />, '/reviewer');
    await h1('Overview');
    await waitFor(() =>
      expect(main().querySelector('.rk-head p.rk-sub')).toHaveTextContent(
        '2 items are waiting for your academic decision, oldest first.',
      ),
    );
    expect(screen.getByRole('link', { name: 'Start review: Flash Distillation' })).toHaveAttribute(
      'href',
      '/reviewer/submissions/SUB-0086',
    );
    expect(
      [...region('In your queue').querySelectorAll('b.rv-type-n')].map((figure) => text(figure)),
    ).toEqual(['1', '1', '0']);
    expect(region('In your queue').querySelector('.rv-type-d')).toHaveTextContent(/^From vendors$/);
    expectNoReferences();
  });

  it('the item next in line is the queue’s first, whatever its kind; an update opens RV-04', () => {
    const item = (kind: 'SUB' | 'UPD', id: string) =>
      ({ ref: { kind, id }, name: id }) as unknown as WaitingItem;
    expect(oldestToReview([item('UPD', 'UPD-1'), item('SUB', 'SUB-1')])?.ref.id).toBe('UPD-1');
    expect(oldestToReview([item('SUB', 'SUB-1'), item('SUB', 'SUB-2')])?.ref.id).toBe('SUB-1');
    expect(oldestToReview([])).toBeNull();
    expect(reviewAddressOf(item('UPD', 'UPD-0005'))).toBe('/reviewer/updates/UPD-0005');
    expect(reviewAddressOf(item('SUB', 'SUB-0086'))).toBe('/reviewer/submissions/SUB-0086');
  });
});

describe('RV-01 — nothing waiting (the calm desk)', () => {
  it('the calm status with “Open Reviewed by me”; no queue card; the scope stays', async () => {
    const { runtime } = await nothingWaiting();
    show(runtime, <ReviewerOverview />, '/reviewer');
    await h1('Overview');
    const desk = await waitFor(() => region('Waiting for your decision'));
    const calm = await within(desk).findByRole('status');
    expect(calm).toHaveClass('rb-calm');
    expect(calm).toHaveTextContent('Nothing is waiting for your decision');
    expect(calm).toHaveTextContent(
      'New submissions, updates and re-checks appear here when they reach you.',
    );
    expect(desk.querySelector('.rv-wait-h .rb-note')).toHaveTextContent('Nothing waiting');
    expect(
      within(desk.querySelector('.rv-calm-act') as HTMLElement).getByRole('link', {
        name: 'Open Reviewed by me',
      }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    expect(main().querySelector('.rk-head p.rk-sub')).toHaveTextContent(
      'Nothing is waiting for your decision.',
    );
    expect(screen.queryByRole('region', { name: 'In your queue' })).toBeNull();
    expect(region('Your review scope').querySelectorAll('a.rv-course')).toHaveLength(3);
    expect(main().querySelector('a.rb-btn--primary')).toBeNull();
    expect(screen.queryByRole('link', { name: /^Start review/ })).toBeNull();
    // Both decisions just made lead Recently decided.
    expect(
      [...region('Recently decided').querySelectorAll('.rv-recent-t')].map((name) => text(name)),
    ).toEqual(['Venturi Meter Calibration', 'Flash Distillation', 'Forced Convection']);
    expectNoReferences();
  });
});

describe('RV-01 — loading and couldn’t load (undrawn; state-copy RV-01.loading, RV-01.failed)', () => {
  it('announces loading; Try again reads again and moves focus to the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.getReviewerOverview');
    renderInTab(<ReviewerOverview />, { runtime, navigation: testNavigation('/reviewer') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading your overview',
    );
    expect(document.querySelector('.rk-head p.rk-sub')).toBeNull();
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your overview',
    });
    const state = failed.closest('.rk-state')!;
    expect(state).toHaveAttribute('role', 'alert');
    expect(state).toHaveTextContent('Nothing has changed. Try again.');
    expect(state.querySelector('.rk-state-ico')).toHaveClass('rk-state-ico--err');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toHaveFocus();
    expect(
      await screen.findByRole('link', { name: 'Start review: Flash Distillation' }),
    ).toBeVisible();
    expectNoReferences();
  });
});

// ---- RV-02 Review queue -----------------------------------------------------------------------

describe('RV-02 Review queue — four items waiting', () => {
  it('the head, the type tabs with counts, the toolbar, the count and the table', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewQueue />, '/reviewer/queue');
    const title = await h1('Review queue');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('.rk-head p.rk-sub')).toHaveTextContent(
      'Everything waiting for your academic decision, oldest first. Drafts are never listed.',
    );
    const surface = region('Items waiting for your decision');
    expect(surface).toHaveClass('rk-surface');
    await table();
    expect(screen.getByRole('tablist', { name: 'Review type' }).parentElement).toHaveClass(
      'rv-qtabs',
    );
    expect(tabWords()).toEqual(['All, 4', 'New submissions, 2', 'Re-checks, 1', 'Updates, 1']);
    expect(tabNamed('All')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabNamed('All').id);
    const search = within(surface).getByRole('searchbox', { name: 'Search the queue' });
    expect(search).toHaveAttribute('placeholder', 'Name, course or sender');
    expect(search.closest('.rk-field')).toHaveClass('rk-search');
    expect(screen.getByRole('search', { name: 'Filter the review queue' })).toBeVisible();
    const course = within(surface).getByRole('combobox', { name: 'Course' });
    await waitFor(() =>
      expect(
        within(course)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['All courses', 'ME ZG523', 'MEL ZG512', 'CHE ZG513']),
    );
    expect(count()).toBe('4 items · oldest first');
    expect(within(surface).queryByRole('button', { name: 'Clear filters' })).toBeNull();

    const found = await table();
    expect(found).toHaveClass('rk-table', 'rv-qtable');
    expect(found.querySelector('caption')).toHaveTextContent(
      'Items waiting for your decision, oldest first',
    );
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Experiment',
      'Review type',
      'What to look at',
      'Waiting',
    ]);
    await waitFor(() =>
      expect(words(found.querySelector('tbody .rv-cell-course'))).toBe(
        'CHE ZG513 Process Instrumentation & Control',
      ),
    );
    const cells = await rows();
    expect(cells.map((row) => row.slice(0, 3))).toEqual([
      [
        'Flash Distillation CHE ZG513 Process Instrumentation & Control WEB',
        'New submission Revision 1 · from Meridian Virtual Labs',
        'No learning outcomes yet',
      ],
      [
        'Venturi Meter Calibration CHE ZG513 Process Instrumentation & Control WEB AR',
        'Re-check Sent back by the Content Manager',
        '“The second learning outcome mentions a Pitot tube, which this experiment…”',
      ],
      [
        'Distillation Column CHE ZG513 Process Instrumentation & Control WEB VR',
        'Update 1.2 → 1.3 From Kavya Nair, Content Manager',
        '',
      ],
      [
        `${COMPOSITE} ME ZG523 Thermodynamics & Heat Transfer WEB VR`,
        'Resubmitted revision 2 Resubmitted 8 Oct · from Northline Simulation Studio',
        '',
      ],
    ]);
    expect(cells.map((row) => row[3])).toEqual([
      expect.stringMatching(/^Waiting \d+ days since 24 Aug$/),
      expect.stringMatching(/^Waiting \d+ days since 25 Aug$/),
      expect.stringMatching(/^Waiting (Today|\d+ days?) since 5 Oct$/),
      expect.stringMatching(/^Waiting (Today|\d+ days?) since 8 Oct$/),
    ]);
    expect(
      [...found.querySelectorAll('a.rk-rowlink')].map((link) => [
        link.getAttribute('aria-label'),
        link.getAttribute('href'),
      ]),
    ).toEqual([
      [
        'Flash Distillation, new submission, waiting since 24 Aug 2026. Review it',
        '/reviewer/submissions/SUB-0086',
      ],
      [
        'Venturi Meter Calibration, re-check, waiting since 25 Aug 2026. Review it',
        '/reviewer/submissions/SUB-0071',
      ],
      [
        'Distillation Column, update 1.2 → 1.3, waiting since 5 Oct 2026. Review it',
        '/reviewer/updates/UPD-0005',
      ],
      [
        `${COMPOSITE}, resubmitted revision 2, waiting since 8 Oct 2026. Review it`,
        '/reviewer/submissions/SUB-0077',
      ],
    ]);
    expect(found.querySelector('tbody .rk-fmts')).toHaveAttribute('aria-label', 'Formats: WEB');

    // The shell: Review queue current with its count.
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer/queue');
    await waitFor(() =>
      expect(sidebarCurrent()).toHaveTextContent(/4, 4 items waiting for review/),
    );
    expectNoReferences();
  });

  it('the filters: the tabs (and their keys), Course, the search, the chips, no match, Clear filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await boardWorld();
    const { navigation } = show(runtime, <ReviewQueue />, '/reviewer/queue');
    await table();

    await user.click(tabNamed('Re-checks'));
    expect(navigation.replace).toHaveBeenLastCalledWith('/reviewer/queue?type=recheck');
    expect(await rowNames()).toEqual(['Venturi Meter Calibration']);
    expect(count()).toBe('1 of 4 items · oldest first');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      tabNamed('Re-checks').id,
    );
    expect(screen.getByRole('button', { name: 'Clear filters' })).toHaveClass('rk-clear');
    // The arrow keys move along the tabs and select the one they reach.
    fireEvent.keyDown(tabNamed('Re-checks'), { key: 'ArrowRight' });
    expect(tabNamed('Updates')).toHaveFocus();
    expect(tabNamed('Updates')).toHaveAttribute('aria-selected', 'true');
    expect(await rowNames()).toEqual(['Distillation Column']);
    fireEvent.keyDown(tabNamed('Updates'), { key: 'Home' });
    expect(tabNamed('All')).toHaveFocus();
    expect(navigation.replace).toHaveBeenLastCalledWith('/reviewer/queue');
    expect(await rowNames()).toHaveLength(4);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), 'CHE ZG513');
    expect(navigation.replace).toHaveBeenLastCalledWith('/reviewer/queue?course=CHE+ZG513');
    expect(await rowNames()).toEqual([
      'Flash Distillation',
      'Venturi Meter Calibration',
      'Distillation Column',
    ]);
    expect(count()).toBe('3 of 4 items · oldest first');
    expect(tabWords()).toEqual(['All, 3', 'New submissions, 1', 'Re-checks, 1', 'Updates, 1']);
    expect(text(main().querySelector('.rk-chip'))).toBe('Course: CHE ZG513');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), 'MEL ZG512');
    const none = await screen.findByText('No items match these filters');
    expect(none).toHaveClass('rk-state-t');
    expect(count()).toBe('0 of 4 items · oldest first');
    expect(main()).toHaveTextContent(
      'Try fewer filters, or a different spelling of the name, course or sender.',
    );
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    await user.click(clears[1]!);
    expect(await rowNames()).toHaveLength(4);
    expect(screen.getByRole('searchbox', { name: 'Search the queue' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();

    // The search: the sender, the reference (no longer shown, still matched), the course code.
    const search = screen.getByRole('searchbox', { name: 'Search the queue' });
    await user.type(search, 'northline');
    expect(await rowNames()).toEqual([COMPOSITE]);
    expect(text(main().querySelector('.rk-chip'))).toBe('Search: “northline”');
    await user.click(screen.getByRole('button', { name: 'Remove filter Search: “northline”' }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    await user.type(search, 'upd-0005');
    expect(await rowNames()).toEqual(['Distillation Column']);
    await user.clear(search);
    await user.type(search, 'me zg523');
    expect(await rowNames()).toEqual([COMPOSITE]);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await rowNames()).toHaveLength(4);
    expect(search).toHaveValue('');
    expectNoReferences();
  });

  it('reads Type and Course from the address', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewQueue />, '/reviewer/queue', '?type=update');
    await table();
    expect(tabNamed('Updates')).toHaveAttribute('aria-selected', 'true');
    expect(await rowNames()).toEqual(['Distillation Column']);
    expect(typeOf('?type=nonsense')).toBeNull();
    expect(typeOf('?type=new')).toBe('new');
  });

  it('opens on a course from the Overview’s scope (`?course=`)', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewQueue />, '/reviewer/queue', '?course=ME+ZG523');
    await table();
    expect(screen.getByRole('combobox', { name: 'Course' })).toHaveValue('ME ZG523');
    expect(await rowNames()).toEqual([COMPOSITE]);
    expect(queueAddress({ type: 'new', course: 'ME ZG523' })).toBe(
      '/reviewer/queue?type=new&course=ME+ZG523',
    );
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

describe('RV-02 — nothing waiting, loading and couldn’t load', () => {
  it('nothing waiting: the empty state with “Open Reviewed by me”; no tabs, no toolbar', async () => {
    const { runtime } = await nothingWaiting();
    show(runtime, <ReviewQueue />, '/reviewer/queue');
    const title = await screen.findByText(
      'Nothing is waiting for your decision',
      {},
      { timeout: 5000 },
    );
    const empty = title.closest('.rk-state')!;
    expect(empty.querySelector('.rk-state-ico')).not.toHaveClass('rk-state-ico--err');
    expect(empty).toHaveTextContent(
      'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
    );
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Open Reviewed by me' }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(main().querySelector('.rk-statusline')).toBeNull();
    expectNoReferences();
  });

  it('loading (no counts), then couldn’t load: Try again reads again and moves focus to the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.getReviewQueue');
    renderInTab(<ReviewQueue />, { runtime, navigation: testNavigation('/reviewer/queue') });
    const busy = document.querySelector('[aria-busy="true"]')!;
    expect(busy.querySelector('p.rk-loading-msg[role="status"]')).toHaveTextContent(
      'Loading the review queue…',
    );
    expect(busy.querySelectorAll('.rk-skel-row.rv-skel4[aria-hidden="true"]')).toHaveLength(3);
    expect(tabWords()).toEqual(['All', 'New submissions', 'Re-checks', 'Updates']);
    expect(document.querySelector('.rk-statusline')).toBeNull();
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveClass('rk-state');
    expect(failed).toHaveTextContent('We couldn’t load the review queue');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    expect(tabWords()).toEqual(['All', 'New submissions', 'Re-checks', 'Updates']);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Review queue' })).toHaveFocus();
    expect(await rows()).toHaveLength(2);
    expect(tabWords()[0]).toBe('All, 2');
  });
});

// ---- RV-05 Reviewed by me ---------------------------------------------------------------------

describe('RV-05 Reviewed by me', () => {
  it('the head, the Show tabs, the search, the count and the decisions, newest first', async () => {
    const { runtime } = await boardWorld();
    show(runtime, <ReviewedByMe />, '/reviewer/reviewed');
    const title = await h1('Reviewed by me');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('.rk-head p.rk-sub')).toHaveTextContent(
      'What you approved or returned, newest first. Opening one shows it read-only.',
    );
    const surface = region('Your decisions');
    const found = await table();
    expect(screen.getByRole('tablist', { name: 'Show' }).parentElement).toHaveClass(
      'rv-qtabs',
      'rv-qtabs--3',
    );
    expect(tabWords()).toEqual(['All, 10', 'New submissions, 6', 'Updates, 4']);
    const search = within(surface).getByRole('searchbox', { name: 'Search your decisions' });
    expect(search).toHaveAttribute('placeholder', 'Name or course');
    expect(screen.getByRole('search', { name: 'Filter your decisions' })).toHaveClass(
      'rv-tools--solo',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(count()).toBe('10 decisions · newest first');
    expect(found).toHaveClass('rk-table', 'rv-rtable');
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Experiment',
      'Type',
      'Your decision',
      'Where it is now',
    ]);
    await waitFor(() =>
      expect(words(found.querySelector('tbody .rv-cell-course'))).toBe(
        'ME ZG523 Thermodynamics & Heat Transfer',
      ),
    );
    expect((await rows()).map((cells) => cells.slice(1))).toEqual([
      ['New submission revision 1', 'Returned to vendor Decided 7 Oct 2026', 'Now: In your queue'],
      [
        'New submission',
        'Returned to vendor Decided 24 Aug 2026',
        'Now: With the vendor to revise',
      ],
      [
        'New submission',
        'Approved Decided 21 Aug 2026',
        'Now: With the Content Manager · not published',
      ],
      ['New submission', 'Approved Decided 18 Aug 2026', 'Now: Back in your queue for a re-check'],
      [
        'New submission',
        'Approved Decided 14 Aug 2026',
        'Now: With the Content Manager · not published',
      ],
      [
        'Update',
        'Update approved Decided 14 Aug 2026',
        'Now: With the Super Admin for a release decision',
      ],
      ['Update', 'Update approved Decided 30 Jul 2026', 'Now: Released by the Super Admin'],
      [
        'New submission',
        'Approved Decided 24 Jul 2026',
        expect.stringMatching(/^Now: Published on \d{1,2} [A-Z][a-z]{2} 2026$/),
      ],
      ['Update', 'Update approved Decided 1 Jul 2026', 'Now: Released by the Super Admin'],
      ['Update', 'Update approved Decided 17 Jun 2026', 'Now: Released by the Super Admin'],
    ]);
    expect(await rowNames()).toEqual([
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
    const body = found.querySelectorAll('tbody tr');
    expect(body[0]!.querySelector('.xr-st')!.className).toBe('xr-st rv-st-wrap xr-st--err');
    expect(body[2]!.querySelector('.xr-st')!.className).toBe('xr-st rv-st-wrap xr-st--ok');
    expect(
      screen.getByRole('link', {
        name: 'Forced Convection, returned to vendor on 24 Aug 2026. Open it',
      }),
    ).toHaveAttribute('href', '/reviewer/submissions/SUB-0081');
    expect(
      screen.getByRole('link', {
        name: 'Boiler Drum Level, update approved on 14 Aug 2026. Open it',
      }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0004');
    expect(sidebarCurrent()).toHaveAttribute('href', '/reviewer/reviewed');
    expectNoReferences();
  });

  it('the Show tabs and their keys, the search and its chip, no match, Clear filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await boardWorld();
    show(runtime, <ReviewedByMe />, '/reviewer/reviewed');
    await table();
    await user.click(tabNamed('Updates'));
    expect((await rows()).map((cells) => cells[1])).toEqual([
      'Update',
      'Update',
      'Update',
      'Update',
    ]);
    expect(count()).toBe('4 of 10 decisions · newest first');
    fireEvent.keyDown(tabNamed('Updates'), { key: 'ArrowLeft' });
    expect(tabNamed('New submissions')).toHaveFocus();
    expect(await rows()).toHaveLength(6);
    expect(count()).toBe('6 of 10 decisions · newest first');
    fireEvent.keyDown(tabNamed('New submissions'), { key: 'End' });
    expect(tabNamed('Updates')).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await rows()).toHaveLength(10);
    expect(tabNamed('All')).toHaveAttribute('aria-selected', 'true');

    const search = screen.getByRole('searchbox', { name: 'Search your decisions' });
    await user.type(search, 'distillation');
    expect(await rowNames()).toEqual(['Distillation Column', 'Distillation Column']);
    expect(tabWords()).toEqual(['All, 2', 'New submissions, 0', 'Updates, 2']);
    expect(text(main().querySelector('.rk-chip'))).toBe('Search: “distillation”');
    await user.click(tabNamed('New submissions'));
    expect(await screen.findByText('No decisions match these filters')).toHaveClass('rk-state-t');
    expect(main()).toHaveTextContent(
      'Try fewer filters, or a different spelling of the name or course.',
    );
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    await user.click(clears[clears.length - 1]!);
    expect(await rows()).toHaveLength(10);
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    // The reference is no longer shown, and still matched.
    await user.type(search, 'sub-0081');
    expect(await rowNames()).toEqual(['Forced Convection']);
  });

  it('the rules: the Show tabs, the decision words, the type as decided', () => {
    const row = (type: DecidedRow['type'], decision: string, nowState: unknown, revision = 1) =>
      ({ type, decision: { decision, revision }, nowState }) as unknown as DecidedRow;
    const recheck = row('recheck', 'approve', { state: 'with-content-manager' });
    expect(showsRow('new', recheck)).toBe(true);
    expect(showsRow('update', recheck)).toBe(false);
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
    expect(decisionView(row('new', 'return-to-vendor', { state: 'returned' }))).toEqual({
      words: 'Returned to vendor',
      ok: false,
    });
    // A return still with the vendor names no revision; one the vendor answered does.
    expect(decidedKind(row('new', 'return-to-vendor', { state: 'returned' })).detail).toBeNull();
    expect(
      decidedKind(row('new', 'return-to-vendor', { state: 'with-academic-reviewer' })).detail,
    ).toBe('revision 1');
    expect(decidedKind(row('new', 'approve', { state: 'published' }, 2))).toMatchObject({
      kind: 'resub',
      label: 'Resubmitted',
      detail: 'revision 2',
    });
  });

  it('loading (no counts), then couldn’t load: Try again reads again and moves focus to the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.listReviewedByMe');
    renderInTab(<ReviewedByMe />, { runtime, navigation: testNavigation('/reviewer/reviewed') });
    const busy = document.querySelector('[aria-busy="true"]')!;
    expect(busy.querySelector('p.rk-loading-msg[role="status"]')).toHaveTextContent(
      'Loading your decisions…',
    );
    expect(
      [...busy.querySelector('.rk-skel-row.rv-skel4')!.children].map(
        (cell) => cell.children.length,
      ),
    ).toEqual([2, 1, 2, 1]);
    expect(tabWords()).toEqual(['All', 'New submissions', 'Updates']);
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load your decisions');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Reviewed by me' })).toHaveFocus();
    expect(await rows()).toHaveLength(9);
    // UPD-0006 (EEE ZC341, a scope withdrawn on 1 Oct 2026) is not listed: the service decides.
    expect(await rowNames()).not.toContain('Induction Motor Loading');
  });

  it('nothing decided: the empty state with “Open the review queue”; no tabs, no toolbar', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    await act(async () => {
      renderInTab(inShell(<ReviewedByMe />), {
        runtime: withNoDecisions(runtime),
        navigation: testNavigation('/reviewer/reviewed'),
      });
    });
    const title = await screen.findByText(
      'You haven’t decided anything yet',
      {},
      { timeout: 5000 },
    );
    const empty = title.closest('.rk-state')!;
    expect(empty).toHaveTextContent('Items you approve or return appear here, newest first.');
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Open the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expectNoReferences();
  });
});
