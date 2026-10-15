'use client';

import type { AccessPlanView, RequesterRequestView } from '@xr/contracts/draft';
import { inDisplayOrder, type Technology } from '@xr/domain';
import {
  BackLink,
  FormatSet,
  type FormatCode,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useId } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  ACCESS_PLAN_WORDS,
  activeSinceWords,
  courseWords,
  givenCaption,
  givenWords,
  INSTITUTE_ACTIONS,
  licencesWords,
  nobodyLine,
  PLAN_NOTICES,
  planEndedTitle,
  planTitle,
  termWords,
} from '@/copy/institute-home';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_ACCESS_ADDRESS,
  giveAccessAddress,
  STUDENT_ACCESS_ADDRESS,
  studentRecordAddress,
  underPlacement,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';
import { useAccessPlan, usePlanRequest } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  GrantStatusPill,
  isGivable,
  LoadFailed,
  PlanStatusPill,
} from '../ia-02-content-access/institute-parts';
import { historyLines } from './access-plan-view';

const code = (format: Technology) => format.toUpperCase() as FormatCode;

/**
 * IA-03 Access plan — board B2-03 frames 0–5 ("What BITS gave this institution, and which
 * students have been given access?"), at `/institute/content-access/plans/[planId]`. Its frames
 * 6–10 are IA-16 Course codes, not part of Package 2A.
 *
 * - **Read**: `InstitutionService.getAccessPlan` — the plan, its status, the days left in its term,
 *   its experiments with their courses and the published formats it leaves out, the students an
 *   active grant of it reaches now (each grant's status as the plan page reads it: paused while
 *   the institution is paused, access ended once the term has ended) and its grants for the
 *   history; and `AccessRequestService.getInstitutionRequest` for the request it came from
 *   ("Request submitted", "Request approved"). Licences are "as approved by BITS" (T-06); there
 *   is no amend control (T-08).
 * - **As B2-03 draws it**: back to Content access, the header (status, "From request REQ-0042",
 *   "Active since …", "Give students access" while active or ending soon), the ended (f3) or
 *   paused (f4) notice, "What BITS gave your institution", "Students you’ve given access" (or its
 *   empty state, f0) and "History". Student names open their record (IA-07); "Open Student
 *   access" opens IA-04. Links to screens not built in Package 2A are not drawn
 *   (state-copy `IA-03.not-rendered`).
 * - An address that names no plan of this institution shows the in-shell not-found page.
 */
export function AccessPlanDetail({ planId }: { readonly planId: string }) {
  const read = useAccessPlan(planId);
  const view = read.data?.ok ? read.data.value : null;
  const request = usePlanRequest(view ? view.plan.sourceRequestId : null);
  useShellPage(underPlacement('IA-03', view ? view.plan.id : null));
  const { notFound } = useAppNavigation();

  const failed = read.isError || (view !== null && request.isError);
  if (failed) {
    return (
      <PageContent wrap="read">
        <BackLink href={CONTENT_ACCESS_ADDRESS}>{ACCESS_PLAN_WORDS.back}</BackLink>
        <div className="h-2" />
        <LoadFailed
          title={stateWords('IA-03.failed')}
          onRetry={() => {
            if (read.isError) void read.refetch();
            if (request.isError) void request.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (read.data && !read.data.ok) notFound();
  if (view === null || request.isPending) {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('IA-03.loading')} surface="section" />
      </PageContent>
    );
  }
  const requestView = request.data?.ok ? request.data.value : null;
  return <PlanPage view={view} request={requestView} />;
}

function PlanPage({
  view,
  request,
}: {
  readonly view: AccessPlanView;
  readonly request: RequesterRequestView | null;
}) {
  const { plan, status } = view;
  const givable = isGivable(status);
  const singleExperiment = view.experiments.length === 1 ? view.experiments[0]! : null;
  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={CONTENT_ACCESS_ADDRESS}>{ACCESS_PLAN_WORDS.back}</BackLink>}
        overline={view.institutionName}
        title={planTitle(plan.id)}
        meta={
          <>
            <PlanStatusPill status={status} />
            {/* "REQ-0042" opens PU-10 from the workspace, not built in Package 2A. */}
            <span>
              {ACCESS_PLAN_WORDS.fromRequest} {plan.sourceRequestId}
            </span>
            <span>{activeSinceWords(dateTime(plan.activatedAt))}</span>
          </>
        }
        actions={
          givable ? (
            <Link className="xr-btn xr-btn--primary" href={giveAccessAddress()}>
              {INSTITUTE_ACTIONS.giveStudentsAccess}
            </Link>
          ) : null
        }
      />
      <div className="xw-stack">
        {status === 'access-ended' ? (
          <Notice tone="quiet" title={planEndedTitle(plan.endsOn)}>
            {PLAN_NOTICES.planEndedLine}
          </Notice>
        ) : status === 'paused' ? (
          <Notice tone="warn" icon="readOnly" title={PLAN_NOTICES.pausedTitle}>
            {PLAN_NOTICES.pausedLine}
          </Notice>
        ) : null}
        <WhatBitsGave view={view} />
        <GivenTo view={view} givable={givable} singleExperiment={singleExperiment} />
        <History view={view} request={request} />
      </div>
    </PageContent>
  );
}

