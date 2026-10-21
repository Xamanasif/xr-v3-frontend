'use client';

import type { AssessmentView, StudentDetail } from '@xr/contracts/draft';
import type { Attempt, FormatProgressStatus } from '@xr/domain';
import {
  Breadcrumbs,
  ButtonLink,
  FaAside,
  FaAssessmentDue,
  FaAssessmentId,
  FaAssessmentName,
  FaAssessmentNote,
  FaDetail,
  FaDoneTotal,
  FaId,
  FaMainSheet,
  FaPanel,
  FaPanelActions,
  FaQueueLockedNote,
  FaQuiet,
  FaReleaseNote,
  FaResourceList,
  FaStudentFormatList,
  FaStudentSection,
  MetaSeparator,
  MissingTag,
  PageHead,
  StatusPill,
  TextLink,
  V46Island,
} from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import {
  ASSESSMENT_WORDS,
  asOfWords,
  attemptLine,
  detailOverline,
  dueWords,
  FORMAT_STATUS_WORDS,
  inactiveTag,
  lastActivityLine,
  noActivitySinceAccess,
  notSubmittedLine,
  openedWords,
  startedAttemptLine,
  STUDENT_DETAIL,
} from '@/copy/faculty-students';
import { doneTotalWords, passOutcomeWords, resultReleaseLine } from '@/copy/marking';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { firstName } from '@/copy/student-access';
import {
  assessmentAddress,
  FACULTY_STUDENTS_TITLE,
  facultyStudentPlacement,
  facultyStudentsAddress,
  markSubmissionAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useFacultyStudentDetail } from '@/queries/faculty-assessment-work';
import { useAssessmentRecord, useTeachingExperiment } from '@/queries/teaching';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { INACTIVE_TAG_DAYS, inactiveDaysOf } from '../fa-20-students/student-facts';
import { passMarkOf } from '../fa-19-mark-submission/mark-facts';

type AttemptFacts = StudentDetail['attemptFacts'][number];

const TITLE_ID = 'faculty-student-h1';
const PROGRESS_ID = 'faculty-student-fm';
const RESOURCES_ID = 'faculty-student-res';
const PANEL_ID = 'faculty-student-asm';

const STATUS_TONE: Readonly<Record<FormatProgressStatus, 'ok' | 'info' | 'neutral'>> = {
  completed: 'ok',
  'in-progress': 'info',
  'not-started': 'neutral',
};

/**
 * FA-21 Student detail — the owner-approved Faculty export (V3 Refined B, FA-v1 `Main.dc.html`
 * FA-21, `vmStudent`), at `/faculty/students/[studentId]?experimentId=`: one Student on one
 * experiment the Faculty member teaches.
 *
 * - **Reads**: `TeachingService.getStudentDetail` (the row FA-20 lists, the resources with when
 *   each was first opened, the assessment's attempts with their confirmed marks and pinned release
 *   terms, the experiment's name and course code), `getTeachingExperiment` for the instant the days
 *   since access are counted to (state-copy `FA-20.inactive`), and the assessment
 *   (`getAssessment`: its deadline, the attempts allowed and the pinned version's pass mark,
 *   `FA-21.assessment-facts`; not read for a co-teaching colleague's). No `?experimentId=`, an
 *   unknown Student, one without the experiment or an experiment outside the teaching scope is the
 *   in-shell not-found page (`FA-21.not-found`).
 * - **As the export draws it**: the breadcrumb “Students › <Student>”, the experiment and course
 *   code, the name, the institution's student ID, the last activity and, from 14 days, “Inactive
 *   <n> days”; the sheet — progress by format (“as of …”, per format only), the resources opened or
 *   not, the feedback note; the navy Assessment panel (first on narrow widths) — the latest
 *   submitted attempt's state, the assessment and its deadline, “Attempt 1 of 2 · submitted …”, the
 *   total and pass outcome once marked, when the Student sees the result, “Mark their answers” or
 *   “View marks” (FA-19), “Open the assessment” (FA-08). No attempt is named by its id.
 * - No release button (results follow the assessment's own setting), no score before marks are
 *   confirmed, no messaging (T-34), no format feedback (T-25).
 * - **States the export does not draw**: loading, failed + “Try again” (the application's own
 *   look), an attempt in progress, a co-teaching colleague's assessment (the existing refusal
 *   words) (`FA-21.*`).
 */
