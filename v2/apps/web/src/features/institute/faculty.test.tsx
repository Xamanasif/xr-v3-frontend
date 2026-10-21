/**
 * Phase-2 Package 2B, Faculty, on the real composition root and the sample world: IA-09 Faculty
 * record (B2-06 f15, f16) and IA-15 People › Faculty courses (B2-09). Every row, course, status,
 * date, ID and refusal is the ports' answer; the commands go out with the revision the page read
 * and their refusals write nothing. A Faculty course mapping sets what the faculty member sees in
 * their own workspace only — it gives students nothing. Fixtures: `after-setup` (three faculty: Dr
 * S. Ranganathan teaching ME ZG523 through FMAP-0021, Dr Anita Desai with no course, Prof. Ravi
 * Shankar inactive; ME ZG523 in content access) and the walk through `D2-submit` (5 Nov 2026: one
 * written answer in ME ZG523 waiting for marking — B2-09 f2's warning).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  asPersonId,
  beginSession,
  buildWorld,
  faults,
  fixtureWorld,
  stepsTo,
} from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { dayMonthYear } from '@/copy/dates';
import { composePlatform } from '@/platform/composition';
import { assembleRuntime, createQueryClient, type PlatformRuntime } from '@/platform/runtime';
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
import { FacultyRecord } from './ia-09-faculty-record/faculty-record';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const SHANKAR = 'per-0016';
const RAHUL = 'per-0002';
const THERMO = 'thermodynamics-heat-transfer';
const ME_ZG523 = 'ME ZG523 — Thermodynamics & Heat Transfer';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

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
/** The list's count beside its search (`p.ia-gm-count[role=status]`), announced. */
const count = () => main().querySelector('section [role="status"]');
const rowsOf = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const region = (name: string) => screen.getByRole('region', { name });
const flash = () => document.getElementById('faculty-courses-flash');

/** A V3 list row by the name its row link shows (`a.rk-rowlink`). */
function rowNamed(name: string): HTMLTableRowElement {
  const row = rowsOf().find((candidate) =>
    candidate.querySelector('a.rk-rowlink')?.textContent?.startsWith(name),
  );
  if (!row) throw new Error(`No row for ${name}`);
  return row;
}

/** A record's internal reference: none in any People word (the identifier rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

/**
 * No internal reference in the document's words (hidden and screen-reader-only words and the
 * announcements included), in any `aria-label`, `title` or `placeholder`, or in the tab's title.
 */
function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

async function facultyOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.people.getFaculty(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function directoryOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.people.listFaculty();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function mappingsOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.facultyCourses.list();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** Pauses Godavari as the Super Admin would (B7-04), from another session. */
async function pauseGodavari(sample: Sample) {
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

/**
 * Meera's tab on the walk through a step (`D2-submit`: Rahul's written answer is waiting for
 * marking in ME ZG523, which only Dr S. Ranganathan teaches).
 */
async function platformThrough(step: string) {
  const { steps, at } = stepsTo({ through: step });
  const world = await buildWorld(await fixtureWorld('spine-start'), steps, {
    seedId: `faculty-${step}`,
    at,
  });
  const composed = composePlatform({ dataSource: 'sample', world });
  const runtime = assembleRuntime({
    composed,
    queryClient: createQueryClient('sample'),
    publicSessionKey: 'public:bs-test',
  });
  beginSession(composed.sample, MEERA);
  await runtime.session.refresh();
  return { runtime, sample: composed.sample };
}

// ---- IA-09 Faculty record (V3 IA-v1 IA-09; B2-06 f15, f16) ------------------------------------

async function openRecord(runtime: PlatformRuntime, id: string) {
  const rendered = inInstitute(
    runtime,
    `/institute/people/faculty/${id}`,
    <FacultyRecord facultyId={id} />,
  );
  await screen.findByRole('heading', {
    level: 1,
    name: (await facultyOf(runtime, id)).faculty.fullName,
  });
  return rendered;
}

const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });

