/**
 * CM-01 Overview, CM-02 Ready to publish, CM-04 Content library and CM-09 Platform course codes in
 * the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/CM-v1) on the real
 * composition root and the sample world, as Kavya Nair. At spine-start the world holds her desk
 * (SUB-0074 and SUB-0070 approved, SUB-0071 back for a re-check, UPD-0006 returned, UPD-0004 on
 * hold, twelve published experiments); Anil Shetty creates and submits “Conduction Through a
 * Composite Wall” and Prof. A. Menon approves it (Flow E’s E1 and E3, through the ports). The one
 * world moves the pages: publishing empties Ready to publish; a code saved on CM-09 is the
 * platform’s code. The drawn validation (a duplicate code), the busy save and the failed save; the
 * list states (empty, no match, loading, couldn’t load); the undrawn stale and policy-open refusals.
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
import { libraryViewAddress } from './cm-02-ready/list-facts';
import { openChecks, ReadyToPublish } from './cm-02-ready/ready-to-publish';
import { ContentLibrary, submissionTag } from './cm-04-library/content-library';
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
/** E3’s approval: 27 Aug 2026, 15:20 in Indian time. */
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
const region = (name: string) => screen.getByRole('region', { name });
const figures = () =>
  [...main().querySelectorAll('dl.rb-figs > .rb-fig')].map((figure) =>
    [...figure.children].map(text),
  );

