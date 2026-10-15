import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s shared Faculty parts — the assessment record’s header and
 * tabs (B4-05, B4-06; FA-08 … FA-11), the rules form (B4-04 step 2, B4-06 FA-10) and the shared
 * assessment words (`assessment-words.ts`) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule they show that their boards do not draw word for word. Decision ids
 * never appear in visible copy.
 */
export const STATE_COPY_FACULTY_SHARED = {
  'FA-shared.record-loading': {
    screen: 'FA-08',
    state: 'An assessment record loading (screen readers), on any of its tabs',
    words: 'Loading the assessment',
    basis:
      'Board 04 “State grammar” Loading formula; IA-09 “Loading the faculty record”. B4-05 and B4-06 draw no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.record-failed': {
    screen: 'FA-08',
    state: 'An assessment record failed to load (service unavailable), on any of its tabs',
    words: 'The assessment didn’t load. Nothing was lost.',
    basis:
      'Board 04 “State grammar” Failed + retry formula; IA-09 “The faculty record didn’t load. Nothing was lost.” B4-05 and B4-06 draw no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.record-failed.line': {
    screen: 'FA-08',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report a problem from Help.',
    basis: 'Board 04 Failed + retry formula (“what to do next”), as IA-09’s failed line',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.not-found': {
    screen: 'FA-08',
    state: 'An unknown assessment, or one outside the Faculty member’s teaching scope',
    words: null,
    rule: 'The in-shell not-found page (PU-15), whichever it is — the address never confirms that a record exists (board 08). The same for an experiment, a course or a question.',
    basis: 'Board 08 “Not found / not yours”; the service answers not-found or not-permitted',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.submissions-tab': {
    screen: 'FA-08',
    state: 'The record’s “Submissions” tab and every action that opens marking or students',
    words: null,
    rule: 'Not rendered until FA-12, FA-18 and FA-20 are built (Phase 4B, DEV-21): the tabs read Summary · Questions · Settings · Preview; “Mark next”, “See submissions”, “Mark <n> written answer”, “See students on this experiment” and “View students” are not drawn.',
    basis:
      'B4-05 f0 and B4-06 f0 tab strips; B4-01, B4-03; the link-target ledger’s “not rendered” rule',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'FA-shared.marks-one': {
    screen: 'FA-09',
    state: 'A question worth one mark',
    words: '1 mark',
    basis: 'B4-05 f6 “2 marks”, “10 marks”; no board draws one mark',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.questions-one': {
    screen: 'FA-09',
    state: 'An assessment with one question',
    words: '1 question',
    basis: 'B4-05 f1 “0 questions · 0 marks”, f6 “4 questions · 16 marks”; no board draws one',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.rules-partial': {
    screen: 'FA-07',
    state: 'A rules summary while some rules are set and others are not (a draft)',
    words: null,
    rule: 'The rules that are set, in the drawn order and words (“Pass mark 50% · 2 attempts · due … · results: …”), the others left out; with none set, “Not set yet” (B4-04 f1). An “On a date” release reads “results: on 20 Nov 2026, 09:00”.',
    basis:
      'B4-04 f1 “Not set yet”, f4 “Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline”',
    status: 'provisional',
    decisions: ['VD-12', 'BC6'],
  },
  'FA-shared.date-time-unreadable': {
    screen: 'FA-10',
    state: 'A deadline or release date typed in a form the page cannot read as a date and time',
    words: null,
    rule: 'Read in Indian time (the zone of every board date) as “14 Nov 2026, 23:59” (a full month name, no comma or a one-digit hour are accepted); anything else is sent as typed and the service’s own check answers it. Blank is never filled in (BC6).',
    basis:
      'B4-04 f2 / B4-06 f0 hint “Date and time, for example 14 Nov 2026, 23:59”; contract `assessmentRulesInput.deadline` (“the form converts the typed value in the display zone”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.deadline-unreadable': {
    screen: 'FA-10',
    state:
      'The deadline typed could not be read as a date and time (the service answers invalid input)',
    words: 'Enter the deadline as a date and time, for example 14 Nov 2026, 23:59',
    basis:
      'B4-04 f3 “Enter the deadline” with the field’s own hint “Date and time, for example 14 Nov 2026, 23:59”; no board draws an unreadable date',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-shared.release-date-unreadable': {
    screen: 'FA-10',
    state: 'The release date typed could not be read as a date and time',
    words: 'Enter the release date as a date and time, for example 20 Nov 2026, 09:00',
    basis:
      'B4-04 “Enter the release date” with the field’s own hint “Date and time, for example 20 Nov 2026, 09:00”; no board draws an unreadable date',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