describe('IA-09 — the faculty member’s record as it is (B2-06 f15, f16)', () => {
  it('Dr S. Ranganathan: his course, who assigned it, the way to Faculty courses (f15)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openRecord(runtime, RANGANATHAN);
    const record = await facultyOf(runtime, RANGANATHAN);
    const mapping = record.mappings[0]!;

    expect(within(crumbs()).getByRole('link', { name: 'Faculty' })).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty',
    );
    expect(crumbs()).toHaveTextContent('FacultyDr S. Ranganathan');
    expect(main().querySelector('.rk-eyebrow')).toHaveTextContent('Faculty');
    const meta = main().querySelector('.rk-meta')!;
    expect(meta.querySelector('.xr-st--ok')).toHaveTextContent('Active');
    // The status, the e-mail and when they were added, once in the head.
    expect(meta).toHaveTextContent(
      `Actives.ranganathan@godavari.edu.inAdded ${dayMonthYear(record.faculty.added.at)} · Meera Iyer`,
    );
    const assign = screen.getByRole('link', { name: 'Assign a course' });
    expect(assign).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(assign).toHaveAttribute(
      'href',
      `/institute/people?tab=faculty-courses&faculty=${RANGANATHAN}`,
    );

    const taught = region('Courses taught');
    expect(within(taught).getByRole('link', { name: 'Open Faculty courses' })).toHaveAttribute(
      'href',
      '/institute/people?tab=faculty-courses',
    );
    const table = within(taught).getByRole('table', {
      name: 'Courses taught by Dr S. Ranganathan',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Course', 'Assigned', 'Action']);
    const rows = () => [...table.querySelectorAll<HTMLTableRowElement>('tbody tr')];
    // The course, the institution's own code for it (once the course codes have answered), when
    // and by whom — never the mapping's reference (the identifier rule).
    await waitFor(() =>
      expect(rows().map(cellsOf)).toEqual([
        [
          'ME ZG523Thermodynamics & Heat TransferYour course code MEC-523',
          `Assigned${dayMonthYear(mapping.assignedAt)} · Meera Iyer`,
          'Remove…',
        ],
      ]),
    );
    // "Remove…" opens Faculty courses for this person, where the removal is confirmed.
    expect(
      within(table).getByRole('link', { name: 'Remove ME ZG523 from Dr S. Ranganathan' }),
    ).toHaveAttribute('href', `/institute/people?tab=faculty-courses&faculty=${RANGANATHAN}`);
    expect(taught).toHaveTextContent(
      'These courses set what Dr S. Ranganathan sees in the Faculty workspace. They never give students access.',
    );
    // No deactivation or edit of a faculty member is designed (PER-07, PER-08).
    expect(within(main()).queryAllByRole('button')).toEqual([]);
    expectNoReferences();
    // The tab's title names the faculty member.
    await waitFor(() => expect(document.title).toMatch(/^Dr S\. Ranganathan · /));
  });

  it('Dr Anita Desai, no courses yet: one way to assign one (f16)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openRecord(runtime, DESAI);
    const taught = region('Courses taught');
    expect(within(taught).getByRole('heading', { level: 3, name: 'No courses yet' })).toBeVisible();
    expect(taught).toHaveTextContent('Assign a course so it appears in Desai’s Faculty workspace.');
    expect(within(taught).queryByRole('table')).toBeNull();
    // The way to Faculty courses is in the section's head in every state.
    expect(within(taught).getByRole('link', { name: 'Open Faculty courses' })).toBeVisible();
    const assigns = screen.getAllByRole('link', { name: 'Assign a course' });
    expect(assigns.map((link) => [link.className, link.getAttribute('href')])).toEqual([
      [
        'rb-btn rb-btn--primary rb-btn--lg',
        `/institute/people?tab=faculty-courses&faculty=${DESAI}`,
      ],
      ['rb-btn', `/institute/people?tab=faculty-courses&faculty=${DESAI}`],
    ]);
    expectNoReferences();
  });

  it('Prof. Ravi Shankar, inactive: no course can be assigned to him, and the record says why', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openRecord(runtime, SHANKAR);
    expect(main().querySelector('.rk-meta .rk-st-ended')).toHaveTextContent('Inactive');
    expect(screen.queryByRole('link', { name: 'Assign a course' })).toBeNull();
    const notice = main().querySelector('.rk-notice--off')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent(
      'This faculty account is inactiveInactive faculty members can’t be assigned courses.',
    );
    const taught = region('Courses taught');
    expect(within(taught).getByRole('heading', { level: 3, name: 'No courses yet' })).toBeVisible();
    expect(taught).not.toHaveTextContent('Assign a course so it appears');
    expect(taught).toHaveTextContent('Inactive faculty members can’t be assigned courses.');
  });

  it('an unknown ID, a student’s ID or another institution’s admin is the in-shell not-found page', async () => {
    for (const [person, id] of [
      [MEERA, 'per-9999'],
      [MEERA, RAHUL],
      [PAUSED_INSTITUTE_ADMIN, RANGANATHAN],
    ] as const) {
      const { runtime } = await tabPlatform(person, 'after-setup');
      const { view } = inInstitute(
        runtime,
        `/institute/people/faculty/${id}`,
        <FacultyRecord facultyId={id} />,
      );
      expect(
        await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
      expect(main()).not.toHaveTextContent('Ranganathan');
      view.unmount();
    }
  });

  it('while paused: read-only, the course still listed', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await pauseGodavari(sample);
    await runtime.session.refresh();
    await openRecord(runtime, RANGANATHAN);
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Read-only while your institution’s access is pausedYou can change the courses they teach again when BITS lifts the pause.',
      ),
    );
    expect(screen.queryByRole('link', { name: 'Assign a course' })).toBeNull();
    expect(screen.queryByRole('link', { name: /^Remove / })).toBeNull();
    const table = screen.getByRole('table', { name: 'Courses taught by Dr S. Ranganathan' });
    expect(cellsOf(table.querySelector('tbody tr')!)[0]).toContain('ME ZG523');
    expect(cellsOf(table.querySelector('tbody tr')!)[2]).toBe('');
    expectNoReferences();
  });
});

