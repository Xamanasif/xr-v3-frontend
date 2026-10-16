'use client';

import type { AssessmentListRow, CreateOption, MarkingQueueRow } from '@xr/contracts/draft';
import {
  Button,
  Field,
  Icon,
  Link,
  PageContent,
  PageHeader,
  SegmentedControl,
  Select,
  type SelectOption,
  Skeleton,
  StatusPill,
} from '@xr/ui';
import { type ReactNode, useState } from 'react';

import { dateTime } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/faculty-overview';
import {
  assessmentOptionWords,
  MARKING_QUEUE,
  rowActionLabel,
  waitingCountWords,
  writtenNumbersWords,
} from '@/copy/marking';
import { stateWords } from '@/copy/state-copy';
import {
  MARKING_TITLE,
  markingPlacement,
  markingQueueAddress,
  markSubmissionAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useSession } from '@/queries/session';
import { useMarkingQueue } from '@/queries/faculty-assessment-work';
import { useCreateOptions, useFacultyAssessments } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

export type QueueState = 'waiting' | 'marked' | 'all';

interface QueueFilters {
  readonly assessmentId: string | null;
  readonly state: QueueState;
}

/** The address’s filters (`?assessmentId=`, `?state=marked | all`; waiting is the default). */
export function filtersOf(search: string): QueueFilters {
  const params = new URLSearchParams(search);
  const state = params.get('state');
  return {
    assessmentId: params.get('assessmentId') || null,
    state: state === 'marked' || state === 'all' ? state : 'waiting',
  };
}

/**
 * The oldest waiting answer “Mark next” opens (state-copy `FA-18.mark-next`): of the assessment
 * chosen, else of the whole queue (the queue is oldest first).
 */
export function nextToMark(
  waiting: readonly MarkingQueueRow[],
  assessmentId: string | null,
): MarkingQueueRow | null {
  const chosen = assessmentId
    ? waiting.find((row) => row.attempt.assessmentId === assessmentId)
    : undefined;
  return chosen ?? waiting[0] ?? null;
}

/**
 * The Assessment filter’s options (state-copy `FA-18.filters`): “All assessments”, then the
 * Faculty member’s own assessments that are Ready or have submissions, named with their
 * experiment; an addressed assessment that is not among them is kept, named by its id.
 */
export function assessmentOptions(input: {
  readonly assessments: readonly AssessmentListRow[] | null;
  readonly viewer: string | null;
  readonly experiments: readonly CreateOption[] | null;
  readonly rows: readonly MarkingQueueRow[];
  readonly addressed: string | null;
}): SelectOption[] {
  const experimentName = (experimentId: string, assessmentId: string): string | null =>
    input.experiments?.find((entry) => entry.experimentId === experimentId)?.name ??
    input.rows.find((row) => row.attempt.assessmentId === assessmentId)?.experimentName ??
    null;
  const own = (input.assessments ?? []).filter(
    (row) =>
      row.assessment.createdBy.kind === 'person' &&
      row.assessment.createdBy.personId === input.viewer &&
      (row.readiness === 'ready' || row.submitted > 0),
  );
  const options: SelectOption[] = [
    { value: 'all', label: MARKING_QUEUE.allAssessments },
    ...own.map((row) => ({
      value: row.assessment.id,
      label: assessmentOptionWords(
        row.assessment.name || row.assessment.id,
        experimentName(row.assessment.experimentId, row.assessment.id),
      ),
    })),
  ];
  if (input.addressed && !options.some((option) => option.value === input.addressed)) {
    const row = input.rows.find((entry) => entry.attempt.assessmentId === input.addressed);
    options.push({
      value: input.addressed,
      label: row
        ? assessmentOptionWords(row.assessmentName || input.addressed, row.experimentName || null)
        : input.addressed,
    });
  }
  return options;
}

