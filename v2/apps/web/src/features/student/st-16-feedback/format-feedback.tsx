'use client';

import type { MyExperimentRow, ServiceError } from '@xr/contracts/draft';
import type { ExperimentId, Rating, Technology } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  Notice,
  StFeedbackComments,
  StFeedbackErrors,
  StFeedbackFoot,
  StFeedbackScale,
  StFeedbackSheet,
  StFeedbackStatement,
  StFormatChip,
  StLoading,
  StMessage,
  StRecordHead,
  StRefuse,
} from '@xr/ui/v3';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { FORMAT_WORDS } from '@/copy/flow-state-words';
import {
  answerWords,
  FEEDBACK_NOT_OPEN,
  FEEDBACK_PAGE,
  feedbackTitle,
  RATING_LABELS,
  STATEMENT_INDEXES,
  statementLegend,
} from '@/copy/progress-feedback';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { myExperimentAddress } from '@/nav/student';
import { feedbackPlacement, formatPageAddress, isFeedbackFormat } from '@/nav/student-progress';
import { useFeedbackState } from '@/queries/learning';
import {
  type RatingError,
  ratingErrors,
  ratingSummaryTitle,
} from '@/queries/progress-feedback-extra';
import { useMyExperiments, usePublishedName } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import { type Closure, isGiven } from '../shared/student-view';
import { useStudentTodayLine } from '../shared/use-today';
import { FeedbackSent } from './feedback-sent';

/**
 * ST-16 Format feedback, with ST-17 Feedback sent as its read-only state — the V3 Student export's
 * `feedback` region (`fbVM`, `sendFb`) and `msg('fb-not')`, at
 * `/student/experiments/[experimentId]/feedback/[format]`.
 *
 * - **Read**: `FeedbackService.getFeedbackState` for THIS format — eligible exactly when the system
 *   recorded this format's own completion and the experiment is open (BC5), never because the
 *   experiment or another format completed (T-12); or the feedback already sent. The experiment's
 *   name is its published catalogue name (the crumb, the kicker of the head).
 * - **The rating sheet**: five statements (`FEEDBACK_STATEMENTS`, statement set 1), each a 1–5
 *   scale named once above the rows (on a phone under each row, with the choice in words), and
 *   "Additional comments (optional)". "Submit feedback" sends `FeedbackService.sendFeedback` once
 *   ("Sending…"); the service checks every rating — the error summary ("One rating is missing" /
 *   "3 ratings are missing", each linking to its statement's first radio) takes focus, each
 *   statement says which rating is missing, and choosing one clears it. Failed for now: "Your
 *   feedback wasn’t sent — Nothing was lost", every answer kept, focus on the notice.
 * - **Sent** (ST-17) in place — the H1 takes focus after sending. "Already sent" (another tab)
 *   reads the state again and shows that record (`ST-16.already-sent`); any other refusal reads it
 *   again too (`ST-16.refused`). Never edited, never resent; no staff view (T-25).
 * - **Not open yet**: a format given to the Student, listed for them, not completed, with nothing
 *   holding the experiment — "Feedback on VR isn’t open yet" (`ST-16.not-eligible`). Any other
 *   not-eligible answer (not given, unknown, closed, completed meanwhile) and an address the
 *   format cannot name (`web | ar | vr | mr`): the in-shell not-found, so nothing is revealed.
 */
export function FormatFeedback({
  experimentId,
  format,
}: {
  readonly experimentId: string;
  readonly format: string;
}) {
  const navigation = useAppNavigation();
  const today = useStudentTodayLine();
  const student = useStudentSession();
  const valid = isFeedbackFormat(format);
  const technology: Technology = valid ? format : 'web';
  const state = useFeedbackState(experimentId, format, valid);
  const published = usePublishedName(experimentId, valid);
  const listed = useMyExperiments(valid);
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

  // Right after sending (or finding it already sent), the H1 takes focus once the sent state shows.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusSent = useRef(false);
  const shownSent = read?.state === 'sent';
  useEffect(() => {
    if (!focusSent.current || !shownSent) return;
    focusSent.current = false;
    titleRef.current?.focus();
  }, [shownSent]);

  const retried = useRetryFocus(read !== null);
  const retry = () => {
    retried();
    void state.refetch();
  };
  const titleId = useId();

  if (!valid) return navigation.notFound();
  if (state.isError || (answer && !answer.ok)) {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-16.failed')}
        titleId={titleId}
        description={ST_STATE_WORDS.failedLine}
        retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: retry }}
      />
    );
  }
  const listedAnswered = listed.data !== undefined || listed.isError;
  if (!read || published.isPending || (read.state === 'not-eligible' && !listedAnswered)) {
    return <StLoading variant="card" label={stateWords('ST-16.loading')} />;
  }
  const name = published.name ?? title;
  const crumbs = (
    <Breadcrumbs
      levels={[
        { label: name, href: myExperimentAddress(experimentId) },
        {
          label: formatCode(technology),
          href: formatPageAddress(experimentId, technology),
        },
      ]}
      current={FEEDBACK_PAGE.crumb}
    />
  );
  if (read.state === 'not-eligible') {
    const row = listed.data?.ok
      ? (listed.data.value.rows.find((entry) => entry.experiment.experimentId === experimentId)
          ?.experiment ?? null)
      : null;
    if (!notOpenYet(row, technology, student?.closure ?? null)) return navigation.notFound();
    return (
      <>
        {crumbs}
        <StRefuse
          date={today}
          icon="chat"
          kicker={FEEDBACK_NOT_OPEN.kicker(row!.name)}
          title={FEEDBACK_NOT_OPEN.title(technology)}
          titleId={titleId}
          description={FEEDBACK_NOT_OPEN.line(technology)}
          actions={
            <ButtonLink
              href={formatPageAddress(experimentId, technology)}
              variant="primary"
              size="lg"
            >
              {FEEDBACK_NOT_OPEN.back(technology)}
            </ButtonLink>
          }
        />
      </>
    );
  }
  const sent = read.state === 'sent';
  return (
    <>
      <StRecordHead
        breadcrumbs={crumbs}
        date={today}
        lead={<StFormatChip code={formatCode(technology)} kind="on" />}
        context={name}
        title={sent ? FORMAT_WORDS.feedbackSent(technology) : title}
        titleId={titleId}
        titleRef={titleRef}
        sub={sent ? undefined : FEEDBACK_PAGE.lead}
      />
      {read.state === 'sent' ? (
        <FeedbackSent feedback={read.feedback} format={technology} />
      ) : (
        <FeedbackForm
          experimentId={experimentId}
          format={technology}
          onSent={() => {
            focusSent.current = true;
          }}
          onMovedOn={(error) => {
            // "Already sent" shows that record (FB-03); any other refusal is read again (AD-22 open).
            if (error.kind === 'conflict') focusSent.current = true;
            void state.refetch();
          }}
        />
      )}
    </>
  );
}

