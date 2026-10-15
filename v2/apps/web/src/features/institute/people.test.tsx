/**
 * Phase-2 Package 2A, People, on the real composition root and the sample world: IA-06 People ›
 * Students, IA-08 People › Faculty and IA-07 Student record (B2-06), IA-10 Add a student / Add a
 * faculty member (B2-07). Every row, count, status, grant word and refusal is the ports' answer; the
 * filters go to `PeopleService.listStudents`; the commands go out with the revision the page read
 * and their refusals write nothing. Fixtures: `after-setup` (8 Oct 2026: twelve students imported,
 * Sneha Reddy inactive, three faculty, GRP-0012, no grant), `after-flow-b` (SACC-0310 given to
 * Rahul Verma; Deccan paused on 12 Oct), `later-sample` (the group grant SACC-0311, supplied waits).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults, visitorPorts } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  PAUSED_INSTITUTE_ADMIN,
  PERSON_OF_ROLE,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { People } from './ia-06-people/people';
import { StudentRecord } from './ia-07-student-record/student-record';
import { AddPerson } from './ia-10-add-person/add-person';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const RAHUL = 'per-0002';
const PRIYA = 'per-0003';
const ARUN = 'per-0004';
const SNEHA = 'per-0005';

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const count = () => document.querySelector('.xr-toolbar-status [role="status"]');
const rowsOf = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const region = (name: string) => screen.getByRole('region', { name });

async function studentRows(): Promise<HTMLTableRowElement[]> {
  await waitFor(() => expect(rowsOf().length).toBeGreaterThan(0));
  return rowsOf();
}

function rowNamed(name: string): HTMLTableRowElement {
  const row = rowsOf().find((candidate) =>
    candidate.querySelector('td.is-primary')?.textContent?.startsWith(name),
  );
  if (!row) throw new Error(`No row for ${name}`);
  return row;
}

async function portStudents(runtime: PlatformRuntime, filter = {}) {
  const answer = await runtime.ports.people.listStudents(filter);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function recordOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.people.getStudent(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** Pauses Godavari as the Super Admin would (B7-04), from another session. */
async function pauseGodavari(sample: Parameters<typeof asPersonId>[0]) {
  const admin = asPersonId(sample, SUPER_ADMIN);
  const detail = await admin.institutions.getInstitution('godavari' as never);
  if (!detail.ok) throw new Error('godavari');
  const paused = await admin.institutions.pauseInstitution({
    institutionId: 'godavari' as never,
    reason: 'Licence review.',
    expectedRev: detail.value.institution.rev,
  });
  if (!paused.ok) throw new Error('pause');
}

// ---- IA-06 People › Students (B2-06 f0 … f7) ---------------------------------------------------

