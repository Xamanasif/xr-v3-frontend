'use client';

import { Icon, LoadingState, PageContent } from '@xr/ui';
import { useId } from 'react';

import {
  cantUseTitle,
  FORMAT_PAGE,
  FORMAT_PANEL,
  firstSessionWords,
  formatTitle,
  lastSessionWords,
  noLicenceLine,
  setUpTitle,
  setupSteps,
  setupWords,
} from '@/copy/formats';
import { stateWords } from '@/copy/state-copy';
import { formatCode, HOME_PAGE } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import { formatPlacement, type PackageFormat, packageFormatOf } from '@/nav/student-formats';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import {
  BackToSimulation,
  CompletedRows,
  DeviceBlock,
  FormatMessage,
  FormatPanel,
  Meta,
  PanelActions,
  PanelText,
  PanelTitle,
  pausedWords,
  progressWords,
  SetupStepList,
  StatusRow,
} from './format-parts';
import { useFormatModel } from './format-model';
import type { FormatPageAnswer, PanelState, ProgressMeta } from './format-view';

/**
 * ST-09 AR / VR / MR format — setup and progress — board B3-04 (f0 … f7; B3-12 f3; B3-13 f8 …
 * f11), at `/student/experiments/[experimentId]/simulation/[format]`. `format` is the address's
 * own text: only `ar`, `vr` and `mr` have a page; anything else — `web` (ST-08's static page),
 * `VR`, an unknown word — is not found (`ST-09.address`).
 *
 * - **Reads** (`useFormatModel`): `LearningService.getFormatPage` — the format's progress view
 *   ("In progress" from the last reported session, "Completed" only from the system's record:
 *   BC3, T-12), its delivery (the published setup steps and the device needed), the gate and the
 *   Student's authorised device; the experiment hub (crumb, availability per format, the licence
 *   wait); and, once Completed, `FeedbackService.getFeedbackState` for this format (BC5).
 * - **States**: In progress → "Continue on your headset" (f0); Not started → "Set up VR", the
 *   steps open (f1, f7); Completed → "Give feedback on VR" when `eligible` (f2), or "See your
 *   feedback" once sent (`ST-09.feedback-sent`); paused (f5); a format not in the institution's
 *   access (f3) or not published for the experiment (f4) as message pages; a supplied licence wait
 *   and an inactive account in B3-03's patterns.
 * - **No launch button** — the format runs on the headset or in the phone app. The setup steps are
 *   information only (T-14): no store, download, MDM or delivery promise; the device block shows
 *   the authorised device a fixture or an approved transfer recorded, and links to My device.
 */
export function FormatPage({
  experimentId,
  format,
}: {
  readonly experimentId: string;
  readonly format: string;
}) {
  const navigation = useAppNavigation();
  const known = packageFormatOf(format);
  if (known === null) return navigation.notFound();
  return <PackageFormatPage experimentId={experimentId} format={known} />;
}

function PackageFormatPage({
  experimentId,
  format,
}: {
  readonly experimentId: string;
  readonly format: PackageFormat;
}) {
  const navigation = useAppNavigation();
  const model = useFormatModel(experimentId, format);
  const { outcome } = model;

  useShellPage(
    outcome !== null && outcome !== 'not-found' && outcome.kind === 'not-available'
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : formatPlacement(
          'ST-09',
          { title: formatTitle(format), code: formatCode(format) },
          { id: experimentId, name: model.hub?.experiment.name ?? null },
        ),
  );
  const retried = useRetryFocus(outcome !== null);

  if (model.failed) {
    return (
      <PageContent wrap="read">
        <StudentFailed
          title={stateWords('ST-09.failed')}
          onRetry={() => {
            retried();
            model.retry();
          }}
        />
      </PageContent>
    );
  }
  if (outcome === 'not-found') return navigation.notFound();
  if (outcome === null) return <FormatLoading />;
  if (outcome.kind === 'not-available') {
    if (model.publishedPending) return <FormatLoading />;
    return <NotAvailable kind={outcome.refusal} name={model.publishedName} />;
  }
  if (outcome.kind !== 'panel') {
    return (
      <PageContent wrap="read">
        <BackToSimulation experimentId={experimentId} gap={false} />
        <FormatMessage
          experimentId={experimentId}
          format={format}
          view={outcome}
          experimentName={model.hub?.experiment.name ?? ''}
        />
      </PageContent>
    );
  }
  const page = model.page;
  if (!page) return <FormatLoading />;
  const panel = outcome.panel;
  const steps =
    panel.kind === 'not-started' || panel.kind === 'in-progress' ? (
      <SetupSection format={format} page={page} open={panel.kind === 'not-started'} />
    ) : null;
  return (
    <PageContent wrap="read">
      <BackToSimulation experimentId={experimentId} />
      <div className="xw-stack">
        <FormatPanel format={format} label={formatTitle(format)}>
          <PanelRows experimentId={experimentId} format={format} panel={panel} />
          {page.authorisedDevice && showsDevice(panel) ? (
            <DeviceBlock description={page.authorisedDevice.description} />
          ) : null}
          <PanelActions experimentId={experimentId} />
        </FormatPanel>
        {steps}
      </div>
    </PageContent>
  );
}

