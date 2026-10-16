'use client';

import type { StudentDetail } from '@xr/contracts/draft';
import type { Attempt } from '@xr/domain';
import {
  BackLink,
  FormatBadge,
  Icon,
  Link,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
} from '@xr/ui';

import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  attemptTitle,
  completedOn,
  detailOverline,
  FORMAT_STATUS_WORDS,
  marksWords,
  noActivitySince,
  noActivitySinceAccess,
  notReleasedLine,
  openedWords,
  releasedLine,
  startedWords,
  STUDENT_DETAIL,
  submittedWords,
} from '@/copy/faculty-students';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { firstName } from '@/copy/student-access';
import {
  assessmentAddress,
  facultyStudentPlacement,
  facultyStudentsAddress,
  markSubmissionAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useFacultyStudentDetail } from '@/queries/faculty-assessment-work';
import { useTeachingExperiment } from '@/queries/teaching';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { INACTIVE_TAG_DAYS, inactiveDaysOf } from '../fa-20-students/student-facts';

type AttemptFacts = StudentDetail['attemptFacts'][number];

/**
 * FA-21 Student detail — board B4-10 f3, f4, f5, at `/faculty/students/[studentId]?experimentId=`:
 * one Student on one experiment the Faculty member teaches.
 *
 * - **Reads**: `TeachingService.getStudentDetail` (the row FA-20 lists, the resources with when
 *   each was first opened, the assessment's attempts with their confirmed marks and pinned release
 *   terms, the experiment's name and course code) and `getTeachingExperiment` for the instant the
 *   days since access are counted to (state-copy `FA-20.inactive`). No `?experimentId=`, an
 *   unknown Student, one without the experiment or an experiment outside the teaching scope is
 *   the in-shell not-found page (`FA-21.not-found`).
 * - **As drawn**: "Students" (back to FA-20 for this experiment), "<EXPERIMENT> · <CODE>", the
 *   name, the Student ID and, when inactive for 14 days or more, the inactivity tag (f5);
 *   "Progress by format" (one row per format, in words; "Per format only — there is no overall
 *   percentage or verdict."); Assessment — per attempt, "<name> · attempt 1 of 2" with
 *   "ATT-0450 · submitted … · Waiting for marking" and "Mark their answers" (f3, → FA-19), or
 *   "Marked 11 of 16 · Result not released to Rahul yet — after the deadline, …" and "See
 *   submission" (f4, → FA-19, read-only once confirmed), or "Not started." (f5); Resources opened
 *   or not; "Feedback students give on a format isn’t shown to Faculty."
 * - No release button (results follow the assessment's own setting), no score before marks are
 *   confirmed, no messaging (T-34), no format feedback (T-25).
 * - **States B4-10 does not draw**: loading, failed + "Try again", an attempt in progress, a
 *   released result, no assessment, a colleague's assessment (`FA-21.*`).
 */
export function FacultyStudentDetail({ studentId }: { readonly studentId: string }) {
  const navigation = useAppNavigation();
  const experimentId = new URLSearchParams(navigation.search).get('experimentId');
  const read = useFacultyStudentDetail(studentId, experimentId);
  const teaching = useTeachingExperiment(experimentId);
  const view = read.data?.ok ? read.data.value : null;
  useShellPage(facultyStudentPlacement(view ? view.row.name : null));
  if (experimentId === null || experimentId === '') return navigation.notFound();
  const asOf = teaching.data?.ok ? teaching.data.value.asOf : null;
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('FA-21.loading')}
        failed={{ title: stateWords('FA-21.failed'), line: stateWords('FA-21.failed.line') }}
      >
        {(detail) => (
          // A Student the experiment was never given to is answered not-found by the service
          // (the in-shell not-found page, `FA-21.not-found`); after a withdrawal the Faculty
          // member still reads their work (WP-0.14 B-withdraw).
          <DetailContent detail={detail} experimentId={experimentId} asOf={asOf} />
        )}
      </RecordGuard>
    </PageContent>
  );
}

