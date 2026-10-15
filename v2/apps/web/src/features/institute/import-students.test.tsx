/**
 * Phase-2 Package 2B, IA-11 Import students (B2-07 f5 … f10), on the real composition root and the
 * sample world: the file is a real file read in the browser, the check is
 * `PeopleService.previewStudentImport` (it writes nothing), every count and problem is the
 * service's answer, and "Import N students" is `commitStudentImport` — all or nothing, the interim
 * T-24. Fixture `after-setup` (8 Oct 2026): Godavari with twelve students already imported, its
 * own course code MEC-523 for ME ZG523, Meera Iyer its Institute Admin; the files here bring new
 * student IDs and e-mails.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
import { ImportStudents } from './ia-11-import-students/import-students';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;

const HEADER = 'student_id,full_name,email,programme,course,course_code';
const row = (
  id: string,
  name: string,
  email: string,
  programme = 'B.Tech Mechanical',
  code = 'ME ZG523',
) => `${id},${name},${email},${programme},Thermodynamics & Heat Transfer,${code}`;

/** B2-07 f6's four drawn errors (duplicate ID, empty programme, short e-mail, empty course code). */
const WITH_ERRORS = [
  HEADER,
  row('GIT-2026-0501', 'Asha Rao', 'asha.rao@godavari.edu.in'),
  row('GIT-2026-0502', 'Ravi Teja', 'ravi.teja@godavari.edu.in'),
  row('GIT-2026-0502', 'Ravi T.', 'ravi.t@godavari.edu.in'),
  row('GIT-2026-0503', 'Kiran Das', 'kiran.das@godavari.edu.in', ''),
  row('GIT-2026-0504', 'Leela Nair', 'leela.nair@godavari'),
  row('GIT-2026-0505', 'Mohan Iyer', 'mohan.iyer@godavari.edu.in', 'B.Tech Mechanical', ''),
].join('\r\n');

/** The corrected file: three students, one filed under the institution's own code (MEC-523). */
const CORRECTED = [
  HEADER,
  row('GIT-2026-0501', 'Asha Rao', 'asha.rao@godavari.edu.in'),
  row('GIT-2026-0502', 'Ravi Teja', 'ravi.teja@godavari.edu.in'),
  row('GIT-2026-0503', 'Kiran Das', 'kiran.das@godavari.edu.in', 'B.Tech Mechanical', 'MEC-523'),
].join('\n');

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const heading = () => screen.getByRole('heading', { level: 1 });
const chooseButton = () => screen.getByRole('button', { name: 'Choose a CSV file' });
const fileInput = () => main().querySelector<HTMLInputElement>('input[type="file"]')!;
const bodyRows = () => [...main().querySelectorAll<HTMLTableRowElement>('tbody tr')];
const cellsOf = (tr: HTMLTableRowElement) =>
  [...tr.querySelectorAll('td')].map((td) => td.textContent);

async function openImport(runtime: PlatformRuntime) {
  const rendered = inInstitute(runtime, '/institute/people/import', <ImportStudents />);
  await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
  return rendered;
}

async function choose(user: ReturnType<typeof userEvent.setup>, text: string, name: string) {
  await user.upload(fileInput(), new File([text], name, { type: 'text/csv' }));
  await waitFor(() =>
    expect(main().querySelector('.xw-file .xw-file-name')).toHaveTextContent(name),
  );
}

async function checkFile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Check file' }));
  await screen.findByRole('heading', { level: 1, name: 'Check rows' });
  await waitFor(() => expect(heading()).toHaveFocus());
}

