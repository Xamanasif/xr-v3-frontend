'use client';

import type { TeachingExperiment } from '@xr/contracts/draft';
import type { FormatCode } from '@xr/ui';
import {
  Breadcrumbs,
  Button,
  FaAside,
  FaChecklist,
  FaDetail,
  FaExperimentAbout,
  FaExperimentAboutGrid,
  FaExperimentHint,
  FaExperimentSection,
  FaFigure,
  FaFigures,
  FaFormatBadges,
  FaIdentityBand,
  FaMainSheet,
  FaPanel,
  FaProgress,
  FaQuiet,
  FaResourceList,
  FaTeachingActivityFoot,
  ListState,
  LoadingRows,
} from '@xr/ui/v3';

import { dayMonthYear } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import {
  ABOUT,
  ACTIVITY,
  EXPERIMENT_PAGE,
  EXPERIMENT_SECTIONS,
  experimentKicker,
  formatsUsedLabel,
  studentsHaveLine,
} from '@/copy/faculty-experiment';
import {
  activityLabel,
  asOfWords,
  formatsHeldLabel,
  PROGRESS_WORDS,
} from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_MY_COURSES_ADDRESS,
  facultyCourseAddress,
  facultyExperimentPlacement,
  facultyStudentsAddress,
} from '@/nav/faculty';
import { useSession } from '@/queries/session';
import { useFacultyAssessments, useTeachingExperiment } from '@/queries/teaching';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { AssessmentFacts } from '../fa-04-experiments/assessment-facts';
import {
  assessmentSummary,
  formatCodes,
  progressRows,
  studentsReached,
} from '../fa-04-experiments/teaching-view';
import { useOldestWaiting } from '../shared/mark-oldest';
import { useFacultyToday } from '../shared/use-today';

const TITLE_ID = 'fa-h1';
const PANEL_ID = 'fa-e1-asm';

