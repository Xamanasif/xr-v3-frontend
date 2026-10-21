'use client';

import type { AccessPlanView, ContentAccessRow, RequesterRequestView } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  IaExperimentsTable,
  IaFormatKey,
  IaFormatList,
  IaGrantHow,
  IaGroupedTable,
  IaManageSurface,
  IaPlanFacts,
  IaPlanStrip,
  IaPlanStripAsk,
  IaPlanStripFoot,
  IaPlanStripNote,
  IaPlanStripRow,
  IaRecordGrid,
  IaSectionBody,
  IaSectionHead,
  IaStatusNotes,
  IaTermBar,
  ListState,
  LoadingRows,
  MetaSeparator,
  PageHead,
  Surface,
  TextLink,
  Timeline,
} from '@xr/ui/v3';
import { type ReactNode, type RefObject, useEffect, useRef } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  ACCESS_PLAN_WORDS,
  activeSinceWords,
  addCodeLabel,
  alsoInWords,
  CONTENT_ACCESS_WORDS,
  endsOnTitle,
  firstNameOf,
  formatsOfLabel,
  INSTITUTE_ACTIONS,
  PLAN_NOTICES,
  PLAN_WORDS,
  planEndedTitle,
  planFormatsLabel,
  studentsWords,
  viaGroupWords,
  waitingNote,
} from '@/copy/institute-home';
import { REQUEST_ACTIONS } from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_ACCESS_ADDRESS,
  CONTENT_ACCESS_TITLE,
  COURSE_CODES_ADDRESS,
  giveAccessAddress,
  groupAddress,
  STUDENT_ACCESS_ADDRESS,
  studentRecordAddress,
  underPlacement,
} from '@/nav/institute';
import { INSTITUTE_REQUESTS_ADDRESS, instituteRequestAddress } from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useAccessPlan, useContentAccess, usePlanRequest } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatFactsOf, pausedAtOf, termBarOf } from '../ia-02-content-access/plan-facts';
import { GrantPill, PlanPill } from '../ia-02-content-access/plan-pills';
import { usePlanToday } from '../ia-02-content-access/plan-today';
import { formatCodes } from '../shared/format-codes';
import { isGivable } from '../shared/institute-parts';
import { givenGroups, historyLines } from './access-plan-view';

const TITLE_ID = 'ia-h1';
const STRIP_ID = 'pl-cp-h';
const WHAT_ID = 'pl-what';
const GIVEN_ID = 'pl-stu';
const HISTORY_ID = 'pl-hist';

/**
 * IA-03 Access plan — the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/
 * IA-v1, `Main.dc.html` IA-03 and `vm03`), at `/institute/content-access/plans/[planId]`.
 *
 * - **Reads**: `InstitutionService.getAccessPlan` — the plan, its status, the days left in its
 *   term, its experiments with their courses and the published formats it leaves out, the students
 *   an active grant of it reaches now (each grant's status as the plan page reads it) and its
 *   grants for the history; `AccessRequestService.getInstitutionRequest` for the request it came
 *   from; and `InstitutionService.listContentAccess` — the one extra aggregate read — for the
 *   institution's own code and semester of each course (state-copy `IA-03.course-codes`). Licences
 *   are "as approved by BITS" (T-06); there is no amend control (T-08).
 * - **As the export draws it**: the crumbs (Content access › Access plan), the head ("Your access
 *   plan", its status, "From your request to BITS" — a link to the request — and "Active since
 *   …"; Give students access while active or ending soon), the strip on the plan tint (licences,
 *   the term bar, where to ask BITS while active, the footnote; the ending-soon, ended and paused
 *   notes), "What BITS gave your institution" grouped by course with the four format badges,
 *   "Students you’ve given access" grouped by experiment, read-only (how given, status, the wait
 *   note only on a row that reads Waiting for a licence) or its empty state, and the History
 *   beside it.
 * - An address that names no plan of this institution shows the in-shell not-found page.
 * - No internal reference (ACC-, REQ-, SACC-) in its words, names, crumbs or tab title (state-copy
 *   `IA-plan.no-reference`).
 */