function FormatLoading() {
  return (
    <PageContent wrap="read">
      <LoadingState label={stateWords('ST-09.loading')} surface="section" />
    </PageContent>
  );
}

/** The device block is drawn with the format's progress (f0, f1, f2, f7), not while paused (f5). */
function showsDevice(panel: PanelState): boolean {
  return panel.kind === 'not-started' || panel.kind === 'in-progress' || panel.kind === 'completed';
}

function metaWords(meta: ProgressMeta): string | null {
  switch (meta.kind) {
    case 'last':
      return lastSessionWords(meta.at);
    case 'first':
      return firstSessionWords(meta.at);
    case 'none':
      return null;
  }
}

/** The panel's rows above the device block, per drawn state. */
function PanelRows({
  experimentId,
  format,
  panel,
}: {
  readonly experimentId: string;
  readonly format: PackageFormat;
  readonly panel: PanelState;
}) {
  const words = setupWords(format);
  switch (panel.kind) {
    case 'not-started':
      return (
        <>
          <StatusRow
            tone="off"
            words={progressWords('not-started')}
            meta={<Meta>{words.needs}</Meta>}
          />
          <PanelTitle>{setUpTitle(format)}</PanelTitle>
          <PanelText>{words.runs}</PanelText>
        </>
      );
    case 'in-progress': {
      const meta = metaWords(panel.meta);
      return (
        <>
          <StatusRow
            tone="wait"
            words={progressWords('in-progress')}
            meta={meta ? <Meta>{meta}</Meta> : undefined}
          />
          <PanelTitle>{FORMAT_PANEL.inProgressTitle}</PanelTitle>
          <PanelText>{FORMAT_PANEL.inProgressText}</PanelText>
        </>
      );
    }
    case 'completed':
      return (
        <CompletedRows
          experimentId={experimentId}
          format={format}
          completedAt={panel.completedAt}
          reportedFrom={panel.reportedFrom}
          feedback={panel.feedback}
          eligibleText={FORMAT_PANEL.completedText}
        />
      );
    case 'paused':
      return (
        <>
          <StatusRow tone="paused" words={pausedWords()} />
          <PanelTitle>{cantUseTitle(format)}</PanelTitle>
          <PanelText>{FORMAT_PANEL.pausedText}</PanelText>
        </>
      );
    case 'waiting':
      return (
        <>
          <StatusRow tone="wait" words={FORMAT_PAGE.waitingForLicence} />
          <PanelTitle>{FORMAT_PAGE.notAvailableYet}</PanelTitle>
          {panel.planId ? <PanelText>{noLicenceLine(panel.planId)}</PanelText> : null}
        </>
      );
    case 'inactive':
      return (
        <>
          <PanelTitle>{HOME_PAGE.inactiveTitle}</PanelTitle>
          <PanelText>{HOME_PAGE.inactiveLine}</PanelText>
        </>
      );
  }
}

/**
 * "View setup steps" (B3-04 f0, f1, f7): `details.xl-more` in its own section, open by default
 * while the format is Not started ("open by default the first time"). The steps are information
 * only (T-14; `ST-09.setup-steps`).
 */
function SetupSection({
  format,
  page,
  open,
}: {
  readonly format: PackageFormat;
  readonly page: FormatPageAnswer;
  readonly open: boolean;
}) {
  const summaryId = useId();
  const published = 'setupSteps' in page.delivery ? page.delivery.setupSteps : [];
  return (
    <section className="xr-section" aria-labelledby={summaryId}>
      <details className="xl-more px-6 pt-4 pb-5" open={open}>
        <summary id={summaryId}>
          {FORMAT_PANEL.viewSetupSteps}
          <Icon name="chevronDown" />
        </summary>
        <div className="xl-more-body">
          <SetupStepList steps={setupSteps(setupWords(format), published)} />
        </div>
      </details>
    </section>
  );
}
