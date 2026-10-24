'use client';

import type { AssessmentListRow, AssessmentView, TeachingExperiment } from '@xr/contracts/draft';
import type { ActorRef } from '@xr/domain';
import { FailedState, LoadingState, PageContent } from '@xr/ui';
import {
  Breadcrumbs,
  FaFigure,
  FaFigures,
  FaIdentityBand,
  FaInlineMessage,
  FaMessageCard,
  FaRecordMetaText,
  FaRecordTabs,
  FaRecordWaitLink,
  type FaUnitState,
  PageHead,
  StatusPill,
  V46Island,
} from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import { weekdayDate } from '@/copy/dates';
import { assessmentName, faDaysLeftWords } from '@/copy/fa-shared';
import {
  ASSESSMENT_TAB_TITLES,
  createdByWords,
  dueWords,
  questionsMarksKey,
  RECORD_FIGURES,
  recordTabsLabel,
  submittedOfWords,
  versionWords,
  waitingWords,
} from '@/copy/faculty-assessment-frame';
import { stateWords } from '@/copy/state-copy';
import { SUBMISSIONS_WORDS } from '@/copy/submissions';
import { useAppNavigation } from '@/nav/navigation';
import {
  ASSESSMENT_TABS,
  type AssessmentTab,
  ASSESSMENTS_ADDRESS,
  ASSESSMENTS_TITLE,
  assessmentAddress,
  assessmentTabPlacement,
  markingQueueAddress,
} from '@/nav/faculty';
import { useSession } from '@/queries/session';
import {
  useAssessmentRecord,
  useFacultyAssessments,
  useTeachingExperiment,
} from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * The assessment record's frame in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-08…FA-12
 * Assessment record"), shared by its five tabs — FA-08 Summary, FA-09 Questions, FA-10 Settings,
 * FA-11 Preview and FA-12 Submissions: the crumbs "Assessments › <name>", the record band
 * (`header.fa-cid.fa-rec`: the course code and the experiment, the name, the readiness · "Version
 * 2" · "2 waiting for marking" (to Marking), and the figures — the deadline with the days left,
 * the students who submitted with their unit meter, the questions with the marks) and the record
 * tabs (`div.fa-recordtabs` > `nav.rk-tabs.fa-tabs`: Summary · Questions <n> · Settings · Preview ·
 * Submissions <n>; the Submissions figure counts the Students who have submitted, `FA-12.tab-count`,
 * and is left out while none has). The assessment is named by its name (or "Untitled draft") —
 * never its internal reference, in the crumbs, the band, the tabs' name or the tab title.
 *
 * - **Reads**: `AssessmentService.getAssessment` (the record, its readiness, reach, total marks
 *   and pinned questions), `TeachingService.getTeachingExperiment` (the experiment's name and the
 *   platform code Faculty see) and `AssessmentService.listAssessments` (the submitted and
 *   waiting-for-marking figures). A command in the same tab refreshes all three.
 * - **Not found**: an unknown assessment, or one outside the Faculty member's teaching scope, is
 *   the in-shell not-found (no record is confirmed or denied). A co-teaching colleague's record
 *   (policy-open, OD-B4-17) is held back calmly on every tab with the existing words, in the role's
 *   refusal card. Loading and a failed read keep the application's existing page states (the
 *   export draws none for the record).
 */
export interface AssessmentFrameView {
  readonly record: AssessmentView;
  readonly experiment: TeachingExperiment | null;
  readonly row: AssessmentListRow | null;
}

export type AssessmentPageState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'not-found' }
  /** A co-teaching colleague's assessment (OD-B4-17), held back calmly on every tab. */
  | { readonly kind: 'policy-open'; readonly tab: AssessmentTab }
  | { readonly kind: 'ready'; readonly view: AssessmentFrameView };

/** The tabs' names. */
export const TAB_TITLES: Readonly<Record<AssessmentTab, string>> = {
  ...ASSESSMENT_TAB_TITLES,
  submissions: SUBMISSIONS_WORDS.tab,
};

/** The tab's heading id: every tab's heading is the focus target the export names `fa-tabh`. */
export const TAB_HEADING_ID = 'assessment-tab-heading';

/** Today on the sample clock: the session's sign-in instant (the shell's top line). */
export function useAssessmentToday(): { readonly instant: string | null; readonly line?: string } {
  const session = useSession();
  return session.status === 'signed-in'
    ? { instant: session.signedInAt, line: weekdayDate(session.signedInAt) }
    : { instant: null };
}

const IST_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Whole calendar days from `today` to `deadline` in Indian time (the zone of every sample date):
 * the deadline's date minus today's date, as the export counts "7 days left".
 */
export function calendarDaysUntil(today: string, deadline: string): number {
  const day = (instant: string) => {
    const [year, month, date] = IST_DAY.format(new Date(instant)).split('-').map(Number);
    return Date.UTC(year!, month! - 1, date!);
  };
  return Math.round((day(deadline) - day(today)) / 86_400_000);
}

