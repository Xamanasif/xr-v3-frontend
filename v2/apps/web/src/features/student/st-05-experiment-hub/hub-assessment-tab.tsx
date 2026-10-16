'use client';

import type { MyAssessmentRow } from '@xr/contracts/draft';
import { EmptyState, Link, LoadingState, Row, StatusPill } from '@xr/ui';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  answersSavedLine,
  HUB_ASSESSMENT_TAB,
  hubDueLine,
  hubSubmittedLine,
  releasedLine,
  releaseTermsLine,
} from '@/copy/student-assessments';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { useMyAssessments } from '@/queries/student-assessments';

import { HubFallback, HubTabPage, useHubPage } from '../shared/hub-frame';
import { StudentFailed } from '../shared/student-states';
import { rowAction, STATE_TONE, stateWordsOf } from '../st-11-assessments/assessment-rows';

/**
 * The experiment hub's Assessment tab (ST-05; board B4-11 f7 … f9), at
 * `/student/experiments/[experimentId]/assessment`: the hub's compact header and tab strip
 * (Assessment current), then this experiment's assessment for the Student.
 *
 * - **Reads**: the hub (`getExperimentHub`, through the hub frame — its refusals are ST-19 in place)
 *   and the Student's own assessments (`listMyAssessments`), of which this experiment's: the name,
 *   deadline, size and the latest attempt as the service answers it (figure-free until released).
 * - **As B4-11 draws it**: "Assessment" with one row — To do: "Due … · 4 questions · 16 marks · no
 *   time limit", "To do" and the primary "Open assessment" (ST-12, f7); Waiting for marking:
 *   "Submitted … · your result appears after the deadline", "View" (ST-14, f9). None set yet: the
 *   empty state "Your faculty hasn’t set an assessment for this experiment yet" (f8). The other
 *   states take ST-11's status, line and action (state-copy `ST-05.assessment-tab.states`).
 * - **Undrawn**: loading and failed (`ST-05.assessment-tab.loading`, `.failed`).
 */
export function HubAssessmentTab({ experimentId }: { readonly experimentId: string }) {
  const read = useMyAssessments();
  const state = useHubPage(experimentId, 'assessment');
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  const answer = read.data;
  let body;
  if (read.isError || (answer !== undefined && !answer.ok)) {
    body = (
      <StudentFailed
        title={stateWords('ST-05.assessment-tab.failed')}
        onRetry={() => void read.refetch()}
      />
    );
  } else if (answer === undefined) {
    body = <LoadingState label={stateWords('ST-05.assessment-tab.loading')} surface="section" />;
  } else {
    const mine = answer.value.filter((row) => row.assessment.experimentId === experimentId);
    body =
      mine.length === 0 ? (
        <div className="xr-section">
          <EmptyState icon="assessments" title={HUB_ASSESSMENT_TAB.noneTitle}>
            {HUB_ASSESSMENT_TAB.noneLine}
          </EmptyState>
        </div>
      ) : (
        <AssessmentSection rows={mine} />
      );
  }
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="assessment">
      {body}
    </HubTabPage>
  );
}

function AssessmentSection({ rows }: { readonly rows: readonly MyAssessmentRow[] }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {HUB_ASSESSMENT_TAB.heading}
        </h2>
      </div>
      <ul className="xr-rows">
        {rows.map((row) => (
          <AssessmentRow key={row.assessment.id} row={row} />
        ))}
      </ul>
    </section>
  );
}

/** f7, f9: `li.xr-row` — name, one line, the status and one action (primary while to do). */
function AssessmentRow({ row }: { readonly row: MyAssessmentRow }) {
  const state = row.result.kind;
  const action = rowAction(row.assessment.id, state);
  const primary = state === 'to-do' || state === 'in-progress';
  return (
    <Row icon="assessments" title={row.assessment.name} sub={hubLine(row)}>
      <div className="xw-actions flex-none">
        <StatusPill tone={STATE_TONE[state]}>{stateWordsOf(state)}</StatusPill>
        <Link
          className={primary ? 'xr-btn xr-btn--primary' : 'xr-btn xr-btn--secondary'}
          href={state === 'to-do' ? studentAssessmentAddress(row.assessment.id) : action.href}
        >
          {state === 'to-do' ? HUB_ASSESSMENT_TAB.open : action.words}
        </Link>
      </div>
    </Row>
  );
}

/** The row's line (f7, f9; the other states ST-11's, `ST-05.assessment-tab.states`). */
function hubLine(row: MyAssessmentRow): string {
  const deadline = row.assessment.rules.deadline;
  const latest = row.latest;
  switch (row.result.kind) {
    case 'to-do':
      return hubDueLine(deadline, row.questionCount, row.totalMarks);
    case 'in-progress':
      // The attempt's own version's deadline (Phase 4B review: as ST-13 shows it).
      return answersSavedLine(latest?.pinned.deadline ?? deadline);
    case 'waiting-for-marking':
      return hubSubmittedLine(
        latest?.submittedAt ?? null,
        latest?.release ?? { option: row.assessment.rules.release?.option ?? null, on: deadline },
      );
    case 'not-released-yet':
      return releaseTermsLine(latest?.release ?? { option: row.result.releaseRule, on: deadline });
    case 'released':
      return releasedLine(row.result.releasedAt);
  }
}
