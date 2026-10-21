import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of FA-01 Overview — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule the screen shows that the owner-approved V3 export
 * (design/v3-refined-b/roles/FA-v1 `Main.dc.html` FA-01, `vmOverview`) does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_FACULTY_OVERVIEW = {
  'FA-01.loading': {
    screen: 'FA-01',
    state: 'The overview loading (screen readers; skeleton rows under the head)',
    words: 'Loading your overview',
    rule: 'The head keeps the date and “Overview”; the scope line, the priority band and the panes wait for the reads (the overview, the marking queue, the courses and the taught experiments). The application’s page loading, drawn with the kit’s loading rows.',
    basis:
      'FA-v1 HANDOFF §4 (the export draws loading for FA-04 only); IA-01 “Loading your overview”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.failed': {
    screen: 'FA-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'Drawn as the export draws FA-04’s failed state (`div.rk-state[role=alert]`, the cloud glyph): this title, “Nothing has changed. Try again.” and “Try again”, which reads the failed reads again and moves focus to the page title.',
    basis:
      'FA-v1 Main.dc.html FA-04 “We couldn’t load your experiments” (the role’s failed formula); IA-01 “We couldn’t load your overview”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.not-rendered': {
    screen: 'FA-01',
    state: 'The drafts item the export draws in the priority band',
    words: null,
    rule: 'The priority band draws written answers to mark (Mark now → the oldest submission, FA-19) and Students inactive for 14 days or more (View students → FA-20). The “Draft questions to review” item (Review drafts) is not drawn: the overview read carries no drafts fact (drafts are held for review outside the records, Q-06, and `facultyAttention` names none, PC-51). With no item to draw, “Needs your attention” is the calm state.',
    basis:
      'FA-v1 Main.dc.html FA-01 `vmOverview` (drafts item); contract `facultyAttention` (no drafts fact, PC-51); FA-16 drafts are adapter state (PC-61)',
    status: 'provisional',
    decisions: ['T-23', 'PC-51'],
  },
  'FA-01.access-ended-kind': {
    screen: 'FA-01',
    state:
      'A taught experiment whose institution access has ended (a product state the export does not draw)',
    words: 'Course access ended',
    rule: 'An item of the priority band after the export’s items: the number of experiments, “Ended <date>” (or “Access ended” for several), this kind with the lock, the experiment’s name (or “Across <n> experiments”), “<code> · students can’t open it now; their work and results are kept” and “My courses” (FA-02).',
    basis:
      'B4-01 f3 “Your institution’s access to … ended on 7 Oct 2027” (v46); FA-v1 HANDOFF §6 “Course access ended … was not built”',
    status: 'provisional',
    decisions: ['VD-12', 'PC-51'],
  },
  'FA-01.access-ended-when': {
    screen: 'FA-01',
    state: 'The access-ended item’s line beside its count (one experiment)',
    words: 'Ended {date}',
    rule: '“{date}” is the day the institution’s access ended (“7 Oct 2027”).',
    basis: 'B4-01 f3 “ended on 7 Oct 2027”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.access-ended-when-many': {
    screen: 'FA-01',
    state: 'The access-ended item’s line beside its count (several experiments)',
    words: 'Access ended',
    rule: 'Several taught experiments whose access ended: one item, their number and this line.',
    basis: 'B4-01 f3 (one experiment only)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.access-ended-no-code': {
    screen: 'FA-01',
    state: 'An access-ended item for an experiment whose course has no code to show',
    words: 'Students can’t open it now; their work and results are kept',
    rule: 'The line without the code and its separator, starting with a capital; several experiments use it too.',
    basis:
      'B4-01 f3 “ME ZG523 · students can’t open it now; their work and results are kept” (always with a code)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.inactive-no-date': {
    screen: 'FA-01',
    state: 'An inactive Student with no activity and no access date in Students',
    words: 'No activity yet',
    rule: 'The export words a Student’s line “Last active <day>” or “No activity since access, <day>”; with neither date this line.',
    basis: 'FA-v1 Main.dc.html `vmOverview` (inactive list); contract `facultyStudentRow`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.attention-items': {
    screen: 'FA-01',
    state: 'Which items the priority band draws, and in which order',
    words: null,
    rule: 'One item per kind of work, sized to the items (one, two or three): written answers to mark (every own written answer waiting, “Across <n> assessments” over several, the three oldest named with their submission time, “and <n> more in Marking”), Students inactive for 14 days or more (longest inactive first, three named with their last activity, “and <n> more in Students”; View students opens Students for the first experiment named), then a course whose access ended. “Marking first · oldest first in each” with more than one item.',
    basis:
      'FA-v1 Main.dc.html FA-01 `vmOverview`; contract `facultyAttention` (per assessment / per experiment facts, PC-51); `listQueue` (oldest first), `listStudents` (last activity, OD-B4-10)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-51'],
  },
  'FA-01.coming-up': {
    screen: 'FA-01',
    state: 'Which assessments Coming up lists',
    words: null,
    rule: 'The service’s: Ready assessments of the Faculty member’s experiments due in the next 30 days, soonest first, at most three (a draft or a passed deadline is not listed). Each names its date, days left, the submissions meter (own) or who created it (a co-teaching colleague’s) and its release rule, and opens the assessment’s Summary (FA-08).',
    basis:
      'FA-v1 Main.dc.html FA-01 `vmOverview` (`up`); contract `facultyOverviewOutput.comingUp`; `listAssessments` (release rule, created by)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-51'],
  },
  'FA-01.get-ready': {
    screen: 'FA-01',
    state: 'When “Get your course ready” replaces the calm state',
    words: null,
    rule: 'A course with a taught experiment, no assessment, no question in the bank of the first taught experiment and no Student given any taught experiment yet. Add a question opens FA-15 for that experiment, Create assessment FA-07 with it chosen, Open experiment FA-05.',
    basis:
      'FA-v1 Main.dc.html FA-01 `vmOverview` (`isNew`); QuestionBankService `listQuestions` (per experiment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
