/**
 * Package 1D on the real composition root and the sample world (SA-01 Overview is tested in
 * sa-01-overview/overview.test.tsx): SA-06 Institutions and SA-07 Institution detail in the V3 Refined B design (SA-v1 `V.institutions`,
 * `V.institution`).
 * Every row, count, status and refusal is the ports' answer; the commands go out with the revision
 * the page read and their refusals write nothing. The fixture `after-flow-c` (27 Oct 2026) holds
 * the seven institutions as the B7 boards draw them on 23 Oct.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults, visitorPorts } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { saExport } from '@/test-support/boards';
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
import { Institutions } from './sa-06-institutions/institutions';
import { InstitutionDetail } from './sa-07-institution-detail/institution-detail';

afterEach(() => {
  forgetLastAddress();
});

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

// ---- SA-06 Institutions (SA-v1 `V.institutions`) ----------------------------------------------

const SA_VIEWS = saExport('sa-views-b.js');
const SA_CORE = saExport('sa-core.js');

/** The Super Admin rule: no REQ-, ACC-, UPD-, DTR-, SUP- or SUB- reference in text or names. */
function expectNoInternalReferences(root: Element) {
  const pattern = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
  expect(root.textContent ?? '').not.toMatch(pattern);
  for (const element of root.querySelectorAll('[aria-label], [title], [aria-description]')) {
    for (const name of ['aria-label', 'title', 'aria-description']) {
      expect(element.getAttribute(name) ?? '', name).not.toMatch(pattern);
    }
  }
}

async function tableRows(): Promise<HTMLTableRowElement[]> {
  await waitFor(() =>
    expect(document.querySelectorAll('main table.rk-table tbody tr').length).toBeGreaterThan(0),
  );
  return [...document.querySelectorAll<HTMLTableRowElement>('main table.rk-table tbody tr')];
}

const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const rowNameOf = (row: Element) => row.querySelector('a.rk-rowlink')!.textContent;
const rowNames = () =>
  [...document.querySelectorAll('main table.rk-table tbody tr')].map(rowNameOf);
const countLine = () => main().querySelector('.rk-count[role="status"]');
const statusSelect = () => screen.getByRole('combobox', { name: 'Status' });
const byName = (a: string, b: string) => a.localeCompare(b);

