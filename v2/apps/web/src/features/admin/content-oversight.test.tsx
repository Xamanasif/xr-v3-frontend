/**
 * Phase 6 content oversight on the real composition root and the sample world, as Arjun Mehta:
 * SA-01 Overview in full (B7-01 f0 … f3; B7-10 f15), SA-12 Content › All content (B7-06 f0, f7)
 * and SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6). Every figure, group, row, status and
 * refusal is the ports' answer: the Overview's groups agree with the lists they open, All content
 * counts what `listAllContent` answers, and the override moves a stuck record back to the vendor
 * only through `overrideStatus` (a reason required, the revision the page showed, the service
 * deciding). The fixture `after-flow-e` is the B7 boards' day (23 Oct 2026).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { Overview } from './sa-01-overview/overview';
import { overviewGroups } from './sa-01-overview/overview-view';
import { AllContent } from './sa-12-all-content/all-content';
import { ContentRecord } from './sa-13-content-record/content-record';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const B7_01 = board('B7-01-SA-Overview.dc.html');
const B7_06 = board('B7-06-All-Content.dc.html');
const RITU = 'per-ritu-sharma';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

/** The page's main region (the document body where a test renders a page without its shell). */
const main = (): HTMLElement => screen.queryByRole('main') ?? document.body;
/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null | undefined): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });

async function overviewOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.operations.getSuperAdminOverview();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-01 Overview (B7-01) -------------------------------------------------------------------