/**
 * FA-18 Marking queue — board B4-09 f0, f4, f5, at `/faculty/marking` (`?assessmentId=`,
 * `?state=marked | all`).
 *
 * - **Reads**: `MarkingService.listQueue` three ways — the whole queue’s waiting answers (the
 *   header’s count and “Mark next”; the sidebar counts the same read), the list for the filters
 *   on show, and (only while Marked or All is chosen) the whole queue, to tell “nothing at all”
 *   from “nothing matches”. `listAssessments` and `getCreateOptions` name the Assessment filter’s
 *   options. Oldest first, as the service answers.
 * - **As B4-09 draws it**: “Marking” with “<n> written answers waiting” (a polite status) and the
 *   one primary “Mark next” while any answer waits; “Written answers” with the toolbar (Assessment
 *   · Waiting / Marked / All) and the table Student (name + attempt id) · Assessment (name +
 *   “Question 4 · written answer”) · Submitted (oldest first) · Status · Mark / View — stacked
 *   rows below 760 px of content (f4). f5: “Nothing is waiting for you”.
 * - The filters live here while the page is on show; the address mirrors them (replaced, no
 *   history entry); an address from outside (Back) is read again.
 * - Undrawn: loading and failed + Try again (state-copy `FA-18.loading`, `FA-18.failed`).
 */
export function MarkingQueue() {
  useShellPage(markingPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const addressed = filtersOf(navigation.search);
  const [filters, setFilters] = useState<QueueFilters>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setFilters(addressed);
  }

  const waiting = useMarkingQueue(null, 'waiting');
  const list = useMarkingQueue(filters.assessmentId, filters.state);
  const everything = useMarkingQueue(null, 'all', filters.state !== 'waiting');
  const assessments = useFacultyAssessments();
  const experiments = useCreateOptions();

  const failedRead = (read: typeof waiting) =>
    read.isError || (read.data !== undefined && !read.data.ok);
  const failed =
    failedRead(waiting) ||
    failedRead(list) ||
    (filters.state !== 'waiting' && failedRead(everything));
  const waitingRows = waiting.data?.ok ? waiting.data.value : null;
  const rows = list.data?.ok ? list.data.value : null;
  const allRows =
    filters.state === 'waiting' ? null : everything.data?.ok ? everything.data.value : null;

  const change = (next: QueueFilters) => {
    setFilters(next);
    navigation.replace(
      markingQueueAddress({
        ...(next.assessmentId ? { assessmentId: next.assessmentId } : {}),
        state: next.state,
      }),
    );
  };

  const retry = () => {
    void waiting.refetch();
    void list.refetch();
    if (filters.state !== 'waiting') void everything.refetch();
  };

  const next = waitingRows ? nextToMark(waitingRows, filters.assessmentId) : null;
  const options = assessmentOptions({
    assessments: assessments.data?.ok ? assessments.data.value : null,
    viewer,
    experiments: experiments.data?.ok ? experiments.data.value : null,
    rows: [...(waitingRows ?? []), ...(rows ?? []), ...(allRows ?? [])],
    addressed: filters.assessmentId,
  });

  let body: ReactNode;
  if (failed) {
    body = <LoadFailed onRetry={retry} />;
  } else if (
    waitingRows === null ||
    rows === null ||
    (filters.state !== 'waiting' && allRows === null)
  ) {
    body = <LoadingRows />;
  } else {
    // B4-09 `mqView`: empty while nothing waits under Waiting, or with no written answer at all;
    // otherwise filters that leave no row read “Nothing matches” (state-copy FA-18.empty-or-no-match).
    const empty =
      filters.state === 'waiting' ? waitingRows.length === 0 : (allRows ?? []).length === 0;
    if (empty) body = <Empty />;
    else if (rows.length === 0) body = <NoMatch />;
    else body = <QueueTable rows={rows} />;
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={MARKING_TITLE}
        meta={
          <span className="xl-meta" role="status">
            {waitingRows === null ? '' : waitingCountWords(waitingRows.length)}
          </span>
        }
        actions={
          next ? (
            <Link className="xr-btn xr-btn--primary" href={markSubmissionAddress(next.attempt.id)}>
              {MARKING_QUEUE.markNext}
            </Link>
          ) : null
        }
      />
      <section className="xr-section" aria-labelledby="mq-qh">
        <div className="xr-section-head">
          <h2 id="mq-qh" className="xr-h2">
            {MARKING_QUEUE.sectionTitle}
          </h2>
        </div>
        <div className="xr-toolbar [padding:0_24px_16px] [gap:12px_20px]">
          <Field id="mq-as" label={MARKING_QUEUE.assessment} className="min-w-[260px]">
            <Select
              value={filters.assessmentId ?? 'all'}
              onChange={(event) =>
                change({
                  ...filters,
                  assessmentId: event.target.value === 'all' ? null : event.target.value,
                })
              }
              options={options}
            />
          </Field>
          <SegmentedControl<QueueState>
            label={MARKING_QUEUE.show}
            value={filters.state}
            onValueChange={(state) => change({ ...filters, state })}
            options={[
              { value: 'waiting', label: MARKING_QUEUE.waiting },
              { value: 'marked', label: MARKING_QUEUE.marked },
              { value: 'all', label: MARKING_QUEUE.all },
            ]}
          />
        </div>
        {body}
      </section>
    </PageContent>
  );
}

