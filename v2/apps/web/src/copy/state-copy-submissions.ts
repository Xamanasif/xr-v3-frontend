import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4B’s FA-12 Submissions and its FA-22 Export CSV (B4-06 f7 … f11) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_SUBMISSIONS = {
  // ---- The record's Submissions tab and FA-08's Phase-4B actions ------------------------------
  'FA-12.tab-count': {
    screen: 'FA-12',
    state: 'The figure on the record’s “Submissions” tab, on every tab of the record',
    words: null,
    rule: 'The number of Students who have submitted (the assessments list’s figure, as FA-08’s “<n> of <reach> submitted”); 0 is drawn. While that list is unavailable the tab has no figure.',
    basis:
      'B4-05 f0 “Submissions 1” with “1 of 5 submitted”, f3 “Submissions 0” on a draft; B4-06 f7 “Submissions 2”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-08.mark-next': {
    screen: 'FA-08',
    state: 'FA-08’s “Mark next” and “See submissions” under “Submissions”',
    words: null,
    rule: '“Mark next” shows only while a submission of this assessment waits for marking, as FA-12’s does (B4-06 script `canMarkNext`); “See submissions” shows whenever the section does (a Student has submitted).',
    basis: 'B4-05 f0, f4 draw both with “1 waiting for marking”; B4-06 script `canMarkNext`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.mark-next-target': {
    screen: 'FA-12',
    state: 'Where “Mark next” goes (FA-12, and FA-08’s)',
    words: null,
    rule: 'Mark a submission (FA-19) for the oldest submission of this assessment that waits for marking — the marking queue’s first, oldest first. While the queue is not read yet: on FA-12 the oldest waiting row of the list, on FA-08 the marking queue (FA-18) for this assessment. A submission the queue does not list (no written question to mark: M22 open) is never offered once the queue has answered.',
    basis: 'B4-05 / B4-06 `a[href="B4-09-Marking.dc.html"]`; B4-09 f1 “Marking / Rahul Verma”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-12 the list -------------------------------------------------------------------------
  'FA-12.rows': {
    screen: 'FA-12',
    state: 'Who the list shows, and in what order',
    words: null,
    rule: 'One row per submitted attempt, oldest first, with its ATT number (a Student’s second attempt is its own row); the count line counts these rows. The score shows once the marks are confirmed (“—” before); the release flag is read from the version the attempt answered.',
    basis: 'B4-06 script `rows`, `subCount`; contract `listSubmissions` (PC-57)',
    status: 'provisional',
    decisions: ['VD-12', 'P4-06'],
  },
  'FA-12.release-when-marked': {
    screen: 'FA-12',
    state:
      'The release flag of an attempt whose version shows results immediately after marking, not released yet',
    words: 'Not yet — when marked',
    basis:
      'B4-06 f7 “Not yet — after the deadline” (the flag formula); the service’s CSV writes the same words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.release-on-date': {
    screen: 'FA-12',
    state: 'The release flag of an attempt whose version shows results on a date, not released yet',
    words: 'Not yet — on {date}',
    rule: '{date} is the release date and time as the rules write it (“20 Nov 2026, 09:00”).',
    basis:
      'B4-06 f7 “Not yet — after the deadline”; B4-05 “Result and answers · On <date>”; the service’s CSV writes the same words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.release-on-a-date': {
    screen: 'FA-12',
    state: 'An “on a date” release whose date the version does not hold',
    words: 'Not yet — on a date',
    basis: 'B4-06 f7 flag formula; the service’s CSV writes the same words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.release-not-set': {
    screen: 'FA-12',
    state: 'An attempt whose version holds no release setting',
    words: 'Not yet',
    basis:
      'B4-06 f7 flag formula; a Ready assessment always has one (BC6) — the service’s CSV writes the same words',
    status: 'provisional',
    decisions: ['VD-12', 'BC6'],
  },
  'FA-12.loading': {
    screen: 'FA-12',
    state: 'The submissions loading (screen readers)',
    words: 'Loading the submissions',
    basis: 'Board 04 “State grammar” Loading formula; B4-06 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.failed': {
    screen: 'FA-12',
    state: 'The submissions failed to load (service unavailable)',
    words: 'The submissions didn’t load. Nothing was lost.',
    rule: 'With “Try again” and the record’s failed line (`FA-shared.record-failed.line`); the header and tabs stay.',
    basis: 'Board 04 Failed + retry formula; `FA-shared.record-failed`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.policy-open.title': {
    screen: 'FA-12',
    state:
      'The submissions of an assessment another faculty member created (the service answers policy-open)',
    words: 'These submissions aren’t available to you yet',
    rule: 'No row, name, score or file is shown and Export CSV is not offered: whether co-teaching Faculty see each other’s submissions is undecided (OD-B4-17, ATT-18 “own assessments”). When the record itself is held back the same way, the page shows this state under “Submissions” without the record’s header and tabs.',
    basis: 'Board 08 “not available” pattern; `FA-11.policy-open.title`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
  'FA-12.policy-open.line': {
    screen: 'FA-12',
    state: 'The policy-open state’s next step',
    words:
      'Another faculty member created this assessment. Ask them about its submissions; your own assessments are in Assessments.',
    basis: 'Board 04 formula (what happened, what to do next); OD-B4-17',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
  // ---- FA-22 Export CSV -----------------------------------------------------------------------
  'FA-12.export-busy': {
    screen: 'FA-12',
    state: 'Export CSV while the file is being made',
    words: 'Exporting…',
    basis: 'Board 04 busy button formula (“Giving access…”); B4-06 draws no busy frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.export-failed': {
    screen: 'FA-12',
    state: 'Export CSV failed (service unavailable, or the list could not be read)',
    words: 'The file wasn’t made. Nothing was lost.',
    rule: 'An err notice where f10 draws the confirmation, with the record’s failed line; focus moves to it. Nothing is downloaded.',
    basis: 'Board 04 Failed + retry formula; B4-06 f10 notice placement (`#Ub-exp`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-12.export-file': {
    screen: 'FA-12',
    state: 'What Export CSV downloads, and what the confirmation counts',
    words: null,
    rule: 'The service makes the file (its name, escaped and formula-safe cells) for every submission of the assessment, whichever filter is on; the browser saves it under that name — nothing is sent anywhere. The confirmation counts the file’s rows.',
    basis: 'B4-06 script `expText` (counts every row, not the filtered ones); T-33; PC-57',
    status: 'provisional',
    decisions: ['VD-12', 'T-33'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
