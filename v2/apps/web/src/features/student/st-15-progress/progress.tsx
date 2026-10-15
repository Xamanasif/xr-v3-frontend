'use client';

import type { MyExperimentRow } from '@xr/contracts/draft';
import type { FormatProgressStatus } from '@xr/domain';
import {
  Button,
  EmptyState,
  type FilterChip,
  FormatBadge,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  Skeleton,
  StatusPill,
} from '@xr/ui';
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';

import {
  FORMAT_WORDS,
  formatProgressWords,
  resultWords,
  studentAssessmentWords,
  wordsOf,
} from '@/copy/flow-state-words';
import {
  beforePauseWords,
  courseChip,
  experimentCount,
  feedbackSentWords,
  givenThroughWords,
  lastSavedWords,
  lastSessionWords,
  openFormatWords,
  PROGRESS_DETAILS,
  PROGRESS_PAGE,
  STATUS_OPTIONS,
  statusChip,
} from '@/copy/progress-feedback';
import { stateWords } from '@/copy/state-copy';
import {
  courseLine,
  formatCode,
  HUB_AVAILABILITY,
  progressLabel,
  STUDENT_WORDS,
} from '@/copy/student';
import { myExperimentAddress, STUDENT_HELP_ADDRESS } from '@/nav/student';
import {
  feedbackAddress,
  formatPageAddress,
  PROGRESS_TITLE,
  progressPlacement,
} from '@/nav/student-progress';
import { useMyProgress } from '@/queries/learning';
import { useMyExperiments } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  CodeThen,
  StudentFailed,
  useRetryFocus,
  useStudentSession,
} from '../shared/student-states';
import {
  type FormatLine,
  formatLines,
  givenStatuses,
  lineAction,
  type ProgressExperiment,
  type ProgressGroup,
  progressGroups,
  type ProgressRow,
} from './progress-view';
import { ProgressToolbar } from './progress-toolbar';

const STATUS_ID = 'progress-status';
const COURSE_ID = 'progress-course';

/**
 * ST-15 Progress — board B3-05 (f0 … f5, f7 … f9; B3-12 f4; B3-13 f12 … f15), at
 * `/student/progress`, the Student sidebar's "Progress": "What have I started and finished?"
 *
 * - **Reads**: `LearningService.getMyProgress` — every experiment the Student may see, with one
 *   progress view per published format (activity and the completion record side by side, BC3),
 *   the grant it is given through and the assessment; `listMyCourses` / `getMyCourse`
 *   (`useMyExperiments`) — the course each experiment sits under and each format's availability
 *   ("Not included for your institution", "Not available for this experiment"); the session's
 *   banner facts (the institution's pause, an inactive account, XS-08).
 * - **Per format, never per experiment** (T-13): "Not started", "In progress" with "Last saved …"
 *   (WEB) or "Last session reported …" (AR / VR / MR), "Completed <date>" only from the completion
 *   record (T-12); no percentage, no aggregate, no overall verdict. On a completed format the
 *   service's own feedback entry for THAT format: "Give feedback on WEB" (ST-16) or "Feedback sent
 *   <date>" (BC5). "Continue WEB" opens ST-08, "Open VR" ST-09 (state-copy `ST-15.actions`).
 * - **Filters** (f0, f3): Status (an experiment matches when one of its formats has it) and
 *   Course, applied at once; the count, chips and "Clear filters"; "No experiments match these
 *   filters" (f3).
 * - **States**: nothing yet (f4, before access, no toolbar), paused (f5: "Paused" with the
 *   progress "before the pause", no actions), loading (f7), failed with "Try again" (f8). Earlier
 *   work (f6) is not drawn from the service while SACC-14 is open (`ST-15.earlier-only`).
 */