// ---- IA-15 People › Faculty courses (V3 IA-v1 IA-15; B2-09) -----------------------------------

async function openFacultyCourses(runtime: PlatformRuntime, extra = '') {
  const rendered = inInstitute(
    runtime,
    '/institute/people',
    <People />,
    `?tab=faculty-courses${extra}`,
  );
  await waitFor(() => expect(rowsOf()).toHaveLength(3));
  return rendered;
}

const who = () => screen.getByRole<HTMLSelectElement>('combobox', { name: 'Faculty member' });
const courseSelect = () => screen.getByRole<HTMLSelectElement>('combobox', { name: 'Course' });
const assignButton = () => screen.getByRole('button', { name: 'Assign course' });
const panel = () => screen.getByRole('region', { name: 'Assign a course' });
const optionTexts = (select: HTMLSelectElement) =>
  [...select.options].map((option) => option.textContent);

describe('IA-15 — who teaches which course (B2-09 f0)', () => {
  it('the table, the panel and their words, from the ports', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { navigation } = await openFacultyCourses(runtime);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Who teaches which course. This sets what each faculty member sees in their workspace.',
      ),
    ).toBeVisible();
    expect(count()).toHaveTextContent('3 faculty members');
    const table = screen.getByRole('table', { name: 'Who teaches which course' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Faculty member', 'Courses taught', 'Status', 'Action']);
    expect(rowsOf().map(cellsOf)).toEqual([
      [
        'Dr S. Ranganathans.ranganathan@godavari.edu.in',
        'Courses taughtME ZG523Remove…',
        'Active',
        'Assign a course',
      ],
      [
        'Dr Anita Desaianita.desai@godavari.edu.in',
        'Courses taughtNo courses yet',
        'Active',
        'Assign a course',
      ],
      [
        'Prof. Ravi Shankarravi.shankar@godavari.edu.in',
        'Courses taughtNo courses yet',
        'Inactive',
        '',
      ],
    ]);
    expect(rowsOf().map((row) => row.querySelector('a.rk-rowlink')?.textContent)).toEqual(
      (await directoryOf(runtime)).map((row) => row.faculty.fullName),
    );
    // Each name opens IA-09 Faculty record; the code chip names its course on hover.
    expect(within(table).getByRole('link', { name: 'Dr Anita Desai' })).toHaveAttribute(
      'href',
      `/institute/people/faculty/${DESAI}`,
    );
    expect(rowNamed('Dr S. Ranganathan').querySelector('.rk-code')).toHaveAttribute(
      'title',
      'Thermodynamics & Heat Transfer',
    );
    const remove = within(table).getByRole('button', {
      name: 'Remove ME ZG523 from Dr S. Ranganathan',
    });
    expect(remove).toHaveTextContent('Remove…');
    expect(remove).toHaveClass('rb-btn--ghost', 'ia-btn--sm');
    expect(
      within(table)
        .getAllByRole('button', { name: /^Assign a course to / })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Assign a course to Dr S. Ranganathan', 'Assign a course to Dr Anita Desai']);

    // The panel beside the list (`ia-rec-grid--wide`).
    expect(panel()).toHaveClass('rk-surface', 'ia-fcform');
    expect(panel().closest('.ia-rec-side')).not.toBeNull();
    expect(optionTexts(who())).toEqual([
      'Choose a faculty member',
      'Dr S. Ranganathan',
      'Dr Anita Desai',
    ]);
    expect(who()).toHaveValue('');
    expect(who()).toHaveAccessibleDescription('Active faculty members only');
    expect(optionTexts(courseSelect())).toEqual(['Choose a course', ME_ZG523]);
    expect(courseSelect()).toHaveAccessibleDescription('Courses in your content access');
    expect(panel()).toHaveTextContent(
      'The course appears in that person’s Faculty workspace. It doesn’t give students anything.',
    );
    // No header action on this tab; the tab is current; the tab's title.
    expect(main().querySelector('.rk-head-act')).toBeNull();
    const tabs = within(screen.getByRole('navigation', { name: 'People' })).getAllByRole('link');
    expect(tabs.find((tab) => tab.getAttribute('aria-current') === 'page')).toHaveTextContent(
      'Faculty courses',
    );
    await waitFor(() => expect(document.title).toMatch(/^Faculty courses · /));
    expectNoReferences();
  });

  it('search by name or e-mail, its chip, its no match and “Clear search”', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime);
    const search = screen.getByRole('searchbox', { name: 'Search faculty' });
    expect(search).toHaveAttribute('placeholder', 'Search faculty name or e-mail');
    await user.type(search, 'RAVI.SHANKAR@');
    expect(count()).toHaveTextContent('1 of 3 faculty members');
    expect(rowsOf().map(cellsOf)[0]![0]).toBe('Prof. Ravi Shankarravi.shankar@godavari.edu.in');
    expect(
      screen.getByRole('button', { name: 'Remove filter Search: “RAVI.SHANKAR@”' }),
    ).toBeVisible();
    // The panel is not narrowed.
    expect(optionTexts(who())).toHaveLength(3);
    await user.clear(search);
    await user.type(search, 'nobody');
    expect(await screen.findByText('No faculty members match')).toBeVisible();
    expect(count()).toHaveTextContent('0 of 3 faculty members');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    await waitFor(() => expect(search).toHaveFocus());
  });

  it('loading is announced; a failure has “Try again”', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    faults(sample).failNext('FacultyCourseService.list');
    inInstitute(runtime, '/institute/people', <People />, '?tab=faculty-courses');
    expect(await screen.findByText('Loading faculty courses')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the faculty courses');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
  });
});

