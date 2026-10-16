'use client';

import type { SubmissionRow } from '@xr/contracts/draft';
import {
  Button,
  EmptyState,
  FailedState,
  Icon,
  Link,
  LoadingState,
  Notice,
  Section,
  SegmentedControl,
  StatusPill,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  emptyLine,
  exportedWords,
  notReleasedWords,
  releasedWords,
  scoreWords,
  type SubmissionFilter,
  submittedCountWords,
  SUBMISSIONS_WORDS,
} from '@/copy/submissions';
import { markSubmissionAddress } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useMarkingQueue, useSubmissions } from '@/queries/faculty-assessment-work';
import { useCommand } from '@/queries/use-command';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  PolicyOpenSubmissions,
  useAssessmentPage,
} from '../shared/assessment-frame';
import { downloadCsv } from '../shared/download-csv';

const FILTERS: readonly SubmissionFilter[] = ['all', 'waiting', 'marked'];

/** Marked = the marks are confirmed (read-only from then on); otherwise waiting for marking. */
function isMarked(row: SubmissionRow): boolean {
  return row.attempt.marking.confirmed !== null;
}

function shows(filter: SubmissionFilter, row: SubmissionRow): boolean {
  if (filter === 'waiting') return !isMarked(row);
  if (filter === 'marked') return isMarked(row);
  return true;
}

/** The data rows of the service's CSV (records outside quotes, less the header). */
export function csvRowCount(csv: string): number {
  let records = 0;
  let quoted = false;
  let content = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') quoted = !quoted;
    if (!quoted && (char === '\n' || char === '\r')) {
      if (content) records += 1;
      content = false;
      if (char === '\r' && csv[index + 1] === '\n') index += 1;
      continue;
    }
    content = true;
  }
  if (content) records += 1;
  return Math.max(0, records - 1);
}

/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV — board B4-06 f7 … f11, at
 * `/faculty/assessments/[assessmentId]/submissions`, inside the record frame (header and tabs,
 * "Submissions <n>" current).
 *
 * - **Reads**: the record's frame (`useAssessmentPage`), `AssessmentService.listSubmissions` (the
 *   submitted attempts, oldest first, with the confirmed score and the release flag read from
 *   each attempt's own version) and `MarkingService.listQueue` for this assessment's waiting
 *   submissions (the target of "Mark next", `FA-12.mark-next-target`).
 * - **As drawn**: "Submissions" with "<n> submitted · <n> waiting for marking"; the in-page filter
 *   "All · Waiting for marking · Marked" (`div.xr-seg`, "No submissions match this filter."); "Mark
 *   next" (FA-19, only while one waits) and "Export CSV"; the table Student (name and ATT
 *   number) · Submitted · Status · Score ("11 of 16" once the marks are confirmed, "—" before) ·
 *   Result released to student ("Not yet — after the deadline" with the lock, or "Released 14 Nov
 *   2026, 23:59"; the other release settings are `FA-12.release-*`). Below 760 px of content the
 *   rows stack, as f8 … f11 draw them. f11: "No submissions yet".
 * - **FA-22**: "Export CSV" asks the service for the file (`exportSubmissionsCsv`: every
 *   submission of the assessment, escaped and formula-safe) and the browser saves it; the
 *   confirmation "Exported <file> · <n> rows" with the columns takes focus (f10). A failure is an
 *   err notice in the same place (`FA-12.export-failed`); nothing is downloaded.
 * - **Held back**: a co-teaching colleague's assessment (the service answers policy-open,
 *   OD-B4-17) shows a calm provisional state and no submission (`FA-12.policy-open.*`). No release
 *   control anywhere: results follow the assessment's own setting.
 */
export function AssessmentSubmissions({ assessmentId }: { readonly assessmentId: string }) {
  const state = useAssessmentPage(assessmentId, 'submissions');
  if (state.kind !== 'ready') return <AssessmentFallback state={state} />;
  return (
    <AssessmentFrame view={state.view} tab="submissions">
      <SubmissionsBody key={state.view.record.assessment.id} view={state.view} />
    </AssessmentFrame>
  );
}

type ExportOutcome =
  | { readonly kind: 'exported'; readonly fileName: string; readonly rows: number }
  | { readonly kind: 'failed' };

