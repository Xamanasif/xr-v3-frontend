'use client';

import type { SubmissionRow } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  FaCellName,
  FaCellSub,
  FaCount,
  FaExportBand,
  FaRecordReleaseSub,
  FaResultMark,
  FaRowLink,
  FaSegmented,
  FaTable,
  FaTableBar,
  FaToolbar,
  ListState,
  LoadingRows,
  Notice,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { useEffect, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import { assessmentName, FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import { stateWords } from '@/copy/state-copy';
import {
  attemptWords,
  automaticWords,
  emptyLine,
  exportedWords,
  notReleasedSubWords,
  outcomeWords,
  releasedSubWords,
  rowLinkLabel,
  scoreWords,
  type SubmissionFilter,
  submissionsCaption,
  submittedCountWords,
  SUBMISSIONS_WORDS,
  waitingScoreWords,
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
  TAB_HEADING_ID,
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

/** The service's CSV as cells, record by record (quoted fields, doubled quotes, line breaks). */
export function csvCells(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]!;
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      record.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[index + 1] === '\n') index += 1;
      record.push(cell);
      if (record.some((value) => value !== '')) records.push(record);
      record = [];
      cell = '';
    } else cell += char;
  }
  record.push(cell);
  if (record.some((value) => value !== '')) records.push(record);
  return records;
}