describe('SA-06 — the list is the port’s answer (SA-v1 `V.institutions`)', () => {
  it('every institution by name, with the export’s columns, words and figures', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    const rows = await tableRows();
    const expected = await portRows(runtime);
    expect(rows.map(rowNameOf)).toEqual(expected.map((row) => row.name).sort(byName));
    expect(screen.getByRole('heading', { level: 1, name: 'Institutions' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'Every institution on the platform. Each one is created when a request is approved.',
    );
    expect(main().querySelector('table caption')).toHaveTextContent('Institutions, by name');
    expect([...main().querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Institution',
      'Access plan',
      'Institute Admin',
      'Access ends',
      'Status',
    ]);
    const cells = (name: string) => cellsOf(rows.find((row) => rowNameOf(row) === name)!);
    expect(cells('Godavari Institute of Technology')).toEqual([
      'Godavari Institute of TechnologyExternal',
      '1 course · 1 experiment',
      'Meera Iyer',
      'Access ends 7 Oct 2027',
      'Access active',
    ]);
    expect(cells('Vizag Polytechnic')).toEqual([
      'Vizag PolytechnicExternal',
      'No access plan yet · 1 experiment requested',
      'Assigned once access is active',
      'Access ends: not set yet',
      'Approved — payment required',
    ]);
    expect(cells('Sahyadri Institute of Engineering')[2]).toBe('Needs one');
    expect(
      rows
        .find((row) => rowNameOf(row) === 'Sahyadri Institute of Engineering')!
        .querySelector('.rk-tag-warn svg'),
    ).not.toBeNull();
    expect(cells('Malnad College of Engineering').slice(2)).toEqual([
      'V. Hegde',
      'Ended 15 Oct 2026',
      'Access ended',
    ]);
    expect(cells('Deccan Institute of Technology')[4]).toBe('Access paused');
    expect(cells('Konark Polytechnic')[4]).toBe('Ending soon');
    // The status select with each status's figure, the export's order and words.
    expect(
      within(statusSelect())
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'All statuses (7)',
      'Access active (4)',
      'Ending soon (2)',
      'Access paused (1)',
      'Approved — payment required (1)',
      'Access ended (1)',
      'No Institute Admin (1)',
    ]);
    expect(statusSelect()).toHaveValue('all');
    expect(countLine()).toHaveTextContent('7 institutions');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Institution or Institute Admin',
    );
    expect(main().querySelector('.rk-ca-foot')).toHaveTextContent(
      'Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.',
    );
    // One link per row, named by the row's content, opening SA-07; no Create institution.
    const opens = screen.getAllByRole('link', { name: /\. Open the institution$/ });
    expect(opens.map((link) => link.getAttribute('href'))).toEqual(
      [...expected]
        .sort((a, b) => byName(a.name, b.name))
        .map((row) => `/admin/institutions/${row.id}`),
    );
    expect(
      screen.getByRole('link', {
        name: 'Sahyadri Institute of Engineering, Access active, no Institute Admin. Open the institution',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: /create/i })).toBeNull();
    expectNoInternalReferences(main());
    // The export's own words.
    for (const words of [
      'Every institution on the platform. Each one is created when a request is approved.',
      'Institution or Institute Admin',
      'Institutions, by name',
      'Assigned once access is active',
      'not set yet',
      'Needs one',
      'Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.',
      'Approved — payment required',
      '. Open the institution',
    ]) {
      expect(SA_VIEWS + SA_CORE).toContain(words);
    }
  });

  it('a status is the service’s answer; its chip and Clear filters go back to every institution', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    await user.selectOptions(statusSelect(), 'no-institute-admin');
    await waitFor(() => expect(countLine()).toHaveTextContent('1 of 7 institutions'));
    expect(rowNames()).toEqual(
      (await portRows(runtime, 'no-institute-admin')).map((row) => row.name).sort(byName),
    );
    expect(main().querySelector('.rk-chip')).toHaveTextContent('Status: No Institute Admin');
    await user.selectOptions(statusSelect(), 'approved-payment-required');
    await waitFor(() => expect(rowNames()).toEqual(['Vizag Polytechnic']));
    await user.selectOptions(statusSelect(), 'access-paused');
    await waitFor(() => expect(rowNames()).toEqual(['Deccan Institute of Technology']));
    // Access ended, a status the V3 select adds to B7-02's tabs.
    await user.selectOptions(statusSelect(), 'access-ended');
    await waitFor(() => expect(rowNames()).toEqual(['Malnad College of Engineering']));
    // "Access active" holds the institutions ending soon too (the service's tab).
    await user.selectOptions(statusSelect(), 'access-active');
    await waitFor(() => expect(countLine()).toHaveTextContent('4 of 7 institutions'));
    expect(rowNames()).toEqual(
      (await portRows(runtime, 'access-active')).map((row) => row.name).sort(byName),
    );
    // Removing the chip goes back to every institution, focus in Search.
    await user.click(screen.getByRole('button', { name: 'Remove filter Status: Access active' }));
    await waitFor(() => expect(countLine()).toHaveTextContent('7 institutions'));
    expect(statusSelect()).toHaveValue('all');
    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus());
    await user.selectOptions(statusSelect(), 'ending-soon');
    await waitFor(() => expect(countLine()).toHaveTextContent('2 of 7 institutions'));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(countLine()).toHaveTextContent('7 institutions'));
    expect(statusSelect()).toHaveValue('all');
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
  });

  it('the search names an institution, a plan or an Institute Admin; no match has one way back', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'kulkarni');
    await waitFor(() => expect(countLine()).toHaveTextContent('1 of 7 institutions'));
    expect(rowNames()).toEqual(['Deccan Institute of Technology']);
    expect(main().querySelector('.rk-chip')).toHaveTextContent('Search: “kulkarni”');
    // The status figures do not follow the search.
    expect(within(statusSelect()).getAllByRole('option')[0]).toHaveTextContent('All statuses (7)');
    await user.clear(search);
    await user.type(search, 'acc-0091');
    await waitFor(() => expect(rowNames()).toEqual(['Konark Polytechnic']));
    await user.clear(search);
    await user.type(search, 'Narmada');
    expect(await screen.findByText('No institutions match')).toHaveClass('rk-state-t');
    expect(screen.getByText('Try another name or clear the filters.')).toBeVisible();
    expect(main().querySelector('table')).toBeNull();
    expect(countLine()).toHaveTextContent('0 of 7 institutions');
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    // By keyboard: the state's Clear filters goes back to every institution, focus in Search
    // (the export's `inClear`), never to the page body.
    act(() => clears[1]!.focus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelectorAll('main tbody tr')).toHaveLength(7));
    expect(search).toHaveValue('');
    await waitFor(() => expect(search).toHaveFocus());
  });

  it('loading is announced over skeleton rows; a failure has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    faults(sample).failNext('InstitutionService.listInstitutions');
    renderInTab(<Institutions />, { runtime, navigation: testNavigation('/admin/institutions') });
    const loading = screen.getByText('Loading institutions…');
    expect(loading).toHaveAttribute('role', 'status');
    expect(document.querySelectorAll('.rk-skel-row').length).toBeGreaterThan(0);
    const failed = await screen.findByText('We couldn’t load the institutions');
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(failed.closest('.rk-state')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    // Rendered on its own (no workspace shell, so no main region).
    await waitFor(() =>
      expect(document.querySelectorAll('table.rk-table tbody tr')).toHaveLength(7),
    );
    expect(document.querySelector('.rk-count[role="status"]')).toHaveTextContent('7 institutions');
  });
});

