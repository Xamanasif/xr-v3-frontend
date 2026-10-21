'use client';

import type { FormatProgressView, Technology } from '@xr/domain';
import {
  StAside,
  StHubAbout,
  type StHubAction,
  type StHubFormatRow,
  StHubFormatRows,
  StHubMain,
  StHubSection,
  StHubSideSection,
  StLoading,
  StOffRows,
  StOutcomes,
  StOverview,
  StSubheading,
} from '@xr/ui/v3';
import { useId } from 'react';

import { setupWords } from '@/copy/formats';
import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import {
  HUB_ASSESSMENT_ACTIONS,
  HUB_NEXT_STEP,
  HUB_OVERVIEW,
  resourcesOpenedLine,
} from '@/copy/learning-hub';
import {
  ST_ACTION_WORDS,
  ST_FACT_WORDS,
  ST_LABELS,
  ST_OFF_WORDS,
  ST_FORMAT_NAMES,
} from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { formatCode, HUB_PAGE } from '@/copy/student';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { formatFeedbackAddress, formatPageAddress, hubTabAddress } from '@/nav/student-hub';
import { useSimulationChooser } from '@/queries/learning';

import {
  type FormatChipView,
  formatActionOf,
  formatChipOf,
  formatHoldWords,
  offFormatRowsOf,
  progressPillOf,
} from '../shared/format-progress';
import { HubFailed, HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { hubFormatOrder } from '../shared/student-view';
import { hubNextStep, type NextStepKind, nextStepAddress } from './next-step';

/** The experiment's next step (the export's `nextStep`; test-imported under its Phase-3 name). */
export { hubNextStep as nextStepOf } from './next-step';

/**
 * ST-05 Experiment hub · Overview, at `/student/experiments/[experimentId]`, as the V3 Student
 * export draws it (ST-v1 `StudentFinal.dc.html`, `HB.isOverview`, `overviewVM`): one main surface
 * — what the experiment is (its description, engineering area and BITS course code), what you
 * learn, then "Formats and your progress" (your formats, each with its access, its own progress,
 * one fact and at most one action; then those not available to you) — and one aside: Learning
 * resources and Assessment, each with its action. The item whose action is the experiment's next
 * step (`./next-step`) carries the "Next step" tag and the page's one gold action. ST-19 in its
 * place for a refusal (the hub frame).
 *
 * - **Reads**: `StudentAccessService.getExperimentHub` (the published page, availability and
 *   progress per format, the resources summary, the assessment — through the hub frame) and, side
 *   by side, `LearningService.getSimulationChooser` — the experiment's progress views (the dates
 *   the runtime reported, the completion the system recorded, the feedback the service offers;
 *   BC3, T-12). One aggregate read more than Phase 3; no per-row read.
 * - **Left out** (no read holds them on this page): the aside's per-resource rows (the hub holds
 *   the summary only — "1 of 3 opened."), the assessment's name and deadline (the hub holds its
 *   state only: its status words).
 */
export function ExperimentHub({ experimentId }: { readonly experimentId: string }) {
  const chooser = useSimulationChooser(experimentId);
  const answer = chooser.data;
  const state = useHubPage(experimentId, 'overview', answer && !answer.ok ? answer.error : null);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="overview">
      {chooser.isError ? (
        <HubFailed title={stateWords('ST-05.failed')} onRetry={() => void chooser.refetch()} />
      ) : answer?.ok ? (
        <Overview experimentId={experimentId} view={state.view} progress={answer.value} />
      ) : (
        <StLoading label={stateWords('ST-05.loading')} />
      )}
    </HubTabPage>
  );
}