export type DeadlineState =
  | { readonly kind: 'none' }
  | { readonly kind: 'date' }
  | { readonly kind: 'passed' }
  | { readonly kind: 'left'; readonly days: number };

/** The deadline as the band and FA-06 show it: the days left while Ready and open, or passed. */
export function deadlineState(
  deadline: string | null,
  ready: boolean,
  today: string | null,
): DeadlineState {
  if (deadline === null) return { kind: 'none' };
  if (!ready || today === null) return { kind: 'date' };
  if (new Date(today).getTime() > new Date(deadline).getTime()) return { kind: 'passed' };
  return { kind: 'left', days: Math.max(0, calendarDaysUntil(today, deadline)) };
}

/** The units of a "submitted of reach" meter: one per student, the submitted first. */
export function submittedUnits(submitted: number, reach: number): FaUnitState[] {
  return Array.from({ length: Math.max(reach, submitted) }, (_, index) =>
    index < submitted ? 'submitted' : 'none',
  );
}

/** "you" is not a name: the creator's name when it is someone else, else `null`. */
export function otherActor(actor: ActorRef, viewer: string | null): string | null {
  switch (actor.kind) {
    case 'person':
      return actor.personId === viewer ? null : actor.displayName;
    case 'requester':
      return actor.name;
    case 'system':
      return null;
  }
}

export function useAssessmentPage(assessmentId: string, tab: AssessmentTab): AssessmentPageState {
  const record = useAssessmentRecord(assessmentId);
  const answer = record.data?.ok ? record.data.value : null;
  const experimentId = answer?.assessment.experimentId ?? null;
  const experiment = useTeachingExperiment(experimentId);
  const list = useFacultyAssessments(answer !== null);

  useShellPage(
    assessmentTabPlacement(
      tab,
      TAB_TITLES[tab],
      answer ? { id: answer.assessment.id, name: assessmentName(answer.assessment.name) } : null,
    ),
  );

  if (record.isError) return { kind: 'failed', retry: () => void record.refetch() };
  if (record.data && !record.data.ok) {
    const kind = record.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return { kind: 'not-found' };
    // Phase 4B: a colleague's assessment is held back calmly on every tab (OD-B4-17).
    if (kind === 'policy-open') return { kind: 'policy-open', tab };
    return { kind: 'failed', retry: () => void record.refetch() };
  }
  if (!answer || experiment.isPending || list.isPending) return { kind: 'loading' };
  return {
    kind: 'ready',
    view: {
      record: answer,
      experiment: experiment.data?.ok ? experiment.data.value : null,
      row: list.data?.ok
        ? (list.data.value.find((row) => row.assessment.id === answer.assessment.id) ?? null)
        : null,
    },
  };
}

/** Every state of an assessment page but `ready`: loading, failed + retry, not found, held back. */
export function AssessmentFallback({
  state,
}: {
  readonly state: Exclude<AssessmentPageState, { kind: 'ready' }>;
}) {
  const navigation = useAppNavigation();
  switch (state.kind) {
    case 'not-found':
      return navigation.notFound();
    case 'failed':
      return (
        <V46Island>
          <PageContent wrap="wide">
            <FailedState title={stateWords('FA-shared.record-failed')} onRetry={state.retry}>
              {stateWords('FA-shared.record-failed.line')}
            </FailedState>
          </PageContent>
        </V46Island>
      );
    case 'loading':
      return (
        <V46Island>
          <PageContent wrap="wide">
            <LoadingState label={stateWords('FA-shared.record-loading')} surface="section" />
          </PageContent>
        </V46Island>
      );
    case 'policy-open':
      // No record words at all: the page is named by its tab; the existing refusal words.
      return (
        <>
          <PageHead
            title={state.tab === 'submissions' ? SUBMISSIONS_WORDS.title : TAB_TITLES[state.tab]}
            titleFocusTarget
            breadcrumbs={
              <Breadcrumbs
                levels={[{ label: ASSESSMENTS_TITLE, href: ASSESSMENTS_ADDRESS }]}
                current={TAB_TITLES[state.tab]}
              />
            }
          />
          {state.tab === 'submissions' ? (
            <FaMessageCard
              icon="clipboardCheck"
              lock
              title={stateWords('FA-12.policy-open.title')}
              titleId="assessment-held-back"
            >
              {stateWords('FA-12.policy-open.line')}
            </FaMessageCard>
          ) : (
            <FaMessageCard
              icon="clipboardCheck"
              lock
              title={stateWords('FA-shared.record-policy-open')}
              titleId="assessment-held-back"
            >
              {stateWords('FA-shared.record-policy-open.line')}
            </FaMessageCard>
          )}
        </>
      );
  }
}

/** FA-12: the calm provisional state of a colleague's submissions (OD-B4-17), inside the tab. */
export function PolicyOpenSubmissions() {
  return (
    <FaInlineMessage
      icon="clipboardCheck"
      lock
      title={stateWords('FA-12.policy-open.title')}
      titleId={TAB_HEADING_ID}
      focusable
    >
      {stateWords('FA-12.policy-open.line')}
    </FaInlineMessage>
  );
}

