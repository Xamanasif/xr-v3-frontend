'use client';

import type { ContentAccessRow, MyOverview } from '@xr/contracts/draft';
import type { AccessPlanStatus, InstitutionStatus } from '@xr/domain';
import {
  Button,
  ButtonLink,
  IaAttention,
  IaAttentionCalm,
  IaAttentionLead,
  IaAttentionList,
  IaFormatList,
  IaOverviewGrid,
  IaOverviewHead,
  IaPlanCard,
  IaPlanCardExperiment,
  IaTermBar,
  ListState,
  LoadingRows,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useRef } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  CONTENT_ACCESS_WORDS,
  courseWords,
  endedStatusLine,
  endsStatusLine,
  formatsOfLabel,
  INSTITUTE_ACTIONS,
  itemsWords,
  OVERVIEW_WORDS,
  pausedStatusLine,
  PLAN_WORDS,
} from '@/copy/institute-home';
import { planTermWords } from '@/copy/institutions';
import { REQUEST_ACTIONS } from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import {
  accessPlanAddress,
  addPersonAddress,
  CONTENT_ACCESS_ADDRESS,
  destinationPlacement,
  giveAccessAddress,
  OVERVIEW_TITLE,
} from '@/nav/institute';
import { instituteRequestAddress } from '@/nav/institute-requests';
import { useDeviceRequests } from '@/queries/devices';
import { useContentAccess, useInstituteOverview } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatFactsOf, pausedAtOf, termBarOf } from '../ia-02-content-access/plan-facts';
import { InstitutionPill, PlanPill } from '../ia-02-content-access/plan-pills';
import { usePlanToday } from '../ia-02-content-access/plan-today';
import { newestFirst, studentOf } from '../shared/transfer-view';
import { useStudentNames } from '../shared/use-student-names';
import { attentionView, headerActions, type WaitingDeviceRequests } from './overview-view';

const TITLE_ID = 'ia-h1';
const ATTENTION_ID = 'ia-att-h';
const PLAN_ID = 'ia-plan-h';
const NO_CONTENT_ID = 'ia-nc-t';

/**
 * IA-01 Overview — the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/
 * IA-v1, `Main.dc.html` IA-01, `attention` and `vm01core`), at `/institute`: the Institute Admin's
 * starting page.
 *
 * - **Reads**: `InstitutionService.getMyOverview` — the institution, its status, the plan the
 *   status line names with the days left in its term and up to six "Needs your attention" facts
 *   the service derives from the records on every read (PC-38); `OperationsService.
 *   listDeviceRequests` (with the students' names) for the device requests waiting on the
 *   Institute Admin; and `InstitutionService.listContentAccess` — the one extra aggregate read —
 *   for the plan card's experiments, their courses, the institution's codes and formats (state-copy
 *   `IA-01.plan-card`). Licences are shown as approved, never counted (T-06 / D7).
 * - **As the export draws it**: the compact head (the institution, its access status and the plan
 *   line, "Add students" and the one primary "Give students access"), "Needs your attention" —
 *   the lead band (ending soon, ended, paused) and the counted items, each with one quiet action —
 *   or the calm state, and the access-plan card on the plan tint (term bar, licences, term, each
 *   experiment with its course, code and four format badges in words, View plan, Open Content
 *   access). Before access is active: "No content yet" with View request status. What no read
 *   holds is left out (state-copy `IA-01.not-held`): the problem-report and written-answer items
 *   and the "Renewal requested" lead.
 * - **Loading and failed**: the application's page loading and its failed state with Try again
 *   (state-copy `IA-01.loading`, `IA-01.failed`); Try again moves focus to the title.
 * - No internal reference (ACC-, REQ-) in its words or names (state-copy `IA-plan.no-reference`).
 * - Nothing here changes a record: every action opens the page where it is handled.
 */
