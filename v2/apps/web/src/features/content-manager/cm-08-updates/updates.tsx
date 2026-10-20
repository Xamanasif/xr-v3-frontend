'use client';

import type { CorrectionUpdate, UpdateState } from '@xr/domain';
import {
  Button,
  ButtonLink,
  CmQuote,
  CmStageTrack,
  CmTrackerCount,
  CmTrackerFoot,
  CmTrackerItem,
  CmTrackerLoading,
  type CmTrackerOutcome,
  CmTrackerSection,
  CmUpdatesHead,
  CmVersionChange,
  ListState,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, useRef } from 'react';

import {
  heldNoteBy,
  quotedReason,
  releasedOutcome,
  returnedNoteBy,
  TRACKER,
  TRACKER_GROUPS,
  trackerActionLabel,
  trackerCount,
  trackerMeta,
  UPDATES_HEAD,
  withdrawnNoteBy,
  withdrawnOutcome,
} from '@/copy/cm-correction';
import { STAGE_TRACK_LABEL } from '@/copy/cm-shared';
import { dayMonth, dayMonthYear, weekdayDate } from '@/copy/dates';
import {
  correctionAddress,
  libraryAddress,
  UPDATES_TITLE,
  updatesPlacement,
} from '@/nav/content-manager';
import type { MyUpdateRow } from '@/queries/correction-view';
import { useMyUpdates } from '@/queries/corrections';
import { useContentLibrary, usePlatformCourseCodes } from '@/queries/production';
import { useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { cmActorName, lastUpdateDecision } from '../shared/records';
import { CM_STAGE_STATE_WORDS, correctionStages } from '../shared/stages';
import { cmUpdatePill } from '../shared/status';
import { correctionVersionChange } from '../shared/version-change';

const TITLE_ID = 'cm-h-updates';
const FAILED_TITLE_ID = 'cm-upd-fail-t';

/** Who must act on a correction (the export's sections): hers, the chain's, or closed. */
type Group = 'you' | 'others' | 'closed';

const GROUP_OF: Readonly<Record<UpdateState, Group>> = {
  draft: 'you',
  returned: 'you',
  'in-academic-review': 'others',
  'awaiting-release-decision': 'others',
  'on-hold': 'others',
  released: 'closed',
  withdrawn: 'closed',
};

const GROUP_IDS: Readonly<Record<Group, string>> = {
  you: 'cm-upd-you',
  others: 'cm-upd-others',
  closed: 'cm-upd-closed',
};

/**
 * The “last change” on a card (state-copy `CM-08.list.rows`): the update's latest step in its
 * history, or its last save when later (a draft save writes no history entry).
 */
export function lastChangeOf(update: CorrectionUpdate): string {
  const step = update.history.at(-1)?.at;
  return step && step > update.updatedAt ? step : update.updatedAt;
}

/** The course and live version of each published experiment, for the cards' meta and versions. */
interface ExperimentFacts {
  readonly course: string | null;
  readonly live: string | null;
}

/** Today's date on phones (`p.rb-eyebrow-date`), from the session's clock. */
function useTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}

/**
 * CM-08 Updates — the owner-approved Content Manager export's correction tracker
 * (design/v3-refined-b/roles/CM-v1, `Main.dc.html` “CM-08 Updates list”, boards CM08-Updates, L07,
 * L13, L14), at `/content-manager/updates`: “Which corrections did I raise, where is each one, and
 * who must act?”.
 *
 * - **Read**: `CorrectionService.listUpdates` — every correction the Content Manager may see, the
 *   most recent change first (the service's order, kept within each group). For each card's course
 *   and the experiment's live version, the Content library's published experiments
 *   (`getLibrary`) and the platform course codes (`platformCourseCodes.list`); if either fails the
 *   cards leave the course out and read the version the correction started from.
 * - **As the export draws it**: “Updates” with its line and two figures (Need you · With others);
 *   the count; the cards grouped by who must act — Need you (draft, returned; gold), With others
 *   (in academic review, awaiting the release decision, on hold), Closed (released, withdrawn) —
 *   each with its name, course and last change, its version change, status and action
 *   (“Continue” while it is hers, else “Open”: both open the correction's page, named by the
 *   experiment and the version label — never by the update's reference, which stays in the
 *   address: state-copy `CM-08.no-reference`), the mini
 *   four-stage track, or once closed its outcome line, and the return, hold or withdrawal reason
 *   quoted. Empty; loading (the count and figures hidden); couldn't load with Try again (reads the
 *   list again and moves focus to the page title).
 * - Nothing here changes a record: every action opens the page where the work is done.
 */