/** "8", "7.5": a pass mark in marks as the domain computes it (pass mark × total; M22 open). */
function marksNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-12 Submissions · FA-22 Export", `vmSubmissions`), at
 * `/faculty/assessments/[assessmentId]/submissions`, inside the record frame.
 *
 * - **Reads**: the record's frame (`useAssessmentPage`: the record with its versions' rules),
 *   `AssessmentService.listSubmissions` (the submitted attempts, oldest first, with the confirmed
 *   score, the total and the release terms of each attempt's own version) and
 *   `MarkingService.listQueue` for this assessment's waiting submissions (the target of "Mark
 *   next", `FA-12.mark-next-target`).
 * - **As drawn**: "Submissions" with "2 submissions · 1 waiting for marking", "Mark next" (FA-19,
 *   only while one waits) and "Export CSV"; the in-page filter "All · Waiting for marking · Marked"
 *   with counts ("No submissions match this filter" with "Show all"); the table Student (the name,
 *   "Attempt 1 of 2" — and the version while attempts span versions; never the attempt's
 *   reference) · Submitted · Status · Score ("11 of 16" with "Passed · pass mark 8" once the marks
 *   are confirmed; "— of 16" with "Marked automatically: 4 of 6" before) · Result released to
 *   student ("Released" with when, or "Not yet" with the attempt's own rule beneath). Below 760 px
 *   of content the rows stack. No submission yet: "No submissions yet".
 * - **FA-22**: "Export CSV" asks the service for the file (`exportSubmissionsCsv`: every
 *   submission of the assessment, escaped and formula-safe) and the browser saves it under the
 *   service's own file name; the confirmation "Exported <file> · <n> rows" with the file's columns
 *   and rows takes focus. A failure is a notice in the same place (`FA-12.export-failed`); nothing
 *   is downloaded.
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
  | {
      readonly kind: 'exported';
      readonly rows: number;
      readonly cells: readonly (readonly string[])[];
    }
  | { readonly kind: 'failed' };

const EXPORT_ID = 'submissions-export';

function SubmissionsBody({ view }: { readonly view: AssessmentFrameView }) {
  const navigation = useAppNavigation();
  const assessment = view.record.assessment;
  const assessmentId = assessment.id;
  const list = useSubmissions(assessmentId);
  const queue = useMarkingQueue(assessmentId, 'waiting');
  const exportCsv = useCommand((ports) => ports.assessments.exportSubmissionsCsv);
  const [filter, setFilter] = useState<SubmissionFilter>('all');
  const [outcome, setOutcome] = useState<ExportOutcome | null>(null);
  const [heldBack, setHeldBack] = useState(false);
  // The confirmation (or the failure) takes focus once it is on screen (the export's `fa-exp`).
  const noticeRef = useRef<HTMLDivElement>(null);
  const [announce, setAnnounce] = useState(0);
  useEffect(() => {
    if (announce > 0) noticeRef.current?.focus();
  }, [announce]);

  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');
  const name = assessmentName(assessment.name);

  if (list.data && !list.data.ok) {
    const kind = list.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
  }
  const policyOpen =
    heldBack || (list.data?.ok === false && list.data.error.kind === 'policy-open');
  if (policyOpen) {
    return (
      <Surface labelledBy={TAB_HEADING_ID}>
        <PolicyOpenSubmissions />
      </Surface>
    );
  }
  if (list.isError || (list.data && !list.data.ok)) {
    return (
      <Surface labelledBy={TAB_HEADING_ID}>
        <ListState
          kind="failed"
          titleAs="h2"
          titleId={TAB_HEADING_ID}
          title={stateWords('FA-12.failed')}
          action={
            <Button onClick={() => void list.refetch()}>{FACULTY_FAILED_WORDS.tryAgain}</Button>
          }
        >
          {stateWords('FA-shared.record-failed.line')}
        </ListState>
      </Surface>
    );
  }
  if (!list.data) {
    return (
      <Surface labelledBy={TAB_HEADING_ID} busy>
        <FaToolbar>
          <FaTableBar title={SUBMISSIONS_WORDS.title} titleId={TAB_HEADING_ID} focusable />
        </FaToolbar>
        <LoadingRows message={stateWords('FA-12.loading')} />
      </Surface>
    );
  }

  const rows = list.data.value;
  const waiting = rows.filter((row) => !isMarked(row));
  const shown = rows.filter((row) => shows(filter, row));
  // FA-19 for the oldest submission waiting: the queue's first (oldest first) that the list shows
  // waiting; while the queue loads, the list's own oldest. Once the queue has answered, a
  // submission it does not list is never offered (`FA-12.mark-next-target`; Phase 4B review). Since
  // the owner decision of 24 Oct 2026 the queue lists choice-only submissions too (to confirm).
  const waitingIds = new Set<string>(waiting.map((row) => row.attempt.id));
  const queued = queue.data?.ok
    ? (queue.data.value.find((entry) => waitingIds.has(entry.attempt.id))?.attempt.id ?? null)
    : undefined;
  const next = queued !== undefined ? queued : waiting.length > 0 ? waiting[0]!.attempt.id : null;
  // Attempts span versions: each row says its version.
  const multi =
    assessment.version > 1 ||
    rows.some((row) => row.attempt.assessmentVersion !== assessment.version);

  const runExport = async () => {
    let result: ExportOutcome = { kind: 'failed' };
    try {
      const answer = await exportCsv.run(assessmentId);
      if (answer.ok) {
        downloadCsv(answer.value.fileName, answer.value.csv);
        result = {
          kind: 'exported',
          rows: csvRowCount(answer.value.csv),
          cells: csvCells(answer.value.csv),
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

  const rulesOf = (version: number) =>
    assessment.versions.find((entry) => entry.version === version)?.rules ?? assessment.rules;

  return (
    <Surface labelledBy={TAB_HEADING_ID}>
      <FaToolbar>
        <FaTableBar
          title={SUBMISSIONS_WORDS.title}
          titleId={TAB_HEADING_ID}
          focusable
          actions={
            next !== null || rows.length > 0 ? (
              <>
                {next !== null ? (
                  <ButtonLink variant="primary" href={markSubmissionAddress(next)}>
                    {SUBMISSIONS_WORDS.markNext}
                  </ButtonLink>
                ) : null}
                {rows.length > 0 ? (
                  <Button
                    icon="download"
                    iconSize={20}
                    busy={exportCsv.busy}
                    busyLabel={stateWords('FA-12.export-busy')}
                    onClick={() => void runExport()}
                  >
                    {SUBMISSIONS_WORDS.exportCsv}
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
        >
          <FaCount>{submittedCountWords(rows.length, waiting.length)}</FaCount>
        </FaTableBar>
        {rows.length > 0 ? (
          <FaSegmented
            bar
            label={SUBMISSIONS_WORDS.show}
            segments={FILTERS.map((value) => ({
              key: value,
              label: SUBMISSIONS_WORDS.filters[value],
              ...(value === 'waiting' ? { longLabel: SUBMISSIONS_WORDS.waitingLong } : {}),
              count:
                value === 'all'
                  ? rows.length
                  : value === 'waiting'
                    ? waiting.length
                    : rows.length - waiting.length,
              pressed: filter === value,
              onPress: () => setFilter(value),
            }))}
          />
        ) : null}
      </FaToolbar>
      {outcome?.kind === 'exported' ? (
        <FaExportBand
          noticeId={EXPORT_ID}
          noticeRef={noticeRef}
          title={exportedWords(name, outcome.rows)}
          description={SUBMISSIONS_WORDS.exportedColumns}
          rowsLabel={SUBMISSIONS_WORDS.exportedRows}
          columns={outcome.cells[0] ?? []}
          rows={outcome.cells.slice(1)}
        />
      ) : outcome?.kind === 'failed' ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          id={EXPORT_ID}
          ref={noticeRef}
          title={stateWords('FA-12.export-failed')}
        >
          {stateWords('FA-shared.record-failed.line')}
        </Notice>
      ) : null}
      {rows.length === 0 ? (
        <ListState kind="empty" title={SUBMISSIONS_WORDS.emptyTitle}>
          {view.record.readiness === 'ready' ? emptyLine(experiment) : SUBMISSIONS_WORDS.emptyDraft}
        </ListState>
      ) : shown.length === 0 ? (
        <ListState
          kind="nomatch"
          live
          title={SUBMISSIONS_WORDS.noMatch}
          action={<Button onClick={() => setFilter('all')}>{SUBMISSIONS_WORDS.showAll}</Button>}
        />
      ) : (
        <FaTable
          kind="submissions"
          caption={submissionsCaption(name)}
          columns={[
            { key: 'student', header: SUBMISSIONS_WORDS.columns.student },
            { key: 'submitted', header: SUBMISSIONS_WORDS.columns.submitted },
            { key: 'status', header: SUBMISSIONS_WORDS.columns.status },
            { key: 'score', header: SUBMISSIONS_WORDS.columns.score },
            { key: 'released', header: SUBMISSIONS_WORDS.columns.released },
          ]}
          rows={shown.map((row) => {
            const marked = isMarked(row);
            const rules = rulesOf(row.attempt.assessmentVersion);
            const percent = rules.passMarkPercent;
            const automatic = row.attempt.marking.automatic;
            const autoOutOf = automatic.reduce((sum, mark) => sum + mark.outOf, 0);
            const autoAwarded = automatic.reduce((sum, mark) => sum + mark.awarded, 0);
            const notYet = notReleasedSubWords(
              row.release.option,
              row.release.on === null ? null : dateTime(row.release.on),
            );
            return {
              key: row.attempt.id,
              link: true,
              cells: [
                {
                  key: 'student',
                  main: true,
                  children: (
                    <>
                      <FaRowLink
                        href={markSubmissionAddress(row.attempt.id)}
                        label={rowLinkLabel(!marked, row.student.fullName)}
                      >
                        {row.student.fullName}
                      </FaRowLink>
                      <FaCellSub>
                        {attemptWords(
                          row.attempt.attemptNumber,
                          rules.attemptsAllowed,
                          multi ? row.attempt.assessmentVersion : null,
                        )}
                      </FaCellSub>
                    </>
                  ),
                },
                {
                  key: 'submitted',
                  nowrap: true,
                  wide: true,
                  inline: true,
                  label: SUBMISSIONS_WORDS.columns.submitted,
                  children: row.attempt.submittedAt ? dateTime(row.attempt.submittedAt) : null,
                },
                {
                  key: 'status',
                  status: true,
                  label: SUBMISSIONS_WORDS.columns.status,
                  children: marked ? (
                    <StatusPill tone="ok">{SUBMISSIONS_WORDS.marked}</StatusPill>
                  ) : (
                    <StatusPill tone="warn">{SUBMISSIONS_WORDS.waiting}</StatusPill>
                  ),
                },
                {
                  key: 'score',
                  nowrap: true,
                  label: SUBMISSIONS_WORDS.columns.score,
                  children:
                    marked && row.score !== null ? (
                      <>
                        <FaCellName numeric>{scoreWords(row.score, row.outOf)}</FaCellName>
                        {percent !== null ? (
                          <FaCellSub>
                            {outcomeWords(
                              row.score * 100 >= percent * row.outOf,
                              Number(marksNumber((percent * row.outOf) / 100)),
                            )}
                          </FaCellSub>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <FaCellName numeric>{waitingScoreWords(row.outOf)}</FaCellName>
                        {autoOutOf > 0 ? (
                          <FaCellSub>{automaticWords(autoAwarded, autoOutOf)}</FaCellSub>
                        ) : null}
                      </>
                    ),
                },
                {
                  key: 'released',
                  label: SUBMISSIONS_WORDS.columns.released,
                  children: (
                    <>
                      <FaResultMark outcome={row.releasedAt !== null ? 'ok' : 'no'}>
                        {row.releasedAt !== null
                          ? SUBMISSIONS_WORDS.released
                          : SUBMISSIONS_WORDS.notYet}
                      </FaResultMark>
                      <FaRecordReleaseSub>
                        {row.releasedAt !== null
                          ? releasedSubWords(dateTime(row.releasedAt), row.release.option)
                          : (notYet ?? '')}
                      </FaRecordReleaseSub>
                    </>
                  ),
                },
              ],
            };
          })}
        />
      )}
    </Surface>
  );
}
