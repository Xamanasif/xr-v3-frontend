'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { FormatProgressView, Technology } from '@xr/domain';
import {
  StChooser,
  StChooserCard,
  StChooserCards,
  StChooserOff,
  StLoading,
  StOffRows,
  StShelfHead,
  StStateRow,
  StSubheading,
} from '@xr/ui/v3';
import { useId } from 'react';

import { setupWords } from '@/copy/formats';
import { CHOOSER_V3, HUB_OVERVIEW, SIMULATION_PAGE, yourHeadsetWords } from '@/copy/learning-hub';
import {
  NO_LICENCE_FOR_YOU,
  ST_ACTION_WORDS,
  ST_FACT_WORDS,
  ST_FORMAT_NAMES,
  ST_LABELS,
  ST_OFF_WORDS,
  ST_STATE_WORDS,
} from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { formatFeedbackAddress, formatPageAddress } from '@/nav/student-hub';
import { useMyDevice } from '@/queries/devices';
import { useSimulationChooser } from '@/queries/learning';

import {
  type FormatAction,
  type FormatChipView,
  formatChipOf,
  formatHoldWords,
  offFormatRowsOf,
  primaryActionIndex,
  progressPillOf,
} from '../shared/format-progress';
import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { hubFormatOrder } from '../shared/student-view';
import { hubNextStep, nextStepAddress } from '../st-05-experiment-hub/next-step';

/**
 * ST-07 Simulation — choose a format, a tab of the experiment hub, at
 * `/student/experiments/[experimentId]/simulation`, as the V3 Student export draws it (ST-v1
 * `StudentFinal.dc.html`, `HB.isSim`, `simVM`): the formats the Student can use as cards — the
 * chip and name, the access, what it needs, the authorised headset, its own progress and dated
 * facts, why a held format can't open, its actions — then the formats not available to the
 * Student as compact rows with the reason. The card whose action is the experiment's next step
 * carries the "Next step" tag. No stage tracker (lead decision 1: the sample activity's stages are
 * illustrative; the runtime holds first opened, last saved, last reported and sessions only).
 *
 * - **Reads**, side by side and never one derived from another (BC3): availability per format
 *   from the hub row (`getExperimentHub`, via the hub frame); progress per format from
 *   `LearningService.getSimulationChooser` (Completed only from the completion record the system
 *   wrote, In progress only from runtime activity — T-12; the feedback the service offers — BC5);
 *   the authorised headset from `OperationsService.getMyDevice` (one aggregate read, only while a
 *   headset format can open).
 * - **Actions** (`fmtRows` 'sim'): not started "Open <format>", in progress "Continue <format>",
 *   completed "Give feedback on <format>" while it is offered, then "Open <format>". The page's one
 *   gold action: continue, then feedback, then open. "Open WEB" leads to ST-08, where the launch
 *   happens (TE-3); a headset format to ST-09. No percentage, no experiment-level "completed".
 * - **States**: first visit, in progress, completed, a licence wait (said once in the note;
 *   never counted — D7), paused and an inactive account (the shell's banner says it; the cards keep
 *   the progress), a format not available right now (its reason on its card). Access ended is
 *   ST-19 (the hub read refuses it). Loading and failed (`ST-07.loading`, `ST-07.failed`).
 */
export function SimulationChooser({ experimentId }: { readonly experimentId: string }) {
  const chooser = useSimulationChooser(experimentId);
  const answer = chooser.data;
  const chooserError: ServiceError | null = answer && !answer.ok ? answer.error : null;
  const state = useHubPage(experimentId, 'simulation', chooserError);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="simulation">
      <Chooser
        experimentId={experimentId}
        view={state.view}
        progress={answer?.ok ? answer.value : null}
        failed={chooser.isError}
        retry={() => void chooser.refetch()}
      />
    </HubTabPage>
  );
}

