'use client';

import type { Technology } from '@xr/domain';
import { BackLink, FormatBadge, Icon, Link, MessagePage, StatusPill } from '@xr/ui';
import type { ReactNode } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { FORMAT_WORDS, formatProgressWords, wordsOf } from '@/copy/flow-state-words';
import {
  feedbackRecordedWords,
  feedbackSentWords,
  FORMAT_PAGE,
  FORMAT_PANEL,
  madeForLine,
  notIncludedLine,
  notIncludedTitle,
  notPublishedTitle,
  reportedWords,
  simulationOverline,
  type SetupStep,
} from '@/copy/formats';
import { formatCode } from '@/copy/student';
import {
  formatFeedbackAddress,
  MY_DEVICE_ADDRESS,
  REPORT_PROBLEM_ADDRESS,
  simulationAddress,
} from '@/nav/student-formats';

import type { CompletedFeedback, FormatView } from './format-view';

/**
 * The parts ST-08 (B3-03) and ST-09 (B3-04) share, in the boards' markup: the format panel
 * (`section.xl-fmtpanel`) with its two top rows, its title as the page's one h1 (`ST-08.heading`),
 * the completion and its feedback, the device block, the panel's text actions and B3-04's two
 * message pages (f3, f4).
 */

/**
 * `a.xr-back` "Simulation" and, above a panel, the 12 px gap under it (B3-03 f0, B3-04 f0); the
 * message pages set their own margin under it instead (B3-04 f3, f4).
 */
export function BackToSimulation({
  experimentId,
  gap = true,
}: {
  readonly experimentId: string;
  readonly gap?: boolean;
}) {
  return (
    <>
      <BackLink href={simulationAddress(experimentId)}>{FORMAT_PAGE.simulation}</BackLink>
      {gap ? <div className="h-3" /> : null}
    </>
  );
}

/** `section.xl-fmtpanel` with the format chip and "Simulation · WEB" (B3-03 f0). */
export function FormatPanel({
  format,
  label,
  children,
}: {
  readonly format: Technology;
  /** "WEB simulation" (B3-03), "VR format" (B3-04). */
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="xl-fmtpanel" aria-label={label}>
      <div className="xl-fmtpanel-top">
        <FormatBadge format={formatCode(format)} variant="yours" compact />
        <span className="xr-overline">{simulationOverline(format)}</span>
      </div>
      {children}
    </section>
  );
}

/** The panel's title: the page's one h1, with the board's class (`ST-08.heading`). */
export function PanelTitle({ children }: { readonly children: string }) {
  return <h1 className="xl-fmtpanel-title">{children}</h1>;
}

export function PanelText({ children }: { readonly children: string }) {
  return <p className="xl-fmtpanel-text">{children}</p>;
}

/** The status row: the chip, then its line (`span.xl-meta`), as each frame draws it. */
export function StatusRow({
  tone,
  words,
  meta,
}: {
  readonly tone: 'off' | 'wait' | 'ok' | 'paused';
  readonly words: string;
  readonly meta?: ReactNode;
}) {
  return (
    <div className="xl-fmtpanel-top">
      <StatusPill tone={tone}>{words}</StatusPill>
      {meta ?? null}
    </div>
  );
}

export function Meta({ children }: { readonly children: string }) {
  return <span className="xl-meta">{children}</span>;
}

/** "Not started" / "In progress" / "Completed 14 Oct 2026" (`formatProgressWords`, B3-03, B3-04). */
export function progressWords(
  status: 'not-started' | 'in-progress' | 'completed',
  completedAt: string | null = null,
): string {
  return (
    wordsOf(formatProgressWords({ status, completion: completedAt ? { completedAt } : null })) ??
    (completedAt ? `Completed ${dayMonthYear(completedAt)}` : '')
  );
}

/** "Paused" (B3-03 f5, B3-04 f5; `formatProgressWords` while the institution is paused). */
export function pausedWords(): string {
  return (
    wordsOf(formatProgressWords({ status: 'not-started', completion: null, paused: true })) ?? ''
  );
}

/**
 * The completion's rows (B3-03 f3, f4; B3-04 f2): the Completed chip and its line — "Reported by
 * the simulation at 15:30" / "Reported from the headset at 11:15", or "Feedback sent …" once sent —
 * the title, then the feedback line and its one action. Nothing is offered unless FeedbackService
 * answers `eligible` for this format (BC5).
 */
