'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { CourseId, PersonId } from '@xr/domain';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  IaAssignPanel,
  IaCellText,
  IaCourseLine,
  IaFacultyCoursesTable,
  type IaFilterChip,
  IaManageCount,
  IaManageFilters,
  IaManageSearch,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  IaRecordGrid,
  ListState,
  LoadingRows,
  Notice,
  RecordLine,
  StatusPill,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import {
  assignedFlash,
  assignToLabel,
  courseCode,
  FACULTY_COURSES,
  noMarkerLine,
  removeBody,
  removeCourseLabel,
  removedFlash,
  removeTitle,
} from '@/copy/faculty';
import { FACULTY_COURSES_V3, FACULTY_V3, PEOPLE_V3 } from '@/copy/ia-people';
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
import { useAppNavigation } from '@/nav/navigation';
import { useCourseCodeList, useFacultyCourseList } from '@/queries/institute-records';
import { useFacultyDirectory } from '@/queries/people';
import { useCommand } from '@/queries/use-command';

import { PeopleFlash, PeoplePausedNotice } from '../ia-06-people/people-parts';
import {
  type AssignField,
  type ContentAccessCourse,
  courseChoices,
  facultyChoices,
  facultyCourseRows,
  type FacultyCoursesRow,
  firstAssignError,
  preselectedFaculty,
  searchRows,
  type TaughtCourse,
} from './faculty-courses-view';

const TITLE_ID = 'fc-h';
const SEARCH_ID = 'faculty-courses-search';
const WHO_ID = 'faculty-courses-who';
const COURSE_ID = 'faculty-courses-course';
const ERROR_ID = 'faculty-courses-error';
const FLASH_ID = 'faculty-courses-flash';
const PAUSED_ID = 'faculty-courses-paused';
const PANEL_TITLE_ID = 'faculty-courses-assign';
const FIELD_IDS: Readonly<Record<AssignField, string>> = { facultyId: WHO_ID, courseId: COURSE_ID };

/** One skeleton row: the name and its e-mail, the courses, the status, the action. */
const SKELETON = [2, 1, 1, 1] as const;

const nameId = (facultyId: string) => `faculty-courses-name-${facultyId}`;
const removeId = (mappingId: string) => `faculty-courses-rm-${mappingId}`;

/** The removal confirmation (B2-09 DL-1), with the mapping's revision when it opened. */
interface RemoveDialog {
  readonly facultyId: PersonId;
  readonly fullName: string;
  readonly code: string;
  readonly mappingId: NonNullable<TaughtCourse['mapping']>['id'];
  readonly expectedRev: number;
  /** `previewRemoval`'s drawn warning (B2-09 f2), or none (f3). */
  readonly warning: { readonly writtenAnswersWaiting: number; readonly courseCode: string } | null;
}

/**
 * IA-15 People › Faculty courses — the V3 export's Faculty courses tab (IA-v1 `Main.dc.html`
 * IA-15), the People page's `?tab=faculty-courses` (`&faculty=<id>` chooses that person in "Assign
 * a course").
 *
 * - **Reads**: the faculty (`PeopleService.listFaculty`), every Faculty course mapping
 *   (`FacultyCourseService.list`; the current ones are listed) and the courses in the institution's
 *   content access (`InstitutionCourseCodeService.list`) — state-copy `IA-15.reads`.
 * - **As drawn**: the intro line, the paused notice, the success flash (it takes focus), then the
 *   record grid: the list (search "Search faculty name or e-mail" with its count announced, its
 *   chip and Clear filters, no match → "Clear search"; Faculty member → IA-09 · Courses taught,
 *   each code chip with its quiet "Remove…" · Status · "Assign a course" for active members, which
 *   chooses them in the panel and moves focus to Course) beside the "Assign a course" panel — under
 *   the table below 1,060 px of content, stacked on phones.
 * - **Assign**: `FacultyCourseService.assign`; the service checks — "Choose a faculty member",
 *   "Choose a course", "<name> already teaches <course>" — one error under the fields, focus on its
 *   field. Assigned, the choices clear and the flash says what it does: the course appears in that
 *   person's Faculty workspace. It gives students nothing. When nothing can be assigned the panel
 *   says why (paused, no course in content access yet, no active faculty member).
 * - **Remove…**: `previewRemoval` first (it writes nothing), then DL-1 "Remove <code> from <name>?"
 *   (destructive, focus on Cancel) with the drawn warning when written answers would be left with
 *   no marker; "Remove course" sends `remove` with the mapping's revision. A refusal because it
 *   moved on closes the dialog and reads again (state-copy `IA-15.moved-on`); failed for now,
 *   nothing changes.
 * - **Paused institution**: read-only — the paused notice, no row "Assign a course", no "Remove…",
 *   and the panel says assigning is unavailable; a write refused `institution-paused` meanwhile
 *   shows the same.
 * - Faculty access is never student access, and no Faculty workspace is built here.
 */
