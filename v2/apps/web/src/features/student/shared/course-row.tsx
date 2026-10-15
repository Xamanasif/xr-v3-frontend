'use client';

import type { MyCourseRow } from '@xr/contracts/draft';
import { Link, Row } from '@xr/ui';

import {
  EARLIER_WORK_KEPT,
  experimentsGivenWords,
  formatsAvailableWords,
  openCourseLabel,
  PAUSED_ROW,
  STUDENT_WORDS,
} from '@/copy/student';
import { myCourseAddress } from '@/nav/student';

import { CodeThen } from './student-states';
import { courseRowKind } from './student-view';

/**
 * One course row (B2-10 f1, f6, f8; B2-11 f0, f5): "<code> · 1 experiment given to you · WEB and
 * VR available"; paused: "<code> · Paused — your institution’s access is paused"; earlier work
 * only: "<code> · earlier work kept" with no "Open course" (`ST-02.earlier-rows`); otherwise the
 * code alone (`ST-02.row-none-open`).
 */
export function CourseRow({
  course,
  paused,
}: {
  readonly course: MyCourseRow;
  readonly paused: boolean;
}) {
  const kind = courseRowKind(course);
  const sub =
    kind === 'earlier' ? (
      <CodeThen code={course.codeShown}>{EARLIER_WORK_KEPT}</CodeThen>
    ) : paused ? (
      <CodeThen code={course.codeShown}>{PAUSED_ROW}</CodeThen>
    ) : kind === 'given' ? (
      <CodeThen code={course.codeShown}>
        {[
          experimentsGivenWords(course.experimentsGiven),
          ...(course.formatsAvailable.length > 0
            ? [formatsAvailableWords(course.formatsAvailable)]
            : []),
        ].join(' · ')}
      </CodeThen>
    ) : (
      <CodeThen code={course.codeShown} />
    );
  return (
    <Row icon="myCourses" title={course.name} sub={sub}>
      {kind === 'earlier' ? null : (
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={myCourseAddress(course.courseId)}
          aria-label={openCourseLabel(course.name)}
        >
          {STUDENT_WORDS.openCourse}
        </Link>
      )}
    </Row>
  );
}
