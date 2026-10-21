/**
 * The words of IA-20 Usage in the owner-approved V3 design (design/v3-refined-b/roles/IA-v1,
 * `project/Main.dc.html` IA-20 and its script's `vm20`), written from the facts
 * `OperationsService.getUsage` answers (per experiment × format: students with access, started,
 * completed, sessions; the "figures up to" instant) and the course and plan facts of
 * `listContentAccess`. Every phrase is the export's own (`usage.test.ts` finds it); what the export
 * does not word is a provisional entry of the state-copy register (`state-copy-usage.ts`, VD-12).
 * The export's sample counts, course and dates are never copied: they come from the records. No
 * internal reference (ACC-, REQ-) is written (state-copy `IA-plan.no-reference`).
 */
import { REQUEST_APPROVED } from './institute-home';

export const USAGE_PAGE = {
  /** The H1, the tab title. */
  title: 'Usage',
  /** The view switch's group name (`div.rb-switch[aria-label]`). */
  viewLabel: 'View usage',
  byExperiment: 'By experiment and format',
  byCourse: 'By course',
} as const;

/** The line under the title: "How your content is being used · figures up to 22 Oct 2026". */
export const USAGE_META = 'How your content is being used';

/** The line with the service's "figures up to" date ("22 Oct 2026", `copy/dates`). */
export function usageMetaLine(figuresUpTo: string): string {
  return `${USAGE_META} · figures up to ${figuresUpTo}`;
}

/** An experiment's surface. */
export const EXPERIMENT_SECTION = {
  columns: {
    format: 'Format',
    started: 'Started',
    completed: 'Completed',
    sessions: 'Sessions',
  },
} as const;

/** "5 students with access", "1 student with access" (the export's `withText`). */
export function studentsWithAccessWords(count: number): string {
  return `${count} ${count === 1 ? 'student' : 'students'} with access`;
}

/** The figures table's name: "Usage by format for Shell-and-Tube Heat Exchanger". */
export function experimentTableCaption(name: string): string {
  return `Usage by format for ${name}`;
}

/** "By course". */
export const COURSE_TABLE = {
  /** The surface's heading, read only (`h2.xr-sr`). */
  title: 'Usage by course',
  caption: 'Usage by course. Started and completed stay per format and are not added up.',
  columns: {
    course: 'Course',
    experimentsGiven: 'Experiments given',
    studentsWithAccess: 'Students with access',
    sessions: 'Sessions by format',
  },
  /**
   * PROVISIONAL (`IA-20.course-several`): a course holding more than one experiment — its students
   * with access and sessions are not added up across experiments; they are read by experiment.
   */
  perExperiment: 'Shown per experiment',
} as const;

/** "WEB 11 · VR 4": a course's sessions per format, never added up (the export's `sessions`). */
export function sessionsByFormat(
  parts: readonly { readonly code: string; readonly sessions: number }[],
): string {
  return parts.map((part) => `${part.code} ${part.sessions}`).join(' · ');
}

/** "What the figures mean": each figure defined in one line. */
export const DEFINITIONS = {
  title: 'What the figures mean',
  terms: [
    {
      term: 'Students with access',
      definition:
        'Students who can open the experiment today. Each student counts once, however they were given it.',
    },
    {
      term: 'Started',
      definition: 'Students who have opened this format at least once.',
    },
    {
      term: 'Completed',
      definition: 'Students whose format was reported completed by the simulation or the headset.',
    },
    {
      term: 'Sessions',
      definition:
        'Times the format was opened in the browser (WEB) or a session was reported from a headset (VR).',
    },
  ],
} as const;

/** "No activity yet" (an experiment no student has opened; by course, the whole sessions cell). */
export const NO_ACTIVITY = {
  title: 'No activity yet',
  line: 'Figures appear when students open the experiments you’ve given them.',
  openStudentAccess: 'Open Student access',
} as const;

/** Before access is active: "No usage yet". */
export const NO_USAGE = {
  title: 'No usage yet',
  line: `Usage appears after BITS activates your access and you give students experiments. ${REQUEST_APPROVED}`,
} as const;

/** The notices that explain why nobody counts as having access today. */
export const USAGE_NOTICES = {
  pausedTitle: 'Your institution’s access is paused',
  pausedLine:
    'No student can open your experiments while the pause lasts, so nobody counts as having access today. Earlier activity stays in the figures.',
  endedLine:
    'No student can open its experiments now, so nobody counts as having access today. Earlier activity stays in the figures.',
} as const;

/** "Your access plan ended on 7 Oct 2027" (the ended notice). */
export function endedNoticeTitle(endedOn: string): string {
  return `Your access plan ended on ${endedOn}`;
}
