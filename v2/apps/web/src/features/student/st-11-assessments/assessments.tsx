'use client';

import type { MyAssessmentRow } from '@xr/contracts/draft';
import {
  EmptyState,
  Icon,
  Link,
  PageContent,
  PageHeader,
  SegmentedControl,
  StatusPill,
} from '@xr/ui';
import { useEffect, useId, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  assessmentActionLabel,
  assessmentExperimentLine,
  assessmentTabWords,
  STUDENT_ASSESSMENT_TAB_EMPTY,
  STUDENT_ASSESSMENTS_PAGE,
} from '@/copy/student-assessments';
import { useAppNavigation } from '@/nav/navigation';
import {
  STUDENT_ASSESSMENT_TABS,
  STUDENT_ASSESSMENTS_ADDRESS,
  STUDENT_ASSESSMENTS_TITLE,
  type StudentAssessmentTab,
  studentAssessmentsAddress,
  studentAssessmentsPlacement,
} from '@/nav/student-assessments';
import { useMyAssessments } from '@/queries/student-assessments';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, StudentLoading, useRetryFocus } from '../shared/student-states';
import {
  assessmentsTabOf,
  factLine,
  rowAction,
  STATE_TONE,
  stateWordsOf,
  tabOfState,
} from './assessment-rows';

/**
 * ST-11 Assessments — board B4-11 f0 … f6, at `/student/assessments`: "What assessments do I have,
 * what’s due, and how did I do?"
 *
 * - **Read**: `AssessmentService.listMyAssessments` — each Ready assessment of an experiment the
 *   Student has, with its experiment, the course code the Student sees, its size and the latest
 *   attempt (figure-free until the service releases its result, ATT-15). Nothing here scores,
 *   releases or decides: the status, the line and the action follow the service's answer.
 * - **As B4-11 draws it**: the header ("Assessments for the experiments you have"), "Your
 *   assessments" with the state tabs To do · Submitted · Results (`div.xr-seg`, counts per tab;
 *   the tab in the address, `?tab=`, state-copy `ST-11.tabs`), one row per assessment — name,
 *   experiment and code, the state's line, its status and one action: To do "Open" (ST-12),
 *   Attempt in progress "Continue attempt" (ST-13), Waiting for marking / Result not released yet
 *   "View" and Result ready "See result" (ST-14). A tab without rows says so in the board's line;
 *   no assessment at all is f5's empty state.
 * - **States B4-11 does not draw**: loading and failed with "Try again" (`ST-11.loading`,
 *   `ST-11.failed`); release terms other than "after the deadline" (`ST-11.release-*`).
 */
export function StudentAssessments() {
  const navigation = useAppNavigation();
  useShellPage(studentAssessmentsPlacement());

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
  const retried = useRetryFocus(answer?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };

  let body;
  if (read.isError || (answer !== undefined && !answer.ok)) {
    body = <StudentFailed title={stateWords('ST-11.failed')} onRetry={retry} />;
  } else if (answer === undefined) {
    body = <StudentLoading label={stateWords('ST-11.loading')} />;
  } else if (answer.value.length === 0) {
    body = (
      <div className="xr-section">
        <EmptyState icon="assessments" title={STUDENT_ASSESSMENTS_PAGE.noneTitle}>
          {STUDENT_ASSESSMENTS_PAGE.noneLine}
        </EmptyState>
      </div>
    );
  } else {
    body = <AssessmentList rows={answer.value} tab={tab} onTab={choose} />;
  }

  return (
    <PageContent wrap="read">
      <PageHeader
        title={STUDENT_ASSESSMENTS_TITLE}
        meta={<span className="xl-meta">{STUDENT_ASSESSMENTS_PAGE.meta}</span>}
      />
      {body}
    </PageContent>
  );
}

function AssessmentList({
  rows,
  tab,
  onTab,
}: {
  readonly rows: readonly MyAssessmentRow[];
  readonly tab: StudentAssessmentTab;
  readonly onTab: (tab: StudentAssessmentTab) => void;
}) {
  const headingId = useId();
  const shown = rows.filter((row) => tabOfState(row.result.kind) === tab);
  const count = (which: StudentAssessmentTab) =>
    rows.filter((row) => tabOfState(row.result.kind) === which).length;
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {STUDENT_ASSESSMENTS_PAGE.section}
        </h2>
      </div>
      <div className="[padding:0_24px_16px]">
        <SegmentedControl<StudentAssessmentTab>
          label={STUDENT_ASSESSMENTS_PAGE.tabsLabel}
          value={tab}
          onValueChange={onTab}
          options={STUDENT_ASSESSMENT_TABS.map((value) => ({
            value,
            label: assessmentTabWords(value, count(value)),
          }))}
        />
      </div>
      {shown.length > 0 ? (
        <ul className="xr-rows">
          {shown.map((row) => (
            <AssessmentRow key={row.assessment.id} row={row} />
          ))}
        </ul>
      ) : (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{STUDENT_ASSESSMENT_TAB_EMPTY[tab]}</p>
        </div>
      )}
    </section>
  );
}

/** One assessment (f0 … f4): `li.xr-row` with two lines under the name, its status and action. */
function AssessmentRow({ row }: { readonly row: MyAssessmentRow }) {
  const state = row.result.kind;
  const action = rowAction(row.assessment.id, state);
  return (
    <li className="xr-row">
      <div className="xr-row-main">
        <span className="xr-row-icon">
          <Icon name="assessments" />
        </span>
        <div className="xr-row-text">
          <span className="xr-row-title">{row.assessment.name}</span>
          <span className="xr-row-sub">
            {assessmentExperimentLine(row.experimentName, row.courseCode)}
          </span>
          <span className="xr-row-sub">{factLine(row)}</span>
        </div>
      </div>
      <div className="xw-actions flex-none">
        <StatusPill tone={STATE_TONE[state]}>{stateWordsOf(state)}</StatusPill>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={action.href}
          aria-label={assessmentActionLabel(action.words, row.assessment.name)}
        >
          {action.words}
        </Link>
      </div>
    </li>
  );
}
