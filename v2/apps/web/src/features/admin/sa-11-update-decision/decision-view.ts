/**
 * SA-11 as a view of the UPD record the Super Admin reads (`getUpdateDecision`) — pure functions,
 * no React. The record carries canonical facts only (its state, proposed fields, review
 * decisions, hold, lifts, release and history); the words are B7-05's (`@/copy/release`) or the
 * state-copy register's. Nothing here decides what the Super Admin may do: the panel offers what
 * B7-05 draws for the state the service answered (Release · Hold while waiting, Lift hold while
 * held, nothing once released), and the service decides each command again.
 */
import type { AccessEndingRow, ActorRef, CorrectionUpdate } from '@xr/domain';
import { ROLE_LABEL } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui';

import { calendarDay, dateTime, dayMonthYear } from '@/copy/dates';
import { formatName } from '@/copy/flow-state-words';
import {
  accessCell,
  accessEndsNote,
  approvedByLine,
  HISTORY,
  liveLine,
  raisedLine,
  studentsCell,
  UPDATE_STATUS,
  updateName,
} from '@/copy/release';
import { stateWords } from '@/copy/state-copy';
import type { UpdateDecisionView } from '@/queries/correction-view';

/** The panel B7-05 draws for the state: open (f1), held (f5), decided (f6); `other` none. */
export type DecisionKind = 'waiting' | 'held' | 'released' | 'other';

export interface DecisionFacts {
  readonly kind: DecisionKind;
  /** “Distillation Column · 1.2 → 1.3” (SA-11.title). */
  readonly title: string;
  /** The experiment's live name. */
  readonly experiment: string;
  /** The version live now (the released one once released). */
  readonly liveVersion: string;
  /** The version the update proposes (or released). */
  readonly proposedVersion: string;
  /** The version it started from: “Live before” once released. */
  readonly baseVersion: string;
  readonly chip: { readonly words: string; readonly tone: StatusTone } | null;
  /** “Live now: version 1.2 · since 3 Jul 2026”. */
  readonly liveLine: string;
  /** The day of the last lift while the update waits again (f7), else `null`. */
  readonly liftedOn: string | null;
  /** “Raised by Kavya Nair, Content Manager · started … · sent for academic review …”. */
  readonly raised: string;
  /** “Approved by Prof. A. Menon on 27 Aug 2026”, or `null` before an approval. */
  readonly approval: string | null;
  /** The held panel: when, by whom and why (f5). */
  readonly hold: { readonly on: string; readonly by: string; readonly reason: string } | null;
  /** The decided panel: when and by whom (f6). */
  readonly release: { readonly on: string; readonly by: string } | null;
  readonly history: readonly TimelineEvent[];
}

/** A person's name as the record stamped it. */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  return actor.kind === 'requester' ? actor.name : '';
}

function kindOf(update: CorrectionUpdate): DecisionKind {
  switch (update.state) {
    case 'awaiting-release-decision':
      return 'waiting';
    case 'on-hold':
      return 'held';
    case 'released':
      return 'released';
    default:
      return 'other';
  }
}

function chipOf(update: CorrectionUpdate): DecisionFacts['chip'] {
  switch (update.state) {
    case 'awaiting-release-decision':
    case 'on-hold':
    case 'released':
      return UPDATE_STATUS[update.state];
    default:
      return null;
  }
}

/** The reviewer whose decision followed a send at `at` (the “To <reviewer>” of its note). */
function reviewerAfter(update: CorrectionUpdate, at: string): string {
  const decision = update.reviewDecisions.find((entry) => entry.at >= at);
  return decision ? actorName(decision.by) : stateWords('SA-11.history.sent-to');
}

/**
 * The record's history, newest first (B7-05 `uh`): started, sent, approved, held, lifted,
 * released — each in the board's words; a return or a withdrawal in the register's
 * (`SA-11.history.*`).
 */
