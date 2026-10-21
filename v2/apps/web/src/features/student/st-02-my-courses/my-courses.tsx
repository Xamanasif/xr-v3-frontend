'use client';

import type { MyCourseRow } from '@xr/contracts/draft';
import {
  LinkTabs,
  PageHead,
  StCard,
  StCardHead,
  StCourseList,
  StList,
  StListRow,
  StLoading,
  StMessage,
  StNote,
  StRowKicker,
  StRowText,
  StRowTitle,
  StSectionTitle,
} from '@xr/ui/v3';
import { useEffect, useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { MY_COURSES_PAGE, MY_COURSES_TABS, MY_COURSES_V3, STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import {
  ALL_EXPERIMENTS_ADDRESS,
  allExperimentsPlacement,
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  myCoursesPlacement,
} from '@/nav/student';
import { type MyExperimentEntry, useMyCourses, useMyExperiments } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useStudentTodayLine } from '../shared/use-today';
import { AllExperiments, NoAccessYet } from '../st-04-all-experiments/all-experiments';
import { CourseSection } from '../shared/course-row';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import { type Closure, courseRowKind } from '../shared/student-view';

/**
 * ST-02 My courses — the owner-approved V3 design (Student export ST-v1, `coursesVM`), at
 * `/student/courses`: "Which courses have experiments given to me?"
 *
 * - **Reads**: `StudentAccessService.listMyCourses` — only the courses with an experiment given to
 *   the Student, or with earlier work (never the institution's whole plan) — and, for the
 *   experiments listed in each course, the All experiments read (`myExperiments`: `getMyCourse`
 *   per listed course, the existing ST-04 read; one more aggregate read on this page). The code
 *   shown follows T-17. The institution's pause comes from the session's banner facts (XS-08).
 * - **States as drawn**: each course as a section with its experiments, no access yet (Help &
 *   support), earlier work only (the courses kept, course by course while SACC-14 is open —
 *   `ST-02.earlier-rows`), loading and failed with "Try again".
 * - **Tabs**: "Courses · All experiments" (`nav.rk-tabs` "My courses", ordinary links);
 *   `?tab=experiments` shows ST-04, any other `tab` shows Courses and the address becomes the bare
 *   `/student/courses` (state-copy `ST-04.tab-address`).
 * - **Not drawn** (no read holds them, `ST-02.v3-rows`): the BITS course code and engineering area,
 *   each experiment's description, the earlier experiments' rows and "View earlier work".
 */
export function MyCourses() {
  const navigation = useAppNavigation();
  const today = useStudentTodayLine();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const experiments = tabParam === 'experiments';
  const normalise = tabParam !== null && !experiments;
  useEffect(() => {
    if (normalise) navigation.replace(MY_COURSES_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    experiments ? allExperimentsPlacement(MY_COURSES_TABS.experiments) : myCoursesPlacement(),
  );

  return (
    <>
      <PageHead
        title={MY_COURSES_TITLE}
        titleFocusTarget
        date={today}
        lead={MY_COURSES_PAGE.meta}
      />
      <LinkTabs
        label={MY_COURSES_TABS.label}
        tabs={[
          { href: MY_COURSES_ADDRESS, label: MY_COURSES_TABS.courses, current: !experiments },
          {
            href: ALL_EXPERIMENTS_ADDRESS,
            label: MY_COURSES_TABS.experiments,
            current: experiments,
          },
        ]}
      />
      {experiments ? <AllExperiments /> : <CoursesTab />}
    </>
  );
}

/** ST-02's own tab: the courses. */
function CoursesTab() {
  const student = useStudentSession();
  const courses = useMyCourses();
  const rows = useMyExperiments();
  const titleId = useId();
  const failed =
    courses.isError ||
    (courses.data && !courses.data.ok) ||
    rows.isError ||
    (rows.data && !rows.data.ok);
  const retried = useRetryFocus(courses.data?.ok === true && rows.data?.ok === true);
  const retry = () => {
    retried();
    void courses.refetch();
    void rows.refetch();
  };

  if (failed) {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={MY_COURSES_PAGE.failedTitle}
        titleId={titleId}
        description={ST_STATE_WORDS.failedLine}
        retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: retry }}
      />
    );
  }
  if (!student || !courses.data?.ok || !rows.data?.ok) {
    return (
      <StLoading variant="card" name={MY_COURSES_TITLE} label={MY_COURSES_V3.loadingCourses} />
    );
  }
  return (
    <CourseList
      courses={courses.data.value}
      rows={rows.data.value.rows}
      closure={student.closure}
    />
  );
}

function CourseList({
  courses,
  rows,
  closure,
}: {
  readonly courses: readonly MyCourseRow[];
  readonly rows: readonly MyExperimentEntry[];
  readonly closure: Closure;
}) {
  const listHeadingId = useId();
  if (courses.length === 0) return <NoAccessYet line={MY_COURSES_V3.coursesNone} />;
  const current = courses.filter((course) => courseRowKind(course) !== 'earlier');
  const earlier = courses.filter((course) => courseRowKind(course) === 'earlier');
  return (
    <>
      {current.length > 0 ? (
        <StCourseList title={MY_COURSES_V3.listHeading} titleId={listHeadingId}>
          {current.map((course) => (
            <CourseSection
              key={course.courseId}
              course={course}
              experiments={rows
                .filter((row) => row.course.courseId === course.courseId)
                .map((row) => row.experiment)}
              closure={closure}
            />
          ))}
        </StCourseList>
      ) : null}
      {earlier.length > 0 ? (
        <EarlierWork courses={earlier} nothingNow={current.length === 0} />
      ) : null}
    </>
  );
}

/**
 * Earlier work (the export's `C.earlier`): "No experiments are given to you right now" / "Your
 * earlier work is kept below." when nothing is given now, else "Earlier work"; then each course
 * kept — course by course while SACC-14 is open (`ST-02.earlier-rows`), with no action.
 */
function EarlierWork({
  courses,
  nothingNow,
}: {
  readonly courses: readonly MyCourseRow[];
  readonly nothingNow: boolean;
}) {
  const titleId = useId();
  return (
    <StCard labelledBy={titleId}>
      <StCardHead stack>
        <StSectionTitle id={titleId}>
          {nothingNow ? MY_COURSES_PAGE.nothingNowTitle : STUDENT_WORDS.earlierWork}
        </StSectionTitle>
        {nothingNow ? <StNote>{MY_COURSES_PAGE.nothingNowLine}</StNote> : null}
      </StCardHead>
      <StList>
        {courses.map((course) => (
          <StListRow key={course.courseId} variant="experiment">
            {course.codeShown ? <StRowKicker>{course.codeShown}</StRowKicker> : null}
            <StRowTitle>{course.name}</StRowTitle>
            <StRowText>{stateWords('ST-01.earlier-only.line')}</StRowText>
          </StListRow>
        ))}
      </StList>
    </StCard>
  );
}