function Chooser({
  experimentId,
  view,
  progress,
  failed,
  retry,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  /** `null` while loading or failed. */
  readonly progress: readonly FormatProgressView[] | null;
  readonly failed: boolean;
  readonly retry: () => void;
}) {
  const ids = { title: useId(), off: useId(), card: useId() };
  const { hub, closure } = view;
  const given = hubFormatOrder(hub.row).filter(
    (entry) =>
      entry.availability !== 'not-included-for-your-institution' &&
      entry.availability !== 'not-available-for-this-experiment',
  );
  const chips = given.map((entry) =>
    formatChipOf(entry.format, entry.availability, hub.row.closure, closure),
  );
  const headsetOpen = chips.some((chip) => chip.kind === 'on' && chip.code !== 'WEB');
  const device = useMyDevice(headsetOpen);
  const devices = device.data?.ok ? device.data.value.devices : [];
  const off = offFormatRowsOf(hub.row.formats);
  const waiting = hub.row.closure?.kind === 'waiting-for-a-licence' && closure !== 'paused';
  const note = waiting ? NO_LICENCE_FOR_YOU : SIMULATION_PAGE.intro;

  let body;
  if (failed) {
    body = (
      <StStateRow
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-07.failed')}
        description={ST_STATE_WORDS.failedLine}
        action={{ label: ST_STATE_WORDS.tryAgain, onClick: retry }}
      />
    );
  } else if (progress === null) {
    body = <StLoading label={stateWords('ST-07.loading')} />;
  } else {
    const shared = chips.some(
      (chip) => chip.held === 'paused' || chip.held === 'waiting' || chip.held === 'inactive',
    );
    const opens = chips.find((chip) => chip.kind === 'on')?.code ?? null;
    const next = hubNextStep(hub, closure, progress);
    const assessmentId = 'kind' in hub.assessment ? null : hub.assessment.id;
    const nextHref = next ? nextStepAddress(experimentId, next, assessmentId) : null;
    const views = given.map(
      (entry) => progress.find((item) => item.format === entry.format) ?? null,
    );
    const actions = given.map((entry, index) =>
      cardActions(experimentId, chips[index]!, views[index] ?? null, hub.experiment.name),
    );
    // Gold once: continue, then feedback, then open (`fmtRows`).
    const flat = actions.flatMap((list, card) =>
      list.map((action, index) => ({ card, index, action })),
    );
    const primary =
      flat[
        primaryActionIndex(
          flat.map((item) =>
            item.action.kind === 'view'
              ? null
              : { kind: item.action.kind, label: item.action.label },
          ),
        )
      ];
    body = (
      <StChooserCards label={CHOOSER_V3.cardsLabel}>
        {given.map((entry, index) => {
          const chip = chips[index]!;
          const progressView = views[index];
          const cardActionsList = actions[index]!.map((action, at) => ({
            key: action.kind,
            href: action.href,
            label: action.label,
            ariaLabel: action.ariaLabel,
            primary: primary !== undefined && primary.card === index && primary.index === at,
          }));
          const isNext =
            nextHref !== null && cardActionsList.some((action) => action.href === nextHref);
          const headset =
            chip.kind === 'on' && entry.format !== 'web'
              ? devices.find(
                  (item) =>
                    item.format === entry.format && item.usedFor.some((id) => id === experimentId),
                )
              : undefined;
          const pill = progressView ? progressPillOf(progressView) : null;
          return (
            <StChooserCard
              key={entry.format}
              chip={{ code: chip.code, kind: chip.kind, glyph: chip.glyph }}
              name={ST_FORMAT_NAMES[chip.code]}
              titleId={`${ids.card}-${entry.format}`}
              next={isNext ? ST_LABELS.nextStep : undefined}
              access={chip.access}
              need={needWords(entry.format)}
              device={headset ? yourHeadsetWords(headset.description) : undefined}
              status={
                pill
                  ? { tone: pill.tone, words: pill.words }
                  : { tone: 'neutral', words: ST_FACT_WORDS.webNotOpened }
              }
              facts={progressView ? cardFacts(progressView) : []}
              why={chip.kind === 'held' && !shared ? formatHoldWords(chip, opens) : undefined}
              actions={cardActionsList}
            />
          );
        })}
      </StChooserCards>
    );
  }

  return (
    <StChooser labelledBy={ids.title}>
      <StShelfHead title={SIMULATION_PAGE.heading} titleId={ids.title} note={note} />
      {body}
      {off.length > 0 ? (
        <StChooserOff>
          <StSubheading id={ids.off}>{ST_OFF_WORDS.title}</StSubheading>
          <StOffRows labelledBy={ids.off} rows={off} />
        </StChooserOff>
      ) : null}
    </StChooser>
  );
}

