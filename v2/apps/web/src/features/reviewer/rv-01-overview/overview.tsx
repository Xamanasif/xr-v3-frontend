'use client';

import type { Out, reviewerOverviewOutput } from '@xr/contracts/draft';
import {
  Icon,
  type IconName,
  Link,
  PageContent,
  PageHeader,
  Row,
  Rows,
  type RowTone,
} from '@xr/ui';

import { dayMonthYear } from '@/copy/dates';
import {
  attentionActionLabel,
  attentionCountWords,
  attentionSub,
  attentionTitle,
  oldestWords,
  REVIEWER_OVERVIEW,
  type ReviewItemType,
  scopeWords,
  statusLineParts,
} from '@/copy/reviewer-lists';
import { stateWords } from '@/copy/state-copy';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEWED_BY_ME_ADDRESS,
  REVIEWER_OVERVIEW_TITLE,
  reviewerOverviewPlacement,
  reviewSubmissionAddress,
} from '@/nav/reviewer';
import { useReviewerOverview } from '@/queries/production';
import { useCurrentSession } from '@/queries/session';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ReviewerFailed, ReviewerLoading, useRetryFocus } from '../rv-02-queue/list-states';

type OverviewAnswer = Out<typeof reviewerOverviewOutput>;
export type WaitingItem = OverviewAnswer['waiting'][number];

/** The row icon and its tint (B6-01 f0): a document (info), the refresh arrows (wait), the list (err). */
const ROW_ICON: Readonly<
  Record<ReviewItemType, { readonly icon: IconName; readonly tone: RowTone }>
> = {
  new: { icon: 'fileText', tone: 'info' },
  update: { icon: 'updates', tone: 'wait' },
  recheck: { icon: 'reviewQueue', tone: 'err' },
};

/**
 * The item “Review the oldest — <name>” opens (state-copy `RV-01.oldest`): the oldest waiting
 * submission or re-check — the queue is oldest first; an update’s page (RV-04) is not built.
 */
export function oldestToReview(waiting: readonly WaitingItem[]): WaitingItem | null {
  return waiting.find((item) => item.ref.kind === 'SUB') ?? null;
}

/**
 * RV-01 Overview — board B6-01 f0 … f2, at `/reviewer`, the Academic Reviewer’s home.
 *
 * - **Reads**: `ProductionService.getReviewerOverview` — the reviewer’s scope as course codes and
 *   the queue’s own items, oldest first, each re-check with the Content Manager’s reason (PC-63
 *   facts; the screen words them) — and the session for the overline (the reviewer’s name).
 * - **As B6-01 draws it**: the overline, “Overview”, the polite status line “<n> items waiting ·
 *   <n> re-check(s) from the Content Manager · <n> update(s)” and the scope line “You review: …”;
 *   the one primary “Review the oldest — <name>” beside “Open the review queue”; “Waiting for your
 *   decision” · “<n> items · oldest first” with one row per item — “Review: …” (the document on
 *   the info tint), “Re-check: …” (the list on the error tint, the reason first), “Update: …” (the
 *   arrows on the wait tint) — each with its “Review”. f1: nothing waiting keeps the scope line
 *   and offers “Open Reviewed by me”. f2: one column at 375.
 * - **Phase 6**: an update’s “Review update” opens RV-04, which is not built — its row is drawn
 *   without the action and is never the oldest’s target (state-copy `RV-01.update-row`,
 *   `RV-01.oldest`; P0-35, DEV-21).
 * - Undrawn: loading and failed with “Try again” (state-copy `RV-01.loading`, `RV-01.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function ReviewerOverview() {
  useShellPage(reviewerOverviewPlacement());
  const session = useCurrentSession();
  const name = session.data?.ok ? (session.data.value?.session.displayName ?? null) : null;
  const read = useReviewerOverview();
  const answer = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(answer !== null, () => document.getElementById(MAIN_ID));
  const waiting = answer?.waiting ?? [];
  const oldest = oldestToReview(waiting);

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        overline={name}
        title={REVIEWER_OVERVIEW_TITLE}
        meta={answer ? <HeaderMeta answer={answer} /> : null}
      />
      {failed ? (
        <div className="xr-section">
          <ReviewerFailed title={stateWords('RV-01.failed')} onRetry={retry} headingLevel={2} />
        </div>
      ) : answer === null ? (
        <div className="xr-section">
          <ReviewerLoading label={stateWords('RV-01.loading')} />
        </div>
      ) : waiting.length === 0 ? (
        <NothingWaiting />
      ) : (
        <>
          <div className="xw-actions [margin:0_0_20px]">
            {oldest ? (
              <Link
                className="xr-btn xr-btn--primary"
                href={reviewSubmissionAddress(oldest.ref.id)}
              >
                {oldestWords(oldest.name)}
              </Link>
            ) : null}
            <Link className="xr-btn xr-btn--secondary" href={REVIEW_QUEUE_ADDRESS}>
              {REVIEWER_OVERVIEW.openQueue}
            </Link>
          </div>
          <section className="xr-section" aria-labelledby="ro-at">
            <div className="xr-section-head">
              <h2 id="ro-at" className="xr-h2">
                {REVIEWER_OVERVIEW.sectionTitle}
              </h2>
              <span className="xr-meta">{attentionCountWords(waiting.length)}</span>
            </div>
            <Rows>
              {waiting.map((item) => (
                <WaitingRow key={`${item.ref.kind}:${item.ref.id}`} item={item} />
              ))}
            </Rows>
          </section>
        </>
      )}
    </PageContent>
  );
}

/** `div.xr-phead-meta`: the status line while anything waits, then the scope line (f0, f1). */
function HeaderMeta({ answer }: { readonly answer: OverviewAnswer }) {
  return (
    <>
      {answer.waiting.length > 0 ? (
        <p className="xv-statusline" role="status">
          {statusLineParts(answer.waiting).map((part) => (
            <span key={part.words}>
              <strong>{part.figure}</strong> {part.words}
            </span>
          ))}
        </p>
      ) : null}
      {/* A scope over everything names no course: the line is left out (`RV-01.scope-all`). */}
      {answer.scopeLine.length > 0 ? (
        <p className="xg-scope">
          <Icon name="myCourses" size={16} />
          <span>{scopeWords(answer.scopeLine)}</span>
        </p>
      ) : null}
    </>
  );
}

/** One “Waiting for your decision” row: what it is, why it is here, and its one action. */
function WaitingRow({ item }: { readonly item: WaitingItem }) {
  const { icon, tone } = ROW_ICON[item.type];
  return (
    <Row
      icon={icon}
      tone={tone}
      title={attentionTitle(item.type, item.name)}
      sub={attentionSub({
        type: item.type,
        subLine: item.subLine,
        who: item.who,
        since: dayMonthYear(item.waitingSince),
        reason: item.reason,
      })}
    >
      {item.ref.kind === 'SUB' ? (
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={reviewSubmissionAddress(item.ref.id)}
          aria-label={attentionActionLabel(item.type, item.name)}
        >
          {REVIEWER_OVERVIEW.review}
        </Link>
      ) : null}
    </Row>
  );
}

/** f1 “Nothing waiting”: the done icon in the ok tint; Reviewed by me stays one click away. */
function NothingWaiting() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h2 className="xr-h3 m-0">{REVIEWER_OVERVIEW.emptyTitle}</h2>
        <p className="xr-body m-0 text-ink-2">{REVIEWER_OVERVIEW.emptyLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={REVIEWED_BY_ME_ADDRESS}>
            {REVIEWER_OVERVIEW.openReviewed}
          </Link>
        </div>
      </div>
    </div>
  );
}
