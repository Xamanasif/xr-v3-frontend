import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-04 Student access, IA-05 Give students access (boards B2-04, B2-05) — Phase-2 Package 2A, part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that their
 * boards do not draw word for word.
 */
export const STATE_COPY_STUDENT_ACCESS = {
  'IA-04.overlap.outcome': {
    screen: 'IA-04',
    state:
      'An individual grant is withdrawn while a group grant gives the student the same experiment',
    words: null,
    rule: 'The withdrawal is the service’s command (it withdraws that grant only). The page then states each grant’s own state — the row “Individual grant withdrawn” with its group line, and the drawn flash (the group grant is not changed) — and never whether the student can still open the experiment.',
    basis:
      'B2-04 f4 caption (“No ‘can / can’t open’ statement — OD-B2-01”), B2-04 notes “Withdraw ≠ remove access”, B2-13 f8; the service’s own answers (dv1-overlap: the Student’s gate then answers policy-open OD-B2-01)',
    status: 'provisional',
    decisions: ['OD-B2-01'],
  },
  'IA-04.withdraw.policy-open': {
    screen: 'IA-04',
    state: 'Withdraw… is answered with an undecided rule (policy-open) — nothing is withdrawn',
    words:
      'This grant can’t be withdrawn yet: the rule for it hasn’t been decided. Nothing was changed.',
    basis:
      'Board 04 refusal formula (what happened, what is kept); the service answers policy-open for a group grant (SACC-08) and after the plan has ended (SACC-11). No board draws it.',
    status: 'provisional',
    decisions: ['OD-B2-01', 'SACC-11'],
  },
  'IA-04.withdraw.refused': {
    screen: 'IA-04',
    state:
      'Withdraw… is refused because the grant or the institution changed while the dialog was open (stale, paused, inactive, already withdrawn)',
    words: 'Access wasn’t withdrawn — this grant has changed. The list now shows it as it is.',
    basis:
      'Board 04 refusal formula; SA-07’s stale rule (P1-21: close the dialog, read the page again). No board draws it.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-04.withdraw.unavailable': {
    screen: 'IA-04',
    state: 'Withdraw… fails for now (the service is unavailable): the dialog stays with the reason',
    words: 'Access wasn’t withdrawn. Nothing was changed. Try again.',
    basis:
      'B2-05 f12’s failure words for Give access (“Access wasn’t given. Nothing was changed. Try again.”), applied to Withdraw',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-04.paused-empty': {
    screen: 'IA-04',
    state: 'A paused institution with no student access',
    words: null,
    rule: 'The read-only notice and the empty state without its “Give students access” (B2-04 f12 removes every give and withdraw while paused; f8 draws the empty state).',
    basis: 'B2-04 f8 + f12 together; no board draws both at once',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.failed': {
    screen: 'IA-05',
    state: 'The access plan, its experiments or the students could not be read',
    words: 'We couldn’t load your access plan',
    basis:
      'B2-04 f11 failed formula (“We couldn’t load student access”) with B2-05 f18’s object (“Loading your access plan”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.failed.line': {
    screen: 'IA-05',
    state: 'The access plan, its experiments or the students could not be read (the line)',
    words: 'Nothing has changed. Try again.',
    basis: 'B2-04 f11 (“Nothing has changed. Try again.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.review.loading': {
    screen: 'IA-05',
    state: 'Step 3 while the service works out what will be created (screen readers)',
    words: 'Checking what will be created',
    basis:
      'Board 04 loading formula; B2-05 step 3 “What will be created”. No board draws the wait.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.review.failed': {
    screen: 'IA-05',
    state: 'Step 3: what will be created could not be read',
    words: 'We couldn’t check what will be created. Nothing has changed. Try again.',
    basis: 'B2-04 f11 failed formula; B2-05 step 3',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.give.refused': {
    screen: 'IA-05',
    state:
      'Give access is refused because something changed since the choice was made (already given, inactive, not in the plan, an empty group, the plan changed)',
    words:
      'Access wasn’t given — something has changed since you chose. Nothing was changed. Check your choices and try again.',
    basis:
      'B2-05 f12 failure words (“Access wasn’t given. Nothing was changed. Try again.”) with the refusal’s cause; no board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.member.policy-open': {
    screen: 'IA-05',
    state:
      'Group review: a member whose own grant for the experiment was withdrawn (the overlap is undecided)',
    words:
      'what the group grant means for this student isn’t decided yet — their own grant for it was withdrawn.',
    rule: 'Written after the member’s name and a colon. No can / can’t is stated; the member is not counted among those who can open it.',
    basis:
      'B2-05 f5 caption (“what the group grant means for a member who already has the experiment individually is OD-B2-01”); the service answers the open decision as the member’s standing',
    status: 'provisional',
    decisions: ['OD-B2-01'],
  },
  'IA-05.members.one': {
    screen: 'IA-05',
    state: 'Group review: exactly one member can open it straight away',
    words: '1 member can open it straight away',
    basis: 'B2-05 `gsum` formula (“<n> members can open it straight away”) in the singular',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.prefill': {
    screen: 'IA-05',
    state:
      'Opened from a student record (?student=) or a group (?group=), with ?course= / ?experiment=',
    words: null,
    rule: 'A pre-filled student, group, course or experiment is chosen only when the service offers it as selectable (a student who already has every experiment, an inactive student or an empty group is not); the pre-fill notice shows only while it is chosen. “Give more access” starts again without it.',
    basis: 'B2-05 f4, f13 (the notices), f9 (who can’t be ticked)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.step-address': {
    screen: 'IA-05',
    state: 'A step’s address reached without the earlier steps’ choices (a reload, a pasted link)',
    words: null,
    rule: 'The flow goes back to the first step that is not complete (in place of the address); the choices live only in this tab’s page.',
    basis: 'PU-08’s rule for its review step (Package 1C, S4); B2-05 draws no address',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-05.nothing-held.request': {
    screen: 'IA-05',
    state: 'No experiments held yet: the request sentence',
    words: 'Your request is approved — payment required.',
    rule: 'Follows the first sentence only while the institution’s own status is “approved, payment required”; otherwise the first sentence stands alone. The request is named by content, never by its id (identifier rule).',
    basis:
      'IA-v1 Main.dc.html IA-05 refusal (`V.rNone`: “Request REQ-0042 is approved — payment required.”) without the request’s id',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-04.no-reference': {
    screen: 'IA-04',
    state:
      'A line of the access screens (IA-04, IA-05, IA-07, IA-14) where the V3 export still names a record by its id',
    words: null,
    rule: 'No access plan, request, grant or group id is shown: “No licence is available for <first name> on your access plan right now.”; “Your access plan has ended”; step 1 “<status> · <n> licences · ends <date>”; the selection “Your access plan · <course code>”; step 3 “Licences: Your access plan · …”; the review “<name> already has it individually. That grant isn’t changed.”; the result lists who → what → status (no grant id); IA-07 “Formats come from your access plan; …” and “Your access plan ended on <date>.”; IA-14 “Has it individually” with “Given <date>”. Ids stay in addresses, keys and the commands; Student access’s search still matches a typed grant id.',
    basis:
      'Owner identifier rule for every role (IA lead decision 2; CM record §5.11); IA-v1 HANDOFF §9 (grant, faculty-course and group ids already out of labels)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
