'use client';

import type { AssessmentListRow, AssessmentView, TeachingExperiment } from '@xr/contracts/draft';
import {
  EmptyState,
  FailedState,
  LoadingState,
  PageContent,
  PageHeader,
  RecordHubTabs,
  StatusPill,
} from '@xr/ui';
import type { ReactNode } from 'react';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import { stateWords } from '@/copy/state-copy';
import {
  ASSESSMENT_TAB_TITLES,
  assessmentHeadFacts,
  assessmentOverline,
} from '@/copy/faculty-assessment-frame';
import { SUBMISSIONS_WORDS } from '@/copy/submissions';
import { useAppNavigation } from '@/nav/navigation';
import {
  ASSESSMENT_TABS,
  type AssessmentTab,
  assessmentAddress,
  assessmentTabPlacement,
} from '@/nav/faculty';
import {
  useAssessmentRecord,
  useFacultyAssessments,
  useTeachingExperiment,
} from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * The assessment record's frame, shared by its five tabs — FA-08 Summary, FA-09 Questions
 * (B4-05), FA-10 Settings, FA-11 Preview and, since Phase 4B, FA-12 Submissions (B4-06): the dark
 * header (`div.xw-hubhead.xr-dark.xl-hubhead`: "ME ZG523 · Shell-and-Tube Heat Exchanger", the
 * name, the readiness, the ASMT reference, "Due …" and "<n> waiting for marking") and the link
 * tabs (`nav.xr-tabs.xr-tabs--on-white.xw-hubtabs`: Summary · Questions <n> · Settings · Preview
 * · Submissions <n>; the Submissions figure counts the Students who have submitted,
 * `FA-12.tab-count`).
 *
 * - **Reads**: `AssessmentService.getAssessment` (the record, its readiness, reach, total marks
 *   and pinned questions), `TeachingService.getTeachingExperiment` (the experiment's name and the
 *   platform code Faculty see) and `AssessmentService.listAssessments` (the waiting-for-marking
 *   figure the header draws). A command in the same tab refreshes all three.
 * - **Not found**: an unknown assessment, or one outside the Faculty member's teaching scope, is
 *   the in-shell not-found (no record is confirmed or denied).
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

/** The tabs' names: B4-05 / B4-06 `nav.xw-hubtabs`. */
const TAB_TITLES: Readonly<Record<AssessmentTab, string>> = {
  ...ASSESSMENT_TAB_TITLES,
  submissions: SUBMISSIONS_WORDS.tab,
};

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
      answer ? { id: answer.assessment.id, name: answer.assessment.name } : null,
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
        <PageContent wrap="wide">
          <FailedState title={stateWords('FA-shared.record-failed')} onRetry={state.retry}>
            {stateWords('FA-shared.record-failed.line')}
          </FailedState>
        </PageContent>
      );
    case 'loading':
      return (
        <PageContent wrap="wide">
          <LoadingState label={stateWords('FA-shared.record-loading')} surface="section" />
        </PageContent>
      );
    case 'policy-open':
      // No record words at all: the page is named by its tab.
      return (
        <PageContent wrap="wide">
          <PageHeader
            title={state.tab === 'submissions' ? SUBMISSIONS_WORDS.title : TAB_TITLES[state.tab]}
          />
          <div className="xr-section">
            {state.tab === 'submissions' ? (
              <PolicyOpenSubmissions />
            ) : (
              <EmptyState icon="assessments" title={stateWords('FA-shared.record-policy-open')}>
                {stateWords('FA-shared.record-policy-open.line')}
              </EmptyState>
            )}
          </div>
        </PageContent>
      );
  }
}

/** FA-12: the calm provisional state of a colleague's assessment (OD-B4-17). */
export function PolicyOpenSubmissions() {
  return (
    <EmptyState icon="assessments" title={stateWords('FA-12.policy-open.title')}>
      {stateWords('FA-12.policy-open.line')}
    </EmptyState>
  );
}

/** The header and the tabs above a tab's own content. */
export function AssessmentFrame({
  view,
  tab,
  children,
}: {
  readonly view: AssessmentFrameView;
  readonly tab: AssessmentTab;
  readonly children: ReactNode;
}) {
  const { assessment, readiness } = view.record;
  const readinessWords = READINESS_WORDS[readiness];
  const facts = assessmentHeadFacts({
    deadline: assessment.rules.deadline === null ? null : deadlineWords(assessment.rules.deadline),
    waiting: view.row?.waitingForMarking ?? 0,
  });
  const name = assessment.name || assessment.id;
  return (
    <PageContent wrap="wide">
      <div className="xw-hubhead xr-dark xl-hubhead">
        {view.experiment ? (
          <span className="xr-overline">
            {assessmentOverline(
              view.experiment.experiment.platformCode,
              view.experiment.experiment.name,
            )}
          </span>
        ) : null}
        <h1 className="xr-h1 m-0">{name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusPill tone={readinessWords.tone}>{readinessWords.label}</StatusPill>
          <span className="xr-id text-(--xr-indigo-200)">{assessment.id}</span>
          {facts.length > 0 ? (
            <div className="xa-headfacts">
              {facts.map((fact) => (
                <span key={fact.key}>
                  {fact.before}
                  <strong>{fact.strong}</strong>
                  {fact.after}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <RecordHubTabs
        label={name}
        tabs={ASSESSMENT_TABS.map((key) => ({
          href: assessmentAddress(assessment.id, key),
          label: TAB_TITLES[key],
          ...(key === 'questions' ? { count: assessment.questions.length } : {}),
          ...(key === 'submissions' && view.row ? { count: view.row.submitted } : {}),
          current: key === tab,
        }))}
      />
      {children}
    </PageContent>
  );
}
