'use client';

import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import { StatusPill, StCourseSection } from '@xr/ui/v3';
import { useId } from 'react';

import {
  experimentsGivenWords,
  experimentsInCourseLabel,
  MY_COURSES_V3,
  openCourseLabel,
  STUDENT_WORDS,
} from '@/copy/student';
import { myCourseAddress } from '@/nav/student';

import { ExperimentRow } from './experiment-row';
import type { Closure } from './student-view';

/**
 * The course's status beside its facts (the export's `courseCard` / `courseVM` pill): the
 * institution's pause, or a supplied licence wait on an experiment listed in it; none otherwise.
 */
export function coursePillOf(
  experiments: readonly MyExperimentRow[],
  closure: Closure,
): { readonly tone: 'paused' | 'warn'; readonly words: string } | null {
  if (closure === 'paused') return { tone: 'paused', words: STUDENT_WORDS.paused };
  if (experiments.some((row) => row.closure?.kind === 'waiting-for-a-licence')) {
    return { tone: 'warn', words: MY_COURSES_V3.waiting };
  }
  return null;
}

/**
 * One course on My courses (the export's `courseCard`: `section.sv-card.sv-course`): its code, its
 * name, "<n> experiment(s) given to you" — the experiments listed in it, held ones too — with the
 * pause or a licence wait, "Open course" (ST-03), then each experiment given in it with its
 * formats and "Open experiment". The BITS course code and the engineering area the export draws
 * are not in the Student's course read (`ST-02.v3-rows`).
 */
export function CourseSection({
  course,
  experiments,
  closure,
}: {
  readonly course: MyCourseRow;
  readonly experiments: readonly MyExperimentRow[];
  readonly closure: Closure;
}) {
  const titleId = useId();
  const pill = coursePillOf(experiments, closure);
  return (
    <StCourseSection
      titleId={titleId}
      code={course.codeShown}
      name={course.name}
      meta={
        <>
          <span>{experimentsGivenWords(experiments.length)}</span>
          {pill ? <StatusPill tone={pill.tone}>{pill.words}</StatusPill> : null}
        </>
      }
      open={{
        href: myCourseAddress(course.courseId),
        label: STUDENT_WORDS.openCourse,
        ariaLabel: openCourseLabel(course.name),
      }}
      listLabel={experimentsInCourseLabel(course.name)}
    >
      {experiments.map((experiment) => (
        <ExperimentRow
          key={experiment.experimentId}
          experiment={experiment}
          course={course}
          closure={closure}
          place="course"
        />
      ))}
    </StCourseSection>
  );
}
