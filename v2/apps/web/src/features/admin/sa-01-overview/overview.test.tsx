/**
 * SA-01 Overview in the V3 design (the Super Admin export `sa-views-a.js` `V.overview`) on the real
 * composition root and the sample world, as Arjun Mehta: the two figures, the category switch, the
 * priority band and the queue are the service's answer (`getSuperAdminOverview`, PC-67) — every
 * count the service's, every row in the service's order, every item shown once and opening the
 * page where it is handled — and the loading, failed and calm states. Rows are named by
 * institution, content or person, never by an internal reference. (Moved here, in V3 markup, from
 * the Package 1D and Phase 6 suites `institutions.test.tsx` and `content-oversight.test.tsx`.)
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults, visitorPorts } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { saExport } from '@/test-support/boards';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../../shared/workspace-frame/workspace-frame';
import { Overview } from './overview';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const VIEWS = saExport('sa-views-a.js');
const CORE = saExport('sa-core.js');

function inAdmin(runtime: PlatformRuntime) {
  const navigation = testNavigation('/admin');
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        <Overview />
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

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

async function overviewOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.operations.getSuperAdminOverview();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** The queue's groups on show, by their headings. */
const groupNames = () =>
  [...main().querySelectorAll('section.rb-g h3.rb-g-name')].map((heading) => text(heading));

/** One row of the queue, by its title: its line, its wait, its action. */
function rowOf(title: string) {
  const row = [...main().querySelectorAll('li.rb-row')].find(
    (candidate) => text(candidate.querySelector('.rb-row-t')) === title,
  );
  if (!row) throw new Error(`no row ${title}`);
  return {
    line: text(row.querySelector('.rb-row-d')),
    when: text(row.querySelector('.rb-row-when')),
    link: row.querySelector('a.rb-btn')!,
  };
}

/** The category switch's buttons, as "<label> <count>". */
const switchOptions = () =>
  within(screen.getByRole('group', { name: 'Show what is waiting' }))
    .getAllByRole('button')
    .map((button) => text(button));