function SubmissionsBody({ view }: { readonly view: AssessmentFrameView }) {
  const navigation = useAppNavigation();
  const assessmentId = view.record.assessment.id;
  const list = useSubmissions(assessmentId);
  const queue = useMarkingQueue(assessmentId, 'waiting');
  const exportCsv = useCommand((ports) => ports.assessments.exportSubmissionsCsv);
  const [filter, setFilter] = useState<SubmissionFilter>('all');
  const [outcome, setOutcome] = useState<ExportOutcome | null>(null);
  const [heldBack, setHeldBack] = useState(false);
  // The confirmation (or the failure) takes focus once it is on screen (f10 `#Ub-exp`).
  const noticeRef = useRef<HTMLDivElement>(null);
  const [announce, setAnnounce] = useState(0);
  useEffect(() => {
    if (announce > 0) noticeRef.current?.focus();
  }, [announce]);

  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');

  if (list.data && !list.data.ok) {
    const kind = list.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
  }
  const policyOpen =
    heldBack || (list.data?.ok === false && list.data.error.kind === 'policy-open');
  if (policyOpen) {
    return (
      <div className="xr-section">
        <PolicyOpenSubmissions />
      </div>
    );
  }
  if (list.isError || (list.data && !list.data.ok)) {
    return (
      <FailedState title={stateWords('FA-12.failed')} onRetry={() => void list.refetch()}>
        {stateWords('FA-shared.record-failed.line')}
      </FailedState>
    );
  }
  if (!list.data) {
    return <LoadingState label={stateWords('FA-12.loading')} surface="section" />;
  }

  const rows = list.data.value;
  const waiting = rows.filter((row) => !isMarked(row));
  const shown = rows.filter((row) => shows(filter, row));
  // FA-19 for the oldest written answer waiting: the queue's first (oldest first) that the list
  // shows waiting; while the queue loads, the list's own oldest. Once the queue has answered, a
  // submission it does not list (no written question to mark, M22) is never offered
  // (`FA-12.mark-next-target`; Phase 4B review).
  const waitingIds = new Set<string>(waiting.map((row) => row.attempt.id));
  const queued = queue.data?.ok
    ? (queue.data.value.find((entry) => waitingIds.has(entry.attempt.id))?.attempt.id ?? null)
    : undefined;
  const next = queued !== undefined ? queued : waiting.length > 0 ? waiting[0]!.attempt.id : null;

  const runExport = async () => {
    let result: ExportOutcome = { kind: 'failed' };
    try {
      const answer = await exportCsv.run(assessmentId);
      if (answer.ok) {
        downloadCsv(answer.value.fileName, answer.value.csv);
        result = {
          kind: 'exported',
          fileName: answer.value.fileName,
          rows: csvRowCount(answer.value.csv),
        };
      } else if (answer.error.kind === 'policy-open') {
        setHeldBack(true);
        return;
      } else {
        void list.refetch();
      }
    } catch {
      // Unavailable: the failure notice says so; nothing was downloaded.
    }
    setOutcome(result);
    setAnnounce((count) => count + 1);
  };

  return (
    <Section
      title={SUBMISSIONS_WORDS.title}
      headingId="submissions-heading"
      meta={submittedCountWords(rows.length, waiting.length)}
      metaLive
    >
      <div className="xr-toolbar [padding:0_24px_16px] items-center justify-between [gap:12px]">
        <SegmentedControl<SubmissionFilter>
          label={SUBMISSIONS_WORDS.show}
          options={FILTERS.map((value) => ({ value, label: SUBMISSIONS_WORDS.filters[value] }))}
          value={filter}
          onValueChange={setFilter}
        />
        <div className="xw-actions">
          {next !== null ? (
            <Link className="xr-btn xr-btn--primary xr-btn--sm" href={markSubmissionAddress(next)}>
              {SUBMISSIONS_WORDS.markNext}
            </Link>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            icon="download"
            busy={exportCsv.busy}
            busyLabel={stateWords('FA-12.export-busy')}
            onClick={() => void runExport()}
          >
            {SUBMISSIONS_WORDS.exportCsv}
          </Button>
        </div>
      </div>
      {outcome ? (
        <div id="submissions-export" ref={noticeRef} tabIndex={-1} className="[margin:0_24px_16px]">
          {outcome.kind === 'exported' ? (
            <Notice tone="ok" title={exportedWords(outcome.fileName, outcome.rows)}>
              {SUBMISSIONS_WORDS.exportedColumns}
            </Notice>
          ) : (
            <Notice tone="err" title={stateWords('FA-12.export-failed')}>
              {stateWords('FA-shared.record-failed.line')}
            </Notice>
          )}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <div className="xr-section-body">
          <EmptyState icon="assessments" title={SUBMISSIONS_WORDS.emptyTitle} headingLevel={3}>
            {emptyLine(experiment)}
          </EmptyState>
        </div>
      ) : shown.length === 0 ? (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{SUBMISSIONS_WORDS.noMatch}</p>
        </div>
      ) : (
        <SubmissionsTable rows={shown} />
      )}
    </Section>
  );
}

/** B4-06 f7 table: Student · Submitted · Status · Score · Result released to student. */
function SubmissionsTable({ rows }: { readonly rows: readonly SubmissionRow[] }) {
  const { columns } = SUBMISSIONS_WORDS;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.student}</th>
            <th scope="col">{columns.submitted}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.score}</th>
            <th scope="col">{columns.released}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const marked = isMarked(row);
            return (
              <tr key={row.attempt.id}>
                <td>
                  <strong>{row.student.fullName}</strong>
                  <span className="xr-meta block">{row.attempt.id}</span>
                </td>
                <td>{row.attempt.submittedAt ? dateTime(row.attempt.submittedAt) : null}</td>
                <td>
                  {marked ? (
                    <StatusPill tone="ok">{SUBMISSIONS_WORDS.marked}</StatusPill>
                  ) : (
                    <StatusPill tone="wait">{SUBMISSIONS_WORDS.waiting}</StatusPill>
                  )}
                </td>
                <td className="xl-num">
                  {marked && row.score !== null
                    ? scoreWords(row.score, row.outOf)
                    : SUBMISSIONS_WORDS.noScore}
                </td>
                <td>
                  {row.releasedAt !== null ? (
                    releasedWords(dateTime(row.releasedAt))
                  ) : (
                    <span className="xl-inline">
                      <Icon name="readOnly" size={16} />
                      {notReleasedWords(
                        row.release.option,
                        row.release.on === null ? null : dateTime(row.release.on),
                      )}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
