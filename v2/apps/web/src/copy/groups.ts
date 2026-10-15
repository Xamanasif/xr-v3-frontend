/**
 * The words of the Institute Admin's Groups screens — IA-13 People › Groups and IA-14 Group
 * (board B2-08) — written from the canonical facts the ports answer (`listGroupsOutput`,
 * `getGroupOutput`). Every phrase is the frozen board's own, found verbatim in its markup or script
 * (`groups.test.ts`); what the board does not word is a provisional entry of the state-copy
 * register (`state-copy-groups.ts`, VD-12). The board's sample groups, people and dates are never
 * copied: names, IDs and dates come from the records.
 */
import { firstName } from './institute-people';

// ---- IA-13 People › Groups (B2-08 f0 … f2) ----

export const GROUPS_TAB = {
  /** B2-08 f0 header action (opens DL-3). */
  createGroup: 'Create group',
  caption: 'Groups',
  columns: {
    group: 'Group',
    members: 'Members',
    given: 'Experiments given to the group',
  },
  /** B2-08 `expText` when the group's active grants give it nothing. */
  noneYet: 'None yet',
} as const;

/** B2-08 DL-3 "Create group" (f1). */
export const CREATE_DIALOG = {
  title: 'Create group',
  nameLabel: 'Group name',
  nameHint: 'For example a section or lab batch. You add students next.',
  confirm: 'Create group',
} as const;

/**
 * B2-08 `count`: "2 groups". PROVISIONAL in the singular (`IA-13.count-one`): "1 group" — the board
 * draws two groups only.
 */
export function groupCountWords(count: number): string {
  return count === 1 ? '1 group' : `${count} groups`;
}

/** B2-08 `members` (IA-13) and `count` (IA-14): "1 member" / "7 members". */
export function memberCountWords(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

/** B2-08 row link name (`g.aria`): "Open group ME ZG523 — Sem II". */
export function openGroupLabel(name: string): string {
  return `Open group ${name}`;
}

/** B2-08 `create` flash: "Group “Lab batch B” created. Add students to it next." */
export function createdFlash(name: string): string {
  return `Group “${name}” created. Add students to it next.`;
}

// ---- IA-14 Group (B2-08 f3 … f10) ----

export const GROUP_PAGE = {
  back: 'Groups',
  /** The overline "Group · GRP-0012" (the ID in `span.xr-id`, composed by the screen). */
  overline: 'Group',
  rename: 'Rename',
  giveAccess: 'Give this group access',
  addStudents: 'Add students',
  members: 'Members',
  membersCaption: 'Members',
  memberColumns: { student: 'Student', status: 'Status', action: 'Action' },
  remove: 'Remove…',
  inactive: 'Inactive',
  inactiveLine: 'Can’t open experiments while inactive',
  /** No live group grant: the member's account status (B2-08 f3 `stText`). */
  active: 'Active',
  /** B2-08 `stText` per group grant (f4, f9). */
  canOpen: 'Can open it',
  hasItIndividually: 'Has it individually',
  waiting: 'Waiting for a licence',
  addedAfter: 'Added after the group grant',
  noMembersTitle: 'No members yet',
  noMembersLine:
    'Add students to this group. Nothing is given to them until the group has experiments.',
  addPanelTitle: 'Add students to this group',
  cancel: 'Cancel',
  given: 'Experiments given to this group',
  givenCaption: 'Experiments given to this group',
  givenColumns: { experiment: 'Experiment', formats: 'Formats', given: 'Given', status: 'Status' },
  /** The group grant's state (B2-08 f4). */
  grantActive: 'Active',
  nothingGivenTitle: 'Nothing given to this group yet',
  nothingGivenLine: 'Give this group an experiment, and its current members get it.',
  renamedFlash: 'Group renamed.',
} as const;

/** B2-08 DL-3 "Rename group" (f6). */
export const RENAME_DIALOG = {
  title: 'Rename group',
  nameLabel: 'Group name',
  confirm: 'Save name',
} as const;

/** B2-08 DL-1 (f5): the danger confirm. */
export const REMOVE_DIALOG = {
  confirm: 'Remove from group',
} as const;

/** B2-08 `stText` (f4): "Has it individually · SACC-0310". */
export function hasItIndividuallyWords(grantId: string): string {
  return `${GROUP_PAGE.hasItIndividually} · ${grantId}`;
}

/** B2-08 `rmAria`: "Remove Priya Natarajan from this group". */
export function removeLabel(fullName: string): string {
  return `Remove ${fullName} from this group`;
}

/** B2-08 DL-1 title (f5): "Remove Priya Natarajan from this group?". */
export function removeTitle(fullName: string): string {
  return `Remove ${fullName} from this group?`;
}

/**
 * B2-08 DL-1 body (f5): "Priya will no longer be a member of " — the group's name in `strong` —
 * ". Their student record stays in People." Only what is certain (GRP-05: nothing about access).
 */
export function removeBody(fullName: string): { readonly before: string; readonly after: string } {
  return {
    before: `${firstName(fullName)} will no longer be a member of `,
    after: '. Their student record stays in People.',
  };
}

/** B2-08 `addLabel`: "Add students" until one is picked, then "Add 1 student" / "Add 2 students". */
export function addLabel(picked: number): string {
  if (picked === 0) return GROUP_PAGE.addStudents;
  return picked === 1 ? 'Add 1 student' : `Add ${picked} students`;
}

/** B2-08 `doAdd` flash: "1 student added to the group." / "2 students added to the group." */
export function addedFlash(count: number): string {
  return count === 1 ? '1 student added to the group.' : `${count} students added to the group.`;
}

/** B2-08 `doRm` flash: "Priya Natarajan was removed from the group." */
export function removedFlash(fullName: string): string {
  return `${fullName} was removed from the group.`;
}

/** B2-08 `cands` sub line: "GIT-2026-0352 · inactive" (the ID alone for an active student). */
export function candidateLine(institutionStudentId: string, inactive: boolean): string {
  return inactive ? `${institutionStudentId} · inactive` : institutionStudentId;
}

/** B2-08 f4 "Given": "12 Oct 2026 · " — then the grant's ID in `span.xr-id`. */
export function givenOnWords(date: string): string {
  return `${date} · `;
}

// ---- IA-14 words no board draws: PROVISIONAL (state-copy register, VD-12) ----

/**
 * PROVISIONAL (`IA-14.several`): with several live group grants a member's status is one line per
 * experiment, "Shell-and-Tube Heat Exchanger: " then that grant's words.
 */
export function standingLinePrefix(experimentName: string): string {
  return `${experimentName}: `;
}