/**
 * Feedback not open yet (`msg('fb-not')`): the experiment is listed for the Student, nothing holds
 * it (no pause, licence wait, inactive account), the format is given to them and its own progress
 * is not completed. Anything else not eligible stays the not-found.
 */
function notOpenYet(row: MyExperimentRow | null, format: Technology, session: Closure): boolean {
  if (row === null || row.closure !== null || session !== null) return false;
  const entry = row.formats.find((candidate) => candidate.format === format);
  return entry !== undefined && isGiven(entry.availability) && entry.progress !== 'completed';
}

const STATEMENT_ID = (index: number) => `feedback-q${index + 1}`;
const NOTHING_CHOSEN: readonly (Rating | null)[] = STATEMENT_INDEXES.map(() => null);
const POINTS = ([1, 2, 3, 4, 5] as const).map((value) => ({
  value,
  label: RATING_LABELS[value],
}));
const ENDS: readonly [string, string] = [RATING_LABELS[1], RATING_LABELS[5]];

function FeedbackForm({
  experimentId,
  format,
  onSent,
  onMovedOn,
}: {
  readonly experimentId: string;
  readonly format: Technology;
  readonly onSent: () => void;
  readonly onMovedOn: (error: ServiceError) => void;
}) {
  const back = formatPageAddress(experimentId, format);
  const [ratings, setRatings] = useState<readonly (Rating | null)[]>(NOTHING_CHOSEN);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<readonly RatingError[]>([]);
  // Each failed "Submit feedback" shows the summary anew, and it takes focus.
  const [attempt, setAttempt] = useState(0);
  const [failures, setFailures] = useState(0);
  const [failed, setFailed] = useState(false);
  const failRef = useRef<HTMLDivElement>(null);
  const send = useCommand((ports) => ports.feedback.sendFeedback);

  // "Your feedback wasn’t sent" takes focus each time sending fails.
  useEffect(() => {
    if (failures > 0) failRef.current?.focus();
  }, [failures]);

  const choose = (index: number) => (rating: number) => {
    setRatings((current) =>
      current.map((value, place) => (place === index ? (rating as Rating) : value)),
    );
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
        // Failed for now: nothing was written and every answer stays.
        () => {
          setFailed(true);
          setFailures((current) => current + 1);
        },
      );
  };

  return (
    <StFeedbackSheet label={feedbackTitle(format)} onSubmit={submit}>
      {errors.length > 0 ? (
        <StFeedbackErrors
          key={attempt}
          id="feedback-errors"
          title={ratingSummaryTitle(errors.length)}
          items={errors.map((error) => ({
            fieldId: STATEMENT_ID(error.statement),
            focusId: `${STATEMENT_ID(error.statement)}-${ratings[error.statement] ?? 1}`,
            text: error.summaryText,
          }))}
        />
      ) : null}
      {failed ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          className="sv-fb-msg"
          id="feedback-failed"
          ref={failRef}
          title={FEEDBACK_PAGE.failedTitle}
        >
          {FEEDBACK_PAGE.failedLine}
        </Notice>
      ) : null}
      <StFeedbackScale title={FEEDBACK_PAGE.rateEach} points={POINTS} />
      {STATEMENT_INDEXES.map((index) => {
        const value = ratings[index] ?? null;
        const error = errors.find((entry) => entry.statement === index);
        return (
          <StFeedbackStatement
            key={index}
            id={STATEMENT_ID(index)}
            legend={statementLegend(index)}
            points={POINTS}
            value={value}
            onChange={choose(index)}
            ends={ENDS}
            chosen={value === null ? FEEDBACK_PAGE.notRated : answerWords(value)}
            error={error?.summaryText}
          />
        );
      })}
      <StFeedbackComments
        id="feedback-comments"
        label={FEEDBACK_PAGE.comments}
        value={comments}
        onChange={setComments}
      />
      <StFeedbackFoot>
        <ButtonLink href={back} size="lg">
          {FEEDBACK_PAGE.cancel}
        </ButtonLink>
        <Button
          variant="primary"
          size="lg"
          type="submit"
          busy={send.busy}
          busyLabel={FEEDBACK_PAGE.sending}
        >
          {FEEDBACK_PAGE.submit}
        </Button>
      </StFeedbackFoot>
    </StFeedbackSheet>
  );
}
