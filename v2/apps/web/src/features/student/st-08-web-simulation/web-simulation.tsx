'use client';

import type { ExperimentId } from '@xr/domain';
import { Button, Icon, LoadingState, Notice, PageContent } from '@xr/ui';
import { useEffect, useId, useRef, useState } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import {
  experimentLine,
  FORMAT_PAGE,
  firstOpenedWords,
  lastSavedWords,
  noLicenceLine,
  WEB_PAGE,
} from '@/copy/formats';
import { stateWords } from '@/copy/state-copy';
import { HOME_PAGE } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import { formatPlacement } from '@/nav/student-formats';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { openPendingTab } from '../shared/new-tab';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import {
  BackToSimulation,
  CompletedRows,
  FormatMessage,
  FormatPanel,
  Meta,
  PanelActions,
  PanelText,
  PanelTitle,
  pausedWords,
  progressWords,
  StatusRow,
} from '../st-09-format/format-parts';
import { useFormatModel } from '../st-09-format/format-model';
import type { PanelState, ProgressMeta } from '../st-09-format/format-view';

/**
 * ST-08 WEB simulation — launch and resume — board B3-03 (f0 … f7; B3-12 f1; B3-13 f4 … f7), at
 * `/student/experiments/[experimentId]/simulation/web`, a page outside the hub's tabs.
 *
 * - **Reads** (`useFormatModel`): `LearningService.getFormatPage` for WEB — its progress view
 *   (runtime activity and the system's completion record, side by side: BC3), the WEB link and the
 *   gate; the experiment hub (crumb, availability, the licence wait's plan); the course code shown
 *   (T-17); and, once Completed, `FeedbackService.getFeedbackState` for WEB (BC5).
 * - **Status in words + one large action**: Not started → "Launch WEB" (f1); In progress, "Last
 *   saved …" → "Continue WEB" (f0); Completed (the record's date, "Reported by the simulation at …")
 *   → "Give feedback on WEB" only when `eligible` (f3), or "See your feedback" once sent (f4).
 *   Paused (f5) and a supplied licence wait (f6) show why nothing opens.
 * - **Command**: `LearningService.launchWebFormat` → "Opening the simulation…" → the returned link
 *   opens in a new tab (`noopener,noreferrer`) → "The simulation opened in a new tab…" (focus on the
 *   notice); a refusal or a failure → "The simulation didn’t open. Nothing was lost." + "Try again"
 *   (f2). TE-3 is unsigned: there is no runtime page or simulator here. The launch stores nothing
 *   (AD-16): the status stays as the service reports it until the runtime reports activity — no
 *   "I have finished", no self-report, no timer (T-12).
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
      <PageContent wrap="read">
        <StudentFailed
          title={stateWords('ST-08.failed')}
          onRetry={() => {
            retried();
            model.retry();
          }}
        />
      </PageContent>
    );
  }
  if (outcome === 'not-found') return navigation.notFound();
  if (outcome === null) return <WebLoading />;
  if (outcome.kind === 'not-available') {
    if (model.publishedPending) return <WebLoading />;
    return <NotAvailable kind={outcome.refusal} name={model.publishedName} />;
  }
  if (outcome.kind !== 'panel') {
    return (
      <PageContent wrap="read">
        <BackToSimulation experimentId={experimentId} gap={false} />
        <FormatMessage
          experimentId={experimentId}
          format="web"
          view={outcome}
          experimentName={model.hub?.experiment.name ?? ''}
        />
      </PageContent>
    );
  }
  return (
    <PageContent wrap="read">
      <BackToSimulation experimentId={experimentId} />
      <div className="xw-stack">
        <WebPanel experimentId={experimentId} panel={outcome.panel} onRefused={model.refetchPage} />
        <AboutWeb name={model.hub?.experiment.name ?? ''} code={model.code} />
      </div>
    </PageContent>
  );
}

function WebLoading() {
  return (
    <PageContent wrap="read">
      <LoadingState label={stateWords('ST-08.loading')} surface="section" />
    </PageContent>
  );
}

/** The panel's state, then (f5, f6, inactive) the text actions outside it, as the board draws. */
function WebPanel({
  experimentId,
  panel,
  onRefused,
}: {
  readonly experimentId: string;
  readonly panel: PanelState;
  readonly onRefused: () => void;
}) {
  switch (panel.kind) {
    case 'not-started':
    case 'in-progress':
      return (
        <FormatPanel format="web" label={WEB_PAGE.title}>
          <Launch experimentId={experimentId} panel={panel} onRefused={onRefused} />
          <PanelActions experimentId={experimentId} />
        </FormatPanel>
      );
    case 'completed':
      return (
        <FormatPanel format="web" label={WEB_PAGE.title}>
          <CompletedRows
            experimentId={experimentId}
            format="web"
            completedAt={panel.completedAt}
            reportedFrom={panel.reportedFrom}
            feedback={panel.feedback}
            eligibleText={WEB_PAGE.completedText}
          />
          <PanelActions experimentId={experimentId} />
        </FormatPanel>
      );
    case 'paused':
      return (
        <>
          <FormatPanel format="web" label={WEB_PAGE.title}>
            <StatusRow tone="paused" words={pausedWords()} />
            <PanelTitle>{FORMAT_WORDS.paused}</PanelTitle>
            <PanelText>{WEB_PAGE.pausedText}</PanelText>
          </FormatPanel>
          <PanelActions experimentId={experimentId} />
        </>
      );
    case 'waiting':
      return (
        <>
          <FormatPanel format="web" label={WEB_PAGE.title}>
            <StatusRow tone="wait" words={FORMAT_PAGE.waitingForLicence} />
            <PanelTitle>{FORMAT_PAGE.notAvailableYet}</PanelTitle>
            {panel.planId ? <PanelText>{noLicenceLine(panel.planId)}</PanelText> : null}
          </FormatPanel>
          <PanelActions experimentId={experimentId} />
        </>
      );
    case 'inactive':
      return (
        <>
          <FormatPanel format="web" label={WEB_PAGE.title}>
            <PanelTitle>{HOME_PAGE.inactiveTitle}</PanelTitle>
            <PanelText>{HOME_PAGE.inactiveLine}</PanelText>
          </FormatPanel>
          <PanelActions experimentId={experimentId} />
        </>
      );
  }
}