describe('SA-06 after an SA-07 command in the same session', () => {
  it('the cached rows and status figures show the change when the list is opened again', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    const list = inAdmin(runtime, '/admin/institutions', <Institutions />);
    await tableRows();
    expect(within(statusSelect()).getByRole('option', { name: 'Access paused (1)' })).toBeTruthy();
    list.view.unmount();
    const detail = await openInstitution(runtime, 'konark');
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Licence review.');
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() => expect(flash()).toHaveTextContent('Access paused.'));
    detail.view.unmount();
    inAdmin(runtime, '/admin/institutions', <Institutions />);
    await waitFor(() =>
      expect(
        within(statusSelect()).getByRole('option', { name: 'Access paused (2)' }),
      ).toBeTruthy(),
    );
    const konark = (await tableRows()).find((row) => rowNameOf(row) === 'Konark Polytechnic')!;
    expect(konark).toHaveTextContent('Access paused');
  });
});

// ---- SA-07 Institution detail (SA-v1 `V.institution`) --------------------------------------------

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
const panel = () => screen.getByRole('complementary', { name: 'What you can do' });
const flash = () => main().querySelector<HTMLElement>('.rk-notice--ok[role="status"]');
const meta = () => main().querySelector('.rk-meta');
const termOf = (band: HTMLElement) => within(band).getByRole('img');

