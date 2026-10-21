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
/**
 * What a People list says it shows, announced: the Students tab's live line ("12 students shown",
 * `p.xr-sr[role=status]`) or the Faculty tab's count beside its search ("3 faculty members").
 */
const count = () => main().querySelector('section [role="status"]');
const rowsOf = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const region = (name: string) => screen.getByRole('region', { name });

async function studentRows(): Promise<HTMLTableRowElement[]> {
  await waitFor(() => expect(rowsOf().length).toBeGreaterThan(0));
  return rowsOf();
}

/** A V3 list row by the name its row link shows (`a.rk-rowlink`). */
function rowNamed(name: string): HTMLTableRowElement {
  const row = rowsOf().find((candidate) =>
    candidate.querySelector('a.rk-rowlink')?.textContent?.startsWith(name),
  );
  if (!row) throw new Error(`No row for ${name}`);
  return row;
}

/** A record's internal reference: none in any People word (the identifier rule). */
const PEOPLE_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

/**
 * No internal reference in the document's words (hidden and screen-reader-only words and the
 * announcements included), in any `aria-label`, `title` or `placeholder`, or in the tab's title.
 */
function expectNoPeopleReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(PEOPLE_REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        PEOPLE_REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(PEOPLE_REFERENCE);
}

/** The People tabs as [label, count words, address]. */
function peopleTabs() {
  return within(screen.getByRole('navigation', { name: 'People' }))
    .getAllByRole('link')
    .map((tab) => [
      tab.firstElementChild?.textContent,
      tab.querySelector('.xr-sr')?.textContent ?? null,
      tab.getAttribute('href'),
    ]);
}

/** The status switch's buttons as their names. */
const segmentNames = () =>
  within(screen.getByRole('group', { name: 'Show students by status' }))
    .getAllByRole('button')
    .map((button) => button.textContent);

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

// ---- IA-06 People › Students (V3 IA-v1 IA-06; B2-06 f0 … f7) -----------------------------------

