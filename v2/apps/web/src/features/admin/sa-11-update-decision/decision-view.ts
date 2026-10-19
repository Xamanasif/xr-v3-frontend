/**
 * SA-11 as a view of the correction the Super Admin reads (`getUpdateDecision`) — pure functions,
 * no React. The record carries canonical facts only (its state, proposed fields, review decisions,
 * hold, lifts, release and history); the words are the Super Admin export's (`@/copy/sa-content`,
 * the export's `V.update`), the history's those of B7-05 (`@/copy/release`) or the state-copy
 * register's. Nothing here decides what the Super Admin may do: the panel offers what the export
 * draws for the state the service answered (Release · Hold while waiting, Lift hold while held,
 * nothing once released), and the service decides each command again. A correction is named by
 * its experiment and versions, never by its reference.
 */
import type { ActorRef, CorrectionUpdate, InstitutionStatus, Technology } from '@xr/domain';
import { FORMAT_META, inDisplayOrder, ROLE_LABEL } from '@xr/domain';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { HISTORY, updateName } from '@/copy/release';
import { accessPlanCell, CORRECTION_STATUS, type ContentTone } from '@/copy/sa-content';
import { stateWords } from '@/copy/state-copy';
import type { UpdateDecisionView } from '@/queries/correction-view';

import { institutionStatusWords } from '../shared/institution-status';

/** The panel the export draws for the state: waiting, on hold, released; `other` none. */
export type DecisionKind = 'waiting' | 'held' | 'released' | 'other';

export interface TimelineEntry {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note?: string | null;
}

export interface DecisionFacts {
  readonly kind: DecisionKind;
  /** “Distillation Column · 1.2 → 1.3” (state-copy `SA-11.title`): the record's full name. */
  readonly title: string;
  /** The experiment's live name: the page's H1. */
  readonly experiment: string;
  /** The version live now (the released one once released). */
  readonly liveVersion: string;
  /** The version the update proposes (or released). */
  readonly proposedVersion: string;
  /** The version it started from: “Live before” once released. */
  readonly baseVersion: string;
  /** The versions the head names: the live one (or the one it replaced) → the proposed one. */
  readonly from: string;
  readonly to: string;
  readonly chip: { readonly words: string; readonly tone: ContentTone } | null;
  /** The day of the last lift while the update waits again, else `null`. */
  readonly liftedOn: string | null;
  /** Who raised it and their role (the reason's by-line). */
  readonly raisedBy: { readonly name: string; readonly role: string };
  /** The approval that sent it to her: by whom, its day and its moment; `null` before one. */
  readonly approval: { readonly by: string; readonly day: string; readonly at: string } | null;
  /** The held panel: when, by whom and why. */
  readonly hold: { readonly on: string; readonly by: string; readonly reason: string } | null;
  /** The decided panel: when and by whom. */
  readonly release: { readonly on: string; readonly by: string } | null;
  readonly history: readonly TimelineEntry[];
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
      return CORRECTION_STATUS[update.state];
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
 * The record's history, newest first (B7-05 `uh`, the export's `hist`): started, sent, approved,
 * held, lifted, released — each in the board's words; a return or a withdrawal in the register's
 * (`SA-11.history.*`).
 */
export function historyEvents(update: CorrectionUpdate): readonly TimelineEntry[] {
  const base = update.baseVersionLabel;
  const events = update.history.flatMap((entry): TimelineEntry[] => {
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
          { id: entry.id, what: HISTORY.approved(by), when, note: HISTORY.approvedNote(base) },
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
    from,
    to: proposedVersion,
    chip: chipOf(update),
    liftedOn: kind === 'waiting' && lastLift ? dayMonthYear(lastLift.at) : null,
    raisedBy: {
      name: actorName(startedBy),
      role: startedBy.kind === 'person' ? ROLE_LABEL[startedBy.role] : '',
    },
    approval: approval
      ? {
          by: actorName(approval.by),
          day: dayMonthYear(approval.at),
          at: dateTime(approval.at),
        }
      : null,
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

/** The formats of a list, as the export names them: "WEB, VR". */
export function formatWords(formats: readonly Technology[]): readonly string[] {
  return inDisplayOrder(formats).map((format) => FORMAT_META[format].code);
}

/** One row of “Institutions using it” (the export's `using`). */
export interface InstitutionUsingRow {
  readonly key: string;
  readonly name: string;
  /** "In its access plan · WEB, VR". */
  readonly access: string;
  /** The institution's status in words ("Ending soon"). */
  readonly status: string;
}

/**
 * The institutions whose current access plan includes the experiment, as the service lists them,
 * named and given their status from the institutions read. The plan is never named by its
 * reference.
 */
export function institutionRows(
  view: UpdateDecisionView,
  institutions: ReadonlyMap<string, { readonly name: string; readonly status: InstitutionStatus }>,
): readonly InstitutionUsingRow[] {
  return view.institutionsUsingIt.map((entry) => {
    const institution = institutions.get(entry.institutionId);
    return {
      key: `${entry.institutionId}:${entry.planId}`,
      name: institution?.name ?? entry.institutionId,
      access: accessPlanCell(formatWords(entry.formats)),
      status: institution ? institutionStatusWords(institution.status) : '',
    };
  });
}
