'use client';

import type { AssessmentListRow, CreateOption, MarkingQueueRow } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  FaCellActions,
  FaCellLine,
  FaCellSub,
  FaFilters,
  FaMessageCard,
  FaQueueCount,
  FaQueueLockedNote,
  FaSegmented,
  FaSelectField,
  FaTable,
  FaTableBar,
  type FaTableRow,
  FaToolbar,
  ListState,
  LoadingRows,
  PageHead,
  type SelectOption,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import { dateTime, weekdayDate } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import { FACULTY_FAILED_WORDS } from '@/copy/faculty-overview';
import {
  assessmentOptionWords,
  confirmedOnWords,
  MARKING_QUEUE,
  oldestWaitingWords,
  queueAttemptWords,
  rowActionLabel,
  submittedAgoWords,
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
import { useMarkingQueue } from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';
import { useCreateOptions, useFacultyAssessments } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { calendarDaysSince } from './queue-days';

export type QueueState = 'waiting' | 'marked' | 'all';

interface QueueFilters {
  readonly assessmentId: string | null;
  readonly state: QueueState;
}

const TITLE_ID = 'mq-h1';
const SECTION_ID = 'mq-qh';
const ASSESSMENT_ID = 'mq-as';
const NO_COURSE_ID = 'mq-none';

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
 * experiment; an addressed assessment that is not among them is kept, named the same way — never
 * by its internal reference.
 */
export function assessmentOptions(input: {
  readonly assessments: readonly AssessmentListRow[] | null;
  readonly viewer: string | null;
  readonly experiments: readonly CreateOption[] | null;
  readonly rows: readonly MarkingQueueRow[];
  readonly addressed: string | null;
}): SelectOption[] {
  const experimentName = (experimentId: string | null, assessmentId: string): string | null =>
    (experimentId
      ? input.experiments?.find((entry) => entry.experimentId === experimentId)?.name
      : undefined) ??
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
        assessmentName(row.assessment.name),
        experimentName(row.assessment.experimentId, row.assessment.id),
      ),
    })),
  ];
  if (input.addressed && !options.some((option) => option.value === input.addressed)) {
    const row = input.rows.find((entry) => entry.attempt.assessmentId === input.addressed);
    const listed = input.assessments?.find((entry) => entry.assessment.id === input.addressed);
    options.push({
      value: input.addressed,
      label: assessmentOptionWords(
        assessmentName(row?.assessmentName ?? listed?.assessment.name ?? null),
        experimentName(listed?.assessment.experimentId ?? null, input.addressed),
      ),
    });
  }
  return options;
}

/** A queue row is waiting while its marks are not confirmed. */
function isWaiting(row: MarkingQueueRow): boolean {
  return row.attempt.marking.confirmed === null;
}

/**
 * FA-18 Marking queue — the owner-approved Faculty export (V3 Refined B, FA-v1 `Main.dc.html`
 * FA-18, `vmQueue`), at `/faculty/marking` (`?assessmentId=`, `?state=marked | all`).
 *
 * - **Reads**: `MarkingService.listQueue` three ways — the whole queue’s waiting answers (the count,
 *   the oldest wait and “Mark next”; the rail counts the same read), the list for the filters on
 *   show, and the whole queue (whether any written answer exists, and the counts on Waiting /
 *   Marked / All for the assessment chosen). `getCreateOptions` (the experiments taught: none →
 *   “Nothing to mark yet”; they name the options) and `listAssessments` (the Assessment filter’s
 *   options; a co-teaching colleague’s assessment with submissions → the note under the empty state).
 * - **As the export draws it**: the date (phones), “Marking” and its line; the surface “Written
 *   answers” with the count, the oldest wait and one gold “Mark next”; the Assessment filter and
 *   Waiting / Marked / All with counts; the table oldest first — Student (name, “Attempt 1 of 2”:
 *   the attempts allowed from the assessment list the page reads; “Attempt 1” until it answers),
 *   Assessment (name, “Question 4 · written answer”), Submitted (when, how long ago while it
 *   waits), Status (“Mark saved — not confirmed yet”, “Confirmed …”) and Mark / View marks —
 *   compact rows below 760 px. Empty: “Nothing is waiting for you”; no match: “Nothing matches these
 *   filters” with “Show all written answers”. No attempt or assessment is named by its id.
 * - The filters live here while the page is on show; the address mirrors them (replaced, no
 *   history entry); an address from outside (Back) is read again.
 * - Undrawn: loading and failed + Try again (state-copy `FA-18.loading`, `FA-18.failed`).
 */