export function Updates() {
  useShellPage(updatesPlacement());
  const today = useTodayLine();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const read = useMyUpdates();
  const library = useContentLibrary({ tab: 'published', search: '' });
  const codes = usePlatformCourseCodes();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const loading = !failed && (rows === null || library.isPending || codes.isPending);

  const retry = () => {
    titleRef.current?.focus();
    void read.refetch();
    if (library.isError) void library.refetch();
    if (codes.isError) void codes.refetch();
  };

  const facts = new Map<string, ExperimentFacts>();
  if (library.data?.ok) {
    const courses = codes.data?.ok ? codes.data.value : [];
    for (const row of library.data.value.rows) {
      if (row.kind !== 'experiment') continue;
      const course = courses.find((entry) => entry.course.id === row.experiment.courseId);
      const code = course?.course.platformCode ?? row.courseCode;
      const name = course?.course.name ?? null;
      facts.set(row.experiment.id, {
        course: code && name ? `${code} · ${name}` : (name ?? code),
        live: row.experiment.live.label,
      });
    }
  }

  const shown = !loading && !failed && rows !== null;
  const mine = shown ? rows.filter((row) => GROUP_OF[row.update.state] === 'you') : [];
  const others = shown ? rows.filter((row) => GROUP_OF[row.update.state] === 'others') : [];
  const closed = shown ? rows.filter((row) => GROUP_OF[row.update.state] === 'closed') : [];

  return (
    <>
      <CmUpdatesHead
        title={UPDATES_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today}
        lead={UPDATES_HEAD.lead}
        figuresLabel={UPDATES_HEAD.figuresLabel}
        figures={
          shown && rows.length > 0
            ? [
                {
                  title: UPDATES_HEAD.needYou,
                  value: mine.length,
                  details: [mine.length ? UPDATES_HEAD.needYouSome : UPDATES_HEAD.needYouNone],
                },
                {
                  title: UPDATES_HEAD.withOthers,
                  value: others.length,
                  details: [
                    others.length ? UPDATES_HEAD.withOthersSome : UPDATES_HEAD.withOthersNone,
                  ],
                },
              ]
            : []
        }
      />
      {failed ? (
        <Surface labelledBy={FAILED_TITLE_ID}>
          <ListState
            kind="failed"
            roomy
            titleAs="h2"
            titleId={FAILED_TITLE_ID}
            title={TRACKER.failedTitle}
            action={
              <Button id="cm-upd-retry" onClick={retry}>
                {TRACKER.tryAgain}
              </Button>
            }
          >
            {TRACKER.failedLine}
          </ListState>
        </Surface>
      ) : loading || rows === null ? (
        <CmTrackerLoading message={TRACKER.loading} label={TRACKER.surface} />
      ) : rows.length === 0 ? (
        <Surface label={TRACKER.surface}>
          <ListState
            kind="empty"
            icon="updates"
            roomy
            titleAs="h2"
            title={TRACKER.emptyTitle}
            action={
              <ButtonLink href={libraryAddress('published')}>{TRACKER.openLibrary}</ButtonLink>
            }
          >
            {TRACKER.emptyLine}
          </ListState>
        </Surface>
      ) : (
        <>
          <CmTrackerCount>{trackerCount(rows.length)}</CmTrackerCount>
          <Group group="you" rows={mine} facts={facts} />
          <Group group="others" rows={others} facts={facts} />
          <Group group="closed" rows={closed} facts={facts} />
          <CmTrackerFoot>{TRACKER.foot}</CmTrackerFoot>
        </>
      )}
    </>
  );
}

