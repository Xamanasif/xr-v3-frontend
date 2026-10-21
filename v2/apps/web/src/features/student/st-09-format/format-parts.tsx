'use client';

import type { ExperimentHub } from '@xr/contracts/draft';
import type { FormatProgressView, Technology } from '@xr/domain';
import {
  Breadcrumbs,
  ButtonLink,
  StatusPill,
  type StatusTone,
  StFormatChip,
  StLaunchAbout,
  StLaunchFoot,
  StLaunchGo,
  StLoading,
  StMessage,
  StRecordHead,
  StRefuse,
  type StRefuseItem,
} from '@xr/ui/v3';
import { type ReactNode, useId } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import {
  ABOUT_HEADSET,
  ABOUT_WEB,
  aboutFormatTitle,
  feedbackRecordedWords,
  FORMAT_PAGE,
  FORMAT_REFUSAL,
  formatPageTitle,
  formatRunWords,
  heldProgressWords,
  LAUNCH_V3,
  madeForLine,
  notIncludedLine,
  notIncludedTitle,
  notPublishedTitle,
  refusalKicker,
} from '@/copy/formats';
import {
  ST_ACCESS_WORDS,
  ST_ACTION_WORDS,
  ST_FACT_WORDS,
  ST_FORMAT_NAMES,
  ST_PROGRESS_WORDS,
  ST_STATE_WORDS,
} from '@/copy/st-shared';
import { formatCode } from '@/copy/student';
import {
  formatFeedbackAddress,
  REPORT_PROBLEM_ADDRESS,
  simulationAddress,
} from '@/nav/student-formats';
import { formatPageAddress, hubTabAddress } from '@/nav/student-hub';

import { formatChipOf, progressPillOf } from '../shared/format-progress';
import { useStudentTodayLine } from '../shared/use-today';
import type { Closure } from '../shared/student-view';
import { isGiven } from '../shared/student-view';
import type { CompletedFeedback, FormatPageAnswer, FormatView, PanelState } from './format-view';
import { progressMeta } from './format-view';

/**
 * The parts ST-08 (WEB simulation) and ST-09 (AR / VR / MR) share, as the V3 Student export draws
 * them (ST-v1 `StudentFinal.dc.html`, the `is.fpage` region and `fpageVM`; the AR / MR refusals,
 * `msg('ar' | 'mr')`): the head (the crumbs experiment › Simulation › the format, the format chip
 * and the experiment above the page's title, the status pill and its line), the completion's
 * feedback, the help foot and the "About" aside, and the refusal card with the formats the
 * Student can use. No stage is drawn (lead decision 1); "Back to Simulation" left the launch card
 * (the crumb keeps it; HANDOFF decision 4).
 */

/** The head's crumbs: the experiment (its Overview) › Simulation › the format. */
function FormatCrumbs({
  experimentId,
  experimentName,
  format,
}: {
  readonly experimentId: string;
  readonly experimentName: string;
  readonly format: Technology;
}) {
  return (
    <Breadcrumbs
      levels={[
        { label: experimentName, href: hubTabAddress(experimentId, 'overview') },
        { label: FORMAT_PAGE.simulation, href: simulationAddress(experimentId) },
      ]}
      current={formatCode(format)}
    />
  );
}

/**
 * The head's pill and line (`fpageVM` `pill`, `meta`): a pause "Paused", a licence wait "Waiting
 * for a licence", else the format's own progress; beside it the last activity ("Last saved …",
 * "Last session reported …"), the completion's report, or — while held — the progress kept.
 */
export function headStatus(
  page: FormatPageAnswer,
  panel: PanelState,
): { readonly tone: StatusTone; readonly words: string; readonly meta: string | null } {
  const progress = page.progress;
  const format = progress.format;
  const held = panel.kind === 'paused' || panel.kind === 'waiting';
  const meta = progressMeta(progress);
  const at = meta.kind === 'none' ? null : meta.at;
  let line: string | null = null;
  if (held) {
    if (progress.status === 'completed' && progress.completion) {
      line = ST_PROGRESS_WORDS.completed(progress.completion.completedAt);
    } else if (progress.status === 'in-progress' && at) {
      line = heldProgressWords(format, at);
    }
  } else if (progress.status === 'completed' && progress.completion) {
    line =
      progress.completion.reportedFrom === 'simulation'
        ? ST_FACT_WORDS.reportedBySimulation(progress.completion.completedAt)
        : ST_FACT_WORDS.reportedFromHeadset(progress.completion.completedAt);
  } else if (progress.status === 'in-progress' && meta.kind !== 'none') {
    line =
      format === 'web'
        ? meta.kind === 'last'
          ? ST_FACT_WORDS.lastSaved(meta.at)
          : ST_FACT_WORDS.firstOpened(meta.at)
        : meta.kind === 'last'
          ? ST_FACT_WORDS.lastSession(meta.at)
          : ST_FACT_WORDS.firstSession(meta.at);
  }
  if (panel.kind === 'paused') return { tone: 'paused', words: ST_ACCESS_WORDS.paused, meta: line };
  if (panel.kind === 'waiting') return { tone: 'warn', words: ST_ACCESS_WORDS.waiting, meta: line };
  const pill = progressPillOf(progress);
  return { tone: pill.tone, words: pill.words, meta: line };
}