describe('IA-15 — Assign a course (B2-09 f0, f1, f4)', () => {
  it('the service checks, one error at a time, focus on its field; nothing is written', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime);
    const version = sample.worldVersion();

    await user.click(assignButton());
    const first = await screen.findByRole('alert');
    expect(first).toHaveTextContent('Choose a faculty member');
    expect(first).toHaveClass('rk-ferr');
    await waitFor(() => expect(who()).toHaveFocus());
    expect(who()).toHaveAttribute('aria-invalid', 'true');
    expect(who()).toHaveAccessibleDescription(
      'Active faculty members only Choose a faculty member',
    );

    await user.selectOptions(who(), 'Dr Anita Desai');
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(assignButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a course');
    await waitFor(() => expect(courseSelect()).toHaveFocus());
    expect(courseSelect()).toHaveAttribute('aria-invalid', 'true');
    expect(who()).not.toHaveAttribute('aria-invalid');

    await user.selectOptions(who(), 'Dr S. Ranganathan');
    await user.selectOptions(courseSelect(), THERMO);
    await user.click(assignButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dr S. Ranganathan already teaches ME ZG523',
    );
    await waitFor(() => expect(courseSelect()).toHaveFocus());
    expect(flash()).toBeNull();
    expect(sample.worldVersion()).toBe(version);
  });

  it('a row’s “Assign a course” chooses the person; assigned, the flash takes focus and every screen agrees', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const first = await openFacultyCourses(runtime);
    await user.click(screen.getByRole('button', { name: 'Assign a course to Dr Anita Desai' }));
    expect(who()).toHaveValue(DESAI);
    await waitFor(() => expect(courseSelect()).toHaveFocus());
    await user.selectOptions(courseSelect(), THERMO);
    await user.click(assignButton());

    await waitFor(() =>
      expect(flash()).toHaveTextContent(
        'SavedDr Anita Desai now teaches ME ZG523. It appears in their Faculty workspace.',
      ),
    );
    expect(flash()).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(flash()).toHaveAttribute('role', 'status');
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(cellsOf(rowNamed('Dr Anita Desai'))[1]).toBe('Courses taughtME ZG523Remove…');
    expect(who()).toHaveValue('');
    expect(courseSelect()).toHaveValue('');
    const mapping = (await mappingsOf(runtime)).find(
      (candidate) => candidate.facultyId === DESAI && candidate.removedAt === null,
    )!;
    expect(mapping.courseId).toBe(THERMO);
    expectNoReferences();
    first.view.unmount();

    // IA-08 People › Faculty lists it.
    const faculty = inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    await waitFor(() => expect(rowsOf()).toHaveLength(3));
    expect(cellsOf(rowNamed('Dr Anita Desai'))[1]).toBe(
      'Courses taughtME ZG523Thermodynamics & Heat Transfer',
    );
    faculty.view.unmount();

    // IA-09 Faculty record lists it, named by its course and when it was assigned.
    await openRecord(runtime, DESAI);
    const table = screen.getByRole('table', { name: 'Courses taught by Dr Anita Desai' });
    await waitFor(() =>
      expect(cellsOf(table.querySelector('tbody tr')!)).toEqual([
        'ME ZG523Thermodynamics & Heat TransferYour course code MEC-523',
        `Assigned${dayMonthYear(mapping.assignedAt)} · Meera Iyer`,
        'Remove…',
      ]),
    );
    expectNoReferences();
    // Nothing reaches the students: a course mapping is not student access.
    expect(
      (await directoryOf(runtime)).find((row) => row.faculty.id === DESAI)!.coursesTaught,
    ).toEqual([THERMO]);
  });

  it('`&faculty=` chooses an active faculty member only (from IA-09)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    // IA-09's "Assign a course" address, as the record renders it.
    const record = await openRecord(runtime, DESAI);
    const address = screen
      .getAllByRole('link', { name: 'Assign a course' })[0]!
      .getAttribute('href')!;
    record.view.unmount();
    expect(address).toBe(`/institute/people?tab=faculty-courses&faculty=${DESAI}`);

    const desai = await openFacultyCourses(runtime, `&faculty=${DESAI}`);
    expect(who()).toHaveValue(DESAI);
    expect(courseSelect()).toHaveValue('');
    expect(desai.navigation.replace).not.toHaveBeenCalled();
    desai.view.unmount();

    for (const id of [SHANKAR, 'per-9999']) {
      const other = await openFacultyCourses(runtime, `&faculty=${id}`);
      expect(who()).toHaveValue('');
      other.view.unmount();
    }
  });

  it('failed for now: nothing changes and the choices stay', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime, `&faculty=${DESAI}`);
    await user.selectOptions(courseSelect(), THERMO);
    faults(sample).failNext('FacultyCourseService.assign');
    await user.click(assignButton());
    await waitFor(() => expect(assignButton()).not.toHaveAttribute('aria-disabled'));
    expect(assignButton()).not.toHaveClass('ia-btn--busy');
    expect(who()).toHaveValue(DESAI);
    expect(courseSelect()).toHaveValue(THERMO);
    expect(flash()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(cellsOf(rowNamed('Dr Anita Desai'))[1]).toBe('Courses taughtNo courses yet');
  });
});

