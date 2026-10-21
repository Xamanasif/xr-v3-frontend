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
    rule: 'Every experiment `getMyProgress` answers is listed under its course, in the order My courses lists the courses and their experiments (`listMyCourses`, `getMyCourse`), each course group headed by its code shown, its name and “<n> experiment(s)”. Each experiment: one table row per format given to the Student (and one held by an undecided rule), in the hub’s order, each reading its own progress view, never the experiment’s (T-13); then “Not available to you” with the formats not included for the institution or not published. An experiment My courses does not list is left out (no course to place it under). Nothing is summed: no percentage, no word for the experiment or the course as a whole.',
    basis:
      'ST-v1 StudentFinal.dc.html `progress` region (`progVM`, `progExp`); B2-12 header order (state-copy `ST-05.format-order`); LearningService.getMyProgress, StudentAccessService.listMyCourses / getMyCourse',
    status: 'provisional',
    decisions: ['VD-12', 'T-13'],
  },
  'ST-15.actions': {
    screen: 'ST-15',
    state: 'The one action on a format line',
    words: null,
    rule: 'Only a format available to the Student now: in progress “Continue <format>”, not started “Open <format>” — the format’s page (ST-08 WEB, ST-09 AR / VR / MR); Completed: “Give feedback on <format>” only where the service’s per-format feedback entry offers it (that format’s own completion, BC5), the sent feedback being a fact (“Feedback sent <date>”), never an action. The first action of the page’s chosen kind (continue, then feedback, then open) is the one gold button. No action while the institution is paused, the account is inactive, a licence is awaited or the format is not available right now; the progress words stay.',
    basis:
      'ST-v1 StudentFinal.dc.html `progExp` (acts, one primary); FormatProgressView.feedback (`feedbackEntry`)',
    status: 'provisional',
    decisions: ['VD-12', 'T-12'],
  },
  'ST-15.headset-in-progress': {
    screen: 'ST-15',
    state: 'An AR, VR or MR format in progress, beside “In progress”',
    words: null,
    rule: '“First session reported <date, time>”, then “Last session reported <date, time>” when it differs (the export’s `progExp` facts); neither is shown when the runtime has reported no such time.',
    basis: 'ST-v1 StudentFinal.dc.html `progExp` (VR facts)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B3-07'],
  },
  'ST-15.paused-in-progress': {
    screen: 'ST-15',
    state: 'A format in progress while the institution is paused',
    words: null,
    rule: 'The pause is said once by the shell’s banner: each given format’s chip is held (pause glyph) with “Paused” as its access, its pill keeps the progress as it stands, no action, and the experiment offers no “Open experiment”.',
    basis:
      'ST-v1 StudentFinal.dc.html `progExp` (`shared` hold, `hasOpen`); HANDOFF “Held states are said once”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-15.details': {
    screen: 'ST-15',
    state: 'A format’s dated facts in the table’s Details column',
    words: null,
    rule: 'Only what the runtime reported and the system recorded, never a stage (lead decision 1): WEB “Not opened yet” | “First opened <date, time>”, “Last saved <date, time>” while in progress, “Reported by the simulation at <time>” when completed; AR / VR / MR “No headset session reported yet” | “First session reported …”, “Last session reported …”, “Reported from the headset at <time>”; then “Feedback sent <date>”; then a format’s own hold (“VR can’t be used at the moment. WEB still opens.”).',
    basis: 'ST-v1 StudentFinal.dc.html `progExp` (facts); `format-progress.ts` `formatFactsOf`',
    status: 'provisional',
    decisions: ['VD-12', 'T-13'],
  },
  'ST-15.assessment': {
    screen: 'ST-15',
    state: 'The assessment line of an experiment',
    words: null,
    rule: 'From the Student’s assessment row (`listMyAssessments`, one more existing aggregate read): “<name> · to do · due <date, time>” with “Open assessment”, “<name> · attempt in progress” with “Continue attempt”, “… · submitted, waiting for marking”, “… · marked, result not released yet”, “… · passed | not passed · <score> of <total> marks · released <date>” with “See result”; no assessment: “Not set by your faculty yet”. Without that read, the progress read’s own result in the Student’s status words of `flow-state-words.ts`, no way on.',
    basis:
      'ST-v1 StudentFinal.dc.html `progExp` (`asmt`, `asmtLink`); AssessmentService.listMyAssessments',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'ST-15.inactive': {
    screen: 'ST-15',
    state: 'The Student’s account is inactive',
    words: null,
    rule: 'The export routes an inactive Student to XS-08; the product keeps Progress readable: the progress shows as it stands (work is kept), each given format’s chip held with the inactive words, no action; the shell banner says why (XS-08).',
    basis:
      'ST-v1 StudentFinal.dc.html `resolve` (inactive → XS-08, not followed); the paused pattern',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-15.earlier-only': {
    screen: 'ST-15',
    state:
      'No experiment is given now, only earlier work (the only grant withdrawn, or the access ended, after some work)',
    words: 'No experiments are given to you right now',
    rule: 'The export lists the earlier work as an “Earlier work · <course>” group (access ended, no longer given); while SACC-14 is open `getMyProgress` gives no row for it (PC-23), so Progress says what My courses says (B2-11 f7, f8 heading) in the compact message instead of “Nothing to show yet”, with no filters and no rows. Earlier work beside a given experiment is likewise not listed.',
    basis:
      'B2-11 f7, f8 heading reused; ST-v1 `progVM` earlier groups (not reproducible: the service gives no earlier-work row); StudentAccessService.listMyCourses `earlierWork`',
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
    rule: 'A format given to the Student on an experiment listed for them (`listMyCourses` / `getMyCourse`), nothing holding it (no pause, licence wait or inactive account) and its own progress not completed: the export’s refusal card “Feedback on <format> isn’t open yet” — “You can give feedback on <format> once <format> is recorded as completed. Each format has its own feedback.” with “Back to <format>”. Anything else not eligible (not given, unknown, closed, completed meanwhile): the workspace not-found pattern (PU-15 in the shell), so nothing is revealed. Feedback after the access ends follows the service’s answer (AD-22 / P3-02 open).',
    basis:
      "ST-v1 StudentFinal.dc.html `msg('fb-not')`, `resolve` (`fb`); FeedbackService.getFeedbackState (PC-16)",
    status: 'provisional',
    decisions: ['T-12', 'T-25'],
  },
  'ST-16.loading': {
    screen: 'ST-16',
    state: 'The feedback form loading (screen readers)',
    words: 'Loading your feedback',
    basis: 'ST-v1 “Loading your progress…” formula; the export draws no feedback loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.failed': {
    screen: 'ST-16',
    state: 'The feedback state failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your feedback',
    basis:
      'ST-v1 “We couldn’t load your progress” / “Nothing has changed. Try again.” formula; the export draws no feedback failed-load frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.already-sent': {
    screen: 'ST-16',
    state: '“Submit feedback” answered “already sent” (sent from another tab meanwhile)',
    words: null,
    rule: 'One record per format, never resent (FB-03): the page reads the state again and shows the record already sent as ST-17, read-only — no extra words.',
    basis: 'ST-v1 `fbVM` (sent, read-only); FeedbackService.sendFeedback `conflict: already-sent`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-16.refused': {
    screen: 'ST-16',
    state:
      '“Submit feedback” refused for a moved-on record (the format not completed, the experiment closed, an undecided rule)',
    words: null,
    rule: 'Nothing is written and no refusal words are drawn: the page reads the state again and shows what it answers — the form while still eligible, otherwise `ST-16.not-eligible`. Feedback after the access ends is the service’s answer (AD-22 / P3-02 open).',
    basis: 'ST-v1 `sendFb` (no refusal frame); FeedbackService.sendFeedback refusals',
    status: 'provisional',
    decisions: ['AD-22', 'T-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