export function FacultyCoursesTab({ paused }: { readonly paused: boolean }) {
  const navigation = useAppNavigation();
  const directoryRead = useFacultyDirectory();
  const mappingsRead = useFacultyCourseList();
  const coursesRead = useCourseCodeList();
  const reads = [directoryRead, mappingsRead, coursesRead] as const;
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.isPending);
  const refetch = () => {
    for (const read of reads) void read.refetch();
  };

  const [search, setSearch] = useState('');
  /** `null` until a choice is made: the `&faculty=` person (if active) is chosen meanwhile. */
  const [whoChoice, setWho] = useState<PersonId | '' | null>(null);
  const [course, setCourse] = useState<CourseId | ''>('');
  const [error, setError] = useState<{
    readonly field: AssignField;
    readonly message: string;
  } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [dialog, setDialog] = useState<RemoveDialog | null>(null);
  const [refusedPaused, setRefusedPaused] = useState(false);
  const readOnly = paused || refusedPaused;
  const assign = useCommand((ports) => ports.facultyCourses.assign);
  const preview = useCommand((ports) => ports.facultyCourses.previewRemoval);
  const remove = useCommand((ports) => ports.facultyCourses.remove);

  // Focus moves after the commit that shows its target (B2-09 `focus(id)`): the Course select after
  // a row's "Assign a course", a field after its error, the flash after a change, the search after
  // "Clear search", the row's name after a refusal that reads again. The dialog has given focus back
  // to its trigger in the same commit, so this request wins.
  const [focusRequest, setFocusRequest] = useState({ id: '', n: 0 });
  const handled = useRef(0);
  useEffect(() => {
    if (focusRequest.n === handled.current) return;
    const element = document.getElementById(focusRequest.id);
    if (!element) return;
    handled.current = focusRequest.n;
    element.focus();
  });
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const head = (
    <>
      <RecordLine>{FACULTY_COURSES.intro}</RecordLine>
      {readOnly ? (
        <PeoplePausedNotice id={PAUSED_ID} line={PEOPLE_V3.paused.facultyCourses} />
      ) : null}
      {flash ? <PeopleFlash id={FLASH_ID}>{flash}</PeopleFlash> : null}
    </>
  );

  if (
    failed ||
    loading ||
    !directoryRead.data?.ok ||
    !mappingsRead.data?.ok ||
    !coursesRead.data?.ok
  ) {
    return (
      <>
        {head}
        <IaManageSurface labelledBy={TITLE_ID} hiddenTitle={FACULTY_COURSES_V3.sectionTitle}>
          {failed ? (
            <ListState
              kind="failed"
              title={stateWords('IA-15.failed')}
              action={<Button onClick={refetch}>{STUDENTS_TAB.tryAgain}</Button>}
            >
              {STUDENTS_TAB.failedLine}
            </ListState>
          ) : (
            <LoadingRows message={stateWords('IA-15.loading')} rows={1} cells={SKELETON} />
          )}
        </IaManageSurface>
      </>
    );
  }

  const rows = facultyCourseRows(directoryRead.data.value, mappingsRead.data.value);
  const courses: readonly ContentAccessCourse[] = coursesRead.data.value;
  const listed = searchRows(rows, search);
  const searching = search.trim() !== '';
  const whoOptions = facultyChoices(rows);
  const courseOptions = courseChoices(courses);
  // A choice the lists no longer offer is no choice (read again after a change elsewhere).
  const wanted = whoChoice ?? preselectedFaculty(navigation.search, rows);
  const who = whoOptions.some((option) => option.value === wanted) ? wanted : '';
  const chosenCourse = courseOptions.some((option) => option.value === course) ? course : '';
  const anyActive = rows.some((row) => row.active);

  const showError = (field: AssignField, message: string | null) => {
    setError(message ? { field, message } : null);
    focus(FIELD_IDS[field]);
  };

  /** Assigning refused: the drawn field error, or nothing written and the lists read again. */
  const assignRefused = (refusal: ServiceError) => {
    if (refusal.kind === 'validation-failed') {
      const first = firstAssignError(refusal.fieldErrors);
      if (!first) return;
      if (first.message === null) {
        // No drawn words (state-copy `IA-15.field-error`): the choice is cleared, the lists re-read.
        if (first.field === 'facultyId') setWho('');
        else setCourse('');
        refetch();
      }
      showError(first.field, first.message);
    } else if (refusal.kind === 'refused' && refusal.code === 'institution-paused') {
      setRefusedPaused(true);
      setError(null);
      focus(PAUSED_ID);
    } else if (refusal.kind === 'not-found') {
      setWho('');
      setCourse('');
      refetch();
      showError('facultyId', null);
    }
  };

  const submit = () => {
    if (assign.busy) return;
    assign
      .run({
        facultyId: who === '' ? null : who,
        courseId: chosenCourse === '' ? null : chosenCourse,
      })
      .then(
        (answer) => {
          if (!answer.ok) {
            assignRefused(answer.error);
            return;
          }
          const person = rows.find((row) => row.id === answer.value.facultyId);
          const offered = courses.find((entry) => entry.course.id === answer.value.courseId);
          setWho('');
          setCourse('');
          setError(null);
          setFlash(
            assignedFlash(
              person?.fullName ?? '',
              offered ? courseCode(offered.course) : answer.value.courseId,
            ),
          );
          focus(FLASH_ID);
        },
        // Failed for now: nothing changes and the choices stay (state-copy `IA-15.unavailable`).
        () => undefined,
      );
  };

  /** Removing refused (or its check): nothing written; read again (state-copy `IA-15.moved-on`). */
  const removalRefused = (refusal: ServiceError, facultyId: PersonId) => {
    setDialog(null);
    if (refusal.kind === 'refused' && refusal.code === 'institution-paused') {
      setRefusedPaused(true);
      focus(PAUSED_ID);
      return;
    }
    refetch();
    focus(nameId(facultyId));
  };

  const openRemoval = (row: FacultyCoursesRow, taught: TaughtCourse) => {
    const mapping = taught.mapping;
    if (!mapping || preview.busy) return;
    preview.run({ mappingId: mapping.id }).then(
      (answer) => {
        if (!answer.ok) {
          removalRefused(answer.error, row.id);
          return;
        }
        setDialog({
          facultyId: row.id,
          fullName: row.fullName,
          code: taught.code,
          mappingId: mapping.id,
          expectedRev: mapping.rev,
          warning: answer.value.warning,
        });
      },
      // Failed for now: nothing opens and nothing changes (state-copy `IA-15.remove.check`).
      () => undefined,
    );
  };

  const confirmRemoval = () => {
    if (!dialog) return;
    const current = dialog;
    remove.run({ mappingId: current.mappingId, expectedRev: current.expectedRev }).then(
      (answer) => {
        if (!answer.ok) {
          removalRefused(answer.error, current.facultyId);
          return;
        }
        setDialog(null);
        setFlash(removedFlash(current.code, current.fullName));
        focus(FLASH_ID);
      },
      // Failed for now: the confirmation stays open (state-copy `IA-15.unavailable`).
      () => undefined,
    );
  };

  const { columns, panel } = FACULTY_COURSES;
  const chips: IaFilterChip[] = [];
  if (searching) {
    const label = searchChip(search);
    chips.push({
      key: 'search',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setSearch(''),
      focusId: SEARCH_ID,
    });
  }

  let list: ReactNode;
  if (rows.length === 0) {
    list = (
      <ListState
        kind="empty"
        titleAs="h3"
        icon="user"
        title={FACULTY_V3.emptyTitle}
        action={
          readOnly ? null : (
            <ButtonLink href={addPersonAddress('faculty')}>{PEOPLE_PAGE.addFaculty}</ButtonLink>
          )
        }
      >
        {FACULTY_COURSES_V3.emptyLine}
      </ListState>
    );
  } else if (listed.length === 0) {
    list = (
      <ListState
        kind="nomatch"
        title={FACULTY_TAB.noMatchTitle}
        action={
          <Button
            onClick={() => {
              setSearch('');
              focus(SEARCH_ID);
            }}
          >
            {FACULTY_TAB.clearSearch}
          </Button>
        }
      >
        {FACULTY_V3.noMatchLine}
      </ListState>
    );
  } else {
    list = (
      <IaFacultyCoursesTable
        caption={FACULTY_COURSES_V3.caption}
        headers={{
          member: columns.member,
          courses: columns.coursesTaught,
          status: columns.status,
          action: columns.action,
        }}
        rows={listed.map((row) => ({
          key: row.id,
          name: row.fullName,
          href: facultyRecordAddress(row.id),
          linkId: nameId(row.id),
          email: row.email,
          courses:
            row.courses.length > 0 ? (
              row.courses.map((taught) => (
                <IaCourseLine
                  key={taught.courseId}
                  code={taught.code}
                  name={taught.name}
                  nameAsTitle
                  remove={
                    !readOnly && taught.mapping
                      ? {
                          id: removeId(taught.mapping.id),
                          label: FACULTY_COURSES.remove,
                          accessibleName: removeCourseLabel(taught.code, row.fullName),
                          onClick: () => openRemoval(row, taught),
                        }
                      : null
                  }
                />
              ))
            ) : (
              <IaCellText kind="muted">{FACULTY_TAB.noCourses}</IaCellText>
            ),
          status: row.active ? (
            <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
          ) : (
            <StatusPill tone="ended">{FACULTY_TAB.inactive}</StatusPill>
          ),
          action:
            !readOnly && row.active && courses.length > 0 ? (
              <Button
                variant="ghost"
                aria-label={assignToLabel(row.fullName)}
                onClick={() => {
                  setWho(row.id);
                  setError(null);
                  focus(COURSE_ID);
                }}
              >
                {FACULTY_COURSES.assignCourse}
              </Button>
            ) : null,
        }))}
      />
    );
  }

  const unavailable = readOnly
    ? FACULTY_COURSES_V3.cant.paused
    : courses.length === 0
      ? FACULTY_COURSES_V3.cant.noCourses
      : !anyActive
        ? FACULTY_COURSES_V3.cant.noFaculty
        : null;
  const errorFor = (field: AssignField) => error?.field === field;

  return (
    <>
      {head}
      <IaRecordGrid
        variant="wide"
        main={
          <IaManageSurface labelledBy={TITLE_ID} hiddenTitle={FACULTY_COURSES_V3.sectionTitle}>
            <IaManageTools>
              <IaManageFilters label={FACULTY_COURSES_V3.filterLabel}>
                <IaManageSearch
                  id={SEARCH_ID}
                  label={FACULTY_COURSES_V3.searchLabel}
                  placeholder={FACULTY_COURSES_V3.searchPlaceholder}
                  value={search}
                  onChange={setSearch}
                />
                <IaManageCount>
                  {facultyCountWords(listed.length, rows.length, searching)}
                </IaManageCount>
              </IaManageFilters>
              {chips.length > 0 ? (
                <IaManageStatus
                  chips={chips}
                  clearLabel={PEOPLE_PAGE.clearFilters}
                  onClear={() => setSearch('')}
                  clearFocusId={SEARCH_ID}
                />
              ) : null}
            </IaManageTools>
            {list}
          </IaManageSurface>
        }
        side={
          <IaAssignPanel
            title={panel.title}
            titleId={PANEL_TITLE_ID}
            form={
              unavailable !== null
                ? { unavailable }
                : {
                    faculty: {
                      id: WHO_ID,
                      label: panel.facultyLabel,
                      hint: panel.facultyHint,
                      options: whoOptions,
                      value: who,
                      invalid: errorFor('facultyId'),
                      onChange: (value) => {
                        setWho(value as PersonId | '');
                        setError(null);
                      },
                    },
                    course: {
                      id: COURSE_ID,
                      label: panel.courseLabel,
                      hint: panel.courseHint,
                      options: courseOptions,
                      value: chosenCourse,
                      invalid: errorFor('courseId'),
                      onChange: (value) => {
                        setCourse(value as CourseId | '');
                        setError(null);
                      },
                    },
                    submit: {
                      label: panel.submit,
                      busy: assign.busy,
                      busyLabel: stateWords('IA-15.assign.busy'),
                      onClick: submit,
                    },
                    error: error ? { id: ERROR_ID, text: error.message } : null,
                    note: panel.note,
                  }
            }
          />
        }
      />
      <ConfirmDialog
        open={dialog !== null}
        destructive
        initialFocus="cancel"
        idPrefix="faculty-courses-remove"
        title={dialog ? removeTitle(dialog.code, dialog.fullName) : ''}
        description={dialog ? removeBody(dialog.code) : ''}
        confirmLabel={FACULTY_COURSES.removeConfirm}
        cancelLabel={PEOPLE_V3.cancel}
        busyLook
        busy={remove.busy}
        busyLabel={stateWords('IA-15.remove.busy')}
        onConfirm={confirmRemoval}
        onCancel={() => setDialog(null)}
      >
        {dialog?.warning ? (
          <Notice tone="warn" icon="alertTriangle" title={FACULTY_COURSES.noMarkerTitle}>
            {noMarkerLine(dialog.warning.writtenAnswersWaiting, dialog.warning.courseCode)}
          </Notice>
        ) : undefined}
      </ConfirmDialog>
    </>
  );
}