describe('SA-01 Overview — the full overview (B7-01 f0, f3)', () => {
  it('the header line, the two figures and the eight groups in the drawn order', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, '/admin', <Overview />);
    const requests = await screen.findByRole('region', { name: /^Requests/ });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(text(main().querySelector('.xr-overline'))).toBe('Super Admin · Arjun Mehta');
    const overview = await overviewOf(runtime);
    const groups = overviewGroups(overview);
    const items = groups.reduce((sum, group) => sum + group.count, 0);
    // The sum of the service's counts and today on the sample clock (B7-01 f0).
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      `${items} items waiting across ${groups.length} groups · 23 Oct 2026`,
    );
    expect(groups).toHaveLength(8);
    const figures = screen.getByRole('region', { name: 'Platform at a glance' });
    expect([...figures.querySelectorAll('.xd-fig')].map(text)).toEqual([
      `${overview.figures.activeInstitutions} Active institutions Access active or ending soon · ${overview.figures.paused} paused · ${overview.figures.awaitingPayment} awaiting payment`,
      `${overview.figures.publishedExperiments} Published experiments Live in the catalogue today`,
    ]);
    expect(overview.figures).toMatchObject({
      activeInstitutions: 4,
      paused: 1,
      awaitingPayment: 1,
      publishedExperiments: 13,
    });
    const heads = [...main().querySelectorAll('section.xd-group h2')].map(text);
    expect(heads).toEqual([
      `Requests ${overview.requests.count}`,
      `Corrections waiting for your release decision ${overview.updates.count}`,
      `Device transfers ${overview.deviceTransfers.count}`,
      `Support reports ${overview.support.count}`,
      `Access ending within 15 days ${overview.accessEnding.count}`,
      `Institutions without an Institute Admin ${overview.institutionsWithoutAdmin.count}`,
      `Stuck content ${overview.stuckContent.count}`,
      `Role holders without scope ${overview.holdersWithoutScope.count}`,
    ]);
    for (const head of heads) expect(B7_01).toContain(head.replace(/ \d+$/, ' '));
    expect(within(requests).getByRole('link', { name: 'Open Requests' })).toHaveAttribute(
      'href',
      '/admin/requests',
    );
  });

  it('every row as B7-01 words it, each opening the page where it is handled', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, '/admin', <Overview />);
    await screen.findByRole('region', { name: /^Requests/ });
    const rowOf = (title: string) => {
      const row = [...main().querySelectorAll('.xr-row')].find(
        (candidate) => text(candidate.querySelector('.xr-row-title')) === title,
      );
      if (!row) throw new Error(`no row ${title}`);
      return {
        sub: text(row.querySelector('.xr-row-sub')),
        link: row.querySelector('a.xr-btn--secondary')!,
      };
    };
    const expectations: readonly (readonly [string, string, string, string])[] = [
      [
        'REQ-0038 · BITS Pilani — Hyderabad Campus',
        'Renewal · under review since 26 Sep 2026 · access ends 31 Oct 2026',
        'Open',
        '/admin/requests/REQ-0038',
      ],
      [
        'REQ-0040 · Konark Polytechnic',
        'Additional licences · under review since 29 Sep 2026',
        'Open',
        '/admin/requests/REQ-0040',
      ],
      [
        'UPD-0005 · Distillation Column 1.2 → 1.3',
        'Approved by the Academic Reviewer on 22 Oct 2026 · version 1.2 is live',
        'Review',
        '/admin/content/updates/UPD-0005',
      ],
      [
        'DTR-0018 · Rahul Verma · VR',
        'Godavari Institute of Technology · forwarded 23 Oct 2026',
        'Review',
        '/admin/operations/device-transfers/DTR-0018',
      ],
      [
        'SUP-0207 · The preview of the WEB delivery link showed an empty frame',
        'Kavya Nair · Content Manager · reopened 6 Oct 2026',
        'Open',
        '/admin/operations/support/SUP-0207',
      ],
      [
        'SUP-0213 · The VR simulation stopped loading at the second step',
        'Rahul Verma · Student · sent 16 Oct 2026',
        'Open',
        '/admin/operations/support/SUP-0213',
      ],
      [
        'BITS Pilani — Hyderabad Campus · ends 31 Oct 2026',
        'Renewal in progress — REQ-0038',
        'Open',
        '/admin/operations/access-ending',
      ],
      [
        'Konark Polytechnic · ends 2 Nov 2026',
        'Reminder due — nothing is sent from here',
        'Open',
        '/admin/operations/access-ending',
      ],
      [
        'Sahyadri Institute of Engineering',
        'Access active since 30 Sep 2026 — nobody can give students access',
        'Assign',
        '/admin/institutions/sahyadri',
      ],
      [
        'SUB-0085 · DC Motor Speed Control · EEE ZC341',
        'With the Academic Reviewer since 2 Oct 2026 — no reviewer has EEE ZC341 in scope',
        'Open',
        '/admin/content/records/SUB-0085',
      ],
      [
        'Dr K. Iyer · Academic Reviewer',
        'Registered 20 Oct 2026 — can’t act on anything yet',
        'Assign scope',
        '/admin/roles/role-0001',
      ],
    ];
    for (const [title, sub, action, href] of expectations) {
      const row = rowOf(title);
      expect(row.sub, title).toBe(sub);
      expect(row.link).toHaveTextContent(action);
      expect(row.link).toHaveAttribute('href', href);
      expect(row.link).toHaveAccessibleName(`${action}: ${title}`);
    }
    // B7-01's own words where the sample matches the board.
    for (const words of [
      'REQ-0040 · Konark Polytechnic',
      'Additional licences · under review since 29 Sep 2026',
      'Renewal in progress — REQ-0038',
      'Reminder due — nothing is sent from here',
      'Access active since 30 Sep 2026 — nobody can give students access',
      'With the Academic Reviewer since 2 Oct 2026 — no reviewer has EEE ZC341 in scope',
      'Registered 20 Oct 2026 — can’t act on anything yet',
      'Godavari Institute of Technology · forwarded 23 Oct 2026',
      'Kavya Nair · Content Manager · reopened 6 Oct 2026',
    ]) {
      expect(B7_01).toContain(words);
    }
    // No two links on the page share a name (the demonstration specs click rows by name).
    const names = within(main())
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label') ?? text(link));
    expect(new Set(names).size).toBe(names.length);
  });

  it('a group with nothing in it is left out (spine-start)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, '/admin', <Overview />);
    await screen.findByRole('region', { name: /^Requests/ });
    const overview = await overviewOf(runtime);
    const shown = overviewGroups(overview).map((group) => group.title);
    expect(shown).toEqual([
      'Requests',
      'Access ending within 15 days',
      'Institutions without an Institute Admin',
      'Stuck content',
    ]);
    expect(
      [...main().querySelectorAll('section.xd-group h2')].map((node) =>
        text(node).replace(/ \d+$/, ''),
      ),
    ).toEqual(shown);
  });

  it('at most four rows, the count the service’s (B7-01 caption)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    // Three more open reports, from Ritu Sharma and Rahul Verma: five open in all.
    for (const [person, what] of [
      [RITU, 'The editor lost the second learning outcome.'],
      ['per-0002', 'The AR model did not load on my phone.'],
      [RITU, 'The preview link check took a long time.'],
    ] as const) {
      const sent = await asPersonId(sample, person).operations.reportProblem({
        whatHappened: what,
        where: null,
        screenshotFileName: null,
      } as never);
      expect(sent.ok, JSON.stringify(sent)).toBe(true);
    }
    inAdmin(runtime, '/admin', <Overview />);
    const support = await screen.findByRole('region', { name: /^Support reports/ });
    expect(support.querySelectorAll('.xr-row')).toHaveLength(4);
    expect(Number(text(support.querySelector('.xd-gn')))).toBe(5);
  });

  it('nothing waiting: the calm state, the two figures kept (B7-01 f1, B7-10 f15)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const real = await runtime.ports.operations.getSuperAdminOverview();
    if (!real.ok) throw new Error(real.error.kind);
    const empty = { count: 0, rows: [] };
    // A state sample: every group empty (the screen's handling of such an answer).
    vi.spyOn(runtime.ports.operations, 'getSuperAdminOverview').mockResolvedValue({
      ...real,
      value: {
        figures: real.value.figures,
        requests: empty,
        updates: empty,
        deviceTransfers: empty,
        support: empty,
        accessEnding: empty,
        institutionsWithoutAdmin: empty,
        stuckContent: empty,
        holdersWithoutScope: empty,
      },
    });
    inAdmin(runtime, '/admin', <Overview />);
    const calm = await screen.findByRole('region', { name: 'Waiting on you' });
    expect(
      within(calm).getByRole('heading', { level: 3, name: 'Nothing is waiting' }),
    ).toBeVisible();
    const line =
      'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.';
    expect(text(calm.querySelector('p'))).toBe(line);
    expect(B7_01).toContain(line);
    expect(screen.getByRole('region', { name: 'Platform at a glance' })).toBeVisible();
    expect(main().querySelectorAll('section.xd-group')).toHaveLength(0);
    expect(text(main().querySelector('.xr-phead-meta'))).toBe('23 Oct 2026');
  });

  it('announces its loading in the header (f2); a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('OperationsService.getSuperAdminOverview');
    renderInTab(<Overview />, { runtime, navigation: testNavigation('/admin') });
    expect(document.querySelector('.xr-phead-meta [role="status"]')).toHaveTextContent(
      'Loading what is waiting…',
    );
    expect(document.querySelectorAll('.xd-figs .xr-skel')).toHaveLength(4);
    const failed = await screen.findByText('What is waiting didn’t load. Nothing was lost.');
    expect(failed.closest('.xr-notice')).toHaveTextContent(
      'Try again. If it keeps happening, report the problem.',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: /^Requests/ })).toBeVisible();
  });
});