describe('IA-06 — the students are the port’s answer (B2-06 f0)', () => {
  it('after the import: twelve students, B2-06’s columns and words, each opening the record', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />);
    const rows = await studentRows();
    const expected = await portStudents(runtime);
    expect(rows).toHaveLength(12);
    expect(rows.map((row) => row.querySelector('td.is-primary a')!.textContent)).toEqual(
      expected.map((row) => row.student.fullName),
    );
    expect(cellsOf(rowNamed('Rahul Verma'))).toEqual([
      'Rahul VermaGIT-2026-0418',
      'ME ZG523ME ZG523 — Sem II',
      'None yet',
      'No access yet',
    ]);
    expect(cellsOf(rowNamed('Sneha Reddy'))[3]).toBe('Inactive');
    expect(cellsOf(rowNamed('Lakshmi Prasad'))[1]).toBe('ME ZG523No group');
    const rahul = screen.getByRole('link', { name: 'Open student record: Rahul Verma' });
    expect(rahul).toHaveAttribute('href', `/institute/people/students/${RAHUL}`);
    expect(count()).toHaveTextContent('12 students');
    // The header: "People", its line, one primary action; "Import students" (IA-11) is not built.
    expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'Students and faculty at your institution',
    );
    expect(screen.getByRole('link', { name: 'Add student' })).toHaveAttribute(
      'href',
      '/institute/people/add',
    );
    expect(screen.queryByRole('link', { name: 'Import students' })).toBeNull();
    // The People tabs: Students (current) and Faculty — Groups and Faculty courses are not built.
    const tabs = within(screen.getByRole('navigation', { name: 'People' })).getAllByRole('link');
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute('href')])).toEqual([
      ['Students', '/institute/people'],
      ['Faculty', '/institute/people?tab=faculty'],
    ]);
    expect(tabs[0]).toHaveAttribute('aria-current', 'page');
    // The table's labelled cells (B2-06 f7, rows become labelled blocks).
    expect(rowNamed('Rahul Verma').querySelector('td[data-label="Status"]')).not.toBeNull();
    expect(screen.getByRole('table', { name: 'Students' })).toBeVisible();
  });

  it('after SACC-0310: Rahul is Access active with the experiment and its formats (f1)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/people', <People />);
    await studentRows();
    const rahul = rowNamed('Rahul Verma');
    expect(cellsOf(rahul)[2]).toBe('Shell-and-Tube Heat ExchangerWEBVR');
    expect(
      [...rahul.querySelectorAll('.xr-fmt.xr-fmt--compact')].map((chip) => chip.textContent),
    ).toEqual(['WEB', 'VR']);
    expect(rahul.querySelector('.xr-status.xr-status--ok')).toHaveTextContent('Access active');
    expect(rowNamed('Priya Natarajan').querySelector('.xr-status--info')).toHaveTextContent(
      'No access yet',
    );
  });

  it('Search, Status and Group go to the service; chips, Clear filters and no match (f2, f6)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    inInstitute(runtime, '/institute/people', <People />);
    await studentRows();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Inactive');
    await waitFor(() => expect(count()).toHaveTextContent('1 of 12 students'));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(['Sneha Reddy']);
    expect(screen.getByRole('button', { name: 'Remove Status: Inactive' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Remove Status: Inactive' }));
    await waitFor(() => expect(count()).toHaveTextContent('12 students'));

    const group = screen.getByRole('combobox', { name: 'Group' });
    expect([...group.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All groups',
      'ME ZG523 — Sem II',
      'Not in a group',
    ]);
    await user.selectOptions(group, 'Not in a group');
    const outside = await portStudents(runtime, { notInGroup: true });
    await waitFor(() => expect(count()).toHaveTextContent(`${outside.length} of 12 students`));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(
      outside.map((row) => row.student.fullName),
    );
    expect(screen.getByRole('button', { name: 'Remove Not in a group' })).toBeVisible();
    await user.selectOptions(group, 'ME ZG523 — Sem II');
    await waitFor(() => expect(count()).toHaveTextContent('7 of 12 students'));
    expect(screen.getByRole('button', { name: 'Remove Group: ME ZG523 — Sem II' })).toBeVisible();

    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveAttribute('placeholder', 'Name, student ID or e-mail');
    await user.type(search, 'git-2026-0418');
    await waitFor(() => expect(count()).toHaveTextContent('1 of 12 students'));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(['Rahul Verma']);
    await user.clear(search);
    await user.type(search, 'Meenakshi');
    expect(
      await screen.findByRole('heading', { name: 'No students match these filters' }),
    ).toBeVisible();
    expect(screen.getByText('Check the spelling, or search by student ID.')).toBeVisible();
    expect(count()).toHaveTextContent('0 of 12 students');
    expect(screen.getByRole('button', { name: 'Remove Search: “Meenakshi”' })).toBeVisible();
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    act(() => clears[1]!.focus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(rowsOf()).toHaveLength(12));
    expect(search).toHaveValue('');
    expect(count()).toHaveTextContent('12 students');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Open student record: Rahul Verma' })).toHaveFocus(),
    );
  });

  it('loading is announced; a failure has “Try again” (f4, f5)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    faults(sample).failNext('PeopleService.listStudents');
    inInstitute(runtime, '/institute/people', <People />);
    expect(await screen.findByText('Loading students')).toHaveAttribute('role', 'status');
    expect(document.querySelector('.xr-table-wrap[aria-busy="true"] .xr-skel')).not.toBeNull();
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the students' }),
    ).toBeVisible();
    expect(screen.getByText('Nothing has changed. Try again.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await studentRows()).toHaveLength(12);
  });

  it('no students yet: one way in, no toolbar (f3)', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />);
    expect(await screen.findByRole('heading', { name: 'No students yet' })).toBeVisible();
    expect(
      screen.getByText(
        'Add students one at a time or import a CSV file. Adding a student doesn’t give them any experiments yet.',
      ),
    ).toBeVisible();
    const adds = screen.getAllByRole('link', { name: 'Add student' });
    expect(adds).toHaveLength(2);
    for (const link of adds) expect(link).toHaveAttribute('href', '/institute/people/add');
    expect(document.querySelector('.xr-toolbar')).toBeNull();
  });

  it('`?tab=students` (or any other tab) is the bare address', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { navigation } = inInstitute(runtime, '/institute/people', <People />, '?tab=students');
    await studentRows();
    expect(navigation.replace).toHaveBeenCalledWith('/institute/people');
  });
});