/** A table’s course bands and its rows (cells as text), in order. */
async function tableLines(): Promise<string[][]> {
  const found = await screen.findByRole('table', {}, { timeout: 5000 });
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    row.matches('.cm-grp-h, .cm-area')
      ? ['band', text(row)]
      : [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

async function tableRows(): Promise<string[][]> {
  return (await tableLines()).filter((line) => line[0] !== 'band');
}

// ---- CM-01 Overview ---------------------------------------------------------------------------

describe('CM-01 Overview at spine-start', () => {
  it('the head, the pipeline, the decision desk, with others and the catalogue, with their links', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CmOverview />, '/content-manager');
    const title = await h1('Overview');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(title.closest('header')).toHaveClass('rb-head');
    expect(main().querySelector('.rb-head .rk-sub')).toHaveTextContent(
      'What is ready for you to publish, the corrections you raised, and what is live in the catalogue.',
    );

    // The pipeline: both lifecycles, counted from the records, each stage a link to its list.
    const pipeline = await screen.findByRole('region', { name: 'Publishing pipeline' });
    const tiles = within(pipeline)
      .getAllByRole('link')
      .map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]);
    expect(tiles).toEqual([
      [
        '1 With the vendor. Vendor revising. Open the Content library, With vendor',
        '/content-manager/library?tab=with-vendor',
      ],
      [
        '3 In academic review. Academic Reviewer. Open the Content library, In review',
        '/content-manager/library?tab=in-review',
      ],
      [
        '2 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish',
        '/content-manager/ready',
      ],
      [
        '12 In the catalogue. Live today. Open the Content library, Published',
        '/content-manager/library?tab=published',
      ],
      ['1 Draft or returned. With you. Your step. Open Updates', '/content-manager/updates'],
      ['0 In academic review. Academic Reviewer. Open Updates', '/content-manager/updates'],
      ['1 Release decision. Super Admin · 1 on hold. Open Updates', '/content-manager/updates'],
      [
        expect.stringMatching(/^\d+ Released\. Live for everyone\. Open Updates$/),
        '/content-manager/updates',
      ],
    ]);
    expect(
      [...pipeline.querySelectorAll('li.cm-tile')].map((tile) => tile.classList.contains('is-you')),
    ).toEqual([false, false, true, false, true, false, false, false]);
    expect(pipeline.querySelectorAll('li.cm-tile.is-quiet')).toHaveLength(1);

    // Needs your decision: the ready items, oldest first, then the returned correction.
    const desk = region('Needs your decision');
    expect(desk.querySelector('.cm-queue-top .rb-note')).toHaveTextContent('Oldest first');
    const ready = within(desk).getByRole('region', { name: 'Ready to publish' });
    expect(within(ready).getByRole('link', { name: 'Open Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    const readyRows = [...ready.querySelectorAll('li.cm-orow')];
    expect(readyRows.map((row) => row.querySelector('.rb-row-t')!.textContent)).toEqual([
      'Transient Cooling',
      'Packed Bed Pressure Drop',
    ]);
    expect(readyRows[0]).toHaveClass('is-first');
    expect(readyRows[0]!.querySelector('.cm-next')).toHaveTextContent('Publish next');
    expect(readyRows[1]!.querySelector('.cm-next')).toBeNull();
    expect(text(readyRows[0]!.querySelector('.rb-row-d'))).toBe(
      'SUB-0074 · ME ZG523 · Northline Simulation Studio',
    );
    expect(text(readyRows[0]!.querySelector('.rb-row-when span'))).toBe('approved 14 Aug');
    expect(readyRows[0]!.querySelector('.rb-row-when b')!.textContent).toMatch(/^\d+ days$/);
    expect(text(readyRows[0]!.querySelector('.cm-orow-x .cm-qcheck'))).toBe('4 of 4 checks met');
    expect(text(readyRows[1]!.querySelector('.cm-orow-x .rk-fmts .xr-sr'))).toBe(
      'Formats: WEB, AR',
    );
    const next = within(ready).getByRole('link', {
      name: 'Open the publication decision for Transient Cooling',
    });
    expect(next).toHaveTextContent('Open decision');
    expect(next).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(next).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    const other = within(ready).getByRole('link', {
      name: 'Open the publication decision for Packed Bed Pressure Drop',
    });
    expect(other).not.toHaveClass('rb-btn--primary');
    expect(other).toHaveAttribute('href', '/content-manager/decisions/SUB-0070');

    const corrections = within(desk).getByRole('region', { name: 'Corrections that need you' });
    expect(within(corrections).getByRole('link', { name: 'Open Updates' })).toHaveAttribute(
      'href',
      '/content-manager/updates',
    );
    const returned = corrections.querySelector('li.cm-orow')!;
    expect(text(returned.querySelector('.rb-row-t'))).toBe('Induction Motor Loading');
    expect(text(returned.querySelector('.rb-row-when span'))).toBe('returned 26 Aug');
    expect(text(returned.querySelector('.cm-orow-x'))).toBe('Returned to you1.0 live1.1 proposed');
    expect(returned.querySelector('.cm-orow-x .xr-st')).toHaveClass('xr-st--err');
    expect(text(returned.querySelector('blockquote p'))).toBe(
      '“The proposed description says slip falls as the load rises. It rises. Please correct it before…”',
    );
    expect(text(returned.querySelector('blockquote footer'))).toBe(
      'Prof. A. Menon, Academic Reviewer · 26 Aug',
    );
    const resume = within(corrections).getByRole('link', {
      name: 'Continue UPD-0006, correction to Induction Motor Loading',
    });
    expect(resume).toHaveTextContent('Continue');
    expect(resume).not.toHaveClass('rb-btn--primary');
    expect(resume).toHaveAttribute('href', '/content-manager/updates/UPD-0006');
    expect(
      within(desk)
        .getAllByRole('link', { name: /^(Open the publication|Continue)/ })
        .filter((link) => link.classList.contains('rb-btn--primary')),
    ).toHaveLength(1);

    // With others: what she sent on, oldest first.
    const others = region('With others');
    expect(others.querySelector('.cm-grp-head .rb-note')).toHaveTextContent(
      'Nothing for you to do',
    );
    expect([...others.querySelectorAll('ul.cm-hold > li')].map((row) => text(row))).toEqual([
      'Boiler Drum Level 2.1Super Admin · held 20 Aug · 2.0 stays liveOn holdOpen',
      'Venturi Meter CalibrationAcademic Reviewer · re-check you asked for on 25 AugBack with the Academic ReviewerOpen',
    ]);
    expect(
      within(others)
        .getAllByRole('link')
        .map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]),
    ).toEqual([
      ['Open UPD-0004, Boiler Drum Level', '/content-manager/updates/UPD-0004'],
      ['Open Venturi Meter Calibration', '/content-manager/decisions/SUB-0071'],
    ]);

    // In the catalogue, by course; each course opens the library's Published view filtered to it.
    const catalogue = region('In the catalogue');
    expect(text(catalogue.querySelector('.cm-cattotal'))).toBe('12experiments live, in 5 courses');
    const courses = within(catalogue).getByRole('list', { name: 'Live experiments by course' });
    expect(
      within(courses)
        .getAllByRole('link')
        .map((link) => link.getAttribute('aria-label')),
    ).toEqual([
      'Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library',
      'Manufacturing Processes, 2 published experiments. Open in the Content library',
      'Electrical Machines, 3 published experiments. Open in the Content library',
      'Power Electronics, 1 published experiment. Open in the Content library',
      'Process Instrumentation & Control, 3 published experiments. Open in the Content library',
    ]);
    expect(within(courses).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/content-manager/library?tab=published&course=thermodynamics-heat-transfer',
    );
    expect(
      within(catalogue).getByRole('link', { name: 'Open the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library?tab=published');

    // The shell: Overview current.
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager');
  });

  it('after SUB-0077 is approved: three ready, the oldest still first and still “Publish next”', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await approveCompositeWall(sample);
    show(runtime, <CmOverview />, '/content-manager');
    await h1('Overview');
    const ready = await screen.findByRole('region', { name: 'Ready to publish' });
    await waitFor(() => expect(ready.querySelectorAll('li.cm-orow')).toHaveLength(3));
    const rows = [...ready.querySelectorAll('li.cm-orow')];
    expect(rows[0]).toHaveClass('is-first');
    expect(text(rows[0]!.querySelector('.rb-row-t'))).toBe('Transient Cooling');
    expect(text(rows[2]!.querySelector('.rb-row-t'))).toBe('Conduction Through a Composite Wall');
    expect(text(rows[2]!.querySelector('.rb-row-d'))).toBe(
      'SUB-0077 · ME ZG523 · Northline Simulation Studio',
    );
    expect(text(rows[2]!.querySelector('.rb-row-when span'))).toBe('approved 27 Aug');
    expect(
      within(region('Publishing pipeline')).getByRole('link', {
        name: '3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish',
      }),
    ).toBeVisible();
  });

  it('nothing waiting: the calm state, the Content library one click away', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    vi.spyOn(runtime.ports.production, 'getContentManagerOverview').mockResolvedValue({
      ok: true,
      value: { attention: [], withOthers: [] },
      changed: [],
    });
    show(runtime, <CmOverview />, '/content-manager');
    const calm = await screen.findByRole('region', {
      name: 'Nothing is waiting for your decision',
    });
    expect(calm).toHaveClass('rb-panel', 'rb-att', 'rb-att--calm');
    expect(within(calm).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Needs your decision',
    );
    expect(calm).toHaveTextContent(
      'Approved experiments and corrections returned to you appear here.',
    );
    expect(within(calm).getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    expect(screen.queryByRole('region', { name: 'Needs your decision' })).toBeNull();
    expect(region('With others')).toHaveTextContent(
      'Nothing is waiting on the Academic Reviewer, the vendors or the Super Admin.',
    );
  });

  it('nothing needs her but others have work: the calm state, then “With others”, oldest first', async () => {
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
    await screen.findByRole('region', { name: 'Nothing is waiting for your decision' });
    const others = region('With others');
    expect([...others.querySelectorAll('ul.cm-hold > li')].map((row) => text(row))).toEqual([
      'Transformer Tests 1.1Academic Reviewer · sent 25 AugIn academic reviewOpen',
      'Distillation Column 1.3Super Admin · approved 26 AugAwaiting release decisionOpen',
    ]);
    expect(
      within(others)
        .getAllByRole('link')
        .map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]),
    ).toEqual([
      ['Open UPD-0007, Transformer Tests', '/content-manager/updates/UPD-0007'],
      ['Open UPD-0005, Distillation Column', '/content-manager/updates/UPD-0005'],
    ]);
  });

  it('announces loading; a failed read has Try again, which reads again and focuses the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.getContentManagerOverview');
    bare(runtime, <CmOverview />, '/content-manager');
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading what needs your decision');
    expect(screen.queryByRole('region', { name: 'Publishing pipeline' })).toBeNull();
    expect(await screen.findByText('We couldn’t load your overview')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toHaveFocus();
    expect(await screen.findByRole('region', { name: 'Needs your decision' })).toBeVisible();
  });
});

