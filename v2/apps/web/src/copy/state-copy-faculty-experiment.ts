import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-05 Experiment, the teaching view (B4-03) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_FACULTY_EXPERIMENT = {
  'FA-05.loading': {
    screen: 'FA-05',
    state: 'The experiment loading (screen readers)',
    words: 'Loading the experiment',
    rule: 'A section skeleton under the back link, announced politely; the top bar reads “My courses” until the experiment is read.',
    basis:
      'Board 04 “State grammar” Loading formula; FA-shared “Loading the assessment”. B4-03 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.failed': {
    screen: 'FA-05',
    state: 'The experiment failed to load (service unavailable)',
    words: 'The experiment didn’t load. Nothing was lost.',
    basis:
      'Board 04 “State grammar” Failed + retry formula; FA-shared “The assessment didn’t load. Nothing was lost.” B4-03 draws no failure',
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
    rule: 'Inside the Assessment section only: a skeleton announced as “Loading the assessment”, or “The assessment didn’t load. Nothing was lost.” with “Try again”, which reads the assessment again. The rest of the page stays as read.',
    basis: 'FA-shared record loading and failed words (B4-05, B4-06 formula); B4-03 draws neither',
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
    state: 'The number of students in “<n> students have this experiment from your institution.”',
    words: null,
    rule: 'The Students the experiment reaches at the institution: the three counts of any one format added up (each such Student has exactly one of completed, in progress or not started in every format the institution has). Never a figure across formats.',
    basis:
      'B4-03 f0 “5 students” beside WEB “2 completed 2 in progress 1 not started” and VR “1 · 1 · 3”; the service answers the per-format counts only (BC4)',
    status: 'provisional',
    decisions: ['VD-12', 'BC4'],
  },
  'FA-05.students-one': {
    screen: 'FA-05',
    state: 'One student has the experiment',
    words: '1 student has this experiment from your institution.',
    basis: 'B4-03 f0 “5 students have this experiment from your institution.”; no board draws one',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.no-activity': {
    screen: 'FA-05',
    state: 'When “No activity yet” shows (f3)',
    words: null,
    rule: 'No format has a student completed or in progress (each count checked, never summed): the per-format rows are replaced by the one line. “Formats used by your students” is its own fact (the formats any of the institution’s Students has opened) and reads “None yet” when there is none.',
    basis: 'B4-03 f3 “No activity yet (later sample)” · “Formats used: none yet.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.no-activity-one': {
    screen: 'FA-05',
    state: 'No activity yet, with one student who has the experiment',
    words: '1 student has this experiment. They haven’t opened it yet.',
    basis:
      'B4-03 f3 “5 students have this experiment. None has opened it yet.”; no board draws one',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.no-students': {
    screen: 'FA-05',
    state: 'No student of the institution has the experiment yet',
    words: 'No students from your institution have this experiment yet.',
    basis:
      'B4-03 f3 “5 students have this experiment. None has opened it yet.”; no board draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.none-yet': {
    screen: 'FA-05',
    state: 'A fact with nothing to list: formats, learning outcomes or resources',
    words: null,
    rule: '“None yet”, as f3 draws for “Formats used by your students”; the same words for formats the institution has, learning outcomes and resources, which no frame draws empty. A blank description is left out.',
    basis: 'B4-03 f3 `span.xl-meta` “None yet”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.ready-line': {
    screen: 'FA-05',
    state: 'The Ready assessment row’s line',
    words: null,
    rule: '“Due <deadline> · <n> of <reach> submitted · <k> waiting for marking”: the waiting figure only when above 0; the deadline reads “Due …” also once it has passed (no board draws a closed one).',
    basis: 'B4-03 f0 “Due 14 Nov 2026, 23:59 · 1 of 5 submitted · 1 waiting for marking”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.draft-line': {
    screen: 'FA-05',
    state: 'The draft assessment row’s line',
    words: null,
    rule: '“<rules> · <questions>. Students can’t see it.” — “Rules set” when every rule is set, “Some rules not set yet” or “Rules not set yet” otherwise; “no questions yet”, “1 question” or “<n> questions”.',
    basis: 'B4-03 f2 “Rules set · no questions yet. Students can’t see it.”; B4-04 f10',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.draft-rules-none': {
    screen: 'FA-05',
    state: 'A draft with no rule set',
    words: 'Rules not set yet',
    basis: 'B4-03 f2 “Rules set”; B4-04 f1 “Not set yet”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.draft-rules-some': {
    screen: 'FA-05',
    state: 'A draft with some rules set and others not',
    words: 'Some rules not set yet',
    basis: 'B4-03 f2 “Rules set”; B4-04 f1 “Not set yet”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-05.not-rendered': {
    screen: 'FA-05',
    state: '“Mark <n> written answer” and “See students on this experiment”',
    words: null,
    rule: 'Since Phase 4B both render: “Mark <n> written answer” (FA-18 for this assessment) beside “Open assessment” only while answers wait for marking (the list row’s count), and “See students on this experiment” (FA-20) under the per-format rows.',
    basis:
      'B4-03 f0 `a.xr-btn--secondary` “Mark 1 written answer”, `a` “See students on this experiment”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
