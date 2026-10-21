'use client';

import type { ExperimentHub as HubAnswer, ServiceError } from '@xr/contracts/draft';
import type { FormatProgressView } from '@xr/domain';
import {
  ButtonLink,
  StAssessmentLine,
  StHoldNote,
  StHubProgressCard,
  StLoading,
  StProgressBlock,
  StProgressOff,
  type StProgressRow,
  StProgressTable,
  StStateRow,
} from '@xr/ui/v3';
import { useId } from 'react';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import {
  EXPERIMENT_PROGRESS_PAGE,
  HUB_ASSESSMENT_ACTIONS,
  PROGRESS_TAB_V3,
} from '@/copy/learning-hub';
import {
  NO_LICENCE_FOR_YOU,
  progressCaption,
  ST_ACTION_WORDS,
  ST_FORMAT_NAMES,
  ST_LABELS,
  ST_OFF_WORDS,
  ST_PROGRESS_COLUMNS,
  ST_STATE_WORDS,
} from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { formatFeedbackAddress, formatPageAddress } from '@/nav/student-hub';
import { useSimulationChooser } from '@/queries/learning';

import {
  formatActionOf,
  formatChipOf,
  formatFactsOf,
  formatHoldWords,
  offFormatRowsOf,
  primaryActionIndex,
  progressPillOf,
  sharedHoldOf,
} from '../shared/format-progress';
import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { hubFormatOrder } from '../shared/student-view';

/**
 * ST-10 Progress for this experiment, a tab of the experiment hub, at
 * `/student/experiments/[experimentId]/progress`, as the V3 Student export draws it (ST-v1
 * `StudentFinal.dc.html`, `HB.isPT`, `progTabVM` → `progExp`, the same rows as ST-15 Progress):
 * one surface — "Your progress, format by format" with "Given by your institution" — the licence
 * wait said once, then the per-format table (format, progress, details, one action), the formats
 * not available to the Student, and the assessment line.
 *
 * - **Reads**, side by side (BC3): availability per format from the hub row (`getExperimentHub`,
 *   via the hub frame); progress per format from `LearningService.getSimulationChooser` — the
 *   experiment's own progress views (the dates the runtime reported, the completion the system
 *   recorded, the feedback the service offers; T-12, BC5), refused exactly as the hub is; the
 *   assessment's state from the hub read. No per-row read.
 * - **One row per given format**: its access, Not started · In progress · Completed <date>, the
 *   dated facts, and — while it opens now — one action ("Continue WEB", "Open VR", "Give feedback
 *   on WEB"; gold once: continue, then feedback, then open). No percentage, no experiment-level
 *   verdict (T-13). A pause or an inactive account: the shell's banner says it; the rows keep the
 *   progress, with no action.
 * - **Assessment**: its state in words ("Not set by your faculty yet"; the Student's status words)
 *   and, to do / in progress / released, its link. The assessment's name and deadline are not in
 *   the hub read: left out.
 */
export function ExperimentProgress({ experimentId }: { readonly experimentId: string }) {
  const read = useSimulationChooser(experimentId);
  const answer = read.data;
  const readError: ServiceError | null = answer && !answer.ok ? answer.error : null;
  const state = useHubPage(experimentId, 'progress', readError);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="progress">
      <ProgressCard
        experimentId={experimentId}
        view={state.view}
        progress={answer?.ok ? answer.value : null}
        failed={read.isError}
        retry={() => void read.refetch()}
      />
    </HubTabPage>
  );
}

