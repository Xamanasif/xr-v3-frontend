import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Package 2B's other screens and changes — IA-16 Course codes (B2-03 f6
 * … f10), ST-04 All experiments (B2-11 f2, f4, f15), the sample-mode identity safeguard (IA-10,
 * SA-07; PC-49) and IA-05's "Already has it" per chosen experiment (PC-48) — part of the one
 * register (`state-copy.ts`, VD-12).
 */
export const STATE_COPY_PACKAGE_2B = {
  // ---- IA-16 Content access › Course codes (B2-03 f6 … f10; V3: IA-v1 `vm16core`, `vm16`) ----
  'IA-16.tab-address': {
    screen: 'IA-16',
    state: 'The Content access address with a `tab` other than `course-codes`',
    words: null,
    rule: 'Experiments (IA-02) shows and the address becomes the bare `/institute/content-access` — Appendix A rule T2, as the People page normalises its tabs.',
    basis: 'Appendix A IA-16 `?tab=course-codes` (rule T2: the default tab has no parameter)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.loading': {
    screen: 'IA-16',
    state: 'Course codes while the codes load',
    words: 'Loading course codes',
    rule: 'The kit’s loading rows in a busy surface under the tabs, announced politely.',
    basis:
      'IA-v1 draws no loading frame for IA-16; its IA-02 loading formula (“Loading content access…”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.failed': {
    screen: 'IA-16',
    state: 'Course codes could not be read',
    words: 'We couldn’t load the course codes',
    rule: 'The kit’s failed state with “Nothing has changed. Try again.” and “Try again”, which reads again and moves focus to the title.',
    basis:
      'IA-v1 draws no failed frame for IA-16; its IA-02 formula (“We couldn’t load content access”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.saving': {
    screen: 'IA-16',
    state: '“Save course code(s)” while the codes are sent',
    words: 'Saving…',
    basis:
      'IA-v1 saves at once (its script has no busy state); board 03 busy-button formula (“Adding…”, “Importing…”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.count-plural': {
    screen: 'IA-16',
    state: 'The count above the courses',
    words: null,
    rule: 'One course: “Your institution’s code is added” / “Your institution’s code isn’t added yet” (the export’s `vm16`). Several: “2 of 3 courses have no code from your institution”, “1 of 3 courses has no code from your institution”; none missing: “Every course has a code from your institution”. “Show missing codes only” and “Save course codes” (plural) appear with more than one course.',
    basis: 'IA-v1 `vm16core` `countText`, `vm16` (`one`, `hasMany`, `saveText`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.save-rows': {
    screen: 'IA-16',
    state: 'Saving with several courses changed',
    words: null,
    rule: 'Every changed row is checked first by the contract’s own rule (a semester needs a code); while one fails nothing is sent, each failing row shows its error and focus goes to the first. Then the rows are sent one by one, each with the revision the page read; an unchanged row is not sent. The flash “Saved” · “Course codes saved. Students and faculty at your institution see MEC-523 with Thermodynamics & Heat Transfer.” names each saved code with its course and takes focus; with no code left, “Course codes saved. No course has a code from your institution now.”; a code cleared to empty is saved without being named; with nothing changed, Save sends nothing and shows nothing. Undo changes drops every change and moves focus to the first course’s code.',
    basis:
      'IA-v1 `vm16core` (`save`, `undo`; one course); “Validation: Only one rule is designed: a semester needs a code. No code format is invented.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.stale': {
    screen: 'IA-16',
    state:
      'A code refused because the record moved on (another save, stale revision) or the course left content access',
    words: null,
    rule: 'That row is read again and shows its current code; its change is dropped; rows saved before it stay saved. No notice.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”), as SA-07 and IA-07',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'IA-16.unavailable': {
    screen: 'IA-16',
    state: 'Saving failed for now (service unavailable; a test fault plan only)',
    words: null,
    rule: 'Nothing more is sent; every unsaved change stays in its field and can be saved again; no message.',
    basis:
      'IA-v1 draws no failure; Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.none-missing-row': {
    screen: 'IA-16',
    state: '“Show missing codes only” when every course has a code',
    words: null,
    rule: 'The export’s state “No course is missing a code” · “Every course in your content access has a code from your institution.” with “Show all courses”, which turns the toggle off.',
    basis: 'IA-v1 IA-16 `noneShown`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.field-names': {
    screen: 'IA-16',
    state: 'The code and semester fields of several courses',
    words: null,
    rule: 'Each field keeps the drawn label (“Your course code”, “Semester (optional)”) and adds the course for screen readers only, so that each has its own name: “Your course code for Thermodynamics & Heat Transfer”, “Semester for Thermodynamics & Heat Transfer (optional)”.',
    basis:
      'IA-v1 `vm16core` (`label`, `semLabel`: the names the script writes but the template does not use)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-16.give-access': {
    screen: 'IA-16',
    state: 'The head’s “Give students access” on the Course codes tab',
    words: null,
    rule: 'Shown as on Experiments (IA-02): while something can be given and the institution is not paused.',
    basis: 'IA-v1 `vm16core` (`canGive`); IA-02 `anyGivable`',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- ST-04 My courses › All experiments (B2-11 f2, f4, f15) ----
  'ST-04.tab-address': {
    screen: 'ST-04',
    state: 'The My courses address with a `tab` other than `experiments`',
    words: null,
    rule: 'Courses (ST-02) shows and the address becomes the bare `/student/courses` (Appendix A rule T2).',
    basis: 'Appendix A ST-04 `/student/courses?tab=experiments`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-04.nothing-now': {
    screen: 'ST-04',
    state:
      'Nothing is given now, but a course has earlier work (after a withdrawal or the end of access)',
    words: 'Your earlier work is kept in My courses.',
    rule: 'Title as ST-02 (“No experiments are given to you right now”); the earlier work itself is listed on the Courses tab (course by course while SACC-14 is open). No experiment is listed: none is given.',
    basis:
      'B2-11 draws All experiments with something given (f2), no match (f4) and mobile (f15) only; ST-02 f7, f8 and `ST-02.earlier-rows`',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-04.rows': {
    screen: 'ST-04',
    state:
      'An experiment row that is not simply available (paused, inactive account, a supplied licence wait, an undecided gate)',
    words: null,
    rule: 'The row is ST-03’s, with ST-03’s words (`ST-03.inactive-row`, `ST-03.policy-open`, B2-11 f6’s paused line, B3-02’s licence words): one component for both screens.',
    basis: 'B2-11 f2 draws the available row only',
    status: 'provisional',
    decisions: ['OD-B2-01', 'D7', 'VD-12'],
  },
  'ST-04.count': {
    screen: 'ST-04',
    state: 'The count beside the list',
    words: null,
    rule: '“N experiments given to you” counts the experiments listed — every experiment given to the Student, including one waiting for a licence or closed while paused. ST-02’s and ST-03’s course line counts only what opens now (Package 2A reading of `experimentsGiven`), so the two can differ for a waiting or paused Student.',
    basis: 'B2-11 `count` (“1 experiment given to you”, the list’s length); B2-11 f0 course line',
    status: 'provisional',
    decisions: ['D7', 'VD-12'],
  },
  'ST-04.format-options': {
    screen: 'ST-04',
    state: 'The Format filter’s options',
    words: null,
    rule: '“All formats”, then each format given to the Student among the listed experiments, in display order (WEB, VR, AR, MR); a format matches an experiment that gives it to the Student.',
    basis: 'B2-11 f2 `option` WEB, VR (the formats of the one given experiment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Sample-mode identity safeguard (PC-49; T-11 / P1-01 stay open) ----
  'IA-10.identity-taken': {
    screen: 'IA-10',
    state:
      'Adding a person with an e-mail someone else already signs in with (a person of another institution, an Institute Admin, a platform-role holder, a Super Admin)',
    words: 'This e-mail is already used to sign in to the platform. Use a different e-mail.',
    rule: 'Shown on Institution e-mail and in the error summary; nothing is added, merged or replaced. People’s own words win where the e-mail is in this institution’s People (“This e-mail already belongs to someone in People”).',
    basis:
      'Owner authorisation of Phase 2B §5 (a protective sample-mode safeguard); B2-07 draws only People’s own uniqueness. Not the T-11 invitation or identity policy',
    status: 'provisional',
    decisions: ['T-11', 'P1-01'],
  },
  'SA-07.identity-taken': {
    screen: 'SA-07',
    state: 'Assigning an Institute Admin an e-mail someone else already signs in with',
    words: 'This e-mail is already used to sign in to the platform. Use a different e-mail.',
    rule: 'Shown under Work e-mail in the assign panel; nothing is assigned. The earlier sign-in keeps working.',
    basis:
      'Owner authorisation of Phase 2B §5; Package 1E reproduction (the collision shadowed or took over a sign-in); B7-03 draws the e-mail’s form only',
    status: 'provisional',
    decisions: ['T-11', 'P1-01'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
