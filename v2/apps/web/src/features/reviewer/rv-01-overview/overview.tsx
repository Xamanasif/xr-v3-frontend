'use client';

import type { Out, reviewerOverviewOutput } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  ListState,
  LoadingRows,
  PageHead,
  RvCalm,
  RvDesk,
  RvFormatBadges,
  RvKindTag,
  RvNextInLine,
  type RvQueueType,
  RvQueueTypes,
  RvRecentDecisions,
  type RvRecentDecision,
  RvScopeCourses,
  RvSide,
  RvSideCard,
  RvWaitList,
  type RvWaitingItem,
  RvWaitPanel,
  TextLink,
} from '@xr/ui/v3';
import { useRef } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  deskActionLabel,
  formatsLabel,
  LIST_FAILED,
  newSubmissionsDetail,
  overviewLead,
  overviewStateWords,
  QUEUE_TYPES,
  queueTypeLabel,
  recentDecisionLabel,
  recentDecisionWords,
  REVIEWER_OVERVIEW,
  type ReviewItemType,
  scopeCourseLabel,
} from '@/copy/reviewer-lists';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEWED_BY_ME_ADDRESS,
  REVIEWER_OVERVIEW_TITLE,
  reviewerOverviewPlacement,
} from '@/nav/reviewer';
import { useReviewedByMe, useReviewerOverview } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  approvedOf,
  decidedAddressOf,
  decidedAt,
  type DecidedRow,
  focusOf,
  formatCodes,
  fromOf,
  queueAddress,
  reviewAddressOf,
} from '../rv-02-queue/list-facts';
import { type CourseNameOf, useRvCourseNames } from '../shared/course-names';
import { queueItemKind } from '../shared/kind';
import { reviewedRowStanding } from '../shared/standing';
import { useRvToday, useRvTodayLine, waitingAge } from '../shared/waiting';

export { oldestToReview, reviewAddressOf } from '../rv-02-queue/list-facts';

type OverviewAnswer = Out<typeof reviewerOverviewOutput>;
export type WaitingItem = OverviewAnswer['waiting'][number];

const TITLE_ID = 'rv-h1-ov';
const WAIT_ID = 'rv-ov-h';
const TYPES_ID = 'rv-ty-h';
const SCOPE_ID = 'rv-sc-h';
const RECENT_ID = 'rv-rc-h';
const TYPE_ORDER: readonly ReviewItemType[] = ['new', 'recheck', 'update'];

/**
 * RV-01 Overview — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/RV-v1, `RV.dc.html` `isOverview` and `overviewVals`), at `/reviewer`,
 * the Academic Reviewer's home.
 *
 * - **Reads**: `ProductionService.getReviewerOverview` — the scope as course codes and the queue's
 *   own items, oldest first, each re-check with the Content Manager's reason — and
 *   `listReviewedByMe` for Recently decided; the course names come from the role's one catalogue
 *   lookup (`useRvCourseNames`).
 * - **As the export draws it**: the head (date on phones, “Overview”, how many items wait, “Open
 *   the review queue”); the desk — next in line (the item waiting longest, with the page's one gold
 *   “Start review”), then the rest oldest first (“Review”, an update's “Review update”), or the calm
 *   state with “Open Reviewed by me”; beside it In your queue by type (each opens the queue on its
 *   tab), Your review scope (each course opens the queue on it) and the three latest decisions
 *   with “All decisions”. No record is named by its reference.
 * - **Loading and failed**: the application's page loading under the head (undrawn; state-copy
 *   `RV-01.loading`, `RV-01.failed`); Try again reads again and moves focus to the title.
 * - Nothing here changes a record: every action opens the page where the work is done.
 */
