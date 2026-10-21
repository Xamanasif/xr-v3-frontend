'use client';

import type { FormatCode } from '@xr/ui';
import {
  Breadcrumbs,
  Button,
  FaCourseExperiment,
  FaCourseExperiments,
  FaFigure,
  FaFigures,
  FaFormatBadges,
  FaIdentityBand,
  FaProgress,
  FaQuiet,
  FaTeachingActivityFoot,
  ListState,
  LoadingRows,
} from '@xr/ui/v3';
import { useEffect, useRef } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import {
  accessEndedLine,
  assessmentsReadyLabel,
  COURSE_PAGE,
  experimentsHeldLabel,
  openExperimentFullLabel,
  studentsWithAccessWords,
} from '@/copy/faculty-courses';
import {
  activityLabel,
  asOfWords,
  formatsHeldLabel,
  PROGRESS_WORDS,
} from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_MY_COURSES_ADDRESS,
  FACULTY_MY_COURSES_TITLE,
  facultyCoursePlacement,
  facultyExperimentAddress,
  facultyStudentsAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useSession } from '@/queries/session';
import { useTeachingCourses } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useFacultyToday } from '../shared/use-today';
import { AssessmentFacts, AssessmentStatusPill } from '../fa-04-experiments/assessment-facts';
import { useOldestByAssessment } from '../fa-04-experiments/oldest-by-assessment';
import {
  type TaughtExperiment,
  useTaughtExperiments,
} from '../fa-04-experiments/taught-experiments';
import {
  assessmentSummary,
  formatCodes,
  progressRows,
  studentsReached,
} from '../fa-04-experiments/teaching-view';

const TITLE_ID = 'fa-h1';

/**
 * FA-03 Course, the teaching view — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/FA-v1, `Main.dc.html` FA-03, `vmCourse` and `asmSum`), at
 * `/faculty/courses/[courseId]`.
 *
 * - **Reads**: `TeachingService.listMyCourses` (the course: name, platform code, how many
 *   experiments, the Students with access, the date access ended) and the taught experiments
 *   (`useTaughtExperiments`: each one's formats, per-format counts, description and course, and
 *   its assessment from `listAssessments`), keeping this course's; and the marking queue once
 *   (`listQueue`, oldest first) for each "Mark" — the oldest waiting submission of that
 *   assessment. A course no Faculty course maps to the Faculty member, or an unknown one, is the
 *   in-shell not-found (`FA-03.not-found`).
 * - **As the export draws it**: the breadcrumb "My courses › <code>"; the identity band (the date,
 *   the code, "Course you teach", the name, where it comes from, and three figures: experiments
 *   the institution holds, Students with access, assessments ready); "Experiments · Only
 *   experiments your institution holds" with one panel per experiment — its name, description,
 *   formats and "Open experiment" (FA-05), then Student activity (one unit meter per format,
 *   "as of" the read, "Students on this experiment", FA-20) beside its Assessment (status, name,
 *   deadline and days left, submissions, written answers waiting with "Mark …", the note, "Open
 *   assessment" or "Continue setting up"; none yet: "Create assessment").
 * - **Loading and failed** (the export draws none): the application's loading and the failed state
 *   with Try again (`FA-03.loading`, `FA-03.failed`). Once access has ended the band says so in
 *   place of its source line (f7).
 */