// ---- SA-12 Content › All content (B7-06 f0, f7) -----------------------------------------------

const tableRows = () => [
  ...main().querySelectorAll<HTMLTableRowElement>('table.xr-table tbody tr'),
];
const rowNamed = (name: string) =>
  tableRows().find((row) => text(row.querySelector('td strong')) === name);
const tab = (name: string) => screen.getByRole('tab', { name: new RegExp(`^${name}`) });

describe('SA-12 All content — the list is the service’s answer (B7-06 f0)', () => {
  it('the notices, the tabs with their figures, the count and the rows', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, '/admin/content/all', <AllContent />);
    await waitFor(() => expect(tableRows().length).toBeGreaterThan(0));
    expect(screen.getByRole('heading', { level: 1, name: 'Content' })).toBeVisible();
    const subnav = screen.getByRole('navigation', { name: 'Content' });
    expect(within(subnav).getByRole('link', { name: 'All content' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(subnav).getByRole('link', { name: 'Updates' })).toHaveAttribute(
      'href',
      '/admin/content/updates',
    );
    const all = await runtime.ports.production.listAllContent({});
    if (!all.ok) throw new Error('list');
    expect(all.value).toHaveLength(19);
    expect(screen.getAllByRole('tab').map(text)).toEqual([
      'All 19',
      'Stuck 1',
      'In the workflow 6',
      'Published 13',
    ]);
    expect(text(main().querySelector('.xr-toolbar-status [role="status"]'))).toBe(
      '19 of 19 records',
    );
    const notices = [...main().querySelectorAll('.xr-notice')].map(text);
    expect(notices[0]).toBe(
      '1 record stuck — nobody can act SUB-0085 · DC Motor Speed Control (EEE ZC341). Open the record to see why. Show stuck records',
    );
    expect(notices[1]).toBe(
      'A correction is waiting for your release decision UPD-0005 · Distillation Column 1.2 → 1.3 — approved by the Academic Reviewer. Open Updates',
    );
    for (const words of [
      "' stuck — nobody can act'",
      "'. Open the record to see why.'",
      "' · ' + r.name + ' (' + r.course + ')'",
      'A correction is waiting for your release decision',
      'UPD-0005 · Distillation Column 1.2 → 1.3 — approved by the Academic Reviewer.',
      'Every experiment and submission',
      'Read-only · open a record for its history',
    ]) {
      expect(B7_06).toContain(words);
    }
    expect(tableRows()).toHaveLength(19);
    const distillation = rowNamed('Distillation Column')!;
    expect(text(distillation.cells[1])).toBe(
      'Published Published · version 1.2 · live since 3 Jul 2026 Update UPD-0005 · approved — waiting for your release decision',
    );
    expect(text(distillation.cells[0])).toBe(
      'Distillation Column Published experiment · CHE ZG513 WEB VR',
    );
    expect(text(rowNamed('Boiler Drum Level')!.cells[1])).toContain('Update UPD-0004 · on hold');
    // UPD-0006 is returned: the service names no such update to the Super Admin (UPD-18).
    expect(text(rowNamed('Induction Motor Loading')!.cells[1])).toBe(
      'Published Published · version 1.0 · live since 9 Jun 2026',
    );
    const stuck = rowNamed('DC Motor Speed Control')!;
    expect(text(stuck.cells[0])).toBe('DC Motor Speed Control SUB-0085 · EEE ZC341 WEB');
    expect(text(stuck.cells[1])).toBe(
      'Stuck — nobody can act With the Academic Reviewer since 2 Oct 2026',
    );
    expect(text(stuck.cells[2])).toBe('Nobody — no Academic Reviewer has EEE ZC341 in scope');
    const open = within(stuck).getByRole('link', { name: 'Open DC Motor Speed Control' });
    expect(open).toHaveAttribute('href', '/admin/content/records/SUB-0085');
    expect(text(rowNamed('Venturi Meter Calibration')!.cells[1])).toBe(
      'With Academic Reviewer Back with the Academic Reviewer for a re-check since 25 Aug 2026',
    );
    expect(text(rowNamed('Forced Convection')!.cells[2])).toBe(
      'Anil Shetty · Northline Simulation Studio',
    );
    expect(
      within(rowNamed('Distillation Column')!).getByRole('link', {
        name: 'Open Distillation Column',
      }),
    ).toHaveAttribute('href', '/admin/content/records/distillation-column');
    expect(B7_06).toContain('Back with the Academic Reviewer for a re-check since 25 Aug 2026');
  });

  it('“Show stuck records” selects the Stuck tab (and the address mirrors it)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, '/admin/content/all', <AllContent />);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    await user.click(screen.getByRole('button', { name: 'Show stuck records' }));
    expect(tab('Stuck')).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(tab('Stuck')).toHaveFocus());
    expect(tableRows().map((row) => text(row.querySelector('strong')))).toEqual([
      'DC Motor Speed Control',
    ]);
    expect(navigation.replace).toHaveBeenLastCalledWith('/admin/content/all?show=stuck');
    expect(text(main().querySelector('.xr-toolbar-status [role="status"]'))).toBe(
      '1 of 19 records',
    );
    await user.click(tab('In the workflow'));
    expect(tableRows()).toHaveLength(6);
    await user.click(tab('Published'));
    expect(tableRows()).toHaveLength(13);
    expect(navigation.replace).toHaveBeenLastCalledWith('/admin/content/all?show=published');
  });

  it('no match: “No content matches” and one way back, Clear filters (f7)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, '/admin/content/all', <AllContent />);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    await user.type(screen.getByRole('searchbox', { name: 'Search content' }), 'Heat pump');
    await screen.findByRole('heading', { level: 3, name: 'No content matches' });
    expect(text(main().querySelector('.xr-toolbar-status [role="status"]'))).toBe(
      '0 of 19 records',
    );
    expect(main()).toHaveTextContent('Try another name, reference or course code.');
    expect(navigation.replace).toHaveBeenLastCalledWith('/admin/content/all?q=Heat+pump');
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    await user.click(clears[1]!);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    expect(navigation.replace).toHaveBeenLastCalledWith('/admin/content/all');
    // The search is the service's: a course code finds its records.
    await user.type(screen.getByRole('searchbox', { name: 'Search content' }), 'EEE ZC341');
    await waitFor(() => expect(tableRows()).toHaveLength(4));
  });

  it('opens on the view and search its address names; an unknown view is replaced', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, '/admin/content/all', <AllContent />, '?show=workflow&q=CHE');
    await waitFor(() => expect(tab('In the workflow')).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() =>
      expect(tableRows().map((row) => text(row.querySelector('strong')))).toEqual([
        'Packed Bed Pressure Drop',
        'Venturi Meter Calibration',
        'Flash Distillation',
      ]),
    );
    expect(screen.getByRole('searchbox', { name: 'Search content' })).toHaveValue('CHE');
  });

  it('an unknown view in the address names All and is replaced', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, '/admin/content/all', <AllContent />, '?show=archived');
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    expect(tab('All')).toHaveAttribute('aria-selected', 'true');
    expect(navigation.replace).toHaveBeenCalledWith('/admin/content/all');
  });

  it('no correction waiting: no notice (spine-start)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, '/admin/content/all', <AllContent />);
    await waitFor(() => expect(tableRows().length).toBeGreaterThan(0));
    expect(main()).not.toHaveTextContent('A correction is waiting for your release decision');
    expect(main()).toHaveTextContent('1 record stuck — nobody can act');
  });

  it('a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('ProductionService.listAllContent');
    renderInTab(<AllContent />, { runtime, navigation: testNavigation('/admin/content/all') });
    expect(document.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      'Loading all content',
    );
    await screen.findByText('We couldn’t load all content');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(tableRows()).toHaveLength(19));
  });
});