async function students(runtime: PlatformRuntime, search: string) {
  const answer = await runtime.ports.people.listStudents({ search });
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

describe('IA-11 step 1 — the template and the chooser (B2-07 f5)', () => {
  it('draws the step, the template, a real CSV chooser and “Choose a CSV file first”', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('Import students');
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect(within(crumbs).getByRole('link', { name: 'People' })).toHaveAttribute(
      'href',
      '/institute/people',
    );
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Students');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/institute/people');
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 1 of 3');
    expect(heading()).toHaveAttribute('tabindex', '-1');
    // The steps: in the page (rule S3), the first one current.
    const steps = screen.getByRole('list', { name: 'Import students' });
    expect(steps).toHaveClass('xr-steps');
    const items = within(steps).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.xr-step-label')?.textContent)).toEqual([
      'Choose a file',
      'Check rows',
      'Confirm import',
    ]);
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveClass('is-current');

    // The template: its words, the six required columns and the header-only download.
    expect(screen.getByRole('heading', { level: 2, name: 'Use the template' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'One row per student. Every column is required: the student’s details (student_id, full_name, email), their programme, the course and its course_code — the BITS code (for example ME ZG523) or your institution’s code (MEC-523).',
    );
    const columns = screen.getByRole('list', { name: 'Template columns, all required' });
    expect(
      within(columns)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['student_id', 'full_name', 'email', 'programme', 'course', 'course_code']);
    const download = screen.getByRole('link', { name: 'Download the template (CSV)' });
    expect(download).toHaveAttribute('download', 'students-template.csv');
    expect(download).toHaveAttribute(
      'href',
      'data:text/csv;charset=utf-8,student_id%2Cfull_name%2Cemail%2Cprogramme%2Ccourse%2Ccourse_code%0A',
    );

    // The chooser: a real file input (CSV), opened by the drawn button, which says what is chosen.
    expect(main().querySelector('.xw-file')).toHaveTextContent('No file chosen');
    expect(fileInput()).toHaveAttribute('accept', '.csv,text/csv');
    expect(fileInput()).toHaveAttribute('tabindex', '-1');
    expect(chooseButton()).toHaveClass('xr-btn--secondary', 'xr-btn--sm');
    expect(chooseButton()).toHaveAccessibleDescription('No file chosen');
    const opened = vi.spyOn(fileInput(), 'click').mockImplementation(() => undefined);
    await user.click(chooseButton());
    expect(opened).toHaveBeenCalledTimes(1);
    opened.mockRestore();
    expect(main()).toHaveTextContent(
      'Students are added to People with no experiments. No invitation or e-mail is sent.',
    );
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/institute/people',
    );

    // "Check file" with no file: the service's drawn words, and the chooser takes focus.
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('xw-ferr');
    expect(alert).toHaveTextContent('Choose a CSV file first');
    await waitFor(() => expect(chooseButton()).toHaveFocus());
    expect(chooseButton()).toHaveAccessibleDescription('No file chosen Choose a CSV file first');
    expect(heading()).toHaveTextContent('Choose a file');
    expect(sample.worldVersion()).toBe(version);

    // Choosing a file names it and clears the words.
    await choose(user, CORRECTED, 'godavari-new.csv');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(chooseButton()).toHaveAccessibleDescription('godavari-new.csv');
  });

  it('a file without the template’s columns, or without rows, is refused under the chooser', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(user, 'name,e-mail\nAsha Rao,asha.rao@godavari.edu.in', 'names.csv');
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file doesn’t use the template’s columns. Download the template and put one student on each row under its six columns.',
    );
    await waitFor(() => expect(chooseButton()).toHaveFocus());
    expect(heading()).toHaveTextContent('Choose a file');

    await choose(user, `${HEADER}\n`, 'empty.csv');
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file has no students in it. Add one row per student under the template’s columns.',
    );
  });

  it('a file over 1 MB is not read: no file is chosen', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await user.upload(
      fileInput(),
      new File([`${HEADER}\n${'x'.repeat(1_048_577)}`], 'huge.csv', { type: 'text/csv' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file is larger than 1 MB. Split the students into smaller files and import them one at a time.',
    );
    expect(main().querySelector('.xw-file')).toHaveTextContent('No file chosen');
  });
});

