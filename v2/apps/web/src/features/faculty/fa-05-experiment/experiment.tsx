'use client';

import type { AssessmentListRow, AssessmentView, TeachingExperiment } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  BackLink,
  EmptyState,
  FailedState,
  FormatBadge,
  FormatSet,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
} from '@xr/ui';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import { dayMonthYear } from '@/copy/dates';
import {
  ABOUT,
  ACTIVITY,
  asOfWords,
  ASSESSMENT_ROW,
  COUNT_WORDS,
  draftLine,
  EXPERIMENT_PAGE,
  EXPERIMENT_SECTIONS,
  experimentOverline,
  NO_ASSESSMENT,
  noActivityLine,
  readyLine,
  studentsHaveLine,
} from '@/copy/faculty-experiment';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import {
  assessmentAddress,
  createAssessmentAddress,
  FACULTY_MY_COURSES_ADDRESS,
  facultyExperimentPlacement,
} from '@/nav/faculty';
import {
  useAssessmentRecord,
  useFacultyAssessments,
  useTeachingExperiment,
} from '@/queries/teaching';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * FA-05 Experiment, the teaching view — board B4-03 ("How is this experiment set up for my
 * students, and how are they doing?"), at `/faculty/experiments/[experimentId]`.
 *
 * - **Reads**: `TeachingService.getTeachingExperiment` (the published page with its outcomes, read
 *   only; the formats the institution's plans give it; the formats its Students have opened; per
 *   format how many of the Students it reaches completed, are in progress or have not started —
 *   never one figure across formats, BC4; the institution's assessment; the resources' titles)
 *   and, when there is an assessment, `AssessmentService.getAssessment` (its name, readiness,
 *   rules and questions) and `listAssessments` (submitted, reach, waiting for marking). A command
 *   in the same tab — an assessment created or set, a question added, a grant given, a runtime
 *   report, a Faculty course removed — refreshes them.
 * - **As drawn**: back to My courses; "ME ZG523 · Thermodynamics & Heat Transfer"; the name; the
 *   two labelled facts "Formats your institution has" and "Formats used by your students" (f3
 *   "None yet"); then Assessment (f0 the Ready row with "Open assessment"; f1 / f3 "No assessment
 *   for this experiment yet" with "Create assessment", which carries the experiment to FA-07; f2
 *   the draft row with "Continue setting up"), Student activity ("<n> students have this
 *   experiment from your institution." and one row per format, or f3's one line) and About this
 *   experiment (the description, "Learning outcomes", the read-only note, "Resources students
 *   see"). At 375 the v46 container rules stack the row and its action (f4).
 * - **Not rendered** (DEV-21): "Mark <n> written answer" (FA-18) and "See students on this
 *   experiment" (FA-20) wait for Phase 4B. The "as of" date is the read's own instant (`asOf`,
 *   PC-52). There is no feedback here (T-25) and no outcome editing (LD-3).
 * - **States B4-03 does not draw**: loading, failed + "Try again", the in-shell not-found for an
 *   unknown or out-of-scope experiment (state-copy `FA-05.*`).
 */
export function FacultyExperiment({ experimentId }: { readonly experimentId: string }) {
  const read = useTeachingExperiment(experimentId);
  const view = read.data?.ok ? read.data.value : null;
  useShellPage(
    facultyExperimentPlacement(
      view
        ? {
            name: view.experiment.name,
            course: {
              crumb: view.experiment.platformCode ?? view.experiment.courseName,
              courseId: view.experiment.courseId,
            },
          }
        : null,
    ),
  );
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('FA-05.loading')}
        failed={{ title: stateWords('FA-05.failed'), line: stateWords('FA-05.failed.line') }}
      >
        {(answer) => <ExperimentContent view={answer} />}
      </RecordGuard>
    </PageContent>
  );
}