// ---- CM-02 Ready to publish -------------------------------------------------------------------

const cards = () => [...main().querySelectorAll('ul.cm-qlist > li.cm-qcard')];

describe('CM-02 Ready to publish', () => {
  it('spine-start: the figures, the count, two decision cards oldest first, the side cards', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await h1('Ready to publish');
    expect(main().querySelector('.rb-head .rk-sub')).toHaveTextContent(
      'Experiments the Academic Reviewer has approved, waiting for your publication decision.',
    );
    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(main().querySelector('dl.rb-figs')).toHaveAttribute(
      'aria-label',
      'The queue at a glance',
    );
    expect(figures()).toEqual([
      ['Waiting for you', '2', 'All checks met'],
      ['days, the longest wait', expect.stringMatching(/^\d+$/), 'Transient Cooling'],
    ]);
    const surface = region('Approved experiments waiting for your decision');
    expect(within(surface).getByRole('status')).toHaveTextContent(
      '2 experiments approved and waiting',
    );
    expect(
      within(surface).getByRole('button', { name: /^Sort: approved, oldest first/ }),
    ).toBeVisible();
    expect(
      within(surface).getByRole('list', { name: 'Approved experiments, oldest first' }),
    ).toBeVisible();
    const [first, second] = cards();
    expect(first).toHaveClass('is-first');
    expect(first!.querySelector('.cm-next')).toHaveTextContent('Waiting longest');
    expect(within(first as HTMLElement).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Transient Cooling',
    );
    expect([...first!.querySelectorAll('.cm-qline')].map(text)).toEqual([
      'SUB-0074 · Northline Simulation Studio',
      'Approved by Prof. A. Menon · 2 learning outcomes',
    ]);
    expect(text(first!.querySelector('.cm-qmeta .cm-fmtname'))).toBe(
      'ME ZG523Thermodynamics & Heat Transfer',
    );
    expect(text(first!.querySelector('.cm-qmeta .rk-fmts .xr-sr'))).toBe('Formats: WEB');
    expect(text(first!.querySelector('.cm-age .cm-age-t'))).toBe('days waiting');
    expect(text(first!.querySelector('.cm-age .cm-age-d'))).toBe('since 14 Aug');
    expect(
      within(first as HTMLElement)
        .getAllByRole('listitem')
        .map((item) => text(item)),
    ).toEqual([
      'Met: Approved',
      'Met: Learning outcomes',
      'Met: Catalogue details',
      'Met: Delivery for each format',
    ]);
    expect(text(first!.querySelector('.cm-qsum'))).toBe('All 4 checks met');
    const open = within(first as HTMLElement).getByRole('link', {
      name: 'Open the publication decision for Transient Cooling',
    });
    expect(open).toHaveTextContent('Open decision');
    expect(open).toHaveClass('rb-btn--primary');
    expect(open).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    expect(second).not.toHaveClass('is-first');
    expect(
      within(second as HTMLElement).getByRole('link', {
        name: 'Open the publication decision for Packed Bed Pressure Drop',
      }),
    ).not.toHaveClass('rb-btn--primary');
    expect(text(second!.querySelector('.cm-qmeta .cm-fmtname'))).toBe(
      'CHE ZG513Process Instrumentation & Control',
    );

    const aside = screen.getByRole('complementary', { name: 'Before you publish' });
    expect(within(aside).getByRole('region', { name: 'What publishing does' })).toHaveTextContent(
      'Gives no one access',
    );
    const latest = within(aside).getByRole('region', { name: 'Latest in the catalogue' });
    await waitFor(() => expect(latest.querySelectorAll('ul.cm-feed > li')).toHaveLength(3));
    expect(text(latest.querySelector('.cm-feed-d'))).toMatch(
      /^(Published · version \S+|Version \S+ released) · \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    expect(within(latest).getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library?tab=published',
    );
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/ready');
    await waitFor(() => expect(sidebarCurrent()).toHaveTextContent('2'));
  });

  it('once the Academic Reviewer approves SUB-0077 it is listed third, WEB and VR, just approved', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const id = await approveCompositeWall(sample);
    expect(id).toBe('SUB-0077');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(() => expect(cards()).toHaveLength(3));
    const third = cards()[2]!;
    expect(text(third.querySelector('.cm-qname'))).toBe('Conduction Through a Composite Wall');
    expect(text(third.querySelector('.cm-qline'))).toBe('SUB-0077 · Northline Simulation Studio');
    expect([...third.querySelectorAll('.cm-qmeta .xr-fmt')].map(text)).toEqual(['WEB', 'VR']);
    expect(text(third.querySelector('.cm-qline:last-of-type'))).toBe(
      'Approved by Prof. A. Menon · 2 learning outcomes',
    );
    expect(region('Approved experiments waiting for your decision')).toHaveTextContent(
      '3 experiments approved and waiting',
    );
  });

  it('newest first by the sort button; the longest wait stays marked and gold', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await approveCompositeWall(sample);
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(() => expect(cards()).toHaveLength(3));
    const names = () => cards().map((card) => text(card.querySelector('.cm-qname')));
    expect(names()).toEqual([
      'Transient Cooling',
      'Packed Bed Pressure Drop',
      'Conduction Through a Composite Wall',
    ]);
    await user.click(screen.getByRole('button', { name: /^Sort: approved, oldest first/ }));
    expect(names()).toEqual([
      'Conduction Through a Composite Wall',
      'Packed Bed Pressure Drop',
      'Transient Cooling',
    ]);
    expect(screen.getByRole('list', { name: 'Approved experiments, newest first' })).toBeVisible();
    expect(screen.getByRole('button', { name: /^Sort: approved, newest first/ })).toBeVisible();
    const marked = cards().filter((card) => card.classList.contains('is-first'));
    expect(marked.map((card) => text(card.querySelector('.cm-qname')))).toEqual([
      'Transient Cooling',
    ]);
    expect(marked[0]!.querySelector('.cm-qact a')).toHaveClass('rb-btn--primary');
    await user.click(screen.getByRole('button', { name: /^Sort: approved, newest first/ }));
    expect(names()[0]).toBe('Transient Cooling');
  });

  it('something to resolve (state sample): the check not met, the summary and the figure say so', async () => {
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
    await waitFor(() => expect(cards()).toHaveLength(2));
    const blocked = cards()[1]!;
    const failing = blocked.querySelector('.cm-qcheck.is-no')!;
    expect(text(failing)).toBe('Not met: Learning outcomes');
    expect(blocked.querySelector('.cm-qsum')).toHaveClass('is-no');
    expect(text(blocked.querySelector('.cm-qsum'))).toBe('1 thing to resolve');
    expect(figures()[0]).toEqual([
      'Waiting for you',
      '2',
      '1 experiment with something to resolve',
    ]);
    // Open decision stays: the decision page lists the blockers.
    expect(
      screen.getByRole('link', {
        name: 'Open the publication decision for Packed Bed Pressure Drop',
      }),
    ).toBeVisible();
    expect(
      openChecks([
        { check: 'learning-outcomes', ok: false, fixHint: null },
        { check: 'catalogue-details', ok: false, fixHint: null },
      ]),
    ).toEqual(['learning-outcomes', 'catalogue-details']);
  });

  it('empty: once both are published, nothing is ready — no figures, the Content library one click away', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ReadyToPublish />, '/content-manager/ready');
    await waitFor(() => expect(cards()).toHaveLength(2));
    await publishThrough(runtime, sample, 'SUB-0074');
    await publishThrough(runtime, sample, 'SUB-0070');
    const empty = await screen.findByRole('heading', {
      level: 2,
      name: 'Nothing is ready to publish',
    });
    expect(empty.closest('.rk-state')).toHaveClass('rk-state--roomy');
    expect(main()).toHaveTextContent(
      'Experiments appear here once the Academic Reviewer approves them.',
    );
    expect(
      within(empty.closest('.rk-state') as HTMLElement).getByRole('link', {
        name: 'Open the Content library',
      }),
    ).toHaveAttribute('href', '/content-manager/library');
    expect(main().querySelector('dl.rb-figs')).toBeNull();
    expect(screen.queryByRole('list', { name: /^Approved experiments/ })).toBeNull();
    expect(
      within(region('Approved experiments waiting for your decision')).queryByRole('status'),
    ).toBeNull();
  });

  it('loading: the card skeleton, no figures or count; couldn’t load: Try again reads again and focuses the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.listReadyToPublish');
    bare(runtime, <ReadyToPublish />, '/content-manager/ready');
    const busy = document.querySelector('[aria-busy="true"]')!;
    expect(busy.querySelector('.rk-loading-msg[role="status"]')).toHaveTextContent(
      'Loading the experiments ready to publish…',
    );
    expect(busy.querySelectorAll('.rk-skel-card')).toHaveLength(3);
    expect(document.querySelector('dl.rb-figs')).toBeNull();
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the experiments ready to publish');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    expect(document.querySelector('dl.rb-figs')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ready to publish' })).toHaveFocus();
    await waitFor(() => expect(document.querySelectorAll('li.cm-qcard')).toHaveLength(2));
  });
});

