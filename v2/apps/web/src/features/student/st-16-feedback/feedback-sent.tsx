'use client';

import type { FormatFeedback } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import { ButtonLink, StFeedbackSent } from '@xr/ui/v3';
import { useId } from 'react';

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

const POINTS = [1, 2, 3, 4, 5] as const;

/**
 * ST-17 Feedback sent — the V3 Student export's sent state (`fbVM` `sent`): the read-only state of
 * the feedback route, the Student's own record (T-25: no staff ever reads it). One card: the
 * thank-you band with "Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.", "Back
 * to experiment" (ST-05, the one gold action) and "See your progress" (ST-15) — then "Your answers ·
 * VR", read-only, each statement on the same five-point scale with its rating in words, and the
 * comment ("—" when none). No edit, no resubmit.
 */
export function FeedbackSent({
  feedback,
  format,
}: {
  readonly feedback: FormatFeedback;
  readonly format: Technology;
}) {
  const headingId = useId();
  return (
    <StFeedbackSent
      thanks={FEEDBACK_PAGE.thankYou}
      line={sentLine(feedback.sentAt)}
      actions={
        <>
          <ButtonLink href={myExperimentAddress(feedback.experimentId)} variant="primary">
            {FEEDBACK_PAGE.backToExperiment}
          </ButtonLink>
          <ButtonLink href={PROGRESS_ADDRESS}>{FEEDBACK_PAGE.seeProgress}</ButtonLink>
        </>
      }
      answersTitle={answersHeading(format)}
      answersTitleId={headingId}
      note={FEEDBACK_PAGE.readOnly}
      points={POINTS}
      answers={STATEMENT_INDEXES.map((index) => {
        const rating = feedback.ratings[index]!;
        return {
          key: String(index),
          statement: statementLegend(index),
          value: rating,
          words: answerWords(rating),
        };
      })}
      comments={{
        label: FEEDBACK_PAGE.commentsSent,
        text: feedback.comments ?? FEEDBACK_PAGE.noComment,
      }}
    />
  );
}
