'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { CourseId, PersonId } from '@xr/domain';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Icon,
  Link,
  Notice,
  Select,
  StatusPill,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

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
import { FACULTY_TAB, facultyCountWords, PEOPLE_PAGE, STUDENTS_TAB } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import { facultyRecordAddress } from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';
import { useCourseCodeList, useFacultyCourseList } from '@/queries/institute-records';
import { useFacultyDirectory } from '@/queries/people';
import { useCommand } from '@/queries/use-command';

import { ListFailed, ListLoading, PeopleToolbar } from '../ia-06-people/list-parts';
import { PausedNotice } from '../ia-06-people/paused';
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

const SEARCH_ID = 'faculty-courses-search';
const WHO_ID = 'faculty-courses-who';
const COURSE_ID = 'faculty-courses-course';
const ERROR_ID = 'faculty-courses-error';
const FLASH_ID = 'faculty-courses-flash';
const PAUSED_ID = 'faculty-courses-paused';
const PANEL_TITLE_ID = 'faculty-courses-assign';
const FIELD_IDS: Readonly<Record<AssignField, string>> = { facultyId: WHO_ID, courseId: COURSE_ID };

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
 * IA-15 People › Faculty courses — board B2-09 f0 … f5 ("Who teaches which courses?"), the People
 * page's `?tab=faculty-courses` (`&faculty=<id>` chooses that person in "Assign a course").
 *
 * - **Reads**: the faculty (`PeopleService.listFaculty`), every Faculty course mapping
 *   (`FacultyCourseService.list`; the current ones are listed) and the courses in the institution's
 *   content access (`InstitutionCourseCodeService.list`) — state-copy `IA-15.reads`.
 * - **As drawn**: the intro line, the success flash (it takes focus), then `xw-split`: the search
 *   ("Faculty name or e-mail", the count announced, no match → "Clear search") and the table
 *   (Faculty member → IA-09 · Courses taught, each code with "Remove…" · Status · "Assign a course"
 *   for active members, which chooses them in the panel and moves focus to Course), beside the
 *   "Assign a course" panel — under the table below 1,060 px of content, the fields stacked on
 *   phones (the v46 `xw-split` / `xw-apanel` rules).
 * - **Assign**: `FacultyCourseService.assign`; the service checks — "Choose a faculty member",
 *   "Choose a course", "<name> already teaches <course>" — one error under the fields, focus on its
 *   field. Assigned, the choices clear and the flash says what it does: the course appears in that
 *   person's Faculty workspace. It gives students nothing.
 * - **Remove…**: `previewRemoval` first (it writes nothing), then DL-1 "Remove <code> from <name>?"
 *   with the drawn warning when written answers would be left with no marker; "Remove course" sends
 *   `remove` with the mapping's revision. A refusal because it moved on closes the dialog and reads
 *   again (state-copy `IA-15.moved-on`); failed for now, nothing changes.
 * - **Paused institution**: read-only — no panel, no "Assign a course", no "Remove…" (the People
 *   page shows the paused notice; a write refused `institution-paused` meanwhile shows it here).
 * - Faculty access is never student access, and no Faculty workspace is built here (Phase 4).
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

  if (failed) {
    return (
      <>
        <Intro />
        <ListFailed
          title={stateWords('IA-15.failed')}
          line={STUDENTS_TAB.failedLine}
          retryLabel={STUDENTS_TAB.tryAgain}
          onRetry={refetch}
        />
      </>
    );
  }
  if (loading || !directoryRead.data?.ok || !mappingsRead.data?.ok || !coursesRead.data?.ok) {
    return (
      <>
        <Intro />
        <ListLoading
          label={stateWords('IA-15.loading')}
          columns="grid-cols-[1.4fr_1.2fr_120px_150px]"
          cells={4}
        />
      </>
    );
  }

  const rows = facultyCourseRows(directoryRead.data.value, mappingsRead.data.value);
  const courses: readonly ContentAccessCourse[] = coursesRead.data.value;
  if (rows.length === 0) {
    return (
      <>
        <Intro />
        <div className="xr-section">
          <EmptyState icon="studentsPeople" title={stateWords('IA-08.empty')} />
        </div>
      </>
    );
  }

  const listed = searchRows(rows, search);
  const searching = search.trim() !== '';
  const whoOptions = facultyChoices(rows);
  const courseOptions = courseChoices(courses);
  // A choice the lists no longer offer is no choice (read again after a change elsewhere).
  const wanted = whoChoice ?? preselectedFaculty(navigation.search, rows);
  const who = whoOptions.some((option) => option.value === wanted) ? wanted : '';
  const chosenCourse = courseOptions.some((option) => option.value === course) ? course : '';

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
  const errorFor = (field: AssignField) => error?.field === field;

  return (
    <>
      <Intro />
      {refusedPaused && !paused ? (
        <div id={PAUSED_ID} tabIndex={-1} className="mb-4">
          <PausedNotice />
        </div>
      ) : null}
      {flash ? (
        <div id={FLASH_ID} tabIndex={-1} className="mb-4">
          <Notice tone="ok">{flash}</Notice>
        </div>
      ) : null}
      <div className={readOnly ? undefined : 'xw-split'}>
        <div className="min-w-0">
          <PeopleToolbar
            search={{
              id: SEARCH_ID,
              label: PEOPLE_PAGE.searchLabel,
              placeholder: FACULTY_COURSES.searchPlaceholder,
              value: search,
              onChange: setSearch,
            }}
            status={facultyCountWords(listed.length, rows.length, searching)}
            chips={[]}
            clearLabel={PEOPLE_PAGE.clearFilters}
          />
          {listed.length > 0 ? (
            <div className="xr-table-wrap">
              <table className="xr-table">
                <caption className="xr-sr">{FACULTY_COURSES.caption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{columns.member}</th>
                    <th scope="col">{columns.coursesTaught}</th>
                    <th scope="col">{columns.status}</th>
                    {readOnly ? null : (
                      <th scope="col">
                        <span className="xr-sr">{columns.action}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {listed.map((row) => (
                    <tr key={row.id}>
                      <td className="is-primary">
                        <Link
                          id={nameId(row.id)}
                          className="font-[700]"
                          href={facultyRecordAddress(row.id)}
                        >
                          {row.fullName}
                        </Link>
                        <span className="xr-sub">{row.email}</span>
                      </td>
                      <td data-label={columns.coursesTaught}>
                        {row.courses.length > 0 ? (
                          row.courses.map((taught) => (
                            <span
                              key={taught.courseId}
                              className="mr-3 inline-flex items-center gap-2"
                            >
                              <span className="xw-nowrap font-[600]">{taught.code}</span>
                              {!readOnly && taught.mapping ? (
                                <Button
                                  variant="text"
                                  id={removeId(taught.mapping.id)}
                                  className="min-h-8 [padding:0_4px]"
                                  aria-label={removeCourseLabel(taught.code, row.fullName)}
                                  onClick={() => openRemoval(row, taught)}
                                >
                                  {FACULTY_COURSES.remove}
                                </Button>
                              ) : null}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink-3">{FACULTY_TAB.noCourses}</span>
                        )}
                      </td>
                      <td data-label={columns.status}>
                        {row.active ? (
                          <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
                        ) : (
                          <StatusPill tone="off">{FACULTY_TAB.inactive}</StatusPill>
                        )}
                      </td>
                      {readOnly ? null : (
                        <td>
                          {row.active ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              aria-label={assignToLabel(row.fullName)}
                              onClick={() => {
                                setWho(row.id);
                                setError(null);
                                focus(COURSE_ID);
                              }}
                            >
                              {FACULTY_COURSES.assignCourse}
                            </Button>
                          ) : null}
                        </td>
                      )}
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
                      onClick={() => {
                        setSearch('');
                        focus(SEARCH_ID);
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
        {readOnly ? null : (
          <aside className="xr-dpanel xw-apanel" aria-labelledby={PANEL_TITLE_ID}>
            <h2 id={PANEL_TITLE_ID} className="xr-dpanel-title xw-full">
              {panel.title}
            </h2>
            <Field id={WHO_ID} label={panel.facultyLabel} hint={panel.facultyHint}>
              <Select
                options={whoOptions}
                value={who}
                invalid={errorFor('facultyId')}
                aria-describedby={errorFor('facultyId') ? `${WHO_ID}-h ${ERROR_ID}` : undefined}
                onChange={(event) => {
                  setWho(event.target.value as PersonId | '');
                  setError(null);
                }}
              />
            </Field>
            <Field id={COURSE_ID} label={panel.courseLabel} hint={panel.courseHint}>
              <Select
                options={courseOptions}
                value={chosenCourse}
                invalid={errorFor('courseId')}
                aria-describedby={errorFor('courseId') ? `${COURSE_ID}-h ${ERROR_ID}` : undefined}
                onChange={(event) => {
                  setCourse(event.target.value as CourseId | '');
                  setError(null);
                }}
              />
            </Field>
            {error ? (
              <span id={ERROR_ID} className="xw-ferr xw-full" role="alert">
                <Icon name="failed" />
                {error.message}
              </span>
            ) : null}
            <Button
              variant="primary"
              className="xw-apanel-go"
              busy={assign.busy}
              busyLabel={stateWords('IA-15.assign.busy')}
              onClick={submit}
            >
              {panel.submit}
            </Button>
            <p className="xr-meta xw-full m-0">{panel.note}</p>
          </aside>
        )}
      </div>
      <ConfirmDialog
        open={dialog !== null}
        align="start"
        destructive
        idPrefix="faculty-courses-remove"
        title={dialog ? removeTitle(dialog.code, dialog.fullName) : ''}
        effect={dialog ? removeBody(dialog.code) : ''}
        notice={dialog?.warning ? <NoMarkerWarning warning={dialog.warning} /> : null}
        confirmLabel={FACULTY_COURSES.removeConfirm}
        busy={remove.busy}
        busyLabel={stateWords('IA-15.remove.busy')}
        onConfirm={confirmRemoval}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}

/** B2-09's line under the tabs. */
function Intro() {
  return <p className="xr-body mt-0 mb-4 text-ink-2">{FACULTY_COURSES.intro}</p>;
}

/**
 * B2-09 f2 "Written answers would have no marker" (`div.xr-notice.xr-notice--warn`), after the
 * effect sentence in the dialog body (DL-1's `notice` slot).
 */
function NoMarkerWarning({ warning }: { readonly warning: NonNullable<RemoveDialog['warning']> }) {
  return (
    <Notice tone="warn" title={FACULTY_COURSES.noMarkerTitle}>
      {noMarkerLine(warning.writtenAnswersWaiting, warning.courseCode)}
    </Notice>
  );
}
