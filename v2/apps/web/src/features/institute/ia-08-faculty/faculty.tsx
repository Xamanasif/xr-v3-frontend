'use client';

import type { FacultyDirectoryRow } from '@xr/contracts/draft';
import { Button, EmptyState, StatusPill } from '@xr/ui';
import { useLayoutEffect, useRef, useState } from 'react';

import { FACULTY_TAB, facultyCountWords, PEOPLE_PAGE, STUDENTS_TAB } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import { useFacultyDirectory } from '@/queries/people';

import { ListFailed, ListLoading, PeopleToolbar } from '../ia-06-people/list-parts';

/**
 * IA-08 People › Faculty (B2-06 f14), the People page's `?tab=faculty`: every faculty member of the
 * institution as `PeopleService.listFaculty` answers, with the courses their current mappings name
 * ("No courses yet") and their status. The search ("Name or e-mail", ignoring case) narrows the
 * rows the read answered — the read takes no search (state-copy `IA-08.search`); the count "1 of 3
 * faculty members" is announced, and no match offers "Clear search". A faculty member's name opens
 * nothing: IA-09 Faculty record is not built (DEV-21). Faculty access (courses taught) is separate
 * from student experiment grants; no Faculty deactivation is designed (PER-07), so none is offered.
 */
export function FacultyTab() {
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

  // "Clear search" goes with the no-match state: focus returns to the search box when it had it.
  const listRef = useRef<HTMLDivElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    listRef.current?.querySelector<HTMLElement>('input[type="search"]')?.focus();
  });

  // B2-06 f5's line and button: the Faculty tab's failure shares them (state-copy `IA-08.failed`).
  if (failed) {
    return (
      <ListFailed
        title={stateWords('IA-08.failed')}
        line={STUDENTS_TAB.failedLine}
        retryLabel={STUDENTS_TAB.tryAgain}
        onRetry={() => void read.refetch()}
      />
    );
  }
  if (loading) {
    return (
      <ListLoading
        label={stateWords('IA-08.loading')}
        columns="grid-cols-[1.4fr_1.2fr_140px]"
        cells={3}
      />
    );
  }
  if (all.length === 0) {
    return (
      <div className="xr-section">
        <EmptyState icon="studentsPeople" title={stateWords('IA-08.empty')} />
      </div>
    );
  }

  const { columns } = FACULTY_TAB;
  return (
    <div ref={listRef}>
      <PeopleToolbar
        search={{
          id: 'people-faculty-search',
          label: PEOPLE_PAGE.searchLabel,
          placeholder: FACULTY_TAB.searchPlaceholder,
          value: search,
          onChange: setSearch,
        }}
        status={facultyCountWords(listed.length, all.length, wanted !== '')}
        chips={[]}
        clearLabel={PEOPLE_PAGE.clearFilters}
      />
      {listed.length > 0 ? (
        <div className="xr-table-wrap">
          <table className="xr-table">
            <caption className="xr-sr">{FACULTY_TAB.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{columns.member}</th>
                <th scope="col">{columns.coursesTaught}</th>
                <th scope="col">{columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {listed.map((row) => (
                <tr key={row.faculty.id}>
                  <td className="is-primary">
                    {/* B2-06 f14 links the name to IA-09 (not built: DEV-21). */}
                    <strong>{row.faculty.fullName}</strong>
                    <span className="xr-sub">{row.faculty.institutionEmail}</span>
                  </td>
                  <td data-label={columns.coursesTaught}>
                    {row.courses.length > 0
                      ? row.courses.map((course) => course.platformCode ?? course.name).join(', ')
                      : FACULTY_TAB.noCourses}
                  </td>
                  <td data-label={columns.status}>
                    {row.faculty.accountStatus === 'inactive' ? (
                      <StatusPill tone="off">{FACULTY_TAB.inactive}</StatusPill>
                    ) : (
                      <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="xr-section">
          <EmptyState
            icon="search"
            title={FACULTY_TAB.noMatchTitle}
            actions={
              <div className="xw-actions">
                <Button
                  variant="secondary"
                  onClick={(event) => {
                    pressed.current = event.currentTarget;
                    setSearch('');
                  }}
                >
                  {FACULTY_TAB.clearSearch}
                </Button>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
