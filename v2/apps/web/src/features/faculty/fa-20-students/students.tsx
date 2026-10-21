'use client';

import type {
  CreateOption,
  FacultyStudentRow,
  StudentProgressFilter,
  SubmissionRow,
} from '@xr/contracts/draft';
import type { FormatProgressStatus } from '@xr/domain';
import {
  Button,
  FaCellSub,
  FaExportBand,
  type FaFilterChip,
  FaFilters,
  FaMessageCard,
  FaQuiet,
  FaRowLink,
  FaSelectField,
  FaStatusLine,
  FaStudentsFormatCell,
  FaStudentsLastActivity,
  FaStudentsSummary,
  FaTable,
  FaTableBar,
  type FaTableRow,
  FaToolbar,
  type FaUnitState,
  Hint,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { dateTime, dayMonthYear, weekdayDate } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import {
  ASSESSMENT_WORDS,
  EXPORTED_ROWS,
  exportedColumns,
  exportedTitle,
  FORMAT_COUNT_WORDS,
  FORMAT_STATUS_WORDS,
  formatCellLabel,
  formatSummaryLabel,
  formatSummaryTitle,
  INACTIVE_OPTIONS,
  inactiveChip,
  inactiveTag,
  markedSubWords,
  noneSinceAccess,
  openStudentLabel,
  PROGRESS_OPTIONS,
  progressChip,
  removeChipLabel,
  STUDENTS_COLUMNS,
  STUDENTS_PAGE,
  STUDENTS_STATES,
  studentCountWords,
  studentsAsOfLine,
  studentsLead,
  submittedOnWords,
} from '@/copy/faculty-students';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import {
  FACULTY_STUDENTS_TITLE,
  facultyStudentAddress,
  facultyStudentsAddress,
  facultyStudentsPlacement,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import {
  type StudentsFilter,
  studentsInput,
  useFacultyStudents,
  useSubmissions,
} from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';
import { useCreateOptions, useTeachingExperiment } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { downloadCsv } from '../shared/download-csv';
import {
  csvRecords,
  formatCounts,
  formatsOf,
  INACTIVE_TAG_DAYS,
  inactiveDaysOf,
} from './student-facts';

type InactiveFor = 7 | 14 | 30;

const TITLE_ID = 'faculty-students-h1';
const SECTION_ID = 'faculty-students-h';
const SUMMARY_ID = 'faculty-students-sum';
const EXPERIMENT_ID = 'faculty-students-experiment';
const PROGRESS_ID = 'faculty-students-progress';
const INACTIVE_ID = 'faculty-students-inactive';
const MESSAGE_ID = 'faculty-students-export';
const NO_COURSE_ID = 'faculty-students-none';

/** What the last Export CSV left on the page (FA-22): the band, or a failure for now. */
type ExportMessage =
  | {
      readonly kind: 'exported';
      readonly title: string;
      readonly columns: readonly string[];
      readonly rows: readonly (readonly string[])[];
      readonly n: number;
    }
  | { readonly kind: 'failed'; readonly n: number };

const STATUS_TONE: Readonly<Record<FormatProgressStatus, 'ok' | 'info' | 'neutral'>> = {
  completed: 'ok',
  'in-progress': 'info',
  'not-started': 'neutral',
};

/**
 * FA-20 Students with FA-22 Export CSV — the owner-approved Faculty export (V3 Refined B, FA-v1
 * `Main.dc.html` FA-20, `vmStudents`), at `/faculty/students` (`?experimentId=`): “How are my
 * students progressing, and who needs follow-up?”
 *
 * - **Reads**: `AssessmentService.getCreateOptions` (the experiments the Faculty member teaches),
 *   `TeachingService.listStudents` for the chosen experiment with the Progress and “Inactive for”
 *   filters (the rows on show) and without them (the count’s total and the per-format summary),
 *   `getTeachingExperiment` for the “as of” instant (state-copy `FA-20.as-of`) and the
 *   experiment’s assessment, whose submissions (`listSubmissions`) give the waiting and marked
 *   lines (`FA-20.assessment-lines`). The experiment is the address’s, else the first taught one.
 * - **As the export draws it**: the date (phones), “Students” and its line; the surface — the
 *   experiment’s name with “As of … · progress in words, per format” and Export CSV; the summary
 *   meters by format; the filters (Experiment when more than one is taught, Progress, Inactive
 *   for), the count, the chips and “Clear filters”; the export band; the roster — Student (name →
 *   FA-21, ID), Progress by format (chips in words with dates), Assessment (its state and line),
 *   Last activity (with “Inactive <n> days” from 14 days) — compact rows below 760 px; no match;
 *   no students yet; the note under the surface. No course taught: the message card.
 * - **Export CSV** (FA-22): `exportStudentsCsv` with the filter on show; the browser saves the
 *   service's file, and the band names it, counts and shows its rows and lists its columns, and
 *   takes focus (`FA-22.file`). No messaging and no reminders (T-34); no percentage, no feedback.
 * - **States the export does not draw**: loading, failed + “Try again”, an attempt in progress, a
 *   co-teaching colleague’s assessment (`FA-20.*`, `FA-22.*`).
 */
export function FacultyStudents() {
  useShellPage(facultyStudentsPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const institution = session.status === 'signed-in' ? session.session.institutionName : null;
  const addressed = new URLSearchParams(navigation.search).get('experimentId');

  // The experiment lives here while the page is on show; the address mirrors it (replaced, no
  // history entry). An address that differs came from outside (Back, a link): it is read again.
  const [chosen, setChosen] = useState<string | null>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setChosen(addressed);
  }
  const [progress, setProgress] = useState<StudentProgressFilter | null>(null);
  const [inactiveFor, setInactiveFor] = useState<InactiveFor | null>(null);
  const [message, setMessage] = useState<ExportMessage | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const options = useCreateOptions();
  const taught = options.data?.ok ? options.data.value : null;
  const optionsFailed = options.isError || (options.data !== undefined && !options.data.ok);
  const experimentId = chosen ?? taught?.[0]?.experimentId ?? null;
  const experiment = taught?.find((entry) => entry.experimentId === experimentId) ?? null;

  const teaching = useTeachingExperiment(experiment?.experimentId ?? null);
  const asOf = teaching.data?.ok ? teaching.data.value.asOf : null;
  const filter: StudentsFilter | null = experiment
    ? { experimentId: experiment.experimentId, inactiveForDays: inactiveFor, progress }
    : null;
  const list = useFacultyStudents(filter);
  const everyone = useFacultyStudents(
    experiment
      ? { experimentId: experiment.experimentId, inactiveForDays: null, progress: null }
      : null,
  );
  const all = everyone.data?.ok ? everyone.data.value : null;
  // The experiment's assessment's submissions, unless a co-teaching colleague set it (withheld).
  const assessmentId =
    (teaching.data?.ok ? teaching.data.value.assessmentId : null) ??
    experiment?.existingAssessmentId ??
    null;
  const withheld = (all ?? []).some((row) => row.assessment.kind === 'policy-open');
  const submissions = useSubmissions(assessmentId, all !== null && !withheld);
  const submitted = submissions.data?.ok ? submissions.data.value : null;
  const exportCsv = useCommand((ports) => ports.teaching.exportStudentsCsv);

  if (taught && chosen !== null && experiment === null) return navigation.notFound();

  const choose = (next: string) => {
    setChosen(next);
    setMessage(null);
    navigation.replace(facultyStudentsAddress(next));
  };
  const filtersChanged = (patch: {
    readonly progress?: StudentProgressFilter | null;
    readonly inactiveFor?: InactiveFor | null;
  }) => {
    if (patch.progress !== undefined) setProgress(patch.progress);
    if (patch.inactiveFor !== undefined) setInactiveFor(patch.inactiveFor);
    setMessage(null);
  };

  const runExport = async () => {
    if (filter === null) return;
    const n = (message?.n ?? 0) + 1;
    try {
      const answer = await exportCsv.run(studentsInput(filter));
      if (!answer.ok) {
        setMessage({ kind: 'failed', n });
        return;
      }
      downloadCsv(answer.value.fileName, answer.value.csv);
      const file = csvRecords(answer.value.csv);
      setMessage({
        kind: 'exported',
        title: exportedTitle(answer.value.fileName, file.rows.length),
        columns: file.columns,
        rows: file.rows,
        n,
      });
    } catch {
      setMessage({ kind: 'failed', n });
    }
  };

  const head = (
    <PageHead
      title={FACULTY_STUDENTS_TITLE}
      titleId={TITLE_ID}
      titleRef={titleRef}
      titleFocusTarget
      date={today ? weekdayDate(today) : undefined}
      lead={studentsLead(taught !== null && taught.length === 0 ? null : institution)}
    />
  );

  // No experiment taught (state-copy `FA-20.no-experiment`): the message card.
  if (taught !== null && taught.length === 0) {
    return (
      <>
        {head}
        <FaMessageCard icon="people" title={STUDENTS_PAGE.noCourseTitle} titleId={NO_COURSE_ID}>
          {STUDENTS_PAGE.noCourseLine}
        </FaMessageCard>
      </>
    );
  }

  if (optionsFailed || experiment === null) {
    return (
      <>
        {head}
        <Surface>
          {optionsFailed ? (
            <ListState
              kind="failed"
              title={stateWords('FA-20.failed')}
              action={
                <Button
                  onClick={() => {
                    void options.refetch();
                    titleRef.current?.focus();
                  }}
                >
                  {FACULTY_FAILED_WORDS.tryAgain}
                </Button>
              }
            >
              {stateWords('FA-20.failed.line')}
            </ListState>
          ) : (
            <LoadingRows message={stateWords('FA-20.loading')} cells={[2, 2, 2, 1]} />
          )}
        </Surface>
      </>
    );
  }

  return (
    <>
      {head}
      <StudentsSurface
        experiment={experiment}
        taught={taught ?? []}
        onExperiment={choose}
        progress={progress}
        inactiveFor={inactiveFor}
        onFilters={filtersChanged}
        list={list}
        everyone={everyone}
        asOf={asOf}
        submitted={submitted}
        message={message}
        exporting={exportCsv.busy}
        onExport={() => void runExport()}
        titleRef={titleRef}
      />
      <Hint>{STUDENTS_PAGE.footNote}</Hint>
    </>
  );
}

/** A list read as the surface needs it (`useFacultyStudents`). */
interface ListRead {
  readonly data?:
    { readonly ok: true; readonly value: readonly FacultyStudentRow[] } | { readonly ok: false };
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

function failedRead(read: ListRead): boolean {
  return read.isError || (read.data !== undefined && !read.data.ok);
}

/** The experiment's surface: the toolbar, the export band and the roster or its state. */
function StudentsSurface({
  experiment,
  taught,
  onExperiment,
  progress,
  inactiveFor,
  onFilters,
  list,
  everyone,
  asOf,
  submitted,
  message,
  exporting,
  onExport,
  titleRef,
}: {
  readonly experiment: CreateOption;
  readonly taught: readonly CreateOption[];
  readonly onExperiment: (experimentId: string) => void;
  readonly progress: StudentProgressFilter | null;
  readonly inactiveFor: InactiveFor | null;
  readonly onFilters: (patch: {
    readonly progress?: StudentProgressFilter | null;
    readonly inactiveFor?: InactiveFor | null;
  }) => void;
  readonly list: ListRead;
  readonly everyone: ListRead;
  readonly asOf: string | null;
  readonly submitted: readonly SubmissionRow[] | null;
  readonly message: ExportMessage | null;
  readonly exporting: boolean;
  readonly onExport: () => void;
  readonly titleRef: { readonly current: HTMLHeadingElement | null };
}) {
  const failed = failedRead(list) || failedRead(everyone);
  const rows = list.data?.ok ? list.data.value : null;
  const all = everyone.data?.ok ? everyone.data.value : null;
  const loading = !failed && (rows === null || all === null);
  const filtered = progress !== null || inactiveFor !== null;

  const progressLabel = PROGRESS_OPTIONS.find((option) => option.value === (progress ?? ''))!;
  const chips: FaFilterChip[] = [
    ...(progress !== null
      ? [
          {
            key: 'progress',
            label: progressChip(progressLabel.label),
            onRemove: () => onFilters({ progress: null }),
            focusId: PROGRESS_ID,
          },
        ]
      : []),
    ...(inactiveFor !== null
      ? [
          {
            key: 'inactive',
            label: inactiveChip(inactiveFor),
            onRemove: () => onFilters({ inactiveFor: null }),
            focusId: INACTIVE_ID,
          },
        ]
      : []),
  ];
  const clear = () => onFilters({ progress: null, inactiveFor: null });
  const clearAndFocus = () => {
    clear();
    document.getElementById(PROGRESS_ID)?.focus();
  };

  let content: ReactNode;
  if (failed) {
    content = (
      <ListState
        kind="failed"
        title={stateWords('FA-20.failed')}
        action={
          <Button
            onClick={() => {
              if (failedRead(list)) void list.refetch();
              if (failedRead(everyone)) void everyone.refetch();
              titleRef.current?.focus();
            }}
          >
            {FACULTY_FAILED_WORDS.tryAgain}
          </Button>
        }
      >
        {stateWords('FA-20.failed.line')}
      </ListState>
    );
  } else if (loading) {
    content = <LoadingRows message={stateWords('FA-20.loading')} cells={[2, 2, 2, 1]} />;
  } else if (all!.length === 0) {
    content = (
      <ListState kind="empty" roomy icon="people" title={STUDENTS_STATES.emptyTitle}>
        {STUDENTS_STATES.emptyLine}
      </ListState>
    );
  } else if (rows!.length === 0) {
    content = (
      <ListState
        kind="nomatch"
        title={STUDENTS_STATES.noMatchTitle}
        action={<Button onClick={clearAndFocus}>{STUDENTS_PAGE.clearFilters}</Button>}
      >
        {STUDENTS_STATES.noMatchLine}
      </ListState>
    );
  } else {
    content = (
      <StudentsTable
        rows={rows!}
        experimentId={experiment.experimentId}
        asOf={asOf}
        submitted={submitted}
      />
    );
  }

  const hasRows = rows !== null && rows.length > 0 && !failed;
  const summary = all && all.length > 0 ? formatCounts(all) : [];

  return (
    <Surface labelledBy={SECTION_ID}>
      <FaToolbar>
        <FaTableBar
          title={experiment.name}
          titleId={SECTION_ID}
          actions={
            hasRows ? (
              <Button
                id="faculty-students-export-csv"
                icon="download"
                iconSize={20}
                busy={exporting}
                busyLabel={stateWords('FA-22.busy')}
                onClick={onExport}
              >
                {STUDENTS_PAGE.exportCsv}
              </Button>
            ) : null
          }
        >
          {asOf ? <Hint>{studentsAsOfLine(dayMonthYear(asOf))}</Hint> : null}
        </FaTableBar>
        {summary.length > 0 && all ? (
          <FaStudentsSummary
            titleId={SUMMARY_ID}
            title={formatSummaryTitle(all.length)}
            label={formatSummaryLabel(experiment.name)}
            words={FORMAT_COUNT_WORDS}
            rows={summary.map((entry) => ({
              format: formatCode(entry.format),
              completed: entry.completed,
              inProgress: entry.inProgress,
              notStarted: entry.notStarted,
              units: [
                ...Array<FaUnitState>(entry.completed).fill('done'),
                ...Array<FaUnitState>(entry.inProgress).fill('progress'),
                ...Array<FaUnitState>(entry.notStarted).fill('none'),
              ],
            }))}
          />
        ) : null}
        {all && all.length > 0 ? (
          <>
            <FaFilters label={STUDENTS_PAGE.filters}>
              {taught.length > 1 ? (
                <FaSelectField
                  id={EXPERIMENT_ID}
                  label={STUDENTS_PAGE.experimentLabel}
                  value={experiment.experimentId}
                  options={taught.map((entry) => ({
                    value: entry.experimentId,
                    label: entry.name,
                  }))}
                  onChange={onExperiment}
                />
              ) : null}
              <FaSelectField
                id={PROGRESS_ID}
                label={STUDENTS_PAGE.progressLabel}
                value={progress ?? ''}
                options={PROGRESS_OPTIONS.map((option) => ({ ...option }))}
                onChange={(value) =>
                  onFilters({ progress: value === '' ? null : (value as StudentProgressFilter) })
                }
              />
              <FaSelectField
                id={INACTIVE_ID}
                label={STUDENTS_PAGE.inactiveLabel}
                value={inactiveFor === null ? '' : String(inactiveFor)}
                options={INACTIVE_OPTIONS.map((option) => ({ ...option }))}
                onChange={(value) =>
                  onFilters({ inactiveFor: value === '' ? null : (Number(value) as InactiveFor) })
                }
              />
            </FaFilters>
            <FaStatusLine
              count={
                rows !== null && !failed
                  ? studentCountWords(rows.length, all.length, filtered)
                  : undefined
              }
              chips={chips}
              removeLabel={(chip) => removeChipLabel(chip.label)}
              clearLabel={STUDENTS_PAGE.clearFilters}
              onClearFilters={clear}
              clearFocusId={PROGRESS_ID}
            />
          </>
        ) : null}
      </FaToolbar>
      {message ? <ExportMessageView message={message} /> : null}
      {content}
    </Surface>
  );
}

/** FA-22: the export band, or its failure, focused when it shows. */
function ExportMessageView({ message }: { readonly message: ExportMessage }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [message.n]);
  if (message.kind === 'failed') {
    return (
      <Notice
        ref={ref}
        id={MESSAGE_ID}
        tone="warn"
        icon="alertCircle"
        role="alert"
        title={stateWords('FA-22.failed')}
      >
        {stateWords('FA-22.failed.line')}
      </Notice>
    );
  }
  return (
    <FaExportBand
      noticeId={MESSAGE_ID}
      noticeRef={ref}
      title={message.title}
      description={exportedColumns(message.columns)}
      rowsLabel={EXPORTED_ROWS}
      columns={message.columns}
      rows={message.rows}
      wide
    />
  );
}

/** The roster (compact rows below 760 px of table width). */
function StudentsTable({
  rows,
  experimentId,
  asOf,
  submitted,
}: {
  readonly rows: readonly FacultyStudentRow[];
  readonly experimentId: string;
  readonly asOf: string | null;
  readonly submitted: readonly SubmissionRow[] | null;
}) {
  const formats = formatsOf(rows);
  const tableRows: FaTableRow[] = rows.map((row) => {
    const days = inactiveDaysOf(row, asOf);
    const cells = formats.map((format) => {
      const view = row.perFormat.find((entry) => entry.format === format) ?? null;
      const status = view?.status ?? 'not-started';
      const date =
        status === 'completed' && view?.completion
          ? dayMonthYear(view.completion.completedAt)
          : null;
      return { format, status, date };
    });
    return {
      key: row.studentId,
      link: true,
      cells: [
        {
          key: 'who',
          main: true,
          wide: true,
          children: (
            <>
              <FaRowLink
                href={facultyStudentAddress(row.studentId, experimentId)}
                label={openStudentLabel(row.name)}
              >
                {row.name}
              </FaRowLink>
              <FaCellSub>{row.institutionStudentId}</FaCellSub>
            </>
          ),
        },
        {
          key: 'formats',
          wide: true,
          noLabel: true,
          label: STUDENTS_COLUMNS.progress,
          children: (
            <FaStudentsFormatCell
              label={formatCellLabel(
                cells.map((cell) => ({
                  code: formatCode(cell.format),
                  status: FORMAT_STATUS_WORDS[cell.status],
                  date: cell.date,
                })),
              )}
              formats={cells.map((cell) => ({
                key: cell.format,
                code: formatCode(cell.format),
                status: (
                  <StatusPill tone={STATUS_TONE[cell.status]}>
                    {FORMAT_STATUS_WORDS[cell.status]}
                  </StatusPill>
                ),
                date: cell.date,
              }))}
            />
          ),
        },
        {
          key: 'assessment',
          wide: true,
          label: STUDENTS_COLUMNS.assessment,
          children: <AssessmentCell row={row} submitted={submitted} />,
        },
        {
          key: 'last',
          wide: true,
          inline: true,
          label: STUDENTS_COLUMNS.lastActivity,
          children: (
            <FaStudentsLastActivity
              last={
                row.lastActivityAt !== null
                  ? dayMonthYear(row.lastActivityAt)
                  : row.accessGivenAt !== null
                    ? noneSinceAccess(dayMonthYear(row.accessGivenAt))
                    : stateWords('FA-20.last-activity-none')
              }
              inactive={days !== null && days >= INACTIVE_TAG_DAYS ? inactiveTag(days) : undefined}
            />
          ),
        },
      ],
    };
  });
  return (
    <FaTable
      kind="roster"
      caption={STUDENTS_PAGE.caption}
      columns={[
        { key: 'who', header: STUDENTS_COLUMNS.student, width: 'who' },
        { key: 'formats', header: STUDENTS_COLUMNS.progress, width: 'fm' },
        { key: 'assessment', header: STUDENTS_COLUMNS.assessment, width: 'asm' },
        { key: 'last', header: STUDENTS_COLUMNS.lastActivity },
      ]}
      rows={tableRows}
    />
  );
}

/** The Student's latest submitted attempt in the assessment's submissions, if read. */
function latestSubmission(
  submitted: readonly SubmissionRow[] | null,
  studentId: string,
): SubmissionRow | null {
  const own = (submitted ?? []).filter((entry) => entry.attempt.studentId === studentId);
  return own.sort((a, b) => a.attempt.attemptNumber - b.attempt.attemptNumber).at(-1) ?? null;
}

/** The Assessment cell: its state (`stuAsm`) and its line (state-copy `FA-20.assessment-lines`). */
function AssessmentCell({
  row,
  submitted,
}: {
  readonly row: FacultyStudentRow;
  readonly submitted: readonly SubmissionRow[] | null;
}) {
  const latest = latestSubmission(submitted, row.studentId);
  switch (row.assessment.kind) {
    case 'waiting-for-marking':
      return (
        <>
          <StatusPill tone="warn">{ASSESSMENT_WORDS.waiting}</StatusPill>
          {latest?.attempt.submittedAt ? (
            <FaCellSub>{submittedOnWords(dateTime(latest.attempt.submittedAt))}</FaCellSub>
          ) : null}
        </>
      );
    case 'not-released-yet':
    case 'released':
      return (
        <>
          <StatusPill tone="ok">{ASSESSMENT_WORDS.marked}</StatusPill>
          {latest && latest.score !== null ? (
            <FaCellSub>
              {markedSubWords(
                latest.score,
                latest.outOf,
                row.assessment.kind === 'released' || latest.releasedAt !== null,
              )}
            </FaCellSub>
          ) : null}
        </>
      );
    case 'to-do':
      return <StatusPill tone="neutral">{ASSESSMENT_WORDS.notStarted}</StatusPill>;
    case 'in-progress':
      return <StatusPill tone="info">{stateWords('FA-20.assessment-in-progress')}</StatusPill>;
    case 'none-set':
      return <StatusPill tone="neutral">{ASSESSMENT_WORDS.none}</StatusPill>;
    case 'policy-open':
      return <FaQuiet inline>{stateWords('FA-20.assessment-policy-open')}</FaQuiet>;
  }
}
