'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { ExperimentId, Rating, Technology } from '@xr/domain';
import {
  BackLink,
  Button,
  ErrorSummary,
  Field,
  FormatBadge,
  Link,
  LoadingState,
  Notice,
  PageContent,
  Textarea,
} from '@xr/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import {
  FEEDBACK_PAGE,
  feedbackTitle,
  RATING_LABELS,
  STATEMENT_INDEXES,
  statementLegend,
} from '@/copy/progress-feedback';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { feedbackPlacement, formatPageAddress, isFeedbackFormat } from '@/nav/student-progress';
import { useFeedbackState } from '@/queries/learning';
import {
  type RatingError,
  ratingErrors,
  ratingSummaryTitle,
} from '@/queries/progress-feedback-extra';
import { usePublishedName } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { FeedbackSent } from './feedback-sent';
import { RatingScale } from './rating-scale';

/**
 * ST-16 Format feedback, with ST-17 Feedback sent as its read-only state — board B3-06 (f0 … f4,
 * f6; B3-13 f16 … f19), at `/student/experiments/[experimentId]/feedback/[format]`.
 *
 * - **Read**: `FeedbackService.getFeedbackState` for THIS format — eligible exactly when the system
 *   recorded this format's own completion and the experiment is open (BC5), never because the
 *   experiment or another format completed (T-12); or the feedback already sent. The experiment's
 *   name is its published catalogue name (the h1 and the "My courses / <experiment>" crumbs).
 * - **The form** (f0, f6): five statements (`FEEDBACK_STATEMENTS`, statement set 1), each a 1–5
 *   scale labelled in words, and "Additional comments (optional)". "Submit feedback" sends
 *   `FeedbackService.sendFeedback` once ("Sending…"); the service checks every rating — the error
 *   summary ("One rating is missing" / "3 ratings are missing", each linking to its statement)
 *   takes focus, each statement says "Choose a rating", and choosing one clears it (f1).
 *   Failed for now: "Your feedback wasn’t sent — Nothing was lost", every answer kept, focus on
 *   the notice (f2).
 * - **Sent** (f3, f4): ST-17 in place — the message takes focus after sending. "Already sent"
 *   (another tab) reads the state again and shows that record (`ST-16.already-sent`); any other
 *   refusal reads it again too (`ST-16.refused`). Never edited, never resent; no staff view (T-25).
 * - **Not eligible** (f5: no entry anywhere until that format is completed) and a format the
 *   address cannot name (`web | ar | vr | mr`): the not-found pattern (`ST-16.not-eligible`).
 */
export function FormatFeedback({
  experimentId,
  format,
}: {
  readonly experimentId: string;
  readonly format: string;
}) {
  const navigation = useAppNavigation();
  const valid = isFeedbackFormat(format);
  const technology: Technology = valid ? format : 'web';
  const state = useFeedbackState(experimentId, format, valid);
  const published = usePublishedName(experimentId, valid);
  const answer = state.data;
  const read = answer?.ok ? answer.value : null;
  const title = feedbackTitle(technology);
  useShellPage(
    feedbackPlacement(
      read?.state === 'sent' ? 'ST-17' : 'ST-16',
      title,
      published.name ? { experimentId, name: published.name } : null,
    ),
  );

  // Right after sending (or finding it already sent), the sent message takes focus once it shows.
  const sentRef = useRef<HTMLDivElement>(null);
  const focusSent = useRef(false);
  const shownSent = read?.state === 'sent';
  useEffect(() => {
    if (!focusSent.current || !shownSent) return;
    focusSent.current = false;
    sentRef.current?.focus();
  }, [shownSent]);

  const retried = useRetryFocus(read !== null);
  const retry = () => {
    retried();
    void state.refetch();
  };

  if (!valid) return navigation.notFound();
  if (state.isError || (answer && !answer.ok)) {
    return (
      <PageContent wrap="form">
        <StudentFailed title={stateWords('ST-16.failed')} onRetry={retry} />
      </PageContent>
    );
  }
  if (!read || published.isPending) {
    return (
      <PageContent wrap="form">
        <LoadingState label={stateWords('ST-16.loading')} surface="section" />
      </PageContent>
    );
  }
  if (read.state === 'not-eligible') return navigation.notFound();
  if (read.state === 'sent') {
    return (
      <PageContent wrap="form">
        <FeedbackSent ref={sentRef} feedback={read.feedback} format={technology} />
      </PageContent>
    );
  }
  return (
    <PageContent wrap="form">
      <FeedbackForm
        experimentId={experimentId}
        format={technology}
        name={published.name}
        onSent={() => {
          focusSent.current = true;
        }}
        onMovedOn={(error) => {
          // "Already sent" shows that record (FB-03); any other refusal is read again (AD-22 open).
          if (error.kind === 'conflict') focusSent.current = true;
          void state.refetch();
        }}
      />
    </PageContent>
  );
}

