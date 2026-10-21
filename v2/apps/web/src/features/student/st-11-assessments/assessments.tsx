'use client';

import type { MyAssessmentRow } from '@xr/contracts/draft';
import {
  ButtonLink,
  PageHead,
  StAssessFacts,
  StAssessListCard,
  StAssessWhen,
  StEyebrow,
  StList,
  StListRow,
  StLoading,
  StMessage,
  StRowKicker,
  StRowMeta,
  StRowText,
  StRowTitle,
  StStateRow,
  StatusPill,
  StTabs,
} from '@xr/ui/v3';
import { useEffect, useId, useState } from 'react';

import { ST_STATE_WORDS } from '@/copy/st-shared';
import {
  assessmentActionName,
  assessmentExperimentLine,
  elsewhereWords,
  ST_ASSESSMENTS_V3,
  STUDENT_ASSESSMENT_TAB_EMPTY,
  STUDENT_ASSESSMENT_TAB_WORDS,
  STUDENT_ASSESSMENTS_PAGE,
} from '@/copy/student-assessments';
import { courseLine } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import {
  STUDENT_ASSESSMENT_TABS,
  STUDENT_ASSESSMENTS_ADDRESS,
  STUDENT_ASSESSMENTS_TITLE,
  type StudentAssessmentTab,
  studentAssessmentsAddress,
  studentAssessmentsPlacement,
} from '@/nav/student-assessments';
import { useMyExperiments } from '@/queries/student';
import { useMyAssessments } from '@/queries/student-assessments';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useRetryFocus } from '../shared/student-states';
import { useStudentToday } from '../shared/use-today';
import {
  assessmentsTabOf,
  isPrimaryState,
  rowAction,
  rowLine,
  rowWhen,
  statusOf,
  tabOfState,
} from './assessment-rows';

/**
 * ST-11 Assessments — the owner-approved V3 export (ST-v1 `StudentFinal.dc.html` `is.alist`,
 * `alistVM`), at `/student/assessments`: "What assessments do I have, what’s due, and how did I
 * do?"
 *
 * - **Read**: `AssessmentService.listMyAssessments` — each Ready assessment of an experiment the
 *   Student has, with its experiment, the course code the Student sees, its size and the latest
 *   attempt (figure-free until the service releases its result, ATT-15). Nothing here scores,
 *   releases or decides: the status, the line and the action follow the service's answer. With no
 *   assessment at all, the Student's experiments (`myExperiments`, ST-04's read) name each one
 *   "No assessment set yet".
 * - **As drawn**: the head (date, "Assessments", "Assessments for the experiments you have"), the
 *   state tabs To do · Submitted · Results with their counts (the tab in the address, `?tab=`,
 *   replaced without a history entry; state-copy `ST-11.tabs`), one card named by the tab: loading,
 *   failed + "Try again", a tab without rows (and where the assessment is instead), or the rows —
 *   each led by its key date (due, result after, released), the experiment and code, the name, the
 *   introduction, the status and its line, and one action: To do "Open" (ST-12), Attempt in
 *   progress "Continue attempt" (ST-13), Waiting for marking / Result not released yet "View" and
 *   Result ready "See result" (ST-14). No assessment at all is the compact "No assessments yet".
 */
export function StudentAssessments() {
  const navigation = useAppNavigation();
  useShellPage(studentAssessmentsPlacement());
  const today = useStudentToday();

  // The tab lives here while the page is on show; the address mirrors it (replaced, no history
  // entry). An address that differs from what the page last saw came from outside (Back): it is
  // read again. Any other `tab` is normalised to the bare address (`ST-11.tabs`).
  const addressed = assessmentsTabOf(navigation.search);
  const [tab, setTab] = useState<StudentAssessmentTab>(addressed.tab);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setTab(addressed.tab);
  }
  const { normalise } = addressed;
  useEffect(() => {
    if (normalise) navigation.replace(STUDENT_ASSESSMENTS_ADDRESS);
  }, [normalise, navigation]);
  const choose = (next: StudentAssessmentTab) => {
    setTab(next);
    navigation.replace(studentAssessmentsAddress(next));
  };

  const read = useMyAssessments();
  const answer = read.data;
  const failed = read.isError || (answer !== undefined && !answer.ok);
  const rows = answer?.ok ? answer.value : null;
  const none = rows !== null && rows.length === 0;
  const experiments = useMyExperiments(none);
  const retried = useRetryFocus(answer?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <>
      <PageHead
        date={today?.line}
        title={STUDENT_ASSESSMENTS_TITLE}
        titleFocusTarget
        lead={STUDENT_ASSESSMENTS_PAGE.meta}
      />
      {none ? (
        <NoneYet experiments={experiments.data?.ok ? experiments.data.value.rows : null} />
      ) : (
        <AssessmentList
          rows={rows}
          failed={failed}
          tab={tab}
          today={today?.now ?? null}
          onTab={choose}
          onRetry={retry}
        />
      )}
    </>
  );
}

/**
 * No assessment at all (`AL.noneAtAll`): the compact message, which states the fact for each
 * experiment the Student has and adds no action.
 */
