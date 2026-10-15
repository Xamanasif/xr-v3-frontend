'use client';

import type { ExperimentHub as HubAnswer, ServiceError } from '@xr/contracts/draft';
import type { FormatProgressView, Technology } from '@xr/domain';
import { FormatBadge, Icon, Link, LoadingState, StatusPill, type StatusTone } from '@xr/ui';
import { type ReactNode, useId } from 'react';

import {
  continueFormatWords,
  feedbackSentWords,
  giveFeedbackOnWords,
  notMadeForWords,
  openFormatWords,
  SIMULATION_PAGE,
} from '@/copy/learning-hub';
import { stateWords } from '@/copy/state-copy';
import { formatCode, HUB_AVAILABILITY, noLicenceForYouWords } from '@/copy/student';
import { formatFeedbackAddress, formatPageAddress } from '@/nav/student-hub';
import { useFeedbackState, useSimulationChooser } from '@/queries/learning';

import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { chooserMeta, progressStatus } from '../shared/hub-progress';
import { StudentFailed } from '../shared/student-states';
import { hubFormatOrder, isGiven, policyOpenOf } from '../shared/student-view';

/**
 * ST-07 Simulation — choose a format, a tab of the experiment hub — board B3-02 f0 … f7 (B3-12
 * f0), at `/student/experiments/[experimentId]/simulation`.
 *
 * - **Reads**, side by side and never one derived from another (BC3): availability per format
 *   from the hub row (`getExperimentHub`, via the hub frame); progress per format from
 *   `LearningService.getSimulationChooser` (Completed only from the completion record the system
 *   wrote, In progress only from runtime activity — T-12); feedback per completed format from
 *   `FeedbackService.getFeedbackState` for that format alone (BC5).
 * - **One row per format, one status, one action** (B3-02 f0): "Open WEB" / "Continue WEB" open
 *   the WEB page (ST-08, where the launch happens; TE-3), "Open VR" its setup page (ST-09); the
 *   WEB action is the page's one primary while WEB is not completed (`ST-07.primary`). A
 *   completed format adds "Give feedback on <format>" when its feedback is eligible, or
 *   "Feedback sent <date>" (f2, f3). No percentage, no experiment-level "completed", no lock.
 * - **States**: first visit (f1), in progress (f0), completed (f2, f3), AR / MR say why in words,
 *   waiting for a licence (f4, supplied; never counted — D7), paused (f5), mobile (f7). Access
 *   ended (f6) is not reachable: the hub read refuses an ended access, which is ST-19 (B2-12 f6;
 *   `ST-07.ended`). Loading and failed are provisional (`ST-07.loading`, `ST-07.failed`).
 */
export function SimulationChooser({ experimentId }: { readonly experimentId: string }) {
  const chooser = useSimulationChooser(experimentId);
  const answer = chooser.data;
  const chooserError: ServiceError | null = answer && !answer.ok ? answer.error : null;
  const state = useHubPage(experimentId, 'simulation', chooserError);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="simulation">
      <p className="xr-body mt-0 mb-4 text-ink-2">{SIMULATION_PAGE.intro}</p>
      {chooser.isError ? (
        <StudentFailed title={stateWords('ST-07.failed')} onRetry={() => void chooser.refetch()} />
      ) : answer?.ok ? (
        <Chooser experimentId={experimentId} view={state.view} progress={answer.value} />
      ) : (
        <LoadingState label={stateWords('ST-07.loading')} surface="section" />
      )}
    </HubTabPage>
  );
}

type HubFormat = HubAnswer['row']['formats'][number];

function Chooser({
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
          {SIMULATION_PAGE.heading}
        </h2>
      </div>
      <ul className="xl-frows">
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
    </section>
  );
}