export function CompletedRows({
  experimentId,
  format,
  completedAt,
  reportedFrom,
  feedback,
  eligibleText,
}: {
  readonly experimentId: string;
  readonly format: Technology;
  readonly completedAt: string;
  readonly reportedFrom: 'simulation' | 'headset';
  readonly feedback: CompletedFeedback;
  /** WEB: "… It takes about two minutes." (B3-03 f3); VR: the first sentence only (B3-04 f2). */
  readonly eligibleText: string;
}) {
  const feedbackAddress = formatFeedbackAddress(experimentId, format);
  return (
    <>
      <StatusRow
        tone="ok"
        words={progressWords('completed', completedAt)}
        meta={
          feedback.kind === 'sent' ? (
            <span className="xl-inline xl-meta">
              <Icon name="done" size={16} />
              {feedbackSentWords(feedback.sentAt)}
            </span>
          ) : (
            <Meta>{reportedWords(reportedFrom, completedAt)}</Meta>
          )
        }
      />
      <PanelTitle>{FORMAT_WORDS.completed(format)}</PanelTitle>
      {feedback.kind === 'eligible' ? (
        <>
          <PanelText>{eligibleText}</PanelText>
          <div className="xl-bigact">
            <Link className="xr-btn xr-btn--primary" href={feedbackAddress}>
              {FORMAT_WORDS.giveFeedback(format)}
            </Link>
          </div>
        </>
      ) : feedback.kind === 'sent' ? (
        <>
          <PanelText>{feedbackRecordedWords(format)}</PanelText>
          <div className="xl-bigact">
            <Link className="xr-btn xr-btn--secondary" href={feedbackAddress}>
              {FORMAT_WORDS.seeFeedback}
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}

/** `div.xw-actions` "Report a problem · Back to Simulation" (B3-03 f0, `margin-top:4px`). */
export function PanelActions({ experimentId }: { readonly experimentId: string }) {
  return (
    <div className="xw-actions mt-1">
      <Link className="xr-btn xr-btn--text" href={REPORT_PROBLEM_ADDRESS}>
        {FORMAT_PAGE.reportProblem}
      </Link>
      <Link className="xr-btn xr-btn--text" href={simulationAddress(experimentId)}>
        {FORMAT_PAGE.backToSimulation}
      </Link>
    </div>
  );
}

/** "Your authorised device" (B3-04 f0, f1, f2, f7: `div.xl-dev style="padding:0"`). */
export function DeviceBlock({ description }: { readonly description: string }) {
  return (
    <div className="xl-dev [padding:0]">
      <span className="xl-dev-ico">
        <Icon name="headset" />
      </span>
      <div className="xl-dev-text">
        <span className="xr-overline">{FORMAT_PANEL.device}</span>
        <span className="xl-dev-name">{description}</span>
        <Link href={MY_DEVICE_ADDRESS}>{FORMAT_PANEL.myDevice}</Link>
      </div>
    </div>
  );
}

/** `ol.xl-steps`: the number in its circle (hidden from screen readers), the line and its sub. */
export function SetupStepList({ steps }: { readonly steps: readonly SetupStep[] }) {
  return (
    <ol className="xl-steps">
      {steps.map((step, index) => (
        <li key={`${index}-${step.text}`}>
          <span className="xl-n" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            {step.text}
            {step.sub ? <span className="xl-sub">{step.sub}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * B3-04 f3 / f4: the message page in the read column — the back link, then `div.xr-msg` (`margin:8px
 * 0`) with the Not-available icon, the title (the page's h1), one line and "Back to Simulation".
 */
export function FormatMessage({
  experimentId,
  format,
  view,
  experimentName,
}: {
  readonly experimentId: string;
  readonly format: Technology;
  readonly view: Extract<FormatView, { kind: 'not-included' | 'not-published' }>;
  readonly experimentName: string;
}) {
  const included = view.kind === 'not-included';
  return (
    <MessagePage
      icon="notAvailable"
      iconSize={20}
      lead
      className="[margin:8px_0]"
      title={included ? notIncludedTitle(format) : notPublishedTitle(format)}
      action={{ href: simulationAddress(experimentId), label: FORMAT_PAGE.backToSimulation }}
    >
      {included
        ? notIncludedLine(format, view.included)
        : madeForLine(experimentName, view.published)}
    </MessagePage>
  );
}
