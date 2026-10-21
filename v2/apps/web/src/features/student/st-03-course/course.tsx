'use client';

import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  ButtonLink,
  InstitutionCode,
  StatusPill,
  StCard,
  StCardHead,
  StList,
  StMessage,
  StNote,
  StRecordHead,
  StRefuse,
  StSectionTitle,
  StLoading,
} from '@xr/ui/v3';
import { type ReactNode, useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { COURSE_V3, courseLine, experimentsGivenWords, NOT_AVAILABLE } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import {
  coursePlacement,
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  STUDENT_HELP_ADDRESS,
} from '@/nav/student';
import { useMyCourse } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useStudentTodayLine } from '../shared/use-today';
import { coursePillOf } from '../shared/course-row';
import { ExperimentRow } from '../shared/experiment-row';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import type { Closure } from '../shared/student-view';

/**
 * ST-03 Course (student view) — the owner-approved V3 design (Student export ST-v1, `courseVM`),
 * at `/student/courses/[courseId]`: "Which experiments of this course are given to me?"
 *
 * - **Read**: `StudentAccessService.getMyCourse` — the course row (its code as T-17 shows it) and
 *   only the experiments given to the Student (the course's other published experiments are not
 *   listed), each with its formats' availability and its own progress per format, never an
 *   aggregate (BC4). A course with nothing given to the Student is not found (the in-shell PU-15;
 *   existence is not revealed).
 * - **States as drawn**: the course's code and name with "<n> experiment(s) given to you", the
 *   institution's pause or a supplied licence wait as its status, then "Experiments given to you"
 *   with each experiment's formats and "Open experiment"; paused and an inactive account leave no
 *   way in (the shell's banner says why); a course with earlier work only reads as the export's
 *   course-none message (`ST-03.no-experiments`). Loading and failed keep the page's own words.
 * - **Not drawn**: the engineering area and the BITS course code (not in the course read,
 *   `ST-02.v3-rows`); "See your earlier work" (SACC-14: Progress has no earlier-work row).
 * - **Links**: "My courses" (crumb), "Open experiment" → the hub (ST-05).
 */
export function MyCourse({ courseId }: { readonly courseId: string }) {
  const read = useMyCourse(courseId);
  const student = useStudentSession();
  const navigation = useAppNavigation();
  const today = useStudentTodayLine();
  const failedId = useId();
  const answer = read.data;
  const page = answer?.ok ? answer.value : null;
  useShellPage(coursePlacement(page ? { name: page.course.name, crumb: page.course.name } : null));
  const retried = useRetryFocus(page !== null);
  const retry = () => {
    retried();
    void read.refetch();
  };
  const crumbs = (current: string) => (
    <Breadcrumbs
      levels={[{ label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS }]}
      current={current}
    />
  );

  if (read.isError) {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-03.failed')}
        titleId={failedId}
        description={ST_STATE_WORDS.failedLine}
        retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: retry }}
      />
    );
  }
  if (!answer || !student) return <StLoading variant="card" label={stateWords('ST-03.loading')} />;
  // Not given (or unknown): the in-shell not-found page (`ST-03.not-found`).
  if (!answer.ok) return navigation.notFound();
  const { course, experiments } = answer.value;
  if (experiments.length === 0) {
    return <CourseNone course={course} today={today} crumbs={crumbs(course.name)} />;
  }
  return (
    <CourseContent
      course={course}
      experiments={experiments}
      closure={student.closure}
      today={today}
      crumbs={crumbs(course.name)}
    />
  );
}

function CourseContent({
  course,
  experiments,
  closure,
  today,
  crumbs,
}: {
  readonly course: MyCourseRow;
  readonly experiments: readonly MyExperimentRow[];
  readonly closure: Closure;
  readonly today: string | undefined;
  readonly crumbs: ReactNode;
}) {
  const sectionId = useId();
  const pill = coursePillOf(experiments, closure);
  return (
    <>
      <StRecordHead
        breadcrumbs={crumbs}
        date={today}
        lead={course.codeShown ? <InstitutionCode code={course.codeShown} /> : null}
        context={COURSE_V3.kind}
        title={course.name}
        wideMeta
        meta={
          <>
            {pill ? <StatusPill tone={pill.tone}>{pill.words}</StatusPill> : null}
            <span>{experimentsGivenWords(experiments.length)}</span>
          </>
        }
      />
      <StCard labelledBy={sectionId}>
        <StCardHead>
          <StSectionTitle id={sectionId}>{COURSE_V3.experimentsHeading}</StSectionTitle>
          <StNote>{COURSE_V3.onlyGiven}</StNote>
        </StCardHead>
        <StList>
          {experiments.map((experiment) => (
            <ExperimentRow
              key={experiment.experimentId}
              experiment={experiment}
              course={course}
              closure={closure}
              place="course-page"
            />
          ))}
        </StList>
      </StCard>
    </>
  );
}

/**
 * A course with earlier work only (reached by its address): the export's course-none message —
 * the course, "This course has no experiments for you right now", the work kept, "Back to My
 * courses" and Help & support (`ST-03.no-experiments`).
 */
function CourseNone({
  course,
  today,
  crumbs,
}: {
  readonly course: MyCourseRow;
  readonly today: string | undefined;
  readonly crumbs: ReactNode;
}) {
  const titleId = useId();
  return (
    <>
      {crumbs}
      <StRefuse
        date={today}
        icon="myCourses"
        off
        kicker={courseLine(course.codeShown, course.name)}
        title={COURSE_V3.noneTitle}
        titleId={titleId}
        description={stateWords('ST-01.earlier-only.line')}
        actions={
          <ButtonLink href={MY_COURSES_ADDRESS} variant="primary" size="lg">
            {NOT_AVAILABLE.back}
          </ButtonLink>
        }
        help={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
      />
    </>
  );
}