const STATEMENT_ID = (index: number) => `feedback-q${index + 1}`;
const NOTHING_CHOSEN: readonly (Rating | null)[] = STATEMENT_INDEXES.map(() => null);

function FeedbackForm({
  experimentId,
  format,
  name,
  onSent,
  onMovedOn,
}: {
  readonly experimentId: string;
  readonly format: Technology;
  readonly name: string | null;
  readonly onSent: () => void;
  readonly onMovedOn: (error: ServiceError) => void;
}) {
  const code = formatCode(format);
  const back = formatPageAddress(experimentId, format);
  const [ratings, setRatings] = useState<readonly (Rating | null)[]>(NOTHING_CHOSEN);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<readonly RatingError[]>([]);
  // Each failed "Submit feedback" shows the summary anew, and it takes focus (B3-06 `focus(errsum)`).
  const [attempt, setAttempt] = useState(0);
  const [failures, setFailures] = useState(0);
  const [failed, setFailed] = useState(false);
  const failRef = useRef<HTMLDivElement>(null);
  const send = useCommand((ports) => ports.feedback.sendFeedback);

  // "Your feedback wasn’t sent" takes focus each time sending fails (B3-06 `focus(pid + '-fail')`).
  useEffect(() => {
    if (failures > 0) failRef.current?.focus();
  }, [failures]);

  const choose = (index: number) => (rating: Rating) => {
    setRatings((current) => current.map((value, place) => (place === index ? rating : value)));
    setErrors((current) => current.filter((error) => error.statement !== index));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (send.busy) return;
    setFailed(false);
    send
      .run({
        // The address is untrusted text: existence and eligibility are the service's answer.
        experimentId: experimentId as ExperimentId,
        format,
        ratings: [...ratings],
        comments,
      })
      .then(
        (result) => {
          if (result.ok) {
            setErrors([]);
            onSent();
          } else if (result.error.kind === 'validation-failed') {
            setErrors(ratingErrors(result.error));
            setAttempt((current) => current + 1);
          } else {
            onMovedOn(result.error);
          }
        },
        // Failed for now: nothing was written and every answer stays (B3-06 f2).
        () => {
          setFailed(true);
          setFailures((current) => current + 1);
        },
      );
  };

  return (
    <>
      <BackLink href={back}>{code}</BackLink>
      <div className="xr-phead mt-2 mb-2">
        <div className="xr-phead-main">
          <span className="xr-overline">{FEEDBACK_PAGE.overline}</span>
          <h1 className="xr-h1 flex flex-wrap items-center gap-3">
            {name ?? feedbackTitle(format)} <FormatBadge format={code} variant="yours" compact />
          </h1>
        </div>
      </div>
      <p className="xr-lead m-0 mb-1">{FEEDBACK_PAGE.lead}</p>
      <p className="xl-meta m-0 mb-5">{FEEDBACK_PAGE.instruction}</p>
      <form className="xl-fb" noValidate onSubmit={submit}>
        {errors.length > 0 ? (
          <ErrorSummary
            key={attempt}
            // Each link a 24 px line: B3-06 stacks up to five summary links 22 px apart, closer
            // than WCAG 2.5.8's spacing allows for 17 px targets (axe `target-size`).
            className="[&_a]:[display:inline-block] [&_a]:[line-height:24px]"
            id="feedback-errors"
            title={ratingSummaryTitle(errors.length)}
            items={errors.map((error) => ({
              fieldId: STATEMENT_ID(error.statement),
              summaryText: error.summaryText,
            }))}
          />
        ) : null}
        {failed ? (
          <div id="feedback-failed" ref={failRef} tabIndex={-1}>
            <Notice tone="err" title={FEEDBACK_PAGE.failedTitle}>
              {FEEDBACK_PAGE.failedLine}
            </Notice>
          </div>
        ) : null}
        {STATEMENT_INDEXES.map((index) => (
          <RatingScale
            key={index}
            id={STATEMENT_ID(index)}
            legend={statementLegend(index)}
            labels={RATING_LABELS}
            value={ratings[index] ?? null}
            error={errors.find((error) => error.statement === index)?.message ?? null}
            onChange={choose(index)}
          />
        ))}
        <Field
          id="feedback-comments"
          label={FEEDBACK_PAGE.comments}
          marker={FEEDBACK_PAGE.optional}
        >
          <Textarea
            className="min-h-[110px]"
            value={comments}
            onChange={(event) => setComments(event.target.value)}
          />
        </Field>
        <div className="xw-flow-foot">
          <Link className="xr-btn xr-btn--text" href={back}>
            {FEEDBACK_PAGE.cancel}
          </Link>
          <div className="xw-actions">
            <Button
              variant="primary"
              type="submit"
              busy={send.busy}
              busyLabel={FEEDBACK_PAGE.sending}
            >
              {FEEDBACK_PAGE.submit}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