function NoneYet({
  experiments,
}: {
  readonly experiments:
    | readonly {
        readonly course: { readonly codeShown: string | null; readonly name: string };
        readonly experiment: { readonly experimentId: string; readonly name: string };
      }[]
    | null;
}) {
  const titleId = useId();
  return (
    <StMessage
      icon="assessments"
      title={STUDENT_ASSESSMENTS_PAGE.noneTitle}
      titleId={titleId}
      description={
        experiments !== null && experiments.length === 0
          ? ST_ASSESSMENTS_V3.noneLineNoExperiment
          : STUDENT_ASSESSMENTS_PAGE.noneLine
      }
    >
      {experiments !== null && experiments.length > 0 ? (
        <StAssessFacts
          label={ST_ASSESSMENTS_V3.experimentsLabel}
          items={experiments.map((entry) => ({
            key: entry.experiment.experimentId,
            title: entry.experiment.name,
            course: courseLine(entry.course.codeShown, entry.course.name),
            state: ST_ASSESSMENTS_V3.noAssessmentSet,
          }))}
        />
      ) : null}
    </StMessage>
  );
}

function AssessmentList({
  rows,
  failed,
  tab,
  today,
  onTab,
  onRetry,
}: {
  /** `null` while loading or failed. */
  readonly rows: readonly MyAssessmentRow[] | null;
  readonly failed: boolean;
  readonly tab: StudentAssessmentTab;
  readonly today: string | null;
  readonly onTab: (tab: StudentAssessmentTab) => void;
  readonly onRetry: () => void;
}) {
  const titleId = useId();
  const count = (which: StudentAssessmentTab) =>
    rows === null ? undefined : rows.filter((row) => tabOfState(row.result.kind) === which).length;
  const shown = rows?.filter((row) => tabOfState(row.result.kind) === tab) ?? [];

  let body;
  if (failed) {
    body = (
      <StStateRow
        icon="cloudAlert"
        tone="err"
        alert
        title={ST_ASSESSMENTS_V3.failedTitle}
        description={ST_STATE_WORDS.failedLine}
        action={{ label: ST_STATE_WORDS.tryAgain, onClick: onRetry }}
      />
    );
  } else if (rows === null) {
    body = <StLoading label={ST_ASSESSMENTS_V3.loading} />;
  } else if (shown.length === 0) {
    const elsewhere = STUDENT_ASSESSMENT_TABS.filter((which) => (count(which) ?? 0) > 0).map(
      (which) => STUDENT_ASSESSMENT_TAB_WORDS[which],
    );
    body = (
      <StStateRow
        icon="assessments"
        titleAs="p"
        title={STUDENT_ASSESSMENT_TAB_EMPTY[tab]}
        description={elsewhereWords(elsewhere, rows.length)}
      />
    );
  } else {
    body = (
      <StList>
        {shown.map((row) => (
          <AssessmentRow key={row.assessment.id} row={row} today={today} />
        ))}
      </StList>
    );
  }

  return (
    <>
      <StTabs
        label={ST_ASSESSMENTS_V3.tabsLabel}
        onSelect={(key) => onTab(key as StudentAssessmentTab)}
        tabs={STUDENT_ASSESSMENT_TABS.map((which) => ({
          key: which,
          href: studentAssessmentsAddress(which),
          label: STUDENT_ASSESSMENT_TAB_WORDS[which],
          current: which === tab,
          count: failed ? undefined : count(which),
        }))}
      />
      <StAssessListCard title={STUDENT_ASSESSMENT_TAB_WORDS[tab]} titleId={titleId}>
        {body}
      </StAssessListCard>
    </>
  );
}

/**
 * One assessment (`li.sv-li.sv-ali`): its key date, the experiment and code, the name, the
 * introduction, the status with its line, and one action.
 */
function AssessmentRow({
  row,
  today,
}: {
  readonly row: MyAssessmentRow;
  readonly today: string | null;
}) {
  const state = row.result.kind;
  const action = rowAction(row.assessment.id, state);
  const status = statusOf(state);
  const lead = rowWhen(row, today);
  return (
    <StListRow
      variant="assessment"
      lead={
        <>
          <StEyebrow>{lead.kicker}</StEyebrow>
          {lead.when ? <StAssessWhen {...lead.when} /> : null}
        </>
      }
      end={
        <ButtonLink
          variant={isPrimaryState(state) ? 'primary' : 'default'}
          href={action.href}
          aria-label={assessmentActionName(action.words, row.assessment.name)}
        >
          {action.words}
        </ButtonLink>
      }
    >
      <StRowKicker>{assessmentExperimentLine(row.experimentName, row.courseCode)}</StRowKicker>
      <StRowTitle>{row.assessment.name}</StRowTitle>
      {row.assessment.introduction ? (
        <StRowText clamp>{row.assessment.introduction}</StRowText>
      ) : null}
      <StRowMeta>
        <StatusPill tone={status.tone}>{status.words}</StatusPill>
        <span>{rowLine(row)}</span>
      </StRowMeta>
    </StListRow>
  );
}