describe('IA-11 step 2 — the rows, as the service checked them (B2-07 f6, f7, f10)', () => {
  it('errors block the import: the counts, the notice, the rows to fix; nothing is written (f6)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(user, WITH_ERRORS, 'godavari-new.csv');
    const version = sample.worldVersion();
    await checkFile(user);
    expect(sample.worldVersion()).toBe(version);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 2 of 3');
    const steps = within(screen.getByRole('list', { name: 'Import students' })).getAllByRole(
      'listitem',
    );
    expect(steps[0]).toHaveClass('is-done');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(main().querySelector('p.xw-file-name')).toHaveTextContent('godavari-new.csv');

    const counts = main().querySelector('.xw-counts')!;
    expect(counts).toHaveAttribute('role', 'status');
    expect([...counts.querySelectorAll('.xw-tag')].map((tag) => tag.textContent)).toEqual([
      '6 rows checked',
      '2 ready to import',
      '4 rows with errors',
    ]);
    const notice = main().querySelector('.xr-notice--err')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent(
      'Nothing is imported while the file has errors' +
        'Fix the rows marked Error in your file, then choose it again.',
    );
    const table = screen.getByRole('table', { name: 'Rows that need attention' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Row', 'Student', 'What to fix', 'Type']);
    expect(bodyRows().map(cellsOf)).toEqual([
      [
        '4',
        'Ravi T.GIT-2026-0502',
        'Student ID GIT-2026-0502 is also in row 3. Each student needs a different ID.',
        'Error — blocks import',
      ],
      [
        '5',
        'Kiran DasGIT-2026-0503',
        'Programme is empty. Every row needs the student’s programme.',
        'Error — blocks import',
      ],
      [
        '6',
        'Leela NairGIT-2026-0504',
        'E-mail “leela.nair@godavari” isn’t a full address.',
        'Error — blocks import',
      ],
      [
        '7',
        'Mohan IyerGIT-2026-0505',
        'Course code is empty. Every row needs the course code (ME ZG523 or MEC-523).',
        'Error — blocks import',
      ],
    ]);
    // Each row is an error row, its cells labelled for the stacked report at 375 (f10).
    expect(bodyRows()[0]).toHaveClass('is-error');
    expect(
      [...bodyRows()[0]!.querySelectorAll('td')].map((td) => td.getAttribute('data-label')),
    ).toEqual(['Row', 'Student', 'What to fix', 'Type']);
    expect(bodyRows()[0]!.querySelector('.xr-status--err')).toBeTruthy();
    expect(main()).not.toHaveTextContent('Warning');
    // All or nothing (T-24 interim): no way on, only the corrected file.
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Choose the corrected file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    expect(main().querySelector('.xw-file')).toHaveTextContent('No file chosen');
    await waitFor(() => expect(chooseButton()).toHaveFocus());
    expect(await students(runtime, 'Asha')).toEqual([]);
  });

  it('a row whose e-mail signs someone in is refused (the sample-mode identity safeguard)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(
      user,
      [
        HEADER,
        row('GIT-2026-0501', 'Asha Rao', 'meera.iyer@godavari.edu.in'),
        row('GIT-2026-0502', 'Ravi Teja', 'rahul.verma@godavari.edu.in'),
        row('GIT-2026-0418', 'Kiran Das', 'kiran.das@godavari.edu.in'),
      ].join('\n'),
      'clashes.csv',
    );
    await checkFile(user);
    expect(bodyRows().map((tr) => cellsOf(tr).slice(0, 3))).toEqual([
      [
        '2',
        'Asha RaoGIT-2026-0501',
        'E-mail “meera.iyer@godavari.edu.in” is already used to sign in to the platform. Use a different e-mail.',
      ],
      [
        '3',
        'Ravi TejaGIT-2026-0502',
        'E-mail “rahul.verma@godavari.edu.in” already belongs to someone in People.',
      ],
      [
        '4',
        'Kiran DasGIT-2026-0418',
        'Student ID GIT-2026-0418 is already used by Rahul Verma. Each student needs a different ID.',
      ],
    ]);
    expect(main().querySelector('.xw-counts')).toHaveTextContent('3 rows with errors');
  });

  it('the corrected file: no problems → Continue → confirm → Import → the result (f7, f8, f9)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const { view } = await openImport(runtime);
    await choose(user, CORRECTED, 'godavari-new.csv');
    await checkFile(user);
    expect(
      [...main().querySelectorAll('.xw-counts .xw-tag')].map((tag) => tag.textContent),
    ).toEqual(['3 rows checked', '3 ready to import']);
    expect(main().querySelector('.xr-notice--err')).toBeNull();
    expect(bodyRows()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Choose the corrected file' })).toBeNull();

    // Back keeps the file; checking again comes back here.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(main().querySelector('.xw-file')).toHaveTextContent('godavari-new.csv');
    await checkFile(user);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 3 of 3');
    expect(main().querySelector('.xr-lead')).toHaveTextContent(
      '3 students will be added to People from godavari-new.csv.',
    );
    expect(
      within(main().querySelector('.xr-section ul')!)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      'They won’t have any experiments yet — give access afterwards.',
      'No invitation or e-mail is sent.',
    ]);
    // Back to the rows and on again.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { level: 1, name: 'Check rows' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });

    await user.click(screen.getByRole('button', { name: 'Import 3 students' }));
    await screen.findByRole('heading', { level: 1, name: '3 students imported' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Import students');
    expect(screen.queryByRole('list', { name: 'Import students' })).toBeNull();
    const finished = main().querySelector('.xr-notice--ok')!;
    expect(finished).toHaveTextContent(
      'Import finished' +
        '3 students were added to People from godavari-new.csv. None of them has any experiments yet.',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Added' })).toBeVisible();
    expect(main()).toHaveTextContent('Asha Rao, Ravi Teja and Kiran Das.');
    expect(screen.getByRole('link', { name: 'Give students access' })).toHaveAttribute(
      'href',
      '/institute/student-access/give',
    );
    expect(screen.getByRole('link', { name: 'Give students access' })).toHaveClass(
      'xr-btn--primary',
    );
    expect(screen.getByRole('link', { name: 'View students' })).toHaveAttribute(
      'href',
      '/institute/people',
    );

    // In People now, with no access yet — the MEC-523 row filed under ME ZG523.
    const kiran = await students(runtime, 'Kiran Das');
    expect(
      kiran.map((entry) => [
        entry.directoryStatus,
        entry.given,
        entry.courses.map((course) => course.platformCode),
      ]),
    ).toEqual([['no-access-yet', [], ['ME ZG523']]]);
    // "Import another file" starts again.
    await user.click(screen.getByRole('button', { name: 'Import another file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(main().querySelector('.xw-file')).toHaveTextContent('No file chosen');
    view.unmount();

    forgetLastAddress();
    inInstitute(runtime, '/institute/people', <People />);
    await waitFor(() => expect(bodyRows().length).toBe(15));
    const asha = bodyRows().find((tr) =>
      tr.querySelector('td.is-primary')?.textContent?.startsWith('Asha Rao'),
    );
    expect(asha && cellsOf(asha)[3]).toBe('No access yet');
  });
});

describe('IA-11 step 3 — what the import may answer', () => {
  it('People changed since the check: nothing is imported and step 2 shows the rows as they are now', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(user, CORRECTED, 'godavari-new.csv');
    await checkFile(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    // Meanwhile, another tab adds Ravi Teja one at a time.
    const other = asPersonId(sample, MEERA);
    const added = await other.people.addStudent({
      fullName: 'Ravi Teja',
      institutionEmail: 'ravi.teja@godavari.edu.in',
      institutionStudentId: 'GIT-2026-0502',
      programme: '',
      groupId: null,
    });
    expect(added.ok).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Import 3 students' }));
    await screen.findByRole('heading', { level: 1, name: 'Check rows' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(main().querySelector('.xw-counts')).toHaveTextContent('1 row with an error');
    // One row, two problems: a line each, in the template's column order (IA-11.row.several).
    expect(bodyRows().map((tr) => cellsOf(tr).slice(0, 3))).toEqual([
      [
        '3',
        'Ravi TejaGIT-2026-0502',
        'Student ID GIT-2026-0502 is already used by Ravi Teja. Each student needs a different ID.',
      ],
      [
        '3',
        'Ravi TejaGIT-2026-0502',
        'E-mail “ravi.teja@godavari.edu.in” already belongs to someone in People.',
      ],
    ]);
    expect(await students(runtime, 'Asha')).toEqual([]);
  });

  it('a check no longer current (already imported elsewhere) goes back to step 1 with the file', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    // The batch is imported from another tab just before this tab's import reaches the service.
    const commandPorts = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = commandPorts(commandId);
      return {
        ...ports,
        people: {
          ...ports.people,
          commitStudentImport: async (input) => {
            await runtime.ports.people.commitStudentImport(input);
            return ports.people.commitStudentImport(input);
          },
        },
      };
    });
    await openImport(runtime);
    await choose(user, CORRECTED, 'godavari-new.csv');
    await checkFile(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    await user.click(screen.getByRole('button', { name: 'Import 3 students' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This check is no longer current. Check the file again.',
    );
    expect(main().querySelector('.xw-file')).toHaveTextContent('godavari-new.csv');
    // Checking again shows what is true now: every row is in People.
    await checkFile(user);
    expect(main().querySelector('.xw-counts')).toHaveTextContent('3 rows with errors');
  });

  it('failed for now: nothing changes and the import can be sent again', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(user, CORRECTED, 'godavari-new.csv');
    await checkFile(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    const version = sample.worldVersion();
    faults(sample).failNext('PeopleService.commitStudentImport');
    await user.click(screen.getByRole('button', { name: 'Import 3 students' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import 3 students' })).not.toHaveClass('is-busy'),
    );
    expect(heading()).toHaveTextContent('Confirm import');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(sample.worldVersion()).toBe(version);
    await user.click(screen.getByRole('button', { name: 'Import 3 students' }));
    await screen.findByRole('heading', { level: 1, name: '3 students imported' });
  });
});

describe('IA-11 while the institution is paused', () => {
  it('Deccan’s Institute Admin sees the read-only notice, not the flow', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    inInstitute(runtime, '/institute/people/import', <ImportStudents />);
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(heading()).toHaveTextContent('Import students');
    expect(screen.queryByRole('list', { name: 'Import students' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Choose a CSV file' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Check file' })).toBeNull();
  });

  it('a check refused because the institution was paused meanwhile turns the page read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openImport(runtime);
    await choose(user, CORRECTED, 'godavari-new.csv');
    await pauseGodavari(sample);
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'You can’t add people or change their accounts, groups or courses until BITS lifts the pause.',
      ),
    );
    await waitFor(() => expect(heading()).toHaveFocus());
    expect(heading()).toHaveTextContent('Import students');
    expect(screen.queryByRole('button', { name: 'Check file' })).toBeNull();
  });
});
