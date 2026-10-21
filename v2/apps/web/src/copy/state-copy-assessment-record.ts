import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-08 Summary and FA-09 Questions (B4-05) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_ASSESSMENT_RECORD = {
  // ---- FA-08 Summary ---------------------------------------------------------------------------
  'FA-08.introduction-none': {
    screen: 'FA-08',
    state: 'An assessment saved without an introduction (it is optional)',
    words: 'None',
    basis:
      'B4-05 f0 “Time limit · None”; B4-04 “Introduction (optional)”. The walk’s ASMT-0009 has no introduction',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-08.pass-mark-marks': {
    screen: 'FA-08',
    state: 'The pass mark in marks',
    words: null,
    rule: '“<percent>% · <marks> of <total> marks” with the marks exactly as the service gives them (pass mark × total, which may be fractional — the rounding is open); with no question yet, “<percent>%” alone.',
    basis: 'B4-05 f0 “50% · 8 of 16 marks”; contract `getAssessmentOutput.passMarkMarks` (M22 [U])',
    status: 'provisional',
    decisions: ['M22'],
  },
  'FA-08.version-both': {
    screen: 'FA-08',
    state: 'The current version was made by changing questions and rules together',
    words: '{who} changed the questions and a rule after students submitted.',
    basis: 'B4-05 f4 “You changed a rule after students submitted.”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-13'],
  },
  'FA-08.version-unknown': {
    screen: 'FA-08',
    state: 'A version after the first whose change the history does not name',
    words: 'This assessment changed after students submitted.',
    basis:
      'B4-05 f4 notice; the record’s history names the change in every world the product writes',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-13'],
  },
  'FA-08.version-actor': {
    screen: 'FA-08',
    state: 'The change that made the current version was made by someone else',
    words: null,
    rule: 'Their name in place of “You” (“Dr K. Iyer changed a rule after students submitted.”). Who else may change an assessment (a co-teaching colleague) is open; the service decides.',
    basis: 'B4-05 f4 “You changed a rule …”; contract `updateQuestions` policy-open OD-B4-17',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },
  'FA-08.version-keeps': {
    screen: 'FA-08',
    state: 'The version notice’s second sentence (who keeps which version)',
    words: 'Earlier submissions keep the version they answered; new attempts use version {n}.',
    rule: 'The second sentence of the versions notice (and of FA-09’s and FA-10’s “This made version 2 …”) while the submissions are not read yet: once `listSubmissions` answers, the export’s words name whose submissions keep which version (“Rahul Verma’s submission keeps version 1; new attempts use version 2.”). {n} is the current version.',
    basis:
      'B4-05 f4; contract `getAssessmentOutput` (no submitter names; FA-12 Submissions is Phase 4B)',
    status: 'provisional',
    decisions: ['VD-12', 'DEV-21'],
  },
  'FA-08.reach-one': {
    screen: 'FA-08',
    state: 'The assessment reaches one Student',
    words: ' who has {experiment}{from}.',
    rule: 'After the strong “1 student”; {from} is “ from <institution>”, or nothing when the session names no institution.',
    basis:
      'B4-05 f0 “**5 students** who have Shell-and-Tube Heat Exchanger from Godavari Institute of Technology.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-08.reach-none': {
    screen: 'FA-08',
    state: 'The assessment reaches no Student yet (no Student access given)',
    words: 'No students have {experiment}{from} yet.',
    rule: 'No strong count; the formats sentence and “Reach follows Student access, set by the Institute Admin.” follow as drawn.',
    basis: 'B4-05 f0 reach line; Board 04 Empty formula (“nothing here yet”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-08.experiment-unknown': {
    screen: 'FA-08',
    state: 'The experiment’s name could not be read with the record (its read failed)',
    words: 'the experiment',
    rule: 'Stands in for the experiment’s name in the Ready line, the reach line and FA-09’s panel meta; the header’s overline is left out.',
    basis: 'B4-05 f0 names the experiment from the teaching read',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-08.created-by-other': {
    screen: 'FA-08',
    state: 'The assessment was created by someone other than the signed-in Faculty member',
    words: null,
    rule: '“by <their name>” in place of “by you”.',
    basis: 'B4-05 f0 “Created 26 Oct 2026, 16:40 by you · …”',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },

  // ---- FA-09 Questions -------------------------------------------------------------------------

  'FA-09.stale': {
    screen: 'FA-09',
    state:
      'Remove, Add, a move or “Use updated version” refused because the assessment moved on (a stale revision, a question no longer in it, nothing to change, a question gone)',
    words:
      'This assessment changed while you were working on it. It has been read again — check it and try again.',
    rule: 'Nothing is written; the record and the bank are read again and the line takes focus.',
    basis: 'P1-21 interim (“Refetch and render the current drawn state”); B4-05 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-09.policy-open': {
    screen: 'FA-09',
    state:
      'A change the service answers with an undecided rule (a co-teaching colleague’s assessment)',
    words: 'Whether you can change this assessment isn’t decided yet, so nothing changed.',
    basis:
      'Board 04 refusal formula; contract `updateQuestions` / `useUpdatedVersion` policy-open OD-B4-17',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },
  'FA-09.last-question': {
    screen: 'FA-09',
    state: 'Removing the only question of a Ready assessment (the service refuses it)',
    words:
      'A Ready assessment keeps at least one question. Add another before you remove this one.',
    basis:
      'Message catalogue `FA-09.questions.at-least-one` (“no board draws words for it”); a Ready assessment stays Ready (B4-04)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-03'],
  },
  'FA-09.unavailable': {
    screen: 'FA-09',
    state: 'Remove, Add, a move or “Use updated version” failed for now (service unavailable)',
    words: 'That change didn’t save. Nothing changed — try again.',
    rule: 'Nothing changes; the line takes focus and the action can be pressed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes”; B4-05 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-09.busy': {
    screen: 'FA-09',
    state: 'A change is being sent',
    words: null,
    rule: 'The pressed Remove, Add, “Use updated version” or “Add this question to the assessment” is busy (it keeps its label); every other change is ignored until the answer arrives.',
    basis: 'Board 10 “While busy, buttons ignore repeat presses”; B4-05 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-09.bank-loading': {
    screen: 'FA-09',
    state: 'The bank panel’s questions loading',
    words: 'Loading your question bank',
    basis: 'Board 04 “State grammar” Loading formula; B4-05 draws no loading panel',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-09.bank-failed': {
    screen: 'FA-09',
    state: 'The bank panel’s questions failed to load',
    words: 'Your question bank didn’t load. Nothing was lost.',
    rule: 'With “Try again”, which reads the bank again.',
    basis: 'Board 04 Failed + retry formula; FA-shared.record-failed',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-09.panel-focus': {
    screen: 'FA-09',
    state: 'Opening and closing the bank panel',
    words: null,
    rule: 'Opening moves focus to the panel’s title (as drawn); the close button or Escape closes it and returns focus to “Add from question bank”.',
    basis: 'B4-05 f7 script (`focus(pid + "-ph")`); Board 12 focus order',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-09.deleted-row': {
    screen: 'FA-09',
    state: 'A question deleted from the bank that the assessment still pins',
    words: null,
    rule: 'The row keeps its marks, Move and Remove (f2 is a partial later sample drawing neither) and shows no newer-version notice: a deleted question has no version to move to.',
    basis:
      'B4-05 f2 “Deleted from your question bank on 25 Oct 2026 — this assessment keeps its copy.”; f6 row',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
