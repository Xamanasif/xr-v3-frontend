'use client';

import type { StudentDirectoryRow } from '@xr/contracts/draft';
import type { StudentDirectoryStatus } from '@xr/domain';
import {
  Button,
  type IaFilterChip,
  IaLiveLine,
  IaManageFilters,
  IaManageSearch,
  IaManageSelect,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  IaRoster,
  type IaRosterRow,
  IaSegments,
  ListState,
  LoadingRows,
  StatusPill,
} from '@xr/ui/v3';
import { useState } from 'react';

import {
  giveStudentAccessLabel,
  PEOPLE_V3,
  STUDENTS_V3,
  studentsShownWords,
} from '@/copy/ia-people';
import { removeFilterLabel, showingLabel } from '@/copy/ia-shared';
import {
  DIRECTORY_STATUS_ORDER,
  DIRECTORY_STATUS_WORDS,
  groupChip,
  openStudentLabel,
  PEOPLE_PAGE,
  searchChip,
  STUDENTS_TAB,
} from '@/copy/institute-people';
import { giveAccessAddress, studentRecordAddress } from '@/nav/institute';
import { useInstituteOverview } from '@/queries/institute-home';
import { NOT_IN_GROUP, useAllStudents, useGroupList, useStudentDirectory } from '@/queries/people';

import { formatCodes } from '../shared/format-codes';
import { directoryStatusView } from '../shared/status-model';
import { PeoplePausedNotice } from './people-parts';

/** The status switch: every student, or one directory status (`listStudents`' `status`). */
type Segment = 'all' | StudentDirectoryStatus;

const IDS = {
  title: 'pp-s-h',
  search: 'pp-q',
  group: 'pp-grp',
} as const;

/** The two-line skeleton of the student cell, then one line each (the export's loading row). */
const SKELETON = [2, 1, 1, 1, 1] as const;

/**
 * IA-06 People › Students — the V3 export's Students tab (IA-v1 `Main.dc.html` IA-06, R1 layout):
 * the search ("Search name, student ID or e-mail") and the Group select ("Not in a group" too) in
 * one row, the status switch with its counts, then the roster (Student · Group · Access) whose
 * whole row opens the record.
 *
 * - **Reads**: Search, the status and Group go to `PeopleService.listStudents`, which decides which
 *   students match (the rows on show stay while the next answer loads); the switch's counts are the
 *   unfiltered answer's directory statuses; the groups are `GroupService.listGroups`'. The status
 *   words are the directory's own three (Access active · No access yet · Inactive): the export's
 *   other words (waiting, paused, ended, withdrawn, joined after a grant, removed from a group) are
 *   not held by the directory read and are not drawn.
 * - **Filters**: a chip per search or group filter with "Showing x of y" and "Clear filters"
 *   (which keeps the status); how many show is announced. No match offers "Show all students"
 *   (every filter cleared, focus on the search).
 * - **Give access**: a quiet shortcut on a "No access yet" row while the institution can give
 *   access (`getMyOverview`'s status active or ending soon), opening Give students access with
 *   the student chosen.
 * - Loading, failed + "Try again" and the empty state (the header's Add student / Import students
 *   are the way in) are drawn as the export draws them; while there is no student at all only the
 *   empty state shows. Paused: read-only, the paused notice above the list.
 */
