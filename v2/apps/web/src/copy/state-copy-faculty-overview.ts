import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-01 Overview (B4-01) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_FACULTY_OVERVIEW = {
  'FA-01.loading': {
    screen: 'FA-01',
    state: 'The overview loading (screen readers; skeleton rows below the header)',
    words: 'Loading your overview',
    rule: 'The header keeps its overline and “Overview”; the scope line and the sections wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; B4-02 f4 “Loading your experiments” (the Faculty boards’ loading); IA-01 “Loading your overview”. B4-01 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.failed': {
    screen: 'FA-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'Drawn as B4-02 f5 draws the Faculty failed state: the empty pattern with the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again. Focus moves to the main region once the overview is back.',
    basis:
      'B4-02 f5 “We couldn’t load your experiments” (the Faculty boards’ failed formula); IA-01 “We couldn’t load your overview”. B4-01 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.not-rendered': {
    screen: 'FA-01',
    state: 'The attention row B4-01 draws that has no fact yet (Phase 4B)',
    words: null,
    rule: 'Since Phase 4B the written-answers row (“Mark now”), the inactive-students row (“View students”) and the header’s “Mark <n> written answer” are drawn with their actions (`FA-01.phase-4b-actions`). The draft-questions row (“Review drafts”) is still not drawn: the overview read carries no drafts fact (drafts are held for review outside the records, Q-06, and `facultyAttention` names none, PC-51). With no row to draw, “Needs your attention” shows the calm state (f1).',
    basis:
      'B4-01 f0, f4 rows and header action; contract `facultyAttention` (no drafts fact, PC-51); FA-16 drafts are adapter state (PC-61)',
    status: 'provisional',
    decisions: ['T-23', 'PC-51'],
  },
  'FA-01.attention-rows': {
    screen: 'FA-01',
    state:
      'Several attention rows of the drawn kind (more than one taught experiment whose access ended)',
    words: null,
    rule: 'One row per fact, in the service’s order; at most five rows (the board’s budget). The count beside the heading names the rows shown (“1 item”, “2 items”); each row’s “My courses” opens the full list.',
    basis:
      'B4-01 caption “at most five attention rows and three deadlines”; f0 “3 items”, f3 “1 item” (one row each)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-51'],
  },
  'FA-01.access-ended-no-code': {
    screen: 'FA-01',
    state: 'An access-ended row for an experiment whose course has no code to show',
    words: 'Students can’t open it now; their work and results are kept',
    rule: 'The line without the code and its separator, starting with a capital.',
    basis:
      'B4-01 f3 “ME ZG523 · students can’t open it now; their work and results are kept” (always with a code)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.scope-counts': {
    screen: 'FA-01',
    state: 'The scope line for other counts than one course and one experiment',
    words: null,
    rule: '“You teach 2 courses · 3 experiments · My courses”: the plural for any count but one (“0 experiments” for a course whose experiments the institution does not hold). With no course at all the scope line is not drawn (f2).',
    basis: 'B4-01 f0, f1, f3, f4 “You teach 1 course · 1 experiment · My courses” (singular only)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.reach-one': {
    screen: 'FA-01',
    state: 'A Coming up row for an assessment that reaches one Student',
    words: 'student submitted',
    rule: '“Due 14 Nov 2026, 23:59 · 0 of 1 student submitted”; any other reach “… of <n> students submitted”.',
    basis: 'B4-01 f0, f1, f4 “1 of 5 students submitted” (plural only)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.coming-up': {
    screen: 'FA-01',
    state: 'Which assessments Coming up lists',
    words: null,
    rule: 'The service’s: Ready assessments of the Faculty member’s experiments due in the next 30 days, soonest first, at most three (a draft or a passed deadline is not listed). Each row opens the assessment’s Summary (FA-08).',
    basis:
      'B4-01 caption “at most … three deadlines”, f0 “Coming up · at most 3”, f3 “No deadlines in the next 30 days.”; contract `facultyOverviewOutput.comingUp`',
    status: 'provisional',
    decisions: ['VD-12', 'PC-51'],
  },
  'FA-01.overline': {
    screen: 'FA-01',
    state: 'The overline above “Overview”',
    words: null,
    rule: 'The signed-in Faculty member’s institution as the session names it; left out while the session is read.',
    basis: 'B4-01 f0 … f4 `span.xr-overline` “Godavari Institute of Technology”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-01.written-several': {
    screen: 'FA-01',
    state: 'Several written answers waiting on one assessment',
    words: 'oldest from',
    rule: '“<n> written answers to mark” · “<assessment> · oldest from <student>, <date>” — the queue is oldest first.',
    basis:
      'B4-01 f0 “1 written answer to mark · Heat Exchanger — post-lab · from Rahul Verma, 5 Nov 2026”; board 06 “12 written answers to mark”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
