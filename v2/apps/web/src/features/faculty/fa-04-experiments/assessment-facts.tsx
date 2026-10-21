'use client';

import {
  ButtonLink,
  FaAssessmentDue,
  FaAssessmentId,
  FaAssessmentName,
  FaAssessmentNote,
  FaAssessmentSubmissions,
  FaAssessmentWait,
  FaCourseExperimentActions,
  FaPanelActions,
  StatusPill,
} from '@xr/ui/v3';

import { submittedWords } from '@/copy/faculty-overview';
import {
  ASSESSMENT_SUMMARY,
  markWrittenLabel,
  markWrittenWords,
  NO_ASSESSMENT,
} from '@/copy/faculty-experiment';
import { assessmentAddress, createAssessmentAddress } from '@/nav/faculty';

import { assessmentStateView } from '../shared/assessment-state';
import { submittedUnits } from '../shared/progress-model';
import type { AssessmentSummary } from './teaching-view';

/** The status pill of an experiment's assessment (FA-03's column head, FA-05's panel). */
export function AssessmentStatusPill({ summary }: { readonly summary: AssessmentSummary | null }) {
  const status = summary?.status ?? assessmentStateView(null);
  return <StatusPill tone={status.tone}>{status.words}</StatusPill>;
}

/**
 * An experiment's assessment as FA-03's Assessment column (`course`) and FA-05's navy panel
 * (`panel`) draw it (the export's `asmSum`): its name, deadline and days left, the submissions
 * meter, the own written answers waiting with "Mark <n> written answers" (the oldest waiting
 * submission, FA-19), the note and the one assessment action — or, with none yet, the line and
 * "Create assessment" (FA-07 with the experiment chosen).
 */
export function AssessmentFacts({
  variant,
  experimentId,
  summary,
  markHref,
}: {
  readonly variant: 'course' | 'panel';
  readonly experimentId: string;
  readonly summary: AssessmentSummary | null;
  /** Where "Mark" goes: FA-19 of the oldest waiting submission (else FA-18 for it). */
  readonly markHref: string;
}) {
  const panel = variant === 'panel';
  const size = panel ? 'lg' : undefined;
  const Actions = panel ? FaPanelActions : FaCourseExperimentActions;
  if (summary === null) {
    const create = (
      <Actions>
        <ButtonLink variant="primary" size={size} href={createAssessmentAddress({ experimentId })}>
          {ASSESSMENT_SUMMARY.create}
        </ButtonLink>
      </Actions>
    );
    return panel ? (
      <>
        <FaAssessmentId>
          <FaAssessmentName>{NO_ASSESSMENT.title}</FaAssessmentName>
          <FaAssessmentNote>{NO_ASSESSMENT.line}</FaAssessmentNote>
        </FaAssessmentId>
        {create}
      </>
    ) : (
      <>
        <FaAssessmentNote>{NO_ASSESSMENT.courseLine}</FaAssessmentNote>
        {create}
      </>
    );
  }
  const address = assessmentAddress(summary.assessmentId);
  const name = (
    <FaAssessmentName href={panel ? address : undefined}>{summary.name}</FaAssessmentName>
  );
  const due = <FaAssessmentDue left={summary.left ?? undefined}>{summary.due}</FaAssessmentDue>;
  return (
    <>
      {panel ? (
        <FaAssessmentId>
          <AssessmentStatusPill summary={summary} />
          {name}
          {due}
        </FaAssessmentId>
      ) : (
        <>
          {name}
          {due}
        </>
      )}
      {summary.submissions ? (
        <FaAssessmentSubmissions
          units={submittedUnits(summary.submissions.submitted, summary.submissions.reach)}
        >
          {submittedWords(summary.submissions.submitted, summary.submissions.reach)}
        </FaAssessmentSubmissions>
      ) : null}
      {summary.waitingLine ? <FaAssessmentWait>{summary.waitingLine}</FaAssessmentWait> : null}
      {summary.note ? <FaAssessmentNote>{summary.note}</FaAssessmentNote> : null}
      <Actions>
        {summary.waiting > 0 ? (
          <ButtonLink
            variant="primary"
            size={size}
            href={markHref}
            aria-label={markWrittenLabel(summary.waiting, summary.name)}
          >
            {markWrittenWords(summary.waiting)}
          </ButtonLink>
        ) : null}
        <ButtonLink size={size} href={address}>
          {summary.action}
        </ButtonLink>
      </Actions>
    </>
  );
}