export function historyEvents(update: CorrectionUpdate): readonly TimelineEvent[] {
  const base = update.baseVersionLabel;
  const events = update.history.flatMap((entry): TimelineEvent[] => {
    const when = dateTime(entry.at);
    const by = actorName(entry.actor);
    switch (entry.event) {
      case 'started':
        return [{ id: entry.id, what: HISTORY.started, when, note: HISTORY.startedNote(base) }];
      // A draft save writes no history entry (M28); one in the record is not drawn.
      case 'saved':
        return [];
      case 'sent-for-academic-review':
        return [
          {
            id: entry.id,
            what: HISTORY.sent,
            when,
            note: HISTORY.sentNote(reviewerAfter(update, entry.at), base),
          },
        ];
      case 'approved-by-reviewer':
        return [
          {
            id: entry.id,
            what: HISTORY.approved(by),
            when,
            note: HISTORY.approvedNote(base),
          },
        ];
      case 'returned-by-reviewer':
        return [
          {
            id: entry.id,
            what: stateWords('SA-11.history.returned').replace('{name}', by),
            when,
          },
        ];
      case 'put-on-hold':
        return [
          {
            id: entry.id,
            what: HISTORY.held(by),
            when,
            note: HISTORY.heldNote(entry.note ?? '', base),
          },
        ];
      case 'hold-lifted':
        return [{ id: entry.id, what: HISTORY.lifted(by), when, note: HISTORY.liftedNote }];
      case 'released':
        return [
          {
            id: entry.id,
            what: HISTORY.released(by),
            when,
            note: HISTORY.releasedNote(update.versionLabel ?? ''),
          },
        ];
      case 'withdrawn':
        return [
          {
            id: entry.id,
            what: stateWords('SA-11.history.withdrawn').replace('{name}', by),
            when,
          },
        ];
    }
  });
  return [...events].reverse();
}

export function decisionFacts(view: UpdateDecisionView): DecisionFacts {
  const { update } = view;
  const kind = kindOf(update);
  const released = kind === 'released';
  const experiment =
    view.comparison.find((row) => row.field === 'name')?.liveNow ?? update.proposed.name;
  const liveVersion = view.liveLine.label;
  const proposedVersion = update.versionLabel ?? liveVersion;
  const baseVersion = update.baseVersionLabel;
  const from = released ? baseVersion : liveVersion;
  const approval = update.reviewDecisions.findLast((entry) => entry.decision === 'approve');
  const lastLift = update.holdLifts.at(-1);
  const startedBy = update.startedBy;
  return {
    kind,
    title: updateName(experiment, from, proposedVersion),
    experiment,
    liveVersion,
    proposedVersion,
    baseVersion,
    chip: chipOf(update),
    liveLine: liveLine(liveVersion, dayMonthYear(view.liveLine.since), released),
    liftedOn: kind === 'waiting' && lastLift ? dayMonthYear(lastLift.at) : null,
    raised: raisedLine(
      actorName(startedBy),
      startedBy.kind === 'person' ? ROLE_LABEL[startedBy.role] : '',
      dayMonthYear(update.startedAt),
      update.sentForReviewAt ? dayMonthYear(update.sentForReviewAt) : null,
    ),
    approval: approval ? approvedByLine(actorName(approval.by), dayMonthYear(approval.at)) : null,
    hold:
      kind === 'held' && update.hold
        ? {
            on: dayMonthYear(update.hold.at),
            by: actorName(update.hold.by),
            reason: update.hold.reason,
          }
        : null,
    release:
      released && update.release
        ? { on: dayMonthYear(update.release.at), by: actorName(update.release.by) }
        : null,
    history: historyEvents(update),
  };
}

/** One row of “Institutions using it” (B7-05 f1 `insts`). */
export interface InstitutionUsingRow {
  readonly key: string;
  readonly name: string;
  readonly access: string;
  readonly students: string;
  readonly note: string;
}

/**
 * The institutions whose current access plan includes the experiment, as the service lists them,
 * named from the institutions read and noted from Access ending (state-copy
 * `SA-11.institution-note`).
 */
export function institutionRows(
  view: UpdateDecisionView,
  names: ReadonlyMap<string, string>,
  ending: ReadonlyMap<string, AccessEndingRow>,
): readonly InstitutionUsingRow[] {
  return view.institutionsUsingIt.map((entry) => {
    const ends = ending.get(entry.planId);
    const note =
      entry.note ??
      (ends && ends.endedDaysAgo === null
        ? accessEndsNote(
            calendarDay(ends.endsOn),
            ends.standing.kind === 'renewal-in-progress' ? ends.standing.requestId : null,
          )
        : stateWords('SA-11.no-note'));
    return {
      key: `${entry.institutionId}:${entry.planId}`,
      name: names.get(entry.institutionId) ?? entry.institutionId,
      access: accessCell(entry.planId, entry.formats.map(formatName)),
      students: studentsCell(entry.studentsWithAccess),
      note,
    };
  });
}
