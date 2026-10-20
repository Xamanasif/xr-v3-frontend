import type { CorrectionUpdate, IsoInstant, Submission } from '@xr/domain';
import type { CmStep, CmStepState, CmStepStateWords, V3IconName } from '@xr/ui/v3';

import {
  approvedByOn,
  returnedOn,
  revisionOn,
  savedOn,
  sinceDay,
  STAGE_STATE_WORDS,
  STAGE_WHAT,
  STAGE_WHEN,
  STAGE_WHO,
  staysLive,
  toResolveFirst,
  versionSince,
  versionUnchanged,
  waitingSince,
  whenReleasedLiveNow,
} from '@/copy/cm-shared';
import { dayMonth } from '@/copy/dates';

import { awaitingSince, lastApproval, lastUpdateDecision } from './records';

/**
 * The stage tracks (CM-v1 COMPONENT-EXTENSIONS A; the export's decision-view flow and `updFlow`),
 * as the kit's `CmStageTrack` steps: who holds each stage, what it is, when — the dates the
 * record itself holds, as "27 Aug"; a stage whose date the record does not hold has no date line —
 * and its state. The words are `copy/cm-shared.ts`'s.
 */

/** The state words before each stage, for the kit's `stateWords`. */
export const CM_STAGE_STATE_WORDS: CmStepStateWords = STAGE_STATE_WORDS;

function day(instant: IsoInstant | null | undefined): string | null {
  return instant ? dayMonth(instant) : null;
}

/** `day` composed into a line, or no line when the record holds no date. */
function on(instant: IsoInstant | null | undefined, words: (day: string) => string): string | null {
  const value = day(instant);
  return value ? words(value) : null;
}

function step(
  key: string,
  who: string,
  what: string,
  when: string | null,
  state: CmStepState,
  icon?: V3IconName,
): CmStep {
  return { key, who, what, when, state, ...(icon ? { icon } : {}) };
}

/**
 * A submission's four stages — vendor → Academic Reviewer → you → public catalogue (CM-03's
 * identity band). `blockers`: the publication checks not met, while it waits for her decision.
 * Dates: the first submission (`firstSubmittedAt`) or the last resubmission with its revision
 * (`lastResubmittedAt`), the last approval and its reviewer (`reviewDecisions`), the publication
 * (`status.at`), the re-check or review since (`status.since`), the return and who returned it
 * (`status.since`, `status.by`).
 */
export function submissionStages(
  submission: Pick<
    Submission,
    'status' | 'revision' | 'firstSubmittedAt' | 'lastResubmittedAt' | 'reviewDecisions'
  >,
  blockers = 0,
): CmStep[] {
  const { status, revision } = submission;
  const submitted =
    revision > 1
      ? revisionOn(revision, day(submission.lastResubmittedAt))
      : day(submission.firstSubmittedAt);
  const approval = lastApproval(submission);
  const approved = approval ? approvedByOn(approval.by, dayMonth(approval.at)) : null;
  const vendorDone = step('vendor', STAGE_WHO.vendor, STAGE_WHAT.submitted, submitted, 'done');
  const listedNext = step(
    'catalogue',
    STAGE_WHO.catalogue,
    STAGE_WHAT.listed,
    STAGE_WHEN.afterYouPublish,
    'next',
  );
  switch (status.state) {
    case 'published':
      return [
        vendorDone,
        step('reviewer', STAGE_WHO.reviewer, STAGE_WHAT.approved, approved, 'done'),
        step('you', STAGE_WHO.you, STAGE_WHAT.published, day(status.at), 'done'),
        step('catalogue', STAGE_WHO.catalogue, STAGE_WHAT.listed, STAGE_WHEN.liveNow, 'done'),
      ];
    case 'with-content-manager':
      return [
        vendorDone,
        step('reviewer', STAGE_WHO.reviewer, STAGE_WHAT.approved, approved, 'done'),
        step(
          'you',
          STAGE_WHO.you,
          STAGE_WHAT.decision,
          blockers > 0 ? toResolveFirst(blockers) : on(approval?.at, waitingSince),
          'you',
        ),
        listedNext,
      ];
    case 'with-academic-reviewer':
    case 'resubmitted': {
      const recheck = status.state === 'with-academic-reviewer' && status.reason === 'recheck';
      return [
        vendorDone,
        step(
          'reviewer',
          STAGE_WHO.reviewer,
          recheck ? STAGE_WHAT.recheck : STAGE_WHAT.inReview,
          on(status.since, sinceDay),
          'now',
        ),
        step(
          'you',
          STAGE_WHO.you,
          STAGE_WHAT.decision,
          recheck ? STAGE_WHEN.backOnceApproved : STAGE_WHEN.afterApproval,
          'next',
        ),
        listedNext,
      ];
    }
    case 'returned':
    case 'draft': {
      const returned =
        status.state === 'returned'
          ? returnedOn(
              dayMonth(status.since),
              status.by === 'super-admin-override' ? null : status.by,
            )
          : null;
      return [
        step(
          'vendor',
          STAGE_WHO.vendor,
          STAGE_WHAT.revising,
          returned,
          status.state === 'returned' ? 'back' : 'now',
        ),
        step('reviewer', STAGE_WHO.reviewer, STAGE_WHAT.review, STAGE_WHEN.whenResubmitted, 'next'),
        step('you', STAGE_WHO.you, STAGE_WHAT.decision, STAGE_WHEN.afterApproval, 'next'),
        listedNext,
      ];
    }
  }
}