/** A titled section as B2-03 draws it (`section.xr-section[aria-labelledby]`). */
function TitledSection({
  title,
  headEnd,
  children,
}: {
  readonly title: string;
  readonly headEnd?: ReactNode;
  readonly children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {title}
        </h2>
        {headEnd}
      </div>
      {children}
    </section>
  );
}

/** B2-03 "What BITS gave your institution": licences as approved, term, course, experiments. */
function WhatBitsGave({ view }: { readonly view: AccessPlanView }) {
  const { plan, status, daysLeft } = view;
  const { keys, columns } = ACCESS_PLAN_WORDS;
  const courses = new Map(
    view.experiments.map((experiment) => [experiment.course.id, experiment.course]),
  );
  return (
    <TitledSection title={ACCESS_PLAN_WORDS.gave}>
      <div className="xr-section-body">
        <dl className="xp-kv m-0 grid grid-cols-[160px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
          <dt className="font-[700] text-ink">{keys.licences}</dt>
          <dd className="m-0 text-ink-2">{licencesWords(plan.licences)}</dd>
          <dt className="font-[700] text-ink">{keys.term}</dt>
          <dd className="m-0 text-ink-2">
            {termWords(plan, status === 'ending-soon' ? daysLeft : null)}
          </dd>
          <dt className="font-[700] text-ink">{keys.course}</dt>
          <dd className="m-0 text-ink-2">
            {[...courses.values()].map((course, index) => (
              <span key={course.id} className={index > 0 ? 'block' : undefined}>
                {courseWords(course.platformCode, course.name)}
              </span>
            ))}
          </dd>
        </dl>
        <div className="xr-table-wrap mt-4">
          <table className="xr-table">
            <caption className="xr-sr">{ACCESS_PLAN_WORDS.experimentsCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{columns.experiment}</th>
                <th scope="col">{columns.formats}</th>
                <th scope="col">{columns.notInPlan}</th>
              </tr>
            </thead>
            <tbody>
              {view.experiments.map((experiment) => (
                <tr key={experiment.experimentId}>
                  <td className="is-primary font-[700]">{experiment.name}</td>
                  <td data-label={columns.formats}>
                    <FormatSet compact formats={inDisplayOrder(experiment.formats).map(code)} />
                  </td>
                  <td data-label={columns.notInPlan}>
                    {experiment.publishedNotInPlan.length > 0 ? (
                      <FormatSet
                        compact
                        variant="off"
                        formats={inDisplayOrder(experiment.publishedNotInPlan).map(code)}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* "Need more, or a renewal? Ask BITS from Requests" opens IA-17 / IA-18, not built in 2A. */}
      </div>
    </TitledSection>
  );
}

/** B2-03 "Students you’ve given access": the table (f1 … f5) or its empty state (f0). */
function GivenTo({
  view,
  givable,
  singleExperiment,
}: {
  readonly view: AccessPlanView;
  readonly givable: boolean;
  readonly singleExperiment: AccessPlanView['experiments'][number] | null;
}) {
  const { columns } = ACCESS_PLAN_WORDS;
  const experimentOf = (experimentId: string) =>
    view.experiments.find((experiment) => experiment.experimentId === experimentId);
  if (view.givenTo.length === 0) {
    return (
      <TitledSection title={ACCESS_PLAN_WORDS.given}>
        <div className="xr-empty">
          <span className="xr-empty-icon">
            <Icon name="studentAccess" />
          </span>
          <h3 className="xr-h3 m-0">{ACCESS_PLAN_WORDS.nobodyTitle}</h3>
          <p className="xr-body m-0 text-ink-2">
            {nobodyLine(view.experiments.map((experiment) => experiment.name))}
          </p>
          {givable ? (
            <div className="flex flex-wrap gap-3">
              <Link
                className="xr-btn xr-btn--secondary"
                href={giveAccessAddress(
                  singleExperiment
                    ? {
                        course: singleExperiment.course.id,
                        experiment: singleExperiment.experimentId,
                      }
                    : {},
                )}
              >
                {INSTITUTE_ACTIONS.giveStudentsAccess}
              </Link>
            </div>
          ) : null}
        </div>
      </TitledSection>
    );
  }
  return (
    <TitledSection
      title={ACCESS_PLAN_WORDS.given}
      headEnd={<Link href={STUDENT_ACCESS_ADDRESS}>{ACCESS_PLAN_WORDS.openStudentAccess}</Link>}
    >
      <div className="xr-table-wrap xw-table-flush">
        <table className="xr-table">
          <caption className="xr-sr">{givenCaption(view.plan.id)}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.student}</th>
              <th scope="col">{columns.experiment}</th>
              <th scope="col">{columns.given}</th>
              <th scope="col">{columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {view.givenTo.map((row) => {
              const experiment = experimentOf(row.experimentId);
              return (
                <tr key={`${row.grantId}:${row.student.id}`}>
                  <td className="is-primary">
                    <Link href={studentRecordAddress(row.student.id)} className="font-[700]">
                      {row.student.fullName}
                    </Link>
                    <span className="xr-sub">{row.student.institutionStudentId}</span>
                  </td>
                  <td data-label={columns.experiment}>
                    {experiment?.name ?? row.experimentId}
                    <span className="xr-sub">
                      <FormatSet
                        compact
                        formats={inDisplayOrder(experiment?.formats ?? []).map(code)}
                      />
                    </span>
                  </td>
                  <td data-label={columns.given}>
                    {givenWords(
                      dayMonthYear(row.givenAt),
                      row.via.kind === 'group' ? { groupName: row.via.groupName } : null,
                    )}
                    <span className="xr-sub xr-id">{row.grantId}</span>
                  </td>
                  <td data-label={columns.status}>
                    <GrantStatusPill display={row.display} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TitledSection>
  );
}

/** B2-03 "History", newest first (`ol.xr-timeline`, the latest marked). */
function History({
  view,
  request,
}: {
  readonly view: AccessPlanView;
  readonly request: RequesterRequestView | null;
}) {
  const lines = historyLines(view, request);
  return (
    <TitledSection title={ACCESS_PLAN_WORDS.history}>
      <div className="xr-section-body">
        <Timeline
          events={lines.map((line) => ({
            id: line.id,
            what: line.what,
            when: line.when,
            ...(line.note ? { note: line.note } : {}),
          }))}
        />
      </div>
    </TitledSection>
  );
}