/**
 * FA-05 Experiment, the teaching view — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/FA-v1, `Main.dc.html` FA-05, `vmExperiment` and `asmSum`), at
 * `/faculty/experiments/[experimentId]`.
 *
 * - **Reads**: `TeachingService.getTeachingExperiment` (the published page with its outcomes, read
 *   only; the formats the institution's plans give it; the formats its Students opened; per format
 *   how many of the Students it reaches completed, are in progress or have not started — never one
 *   figure across formats; the resources' titles; the instant the counts were read) and
 *   `AssessmentService.listAssessments` (the experiment's assessment: readiness, name, deadline,
 *   submitted, reach, written answers waiting, who created it), and — while own answers wait — the
 *   marking queue for that assessment (`listQueue`, oldest first) for "Mark". A command in the
 *   same tab refreshes them.
 * - **As the export draws it**: the breadcrumb "My courses › <code> › <experiment>"; the identity
 *   band (the date, the code, "Experiment you teach · <course>", the name, and three figures:
 *   formats the institution has, formats the Students have used — "None yet" — and Students with
 *   access); Student activity (one unit meter per format, "as of" the read, "Students on this
 *   experiment", FA-20) and About this experiment (description, learning outcomes with the
 *   read-only note, resources students see); beside them the navy Assessment panel (status, name
 *   → FA-08, deadline and days left, submissions, written answers waiting with "Mark …" → the
 *   oldest waiting submission, the note — "Created by …" for a co-teaching colleague's — and
 *   "Open assessment" or "Continue setting up"; none yet: "Create assessment" → FA-07 with the
 *   experiment chosen). Under 860 px the panel comes first.
 * - **Loading, failed, not found**: the application's record guard (`FA-05.loading`,
 *   `FA-05.failed`, `FA-05.not-found`); the assessment failing to load fails its panel only, with
 *   Try again (`FA-shared.record-failed`). No outcome editing (LD-3), no feedback (T-25).
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
    <RecordGuard
      read={read}
      loadingLabel={stateWords('FA-05.loading')}
      failed={{ title: stateWords('FA-05.failed'), line: stateWords('FA-05.failed.line') }}
    >
      {(answer) => <ExperimentContent view={answer} />}
    </RecordGuard>
  );
}

function ExperimentContent({ view }: { readonly view: TeachingExperiment }) {
  const { experiment } = view;
  const clock = useFacultyToday();
  const today = clock?.now ?? null;
  const students = studentsReached(view);
  const held = formatCodes(view.formatsInstitutionHas);
  const used = formatCodes(view.formatsUsedByStudents);
  const asOf = dayMonthYear(view.asOf);
  const description = experiment.description.trim();
  return (
    <>
      <Breadcrumbs
        levels={[
          { label: EXPERIMENT_PAGE.myCourses, href: FACULTY_MY_COURSES_ADDRESS },
          {
            label: experiment.platformCode ?? experiment.courseName,
            href: facultyCourseAddress(experiment.courseId),
          },
        ]}
        current={experiment.name}
      />
      <FaIdentityBand
        date={clock?.line}
        code={experiment.platformCode ?? ''}
        kicker={experimentKicker(experiment.courseName)}
        title={experiment.name}
        titleId={TITLE_ID}
        figures={
          <FaFigures>
            <FaFigure
              formats
              term={EXPERIMENT_PAGE.formatsHas}
              value={
                <FaFormatBadges formats={held as FormatCode[]} label={formatsHeldLabel(held)} />
              }
            />
            <FaFigure
              formats
              quiet={used.length === 0}
              term={EXPERIMENT_PAGE.formatsUsed}
              value={
                used.length > 0 ? (
                  <FaFormatBadges formats={used as FormatCode[]} label={formatsUsedLabel(used)} />
                ) : (
                  EXPERIMENT_PAGE.noneYet
                )
              }
            />
            <FaFigure
              term={EXPERIMENT_PAGE.studentsWithAccess}
              value={students > 0 ? students : EXPERIMENT_PAGE.noneYet}
            />
          </FaFigures>
        }
      />
      <FaDetail asideFirst>
        <FaMainSheet>
          <FaExperimentSection
            title={EXPERIMENT_SECTIONS.activity}
            titleId="fa-e1-act"
            hint={asOfWords(asOf)}
          >
            {students > 0 ? (
              <>
                <FaProgress
                  label={activityLabel(experiment.name, asOf)}
                  rows={progressRows(view)}
                  words={PROGRESS_WORDS}
                />
                <FaTeachingActivityFoot
                  link={{
                    href: facultyStudentsAddress(experiment.experimentId),
                    label: ACTIVITY.studentsLink,
                  }}
                >
                  {studentsHaveLine(students)}
                </FaTeachingActivityFoot>
              </>
            ) : (
              <FaQuiet>{ACTIVITY.noStudents}</FaQuiet>
            )}
          </FaExperimentSection>
          <FaExperimentSection title={EXPERIMENT_SECTIONS.about} titleId="fa-e1-about">
            {description ? <FaExperimentAbout>{description}</FaExperimentAbout> : null}
            <FaExperimentAboutGrid
              columns={[
                {
                  key: 'outcomes',
                  title: ABOUT.outcomes,
                  children: (
                    <>
                      {experiment.learningOutcomes.length > 0 ? (
                        <FaChecklist
                          label={ABOUT.outcomes}
                          items={experiment.learningOutcomes.map((outcome, index) => ({
                            key: String(index),
                            text: outcome,
                            done: true,
                          }))}
                        />
                      ) : (
                        <FaQuiet>{EXPERIMENT_PAGE.noneYet}</FaQuiet>
                      )}
                      <FaExperimentHint>{ABOUT.outcomesNote}</FaExperimentHint>
                    </>
                  ),
                },
                {
                  key: 'resources',
                  title: ABOUT.resources,
                  children:
                    view.resources.length > 0 ? (
                      <FaResourceList
                        label={ABOUT.resources}
                        resources={view.resources.map((resource, index) => ({
                          key: String(index),
                          title: resource.title,
                        }))}
                      />
                    ) : (
                      <FaQuiet>{EXPERIMENT_PAGE.noneYet}</FaQuiet>
                    ),
                },
              ]}
            />
          </FaExperimentSection>
        </FaMainSheet>
        <FaAside labelledBy={PANEL_ID}>
          <FaPanel title={EXPERIMENT_SECTIONS.assessment} titleId={PANEL_ID} assessment>
            <AssessmentPanelBody view={view} today={today} />
          </FaPanel>
        </FaAside>
      </FaDetail>
    </>
  );
}

/** The panel's body: the experiment's assessment from the list, or loading / failed in place. */
function AssessmentPanelBody({
  view,
  today,
}: {
  readonly view: TeachingExperiment;
  readonly today: string | null;
}) {
  const session = useSession();
  const me = session.status === 'signed-in' ? session.personId : null;
  const list = useFacultyAssessments();
  const experimentId = view.experiment.experimentId;
  const row = list.data?.ok
    ? (list.data.value.find((entry) =>
        view.assessmentId === null
          ? entry.assessment.experimentId === experimentId
          : entry.assessment.id === view.assessmentId,
      ) ?? null)
    : null;
  const summary = row === null ? null : assessmentSummary(row, me, today);
  const oldest = useOldestWaiting(summary?.assessmentId ?? null, summary?.waiting ?? 0);
  if (list.isError || (list.data !== undefined && !list.data.ok)) {
    return (
      <ListState
        kind="failed"
        title={stateWords('FA-shared.record-failed')}
        action={
          <Button onClick={() => void list.refetch()}>{FACULTY_FAILED_WORDS.tryAgain}</Button>
        }
      >
        {stateWords('FA-shared.record-failed.line')}
      </ListState>
    );
  }
  if (!list.data?.ok) {
    return <LoadingRows message={stateWords('FA-shared.record-loading')} rows={1} cells={[2]} />;
  }
  return (
    <AssessmentFacts
      variant="panel"
      experimentId={experimentId}
      summary={summary}
      markHref={oldest.address}
    />
  );
}