describe('SA-07 — the institution’s actual state (SA-v1 `V.institution`)', () => {
  it('Godavari, access active: head, facts, plan band, activity, people, history and the panel', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'godavari');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Institutions' })).toHaveAttribute(
      'href',
      '/admin/institutions',
    );
    expect(crumbs).toHaveTextContent('Godavari Institute of Technology');
    expect(main().querySelector('.rk-eyebrow')).toHaveTextContent('External institution');
    expect(meta()).toHaveTextContent('Access activeInstitute Admin: Meera Iyer');
    expect(meta()!.querySelector('.xr-st')).toHaveClass('xr-st--ok', 'rk-st-lg');
    expect(screen.getByRole('link', { name: 'Go to actions' })).toHaveAttribute(
      'href',
      '#in-panel',
    );
    const facts = main().querySelector('.rk-factstrip')!;
    expect([...facts.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      'Status',
      'Internal or external',
      'Institute Admin',
      'People',
    ]);
    expect([...facts.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'Access active',
      'External',
      'Meera Iyer',
      '12 students · 3 Faculty',
    ]);
    // The plan, named by its content and term, read-only.
    const band = region('1 experiment · 120 licences');
    expect(band).toHaveClass('rk-plan');
    expect(band.querySelector('.rk-plan-k')).toHaveTextContent('Access plan');
    expect(band.querySelector('.rk-plan-name .xr-st')).toHaveTextContent('Active');
    expect(band.querySelector('.rk-plan-line')).toHaveTextContent(
      '120 licences, as approved. How licences are counted is still open.',
    );
    expect(termOf(band)).toHaveAccessibleName(
      'Yearly term from 8 Oct 2026 to 7 Oct 2027. 345 days left.',
    );
    expect(band.querySelector('.sa-plan-exp .rk-askrow-t')).toHaveTextContent(
      'Shell-and-Tube Heat Exchanger',
    );
    expect(band.querySelector('.sa-plan-exp .rk-askrow-c')).toHaveTextContent(
      'ME ZG523Thermodynamics & Heat Transfer',
    );
    expect([...band.querySelectorAll('.rk-fcell')].map((cell) => cell.textContent)).toEqual([
      'WEBIn the plan',
      'ARNot in the plan',
      'VRIn the plan',
      'MRNot published',
    ]);
    expect(band.querySelector('.rk-plan-note')).toBeNull();
    expect(main().querySelector('.sa-footnote')).toHaveTextContent(
      'A plan can’t be amended here; changes come through a new request.',
    );
    // Activity by format: per format, never added up; no sample label.
    const activity = region('Activity by format');
    expect(activity.querySelector('tbody th')).toHaveTextContent('Shell-and-Tube Heat Exchanger');
    expect(activity.querySelector('td.xr-num')).toHaveTextContent('1');
    expect([...activity.querySelectorAll('.sa-byfmt li')].map((item) => item.textContent)).toEqual([
      'WEB 1 started · 1 completed',
      'VR 1 started · 1 completed',
    ]);
    expect(activity).toHaveTextContent(
      'Per format, never added up into one figure. Student feedback is not shown here.',
    );
    expect(activity).not.toHaveTextContent('Sample figures');
    // People, each with Change status.
    const people = region('People');
    expect(people.querySelector('.rk-sec-h')).toHaveTextContent('People12 students · 3 Faculty');
    expect(people).toHaveTextContent(
      'The Institute Admin manages people. A status change here is an override with a reason.',
    );
    const students = within(people).getAllByRole('listitem');
    expect(students).toHaveLength(12);
    const sneha = students.find((item) => item.textContent!.includes('Sneha Reddy'))!;
    expect(sneha).toHaveTextContent('Sneha ReddyGIT-2026-0352InactiveChange status');
    expect(
      within(sneha).getByRole('button', { name: 'Change status for Sneha Reddy' }),
    ).toHaveClass('rb-btn--ghost');
    expect(people).not.toHaveTextContent('sample data');
    const history = region('History');
    expect(history.querySelector('.rk-sec-h')).toHaveTextContent('Newest first');
    expect([...history.querySelectorAll('.rk-tl-w')].map((node) => node.textContent)).toEqual([
      'Request for additional licences received',
      'Institute Admin assigned: Meera Iyer',
      'Institutional access activated',
      'Request approved, payment required',
    ]);
    expect(history.querySelector('li')).toHaveClass('is-latest');
    // The panel: the Institute Admin, Pause access, and what else waits.
    const actions = panel();
    expect(actions).toHaveAttribute('id', 'in-panel');
    expect(actions.querySelector('.sa-act-v')).toHaveTextContent(
      'Meera Iyermeera.iyer@godavari.edu.in',
    );
    expect(within(actions).getByRole('button', { name: 'Pause access' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Restore access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assign Institute Admin' })).toBeNull();
    const waiting = actions.querySelector('.sa-attn')!;
    expect(waiting).toHaveTextContent('Additional licences request under review');
    expect(
      within(waiting as HTMLElement).getByRole('link', { name: 'Open request' }),
    ).toHaveAttribute('href', '/admin/requests/REQ-0058');
    expectNoInternalReferences(main());
    for (const words of [
      'How licences are counted is still open.',
      'In the plan',
      'Not in the plan',
      'Not published',
      'Per format, never added up into one figure. Student feedback is not shown here.',
      'The Institute Admin manages people. A status change here is an override with a reason.',
      'What you can do',
      'Also waiting for this institution',
      'Go to actions',
    ]) {
      expect(SA_VIEWS).toContain(words);
    }
  });

  it('Sahyadri, no Institute Admin: the notice, and Assign is the panel’s primary action', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'sahyadri');
    expect(meta()).toHaveTextContent('Institute Admin: not assigned');
    const notice = main().querySelector('.rk-notice--warn')!;
    expect(notice).toHaveTextContent(
      'No Institute AdminNobody at this institution can give students access until you assign one.',
    );
    const actions = panel();
    expect(actions).toHaveTextContent(
      'Not assigned. They manage people, groups and student access for this institution.',
    );
    const assign = within(actions).getByRole('button', { name: 'Assign Institute Admin' });
    expect(assign).toHaveClass('rb-btn--primary', 'rk-go');
    expect(screen.getAllByRole('button', { name: 'Assign Institute Admin' })).toHaveLength(1);
    expect(within(actions).getByRole('button', { name: 'Pause access' })).not.toHaveClass(
      'rb-btn--primary',
    );
    // Its additional licences wait for a payment, which is not recorded here.
    expect(actions).toHaveTextContent('Nothing else needs you here.');
    expect(main().querySelector('.rk-factstrip dd.is-quiet')).toHaveTextContent('Not assigned');
    expect(region('People')).toHaveTextContent(
      'Nobody has been added yet. The Institute Admin adds students and Faculty.',
    );
    expect(within(region('People')).queryByRole('list')).toBeNull();
    expectNoInternalReferences(main());
  });

  it('Deccan, paused: the banner, why, the paused plan; Restore is the action', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'deccan');
    expect(main().querySelector('.rk-banner')).toHaveTextContent(
      'Access paused on 12 Oct 2026. Students can’t open experiments. Everyone’s work is kept.',
    );
    const why = region('Why access is paused');
    expect(why.querySelector('blockquote.rk-quote')).toHaveTextContent(
      'The institution asked us to pause access while it checks its student list.Arjun Mehta, 12 Oct 2026, 09:40',
    );
    expect(why).toHaveTextContent(
      'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.”',
    );
    const band = region('1 experiment · 30 licences');
    expect(band.querySelector('.rk-plan-name .xr-st')).toHaveTextContent('Paused');
    expect(termOf(band)).toHaveAccessibleName(
      'Yearly term from 14 Jul 2026 to 13 Jul 2027. Paused · 259 days left.',
    );
    expect(band.querySelector('.rb-term-track')).toHaveClass('rk-track-paused');
    expect(band.querySelector('.rk-plan-note--paused')).toHaveTextContent(
      'Read-only while access is pausedStudents can’t open its experiments. Everyone’s work is kept.',
    );
    const restore = within(panel()).getByRole('button', { name: 'Restore access' });
    expect(restore).toHaveClass('rb-btn--primary');
    expect(panel()).toHaveTextContent(
      'Restoring lets everyone work again on the experiments in its access plan.',
    );
    expect(screen.queryByRole('button', { name: 'Pause access' })).toBeNull();
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent(
      'Access paused by Arjun Mehta',
    );
  });

  it('Vizag, approved — payment required: what was approved, no plan, no status action', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'vizag');
    expect(meta()).toHaveTextContent(
      'Approved — payment requiredInstitute Admin: assigned once access is active',
    );
    const plan = region('Access plan');
    expect(plan).toHaveTextContent(
      'No access plan yet. It is created when the payment for the approved request is confirmed. Payment isn’t recorded here.',
    );
    expect(plan.querySelector('.rk-askrow-t')).toHaveTextContent('Distillation Column');
    expect(plan.querySelector('.rk-askrow-c')).toHaveTextContent(
      'CHE ZG513Process Instrumentation & Control',
    );
    expect(plan.querySelector('.rk-fmts')).toHaveTextContent('Formats approved: WEB, VRWEBVR');
    expect(within(plan).getByRole('link', { name: 'Open the approved request' })).toHaveAttribute(
      'href',
      '/admin/requests/REQ-0037',
    );
    expect(main().querySelector('section.rk-plan')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Activity by format' })).toBeNull();
    const actions = panel();
    expect(actions).toHaveTextContent('The Institute Admin is assigned once access is active.');
    expect(actions).toHaveTextContent(
      'No status action here. Payment is confirmed on the request, outside this page.',
    );
    expect(within(actions).getByRole('link', { name: 'Open request' })).toHaveAttribute(
      'href',
      '/admin/requests/REQ-0037',
    );
    for (const name of ['Assign Institute Admin', 'Pause access', 'Restore access']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
    expectNoInternalReferences(main());
  });

  it('Malnad, access ended: the ended plan, read-only — no Pause, no Restore', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    await openInstitution(runtime, 'malnad');
    expect(meta()).toHaveTextContent('Access ended');
    const band = region('1 experiment · 20 licences');
    expect(band.querySelector('.rk-plan-name .xr-st')).toHaveTextContent('Ended');
    expect(termOf(band)).toHaveAccessibleName(
      'Quarterly term from 15 Jul 2026 to 15 Oct 2026. Ended 12 days ago.',
    );
    expect(band.querySelector('.rb-term-track')).toHaveClass('rk-track-full');
    expect(band.querySelector('.rk-plan-note--off')).toHaveTextContent(
      'This plan ended on 15 Oct 2026Ended access comes back only through a renewal request.',
    );
    expect(panel()).toHaveTextContent(
      'No status action here. Ended access comes back only through a renewal request.',
    );
    expect(screen.queryByRole('button', { name: 'Pause access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restore access' })).toBeNull();
    expect(panel()).toHaveTextContent('Nothing else needs you here.');
  });

  it('BITS Hyderabad and Konark, ending soon: the renewal under review, or the reminder due', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const bits = await openInstitution(runtime, 'bitshyd');
    let band = region('2 experiments · 80 licences');
    expect(band.querySelector('.rk-plan-name .xr-st')).toHaveTextContent('Ending soon');
    expect(termOf(band)).toHaveAccessibleName(
      'Monthly term from 1 Oct 2026 to 31 Oct 2026. 4 days left.',
    );
    expect(band.querySelector('.rb-term-rest')).not.toBeNull();
    const renewal = band.querySelector('.rk-plan-note--warn') as HTMLElement;
    expect(renewal).toHaveTextContent('Ends on 31 Oct 2026Its renewal request is under review.');
    expect(within(renewal).getByRole('link', { name: 'Open renewal request' })).toHaveAttribute(
      'href',
      '/admin/requests/REQ-0038',
    );
    expect(panel().querySelector('.sa-attn')).toHaveTextContent('Renewal request under review');
    bits.view.unmount();
    await openInstitution(runtime, 'konark');
    band = region('1 experiment · 60 licences');
    const reminder = band.querySelector('.rk-plan-note--warn') as HTMLElement;
    expect(reminder).toHaveTextContent(
      'Ends on 2 Nov 2026Reminder due. Nothing is sent from here.',
    );
    expect(within(reminder).getByRole('link', { name: 'View access ending' })).toHaveAttribute(
      'href',
      '/admin/operations/access-ending',
    );
    expectNoInternalReferences(main());
  });

  it('an address that names no institution is the GL-04 “This page isn’t available”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    inAdmin(runtime, '/admin/institutions/narmada', <InstitutionDetail institutionId="narmada" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});

describe('SA-07 — Assign Institute Admin (the export’s `assignIA` dialog)', () => {
  it('both errors at once on the fields; then assigned, said in the flash, which takes focus', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'sahyadri');
    const before = await detailOf(runtime, 'sahyadri');
    await user.click(screen.getByRole('button', { name: 'Assign Institute Admin' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Assign the Institute Admin for Sahyadri Institute of Engineering',
    });
    expect(dialog).toHaveClass('rk-dialog');
    expect(dialog).toHaveAccessibleDescription(
      'They manage people, groups and student access for this institution. Nothing is sent from here; how they first sign in is still open.',
    );
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
        'N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering.Nothing is sent from here. How they first sign in is still open.',
      ),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(meta()).toHaveTextContent('Institute Admin: N. Joshi');
    expect(screen.queryByRole('button', { name: 'Assign Institute Admin' })).toBeNull();
    expect(main().querySelector('.rk-notice--warn')).toBeNull();
    expect(panel().querySelector('.sa-act-v')).toHaveTextContent('N. Joshin.joshi@sahyadri.edu.in');
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent(
      'Institute Admin assigned: N. Joshi',
    );
    expect(region('History').querySelector('.rk-tl-n')).toHaveTextContent(
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

  it('an e-mail someone else already signs in with is a field error; nothing is assigned (PC-49)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'sahyadri');
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Assign Institute Admin' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'M. Iyer');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'meera.iyer@godavari.edu.in',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Assign' }));
    const email = within(dialog).getByRole('textbox', { name: 'Work e-mail' });
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription(
      'This e-mail is already used to sign in to the platform. Use a different e-mail.',
    );
    await waitFor(() => expect(email).toHaveFocus());
    expect(dialog).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
    expect((await detailOf(runtime, 'sahyadri')).institution.instituteAdmin).toBeNull();
  });
});

