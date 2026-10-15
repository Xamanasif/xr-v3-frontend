/**
 * IA-07 Student record (B2-06 f8 … f13, f17) as pure view helpers over `getStudent`'s answer: the
 * "Experiments given" lines, the "History" lines and the "Details" values — words from the copy
 * modules, facts from the record. Nothing here decides who can open what: each grant keeps its own
 * word as the service answers it (OD-B2-01).
 */
import type { GrantRow, StudentRecordView } from '@xr/contracts/draft';
import type { ActorRef, GrantDisplayStatus, Technology } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  addedByWords,
  firstName,
  givenIndividuallyNote,
  givenThroughGroupHistory,
  givenWords,
  groupGrantNotChanged,
  HISTORY_UNDRAWN,
  historyWhen,
  importedByWords,
  importedFromWords,
  inactiveGrantLine,
  individualWithdrawnWords,
  OTHER_GRANT_WORDS,
  quotedReason,
  RECORD_GRANT_WORDS,
  RECORD_PAGE,
  waitingLine,
  withdrawnLine,
} from '@/copy/institute-people';

/** Who did it, as the history and the inactive notice name them ("Meera Iyer"). */
export function actorName(actor: ActorRef): string | null {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return null;
}

/** One "Experiments given" row (B2-06 f9). */
export interface GrantLine {
  readonly grantId: string;
  readonly experimentName: string;
  readonly courseCode: string | null;
  readonly formats: readonly Technology[];
  readonly planId: string;
  /** "Individually · 9 Oct 2026 · " or "Group ME ZG523 — Sem II · 12 Oct 2026 · ". */
  readonly how:
    | { readonly kind: 'individual'; readonly date: string }
    | { readonly kind: 'group'; readonly groupName: string; readonly date: string };
  /** B2-06 f17 / B2-04: the active group grant that also has this experiment. */
  readonly also: {
    readonly groupName: string;
    readonly grantId: string;
    readonly notChanged: boolean;
  } | null;
  readonly status: {
    readonly words: string;
    readonly tone: StatusTone;
    readonly line: string | null;
  };
}

const TONE: Readonly<Record<GrantDisplayStatus, StatusTone>> = {
  active: 'ok',
  'waiting-for-a-licence': 'wait',
  'student-inactive': 'off',
  'individual-grant-withdrawn': 'off',
  withdrawn: 'off',
  'access-ended': 'off',
  paused: 'paused',
};

function statusOf(row: GrantRow, fullName: string): GrantLine['status'] {
  const tone = TONE[row.display];
  const withdrawal = row.grant.withdrawal;
  switch (row.display) {
    case 'active':
    case 'waiting-for-a-licence':
    case 'student-inactive':
    case 'individual-grant-withdrawn':
      return {
        words: RECORD_GRANT_WORDS[row.display],
        tone,
        line:
          row.display === 'waiting-for-a-licence'
            ? waitingLine(fullName, row.grant.accessPlanId)
            : row.display === 'student-inactive'
              ? inactiveGrantLine(fullName)
              : row.display === 'individual-grant-withdrawn' && withdrawal
                ? withdrawnLine(dayMonthYear(withdrawal.at), withdrawal.reason)
                : null,
      };
    case 'withdrawn':
      return {
        words: OTHER_GRANT_WORDS.withdrawn,
        tone,
        line: withdrawal ? withdrawnLine(dayMonthYear(withdrawal.at), withdrawal.reason) : null,
      };
    case 'access-ended':
    case 'paused':
      return { words: OTHER_GRANT_WORDS[row.display], tone, line: null };
  }
}

/**
 * The record's "Experiments given": one line per grant that reaches the student, in grant order. A
 * group grant that an individual grant of the same student is "Also in" has no line of its own —
 * it is the individual line's "Also in …" (B2-06 f17; state-copy `IA-07.also`).
 */
