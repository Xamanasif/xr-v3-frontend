'use client';

import type { CreateOption, FacultyStudentRow, StudentProgressFilter } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  Button,
  EmptyState,
  FailedState,
  Field,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Section,
  Select,
  Skeleton,
  StatusPill,
} from '@xr/ui';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  ASSESSMENT_WORDS,
  exportedColumns,
  exportedTitle,
  FORMAT_STATUS_WORDS,
  INACTIVE_OPTIONS,
  inactiveChip,
  inactiveTag,
  noneSinceAccess,
  openStudentLabel,
  PROGRESS_OPTIONS,
  progressChip,
  removeChipLabel,
  STUDENTS_COLUMNS,
  STUDENTS_PAGE,
  STUDENTS_STATES,
  studentCountWords,
  studentsMetaLine,
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
} from '@/queries/faculty-assessment-work';
import { useCreateOptions, useTeachingExperiment } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { downloadCsv } from '../shared/download-csv';
import { csvShape, formatsOf, INACTIVE_TAG_DAYS, inactiveDaysOf } from './student-facts';

type InactiveFor = 7 | 14 | 30;

const EXPERIMENT_ID = 'faculty-students-experiment';
const PROGRESS_ID = 'faculty-students-progress';
const INACTIVE_ID = 'faculty-students-inactive';
const MESSAGE_ID = 'faculty-students-export';

/** What the last Export CSV left on the page (FA-22): its message, or a failure for now. */
type ExportMessage =
  | {
      readonly kind: 'exported';
      readonly title: string;
      readonly columns: string;
      readonly n: number;
    }
  | { readonly kind: 'failed'; readonly n: number };

/**
 * FA-20 Students with FA-22 Export CSV — board B4-10 f0, f1, f2, f6, f7, at `/faculty/students`
 * (`?experimentId=`): "How are my students progressing, and who needs follow-up?"
 *
 * - **Reads**: `AssessmentService.getCreateOptions` (the experiments the Faculty member teaches,
 *   the Experiment filter), `TeachingService.listStudents` for the chosen experiment with the
 *   Progress and "Inactive for" filters (the rows on show) and without them (the total of "n of m
 *   students"), and `getTeachingExperiment` for the "as of" instant (state-copy `FA-20.as-of`).
 *   The experiment is the address's, else the first taught one (`FA-20.experiment`).
 * - **As drawn**: "Students" with "Students who have the experiments you teach · as of <date>" and
 *   Export CSV; the experiment's section ("Progress per format, in words") with the toolbar
 *   (Experiment, Progress, Inactive for), the count, the filter chips and "Clear filters" (f1); the
 *   table — Student (name → FA-21, ID), one column per format ("Completed" with its date, "In
 *   progress", "Not started"), Assessment, Last activity with the "Inactive <n> days" tag — which
 *   the v46 container rules turn into labelled rows below 760 px of content (f7); the board
 *   script's no-match line; f6 "No students have this experiment yet".
 * - **Export CSV** (FA-22, f2): `exportStudentsCsv` with the filter on show; the browser saves the
 *   service's file and the message names it, counts its rows and lists its columns, and takes
 *   focus (`FA-22.file`). No messaging and no reminders (T-34); no percentage, no feedback.
 * - **States B4-10 does not draw**: loading, failed + "Try again", no experiment taught, the
 *   assessment words beyond waiting / not started (`FA-20.*`, `FA-22.*`).
 */
export function FacultyStudents() {
  useShellPage(facultyStudentsPlacement());
  const navigation = useAppNavigation();
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
      const shape = csvShape(answer.value.csv);
      setMessage({
        kind: 'exported',
        title: exportedTitle(answer.value.fileName, shape.rows),
        columns: exportedColumns(shape.columns),
        n,
      });
    } catch {
      setMessage({ kind: 'failed', n });
    }
  };

  let body: ReactNode;
  if (optionsFailed) {
    body = (
      <div className="xr-section">
        <div className="xr-section-body">
          <FailedState title={stateWords('FA-20.failed')} onRetry={() => void options.refetch()}>
            {stateWords('FA-20.failed.line')}
          </FailedState>
        </div>
      </div>
    );
  } else if (taught === null) {
    body = <LoadingState label={stateWords('FA-20.loading')} surface="section" lines={4} />;
  } else if (experiment === null) {
    body = (
      <div className="xr-section">
        <EmptyState icon="studentsPeople" title={stateWords('FA-20.no-experiment')}>
          {stateWords('FA-20.no-experiment.line')}
        </EmptyState>
      </div>
    );
  } else {
    body = (
      <StudentsSection
        experiment={experiment}
        taught={taught}
        onExperiment={choose}
        progress={progress}
        inactiveFor={inactiveFor}
        onFilters={filtersChanged}
        list={list}
        everyone={everyone}
        asOf={asOf}
        message={message}
      />
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        title={FACULTY_STUDENTS_TITLE}
        meta={
          <span className="xl-meta">
            {studentsMetaLine(experiment && asOf ? dayMonthYear(asOf) : null)}
          </span>
        }
        actions={
          experiment ? (
            <Button
              variant="secondary"
              icon="download"
              busy={exportCsv.busy}
              busyLabel={stateWords('FA-22.busy')}
              onClick={() => void runExport()}
            >
              {STUDENTS_PAGE.exportCsv}
            </Button>
          ) : null
        }
      />
      {body}
    </PageContent>
  );
}

