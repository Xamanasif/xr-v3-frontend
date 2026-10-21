'use client';

import type { ExperimentId } from '@xr/domain';
import { Notice, StLaunchCard, StLaunchGo, StLaunchPage } from '@xr/ui/v3';
import { useEffect, useId, useRef, useState } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import { FORMAT_PAGE, pausedLaunchWords, WEB_PAGE } from '@/copy/formats';
import { NO_LICENCE_TELL_MORE } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { HOME_PAGE } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import { formatPlacement } from '@/nav/student-formats';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { openPendingTab } from '../shared/new-tab';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../shared/not-available';
import { useRetryFocus } from '../shared/student-states';
import {
  AboutFormat,
  completedLaunch,
  FormatFailed,
  FormatHead,
  FormatLoading,
  FormatRefusal,
  headStatus,
  LaunchFoot,
} from '../st-09-format/format-parts';
import { useFormatModel } from '../st-09-format/format-model';
import type { FormatPageAnswer, PanelState } from '../st-09-format/format-view';

/**
 * ST-08 WEB simulation — launch and resume — at `/student/experiments/[experimentId]/simulation/web`,
 * a page outside the hub's tabs, as the V3 Student export draws it (ST-v1 `StudentFinal.dc.html`,
 * `is.fpage`, `fpageVM`): the head (crumbs, the WEB chip and the experiment, "WEB simulation", the
 * status pill and its line), one launch surface (what to do now, the one large action and its
 * hint, the notices, the help foot) and "About WEB".
 *
 * - **Reads** (`useFormatModel`): `LearningService.getFormatPage` for WEB — its progress view
 *   (runtime activity and the system's completion record, side by side: BC3), the WEB link and the
 *   gate; the experiment hub (crumb, availability, the closure); the course code shown (T-17); and,
 *   once Completed, `FeedbackService.getFeedbackState` for WEB (BC5).
 * - **Status in words + one large action**: Not started → "Launch WEB"; In progress, "Last saved
 *   …" → "Continue WEB"; Completed ("Reported by the simulation at …") → "Give feedback on WEB" only
 *   when `eligible`, or "See your feedback" once sent. Paused and a supplied licence wait say why
 *   nothing opens (no plan named — lead decision 3).
 * - **Command**: `LearningService.launchWebFormat` → "Opening the simulation…" → the returned link
 *   opens in a new tab (the Phase-7 sample activity, reporting to this tab, in the product build) →
 *   "The simulation opened in a new tab…" (focus on the notice); a refusal or a failure → "The
 *   simulation didn’t open. Nothing was lost." + "Try again" (focus on the notice). The launch
 *   stores nothing (AD-16): the status stays as the service reports it until the runtime reports
 *   activity — no "I have finished", no self-report, no timer (T-12), no stage (lead decision 1:
 *   the export's in-tab ST-08a activity and its three stages are not built).
 */
export function WebSimulation({ experimentId }: { readonly experimentId: string }) {
  const navigation = useAppNavigation();
  const model = useFormatModel(experimentId, 'web');
  const { outcome } = model;

  useShellPage(
    outcome !== null && outcome !== 'not-found' && outcome.kind === 'not-available'
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : formatPlacement(
          'ST-08',
          { title: WEB_PAGE.title, code: 'WEB' },
          { id: experimentId, name: model.hub?.experiment.name ?? null },
        ),
  );
  const retried = useRetryFocus(outcome !== null);

  if (model.failed) {
    return (
      <FormatFailed
        title={stateWords('ST-08.failed')}
        onRetry={() => {
          retried();
          model.retry();
        }}
      />
    );
  }
  if (outcome === 'not-found') return navigation.notFound();
  if (outcome === null) return <FormatLoading label={stateWords('ST-08.loading')} />;
  if (outcome.kind === 'not-available') {
    if (model.publishedPending) return <FormatLoading label={stateWords('ST-08.loading')} />;
    return <NotAvailable kind={outcome.refusal} name={model.publishedName} />;
  }
  if (!model.hub) return <FormatLoading label={stateWords('ST-08.loading')} />;
  if (outcome.kind !== 'panel') {
    if (model.formats === null) return <FormatLoading label={stateWords('ST-08.loading')} />;
    return (
      <FormatRefusal
        experimentId={experimentId}
        format="web"
        view={outcome}
        hub={model.hub}
        session={model.session}
        progress={model.formats}
      />
    );
  }
  if (!model.page) return <FormatLoading label={stateWords('ST-08.loading')} />;
  return (
    <>
      <FormatHead
        experimentId={experimentId}
        hub={model.hub}
        format="web"
        session={model.session}
        status={headStatus(model.page, outcome.panel)}
      />
      <StLaunchPage>
        <WebLaunch
          experimentId={experimentId}
          page={model.page}
          panel={outcome.panel}
          onRefused={model.refetchPage}
        />
        <AboutFormat format="web" />
      </StLaunchPage>
    </>
  );
}