export function InstituteOverview() {
  useShellPage(destinationPlacement('IA-01'));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const today = usePlanToday();
  const overview = useInstituteOverview();
  const content = useContentAccess();
  const devices = useWaitingDeviceRequests();
  const answer = overview.data?.ok ? overview.data.value : null;
  const rows = content.data?.ok ? content.data.value : null;
  const failed =
    overview.isError ||
    content.isError ||
    (overview.data !== undefined && !overview.data.ok) ||
    (content.data !== undefined && !content.data.ok);

  // Try again moves focus to the title, and keeps it there once the page has loaded (the loaded
  // head is another H1, named by the institution).
  const loaded = !failed && answer !== null && rows !== null && !devices.pending;
  const refocus = useRef(false);
  useEffect(() => {
    if (!loaded || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus();
  }, [loaded]);

  if (!loaded || answer === null || rows === null) {
    const retry = () => {
      if (overview.isError || (overview.data && !overview.data.ok)) void overview.refetch();
      if (content.isError || (content.data && !content.data.ok)) void content.refetch();
      refocus.current = true;
      titleRef.current?.focus();
    };
    return (
      <>
        <PageHead
          title={OVERVIEW_TITLE}
          titleId={TITLE_ID}
          titleRef={titleRef}
          titleFocusTarget
          date={today.line}
        />
        {failed ? (
          <ListState
            kind="failed"
            titleAs="h2"
            title={stateWords('IA-01.failed')}
            action={<Button onClick={retry}>{CONTENT_ACCESS_WORDS.tryAgain}</Button>}
          >
            {CONTENT_ACCESS_WORDS.failedLine}
          </ListState>
        ) : (
          <LoadingRows message={stateWords('IA-01.loading')} cells={[2, 1]} />
        )}
      </>
    );
  }

  return (
    <OverviewPage
      overview={answer}
      content={rows}
      devices={devices.waiting}
      today={today}
      titleRef={titleRef}
    />
  );
}

/**
 * The device requests waiting on the Institute Admin, with the newest one's student ("From Rahul
 * Verma on 22 October"). A failed read draws no item rather than failing the overview.
 */
function useWaitingDeviceRequests(): {
  readonly waiting: WaitingDeviceRequests | null;
  readonly pending: boolean;
} {
  const requests = useDeviceRequests('with-institute-admin');
  const students = useStudentNames();
  const answer = requests.data;
  if (!answer || students.pending) {
    return {
      waiting: null,
      pending: !requests.isError && (requests.isPending || students.pending),
    };
  }
  const newest = answer.ok ? newestFirst(answer.value)[0] : undefined;
  if (!answer.ok || !newest) return { waiting: null, pending: false };
  return {
    waiting: {
      count: answer.value.length,
      newest: {
        student: studentOf(newest, students.byId).fullName,
        requestedAt: newest.requestedAt,
      },
    },
    pending: false,
  };
}

/** The plan's status beside "Access plan": its standing in Content access, else the institution's. */
function planStatusOf(
  overview: MyOverview,
  content: readonly ContentAccessRow[],
): AccessPlanStatus {
  const plan = overview.plan;
  for (const row of content) {
    const standing = row.plans.find((candidate) => candidate.plan.id === plan?.id);
    if (standing) return standing.status;
  }
  const byInstitution: Readonly<Record<InstitutionStatus, AccessPlanStatus>> = {
    'access-active': 'access-active',
    'ending-soon': 'ending-soon',
    'access-paused': 'paused',
    'access-ended': 'access-ended',
    'approved-payment-required': 'access-active',
  };
  return byInstitution[overview.status];
}

/** The status line beside the access status (`vm01core` `stLine`). */
function statusLine(overview: MyOverview): string {
  const { plan } = overview;
  if (overview.status === 'approved-payment-required' || plan === null) {
    return OVERVIEW_WORDS.approvedStatusLine;
  }
  switch (overview.status) {
    case 'access-paused':
      return pausedStatusLine(
        overview.institution.pause ? dayMonthYear(overview.institution.pause.since) : null,
      );
    case 'access-ended':
      return endedStatusLine(plan.endsOn);
    case 'ending-soon':
    case 'access-active':
      return endsStatusLine(plan.endsOn);
  }
}

function OverviewPage({
  overview,
  content,
  devices,
  today,
  titleRef,
}: {
  readonly overview: MyOverview;
  readonly content: readonly ContentAccessRow[];
  readonly devices: WaitingDeviceRequests | null;
  readonly today: { readonly line: string | undefined; readonly day: string | null };
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const actions = headerActions(overview.status);
  const awaiting = overview.status === 'approved-payment-required' || overview.plan === null;
  return (
    <>
      <IaOverviewHead
        title={overview.institution.name}
        titlePrefix={OVERVIEW_WORDS.titlePrefix}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today.line}
        status={<InstitutionPill status={overview.status} />}
        statusLine={statusLine(overview)}
        actions={
          actions.addStudents || actions.giveAccess ? (
            <>
              {actions.addStudents ? (
                <ButtonLink href={addPersonAddress('student')} size="lg" icon="add">
                  {INSTITUTE_ACTIONS.addStudents}
                </ButtonLink>
              ) : null}
              {actions.giveAccess ? (
                <ButtonLink href={giveAccessAddress()} variant="primary" size="lg">
                  {INSTITUTE_ACTIONS.giveStudentsAccess}
                </ButtonLink>
              ) : null}
            </>
          ) : null
        }
      />
      {awaiting ? (
        <Surface labelledBy={NO_CONTENT_ID}>
          <ListState
            kind="none"
            roomy
            titleAs="h2"
            titleId={NO_CONTENT_ID}
            title={OVERVIEW_WORDS.noContent}
            action={
              <ButtonLink href={instituteRequestAddress(overview.institution.createdFromRequestId)}>
                {REQUEST_ACTIONS.viewRequestStatus}
              </ButtonLink>
            }
          >
            {OVERVIEW_WORDS.approvedLine}
          </ListState>
        </Surface>
      ) : (
        <IaOverviewGrid>
          <Attention overview={overview} content={content} devices={devices} today={today.day} />
          {overview.plan ? (
            <PlanCard overview={overview} plan={overview.plan} content={content} />
          ) : null}
        </IaOverviewGrid>
      )}
    </>
  );
}

/** "Needs your attention": the calm state, or the lead bands and the counted items. */
function Attention({
  overview,
  content,
  devices,
  today,
}: {
  readonly overview: MyOverview;
  readonly content: readonly ContentAccessRow[];
  readonly devices: WaitingDeviceRequests | null;
  readonly today: string | null;
}) {
  const view = attentionView(overview.attention, devices, content, today);
  return (
    <IaAttention
      title={OVERVIEW_WORDS.attention}
      titleId={ATTENTION_ID}
      note={view.count > 0 ? itemsWords(view.count) : undefined}
    >
      {view.count === 0 ? (
        <IaAttentionCalm title={OVERVIEW_WORDS.calmTitle}>
          {OVERVIEW_WORDS.calmLine}
        </IaAttentionCalm>
      ) : null}
      {view.leads.map((lead) => (
        <IaAttentionLead
          key={lead.key}
          tone={lead.tone}
          title={lead.title}
          line={lead.line}
          action={lead.action}
        />
      ))}
      {view.items.length > 0 ? <IaAttentionList items={view.items} /> : null}
    </IaAttention>
  );
}

/** The access-plan card on the plan tint: term, licences, term, the plan's experiments, links. */
function PlanCard({
  overview,
  plan,
  content,
}: {
  readonly overview: MyOverview;
  readonly plan: NonNullable<MyOverview['plan']>;
  readonly content: readonly ContentAccessRow[];
}) {
  const status = planStatusOf(overview, content);
  const term = termBarOf(
    plan,
    status,
    overview.planDaysLeft,
    overview.institution.pause?.since ?? pausedAtOf(plan),
  );
  const experiments = content.flatMap((row) =>
    row.experiments
      .filter((experiment) => experiment.planId === plan.id)
      .map((experiment) => ({ row, experiment })),
  );
  return (
    <IaPlanCard
      title={PLAN_WORDS.accessPlan}
      titleId={PLAN_ID}
      status={<PlanPill status={status} />}
      term={<IaTermBar {...term} place="card" />}
      facts={[
        { term: PLAN_WORDS.licences, value: plan.licences, sub: PLAN_WORDS.asApproved },
        { term: PLAN_WORDS.term, value: planTermWords(plan.term) },
      ]}
      note={OVERVIEW_WORDS.planNote}
      links={[
        { label: OVERVIEW_WORDS.viewPlan, href: accessPlanAddress(plan.id) },
        { label: OVERVIEW_WORDS.openContentAccess, href: CONTENT_ACCESS_ADDRESS },
      ]}
    >
      {experiments.map(({ row, experiment }) => {
        const formats = formatFactsOf(experiment.formats, experiment.publishedNotInPlan);
        const own = row.institutionCode?.code;
        return (
          <IaPlanCardExperiment
            key={`${experiment.planId}:${experiment.experimentId}`}
            name={experiment.name}
            course={courseWords(row.course.platformCode, row.course.name)}
            ownCode={
              own
                ? { label: PLAN_WORDS.yourCourseCode, code: own }
                : { missing: PLAN_WORDS.codeNotAdded }
            }
            formats={
              <IaFormatList
                variant="plan"
                label={formatsOfLabel(experiment.name)}
                cells={formats.cells}
              />
            }
            formatKey={formats.key}
          />
        );
      })}
    </IaPlanCard>
  );
}