describe('SA-07 — Pause and Restore (the export’s `pause` and `restore` dialogs)', () => {
  it('a reason is required; pause, then restore, each kept in the history', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    const user = userEvent.setup();
    await openInstitution(runtime, 'konark');
    await user.click(screen.getByRole('button', { name: 'Pause access' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Pause access for Konark Polytechnic?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.” Students can’t open experiments until you restore access. The access plan and everyone’s work are kept.',
    );
    // Its request under review can't be decided while paused.
    expect(dialog).toHaveTextContent('Its open request can’t be decided while access is paused.');
    const reason = within(dialog).getByRole('textbox', { name: 'Reason, kept in the history' });
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
        'Access paused.Everyone at Konark Polytechnic now sees the paused banner. Their work is kept.',
      ),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(main().querySelector('.rk-banner')).toHaveTextContent(
      /^Access paused on \d+ \w+ 2026\./,
    );
    expect(region('Why access is paused')).toHaveTextContent('Licence review.');
    expect((await detailOf(runtime, 'konark')).status).toBe('access-paused');
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent(
      'Access paused by Arjun Mehta',
    );
    await user.click(screen.getByRole('button', { name: 'Restore access' }));
    const restore = await screen.findByRole('dialog', {
      name: 'Restore access for Konark Polytechnic?',
    });
    expect(restore).toHaveAccessibleDescription(
      'Everyone at Konark Polytechnic can work again on the experiments in its access plan. The pause and your reason stay in the history.',
    );
    await user.type(
      within(restore).getByRole('textbox', { name: 'Reason, kept in the history' }),
      'Review done.',
    );
    await user.click(within(restore).getByRole('button', { name: 'Restore access' }));
    await waitFor(() =>
      expect(flash()).toHaveTextContent('Access restored.Konark Polytechnic can work again.'),
    );
    expect((await detailOf(runtime, 'konark')).status).toBe('ending-soon');
    expect(meta()).toHaveTextContent('Ending soon');
    expect(main().querySelector('.rk-banner')).toBeNull();
    expect(region('History').querySelector('.rk-tl-n')).toHaveTextContent('“Review done.”');
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
      expect(screen.getByRole('button', { name: 'Restore access' })).toBeVisible(),
    );
    expect(main()).toHaveTextContent('Paused from another tab.');
    expect(flash()).toBeNull();
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
      expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent(
        'Access restored by Arjun Mehta',
      ),
    );
    expect(dialog).toBeVisible();
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Pause access' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    expect((await detailOf(runtime, 'konark')).status).toBe('ending-soon');
    expect(flash()).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toHaveFocus(),
    );
  });
});

