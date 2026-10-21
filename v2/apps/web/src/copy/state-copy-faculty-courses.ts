import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of FA-02 My courses, FA-03 Course and FA-04 Experiments — part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that the
 * owner-approved V3 export (design/v3-refined-b/roles/FA-v1 `Main.dc.html` FA-02 · FA-04, FA-03,
 * `vmCourses`, `vmCourse`) does not draw word for word, with its basis and the decisions it waits
 * on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_FACULTY_COURSES = {
  // ---- FA-02 My courses ----
  'FA-02.tab-address': {
    screen: 'FA-02',
    state: 'The address of the Experiments tab, and any other `tab` value',
    words: null,
    rule: '`/faculty/courses?tab=experiments` shows FA-04 Experiments; any other `tab` shows Courses and the address becomes the bare `/faculty/courses` (replaced, no history entry). Switching tabs is an ordinary link: the page keeps its document. With no course the tabs stay, as the export draws them, and each tab says so in its own message card.',
    basis:
      'FA-v1 Main.dc.html FA-02 · FA-04 (`nav.rk-tabs` “My courses”, drawn with no course too); Appendix A rule T2',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.loading': {
    screen: 'FA-02',
    state: 'The courses loading (screen readers; skeleton rows under the tabs)',
    words: 'Loading your courses',
    rule: 'The kit’s loading rows under the tabs while the courses and their taught experiments are read.',
    basis:
      'FA-v1 Main.dc.html FA-04 “Loading your experiments…” (the role’s loading); the export draws no loading for the Courses tab',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.failed': {
    screen: 'FA-02',
    state: 'The courses failed to load (service unavailable)',
    words: 'We couldn’t load your courses',
    rule: 'Drawn as the export draws FA-04’s failed state (`div.rk-state[role=alert]`): this title, “Nothing has changed. Try again.” and “Try again”, which reads again and moves focus to the page title.',
    basis:
      'FA-v1 Main.dc.html FA-04 “We couldn’t load your experiments”; no frame draws the Courses tab failing',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.figures': {
    screen: 'FA-02',
    state: 'The figures of a course in the ledger',
    words: null,
    rule: 'The service’s counts for the course: its taught experiments, the Students who can open them today and how many of its taught experiments have an assessment (Ready or draft) — never a percentage. The ledger’s count line adds up the courses’ experiments.',
    basis:
      'FA-v1 Main.dc.html FA-02 `dl.fa-figs` (Experiments, Students with access, Assessments); `TeachingCourseRow`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.access-ended': {
    screen: 'FA-02',
    state: 'When a course reads “Access ended on <date> · earlier work and results kept” (f7)',
    words: null,
    rule: 'When the service gives the course an access-ended date — every taught experiment of it is held by no live plan any more — that line replaces “Assigned to you by your Institute Admin” in the course’s head (and FA-03’s source line). The course still opens (FA-03 keeps the earlier work).',
    basis:
      'B4-02 f7 (a product state the FA-v1 export does not draw); `TeachingCourseRow.accessEndedOn`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.code-missing': {
    screen: 'FA-02',
    state: 'A course with no platform code',
    words: null,
    rule: 'The course’s head draws no code; its list is named by the course’s name, FA-03’s breadcrumb uses the name instead of the code.',
    basis:
      'FA-v1 Main.dc.html FA-02 / FA-03 draw “ME ZG523”; `courseCard.platformCode` may be null',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- FA-04 Experiments ----
  'FA-04.search': {
    screen: 'FA-04',
    state: 'What Search matches',
    words: null,
    rule: 'The experiment’s name, its course code and its course’s name, ignoring case, applied as you type; a search, a format and an activity each make a chip, “Clear filters” clears them all and the no-match state’s “Clear filters” too (focus returns to Search).',
    basis:
      'FA-v1 Main.dc.html FA-04 placeholder “Experiment or course”; `vmCourses` (chips for search, format and activity)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.activity': {
    screen: 'FA-04',
    state: 'What “With activity” and “No activity yet” select',
    words: null,
    rule: '“With activity”: at least one Student has opened the experiment in at least one format (the service’s formats used by its Students); “No activity yet”: none has.',
    basis:
      'FA-v1 Main.dc.html FA-04 Student activity filter (`usedFormats` in `vmCourses`); `TeachingExperiment.formatsUsedByStudents`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.progress': {
    screen: 'FA-04',
    state: 'The Student activity cell',
    words: null,
    rule: 'One unit meter per format the institution’s plan holds, in the order WEB · AR · VR · MR, one unit per Student it reaches (completed, in progress, not started), with “<n> completed · <n> in progress · <n> not started” — never one figure across formats — and “<n> students with access · as of <date>” (the read’s own instant). No Student yet: “No students have it yet”.',
    basis:
      'FA-v1 Main.dc.html FA-04 (`fa-prog--cell`, `fmProg`); `TeachingExperiment.perFormatCounts`, `asOf`',
    status: 'provisional',
    decisions: ['VD-12', 'BC4'],
  },
  'FA-04.assessment': {
    screen: 'FA-04',
    state: 'The Assessment cell',
    words: null,
    rule: '“Ready” (ok), “Draft — not ready” or “No assessment yet” (neutral), the assessment’s name (an unnamed draft is an “Untitled draft”) and “Due <date, time>” or “No deadline set yet” — “· created by <name>” for a co-teaching colleague’s; with none, “Create one from the experiment page.”',
    basis: 'FA-v1 Main.dc.html FA-04 (`asmState`, `vmCourses` `asmD`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.count': {
    screen: 'FA-04',
    state: 'The count while the experiments load or failed to load',
    words: null,
    rule: '“<n> experiment(s)”, or “<n> of <m> experiment(s)” while a filter applies, once the experiments are read; left out while they load or after a failure (the chips stay).',
    basis: 'FA-v1 Main.dc.html FA-04 `p.rk-count[role=status]` (shown when `XE.ok`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- FA-03 Course ----
  'FA-03.not-found': {
    screen: 'FA-03',
    state: 'An unknown course, or one no Faculty course maps to the Faculty member',
    words: null,
    rule: 'The in-shell not-found page (PU-15), whichever it is — the address never confirms that a course exists.',
    basis: 'Board 08 “Not found / not yours”; FA-shared.not-found',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.loading': {
    screen: 'FA-03',
    state: 'The course loading (screen readers)',
    words: 'Loading the course',
    basis:
      'FA-v1 Main.dc.html FA-04 “Loading your experiments…” (the role’s loading); the export draws no loading for FA-03',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.failed': {
    screen: 'FA-03',
    state: 'The course failed to load (service unavailable)',
    words: 'We couldn’t load this course',
    rule: 'Drawn as the export draws FA-04’s failed state (`div.rk-state[role=alert]`: this title, “Nothing has changed. Try again.”, “Try again”), under the breadcrumb to My courses.',
    basis: 'FA-v1 Main.dc.html FA-04 “We couldn’t load your experiments”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.figures': {
    screen: 'FA-03',
    state: 'The identity band’s figures',
    words: null,
    rule: 'The experiments the institution holds and the Students with access (the service’s counts for the course) and the assessments Ready among its taught experiments.',
    basis:
      'FA-v1 Main.dc.html FA-03 (`vmCourse` f1–f3); `TeachingCourseRow`, `listAssessments` readiness',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.mark-oldest': {
    screen: 'FA-03',
    state: '“Mark <n> written answers” on an experiment’s Assessment',
    words: null,
    rule: 'Shown while the Faculty member’s own written answers wait for that assessment; it opens the oldest waiting submission of it (FA-19), from one marking-queue read for the whole page (oldest first); Marking (FA-18) for that assessment until the queue answers.',
    basis:
      'FA-v1 WHAT-CHANGED (“Mark opens the oldest waiting submission”); `MarkingService.listQueue`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