/** One `li.xl-frow`: the chip, the code as its heading, one line of meta, then status and action. */
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
  const open = availability === 'available-to-you';
  const waitingPlan =
    view.hub.row.closure?.kind === 'waiting-for-a-licence' ? view.hub.row.closure.planId : null;
  const canAct = open && view.closure === null && waitingPlan === null;
  const completed = canAct && progress?.status === 'completed';
  const feedback = useFeedbackState(experimentId, format, completed);

  // Not given: the words say which "not" (f0); an undecided rule names nothing (`ST-07.policy-open`).
  if (!isGiven(availability)) {
    const policy = policyOpenOf(availability) !== null;
    return (
      <Row
        format={format}
        off
        meta={
          availability === 'not-included-for-your-institution'
            ? SIMULATION_PAGE.notIncluded
            : availability === 'not-available-for-this-experiment'
              ? notMadeForWords(format)
              : null
        }
        status={{
          tone: 'off',
          words: policy
            ? stateWords('ST-05.format-policy-open')
            : typeof availability === 'string'
              ? HUB_AVAILABILITY[availability]
              : '',
        }}
      />
    );
  }
  // Given, not available right now (D-26): said in words, nothing opens (`ST-07.not-right-now`).
  if (!open) {
    return (
      <Row
        format={format}
        off
        meta={null}
        status={{ tone: 'off', words: HUB_AVAILABILITY['not-available-right-now'] }}
      />
    );
  }
  // Rows stay; nothing opens; progress kept (f5) — an inactive account the same (`ST-07.inactive`).
  if (view.closure === 'paused') {
    return (
      <Row
        format={format}
        meta={SIMULATION_PAGE.pausedMeta}
        status={{ tone: 'paused', words: SIMULATION_PAGE.paused }}
      />
    );
  }
  if (view.closure === 'inactive') {
    return (
      <Row
        format={format}
        meta={stateWords('ST-05.inactive-simulation')}
        status={{ tone: 'off', words: stateWords('ST-05.inactive-format') }}
      />
    );
  }
  // Reason in words; no counting explanation (f4, D7).
  if (waitingPlan !== null) {
    return (
      <Row
        format={format}
        meta={noLicenceForYouWords(waitingPlan)}
        status={{ tone: 'wait', words: SIMULATION_PAGE.waiting }}
      />
    );
  }

  const status = progress ? progressStatus(progress) : null;
  const target = formatPageAddress(experimentId, format);
  const primary = format === 'web' && progress?.status !== 'completed';
  const action =
    format === 'web' && progress?.status === 'in-progress'
      ? continueFormatWords(format)
      : openFormatWords(format);
  const sent =
    feedback.data?.ok && feedback.data.value.state === 'sent' ? feedback.data.value : null;
  const eligible = feedback.data?.ok && feedback.data.value.state === 'eligible';
  return (
    <Row format={format} meta={progress ? chooserMeta(progress) : null} status={status}>
      {eligible ? (
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={formatFeedbackAddress(experimentId, format)}
        >
          {giveFeedbackOnWords(format)}
        </Link>
      ) : null}
      {sent ? (
        <span className="xl-inline xl-meta">
          <Icon name="done" size={16} />
          {feedbackSentWords(sent.feedback.sentAt)}
        </span>
      ) : null}
      <Link
        className={`xr-btn ${primary ? 'xr-btn--primary' : 'xr-btn--secondary'} xr-btn--sm`}
        href={target}
      >
        {action}
      </Link>
    </Row>
  );
}

function Row({
  format,
  off = false,
  meta,
  status,
  children,
}: {
  readonly format: Technology;
  readonly off?: boolean;
  readonly meta: string | null;
  readonly status: { readonly tone: StatusTone; readonly words: string } | null;
  readonly children?: ReactNode;
}) {
  return (
    <li className={off ? 'xl-frow is-off' : 'xl-frow'}>
      <div className="xl-frow-main">
        <FormatBadge format={formatCode(format)} variant={off ? 'off' : 'yours'} compact />
        <div className="xl-frow-text">
          <h3 className="xl-frow-title">{formatCode(format)}</h3>
          {meta ? <span className="xl-frow-meta">{meta}</span> : null}
        </div>
      </div>
      <div className="xl-frow-end">
        {status ? <StatusPill tone={status.tone}>{status.words}</StatusPill> : null}
        {children}
      </div>
    </li>
  );
}