export function AccessPlanDetail({ planId }: { readonly planId: string }) {
  useShellPage(underPlacement('IA-03', ACCESS_PLAN_WORDS.crumb));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const today = usePlanToday();
  const read = useAccessPlan(planId);
  const view = read.data?.ok ? read.data.value : null;
  const request = usePlanRequest(view ? view.plan.sourceRequestId : null);
  const content = useContentAccess();
  const { notFound } = useAppNavigation();

  const contentFailed = content.isError || (content.data !== undefined && !content.data.ok);
  const failed = read.isError || (view !== null && request.isError) || contentFailed;
  if (!failed && read.data && !read.data.ok) notFound();
  const crumbs = (
    <Breadcrumbs
      levels={[{ label: CONTENT_ACCESS_TITLE, href: CONTENT_ACCESS_ADDRESS }]}
      current={ACCESS_PLAN_WORDS.crumb}
    />
  );
  const rows = content.data?.ok ? content.data.value : null;
  // Try again moves focus to the title, and keeps it there once the plan has loaded.
  const loaded = !failed && view !== null && !request.isPending && rows !== null;
  const refocus = useRef(false);
  useEffect(() => {
    if (!loaded || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus();
  }, [loaded]);

  if (!loaded || view === null || rows === null) {
    const retry = () => {
      if (read.isError) void read.refetch();
      if (request.isError) void request.refetch();
      if (contentFailed) void content.refetch();
      refocus.current = true;
      titleRef.current?.focus();
    };
    return (
      <>
        <PageHead
          breadcrumbs={crumbs}
          variant="record"
          title={ACCESS_PLAN_WORDS.title}
          titleId={TITLE_ID}
          titleRef={titleRef}
          titleFocusTarget
          date={today.line}
        />
        {failed ? (
          <ListState
            kind="failed"
            titleAs="h2"
            title={stateWords('IA-03.failed')}
            action={<Button onClick={retry}>{CONTENT_ACCESS_WORDS.tryAgain}</Button>}
          >
            {CONTENT_ACCESS_WORDS.failedLine}
          </ListState>
        ) : (
          <LoadingRows message={stateWords('IA-03.loading')} cells={[2, 1, 1]} />
        )}
      </>
    );
  }
  const requestView = request.data?.ok ? request.data.value : null;
  return (
    <PlanPage
      view={view}
      request={requestView}
      content={rows}
      crumbs={crumbs}
      date={today.line}
      titleRef={titleRef}
    />
  );
}

function PlanPage({
  view,
  request,
  content,
  crumbs,
  date,
  titleRef,
}: {
  readonly view: AccessPlanView;
  readonly request: RequesterRequestView | null;
  readonly content: readonly ContentAccessRow[];
  readonly crumbs: ReactNode;
  readonly date: string | undefined;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { plan, status } = view;
  const givable = isGivable(status);
  const term = termBarOf(plan, status, view.daysLeft, pausedAtOf(plan));
  const renewal = { label: REQUEST_ACTIONS.requestRenewal, href: INSTITUTE_REQUESTS_ADDRESS };
  const askStrip = status === 'access-active';
  return (
    <>
      <PageHead
        breadcrumbs={crumbs}
        variant="record"
        title={ACCESS_PLAN_WORDS.title}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        eyebrow={view.institutionName}
        meta={
          <>
            <PlanPill status={status} />
            <span>
              {ACCESS_PLAN_WORDS.from}{' '}
              <TextLink href={instituteRequestAddress(plan.sourceRequestId)}>
                {ACCESS_PLAN_WORDS.fromRequest}
              </TextLink>
            </span>
            <MetaSeparator />
            <span>{activeSinceWords(dateTime(plan.activatedAt))}</span>
          </>
        }
        actions={
          givable ? (
            <ButtonLink href={giveAccessAddress()} variant="primary" size="lg">
              {INSTITUTE_ACTIONS.giveStudentsAccess}
            </ButtonLink>
          ) : null
        }
      />
      <IaPlanStrip titleId={STRIP_ID} hiddenTitle={ACCESS_PLAN_WORDS.stripHeading}>
        <IaPlanStripRow variant="plan" noAsk={!askStrip}>
          <IaPlanFacts
            place="strip"
            facts={[
              { term: PLAN_WORDS.licences, value: plan.licences, sub: PLAN_WORDS.asApproved },
            ]}
          />
          <IaTermBar {...term} place="strip" />
          {askStrip ? (
            <IaPlanStripAsk
              question={REQUEST_ACTIONS.needMore}
              link={{ label: REQUEST_ACTIONS.askFromRequests, href: INSTITUTE_REQUESTS_ADDRESS }}
            />
          ) : null}
        </IaPlanStripRow>
        <IaPlanStripFoot>{ACCESS_PLAN_WORDS.foot}</IaPlanStripFoot>
        {status === 'ending-soon' ? (
          <IaPlanStripNote
            tone="warn"
            title={endsOnTitle(plan.endsOn)}
            line={PLAN_NOTICES.endingSoonLine}
            action={renewal}
          />
        ) : status === 'access-ended' ? (
          <IaPlanStripNote
            tone="off"
            title={planEndedTitle(plan.endsOn)}
            line={PLAN_NOTICES.planEndedLine}
            action={renewal}
          />
        ) : status === 'paused' ? (
          <IaPlanStripNote
            tone="paused"
            title={PLAN_NOTICES.pausedTitle}
            line={PLAN_NOTICES.planPausedLine}
          />
        ) : null}
      </IaPlanStrip>
      <WhatBitsGave view={view} content={content} />
      <IaRecordGrid
        main={<GivenTo view={view} givable={givable} />}
        side={
          <Surface labelledBy={HISTORY_ID}>
            <IaSectionBody title={ACCESS_PLAN_WORDS.history} titleId={HISTORY_ID}>
              <Timeline
                events={historyLines(view, request).map((line) => ({
                  what: line.what,
                  when: line.when,
                  ...(line.note ? { note: line.note } : {}),
                }))}
              />
            </IaSectionBody>
          </Surface>
        }
      />
    </>
  );
}

/** "What BITS gave your institution": one group per course, each experiment with its formats. */
function WhatBitsGave({
  view,
  content,
}: {
  readonly view: AccessPlanView;
  readonly content: readonly ContentAccessRow[];
}) {
  const courses = new Map<string, AccessPlanView['experiments'][number]['course']>();
  for (const experiment of view.experiments) courses.set(experiment.course.id, experiment.course);
  return (
    <IaManageSurface labelledBy={WHAT_ID}>
      <IaSectionHead
        title={ACCESS_PLAN_WORDS.gave}
        titleId={WHAT_ID}
        aside={
          <IaFormatKey
            label={PLAN_WORDS.formatsKey}
            listLabel={PLAN_WORDS.formatKeyLabel}
            inPlan={PLAN_WORDS.inYourPlan}
            published={PLAN_WORDS.publishedNotInPlan}
            notPublished={PLAN_WORDS.notPublished}
          />
        }
      />
      <IaExperimentsTable
        plan
        caption={ACCESS_PLAN_WORDS.gaveCaption}
        headers={{
          experiment: CONTENT_ACCESS_WORDS.columns.experiment,
          formats: CONTENT_ACCESS_WORDS.columns.formats,
        }}
        courses={[...courses.values()].map((course) => {
          const code = content.find((row) => row.course.id === course.id)?.institutionCode;
          return {
            key: course.id,
            headId: `pl-c-${course.id}`,
            ...(course.platformCode ? { code: course.platformCode } : {}),
            name: course.name,
            ownCode: code?.code
              ? {
                  label: PLAN_WORDS.yourCourseCode,
                  code: code.code,
                  ...(code.semester ? { semester: code.semester } : {}),
                }
              : {
                  missing: PLAN_WORDS.codeNotAdded,
                  add: {
                    label: CONTENT_ACCESS_WORDS.addCode,
                    href: COURSE_CODES_ADDRESS,
                    accessibleName: addCodeLabel(course.platformCode, course.name),
                  },
                },
            rows: view.experiments
              .filter((experiment) => experiment.course.id === course.id)
              .map((experiment) => ({
                key: experiment.experimentId,
                name: experiment.name,
                formats: (
                  <IaFormatList
                    label={formatsOfLabel(experiment.name)}
                    cells={formatFactsOf(experiment.formats, experiment.publishedNotInPlan).cells}
                  />
                ),
              })),
          };
        })}
      />
    </IaManageSurface>
  );
}

/** "Students you’ve given access": grouped by experiment, read-only, or its empty state. */
function GivenTo({ view, givable }: { readonly view: AccessPlanView; readonly givable: boolean }) {
  const groups = givenGroups(view);
  const single = view.experiments.length === 1 ? view.experiments[0]! : null;
  const { columns } = ACCESS_PLAN_WORDS;
  return (
    <IaManageSurface labelledBy={GIVEN_ID}>
      <IaSectionHead
        title={ACCESS_PLAN_WORDS.given}
        titleId={GIVEN_ID}
        aside={
          groups.length > 0 ? (
            <TextLink href={STUDENT_ACCESS_ADDRESS}>{ACCESS_PLAN_WORDS.openStudentAccess}</TextLink>
          ) : null
        }
      />
      {groups.length === 0 ? (
        <ListState
          kind="none"
          icon="user"
          titleAs="h3"
          title={ACCESS_PLAN_WORDS.nobodyTitle}
          action={
            givable ? (
              <ButtonLink
                href={giveAccessAddress(
                  single ? { course: single.course.id, experiment: single.experimentId } : {},
                )}
              >
                {INSTITUTE_ACTIONS.giveStudentsAccess}
              </ButtonLink>
            ) : null
          }
        >
          {ACCESS_PLAN_WORDS.nobodyLine}
        </ListState>
      ) : (
        <IaGroupedTable
          readOnly
          caption={ACCESS_PLAN_WORDS.givenCaption}
          headers={{ who: columns.student, how: columns.how, status: columns.status }}
          groups={groups.map((group) => ({
            key: group.experimentId,
            title: group.name,
            code: group.courseCode ?? group.courseName,
            formats: formatCodes(group.formats),
            formatsLabel: planFormatsLabel(group.formats),
            count: studentsWords(group.students.length),
            rows: group.students.map((row) => ({
              key: row.key,
              name: row.student.fullName,
              href: studentRecordAddress(row.student.id),
              sub: row.student.institutionStudentId,
              how: (
                <IaGrantHow
                  how={
                    row.via.kind === 'group'
                      ? {
                          kind: 'group',
                          words: viaGroupWords(row.via.groupName),
                          href: groupAddress(row.via.groupId),
                        }
                      : { kind: 'individual', words: ACCESS_PLAN_WORDS.individually }
                  }
                  date={dayMonthYear(row.givenAt)}
                  also={row.alsoIn.length > 0 ? alsoInWords(row.alsoIn) : undefined}
                />
              ),
              status: (
                <IaStatusNotes
                  status={<GrantPill display={row.display} />}
                  notes={
                    row.display === 'waiting-for-a-licence'
                      ? [waitingNote(firstNameOf(row.student.fullName))]
                      : []
                  }
                />
              ),
            })),
          }))}
        />
      )}
    </IaManageSurface>
  );
}