/** What a format needs and how it runs (`simVM` `need`). */
function needWords(format: Technology): string {
  if (format === 'web') return CHOOSER_V3.webNeed;
  if (format === 'vr') return CHOOSER_V3.vrNeed;
  return setupWords(format).runs;
}

/**
 * A card's dated facts (`simVM` `facts`): WEB — "Last saved …" (else "First opened …") in progress,
 * "Reported by the simulation at …" completed, "Not opened yet"; a headset format — "Last session
 * reported …", "Reported from the headset at …", "No headset session reported yet"; then, once
 * completed, "Feedback sent …" or "Feedback not given yet".
 */
function cardFacts(view: FormatProgressView): string[] {
  const facts: string[] = [];
  const { activity, completion } = view;
  if (view.format === 'web') {
    if (view.status === 'in-progress') {
      if (activity?.lastSavedAt) facts.push(ST_FACT_WORDS.lastSaved(activity.lastSavedAt));
      else if (activity?.firstOpenedAt) {
        facts.push(ST_FACT_WORDS.firstOpened(activity.firstOpenedAt));
      }
    }
    if (view.status === 'not-started') facts.push(ST_FACT_WORDS.webNotOpened);
  } else {
    const last = activity?.lastSessionReportedAt ?? activity?.firstOpenedAt ?? null;
    if (view.status === 'in-progress' && last) facts.push(ST_FACT_WORDS.lastSession(last));
    if (view.status === 'not-started') facts.push(ST_FACT_WORDS.noSession(view.format));
  }
  if (view.status === 'completed' && completion) {
    facts.push(
      completion.reportedFrom === 'simulation'
        ? ST_FACT_WORDS.reportedBySimulation(completion.completedAt)
        : ST_FACT_WORDS.reportedFromHeadset(completion.completedAt, view.format),
    );
    facts.push(
      typeof view.feedback === 'object'
        ? ST_FACT_WORDS.feedbackSent(view.feedback.sentAt)
        : HUB_OVERVIEW.feedbackNotGiven,
    );
  }
  return facts;
}

/** A card's action; a completed format's "Open" (`view`) is never the page's gold action. */
type CardAction = {
  readonly kind: FormatAction['kind'] | 'view';
  readonly label: string;
  readonly href: string;
  readonly ariaLabel: string;
};

/**
 * A card's actions (`fmtRows` 'sim'), only while the format opens now: completed — "Give feedback
 * on <format>" while offered, then "Open <format>"; in progress "Continue <format>"; not started
 * "Open <format>".
 */
function cardActions(
  experimentId: string,
  chip: FormatChipView,
  view: FormatProgressView | null,
  experimentName: string,
): CardAction[] {
  if (chip.kind !== 'on' || view === null) return [];
  const page = formatPageAddress(experimentId, view.format);
  const named = (label: string) => ST_ACTION_WORDS.named(label, experimentName);
  if (view.status === 'in-progress') {
    const label = ST_ACTION_WORDS.continue(chip.code);
    return [{ kind: 'continue', label, href: page, ariaLabel: named(label) }];
  }
  const open = ST_ACTION_WORDS.open(chip.code);
  const openAction: CardAction = { kind: 'open', label: open, href: page, ariaLabel: named(open) };
  if (view.status === 'completed' && view.feedback === 'offered') {
    const label = ST_ACTION_WORDS.feedback(chip.code);
    return [
      {
        kind: 'feedback',
        label,
        href: formatFeedbackAddress(experimentId, view.format),
        ariaLabel: named(label),
      },
      { ...openAction, kind: 'view' },
    ];
  }
  return [view.status === 'completed' ? { ...openAction, kind: 'view' } : openAction];
}