describe('SA-07 — a student’s status override (the export’s inline form; PC-37)', () => {
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
      'An override, kept in the history. The Institute Admin normally changes this.',
    );
    expect(reason.closest('.sa-inline')).not.toBeNull();
    // While the form is open its row has no Change status.
    expect(screen.queryByRole('button', { name: 'Change status for Sneha Reddy' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Change to Active' }));
    await waitFor(() =>
      expect(region('People')).toHaveTextContent('Add a reason — it is kept in the history'),
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(sample.worldVersion()).toBe(version);
    await user.type(reason, 'Re-enrolled for Sem II.');
    await user.click(screen.getByRole('button', { name: 'Change to Active' }));
    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'Sneha Reddy is now active.The change and your reason are in the history.',
      ),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    const after = (await detailOf(runtime, 'godavari')).people.studentList.find(
      (student) => student.id === listed.id,
    )!;
    expect(after.status).toBe('active');
    expect(after.rev).toBe(listed.rev + 1);
    const item = within(region('People'))
      .getAllByRole('listitem')
      .find((node) => node.textContent!.includes('Sneha Reddy'))!;
    expect(item.querySelector('.xr-st')).toHaveTextContent('Active');
  });

  it('Cancel closes the form and gives focus back to its button', async () => {
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

  it('the form keeps the change and the revision it opened with: it never turns into the opposite change', async () => {
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
    // The open form still names the change it was opened for, with the reason typed for it.
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
    expect(flash()).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change status for Rahul Verma' })).toHaveFocus(),
    );
  });
});
