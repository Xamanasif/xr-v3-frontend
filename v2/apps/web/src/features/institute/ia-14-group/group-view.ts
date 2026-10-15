/**
 * IA-14 Group (B2-08 f3 … f10) as pure view helpers over `getGroup`'s answer: each member's
 * "Status" in words — facts from the service, words from the copy modules. Nothing here decides
 * who can open what: a member's words per group grant are the standing the service answers, the
 * undecided overlap stays undecided (OD-B2-01), a member added later is only "Added after the
 * group grant" (OD-B2-02) and licences are never counted (D7).
 */
import type { GrantRow, GroupRecordView, MemberStanding } from '@xr/contracts/draft';

import { GROUP_PAGE, hasItIndividuallyWords } from '@/copy/groups';
import { stateWords } from '@/copy/state-copy';

export type GroupMember = GroupRecordView['members'][number];
export type GroupGrantLine = GroupRecordView['grantRows'][number];

/** One line of a member's status: the words for one live group grant. */
export interface StandingLine {
  readonly grantId: string;
  readonly experimentName: string;
  readonly words: string;
  /** "Waiting for a licence" is the drawn wait pill (B2-08 `isWait`); the rest are plain words. */
  readonly pill: boolean;
}

/**
 * A member's "Status" cell (B2-08 `rows`): the drawn inactive pill and line; "Active" with no live
 * group grant (state-copy `IA-14.no-live-grant`); else one line per live group grant
 * (`IA-14.several` when there are several).
 */
export type MemberStatus =
  | { readonly kind: 'inactive' }
  | { readonly kind: 'active' }
  | { readonly kind: 'standing'; readonly lines: readonly StandingLine[] };

/** The group's live grants in the order the members' standings follow (`getGroupOutput`). */
export function liveGrants(view: GroupRecordView): readonly GroupGrantLine[] {
  return view.grantRows.filter((row) => row.status === 'active');
}

/**
 * The member's own active individual grant for an experiment, as Student access (IA-04) lists it —
 * the ID "Has it individually · SACC-0310" names (state-copy `IA-14.has-it-individually`).
 */
export function individualGrantId(
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
  return own[0]?.grant.id ?? null;
}

function standingWords(
  standing: MemberStanding,
  member: GroupMember,
  grant: GroupGrantLine,
  accessRows: readonly GrantRow[],
): Pick<StandingLine, 'words' | 'pill'> {
  if (typeof standing !== 'string') {
    // The undecided overlap: no can / can't-open statement (OD-B2-01).
    return { words: stateWords('IA-14.policy-open'), pill: false };
  }
  switch (standing) {
    case 'can-open-it':
      return { words: GROUP_PAGE.canOpen, pill: false };
    case 'waiting-for-a-licence':
      return { words: GROUP_PAGE.waiting, pill: true };
    case 'added-after-the-group-grant':
      return { words: GROUP_PAGE.addedAfter, pill: false };
    case 'inactive':
      return { words: GROUP_PAGE.inactive, pill: false };
    case 'has-it-individually': {
      const id = individualGrantId(accessRows, member.student.id, grant.grant.experimentId);
      // Without the ID the words stand alone (state-copy `IA-14.has-it-individually`).
      return { words: id ? hasItIndividuallyWords(id) : GROUP_PAGE.hasItIndividually, pill: false };
    }
  }
}

/** A member's status cell, from their standing per live group grant. */
export function memberStatus(
  member: GroupMember,
  live: readonly GroupGrantLine[],
  accessRows: readonly GrantRow[],
): MemberStatus {
  if (
    member.student.accountStatus === 'inactive' ||
    member.standing.some((standing) => standing === 'inactive')
  ) {
    return { kind: 'inactive' };
  }
  const lines: StandingLine[] = [];
  member.standing.forEach((standing, index) => {
    const grant = live[index];
    if (!grant) return;
    lines.push({
      grantId: grant.grant.id,
      experimentName: grant.experimentName,
      ...standingWords(standing, member, grant, accessRows),
    });
  });
  return lines.length === 0 ? { kind: 'active' } : { kind: 'standing', lines };
}