describe('IA-06 — the students are the port’s answer (B2-06 f0)', () => {
  it('after the import: twelve students, the V3 roster and words, each opening the record', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />);
    const rows = await studentRows();
    const expected = await portStudents(runtime);
    expect(rows).toHaveLength(12);
    expect(rows.map((row) => row.querySelector('a.rk-rowlink')!.textContent)).toEqual(
      expected.map((row) => row.student.fullName),
    );
    const table = screen.getByRole('table', { name: 'Students at your institution' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Student', 'Group', 'Access', 'Action']);
    // Who (the institution's own ID and the e-mail), the group and course, the status in words,
    // and the "Give access" shortcut while the institution can give access.
    expect(cellsOf(rowNamed('Rahul Verma'))).toEqual([
      'Rahul VermaGIT-2026-0418 · rahul.verma@godavari.edu.in',
      // "Group: " leads the groups in the phone rows only (`span.ia-rt-plab`).
      'Group: ME ZG523 — Sem IIME ZG523',
      'No access yet',
      'Give access',
    ]);
    expect(cellsOf(rowNamed('Sneha Reddy')).slice(2)).toEqual([
      'InactiveExperiments given: No current experiments',
      '',
    ]);
    expect(cellsOf(rowNamed('Lakshmi Prasad'))[1]).toBe('No groupME ZG523');
    const rahul = screen.getByRole('link', { name: 'Open student record: Rahul Verma' });
    expect(rahul).toHaveAttribute('href', `/institute/people/students/${RAHUL}`);
    expect(screen.getByRole('link', { name: 'Give Rahul Verma access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?student=${RAHUL}`,
    );
    expect(count()).toHaveTextContent('12 students shown');
    // The status switch: every student, then the directory's statuses that occur.
    expect(segmentNames()).toEqual(['All 12', 'No access yet 11', 'Inactive 1']);
    expect(screen.getByRole('button', { name: 'All 12' })).toHaveAttribute('aria-pressed', 'true');
    // The head: "People", its line, one primary action and "Import students".
    expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    expect(main()).toHaveTextContent('Students and faculty at your institution');
    expect(screen.getByRole('link', { name: 'Add student' })).toHaveAttribute(
      'href',
      '/institute/people/add',
    );
    expect(screen.getByRole('link', { name: 'Import students' })).toHaveAttribute(
      'href',
      '/institute/people/import',
    );
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(main().querySelector('.rb-btn--primary')).toHaveTextContent('Add student');
    // The People tabs with their counts: Students (current), Faculty, Groups and Faculty courses.
    await waitFor(() =>
      expect(peopleTabs()).toEqual([
        ['Students', ', 12 students', '/institute/people'],
        ['Faculty', ', 3 faculty members', '/institute/people?tab=faculty'],
        ['Groups', ', 1 group', '/institute/people?tab=groups'],
        ['Faculty courses', null, '/institute/people?tab=faculty-courses'],
      ]),
    );
    const tabs = within(screen.getByRole('navigation', { name: 'People' })).getAllByRole('link');
    expect(tabs[0]).toHaveAttribute('aria-current', 'page');
    expectNoPeopleReferences();
  });

  it('after SACC-0310: Rahul is Access active with the experiment given now (f1)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/people', <People />);
    await studentRows();
    const rahul = rowNamed('Rahul Verma');
    expect(cellsOf(rahul)[2]).toBe('Access activeExperiments given: Shell-and-Tube Heat Exchanger');
    expect(rahul.querySelector('.xr-st.xr-st--ok')).toHaveTextContent('Access active');
    // Access active: no shortcut to give access.
    expect(within(rahul).queryByRole('link', { name: /^Give / })).toBeNull();
    const priya = rowNamed('Priya Natarajan');
    expect(priya.querySelector('.xr-st')).toHaveTextContent('No access yet');
    expect(priya.querySelector('.xr-st')!.className).toBe('xr-st');
    expect(
      within(priya).getByRole('link', { name: 'Give Priya Natarajan access' }),
    ).toHaveAttribute('href', `/institute/student-access/give?student=${PRIYA}`);
    expect(segmentNames()).toEqual(['All 12', 'Access active 1', 'No access yet 10', 'Inactive 1']);
    expectNoPeopleReferences();
  });

  it('the status switch, Search and Group go to the service; chips, Clear filters and no match (f2, f6)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    inInstitute(runtime, '/institute/people', <People />);
    await studentRows();

    await user.click(screen.getByRole('button', { name: 'Inactive 1' }));
    await waitFor(() => expect(count()).toHaveTextContent('1 student shown'));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(['Sneha Reddy']);
    expect(screen.getByRole('button', { name: 'Inactive 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // A status alone is the switch's: no chip, no "Clear filters".
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'All 12' }));
    await waitFor(() => expect(count()).toHaveTextContent('12 students shown'));

    const group = screen.getByRole('combobox', { name: 'Group' });
    expect([...group.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All groups',
      'ME ZG523 — Sem II',
      'Not in a group',
    ]);
    await user.selectOptions(group, 'Not in a group');
    const outside = await portStudents(runtime, { notInGroup: true });
    await waitFor(() => expect(main()).toHaveTextContent(`Showing ${outside.length} of 12`));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(
      outside.map((row) => row.student.fullName),
    );
    expect(screen.getByRole('button', { name: 'Remove filter Not in a group' })).toBeVisible();
    await user.selectOptions(group, 'ME ZG523 — Sem II');
    await waitFor(() => expect(main()).toHaveTextContent('Showing 7 of 12'));
    expect(
      screen.getByRole('button', { name: 'Remove filter Group: ME ZG523 — Sem II' }),
    ).toBeVisible();
    // With a status too, "of" counts that status.
    await user.click(screen.getByRole('button', { name: 'Inactive 1' }));
    await waitFor(() => expect(main()).toHaveTextContent('Showing 1 of 1'));
    await user.click(screen.getByRole('button', { name: 'All 12' }));

    const search = screen.getByRole('searchbox', { name: 'Search students' });
    expect(search).toHaveAttribute('placeholder', 'Search name, student ID or e-mail');
    await user.type(search, 'git-2026-0418');
    await waitFor(() => expect(main()).toHaveTextContent('Showing 1 of 12'));
    expect(rowsOf().map((row) => row.querySelector('a')!.textContent)).toEqual(['Rahul Verma']);
    // Removing a chip gives focus to the control that set it.
    await user.click(
      screen.getByRole('button', { name: 'Remove filter Group: ME ZG523 — Sem II' }),
    );
    expect(group).toHaveValue('');
    expect(group).toHaveFocus();
    await user.clear(search);
    await user.type(search, 'Meenakshi');
    expect(await screen.findByText('No students match these filters')).toBeVisible();
    expect(screen.getByText('Check the spelling, or search by student ID.')).toBeVisible();
    await waitFor(() => expect(count()).toHaveTextContent('0 students shown'));
    expect(screen.getByRole('button', { name: 'Remove filter Search: “Meenakshi”' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Clear filters' })).toHaveLength(1);
    expectNoPeopleReferences();
    act(() => screen.getByRole('button', { name: 'Show all students' }).focus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(rowsOf()).toHaveLength(12));
    expect(search).toHaveValue('');
    expect(count()).toHaveTextContent('12 students shown');
    await waitFor(() => expect(search).toHaveFocus());
  });

  it('loading is announced; a failure has “Try again” (f4, f5)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    faults(sample).failNext('PeopleService.listStudents');
    inInstitute(runtime, '/institute/people', <People />);
    expect(await screen.findByText('Loading students…')).toHaveAttribute('role', 'status');
    expect(document.querySelector('[aria-busy="true"] .rk-skel')).not.toBeNull();
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the students');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(await studentRows()).toHaveLength(12);
  });

  it('no students yet: the head’s actions are the way in, no toolbar (f3)', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />);
    expect(await screen.findByRole('heading', { level: 2, name: 'No students yet' })).toBeVisible();
    expect(
      screen.getByText(
        'Add students one at a time or import a CSV file with the buttons above. Adding a student doesn’t give them any experiments yet.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Add student' })).toHaveAttribute(
      'href',
      '/institute/people/add',
    );
    expect(screen.getByRole('link', { name: 'Import students' })).toHaveAttribute(
      'href',
      '/institute/people/import',
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Show students by status' })).toBeNull();
    await waitFor(() => expect(peopleTabs()[0]![1]).toBe(', 0 students'));
    expectNoPeopleReferences();
  });

  it('`?tab=students` (or any other tab) is the bare address', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { navigation } = inInstitute(runtime, '/institute/people', <People />, '?tab=students');
    await studentRows();
    expect(navigation.replace).toHaveBeenCalledWith('/institute/people');
  });
});