export function ReviewerOverview() {
  useShellPage(reviewerOverviewPlacement());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const date = useRvTodayLine();
  const today = useRvToday();
  const courseName = useRvCourseNames();
  const overview = useReviewerOverview();
  const reviewed = useReviewedByMe();
  const reads = [overview, reviewed] as const;
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const answer = overview.data?.ok ? overview.data.value : null;
  const decisions = reviewed.data?.ok ? reviewed.data.value : null;
  const ready = answer !== null && decisions !== null && !failed;

  const retry = () => {
    for (const read of reads) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
    titleRef.current?.focus();
  };

  return (
    <>
      <PageHead
        title={REVIEWER_OVERVIEW_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={ready ? overviewLead(answer.waiting.length) : undefined}
        actions={<ButtonLink href={REVIEW_QUEUE_ADDRESS}>{REVIEWER_OVERVIEW.openQueue}</ButtonLink>}
      />
      {failed ? (
        <ListState
          kind="failed"
          titleAs="h2"
          title={overviewStateWords('failed')}
          action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
        >
          {LIST_FAILED.line}
        </ListState>
      ) : !ready ? (
        <LoadingRows message={overviewStateWords('loading')} />
      ) : (
        <Desk answer={answer} decisions={decisions} today={today} courseName={courseName} />
      )}
    </>
  );
}

function Desk({
  answer,
  decisions,
  today,
  courseName,
}: {
  readonly answer: OverviewAnswer;
  readonly decisions: readonly DecidedRow[];
  readonly today: string | null;
  readonly courseName: CourseNameOf;
}) {
  const waiting = answer.waiting;
  const items = waiting.map((item, index) => waitingItem(item, index === 0, today, courseName));
  const [next, ...rest] = items;
  const first = waiting[0];
  const resubmissions = waiting.filter((item) => queueItemKind(item).kind === 'resub').length;

  const types: RvQueueType[] = TYPE_ORDER.map((kind) => {
    const count = waiting.filter((item) => item.type === kind).length;
    const words = QUEUE_TYPES[kind];
    return {
      kind,
      title: words.title,
      detail: kind === 'new' ? newSubmissionsDetail(resubmissions) : words.detail,
      count,
      href: queueAddress({ type: kind }),
      accessibleName: queueTypeLabel(words.title, count),
    };
  });

  const recent: RvRecentDecision[] = decisions.slice(0, 3).map((row) => {
    const update = row.type === 'update';
    const approved = approvedOf(row);
    const decision = recentDecisionWords(approved, update);
    const at = decidedAt(row);
    const when = at ? dayMonthYear(at) : '';
    const now = reviewedRowStanding(row)?.now ?? '';
    return {
      key: `${row.recordRef.kind}:${row.recordRef.id}`,
      name: row.name,
      decision,
      approved,
      when,
      now,
      href: decidedAddressOf(row),
      accessibleName: recentDecisionLabel(row.name, decision, when, now),
    };
  });

  return (
    <RvDesk>
      <RvWaitPanel
        title={REVIEWER_OVERVIEW.waitingTitle}
        titleId={WAIT_ID}
        note={waiting.length > 0 ? REVIEWER_OVERVIEW.oldestFirst : REVIEWER_OVERVIEW.nothingWaiting}
      >
        {next && first ? (
          <>
            <RvNextInLine
              label={REVIEWER_OVERVIEW.nextInLine}
              item={next}
              formats={formatsOf(first)}
            />
            {rest.length > 0 ? <RvWaitList title={REVIEWER_OVERVIEW.then} items={rest} /> : null}
          </>
        ) : (
          <RvCalm
            title={REVIEWER_OVERVIEW.calmTitle}
            action={
              <ButtonLink href={REVIEWED_BY_ME_ADDRESS}>
                {REVIEWER_OVERVIEW.openReviewed}
              </ButtonLink>
            }
          >
            {REVIEWER_OVERVIEW.calmLine}
          </RvCalm>
        )}
      </RvWaitPanel>
      <RvSide>
        {waiting.length > 0 ? (
          <RvSideCard title={REVIEWER_OVERVIEW.inYourQueue} titleId={TYPES_ID}>
            <RvQueueTypes types={types} />
          </RvSideCard>
        ) : null}
        {/* A scope over every course names none: the card is left out (`RV-01.scope-all`). */}
        {answer.scopeLine.length > 0 ? (
          <RvSideCard
            title={REVIEWER_OVERVIEW.scopeTitle}
            titleId={SCOPE_ID}
            note={REVIEWER_OVERVIEW.scopeNote}
          >
            <RvScopeCourses
              courses={answer.scopeLine.map((code) => {
                const name = courseName(code);
                return {
                  key: code,
                  code,
                  name,
                  href: queueAddress({ course: code }),
                  accessibleName: scopeCourseLabel(code, name),
                };
              })}
            />
          </RvSideCard>
        ) : null}
        <RvSideCard
          title={REVIEWER_OVERVIEW.recentTitle}
          titleId={RECENT_ID}
          link={<TextLink href={REVIEWED_BY_ME_ADDRESS}>{REVIEWER_OVERVIEW.allDecisions}</TextLink>}
          note={recent.length === 0 ? REVIEWER_OVERVIEW.noRecent : undefined}
        >
          {recent.length > 0 ? <RvRecentDecisions items={recent} /> : null}
        </RvSideCard>
      </RvSide>
    </RvDesk>
  );
}

/** One waiting item as the desk shows it (the export's `overviewVals` `row`). */
function waitingItem(
  item: WaitingItem,
  first: boolean,
  today: string | null,
  courseName: CourseNameOf,
): RvWaitingItem {
  const kind = queueItemKind(item);
  const update = item.type === 'update';
  const age = today ? waitingAge(item.waitingSince, today) : null;
  const look = focusOf(item, item.reason);
  return {
    key: `${item.ref.kind}:${item.ref.id}`,
    kind: <RvKindTag kind={kind.kind} label={kind.label} detail={kind.detail} />,
    name: item.name,
    courseCode: item.courseCode,
    courseName: courseName(item.courseCode),
    from: fromOf(item, kind),
    flag: look.flag ?? undefined,
    focus: look.focus ?? undefined,
    age: age?.age ?? '',
    since: age?.since ?? '',
    action: {
      label: first
        ? REVIEWER_OVERVIEW.startReview
        : update
          ? REVIEWER_OVERVIEW.reviewUpdate
          : REVIEWER_OVERVIEW.review,
      href: reviewAddressOf(item),
      accessibleName: deskActionLabel(first, update, item.name),
    },
  };
}

/** The formats of the item next in line, as one image (“Formats: WEB, VR”). */
function formatsOf(item: WaitingItem) {
  const codes = formatCodes(item.formats);
  return <RvFormatBadges formats={codes} label={formatsLabel(codes)} />;
}