describe('SA-01 — the head, the figures and the switch (after-flow-e, 23 Oct 2026)', () => {
  it('the H1, today’s date, the two figures and every category with its count', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime);
    await screen.findByRole('group', { name: 'Show what is waiting' });
    const title = screen.getByRole('heading', { level: 1, name: 'Overview' });
    expect(title).toHaveClass('rb-h1');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.rb-eyebrow-date')).toHaveTextContent('Friday 23 October 2026');
    const overview = await overviewOf(runtime);
    const figures = main().querySelector('dl.rb-figs')!;
    expect(figures).toHaveAttribute('aria-label', 'Platform at a glance');
    expect([...figures.querySelectorAll('.rb-fig')].map(text)).toEqual([
      `Active institutions ${overview.figures.activeInstitutions} Access active or ending soon. ${overview.figures.paused} paused, ${overview.figures.awaitingPayment} awaiting payment.`,
      `Published experiments ${overview.figures.publishedExperiments} Live in the catalogue today`,
    ]);
    expect(overview.figures).toMatchObject({
      activeInstitutions: 4,
      paused: 1,
      awaitingPayment: 1,
      publishedExperiments: 13,
    });
    // Every category counts its groups' items, each item once (the service's counts).
    const setup =
      overview.institutionsWithoutAdmin.count +
      overview.stuckContent.count +
      overview.holdersWithoutScope.count;
    const total =
      overview.requests.count +
      overview.updates.count +
      overview.deviceTransfers.count +
      overview.support.count +
      overview.accessEnding.count +
      setup;
    expect(switchOptions()).toEqual([
      `All ${total}`,
      `Requests ${overview.requests.count}`,
      `Corrections ${overview.updates.count}`,
      `Device transfers ${overview.deviceTransfers.count}`,
      `Support ${overview.support.count}`,
      `Access ending ${overview.accessEnding.count}`,
      `Set-up gaps ${setup}`,
    ]);
    expect(screen.getByRole('button', { name: `All ${total}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const words of [
      'Platform at a glance',
      'Active institutions',
      'Access active or ending soon.',
      'Published experiments',
      'Live in the catalogue today',
      'Show what is waiting',
      "['setup', 'Set-up gaps', ['noia', 'stuck', 'scope']]",
    ]) {
      expect(VIEWS).toContain(words);
    }
  });
});

describe('SA-01 — All: the priority band, then the rest of the queue', () => {
  it('the band: access ending soonest first, then the correction waiting longest, each shown once', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime);
    const band = await screen.findByRole('region', { name: 'Needs attention first' });
    expect(band).toHaveClass('rb-prio');
    expect(band.querySelector('.rb-note')).toHaveTextContent(
      'Soonest deadline first, then the longest wait',
    );
    const items = [...band.querySelectorAll('li.rb-pi')].map((item) => ({
      when: text(item.querySelector('.rb-pi-when')),
      kind: text(item.querySelector('.rb-pi-kind')),
      title: text(item.querySelector('.rb-pi-title')),
      line: text(item.querySelector('.rb-pi-d')),
      action: item.querySelector('a.rb-btn')!,
    }));
    expect(items.map(({ when, kind, title, line }) => ({ when, kind, title, line }))).toEqual([
      {
        when: '31 Oct In 8 days',
        kind: 'Access ending',
        title: 'BITS Pilani — Hyderabad Campus',
        line: 'Its renewal request has been under review since 26 September.',
      },
      {
        when: '2 Nov In 10 days',
        kind: 'Access ending',
        title: 'Konark Polytechnic',
        line: 'The reminder is due. Nothing is sent from here.',
      },
      {
        when: '1 day Waiting since 22 Oct',
        kind: 'Correction waiting for release',
        title: 'Distillation Column correction',
        line: 'Version 1.3 was approved by the Academic Reviewer on 22 October. Version 1.2 is still live.',
      },
    ]);
    expect(items.map(({ action }) => action.getAttribute('href'))).toEqual([
      '/admin/requests/REQ-0038',
      '/admin/operations/access-ending',
      '/admin/content/updates/UPD-0005',
    ]);
    expect(items.map(({ action }) => action.getAttribute('aria-label'))).toEqual([
      'Open the renewal request from BITS Pilani — Hyderabad Campus',
      'View access ending for Konark Polytechnic',
      'Review the Distillation Column correction',
    ]);
    // The first item is the page's one primary action.
    expect(items[0]!.action).toHaveClass('rb-btn--primary');
    expect(items[1]!.action).not.toHaveClass('rb-btn--primary');
    // Shown in the band, those items leave their groups: Corrections and Access ending are gone.
    expect(screen.getByRole('heading', { level: 2, name: 'Also waiting on you' })).toBeVisible();
    expect(groupNames()).toEqual([
      'Requests',
      'Device transfers',
      'Support reports',
      'Institutions without an Institute Admin',
      'Stuck content',
      'Role holders without scope',
    ]);
    for (const words of [
      'Needs attention first',
      'Soonest deadline first, then the longest wait',
      'Also waiting on you',
      'Correction waiting for release',
      'Its renewal request has been under review since ',
      'The reminder is due. Nothing is sent from here.',
    ]) {
      expect(`${VIEWS}\n${CORE}`).toContain(words);
    }
  });

  it('every row in the export’s words, each opening the page where it is handled', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime);
    await screen.findByRole('region', { name: 'Requests' });
    const expectations: readonly (readonly [string, string, string, string, string, string])[] = [
      [
        'Konark Polytechnic asks for additional licences',
        'Additional licences for Buck Converter Ripple.',
        '24 days since 29 Sep',
        'Open request',
        'Open the additional licences request from Konark Polytechnic',
        '/admin/requests/REQ-0040',
      ],
      [
        'BITS Pilani — Hyderabad Campus asks to renew its access',
        'Renewal for 2 experiments. Access ends on 31 October.',
        '27 days since 26 Sep',
        'Open request',
        'Open the renewal request from BITS Pilani — Hyderabad Campus',
        '/admin/requests/REQ-0038',
      ],
      [
        'VR device transfer for Rahul Verma',
        'Godavari Institute of Technology. Forwarded by its Institute Admin.',
        'Today 23 Oct',
        'Review transfer',
        'Review the VR device transfer for Rahul Verma',
        '/admin/operations/device-transfers/DTR-0018',
      ],
      [
        'The preview of the WEB delivery link showed an empty frame',
        'Kavya Nair, Content Manager',
        '17 days reopened 6 Oct',
        'Open report',
        'Open the report: The preview of the WEB delivery link showed an empty frame',
        '/admin/operations/support/SUP-0207',
      ],
      [
        'The VR simulation stopped loading at the second step',
        'Rahul Verma, Student',
        '7 days sent 16 Oct',
        'Open report',
        'Open the report: The VR simulation stopped loading at the second step',
        '/admin/operations/support/SUP-0213',
      ],
      [
        'Sahyadri Institute of Engineering has no Institute Admin',
        'Access active since 30 September. Nobody there can give students access.',
        '23 days since 30 Sep',
        'Assign Institute Admin',
        'Assign an Institute Admin to Sahyadri Institute of Engineering',
        '/admin/institutions/sahyadri',
      ],
      [
        'DC Motor Speed Control is stuck in review',
        'EEE ZC341. With the Academic Reviewer since 2 October; no reviewer has this course in scope.',
        '21 days since 2 Oct',
        'Open in All content',
        'Open DC Motor Speed Control in All content',
        '/admin/content/records/SUB-0085',
      ],
      [
        'Dr K. Iyer has no scope yet',
        'Academic Reviewer, registered 20 October. Can’t act on anything yet.',
        '3 days since 20 Oct',
        'Assign scope',
        'Assign scope to Dr K. Iyer',
        '/admin/roles/role-0001',
      ],
    ];
    for (const [title, line, when, action, name, href] of expectations) {
      const row = rowOf(title);
      expect(row.line, title).toBe(line);
      expect(row.when, title).toBe(when);
      expect(row.link).toHaveTextContent(action);
      expect(row.link).toHaveClass('rb-btn', 'rb-btn--ghost');
      expect(row.link).toHaveAccessibleName(name);
      expect(row.link).toHaveAttribute('href', href);
    }
    // The export's forms for its own sample rows.
    for (const words of [
      'Konark Polytechnic asks for 60 more licences',
      'Additional licences for Buck Converter Ripple.',
      ' asks to renew its access',
      'Forwarded by its Institute Admin.',
      ' has no Institute Admin',
      'Nobody there can give students access.',
      ' is stuck in review',
      '; no reviewer has this course in scope.',
      ' has no scope yet',
      'Can’t act on anything yet.',
      'Review correction',
      'Review transfer',
      'Open report',
      'Assign Institute Admin',
      'Open in All content',
      'Assign scope',
    ]) {
      expect(`${CORE}\n${saExport('sa-data.js')}`).toContain(words);
    }
    // The group links go to each list.
    expect(
      within(screen.getByRole('region', { name: 'Requests' })).getByRole('link', {
        name: 'Open Requests',
      }),
    ).toHaveAttribute('href', '/admin/requests');
    // Links that share a name go to the same place (the renewal request is both the ending
    // access's next step and a request); no internal reference is shown or named.
    const links = within(main()).getAllByRole('link');
    const names = links.map((link) => link.getAttribute('aria-label') ?? text(link));
    const destinations = new Map<string, Set<string>>();
    links.forEach((link, index) => {
      const places = destinations.get(names[index]!) ?? new Set<string>();
      places.add(link.getAttribute('href') ?? '');
      destinations.set(names[index]!, places);
    });
    for (const [name, places] of destinations) expect([...places], name).toHaveLength(1);
    expect(main().textContent).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d/);
    expect(names.join(' ')).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d/);
  });

  it('the Requests group: the requests under review, newest first, with the rail’s figure', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime);
    const group = await screen.findByRole('region', { name: 'Requests' });
    const underReview = await runtime.ports.accessRequests.listRequests({
      status: 'under-review',
      sort: 'received-newest',
    });
    if (!underReview.ok) throw new Error('list');
    const expected = underReview.value.slice(0, 4);
    expect(expected.length).toBeGreaterThan(0);
    const opens = within(group).getAllByRole('link', { name: /^Open the .* request from / });
    expect(opens.map((link) => link.getAttribute('href'))).toEqual(
      expected.map((row) => `/admin/requests/${row.id}`),
    );
    expect(screen.getByRole('button', { name: /^Requests \d+$/ })).toHaveTextContent(
      `Requests ${underReview.value.length}`,
    );
    // The rail counts the same read.
    expect(document.querySelector('aside .rb-count .xr-sr')).toHaveTextContent(
      `${underReview.value.length} requests under review`,
    );
  });

  it('shows at most four rows of a group; the switch counts every item', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    for (const name of ['Narmada A', 'Narmada B', 'Narmada C', 'Narmada D']) {
      await act(async () => {
        const visitor = visitorPorts(sample);
        const added = visitor.selection.add({
          experimentId: 'shell-and-tube-heat-exchanger' as never,
          formats: ['web'],
        });
        if (!added.ok) throw new Error(added.error.kind);
        const sent = await visitor.accessRequests.submitPublicRequest({
          institutionName: name,
          contactPerson: 'R. Rao',
          email: 'r.rao@narmada.edu.in',
          phone: null,
          licencesRequested: '40',
          message: null,
          term: { kind: 'yearly' },
        });
        if (!sent.ok) throw new Error(sent.error.kind);
      });
    }
    inAdmin(runtime);
    const group = await screen.findByRole('region', { name: 'Requests' });
    await waitFor(() => expect(group.querySelectorAll('li.rb-row')).toHaveLength(4));
    const count = (await overviewOf(runtime)).requests.count;
    expect(count).toBeGreaterThan(4);
    expect(screen.getByRole('button', { name: /^Requests \d+$/ })).toHaveTextContent(
      `Requests ${count}`,
    );
  });
});

describe('SA-01 — choosing a category', () => {
  it('shows only its groups, says how many items, and a group with nothing in it says so', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    // No request under review: REQ-0040 and REQ-0038 wait for information.
    for (const id of ['REQ-0040', 'REQ-0038']) {
      const page = await runtime.ports.accessRequests.getRequestForDecision(id as never);
      if (!page.ok) throw new Error(id);
      const asked = await runtime.ports.accessRequests.requestMoreInformation({
        id: page.value.request.id,
        reason: 'Please confirm the student numbers.',
        expectedRev: page.value.request.rev,
      });
      expect(asked.ok).toBe(true);
    }
    inAdmin(runtime);
    await screen.findByRole('group', { name: 'Show what is waiting' });
    // All: a group with nothing in it is left out.
    expect(groupNames()).not.toContain('Requests');
    const user = userEvent.setup();
    const requests = screen.getByRole('button', { name: 'Requests 0' });
    await user.click(requests);
    expect(requests).toHaveAttribute('aria-pressed', 'true');
    expect(requests).toHaveFocus();
    expect(screen.getByRole('heading', { level: 2, name: 'Requests, 0 items' })).toHaveClass(
      'xr-sr',
    );
    expect(main().querySelector('.rb-switchbar [role="status"]')).toHaveTextContent(
      'Requests, 0 items',
    );
    expect(groupNames()).toEqual(['Requests']);
    const quiet = screen.getByRole('region', { name: 'Requests' }).querySelector('p.sa-quietrow');
    expect(quiet).toHaveTextContent('No request is waiting for your decision.');
    expect(screen.queryByRole('region', { name: 'Needs attention first' })).toBeNull();
    // Set-up gaps: its three groups, each with its rows or its quiet line.
    await user.click(screen.getByRole('button', { name: /^Set-up gaps \d+$/ }));
    expect(groupNames()).toEqual([
      'Institutions without an Institute Admin',
      'Stuck content',
      'Role holders without scope',
    ]);
    for (const words of [
      'No request is waiting for your decision.',
      'Every institution with access has an Institute Admin.',
      'Nothing is stuck in the content workflow.',
      'Every role holder has a scope.',
    ]) {
      expect(VIEWS).toContain(words);
    }
  });
});

describe('SA-01 — loading, failed, nothing waiting', () => {
  it('loading in the queue; a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('OperationsService.getSuperAdminOverview');
    renderInTab(<Overview />, { runtime, navigation: testNavigation('/admin') });
    const loading = await screen.findByText('Loading what is waiting…');
    expect(loading).toHaveClass('rk-loading-msg');
    expect(loading.closest('section.rb-queue')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    const failed = await screen.findByRole('alert');
    expect(failed.closest('section.rb-queue')).not.toBeNull();
    expect(failed).toHaveTextContent('We couldn’t load what is waiting');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    expect(VIEWS).toContain('We couldn’t load what is waiting');
    expect(VIEWS).toContain('Loading what is waiting…');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Requests' })).toBeVisible();
  });

  it('nothing waiting: the calm block under the switch, the figures kept', async () => {
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
    inAdmin(runtime);
    const calm = await screen.findByRole('region', { name: 'Nothing is waiting' });
    expect(calm).toHaveClass('rb-queue');
    const line =
      'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.';
    expect(text(calm.querySelector('.rb-calm-d'))).toBe(line);
    expect(VIEWS).toContain(line);
    expect(main().querySelector('dl.rb-figs')).not.toBeNull();
    expect(switchOptions()).toEqual([
      'All 0',
      'Requests 0',
      'Corrections 0',
      'Device transfers 0',
      'Support 0',
      'Access ending 0',
      'Set-up gaps 0',
    ]);
    expect(main().querySelectorAll('section.rb-g')).toHaveLength(0);
    expect(screen.queryByRole('region', { name: 'Needs attention first' })).toBeNull();
  });
});

describe('SA-01 — after a decision elsewhere in the session', () => {
  it('a support report resolved by the Super Admin leaves the queue', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime);
    await screen.findByRole('region', { name: 'Support reports' });
    const before = (await overviewOf(runtime)).support;
    const report = before.rows[0]!;
    const resolved = await asPersonId(sample, SUPER_ADMIN).operations.resolveReport({
      id: report.id,
      note: 'Fixed in the preview service.',
      expectedRev: report.rev,
    });
    if (!resolved.ok) throw new Error(resolved.error.kind);
    await act(() => runtime.invalidate(resolved.changed));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Support \d+$/ })).toHaveTextContent(
        `Support ${before.count - 1}`,
      ),
    );
  });
});
