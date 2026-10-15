'use client';

import type { StudentDirectoryRow } from '@xr/contracts/draft';
import { inDisplayOrder, type StudentDirectoryStatus } from '@xr/domain';
import {
  EmptyState,
  type FilterChip,
  FormatSet,
  type FormatCode,
  Link,
  NoMatch,
  StatusPill,
  type StatusTone,
} from '@xr/ui';
import { Fragment, useLayoutEffect, useRef, useState } from 'react';

import {
  DIRECTORY_STATUS_ORDER,
  DIRECTORY_STATUS_WORDS,
  groupChip,
  openStudentLabel,
  PEOPLE_PAGE,
  searchChip,
  statusChip,
  studentCountWords,
  STUDENTS_TAB,
} from '@/copy/institute-people';
import { formatName } from '@/copy/flow-state-words';
import { addPersonAddress, IMPORT_STUDENTS_ADDRESS, studentRecordAddress } from '@/nav/institute';
import { NOT_IN_GROUP, useAllStudents, useGroupList, useStudentDirectory } from '@/queries/people';

import { ListFailed, ListLoading, PeopleToolbar } from './list-parts';

const STATUS_TONE: Readonly<Record<StudentDirectoryStatus, StatusTone>> = {
  'access-active': 'ok',
  'no-access-yet': 'info',
  inactive: 'off',
};

/**
 * IA-06 People › Students (B2-06 f0 … f7): Search ("Name, student ID or e-mail"), Status and Group
 * ("Not in a group" too) go to `PeopleService.listStudents`, which decides which students match;
 * the groups are `GroupService.listGroups`'. The count "3 of 12 students" is announced, with a chip
 * per applied filter and "Clear filters"; the rows keep showing while the next answer loads. Each
 * name opens the student's record (IA-07). Loading, failed + "Try again", no match and the empty
 * state are drawn as B2-06 draws them; while there is no student at all only the empty state
 * shows. Below 760 px of content the rows become labelled blocks (f7).
 */
export function StudentsTab({ paused }: { readonly paused: boolean }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentDirectoryStatus | ''>('');
  const [group, setGroup] = useState('');
  const rows = useStudentDirectory({ status, group, search });
  const all = useAllStudents();
  const groups = useGroupList();

  const reads = [rows, all, groups];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const total = all.data?.ok ? all.data.value.length : 0;
  const listed: readonly StudentDirectoryRow[] = rows.data?.ok ? rows.data.value : [];
  const groupList = groups.data?.ok ? groups.data.value : [];

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setGroup('');
  };
  const groupName = (id: string) =>
    groupList.find((entry) => entry.group.id === id)?.group.name ?? id;
  const chips: FilterChip[] = [];
  if (search.trim() !== '')
    chips.push({ key: 'search', label: searchChip(search), onRemove: () => setSearch('') });
  if (status !== '')
    chips.push({ key: 'status', label: statusChip(status), onRemove: () => setStatus('') });
  if (group !== '')
    chips.push({
      key: 'group',
      label: group === NOT_IN_GROUP ? STUDENTS_TAB.notInGroup : groupChip(groupName(group)),
      onRemove: () => setGroup(''),
    });

  // The count is announced (`role="status"`): while the next filter's rows load, the rows on show
  // are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || rows.isPlaceholderData
      ? null
      : studentCountWords(listed.length, total, chips.length > 0);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  // "Clear filters" in the no-match state goes with that state: if it had focus, focus moves to
  // the first row's link once the rows are back (as SA-06 does), and only if focus was lost.
  const listRef = useRef<HTMLDivElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  const clearFromNoMatch = () => {
    const active = document.activeElement;
    pressed.current =
      active instanceof HTMLElement && active.closest('.xr-empty') !== null ? active : null;
    clearFilters();
  };
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    listRef.current?.querySelector<HTMLElement>('tbody a')?.focus();
  });

  if (failed) {
    return (
      <ListFailed
        title={STUDENTS_TAB.failedTitle}
        line={STUDENTS_TAB.failedLine}
        retryLabel={STUDENTS_TAB.tryAgain}
        onRetry={() => {
          for (const read of reads)
            if (read.isError || read.data?.ok === false) void read.refetch();
        }}
      />
    );
  }
  if (loading) {
    return (
      <ListLoading
        label={STUDENTS_TAB.loading}
        columns="grid-cols-[1.4fr_1fr_1.2fr_140px]"
        cells={4}
      />
    );
  }
  if (total === 0) {
    return (
      <div className="xr-section">
        <EmptyState
          icon="studentsPeople"
          title={STUDENTS_TAB.emptyTitle}
          actions={
            paused ? undefined : (
              <div className="xw-actions">
                <Link className="xr-btn xr-btn--secondary" href={addPersonAddress('student')}>
                  {PEOPLE_PAGE.addStudent}
                </Link>
                <Link className="xr-btn xr-btn--secondary" href={IMPORT_STUDENTS_ADDRESS}>
                  {PEOPLE_PAGE.importStudents}
                </Link>
              </div>
            )
          }
        >
          {STUDENTS_TAB.emptyLine}
        </EmptyState>
      </div>
    );
  }

  return (
    <div ref={listRef}>
      <PeopleToolbar
        search={{
          id: 'people-search',
          label: PEOPLE_PAGE.searchLabel,
          placeholder: STUDENTS_TAB.searchPlaceholder,
          value: search,
          onChange: setSearch,
        }}
        filters={[
          {
            id: 'people-status',
            label: STUDENTS_TAB.statusLabel,
            value: status,
            onChange: (value) => setStatus(value as StudentDirectoryStatus | ''),
            options: [
              { value: '', label: STUDENTS_TAB.allStatuses },
              ...DIRECTORY_STATUS_ORDER.map((value) => ({
                value,
                label: DIRECTORY_STATUS_WORDS[value],
              })),
            ],
          },
          {
            id: 'people-group',
            label: STUDENTS_TAB.groupLabel,
            value: group,
            onChange: setGroup,
            className: 'xr-filter-2',
            options: [
              { value: '', label: STUDENTS_TAB.allGroups },
              ...groupList.map((entry) => ({ value: entry.group.id, label: entry.group.name })),
              { value: NOT_IN_GROUP, label: STUDENTS_TAB.notInGroup },
            ],
          },
        ]}
        status={countWords}
        chips={chips}
        onClearFilters={chips.length > 0 ? clearFilters : undefined}
        clearLabel={PEOPLE_PAGE.clearFilters}
      />
      {listed.length > 0 ? (
        <StudentTable rows={listed} />
      ) : (
        <div className="xr-section">
          <NoMatch title={STUDENTS_TAB.noMatchTitle} onClearFilters={clearFromNoMatch}>
            {STUDENTS_TAB.noMatchLine}
          </NoMatch>
        </div>
      )}
    </div>
  );
}

