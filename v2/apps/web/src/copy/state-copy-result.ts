import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4B’s ST-14 Result (B4-13) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_RESULT = {
  // ---- What the page reads and when it shows a figure ----------------------------------------
  'ST-14.attempt-shown': {
    screen: 'ST-14',
    state: 'Which of the Student’s attempts the result page shows',
    words: null,
    rule: 'The latest submitted attempt (highest attempt number) of the Student’s own attempts on the assessment; an attempt still in progress is not a result. With no submitted attempt the page shows B4-13’s “Not submitted yet” message (`r.notSub`, drawn in the markup, in no frame) with “Back to the assessment” (ST-12).',
    basis:
      'B4-13 script `notSub`, `waiting`, `notReleased`, `showResult` (one attempt, ATT-0450); the board draws no second attempt',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.no-figure': {
    screen: 'ST-14',
    state: 'Submitted, not yet released (f1, f2, f4)',
    words: null,
    rule: 'No score, outcome, correct answer, explanation, feedback or per-question mark is shown unless the service answers the result as released; the service gives no review before then. Waiting for marking — even once the deadline has passed — and marked but not released are message pages with “Back to experiment” only.',
    basis: 'B4-13 head “No figure before release (T-19)”; f4 “never a partial score”',
    status: 'provisional',
    decisions: ['T-19'],
  },
  'ST-14.loading': {
    screen: 'ST-14',
    state: 'The result loading (screen readers)',
    words: 'Loading your result',
    basis:
      'Board 04 "State grammar" Loading (“Loading your reports”); B4-13 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.failed': {
    screen: 'ST-14',
    state: 'The result failed to load (a test fault plan only)',
    words: 'We couldn’t load your result',
    basis:
      'B3-05 (ST-15) “We couldn’t load your progress”; the Student failed pattern (B2-11 f10); B4-13 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.not-available': {
    screen: 'ST-14',
    state:
      'The assessment is refused to the Student (experiment not given, access ended, paused, an open decision)',
    words: null,
    rule: 'ST-19’s message page in place, as the experiment hub renders a refusal (“My courses / Not available”); an unknown assessment, a draft or another Student’s attempt is the in-shell not-found.',
    basis: 'B2-12 f4, f6 (ST-19); B4-13 draws no refusal',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- The released result (f0, f3, f5) ------------------------------------------------------
  'ST-14.pass-mark': {
    screen: 'ST-14',
    state: 'f0 “Pass mark 50% · 8 of 16 marks”',
    words: null,
    rule: 'The attempt’s own version: the pass mark in marks and the total come with the released result; the percentage is read back from them (pass mark × 100 ÷ total), so a rule changed after the submission does not change what the Student reads.',
    basis: 'B4-13 f0 `xa-score-facts`; the attempt keeps its version’s rules (Phase 4A)',
    status: 'provisional',
    decisions: ['P4-06'],
  },
  'ST-14.figures': {
    screen: 'ST-14',
    state: 'A pass mark that is not a whole number of marks (e.g. 50% of 15)',
    words: null,
    rule: 'Shown to two decimal places at most (“7.5 of 15 marks”); no rounding to whole marks is applied until the owner decides one.',
    basis: 'AssessmentService `passMarkMarks` “may be fractional and its rounding is open”',
    status: 'provisional',
    decisions: ['M22'],
  },
  'ST-14.one-mark': {
    screen: 'ST-14',
    state: 'A question worth one mark',
    words: '{n} of 1 mark',
    basis: 'B4-13 “2 of 2 marks”, made singular as `FA-shared.marks-one` (“1 mark”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.attempt-no-limit': {
    screen: 'ST-14',
    state:
      'The attempt’s version sets no number of attempts (not reachable for a Ready assessment)',
    words: 'Attempt {n}',
    basis: 'B4-13 f0 “Attempt 1 of 2” without its limit',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.released.when-marked': {
    screen: 'ST-14',
    state:
      'Released by “Immediately after marking”, or on a date whose marks were confirmed after it',
    words: 'Released {at}, when marked',
    basis:
      'B4-13 f0 “Released 14 Nov 2026, 23:59, after the deadline”; B4-04 “Each student sees their result once their answers are marked.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.released.on-date': {
    screen: 'ST-14',
    state: 'Released by “On a date” on that date',
    words: 'Released {at}, on the date set',
    basis:
      'B4-13 f0 “Released 14 Nov 2026, 23:59, after the deadline”; B4-04 “Everyone sees their result on the date you choose.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.released.other': {
    screen: 'ST-14',
    state:
      'Released, with no release setting recorded on the version (not reachable for a Ready assessment)',
    words: 'Released {at}',
    basis: 'B4-13 f0 “Released 14 Nov 2026, 23:59, after the deadline” without its setting',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.mark-tone': {
    screen: 'ST-14',
    state: 'Each answer’s mark (f0 `span.xa-mk`)',
    words: null,
    rule: 'The tick (`is-ok`) when any mark was awarded, the cross (`is-no`) for none — for a written answer too (f3 “4 of 10 marks” with the tick).',
    basis: 'B4-13 script `answers` (`ok: isW ? got > 0 : ok`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.explanation-none': {
    screen: 'ST-14',
    state: 'A question saved without an explanation (optional in the bank)',
    words: null,
    rule: 'The “Explanation” row is left out; nothing stands in for it.',
    basis: 'B4-07 “Explanation (optional)”; B4-13 draws every question with one',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.feedback-from-faculty': {
    screen: 'ST-14',
    state: 'Feedback on a written answer whose author the record does not name',
    words: 'Feedback from your faculty',
    basis: 'B4-13 f0 “Feedback from Dr S. Ranganathan”; f1 “Your faculty marks written answers.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- Try again (f3) -------------------------------------------------------------------------
  'ST-14.try-again': {
    screen: 'ST-14',
    state: 'When “Try again” is shown (f3)',
    words: null,
    rule: 'Only on a released “Not passed” with an attempt left, and only while the service says a new attempt can start. It starts the attempt (`startAttempt`) and opens it (ST-13); it is never a link to an attempt that does not exist yet.',
    basis:
      'B4-13 head “Try again only if not passed and allowed”; f3 caption “Try again starts attempt 2 of 2.”',
    status: 'provisional',
    decisions: ['ATT-05'],
  },
  'ST-14.attempts-left': {
    screen: 'ST-14',
    state: 'f3 with more than one attempt left',
    words: 'You have {n} attempts left.',
    basis: 'B4-13 f3 “You have 1 attempt left.”, made plural',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.earlier-stay': {
    screen: 'ST-14',
    state: 'Not passed with an attempt left, after a later attempt (V3 score panel)',
    words: 'Your earlier results stay here.',
    basis: 'ST-v1 `resultVM` `leftText` “You have 1 attempt left. Your first result stays here.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.starting': {
    screen: 'ST-14',
    state: '“Try again” while the new attempt is being started (busy button)',
    words: 'Starting…',
    basis: 'Board 03 busy buttons (“Giving access…”); B4-13 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.start-failed': {
    screen: 'ST-14',
    state: '“Try again” could not reach the service (a test fault plan only)',
    words: 'Your new attempt didn’t start',
    basis:
      'Board 04 "State grammar" Failed + retry (“What didn’t work + reassurance + retry”); B4-13 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.start-refused': {
    screen: 'ST-14',
    state: '“Try again” refused by the service (no attempt left, already passed, access closed)',
    words: 'A new attempt can’t be started now.',
    basis: 'B4-13 head “Try again only if not passed and allowed”; B4-13 draws no refusal',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- Submitted, not released (f1, f2, f4) ---------------------------------------------------
  'ST-14.appears.on-date': {
    screen: 'ST-14',
    state: 'Waiting for marking, released “On a date” (f1 for that setting)',
    words: 'Your result appears on {date}.',
    basis: 'B4-13 f1 “Your result appears after the deadline: 14 Nov 2026, 23:59.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.appears.when-marked': {
    screen: 'ST-14',
    state: 'Waiting for marking, released “Immediately after marking” (f1 for that setting)',
    words: 'Your result appears when your answers are marked.',
    basis:
      'B4-13 f1 “Your result appears after the deadline: …”; B4-04 “Each student sees their result once their answers are marked.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.appears.other': {
    screen: 'ST-14',
    state:
      'Waiting for marking, with no release setting recorded (not reachable for a Ready assessment)',
    words: 'Your result appears when it is released.',
    basis: 'B4-13 f1 “Your result appears after the deadline: …” without its setting',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.not-released.on-date': {
    screen: 'ST-14',
    state: 'Marked, not released, released “On a date” (f2 for that setting)',
    words: 'Results for this assessment are released on {date}.',
    basis:
      'B4-13 f2 “Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.not-released.other': {
    screen: 'ST-14',
    state:
      'Marked, not released, with no release date recorded (not reachable: “Immediately after marking” releases at confirmation)',
    words: 'Results for this assessment are released as your faculty set them.',
    basis: 'B4-13 f2 “Results for this assessment are released after the deadline: …”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-14.waiting-choice-only': {
    screen: 'ST-14',
    state: 'Waiting for marking, for an attempt with no written question (choice questions only)',
    words: 'Your faculty confirms the automatic marks.',
    rule: 'In place of “Your faculty marks written answers.”: “You submitted on 5 Nov 2026, 18:52. Your faculty confirms the automatic marks. Your result appears …”. Owner decision, 24 Oct 2026: the Faculty member confirms a choice-only submission; no figure before then.',
    basis: 'B4-13 f1 “Your faculty marks written answers.”; owner decision of 24 Oct 2026',
    status: 'provisional',
    decisions: ['VD-12', 'P4-05'],
  },
  'ST-14.waiting-after-deadline': {
    screen: 'ST-14',
    state: 'f4: the deadline has passed but the written answer is not marked',
    words: null,
    rule: 'The f1 message, word for word (“… Your result appears after the deadline: 14 Nov 2026, 23:59.”), as f4 draws it — never a partial score.',
    basis: 'B4-13 f4 and its caption',
    status: 'provisional',
    decisions: ['T-19'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