describe('IA-15 — Remove… (B2-09 f2, f3)', () => {
  it('no written answers waiting: confirmed without a warning; removed, the flash takes focus (f3)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime);
    await user.click(
      screen.getByRole('button', { name: 'Remove ME ZG523 from Dr S. Ranganathan' }),
    );
    // Destructive DL-1: an alert dialog, its confirm red only inside it.
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Remove ME ZG523 from Dr S. Ranganathan?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'ME ZG523 will no longer appear in their Faculty workspace.',
    );
    expect(dialog.querySelector('.rk-notice--warn')).toBeNull();
    // Focus starts on Cancel (board 10; VD-07).
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus(),
    );
    expect(within(dialog).getByRole('button', { name: 'Remove course' })).toHaveClass(
      'ia-btn--danger',
    );
    expectNoReferences();

    await user.click(within(dialog).getByRole('button', { name: 'Remove course' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(flash()).toHaveTextContent('ME ZG523 was removed from Dr S. Ranganathan.');
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(cellsOf(rowNamed('Dr S. Ranganathan'))[1]).toBe('Courses taughtNo courses yet');
    const [mapping] = await mappingsOf(runtime);
    expect(mapping!.id).toBe('FMAP-0021');
    expect(mapping!.removedAt).not.toBeNull();
    // The record keeps the removed mapping and lists no course.
    expect((await facultyOf(runtime, RANGANATHAN)).mappings).toHaveLength(1);
    expect((await directoryOf(runtime))[0]!.coursesTaught).toEqual([]);
  });

  it('a written answer waiting and no other marker: the drawn warning; Cancel writes nothing (f2)', async () => {
    const { runtime, sample } = await platformThrough('D2-submit');
    const user = userEvent.setup();
    await openFacultyCourses(runtime);
    const version = sample.worldVersion();
    const remove = screen.getByRole('button', { name: 'Remove ME ZG523 from Dr S. Ranganathan' });
    await user.click(remove);
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Remove ME ZG523 from Dr S. Ranganathan?',
    });
    const warning = dialog.querySelector('.rk-notice.rk-notice--warn')!;
    expect(warning.querySelector('.rk-notice-t')).toHaveTextContent(
      'Written answers would have no marker',
    );
    expect(warning).toHaveTextContent(
      '1 written answer in ME ZG523 is waiting for marking, and no other faculty member teaches the course. It will wait without a marker until you assign one.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(remove).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
    expect(cellsOf(rowNamed('Dr S. Ranganathan'))[1]).toBe('Courses taughtME ZG523Remove…');
  });

  it('removed meanwhile in another session: refused, nothing written, the list as it is', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime);
    await user.click(
      screen.getByRole('button', { name: 'Remove ME ZG523 from Dr S. Ranganathan' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    const [mapping] = await mappingsOf(runtime);
    const elsewhere = await asPersonId(sample, MEERA).facultyCourses.remove({
      mappingId: mapping!.id,
      expectedRev: mapping!.rev,
    });
    expect(elsewhere.ok).toBe(true);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Remove course' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    expect(flash()).toBeNull();
    await waitFor(() =>
      expect(cellsOf(rowNamed('Dr S. Ranganathan'))[1]).toBe('Courses taughtNo courses yet'),
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Dr S. Ranganathan' })).toHaveFocus(),
    );
  });
});