function Overview({
  experimentId,
  view,
  progress,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  readonly progress: readonly FormatProgressView[];
}) {
  const ids = {
    about: useId(),
    outcomes: useId(),
    formats: useId(),
    mine: useId(),
    off: useId(),
    resources: useId(),
    assessment: useId(),
  };
  const { hub, closure } = view;
  const name = hub.experiment.name;
  const next = hubNextStep(hub, closure, progress);
  const assessmentId = 'kind' in hub.assessment ? null : hub.assessment.id;
  const nextHref = next ? nextStepAddress(experimentId, next, assessmentId) : null;
  const held = closure !== null || hub.row.closure !== null;

  const rows = formatRows(experimentId, view, progress, next, nextHref);
  const off = offFormatRowsOf(hub.row.formats);
  const outcomes = hub.experiment.learningOutcomes;
  const { total, opened } = hub.resourceSummary;

  const resourcesHref = hubTabAddress(experimentId, 'resources');
  const resourcesNext = nextHref !== null && nextHref === resourcesHref;
  const assessment = assessmentSide(hub.assessment, name);
  const assessmentNext =
    assessment.action !== undefined && nextHref !== null && assessment.action.href === nextHref;

  return (
    <StOverview>
      <StHubMain>
        <StHubAbout
          title={HUB_OVERVIEW.about}
          titleId={ids.about}
          description={hub.experiment.description}
          area={hub.experiment.areaName}
          code={
            hub.experiment.platformCode
              ? { label: HUB_OVERVIEW.bitsCode, value: hub.experiment.platformCode }
              : undefined
          }
        />
        {outcomes.length > 0 ? (
          <StHubSection
            title={HUB_OVERVIEW.outcomes}
            titleId={ids.outcomes}
            note={HUB_OVERVIEW.sameInEveryFormat}
          >
            <StOutcomes flat items={outcomes} />
          </StHubSection>
        ) : null}
        <StHubSection
          title={HUB_OVERVIEW.formats}
          titleId={ids.formats}
          note={HUB_OVERVIEW.eachOwnProgress}
        >
          {rows.length > 0 ? (
            <>
              <StSubheading id={ids.mine}>{HUB_OVERVIEW.yourFormats}</StSubheading>
              <StHubFormatRows labelledBy={ids.mine} rows={rows} />
            </>
          ) : null}
          {off.length > 0 ? (
            <>
              <StSubheading id={ids.off}>{ST_OFF_WORDS.title}</StSubheading>
              <StOffRows labelledBy={ids.off} rows={off} />
            </>
          ) : null}
        </StHubSection>
      </StHubMain>
      <StAside as="div">
        <StHubSideSection
          title={HUB_OVERVIEW.resources}
          titleId={ids.resources}
          next={resourcesNext ? ST_LABELS.nextStep : undefined}
          description={resourcesLine(view, total, opened)}
          action={
            held
              ? undefined
              : {
                  href: resourcesHref,
                  label: HUB_NEXT_STEP.openResources,
                  ariaLabel: ST_ACTION_WORDS.named(HUB_NEXT_STEP.openResources, name),
                  primary: resourcesNext,
                }
          }
        />
        <StHubSideSection
          title={HUB_OVERVIEW.assessment}
          titleId={ids.assessment}
          next={assessmentNext ? ST_LABELS.nextStep : undefined}
          description={assessment.line}
          action={assessment.action ? { ...assessment.action, primary: assessmentNext } : undefined}
        />
      </StAside>
    </StOverview>
  );
}

/**
 * "Your formats" (`overviewVM` `mine`): every format given to the Student (or held by an undecided
 * rule), in the hub's order, with its chip and access, its own progress, one fact and — available
 * now — its one action: in progress "Continue WEB" / "Open VR", not started "Open <format>",
 * completed with feedback offered "Give feedback on <format>". A pause, a licence wait or an
 * inactive account holds every format: the page says it once, the rows keep the progress.
 */
function formatRows(
  experimentId: string,
  view: HubView,
  progress: readonly FormatProgressView[],
  next: NextStepKind | null,
  nextHref: string | null,
): StHubFormatRow[] {
  const { hub, closure } = view;
  const given = hubFormatOrder(hub.row).filter(
    (entry) =>
      entry.availability !== 'not-included-for-your-institution' &&
      entry.availability !== 'not-available-for-this-experiment',
  );
  const chips = given.map((entry) =>
    formatChipOf(entry.format, entry.availability, hub.row.closure, closure),
  );
  const shared = chips.some(
    (chip) => chip.held === 'paused' || chip.held === 'waiting' || chip.held === 'inactive',
  );
  const opens = chips.find((chip) => chip.kind === 'on')?.code ?? null;
  // "Choose a format" leads to the Simulation tab: the first format to open carries the tag.
  const firstOpen =
    next === 'choose-format'
      ? given.find(
          (entry, index) => chips[index]!.kind === 'on' && entry.progress === 'not-started',
        )?.format
      : undefined;
  return given.map((entry, index) => {
    const chip = chips[index]!;
    const format = entry.format;
    const viewOf = progress.find((item) => item.format === format) ?? notStartedView(format, entry);
    const action = rowAction(experimentId, chip, viewOf, hub.experiment.name);
    const isNext =
      action !== null && ((nextHref !== null && action.href === nextHref) || firstOpen === format);
    const pill = progressPillOf(viewOf);
    return {
      key: format,
      chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph },
      name: ST_FORMAT_NAMES[chip.code],
      access: chip.access,
      next: isNext ? ST_LABELS.nextStep : undefined,
      status: { tone: pill.tone, words: pill.words },
      facts: rowFact(chip, viewOf, shared, opens) ?? undefined,
      action: action ? { ...action, primary: isNext } : undefined,
    };
  });
}