export function Progress() {
  useShellPage(progressPlacement());
  const student = useStudentSession();
  const progress = useMyProgress();
  const experiments = useMyExperiments();
  const settled = progress.data?.ok === true && experiments.data?.ok === true && student !== null;
  const retried = useRetryFocus(settled);

  const retry = () => {
    retried();
    if (progress.isError || (progress.data && !progress.data.ok)) void progress.refetch();
    if (experiments.isError || (experiments.data && !experiments.data.ok))
      void experiments.refetch();
  };

  let content: ReactNode;
  if (
    progress.isError ||
    (progress.data && !progress.data.ok) ||
    experiments.isError ||
    (experiments.data && !experiments.data.ok)
  ) {
    content = (
      <>
        <div className="h-2" />
        <StudentFailed title={PROGRESS_PAGE.failedTitle} onRetry={retry} />
      </>
    );
  } else if (!settled || !progress.data?.ok || !experiments.data?.ok) {
    content = (
      <>
        <div className="h-2" />
        <ProgressLoading />
      </>
    );
  } else {
    const groups = progressGroups(progress.data.value, experiments.data.value.rows);
    content =
      groups.length > 0 ? (
        <ProgressList groups={groups} />
      ) : experiments.data.value.earlierWork ? (
        <div className="xr-section">
          <EmptyState icon="progress" title={stateWords('ST-15.earlier-only')}>
            {stateWords('ST-15.earlier-only.line')}
          </EmptyState>
        </div>
      ) : (
        <div className="xr-section">
          <EmptyState
            icon="progress"
            title={PROGRESS_PAGE.nothingTitle}
            actions={
              <div className="flex flex-wrap gap-3">
                <Link className="xr-btn xr-btn--text" href={STUDENT_HELP_ADDRESS}>
                  {STUDENT_WORDS.help}
                </Link>
              </div>
            }
          >
            {PROGRESS_PAGE.nothingLine}
          </EmptyState>
        </div>
      );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader className="mb-4" title={PROGRESS_TITLE} meta={PROGRESS_PAGE.meta} />
      {content}
    </PageContent>
  );
}

/**
 * B3-05 f7 "Loading": `div.xr-table-wrap aria-busy="true"` with the words in a status region and
 * four skeleton rows of three bars (`grid-template-columns:1.6fr 1fr 1fr`), hidden from readers.
 */