export function MarkingQueue() {
  useShellPage(markingPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const addressed = filtersOf(navigation.search);
  const [filters, setFilters] = useState<QueueFilters>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setFilters(addressed);
  }
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLHeadingElement>(null);

  const waiting = useMarkingQueue(null, 'waiting');
  const list = useMarkingQueue(filters.assessmentId, filters.state);
  const everything = useMarkingQueue(null, 'all');
  const assessments = useFacultyAssessments();
  const experiments = useCreateOptions();

  const failedRead = (read: { isError: boolean; data?: { ok: boolean } }) =>
    read.isError || (read.data !== undefined && !read.data.ok);
  const failed = failedRead(waiting) || failedRead(list) || failedRead(everything);
  const waitingRows = waiting.data?.ok ? waiting.data.value : null;
  const rows = list.data?.ok ? list.data.value : null;
  const allRows = everything.data?.ok ? everything.data.value : null;
  const taught = experiments.data?.ok ? experiments.data.value : null;
  const listed = assessments.data?.ok ? assessments.data.value : null;

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
    void everything.refetch();
    titleRef.current?.focus();
  };

  const showAll = () => {
    change({ assessmentId: null, state: 'all' });
    sectionRef.current?.focus();
  };

  const head = (
    <PageHead
      title={MARKING_TITLE}
      titleId={TITLE_ID}
      titleRef={titleRef}
      titleFocusTarget
      date={today ? weekdayDate(today) : undefined}
      lead={MARKING_QUEUE.lead}
    />
  );

  // No course taught (state-copy `FA-18.no-course`): the message card instead of the surface.
  if (taught !== null && taught.length === 0) {
    return (
      <>
        {head}
        <FaMessageCard icon="pen" title={MARKING_QUEUE.noCourseTitle} titleId={NO_COURSE_ID}>
          {MARKING_QUEUE.noCourseLine}
        </FaMessageCard>
      </>
    );
  }

  const next = waitingRows ? nextToMark(waitingRows, filters.assessmentId) : null;
  const oldest = waitingRows?.[0] ?? null;
  const options = assessmentOptions({
    assessments: listed,
    viewer,
    experiments: taught,
    rows: [...(waitingRows ?? []), ...(rows ?? []), ...(allRows ?? [])],
    addressed: filters.assessmentId,
  });
  const loading = waitingRows === null || rows === null || allRows === null;
  // The export's `vmQueue`: empty with no written answer at all, or while Waiting and All
  // assessments are chosen and nothing waits; otherwise filters that leave no row match nothing.
  const empty =
    !loading &&
    (allRows.length === 0 ||
      (filters.state === 'waiting' && filters.assessmentId === null && waitingRows.length === 0));
  const inAssessment = (allRows ?? []).filter(
    (row) => filters.assessmentId === null || row.attempt.assessmentId === filters.assessmentId,
  );
  const nWaiting = inAssessment.filter(isWaiting).length;
  // A co-teaching colleague’s assessment with submissions (state-copy `FA-18.colleague-answers`).
  const colleagueAnswers = (listed ?? []).some(
    (row) =>
      !(
        row.assessment.createdBy.kind === 'person' && row.assessment.createdBy.personId === viewer
      ) && row.submitted > 0,
  );

  // "Attempt 1 of 2": the attempts its version allows, from the assessment list this page already
  // reads (`listAssessments`); "Attempt 1" until it answers or while the rule is not set.
  const attemptsAllowed = (assessmentId: string, version: number): number | null => {
    const assessment = listed?.find((entry) => entry.assessment.id === assessmentId)?.assessment;
    if (!assessment) return null;
    const rules =
      assessment.versions.find((entry) => entry.version === version)?.rules ?? assessment.rules;
    return rules.attemptsAllowed;
  };

  const queueRows: FaTableRow[] = (rows ?? []).map((row) => {
    const marked = !isWaiting(row);
    const saved = !marked && row.attempt.marking.written.some((entry) => entry.mark !== null);
    const note = marked
      ? confirmedOnWords(dateTime(row.attempt.marking.confirmed!.at))
      : saved
        ? MARKING_QUEUE.savedNote
        : null;
    return {
      key: row.attempt.id,
      static: true,
      cells: [
        {
          key: 'who',
          main: true,
          children: (
            <>
              <FaCellLine strong>{row.student.fullName}</FaCellLine>
              <FaCellSub>
                {queueAttemptWords(
                  row.attempt.attemptNumber,
                  attemptsAllowed(row.attempt.assessmentId, row.attempt.assessmentVersion),
                )}
              </FaCellSub>
            </>
          ),
        },
        {
          key: 'assessment',
          wide: true,
          noLabel: true,
          label: MARKING_QUEUE.cellLabels.assessment,
          children: (
            <>
              <FaCellLine>{assessmentName(row.assessmentName)}</FaCellLine>
              <FaCellSub>{writtenNumbersWords(row.writtenNumbers)}</FaCellSub>
            </>
          ),
        },
        {
          key: 'submitted',
          nowrap: true,
          wide: true,
          inline: true,
          label: MARKING_QUEUE.cellLabels.submitted,
          children: (
            <>
              {dateTime(row.submittedAt)}
              {!marked && today ? (
                <FaCellSub>
                  {submittedAgoWords(calendarDaysSince(row.submittedAt, today))}
                </FaCellSub>
              ) : null}
            </>
          ),
        },
        {
          key: 'status',
          status: true,
          label: MARKING_QUEUE.cellLabels.status,
          children: (
            <>
              {marked ? (
                <StatusPill tone="ok">{MARKING_QUEUE.statusMarked}</StatusPill>
              ) : (
                <StatusPill tone="warn">{MARKING_QUEUE.statusWaiting}</StatusPill>
              )}
              {note ? <FaCellSub>{note}</FaCellSub> : null}
            </>
          ),
        },
        {
          key: 'action',
          nowrap: true,
          wide: true,
          children: (
            <FaCellActions>
              <ButtonLink
                variant={marked ? 'ghost' : 'default'}
                href={markSubmissionAddress(row.attempt.id)}
                aria-label={rowActionLabel(row.student.fullName, marked)}
              >
                {marked ? MARKING_QUEUE.view : MARKING_QUEUE.mark}
              </ButtonLink>
            </FaCellActions>
          ),
        },
      ],
    };
  });

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('FA-18.failed')}
        action={<Button onClick={retry}>{FACULTY_FAILED_WORDS.tryAgain}</Button>}
      >
        {FACULTY_FAILED_WORDS.line}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('FA-18.loading')} rows={2} />;
  } else if (empty) {
    body = (
      <ListState
        kind="empty"
        roomy
        icon="inbox"
        title={MARKING_QUEUE.emptyTitle}
        action={
          colleagueAnswers ? (
            <FaQueueLockedNote inState>{MARKING_QUEUE.coteachNote}</FaQueueLockedNote>
          ) : undefined
        }
      >
        {MARKING_QUEUE.emptyLine}
      </ListState>
    );
  } else if (queueRows.length === 0) {
    const marked = filters.state === 'marked';
    body = (
      <ListState
        kind="nomatch"
        title={marked ? MARKING_QUEUE.noConfirmedTitle : MARKING_QUEUE.noMatchTitle}
        action={<Button onClick={showAll}>{MARKING_QUEUE.showAll}</Button>}
      >
        {marked ? MARKING_QUEUE.noConfirmedLine : MARKING_QUEUE.noMatchLine}
      </ListState>
    );
  } else {
    body = (
      <FaTable
        kind="queue"
        caption={MARKING_QUEUE.caption}
        columns={[
          { key: 'who', header: MARKING_QUEUE.columns.student },
          { key: 'assessment', header: MARKING_QUEUE.columns.assessment },
          { key: 'submitted', header: MARKING_QUEUE.columns.submitted },
          { key: 'status', header: MARKING_QUEUE.columns.status },
          { key: 'action', header: MARKING_QUEUE.columns.action, hidden: true },
        ]}
        rows={queueRows}
      />
    );
  }

  return (
    <>
      {head}
      <Surface labelledBy={SECTION_ID}>
        <FaToolbar>
          <FaTableBar
            title={MARKING_QUEUE.sectionTitle}
            titleId={SECTION_ID}
            titleRef={sectionRef}
            actions={
              next ? (
                <ButtonLink
                  variant="primary"
                  size="lg"
                  href={markSubmissionAddress(next.attempt.id)}
                >
                  {MARKING_QUEUE.markNext}
                </ButtonLink>
              ) : null
            }
          >
            {waitingRows !== null && !failed ? (
              <FaQueueCount
                count={waitingCountWords(waitingRows.length)}
                oldest={
                  oldest && today
                    ? oldestWaitingWords(calendarDaysSince(oldest.submittedAt, today))
                    : undefined
                }
              />
            ) : null}
          </FaTableBar>
          {allRows !== null && allRows.length > 0 && !failed ? (
            <FaFilters label={MARKING_QUEUE.filters} variant="queue">
              <FaSelectField
                id={ASSESSMENT_ID}
                label={MARKING_QUEUE.assessment}
                wide
                value={filters.assessmentId ?? 'all'}
                options={options}
                onChange={(value) =>
                  change({ ...filters, assessmentId: value === 'all' ? null : value })
                }
              />
              <FaSegmented
                label={MARKING_QUEUE.show}
                bar
                segments={[
                  {
                    key: 'waiting',
                    label: MARKING_QUEUE.waiting,
                    count: nWaiting,
                    pressed: filters.state === 'waiting',
                    onPress: () => change({ ...filters, state: 'waiting' }),
                  },
                  {
                    key: 'marked',
                    label: MARKING_QUEUE.marked,
                    count: inAssessment.length - nWaiting,
                    pressed: filters.state === 'marked',
                    onPress: () => change({ ...filters, state: 'marked' }),
                  },
                  {
                    key: 'all',
                    label: MARKING_QUEUE.all,
                    count: inAssessment.length,
                    pressed: filters.state === 'all',
                    onPress: () => change({ ...filters, state: 'all' }),
                  },
                ]}
              />
            </FaFilters>
          ) : null}
        </FaToolbar>
        {body}
      </Surface>
    </>
  );
}
