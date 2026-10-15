'use client';

import type { ExperimentHub as HubAnswer, ServiceError } from '@xr/contracts/draft';
import type { FormatProgressView } from '@xr/domain';
import { FormatBadge, Icon, Link, LoadingState, StatusPill } from '@xr/ui';
import { type ReactNode, useId } from 'react';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import {
  completedBeforePauseWords,
  continueFormatWords,
  EXPERIMENT_PROGRESS_PAGE,
  feedbackSentWords,
  giveFeedbackOnWords,
  openFormatWords,
} from '@/copy/learning-hub';
import { stateWords } from '@/copy/state-copy';
import { formatCode, HUB_AVAILABILITY, HUB_PAGE, STUDENT_WORDS } from '@/copy/student';
import { formatFeedbackAddress, formatPageAddress } from '@/nav/student-hub';
import { useFeedbackState, useSimulationChooser } from '@/queries/learning';

import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { activityWords, progressStatus } from '../shared/hub-progress';
import { StudentFailed } from '../shared/student-states';
import { hubFormatOrder, isGiven, policyOpenOf } from '../shared/student-view';

/**
 * ST-10 Progress for this experiment, a tab of the experiment hub — board B3-01 f8 … f12 (B3-12
 * f2), at `/student/experiments/[experimentId]/progress`.
 *
 * - **Reads**, side by side (BC3): availability per format from the hub row (`getExperimentHub`,
 *   via the hub frame); progress per format from `LearningService.getSimulationChooser` — the
 *   experiment's own progress views, the same per-format reading as Progress (ST-15,
 *   `getMyProgress`) and refused exactly as the hub is; feedback per completed format from
 *   `FeedbackService.getFeedbackState` for that format alone (BC5); the assessment's words from
 *   the hub read.
 * - **One row per format** (f8): Not started · In progress (last save) · Completed (the date the
 *   system wrote, T-12) → "Give feedback on <format>" when eligible, or "Feedback sent <date>"
 *   (f10, f12); "Open VR" / "Continue WEB" plain links to the format's page while it is not
 *   completed (f8, f9). AR and MR say why in words. No percentage, no experiment-level verdict
 *   (T-13). Paused: each given format "Paused" with its progress before the pause (f11).
 * - **Assessment**: neutral words only — "Your faculty hasn’t set an assessment for this
 *   experiment yet." (f8); a set assessment's status words without any action (Phase 4,
 *   `ST-10.assessment-set`, DEV-21).
 */
export function ExperimentProgress({ experimentId }: { readonly experimentId: string }) {
  const read = useSimulationChooser(experimentId);
  const answer = read.data;
  const readError: ServiceError | null = answer && !answer.ok ? answer.error : null;
  const state = useHubPage(experimentId, 'progress', readError);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="progress">
      <div className="xw-stack">
        {read.isError ? (
          <StudentFailed title={stateWords('ST-10.failed')} onRetry={() => void read.refetch()} />
        ) : answer?.ok ? (
          <FormatList experimentId={experimentId} view={state.view} progress={answer.value} />
        ) : (
          <LoadingState label={stateWords('ST-10.loading')} surface="section" />
        )}
        <Assessment hub={state.view.hub} />
      </div>
    </HubTabPage>
  );
}

type HubFormat = HubAnswer['row']['formats'][number];