/** A format's one fact on the Overview (`overviewVM` `facts`). */
function rowFact(
  chip: FormatChipView,
  view: FormatProgressView,
  shared: boolean,
  opens: ReturnType<typeof formatCode> | null,
): string | null {
  const feedback =
    typeof view.feedback === 'object'
      ? ST_FACT_WORDS.feedbackSent(view.feedback.sentAt)
      : HUB_OVERVIEW.feedbackNotGiven;
  if (chip.kind !== 'on' && !shared) return formatHoldWords(chip, opens);
  if (chip.kind !== 'on') {
    if (view.status === 'completed') return feedback;
    return view.status === 'in-progress' ? HUB_OVERVIEW.progressKept : null;
  }
  if (view.status === 'completed') return feedback;
  if (view.status === 'in-progress') {
    const activity = view.activity;
    if (view.format === 'web') {
      if (activity?.lastSavedAt) return ST_FACT_WORDS.lastSaved(activity.lastSavedAt);
    } else if (activity?.lastSessionReportedAt) {
      return ST_FACT_WORDS.lastSession(activity.lastSessionReportedAt);
    }
    return activity?.firstOpenedAt
      ? view.format === 'web'
        ? ST_FACT_WORDS.firstOpened(activity.firstOpenedAt)
        : ST_FACT_WORDS.firstSession(activity.firstOpenedAt)
      : null;
  }
  if (view.format === 'web') return HUB_OVERVIEW.webRuns;
  if (view.format === 'vr') return HUB_OVERVIEW.vrNeeds;
  return setupWords(view.format).needs;
}

/** The row's action and its destination; a headset format in progress reads "Open VR" (the hub rule). */
function rowAction(
  experimentId: string,
  chip: FormatChipView,
  view: FormatProgressView,
  experimentName: string,
): StHubAction | null {
  const action = formatActionOf(chip, view);
  if (action === null) return null;
  const label =
    action.kind === 'continue' && view.format !== 'web'
      ? ST_ACTION_WORDS.open(chip.code)
      : action.label;
  return {
    href:
      action.kind === 'feedback'
        ? formatFeedbackAddress(experimentId, view.format)
        : formatPageAddress(experimentId, view.format),
    label,
    ariaLabel: ST_ACTION_WORDS.named(label, experimentName),
  };
}

/** The chooser answers one view per published format; a given format without one reads not started. */
function notStartedView(
  format: Technology,
  entry: { readonly progress: FormatProgressView['status'] },
): FormatProgressView {
  return {
    experimentId: '' as FormatProgressView['experimentId'],
    format,
    status: entry.progress === 'completed' ? 'in-progress' : entry.progress,
    completion: null,
    activity: null,
    beforePause: false,
    feedback: 'not-offered',
  };
}

/** Learning resources' one sentence (`overviewVM` `res.d`), the hub's summary only. */
function resourcesLine(view: HubView, total: number, opened: number): string {
  const { closure, hub } = view;
  if (closure === 'paused' || hub.row.closure?.kind === 'institution-paused') {
    return HUB_OVERVIEW.resourcesPaused;
  }
  if (closure === 'inactive' || hub.row.closure?.kind === 'student-inactive') {
    return stateWords('ST-05.inactive-resources');
  }
  if (hub.row.closure?.kind === 'waiting-for-a-licence') return HUB_OVERVIEW.resourcesWaiting;
  if (total === 0) return stateWords('ST-05.no-resources');
  return opened === 0 ? HUB_OVERVIEW.noneOpened : resourcesOpenedLine(opened, total);
}

/**
 * The aside's Assessment (`overviewVM` `as`): none set — "Your faculty hasn’t set an assessment
 * for this experiment yet."; else its status in words and its one action: to do "Open
 * assessment" (ST-12), in progress "Continue attempt" (ST-13), submitted or not released "View",
 * released "See result" (ST-14).
 */
function assessmentSide(
  assessment: HubView['hub']['assessment'],
  experimentName: string,
): { readonly line: string; readonly action?: StHubAction } {
  if ('kind' in assessment) return { line: HUB_PAGE.noAssessment };
  const kind = assessment.result.kind;
  const line = wordsOf(studentAssessmentWords(kind)) ?? '';
  const [label, href] =
    kind === 'to-do'
      ? [HUB_ASSESSMENT_ACTIONS.open, studentAssessmentAddress(assessment.id)]
      : kind === 'in-progress'
        ? [HUB_ASSESSMENT_ACTIONS.continue, studentAssessmentAddress(assessment.id, 'attempt')]
        : kind === 'released'
          ? [HUB_ASSESSMENT_ACTIONS.result, studentAssessmentAddress(assessment.id, 'result')]
          : [HUB_ASSESSMENT_ACTIONS.view, studentAssessmentAddress(assessment.id, 'result')];
  return {
    line,
    action: { href, label, ariaLabel: ST_ACTION_WORDS.named(label, experimentName) },
  };
}
