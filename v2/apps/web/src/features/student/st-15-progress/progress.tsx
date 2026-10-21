'use client';

import type { FormatProgressStatus } from '@xr/domain';
import {
  ButtonLink,
  PageHead,
  StAssessmentLine,
  StHoldNote,
  StLoading,
  StMessage,
  StProgressBlock,
  type StProgressChip,
  type StProgressFilter,
  StProgressGroup,
  StProgressHead,
  StProgressOff,
  StProgressPanel,
  type StProgressRow,
  StProgressTable,
  StProgressTools,
  StStateRow,
} from '@xr/ui/v3';
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';

import {
  courseChip,
  experimentCount,
  PROGRESS_PAGE,
  progressCount,
  removeFilterWords,
  STATUS_OPTIONS,
  statusChip,
} from '@/copy/progress-feedback';
import {
  openExperimentName,
  progressCaption,
  ST_ACTION_WORDS,
  ST_FORMAT_NAMES,
  ST_LABELS,
  ST_OFF_WORDS,
  ST_OPEN_EXPERIMENT,
  ST_PROGRESS_COLUMNS,
  ST_STATE_WORDS,
} from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { courseLine } from '@/copy/student';
import { myExperimentAddress, STUDENT_HELP_ADDRESS } from '@/nav/student';
import {
  feedbackAddress,
  formatPageAddress,
  PROGRESS_TITLE,
  progressPlacement,
} from '@/nav/student-progress';
import { useMyProgress } from '@/queries/learning';
import { useMyExperiments } from '@/queries/student';
import { useMyAssessments } from '@/queries/student-assessments';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type FormatAction,
  formatActionOf,
  formatFactsOf,
  formatHoldWords,
  primaryActionIndex,
  progressPillOf,
  sharedHoldOf,
} from '../shared/format-progress';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import type { Closure } from '../shared/student-view';
import {
  assessmentLineOf,
  assessmentRowOf,
  formatsOf,
  givenStatuses,
  opensNow,
  pausedNow,
  type ProgressExperiment,
  type ProgressGroup,
  progressGroups,
} from './progress-view';
import { useStudentTodayLine } from '../shared/use-today';

const STATUS_ID = 'progress-status';
const COURSE_ID = 'progress-course';

type StatusFilter = FormatProgressStatus | 'all';

/**
 * ST-15 Progress — the V3 Student export's `progress` region (`progVM`, `progExp`), at
 * `/student/progress`, the Student rail's "Progress": "What have I started and finished?"
 *
 * - **Reads**: `LearningService.getMyProgress` — every experiment the Student may see, with one
 *   progress view per published format (activity and the completion record side by side, BC3) and
 *   the assessment's latest result; `listMyCourses` / `getMyCourse` (`useMyExperiments`) — the
 *   course each experiment sits under, each format's availability and the closure; one more
 *   existing aggregate read, `listMyAssessments`, names the assessment, its deadline and its way
 *   on (without it the line falls back to the progress read's words); the session's banner facts
 *   (the institution's pause, an inactive account, XS-08).
 * - **Per format, never per experiment** (T-13): one table row per given format — its chip and
 *   access, its own pill ("Not started", "In progress", "Completed <day>" only from the completion
 *   record, T-12), its dated facts (first opened, last saved, reported by the simulation …; never a
 *   stage: lead decision 1) and at most one action (Continue / Open / Give feedback on <format>,
 *   only while available now; gold once on the page). Formats not available to the Student are
 *   listed under "Not available to you"; a licence wait is said once above the table, a pause by
 *   the shell's banner.
 * - **Filters**: Status (an experiment matches when one of its given formats has it; the table then
 *   lists those formats only) and Course, applied at once; the count, the chips and "Clear
 *   filters"; "No experiments match these filters".
 * - **States**: nothing yet (before access, no surface), only earlier work (SACC-14 open:
 *   `ST-15.earlier-only`), loading and failed with "Try again" inside the surface.
 */
