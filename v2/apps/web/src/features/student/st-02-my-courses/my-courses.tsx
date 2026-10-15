'use client';

import type { MyCourseRow } from '@xr/contracts/draft';
import { EmptyState, Link, PageContent, PageHeader, Rows, SectionTabs } from '@xr/ui';
import { useEffect, useId } from 'react';

import { MY_COURSES_PAGE, MY_COURSES_TABS, STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import {
  ALL_EXPERIMENTS_ADDRESS,
  allExperimentsPlacement,
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  myCoursesPlacement,
  STUDENT_HELP_ADDRESS,
} from '@/nav/student';
import { useMyCourses } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { AllExperiments } from '../st-04-all-experiments/all-experiments';
import { CourseRow } from '../shared/course-row';
import {
  StudentFailed,
  StudentLoading,
  useRetryFocus,
  useStudentSession,
} from '../shared/student-states';
import { courseRowKind } from '../shared/student-view';

/**
 * ST-02 My courses — board B2-11 (f0, f3, f5, f7 … f11, f13; B2-13 f2), at `/student/courses`:
 * "Which courses have experiments given to me?"
 *
 * - **Read**: `StudentAccessService.listMyCourses` — only the courses with an experiment given to
 *   the Student (never the institution's whole plan: B2-11 f0 "ME ZG523 appears because
 *   Shell-and-Tube was given — not because Godavari holds it"), or with earlier work. The code
 *   shown follows T-17 (the institution's code once set). The institution's pause comes from the
 *   session's banner facts (XS-08).
 * - **States as drawn**: the list (f0, f11, f13), no access yet (f3), paused (f5), earlier work
 *   after a withdrawal or the end of access (f7, f8 — course-level while SACC-14 is open,
 *   `ST-02.earlier-rows`), loading (f9) and failed with "Try again" (f10).
 * - **Tabs** (Package 2B): "Courses · All experiments" (`nav.xr-tabs` "My courses", ordinary links);
 *   `?tab=experiments` shows ST-04 All experiments, any other `tab` shows Courses and the address
 *   becomes the bare `/student/courses` (state-copy `ST-04.tab-address`).
 * - **Not rendered**: "View earlier work" (Progress, ST-15).
 */
export function MyCourses() {
  const navigation = useAppNavigation();
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
    <PageContent wrap="wide">
      <PageHeader className="mb-4" title={MY_COURSES_TITLE} meta={MY_COURSES_PAGE.meta} />
      <SectionTabs
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
      <div className="h-5" />
      {experiments ? <AllExperiments /> : <CoursesTab />}
    </PageContent>
  );
}

/** ST-02's own tab: the courses (B2-11 f0, f3, f5, f7 … f11, f13). */
function CoursesTab() {
  const student = useStudentSession();
  const read = useMyCourses();
  const retried = useRetryFocus(read.data?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <>
      {read.isError || (read.data && !read.data.ok) ? (
        <StudentFailed title={MY_COURSES_PAGE.failedTitle} onRetry={retry} />
      ) : !student || read.isPending || !read.data ? (
        <StudentLoading label={MY_COURSES_PAGE.loading} />
      ) : (
        <CourseList courses={read.data.value} paused={student.closure === 'paused'} />
      )}
    </>
  );
}

function CourseList({
  courses,
  paused,
}: {
  readonly courses: readonly MyCourseRow[];
  readonly paused: boolean;
}) {
  const current = courses.filter((course) => courseRowKind(course) !== 'earlier');
  const earlier = courses.filter((course) => courseRowKind(course) === 'earlier');

  if (courses.length === 0) {
    return (
      <div className="xr-section">
        <EmptyState
          icon="myCourses"
          title={MY_COURSES_PAGE.noAccessTitle}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link className="xr-btn xr-btn--text" href={STUDENT_HELP_ADDRESS}>
                {STUDENT_WORDS.help}
              </Link>
            </div>
          }
        >
          {MY_COURSES_PAGE.noAccessLine}
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      {current.length > 0 ? (
        <div className="xr-section">
          <Rows className="border-t-0">
            {current.map((course) => (
              <CourseRow key={course.courseId} course={course} paused={paused} />
            ))}
          </Rows>
        </div>
      ) : (
        <div className="xr-section">
          <EmptyState icon="myCourses" title={MY_COURSES_PAGE.nothingNowTitle}>
            {MY_COURSES_PAGE.nothingNowLine}
          </EmptyState>
        </div>
      )}
      {earlier.length > 0 ? <EarlierWork courses={earlier} /> : null}
    </>
  );
}

/** "Earlier work" (B2-11 f7, f8), course by course while SACC-14 is open (`ST-02.earlier-rows`). */
function EarlierWork({ courses }: { readonly courses: readonly MyCourseRow[] }) {
  const headingId = useId();
  return (
    <section className="xr-section mt-6" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {STUDENT_WORDS.earlierWork}
        </h2>
      </div>
      <Rows>
        {courses.map((course) => (
          <CourseRow key={course.courseId} course={course} paused={false} />
        ))}
      </Rows>
    </section>
  );
}
