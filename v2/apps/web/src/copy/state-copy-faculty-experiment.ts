import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of FA-05 Experiment, the teaching view — part of the one register
 * (`state-copy.ts`, VD-12): every state string or rule the screen shows that the owner-approved V3
 * export (design/v3-refined-b/roles/FA-v1 `Main.dc.html` FA-05, `vmExperiment`, `asmSum`) does not
 * draw word for word, with its basis and the decisions it waits on. Decision ids never appear in
 * visible copy.
 */
export const STATE_COPY_FACULTY_EXPERIMENT = {
  'FA-05.loading': {
    screen: 'FA-05',
    state: 'The experiment loading (screen readers)',
    words: 'Loading the experiment',
    rule: 'The application’s record loading (a section skeleton, announced politely); the document title reads “My courses” until the experiment is read.',
    basis:
      'Board 04 “State grammar” Loading formula; FA-shared “Loading the assessment”. The FA-v1 export draws no loading for FA-05 (HANDOFF §4)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.failed': {
    screen: 'FA-05',
    state: 'The experiment failed to load (service unavailable)',
    words: 'The experiment didn’t load. Nothing was lost.',
    basis:
      'Board 04 “State grammar” Failed + retry formula; FA-shared “The assessment didn’t load. Nothing was lost.” The FA-v1 export draws no failure for FA-05',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.failed.line': {
    screen: 'FA-05',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report a problem from Help.',
    basis: 'Board 04 Failed + retry formula (“what to do next”), as FA-shared’s failed line',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.assessment-states': {
    screen: 'FA-05',
    state: 'The experiment is read but its assessment is still loading, or failed to load',
    words: null,
    rule: 'Inside the Assessment panel only: the kit’s loading row announced as “Loading the assessment”, or the failed state (`div.rk-state[role=alert]`) “The assessment didn’t load. Nothing was lost.” with “Try again”, which reads the assessments again. The rest of the page stays as read.',
    basis: 'FA-shared record loading and failed words; the FA-v1 export draws neither',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.not-found': {
    screen: 'FA-05',
    state:
      'An unknown experiment, one outside the Faculty member’s teaching scope, or one whose Faculty course the Institute Admin has removed',
    words: null,
    rule: 'The in-shell not-found page (PU-15), whichever it is — the address never confirms that the experiment exists. The next read after an Institute Admin removes the Faculty course mapping is the same not-found.',
    basis:
      'Board 08 “Not found / not yours”; the service answers not-permitted (out of scope) or not-found',
    status: 'provisional',
    decisions: ['VD-12', 'PC-16'],
  },
  'FA-05.students-count': {
    screen: 'FA-05',
    state:
      'The number of Students in the band’s figure and “<n> students have this experiment from your institution.”',
    words: null,
    rule: 'The Students the experiment reaches at the institution: the three counts of any one format added up (each such Student has exactly one of completed, in progress or not started in every format the institution has). Never a figure across formats; “None yet” while it reaches none.',
    basis:
      'FA-v1 Main.dc.html FA-05 (`E1.reach`, `reachLine`); `TeachingExperiment.perFormatCounts`',
    status: 'provisional',
    decisions: ['VD-12', 'BC4'],
  },
  'FA-05.as-of': {
    screen: 'FA-05',
    state: 'The “As of <date>” beside Student activity (FA-03, FA-04, FA-05)',
    words: null,
    rule: 'The teaching read’s own instant (`asOf`, when the counts were read), as a date; FA-01’s “Your teaching” uses the first taught experiment’s.',
    basis: 'FA-v1 Main.dc.html FA-05 “As of 7 Nov 2026” (`W.clock.day`); PC-52 `asOf`',
    status: 'provisional',
    decisions: ['VD-12', 'PC-52'],
  },
  'FA-05.empty-about': {
    screen: 'FA-05',
    state: 'An experiment with no description, outcome or resource',
    words: null,
    rule: 'No description: the About section starts with its two columns. No outcome or no resource: “None yet” under that heading (the read-only note stays).',
    basis: 'FA-v1 Main.dc.html FA-05 About (always drawn with all three)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.assessment-panel': {
    screen: 'FA-05',
    state: 'The navy Assessment panel’s facts and actions',
    words: null,
    rule: 'From the institution’s assessment of the experiment (`listAssessments`): its status, name (→ FA-08), “Due <date, time>” with the days left while it is Ready and open (“Deadline passed: …” after, “No deadline set yet” while unset), the submissions meter (own and Ready, with Students reached), the own written answers waiting with “Mark <n> written answers” (the oldest waiting submission, FA-19; FA-18 for it until the queue answers), the note — “Created by <name>.” for a co-teaching colleague’s, “Rules not finished · …” or “No questions yet · …” for a draft — then “Open assessment” or “Continue setting up”. None yet: the title, the line and “Create assessment” (FA-07 with the experiment chosen).',
    basis:
      'FA-v1 Main.dc.html FA-05 panel and `asmSum`; OD-B4-17 (a colleague’s rules are readable)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