// ---- IA-08 People › Faculty (B2-06 f14) --------------------------------------------------------

describe('IA-08 — the faculty tab (B2-06 f14)', () => {
  it('three faculty members, the courses they teach, the search and its no match', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const { navigation } = inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(rowsOf().map(cellsOf)).toEqual([
      ['Dr S. Ranganathans.ranganathan@godavari.edu.in', 'ME ZG523', 'Active'],
      ['Dr Anita Desaianita.desai@godavari.edu.in', 'No courses yet', 'Active'],
      ['Prof. Ravi Shankarravi.shankar@godavari.edu.in', 'No courses yet', 'Inactive'],
    ]);
    // IA-09 Faculty record is not built: the names open nothing.
    expect(within(screen.getByRole('table', { name: 'Faculty' })).queryAllByRole('link')).toEqual(
      [],
    );
    expect(count()).toHaveTextContent('3 faculty members');
    expect(screen.getByRole('link', { name: 'Add faculty member' })).toHaveAttribute(
      'href',
      '/institute/people/add?type=faculty',
    );
    expect(screen.queryByRole('link', { name: 'Add student' })).toBeNull();
    const tabs = within(screen.getByRole('navigation', { name: 'People' })).getAllByRole('link');
    expect(tabs[1]).toHaveAttribute('aria-current', 'page');
    // No status change is offered for faculty (PER-07).
    expect(screen.queryByRole('button', { name: /Deactivate/ })).toBeNull();

    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveAttribute('placeholder', 'Name or e-mail');
    await user.type(search, 'DESAI');
    expect(count()).toHaveTextContent('1 of 3 faculty members');
    expect(rowsOf()).toHaveLength(1);
    await user.clear(search);
    await user.type(search, 'nobody');
    expect(await screen.findByRole('heading', { name: 'No faculty members match' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    expect(search).toHaveFocus();
    // The top bar: "Faculty", crumbed "People / Faculty" (B2-06 f14).
    await waitFor(() =>
      expect(document.querySelector('.xr-crumbs')).toHaveTextContent('People/Faculty'),
    );
  });
});

// ---- IA-07 Student record (B2-06 f8 … f13, f17) ------------------------------------------------

async function openRecord(runtime: PlatformRuntime, id: string) {
  const rendered = inInstitute(
    runtime,
    `/institute/people/students/${id}`,
    <StudentRecord studentId={id} />,
  );
  await screen.findByRole('heading', {
    level: 1,
    name: (await recordOf(runtime, id)).student.fullName,
  });
  return rendered;
}

describe('IA-07 — the student’s record as it is (B2-06 f8, f9, f10, f11, f17)', () => {
  it('Rahul before access: who he is, nothing given yet, one primary action (f8)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openRecord(runtime, RAHUL);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Student · GIT-2026-0418');
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'Account activerahul.verma@godavari.edu.in',
    );
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/institute/people');
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Students');
    expect(screen.getByRole('link', { name: 'Give this student access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?student=${RAHUL}`,
    );
    const given = region('Experiments given');
    expect(
      within(given).getByRole('heading', {
        level: 3,
        name: 'Rahul hasn’t been given any experiments yet',
      }),
    ).toBeVisible();
    expect(within(given).queryByRole('link', { name: 'Open Student access' })).toBeNull();
    const courses = region('Courses and groups');
    expect(courses).toHaveTextContent('CourseME ZG523 · Thermodynamics & Heat Transfer');
    expect(courses).toHaveTextContent('GroupME ZG523 — Sem II');
    // IA-14 is not built: the group's name is not a link.
    expect(within(courses).queryAllByRole('link')).toEqual([]);
    expect(region('Details')).toHaveTextContent(
      'Student IDGIT-2026-0418Institution e-mailrahul.verma@godavari.edu.inProgrammeB.Tech MechanicalAdded8 Oct 2026 · imported by Meera Iyer',
    );
    const history = region('History');
    expect(history.querySelector('.xr-tl.is-latest .xr-tl-what')).toHaveTextContent(
      'Added to People',
    );
    expect(history.querySelector('.xr-tl-when')).toHaveTextContent(
      '8 Oct 2026, 15:40 · Meera Iyer',
    );
    expect(history.querySelector('.xr-tl-note')).toHaveTextContent(
      'Imported from godavari-me-zg523-corrected.csv',
    );
    expect(region('Account')).toHaveTextContent(
      'Deactivating stops this student from opening experiments until you reactivate the account. Their work and access history are kept.',
    );
    expect(screen.getByRole('button', { name: 'Deactivate account…' })).toHaveClass(
      'xr-btn--danger-quiet',
    );
    // The top bar: "Rahul Verma", crumbed "People / Students / Rahul Verma" (B2-06).
    await waitFor(() =>
      expect(document.querySelector('.xr-crumbs')).toHaveTextContent('People/Students/Rahul Verma'),
    );
  });

  it('after SACC-0310: the grant’s own line and its history (f9)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    await openRecord(runtime, RAHUL);
    const given = region('Experiments given');
    expect(within(given).getByRole('link', { name: 'Open Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    const rows = [...given.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
    expect(rows.map(cellsOf)).toEqual([
      [
        'Shell-and-Tube Heat ExchangerME ZG523',
        'WEBVRFrom access plan ACC-0107',
        'Individually · 9 Oct 2026 · SACC-0310',
        'Active',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-status--ok')).toHaveTextContent('Active');
    const latest = region('History').querySelector('.xr-tl.is-latest')!;
    expect(latest.querySelector('.xr-tl-what')).toHaveTextContent(
      'Given Shell-and-Tube Heat Exchanger',
    );
    expect(latest.querySelector('.xr-tl-when')).toHaveTextContent('9 Oct 2026, 10:20 · Meera Iyer');
    expect(latest.querySelector('.xr-tl-note')).toHaveTextContent(
      'SACC-0310 · individually · WEB and VR from ACC-0107',
    );
  });

  it('later sample: a supplied wait through the group, in words (f10)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, ARUN);
    const row = region('Experiments given').querySelector('tbody tr') as HTMLTableRowElement;
    expect(cellsOf(row).slice(2)).toEqual([
      'Group ME ZG523 — Sem II · 12 Oct 2026 · SACC-0311',
      'Waiting for a licenceNo licence is available for Arun on ACC-0107 right now.',
    ]);
    expect(row.querySelector('.xr-status--wait')).toHaveTextContent('Waiting for a licence');
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent(
      'Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II',
    );
  });

  it('later sample: Rahul’s two grants on one line, “Also in” the group (f17; OD-B2-01)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, RAHUL);
    const rows = [
      ...region('Experiments given').querySelectorAll('tbody tr'),
    ] as HTMLTableRowElement[];
    expect(rows).toHaveLength(1);
    expect(cellsOf(rows[0]!)[2]).toBe(
      'Individually · 9 Oct 2026 · SACC-0310Also in ME ZG523 — Sem II, which has this experiment · SACC-0311',
    );
    expect(rows[0]!.querySelector('.xw-also')).not.toBeNull();
    expect(cellsOf(rows[0]!)[3]).toBe('Active');
    // No can / can't-open statement anywhere on the record.
    expect(main()).not.toHaveTextContent(/can open|can’t open it/i);
  });

  it('Sneha, inactive: the reason shown and Reactivate the one action (f11)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, SNEHA);
    expect(main().querySelector('.xr-phead-meta .xr-status--off')).toHaveTextContent('Inactive');
    expect(screen.getByRole('button', { name: 'Reactivate account' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Give this student access' })).toBeNull();
    const notice = main().querySelector('.xr-notice.xr-notice--quiet')!;
    expect(notice).toHaveTextContent(
      'This account is inactiveInactive since 8 Oct 2026 · Meera Iyer: “Left the programme.” Sneha can’t open experiments until their account is reactivated.',
    );
    const row = region('Experiments given').querySelector('tbody tr') as HTMLTableRowElement;
    expect(cellsOf(row)[3]).toBe('Can’t open — inactiveSneha’s account is inactive.');
    expect(screen.queryByRole('region', { name: 'Account' })).toBeNull();
    expect(region('History').querySelectorAll('.xr-tl-what')[1]).toHaveTextContent(
      'Account deactivated',
    );
  });

  it('an unknown student, or another institution’s, is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(
      runtime,
      '/institute/people/students/per-9999',
      <StudentRecord studentId="per-9999" />,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('another institution’s Institute Admin cannot open Rahul’s record', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-setup');
    inInstitute(
      runtime,
      `/institute/people/students/${RAHUL}`,
      <StudentRecord studentId={RAHUL} />,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(main()).not.toHaveTextContent('Rahul');
  });
});

describe('IA-07 — Deactivate and Reactivate (B2-06 f9, f12, f13)', () => {
  it('a reason is required; deactivated, then reactivated, each in the history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Deactivate Priya Natarajan’s account?',
    });
    expect(dialog).toHaveTextContent(
      'Priya will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.',
    );
    expect(dialog).toHaveTextContent(
      'Shown on the student record to your institution’s administrators.',
    );
    const reason = within(dialog).getByRole('textbox', { name: 'Reason (required)' });
    expect(reason).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent('Enter the reason for deactivating this account'),
    );
    expect(dialog.querySelector('.xw-ferr')).not.toBeNull();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('active');

    await user.type(reason, 'On leave this semester.');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(main().querySelector('.xr-notice--ok')).toHaveTextContent(
      'Account deactivated. Their work and access history are kept.',
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reactivate account' })).toHaveFocus(),
    );
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('Inactive');
    expect(main().querySelector('.xr-notice--quiet')).toHaveTextContent(
      /Inactive since \d+ Oct 2026 · Meera Iyer: “On leave this semester.”/,
    );
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent('Account deactivated');
    expect(region('History').querySelector('.xr-tl-note')).toHaveTextContent(
      '“On leave this semester.”',
    );
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('inactive');
    // IA-06 lists her as Inactive at once.
    expect(
      (await portStudents(runtime, { status: 'inactive' })).map((row) => row.student.id),
    ).toContain(PRIYA);

    await user.click(screen.getByRole('button', { name: 'Reactivate account' }));
    const reactivate = await screen.findByRole('dialog', {
      name: 'Reactivate Priya Natarajan’s account?',
    });
    expect(reactivate).toHaveTextContent(
      'The account becomes active again, and the experiments Priya has been given open again.',
    );
    await user.click(within(reactivate).getByRole('button', { name: 'Reactivate account' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(main().querySelector('.xr-notice--ok')).toHaveTextContent('Account reactivated.');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Deactivate account…' })).toHaveFocus(),
    );
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('Account active');
    expect(region('History').querySelector('.xr-tl-what')).toHaveTextContent('Account reactivated');
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('active');
  });

  it('Cancel changes nothing and gives focus back', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    const version = sample.worldVersion();
    const open = screen.getByRole('button', { name: 'Deactivate account…' });
    await user.click(open);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Not now.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(open).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('deactivated meanwhile in another session: refused as stale, nothing written, the record as it is', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Left the course.');
    const elsewhere = asPersonId(sample, MEERA);
    const record = await recordOf(runtime, PRIYA);
    const done = await elsewhere.people.deactivateStudent({
      id: record.student.id,
      reason: 'From another tab.',
      expectedRev: record.student.rev,
    });
    expect(done.ok).toBe(true);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(main().querySelector('.xr-notice--quiet')).toHaveTextContent('“From another tab.”'),
    );
    expect(main().querySelector('.xr-notice--ok')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Priya Natarajan' })).toHaveFocus(),
    );
  });

  it('failed for now: the dialog and its reason stay; nothing changes', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'On leave.');
    faults(sample).failNext('PeopleService.deactivateStudent');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Deactivate account' })).not.toHaveClass(
        'is-busy',
      ),
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(within(dialog).getByRole('textbox')).toHaveValue('On leave.');
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('active');
  });
});

describe('People while the institution is paused: read-only (B2-01 f5)', () => {
  it('IA-06 and IA-07 offer no write and say why', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    await runtime.session.refresh();
    const first = inInstitute(runtime, '/institute/people', <People />);
    await studentRows();
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(screen.queryByRole('link', { name: 'Add student' })).toBeNull();
    first.view.unmount();

    await openRecord(runtime, RAHUL);
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'You can’t add people or change their accounts until BITS lifts the pause.',
      ),
    );
    expect(screen.queryByRole('link', { name: 'Give this student access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Deactivate account…' })).toBeNull();
    // The reads stay: the grant is still listed.
    expect(region('Experiments given')).toHaveTextContent('SACC-0310');
  });

  it('Deccan’s Institute Admin (paused on 12 Oct): no Add student, no Add faculty member', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    inInstitute(runtime, '/institute/people', <People />);
    expect(await screen.findByRole('heading', { name: 'No students yet' })).toBeVisible();
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(screen.queryByRole('link', { name: 'Add student' })).toBeNull();
  });
});