/** One group of cards; a group with no correction is not shown. */
function Group({
  group,
  rows,
  facts,
}: {
  readonly group: Group;
  readonly rows: readonly MyUpdateRow[];
  readonly facts: ReadonlyMap<string, ExperimentFacts>;
}) {
  if (rows.length === 0) return null;
  return (
    <CmTrackerSection
      title={TRACKER_GROUPS[group].title}
      titleId={GROUP_IDS[group]}
      count={rows.length}
      countYou={group === 'you'}
      note={TRACKER_GROUPS[group].note}
    >
      {rows.map((row) => (
        <TrackerEntry
          key={row.update.id}
          row={row}
          facts={facts.get(row.update.experimentId) ?? null}
        />
      ))}
    </CmTrackerSection>
  );
}

/** One correction's card (the export's `updListVM` row). */
function TrackerEntry({
  row,
  facts,
}: {
  readonly row: MyUpdateRow;
  readonly facts: ExperimentFacts | null;
}) {
  const { update, experimentName } = row;
  const group = GROUP_OF[update.state];
  const yours = group === 'you';
  const isClosed = group === 'closed';
  const pill = cmUpdatePill(update.state);
  const live = facts?.live ?? update.baseVersionLabel;
  return (
    <CmTrackerItem
      yours={yours}
      closed={isClosed}
      name={experimentName}
      meta={trackerMeta(facts?.course ?? null, dayMonth(lastChangeOf(update)))}
      version={<CmVersionChange {...correctionVersionChange(update, live)} />}
      status={<StatusPill tone={pill.tone}>{pill.words}</StatusPill>}
      action={
        <ButtonLink
          variant={yours ? 'primary' : 'default'}
          href={correctionAddress(update.id)}
          aria-label={trackerActionLabel(yours, experimentName, update.versionLabel, pill.words)}
        >
          {yours ? TRACKER.continue : TRACKER.open}
        </ButtonLink>
      }
      track={
        isClosed ? undefined : (
          <CmStageTrack
            placement="tracker"
            mini
            label={STAGE_TRACK_LABEL.correction}
            steps={correctionStages(update, live)}
            stateWords={CM_STAGE_STATE_WORDS}
          />
        )
      }
      outcome={outcomeOf(update)}
      note={noteOf(update)}
    />
  );
}

/** A closed correction's outcome line (`res`). */
function outcomeOf(update: CorrectionUpdate): CmTrackerOutcome | undefined {
  if (update.state === 'released' && update.release) {
    return {
      kind: 'released',
      text: releasedOutcome(
        cmActorName(update.release.by),
        dayMonthYear(update.release.at),
        update.versionLabel ?? '',
      ),
    };
  }
  if (update.state === 'withdrawn' && update.withdrawal) {
    return { kind: 'withdrawn', text: withdrawnOutcome(dayMonthYear(update.withdrawal.at)) };
  }
  return undefined;
}

/** The return, hold or withdrawal reason under a card (`note`, `noteBy`). */
function noteOf(update: CorrectionUpdate): ReactNode {
  if (update.state === 'returned') {
    const returned = lastUpdateDecision(update, 'return-to-content-manager');
    if (!returned?.reason) return null;
    return (
      <CmQuote
        tracker
        quote={quotedReason(returned.reason)}
        by={returnedNoteBy(cmActorName(returned.by), dayMonth(returned.at))}
      />
    );
  }
  if (update.state === 'on-hold' && update.hold) {
    return (
      <CmQuote
        tracker
        quote={quotedReason(update.hold.reason)}
        by={heldNoteBy(cmActorName(update.hold.by), dayMonth(update.hold.at))}
      />
    );
  }
  if (update.state === 'withdrawn' && update.withdrawal) {
    return (
      <CmQuote
        tracker
        quote={quotedReason(update.withdrawal.reason)}
        by={withdrawnNoteBy(dayMonth(update.withdrawal.at))}
      />
    );
  }
  return null;
}
