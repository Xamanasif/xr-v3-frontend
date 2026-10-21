'use client';

import type { FacultyStudentRow } from '@xr/contracts/draft';
import type { FormatCode } from '@xr/ui';
import {
  Button,
  FaFormatBadges,
  FaMessageCard,
  FaOverviewCalm,
  FaOverviewCourse,
  FaOverviewDeadlines,
  FaOverviewExperiment,
  FaOverviewGetReady,
  FaOverviewGrid,
  FaOverviewNoDeadlines,
  FaOverviewPane,
  FaOverviewPriority,
  type FaOverviewPriorityItem,
  FaProgress,
  FaQuiet,
  ListState,
  LoadingRows,
  PageHead,
  StatusPill,
  TextLink,
} from '@xr/ui/v3';
import { useCallback, useEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import {
  activityLabel,
  asOfWords,
  FACULTY_OVERVIEW_WORDS,
  formatsHeldLabel,
  GET_READY,
  getReadyNote,
  openCourseLabel,
  PROGRESS_WORDS,
  scopeLineWords,
} from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  createAssessmentAddress,
  FACULTY_HELP_ADDRESS,
  FACULTY_OVERVIEW_TITLE,
  facultyCourseAddress,
  facultyExperimentAddress,
  facultyOverviewPlacement,
  newQuestionAddress,
} from '@/nav/faculty';
import { useFacultyStudents, useMarkingQueue } from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';
import {
  useFacultyAssessments,
  useFacultyOverview,
  useQuestionBank,
  useTeachingCourses,
} from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type TaughtExperiment,
  useTaughtExperiments,
} from '../fa-04-experiments/taught-experiments';
import { studentsReached } from '../fa-04-experiments/teaching-view';
import { useOldestWaiting } from '../shared/mark-oldest';
import { useFacultyToday } from '../shared/use-today';
import {
  deadlineViews,
  inactiveExperiments,
  isNewTeacher,
  noDeadlineWords,
  type PriorityItemView,
  priorityItems,
  teachingCourseViews,
  writtenAnswersWaiting,
} from './overview-view';

const TITLE_ID = 'fa-h1';
const NO_COURSES_ID = 'fa-ov-none';

const KIND_ICON = { written: 'pen', inactive: 'people', 'access-ended': 'lock' } as const;

/**
 * FA-01 Overview — the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/
 * FA-v1, `Main.dc.html` FA-01 and its `vmOverview`), at `/faculty`: only genuine work.
 *
 * - **Reads**: `TeachingService.getFacultyOverview` (the scope line's counts, the attention facts
 *   and the Ready assessments due in the next 30 days, PC-51), `listMyCourses` and the taught
 *   experiments (`useTaughtExperiments`: `getCreateOptions`, `listAssessments`, each experiment's
 *   `getTeachingExperiment`) for "Your teaching" and the release rule of each deadline, the marking
 *   queue (`MarkingService.listQueue`, oldest first — the read the rail's Marking count makes) for
 *   the people behind the written answers and "Mark now" (the oldest submission, FA-19), Students
 *   (`listStudents`, inactive 14+) for each inactive-Students fact's last activity, and — only for a
 *   new teacher — the first experiment's question bank.
 * - **As the export draws it**: the date, "Overview" and the scope line; the priority band sized to
 *   its items (written answers to mark, Students to follow up) or the calm state, or "Get your
 *   course ready" for a new teacher; "Coming up" (date tiles, days left, the submissions meter or
 *   who created a colleague's assessment, the release rule) beside "Your teaching" (each course
 *   and experiment with one unit meter per format and its assessment). No courses: the message
 *   card with Help & support. What no read holds is left out: the drafts item (state-copy
 *   `FA-01.not-rendered`). A course whose access ended — a product state the export does not
 *   draw — is an item of the band (`FA-01.access-ended-kind`).
 * - **Loading and failed**: the application's page loading and the failed state with Try again,
 *   which reads again and moves focus to the title (`FA-01.loading`, `FA-01.failed`).
 * - No internal reference in its words or names. Nothing here changes a record.
 */