/** The format page's head (`fpageVM`): crumbs, the format chip and the experiment, the title, the pill. */
export function FormatHead({
  experimentId,
  hub,
  format,
  session,
  status,
}: {
  readonly experimentId: string;
  readonly hub: ExperimentHub;
  readonly format: Technology;
  readonly session: Closure;
  readonly status: ReturnType<typeof headStatus>;
}) {
  const today = useStudentTodayLine();
  const availability =
    hub.row.formats.find((entry) => entry.format === format)?.availability ?? 'available-to-you';
  const chip = formatChipOf(format, availability, hub.row.closure, session);
  return (
    <StRecordHead
      breadcrumbs={
        <FormatCrumbs
          experimentId={experimentId}
          experimentName={hub.experiment.name}
          format={format}
        />
      }
      date={today}
      lead={<StFormatChip code={chip.code} kind={chip.kind} glyph={chip.glyph} />}
      context={hub.experiment.name}
      title={formatPageTitle(format)}
      meta={
        <>
          <StatusPill tone={status.tone}>{status.words}</StatusPill>
          {status.meta ? <span>{status.meta}</span> : null}
        </>
      }
    />
  );
}

/**
 * A completion's sentence and its one way on (`fpageVM`, completed): feedback offered — "Tell us
 * how this format worked for you." and the gold "Give feedback on WEB"; sent — "Thank you — your
 * feedback on WEB is recorded." and "See your feedback"; neither (`ST-08.completed-not-eligible`).
 */
export function completedLaunch(
  experimentId: string,
  format: Technology,
  feedback: CompletedFeedback,
  eligibleText: string,
): { readonly description: string | null; readonly action: ReactNode } {
  const href = formatFeedbackAddress(experimentId, format);
  if (feedback.kind === 'eligible') {
    return {
      description: eligibleText,
      action: (
        <StLaunchGo action={{ kind: 'link', href, label: FORMAT_WORDS.giveFeedback(format) }} />
      ),
    };
  }
  if (feedback.kind === 'sent') {
    return {
      description: feedbackRecordedWords(format),
      action: (
        <StLaunchGo
          action={{ kind: 'link', href, label: FORMAT_WORDS.seeFeedback, primary: false }}
        />
      ),
    };
  }
  return { description: null, action: null };
}

/** "Something not working? Reporting it doesn’t affect your progress." and "Report a problem". */
export function LaunchFoot() {
  return (
    <StLaunchFoot
      lead={LAUNCH_V3.helpLead}
      text={LAUNCH_V3.helpLine}
      report={{ href: REPORT_PROBLEM_ADDRESS, label: FORMAT_PAGE.reportProblem }}
    />
  );
}

/** "About WEB" / "About VR" (`fpageVM` `about`). */
export function AboutFormat({ format }: { readonly format: Technology }) {
  const titleId = useId();
  const rows =
    format === 'web'
      ? [
          { key: 'needs', term: ABOUT_WEB.needs, value: ABOUT_WEB.needsLine },
          { key: 'prototype', term: ABOUT_WEB.prototype, value: ABOUT_WEB.prototypeLine },
          {
            key: 'completed',
            term: ABOUT_WEB.completedMeans,
            value: ABOUT_WEB.completedMeansLine,
          },
        ]
      : [
          { key: 'runs', term: ABOUT_HEADSET.runsOn, value: ABOUT_HEADSET.runsOnLine(format) },
          { key: 'shows', term: ABOUT_HEADSET.pageShows, value: ABOUT_HEADSET.pageShowsLine },
          {
            key: 'completed',
            term: ABOUT_HEADSET.completedMeans,
            value: ABOUT_HEADSET.completedMeansLine,
          },
        ];
  return <StLaunchAbout title={aboutFormatTitle(format)} titleId={titleId} rows={rows} />;
}