function ProgressCard({
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
  const ids = { title: useId(), off: useId() };
  const { hub, closure } = view;
  const name = hub.experiment.name;
  // The hub's head already says "Your institution can tell you more." (`progTabVM`).
  const hold = sharedHoldOf(hub.row.closure, closure) ? NO_LICENCE_FOR_YOU : null;
  const off = offFormatRowsOf(hub.row.formats);

  let body;
  if (failed || progress === null) {
    // The assessment's words come from the hub read: they stay while the progress loads or fails.
    body = (
      <>
        {failed ? (
          <StStateRow
            icon="cloudAlert"
            tone="err"
            alert
            title={stateWords('ST-10.failed')}
            description={ST_STATE_WORDS.failedLine}
            action={{ label: ST_STATE_WORDS.tryAgain, onClick: retry }}
          />
        ) : (
          <StLoading label={stateWords('ST-10.loading')} />
        )}
        <StProgressBlock flat>
          <AssessmentLine assessment={hub.assessment} />
        </StProgressBlock>
      </>
    );
  } else {
    body = (
      <StProgressBlock flat>
        <StProgressTable
          caption={progressCaption(name)}
          columns={ST_PROGRESS_COLUMNS}
          rows={formatRows(experimentId, view, progress)}
        />
        {off.length > 0 ? (
          <StProgressOff title={ST_OFF_WORDS.title} titleId={ids.off} rows={off} />
        ) : null}
        <AssessmentLine assessment={hub.assessment} />
      </StProgressBlock>
    );
  }

  return (
    <StHubProgressCard
      title={EXPERIMENT_PROGRESS_PAGE.heading}
      titleId={ids.title}
      intro={PROGRESS_TAB_V3.intro}
      note={PROGRESS_TAB_V3.given}
    >
      {hold ? (
        <StHoldNote icon="clock" inTab>
          {hold}
        </StHoldNote>
      ) : null}
      {body}
    </StHubProgressCard>
  );
}

/** The table's rows (`progExp` `mine`): every given format, in the hub's order. */
function formatRows(
  experimentId: string,
  view: HubView,
  progress: readonly FormatProgressView[],
): StProgressRow[] {
  const { hub, closure } = view;
  const given = hubFormatOrder(hub.row).filter(
    (entry) =>
      entry.availability !== 'not-included-for-your-institution' &&
      entry.availability !== 'not-available-for-this-experiment',
  );
  const chips = given.map((entry) =>
    formatChipOf(entry.format, entry.availability, hub.row.closure, closure),
  );
  const opens = chips.find((chip) => chip.kind === 'on')?.code ?? null;
  const views = given.map((entry) => progress.find((item) => item.format === entry.format) ?? null);
  const actions = views.map((item, index) => (item ? formatActionOf(chips[index]!, item) : null));
  const primary = primaryActionIndex(actions);
  return given.flatMap((entry, index) => {
    const chip = chips[index]!;
    const item = views[index];
    if (!item) return [];
    const action = actions[index];
    const pill = progressPillOf(item);
    const href =
      action?.kind === 'feedback'
        ? formatFeedbackAddress(experimentId, entry.format)
        : formatPageAddress(experimentId, entry.format);
    return [
      {
        key: entry.format,
        chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph },
        name: ST_FORMAT_NAMES[chip.code],
        access: chip.access,
        status: { tone: pill.tone, words: pill.words },
        facts: formatFactsOf(item, formatHoldWords(chip, opens)),
        actions: action ? (
          <ButtonLink
            href={href}
            variant={index === primary ? 'primary' : 'default'}
            aria-label={ST_ACTION_WORDS.named(action.label, hub.experiment.name)}
          >
            {action.label}
          </ButtonLink>
        ) : undefined,
      },
    ];
  });
}

/**
 * The assessment line (`progExp` `asmt`): "Not set by your faculty yet", else the Student's status
 * words; to do "Open assessment", in progress "Continue attempt", released "See result".
 */
function AssessmentLine({ assessment }: { readonly assessment: HubAnswer['assessment'] }) {
  if ('kind' in assessment) {
    return (
      <StAssessmentLine label={ST_LABELS.assessment}>
        {PROGRESS_TAB_V3.noAssessment}
      </StAssessmentLine>
    );
  }
  const kind = assessment.result.kind;
  const link =
    kind === 'to-do'
      ? { href: studentAssessmentAddress(assessment.id), label: HUB_ASSESSMENT_ACTIONS.open }
      : kind === 'in-progress'
        ? {
            href: studentAssessmentAddress(assessment.id, 'attempt'),
            label: HUB_ASSESSMENT_ACTIONS.continue,
          }
        : kind === 'released'
          ? {
              href: studentAssessmentAddress(assessment.id, 'result'),
              label: HUB_ASSESSMENT_ACTIONS.result,
            }
          : undefined;
  return (
    <StAssessmentLine label={ST_LABELS.assessment} link={link}>
      {wordsOf(studentAssessmentWords(kind)) ?? ''}
    </StAssessmentLine>
  );
}