export function FacultyOverview() {
  useShellPage(facultyOverviewPlacement());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const session = useSession();
  const me = session.status === 'signed-in' ? session.personId : null;
  const clock = useFacultyToday();
  const today = clock?.now ?? null;
  const date = clock?.line;

  const overview = useFacultyOverview();
  const courses = useTeachingCourses();
  const { read: taught, probes } = useTaughtExperiments();
  const assessments = useFacultyAssessments();
  const answer = overview.data?.ok ? overview.data.value : null;
  const courseRows = courses.data?.ok ? courses.data.value : null;

  // The people behind the counts: the marking queue (oldest first) and the inactive Students.
  const waiting = answer ? writtenAnswersWaiting(answer.attention) : 0;
  const oldest = useOldestWaiting(null, waiting);
  const queue = useMarkingQueue(null, 'waiting', waiting > 0);
  const queueRows = queue.data?.ok ? queue.data.value : null;
  const inactive = answer ? inactiveExperiments(answer.attention) : [];
  const students = useInactiveStudents(inactive);

  // A new teacher: no assessment and no Student yet — then the first experiment's bank is read.
  const experiments = taught.kind === 'ready' ? taught.experiments : null;
  const assessmentRows = assessments.data?.ok ? assessments.data.value : null;
  const first = experiments?.[0] ?? null;
  const bankWanted =
    first !== null &&
    assessmentRows !== null &&
    assessmentRows.length === 0 &&
    (experiments ?? []).every((entry) => studentsReached(entry.teaching) === 0);
  const bank = useQuestionBank(first?.option.experimentId ?? null, null, bankWanted);
  const bankEmpty = !bankWanted ? null : bank.data?.ok ? bank.data.value.length === 0 : null;

  const failed =
    overview.isError ||
    courses.isError ||
    (overview.data !== undefined && !overview.data.ok) ||
    (courses.data !== undefined && !courses.data.ok) ||
    taught.kind === 'failed';
  const loaded =
    !failed &&
    answer !== null &&
    courseRows !== null &&
    experiments !== null &&
    assessmentRows !== null &&
    // The people behind the counts and the bank answer before the page is drawn (a failed one
    // draws the item without them).
    !(waiting > 0 && queue.isPending) &&
    !students.pending &&
    !(bankWanted && bank.isPending);

  // Try again moves focus to the title, and keeps it there once the page has loaded.
  const refocus = useRef(false);
  useEffect(() => {
    if (!loaded || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus();
  }, [loaded]);

  const head = (lead?: string) => (
    <PageHead
      title={FACULTY_OVERVIEW_TITLE}
      titleId={TITLE_ID}
      titleRef={titleRef}
      titleFocusTarget
      date={date}
      lead={lead}
    />
  );

  if (!loaded || answer === null || courseRows === null || experiments === null) {
    const retry = () => {
      if (overview.isError || (overview.data && !overview.data.ok)) void overview.refetch();
      if (courses.isError || (courses.data && !courses.data.ok)) void courses.refetch();
      if (taught.kind === 'failed') taught.retry();
      refocus.current = true;
      titleRef.current?.focus();
    };
    return (
      <>
        {probes}
        {students.probes}
        {head()}
        {failed ? (
          <ListState
            kind="failed"
            titleAs="h2"
            title={stateWords('FA-01.failed')}
            action={<Button onClick={retry}>{FACULTY_FAILED_WORDS.tryAgain}</Button>}
          >
            {FACULTY_FAILED_WORDS.line}
          </ListState>
        ) : (
          <LoadingRows message={stateWords('FA-01.loading')} cells={[2, 1]} />
        )}
      </>
    );
  }

  const { courses: courseCount, experiments: experimentCount } = answer.scopeLine;
  if (courseCount === 0) {
    return (
      <>
        {probes}
        {head()}
        <FaMessageCard
          icon="book"
          title={FACULTY_OVERVIEW_WORDS.noCoursesTitle}
          titleId={NO_COURSES_ID}
          actions={<TextLink href={FACULTY_HELP_ADDRESS}>{FACULTY_OVERVIEW_WORDS.help}</TextLink>}
        >
          {FACULTY_OVERVIEW_WORDS.noCoursesLine}
        </FaMessageCard>
      </>
    );
  }

  const items = priorityItems(answer.attention, queueRows, students.byExperiment, today);
  const newTeacher = isNewTeacher({
    courses: courseCount,
    taught: experiments,
    assessments: assessmentRows ?? [],
    bankEmpty,
  });
  const deadlines = deadlineViews(answer.comingUp, assessmentRows ?? [], me, today);
  const teaching = teachingCourseViews(courseRows, experiments, me);
  const asOf = experiments[0]
    ? dayMonthYear(experiments[0].teaching.asOf)
    : today && dayMonthYear(today);

  return (
    <>
      {probes}
      {students.probes}
      {head(scopeLineWords(courseCount, experimentCount))}
      {items.length > 0 ? (
        <FaOverviewPriority
          title={FACULTY_OVERVIEW_WORDS.attention}
          titleId="fa-att-h"
          note={items.length > 1 ? FACULTY_OVERVIEW_WORDS.attentionNote : undefined}
          items={items.map((item) => priorityItem(item, oldest.address))}
        />
      ) : newTeacher && first !== null ? (
        <GetReady experiment={first} />
      ) : (
        <FaOverviewCalm title={FACULTY_OVERVIEW_WORDS.calmTitle}>
          {FACULTY_OVERVIEW_WORDS.calmLine}
        </FaOverviewCalm>
      )}
      <FaOverviewGrid>
        <FaOverviewPane
          title={FACULTY_OVERVIEW_WORDS.comingUp}
          titleId="fa-up-h"
          note={FACULTY_OVERVIEW_WORDS.comingUpNote}
        >
          {deadlines.length > 0 ? (
            <FaOverviewDeadlines
              items={deadlines.map((item) => ({
                key: item.key,
                day: item.day,
                month: item.month,
                title: item.title,
                href: item.href,
                accessibleName: item.accessibleName,
                due: item.due,
                left: item.left,
                submissions: item.submissions ?? undefined,
                createdBy: item.createdBy ?? undefined,
                release: item.release ?? undefined,
              }))}
            />
          ) : (
            <FaOverviewNoDeadlines>{noDeadlineWords(assessmentRows ?? [])}</FaOverviewNoDeadlines>
          )}
        </FaOverviewPane>
        <FaOverviewPane
          title={FACULTY_OVERVIEW_WORDS.teaching}
          titleId="fa-teach-h"
          note={asOf ? asOfWords(asOf) : undefined}
        >
          {teaching.map((course) => (
            <FaOverviewCourse
              key={course.courseId}
              code={course.code ?? undefined}
              title={course.name}
              open={{
                href: facultyCourseAddress(course.courseId),
                label: FACULTY_OVERVIEW_WORDS.openCourse,
                accessibleName: openCourseLabel(course.code, course.name),
              }}
            >
              {course.experiments.map((experiment) => (
                <FaOverviewExperiment
                  key={experiment.experimentId}
                  title={experiment.name}
                  href={facultyExperimentAddress(experiment.experimentId)}
                  formats={
                    <FaFormatBadges
                      formats={experiment.formats as FormatCode[]}
                      label={formatsHeldLabel(experiment.formats)}
                    />
                  }
                  reach={experiment.reach}
                  activity={
                    experiment.students > 0 ? (
                      <FaProgress
                        label={activityLabel(experiment.name, asOf ?? undefined)}
                        rows={experiment.progress}
                        words={PROGRESS_WORDS}
                      />
                    ) : (
                      <FaQuiet>{FACULTY_OVERVIEW_WORDS.noStudentsLine}</FaQuiet>
                    )
                  }
                  status={
                    <StatusPill tone={experiment.status.tone}>{experiment.status.words}</StatusPill>
                  }
                  assessment={experiment.assessment ?? undefined}
                />
              ))}
            </FaOverviewCourse>
          ))}
        </FaOverviewPane>
      </FaOverviewGrid>
    </>
  );
}

/** One item of the priority band; "Mark now" opens the oldest waiting submission. */
function priorityItem(item: PriorityItemView, markAddress: string): FaOverviewPriorityItem {
  return {
    key: item.key,
    when: { big: item.big, relative: item.relative, calm: item.calm },
    kind: { icon: KIND_ICON[item.kind], label: item.kindLabel },
    title: item.title,
    description: item.description ?? undefined,
    list: item.list
      ? {
          label: item.list.label,
          rows: item.list.rows.map((row) => ({
            key: row.key,
            name: row.name,
            detail: row.detail ?? undefined,
          })),
          more: item.list.more ?? undefined,
        }
      : undefined,
    action: {
      href: item.action.href ?? markAddress,
      label: item.action.label,
      accessibleName: item.action.accessibleName ?? undefined,
      primary: item.action.primary,
    },
  };
}

/** "Get your course ready": three steps for the first taught experiment. */
function GetReady({ experiment }: { readonly experiment: TaughtExperiment }) {
  const experimentId = experiment.option.experimentId;
  const { steps } = GET_READY;
  return (
    <FaOverviewGetReady
      title={GET_READY.title}
      titleId="fa-ready-h"
      note={getReadyNote(experiment.option.name)}
      steps={[
        {
          key: 'bank',
          number: '1',
          kind: steps.bank.kind,
          title: steps.bank.title,
          description: steps.bank.description,
          action: {
            href: newQuestionAddress({ experimentId }),
            label: steps.bank.action,
            primary: true,
          },
        },
        {
          key: 'assessment',
          number: '2',
          kind: steps.assessment.kind,
          title: steps.assessment.title,
          description: steps.assessment.description,
          action: {
            href: createAssessmentAddress({ experimentId }),
            label: steps.assessment.action,
          },
        },
        {
          key: 'experiment',
          number: '3',
          kind: steps.experiment.kind,
          title: steps.experiment.title,
          description: steps.experiment.description,
          action: { href: facultyExperimentAddress(experimentId), label: steps.experiment.action },
        },
      ]}
    />
  );
}

// ---- The inactive Students' last activity (Students, inactive 14+, per fact's experiment) --------

interface StudentsAnswer {
  readonly state: 'loading' | 'failed' | 'ready';
  readonly rows: readonly FacultyStudentRow[];
}

/** Holds one experiment's inactive Students read and reports it to the page. Renders nothing. */
function StudentsProbe({
  experimentId,
  onAnswer,
}: {
  readonly experimentId: string;
  readonly onAnswer: (experimentId: string, answer: StudentsAnswer) => void;
}) {
  const read = useFacultyStudents({ experimentId, inactiveForDays: 14, progress: null });
  const data = read.data;
  const state: StudentsAnswer['state'] =
    read.isError || (data !== undefined && !data.ok)
      ? 'failed'
      : data === undefined
        ? 'loading'
        : 'ready';
  const rows = data?.ok ? data.value : NO_ROWS;
  useEffect(() => {
    onAnswer(experimentId, { state, rows });
  }, [experimentId, state, rows, onAnswer]);
  return null;
}

const NO_ROWS: readonly FacultyStudentRow[] = [];

/**
 * Students inactive for 14 days or more, for each experiment an inactive-Students fact names (the
 * last activity the overview read does not hold). A failed read leaves the names without it.
 */
function useInactiveStudents(experimentIds: readonly string[]) {
  const [answers, setAnswers] = useState<ReadonlyMap<string, StudentsAnswer>>(new Map());
  const onAnswer = useCallback((experimentId: string, answer: StudentsAnswer) => {
    setAnswers((previous) => {
      const seen = previous.get(experimentId);
      if (seen && seen.state === answer.state && seen.rows === answer.rows) return previous;
      return new Map(previous).set(experimentId, answer);
    });
  }, []);
  const probes = experimentIds.map((experimentId) => (
    <StudentsProbe key={experimentId} experimentId={experimentId} onAnswer={onAnswer} />
  ));
  const byExperiment = new Map<string, readonly FacultyStudentRow[]>();
  let pending = false;
  for (const experimentId of experimentIds) {
    const answer = answers.get(experimentId);
    if (answer === undefined || answer.state === 'loading') pending = true;
    else if (answer.state === 'ready') byExperiment.set(experimentId, answer.rows);
  }
  return { probes, byExperiment, pending };
}
