'use client';

import { StLaunchCard, StLaunchDevice, StLaunchPage, StLaunchSetup } from '@xr/ui/v3';
import { useId, useState } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import {
  cantUseTitle,
  FORMAT_PAGE,
  FORMAT_PANEL,
  formatPageTitle,
  LAUNCH_V3,
  pausedLaunchWords,
  setUpTitle,
  setupSteps,
  setupWords,
} from '@/copy/formats';
import { NO_LICENCE_TELL_MORE } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { formatCode, HOME_PAGE } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import {
  formatPlacement,
  MY_DEVICE_ADDRESS,
  type PackageFormat,
  packageFormatOf,
} from '@/nav/student-formats';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
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
} from './format-parts';
import { useFormatModel } from './format-model';
import type { FormatPageAnswer, PanelState } from './format-view';

/**
 * ST-09 AR / VR / MR format — setup and progress — at
 * `/student/experiments/[experimentId]/simulation/[format]`, as the V3 Student export draws it
 * (ST-v1 `StudentFinal.dc.html`, `is.fpage` and `fpageVM` for VR; `msg('ar' | 'mr')` for the
 * refusals). `format` is the address's own text: only `ar`, `vr` and `mr` have a page; anything
 * else — `web` (ST-08's page), `VR`, an unknown word — is not found (`ST-09.address`).
 *
 * - **Reads** (`useFormatModel`): `LearningService.getFormatPage` — the format's progress view
 *   ("In progress" from the last reported session, "Completed" only from the system's record:
 *   BC3, T-12), its delivery (the published setup steps), the gate and the Student's authorised
 *   device; the experiment hub (crumb, availability per format, the closure); once Completed,
 *   `FeedbackService.getFeedbackState` for this format (BC5); for the refusals, the experiment's
 *   progress views ("Formats you can use").
 * - **States**: Not started → "Set up VR", the steps open; In progress → "Continue on your headset",
 *   the steps behind "View setup steps"; Completed → "Give feedback on VR" when `eligible`, or "See
 *   your feedback" once sent; paused; a supplied licence wait; an inactive account; a format not in
 *   the institution's access, or not published for the experiment — the compact refusal with the
 *   formats the Student can use.
 * - **No launch button** — the format runs on the headset. The setup steps are information only
 *   (T-14): no store, download, MDM or delivery promise; the authorised headset (a fixture or an
 *   approved transfer recorded it) links to My device; it is not shown while paused or waiting.
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
          { title: formatPageTitle(format), code: formatCode(format) },
          { id: experimentId, name: model.hub?.experiment.name ?? null },
        ),
  );
  const retried = useRetryFocus(outcome !== null);
  const loading = <FormatLoading label={stateWords('ST-09.loading')} />;

  if (model.failed) {
    return (
      <FormatFailed
        title={stateWords('ST-09.failed')}
        onRetry={() => {
          retried();
          model.retry();
        }}
      />
    );
  }
  if (outcome === 'not-found') return navigation.notFound();
  if (outcome === null) return loading;
  if (outcome.kind === 'not-available') {
    if (model.publishedPending) return loading;
    return <NotAvailable kind={outcome.refusal} name={model.publishedName} />;
  }
  if (!model.hub) return loading;
  if (outcome.kind !== 'panel') {
    if (model.formats === null) return loading;
    return (
      <FormatRefusal
        experimentId={experimentId}
        format={format}
        view={outcome}
        hub={model.hub}
        session={model.session}
        progress={model.formats}
      />
    );
  }
  if (!model.page) return loading;
  return (
    <>
      <FormatHead
        experimentId={experimentId}
        hub={model.hub}
        format={format}
        session={model.session}
        status={headStatus(model.page, outcome.panel)}
      />
      <StLaunchPage>
        <HeadsetLaunch
          experimentId={experimentId}
          format={format}
          page={model.page}
          panel={outcome.panel}
        />
        <AboutFormat format={format} />
      </StLaunchPage>
    </>
  );
}

/** The launch surface per state (`fpageVM`, a headset format). */
function HeadsetLaunch({
  experimentId,
  format,
  page,
  panel,
}: {
  readonly experimentId: string;
  readonly format: PackageFormat;
  readonly page: FormatPageAnswer;
  readonly panel: PanelState;
}) {
  const titleId = useId();
  const stepsId = useId();
  // The steps are open the first time, while nothing is reported (`u.setup === null`).
  const [setupOpen, setSetupOpen] = useState<boolean | null>(null);
  const device =
    page.authorisedDevice &&
    (panel.kind === 'not-started' || panel.kind === 'in-progress' || panel.kind === 'completed') ? (
      <StLaunchDevice
        label={LAUNCH_V3.device}
        device={page.authorisedDevice.description}
        link={{ href: MY_DEVICE_ADDRESS, label: FORMAT_PANEL.myDevice }}
      />
    ) : null;

  switch (panel.kind) {
    case 'not-started':
    case 'in-progress': {
      const open = setupOpen ?? panel.kind === 'not-started';
      const published = 'setupSteps' in page.delivery ? page.delivery.setupSteps : [];
      const steps = setupSteps(setupWords(format), published).map((step, index) => ({
        key: `${index} ${step.text}`,
        title: step.text,
        detail: step.sub ?? '',
      }));
      return (
        <StLaunchCard
          title={panel.kind === 'not-started' ? setUpTitle(format) : FORMAT_PANEL.inProgressTitle}
          titleId={titleId}
          description={
            panel.kind === 'in-progress'
              ? LAUNCH_V3.vrInProgress
              : format === 'vr'
                ? LAUNCH_V3.vrNotStarted
                : setupWords(format).runs
          }
          sections={
            <>
              {device}
              <StLaunchSetup
                open={open}
                label={open ? LAUNCH_V3.hideSetupSteps : FORMAT_PANEL.viewSetupSteps}
                stepsId={stepsId}
                steps={steps}
                onToggle={() => setSetupOpen(!open)}
              />
            </>
          }
          foot={<LaunchFoot />}
        />
      );
    }
    case 'completed': {
      const done = completedLaunch(
        experimentId,
        format,
        panel.feedback,
        FORMAT_PANEL.completedText,
      );
      return (
        <StLaunchCard
          title={FORMAT_WORDS.completed(format)}
          titleId={titleId}
          description={done.description}
          sections={device}
          foot={<LaunchFoot />}
        >
          {done.action}
        </StLaunchCard>
      );
    }
    case 'paused':
      return (
        <StLaunchCard
          title={cantUseTitle(format)}
          titleId={titleId}
          description={pausedLaunchWords(format, page.progress.status)}
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