function ProgressLoading() {
  return (
    <LoadingState
      label={PROGRESS_PAGE.loading}
      skeleton={[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="grid grid-cols-[1.6fr_1fr_1fr] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    />
  );
}

/** The filters, the count and the course sections (f0 … f3, f5, f9). */
function ProgressList({ groups }: { readonly groups: readonly ProgressGroup[] }) {
  const [status, setStatus] = useState<FormatProgressStatus | 'all'>('all');
  const [courseId, setCourseId] = useState<string>('all');

  const shown = groups
    .filter((group) => courseId === 'all' || group.course.courseId === courseId)
    .map((group) => ({
      ...group,
      experiments: group.experiments.filter(
        (item) => status === 'all' || givenStatuses(item).includes(status),
      ),
    }))
    .filter((group) => group.experiments.length > 0);
  const count = shown.reduce((total, group) => total + group.experiments.length, 0);

  const chips: FilterChip[] = [];
  if (status !== 'all') {
    const label = STATUS_OPTIONS.find(([value]) => value === status)![1];
    chips.push({ key: 'status', label: statusChip(label), onRemove: () => setStatus('all') });
  }
  const chosenCourse = groups.find((group) => group.course.courseId === courseId)?.course;
  if (chosenCourse) {
    chips.push({
      key: 'course',
      label: courseChip(chosenCourse.codeShown ?? chosenCourse.name),
      onRemove: () => setCourseId('all'),
    });
  }
  const clear = () => {
    setStatus('all');
    setCourseId('all');
  };

  // "Clear filters" in the no-match state goes with that state: focus moves to the Status filter
  // once the button has gone, and only if focus was lost (as ST-04 does).
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(STATUS_ID)?.focus();
  });

  return (
    <>
      <ProgressToolbarFor
        status={status}
        onStatus={setStatus}
        courseId={courseId}
        onCourse={setCourseId}
        groups={groups}
        count={count}
        chips={chips}
        onClear={chips.length > 0 ? clear : undefined}
      />
      <div className="h-2" />
      {shown.length > 0 ? (
        <div className="xw-stack">
          {shown.map((group) => (
            <CourseSection key={group.course.courseId} group={group} />
          ))}
        </div>
      ) : (
        <div className="xr-section">
          <EmptyState
            icon="search"
            title={PROGRESS_PAGE.noMatchTitle}
            actions={
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={(event) => {
                    pressed.current = event.currentTarget;
                    clear();
                  }}
                >
                  {PROGRESS_PAGE.clearFilters}
                </Button>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}

function ProgressToolbarFor({
  status,
  onStatus,
  courseId,
  onCourse,
  groups,
  count,
  chips,
  onClear,
}: {
  readonly status: FormatProgressStatus | 'all';
  readonly onStatus: (value: FormatProgressStatus | 'all') => void;
  readonly courseId: string;
  readonly onCourse: (value: string) => void;
  readonly groups: readonly ProgressGroup[];
  readonly count: number;
  readonly chips: readonly FilterChip[];
  readonly onClear?: () => void;
}) {
  return (
    <ProgressToolbar
      filters={[
        {
          id: STATUS_ID,
          label: PROGRESS_PAGE.statusLabel,
          value: status,
          options: [
            { value: 'all', label: PROGRESS_PAGE.allStatuses },
            ...STATUS_OPTIONS.map(([value, label]) => ({ value, label })),
          ],
          onChange: (value) => onStatus(value as FormatProgressStatus | 'all'),
        },
        {
          id: COURSE_ID,
          label: PROGRESS_PAGE.courseLabel,
          value: courseId,
          className: 'xr-filter-2',
          options: [
            { value: 'all', label: PROGRESS_PAGE.allCourses },
            ...groups.map((group) => ({
              value: group.course.courseId,
              label: courseLine(group.course.codeShown, group.course.name),
            })),
          ],
          onChange: onCourse,
        },
      ]}
      status={experimentCount(count)}
      chips={chips}
      clearLabel={PROGRESS_PAGE.clearFilters}
      onClearFilters={onClear}
    />
  );
}

/** One course (`section.xr-section`): its name, "<code> · <n> experiment(s)" and each experiment. */
function CourseSection({ group }: { readonly group: ProgressGroup }) {
  const headingId = useId();
  const { course, experiments } = group;
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {course.name}
        </h2>
        <span className="xr-meta">
          <CodeThen code={course.codeShown}>{experimentCount(experiments.length)}</CodeThen>
        </span>
      </div>
      {experiments.map((item) => (
        <ExperimentProgress key={item.progress.experimentId} item={item} />
      ))}
    </section>
  );
}

/** One experiment (`div.xl-exp`): its name to the hub, the grant, a line per format, details. */
function ExperimentProgress({ item }: { readonly item: ProgressExperiment }) {
  const { progress, experiment } = item;
  const lines = formatLines(item);
  return (
    <div className="xl-exp">
      <div className="xl-exp-head">
        <h3 className="xl-exp-title">
          <Link href={myExperimentAddress(progress.experimentId)}>{progress.name}</Link>
        </h3>
        <span className="xl-meta">{givenThroughWords(progress.grantId)}</span>
      </div>
      <ul className="xl-fl" aria-label={PROGRESS_PAGE.formatsLabel}>
        {lines.map((line) => (
          <FormatLineItem
            key={line.format}
            line={line}
            experimentId={progress.experimentId}
            experiment={experiment}
          />
        ))}
      </ul>
      <details className="xl-more">
        <summary>
          {PROGRESS_PAGE.showDetails}
          <Icon name="chevronDown" />
        </summary>
        <div className="xl-more-body">
          <Details progress={progress} lines={lines} />
        </div>
      </details>
    </div>
  );
}

type GivenLine = Extract<FormatLine, { kind: 'given' }>;

function FormatLineItem({
  line,
  experimentId,
  experiment,
}: {
  readonly line: FormatLine;
  readonly experimentId: string;
  readonly experiment: MyExperimentRow;
}) {
  const code = formatCode(line.format);
  if (line.kind === 'off') {
    const words =
      typeof line.availability === 'object'
        ? stateWords('ST-05.format-policy-open')
        : HUB_AVAILABILITY[line.availability];
    return (
      <li className="is-off">
        <span className="xl-fl-fmt">
          <FormatBadge format={code} variant="off" compact />
          <span>{code}</span>
        </span>
        <span className="xl-fl-state">{words}</span>
        <span className="xl-fl-act" />
      </li>
    );
  }
  return (
    <li>
      <span className="xl-fl-fmt">
        <FormatBadge format={code} variant="yours" compact />
        <strong className="text-ink">{code}</strong>
      </span>
      <span className="xl-fl-state">
        <LineState line={line} />
      </span>
      <span className="xl-fl-act">
        <LineActionView line={line} experimentId={experimentId} experiment={experiment} />
      </span>
    </li>
  );
}

/** The progress words of a given format (f0, f1, f2, f5). */
function LineState({ line }: { readonly line: GivenLine }) {
  const { view } = line;
  const progressWords =
    wordsOf(formatProgressWords({ status: view.status, completion: view.completion })) ??
    progressLabel(view.status);
  if (view.beforePause) {
    return (
      <>
        <StatusPill tone="paused">{PROGRESS_PAGE.paused}</StatusPill>
        <span>{beforePauseWords(progressWords)}</span>
      </>
    );
  }
  switch (view.status) {
    case 'completed':
      return <StatusPill tone="ok">{progressWords}</StatusPill>;
    case 'not-started':
      return <StatusPill tone="off">{progressWords}</StatusPill>;
    case 'in-progress': {
      const activity = view.activity;
      const last =
        line.format === 'web'
          ? activity?.lastSavedAt
            ? lastSavedWords(activity.lastSavedAt)
            : null
          : activity?.lastSessionReportedAt
            ? lastSessionWords(activity.lastSessionReportedAt)
            : null;
      return (
        <>
          <StatusPill tone="wait">{progressWords}</StatusPill>
          {last ? <span>{last}</span> : null}
        </>
      );
    }
  }
}

/** The one action of a given format (state-copy `ST-15.actions`). */
function LineActionView({
  line,
  experimentId,
  experiment,
}: {
  readonly line: GivenLine;
  readonly experimentId: string;
  readonly experiment: MyExperimentRow;
}) {
  const action = lineAction(line, experiment);
  switch (action.kind) {
    case 'none':
      return null;
    case 'feedback-sent':
      return (
        <span className="xl-inline xl-meta">
          <Icon name="done" size={16} />
          {feedbackSentWords(action.sentAt)}
        </span>
      );
    case 'give-feedback':
      return (
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={feedbackAddress(experimentId, line.format)}
        >
          {FORMAT_WORDS.giveFeedback(line.format)}
        </Link>
      );
    case 'continue-web':
      return (
        <Link href={formatPageAddress(experimentId, line.format)}>
          {FORMAT_WORDS.continue(line.format)}
        </Link>
      );
    case 'open-format':
      return (
        <Link href={formatPageAddress(experimentId, line.format)}>
          {openFormatWords(line.format)}
        </Link>
      );
  }
}

/** "Show details" (f0, f1, f2, f9; state-copy `ST-15.details`, `ST-15.assessment`). */
function Details({
  progress,
  lines,
}: {
  readonly progress: ProgressRow;
  readonly lines: readonly FormatLine[];
}) {
  const given = lines.filter((line): line is GivenLine => line.kind === 'given');
  const rows: (readonly [string, string])[] = [];
  for (const line of given) {
    const words = activityWords(line);
    if (words) rows.push([formatCode(line.format), words]);
  }
  for (const line of given) {
    const { feedback } = line.view;
    if (typeof feedback === 'object') {
      rows.push([
        PROGRESS_DETAILS.feedbackKey(line.format),
        PROGRESS_DETAILS.sent(feedback.sentAt),
      ]);
    }
  }
  rows.push([PROGRESS_PAGE.assessment, assessmentWords(progress.assessment)]);
  return (
    <dl className="xp-kv m-0 grid grid-cols-[150px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
      {rows.map(([name, value]) => (
        <KeyValue key={name} name={name}>
          {value}
        </KeyValue>
      ))}
    </dl>
  );
}

function KeyValue({ name, children }: { readonly name: string; readonly children: ReactNode }) {
  return (
    <>
      <dt className="font-[700] text-ink">{name}</dt>
      <dd className="m-0 text-ink-2">{children}</dd>
    </>
  );
}

/**
 * "First opened 12 Oct 2026, 10:05 · completed 14 Oct 2026, 15:30" (WEB), "First session reported
 * … · completed …" (VR); in progress "· last saved …" / "· last session reported …"; nothing for a
 * format not started.
 */
function activityWords(line: GivenLine): string | null {
  const { activity, completion } = line.view;
  const web = line.format === 'web';
  const parts: string[] = [];
  if (activity?.firstOpenedAt) {
    parts.push(
      web
        ? PROGRESS_DETAILS.firstOpened(activity.firstOpenedAt)
        : PROGRESS_DETAILS.firstSession(activity.firstOpenedAt),
    );
  }
  if (completion) {
    parts.push(
      parts.length > 0
        ? PROGRESS_DETAILS.completed(completion.completedAt)
        : PROGRESS_DETAILS.completedAlone(completion.completedAt),
    );
  } else if (parts.length > 0) {
    if (web && activity?.lastSavedAt) parts.push(PROGRESS_DETAILS.lastSaved(activity.lastSavedAt));
    if (!web && activity?.lastSessionReportedAt) {
      parts.push(PROGRESS_DETAILS.lastSession(activity.lastSessionReportedAt));
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** The Assessment row's neutral words; Phase 4 builds the assessments (DEV-21). */
function assessmentWords(assessment: ProgressRow['assessment']): string {
  switch (assessment.kind) {
    case 'none-set':
      return PROGRESS_PAGE.noneSetYet;
    case 'released':
      return wordsOf(resultWords(assessment.passed)) ?? PROGRESS_PAGE.noneSetYet;
    case 'in-progress':
    case 'waiting-for-marking':
    case 'not-released-yet':
      return wordsOf(studentAssessmentWords(assessment.kind)) ?? PROGRESS_PAGE.noneSetYet;
  }
}