/** A list read as the section needs it (`useFacultyStudents`). */
interface ListRead {
  readonly data?:
    { readonly ok: true; readonly value: readonly FacultyStudentRow[] } | { readonly ok: false };
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

function failedRead(read: ListRead): boolean {
  return read.isError || (read.data !== undefined && !read.data.ok);
}

/** The experiment's section (f0): the toolbar, the export message and the list or its state. */
function StudentsSection({
  experiment,
  taught,
  onExperiment,
  progress,
  inactiveFor,
  onFilters,
  list,
  everyone,
  asOf,
  message,
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
  readonly message: ExportMessage | null;
}) {
  const failed = failedRead(list) || failedRead(everyone);
  const rows = list.data?.ok ? list.data.value : null;
  const all = everyone.data?.ok ? everyone.data.value : null;
  const loading = !failed && (rows === null || all === null);
  const status = rows !== null && all !== null ? studentCountWords(rows.length, all.length) : '';

  const progressLabel = PROGRESS_OPTIONS.find((option) => option.value === (progress ?? ''))!;
  const chips: Chip[] = [
    ...(progress !== null
      ? [
          {
            key: 'progress',
            label: progressChip(progressLabel.label),
            onRemove: () => onFilters({ progress: null }),
          },
        ]
      : []),
    ...(inactiveFor !== null
      ? [
          {
            key: 'inactive',
            label: inactiveChip(inactiveFor),
            onRemove: () => onFilters({ inactiveFor: null }),
          },
        ]
      : []),
  ];
  const clear = () => onFilters({ progress: null, inactiveFor: null });
  const pendingRef = useRef<Pressed>(null);
  const pressed = (control: HTMLElement) => {
    pendingRef.current = { control, index: 0 };
  };

  let content: ReactNode;
  if (failed) {
    content = (
      <div className="xr-section-body">
        <FailedState
          title={stateWords('FA-20.failed')}
          onRetry={() => {
            if (failedRead(list)) void list.refetch();
            if (failedRead(everyone)) void everyone.refetch();
          }}
        >
          {stateWords('FA-20.failed.line')}
        </FailedState>
      </div>
    );
  } else if (loading) {
    content = (
      <LoadingState
        label={stateWords('FA-20.loading')}
        surface="table"
        skeleton={[0, 1, 2].map((row) => (
          <div key={row} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr] gap-5 px-4 py-[18px]">
            {[0, 1, 2, 3, 4].map((cell) => (
              <Skeleton key={cell} />
            ))}
          </div>
        ))}
      />
    );
  } else if (all!.length === 0) {
    content = (
      <div className="xr-section-body">
        <EmptyState icon="studentsPeople" headingLevel={3} title={STUDENTS_STATES.emptyTitle}>
          {STUDENTS_STATES.emptyLine}
        </EmptyState>
      </div>
    );
  } else if (rows!.length === 0) {
    content = (
      <div className="xr-section-body">
        <p className="xr-body m-0 text-ink-2">
          {STUDENTS_STATES.noMatch} <ClearButton onClear={clear} onPress={pressed} />
        </p>
      </div>
    );
  } else {
    content = <StudentsTable rows={rows!} experimentId={experiment.experimentId} asOf={asOf} />;
  }