describe('IA-15 while the institution is paused: read-only (B2-01 f5)', () => {
  it('no assigning, no “Assign a course”, no “Remove…”; the list stays', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await pauseGodavari(sample);
    await runtime.session.refresh();
    await openFacultyCourses(runtime);
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Read-only while your institution’s access is pausedYou can assign or remove courses again when BITS lifts the pause.',
      ),
    );
    // The panel says why nothing can be assigned, and offers no field.
    expect(panel()).toHaveTextContent(
      'Assign a courseAssigning is unavailable while your institution’s access is paused.',
    );
    expect(screen.queryByRole('combobox', { name: 'Faculty member' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assign course' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Assign a course/ })).toBeNull();
    expect(rowsOf().map(cellsOf)[0]).toEqual([
      'Dr S. Ranganathans.ranganathan@godavari.edu.in',
      'Courses taughtME ZG523',
      'Active',
      '',
    ]);
    expectNoReferences();
  });

  it('paused meanwhile: the write is refused, nothing written, the tab turns read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openFacultyCourses(runtime, `&faculty=${DESAI}`);
    await user.selectOptions(courseSelect(), THERMO);
    await pauseGodavari(sample);
    const version = sample.worldVersion();
    await user.click(assignButton());
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(sample.worldVersion()).toBe(version);
    expect(screen.queryByRole('button', { name: 'Assign course' })).toBeNull();
    expect(panel()).toHaveTextContent(
      'Assigning is unavailable while your institution’s access is paused.',
    );
    await waitFor(() => expect(document.getElementById('faculty-courses-paused')).toHaveFocus());
  });
});