function FormatList({
  experimentId,
  view,
  progress,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  readonly progress: readonly FormatProgressView[];
}) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {EXPERIMENT_PROGRESS_PAGE.heading}
        </h2>
      </div>
      <div className="px-6 pb-6">
        <ul className="xl-fl" aria-label={EXPERIMENT_PROGRESS_PAGE.listLabel}>
          {hubFormatOrder(view.hub.row).map((entry) => (
            <FormatRow
              key={entry.format}
              experimentId={experimentId}
              view={view}
              entry={entry}
              progress={progress.find((item) => item.format === entry.format) ?? null}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function FormatRow({
  experimentId,
  view,
  entry,
  progress,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  readonly entry: HubFormat;
  readonly progress: FormatProgressView | null;
}) {
  const { format, availability } = entry;
  const paused = view.closure === 'paused' || progress?.beforePause === true;
  // Nothing opens while paused, inactive or waiting for a licence (`ST-10.closed`).
  const canAct =
    availability === 'available-to-you' &&
    !paused &&
    view.closure === null &&
    view.hub.row.closure === null;
  const completed = canAct && progress?.status === 'completed';
  const feedback = useFeedbackState(experimentId, format, completed);

  if (!isGiven(availability)) {
    // AR / MR: the words only, no action (f8).
    return (
      <li className="is-off">
        <span className="xl-fl-fmt">
          <FormatBadge format={formatCode(format)} variant="off" compact />
          <span>{formatCode(format)}</span>
        </span>
        <span className="xl-fl-state">
          {policyOpenOf(availability) !== null
            ? stateWords('ST-05.format-policy-open')
            : typeof availability === 'string'
              ? HUB_AVAILABILITY[availability]
              : ''}
        </span>
        <span className="xl-fl-act" />
      </li>
    );
  }

  let state: ReactNode = null;
  if (progress && paused) {
    // Progress kept, shown as before the pause (f11).
    state = (
      <>
        <StatusPill tone="paused">{STUDENT_WORDS.paused}</StatusPill>
        <span>{beforePauseWords(progress)}</span>
      </>
    );
  } else if (progress) {
    const status = progressStatus(progress);
    const activity = activityWords(progress);
    state = (
      <>
        <StatusPill tone={status.tone}>{status.words}</StatusPill>
        {activity ? <span>{activity}</span> : null}
        {availability === 'not-available-right-now' ? (
          // Given, not available right now (D-26): said beside its progress (`ST-10.not-right-now`).
          <span>{HUB_AVAILABILITY['not-available-right-now']}</span>
        ) : null}
      </>
    );
  }

  let action: ReactNode = null;
  if (canAct && progress?.status === 'completed') {
    const answer = feedback.data?.ok ? feedback.data.value : null;
    if (answer?.state === 'eligible') {
      action = (
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={formatFeedbackAddress(experimentId, format)}
        >
          {giveFeedbackOnWords(format)}
        </Link>
      );
    } else if (answer?.state === 'sent') {
      action = (
        <span className="xl-inline xl-meta">
          <Icon name="done" size={16} />
          {feedbackSentWords(answer.feedback.sentAt)}
        </span>
      );
    }
  } else if (canAct && progress) {
    action = (
      <Link href={formatPageAddress(experimentId, format)}>
        {format === 'web' && progress.status === 'in-progress'
          ? continueFormatWords(format)
          : openFormatWords(format)}
      </Link>
    );
  }

  return (
    <li>
      <span className="xl-fl-fmt">
        <FormatBadge format={formatCode(format)} variant="yours" compact />
        <strong className="text-ink">{formatCode(format)}</strong>
      </span>
      <span className="xl-fl-state">{state}</span>
      <span className="xl-fl-act">{action}</span>
    </li>
  );
}

/** "Completed 14 Oct 2026 before the pause", "Not started before the pause" (f11). */
function beforePauseWords(progress: FormatProgressView): string {
  switch (progress.status) {
    case 'completed':
      // Completed is read only with the completion record (BC3), so the date is always there.
      return progress.completion ? completedBeforePauseWords(progress.completion.completedAt) : '';
    case 'in-progress':
      return stateWords('ST-10.in-progress-before-pause');
    case 'not-started':
      return EXPERIMENT_PROGRESS_PAGE.notStartedBeforePause;
  }
}

/** The assessment, in words only (f8; Phase 4 builds its actions). */
function Assessment({ hub }: { readonly hub: HubAnswer }) {
  const headingId = useId();
  const words =
    'kind' in hub.assessment
      ? HUB_PAGE.noAssessment
      : (wordsOf(studentAssessmentWords(hub.assessment.result.kind)) ?? '');
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {EXPERIMENT_PROGRESS_PAGE.assessment}
        </h2>
      </div>
      <div className="xr-section-body">
        <p className="xr-body m-0 text-ink-2">{words}</p>
      </div>
    </section>
  );
}
