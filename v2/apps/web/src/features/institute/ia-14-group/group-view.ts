/**
 * IA-14 Group as pure view helpers over `getGroup`'s answer (V3: design/v3-refined-b/roles/IA-v1
 * `Main.dc.html` `vm14`, `memberStatus`): each member's status in words and the group's grants —
 * facts from the service, words from the copy module. Nothing here decides who can open what: a
 * member's words are the standing the service answers per group grant, the undecided overlap stays
 * undecided (OD-B2-01), a member added later is only "Added after the group grant" (OD-B2-02) and
 * licences are never counted (D7). No grant is named by its id (identifier rule).
 */
import type { GrantRow, GroupRecordView, MemberStanding } from '@xr/contracts/draft';
import type { StatusTone } from '@xr/ui/v3';

import { dayMonthYear } from '@/copy/dates';
import { givenOnWords, IA14 } from '@/copy/ia-access';
import { stateWords } from '@/copy/state-copy';

export type GroupMember = GroupRecordView['members'][number];
export type GroupGrantLine = GroupRecordView['grantRows'][number];

/** A member's status: the words, their tone and the note under them. */
export interface MemberStatus {
  readonly words: string;
  readonly tone: StatusTone;
  readonly note: string | null;
}

/** The group's live grants in the order the members' standings follow (`getGroupOutput`). */
export function liveGrants(view: GroupRecordView): readonly GroupGrantLine[] {
  return view.grantRows.filter((row) => row.status === 'active');
}

/**
 * The member's own active individual grant for an experiment, as Student access (IA-04) lists it:
 * when it was given ("Has it individually" · "Given 9 Oct 2026").
 */
export function individualGrantDate(
  accessRows: readonly GrantRow[],
  studentId: string,
  experimentId: string,
): string | null {
  const own = accessRows
    .filter(
      (row) =>
        row.grant.target.kind === 'student' &&
        row.grant.target.studentId === studentId &&
        row.grant.experimentId === experimentId &&
        row.grant.state === 'active' &&
        row.display !== 'access-ended',
    )
    .sort((a, b) => (a.grant.givenAt < b.grant.givenAt ? 1 : -1));
  return own[0] ? dayMonthYear(own[0].grant.givenAt) : null;
}

/** One standing in words, with its rank: the lowest rank is the one shown (`memberStatus`). */
function standingStatus(
  standing: MemberStanding,
  member: GroupMember,
  grant: GroupGrantLine,
  accessRows: readonly GrantRow[],
): MemberStatus & { readonly rank: number } {
  if (typeof standing !== 'string') {
    // The undecided overlap: their own grant was withdrawn while the group grant stands — no can /
    // can't-open statement (OD-B2-01).
    return {
      words: IA14.individualWithdrawn,
      tone: 'neutral',
      note: stateWords('IA-14.policy-open'),
      rank: 2,
    };
  }
  switch (standing) {
    case 'added-after-the-group-grant':
      return {
        words: IA14.addedAfter,
        tone: 'neutral',
        note: givenOnWords(dayMonthYear(grant.grant.givenAt)),
        rank: 0,
      };
    case 'waiting-for-a-licence':
      return { words: IA14.waiting, tone: 'warn', note: null, rank: 1 };
    case 'has-it-individually': {
      const date = individualGrantDate(accessRows, member.student.id, grant.grant.experimentId);
      return {
        words: IA14.hasItIndividually,
        tone: 'neutral',
        note: date ? givenOnWords(date) : null,
        rank: 3,
      };
    }
    case 'inactive':
      return { words: IA14.inactive, tone: 'ended', note: IA14.inactiveNote, rank: -1 };
    case 'can-open-it':
      return { words: IA14.canOpen, tone: 'ok', note: null, rank: 4 };
  }
}

/**
 * A member's status (`memberStatus`): "Inactive" (with "Can’t open experiments while inactive" once
 * the group has grants); "Active" while the group has no live grant; "Paused" or "Access ended"
 * while the institution's access is paused or its plan has ended; else the most telling of the
 * service's standings per live group grant — added after the grant, waiting, the undecided
 * overlap, has it individually, can open it (state-copy `IA-14.several`).
 */
export function memberStatus(
  member: GroupMember,
  view: GroupRecordView,
  accessRows: readonly GrantRow[],
  paused: boolean,
): MemberStatus {
  const live = liveGrants(view);
  const given = view.grantRows.filter((row) => row.status !== 'withdrawn');
  if (
    member.student.accountStatus === 'inactive' ||
    member.standing.some((standing) => standing === 'inactive')
  ) {
    return {
      words: IA14.inactive,
      tone: 'ended',
      note: given.length > 0 ? IA14.inactiveNote : null,
    };
  }
  if (given.length === 0) return { words: IA14.active, tone: 'ok', note: null };
  if (paused) return { words: IA14.paused, tone: 'paused', note: null };
  if (live.length === 0) return { words: IA14.accessEnded, tone: 'ended', note: null };
  const statuses = member.standing.flatMap((standing, index) => {
    const grant = live[index];
    return grant ? [standingStatus(standing, member, grant, accessRows)] : [];
  });
  if (statuses.length === 0) return { words: IA14.active, tone: 'ok', note: null };
  const [shown] = [...statuses].sort((a, b) => a.rank - b.rank);
  return { words: shown!.words, tone: shown!.tone, note: shown!.note };
}

/** A group grant's status in words: "Active" ("Paused" while paused), "Access ended", "Withdrawn". */
export function grantStatus(
  row: GroupGrantLine,
  paused: boolean,
): { readonly words: string; readonly tone: StatusTone } {
  if (row.status === 'withdrawn') return { words: IA14.withdrawn, tone: 'ended' };
  if (row.status === 'access-ended') return { words: IA14.accessEnded, tone: 'ended' };
  return paused ? { words: IA14.paused, tone: 'paused' } : { words: IA14.active, tone: 'ok' };
}
