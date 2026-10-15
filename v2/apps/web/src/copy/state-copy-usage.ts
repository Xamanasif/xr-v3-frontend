import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 3's IA-20 Usage (B3-10) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule the screen shows that B3-10 does not draw word for word. The figures
 * themselves are the service's (`OperationsService.getUsage`, P3-04 provisional): never added up
 * across formats or experiments, no feedback column, no export, no licence figure (D7 / T-06).
 */
export const STATE_COPY_USAGE = {
  'IA-20.loading': {
    screen: 'IA-20',
    state: 'The figures loading (screen readers)',
    words: 'Loading usage',
    rule: 'Skeleton rows in a table surface, announced politely; the meta line reads “How your content is being used” without a date until the figures arrive.',
    basis: 'B2-02 f8 “Loading” (the Institute Admin’s list pattern); B3-10 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.failed': {
    screen: 'IA-20',
    state: 'The figures (or the course and plan facts they are shown with) failed to load',
    words: 'We couldn’t load usage',
    rule: 'With B2-02 f9’s line “Nothing has changed. Try again.” and its primary “Try again”, which reads both again.',
    basis: 'B2-02 f9 “We couldn’t load content access”; B3-10 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.no-activity': {
    screen: 'IA-20',
    state: 'When “No activity yet” shows (f2)',
    words: null,
    rule: 'No usage row has any student started, any completion or any session in any format (a check of each figure, never a sum), or the institution holds no experiment. The view switch and “What the figures mean” are not shown, as f2 draws; the meta line keeps its date.',
    basis:
      'B3-10 f2 “No activity yet · 9 Oct” and its script (`none` hides the view switch and the definitions); the words are drawn',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.students-one': {
    screen: 'IA-20',
    state: 'An experiment one student can open today',
    words: 'student with access',
    rule: '“1 student with access”; any other count “<n> students with access”.',
    basis: 'B3-10 f0 “5 students with access”; the singular is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.plans-several': {
    screen: 'IA-20',
    state: 'An experiment held by more than one access plan',
    words: null,
    rule: '“access plans ACC-0107 · ACC-0212”: every plan that holds it, in the order Content access lists them.',
    basis: 'B3-10 f0 “ME ZG523 · access plan ACC-0107” (one plan)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.several-experiments': {
    screen: 'IA-20',
    state: 'The institution holds more than one experiment (by experiment and format)',
    words: null,
    rule: 'One section per experiment, in the order the service lists them, 24 px apart; each format in WEB · AR · VR · MR order.',
    basis: 'B3-10 f0 draws one experiment section and a 24 px gap before the definitions',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.experiments-given': {
    screen: 'IA-20',
    state: 'The “Experiments given” figure (by course)',
    words: null,
    rule: 'How many of the course’s experiments the usage read lists for the institution — a count of experiments, never of licences or students.',
    basis: 'B3-10 f1 “Experiments given 1”; the board does not define it',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.course-several': {
    screen: 'IA-20',
    state: 'A course holding more than one experiment (by course)',
    words: 'Shown per experiment',
    rule: 'Its students with access and its sessions are not added up across experiments (a student given two experiments would count twice); the cells say so and the figures stay in the view by experiment and format.',
    basis:
      'B3-10 f1 draws one course with one experiment (“Started / completed stay per format — never summed into a course verdict”)',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.course-sessions-formats': {
    screen: 'IA-20',
    state: 'The by-course sessions column’s formats',
    words: null,
    rule: '“Sessions (WEB · VR)” names the formats of the institution’s usage rows in WEB · AR · VR · MR order; each course’s cell gives its sessions per format in that order, one figure per format, never a total.',
    basis: 'B3-10 f1 “Sessions (WEB · VR)” and “11 · 4”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.course-format-not-held': {
    screen: 'IA-20',
    state: 'A course that holds none of a format the by-course sessions column names',
    words: '–',
    basis: 'B3-10 f1 draws one course holding both formats of the column',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.view-address': {
    screen: 'IA-20',
    state: 'The view in the address',
    words: null,
    rule: '`?view=course` is the view by course; the view by experiment and format is the bare `/institute/usage`. Any other `view` shows the view by experiment and format and the address becomes the bare one (replaced, no history entry). Switching the view replaces the address the same way.',
    basis: 'B3-10 f0, f1 (`u.setExp`, `u.setCrs`); Appendix A register `?view=course` PROPOSED',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.paused': {
    screen: 'IA-20',
    state: 'The Institute Admin of a paused institution',
    words: null,
    rule: 'The page reads as drawn under the shell’s paused banner: it has no action of its own to hide (“Open Student access” opens a page that is read-only while paused).',
    basis: 'B7-04 pause effects (the Institute Admin keeps reading); B3-10 draws no paused frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
