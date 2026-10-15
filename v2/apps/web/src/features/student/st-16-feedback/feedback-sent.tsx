'use client';

import type { FormatFeedback } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import { MessagePage } from '@xr/ui';
import { type Ref, useId } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import {
  answersHeading,
  answerWords,
  FEEDBACK_PAGE,
  sentLine,
  STATEMENT_INDEXES,
  statementLegend,
} from '@/copy/progress-feedback';
import { myExperimentAddress } from '@/nav/student';
import { PROGRESS_ADDRESS } from '@/nav/student-progress';

/**
 * ST-17 Feedback sent — B3-06 f3 (WEB), f4 (VR): the read-only state of the feedback route, the
 * Student's own record (T-25: no staff ever reads it). `div.xr-msg` in the OK tint, "Feedback on
 * VR sent", "Thank you. Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.",
 * "Back to experiment" (ST-05) and "See your progress" (ST-15) — then "Your answers · VR": each
 * statement with its rating in words and the comment ("—" when none). No edit, no resubmit. Right
 * after sending, the message takes focus (B3-06 `focus(pid + '-sent')`).
 */
export function FeedbackSent({
  feedback,
  format,
  ref,
}: {
  readonly feedback: FormatFeedback;
  readonly format: Technology;
  readonly ref?: Ref<HTMLDivElement>;
}) {
  const headingId = useId();
  return (
    <>
      <MessagePage
        ref={ref}
        id="feedback-sent"
        tabIndex={-1}
        icon="done"
        iconSize={20}
        tone="ok"
        lead
        className="[margin:8px_0_24px]"
        title={FORMAT_WORDS.feedbackSent(format)}
        action={{
          href: myExperimentAddress(feedback.experimentId),
          label: FEEDBACK_PAGE.backToExperiment,
        }}
        secondary={{ href: PROGRESS_ADDRESS, label: FEEDBACK_PAGE.seeProgress }}
        secondaryVariant="text"
      >
        {sentLine(feedback.sentAt)}
      </MessagePage>
      <section className="xr-section" aria-labelledby={headingId}>
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {answersHeading(format)}
          </h2>
        </div>
        <div className="[padding:0_24px_24px]">
          <ul className="xl-ans" aria-label={FEEDBACK_PAGE.answersLabel}>
            {STATEMENT_INDEXES.map((index) => (
              <li key={index}>
                <span>{statementLegend(index)}</span>
                <span className="xl-ans-v">{answerWords(feedback.ratings[index]!)}</span>
              </li>
            ))}
            <li>
              <span>{FEEDBACK_PAGE.comments}</span>
              <span>{feedback.comments ?? FEEDBACK_PAGE.noComment}</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
