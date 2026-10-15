'use client';

import type { ExperimentHub as HubAnswer, MyCourseRow } from '@xr/contracts/draft';
import { FormatBadge, Icon, type IconName, LoadingState, PageContent } from '@xr/ui';
import { type ReactNode, useId } from 'react';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  courseLine,
  deviceNeedsWords,
  formatCode,
  HUB_AVAILABILITY,
  HUB_PAGE,
  resourcesNoneOpenedWords,
  resourcesOpenedWords,
  simulationAvailabilityWords,
  simulationProgressWords,
  STUDENT_WORDS,
  stepWords,
  noLicenceForYouWords,
} from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { experimentPlacement, notAvailablePlacement } from '@/nav/student';
import { useExperimentHub, useMyCourses, usePublishedName } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import { StudentFailed, useRetryFocus, useStudentSession } from '../shared/student-states';
import {
  type Closure,
  givenFormats,
  hubFormatOrder,
  isGiven,
  notAvailableKind,
  policyOpenOf,
} from '../shared/student-view';

/**
 * ST-05 Experiment hub — board B2-12 (f0 … f3, f5; B2-13 f3), at
 * `/student/experiments/[experimentId]`, with ST-19 "Experiment not available" in its place
 * (B2-11 f12, B2-12 f4, f6).
 *
 * - **Read**: `StudentAccessService.getExperimentHub` — the published page, the Student's
 *   availability per format (available to you / not included for your institution / not
 *   available for this experiment / not available right now) and progress per format, the
 *   resources opened and the assessment — read side by side, never one derived from another
 *   (BC3); the course's code as the Student's course row shows it (T-17, `listMyCourses`); the
 *   institution's pause and an inactive account from the session's banner facts (XS-08).
 * - **Overview only**: the tab strip, the header's "Next step" with its button and the cards'
 *   actions lead to Phase-3/4 screens and are not rendered (`ST-05.unbuilt`, DEV-21).
 * - **ST-19**: a refusal or an open decision renders the message page in place (shell placement
 *   "My courses / Not available"): not given (B2-11 f12), no longer given (B2-12 f4; also for
 *   SACC-14, `ST-19.sacc-14`), ended (B2-12 f6), undecided (OD-B2-01, OD-B2-02, GRP-05).
 */
export function ExperimentHub({ experimentId }: { readonly experimentId: string }) {
  const read = useExperimentHub(experimentId);
  const courses = useMyCourses();
  const student = useStudentSession();
  const navigation = useAppNavigation();
  const answer = read.data;
  const refusal = answer && !answer.ok ? notAvailableKind(answer.error) : null;
  const published = usePublishedName(experimentId, refusal !== null);
  const hub = answer?.ok ? answer.value : null;
  const code = hub ? codeShown(hub, courses.data?.ok ? courses.data.value : []) : null;

  useShellPage(
    refusal !== null
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : experimentPlacement(
          hub
            ? {
                name: hub.experiment.name,
                course: {
                  crumb: code ?? hub.experiment.courseName,
                  courseId: hub.experiment.courseId,
                },
              }
            : null,
        ),
  );
  const ready = hub !== null && courses.data !== undefined && student !== null;
  const retried = useRetryFocus(ready);
  const retry = () => {
    retried();
    void read.refetch();
    if (courses.isError) void courses.refetch();
  };

  if (read.isError || (hub && courses.isError)) {
    return (
      <PageContent wrap="wide">
        <StudentFailed title={stateWords('ST-05.failed')} onRetry={retry} />
      </PageContent>
    );
  }
  if (answer && !answer.ok) {
    if (refusal === null) return navigation.notFound();
    if (published.isPending) return <HubLoading />;
    return <NotAvailable kind={refusal} name={published.name} />;
  }
  if (!ready || !hub) return <HubLoading />;
  return (
    <PageContent wrap="wide">
      <HubContent hub={hub} code={code} closure={student.closure} />
    </PageContent>
  );
}

