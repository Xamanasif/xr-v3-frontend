'use client';

import type { ExperimentHub as HubAnswer } from '@xr/contracts/draft';
import { Icon, type IconName, Link, PageContent } from '@xr/ui';
import { type ReactNode, useId } from 'react';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import { continueFormatWords, HUB_NEXT_STEP } from '@/copy/learning-hub';
import { stateWords } from '@/copy/state-copy';
import {
  deviceNeedsWords,
  formatCode,
  HUB_PAGE,
  noLicenceForYouWords,
  resourcesNoneOpenedWords,
  resourcesOpenedWords,
  simulationAvailabilityWords,
  simulationProgressWords,
  stepWords,
} from '@/copy/student';
import { formatPageAddress, hubTabAddress } from '@/nav/student-hub';

import { HubFallback, HubHeader, HubTabs, type HubView, useHubPage } from '../shared/hub-frame';
import { type Closure, givenFormats } from '../shared/student-view';

/**
 * ST-05 Experiment hub — board B2-12 (f0 … f3, f5; B2-13 f3; B3-12), at
 * `/student/experiments/[experimentId]`, with ST-19 "Experiment not available" in its place
 * (B2-11 f12, B2-12 f4, f6).
 *
 * - **Read**: `StudentAccessService.getExperimentHub` — the published page, the Student's
 *   availability per format (available to you / not included for your institution / not
 *   available for this experiment / not available right now) and progress per format, the
 *   resources opened and the assessment — read side by side, never one derived from another
 *   (BC3); the frame (`shared/hub-frame`) adds the course code (T-17) and the closure (XS-08).
 * - **Phase 3**: the tab strip (Overview · Resources · Simulation · Progress), the header's one
 *   Next step (`ST-05.next-step`: B2-12 f0 "open the resources", f1 "continue in your browser";
 *   otherwise "choose a format", provisional — T-16, nothing is locked) and the cards' actions
 *   ("Open resources" → ST-06; "Choose a format" → ST-07, "Continue WEB" → ST-08 while WEB is in
 *   progress). "Assessment" (tab and card action, Phase 4) is not rendered (DEV-21).
 * - **ST-19**: a refusal or an open decision renders the message page in place (shell placement
 *   "My courses / Not available"): not given (B2-11 f12), no longer given (B2-12 f4; also for
 *   SACC-14, `ST-19.sacc-14`), ended (B2-12 f6), undecided (OD-B2-01, OD-B2-02, GRP-05).
 */
export function ExperimentHub({ experimentId }: { readonly experimentId: string }) {
  const state = useHubPage(experimentId, 'overview');
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  const { view } = state;
  const next = nextStepOf(view.hub, view.closure);
  return (
    <PageContent wrap="wide">
      <HubHeader
        view={view}
        overview={{
          nextStep: next ? <NextStep experimentId={experimentId} step={next} /> : null,
        }}
      />
      <HubTabs experimentId={experimentId} name={view.hub.experiment.name} current="overview" />
      <div className="xw-stack">
        <NextSteps experimentId={experimentId} view={view} />
        <About hub={view.hub} course={view.course} />
        {view.hub.experiment.learningOutcomes.length > 0 ? <Outcomes hub={view.hub} /> : null}
      </div>
    </PageContent>
  );
}

/** The header's one Next step (`ST-05.next-step`). */
type NextStepKind = 'open-resources' | 'continue-web' | 'choose-format';

/**
 * Where the Student stands (B2-12 "Next step follows the student’s real position"): nothing while
 * the experiment is closed (paused f3, inactive, a licence wait) or nothing is left to open; WEB in
 * progress → continue it (f1); nothing opened or started → the resources (f0, f2, f5); otherwise a
 * format (provisional). A suggestion only — nothing is locked (T-16), opening a resource completes
 * nothing (T-13).
 */
export function nextStepOf(hub: HubAnswer, closure: Closure): NextStepKind | null {
  if (closure !== null || hub.row.closure !== null) return null;
  const open = givenFormats(hub.row).filter((entry) => entry.availability === 'available-to-you');
  if (open.length === 0) return null;
  if (open.some((entry) => entry.format === 'web' && entry.progress === 'in-progress')) {
    return 'continue-web';
  }
  const started = open.some((entry) => entry.progress !== 'not-started');
  if (!started && hub.resourceSummary.total > 0 && hub.resourceSummary.opened === 0) {
    return 'open-resources';
  }
  return open.every((entry) => entry.progress === 'completed') ? null : 'choose-format';
}