  return (
    <Section title={experiment.name} meta={STUDENTS_PAGE.sectionMeta}>
      <div className="[padding:0_24px_8px]">
        <div className="xr-toolbar">
          <Field id={EXPERIMENT_ID} label={STUDENTS_PAGE.experimentLabel} className="xr-filter-2">
            <Select
              options={taught.map((entry) => ({ value: entry.experimentId, label: entry.name }))}
              value={experiment.experimentId}
              onChange={(event) => onExperiment(event.target.value)}
            />
          </Field>
          <Field id={PROGRESS_ID} label={STUDENTS_PAGE.progressLabel}>
            <Select
              options={PROGRESS_OPTIONS.map((option) => ({ ...option }))}
              value={progress ?? ''}
              onChange={(event) =>
                onFilters({
                  progress:
                    event.target.value === ''
                      ? null
                      : (event.target.value as StudentProgressFilter),
                })
              }
            />
          </Field>
          <Field id={INACTIVE_ID} label={STUDENTS_PAGE.inactiveLabel}>
            <Select
              options={INACTIVE_OPTIONS.map((option) => ({ ...option }))}
              value={inactiveFor === null ? '' : String(inactiveFor)}
              onChange={(event) =>
                onFilters({
                  inactiveFor:
                    event.target.value === '' ? null : (Number(event.target.value) as InactiveFor),
                })
              }
            />
          </Field>
        </div>
        <ToolbarStatus
          status={status}
          chips={chips}
          onClear={chips.length > 0 ? clear : null}
          pendingRef={pendingRef}
        />
      </div>
      {message ? <ExportMessageView message={message} /> : null}
      {content}
    </Section>
  );
}

interface Chip {
  readonly key: string;
  readonly label: string;
  readonly onRemove: () => void;
}

/** The control pressed to remove a filter, and its chip's place in the row. */
type Pressed = { readonly control: HTMLElement; readonly index: number } | null;

/**
 * The count (`role="status"`), the applied-filter chips and "Clear filters" (f1). When a chip's
 * remove button or a "Clear filters" goes with the focus on it, focus moves to the next chip, else
 * the previous one, else the first filter shown (`FA-20.filters`; the Experiment filter is not
 * shown below 600 px of content).
 */
