import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 3's ST-15 Progress, ST-16 Format feedback and ST-17 Feedback sent, with the ST-01 / ST-02 actions they enable (B3-05, B3-06) — part of the one register (`state-copy.ts`, VD-12).
 */
export const STATE_COPY_PROGRESS_FEEDBACK = {
  // ---- ST-15 Progress (B3-05) ----
  'ST-15.groups': {
    screen: 'ST-15',
    state: 'How the experiments are grouped and which formats each lists',
    words: null,
    rule: 'Every experiment `getMyProgress` answers is listed under its course, in the order My courses lists the courses and their experiments (`listMyCourses`, `getMyCourse`), each course headed by its name with “<code shown> · <n> experiment(s)”. One line per format in the hub’s order (given formats, then “Not included for your institution”, then “Not available for this experiment”); a given format reads its own progress view, never the experiment’s (T-13). An experiment My courses does not list is left out (no course to place it under). Nothing is summed: no percentage, no word for the experiment or the course as a whole.',
    basis:
      'B3-05 f0, f2 (one course, one experiment drawn); B2-12 header order (state-copy `ST-05.format-order`); LearningService.getMyProgress, StudentAccessService.listMyCourses / getMyCourse',
    status: 'provisional',
    decisions: ['VD-12', 'T-13'],
  },
  'ST-15.actions': {
    screen: 'ST-15',
    state: 'The one action on a format line',
    words: null,
    rule: 'WEB in progress: “Continue WEB” (B3-05 f1) and WEB not started: “Open WEB” (B3-02’s words) — both open the WEB page (ST-08); AR / VR / MR not started or in progress: “Open VR” (B3-05 f0) — the format’s page (ST-09); Completed: “Give feedback on <format>” only where the service’s per-format feedback entry offers it (that format’s own completion, BC5), else “Feedback sent <date>” once sent, else nothing. No action while the institution is paused (f5), the account is inactive, a licence is awaited or the format is not available right now; the progress words stay.',
    basis:
      'B3-05 f0, f1, f2, f5, f9; B3-02 f0 (“Open WEB”); FormatProgressView.feedback (`feedbackEntry`)',
    status: 'provisional',
    decisions: ['VD-12', 'T-12'],
  },
  'ST-15.headset-in-progress': {
    screen: 'ST-15',
    state: 'An AR, VR or MR format in progress, beside “In progress”',
    words: null,
    rule: '“Last session reported <date, time>” — the format page’s words (B3-04 f0, B3-06 f5); B3-05 draws only WEB in progress (“Last saved …”). Neither line is shown when the runtime has reported no such time.',
    basis: 'B3-05 f1; B3-04 f0; B3-06 f5',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B3-07'],
  },
  'ST-15.paused-in-progress': {
    screen: 'ST-15',
    state: 'A format in progress while the institution is paused',
    words: null,
    rule: '“Paused” with “In progress before the pause”, on B3-05 f5’s pattern (“Completed 14 Oct 2026 before the pause”, “Not started before the pause”), which draws no format in progress.',
    basis: 'B3-05 f5 (“Institution paused”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-15.details': {
    screen: 'ST-15',
    state: 'The rows under “Show details”',
    words: null,
    rule: 'One row per given format the runtime has reported or the system has completed: WEB “First opened <date, time>”, AR / VR / MR “First session reported <date, time>”, then “· completed <date, time>” or, in progress, “· last saved …” (WEB) / “· last session reported …” (AR / VR / MR); a completion with no reported activity reads “Completed <date, time>”. Then “<format> feedback · Sent <date>” for each feedback sent, and the Assessment row. A format not started has no row.',
    basis: 'B3-05 f0, f1, f2, f9 (`dl` rows)',
    status: 'provisional',
    decisions: ['VD-12', 'T-13'],
  },
  'ST-15.assessment': {
    screen: 'ST-15',
    state: 'The Assessment row under “Show details”',
    words: null,
    rule: 'Neutral words only, no action (the assessments are Phase 4, DEV-21): “None set yet” when the service answers none set (B3-05); otherwise the Student’s assessment words of `flow-state-words.ts` (B4-11 “Attempt in progress”, “Waiting for marking”, “Result not released yet”; B4-13 “Passed” / “Not passed” once released).',
    basis: 'B3-05 f0 … f9 (“None set yet”); B4-11 f1 … f3; B4-13 f0',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'ST-15.inactive': {
    screen: 'ST-15',
    state: 'The Student’s account is inactive',
    words: null,
    rule: 'B3-05 draws no inactive frame: the progress lines show as they stand (work is kept) with no action; the shell banner says why (XS-08).',
    basis: 'B3-05 f5 (the paused pattern: progress kept, no action); B2-10 f7',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-15.earlier-only': {
    screen: 'ST-15',
    state:
      'No experiment is given now, only earlier work (the only grant withdrawn, or the access ended, after some work)',
    words: 'No experiments are given to you right now',
    rule: 'B3-05 f6 lists the earlier work per format (“Access ended”, “Completed 14 Oct 2026”); while SACC-14 is open `getMyProgress` gives no row for it (PC-23), so Progress says what My courses says (B2-11 f7, f8 heading) instead of “Nothing to show yet”, with no toolbar and no rows. Earlier work beside a given experiment is likewise not listed.',
    basis:
      'B2-11 f7, f8 heading reused; B3-05 f6 (not reproducible: the service gives no earlier-work row); StudentAccessService.listMyCourses `earlierWork`',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-15.earlier-only.line': {
    screen: 'ST-15',
    state: 'The line under “No experiments are given to you right now” on Progress',
    words: 'Your earlier work is kept.',
    basis: 'B2-10 f8 “Your earlier work is kept.” (as ST-01 `ST-01.earlier-only.line`)',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  // ---- ST-16 Format feedback / ST-17 Feedback sent (B3-06) ----
  'ST-16.not-eligible': {
    screen: 'ST-16',
    state:
      'The feedback address is opened while `getFeedbackState` answers not eligible (that format not completed, not given, not published, unknown, or the experiment closed now)',
    words: null,
    rule: 'The workspace not-found pattern (PU-15 in the shell): B3-06 f5 draws no feedback entry at all until that format is completed (“No disabled button”), so there is no form to show and no state to explain; an unknown experiment or format reads the same, so nothing is revealed. Feedback after the access ends follows the service’s answer (AD-22 / P3-02 open).',
    basis:
      'B3-06 f5 (“Not eligible · VR in progress → no feedback entry”); FeedbackService.getFeedbackState (PC-16)',
    status: 'provisional',
    decisions: ['T-12', 'T-25'],
  },
  'ST-16.loading': {
    screen: 'ST-16',
    state: 'The feedback form loading (screen readers)',
    words: 'Loading your feedback',
    basis: 'B3-05 f7 “Loading your progress” formula; B3-06 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.failed': {
    screen: 'ST-16',
    state: 'The feedback state failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your feedback',
    basis:
      'B3-05 f8 “We couldn’t load your progress” / “Nothing has changed. Try again.” formula; B3-06 draws no failed-load frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.already-sent': {
    screen: 'ST-16',
    state: '“Submit feedback” answered “already sent” (sent from another tab meanwhile)',
    words: null,
    rule: 'One record per format, never resent (FB-03): the page reads the state again and shows the record already sent as ST-17, read-only — no extra words.',
    basis: 'B3-06 f3, f4 (sent, read-only); FeedbackService.sendFeedback `conflict: already-sent`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.refused': {
    screen: 'ST-16',
    state:
      '“Submit feedback” refused for a moved-on record (the format not completed, the experiment closed, an undecided rule)',
    words: null,
    rule: 'Nothing is written and no refusal words are drawn: the page reads the state again and shows what it answers — the form while still eligible, otherwise the not-found pattern (`ST-16.not-eligible`). Feedback after the access ends is the service’s answer (AD-22 / P3-02 open).',
    basis: 'B3-06 (no refusal frame); FeedbackService.sendFeedback refusals',
    status: 'provisional',
    decisions: ['AD-22', 'T-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
