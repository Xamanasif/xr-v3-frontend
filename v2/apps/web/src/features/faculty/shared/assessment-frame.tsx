'use client';

import type { AssessmentListRow, AssessmentView, TeachingExperiment } from '@xr/contracts/draft';
import { FailedState, LoadingState, PageContent, RecordHubTabs, StatusPill } from '@xr/ui';
import type { ReactNode } from 'react';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import { stateWords } from '@/copy/state-copy';
import {
  ASSESSMENT_TAB_TITLES,
  assessmentHeadFacts,
  assessmentOverline,
} from '@/copy/faculty-assessment-frame';
import { useAppNavigation } from '@/nav/navigation';
import { type AssessmentTab, assessmentAddress, assessmentTabPlacement } from '@/nav/faculty';
import {
  useAssessmentRecord,
  useFacultyAssessments,
  useTeachingExperiment,
} from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * The assessment record's frame, shared by its four Phase-4A tabs — FA-08 Summary, FA-09
 * Questions (B4-05), FA-10 Settings, FA-11 Preview (B4-06): the dark header
 * (`div.xw-hubhead.xr-dark.xl-hubhead`: "ME ZG523 · Shell-and-Tube Heat Exchanger", the name,
 * the readiness, the ASMT reference, "Due …" and "<n> waiting for marking") and the link tabs
 * (`nav.xr-tabs.xr-tabs--on-white.xw-hubtabs`: Summary · Questions <n> · Settings · Preview).
 * "Submissions" (FA-12) is Phase 4B and is not rendered (DEV-21).
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
  | { readonly kind: 'ready'; readonly view: AssessmentFrameView };

export function useAssessmentPage(
  assessmentId: string,
  tab: Exclude<AssessmentTab, 'submissions'>,
): AssessmentPageState {
  const record = useAssessmentRecord(assessmentId);
  const answer = record.data?.ok ? record.data.value : null;
  const experimentId = answer?.assessment.experimentId ?? null;
  const experiment = useTeachingExperiment(experimentId);
  const list = useFacultyAssessments(answer !== null);

  useShellPage(
    assessmentTabPlacement(
      tab,
      ASSESSMENT_TAB_TITLES[tab],
      answer ? { id: answer.assessment.id, name: answer.assessment.name } : null,
    ),
  );

  if (record.isError) return { kind: 'failed', retry: () => void record.refetch() };
  if (record.data && !record.data.ok) {
    const kind = record.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return { kind: 'not-found' };
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

/** Every state of an assessment page but `ready`: loading, failed + retry, not found. */
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
  }
}

/** The header and the tabs above a tab's own content. */
export function AssessmentFrame({
  view,
  tab,
  children,
}: {
  readonly view: AssessmentFrameView;
  readonly tab: Exclude<AssessmentTab, 'submissions'>;
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
        tabs={(['summary', 'questions', 'settings', 'preview'] as const).map((key) => ({
          href: assessmentAddress(assessment.id, key),
          label: ASSESSMENT_TAB_TITLES[key],
          ...(key === 'questions' ? { count: assessment.questions.length } : {}),
          current: key === tab,
        }))}
      />
      {children}
    </PageContent>
  );
}
