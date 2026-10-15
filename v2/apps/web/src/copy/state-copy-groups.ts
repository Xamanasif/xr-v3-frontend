import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-13 Groups and IA-14 Group (board B2-08) — Phase-2 Package 2B, part of
 * the one register (`state-copy.ts`, VD-12): every state string or rule these screens show that
 * their board does not draw word for word.
 */
export const STATE_COPY_GROUPS = {
  // ---- IA-13 People › Groups (B2-08 f0 … f2) ----
  'IA-13.count-one': {
    screen: 'IA-13',
    state: 'The count when the institution has one group',
    words: null,
    rule: '“1 group”; any other number “<n> groups”.',
    basis:
      'B2-08 `count` (“2 groups”); the singular is undrawn (the script would write “1 groups”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.loading': {
    screen: 'IA-13',
    state: 'The groups list loading (screen readers)',
    words: 'Loading groups',
    basis: 'B2-06 f4 “Loading students” (the Students tab); B2-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.failed': {
    screen: 'IA-13',
    state: 'The groups list failed to load',
    words: 'We couldn’t load the groups',
    rule: 'With B2-06 f5’s line “Nothing has changed. Try again.” and its primary “Try again”.',
    basis: 'B2-06 f5 “We couldn’t load the students” (the Students tab); B2-08 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.empty': {
    screen: 'IA-13',
    state: 'The institution has no groups yet',
    words: 'No groups yet',
    rule: 'The empty pattern in a section with the Students icon; the count says “0 groups” and the header’s “Create group” is the one way in.',
    basis:
      'B2-08 draws no empty list; board 04 Empty formula and B2-06 f3 “No students yet”, as IA-08 “No faculty members yet”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.several': {
    screen: 'IA-13',
    state: 'A group given several experiments',
    words: null,
    rule: '“Experiments given to the group”: one name and its formats per experiment, in the order the service lists them.',
    basis:
      'B2-08 f2 draws one experiment per group; IA-06 “Experiments given” (state-copy IA-06.several)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.busy': {
    screen: 'IA-13',
    state: 'Create group while the service answers',
    words: null,
    rule: 'The confirm is busy (spinner, ignores repeat presses) and keeps its label “Create group”: B2-08 draws no busy words.',
    basis: 'Board 10 “While busy, buttons ignore repeat presses”; B2-08 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.refused': {
    screen: 'IA-13',
    state:
      'Create group refused other than on the name (the institution paused meanwhile, not permitted)',
    words: null,
    rule: 'Nothing is written: the dialog closes and the list and the session are read again, so a pause shows the People page’s read-only notice and hides “Create group”.',
    basis:
      'P1-21 interim (SA-07 refusals); B2-01 f5 read-only while paused; B2-08 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'IA-13.unavailable': {
    screen: 'IA-13',
    state: 'Create group failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the dialog stays open with the name as typed and can be confirmed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-13.paused': {
    screen: 'IA-13',
    state: 'The institution is paused',
    words: null,
    rule: 'The list only: no “Create group” (the People page hides it with its read-only notice) and no dialog.',
    basis:
      'B2-01 f5 “no actions while paused” (state-copy IA-06.paused.actions); B2-08 draws no paused frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- IA-14 Group (B2-08 f3 … f10) ----
  'IA-14.loading': {
    screen: 'IA-14',
    state: 'The group loading (screen readers)',
    words: 'Loading the group',
    basis: 'Board 04 "State grammar" Loading formula; B2-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.failed': {
    screen: 'IA-14',
    state: 'The group failed to load (service unavailable)',
    words: 'The group didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula; B2-08 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.failed.line': {
    screen: 'IA-14',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'IA-14.not-found': {
    screen: 'IA-14',
    state: 'An address naming no group of the admin’s institution',
    words: null,
    rule: 'The workspace’s in-shell not-found page (PU-15): unknown and another institution’s group alike.',
    basis: 'Board 08 not-found pattern; ADR-0005 §5 record guards (as IA-07)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.no-live-grant': {
    screen: 'IA-14',
    state:
      'A member’s status when the group has no live grant (none given, each ended or withdrawn, or the institution paused)',
    words: null,
    rule: 'An active member reads “Active” (the account status, as B2-08 f3 before the grant) and an inactive one the drawn “Inactive” with “Can’t open experiments while inactive”. No “Can open it” is shown where the service computes no standing.',
    basis:
      'B2-08 f3 `stText` (“Active” before the group grant); getGroupOutput (no standing while paused or without a live grant)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.has-it-individually': {
    screen: 'IA-14',
    state: 'A member who has the group’s experiment through an individual grant',
    words: null,
    rule: '“Has it individually · <SACC>”, the ID being the member’s own active individual grant for that experiment as Student access (IA-04) lists it; “Has it individually” alone if that list does not name it. Nothing says what the group grant means for them (OD-B2-01).',
    basis: 'B2-08 f4 `stText`; B2-08 notes “Group grants”',
    status: 'provisional',
    decisions: ['OD-B2-01'],
  },
  'IA-14.policy-open': {
    screen: 'IA-14',
    state:
      'A member whose standing the service answers as an undecided rule (OD-B2-01: their own grant for the experiment was withdrawn while the group grant is active)',
    words: 'What the group grant means for this student isn’t decided yet',
    rule: 'Shown in place of the drawn words, as plain words: no can / can’t-open statement while the decision is open.',
    basis:
      'B2-08 notes (“what the group grant means for them … is OD-B2-01”); IA-05.member.policy-open; the service answers the open decision as the member’s standing',
    status: 'provisional',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
  },
  'IA-14.several': {
    screen: 'IA-14',
    state: 'A member when the group has several live grants',
    words: null,
    rule: 'One line per live group grant, in the order “Experiments given to this group” lists them: “<experiment>: ” then that grant’s words — “Waiting for a licence” as its pill. An inactive member keeps the one drawn “Inactive” line.',
    basis: 'B2-08 draws one group grant; IA-05.member.policy-open (words after a name and a colon)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.grant-words': {
    screen: 'IA-14',
    state: 'A group grant word B2-08 does not draw',
    words: null,
    rule: '`access-ended`: “Access ended”; `withdrawn`: “Withdrawn” — each in the quiet (off) pill, with no further line.',
    basis:
      'B2-04 `LBL` (“Withdrawn”, “Access ended”), as IA-07.grant-words; B2-08 draws “Active” only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.add.none': {
    screen: 'IA-14',
    state: 'Add students: every student of the institution is already a member',
    words: 'Every student at your institution is already in this group.',
    rule: 'Shown in the panel in place of the list; “Add students” stays disabled.',
    basis: 'B2-08 f7 (“Current members aren’t offered again.”) draws a list with candidates only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.busy': {
    screen: 'IA-14',
    state: 'Save name, Remove from group or Add students while the service answers',
    words: null,
    rule: 'The confirming button is busy (spinner, ignores repeat presses) and keeps its label: B2-08 draws no busy words.',
    basis: 'Board 10 “While busy, buttons ignore repeat presses”; B2-08 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.moved-on': {
    screen: 'IA-14',
    state:
      'Rename, Remove or Add refused because the group moved on (a stale revision, a member already added or already removed, a group or student gone)',
    words: null,
    rule: 'Nothing is written: the dialog or the panel closes, the group is read again and focus goes to the page title. A refusal because the institution is paused also shows the read-only notice.',
    basis: 'P1-21 interim (SA-07 refusals; IA-07.moved-on); B2-08 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'IA-14.unavailable': {
    screen: 'IA-14',
    state: 'Rename, Remove or Add failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the dialog or the panel stays open with what was typed or picked and can be confirmed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-14.paused': {
    screen: 'IA-14',
    state: 'The institution is paused',
    words: null,
    rule: 'Read-only: no Rename, no Give this group access (also in the empty state), no Add students and no Remove… column; the read-only notice shows (IA-06.paused.title / .line).',
    basis:
      'B2-01 f5 “no actions while paused” (state-copy IA-06.paused.actions); B2-08 draws no paused frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
