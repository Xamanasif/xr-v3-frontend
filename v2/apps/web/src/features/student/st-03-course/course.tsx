'use client';

import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import { BackLink, EmptyState, Notice, PageContent, PageHeader, StatusPill } from '@xr/ui';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import { COURSE_PAGE, experimentsGivenWords, HOME_PAGE, STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { coursePlacement, MY_COURSES_ADDRESS, MY_COURSES_TITLE } from '@/nav/student';
import { useMyCourse } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ExperimentRow } from '../shared/experiment-row';
import {
  StudentFailed,
  StudentLoading,
  useRetryFocus,
  useStudentSession,
} from '../shared/student-states';
import type { Closure } from '../shared/student-view';

/**
 * ST-03 Course (student view) — board B2-11 (f1, f6, f14), at `/student/courses/[courseId]`:
 * "Which experiments of this course are given to me?"
 *
 * - **Read**: `StudentAccessService.getMyCourse` — the course row (its code as T-17 shows it) and
 *   only the experiments given to the Student (B2-11 f1: the course's other published experiments
 *   are not listed), each with its formats' availability and its own progress per format, never
 *   an aggregate (BC4) and never "Completed" unless the completion record says so (T-12). A course
 *   with nothing given to the Student is not found (the in-shell PU-15; existence is not revealed).
 * - **States as drawn**: given (f1, f14), paused (f6: status, notice, formats off, no "Open"); the
 *   inactive account follows f6 with B2-10 f7's words and an undecided gate shows no can / can't
 *   statement (provisional, `ST-03.*`).
 * - **Links**: "My courses" (back), "Open" → the hub (ST-05).
 */
export function MyCourse({ courseId }: { readonly courseId: string }) {
  const read = useMyCourse(courseId);
  const student = useStudentSession();
  const navigation = useAppNavigation();
  const answer = read.data;
  const page = answer?.ok ? answer.value : null;
  useShellPage(
    coursePlacement(
      page ? { name: page.course.name, crumb: page.course.codeShown ?? page.course.name } : null,
    ),
  );
  const retried = useRetryFocus(page !== null);
  const retry = () => {
    retried();
    void read.refetch();
  };

  if (read.isError) {
    return (
      <PageContent wrap="read">
        <BackLink href={MY_COURSES_ADDRESS}>{MY_COURSES_TITLE}</BackLink>
        <StudentFailed title={stateWords('ST-03.failed')} onRetry={retry} />
      </PageContent>
    );
  }
  if (!answer || !student) {
    return (
      <PageContent wrap="read">
        <StudentLoading label={stateWords('ST-03.loading')} />
      </PageContent>
    );
  }
  // Not given (or unknown): the in-shell not-found page (`ST-03.not-found`).
  if (!answer.ok) return navigation.notFound();
  return (
    <PageContent wrap="read">
      <CourseContent
        course={answer.value.course}
        experiments={answer.value.experiments}
        closure={student.closure}
      />
    </PageContent>
  );
}

function CourseContent({
  course,
  experiments,
  closure,
}: {
  readonly course: MyCourseRow;
  readonly experiments: readonly MyExperimentRow[];
  readonly closure: Closure;
}) {
  const headingId = useId();
  const meta =
    closure === 'paused' ? (
      <StatusPill tone="paused">{STUDENT_WORDS.paused}</StatusPill>
    ) : course.experimentsGiven > 0 ? (
      experimentsGivenWords(course.experimentsGiven)
    ) : null;
  return (
    <>
      <PageHeader
        back={<BackLink href={MY_COURSES_ADDRESS}>{MY_COURSES_TITLE}</BackLink>}
        className="mt-2 mb-6"
        overline={course.codeShown ?? undefined}
        title={course.name}
        meta={meta}
      />
      {closure === 'paused' ? (
        <>
          <Notice tone="warn" icon="paused" title={COURSE_PAGE.pausedNoticeTitle}>
            {COURSE_PAGE.pausedNoticeLine}
          </Notice>
          <div className="h-4" />
        </>
      ) : closure === 'inactive' ? (
        <>
          <Notice tone="warn" icon="notAvailable" title={HOME_PAGE.inactiveTitle}>
            {HOME_PAGE.inactiveLine}
          </Notice>
          <div className="h-4" />
        </>
      ) : null}
      <section className="xr-section" aria-labelledby={headingId}>
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {COURSE_PAGE.yourExperiments}
          </h2>
        </div>
        {experiments.length === 0 ? (
          <EmptyState icon="myCourses" title={stateWords('ST-03.no-experiments')} />
        ) : (
          <div>
            {experiments.map((experiment) => (
              <ExperimentRow
                key={experiment.experimentId}
                experiment={experiment}
                course={course}
                closure={closure}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
