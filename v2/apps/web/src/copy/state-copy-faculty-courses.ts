import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-02 My courses, FA-03 Course and FA-04 Experiments (B4-02) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_FACULTY_COURSES = {
  // ---- FA-02 My courses ----
  'FA-02.tab-address': {
    screen: 'FA-02',
    state: 'The address of the Experiments tab, and any other `tab` value',
    words: null,
    rule: '`/faculty/courses?tab=experiments` shows FA-04 Experiments (“My courses / Experiments” in the top bar); any other `tab` shows Courses and the address becomes the bare `/faculty/courses` (replaced, no history entry). Switching tabs is an ordinary link: the page keeps its document.',
    basis:
      'Appendix A rule T2 (FA-04 `?tab=experiments`); B4-02 f0 and f2 `nav.xr-tabs` “My courses”; as ST-04 and IA-06 tabs do',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.none-assigned': {
    screen: 'FA-02',
    state: 'No Faculty course maps any course to the Faculty member (f6)',
    words: null,
    rule: 'The drawn empty state in place of the tabs and the list, with the header’s meta; the Experiments tab does not exist then, so `?tab=experiments` becomes the bare `/faculty/courses`. A course that is mapped but whose experiments the institution no longer holds is not listed (the service’s scope: Faculty courses ∩ the plans).',
    basis:
      'B4-02 f6 “None assigned” (no `nav.xr-tabs`); `TeachingService.listMyCourses` (FCM-04 scope)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.loading': {
    screen: 'FA-02',
    state: 'The courses loading (screen readers; skeleton rows below the tabs)',
    words: 'Loading your courses',
    basis:
      'B4-02 f4 “Loading your experiments” (the Faculty boards’ loading formula); B4-02 draws no loading frame for the Courses tab',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.failed': {
    screen: 'FA-02',
    state: 'The courses failed to load (service unavailable)',
    words: 'We couldn’t load your courses',
    rule: 'Drawn as B4-02 f5: the empty pattern with the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again; focus moves to the main region once the courses are back.',
    basis: 'B4-02 f5 “We couldn’t load your experiments”; no frame draws the Courses tab failing',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.students-one': {
    screen: 'FA-02',
    state: 'A course or experiment one Student can open today',
    words: 'student with access',
    rule: '“1 student with access”; any other count “<n> students with access” (also on FA-03).',
    basis: 'B4-02 f0 / f1 “5 students with access”; the singular is undrawn (as IA-20)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.assessments-count': {
    screen: 'FA-02',
    state: 'A course whose taught experiments have no assessment, or more than one',
    words: null,
    rule: '“0 assessments”, “2 assessments”: how many of the course’s taught experiments have an assessment at the institution (the service’s count), Ready or draft; “1 assessment” as drawn. Likewise “<n> experiments”.',
    basis:
      'B4-02 f0 “1 experiment · … · 1 assessment”; its script’s count formula (“0 experiments”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.access-ended': {
    screen: 'FA-02',
    state: 'When a course row reads “Access ended on <date> · earlier work and results kept” (f7)',
    words: null,
    rule: 'When the service gives the course an access-ended date — every taught experiment of it is held by no live plan any more — the date is the latest of those ends. The row still opens the course (FA-03 keeps the earlier work). On FA-03 the header’s meta reads the same line.',
    basis: 'B4-02 f7 “Access ended (later sample)”; `TeachingCourseRow.accessEndedOn`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-02.code-missing': {
    screen: 'FA-02',
    state: 'A course with no platform code',
    words: null,
    rule: 'The row’s line starts with its counts (no `xr-id`); FA-03’s crumb and meta use the course’s name instead of the code.',
    basis: 'B4-02 f0 / f1 draw “ME ZG523”; `courseCard.platformCode` may be null',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- FA-04 Experiments ----
  'FA-04.search': {
    screen: 'FA-04',
    state: 'What “Search experiments” matches',
    words: null,
    rule: 'The experiment’s name, its course code and its course’s name, ignoring case, applied as you type; a search makes no chip (only Format and Activity do, as the board’s script builds them). “Clear filters” in the no-match line clears the search too.',
    basis:
      'B4-02 f2 placeholder “Experiment or course”; its script (`(r.t + " " + r.code).includes(q)`, chips for format and activity only)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.activity': {
    screen: 'FA-04',
    state: 'What “With activity” and “No activity yet” select',
    words: null,
    rule: '“With activity”: at least one Student has opened the experiment in at least one format (the service’s formats used by its Students); “No activity yet”: none has.',
    basis:
      'B4-02 f2 Activity filter (`r.active` in its script); `TeachingExperiment.formatsUsedByStudents`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.activity-filter-narrow': {
    screen: 'FA-04',
    state: 'The Activity filter below 600 px of content',
    words: null,
    rule: 'Drawn as `xr-filter-2`, which the v46 sheet hides below 600 px of content (f8 draws no Activity filter at 375 and no “More filters”). A filter set at a wider width stays applied and keeps its chip, so it can still be removed.',
    basis:
      'B4-02 f8 “Mobile 375”; v46 `.xr-toolbar > .xr-filter-2{display:none}` (as IA-06’s Group filter)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.format-columns': {
    screen: 'FA-04',
    state: 'The “Formats your institution has” chips and the Completed columns',
    words: null,
    rule: 'One “Completed (<format>)” column per format any listed experiment’s institution plan holds, in the order WEB · AR · VR · MR, each the Students who completed that format — never one figure across formats. The Format filter offers the same formats.',
    basis:
      'B4-02 f2 “Completed (WEB)”, “Completed (VR)” (“one column per format, never summed”); `TeachingExperiment.perFormatCounts`',
    status: 'provisional',
    decisions: ['VD-12', 'BC4'],
  },
  'FA-04.completed-not-held': {
    screen: 'FA-04',
    state: 'A Completed column for a format the experiment’s plan does not hold',
    words: 'Not held',
    basis: 'B4-02 f2 draws one experiment holding both formats',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.assessment-draft': {
    screen: 'FA-04',
    state: 'The Assessment column for an assessment that is not Ready',
    words: null,
    rule: 'The wait chip “Draft — not ready” (the readiness words of B4-04 / B4-05); a Ready one the ok chip “Ready” as drawn.',
    basis: 'B4-02 f2 “Ready”; B4-04 f10, B4-05 f1 “Draft — not ready”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.assessment-none': {
    screen: 'FA-04',
    state:
      'The Assessment column (and FA-03’s Assessment line) for an experiment with no assessment',
    words: 'No assessment yet',
    basis: 'B4-04 f1 step 1 “No assessment yet”; B4-02 draws only a Ready assessment',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.count': {
    screen: 'FA-04',
    state: 'The count while the experiments load or failed to load',
    words: null,
    rule: '“<n> experiment(s)” counts the rows shown once the experiments are read; while they load or after a failure the status region stays mounted and empty (f4 and f5 draw the sample count).',
    basis: 'B4-02 f2 … f5 `span.xr-meta[role=status]`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-04.none': {
    screen: 'FA-04',
    state: 'Courses are mapped but none of their experiments is taught (no experiment to list)',
    words: 'No experiments to show yet.',
    rule: 'Shown in place of the table, in the f3 line’s place; no “Clear filters” while nothing is applied.',
    basis: 'B4-02 f3 “No experiment matches.” (the line’s pattern); no frame draws it',
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
      'B4-02 f4 “Loading your experiments” (the Faculty boards’ loading formula); B4-02 draws no loading frame for FA-03',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.failed': {
    screen: 'FA-03',
    state: 'The course failed to load (service unavailable)',
    words: 'We couldn’t load this course',
    rule: 'Drawn as B4-02 f5 (failed icon, this title, “Nothing has changed. Try again.”, a primary “Try again”), below the back link to My courses.',
    basis: 'B4-02 f5 “We couldn’t load your experiments”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.assessment-line': {
    screen: 'FA-03',
    state: 'The Assessment line of an experiment whose assessment is Ready',
    words: null,
    rule: '“<name> · due <date, time> · <n> of <m> submitted · <k> waiting for marking”: <m> the Students it reaches, <n> those who submitted, <k> the submissions with a written answer waiting for marking — left out while none waits (as the assessment header).',
    basis:
      'B4-02 f1 “Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · 1 of 5 submitted · 1 waiting for marking”; FA-08 header facts',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.assessment-draft': {
    screen: 'FA-03',
    state: 'An experiment whose assessment is not Ready',
    words: 'Students can’t see it.',
    rule: 'The chip “Draft — not ready” (wait) in place of “Assessment ready”; the line reads “<name> · due <date> · Students can’t see it.” (the deadline only when set; an unnamed draft by its reference).',
    basis: 'B4-03 “Assessment in draft” row: “Draft — not ready … Students can’t see it.”',
    status: 'provisional',
    decisions: ['VD-12', 'T-18'],
  },
  'FA-03.assessment-none': {
    screen: 'FA-03',
    state: 'An experiment with no assessment',
    words: null,
    rule: 'No chip; the Assessment line reads “No assessment yet” (`FA-04.assessment-none`). Creating one is FA-05’s or Assessments’ own step.',
    basis: 'B4-02 f1 draws only a Ready assessment; B4-03 “No assessment yet → Create assessment”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.counts': {
    screen: 'FA-03',
    state: 'The per-format activity rows',
    words: null,
    rule: 'One row per format the institution’s plan holds, in the order WEB · AR · VR · MR: “<n> completed · <n> in progress · <n> not started” of the Students the experiment reaches, zeros included — never one figure across formats.',
    basis: 'B4-02 f1 `ul.xa-counts` “Student activity by format”; `perFormatCounts`',
    status: 'provisional',
    decisions: ['VD-12', 'BC4'],
  },
  'FA-03.no-experiments': {
    screen: 'FA-03',
    state: 'A course of the Faculty member’s with no taught experiment left to list',
    words: 'No experiment of this course is in your institution’s access now.',
    basis: 'B4-02 f1 “Only experiments your institution holds”; no frame draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-03.not-rendered': {
    screen: 'FA-03',
    state: '“Students on this experiment”',
    words: null,
    rule: 'Since Phase 4B each experiment card shows “Students on this experiment” (FA-20 for that experiment) after “Open experiment”.',
    basis: 'B4-02 f1 `a.xr-btn--text` → B4-10',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