// ---- IA-08 People › Faculty (V3 IA-v1 IA-08; B2-06 f14) ----------------------------------------

describe('IA-08 — the faculty tab (B2-06 f14)', () => {
  it('three faculty members, the courses they teach, the search and its no match', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const { navigation } = inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    expect(navigation.replace).not.toHaveBeenCalled();
    const table = screen.getByRole('table', {
      name: 'Faculty at your institution and the courses they teach',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Faculty member', 'Courses taught', 'Status']);
    // The courses cell carries its label for the phone rows (`ia-lt-lab`).
    expect(rowsOf().map(cellsOf)).toEqual([
      [
        'Dr S. Ranganathans.ranganathan@godavari.edu.in',
        'Courses taughtME ZG523Thermodynamics & Heat Transfer',
        'Active',
      ],
      ['Dr Anita Desaianita.desai@godavari.edu.in', 'Courses taughtNo courses yet', 'Active'],
      [
        'Prof. Ravi Shankarravi.shankar@godavari.edu.in',
        'Courses taughtNo courses yet',
        'Inactive',
      ],
    ]);
    // Each row opens the Faculty record (IA-09), named for whom it opens.
    expect(
      within(table)
        .getAllByRole('link')
        .map((link) => [
          link.getAttribute('aria-label'),
          /^\/institute\/people\/faculty\/per-/.test(link.getAttribute('href') ?? ''),
        ]),
    ).toEqual([
      ['Open faculty record: Dr S. Ranganathan', true],
      ['Open faculty record: Dr Anita Desai', true],
      ['Open faculty record: Prof. Ravi Shankar', true],
    ]);
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
    expect(main()).toHaveTextContent(
      'Courses taught set what each person sees in the Faculty workspace. They never give students access.',
    );
    expectNoPeopleReferences();

    const search = screen.getByRole('searchbox', { name: 'Search faculty' });
    expect(search).toHaveAttribute('placeholder', 'Search name or e-mail');
    await user.type(search, 'DESAI');
    expect(count()).toHaveTextContent('1 of 3 faculty members');
    expect(rowsOf()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Remove filter Search: “DESAI”' })).toBeVisible();
    await user.clear(search);
    await user.type(search, 'nobody');
    expect(await screen.findByText('No faculty members match')).toBeVisible();
    expect(screen.getByText('Check the spelling of the name or e-mail.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    expect(search).toHaveFocus();
    // The foot line shows in every state.
    expect(main()).toHaveTextContent('Courses taught set what each person sees');
  });
});

// ---- IA-07 Student record (V3 IA-v1 IA-07; B2-06 f8 … f13, f17) ------------------------------------------------

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

describe('IA-07 — the student’s record as it is (V3 IA-v1 IA-07)', () => {
  it('Rahul before access: who he is, nothing given yet, one primary action', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openRecord(runtime, RAHUL);
    expect(main().querySelector('.rk-eyebrow')).toHaveTextContent('Student · GIT-2026-0418');
    expect(main().querySelector('.rk-meta')).toHaveTextContent(
      'Account activerahul.verma@godavari.edu.in',
    );
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs).toHaveTextContent('StudentsRahul Verma');
    expect(within(crumbs).getByRole('link', { name: 'Students' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    const give = screen.getAllByRole('link', { name: 'Give this student access' });
    expect(give).toHaveLength(2);
    for (const link of give)
      expect(link).toHaveAttribute('href', `/institute/student-access/give?student=${RAHUL}`);
    expect(give[0]).toHaveClass('rb-btn--primary');
    const given = region('Experiments given');
    expect(
      within(given).getByRole('heading', {
        level: 3,
        name: 'Rahul hasn’t been given any experiments yet',
      }),
    ).toBeVisible();
    expect(given).toHaveTextContent(
      'Give this student access to choose experiments from your access plan. They’ll see the formats the plan includes.',
    );
    expect(within(given).queryByRole('link', { name: 'Open Student access' })).toBeNull();
    const about = region('About Rahul Verma');
    expect(about).toHaveTextContent('CourseME ZG523 · Thermodynamics & Heat Transfer');
    expect(about).toHaveTextContent('GroupME ZG523 — Sem II');
    // The group's name opens the group (IA-14).
    expect(within(about).getByRole('link', { name: 'ME ZG523 — Sem II' })).toHaveAttribute(
      'href',
      '/institute/people/groups/GRP-0012',
    );
    expect(about).toHaveTextContent('ProgrammeB.Tech Mechanical');
    expect(about).toHaveTextContent('Added8 Oct 2026 · imported by Meera Iyer');
    expect(about).toHaveTextContent(
      'Deactivating stops this student from opening experiments until you reactivate the account. Their work and access history are kept.',
    );
    expect(within(about).getByRole('button', { name: 'Deactivate account…' })).toHaveClass(
      'rb-btn',
    );
    const history = region('History');
    const latest = history.querySelector('.rk-tl > li.is-latest')!;
    expect(latest.querySelector('.rk-tl-w')).toHaveTextContent('Added to People');
    expect(latest.querySelector('.rk-tl-t')).toHaveTextContent('8 Oct 2026, 15:40 · Meera Iyer');
    expect(latest.querySelector('.rk-tl-n')).toHaveTextContent(
      'Imported from godavari-me-zg523-corrected.csv',
    );
    expectNoPeopleReferences();
  });

  it('after the first grant: the grant’s own row (formats from the plan) and its history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    await openRecord(runtime, RAHUL);
    const given = region('Experiments given');
    expect(within(given).getByRole('link', { name: 'Open Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(
      within(given).getByRole('table', { name: /^Experiments given to Rahul Verma/ }),
    ).toBeVisible();
    const rows = [...given.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
    expect(rows.map(cellsOf)).toEqual([
      ['Shell-and-Tube Heat ExchangerME ZG523WEBVR', 'Individually9 Oct 2026', 'Active'],
    ]);
    expect(
      within(rows[0]!).getByRole('img', { name: 'Formats from your plan: WEB, VR' }),
    ).toBeVisible();
    expect(rows[0]!.querySelector('.xr-st--ok')).toHaveTextContent('Active');
    expect(given).toHaveTextContent(
      'Formats come from your access plan; they are never chosen per student.',
    );
    const latest = region('History').querySelector('.rk-tl > li.is-latest')!;
    expect(latest.querySelector('.rk-tl-w')).toHaveTextContent(
      'Given Shell-and-Tube Heat Exchanger',
    );
    expect(latest.querySelector('.rk-tl-t')).toHaveTextContent('9 Oct 2026, 10:20 · Meera Iyer');
    expect(latest.querySelector('.rk-tl-n')).toHaveTextContent(
      'Individually · WEB and VR from your access plan',
    );
    expectNoPeopleReferences();
  });

  it('later sample: a supplied wait through the group, in words', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, ARUN);
    const row = region('Experiments given').querySelector('tbody tr') as HTMLTableRowElement;
    expect(cellsOf(row).slice(1)).toEqual([
      'Group: ME ZG523 — Sem II12 Oct 2026',
      'Waiting for a licenceNo licence is available for Arun on your access plan right now.',
    ]);
    expect(within(row).getByRole('link', { name: 'Group: ME ZG523 — Sem II' })).toHaveAttribute(
      'href',
      '/institute/people/groups/GRP-0012',
    );
    expect(row.querySelector('.xr-st--warn')).toHaveTextContent('Waiting for a licence');
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent(
      'Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II',
    );
    expect(region('History').querySelector('.rk-tl-n')).toHaveTextContent(/^Group grant/);
    expectNoPeopleReferences();
  });

  it('later sample: Rahul’s two grants on one row, “Also in” the group (OD-B2-01)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, RAHUL);
    const rows = [
      ...region('Experiments given').querySelectorAll('tbody tr'),
    ] as HTMLTableRowElement[];
    expect(rows).toHaveLength(1);
    expect(cellsOf(rows[0]!)[1]).toBe(
      'Individually9 Oct 2026Also in ME ZG523 — Sem II, which has this experiment',
    );
    expect(rows[0]!.querySelector('.ia-cell-also')).not.toBeNull();
    expect(cellsOf(rows[0]!)[2]).toBe('Active');
    // No can / can't-open statement anywhere on the record.
    expect(main()).not.toHaveTextContent(/can open|can’t open it/i);
    expectNoPeopleReferences();
  });

  it('Sneha, inactive: the reason shown and Reactivate the one action', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openRecord(runtime, SNEHA);
    expect(main().querySelector('.rk-meta .rk-st-ended')).toHaveTextContent('Inactive');
    expect(screen.getByRole('button', { name: 'Reactivate account' })).toHaveClass(
      'rb-btn--primary',
    );
    expect(screen.queryByRole('link', { name: 'Give this student access' })).toBeNull();
    const notice = main().querySelector('.rk-notice.rk-notice--off')!;
    expect(notice).toHaveTextContent(
      'This account is inactiveInactive since 8 Oct 2026 · Meera Iyer: “Left the programme.” Sneha can’t open experiments until the account is reactivated.',
    );
    const row = region('Experiments given').querySelector('tbody tr') as HTMLTableRowElement;
    expect(cellsOf(row)[2]).toBe('Student inactiveSneha’s account is inactive.');
    const about = region('About Sneha Reddy');
    expect(within(about).queryByRole('button', { name: 'Deactivate account…' })).toBeNull();
    expect(about).toHaveTextContent(
      'Reactivating lets Sneha open the experiments they’ve been given again, while your access plan allows it.',
    );
    expect(region('History').querySelectorAll('.rk-tl-w')[1]).toHaveTextContent(
      'Account deactivated',
    );
    expectNoPeopleReferences();
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

describe('IA-07 — Deactivate and Reactivate (V3 IA-v1 IA-07, DL-2 and DL-1)', () => {
  it('a reason is required; deactivated, then reactivated, each in the history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Deactivate Priya Natarajan’s account?',
    });
    expect(dialog).toHaveTextContent(
      'Priya will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.',
    );
    expect(dialog).toHaveTextContent(
      'Shown on the student record to your institution’s administrators.',
    );
    expect(within(dialog).getByRole('button', { name: 'Deactivate account' })).toHaveClass(
      'ia-btn--danger',
    );
    const reason = within(dialog).getByRole('textbox', { name: 'Reason (required)' });
    await waitFor(() => expect(reason).toHaveFocus());
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent('Enter the reason for deactivating this account'),
    );
    expect(dialog.querySelector('.rk-ferr')).not.toBeNull();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('active');

    await user.type(reason, 'On leave this semester.');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(main().querySelector('.rk-notice--ok')).toHaveTextContent(
      'SavedAccount deactivated. Their work and access history are kept.',
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reactivate account' })).toHaveFocus(),
    );
    expect(main().querySelector('.rk-meta')).toHaveTextContent('Inactive');
    expect(main().querySelector('.rk-notice--off')).toHaveTextContent(
      /Inactive since \d+ Oct 2026 · Meera Iyer: “On leave this semester.”/,
    );
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent('Account deactivated');
    expect(region('History').querySelector('.rk-tl-n')).toHaveTextContent(
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
    expect(main().querySelector('.rk-notice--ok')).toHaveTextContent('Account reactivated.');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Deactivate account…' })).toHaveFocus(),
    );
    expect(main().querySelector('.rk-meta')).toHaveTextContent('Account active');
    expect(region('History').querySelector('.rk-tl-w')).toHaveTextContent('Account reactivated');
    expect((await recordOf(runtime, PRIYA)).student.accountStatus).toBe('active');
  });

  it('Cancel changes nothing and gives focus back', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    const version = sample.worldVersion();
    const open = screen.getByRole('button', { name: 'Deactivate account…' });
    await user.click(open);
    const dialog = await screen.findByRole('alertdialog');
    await user.type(within(dialog).getByRole('textbox'), 'Not now.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(open).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('deactivated meanwhile in another session: refused as stale, nothing written, the record as it is', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('alertdialog');
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
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(main().querySelector('.rk-notice--off')).toHaveTextContent('“From another tab.”'),
    );
    expect(main().querySelector('.rk-notice--ok')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Priya Natarajan' })).toHaveFocus(),
    );
  });

  it('failed for now: the dialog and its reason stay; nothing changes', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openRecord(runtime, PRIYA);
    await user.click(screen.getByRole('button', { name: 'Deactivate account…' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.type(within(dialog).getByRole('textbox'), 'On leave.');
    faults(sample).failNext('PeopleService.deactivateStudent');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate account' }));
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Deactivate account' }),
      ).not.toHaveAttribute('aria-disabled'),
    );
    expect(screen.getByRole('alertdialog')).toBeVisible();
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
        'Read-only while your institution’s access is pausedYou can give access or change this account again when BITS lifts the pause.',
      ),
    );
    expect(screen.queryByRole('link', { name: 'Give this student access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Deactivate account…' })).toBeNull();
    // The reads stay: the grant is still listed (by what it gives, never by its id).
    expect(region('Experiments given')).toHaveTextContent('Shell-and-Tube Heat Exchanger');
    expectNoPeopleReferences();
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

// ---- IA-10 Add a student / Add a faculty member (V3 IA-v1 IA-10; B2-07 f0 … f4) ---------------

async function openAdd(runtime: PlatformRuntime, search = '') {
  const rendered = inInstitute(runtime, '/institute/people/add', <AddPerson />, search);
  await screen.findByRole('heading', {
    level: 1,
    name: search ? 'Add faculty member' : 'Add student',
  });
  return rendered;
}

const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });

describe('IA-10 — Add student (B2-07 f0, f1, f2)', () => {
  it('validation in words, an error summary that takes focus (f0, f1)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openAdd(runtime);
    const version = sample.worldVersion();
    expect(main().querySelector('.rk-eyebrow')).toHaveTextContent('People');
    expect(within(crumbs()).getByRole('link', { name: 'Students' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    expect(crumbs()).toHaveTextContent('StudentsAdd student');
    expect(main().querySelector('.rk-notice--info')).toHaveTextContent(
      'Adding a student doesn’t give them any experiments' +
        'You give access separately, from Student access or the student’s record. No invitation or e-mail is sent.',
    );
    expect(screen.getByRole('group', { name: 'Who they are' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Student details' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Institution e-mail' })).toHaveAttribute(
      'placeholder',
      'name@godavari.edu.in',
    );
    // The example is the institution's own first student's ID, never a fixed one.
    const first = (await portStudents(runtime))[0]!.student.institutionStudentId;
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Student ID' })).toHaveAccessibleDescription(
        `Your institution’s ID, for example ${first}.`,
      ),
    );
    expect(
      screen.getByRole('textbox', { name: 'Programme (optional)' }),
    ).toHaveAccessibleDescription('Optional here. The CSV import asks for it.');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    expectNoPeopleReferences();

    await user.click(screen.getByRole('button', { name: 'Add student' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
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
    expect(main().querySelector('#person-student-id-e')).toHaveClass('rk-ferr');

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
    expectNoPeopleReferences();
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
    expect(result).toHaveAttribute('role', 'status');
    expect(result.querySelector('.rk-notice-t')).toHaveTextContent('Added');
    expect(result).toHaveTextContent(
      'Meenakshi Pillai is in People now, with no experiments yet. No invitation or e-mail is sent.',
    );
    // The result is named by its title; what was recorded follows.
    const surface = screen.getByRole('region', { name: 'Added' });
    expect(
      [...surface.querySelectorAll('dt')].map((term) => [
        term.textContent,
        term.nextElementSibling?.textContent,
      ]),
    ).toEqual([
      ['Student ID', 'GIT-2026-0444'],
      ['Institution e-mail', 'meenakshi.pillai@godavari.edu.in'],
      ['Group', 'ME ZG523 — Sem II'],
    ]);
    const listed = await portStudents(runtime, { search: 'meenakshi' });
    expect(listed).toHaveLength(1);
    const added = listed[0]!;
    expect(added.directoryStatus).toBe('no-access-yet');
    expect(added.groups.map((entry) => entry.name)).toEqual(['ME ZG523 — Sem II']);
    expect(added.student.programme).toBe('B.Tech Mechanical');
    expect(within(surface).getByRole('link', { name: 'Give this student access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?student=${added.student.id}`,
    );
    expect(within(surface).getByRole('link', { name: 'Back to Students' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    expectNoPeopleReferences();
    // The sample sign-in resolves people by e-mail: the new student signs in to their own workspace.
    const signedIn = await visitorPorts(sample).session.signIn({
      method: 'email',
      email: 'meenakshi.pillai@godavari.edu.in',
      password: 'any',
    });
    expect(signedIn.ok && signedIn.value.session.personId).toBe(added.student.id);
    expect(signedIn.ok && signedIn.value.landing).toBe('/student');

    await user.click(within(surface).getByRole('button', { name: 'Add another student' }));
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
    expect(count()).toHaveTextContent('13 students shown');
    // Added one at a time: no course filed (IA-06.no-course); the shortcut to give access once
    // the institution's standing has answered.
    await waitFor(() =>
      expect(cellsOf(rowNamed('Meenakshi Pillai'))).toEqual([
        'Meenakshi PillaiGIT-2026-0444 · meenakshi.pillai@godavari.edu.in',
        'No groupNo course recorded',
        'No access yet',
        'Give access',
      ]),
    );
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
      expect(screen.getByRole('button', { name: 'Add student' })).not.toHaveAttribute(
        'aria-disabled',
      ),
    );
    expect(screen.getByRole('button', { name: 'Add student' })).not.toHaveClass('ia-btn--busy');
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
    expect(within(crumbs()).getByRole('link', { name: 'Faculty' })).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty',
    );
    expect(main().querySelector('.rk-notice--info')).toHaveTextContent(
      'Adding a faculty member doesn’t assign any courses' +
        'Assign the courses they teach after adding them, in Faculty courses. No invitation or e-mail is sent.',
    );
    expect(screen.queryByRole('textbox', { name: 'Student ID' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Student details' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty',
    );
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
    const surface = screen.getByRole('region', { name: 'Added' });
    expect(
      [...surface.querySelectorAll('dt')].map((term) => [
        term.textContent,
        term.nextElementSibling?.textContent,
      ]),
    ).toEqual([
      ['Institution e-mail', 'kavitha.rao@godavari.edu.in'],
      ['Courses taught', 'None yet'],
    ]);
    // "Assign a course" opens Faculty courses with them chosen (IA-15; B2-07 f3).
    expect(
      within(surface).getByRole('link', { name: 'Assign a course' }).getAttribute('href'),
    ).toMatch(/^\/institute\/people\?tab=faculty-courses&faculty=per-/);
    expect(
      within(surface).getByRole('button', { name: 'Add another faculty member' }),
    ).toBeVisible();
    expect(within(surface).getByRole('link', { name: 'Back to Faculty' })).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty',
    );
    expectNoPeopleReferences();
    first.view.unmount();

    inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    await waitFor(() => expect(rowsOf()).toHaveLength(4));
    expect(cellsOf(rowNamed('Dr Kavitha Rao'))).toEqual([
      'Dr Kavitha Raokavitha.rao@godavari.edu.in',
      'Courses taughtNo courses yet',
      'Active',
    ]);
  });
});

describe('IA-10 while the institution is paused', () => {
  it('Deccan’s Institute Admin sees the refusal, not the form', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    inInstitute(runtime, '/institute/people/add', <AddPerson />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'You can’t add people while your institution’s access is paused',
      }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'People and their work are kept. You can add people again when BITS lifts the pause.',
    );
    expect(screen.queryByRole('textbox', { name: 'Full name' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to Students' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    const refusal = screen.getByRole('region', {
      name: 'You can’t add people while your institution’s access is paused',
    });
    expect(within(refusal).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
    expectNoPeopleReferences();
  });

  it('paused meanwhile: the add is refused, nothing written, the refusal takes focus', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openAdd(runtime);
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Meenakshi Pillai');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'meenakshi.pillai@godavari.edu.in',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0444');
    await pauseGodavari(sample);
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    const refusal = await screen.findByRole('heading', {
      level: 1,
      name: 'You can’t add people while your institution’s access is paused',
    });
    await waitFor(() => expect(refusal).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect(screen.queryByRole('textbox', { name: 'Full name' })).toBeNull();
  });
});
