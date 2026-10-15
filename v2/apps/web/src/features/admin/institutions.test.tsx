/**
 * Package 1D on the real composition root and the sample world: SA-01 Overview (B7-01, its
 * Phase-1 Requests group), SA-06 Institutions (B7-02) and SA-07 Institution detail (B7-03, B7-04).
 * Every row, count, status and refusal is the ports' answer; the commands go out with the revision
 * the page read and their refusals write nothing. The fixture `after-flow-c` (27 Oct 2026) holds
 * the seven institutions as the B7 boards draw them on 23 Oct.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts } from '@xr/contracts/draft';
import { asPersonId, faults, visitorPorts } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { STRIPPED } from '@/copy/institutions';
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
import { Institutions } from './sa-06-institutions/institutions';
import { InstitutionDetail } from './sa-07-institution-detail/institution-detail';

afterEach(() => {
  forgetLastAddress();
});

const B7_01 = board('B7-01-SA-Overview.dc.html');
const B7_02 = board('B7-02-Institutions.dc.html');
const B7_03 = board('B7-03-Institution-Detail.dc.html');

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');

async function portRows(runtime: PlatformRuntime, tab = 'all') {
  const answer = await runtime.ports.institutions.listInstitutions({ tab: tab as 'all' });
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function detailOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.institutions.getInstitution(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-01 Overview (B7-01), the Phase-1 Requests group ---------------------------------------

describe('SA-01 — the Requests group is the requests under review (B7-01 f0, f3)', () => {
  it('lists them newest first, each opening its decision, with the sidebar’s figure', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime, '/admin', <Overview />);
    const group = await screen.findByRole('region', { name: /^Requests/ });
    const underReview = await runtime.ports.accessRequests.listRequests({
      status: 'under-review',
      sort: 'received-newest',
    });
    if (!underReview.ok) throw new Error('list');
    const expected = underReview.value.slice(0, 4);
    expect(expected.length).toBeGreaterThan(0);
    expect(within(group).getByRole('heading', { level: 2 })).toHaveTextContent(
      `Requests ${underReview.value.length}`,
    );
    const titles = [...group.querySelectorAll('.xr-row-title')].map((node) => node.textContent);
    expect(titles).toEqual(expected.map((row) => `${row.id} · ${row.institutionName}`));
    const opens = within(group).getAllByRole('link', { name: /^Open: / });
    expect(opens.map((link) => link.getAttribute('href'))).toEqual(
      expected.map((row) => `/admin/requests/${row.id}`),
    );
    expect(opens[0]).toHaveAccessibleName(`Open: ${titles[0]}`);
    expect(within(group).getByRole('link', { name: 'Open Requests' })).toHaveAttribute(
      'href',
      '/admin/requests',
    );
    const konark = [...group.querySelectorAll('.xr-row')].find((row) =>
      row.textContent!.includes('REQ-0040'),
    )!;
    // B7-01's own words for REQ-0040.
    expect(konark.querySelector('.xr-row-sub')).toHaveTextContent(
      'Additional licences · under review since 29 Sep 2026',
    );
    expect(B7_01).toContain('Additional licences · under review since 29 Sep 2026');
    // The sidebar counts the same read.
    const sidebarCount = document.querySelector('.xr-side .xr-count .xr-sr');
    expect(sidebarCount).toHaveTextContent(`${underReview.value.length} requests under review`);
    // Phase 1: no figures, no other group, no summary line (SA-01.scope).
    expect(main().querySelector('.xd-figs')).toBeNull();
    expect(main().querySelectorAll('section.xr-section')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Super Admin · Arjun Mehta');
    expect(main()).not.toHaveTextContent(/items waiting across/);
  });

  it('shows at most four rows (B7-01 caption)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    // Four more requests under review, sent from the public surface by visitors.
    for (const name of ['Narmada A', 'Narmada B', 'Narmada C', 'Narmada D']) {
      await act(async () => {
        await sendPublicRequest(visitorPorts(sample), name);
      });
    }
    inAdmin(runtime, '/admin', <Overview />);
    const group = await screen.findByRole('region', { name: /^Requests/ });
    await waitFor(() => expect(group.querySelectorAll('.xr-row')).toHaveLength(4));
    expect(within(group).getByRole('heading', { level: 2 }).textContent).toMatch(/^Requests \d+$/);
    expect(Number(group.querySelector('.xd-gn')!.textContent)).toBeGreaterThan(4);
  });

  it('“Nothing is waiting” when no request is under review (B7-01 f1, Phase-1 sentence)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
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
    inAdmin(runtime, '/admin', <Overview />);
    const calm = await screen.findByRole('region', { name: 'Waiting on you' });
    expect(
      within(calm).getByRole('heading', { level: 3, name: 'Nothing is waiting' }),
    ).toBeVisible();
    expect(calm).toHaveTextContent('Requests appear here when they need you.');
    expect(calm.querySelector('.xr-empty-icon.xr-x-empty-icon--ok')).not.toBeNull();
    expect(B7_01).toContain('Nothing is waiting');
    expect(B7_01).toContain('Waiting on you');
  });

  it('announces its loading in the header (B7-01 f2); a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    faults(sample).failNext('AccessRequestService.listRequests');
    renderInTab(<Overview />, { runtime, navigation: testNavigation('/admin') });
    const status = document.querySelector('.xr-phead-meta [role="status"]');
    expect(status).toHaveTextContent('Loading what is waiting…');
    expect(B7_01).toContain('Loading what is waiting…');
    expect(document.querySelectorAll('.xr-skel').length).toBeGreaterThan(0);
    const failed = await screen.findByText('What is waiting didn’t load. Nothing was lost.');
    expect(failed).toHaveClass('xr-notice-title');
    expect(failed.closest('.xr-notice')).toHaveTextContent(
      'Try again. If it keeps happening, report the problem.',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: /^Requests/ })).toBeVisible();
    expect(document.querySelector('.xr-phead-meta')).toBeNull();
  });
});

async function sendPublicRequest(ports: ProductPorts, institutionName: string) {
  const added = await ports.selection.add({
    experimentId: 'shell-and-tube-heat-exchanger' as never,
    formats: ['web'],
  });
  if (!added.ok) throw new Error('select');
  const sent = await ports.accessRequests.submitPublicRequest({
    institutionName,
    contactPerson: 'A. Person',
    email: 'a.person@example.edu.in',
    phone: null,
    licencesRequested: '10',
    message: null,
    term: { kind: 'yearly' },
  });
  if (!sent.ok) throw new Error(`send ${JSON.stringify(sent.error)}`);
}

// ---- SA-06 Institutions (B7-02) ---------------------------------------------------------------

async function tableRows(): Promise<HTMLTableRowElement[]> {
  await waitFor(() =>
    expect(document.querySelectorAll('main table.xr-table tbody tr').length).toBeGreaterThan(0),
  );
  return [...document.querySelectorAll<HTMLTableRowElement>('main table.xr-table tbody tr')];
}

const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);

describe('SA-06 — the list is the port’s answer (B7-02 f0)', () => {
  it('every institution, with B7-02’s columns, words and tab figures', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    const rows = await tableRows();
    const expected = await portRows(runtime);
    expect(rows.map((row) => row.querySelector('strong')!.textContent)).toEqual(
      expected.map((row) => row.name),
    );
    const byName = (name: string) =>
      cellsOf(rows.find((row) => row.querySelector('strong')!.textContent === name)!);
    expect(byName('Godavari Institute of Technology')).toEqual([
      'Godavari Institute of TechnologyExternal · ACC-0107 · 1 course · 1 experiment',
      'Access active',
      'Meera Iyer',
      'Ends 7 Oct 2027',
      'Open',
    ]);
    expect(byName('Vizag Polytechnic')).toEqual([
      'Vizag PolytechnicExternal · No access plan yet · 1 experiment requested',
      'Approved — payment required',
      'Not assigned',
      '—',
      'Open',
    ]);
    expect(byName('Sahyadri Institute of Engineering')[2]).toBe('Not assigned Needs one');
    expect(byName('Malnad College of Engineering').slice(1, 4)).toEqual([
      'Access ended',
      'V. Hegde',
      'Ended 15 Oct 2026',
    ]);
    expect(byName('Deccan Institute of Technology')[1]).toBe('Access paused');
    expect(byName('Konark Polytechnic')[1]).toBe('Ending soon');
    // B7-02's own row words.
    for (const words of [
      'No access plan yet',
      'Needs one',
      'Not assigned',
      'Institution, access plan or Institute Admin',
      'Created when a request is approved',
      'Every institution',
    ]) {
      expect(B7_02).toContain(words);
    }
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'All 7',
      'Access active 4',
      'Ending soon 2',
      'Paused 1',
      'Awaiting payment 1',
      'No Institute Admin 1',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      '7 of 7 institutions',
    );
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    // P1-14: the header line without its decision id; the board keeps it.
    expect(main()).toHaveTextContent(
      'Institutions are created only by approving a request — there is no direct creation',
    );
    expect(main()).not.toHaveTextContent('(T-09)');
    expect(B7_02).toContain(STRIPPED.noDirectCreation.drawn);
    // One "Open" per row, opening SA-07; no Create institution.
    const opens = screen.getAllByRole('link', { name: /^Open / });
    expect(opens.map((link) => link.getAttribute('href'))).toEqual(
      expected.map((row) => `/admin/institutions/${row.id}`),
    );
    expect(opens[0]).toHaveAccessibleName(`Open ${expected[0]!.name}`);
    expect(screen.queryByRole('button', { name: /create/i })).toBeNull();
  });

  it('a tab is the service’s answer; Clear filters goes back to All (B7-02 f2, f3)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    await user.click(screen.getByRole('tab', { name: 'No Institute Admin 1' }));
    await waitFor(() =>
      expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
        '1 of 7 institutions',
      ),
    );
    expect((await tableRows()).map((row) => row.querySelector('strong')!.textContent)).toEqual(
      (await portRows(runtime, 'no-institute-admin')).map((row) => row.name),
    );
    expect(screen.getByRole('tab', { name: 'No Institute Admin 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // ← → move between the tabs and select (board 12 "Patterns").
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Awaiting payment 1' })).toHaveFocus();
    await waitFor(() =>
      expect((document.querySelector('main tbody tr strong') as HTMLElement).textContent).toBe(
        'Vizag Polytechnic',
      ),
    );
    await user.click(screen.getByRole('tab', { name: 'Paused 1' }));
    await waitFor(() => expect(document.querySelectorAll('main tbody tr')).toHaveLength(1));
    expect(document.querySelector('main tbody tr strong')).toHaveTextContent(
      'Deccan Institute of Technology',
    );
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() =>
      expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
        '7 of 7 institutions',
      ),
    );
    expect(screen.getByRole('tab', { name: 'All 7' })).toHaveAttribute('aria-selected', 'true');
  });

  it('the search names an institution, a plan or an Institute Admin; no match has one way back (B7-02 f4)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    const search = screen.getByRole('searchbox', { name: 'Search institutions' });
    await user.type(search, 'kulkarni');
    await waitFor(() =>
      expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
        '1 of 7 institutions',
      ),
    );
    expect(document.querySelector('main tbody tr strong')).toHaveTextContent(
      'Deccan Institute of Technology',
    );
    // The tab figures do not follow the search (B7-02 script).
    expect(screen.getByRole('tab', { name: 'All 7' })).toBeVisible();
    await user.clear(search);
    await user.type(search, 'acc-0091');
    await waitFor(() =>
      expect(document.querySelector('main tbody tr strong')).toHaveTextContent(
        'Konark Polytechnic',
      ),
    );
    await user.clear(search);
    await user.type(search, 'Narmada');
    expect(await screen.findByRole('heading', { name: 'No institutions match' })).toBeVisible();
    expect(screen.getByText('Try another name or clear the filters.')).toBeVisible();
    expect(document.querySelector('main table')).toBeNull();
    expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      '0 of 7 institutions',
    );
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    // By keyboard: the button goes with the no-match state, and focus goes to the first row's
    // "Open" (as DataTable rescues it on SA-02), never to the page body.
    act(() => clears[1]!.focus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelectorAll('main tbody tr')).toHaveLength(7));
    expect(search).toHaveValue('');
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'Open Godavari Institute of Technology' }),
      ).toHaveFocus(),
    );
  });
});

describe('SA-06 after an SA-07 command in the same session', () => {
  it('the cached rows and tab figures show the change when the list is opened again', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    const list = inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    expect(screen.getByRole('tab', { name: 'Paused 1' })).toBeVisible();
    list.view.unmount();
    const detail = await openInstitution(runtime, 'konark');
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Licence review.');
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() => expect(flash()).toHaveTextContent('Access paused.'));
    detail.view.unmount();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    expect(await screen.findByRole('tab', { name: 'Paused 2' })).toBeVisible();
    const konark = (await tableRows()).find(
      (row) => row.querySelector('strong')!.textContent === 'Konark Polytechnic',
    )!;
    expect(konark).toHaveTextContent('Access paused');
  });
});

// ---- SA-07 Institution detail (B7-03, B7-04) -----------------------------------------------------

async function openInstitution(runtime: PlatformRuntime, id: string) {
  const rendered = inAdmin(
    runtime,
    `/admin/institutions/${id}`,
    <InstitutionDetail institutionId={id} />,
  );
  await screen.findByRole('heading', {
    level: 1,
    name: (await detailOf(runtime, id)).institution.name,
  });
  return rendered;
}

const region = (name: string) => screen.getByRole('region', { name });
const flash = () => main().querySelector<HTMLElement>('p.xa-save[role="status"]')!;

describe('SA-07 — the institution’s actual state (B7-03 f0 … f5)', () => {
  it('Godavari, access active: the drawn sections from the shared world', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'godavari');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(
      'External institution · access plan ACC-0107',
    );
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'Access activeInstitute Admin: Meera Iyer',
    );
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/admin/institutions');
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Institutions');
    // Access active: Pause only; no Assign, no Restore.
    expect(screen.getByRole('button', { name: 'Pause access' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Restore access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assign Institute Admin' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Open request REQ-0042' })).toHaveAttribute(
      'href',
      '/admin/requests/REQ-0042',
    );
    const summary = region('Institution summary');
    expect([...summary.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      'Status',
      'Internal or external',
      'Institute Admin',
      'Access plan',
      'People',
    ]);
    expect([...summary.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'Access active',
      'External',
      'Meera Iyer',
      'ACC-0107 · 120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027',
      '12 students · 3 Faculty',
    ]);
    const plans = region('Access plans');
    expect(plans).toHaveTextContent('Read-only');
    expect(cellsOf(plans.querySelector('tbody tr')!)).toEqual([
      'ACC-0107',
      'Shell-and-Tube Heat Exchanger · ME ZG523WEBVR',
      '120',
      'Yearly8 Oct 2026 – 7 Oct 2027',
      'Access active',
    ]);
    expect(plans).toHaveTextContent(STRIPPED.licenceNote.words);
    expect(plans).not.toHaveTextContent(/\(T-0[68]\)/);
    const report = region('Institution report');
    expect(report.querySelector('tbody tr td strong')).toHaveTextContent(
      'Shell-and-Tube Heat Exchanger',
    );
    expect(report).toHaveTextContent(/WEB\d+ started · \d+ completed/);
    expect(report).toHaveTextContent(STRIPPED.reportNote.words);
    expect(report).not.toHaveTextContent('Sample figures');
    const people = region('People');
    expect(people).toHaveTextContent(
      '12 students · 3 Faculty. The Institute Admin manages people; a status change here is an override with a reason.',
    );
    const students = within(people).getByRole('list', { name: 'Students' });
    expect(within(students).getAllByRole('listitem')).toHaveLength(12);
    const sneha = within(students)
      .getAllByRole('listitem')
      .find((item) => item.textContent!.includes('Sneha Reddy'))!;
    expect(sneha).toHaveTextContent('Sneha ReddyGIT-2026-0352Inactive');
    expect(
      within(sneha).getByRole('button', { name: 'Change status for Sneha Reddy' }),
    ).toBeVisible();
    const history = region('History');
    expect(history).toHaveTextContent('Newest first');
    const lines = [...history.querySelectorAll('.xr-tl-what')].map((node) => node.textContent);
    expect(lines.slice(-3)).toEqual([
      'Institute Admin assigned — Meera Iyer',
      'Access active · ACC-0107',
      'Request REQ-0042 approved — payment required',
    ]);
    expect(history).toHaveTextContent('Payment confirmed.');
    expect(B7_03).toContain('Institute Admin assigned — Meera Iyer');
    // The attention rows: REQ-0058, which Meera sent on 21 Oct, is under review.
    const attention = region('Needs attention');
    expect(attention.querySelector('.xr-row-title')).toHaveTextContent(
      'REQ-0058 additional licences — under review',
    );
    expect(within(attention).getByRole('link', { name: 'Requests' })).toHaveAttribute(
      'href',
      '/admin/requests',
    );
  });

  it('Sahyadri, no Institute Admin: Assign is the first action (B7-03 f1)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'sahyadri');
    const actions = main().querySelector('.xw-actions')!;
    expect([...actions.children].map((node) => node.textContent)).toEqual([
      'Assign Institute Admin',
      'Pause access',
      'Open request REQ-0033',
    ]);
    expect(
      within(actions as HTMLElement).getByRole('button', { name: 'Assign Institute Admin' }),
    ).toHaveClass('xr-btn--primary');
    expect(main()).toHaveTextContent(
      'No Institute AdminNobody at this institution can give students access until you assign one.',
    );
    const attention = [...region('Needs attention').querySelectorAll('.xr-row-title')].map(
      (node) => node.textContent,
    );
    expect(attention).toEqual([
      'No Institute Admin yet — nobody can give students access',
      'REQ-0036 additional licences — payment not confirmed',
    ]);
    for (const words of attention) expect(B7_03).toContain(words);
    expect(region('People')).toHaveTextContent('0 students · 0 Faculty.');
    expect(within(region('People')).queryByRole('list')).toBeNull();
  });

  it('Deccan, paused: the reason and date first; Restore is the action (B7-03 f2)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'deccan');
    const [restore, again] = screen.getAllByRole('button', { name: 'Restore access' });
    expect(restore).toHaveClass('xr-btn--primary');
    // …and again on its "Needs attention" row.
    expect(again!.closest('.xr-row')).toHaveTextContent('Access paused since 12 Oct 2026');
    expect(screen.queryByRole('button', { name: 'Pause access' })).toBeNull();
    expect(main()).toHaveTextContent(
      'Access pausedPaused on 12 Oct 2026 · “The institution asked us to pause access while it checks its student list.” Students can’t open experiments. Everyone’s work is kept.',
    );
    expect(region('Needs attention').querySelector('.xr-row-title')).toHaveTextContent(
      'Access paused since 12 Oct 2026',
    );
    expect(B7_03).toContain('Access paused since 12 Oct 2026');
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent(
      'Access paused by Arjun Mehta',
    );
  });

  it('Vizag, approved — payment required: no plan, no Institute Admin yet, no status action (B7-03 f3)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'vizag');
    expect(main().querySelectorAll('.xw-actions > .xr-btn')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Open request REQ-0037' })).toBeVisible();
    expect(region('Institution summary')).toHaveTextContent(
      'No access plan yet — it is created when the payment for REQ-0037 is confirmed',
    );
    expect(region('Institution summary')).toHaveTextContent(
      'The Institute Admin is assigned once access is active.',
    );
    expect(region('Access plans')).toHaveTextContent(
      'No access plan yet — it is created when the payment for REQ-0037 is confirmed.',
    );
    expect(region('Needs attention')).toHaveTextContent(
      'Approved — payment required (REQ-0037). Access starts when the payment is confirmed.',
    );
    expect(region('Institution report')).toHaveTextContent(
      'No activity yet — access hasn’t started.',
    );
    for (const words of [
      'The Institute Admin is assigned once access is active.',
      'Approved — payment required (REQ-0037). Access starts when the payment is confirmed.',
      'No activity yet — access hasn’t started.',
    ]) {
      expect(B7_03).toContain(words);
    }
  });

  it('Malnad, access ended: read-only — no Pause, no Restore (B7-03 f4)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'malnad');
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('Access ended');
    expect(main().querySelectorAll('.xw-actions > .xr-btn')).toHaveLength(1);
    expect(region('Needs attention')).toHaveTextContent('Nothing needs attention.');
  });

  it('an address that names no institution is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime, '/admin/institutions/narmada', <InstitutionDetail institutionId="narmada" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});

describe('SA-07 — Assign Institute Admin (B7-03 f1, f6)', () => {
  it('both errors at once on the fields; then assigned, said in the flash, which takes focus', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'sahyadri');
    const before = await detailOf(runtime, 'sahyadri');
    await user.click(screen.getAllByRole('button', { name: 'Assign Institute Admin' })[0]!);
    const dialog = await screen.findByRole('dialog', {
      name: 'Assign the Institute Admin for Sahyadri Institute of Engineering',
    });
    expect(dialog).toHaveTextContent(STRIPPED.assignBody.words);
    expect(dialog).not.toHaveTextContent('(T-11)');
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'n.joshi@sahyadri',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(dialog).toHaveTextContent('Enter the person’s name'));
    expect(dialog).toHaveTextContent('Enter an e-mail address like name@institution.edu.in');
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus(),
    );
    expect((await detailOf(runtime, 'sahyadri')).institution.rev).toBe(before.institution.rev);
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'N. Joshi');
    const email = within(dialog).getByRole('textbox', { name: 'Work e-mail' });
    await user.clear(email);
    await user.type(email, 'n.joshi@sahyadri.edu.in');
    await user.click(within(dialog).getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering. Nothing is sent from here — how they first sign in is still open.',
      ),
    );
    expect(flash()).not.toHaveTextContent('(T-11)');
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('Institute Admin: N. Joshi');
    expect(screen.queryByRole('button', { name: 'Assign Institute Admin' })).toBeNull();
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent(
      'Institute Admin assigned — N. Joshi',
    );
    expect(region('History').querySelector('.xr-tl-note')).toHaveTextContent(
      'n.joshi@sahyadri.edu.in · Arjun Mehta',
    );
    // The world holds the assignment: the assigned person signs in with the work e-mail (P1-01).
    const signedIn = await visitorPorts(sample).session.signIn({
      method: 'email',
      email: 'n.joshi@sahyadri.edu.in',
      password: 'any password',
    });
    expect(signedIn.ok ? [signedIn.value.session.role, signedIn.value.landing] : null).toEqual([
      'tenant_admin',
      '/institute',
    ]);
    const institution = (await detailOf(runtime, 'sahyadri')).institution;
    expect(institution.instituteAdmin?.workEmail).toBe('n.joshi@sahyadri.edu.in');
    expect(institution.rev).toBeGreaterThan(before.institution.rev);
  });
});

describe('SA-07 — Pause and Restore (B7-03 f7; B7-04 f0)', () => {
  it('a reason is required; pause, then restore, each kept in the history', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'konark');
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Pause access for Konark Polytechnic?',
    });
    expect(dialog).toHaveTextContent(
      'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.” Students can’t open experiments until you restore access. The access plan and everyone’s work are kept.',
    );
    const reason = within(dialog).getByRole('textbox', { name: 'Reason — kept in the history' });
    expect(reason).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent('Add a reason — it is kept in the history'),
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    expect((await detailOf(runtime, 'konark')).status).toBe('ending-soon');
    await user.type(reason, 'Licence review.');
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'Access paused. Everyone at Konark Polytechnic now sees the paused banner.',
      ),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(main()).toHaveTextContent(/Paused on \d+ \w+ 2026 · “Licence review.”/);
    expect((await detailOf(runtime, 'konark')).status).toBe('access-paused');
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent(
      'Access paused by Arjun Mehta',
    );
    await user.click(screen.getAllByRole('button', { name: 'Restore access' })[0]!);
    const restore = await screen.findByRole('dialog', {
      name: 'Restore access for Konark Polytechnic?',
    });
    expect(restore).toHaveTextContent(
      'Everyone at Konark Polytechnic can work again on the experiments in its access plan. The pause and your reason stay in the history.',
    );
    await user.type(
      within(restore).getByRole('textbox', { name: 'Reason — kept in the history' }),
      'Review done.',
    );
    await user.click(within(restore).getByRole('button', { name: 'Restore access' }));
    await waitFor(() =>
      expect(flash()).toHaveTextContent('Access restored. Konark Polytechnic can work again.'),
    );
    expect((await detailOf(runtime, 'konark')).status).toBe('ending-soon');
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('Ending soon');
    expect(region('History').querySelector('.xr-tl-note')).toHaveTextContent('“Review done.”');
  });

  it('Cancel changes nothing and gives focus back to Pause access', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'godavari');
    const version = sample.worldVersion();
    const pause = screen.getByRole('button', { name: 'Pause access' });
    await user.click(pause);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Not now.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(pause).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('paused meanwhile in another session: the refusal writes nothing and the page shows the pause (P1-21)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'konark');
    const elsewhere = asPersonId(sample, SUPER_ADMIN);
    const detail = await detailOf(runtime, 'konark');
    const paused = await elsewhere.institutions.pauseInstitution({
      institutionId: 'konark' as never,
      reason: 'Paused from another tab.',
      expectedRev: detail.institution.rev,
    });
    expect(paused.ok).toBe(true);
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'A second pause.');
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Restore access' })[0]).toBeVisible(),
    );
    expect(main()).toHaveTextContent('“Paused from another tab.”');
    expect(flash()).toHaveTextContent('');
    // Focus goes to the page title (the dialog's trigger, Pause access, is gone).
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toHaveFocus(),
    );
  });

  it('a dialog keeps the revision it opened with: a change shown meanwhile is refused as stale', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'konark');
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Licence review.');
    // Meanwhile another session pauses and restores Konark, and this page shows it (same
    // controls, a newer revision) while the dialog is still open.
    const elsewhere = asPersonId(sample, SUPER_ADMIN);
    const before = await detailOf(runtime, 'konark');
    const paused = await elsewhere.institutions.pauseInstitution({
      institutionId: 'konark' as never,
      reason: 'Checking the plan.',
      expectedRev: before.institution.rev,
    });
    if (!paused.ok) throw new Error(paused.error.kind);
    const restored = await elsewhere.institutions.restoreInstitution({
      institutionId: 'konark' as never,
      reason: 'Checked.',
      expectedRev: paused.value.rev,
    });
    if (!restored.ok) throw new Error(restored.error.kind);
    await act(() => runtime.invalidate([...paused.changed, ...restored.changed]));
    await waitFor(() =>
      expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent(
        'Access restored by Arjun Mehta',
      ),
    );
    expect(dialog).toBeVisible();
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    expect((await detailOf(runtime, 'konark')).status).toBe('ending-soon');
    expect(flash()).toHaveTextContent('');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toHaveFocus(),
    );
  });
});

describe('SA-07 — a student’s status override (B7-03 f8; PC-37)', () => {
  it('a reason is required; the override sends the listed revision and the list shows the change', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'godavari');
    const listed = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.name === 'Sneha Reddy',
    )!;
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Change status for Sneha Reddy' }));
    const reason = screen.getByRole('textbox', {
      name: 'Reason for changing the status to Active',
    });
    await waitFor(() => expect(reason).toHaveFocus());
    expect(reason).toHaveAccessibleDescription(
      'An override — kept in the history. The Institute Admin normally changes this.',
    );
    await user.click(screen.getByRole('button', { name: 'Change to Active' }));
    await waitFor(() =>
      expect(region('People')).toHaveTextContent('Add a reason — it is kept in the history'),
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(sample.worldVersion()).toBe(version);
    await user.type(reason, 'Re-enrolled for Sem II.');
    await user.click(screen.getByRole('button', { name: 'Change to Active' }));
    await waitFor(() => expect(flash()).toHaveTextContent('Sneha Reddy is now active.'));
    await waitFor(() => expect(flash()).toHaveFocus());
    const after = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.id === listed.id,
    )!;
    expect(after.status).toBe('active');
    expect(after.rev).toBe(listed.rev + 1);
    const item = within(region('People'))
      .getAllByRole('listitem')
      .find((node) => node.textContent!.includes('Sneha Reddy'))!;
    expect(item).toHaveTextContent('Active');
  });

  it('Cancel closes the panel and gives focus back to its button', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'godavari');
    await user.click(screen.getByRole('button', { name: 'Change status for Rahul Verma' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change status for Rahul Verma' })).toHaveFocus(),
    );
  });

  it('changed meanwhile: a stale revision is refused, nothing is written, the page shows the record as it is', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'godavari');
    const rahul = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.name === 'Rahul Verma',
    )!;
    // Another tab deactivates Rahul first.
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).institutions.overrideStudentStatus({
      studentId: rahul.id,
      to: 'inactive',
      reason: 'From another tab.',
      expectedRev: rahul.rev,
    });
    expect(elsewhere.ok).toBe(true);
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Change status for Rahul Verma' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Reason for changing the status to Inactive' }),
      'Paused his studies.',
    );
    await user.click(screen.getByRole('button', { name: 'Change to Inactive' }));
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: /Reason for changing/ })).toBeNull(),
    );
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(
        within(region('People'))
          .getAllByRole('listitem')
          .find((node) => node.textContent!.includes('Rahul Verma')),
      ).toHaveTextContent('Inactive'),
    );
    expect(screen.getByRole('button', { name: 'Change status for Rahul Verma' })).toHaveFocus();
  });

  it('the panel keeps the change and the revision it opened with: it never turns into the opposite change', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'godavari');
    const rahul = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.name === 'Rahul Verma',
    )!;
    expect(rahul.status).toBe('active');
    await user.click(screen.getByRole('button', { name: 'Change status for Rahul Verma' }));
    const reason = screen.getByRole('textbox', {
      name: 'Reason for changing the status to Inactive',
    });
    await user.type(reason, 'Paused his studies.');
    // Meanwhile another session deactivates Rahul, and this page shows it.
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).institutions.overrideStudentStatus({
      studentId: rahul.id,
      to: 'inactive',
      reason: 'From another tab.',
      expectedRev: rahul.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    await act(() => runtime.invalidate(elsewhere.changed));
    await waitFor(() =>
      expect(
        within(region('People'))
          .getAllByRole('listitem')
          .find((node) => node.textContent!.includes('Rahul Verma')),
      ).toHaveTextContent('Inactive'),
    );
    // The open panel still names the change it was opened for, with the reason typed for it.
    expect(reason).toHaveValue('Paused his studies.');
    expect(reason).toHaveAccessibleName('Reason for changing the status to Inactive');
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Change to Inactive' }));
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: /Reason for changing/ })).toBeNull(),
    );
    expect(sample.worldVersion()).toBe(version);
    const after = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.id === rahul.id,
    )!;
    expect(after).toMatchObject({ status: 'inactive', rev: rahul.rev + 1 });
    expect(flash()).toHaveTextContent('');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change status for Rahul Verma' })).toHaveFocus(),
    );
  });
});