export function Progress() {
  useShellPage(progressPlacement());
  const today = useStudentTodayLine();
  const student = useStudentSession();
  const progress = useMyProgress();
  const experiments = useMyExperiments();
  const assessments = useMyAssessments();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const assessmentsAnswered = assessments.data !== undefined || assessments.isError;
  const settled =
    progress.data?.ok === true &&
    experiments.data?.ok === true &&
    student !== null &&
    assessmentsAnswered;
  const retried = useRetryFocus(settled);
  const panelTitleId = useId();

  const retry = () => {
    retried();
    if (progress.isError || (progress.data && !progress.data.ok)) void progress.refetch();
    if (experiments.isError || (experiments.data && !experiments.data.ok))
      void experiments.refetch();
  };
  const clear = () => {
    setStatus('all');
    setCourseId('all');
  };

  const failed =
    progress.isError ||
    (progress.data && !progress.data.ok) ||
    experiments.isError ||
    (experiments.data && !experiments.data.ok);

  let content: ReactNode;
  if (failed || !settled || !progress.data?.ok || !experiments.data?.ok) {
    content = (
      <StProgressPanel title={PROGRESS_PAGE.panelTitle} titleId={panelTitleId}>
        <ProgressTools
          status={status}
          onStatus={setStatus}
          courseId={courseId}
          onCourse={setCourseId}
          groups={[]}
          count=""
          onClear={clear}
        />
        {failed ? (
          <StStateRow
            icon="cloudAlert"
            tone="err"
            alert
            title={PROGRESS_PAGE.failedTitle}
            description={ST_STATE_WORDS.failedLine}
            action={{ label: ST_STATE_WORDS.tryAgain, onClick: retry }}
          />
        ) : (
          <StLoading variant="panel" label={PROGRESS_PAGE.loading} />
        )}
      </StProgressPanel>
    );
  } else {
    const groups = progressGroups(progress.data.value, experiments.data.value.rows);
    const assessmentRows = assessments.data?.ok ? assessments.data.value : null;
    content =
      groups.length > 0 ? (
        <StProgressPanel title={PROGRESS_PAGE.panelTitle} titleId={panelTitleId}>
          <ProgressList
            groups={groups}
            session={student.closure}
            assessments={assessmentRows}
            status={status}
            onStatus={setStatus}
            courseId={courseId}
            onCourse={setCourseId}
            onClear={clear}
          />
        </StProgressPanel>
      ) : experiments.data.value.earlierWork ? (
        <StMessage
          icon="progress"
          title={stateWords('ST-15.earlier-only')}
          titleId={`${panelTitleId}-earlier`}
          description={stateWords('ST-15.earlier-only.line')}
        />
      ) : (
        <StMessage
          icon="progress"
          title={PROGRESS_PAGE.nothingTitle}
          titleId={`${panelTitleId}-nothing`}
          description={PROGRESS_PAGE.nothingLine}
          link={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
        />
      );
  }

  return (
    <>
      <PageHead title={PROGRESS_TITLE} titleFocusTarget date={today} lead={PROGRESS_PAGE.meta} />
      {content}
    </>
  );
}

/** The filters, the count and the course groups; or "No experiments match these filters". */
function ProgressList({
  groups,
  session,
  assessments,
  status,
  onStatus,
  courseId,
  onCourse,
  onClear,
}: {
  readonly groups: readonly ProgressGroup[];
  readonly session: Closure;
  readonly assessments: Parameters<typeof assessmentRowOf>[0];
  readonly status: StatusFilter;
  readonly onStatus: (value: StatusFilter) => void;
  readonly courseId: string;
  readonly onCourse: (value: string) => void;
  readonly onClear: () => void;
}) {
  const total = groups.reduce((sum, group) => sum + group.experiments.length, 0);
  const shown = groups
    .filter((group) => courseId === 'all' || group.course.courseId === courseId)
    .map((group) => ({
      ...group,
      experiments: group.experiments.filter(
        (item) => status === 'all' || givenStatuses(item).includes(status),
      ),
    }))
    .filter((group) => group.experiments.length > 0);
  const count = shown.reduce((sum, group) => sum + group.experiments.length, 0);
  const filtered = status !== 'all' || courseId !== 'all';

  // "Clear filters" in the no-match row goes with that row: focus moves to the Status filter once
  // the button has gone, and only if focus was lost.
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(STATUS_ID)?.focus();
  });

  // The rows of every shown experiment, in page order, so the page has one gold action.
  const blocks = shown.flatMap((group) =>
    group.experiments.map((item) => ({ item, rows: tableOf(item, session, status) })),
  );
  const actions = blocks.flatMap((block) => block.rows.map((row) => row.action));
  const primary = primaryActionIndex(actions);
  let place = 0;
  const rowsOf = new Map(
    blocks.map((block) => [
      block.item,
      block.rows.map((row) => ({ ...row, primary: place++ === primary })),
    ]),
  );

  return (
    <>
      <ProgressTools
        status={status}
        onStatus={onStatus}
        courseId={courseId}
        onCourse={onCourse}
        groups={groups}
        count={progressCount(count, total, groups.length, filtered)}
        onClear={onClear}
      />
      {shown.length > 0 ? (
        shown.map((group) => (
          <CourseGroup
            key={group.course.courseId}
            group={group}
            session={session}
            assessments={assessments}
            status={status}
            rowsOf={rowsOf}
          />
        ))
      ) : (
        <StStateRow
          icon="search"
          titleAs="p"
          title={PROGRESS_PAGE.noMatchTitle}
          description={PROGRESS_PAGE.noMatchLine}
          action={{
            label: ST_STATE_WORDS.clearFilters,
            onClick: () => {
              pressed.current = document.activeElement as HTMLElement | null;
              onClear();
            },
          }}
        />
      )}
    </>
  );
}

