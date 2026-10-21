'use client';

import type { FacultyDirectoryRow } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  IaCellText,
  IaCourseLine,
  IaFacultyTable,
  type IaFilterChip,
  IaManageCount,
  IaManageFilters,
  IaManageFoot,
  IaManageSearch,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  ListState,
  LoadingRows,
  StatusPill,
} from '@xr/ui/v3';
import { useState } from 'react';

import { FACULTY_V3, openFacultyLabel, PEOPLE_V3 } from '@/copy/ia-people';
import { removeFilterLabel } from '@/copy/ia-shared';
import {
  FACULTY_TAB,
  facultyCountWords,
  PEOPLE_PAGE,
  searchChip,
  STUDENTS_TAB,
} from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import { addPersonAddress, facultyRecordAddress } from '@/nav/institute';
import { useFacultyDirectory } from '@/queries/people';

import { PeoplePausedNotice } from '../ia-06-people/people-parts';

const IDS = { title: 'pf-f-h', search: 'pf-q' } as const;

/** One skeleton row: the name and its e-mail, the courses, the status. */
const SKELETON = [2, 1, 1] as const;

/**
 * IA-08 People › Faculty — the V3 export's Faculty tab (IA-v1 `Main.dc.html` IA-08): every faculty
 * member of the institution as `PeopleService.listFaculty` answers, with the courses their current
 * mappings name ("No courses yet") and their status, in the role's list table; the whole row opens
 * the Faculty record (IA-09).
 *
 * - **Search** ("Search name or e-mail", ignoring case) narrows the rows the read answered — the
 *   read takes no search (state-copy `IA-08.search`); the count beside it ("1 of 3 faculty
 *   members") is announced, with the search's chip and "Clear filters". No match offers "Clear
 *   search" (focus back on the search).
 * - **Empty**: "No faculty members yet" with "Add faculty member" (not while paused).
 * - Loading and failed (not drawn by the export) are the register's words in the kit's states.
 * - The foot line says what courses taught set, in every state. Faculty access (courses taught) is
 *   separate from student experiment grants; no Faculty deactivation is designed (PER-07).
 */
export function FacultyTab({ paused }: { readonly paused: boolean }) {
  const [search, setSearch] = useState('');
  const read = useFacultyDirectory();
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const loading = !failed && read.isPending;
  const all: readonly FacultyDirectoryRow[] = read.data?.ok ? read.data.value : [];
  const wanted = search.trim().toLocaleLowerCase('en');
  const listed =
    wanted === ''
      ? all
      : all.filter((row) =>
          `${row.faculty.fullName} ${row.faculty.institutionEmail}`
            .toLocaleLowerCase('en')
            .includes(wanted),
        );
  const clearSearch = () => {
    setSearch('');
    document.getElementById(IDS.search)?.focus();
  };
  const chips: IaFilterChip[] = [];
  if (wanted !== '') {
    const label = searchChip(search);
    chips.push({
      key: 'search',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setSearch(''),
      focusId: IDS.search,
    });
  }

  let body;
  if (failed) {
    // B2-06 f5's line and button: the Faculty tab's failure shares them (state-copy `IA-08.failed`).
    body = (
      <ListState
        kind="failed"
        title={stateWords('IA-08.failed')}
        action={<Button onClick={() => void read.refetch()}>{STUDENTS_TAB.tryAgain}</Button>}
      >
        {STUDENTS_TAB.failedLine}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('IA-08.loading')} rows={1} cells={SKELETON} />;
  } else if (all.length === 0) {
    body = (
      <ListState
        kind="empty"
        roomy
        titleAs="h2"
        icon="user"
        title={FACULTY_V3.emptyTitle}
        action={
          paused ? null : (
            <ButtonLink href={addPersonAddress('faculty')}>{PEOPLE_PAGE.addFaculty}</ButtonLink>
          )
        }
      >
        {FACULTY_V3.emptyLine}
      </ListState>
    );
  } else if (listed.length === 0) {
    body = (
      <ListState
        kind="nomatch"
        title={FACULTY_TAB.noMatchTitle}
        action={<Button onClick={clearSearch}>{FACULTY_TAB.clearSearch}</Button>}
      >
        {FACULTY_V3.noMatchLine}
      </ListState>
    );
  } else {
    const { columns } = FACULTY_TAB;
    body = (
      <IaFacultyTable
        caption={FACULTY_V3.caption}
        headers={{
          member: columns.member,
          courses: columns.coursesTaught,
          status: columns.status,
        }}
        rows={listed.map((row) => ({
          key: row.faculty.id,
          name: row.faculty.fullName,
          href: facultyRecordAddress(row.faculty.id),
          accessibleName: openFacultyLabel(row.faculty.fullName),
          email: row.faculty.institutionEmail,
          courses:
            row.courses.length > 0 ? (
              row.courses.map((course) =>
                course.platformCode ? (
                  <IaCourseLine key={course.id} code={course.platformCode} name={course.name} />
                ) : (
                  <IaCellText key={course.id} kind="text">
                    {course.name}
                  </IaCellText>
                ),
              )
            ) : (
              <IaCellText kind="muted">{FACULTY_TAB.noCourses}</IaCellText>
            ),
          status:
            row.faculty.accountStatus === 'inactive' ? (
              <StatusPill tone="ended">{FACULTY_TAB.inactive}</StatusPill>
            ) : (
              <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
            ),
        }))}
      />
    );
  }

  return (
    <>
      {paused ? <PeoplePausedNotice line={PEOPLE_V3.paused.faculty} /> : null}
      <IaManageSurface labelledBy={IDS.title} hiddenTitle={FACULTY_V3.sectionTitle}>
        {!failed && !loading && all.length > 0 ? (
          <IaManageTools>
            <IaManageFilters label={FACULTY_V3.filterLabel}>
              <IaManageSearch
                id={IDS.search}
                label={FACULTY_V3.searchLabel}
                placeholder={FACULTY_V3.searchPlaceholder}
                value={search}
                onChange={setSearch}
              />
              <IaManageCount>
                {facultyCountWords(listed.length, all.length, wanted !== '')}
              </IaManageCount>
            </IaManageFilters>
            {chips.length > 0 ? (
              <IaManageStatus
                chips={chips}
                clearLabel={PEOPLE_PAGE.clearFilters}
                onClear={() => setSearch('')}
                clearFocusId={IDS.search}
              />
            ) : null}
          </IaManageTools>
        ) : null}
        {body}
        <IaManageFoot>{FACULTY_V3.foot}</IaManageFoot>
      </IaManageSurface>
    </>
  );
}