export function FacultyStudentDetail({ studentId }: { readonly studentId: string }) {
  const navigation = useAppNavigation();
  const experimentId = new URLSearchParams(navigation.search).get('experimentId');
  const read = useFacultyStudentDetail(studentId, experimentId);
  const teaching = useTeachingExperiment(experimentId);
  const view = read.data?.ok ? read.data.value : null;
  const withheld = view?.row.assessment.kind === 'policy-open';
  const record = useAssessmentRecord(
    view?.assessment?.assessmentId ?? null,
    view !== null && !withheld,
  );
  useShellPage(facultyStudentPlacement(view ? view.row.name : null));
  if (experimentId === null || experimentId === '') return navigation.notFound();
  const asOf = teaching.data?.ok ? teaching.data.value.asOf : null;
  const guard = (
    <RecordGuard
      read={read}
      loadingLabel={stateWords('FA-21.loading')}
      failed={{ title: stateWords('FA-21.failed'), line: stateWords('FA-21.failed.line') }}
    >
      {(detail) => (
        // A Student the experiment was never given to is answered not-found by the service
        // (the in-shell not-found page, `FA-21.not-found`); after a withdrawal the Faculty
        // member still reads their work (WP-0.14 B-withdraw).
        <DetailContent
          detail={detail}
          experimentId={experimentId}
          asOf={asOf}
          record={record.data?.ok ? record.data.value : null}
        />
      )}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their look (FA-v1 draws none).
  return read.data?.ok ? guard : <V46Island>{guard}</V46Island>;
}

function DetailContent({
  detail,
  experimentId,
  asOf,
  record,
}: {
  readonly detail: StudentDetail;
  readonly experimentId: string;
  readonly asOf: string | null;
  readonly record: AssessmentView | null;
}) {
  const { row } = detail;
  const days = inactiveDaysOf(row, asOf);
  const lastLine =
    row.lastActivityAt !== null
      ? lastActivityLine(dayMonthYear(row.lastActivityAt))
      : row.accessGivenAt !== null
        ? noActivitySinceAccess(dayMonthYear(row.accessGivenAt))
        : null;
  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: FACULTY_STUDENTS_TITLE, href: facultyStudentsAddress(experimentId) }]}
            current={row.name}
          />
        }
        variant="record"
        eyebrow={detailOverline(detail.experimentName, detail.courseCode)}
        title={row.name}
        titleId={TITLE_ID}
        titleFocusTarget
        meta={
          <>
            <FaId>{row.institutionStudentId}</FaId>
            {lastLine ? (
              <>
                <MetaSeparator />
                <span>{lastLine}</span>
              </>
            ) : null}
            {days !== null && days >= INACTIVE_TAG_DAYS ? (
              <MissingTag icon="clock">{inactiveTag(days)}</MissingTag>
            ) : null}
          </>
        }
      />
      <FaDetail asideFirst>
        <FaMainSheet>
          <FaStudentSection
            titleId={PROGRESS_ID}
            title={STUDENT_DETAIL.progressTitle}
            aside={asOf ? asOfWords(dayMonthYear(asOf)) : undefined}
            note={STUDENT_DETAIL.perFormatOnly}
          >
            <FaStudentFormatList
              label={STUDENT_DETAIL.progressLabel}
              formats={row.perFormat.map((view) => ({
                key: view.format,
                code: formatCode(view.format),
                status: (
                  <StatusPill tone={STATUS_TONE[view.status]}>
                    {FORMAT_STATUS_WORDS[view.status]}
                  </StatusPill>
                ),
                date:
                  view.status === 'completed' && view.completion
                    ? dayMonthYear(view.completion.completedAt)
                    : undefined,
              }))}
            />
          </FaStudentSection>
          <FaStudentSection
            titleId={RESOURCES_ID}
            title={STUDENT_DETAIL.resourcesTitle}
            note={STUDENT_DETAIL.feedbackNote}
          >
            {detail.resources.length > 0 ? (
              <FaResourceList
                resources={detail.resources.map((resource, index) => ({
                  key: `${index}-${resource.title}`,
                  title: resource.title,
                  status: {
                    words:
                      resource.openedAt === null
                        ? STUDENT_DETAIL.notOpened
                        : openedWords(dateTime(resource.openedAt)),
                    opened: resource.openedAt !== null,
                  },
                }))}
              />
            ) : (
              <FaQuiet>{stateWords('FA-21.no-resources')}</FaQuiet>
            )}
          </FaStudentSection>
        </FaMainSheet>
        <FaAside labelledBy={PANEL_ID}>
          <FaPanel title={STUDENT_DETAIL.assessmentTitle} titleId={PANEL_ID} assessment>
            <AssessmentPanel detail={detail} record={record} />
          </FaPanel>
        </FaAside>
      </FaDetail>
    </>
  );
}

/**
 * The attempt the panel shows (state-copy `FA-21.latest-attempt`): the latest submitted one, else
 * the latest started one.
 */
function shownAttempt(attempts: readonly Attempt[]): Attempt | null {
  const ordered = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  return ordered.filter((attempt) => attempt.submittedAt !== null).at(-1) ?? ordered.at(-1) ?? null;
}