/** The table (f0) — stacked rows below 760 px of content (f4). */
function QueueTable({ rows }: { readonly rows: readonly MarkingQueueRow[] }) {
  const { columns } = MARKING_QUEUE;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.student}</th>
            <th scope="col">{columns.assessment}</th>
            <th scope="col">{columns.submitted}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const marked = row.attempt.marking.confirmed !== null;
            return (
              <tr key={row.attempt.id}>
                <td>
                  <strong>{row.student.fullName}</strong>
                  <span className="xr-meta block">{row.attempt.id}</span>
                </td>
                <td>
                  {row.assessmentName || row.attempt.assessmentId}
                  <span className="xr-meta block">{writtenNumbersWords(row.writtenNumbers)}</span>
                </td>
                <td>{dateTime(row.submittedAt)}</td>
                <td>
                  {marked ? (
                    <StatusPill tone="ok">{MARKING_QUEUE.statusMarked}</StatusPill>
                  ) : (
                    <StatusPill tone="wait">{MARKING_QUEUE.statusWaiting}</StatusPill>
                  )}
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={markSubmissionAddress(row.attempt.id)}
                    aria-label={rowActionLabel(row.student.fullName, marked)}
                  >
                    {marked ? MARKING_QUEUE.view : MARKING_QUEUE.mark}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** f5 “Nothing is waiting for you”: the empty pattern with the done icon in the ok tint. */
function Empty() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h3 className="xr-h3 m-0">{MARKING_QUEUE.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{MARKING_QUEUE.emptyLine}</p>
      </div>
    </div>
  );
}

/** B4-09 `noMatch`: “Nothing matches these filters.” */
function NoMatch() {
  return (
    <div className="xr-section-body">
      <p className="xr-body m-0 text-ink-2">{MARKING_QUEUE.noMatch}</p>
    </div>
  );
}

/** Undrawn: loading (`FA-18.loading`), skeleton rows in the table’s shape. */
function LoadingRows() {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {stateWords('FA-18.loading')}
      </span>
      {[0, 1].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="grid grid-cols-[1fr_1.4fr_1fr_1fr_80px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2, 3, 4].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Undrawn: failed + Try again (`FA-18.failed`), B4-02 f5’s formula in the section body. */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h3 className="xr-h3 m-0">{stateWords('FA-18.failed')}</h3>
        <p className="xr-body m-0 text-ink-2">{FACULTY_FAILED_WORDS.line}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {FACULTY_FAILED_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