export function FacultyCourse({ courseId }: { readonly courseId: string }) {
  const navigation = useAppNavigation();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const read = useTeachingCourses();
  const { read: taught, probes } = useTaughtExperiments();
  const session = useSession();
  const me = session.status === 'signed-in' ? session.personId : null;
  const clock = useFacultyToday();
  const today = clock?.now ?? null;
  const courses = read.data?.ok ? read.data.value : null;
  const row = courses?.find((candidate) => candidate.course.id === courseId) ?? null;
  useShellPage(
    facultyCoursePlacement(
      row ? { name: row.course.name, crumb: row.course.platformCode ?? row.course.name } : null,
    ),
  );
  const experiments =
    row !== null && taught.kind === 'ready'
      ? taught.experiments.filter((entry) => entry.teaching.experiment.courseId === courseId)
      : [];
  const summaries = experiments.map((entry) =>
    entry.assessment === null ? null : assessmentSummary(entry.assessment, me, today),
  );
  const waiting = summaries.reduce((sum, summary) => sum + (summary?.waiting ?? 0), 0);
  const markHref = useOldestByAssessment(waiting);

  const failed =
    read.isError || (read.data !== undefined && !read.data.ok) || taught.kind === 'failed';
  const loaded = !failed && courses !== null && (row === null || taught.kind === 'ready');

  // Try again moves focus to the title once the course is back.
  const refocus = useRef(false);
  useEffect(() => {
    if (!loaded || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus();
  }, [loaded]);

  const crumbs = (current: string) => (
    <Breadcrumbs
      levels={[{ label: FACULTY_MY_COURSES_TITLE, href: FACULTY_MY_COURSES_ADDRESS }]}
      current={current}
    />
  );

  if (failed) {
    return (
      <>
        {probes}
        {crumbs(row?.course.platformCode ?? row?.course.name ?? FACULTY_MY_COURSES_TITLE)}
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('FA-03.failed')}
          action={
            <Button
              onClick={() => {
                if (read.isError || (read.data && !read.data.ok)) void read.refetch();
                if (taught.kind === 'failed') taught.retry();
                refocus.current = true;
              }}
            >
              {FACULTY_FAILED_WORDS.tryAgain}
            </Button>
          }
        >
          {FACULTY_FAILED_WORDS.line}
        </ListState>
      </>
    );
  }
  if (!loaded) {
    return (
      <>
        {probes}
        <LoadingRows message={stateWords('FA-03.loading')} cells={[2, 1, 2]} />
      </>
    );
  }
  // Not one of the Faculty member's courses (or unknown): the in-shell not-found page.
  if (row === null) return navigation.notFound();

  const code = row.course.platformCode;
  const ready = summaries.filter((summary) => summary?.ready).length;
  return (
    <>
      {probes}
      {crumbs(code ?? row.course.name)}
      <FaIdentityBand
        date={clock?.line}
        code={code ?? ''}
        kicker={COURSE_PAGE.eyebrow}
        title={row.course.name}
        titleId={TITLE_ID}
        titleRef={titleRef}
        source={
          row.accessEndedOn === null ? COURSE_PAGE.source : accessEndedLine(row.accessEndedOn)
        }
        figures={
          <FaFigures>
            <FaFigure term={experimentsHeldLabel(row.experiments)} value={row.experiments} />
            <FaFigure term={COURSE_PAGE.studentsWithAccess} value={row.studentsWithAccess} />
            <FaFigure term={assessmentsReadyLabel(ready)} value={ready} />
          </FaFigures>
        }
      />
      <FaCourseExperiments
        title={COURSE_PAGE.experimentsSection}
        titleId="fa-c1-h"
        note={COURSE_PAGE.experimentsNote}
      >
        {experiments.map((entry, index) => (
          <ExperimentPanel
            key={entry.option.experimentId}
            entry={entry}
            summary={summaries[index] ?? null}
            markHref={markHref}
          />
        ))}
      </FaCourseExperiments>
    </>
  );
}

/** One experiment of the course: identity, Student activity and its Assessment. */
function ExperimentPanel({
  entry,
  summary,
  markHref,
}: {
  readonly entry: TaughtExperiment;
  readonly summary: ReturnType<typeof assessmentSummary> | null;
  readonly markHref: (assessmentId: string) => string;
}) {
  const { option, teaching } = entry;
  const id = option.experimentId;
  const students = studentsReached(teaching);
  const formats = formatCodes(teaching.formatsInstitutionHas);
  const description = teaching.experiment.description.trim();
  return (
    <FaCourseExperiment
      title={option.name}
      titleId={`fa-c1-${id}`}
      about={description || undefined}
      formats={{
        label: COURSE_PAGE.formatsKey,
        badges: (
          <FaFormatBadges formats={formats as FormatCode[]} label={formatsHeldLabel(formats)} />
        ),
      }}
      open={{
        href: facultyExperimentAddress(id),
        label: COURSE_PAGE.openExperiment,
        accessibleName: openExperimentFullLabel(option.name),
      }}
      activity={{
        title: COURSE_PAGE.activity,
        titleId: `fa-c1-act-${id}`,
        hint: asOfWords(dayMonthYear(teaching.asOf)),
        children:
          students > 0 ? (
            <>
              <FaProgress
                label={activityLabel(option.name)}
                rows={progressRows(teaching)}
                words={PROGRESS_WORDS}
              />
              <FaTeachingActivityFoot
                link={{ href: facultyStudentsAddress(id), label: COURSE_PAGE.studentsLink }}
              >
                {studentsWithAccessWords(students)}
              </FaTeachingActivityFoot>
            </>
          ) : (
            <FaQuiet>{COURSE_PAGE.noStudents}</FaQuiet>
          ),
      }}
      assessment={{
        title: COURSE_PAGE.assessment,
        titleId: `fa-c1-asm-${id}`,
        status: <AssessmentStatusPill summary={summary} />,
        children: (
          <AssessmentFacts
            variant="course"
            experimentId={id}
            summary={summary}
            markHref={summary ? markHref(summary.assessmentId) : ''}
          />
        ),
      }}
    />
  );
}