/** The navy Assessment panel's body (`div.rk-panel-body.fa-apanel`). */
function AssessmentPanel({
  detail,
  record,
}: {
  readonly detail: StudentDetail;
  readonly record: AssessmentView | null;
}) {
  const { assessment, row } = detail;
  const first = firstName(row.name);
  const openAssessment = assessment ? (
    <TextLink href={assessmentAddress(assessment.assessmentId)}>
      {STUDENT_DETAIL.openAssessment}
    </TextLink>
  ) : null;

  // A co-teaching colleague's assessment: the existing refusal words, no state or figure.
  if (row.assessment.kind === 'policy-open') {
    return (
      <>
        <FaQueueLockedNote>{stateWords('FA-21.policy-open')}</FaQueueLockedNote>
        {openAssessment}
      </>
    );
  }
  if (assessment === null) {
    return (
      <>
        <FaAssessmentId>
          <StatusPill tone="neutral">{ASSESSMENT_WORDS.none}</StatusPill>
        </FaAssessmentId>
        <FaAssessmentNote>{STUDENT_DETAIL.noAssessmentLine}</FaAssessmentNote>
      </>
    );
  }

  const rules = record?.assessment.rules ?? null;
  const due =
    rules === null
      ? null
      : rules.deadline
        ? dueWords(dateTime(rules.deadline))
        : STUDENT_DETAIL.noDeadline;
  const name = (
    <>
      <FaAssessmentName>{assessmentName(assessment.name)}</FaAssessmentName>
      {due ? <FaAssessmentDue>{due}</FaAssessmentDue> : null}
    </>
  );
  const draft = record !== null && record.readiness !== 'ready';
  const attempt = draft ? null : shownAttempt(detail.attempts);
  const facts: AttemptFacts | null = attempt
    ? (detail.attemptFacts.find((entry) => entry.attemptId === attempt.id) ?? null)
    : null;

  let pill: ReactNode;
  let line: ReactNode = null;
  let after: ReactNode = null;
  let action: ReactNode = null;
  if (draft) {
    pill = <StatusPill tone="neutral">{ASSESSMENT_WORDS.draft}</StatusPill>;
    line = STUDENT_DETAIL.draftLine;
  } else if (attempt === null) {
    pill = <StatusPill tone="neutral">{ASSESSMENT_WORDS.notStarted}</StatusPill>;
    line = rules === null ? null : notSubmittedLine(rules.attemptsAllowed);
  } else if (attempt.submittedAt === null) {
    pill = <StatusPill tone="info">{stateWords('FA-21.attempt-in-progress')}</StatusPill>;
    line = startedAttemptLine(
      attempt.attemptNumber,
      facts?.attemptsAllowed ?? null,
      dateTime(attempt.startedAt),
    );
  } else {
    line = attemptLine(
      attempt.attemptNumber,
      facts?.attemptsAllowed ?? null,
      dateTime(attempt.submittedAt),
    );
    const score = facts?.score ?? null;
    if (score === null || facts === null) {
      pill = <StatusPill tone="warn">{ASSESSMENT_WORDS.waiting}</StatusPill>;
      action = (
        <ButtonLink variant="primary" size="lg" href={markSubmissionAddress(attempt.id)}>
          {STUDENT_DETAIL.markAnswers}
        </ButtonLink>
      );
    } else {
      pill = <StatusPill tone="ok">{ASSESSMENT_WORDS.marked}</StatusPill>;
      const passMark = record
        ? passMarkOf(record.assessment, attempt.assessmentVersion, facts.outOf)
        : null;
      const released = facts.releasedAt !== null;
      after = (
        <>
          <FaDoneTotal
            total={doneTotalWords(score, facts.outOf)}
            outcome={passOutcomeWords(passMark === null ? null : score >= passMark, passMark)}
          />
          <FaReleaseNote released={released}>
            {resultReleaseLine(
              first,
              {
                option: facts.release.option,
                on: facts.release.on === null ? null : dateTime(facts.release.on),
              },
              released,
              attempt.marking.confirmed ? dateTime(attempt.marking.confirmed.at) : null,
            )}
          </FaReleaseNote>
        </>
      );
      action = (
        <ButtonLink size="lg" href={markSubmissionAddress(attempt.id)}>
          {STUDENT_DETAIL.viewMarks}
        </ButtonLink>
      );
    }
  }

  return (
    <>
      <FaAssessmentId>
        {pill}
        {name}
      </FaAssessmentId>
      {line ? <FaAssessmentNote>{line}</FaAssessmentNote> : null}
      {after}
      {action ? <FaPanelActions>{action}</FaPanelActions> : null}
      {openAssessment}
    </>
  );
}