/** The launch surface per state (`fpageVM`, WEB). */
function WebLaunch({
  experimentId,
  page,
  panel,
  onRefused,
}: {
  readonly experimentId: string;
  readonly page: FormatPageAnswer;
  readonly panel: PanelState;
  readonly onRefused: () => void;
}) {
  const titleId = useId();
  switch (panel.kind) {
    case 'not-started':
    case 'in-progress':
      return (
        <Launch
          experimentId={experimentId}
          titleId={titleId}
          started={panel.kind === 'in-progress'}
          onRefused={onRefused}
        />
      );
    case 'completed': {
      const done = completedLaunch(experimentId, 'web', panel.feedback, WEB_PAGE.completedText);
      return (
        <StLaunchCard
          title={FORMAT_WORDS.completed('web')}
          titleId={titleId}
          description={done.description}
          foot={<LaunchFoot />}
        >
          {done.action}
        </StLaunchCard>
      );
    }
    case 'paused':
      return (
        <StLaunchCard
          title={FORMAT_WORDS.paused}
          titleId={titleId}
          description={pausedLaunchWords('web', page.progress.status)}
          foot={<LaunchFoot />}
        />
      );
    case 'waiting':
      return (
        <StLaunchCard
          title={FORMAT_PAGE.notAvailableYet}
          titleId={titleId}
          description={NO_LICENCE_TELL_MORE}
          foot={<LaunchFoot />}
        />
      );
    case 'inactive':
      return (
        <StLaunchCard
          title={HOME_PAGE.inactiveTitle}
          titleId={titleId}
          description={HOME_PAGE.inactiveLine}
          foot={<LaunchFoot />}
        />
      );
  }
}

/**
 * Not started or in progress: the title, how WEB runs, the notices, the one large action and its
 * hint "Opens in a new tab". The launch runs the command, then opens the returned link; nothing is
 * stored and nothing here changes the status (AD-16).
 */
function Launch({
  experimentId,
  titleId,
  started,
  onRefused,
}: {
  readonly experimentId: string;
  readonly titleId: string;
  readonly started: boolean;
  readonly onRefused: () => void;
}) {
  const launch = useCommand((ports) => ports.learning.launchWebFormat);
  const [result, setResult] = useState<{ readonly opened: boolean; readonly failed: boolean }>({
    opened: false,
    failed: false,
  });
  // The notice takes focus when it appears (the export's `focusId('st-launch-err')`).
  const [focusNotice, setFocusNotice] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const errorId = useId();
  const okId = useId();
  const hintId = useId();
  useEffect(() => {
    if (focusNotice > 0) noticeRef.current?.focus();
  }, [focusNotice]);

  const go = async () => {
    setResult((current) => ({ ...current, failed: false }));
    // The tab opens in the click's own task (a popup blocker refuses one opened after the answer);
    // it gets the published WEB link once the service gives it.
    const tab = openPendingTab();
    let opened = false;
    try {
      const answer = await launch.run({ experimentId: experimentId as ExperimentId });
      if (answer.ok && tab) {
        // The WEB link, in the new tab; this page keeps the status.
        tab.go(answer.value.href);
        opened = true;
      } else {
        tab?.cancel();
        // A refusal (a pause, a wait) changes what the page can say: read it again.
        if (!answer.ok) onRefused();
      }
    } catch {
      // `unavailable`: nothing was stored, and the blank tab is closed.
      tab?.cancel();
    }
    setResult((current) => ({ opened: opened || current.opened, failed: !opened }));
    setFocusNotice((count) => count + 1);
  };

  return (
    <StLaunchCard
      title={started ? WEB_PAGE.inProgressTitle : WEB_PAGE.notStartedTitle}
      titleId={titleId}
      description={WEB_PAGE.howItWorksLine}
      foot={<LaunchFoot />}
    >
      {result.failed ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          className="sv-launch-err"
          ref={noticeRef}
          id={errorId}
          title={WEB_PAGE.failedTitle}
        >
          {WEB_PAGE.failedLine}
        </Notice>
      ) : result.opened ? (
        <Notice ref={noticeRef} id={okId} tone="ok" role="status" title={WEB_PAGE.opened} />
      ) : null}
      <StLaunchGo
        action={{
          kind: 'button',
          label: launch.busy
            ? WEB_PAGE.opening
            : result.failed
              ? WEB_PAGE.tryAgain
              : started
                ? FORMAT_WORDS.continue('web')
                : FORMAT_WORDS.launch('web'),
          busy: launch.busy,
          onLaunch: () => void go(),
          describedBy: hintId,
        }}
        hint={{ id: hintId, text: WEB_PAGE.opensInNewTab }}
      />
    </StLaunchCard>
  );
}