/** A format page's read failed for now: the compact failed message with "Try again". */
export function FormatFailed({
  title,
  onRetry,
}: {
  readonly title: string;
  readonly onRetry: () => void;
}) {
  const titleId = useId();
  return (
    <StMessage
      icon="cloudAlert"
      tone="err"
      alert
      title={title}
      titleId={titleId}
      description={ST_STATE_WORDS.failedLine}
      retry={{ label: ST_STATE_WORDS.tryAgain, onRetry }}
    />
  );
}

export function FormatLoading({ label }: { readonly label: string }) {
  return <StLoading variant="card" label={label} />;
}

/**
 * The AR / MR refusals (`msg('ar' | 'mr')`): the crumbs experiment › Simulation › the format, the
 * compact refusal card — "<experiment> · Simulation", why, "Formats you can use" (each given
 * format with its chip, its run in words and the way to it), then "Back to Simulation".
 */
export function FormatRefusal({
  experimentId,
  format,
  view,
  hub,
  session,
  progress,
}: {
  readonly experimentId: string;
  readonly format: Technology;
  readonly view: Extract<FormatView, { kind: 'not-included' | 'not-published' }>;
  readonly hub: ExperimentHub;
  readonly session: Closure;
  readonly progress: readonly FormatProgressView[];
}) {
  const today = useStudentTodayLine();
  const ids = { title: useId(), alt: useId() };
  const included = view.kind === 'not-included';
  const name = hub.experiment.name;
  const items: StRefuseItem[] = hub.row.formats
    .filter((entry) => isGiven(entry.availability))
    .sort((a, b) => ORDER.indexOf(a.format) - ORDER.indexOf(b.format))
    .map((entry) => {
      const chip = formatChipOf(entry.format, entry.availability, hub.row.closure, session);
      const item = progress.find((each) => each.format === entry.format) ?? null;
      const run = runOf(item, entry.progress);
      const label =
        run.status === 'in-progress'
          ? ST_ACTION_WORDS.continue(chip.code)
          : ST_ACTION_WORDS.open(chip.code);
      return {
        key: entry.format,
        chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph },
        title: ST_FORMAT_NAMES[chip.code],
        srTitle: ` (${chip.code})`,
        meta: formatRunWords(
          entry.format,
          run,
          chip.kind === 'held' || chip.kind === 'ended' ? chip.access : null,
        ),
        link: {
          href: formatPageAddress(experimentId, entry.format),
          label,
          ariaLabel: ST_ACTION_WORDS.named(label, name),
        },
      };
    });
  return (
    <>
      <FormatCrumbs experimentId={experimentId} experimentName={name} format={format} />
      <StRefuse
        date={today}
        icon="contentAccess"
        off={!included}
        kicker={refusalKicker(name)}
        title={included ? notIncludedTitle(format) : notPublishedTitle(format)}
        titleId={ids.title}
        description={
          included ? notIncludedLine(format, view.included) : madeForLine(name, view.published)
        }
        alt={{ title: FORMAT_REFUSAL.formatsYouCanUse, titleId: ids.alt, items }}
        actions={
          <ButtonLink href={simulationAddress(experimentId)} size="lg">
            {FORMAT_PAGE.backToSimulation}
          </ButtonLink>
        }
      />
    </>
  );
}

const ORDER: readonly Technology[] = ['web', 'vr', 'ar', 'mr'];

/** A format's run from its progress view (the dates the runtime reported, the completion). */
function runOf(
  view: FormatProgressView | null,
  status: FormatProgressView['status'],
):
  | { readonly status: 'not-started' }
  | { readonly status: 'in-progress'; readonly at: string | null }
  | { readonly status: 'completed'; readonly at: string } {
  if (view?.status === 'completed' && view.completion) {
    return { status: 'completed', at: view.completion.completedAt };
  }
  if ((view?.status ?? status) === 'in-progress') {
    const activity = view?.activity ?? null;
    const at =
      view?.format === 'web'
        ? (activity?.lastSavedAt ?? activity?.firstOpenedAt ?? null)
        : (activity?.lastSessionReportedAt ?? activity?.firstOpenedAt ?? null);
    return { status: 'in-progress', at };
  }
  return { status: 'not-started' };
}
