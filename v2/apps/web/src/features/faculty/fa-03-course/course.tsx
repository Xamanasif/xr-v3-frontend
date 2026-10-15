'use client';

import type { TeachingCourseRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  BackLink,
  FormatBadge,
  FormatSet,
  type FormatCode,
  Link,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
} from '@xr/ui';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import {
  accessEndedLine,
  assessmentLine,
  COURSE_PAGE,
  courseMetaLine,
} from '@/copy/faculty-courses';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_MY_COURSES_ADDRESS,
  FACULTY_MY_COURSES_TITLE,
  facultyCoursePlacement,
  facultyExperimentAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useTeachingCourses } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FacultyFailed, FacultyLoading, useRetryFocus } from '../fa-04-experiments/list-states';
import {
  type TaughtExperiment,
  type TaughtRead,
  useTaughtExperiments,
} from '../fa-04-experiments/taught-experiments';

const FORMAT_ORDER: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];
const code = (format: Technology) => format.toUpperCase() as FormatCode;

/**
 * FA-03 Course, the teaching view — board B4-02 f1, at `/faculty/courses/[courseId]`: "Which of
 * this course's experiments do I teach, and how are students doing?"
 *
 * - **Reads**: `TeachingService.listMyCourses` (the course row: name, platform code, how many
 *   experiments, the Students with access, the date access ended) and `useTaughtExperiments` (each
 *   taught experiment's formats, per-format counts and course, and its assessment's readiness and
 *   figures), keeping the experiments of this course. A course no Faculty course maps to the
 *   Faculty member, or an unknown one, is the in-shell not-found (`FA-03.not-found`).
 * - **As drawn**: "My courses" (back), "Course you teach", the name, the code and "1 experiment in
 *   your institution’s access · 5 students with access"; "Experiments · Only experiments your
 *   institution holds" with one card per experiment: its name (FA-05), the assessment chip, the
 *   formats the institution has, the assessment line, per format "2 completed · 2 in progress · 1
 *   not started" (never summed) and "Open experiment" (FA-05).
 * - **Not rendered**: "Students on this experiment" — FA-20 is Phase 4B (DEV-21, `FA-03.not-rendered`).
 * - **States B4-02 does not draw**: loading, failed with "Try again", a draft or no assessment,
 *   access ended (`FA-03.*`).
 */
