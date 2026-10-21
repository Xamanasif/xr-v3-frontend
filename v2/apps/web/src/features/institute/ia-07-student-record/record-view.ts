/**
 * IA-07 Student record as pure view helpers over `getStudent`'s answer (V3:
 * design/v3-refined-b/roles/IA-v1 `Main.dc.html` `vm07`, `saRow`, `stuHistory`): the "Experiments
 * given" lines, the "History" lines and the About values — words from the copy module, facts from
 * the record. Nothing here decides who can open what: each grant keeps its own word as the service
 * answers it (OD-B2-01). No line names a grant by its id (identifier rule).
 */
import type { GrantRow, StudentRecordView } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { calendarDay, dateTime, dayMonthYear } from '@/copy/dates';
import {
  accountInactiveNote,
  addedWords,
  givenIndividuallyNote,
  givenThroughGroupWords,
  givenWords,
  historyWhen,
  IA07,
  importedFromWords,
  noLicenceNote,
  pausedByNote,
  planEndedNote,
  quoted,
  withdrawnNote,
} from '@/copy/ia-access';
import { HISTORY_UNDRAWN } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';

import { actorName } from '../shared/actor-name';
import { formatCodes } from '../shared/format-codes';
import { grantStatusView } from '../shared/status-model';

/** Moved to `features/institute/shared/actor-name` (frozen API); re-exported for its importers. */
export { actorName };

/** What the record's notes need from the institution's standing (`getMyOverview`). */
export interface PlanFacts {
  /** The plan's last day ("2027-10-07"), for an ended grant's note. */
  readonly endsOn: string | null;
  /** When BITS paused the institution, for a paused grant's note. */
  readonly pausedSince: string | null;
}

/** One "Experiments given" row. */
export interface GrantLine {
  readonly key: string;
  readonly experimentName: string;
  readonly courseCode: string | null;
  readonly formats: readonly Technology[];
  /** Individually, or through a group (its page and name). */
  readonly group: { readonly id: string; readonly name: string } | null;
  /** When it was given: "9 Oct 2026". */
  readonly date: string;
  /** The active group grant that also has this experiment ("Also in …", "· not changed"). */
  readonly also: { readonly groupName: string; readonly notChanged: boolean } | null;
  readonly status: {
    readonly words: string;
    readonly tone: StatusTone;
    readonly notes: readonly string[];
  };
  /** A withdrawn grant (a muted row). */
  readonly muted: boolean;
}

function statusOf(row: GrantRow, fullName: string, plan: PlanFacts): GrantLine['status'] {
  const withdrawal = row.grant.withdrawal;
  const notes: string[] = [];
  if (withdrawal && (row.display === 'withdrawn' || row.display === 'individual-grant-withdrawn'))
    notes.push(withdrawnNote(dayMonthYear(withdrawal.at), withdrawal.reason));
  if (row.display === 'waiting-for-a-licence') notes.push(noLicenceNote(fullName));
  if (row.display === 'student-inactive') notes.push(accountInactiveNote(fullName));
  if (row.display === 'access-ended' && plan.endsOn)
    notes.push(planEndedNote(calendarDay(plan.endsOn)));
  if (row.display === 'paused' && plan.pausedSince)
    notes.push(pausedByNote(dayMonthYear(plan.pausedSince)));
  const { words, tone } = grantStatusView(row.display);
  return { words, tone, notes };
}

/**
 * The record's "Experiments given": one line per grant that reaches the student, in grant order. A
 * group grant that an individual grant of the same student is "Also in" has no line of its own —
 * it is the individual line's "Also in …" (state-copy `IA-07.also`).
 */
export function grantLines(record: StudentRecordView, plan: PlanFacts): GrantLine[] {
  const folded = new Set(
    record.grantRows.flatMap((row) => (row.alsoInGroupGrant ? [row.alsoInGroupGrant] : [])),
  );
  const groupName = (groupId: string) =>
    record.groups.find((group) => group.id === groupId)?.name ?? '';
  const groupOfGrant = (grantId: string) => {
    const grant = record.grants.find((candidate) => candidate.id === grantId);
    return grant?.target.kind === 'group' ? groupName(grant.target.groupId) : '';
  };
  const lines: GrantLine[] = [];
  for (const row of record.grantRows) {
    const { grant } = row;
    if (grant.target.kind === 'group' && folded.has(grant.id)) continue;
    lines.push({
      key: grant.id,
      experimentName: row.experimentName,
      courseCode: row.courseCode,
      formats: row.formats,
      group:
        grant.target.kind === 'group'
          ? { id: grant.target.groupId, name: groupName(grant.target.groupId) }
          : null,
      date: dayMonthYear(grant.givenAt),
      also: row.alsoInGroupGrant
        ? { groupName: groupOfGrant(row.alsoInGroupGrant), notChanged: grant.state === 'withdrawn' }
        : null,
      status: statusOf(row, record.student.fullName, plan),
      muted: row.display === 'withdrawn',
    });
  }
  return lines;
}

/** One "History" line: what · when · note. */
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
    return record.groups.find((group) => group.id === id)?.name ?? null;
  };
  const lines: HistoryLine[] = [];
  for (const entry of student.history) {
    const when = historyWhen(dateTime(entry.at), actorName(entry.actor));
    const grantId = entry.refs.find((ref) => ref.kind === 'SACC')?.id;
    const row = rowOf(grantId);
    let what: string | null = null;
    let note: string | null = null;
    switch (entry.event) {
      case 'imported':
        what = IA07.historyAdded;
        note = entry.note ? importedFromWords(entry.note) : null;
        break;
      case 'added':
        what = IA07.historyAdded;
        note = IA07.historyAddedForm;
        break;
      case 'access-given': {
        const waiting = row?.display === 'waiting-for-a-licence';
        if (!row) {
          // A grant the record no longer lists (a group the student has left): no name to give it.
          what = stateWords('IA-07.history.unlisted');
        } else if (row.grant.target.kind === 'group') {
          what = givenThroughGroupWords(row.experimentName, groupName(row) ?? '');
          note = waiting ? IA07.historyGroupGrantWaiting : IA07.historyGroupGrant;
        } else {
          what = givenWords(row.experimentName);
          note = givenIndividuallyNote(formatCodes(row.formats), waiting);
        }
        break;
      }
      case 'access-withdrawn':
        what = IA07.historyWithdrawn;
        note = entry.note
          ? `${quoted(entry.note)}${row?.alsoInGroupGrant ? IA07.historyGroupNotChanged : ''}`
          : null;
        break;
      case 'deactivated':
        what = IA07.historyDeactivated;
        note = entry.note ? quoted(entry.note) : null;
        break;
      case 'reactivated':
        what = IA07.historyReactivated;
        break;
      case 'status-overridden':
        what = HISTORY_UNDRAWN.statusChanged;
        note = entry.note ? quoted(entry.note) : null;
        break;
      default:
        // Group membership and Faculty course events are not written to a student's history.
        break;
    }
    if (what !== null) lines.push({ id: entry.id, what, when, note });
  }
  return lines.reverse();
}

/** "Added": "8 Oct 2026 · imported by Meera Iyer" (or added one at a time). */
export function addedLine(record: StudentRecordView): string {
  const { added } = record.student;
  return addedWords(
    dayMonthYear(added.at),
    added.how === 'import' ? 'import' : 'form',
    actorName(added.by) ?? '',
  );
}