/**
 * A correction's four stages — you → Academic Reviewer → Super Admin → everyone (the CM-05 band's
 * open correction, CM-08 list cards and the CM-08 detail band). `liveLabel`: the experiment's live
 * version; by default the one the update started from (`baseVersionLabel`), which stays live while
 * the update is open — a page that reads the experiment passes its live label. Dates: the draft's
 * last save (`updatedAt`: its start or its last save — saving writes no history entry), the send
 * (`sentForReviewAt`), the reviewer's last return and approval (`reviewDecisions`), the last lift of
 * a hold (`holdLifts`), the hold (`hold.at`), the release (`release.at`), the withdrawal
 * (`withdrawal.at`).
 */
export function correctionStages(
  update: Pick<
    CorrectionUpdate,
    | 'state'
    | 'baseVersionLabel'
    | 'versionLabel'
    | 'updatedAt'
    | 'sentForReviewAt'
    | 'reviewDecisions'
    | 'holdLifts'
    | 'hold'
    | 'release'
    | 'withdrawal'
  >,
  liveLabel: string = update.baseVersionLabel,
): CmStep[] {
  const sent = step('you', STAGE_WHO.you, STAGE_WHAT.sent, day(update.sentForReviewAt), 'done');
  const approved = step(
    'reviewer',
    STAGE_WHO.reviewer,
    STAGE_WHAT.approved,
    day(lastUpdateDecision(update, 'approve')?.at),
    'done',
  );
  const reviewNext = step(
    'reviewer',
    STAGE_WHO.reviewer,
    STAGE_WHAT.review,
    STAGE_WHEN.afterYouSend,
    'next',
  );
  const releaseNext = step(
    'release',
    STAGE_WHO.superAdmin,
    STAGE_WHAT.releaseDecision,
    STAGE_WHEN.afterApproval,
    'next',
  );
  const liveNext = step(
    'live',
    STAGE_WHO.everyone,
    STAGE_WHAT.live,
    STAGE_WHEN.whenReleased,
    'next',
  );
  switch (update.state) {
    case 'draft':
      return [
        step('you', STAGE_WHO.you, STAGE_WHAT.draft, on(update.updatedAt, savedOn), 'you', 'edit'),
        reviewNext,
        releaseNext,
        liveNext,
      ];
    case 'returned':
      return [
        step(
          'you',
          STAGE_WHO.you,
          STAGE_WHAT.returnedToYou,
          STAGE_WHEN.changeAndSend,
          'you',
          'edit',
        ),
        step(
          'reviewer',
          STAGE_WHO.reviewer,
          STAGE_WHAT.review,
          on(lastUpdateDecision(update, 'return-to-content-manager')?.at, (value) =>
            returnedOn(value, null),
          ),
          'back',
        ),
        releaseNext,
        liveNext,
      ];
    case 'in-academic-review':
      return [
        sent,
        step(
          'reviewer',
          STAGE_WHO.reviewer,
          STAGE_WHAT.review,
          on(update.sentForReviewAt, sinceDay),
          'now',
        ),
        releaseNext,
        liveNext,
      ];
    case 'awaiting-release-decision':
      return [
        sent,
        approved,
        step(
          'release',
          STAGE_WHO.superAdmin,
          STAGE_WHAT.releaseDecision,
          on(awaitingSince(update), waitingSince),
          'now',
        ),
        step('live', STAGE_WHO.everyone, STAGE_WHAT.live, whenReleasedLiveNow(liveLabel), 'next'),
      ];
    case 'on-hold':
      return [
        sent,
        approved,
        step(
          'release',
          STAGE_WHO.superAdmin,
          STAGE_WHAT.onHold,
          on(update.hold?.at, sinceDay),
          'held',
        ),
        step('live', STAGE_WHO.everyone, STAGE_WHAT.live, staysLive(liveLabel), 'next'),
      ];
    case 'released':
      return [
        sent,
        approved,
        step('release', STAGE_WHO.superAdmin, STAGE_WHAT.released, day(update.release?.at), 'done'),
        step(
          'live',
          STAGE_WHO.everyone,
          STAGE_WHAT.live,
          on(update.release?.at, (value) => versionSince(update.versionLabel ?? '', value)),
          'done',
        ),
      ];
    case 'withdrawn':
      return [
        step('you', STAGE_WHO.you, STAGE_WHAT.withdrawn, day(update.withdrawal?.at), 'off'),
        step('reviewer', STAGE_WHO.reviewer, STAGE_WHAT.review, STAGE_WHEN.closedUndecided, 'off'),
        step(
          'release',
          STAGE_WHO.superAdmin,
          STAGE_WHAT.releaseDecision,
          STAGE_WHEN.closedUndecided,
          'off',
        ),
        step('live', STAGE_WHO.everyone, STAGE_WHAT.live, versionUnchanged(liveLabel), 'off'),
      ];
  }
}