/** B2-06 table: "Student · Course and group · Experiments given · Status". */
function StudentTable({ rows }: { readonly rows: readonly StudentDirectoryRow[] }) {
  const { columns } = STUDENTS_TAB;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{STUDENTS_TAB.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.student}</th>
            <th scope="col">{columns.courseAndGroup}</th>
            <th scope="col">{columns.experimentsGiven}</th>
            <th scope="col">{columns.status}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const codes = row.courses.map((course) => course.platformCode ?? course.name);
            const groupText =
              row.groups.length > 0
                ? row.groups.map((entry) => entry.name).join(', ')
                : STUDENTS_TAB.noGroup;
            return (
              <tr key={row.student.id}>
                <td className="is-primary">
                  <Link
                    href={studentRecordAddress(row.student.id)}
                    aria-label={openStudentLabel(row.student.fullName)}
                  >
                    <strong>{row.student.fullName}</strong>
                  </Link>
                  <span className="xr-sub xr-id">{row.student.institutionStudentId}</span>
                </td>
                <td data-label={columns.courseAndGroup}>
                  {codes.length > 0 ? (
                    <>
                      {codes.join(', ')}
                      <span className="xr-sub">{groupText}</span>
                    </>
                  ) : (
                    groupText
                  )}
                </td>
                <td data-label={columns.experimentsGiven}>
                  {row.given.length > 0 ? (
                    row.given.map((given) => (
                      <Fragment key={given.experimentId}>
                        {given.name}
                        <span className="xr-sub">
                          <FormatSet compact formats={formatCodes(given.formats)} />
                        </span>
                      </Fragment>
                    ))
                  ) : (
                    <span className="text-ink-3">{STUDENTS_TAB.noneYet}</span>
                  )}
                </td>
                <td data-label={columns.status}>
                  <StatusPill tone={STATUS_TONE[row.directoryStatus]}>
                    {DIRECTORY_STATUS_WORDS[row.directoryStatus]}
                  </StatusPill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The plan's formats as chips, in the display order WEB · AR · VR · MR. */
export function formatCodes(formats: Parameters<typeof inDisplayOrder>[0]): FormatCode[] {
  return inDisplayOrder(formats).map((format) => formatName(format) as FormatCode);
}