function HubLoading() {
  return (
    <PageContent wrap="wide">
      <LoadingState label={stateWords('ST-05.loading')} surface="section" />
    </PageContent>
  );
}

/** The course code the Student's course row shows (T-17), else the platform code (`ST-05.code`). */
function codeShown(hub: HubAnswer, courses: readonly MyCourseRow[]): string | null {
  const row = courses.find((course) => course.courseId === hub.experiment.courseId);
  return row ? row.codeShown : hub.experiment.platformCode;
}

function HubContent({
  hub,
  code,
  closure,
}: {
  readonly hub: HubAnswer;
  readonly code: string | null;
  readonly closure: Closure;
}) {
  const { experiment, row } = hub;
  const course = courseLine(code, experiment.courseName);
  return (
    <>
      <div className="xw-hubhead xr-dark">
        <span className="xr-overline">{course}</span>
        <h1 className="xr-h1 m-0">{experiment.name}</h1>
        <p>{experiment.description}</p>
        <div className="xw-hubrow">
          <ul className="xw-fav" aria-label={HUB_PAGE.formatsLabel}>
            {hubFormatOrder(row).map((entry) => {
              const words = formatWords(entry.availability, closure);
              return (
                <li key={entry.format} className={words.off ? 'is-off' : undefined}>
                  <FormatBadge
                    format={formatCode(entry.format)}
                    variant={words.off ? 'off' : 'on-dark'}
                    compact
                  />
                  <span>{words.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="xw-stack mt-6">
        <NextSteps hub={hub} closure={closure} />
        <About hub={hub} course={course} />
        {experiment.learningOutcomes.length > 0 ? <Outcomes hub={hub} /> : null}
      </div>
    </>
  );
}

/** B2-12's header words per format; the given formats read "Paused" while paused (f3). */
function formatWords(
  availability: HubAnswer['row']['formats'][number]['availability'],
  closure: Closure,
): { readonly text: string; readonly off: boolean } {
  if (policyOpenOf(availability) !== null) {
    return { text: stateWords('ST-05.format-policy-open'), off: true };
  }
  if (typeof availability === 'object') return { text: '', off: true };
  if (isGiven(availability) && closure === 'paused')
    return { text: STUDENT_WORDS.paused, off: true };
  if (isGiven(availability) && closure === 'inactive') {
    return { text: stateWords('ST-05.inactive-format'), off: true };
  }
  return { text: HUB_AVAILABILITY[availability], off: availability !== 'available-to-you' };
}

function NextSteps({ hub, closure }: { readonly hub: HubAnswer; readonly closure: Closure }) {
  const headingId = useId();
  const given = givenFormats(hub.row);
  const { total, opened } = hub.resourceSummary;

  const resources =
    closure === 'paused' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{HUB_PAGE.pausedResources}</StepText>
    ) : closure === 'inactive' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{stateWords('ST-05.inactive-resources')}</StepText>
    ) : (
      // "Open resources" (ST-06, Phase 3) is not rendered (DEV-21).
      <StepText>
        {total === 0
          ? stateWords('ST-05.no-resources')
          : opened === 0
            ? resourcesNoneOpenedWords(total)
            : resourcesOpenedWords(total, opened)}
      </StepText>
    );

  const started = given.some((entry) => entry.progress !== 'not-started');
  // A supplied licence wait (B3-02, PC-45): the header keeps "Available to you" as B3-02 draws it;
  // the Simulation step says why nothing opens now.
  const waitingPlan =
    hub.row.closure?.kind === 'waiting-for-a-licence' ? hub.row.closure.planId : null;
  const simulation =
    closure === 'paused' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{HUB_PAGE.pausedSimulation}</StepText>
    ) : closure === 'inactive' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{stateWords('ST-05.inactive-simulation')}</StepText>
    ) : waitingPlan !== null ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{noLicenceForYouWords(waitingPlan)}</StepText>
    ) : given.length === 0 ? null : (
      // "Choose a format" / "Continue WEB" (ST-07 … ST-09, Phase 3) are not rendered (DEV-21).
      <StepText>
        {started
          ? `${simulationProgressWords(given)} ${HUB_PAGE.eachFormatOwnProgress}`
          : `${simulationAvailabilityWords(
              given
                .filter((entry) => entry.availability === 'available-to-you')
                .map((e) => e.format),
              given
                .filter((entry) => entry.availability === 'not-available-right-now')
                .map((e) => e.format),
            )} ${simulationProgressWords(given)}`}
      </StepText>
    );

  const assessment =
    'kind' in hub.assessment ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{HUB_PAGE.noAssessment}</StepText>
    ) : (
      // "Open assessment" (ST-11 … ST-14, Phase 4) is not rendered (`ST-05.assessment-set`).
      <StepText>{wordsOf(studentAssessmentWords(hub.assessment.result.kind)) ?? ''}</StepText>
    );

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="xr-sr">
        {HUB_PAGE.nextSteps}
      </h2>
      <ol className="xw-steps3">
        <StepCard step={1} icon="fileText" title={HUB_PAGE.resources}>
          {resources}
        </StepCard>
        <StepCard step={2} icon="monitor" title={HUB_PAGE.simulation}>
          {simulation}
        </StepCard>
        <StepCard step={3} icon="assessments" title={HUB_PAGE.assessment}>
          {assessment}
        </StepCard>
      </ol>
      <p className="xr-meta mt-3">{HUB_PAGE.suggestedOrder}</p>
    </section>
  );
}