function metaWords(meta: ProgressMeta): string | null {
  switch (meta.kind) {
    case 'last':
      return lastSavedWords(meta.at);
    case 'first':
      return firstOpenedWords(meta.at);
    case 'none':
      return null;
  }
}

/**
 * B3-03 f0, f1, f2, f7: the status, the title, what WEB needs, the notices, the one large action
 * and "Opens in a new tab". The launch runs the command, then opens the returned link; nothing is
 * stored and nothing here changes the status (AD-16).
 */
function Launch({
  experimentId,
  panel,
  onRefused,
}: {
  readonly experimentId: string;
  readonly panel: Extract<PanelState, { kind: 'not-started' | 'in-progress' }>;
  readonly onRefused: () => void;
}) {
  const launch = useCommand((ports) => ports.learning.launchWebFormat);
  const [result, setResult] = useState<{ readonly opened: boolean; readonly failed: boolean }>({
    opened: false,
    failed: false,
  });
  // The notice takes focus when it appears (B3-03 script `focus(pid + '-msg')`).
  const [focusNotice, setFocusNotice] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const noticeId = useId();
  const newTabId = useId();
  useEffect(() => {
    if (focusNotice > 0) noticeRef.current?.focus();
  }, [focusNotice]);

  const started = panel.kind === 'in-progress';
  const meta = panel.kind === 'in-progress' ? metaWords(panel.meta) : null;

  const go = async () => {
    setResult((current) => ({ ...current, failed: false }));
    // The tab opens in the click's own task (a popup blocker refuses one opened after the answer);
    // it gets the published WEB link once the service gives it.
    const tab = openPendingTab();
    let opened = false;
    try {
      const answer = await launch.run({ experimentId: experimentId as ExperimentId });
      if (answer.ok && tab) {
        // The published WEB link, in the new tab; this page keeps the status (B3-03 "How it works").
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
    <>
      <StatusRow
        tone={started ? 'wait' : 'off'}
        words={progressWords(panel.kind)}
        meta={meta ? <Meta>{meta}</Meta> : undefined}
      />
      <PanelTitle>{started ? WEB_PAGE.inProgressTitle : WEB_PAGE.notStartedTitle}</PanelTitle>
      <div className="xl-inline xl-meta">
        <Icon name="monitor" size={16} />
        {WEB_PAGE.needs}
      </div>
      <div id={noticeId} ref={noticeRef} tabIndex={-1}>
        {result.opened && !result.failed ? <Notice tone="ok">{WEB_PAGE.opened}</Notice> : null}
        {result.failed ? (
          <Notice tone="err" title={WEB_PAGE.failedTitle}>
            {WEB_PAGE.failedLine}
          </Notice>
        ) : null}
      </div>
      <div className="xl-bigact">
        <Button
          variant="primary"
          busy={launch.busy}
          busyLabel={WEB_PAGE.opening}
          icon={result.failed ? 'tryAgain' : 'externalLink'}
          iconPosition={result.failed ? 'start' : 'end'}
          aria-describedby={newTabId}
          onClick={() => void go()}
        >
          {result.failed
            ? WEB_PAGE.tryAgain
            : started
              ? FORMAT_WORDS.continue('web')
              : FORMAT_WORDS.launch('web')}
        </Button>
        <span id={newTabId} className="xl-meta">
          {WEB_PAGE.opensInNewTab}
        </span>
      </div>
    </>
  );
}

/** "About WEB" (B3-03 f0 … f7): Experiment, How it works, Completed means. */
function AboutWeb({ name, code }: { readonly name: string; readonly code: string | null }) {
  const headingId = useId();
  const rows: readonly (readonly [string, string])[] = [
    [WEB_PAGE.experiment, experimentLine(name, code)],
    [WEB_PAGE.howItWorks, WEB_PAGE.howItWorksLine],
    [WEB_PAGE.completedMeans, WEB_PAGE.completedMeansLine],
  ];
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {WEB_PAGE.about}
        </h2>
      </div>
      <div className="xr-section-body">
        <dl className="xp-kv m-0 grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
          {rows.map(([term, value]) => (
            <KeyValue key={term} term={term} value={value} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function KeyValue({ term, value }: { readonly term: string; readonly value: string }) {
  return (
    <>
      <dt className="font-[700] text-ink">{term}</dt>
      <dd className="m-0 text-ink-2">{value}</dd>
    </>
  );
}
