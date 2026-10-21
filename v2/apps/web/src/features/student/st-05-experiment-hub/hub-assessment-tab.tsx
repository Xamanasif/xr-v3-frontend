'use client';

import type { MyAssessmentRow } from '@xr/contracts/draft';
import { StAssessmentCard, StLoading, StMessage } from '@xr/ui/v3';
import { useId } from 'react';

import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { HUB_ASSESSMENT_TAB, ST_HUB_ASSESSMENT_V3 } from '@/copy/student-assessments';
import { useMyAssessments } from '@/queries/student-assessments';

import { HubFallback, HubTabPage, useHubPage } from '../shared/hub-frame';
import { useStudentToday } from '../shared/use-today';
import {
  hubAction,
  hubFacts,
  hubStateLine,
  hubWhen,
  statusOf,
} from '../st-11-assessments/assessment-rows';

/**
 * The experiment hub's Assessment tab — the owner-approved V3 export (ST-v1 `StudentFinal.dc.html`
 * `HB.isAssessment`, `asmtTabVM`), at `/student/experiments/[experimentId]/assessment`: the hub's
 * header and section tabs (the hub's, through `HubTabPage`), then this experiment's assessment.
 *
 * - **Reads**: the hub (`getExperimentHub`, through the hub frame — its refusals are ST-19 in place)
 *   and the Student's own assessments (`listMyAssessments`), of which this experiment's: the name,
 *   introduction, deadline, size and rules, and the latest attempt as the service answers it
 *   (figure-free until released).
 * - **As drawn**: one card per assessment (`sv-atab`) — the deadline as a date block ("Due" while
 *   it can be answered, then "Deadline"), "Assessment", the name, what it covers, the status and
 *   its words, the key facts ("4 questions · 16 marks · pass mark 50% · 2 attempts · no time
 *   limit") and one action: "Open assessment" (ST-12) or ST-11's action for the state; the gold
 *   primary while it can be answered. None set yet: the compact message "Your faculty hasn’t set
 *   an assessment for this experiment yet".
 * - **Undrawn**: loading and failed (`ST-05.assessment-tab.loading`, `.failed`) in the export's
 *   loading block and compact failure.
 */
export function HubAssessmentTab({ experimentId }: { readonly experimentId: string }) {
  const read = useMyAssessments();
  const state = useHubPage(experimentId, 'assessment');
  const today = useStudentToday();
  const noneId = useId();
  const failedId = useId();
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  const answer = read.data;
  let body;
  if (read.isError || (answer !== undefined && !answer.ok)) {
    body = (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-05.assessment-tab.failed')}
        titleId={failedId}
        description={ST_STATE_WORDS.failedLine}
        retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: () => void read.refetch() }}
      />
    );
  } else if (answer === undefined) {
    body = (
      <StLoading
        variant="card"
        label={stateWords('ST-05.assessment-tab.loading')}
        name={HUB_ASSESSMENT_TAB.heading}
      />
    );
  } else {
    const mine = answer.value.filter((row) => row.assessment.experimentId === experimentId);
    body =
      mine.length === 0 ? (
        <StMessage
          icon="assessments"
          title={HUB_ASSESSMENT_TAB.noneTitle}
          titleId={noneId}
          description={HUB_ASSESSMENT_TAB.noneLine}
        />
      ) : (
        mine.map((row) => (
          <AssessmentCard key={row.assessment.id} row={row} today={today?.now ?? null} />
        ))
      );
  }
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="assessment">
      {body}
    </HubTabPage>
  );
}

/** One assessment of this experiment (`section.sv-card.sv-atab`). */
function AssessmentCard({
  row,
  today,
}: {
  readonly row: MyAssessmentRow;
  readonly today: string | null;
}) {
  const titleId = useId();
  const when = hubWhen(row, today);
  return (
    <StAssessmentCard
      titleId={titleId}
      whenKicker={when.kicker}
      when={when.when ?? undefined}
      kicker={ST_HUB_ASSESSMENT_V3.kicker}
      name={row.assessment.name}
      description={row.assessment.introduction}
      status={statusOf(row.result.kind)}
      state={hubStateLine(row)}
      facts={hubFacts(row)}
      action={hubAction(row)}
    />
  );
}