function DetailContent({
  detail,
  experimentId,
  asOf,
}: {
  readonly detail: StudentDetail;
  readonly experimentId: string;
  readonly asOf: string | null;
}) {
  const { row } = detail;
  return (
    <>
      <PageHeader
        className="mt-2"
        back={
          <BackLink href={facultyStudentsAddress(experimentId)}>{STUDENT_DETAIL.back}</BackLink>
        }
        overline={detailOverline(detail.experimentName, detail.courseCode)}
        title={row.name}
        meta={
          <>
            <span className="xr-id">{row.institutionStudentId}</span>
            <InactiveTag row={row} asOf={asOf} />
          </>
        }
      />
      <div className="xw-stack">
        <ProgressSection row={row} />
        <AssessmentSection detail={detail} />
        <ResourcesSection detail={detail} />
        <p className="xl-open">
          <Icon name="info" size={16} />
          <span>{STUDENT_DETAIL.feedbackNote}</span>
        </p>
      </div>
    </>
  );
}

/** f5: "No activity since access was given (12 Oct 2026) · 26 days" (`FA-21.inactive`). */
function InactiveTag({
  row,
  asOf,
}: {
  readonly row: StudentDetail['row'];
  readonly asOf: string | null;
}) {
  const days = inactiveDaysOf(row, asOf);
  if (days === null || days < INACTIVE_TAG_DAYS) return null;
  const words =
    row.lastActivityAt !== null
      ? noActivitySince(dayMonthYear(row.lastActivityAt), days)
      : row.accessGivenAt !== null
        ? noActivitySinceAccess(dayMonthYear(row.accessGivenAt), days)
        : null;
  if (words === null) return null;
  return (
    <span className="xa-tag xa-tag--draft">
      <Icon name="clock" />
      {words}
    </span>
  );
}

// ---- Progress by format (f3 … f5) ---------------------------------------------------------------

function ProgressSection({ row }: { readonly row: StudentDetail['row'] }) {
  return (
    <Section title={STUDENT_DETAIL.progressTitle}>
      <div className="xr-section-body">
        <ul className="xl-fl" aria-label={STUDENT_DETAIL.progressLabel}>
          {row.perFormat.map((view) => {
            const code = formatCode(view.format);
            return (
              <li key={view.format}>
                <span className="xl-fl-fmt">
                  <FormatBadge format={code} variant="yours" compact />
                  <strong className="text-ink">{code}</strong>
                </span>
                <span className="xl-fl-state">
                  {view.status === 'completed' ? (
                    <StatusPill tone="ok">
                      {view.completion
                        ? completedOn(dayMonthYear(view.completion.completedAt))
                        : FORMAT_STATUS_WORDS.completed}
                    </StatusPill>
                  ) : view.status === 'in-progress' ? (
                    <StatusPill tone="wait">{FORMAT_STATUS_WORDS['in-progress']}</StatusPill>
                  ) : (
                    <StatusPill tone="off">{FORMAT_STATUS_WORDS['not-started']}</StatusPill>
                  )}
                </span>
                <span className="xl-fl-act" />
              </li>
            );
          })}
        </ul>
        <p className="xl-meta [margin:12px_0_0]">{STUDENT_DETAIL.perFormatOnly}</p>
      </div>
    </Section>
  );
}

// ---- Assessment (f3 waiting, f4 marked not released, f5 not started) ----------------------------

function AssessmentSection({ detail }: { readonly detail: StudentDetail }) {
  const { assessment, attempts, row } = detail;
  let line: string | null = null;
  if (assessment === null) line = stateWords('FA-21.assessment-none');
  else if (row.assessment.kind === 'policy-open') line = stateWords('FA-21.policy-open');
  else if (attempts.length === 0) line = STUDENT_DETAIL.notStarted;
  return (
    <Section title={STUDENT_DETAIL.assessmentTitle}>
      {line !== null || assessment === null ? (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{line}</p>
        </div>
      ) : (
        <ul className="xr-rows">
          {[...attempts]
            .sort((a, b) => a.attemptNumber - b.attemptNumber)
            .map((attempt) => (
              <AttemptRow
                key={attempt.id}
                name={assessment.name || assessment.assessmentId}
                attempt={attempt}
                facts={detail.attemptFacts.find((entry) => entry.attemptId === attempt.id) ?? null}
                studentName={row.name}
              />
            ))}
        </ul>
      )}
    </Section>
  );
}