function ProgressTools({
  status,
  onStatus,
  courseId,
  onCourse,
  groups,
  count,
  onClear,
}: {
  readonly status: StatusFilter;
  readonly onStatus: (value: StatusFilter) => void;
  readonly courseId: string;
  readonly onCourse: (value: string) => void;
  readonly groups: readonly ProgressGroup[];
  readonly count: string;
  readonly onClear: () => void;
}) {
  const chips: StProgressChip[] = [];
  if (status !== 'all') {
    const label = statusChip(STATUS_OPTIONS.find(([value]) => value === status)![1]);
    chips.push({
      key: 'status',
      label,
      removeLabel: removeFilterWords(label),
      onRemove: () => onStatus('all'),
    });
  }
  const chosen = groups.find((group) => group.course.courseId === courseId)?.course;
  if (chosen) {
    const label = courseChip(chosen.codeShown ?? chosen.name);
    chips.push({
      key: 'course',
      label,
      removeLabel: removeFilterWords(label),
      onRemove: () => onCourse('all'),
    });
  }
  const filters: StProgressFilter[] = [
    {
      id: STATUS_ID,
      label: PROGRESS_PAGE.statusLabel,
      value: status,
      options: [
        { value: 'all', label: PROGRESS_PAGE.allStatuses },
        ...STATUS_OPTIONS.map(([value, label]) => ({ value, label })),
      ],
      onChange: (value) => onStatus(value as StatusFilter),
    },
    {
      id: COURSE_ID,
      label: PROGRESS_PAGE.courseLabel,
      value: courseId,
      options: [
        { value: 'all', label: PROGRESS_PAGE.allCourses },
        ...groups.map((group) => ({
          value: group.course.courseId,
          label: courseLine(group.course.codeShown, group.course.name),
        })),
      ],
      onChange: onCourse,
    },
  ];
  return (
    <StProgressTools
      label={PROGRESS_PAGE.filtersLabel}
      filters={filters}
      count={count}
      chips={chips}
      clearLabel={ST_STATE_WORDS.clearFilters}
      onClear={onClear}
    />
  );
}

interface TableRow {
  readonly key: string;
  readonly row: Omit<StProgressRow, 'actions'>;
  readonly action: FormatAction | null;
  readonly href: string | null;
}