/** The crumbs, the record band and the tabs above a tab's own content. */
export function AssessmentFrame({
  view,
  tab,
  children,
}: {
  readonly view: AssessmentFrameView;
  readonly tab: AssessmentTab;
  readonly children: ReactNode;
}) {
  const today = useAssessmentToday();
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const { assessment, readiness, reach, totalMarks } = view.record;
  const readinessWords = READINESS_WORDS[readiness];
  const ready = readiness === 'ready';
  const name = assessmentName(assessment.name);
  // Every own submission waiting: with a written answer, or choice-only waiting for confirmation.
  const waiting = (view.row?.waitingForMarking ?? 0) + (view.row?.waitingToConfirm ?? 0);
  const submitted = view.row?.submitted ?? 0;
  const questions = assessment.questions.length;
  const creator = otherActor(assessment.createdBy, viewer);
  const experiment = view.experiment?.experiment ?? null;

  const deadline = assessment.rules.deadline;
  const due = deadlineState(deadline, ready, today.instant);
  const deadlineFigure =
    due.kind === 'none' ? (
      <FaFigure term={RECORD_FIGURES.deadline} value={RECORD_FIGURES.notSetYet} tone="quiet" />
    ) : due.kind === 'date' ? (
      <FaFigure term={RECORD_FIGURES.deadline} value={deadlineWords(deadline!)} tone="plain" />
    ) : due.kind === 'passed' ? (
      <FaFigure
        term={deadlineWords(deadline!)}
        value={RECORD_FIGURES.deadlinePassed}
        tone="plain"
      />
    ) : (
      <FaFigure
        term={dueWords(deadlineWords(deadline!))}
        value={faDaysLeftWords(due.days)}
        tone="warn"
      />
    );

  return (
    <>
      <Breadcrumbs
        levels={[{ label: ASSESSMENTS_TITLE, href: ASSESSMENTS_ADDRESS }]}
        current={name}
      />
      <FaIdentityBand
        date={today.line}
        code={experiment?.platformCode ?? ''}
        kicker={experiment?.name ?? stateWords('FA-08.experiment-unknown')}
        title={name}
        meta={[
          <StatusPill key="status" tone={ready ? 'ok' : 'neutral'}>
            {readinessWords.label}
          </StatusPill>,
          ...(assessment.version > 1
            ? [
                <FaRecordMetaText key="version">
                  {versionWords(assessment.version)}
                </FaRecordMetaText>,
              ]
            : []),
          ...(creator
            ? [<FaRecordMetaText key="by">{createdByWords(creator)}</FaRecordMetaText>]
            : []),
          ...(waiting > 0
            ? [
                <FaRecordWaitLink
                  key="waiting"
                  href={markingQueueAddress({ assessmentId: assessment.id })}
                >
                  {waitingWords(waiting)}
                </FaRecordWaitLink>,
              ]
            : []),
        ]}
        figures={
          <FaFigures>
            {deadlineFigure}
            {ready && creator === null ? (
              reach > 0 ? (
                <FaFigure
                  term={RECORD_FIGURES.studentsSubmitted}
                  value={submittedOfWords(submitted, reach)}
                  units={submittedUnits(submitted, reach)}
                  tone="plain"
                />
              ) : (
                <FaFigure
                  term={RECORD_FIGURES.studentsWithAccess}
                  value={RECORD_FIGURES.noneYet}
                  tone="quiet"
                />
              )
            ) : null}
            {questions > 0 ? (
              <FaFigure
                term={questionsMarksKey(totalMarks)}
                value={String(questions)}
                tone="plain"
              />
            ) : (
              <FaFigure
                term={RECORD_FIGURES.questions}
                value={RECORD_FIGURES.noneYet}
                tone="quiet"
              />
            )}
          </FaFigures>
        }
      />
      <FaRecordTabs
        label={recordTabsLabel(name)}
        tabs={ASSESSMENT_TABS.map((key) => ({
          key,
          href: assessmentAddress(assessment.id, key),
          label: TAB_TITLES[key],
          ...(key === 'questions' ? { count: questions } : {}),
          ...(key === 'submissions' && submitted > 0 ? { count: submitted } : {}),
          current: key === tab,
        }))}
      >
        {children}
      </FaRecordTabs>
    </>
  );
}

/** A tab's own loading line, under the frame (the existing page loading, in the record's place). */
export function TabLoading({ label }: { readonly label: string }) {
  return (
    <V46Island>
      <LoadingState label={label} surface="section" />
    </V46Island>
  );
}

/** A tab's own failed read, under the frame (the existing page state). */
export function TabFailed({
  title,
  line,
  onRetry,
}: {
  readonly title: string;
  readonly line: string;
  readonly onRetry: () => void;
}) {
  return (
    <V46Island>
      <FailedState title={title} onRetry={onRetry}>
        {line}
      </FailedState>
    </V46Island>
  );
}
