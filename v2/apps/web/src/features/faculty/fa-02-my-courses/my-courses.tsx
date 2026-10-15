'use client';

import type { TeachingCourseRow } from '@xr/contracts/draft';
import { EmptyState, Link, PageContent, PageHeader, Row, Rows, Section, SectionTabs } from '@xr/ui';
import { useEffect } from 'react';

import {
  accessEndedLine,
  courseCountWords,
  courseFactsLine,
  MY_COURSES_PAGE,
  openCourseLabel,
} from '@/copy/faculty-courses';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_EXPERIMENTS_ADDRESS,
  FACULTY_MY_COURSES_ADDRESS,
  FACULTY_MY_COURSES_TITLE,
  facultyCourseAddress,
  facultyExperimentsPlacement,
  facultyMyCoursesPlacement,
  MY_COURSES_TABS,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useTeachingCourses } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FacultyExperiments } from '../fa-04-experiments/experiments';
import { FacultyFailed, FacultyLoading, useRetryFocus } from '../fa-04-experiments/list-states';

/**
 * FA-02 My courses — board B4-02 (f0, f6, f7), at `/faculty/courses`, with its Experiments tab
 * FA-04 (`?tab=experiments`, Appendix A rule T2; f2 … f5, f8): "Which courses do I teach?"
 *
 * - **Read**: `TeachingService.listMyCourses` — only the courses the Institute Admin's Faculty
 *   courses (IA-15) map to the Faculty member and the institution's plans hold (FCM-04), each with
 *   its platform code, how many of its experiments the Faculty member teaches, the Students who
 *   can open them today, the assessments, and the date the institution's access ended once it has
 *   (f7). Meera assigning or removing a Faculty course changes it.
 * - **As drawn**: "Courses you teach" / "My courses" / "From Faculty courses, set by your
 *   Institute Admin"; the section tabs "Courses · Experiments" (`nav.xr-tabs` "My courses",
 *   ordinary links: `?tab=experiments` shows FA-04, any other `tab` is normalised to the bare
 *   address, `FA-02.tab-address`); the "Courses" section with its count and one row per course
 *   with "Open course" (FA-03). No course mapped: the drawn empty state with no tabs (f6,
 *   `FA-02.none-assigned`).
 * - **States B4-02 does not draw for this tab**: loading and failed with "Try again"
 *   (`FA-02.loading`, `FA-02.failed`).
 */
export function FacultyMyCourses() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const experiments = tabParam === 'experiments';
  const read = useTeachingCourses();
  const courses = read.data?.ok ? read.data.value : null;
  const noneAssigned = courses !== null && courses.length === 0;
  // Any other tab, or the Experiments tab when there is none (f6), is the bare address.
  const normalise = tabParam !== null && (!experiments || noneAssigned);
  useEffect(() => {
    if (normalise) navigation.replace(FACULTY_MY_COURSES_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    experiments && !noneAssigned ? facultyExperimentsPlacement() : facultyMyCoursesPlacement(),
  );

  return (
    <PageContent wrap="wide">
      <PageHeader
        overline={MY_COURSES_PAGE.overline}
        title={FACULTY_MY_COURSES_TITLE}
        meta={
          !experiments || noneAssigned ? (
            <span className="xl-meta">{MY_COURSES_PAGE.meta}</span>
          ) : undefined
        }
      />
      {noneAssigned ? (
        <div className="xr-section">
          <EmptyState icon="myCourses" title={MY_COURSES_PAGE.noneAssignedTitle}>
            {MY_COURSES_PAGE.noneAssignedLine}
          </EmptyState>
        </div>
      ) : (
        <>
          <SectionTabs
            label={MY_COURSES_PAGE.tabsLabel}
            tabs={[
              {
                href: FACULTY_MY_COURSES_ADDRESS,
                label: MY_COURSES_TABS[0],
                current: !experiments,
              },
              {
                href: FACULTY_EXPERIMENTS_ADDRESS,
                label: MY_COURSES_TABS[1],
                current: experiments,
              },
            ]}
          />
          {experiments ? <FacultyExperiments /> : <CoursesTab read={read} />}
        </>
      )}
    </PageContent>
  );
}

/** FA-02's own tab: the courses (f0, f7), loading and failed. */
function CoursesTab({ read }: { readonly read: ReturnType<typeof useTeachingCourses> }) {
  const courses = read.data?.ok ? read.data.value : null;
  const retried = useRetryFocus(courses !== null);
  if (read.isError || (read.data && !read.data.ok)) {
    return (
      <FacultyFailed
        title={stateWords('FA-02.failed')}
        onRetry={() => {
          retried();
          void read.refetch();
        }}
      />
    );
  }
  if (courses === null) {
    return (
      <FacultyLoading
        label={stateWords('FA-02.loading')}
        columns="grid-cols-[1.6fr_1fr]"
        cells={2}
      />
    );
  }
  return (
    <Section title={MY_COURSES_PAGE.coursesSection} meta={courseCountWords(courses.length)}>
      <Rows>
        {courses.map((row) => (
          <CourseRow key={row.course.id} row={row} />
        ))}
      </Rows>
    </Section>
  );
}

/**
 * One course (f0): its name, then its code (`span.xr-id`) and "1 experiment · 5 students with
 * access · 1 assessment" — or, once its access has ended, "Access ended on <date> · earlier work
 * and results kept" (f7) — and "Open course".
 */
function CourseRow({ row }: { readonly row: TeachingCourseRow }) {
  const { course } = row;
  const line =
    row.accessEndedOn !== null ? accessEndedLine(row.accessEndedOn) : courseFactsLine(row);
  return (
    <Row
      icon="myCourses"
      title={course.name}
      sub={
        course.platformCode !== null ? (
          <>
            <span className="xr-id">{course.platformCode}</span> · {line}
          </>
        ) : (
          line
        )
      }
    >
      <Link
        className="xr-btn xr-btn--secondary xr-btn--sm"
        href={facultyCourseAddress(course.id)}
        aria-label={openCourseLabel(course.name)}
      >
        {MY_COURSES_PAGE.openCourse}
      </Link>
    </Row>
  );
}