/** One experiment's table rows (`progExp` `mine`): only the given formats with the status filtered. */
function tableOf(item: ProgressExperiment, session: Closure, status: StatusFilter): TableRow[] {
  const { mine } = formatsOf(item, session);
  const experimentId = item.progress.experimentId;
  return mine
    .filter((entry) => status === 'all' || (entry.given && entry.view.status === status))
    .map(({ view, chip }) => {
      const action = formatActionOf(chip, view);
      return {
        key: view.format,
        action,
        href:
          action === null
            ? null
            : action.kind === 'feedback'
              ? feedbackAddress(experimentId, view.format)
              : formatPageAddress(experimentId, view.format),
        row: {
          key: view.format,
          chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph },
          name: ST_FORMAT_NAMES[chip.code],
          access: chip.access,
          status: progressPillOf(view),
          facts: formatFactsOf(view, formatHoldWords(chip, opensNow(mine, chip.code))),
        },
      };
    });
}

/** One course (`div.sv-pgroup`): its code and name, "<n> experiment(s)" and each experiment. */
function CourseGroup({
  group,
  session,
  assessments,
  status,
  rowsOf,
}: {
  readonly group: ProgressGroup;
  readonly session: Closure;
  readonly assessments: Parameters<typeof assessmentRowOf>[0];
  readonly status: StatusFilter;
  readonly rowsOf: ReadonlyMap<ProgressExperiment, readonly (TableRow & { primary: boolean })[]>;
}) {
  const titleId = useId();
  const { course, experiments } = group;
  return (
    <StProgressGroup
      code={course.codeShown}
      title={course.name}
      titleId={titleId}
      count={experimentCount(experiments.length)}
    >
      {experiments.map((item) => (
        <ExperimentBlock
          key={item.progress.experimentId}
          item={item}
          session={session}
          assessments={assessments}
          status={status}
          rows={rowsOf.get(item) ?? []}
        />
      ))}
    </StProgressGroup>
  );
}

/** One experiment (`article.sv-pexp`): its head, the hold note, its formats, the assessment line. */
function ExperimentBlock({
  item,
  session,
  assessments,
  status,
  rows,
}: {
  readonly item: ProgressExperiment;
  readonly session: Closure;
  readonly assessments: Parameters<typeof assessmentRowOf>[0];
  readonly status: StatusFilter;
  readonly rows: readonly (TableRow & { primary: boolean })[];
}) {
  const baseId = useId();
  const { progress, experiment } = item;
  const hold = sharedHoldOf(experiment.closure, session);
  const off = status === 'all' ? formatsOf(item, session).off : [];
  const line = assessmentLineOf(progress, assessmentRowOf(assessments, progress.experimentId));
  return (
    <StProgressBlock labelledBy={`${baseId}-t`}>
      <StProgressHead
        title={progress.name}
        titleId={`${baseId}-t`}
        given={PROGRESS_PAGE.given}
        open={
          pausedNow(item, session)
            ? undefined
            : {
                href: myExperimentAddress(progress.experimentId),
                label: ST_OPEN_EXPERIMENT,
                ariaLabel: openExperimentName(progress.name),
              }
        }
      />
      {hold ? <StHoldNote icon={hold.icon}>{hold.words}</StHoldNote> : null}
      {rows.length > 0 ? (
        <StProgressTable
          caption={progressCaption(progress.name)}
          columns={ST_PROGRESS_COLUMNS}
          rows={rows.map(({ row, action, href, primary }) => ({
            ...row,
            actions:
              action && href ? (
                <ButtonLink
                  href={href}
                  variant={primary ? 'primary' : 'default'}
                  aria-label={ST_ACTION_WORDS.named(action.label, progress.name)}
                >
                  {action.label}
                </ButtonLink>
              ) : undefined,
          }))}
        />
      ) : null}
      {off.length > 0 ? (
        <StProgressOff title={ST_OFF_WORDS.title} titleId={`${baseId}-off`} level={5} rows={off} />
      ) : null}
      <StAssessmentLine label={ST_LABELS.assessment} link={line.link}>
        {line.words}
      </StAssessmentLine>
    </StProgressBlock>
  );
}