export function FacultyCourse({ courseId }: { readonly courseId: string }) {
  const navigation = useAppNavigation();
  const read = useTeachingCourses();
  const courses = read.data?.ok ? read.data.value : null;
  const row = courses?.find((candidate) => candidate.course.id === courseId) ?? null;
  useShellPage(
    facultyCoursePlacement(
      row ? { name: row.course.name, crumb: row.course.platformCode ?? row.course.name } : null,
    ),
  );
  const retried = useRetryFocus(row !== null);
  const back = <BackLink href={FACULTY_MY_COURSES_ADDRESS}>{FACULTY_MY_COURSES_TITLE}</BackLink>;

  if (read.isError || (read.data && !read.data.ok)) {
    return (
      <PageContent wrap="wide">
        {back}
        <div className="h-2" />
        <FacultyFailed
          title={stateWords('FA-03.failed')}
          onRetry={() => {
            retried();
            void read.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (courses === null) {
    return (
      <PageContent wrap="wide">
        <FacultyLoading
          label={stateWords('FA-03.loading')}
          columns="grid-cols-[1.6fr_1fr]"
          cells={2}
        />
      </PageContent>
    );
  }
  // Not one of the Faculty member's courses (or unknown): the in-shell not-found page.
  if (row === null) return navigation.notFound();

  return (
    <PageContent wrap="wide">
      <PageHeader
        back={back}
        className="mt-2"
        overline={COURSE_PAGE.overline}
        title={row.course.name}
        meta={
          <>
            {row.course.platformCode !== null ? (
              <span className="xr-id">{row.course.platformCode}</span>
            ) : null}
            <span className="xl-meta">
              {row.accessEndedOn !== null
                ? accessEndedLine(row.accessEndedOn)
                : courseMetaLine(row)}
            </span>
          </>
        }
      />
      <CourseExperiments course={row} />
    </PageContent>
  );
}

function CourseExperiments({ course }: { readonly course: TeachingCourseRow }) {
  const { read, probes } = useTaughtExperiments();
  return (
    <>
      {probes}
      <CourseExperimentsSection course={course} read={read} />
    </>
  );
}

function CourseExperimentsSection({
  course,
  read,
}: {
  readonly course: TeachingCourseRow;
  readonly read: TaughtRead;
}) {
  const retried = useRetryFocus(read.kind === 'ready');
  if (read.kind === 'failed') {
    return (
      <FacultyFailed
        title={stateWords('FA-03.failed')}
        onRetry={() => {
          retried();
          read.retry();
        }}
      />
    );
  }
  if (read.kind === 'loading') {
    return (
      <FacultyLoading
        label={stateWords('FA-03.loading')}
        columns="grid-cols-[1.6fr_1fr]"
        cells={2}
      />
    );
  }
  const experiments = read.experiments.filter(
    (entry) => entry.teaching.experiment.courseId === course.course.id,
  );
  return (
    <Section title={COURSE_PAGE.experimentsSection} meta={COURSE_PAGE.experimentsMeta}>
      {experiments.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {experiments.map((entry) => (
            <ExperimentCard key={entry.option.experimentId} entry={entry} />
          ))}
        </ul>
      ) : (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{stateWords('FA-03.no-experiments')}</p>
        </div>
      )}
    </Section>
  );
}

/** One taught experiment of the course (f1 `li.xl-exp`). */
function ExperimentCard({ entry }: { readonly entry: TaughtExperiment }) {
  const { option, teaching, assessment } = entry;
  const address = facultyExperimentAddress(option.experimentId);
  const formats = FORMAT_ORDER.filter((format) => teaching.formatsInstitutionHas.includes(format));
  return (
    <li className="xl-exp">
      <div className="xl-exp-head">
        <h3 className="xl-exp-title">
          <Link href={address}>{option.name}</Link>
        </h3>
        <AssessmentChip entry={entry} />
      </div>
      <dl className="xl-kv text-[15px] @min-[600px]:grid-cols-[220px_minmax(0,1fr)]">
        <dt>{COURSE_PAGE.formatsKey}</dt>
        <dd>
          <FormatSet compact variant="yours" formats={formats.map(code)} />
        </dd>
        <dt>{COURSE_PAGE.assessmentKey}</dt>
        <dd>
          {assessment === null
            ? stateWords('FA-04.assessment-none')
            : assessment.readiness === 'ready'
              ? assessmentLine({
                  name: assessment.assessment.name || assessment.assessment.id,
                  deadline:
                    assessment.assessment.rules.deadline === null
                      ? null
                      : deadlineWords(assessment.assessment.rules.deadline),
                  submitted: assessment.submitted,
                  reach: assessment.reach,
                  waiting: assessment.waitingForMarking,
                })
              : [
                  assessment.assessment.name || assessment.assessment.id,
                  assessment.assessment.rules.deadline === null
                    ? null
                    : `due ${deadlineWords(assessment.assessment.rules.deadline)}`,
                  stateWords('FA-03.assessment-draft'),
                ]
                  .filter((part): part is string => part !== null)
                  .join(' · ')}
        </dd>
      </dl>
      <ul className="xa-counts" aria-label={COURSE_PAGE.countsLabel}>
        {formats.map((format) => {
          const counts = teaching.perFormatCounts.find((row) => row.format === format);
          return (
            <li key={format}>
              <span className="xl-inline min-w-[90px]">
                <FormatBadge format={code(format)} variant="yours" compact />
                <strong className="text-ink">{code(format)}</strong>
              </span>
              <span>
                <span className="xl-num">{counts?.completed ?? 0}</span> {COURSE_PAGE.completed}
              </span>
              <span>
                <span className="xl-num">{counts?.inProgress ?? 0}</span> {COURSE_PAGE.inProgress}
              </span>
              <span>
                <span className="xl-num">{counts?.notStarted ?? 0}</span> {COURSE_PAGE.notStarted}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--secondary" href={address}>
          {COURSE_PAGE.openExperiment}
        </Link>
      </div>
    </li>
  );
}

/** "Assessment ready" (ok, f1), "Draft — not ready" (wait) or none (`FA-03.assessment-*`). */
function AssessmentChip({ entry }: { readonly entry: TaughtExperiment }) {
  if (entry.assessment === null) return null;
  if (entry.assessment.readiness === 'ready') {
    return <StatusPill tone="ok">{COURSE_PAGE.assessmentReady}</StatusPill>;
  }
  const readiness = READINESS_WORDS[entry.assessment.readiness];
  return <StatusPill tone={readiness.tone}>{readiness.label}</StatusPill>;
}