function nextStepTarget(experimentId: string, step: NextStepKind): string {
  switch (step) {
    case 'open-resources':
      return hubTabAddress(experimentId, 'resources');
    case 'continue-web':
      return formatPageAddress(experimentId, 'web');
    case 'choose-format':
      return hubTabAddress(experimentId, 'simulation');
  }
}

/** B2-12 f0: "Next step: …" (14 px, indigo-200) over the one primary button with the next icon. */
function NextStep({
  experimentId,
  step,
}: {
  readonly experimentId: string;
  readonly step: NextStepKind;
}) {
  const [line, action] =
    step === 'open-resources'
      ? [HUB_NEXT_STEP.openResourcesLine, HUB_NEXT_STEP.openResources]
      : step === 'continue-web'
        ? [HUB_NEXT_STEP.continueWebLine, continueFormatWords('web')]
        : [stateWords('ST-05.next-step-choose'), HUB_NEXT_STEP.chooseFormat];
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-[14px] text-indigo-200">{line}</span>
      <Link className="xr-btn xr-btn--primary" href={nextStepTarget(experimentId, step)}>
        {action}
        <Icon name="next" />
      </Link>
    </div>
  );
}

function NextSteps({
  experimentId,
  view,
}: {
  readonly experimentId: string;
  readonly view: HubView;
}) {
  const { hub, closure } = view;
  const headingId = useId();
  const given = givenFormats(hub.row);
  const { total, opened } = hub.resourceSummary;
  // A supplied licence wait (B3-02, PC-45): the header keeps "Available to you" as B3-02 draws it;
  // the Simulation step says why nothing opens now.
  const waitingPlan =
    hub.row.closure?.kind === 'waiting-for-a-licence' ? hub.row.closure.planId : null;
  // The cards' actions open the tabs (B2-12 f0, f1); none while nothing opens (f3,
  // `ST-05.card-actions`).
  const acting = closure === null && waitingPlan === null;

  const resources =
    closure === 'paused' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{HUB_PAGE.pausedResources}</StepText>
    ) : closure === 'inactive' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{stateWords('ST-05.inactive-resources')}</StepText>
    ) : (
      <>
        <StepText>
          {total === 0
            ? stateWords('ST-05.no-resources')
            : opened === 0
              ? resourcesNoneOpenedWords(total)
              : resourcesOpenedWords(total, opened)}
        </StepText>
        {acting ? (
          <StepAction href={hubTabAddress(experimentId, 'resources')}>
            {HUB_NEXT_STEP.openResources}
          </StepAction>
        ) : null}
      </>
    );

  const started = given.some((entry) => entry.progress !== 'not-started');
  const webInProgress = given.some(
    (entry) =>
      entry.format === 'web' &&
      entry.availability === 'available-to-you' &&
      entry.progress === 'in-progress',
  );
  const simulation =
    closure === 'paused' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{HUB_PAGE.pausedSimulation}</StepText>
    ) : closure === 'inactive' ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{stateWords('ST-05.inactive-simulation')}</StepText>
    ) : waitingPlan !== null ? (
      <StepText meta={HUB_PAGE.nothingToDo}>{noLicenceForYouWords(waitingPlan)}</StepText>
    ) : given.length === 0 ? null : (
      <>
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
        {webInProgress ? (
          <StepAction href={formatPageAddress(experimentId, 'web')}>
            {continueFormatWords('web')}
          </StepAction>
        ) : (
          <StepAction href={hubTabAddress(experimentId, 'simulation')}>
            {HUB_NEXT_STEP.chooseFormat}
          </StepAction>
        )}
      </>
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

/** A card's one action (`a.xr-btn.xr-btn--secondary`, B2-12 f0, f1). */
function StepAction({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <Link className="xr-btn xr-btn--secondary" href={href}>
      {children}
    </Link>
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