/** One attempt's row (`FA-21.attempts`): its state, its marks once confirmed and its one action. */
function AttemptRow({
  name,
  attempt,
  facts,
  studentName,
}: {
  readonly name: string;
  readonly attempt: Attempt;
  readonly facts: AttemptFacts | null;
  readonly studentName: string;
}) {
  const title = attemptTitle(name, attempt.attemptNumber, facts?.attemptsAllowed ?? null);
  const href = markSubmissionAddress(attempt.id);
  const score = facts?.score ?? null;

  let tone: 'wait' | 'ok';
  let sub;
  let action = null;
  if (attempt.state === 'in-progress') {
    tone = 'wait';
    sub = (
      <>
        <span className="xr-id">{attempt.id}</span> · {startedWords(dateTime(attempt.startedAt))} ·{' '}
        <StatusPill tone="wait">{stateWords('FA-21.attempt-in-progress')}</StatusPill>
      </>
    );
  } else if (score === null || facts === null) {
    tone = 'wait';
    sub = (
      <>
        <span className="xr-id">{attempt.id}</span>
        {attempt.submittedAt ? (
          <> · {submittedWords(dateTime(attempt.submittedAt))}</>
        ) : null} · <StatusPill tone="wait">{STUDENT_DETAIL.waiting}</StatusPill>
      </>
    );
    action = (
      <Link className="xr-btn xr-btn--primary xr-btn--sm" href={href}>
        {STUDENT_DETAIL.markAnswers}
      </Link>
    );
  } else {
    tone = 'ok';
    const first = firstName(studentName);
    sub = (
      <>
        <StatusPill tone="ok">{STUDENT_DETAIL.marked}</StatusPill> {marksWords(score, facts.outOf)}{' '}
        ·{' '}
        {facts.releasedAt !== null ? (
          releasedLine(first, dateTime(facts.releasedAt))
        ) : (
          <span className="xl-inline">
            <Icon name="readOnly" size={16} />
            {notReleasedLine(first, {
              option: facts.release.option,
              on: facts.release.on === null ? null : dateTime(facts.release.on),
            })}
          </span>
        )}
      </>
    );
    // B4-10 f4: "See submission" opens the assessment's Submissions (B4-06, FA-12).
    action = (
      <Link
        className="xr-btn xr-btn--secondary xr-btn--sm"
        href={assessmentAddress(attempt.assessmentId, 'submissions')}
      >
        {STUDENT_DETAIL.seeSubmission}
      </Link>
    );
  }

  return (
    <li className="xr-row">
      <div className="xr-row-main">
        <span className={`xr-row-icon xr-row-icon--${tone}`}>
          <Icon name="assessments" />
        </span>
        <div className="xr-row-text">
          <span className="xr-row-title">{title}</span>
          <span className="xr-row-sub">{sub}</span>
        </div>
      </div>
      {action}
    </li>
  );
}

// ---- Resources (f3 … f5) ------------------------------------------------------------------------

function ResourcesSection({ detail }: { readonly detail: StudentDetail }) {
  return (
    <Section title={STUDENT_DETAIL.resourcesTitle}>
      <div className="xr-section-body">
        {detail.resources.length > 0 ? (
          <dl className="xl-kv @min-[600px]:[grid-template-columns:minmax(0,1fr)_220px]">
            {detail.resources.map((resource, index) => (
              <ResourceFact
                key={`${index}-${resource.title}`}
                title={resource.title}
                openedAt={resource.openedAt}
              />
            ))}
          </dl>
        ) : (
          <p className="xl-meta m-0">{stateWords('FA-21.no-resources')}</p>
        )}
      </div>
    </Section>
  );
}

function ResourceFact({
  title,
  openedAt,
}: {
  readonly title: string;
  readonly openedAt: string | null;
}) {
  return (
    <>
      <dt className="text-ink [font-weight:400]">{title}</dt>
      <dd className="text-ink-2">
        {openedAt === null ? STUDENT_DETAIL.notOpened : openedWords(dateTime(openedAt))}
      </dd>
    </>
  );
}