// ---- IA-10 Add a student / Add a faculty member (B2-07 f0 … f4) ------------------------------

async function openAdd(runtime: PlatformRuntime, search = '') {
  const rendered = inInstitute(runtime, '/institute/people/add', <AddPerson />, search);
  await screen.findByRole('heading', {
    level: 1,
    name: search ? 'Add faculty member' : 'Add student',
  });
  return rendered;
}

describe('IA-10 — Add student (B2-07 f0, f1, f2)', () => {
  it('validation in words, an error summary that takes focus (f0, f1)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openAdd(runtime);
    const version = sample.worldVersion();
    expect(main().querySelector('.xr-overline')).toHaveTextContent('People');
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Students');
    expect(main().querySelector('.xr-notice--quiet')).toHaveTextContent(
      'Adding a student doesn’t give them any experiments yet. You give access separately.',
    );
    expect(screen.getByRole('textbox', { name: 'Institution e-mail' })).toHaveAttribute(
      'placeholder',
      'name@godavari.edu.in',
    );
    expect(screen.getByRole('textbox', { name: 'Student ID' })).toHaveAccessibleDescription(
      'Your institution’s ID for this student, for example GIT-2026-0418.',
    );
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/institute/people',
    );

    await user.click(screen.getByRole('button', { name: 'Add student' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
    expect(summary).toHaveTextContent('3 things need fixing');
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Enter the full name', 'Enter the institution e-mail', 'Enter the student ID']);
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    // Typing in a field clears its error; the summary counts what is left.
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Ananya Das');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('2 things need fixing'),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'rahul.verma@godavari.edu.in',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0418');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('alert'))
          .getAllByRole('link')
          .map((l) => l.textContent),
      ).toEqual([
        'This e-mail already belongs to someone in People',
        'GIT-2026-0418 is already used by Rahul Verma',
      ]),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('2 things need fixing');
    expect(main().querySelector('#person-student-id-e')).toHaveTextContent(
      'GIT-2026-0418 is already used by Rahul Verma',
    );
    expect(main().querySelector('#person-student-id-e')).toHaveClass('xw-ferr');

    // A short e-mail: the format first (state-copy IA-10.check-order).
    await user.clear(screen.getByRole('textbox', { name: 'Institution e-mail' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'ananya.das@godavari',
    );
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Enter a full e-mail address, like name@godavari.edu.in',
      ),
    );
    expect(sample.worldVersion()).toBe(version);
  });

  it('added: the result takes focus, the student is in People at once and can sign in (f2)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openAdd(runtime);
    const group = screen.getByRole('combobox', { name: 'Group (optional)' });
    await waitFor(() =>
      expect([...group.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
        'No group',
        'ME ZG523 — Sem II',
      ]),
    );
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Meenakshi Pillai');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'meenakshi.pillai@godavari.edu.in',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0444');
    await user.type(
      screen.getByRole('textbox', { name: 'Programme (optional)' }),
      'B.Tech Mechanical',
    );
    await user.selectOptions(group, 'ME ZG523 — Sem II');
    await user.click(screen.getByRole('button', { name: 'Add student' }));

    const result = await waitFor(() => {
      const element = main().querySelector<HTMLElement>('#person-added');
      expect(element).not.toBeNull();
      return element!;
    });
    await waitFor(() => expect(result).toHaveFocus());
    expect(result.querySelector('.xr-status--ok')).toHaveTextContent('Added');
    expect(result).toHaveTextContent(
      'Meenakshi Pillai is in People now, with no experiments yet. No invitation or e-mail is sent.',
    );
    const listed = await portStudents(runtime, { search: 'meenakshi' });
    expect(listed).toHaveLength(1);
    const added = listed[0]!;
    expect(added.directoryStatus).toBe('no-access-yet');
    expect(added.groups.map((entry) => entry.name)).toEqual(['ME ZG523 — Sem II']);
    expect(added.student.programme).toBe('B.Tech Mechanical');
    expect(within(result).getByRole('link', { name: 'Give this student access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?student=${added.student.id}`,
    );
    expect(within(result).getByRole('link', { name: 'Back to People' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    // The sample sign-in resolves people by e-mail: the new student signs in to their own workspace.
    const signedIn = await visitorPorts(sample).session.signIn({
      method: 'email',
      email: 'meenakshi.pillai@godavari.edu.in',
      password: 'any',
    });
    expect(signedIn.ok && signedIn.value.session.personId).toBe(added.student.id);
    expect(signedIn.ok && signedIn.value.landing).toBe('/student');

    await user.click(within(result).getByRole('button', { name: 'Add another student' }));
    const name = await screen.findByRole('textbox', { name: 'Full name' });
    expect(name).toHaveValue('');
    await waitFor(() => expect(name).toHaveFocus());
  });

  it('the new student is in the IA-06 list', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const first = await openAdd(runtime);
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Meenakshi Pillai');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'meenakshi.pillai@godavari.edu.in',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0444');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    await screen.findByText('Added');
    first.view.unmount();
    inInstitute(runtime, '/institute/people', <People />);
    await waitFor(() => expect(rowsOf()).toHaveLength(13));
    expect(count()).toHaveTextContent('13 students');
    // Added one at a time: no course filed, so the group line stands alone (IA-06.no-course).
    expect(cellsOf(rowNamed('Meenakshi Pillai'))).toEqual([
      'Meenakshi PillaiGIT-2026-0444',
      'No group',
      'None yet',
      'No access yet',
    ]);
  });

  it('failed for now: nothing changes and every answer stays', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openAdd(runtime);
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Meenakshi Pillai');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'meenakshi.pillai@godavari.edu.in',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0444');
    const version = sample.worldVersion();
    faults(sample).failNext('PeopleService.addStudent');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add student' })).not.toHaveClass('is-busy'),
    );
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Meenakshi Pillai');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(sample.worldVersion()).toBe(version);
  });
});