// ---- CM-04 Content library ----------------------------------------------------------------------

const viewButton = (name: RegExp) => screen.getByRole('button', { name });
const libraryCount = () => main().querySelector('.rk-statusline [role="status"]');

describe('CM-04 Content library', () => {
  it('Ready: the figures, the views with their counts, who holds them, the toolbar and the rows by course', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ContentLibrary />, '/content-manager/library');
    await h1('Content library');
    expect(main().querySelector('.rb-head .rk-sub')).toHaveTextContent(
      'Every experiment you look after, from approval to the live catalogue.',
    );
    await waitFor(() =>
      expect(figures()).toEqual([
        ['In the catalogue', '12', 'Across 5 courses'],
        ['On the way', '6', '2 ready · 3 in review · 1 with a vendor'],
      ]),
    );
    const views = screen.getByRole('group', { name: 'Show experiments that are' });
    expect(
      within(views)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Ready 2', 'In review 3', 'With vendor 1', 'Published 12']);
    expect(viewButton(/^Ready/)).toHaveAttribute('aria-pressed', 'true');
    expect(viewButton(/^Published/)).toHaveAttribute('aria-pressed', 'false');
    expect(text(main().querySelector('.cm-stageline'))).toBe(
      'With youApproved by the Academic Reviewer, waiting for your publication decision.',
    );
    const surface = region('Experiments ready to publish');
    const search = within(surface).getByRole('searchbox', { name: 'Search' });
    // The export's words without "vendor": the search is the service's (state-copy
    // `CM-04.search.placeholder`).
    expect(search).toHaveAttribute('placeholder', 'Experiment, ID or course');
    const course = within(surface).getByRole('combobox', { name: 'Course' });
    expect(
      within(course)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'All courses',
      'ME ZG523 · Thermodynamics & Heat Transfer',
      'MEL ZG512 · Manufacturing Processes',
      'EEE ZC341 · Electrical Machines',
      'EEE ZG512 · Power Electronics',
      'CHE ZG513 · Process Instrumentation & Control',
      'Fluid Mechanics',
    ]);
    await waitFor(() => expect(libraryCount()).toHaveTextContent('2 ready to publish'));
    const table = screen.getByRole('table', { name: 'Ready — 2' });
    expect([...table.querySelectorAll('thead th')].map(text)).toEqual([
      'Experiment',
      'Formats',
      'Approved by',
      'Approved',
      'Where it is',
    ]);
    expect(await tableLines()).toEqual([
      ['band', 'ME ZG523Thermodynamics & Heat Transfer1 ready to publish'],
      [
        'Transient CoolingSUB-0074',
        'Formats: WEBWEB',
        'Prof. A. MenonAcademic Reviewer',
        'Approved 14 Aug 2026',
        'Ready to publish',
      ],
      ['band', 'CHE ZG513Process Instrumentation & Control1 ready to publish'],
      [
        'Packed Bed Pressure DropSUB-0070',
        'Formats: WEB, ARWEBAR',
        'Prof. A. MenonAcademic Reviewer',
        'Approved 21 Aug 2026',
        'Ready to publish',
      ],
    ]);
    const open = screen.getByRole('link', {
      name: 'Transient Cooling, SUB-0074, ready to publish. Open the decision',
    });
    expect(open).toHaveClass('rk-rowlink');
    expect(open).toHaveAttribute('href', '/content-manager/decisions/SUB-0074');
    expect(surface.querySelector('.rk-ca-foot')).toHaveTextContent(
      'Drafts stay with the vendor and aren’t listed. Published rows open the live experiment.',
    );
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/library');
  });

  it('the views by click: In review, With vendor, Published; the address follows', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const { navigation } = show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    await user.click(viewButton(/^In review/));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=in-review');
    expect(viewButton(/^In review/)).toHaveAttribute('aria-pressed', 'true');
    await waitFor(async () =>
      expect(await tableLines()).toEqual([
        ['band', 'EEE ZC341Electrical Machines1 in academic review'],
        [
          'DC Motor Speed ControlSUB-0085',
          'Formats: WEBWEB',
          expect.stringMatching(/Revision 1$/),
          'Since 2 Oct 2026',
          'In academic reviewNew submission',
        ],
        ['band', 'CHE ZG513Process Instrumentation & Control2 in academic review'],
        [
          'Flash DistillationSUB-0086',
          'Formats: WEBWEB',
          'Meridian Virtual LabsRevision 1',
          'Since 24 Aug 2026',
          'In academic reviewNew submission',
        ],
        [
          'Venturi Meter CalibrationSUB-0071',
          'Formats: WEB, ARWEBAR',
          'Meridian Virtual LabsRevision 1',
          'Since 25 Aug 2026',
          'Back with the Academic ReviewerRe-check you asked for',
        ],
      ]),
    );
    expect(text(main().querySelector('.cm-stageline .cm-own'))).toBe('With the Academic Reviewer');
    expect(
      screen.getByRole('link', {
        name: 'Venturi Meter Calibration, SUB-0071, back with the academic reviewer. Open',
      }),
    ).toHaveAttribute('href', '/content-manager/decisions/SUB-0071');
    await user.click(viewButton(/^With vendor/));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=with-vendor');
    await waitFor(async () =>
      expect(await tableRows()).toEqual([
        [
          'Forced ConvectionSUB-0081',
          'Formats: WEB, ARWEBAR',
          expect.stringMatching(/Revision \d+$/),
          'Since 24 Aug 2026',
          'With the vendorReturned by the Academic Reviewer',
        ],
      ]),
    );
    expect(main().querySelector('.cm-stageline .cm-own')).toHaveClass('is-vendor');
    await user.click(viewButton(/^Published/));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library?tab=published');
    await waitFor(async () => expect(await tableRows()).toHaveLength(12));
    await waitFor(() => expect(libraryCount()).toHaveTextContent('12 published'));
    expect([...screen.getByRole('table').querySelectorAll('thead th')].map(text)).toEqual([
      'Experiment',
      'Formats',
      'Version',
      'Live since',
      'Where it is',
    ]);
    const rows = await tableRows();
    expect(rows).toContainEqual([
      'Distillation Column',
      'Formats: WEB, VRWEBVR',
      expect.stringMatching(/^Version 1\.2/),
      'Live since 3 Jul 2026',
      'Published',
    ]);
    expect(rows).toContainEqual([
      'Induction Motor Loading',
      'Formats: WEB, VR, MRWEBVRMR',
      expect.stringMatching(/^Version 1\.0/),
      'Live since 9 Jun 2026',
      'PublishedUpdate returned to you',
    ]);
    expect(rows).toContainEqual([
      'Boiler Drum Level',
      'Formats: WEB, VRWEBVR',
      expect.stringMatching(/^Version 2\.0/),
      'Live since 18 Jun 2026',
      'PublishedUpdate on hold',
    ]);
    const held = screen
      .getByRole('link', {
        name: /^Boiler Drum Level, CHE ZG513, version 2\.0, published, update on hold/,
      })
      .closest('tr')!;
    expect([...held.querySelectorAll('.cm-stcell > .xr-st')].map((chip) => chip.className)).toEqual(
      ['xr-st xr-st--ok', 'xr-st xr-st--paused'],
    );
    expect(
      screen.getByRole('link', {
        name: 'Distillation Column, CHE ZG513, version 1.2, published. Open the published experiment',
      }),
    ).toHaveAttribute('href', '/content-manager/published/distillation-column');
    await user.click(viewButton(/^Ready/));
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library');
  });

  it('reads its view from the address; the search narrows, stays across views and clears', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ContentLibrary />, '/content-manager/library', '?tab=in-review');
    await waitFor(async () => expect(await tableRows()).toHaveLength(3));
    expect(viewButton(/^In review/)).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'venturi');
    await waitFor(async () => expect(await tableRows()).toHaveLength(1));
    await waitFor(() => expect(libraryCount()).toHaveTextContent('1 of 3 in academic review'));
    expect(screen.getByRole('table', { name: 'In review — 1 of 3' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove filter Search: “venturi”' })).toBeVisible();
    // The view figures are the whole views'.
    expect(viewButton(/^In review/)).toHaveTextContent('In review 3');
    await user.click(viewButton(/^Ready/));
    const none = await screen.findByRole('heading', { level: 2, name: 'Nothing in Ready matches' });
    expect(none.closest('.rk-state')).toHaveTextContent(
      'Try fewer filters, another view or a different spelling of the experiment, ID or course.',
    );
    await waitFor(() => expect(libraryCount()).toHaveTextContent('0 of 2 ready to publish'));
    await user.click(
      within(none.closest('.rk-state') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    expect(screen.queryByRole('button', { name: /^Remove filter/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('the search is the service’s: the name, the ID or the course code — not the vendor', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const getLibrary = vi.spyOn(runtime.ports.production, 'getLibrary');
    show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'SUB-0070');
    await waitFor(async () =>
      expect((await tableRows()).map((row) => row[0])).toEqual([
        'Packed Bed Pressure DropSUB-0070',
      ]),
    );
    expect(getLibrary).toHaveBeenLastCalledWith({ tab: 'ready', search: 'SUB-0070' });
    await user.clear(search);
    await user.type(search, 'ME ZG523');
    await waitFor(async () =>
      expect((await tableRows()).map((row) => row[0])).toEqual(['Transient CoolingSUB-0074']),
    );
    await user.clear(search);
    await user.type(search, 'transient');
    await waitFor(async () =>
      expect((await tableRows()).map((row) => row[0])).toEqual(['Transient CoolingSUB-0074']),
    );
    // The vendor is not searched (the service matches name, ID and course code only).
    await user.clear(search);
    await user.type(search, 'meridian');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Nothing in Ready matches' }),
    ).toBeVisible();
  });

  it('the course filter: its chip, the address, and the Overview’s course link read back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const { navigation } = show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Course' }),
      'process-instrumentation-control',
    );
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/content-manager/library?course=process-instrumentation-control',
    );
    await waitFor(async () =>
      expect((await tableRows()).map((row) => row[0])).toEqual([
        'Packed Bed Pressure DropSUB-0070',
      ]),
    );
    await waitFor(() => expect(libraryCount()).toHaveTextContent('1 of 2 ready to publish'));
    await user.click(
      screen.getByRole('button', {
        name: 'Remove filter Course: CHE ZG513 · Process Instrumentation & Control',
      }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith('/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));

    expect(libraryViewAddress('published', 'thermodynamics-heat-transfer')).toBe(
      '/content-manager/library?tab=published&course=thermodynamics-heat-transfer',
    );
  });

  it('an address with a view and a course (from the Overview’s catalogue) shows that course only', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(
      runtime,
      <ContentLibrary />,
      '/content-manager/library',
      '?tab=published&course=thermodynamics-heat-transfer',
    );
    await waitFor(async () => expect(await tableRows()).toHaveLength(3));
    expect(viewButton(/^Published/)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: 'Course' })).toHaveValue(
      'thermodynamics-heat-transfer',
    );
    expect(
      screen.getByRole('button', {
        name: 'Remove filter Course: ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    ).toBeVisible();
    await waitFor(() => expect(libraryCount()).toHaveTextContent('3 of 12 published'));
    expect((await tableLines())[0]).toEqual([
      'band',
      'ME ZG523Thermodynamics & Heat Transfer3 published',
    ]);
  });

  it('the Ready view names a publication check not met (“1 to resolve”, in error)', async () => {
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
    await waitFor(async () => expect((await tableRows())[1]![4]).toBe('1 to resolve'));
    const row = screen.getByRole('link', { name: /^Packed Bed Pressure Drop/ }).closest('tr')!;
    expect(row.querySelector('.cm-stcell .xr-st')).toHaveClass('xr-st--err');
  });

  it('the line under a submission’s status for every state the service lists', () => {
    const of = (status: unknown) =>
      submissionTag({
        kind: 'submission',
        courseCode: null,
        approvedAt: null,
        submission: { status },
      } as never);
    const since = '2026-08-26T04:30:00.000Z';
    expect(of({ state: 'with-academic-reviewer', since, reason: 'new' })).toBe('New submission');
    expect(of({ state: 'with-academic-reviewer', since, reason: 'recheck' })).toBe(
      'Re-check you asked for',
    );
    expect(of({ state: 'with-academic-reviewer', since, reason: 'resubmission' })).toBeNull();
    expect(of({ state: 'resubmitted', since })).toBeNull();
    expect(of({ state: 'returned', since, by: 'academic-reviewer' })).toBe(
      'Returned by the Academic Reviewer',
    );
    expect(of({ state: 'returned', since, by: 'content-manager' })).toBe('You sent it back');
    expect(of({ state: 'returned', since, by: 'super-admin-override' })).toBe(
      'Returned to the vendor by the Super Admin',
    );
    expect(of({ state: 'with-content-manager', since })).toBeNull();
  });

  it('an empty view: once both are published, nothing is ready to publish', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <ContentLibrary />, '/content-manager/library');
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    await publishThrough(runtime, sample, 'SUB-0074');
    await publishThrough(runtime, sample, 'SUB-0070');
    const empty = await screen.findByRole('heading', {
      level: 2,
      name: 'Nothing is ready to publish',
    });
    expect(empty.closest('.rk-state')).toHaveTextContent(
      'Experiments appear here once the Academic Reviewer approves them.',
    );
    expect(viewButton(/^Ready/)).toHaveTextContent('Ready 0');
    expect(viewButton(/^Published/)).toHaveTextContent('Published 14');
    await waitFor(() => expect(libraryCount()).toHaveTextContent('0 ready to publish'));
  });

  it('loading hides the count, the view counts and the figures; couldn’t load: Try again reads again and focuses the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('ProductionService.getLibrary');
    bare(runtime, <ContentLibrary />, '/content-manager/library');
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading the content library…');
    expect(document.querySelectorAll('[aria-busy="true"] .rk-skel-row')).toHaveLength(4);
    expect(document.querySelector('dl.rb-figs')).toBeNull();
    expect(document.querySelector('.rk-statusline')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ready' }).querySelector('b')).toBeNull();
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the content library');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Content library' })).toHaveFocus();
    await waitFor(async () => expect(await tableRows()).toHaveLength(2));
    expect(screen.getByRole('button', { name: 'Ready 2' })).toBeVisible();
  });
});