function ExperimentContent({ view }: { readonly view: TeachingExperiment }) {
  const { experiment } = view;
  return (
    <>
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={FACULTY_MY_COURSES_ADDRESS}>{EXPERIMENT_PAGE.back}</BackLink>}
        overline={experimentOverline(experiment.platformCode, experiment.courseName)}
        title={experiment.name}
        meta={
          <div className="xw-statusline gap-x-7 gap-y-2">
            <FormatsFact label={EXPERIMENT_PAGE.formatsHas} formats={view.formatsInstitutionHas} />
            <FormatsFact label={EXPERIMENT_PAGE.formatsUsed} formats={view.formatsUsedByStudents} />
          </div>
        }
      />
      <div className="xw-stack">
        <AssessmentSection
          experimentId={experiment.experimentId}
          assessmentId={view.assessmentId}
        />
        <ActivitySection view={view} />
        <AboutSection view={view} />
      </div>
    </>
  );
}

/** One labelled fact: the label, then the chips (or "None yet", f3). */
function FormatsFact({
  label,
  formats,
}: {
  readonly label: string;
  readonly formats: readonly Technology[];
}) {
  return (
    <span className="xl-inline">
      <span className="xl-meta">{label}</span>
      {formats.length > 0 ? (
        <FormatSet formats={formats.map(formatCode)} variant="yours" compact />
      ) : (
        <span className="xl-meta">{EXPERIMENT_PAGE.noneYet}</span>
      )}
    </span>
  );
}

// ---- Assessment (f0 Ready, f1 / f3 none yet, f2 draft) ---------------------------------------

function AssessmentSection({
  experimentId,
  assessmentId,
}: {
  readonly experimentId: string;
  readonly assessmentId: string | null;
}) {
  return (
    <Section title={EXPERIMENT_SECTIONS.assessment}>
      {assessmentId === null ? (
        <div className="xr-section-body">
          <EmptyState
            icon="assessments"
            headingLevel={3}
            title={NO_ASSESSMENT.title}
            actions={
              <div className="flex flex-wrap gap-3">
                <Link
                  className="xr-btn xr-btn--primary"
                  href={createAssessmentAddress({ experimentId })}
                >
                  {NO_ASSESSMENT.action}
                </Link>
              </div>
            }
          >
            {NO_ASSESSMENT.line}
          </EmptyState>
        </div>
      ) : (
        <AssessmentRow assessmentId={assessmentId} />
      )}
    </Section>
  );
}

/** The institution's assessment for the experiment, read by its id; its counts from the list. */
function AssessmentRow({ assessmentId }: { readonly assessmentId: string }) {
  const record = useAssessmentRecord(assessmentId);
  const list = useFacultyAssessments();
  const failed = record.isError || list.isError || (record.data !== undefined && !record.data.ok);
  if (failed) {
    return (
      <div className="xr-section-body">
        <FailedState
          title={stateWords('FA-shared.record-failed')}
          onRetry={() => {
            void record.refetch();
            void list.refetch();
          }}
        >
          {stateWords('FA-shared.record-failed.line')}
        </FailedState>
      </div>
    );
  }
  if (!record.data?.ok || list.isPending) {
    return (
      <div className="xr-section-body">
        <LoadingState label={stateWords('FA-shared.record-loading')} surface={null} lines={2} />
      </div>
    );
  }
  const row = list.data?.ok
    ? (list.data.value.find((entry) => entry.assessment.id === assessmentId) ?? null)
    : null;
  return <AssessmentRowView view={record.data.value} row={row} />;
}