export function StudentsTab({ paused }: { readonly paused: boolean }) {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [group, setGroup] = useState('');
  const status = segment === 'all' ? '' : segment;
  const rows = useStudentDirectory({ status, group, search });
  const all = useAllStudents();
  const groups = useGroupList();
  const overview = useInstituteOverview();

  const reads = [rows, all, groups];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const everyone: readonly StudentDirectoryRow[] = all.data?.ok ? all.data.value : [];
  const listed: readonly StudentDirectoryRow[] = rows.data?.ok ? rows.data.value : [];
  const groupList = groups.data?.ok ? groups.data.value : [];
  const institutionStatus = overview.data?.ok ? overview.data.value.status : null;
  const canGive =
    !paused && (institutionStatus === 'access-active' || institutionStatus === 'ending-soon');

  const counts = new Map<StudentDirectoryStatus, number>();
  for (const row of everyone)
    counts.set(row.directoryStatus, (counts.get(row.directoryStatus) ?? 0) + 1);
  const segments = [
    { key: 'all' as Segment, label: STUDENTS_V3.all, count: everyone.length },
    ...DIRECTORY_STATUS_ORDER.filter((key) => (counts.get(key) ?? 0) > 0 || segment === key).map(
      (key) => ({
        key: key as Segment,
        label: DIRECTORY_STATUS_WORDS[key],
        count: counts.get(key) ?? 0,
      }),
    ),
  ];
  const ofSegment = segments.find((entry) => entry.key === segment)?.count ?? everyone.length;

  const groupName = (id: string) =>
    groupList.find((entry) => entry.group.id === id)?.group.name ?? id;
  const chips: IaFilterChip[] = [];
  if (search.trim() !== '') {
    const label = searchChip(search);
    chips.push({
      key: 'search',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setSearch(''),
      focusId: IDS.search,
    });
  }
  if (group !== '') {
    const label = group === NOT_IN_GROUP ? STUDENTS_TAB.notInGroup : groupChip(groupName(group));
    chips.push({
      key: 'group',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setGroup(''),
      focusId: IDS.group,
    });
  }

  // How many show is announced (`role="status"`): while the next filter's rows load, the rows on
  // show are the previous answer's, so the words keep their last settled answer.
  const settled =
    loading || failed || rows.isPlaceholderData ? null : studentsShownWords(listed.length);
  const [liveWords, setLiveWords] = useState('');
  if (settled !== null && settled !== liveWords) setLiveWords(settled);

  const showAll = () => {
    setSearch('');
    setGroup('');
    setSegment('all');
    document.getElementById(IDS.search)?.focus();
  };

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={STUDENTS_TAB.failedTitle}
        action={
          <Button
            onClick={() => {
              for (const read of reads)
                if (read.isError || read.data?.ok === false) void read.refetch();
            }}
          >
            {STUDENTS_TAB.tryAgain}
          </Button>
        }
      >
        {STUDENTS_TAB.failedLine}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={STUDENTS_V3.loading} rows={1} cells={SKELETON} />;
  } else if (everyone.length === 0) {
    body = (
      <ListState kind="empty" roomy titleAs="h2" icon="people" title={STUDENTS_TAB.emptyTitle}>
        {paused ? PEOPLE_V3.paused.students : STUDENTS_V3.emptyLine}
      </ListState>
    );
  } else if (listed.length === 0) {
    body = (
      <ListState
        kind="nomatch"
        title={STUDENTS_TAB.noMatchTitle}
        action={<Button onClick={showAll}>{STUDENTS_V3.showAll}</Button>}
      >
        {STUDENTS_TAB.noMatchLine}
      </ListState>
    );
  } else {
    body = (
      <IaRoster
        caption={STUDENTS_V3.caption}
        headers={STUDENTS_V3.columns}
        rows={listed.map((row) => rosterRow(row, canGive))}
      />
    );
  }

  return (
    <>
      {paused ? <PeoplePausedNotice line={PEOPLE_V3.paused.students} /> : null}
      <IaManageSurface labelledBy={IDS.title} hiddenTitle={STUDENTS_V3.sectionTitle}>
        {!failed && !loading && everyone.length > 0 ? (
          <IaManageTools>
            <IaManageFilters label={STUDENTS_V3.filterLabel}>
              <IaManageSearch
                id={IDS.search}
                label={STUDENTS_V3.searchLabel}
                placeholder={STUDENTS_V3.searchPlaceholder}
                value={search}
                onChange={setSearch}
              />
              <IaManageSelect
                id={IDS.group}
                label={STUDENTS_TAB.groupLabel}
                value={group}
                onChange={setGroup}
                options={[
                  { value: '', label: STUDENTS_TAB.allGroups },
                  ...groupList.map((entry) => ({ value: entry.group.id, label: entry.group.name })),
                  { value: NOT_IN_GROUP, label: STUDENTS_TAB.notInGroup },
                ]}
              />
            </IaManageFilters>
            <IaSegments
              label={STUDENTS_V3.segmentsLabel}
              segments={segments}
              value={segment}
              onChange={setSegment}
            />
            {chips.length > 0 ? (
              <IaManageStatus
                shown={showingLabel(listed.length, ofSegment)}
                chips={chips}
                clearLabel={PEOPLE_PAGE.clearFilters}
                onClear={() => {
                  setSearch('');
                  setGroup('');
                }}
                clearFocusId={IDS.search}
              />
            ) : null}
          </IaManageTools>
        ) : null}
        <IaLiveLine>{liveWords}</IaLiveLine>
        {body}
      </IaManageSurface>
    </>
  );
}

/**
 * One roster row (the export's `rowsR`): the name opening the record, the institution's student
 * ID and e-mail; the groups and the course codes the student is filed against; the status in
 * words with the experiments given now; "Give access" on a "No access yet" row.
 */
function rosterRow(row: StudentDirectoryRow, canGive: boolean): IaRosterRow {
  const { student } = row;
  const groupNames = row.groups.map((entry) => entry.name);
  const codes = row.courses.map((course) => course.platformCode ?? course.name);
  const status = row.directoryStatus;
  const given = row.given.map((entry) => entry.name);
  return {
    key: student.id,
    name: student.fullName,
    href: studentRecordAddress(student.id),
    accessibleName: openStudentLabel(student.fullName),
    studentId: student.institutionStudentId,
    email: student.institutionEmail,
    groupLabel:
      groupNames.length === 0
        ? ''
        : groupNames.length > 1
          ? STUDENTS_V3.groupSeveral
          : STUDENTS_V3.groupOne,
    groups: groupNames.length > 0 ? groupNames.join(', ') : STUDENTS_TAB.noGroup,
    course: codes.length > 0 ? codes.join(', ') : STUDENTS_V3.noCourse,
    status: (
      <StatusPill tone={directoryStatusView(status).tone}>
        {directoryStatusView(status).words}
      </StatusPill>
    ),
    // "No access yet" already says it; another status without a current experiment says so plainly.
    experiments:
      given.length > 0 || status !== 'no-access-yet'
        ? {
            srLabel: STUDENTS_V3.experimentsGiven,
            text: given.length > 0 ? given.join(', ') : STUDENTS_V3.noCurrentExperiments,
          }
        : null,
    give:
      status === 'no-access-yet' && canGive && student.accountStatus !== 'inactive'
        ? {
            label: STUDENTS_V3.giveAccess,
            href: giveAccessAddress({ student: student.id }),
            accessibleName: giveStudentAccessLabel(student.fullName),
          }
        : null,
  };
}

/** Moved to `features/institute/shared/format-codes` (frozen API); re-exported for its importers. */
export { formatCodes };