function ToolbarStatus({
  status,
  chips,
  onClear,
  pendingRef,
}: {
  readonly status: string;
  readonly chips: readonly Chip[];
  readonly onClear: (() => void) | null;
  readonly pendingRef: { current: Pressed };
}) {
  const row = useRef<HTMLDivElement>(null);
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  // After every commit: a filter may be removed in a later commit than the press (the list is
  // read again first), so the rescue waits until the pressed control itself has gone.
  useLayoutEffect(() => {
    const pressed = pendingRef.current;
    if (pressed === null || pressed.control.isConnected) return;
    pendingRef.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const remaining = chips
      .map((chip) => chipButtons.current.get(chip.key))
      .filter((button): button is HTMLButtonElement => Boolean(button));
    const filters = [
      ...(row.current?.parentElement?.querySelectorAll<HTMLElement>('.xr-toolbar select') ?? []),
    ];
    const target =
      remaining[pressed.index] ??
      remaining[pressed.index - 1] ??
      filters.find((select) => select.getClientRects().length > 0) ??
      filters[0];
    target?.focus();
  });

  return (
    <div ref={row} className="xr-toolbar-status">
      <span className="xr-meta" role="status">
        {status}
      </span>
      {chips.map((chip, index) => (
        <span key={chip.key} className="xr-fchip">
          {chip.label}
          <button
            ref={(element) => {
              if (element) chipButtons.current.set(chip.key, element);
              else chipButtons.current.delete(chip.key);
            }}
            type="button"
            aria-label={removeChipLabel(chip.label)}
            onClick={(event) => {
              pendingRef.current = { control: event.currentTarget, index };
              chip.onRemove();
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </span>
      ))}
      {onClear ? (
        <ClearButton
          onClear={onClear}
          onPress={(control) => {
            pendingRef.current = { control, index: 0 };
          }}
        />
      ) : null}
    </div>
  );
}

/** "Clear filters" (`xr-btn--text`, 32 px high as B4-10 draws it). */
function ClearButton({
  onClear,
  onPress,
}: {
  readonly onClear: () => void;
  readonly onPress?: (control: HTMLElement) => void;
}) {
  return (
    <Button
      variant="text"
      className="min-h-8"
      onClick={(event) => {
        onPress?.(event.currentTarget);
        onClear();
      }}
    >
      {STUDENTS_PAGE.clearFilters}
    </Button>
  );
}

/** f2: the export's message (`div#…[tabindex=-1]` around an ok notice), focused when it shows. */
function ExportMessageView({ message }: { readonly message: ExportMessage }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [message.n]);
  return (
    <div ref={ref} id={MESSAGE_ID} tabIndex={-1} className="[margin:0_24px_16px]">
      {message.kind === 'exported' ? (
        <Notice tone="ok" title={message.title}>
          {message.columns}
        </Notice>
      ) : (
        <Notice tone="err" title={stateWords('FA-22.failed')}>
          {stateWords('FA-22.failed.line')}
        </Notice>
      )}
    </div>
  );
}

/** f0 / f7: the table (labelled rows below 760 px of content, by the v46 container rules). */
function StudentsTable({
  rows,
  experimentId,
  asOf,
}: {
  readonly rows: readonly FacultyStudentRow[];
  readonly experimentId: string;
  readonly asOf: string | null;
}) {
  const formats = formatsOf(rows);
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col" className="min-w-[190px]">
              {STUDENTS_COLUMNS.student}
            </th>
            {formats.map((format) => (
              <th key={format} scope="col">
                {formatCode(format)}
              </th>
            ))}
            <th scope="col">{STUDENTS_COLUMNS.assessment}</th>
            <th scope="col">{STUDENTS_COLUMNS.lastActivity}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StudentRow
              key={row.studentId}
              row={row}
              formats={formats}
              experimentId={experimentId}
              asOf={asOf}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentRow({
  row,
  formats,
  experimentId,
  asOf,
}: {
  readonly row: FacultyStudentRow;
  readonly formats: readonly Technology[];
  readonly experimentId: string;
  readonly asOf: string | null;
}) {
  const days = inactiveDaysOf(row, asOf);
  return (
    <tr>
      <td>
        <Link
          href={facultyStudentAddress(row.studentId, experimentId)}
          aria-label={openStudentLabel(row.name)}
        >
          <strong>{row.name}</strong>
        </Link>
        <span className="xr-meta xw-nowrap block">{row.institutionStudentId}</span>
      </td>
      {formats.map((format) => (
        <td key={format} data-label={formatCode(format)}>
          <FormatStatus view={row.perFormat.find((entry) => entry.format === format) ?? null} />
        </td>
      ))}
      <td data-label={STUDENTS_COLUMNS.assessment}>
        <AssessmentCell assessment={row.assessment} />
      </td>
      <td data-label={STUDENTS_COLUMNS.lastActivity}>
        {row.lastActivityAt !== null
          ? dayMonthYear(row.lastActivityAt)
          : row.accessGivenAt !== null
            ? noneSinceAccess(dayMonthYear(row.accessGivenAt))
            : stateWords('FA-20.last-activity-none')}
        {days !== null && days >= INACTIVE_TAG_DAYS ? (
          <span className="xa-tag xa-tag--draft mt-1">
            <Icon name="clock" />
            {inactiveTag(days)}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

/** One format's status in words (f0): "Completed" + its date, "In progress", "Not started". */
function FormatStatus({ view }: { readonly view: FacultyStudentRow['perFormat'][number] | null }) {
  const status = view?.status ?? 'not-started';
  if (status === 'completed') {
    return (
      <>
        <StatusPill tone="ok">{FORMAT_STATUS_WORDS.completed}</StatusPill>
        {view?.completion ? (
          <span className="xr-meta mt-0.5 block">{dayMonthYear(view.completion.completedAt)}</span>
        ) : null}
      </>
    );
  }
  if (status === 'in-progress')
    return <StatusPill tone="wait">{FORMAT_STATUS_WORDS['in-progress']}</StatusPill>;
  return <StatusPill tone="off">{FORMAT_STATUS_WORDS['not-started']}</StatusPill>;
}

/** The Assessment column: f0's two drawn states, the rest provisional (`FA-20.assessment-*`). */
function AssessmentCell({ assessment }: { readonly assessment: FacultyStudentRow['assessment'] }) {
  switch (assessment.kind) {
    case 'waiting-for-marking':
      return <StatusPill tone="wait">{ASSESSMENT_WORDS.waiting}</StatusPill>;
    case 'not-released-yet':
    case 'released':
      return <StatusPill tone="ok">{stateWords('FA-20.assessment-marked')}</StatusPill>;
    case 'to-do':
      return <span className="xl-meta">{ASSESSMENT_WORDS.notStarted}</span>;
    case 'in-progress':
      return <span className="xl-meta">{stateWords('FA-20.assessment-in-progress')}</span>;
    case 'none-set':
      return <span className="xl-meta">{stateWords('FA-20.assessment-none')}</span>;
    case 'policy-open':
      return <span className="xl-meta">{stateWords('FA-20.assessment-policy-open')}</span>;
  }
}