export function grantLines(record: StudentRecordView): GrantLine[] {
  const folded = new Set(
    record.grantRows.flatMap((row) => (row.alsoInGroupGrant ? [row.alsoInGroupGrant] : [])),
  );
  const groupName = (groupId: string) =>
    record.groups.find((group) => group.id === groupId)?.name ?? groupId;
  const groupOfGrant = (grantId: string) => {
    const grant = record.grants.find((candidate) => candidate.id === grantId);
    return grant?.target.kind === 'group' ? groupName(grant.target.groupId) : grantId;
  };
  const lines: GrantLine[] = [];
  for (const row of record.grantRows) {
    const { grant } = row;
    if (grant.target.kind === 'group' && folded.has(grant.id)) continue;
    const date = dayMonthYear(grant.givenAt);
    lines.push({
      grantId: grant.id,
      experimentName: row.experimentName,
      courseCode: row.courseCode,
      formats: row.formats,
      planId: grant.accessPlanId,
      how:
        grant.target.kind === 'group'
          ? { kind: 'group', groupName: groupName(grant.target.groupId), date }
          : { kind: 'individual', date },
      also: row.alsoInGroupGrant
        ? {
            groupName: groupOfGrant(row.alsoInGroupGrant),
            grantId: row.alsoInGroupGrant,
            notChanged: grant.state === 'withdrawn',
          }
        : null,
      status: statusOf(row, record.student.fullName),
    });
  }
  return lines;
}

/** One "History" line (B2-06 f8 … f11, f17): what · when · note. */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/** The record's history, newest first (state-copy `IA-07.history`). */
export function historyLines(record: StudentRecordView): HistoryLine[] {
  const { student } = record;
  const rowOf = (grantId: string | undefined) =>
    record.grantRows.find((row) => row.grant.id === grantId);
  const groupName = (row: GrantRow | undefined) => {
    if (row?.grant.target.kind !== 'group') return null;
    const id = row.grant.target.groupId;
    return record.groups.find((group) => group.id === id)?.name ?? id;
  };
  const lines: HistoryLine[] = [];
  for (const entry of student.history) {
    const who = actorName(entry.actor);
    const when = who ? historyWhen(dateTime(entry.at), who) : dateTime(entry.at);
    const grantId = entry.refs.find((ref) => ref.kind === 'SACC')?.id;
    const row = rowOf(grantId);
    let what: string | null = null;
    let note: string | null = null;
    switch (entry.event) {
      case 'imported':
        what = RECORD_PAGE.historyAdded;
        note = entry.note ? importedFromWords(entry.note) : null;
        break;
      case 'added':
        what = RECORD_PAGE.historyAdded;
        break;
      case 'access-given': {
        const group = groupName(row);
        if (!row || !grantId) {
          // A grant the record no longer lists: its ID stands in for the experiment.
          what = givenWords(grantId ?? '');
        } else if (group !== null) {
          what = givenThroughGroupHistory(row.experimentName, group);
          note = grantId;
        } else {
          what = givenWords(row.experimentName);
          note = givenIndividuallyNote(grantId, row.formats, row.grant.accessPlanId);
        }
        break;
      }
      case 'access-withdrawn':
        what = individualWithdrawnWords(grantId ?? '');
        note = entry.note
          ? `${quotedReason(entry.note)}${row?.alsoInGroupGrant ? groupGrantNotChanged(row.alsoInGroupGrant) : ''}`
          : null;
        break;
      case 'deactivated':
        what = RECORD_PAGE.historyDeactivated;
        note = entry.note ? quotedReason(entry.note) : null;
        break;
      case 'reactivated':
        what = HISTORY_UNDRAWN.reactivated;
        break;
      case 'status-overridden':
        what = HISTORY_UNDRAWN.statusChanged;
        note = entry.note ? quotedReason(entry.note) : null;
        break;
      default:
        // Group membership and Faculty course events are not written to a student's history.
        break;
    }
    if (what !== null) lines.push({ id: entry.id, what, when, note });
  }
  return lines.reverse();
}

/** "Added": "8 Oct 2026 · imported by Meera Iyer" (or added one at a time, provisional). */
export function addedWords(record: StudentRecordView): string {
  const { added } = record.student;
  const date = dayMonthYear(added.at);
  const who = actorName(added.by) ?? '';
  return added.how === 'import' ? importedByWords(date, who) : addedByWords(date, who);
}

/** "Sneha" — the record's first name, as the boards' scripts take it. */
export function firstNameOf(record: StudentRecordView): string {
  return firstName(record.student.fullName);
}