function AssessmentRowView({
  view,
  row,
}: {
  readonly view: AssessmentView;
  readonly row: AssessmentListRow | null;
}) {
  const { assessment, readiness } = view;
  const ready = readiness === 'ready';
  const words = READINESS_WORDS[readiness];
  const line = ready
    ? readyLine({
        deadline:
          assessment.rules.deadline === null ? null : deadlineWords(assessment.rules.deadline),
        counts: row
          ? { submitted: row.submitted, reach: row.reach, waiting: row.waitingForMarking }
          : null,
      })
    : draftLine(assessment.rules, assessment.questions.length);
  const action = (
    <Link className="xr-btn xr-btn--primary xr-btn--sm" href={assessmentAddress(assessment.id)}>
      {ready ? ASSESSMENT_ROW.open : ASSESSMENT_ROW.continue}
    </Link>
  );
  return (
    <ul className="xr-rows">
      <li className="xr-row">
        <div className="xr-row-main">
          <span className={`xr-row-icon xr-row-icon--${words.tone}`}>
            <Icon name="assessments" />
          </span>
          <div className="xr-row-text">
            <span className="xr-row-title">{assessment.name || assessment.id}</span>
            <span className="xr-row-sub">
              <StatusPill tone={words.tone}>{words.label}</StatusPill> {line}
            </span>
          </div>
        </div>
        {/* f0 draws the Ready row's actions in a group ("Mark … written answer" is not rendered
            until FA-18 is built, DEV-21); f2 draws the draft's one action on its own. */}
        {ready ? <div className="xw-actions">{action}</div> : action}
      </li>
    </ul>
  );
}

// ---- Student activity (f0, f3) ------------------------------------------------------------------

type FormatCounts = TeachingExperiment['perFormatCounts'][number];

/**
 * The Students the experiment reaches: one format's three counts (each such Student has exactly
 * one status in every format the institution has) — never a figure across formats
 * (`FA-05.students-count`).
 */
function studentsReached(counts: readonly FormatCounts[]): number {
  const first = counts[0];
  return first ? first.completed + first.inProgress + first.notStarted : 0;
}

function ActivitySection({ view }: { readonly view: TeachingExperiment }) {
  const counts = view.perFormatCounts;
  const students = studentsReached(counts);
  // f3 "No activity yet": no format has a student completed or in progress (each checked).
  const active = counts.some((entry) => entry.completed > 0 || entry.inProgress > 0);
  const have = studentsHaveLine(students);
  return (
    <Section title={EXPERIMENT_SECTIONS.activity} meta={asOfWords(dayMonthYear(view.asOf))}>
      {active ? (
        <div className="xr-section-body flex flex-col gap-[14px]">
          <p className="xr-body m-0">
            <strong>{have.strong}</strong> {have.rest}
          </p>
          <ul className="xa-counts" aria-label={ACTIVITY.countsLabel}>
            {counts.map((entry) => {
              const code = formatCode(entry.format);
              return (
                <li key={entry.format}>
                  <span className="xl-inline min-w-[90px]">
                    <FormatBadge format={code} variant="yours" compact />
                    <strong className="text-ink">{code}</strong>
                  </span>
                  {COUNT_WORDS.map(([key, words]) => (
                    <span key={key}>
                      <span className="xl-num">{entry[key]}</span> {words}
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{noActivityLine(students)}</p>
        </div>
      )}
    </Section>
  );
}

// ---- About this experiment ----------------------------------------------------------------------

function AboutSection({ view }: { readonly view: TeachingExperiment }) {
  const { experiment, resources } = view;
  const description = experiment.description.trim();
  return (
    <Section title={EXPERIMENT_SECTIONS.about}>
      <div className="xr-section-body flex flex-col gap-[14px]">
        {description ? <p className="xr-body m-0">{description}</p> : null}
        <div>
          <h3 className="xr-h3 m-0 mb-2">{ABOUT.outcomes}</h3>
          {experiment.learningOutcomes.length > 0 ? (
            <ul className="m-0 flex flex-col gap-1.5 pl-5">
              {experiment.learningOutcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          ) : (
            <p className="xl-meta m-0">{EXPERIMENT_PAGE.noneYet}</p>
          )}
        </div>
        <p className="xl-open m-0">
          <Icon name="readOnly" size={16} />
          <span>{ABOUT.outcomesNote}</span>
        </p>
        <div>
          <h3 className="xr-h3 m-0 mb-2">{ABOUT.resources}</h3>
          {resources.length > 0 ? (
            <p className="xr-body m-0 text-ink-2">
              {resources.map((resource) => resource.title).join(' · ')}
            </p>
          ) : (
            <p className="xl-meta m-0">{EXPERIMENT_PAGE.noneYet}</p>
          )}
        </div>
      </div>
    </Section>
  );
}