// ---- SA-13 Content record (B7-06 f1 … f6; B7-10 f5, f6) ---------------------------------------

function showRecord(runtime: PlatformRuntime, recordId: string) {
  return inAdmin(
    runtime,
    `/admin/content/records/${recordId}`,
    <ContentRecord recordId={recordId} />,
  );
}
const historyLines = () =>
  [...main().querySelectorAll('ol.xr-timeline > li')].map((item) => text(item));
const kv = () => text(main().querySelector('dl.xl-kv'));

describe('SA-13 Content record — stuck (B7-06 f1, f5; B7-10 f6)', () => {
  it('why nobody can act, the way to Platform roles and the override', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/admin/content/all');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'SUB-0085 · EEE ZC341 · Electrical Machines',
    );
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Stuck — nobody can act With the Academic Reviewer since 2 Oct 2026',
    );
    const notice = main().querySelector('.xr-notice--err')!;
    expect(text(notice)).toBe(
      'Stuck — nobody can act Nobody — no Academic Reviewer has EEE ZC341 in scope. It has been waiting since 2 Oct 2026. Open Platform roles Move status (override)',
    );
    expect(B7_06).toContain(
      'Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that isn’t possible.',
    );
    expect(main()).toHaveTextContent(
      'Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that isn’t possible.',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open Platform roles' }),
    ).toHaveAttribute('href', '/admin/roles?tab=reviewers');
    expect(kv()).toBe(
      'Summary Control the speed of a DC motor under load and compare armature and field control. Formats WEB Vendor Meridian Virtual Labs Who can act Nobody — no Academic Reviewer has EEE ZC341 in scope',
    );
    expect(historyLines()).toEqual([
      'No Academic Reviewer has EEE ZC341 in scope 2 Oct 2026 Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
      'Submitted for academic review 2 Oct 2026 Revision 1 · from Ritu Sharma, Meridian Virtual Labs',
    ]);
    expect(B7_06).toContain(
      'Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
    );
    expect(B7_06).toContain('Revision 1 · from Ritu Sharma, Meridian Virtual Labs');
    // The crumbs name the record.
    expect(text(screen.getByRole('list', { name: 'You are here' }))).toMatch(
      /Content\s*\/\s*All content\s*\/\s*DC Motor Speed Control/,
    );
  });

  it('Move status: a reason is required; the move returns it to the vendor (Vendor reads returned)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    await user.click(screen.getByRole('button', { name: 'Move status (override)' }));
    const dialog = screen.getByRole('dialog', { name: 'Move SUB-0085 out of review?' });
    expect(text(dialog.querySelector('dl'))).toBe(
      'From With Academic Reviewer — nobody can act To Returned to vendor — Ritu Sharma · Meridian Virtual Labs can change it and send it again',
    );
    expect(dialog).toHaveTextContent(
      'An override is recorded with your name and reason. Published is never offered — only the Content Manager publishes.',
    );
    const reason = within(dialog).getByRole('textbox', { name: 'Reason — kept in the history' });
    await waitFor(() => expect(reason).toHaveFocus());
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    await within(dialog).findByText('Add a reason — it is kept in the history');
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(B7_06).toContain('Add a reason — it is kept in the history');
    // Nothing moved.
    const still = await runtime.ports.production.getContentRecord({
      kind: 'SUB',
      id: 'SUB-0085',
    } as never);
    expect(still.ok && still.value.stuck).toBe(true);

    await user.type(reason, 'No reviewer for Electrical Machines until November.');
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    const flash = await screen.findByText(
      'SUB-0085 is now with the vendor. Ritu Sharma · Meridian Virtual Labs can act on it.',
    );
    await waitFor(() => expect(flash.closest('p')).toHaveFocus());
    await waitFor(() =>
      expect(text(main().querySelector('.xr-phead-meta'))).toBe(
        'Returned to vendor Moved back to the vendor on 23 Oct 2026 (Super Admin override)',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Move status (override)' })).toBeNull();
    expect(text(main().querySelector('.xr-notice'))).toBe(
      'In the workflow Who can act: Ritu Sharma · Meridian Virtual Labs. Nothing to do here.',
    );
    expect(historyLines()[0]).toBe(
      'Status moved by Arjun Mehta — override 23 Oct 2026, 10:05 “No reviewer for Electrical Machines until November.” From “With Academic Reviewer” to “Returned to vendor”.',
    );
    // The Vendor's record reads returned (the one supported move, OD-B7-09).
    const vendor = await asPersonId(sample, RITU).production.getRecord('SUB-0085' as never);
    expect(vendor.ok && vendor.value.submission.status.state).toBe('returned');
  });

  it('a record no longer stuck when the move is sent: nothing moves, the page says so', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    await user.click(screen.getByRole('button', { name: 'Move status (override)' }));
    const dialog = screen.getByRole('dialog', { name: 'Move SUB-0085 out of review?' });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Reason — kept in the history' }),
      'Nobody can review it.',
    );
    // Meanwhile (another tab) Dr K. Iyer is given EEE ZC341.
    const admin = asPersonId(sample, SUPER_ADMIN);
    const holder = await admin.platformRoles.getHolder('role-0001' as never);
    if (!holder.ok) throw new Error('holder');
    await act(async () => {
      const assigned = await admin.platformRoles.assignScope({
        holderId: 'role-0001',
        target: { kind: 'course', courseId: 'electrical-machines' },
        expectedRev: holder.value.holder.rev,
      } as never);
      expect(assigned.ok).toBe(true);
    });
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    await screen.findByText(
      'Nothing was moved: this record has moved on. Its current state is shown.',
    );
    await waitFor(() =>
      expect(text(main().querySelector('.xr-phead-meta'))).toBe(
        'With Academic Reviewer With the Academic Reviewer since 2 Oct 2026',
      ),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Move status (override)' })).toBeNull();
    const vendor = await asPersonId(sample, RITU).production.getRecord('SUB-0085' as never);
    expect(vendor.ok && vendor.value.submission.status.state).toBe('with-academic-reviewer');
  });

  it('a stale revision: nothing moves; the record is read again', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const stale: ServiceError = { kind: 'stale-version', currentRev: 99 } as ServiceError;
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        production: {
          ...ports.production,
          overrideStatus: async () => ({ ok: false, error: stale }),
        },
      } as typeof ports;
    });
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    await user.click(screen.getByRole('button', { name: 'Move status (override)' }));
    const dialog = screen.getByRole('dialog', { name: 'Move SUB-0085 out of review?' });
    await user.type(within(dialog).getByRole('textbox'), 'Stuck too long.');
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    await screen.findByText('This record changed since you opened it');
    expect(main()).toHaveTextContent(
      'Nothing was moved. It has been read again — check it, then decide again.',
    );
    expect(screen.getByRole('button', { name: 'Move status (override)' })).toBeVisible();
  });
});