describe('IA-10 — Add faculty member (B2-07 f3)', () => {
  it('name and e-mail only; added and listed on the Faculty tab', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const first = await openAdd(runtime, '?type=faculty');
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Faculty');
    expect(main().querySelector('a.xr-back')).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty',
    );
    expect(main().querySelector('.xr-notice--quiet')).toHaveTextContent(
      'Assign the courses they teach after adding them, in Faculty courses.',
    );
    expect(screen.queryByRole('textbox', { name: 'Student ID' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Student details' })).toBeNull();
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Dr Kavitha Rao');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'kavitha.rao@godavari.edu.in',
    );
    await user.click(screen.getByRole('button', { name: 'Add faculty member' }));
    const result = await waitFor(() => {
      const element = main().querySelector<HTMLElement>('#person-added');
      expect(element).not.toBeNull();
      return element!;
    });
    expect(result).toHaveTextContent(
      'Dr Kavitha Rao is in People now, with no courses yet. No invitation or e-mail is sent.',
    );
    // "Assign a course" (IA-15) is not built: not rendered.
    expect(within(result).queryByRole('link')).toBeNull();
    expect(
      within(result).getByRole('button', { name: 'Add another faculty member' }),
    ).toBeVisible();
    first.view.unmount();

    inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    await waitFor(() => expect(rowsOf()).toHaveLength(4));
    expect(cellsOf(rowNamed('Dr Kavitha Rao'))).toEqual([
      'Dr Kavitha Raokavitha.rao@godavari.edu.in',
      'No courses yet',
      'Active',
    ]);
  });
});

describe('IA-10 while the institution is paused', () => {
  it('Deccan’s Institute Admin sees the read-only notice, not the form', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    await openAdd(runtime);
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(screen.queryByRole('textbox', { name: 'Full name' })).toBeNull();
  });
});