/** One of the three next-stage cards (`li.xw-scard`, B2-12 f0). */
function StepCard({
  step,
  icon,
  title,
  children,
}: {
  readonly step: 1 | 2 | 3;
  readonly icon: IconName;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="xw-scard">
      <span className="xw-scard-n">
        <span className="xr-row-icon">
          <Icon name={icon} />
        </span>
        {stepWords(step)}
      </span>
      <h3>{title}</h3>
      {children}
    </li>
  );
}

/** A card's line and, where B2-12 draws one, "Nothing to do here yet." under it. */
function StepText({ children, meta }: { readonly children: string; readonly meta?: string }) {
  return (
    <>
      <p>{children}</p>
      {meta ? <span className="xr-meta">{meta}</span> : null}
    </>
  );
}

/** "About this experiment" (B2-12 f0): course, engineering area, what you need per given format. */
function About({ hub, course }: { readonly hub: HubAnswer; readonly course: string }) {
  const headingId = useId();
  const given = givenFormats(hub.row);
  const needs = given.flatMap((entry) => {
    const published = hub.experiment.formats.find((format) => format.format === entry.format);
    return published ? [{ format: entry.format, deviceNeeds: published.deviceNeeds }] : [];
  });
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {HUB_PAGE.about}
        </h2>
      </div>
      <div className="xr-section-body">
        <dl className="xp-kv m-0 grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
          <dt className="font-[700] text-ink">{HUB_PAGE.course}</dt>
          <dd className="m-0 text-ink-2">{course}</dd>
          <dt className="font-[700] text-ink">{HUB_PAGE.area}</dt>
          <dd className="m-0 text-ink-2">{hub.experiment.areaName}</dd>
          {needs.length > 0 ? (
            <>
              <dt className="font-[700] text-ink">{HUB_PAGE.whatYouNeed}</dt>
              <dd className="m-0 text-ink-2">
                <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[15px] leading-[22px] text-ink-2">
                  {needs.map((need) => (
                    <li key={need.format}>
                      <strong className="text-ink">{formatCode(need.format)}</strong>
                      {' — '}
                      {deviceNeedsWords(need.deviceNeeds)}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

/** "Learning outcomes" (B2-12 f0): once, the same for every format. */
function Outcomes({ hub }: { readonly hub: HubAnswer }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {HUB_PAGE.outcomes}
        </h2>
      </div>
      <div className="xr-section-body">
        <p className="xr-meta mb-[10px]">{HUB_PAGE.sameForEveryFormat}</p>
        <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[16px] leading-[24px] text-ink">
          {hub.experiment.learningOutcomes.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