describe('SA-13 Content record — published, read-only (B7-06 f2, f3, f6; B7-10 f5)', () => {
  it('update waiting for her: “Open the release decision”; no edit, no override (f2)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'distillation-column');
    await heading('Distillation Column');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'CHE ZG513 · Process Instrumentation & Control',
    );
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Published Published · version 1.2 · live since 3 Jul 2026',
    );
    expect(text(main().querySelector('p.xl-open'))).toBe(
      'Published · read-only. Published content changes only through a correction: Content Manager → Academic Reviewer → your release decision.',
    );
    expect(B7_06).toContain(
      'Published · read-only. Published content changes only through a correction',
    );
    const notice = main().querySelector('.xr-notice')!;
    expect(text(notice)).toBe(
      'Update UPD-0005 · approved — waiting for your release decision Version 1.2 stays live until you release it. Open the release decision',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open the release decision' }),
    ).toHaveAttribute('href', '/admin/content/updates/UPD-0005');
    expect(screen.queryByRole('button', { name: /Move status|Edit/ })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(kv()).toBe(
      'Summary Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag. Formats WEB VR Live version 1.2 · since 3 Jul 2026 Vendor Meridian Virtual Labs Who can act —',
    );
    expect([...main().querySelectorAll('ul.xv-los li')].map(text)).toEqual([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    expect(historyLines()).toEqual([
      'UPD-0005 approved by the Academic Reviewer — waiting for the release decision 22 Oct 2026 Correction 1.2 → 1.3. Version 1.2 stays live until it is released.',
      'Version 1.2 released 3 Jul 2026 Correction UPD-0002 — released by the Super Admin.',
      'Version 1.1 released 19 Jun 2026 Correction UPD-0001 — released by the Super Admin.',
      'Published · version 1.0 2 Jun 2026 By Kavya Nair, Content Manager.',
    ]);
    expect(B7_06).toContain('Correction 1.2 → 1.3. Version 1.2 stays live until it is released.');
  });

  it('update on hold: version 2.0 stays live; “Open Updates” (f6)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'boiler-drum-level');
    await heading('Boiler Drum Level');
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(text(notice)).toBe('Update UPD-0004 · on hold Version 2.0 stays live. Open Updates');
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open Updates' }),
    ).toHaveAttribute('href', '/admin/content/updates?show=on-hold');
    expect(kv()).toContain('Vendor —');
    expect(historyLines()[0]).toBe(
      'UPD-0004 put on hold by Arjun Mehta 20 Aug 2026 Version 2.0 stays live.',
    );
    expect(B7_06).toContain('UPD-0004 put on hold by Arjun Mehta');
  });

  it('published from SUB-0077: read-only, its review history (f3; B7-10 f5)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0077');
    await heading('Conduction Through a Composite Wall');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'SUB-0077 · ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(main().querySelectorAll('.xr-notice')).toHaveLength(0);
    expect(kv()).toBe(
      'Summary Measure the temperature profile across a three-layer wall and compare it with the series-resistance model. Formats WEB VR Live version 1.0 · since 23 Oct 2026 Vendor Northline Simulation Studio Who can act —',
    );
    expect(historyLines()).toEqual([
      'Published · version 1.0 23 Oct 2026 By Kavya Nair, Content Manager.',
      'Approved by Prof. A. Menon 22 Oct 2026 Academic review, revision 2.',
      'Resubmitted · revision 2 21 Oct 2026 From Anil Shetty, Northline Simulation Studio.',
      'Returned to the vendor by Prof. A. Menon 14 Oct 2026 Revision 1.',
      'Submitted for academic review 7 Oct 2026 Revision 1 · from Anil Shetty, Northline Simulation Studio',
    ]);
    for (const words of [
      'By Kavya Nair, Content Manager.',
      'Academic review, revision 2.',
      'From Anil Shetty, Northline Simulation Studio.',
      'Returned to the vendor by Prof. A. Menon',
    ]) {
      expect(B7_06).toContain(words);
    }
  });

  it('a returned correction is never named to her (UPD-0006, spine-start)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showRecord(runtime, 'induction-motor-loading');
    await heading('Induction Motor Loading');
    expect(main().querySelectorAll('.xr-notice')).toHaveLength(0);
    expect(main()).not.toHaveTextContent('UPD-0006');
  });
});

describe('SA-13 Content record — in the workflow; not found (B7-06 f4)', () => {
  it('someone can act: nothing to do here', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(text(main().querySelector('.xr-notice'))).toBe(
      'In the workflow Who can act: Prof. A. Menon · Academic Reviewer. Nothing to do here.',
    );
    expect(B7_06).toContain('Nothing to do here.');
    expect(screen.queryByRole('button', { name: 'Move status (override)' })).toBeNull();
    expect(historyLines()).toEqual([
      'Submitted for academic review 24 Aug 2026 Revision 1 · from Ritu Sharma, Meridian Virtual Labs',
    ]);
  });

  it('a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('ProductionService.getContentRecord');
    showRecord(runtime, 'SUB-0086');
    await screen.findByText('We couldn’t load this record');
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await heading('Flash Distillation');
  });

  it('an address that names no record shows the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});