// ---- CM-09 Platform course codes --------------------------------------------------------------------

const codeField = (course: string) =>
  screen.getByRole('textbox', { name: `Platform course code for ${course}` });
const footerStatus = () => main().querySelector('.cm-codes-foot [role="status"]');

describe('CM-09 Platform course codes', () => {
  it('clean: the courses by engineering area, live experiments per code, codes; blank says so', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await h1('Course codes');
    expect(main().querySelector('.rb-head .rk-sub')).toHaveTextContent(
      'The official platform code of each course, shown in the public catalogue. You’re the only person who edits these codes.',
    );
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    expect(figures()).toEqual([
      ['Courses with a code', '5', 'of 6 · 1 without a code'],
      ['Live experiments', '12', 'Listed under these codes'],
    ]);
    const surface = region('Courses');
    expect(surface.querySelector('.rk-sec-h .rb-note')).toHaveTextContent(
      'From Academic structure, kept by the Super Admin',
    );
    expect((await tableLines()).map((line) => (line[0] === 'band' ? line[1] : line[0]))).toEqual([
      'Mechanical & Manufacturing3 courses',
      'Thermodynamics & Heat Transfer3 experiments live under this course',
      'Manufacturing Processes2 experiments live under this course',
      'Fluid MechanicsNothing live yet',
      'Electrical & Electronics2 courses',
      'Electrical Machines3 experiments live under this course',
      'Power Electronics1 experiment live under this course',
      'Chemical & Process1 course',
      'Process Instrumentation & Control3 experiments live under this course',
    ]);
    expect(
      [...surface.querySelectorAll('.cm-livecount')].map((chip) => [text(chip), chip.className]),
    ).toEqual([
      ['3', 'cm-livecount'],
      ['2', 'cm-livecount'],
      ['0', 'cm-livecount is-zero'],
      ['3', 'cm-livecount'],
      ['1', 'cm-livecount'],
      ['3', 'cm-livecount'],
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
    expect(codeField('Fluid Mechanics')).toHaveAttribute('id', 'cc-code-5');
    expect(codeField('Fluid Mechanics')).toHaveAttribute('aria-describedby', 'cc-hint cc-code-5-b');
    expect(codeField('Power Electronics')).toHaveAttribute('aria-describedby', 'cc-hint');
    expect(document.getElementById('cc-hint')).toHaveTextContent(
      'Each code must be unique. Leave it blank if the course has no platform code yet.',
    );
    expect(document.getElementById('cc-code-5-b')).toHaveTextContent(
      'No code yet — the catalogue shows the course name only.',
    );
    expect(main().querySelectorAll('.cm-tag')).toHaveLength(0);
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
    expect(screen.queryByRole('button', { name: 'Undo changes' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save codes' })).toHaveClass('rb-btn--primary');
    const aside = screen.getByRole('complementary', { name: 'About platform codes' });
    expect(within(aside).getByRole('region', { name: 'Where a code appears' })).toHaveTextContent(
      'The public catalogue',
    );
    expect(
      within(aside).getByRole('region', { name: 'Platform codes, not institution codes' }),
    ).toHaveTextContent('Institute Admins keep their own code for a course (for example MEC-523)');
    expect(sidebarCurrent()).toHaveAttribute('href', '/content-manager/course-codes');
  });

  it('a duplicate is refused on Save codes — the words under the row and in “Check the codes”, which takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG523');
    const cell = codeField('Fluid Mechanics').closest('td')!;
    expect(cell.querySelector('.cm-tag')).toHaveTextContent('Changed — not saved yet');
    expect(cell).not.toHaveTextContent('No code yet');
    expect(footerStatus()).toHaveTextContent('1 change not saved');
    expect(screen.getByRole('button', { name: 'Undo changes' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(summary.querySelector('.rk-errsum-t')).toHaveTextContent('Check the codes');
    const words =
      'ME ZG523 is already the code for Thermodynamics & Heat Transfer. Each course needs its own code.';
    await waitFor(() => expect(summary).toHaveFocus());
    const link = within(summary).getByRole('link', { name: words });
    expect(link).toHaveAttribute('href', '#cc-code-5');
    expect(cell.querySelector('.rk-ferr')).toHaveTextContent(words);
    expect(codeField('Fluid Mechanics')).toHaveAttribute('aria-invalid', 'true');
    expect(codeField('Fluid Mechanics')).toHaveAttribute(
      'aria-describedby',
      'cc-hint cc-code-5-c cc-code-5-e',
    );
    await user.click(link);
    expect(codeField('Fluid Mechanics')).toHaveFocus();
    // Nothing was saved.
    const codes = ok(await asPersonId(sample, KAVYA).platformCourseCodes.list());
    expect(
      codes.find((row) => row.course.id === 'fluid-mechanics')?.course.platformCode,
    ).toBeNull();
    // Typing again clears the row’s error.
    await user.type(codeField('Fluid Mechanics'), '1');
    expect(cell.querySelector('.rk-ferr')).toBeNull();
  });

  it('a unique code saves: “Codes saved” with the time takes focus and the platform has the code', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    standinsOf(sample).clock.setSampleNow('2026-08-27T11:10:00.000Z' as IsoInstant);
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), '  ME ZG541 ');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const notice = await waitFor(() => {
      const element = main().querySelector('.rk-notice--ok[role="status"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent('Codes saved');
    expect(notice.querySelector('.rk-notice-d')).toHaveTextContent(
      '27 Aug 2026, 16:40 · the catalogue shows them from now on',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
    const codes = ok(await asPersonId(sample, KAVYA).platformCourseCodes.list());
    expect(codes.find((row) => row.course.id === 'fluid-mechanics')?.course.platformCode).toBe(
      'ME ZG541',
    );
    // A change clears the saved notice.
    await user.type(codeField('Fluid Mechanics'), 'X');
    expect(main().querySelector('.rk-notice--ok')).toBeNull();
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
    expect(main().querySelectorAll('.cm-tag')).toHaveLength(2);
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

  function answerSaveWith(
    runtime: PlatformRuntime,
    answer: (real: () => Promise<unknown>) => Promise<unknown>,
  ): void {
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        platformCourseCodes: {
          ...ports.platformCourseCodes,
          save: (input: never) => answer(() => ports.platformCourseCodes.save(input)),
        },
      } as typeof ports;
    });
  }

  it('saving: Saving… on the button and in the foot, Undo changes waits; then the result', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    let release: () => void = () => undefined;
    answerSaveWith(runtime, async (real) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return real();
    });
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG541');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const busy = await screen.findByRole('button', { name: 'Saving…' });
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(footerStatus()).toHaveTextContent('Saving…');
    const undo = screen.getByRole('button', { name: 'Undo changes' });
    expect(undo).toHaveAttribute('aria-disabled', 'true');
    await user.click(undo);
    expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
    await act(async () => release());
    await waitFor(() => expect(main().querySelector('.rk-notice--ok')).not.toBeNull());
    expect(footerStatus()).toHaveTextContent('No unsaved changes');
  });

  it('a failed save keeps every edit and says so; Try again saves them', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    let failures = 1;
    answerSaveWith(runtime, async (real) => {
      if (failures > 0) {
        failures -= 1;
        return { ok: false, error: { kind: 'unavailable' } };
      }
      return real();
    });
    show(runtime, <CourseCodes />, '/content-manager/course-codes');
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
    await user.type(codeField('Fluid Mechanics'), 'ME ZG541');
    await user.click(screen.getByRole('button', { name: 'Save codes' }));
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveClass('rk-errsum');
    expect(failed.querySelector('.rk-errsum-t')).toHaveTextContent('We couldn’t save the codes');
    expect(failed).toHaveTextContent(
      'Nothing has changed. Your edits are still in the table. Try again.',
    );
    await waitFor(() => expect(failed).toHaveFocus());
    expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
    expect(footerStatus()).toHaveTextContent('1 change not saved');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(main().querySelector('.rk-notice--ok')).not.toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();
    const codes = ok(await asPersonId(sample, KAVYA).platformCourseCodes.list());
    expect(codes.find((row) => row.course.id === 'fluid-mechanics')?.course.platformCode).toBe(
      'ME ZG541',
    );
  });

  it.each([
    [
      { kind: 'stale-version', currentRev: 9 } as ServiceError,
      'These codes were changed elsewhere',
      'Nothing was saved and your codes are still here. Check them and save again.',
      false,
    ],
    [
      { kind: 'policy-open', decision: 'CC-06' } as ServiceError,
      'These codes can’t be saved yet',
      'Whether you can change platform codes for these courses hasn’t been decided yet. Nothing was saved.',
      false,
    ],
    [
      { kind: 'not-permitted', why: 'wrong-workspace' } as unknown as ServiceError,
      'We couldn’t save the codes',
      'Nothing has changed. Your edits are still in the table. Try again.',
      true,
    ],
  ])(
    'a save refused (%o) says so calmly and keeps the typed code',
    async (error, title, line, retry) => {
      const user = userEvent.setup();
      const { runtime } = await tabPlatform(KAVYA, 'spine-start');
      answerSaveWith(runtime, async () => ({ ok: false as const, error }));
      show(runtime, <CourseCodes />, '/content-manager/course-codes');
      await waitFor(async () => expect(await tableRows()).toHaveLength(6));
      await user.type(codeField('Fluid Mechanics'), 'ME ZG541');
      await user.click(screen.getByRole('button', { name: 'Save codes' }));
      const notice = await screen.findByRole('alert');
      expect(notice).toHaveClass('rk-errsum');
      expect(notice).toHaveTextContent(title);
      expect(notice).toHaveTextContent(line);
      expect(notice.textContent).not.toMatch(/CC-06/);
      expect(within(notice).queryByRole('button', { name: 'Try again' }) !== null).toBe(retry);
      await waitFor(() => expect(notice).toHaveFocus());
      expect(codeField('Fluid Mechanics')).toHaveValue('ME ZG541');
      expect(footerStatus()).toHaveTextContent('1 change not saved');
    },
  );

  it('loading: no figures; couldn’t load: Try again reads again and focuses the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('PlatformCourseCodeService.list');
    bare(runtime, <CourseCodes />, '/content-manager/course-codes');
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading the course codes…');
    expect(document.querySelector('dl.rb-figs')).toBeNull();
    expect(screen.getByRole('region', { name: 'Courses' })).toHaveTextContent(
      'Each code must be unique.',
    );
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the course codes');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Course codes' })).toHaveFocus();
    await waitFor(async () => expect(await tableRows()).toHaveLength(6));
  });
});
