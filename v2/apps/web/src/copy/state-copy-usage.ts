import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 3's IA-20 Usage — in the V3 design since the owner-approved
 * Institute Admin export (IA-v1, `Main.dc.html` IA-20 and `vm20`) — part of the one register
 * (`state-copy.ts`, VD-12): every state string or rule the screen shows that the export does not
 * draw word for word. The figures themselves are the service's (`OperationsService.getUsage`, P3-04
 * provisional): never added up across formats or experiments, no feedback column, no export, no
 * licence figure (D7 / T-06).
 */
export const STATE_COPY_USAGE = {
  'IA-20.loading': {
    screen: 'IA-20',
    state: 'The figures loading (screen readers)',
    words: 'Loading usage',
    rule: 'The kit’s loading rows in a busy surface, announced politely; the line under the title reads “How your content is being used” without a date until the figures arrive.',
    basis:
      'IA-v1 IA-02 “Loading content access…” (the Institute Admin’s list pattern); IA-20 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.failed': {
    screen: 'IA-20',
    state: 'The figures (or the course and plan facts they are shown with) failed to load',
    words: 'We couldn’t load usage',
    rule: 'The kit’s failed state with “Nothing has changed. Try again.” and “Try again”, which reads both again and moves focus to the title.',
    basis: 'IA-v1 IA-02 “We couldn’t load content access”; IA-20 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.no-activity': {
    screen: 'IA-20',
    state: 'When “No activity yet” shows',
    words: null,
    rule: 'Per experiment: an experiment none of whose figures is above zero (a check of each figure, never a sum) shows “No activity yet” with “Open Student access” in its own surface; the view switch and “What the figures mean” stay. While no experiment has activity, the line under the title has no “figures up to” date and every course’s sessions read “No activity yet”.',
    basis: 'IA-v1 `vm20` (`hasActivity`, `any`) and st-ia20-empty',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.students-one': {
    screen: 'IA-20',
    state: 'An experiment one student can open today',
    words: null,
    rule: '“1 student with access”; any other count “<n> students with access” — the count the service gives, never a licence figure.',
    basis: "IA-v1 `vm20` `withText` (`plural(n, 'student') + ' with access'`)",
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.plans-several': {
    screen: 'IA-20',
    state: 'The line under an experiment’s name',
    words: null,
    rule: 'The course’s platform code alone (“ME ZG523”), however many plans hold the experiment: the export’s “· access plan ACC-0107” is a reference and is left out (`IA-plan.no-reference`). A course with no platform code: no line.',
    basis: 'IA-v1 `vm20` (`line`); the owner’s identifier rule',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.several-experiments': {
    screen: 'IA-20',
    state: 'The institution holds more than one experiment (by experiment and format)',
    words: null,
    rule: 'One surface per experiment, in the order the service lists them; each format in WEB · AR · VR · MR order.',
    basis: 'IA-v1 `vm20` (`exps`: one surface per experiment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.experiments-given': {
    screen: 'IA-20',
    state: 'The “Experiments given” figure (by course)',
    words: null,
    rule: 'How many of the course’s experiments the usage read lists for the institution — a count of experiments, never of licences or students.',
    basis: 'IA-v1 `vm20` `given`; the export does not define it',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.course-several': {
    screen: 'IA-20',
    state: 'A course holding more than one experiment (by course)',
    words: 'Shown per experiment',
    rule: 'Its students with access and its sessions are not added up across experiments (a student given two experiments would count twice); the cells say so and the figures stay in the view by experiment and format.',
    basis:
      'IA-v1 `vm20` draws one course with one experiment; the caption “Started and completed stay per format and are not added up.”',
    status: 'provisional',
    decisions: ['VD-12', 'P3-04'],
  },
  'IA-20.course-sessions-formats': {
    screen: 'IA-20',
    state: 'The by-course sessions cell',
    words: null,
    rule: '“Sessions by format”: the course’s one experiment’s sessions per format, “WEB 11 · VR 4”, in WEB · AR · VR · MR order, one figure per format, never a total.',
    basis: "IA-v1 `vm20` `sessions` (`f + ' ' + v.sessions` joined with “ · ”)",
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.course-format-not-held': {
    screen: 'IA-20',
    state: 'A course that holds none of a format other courses hold',
    words: null,
    rule: 'Its sessions cell names only the formats the course holds (“WEB 3”).',
    basis: 'IA-v1 `vm20` `sessions` (the course’s own formats only)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.view-address': {
    screen: 'IA-20',
    state: 'The view in the address',
    words: null,
    rule: '`?view=course` is the view by course; the view by experiment and format is the bare `/institute/usage`. Any other `view` shows the view by experiment and format and the address becomes the bare one (replaced, no history entry). Switching the view replaces the address the same way.',
    basis: 'IA-v1 `vm20` (`setExp`, `setCourse`); Appendix A register `?view=course` PROPOSED',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.paused': {
    screen: 'IA-20',
    state: 'The Institute Admin of a paused institution',
    words: null,
    rule: 'The page reads as drawn under the shell’s paused banner, with the export’s paused notice (from the session’s pause fact): nobody counts as having access today, earlier activity stays. It has no action of its own to hide (“Open Student access” opens a page that is read-only while paused).',
    basis: 'IA-v1 `vm20` `statePaused` and st-ia20-paused; B7-04 pause effects',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.ended': {
    screen: 'IA-20',
    state: 'Every plan of the institution has ended',
    words: null,
    rule: 'The ended notice names the newest plan’s end date (“Your access plan ended on 7 Oct 2027”, from Content access’s plan standings), not its reference; the figures stay.',
    basis: 'IA-v1 `vm20` `stateEnded`; `IA-plan.no-reference`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-20.no-plan': {
    screen: 'IA-20',
    state: 'Before access is active (no plan)',
    words: null,
    rule: '“No usage yet” with the export’s line and “View request status”, which opens the request the institution was created from (read from `getMyOverview` in this state only). Not reachable in the sample world (INST-04).',
    basis: 'IA-v1 `vm20` `noPlan`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
