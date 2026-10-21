import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4B’s ST-11 Assessments, the experiment hub’s Assessment tab and Home’s “Up next” assessment row (B4-11 f0 … f10) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_STUDENT_ASSESSMENTS = {
  // ---- ST-11 Assessments (B4-11 f0 … f6) ----
  'ST-11.loading': {
    screen: 'ST-11',
    state: 'The Student’s assessments loading (screen readers)',
    words: 'Loading your assessments',
    rule: 'Skeleton rows in the list’s place, announced politely; the header stays.',
    basis:
      'Board 04 “State grammar” Loading (“Loading your reports”); B2-11 f9 “Loading” (the Student’s list skeleton). B4-11 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-11.failed': {
    screen: 'ST-11',
    state: 'The Student’s assessments failed to load',
    words: 'We couldn’t load your assessments',
    rule: 'With the Student pages’ line “Nothing has changed. Try again.” and a primary “Try again”, which reads the list again; focus returns to the page once it settles.',
    basis:
      'B2-11 / B3-01 f5 failed state (“We couldn’t load …”, line and “Try again”); B4-11 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-11.tabs': {
    screen: 'ST-11',
    state: 'Which tab an assessment is listed under, and the tab in the address',
    words: null,
    rule: 'By the latest attempt’s result as the service answers it: To do = no attempt yet (“To do”) or an attempt in progress; Submitted = waiting for marking or result not released yet; Results = result released (passed or not, with or without an attempt left). Each count is that tab’s rows. The rows keep the service’s order. The tab is in the address (`?tab=submitted`, `?tab=results`; To do is the bare address), replaced without a history entry; any other `tab` shows To do and the address becomes the bare one. A tab with no row shows the board’s line for it (“Nothing to do right now.”, …).',
    basis:
      'B4-11 f0 … f4 (the board’s own tab of each state: to do and in progress under To do, waiting and not released under Submitted, ready under Results); Appendix A rule T2 (state tabs in the address)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-11.lines': {
    screen: 'ST-11',
    state: 'A row’s lines for counts and facts the sample does not reach',
    words: null,
    rule: 'One question reads “1 question”, one mark “1 mark”. A course without a code shown leaves “ · <code>” out. An answer without its instant (no deadline, no submitted time) leaves that part out: “Answers saved”, “Your faculty marks written answers”. The deadline is the assessment’s current one; the release terms are the attempt’s own pinned version’s.',
    basis: 'B4-11 f0 … f4 (the sample’s lines: 4 questions, 16 marks, ME ZG523, a deadline)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-54'],
  },
  'ST-11.release-on-date': {
    screen: 'ST-11',
    state: 'Result not released yet, for an assessment released on a date',
    words: 'Released on a date: {on}',
    rule: '{on} is the attempt’s pinned release date and time (“20 Nov 2026, 09:00”).',
    basis:
      'B4-11 f3 “Released after the deadline: 14 Nov 2026, 23:59” with the release option’s words of B4-04 (“On a date”)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-54'],
  },
  'ST-11.release-immediately': {
    screen: 'ST-11',
    state: 'Result not released yet, for an assessment released immediately after marking',
    words: 'Released immediately after marking',
    basis:
      'B4-11 f3 “Released after the deadline: …” with the release option’s words of B4-04 (“Immediately after marking”); the service answers it only until the confirmed marks release',
    status: 'provisional',
    decisions: ['VD-12', 'PC-54'],
  },

  'ST-11.elsewhere': {
    screen: 'ST-11',
    state: 'A tab with no row, when the Student has more than one assessment elsewhere (V3)',
    words: 'Your assessments are under {tabs}.',
    rule: '{tabs} names the tabs that hold the Student’s assessments, in tab order (“To do and Results”). One assessment reads the export’s “Your assessment is under To do.”',
    basis: 'ST-v1 `alistVM` `emptyD` (“Your assessment is under To do.”, one assessment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-11.marked-on-date': {
    screen: 'ST-11',
    state: 'Marked, not released yet, for an assessment released on a date (V3 row and hub tab)',
    words: 'Marked · released on {on}',
    rule: '{on} is the attempt’s pinned release date and time (“20 Nov 2026, 09:00”).',
    basis: 'ST-v1 `alistVM` / `asmtTabVM` “Marked · released after the deadline”',
    status: 'provisional',
    decisions: ['VD-12', 'PC-54'],
  },
  'ST-11.marked-when-marked': {
    screen: 'ST-11',
    state:
      'Marked, not released yet, for an assessment released immediately after marking (V3; the service answers it only until the confirmed marks release)',
    words: 'Marked · released once your answers are marked',
    basis:
      'ST-v1 `alistVM` “Marked · released after the deadline”; B4-04 “Immediately after marking”',
    status: 'provisional',
    decisions: ['VD-12', 'PC-54'],
  },

  // ---- the hub’s Assessment tab (B4-11 f7 … f9) ----
  'ST-05.assessment-tab.loading': {
    screen: 'ST-05',
    state: 'The hub’s Assessment tab: the assessment loading (screen readers)',
    words: 'Loading the assessment',
    basis:
      'Board 04 “State grammar” Loading; the hub tabs’ loading (`ST-10.loading`). B4-11 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.assessment-tab.failed': {
    screen: 'ST-05',
    state: 'The hub’s Assessment tab: the assessment failed to load',
    words: 'We couldn’t load the assessment',
    rule: 'Under the hub’s header and tabs, with the Student pages’ line and “Try again”, which reads it again.',
    basis: 'The hub tabs’ failed state (`ST-10.failed`); B4-11 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.assessment-tab.states': {
    screen: 'ST-05',
    state:
      'The hub’s Assessment tab in a state B4-11 does not draw there (attempt in progress, result not released yet, result ready)',
    words: null,
    rule: 'The same row as f7 and f9, with ST-11’s status, line and action for that state: “Attempt in progress” · “Answers saved · due …” · “Continue attempt” (the tab’s one primary, to the attempt); “Result not released yet” · “Released after the deadline: …” · “View”; “Result ready” · “Released …” · “See result” (both to the result page). The experiment’s assessments only (one per experiment).',
    basis: 'B4-11 f1, f3, f4 (ST-11’s rows) in the f7 / f9 row; f7 “Open assessment” the primary',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Home’s “Up next” (B4-11 f10) ----
  'ST-01.up-next-assessment': {
    screen: 'ST-01',
    state: 'Home’s Up next: an assessment to do',
    words: null,
    rule: 'B4-11 f10: “<assessment> is ready”, “<experiment> · assessment · due <deadline>” and “Open assessment”, which opens “Before you start” (ST-12). Named from the Student’s own assessments (`listMyAssessments`); while those cannot be read the row keeps B2-10 f5’s words (“An assessment for <experiment> is ready”, “Assessment · to do”) with the same action.',
    basis: 'B4-11 f10 (Home · Up next · the assessment); B2-10 f5',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
